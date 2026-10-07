from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import tempfile
import unittest
from ledger import Ledger, Rejected, calendar_year_after, validate_checkout

PAYLOAD={'productId':'agent-reasoning-engine','offerId':'release','currency':'USD','quantity':1,'amountCents':20000}
DIGEST='a'*64


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.path=Path(self.temp.name)/'orders.sqlite'
        self.ledger=Ledger(self.path,reservation_seconds=900)
    def tearDown(self):self.temp.cleanup()
    def order(self,customer='c1',key='k1',now=100,amount=20000):
        return self.ledger.create_order(customer,key,{**PAYLOAD,'amountCents':amount},DIGEST,now=now)
    def receipt(self,order,**overrides):
        return {'event_id':'event-'+order['id'],'payment_id':'payment-'+order['id'],'order_id':order['id'],'customer':order['customer'],'amount_cents':order['amount'],'currency':'USD','paid_at':order['created_at']+1,**overrides}
    def reversal(self,order,kind='full-refund',**overrides):
        return {'provider':'stripe','event_id':'reversal-'+order['id'],'order_id':order['id'],
                'customer':order['customer'],'payment_id':'payment-'+order['id'],
                'kind':kind,'provider_ref':'re_provider','verified_at':103,**overrides}

    def test_strict_price_payload(self):
        for amount in [5000,100000,12525]:self.assertEqual(validate_checkout({**PAYLOAD,'amountCents':amount}),amount)
        for change in [{'amountCents':4999},{'amountCents':100001},{'amountCents':5000.0},{'amountCents':True},{'amountCents':'5000'},{'quantity':True},{'currency':'EUR'},{'eligible':True}]:
            with self.subTest(change=change),self.assertRaises(Rejected):validate_checkout({**PAYLOAD,**change})

    def test_order_idempotency_and_unpaid_delivery_denial(self):
        order=self.order();self.assertEqual(order['id'],self.order()['id'])
        with self.assertRaisesRegex(Rejected,'idempotency'):self.order(amount=5000)
        with self.assertRaisesRegex(Rejected,'pending'):self.order(key='new-key')
        with self.assertRaises(Rejected):self.ledger.entitlement('c1',order['id'],now=101)

    def test_payment_retries_and_repeat_customer_do_not_reset_benefits(self):
        order=self.order();receipt=self.receipt(order)
        paid=self.ledger.record_verified_payment(receipt,now=102)
        self.assertEqual(paid,self.ledger.record_verified_payment(receipt,now=103))
        self.assertEqual(paid,self.ledger.record_verified_payment({**receipt,'event_id':'another-event'},now=104))
        with self.assertRaisesRegex(Rejected,'event-identity'):self.ledger.record_verified_payment({**receipt,'amount_cents':5000},now=104)
        first=self.ledger.entitlement('c1',order['id'],now=105)
        repeat=self.order(key='second',now=200,amount=5000)
        self.ledger.record_verified_payment(self.receipt(repeat),now=202)
        self.assertEqual(first['benefit_expires_at'],self.ledger.entitlement('c1',repeat['id'],now=203)['benefit_expires_at'])
        with self.assertRaises(Rejected):self.ledger.entitlement('someone-else',order['id'],now=105)
        expires=first['benefit_expires_at']
        self.assertTrue(self.ledger.entitlement('c1',order['id'],now=expires-1)['updates_and_support_active'])
        self.assertFalse(self.ledger.entitlement('c1',order['id'],now=expires)['updates_and_support_active'])
        self.assertTrue(self.ledger.entitlement('c1',order['id'],now=expires)['download_allowed'])
        restarted=Ledger(self.path,reservation_seconds=900)
        self.assertEqual(first,restarted.entitlement('c1',order['id'],now=105))

    def test_mismatched_payments_and_payment_reuse_rejected(self):
        first=self.order();second=self.order('c2')
        for overrides in [{'customer':'c2'},{'amount_cents':5000},{'currency':'EUR'},{'paid_at':99}]:
            with self.subTest(overrides=overrides),self.assertRaises(Rejected):self.ledger.record_verified_payment(self.receipt(first,**overrides),now=102)
        self.ledger.record_verified_payment(self.receipt(first),now=102)
        with self.assertRaisesRegex(Rejected,'payment-reused'):
            self.ledger.record_verified_payment(self.receipt(second,payment_id='payment-'+first['id']),now=102)

    def test_verified_full_refund_revokes_future_access_and_replays_idempotently(self):
        order=self.order();self.ledger.record_verified_payment(self.receipt(order),now=102)
        reversal=self.reversal(order)
        result=self.ledger.record_verified_reversal(reversal,now=104)
        self.assertEqual(result,{'order_id':order['id'],'disposition':'revoked'})
        self.assertEqual(self.ledger.record_verified_reversal(reversal,now=105),result)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.ledger.entitlement('c1',order['id'],now=105)
        repeat=self.order(key='after-refund',now=200)
        self.assertEqual(repeat['benefit'],0)
        self.ledger.record_verified_payment(self.receipt(repeat),now=202)
        self.assertFalse(self.ledger.entitlement('c1',repeat['id'],now=203)['updates_and_support_active'])
        with self.assertRaisesRegex(Rejected,'reversal-identity-conflict'):
            self.ledger.record_verified_reversal({**reversal,'kind':'lost-dispute'},now=105)
        restarted=Ledger(self.path,reservation_seconds=900)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            restarted.entitlement('c1',order['id'],now=106)

    def test_partial_refund_is_review_only_and_lost_dispute_revokes(self):
        order=self.order();self.ledger.record_verified_payment(self.receipt(order),now=102)
        partial=self.reversal(order,'partial-refund')
        self.assertEqual(self.ledger.record_verified_reversal(partial,now=104)['disposition'],'review')
        self.assertTrue(self.ledger.entitlement('c1',order['id'],now=105)['download_allowed'])
        lost=self.reversal(order,'lost-dispute',event_id='lost-'+order['id'],provider_ref='du_provider')
        self.assertEqual(self.ledger.record_verified_reversal(lost,now=106)['disposition'],'revoked')
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.ledger.entitlement('c1',order['id'],now=107)

    def test_reversal_requires_bound_existing_payment_and_owner(self):
        order=self.order();other=self.order('c2')
        candidate=self.reversal(order)
        with self.assertRaisesRegex(Rejected,'reversal-payment-mismatch'):
            self.ledger.record_verified_reversal(candidate,now=104)
        self.ledger.record_verified_payment(self.receipt(order),now=102)
        for changed in ({'customer':'c2'},{'payment_id':'payment-'+other['id']},{'order_id':other['id']}):
            with self.assertRaisesRegex(Rejected,'reversal-payment-mismatch'):
                self.ledger.record_verified_reversal({**candidate,**changed},now=104)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],0)

    def test_reversal_reference_cannot_be_reused_for_another_payment(self):
        first=self.order();second=self.order('c2')
        self.ledger.record_verified_payment(self.receipt(first),now=102)
        self.ledger.record_verified_payment(self.receipt(second),now=102)
        self.ledger.record_verified_reversal(self.reversal(first),now=104)
        with self.assertRaisesRegex(Rejected,'reversal-reference-conflict'):
            self.ledger.record_verified_reversal(self.reversal(second),now=104)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],1)

    def test_concurrent_reservation_cap_is_customers_not_orders(self):
        def reserve(i):return self.order('customer-'+str(i),amount=5000 if i%2 else 100000)
        with ThreadPoolExecutor(max_workers=12) as pool:orders=list(pool.map(reserve,range(108)))
        self.assertEqual(sum(o['benefit'] for o in orders),100)
        with ThreadPoolExecutor(max_workers=12) as pool:
            paid=list(pool.map(lambda o:self.ledger.record_verified_payment(self.receipt(o),now=102),orders))
        self.assertTrue(all(o['status']=='paid' for o in paid))
        self.assertEqual(sum(self.ledger.entitlement(o['customer'],o['id'],now=103)['updates_and_support_active'] for o in orders),100)

    def test_sold_out_buyer_still_has_one_pending_order(self):
        for i in range(100):self.order(f'held-{i}',key=f'held-{i}')
        first=self.order('sold-out',key='first')
        self.assertEqual(first['benefit'],0)
        self.assertEqual(self.order('sold-out',key='first')['id'],first['id'])
        with self.assertRaisesRegex(Rejected,'customer-checkout-pending'):
            self.order('sold-out',key='second')
        with self.ledger.connection() as db:
            self.assertEqual(db.execute("SELECT count(*) FROM orders WHERE customer='sold-out' AND status='pending'").fetchone()[0],1)

    def test_active_buyer_cannot_open_two_pending_repeat_purchases(self):
        original=self.order('repeat',key='paid')
        self.ledger.record_verified_payment(self.receipt(original),now=102)
        repeat=self.order('repeat',key='repeat-one',now=200)
        self.assertEqual(repeat['benefit'],1)
        with self.assertRaisesRegex(Rejected,'customer-checkout-pending'):
            self.order('repeat',key='repeat-two',now=200)

    def test_sold_out_concurrent_keys_reserve_only_one_order(self):
        for i in range(100):self.order(f'held-{i}',key=f'held-{i}')
        def reserve(key):
            try:return self.order('concurrent-sold-out',key=key)['id']
            except Rejected as error:return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes=list(pool.map(reserve,['first','second']))
        self.assertEqual(sum(value=='customer-checkout-pending' for value in outcomes),1)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute("SELECT count(*) FROM orders WHERE customer='concurrent-sold-out' AND status='pending'").fetchone()[0],1)

    def test_expired_reservation_requires_review_and_fresh_order(self):
        order=self.order()
        self.assertEqual(self.order(now=1000)['status'],'expired')
        new=self.order(key='retry-after-expiry',now=1000)
        late=self.ledger.record_verified_payment(self.receipt(order),now=1002)
        self.assertEqual(late['status'],'paid-review')
        with self.ledger.connection() as db:
            self.assertEqual(tuple(db.execute('SELECT payment_id,state FROM late_refund_intents WHERE order_id=?',
                                        (order['id'],)).fetchone()),('payment-'+order['id'],'queued'))
        reversal=self.reversal(order,'full-refund',verified_at=1003)
        self.ledger.record_verified_reversal(reversal,now=1003)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT state FROM late_refund_intents WHERE order_id=?',
                                        (order['id'],)).fetchone()[0],'succeeded')
        with self.assertRaises(Rejected):self.ledger.entitlement('c1',order['id'],now=1003)
        self.assertEqual(self.ledger.record_verified_payment(self.receipt(new),now=1002)['status'],'paid')

    def test_timely_paid_review_does_not_enqueue_automatic_refund(self):
        order=self.order()
        with self.ledger.transaction() as db:
            db.execute('DELETE FROM benefits WHERE customer=?',(order['customer'],))
        paid=self.ledger.record_verified_payment(self.receipt(order),now=102)
        self.assertEqual(paid['status'],'paid-review')
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM late_refund_intents').fetchone()[0],0)

    def test_late_partial_refund_stops_automatic_intent_for_review(self):
        order=self.order()
        self.ledger.record_verified_payment(self.receipt(order),now=1002)
        partial=self.reversal(order,'partial-refund',verified_at=1003)
        self.assertEqual(self.ledger.record_verified_reversal(partial,now=1003)['disposition'],'review')
        with self.ledger.connection() as db:
            self.assertEqual(tuple(db.execute('SELECT state,last_reason FROM late_refund_intents WHERE order_id=?',
                                             (order['id'],)).fetchone()),('review','provider-partial-refund'))

    def test_later_dispute_reopens_completed_refund_intent_for_review(self):
        order=self.order();self.ledger.record_verified_payment(self.receipt(order),now=1002)
        self.ledger.record_verified_reversal(self.reversal(order,verified_at=1003),now=1003)
        dispute=self.reversal(order,'lost-dispute',event_id='dispute-'+order['id'],provider_ref='du_provider',verified_at=1004)
        self.ledger.record_verified_reversal(dispute,now=1004)
        with self.ledger.connection() as db:
            self.assertEqual(tuple(db.execute('SELECT state,last_reason FROM late_refund_intents WHERE order_id=?',
                                             (order['id'],)).fetchone()),('review','provider-lost-dispute'))
        later_full=self.reversal(order,event_id='refund-replayed-'+order['id'],verified_at=1005)
        self.ledger.record_verified_reversal(later_full,now=1005)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT state FROM late_refund_intents WHERE order_id=?',
                                        (order['id'],)).fetchone()[0],'review')

    def test_calendar_year_clamps_leap_day(self):
        start=int(datetime(2024,2,29,12,tzinfo=timezone.utc).timestamp())
        self.assertEqual(datetime.fromtimestamp(calendar_year_after(start),timezone.utc),datetime(2025,2,28,12,tzinfo=timezone.utc))

    def test_concurrent_duplicate_callback_has_one_payment_and_slot(self):
        order=self.order();receipt=self.receipt(order)
        with ThreadPoolExecutor(max_workers=8) as pool:
            results=list(pool.map(lambda _:self.ledger.record_verified_payment(receipt,now=102),range(24)))
        self.assertTrue(all(result==results[0] for result in results))
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0],1)
            self.assertEqual(db.execute("SELECT count(*) FROM benefits WHERE status='active'").fetchone()[0],1)


if __name__=='__main__':unittest.main()
