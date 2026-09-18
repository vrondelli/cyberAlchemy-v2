import copy
import hashlib
import hmac
import json
from pathlib import Path
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor

from delivery import Artifact, Delivery
from ledger import Ledger, Rejected
from stripe_checkout import StripeCheckout
from stripe_processor import StripeProcessor
from stripe_webhook import StripeInbox
from test_stripe_checkout import FakeStripe


class StripeProcessorTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(); self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name); self.now = int(time.time())
        self.data = b'fixture release bytes'; (self.root / 'release').write_bytes(self.data)
        digest = hashlib.sha256(self.data).hexdigest()
        self.ledger = Ledger(self.root / 'db', reservation_seconds=3600)
        self.order = self.ledger.create_order('alice', 'key', {'productId': 'agent-reasoning-engine',
            'offerId': 'release', 'amountCents': 20000, 'currency': 'USD', 'quantity': 1}, digest, now=self.now-10)
        self.api = FakeStripe()
        self.checkout = StripeCheckout(self.ledger, self.api, merchant_account='acct_fixture',
            success_url='https://keld.example/ok', cancel_url='https://keld.example/cancel', clock=lambda:self.now)
        self.checkout.create(self.order['id'], customer='alice')
        self.session = copy.deepcopy(next(iter(self.api.sessions.values())))
        self.session.update(status='complete', payment_status='paid', payment_intent='pi_fixture')
        self.payment = {'id':'pi_fixture', 'object':'payment_intent', 'livemode':False,
            'status':'succeeded', 'currency':'usd', 'amount':20000, 'amount_received':20000,
            'latest_charge':{'object':'charge', 'livemode':False, 'paid':True, 'captured':True,
                'refunded':False, 'disputed':False, 'amount_refunded':0, 'amount':20000,
                'currency':'usd', 'payment_intent':'pi_fixture'}}
        self.api.session = lambda _:copy.deepcopy(self.session)
        self.api.payment = lambda _:copy.deepcopy(self.payment)
        self.secret='whsec_fixture_only'
        self.inbox=StripeInbox(self.ledger, merchant_account='acct_fixture', environment='sandbox', endpoint_secret=self.secret)
        self.processor=self.open()
        self.delivery=Delivery(self.ledger, self.root, [Artifact(digest,len(self.data),'release')], mode='local-test')

    def open(self):
        return StripeProcessor(self.ledger,self.api,merchant_account='acct_fixture',clock=lambda:self.now)

    def event(self, event_id='evt_fixture', **changes):
        event={'id':event_id,'object':'event','livemode':False,'type':'checkout.session.completed',
               'created':self.now,'data':{'object':copy.deepcopy(self.session)}}
        event.update(changes)
        body=json.dumps(event).encode(); stamp=str(int(time.time()))
        signature=hmac.new(self.secret.encode(),stamp.encode()+b'.'+body,hashlib.sha256).hexdigest()
        self.inbox.receive(body,f't={stamp},v1={signature}')
        return event_id

    def test_checkout_signed_event_verified_payment_to_protected_bytes(self):
        with self.assertRaises(Rejected):self.delivery.issue('alice',self.order['id'],now=self.now)
        event_id=self.event()
        self.assertEqual(self.processor.process(event_id)['status'],'paid')
        grant=self.delivery.issue('alice',self.order['id'],now=self.now)
        with self.assertRaises(Rejected):self.delivery.redeem('bob',grant['token'],now=self.now)
        self.assertEqual(self.delivery.redeem('alice',grant['token'],now=self.now),self.data)
        with self.assertRaises(Rejected):self.delivery.redeem('alice',grant['token'],now=self.now)

    def test_concurrent_events_and_restart_preserve_one_payment_timestamp(self):
        a=self.event('evt_a',created=self.now-1); b=self.event('evt_b')
        with ThreadPoolExecutor(max_workers=8) as pool:
            results=list(pool.map(self.processor.process,[a,b]*6))
        self.assertTrue(all(r['status']=='paid' for r in results))
        self.assertEqual(self.open().process(a)['status'],'paid')
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM stripe_confirmations').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0],2)

    def test_unpaid_completion_requires_later_paid_event(self):
        unpaid=copy.deepcopy(self.session);unpaid['payment_status']='unpaid'
        event_id=self.event(data={'object':unpaid})
        self.assertEqual(self.processor.process(event_id)['status'],'awaiting-payment')
        with self.assertRaises(Rejected):self.delivery.issue('alice',self.order['id'],now=self.now)
        success=self.event('evt_success',type='checkout.session.async_payment_succeeded')
        self.assertEqual(self.processor.process(success)['status'],'paid')

    def test_provider_timeout_keeps_event_retryable(self):
        event_id=self.event();original=self.api.payment
        def fail(_):raise TimeoutError('fixture')
        self.api.payment=fail
        with self.assertRaises(TimeoutError):self.processor.process(event_id)
        with self.assertRaises(Rejected):self.delivery.issue('alice',self.order['id'],now=self.now)
        self.api.payment=original
        self.assertEqual(self.open().process(event_id)['status'],'paid')

    def test_mismatches_and_refunded_charge_require_review(self):
        for i, mutate in enumerate([
            lambda:self.session.update(amount_total=20001),
            lambda:self.payment.update(amount_received=19999),
            lambda:self.payment['latest_charge'].update(refunded=True),
            lambda:self.payment['latest_charge'].update(captured=False),
            lambda:self.payment.update(livemode=True)]):
            old_s,old_p=copy.deepcopy(self.session),copy.deepcopy(self.payment)
            event_id=self.event(f'evt_{i}');mutate()
            self.assertEqual(self.processor.process(event_id)['status'],'review')
            with self.assertRaises(Rejected):self.delivery.issue('alice',self.order['id'],now=self.now)
            self.session,self.payment=old_s,old_p

    def test_unbound_and_unsupported_events_retained(self):
        event_id=self.event()
        with self.ledger.transaction() as db:db.execute('DELETE FROM provider_sessions')
        self.assertEqual(self.processor.process(event_id)['status'],'awaiting-binding')
        self.checkout.bindings.bind(self.session['id'],self.order['id'],customer='alice',now=self.now)
        self.assertEqual(self.processor.process(event_id)['status'],'paid')
        refund=self.event('evt_refund',type='charge.refunded')
        self.assertEqual(self.processor.process(refund),{'status':'review','reason':'unsupported-event-type'})

    def test_late_callback_stays_paid_review_without_download(self):
        event_id=self.event();self.now=self.order['expires_at']+1
        self.assertEqual(self.processor.process(event_id)['status'],'paid-review')
        with self.assertRaises(Rejected):self.delivery.issue('alice',self.order['id'],now=self.now)

    def test_crash_after_payment_before_outcome_is_recoverable(self):
        event_id=self.event();original=self.processor._finish
        def crash(*args):raise RuntimeError('simulated process loss')
        self.processor._finish=crash
        with self.assertRaises(RuntimeError):self.processor.process(event_id)
        self.assertEqual(self.open().process(event_id)['status'],'paid')
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0],1)


if __name__=='__main__':unittest.main()
