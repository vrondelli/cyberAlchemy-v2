"""Process authenticated sandbox inbox events; never trust browser payment claims."""
import hashlib
import json
import time

from ledger import Rejected, identity
from provider_bindings import ProviderBindings


class StripeProcessor:
    def __init__(self, ledger, api, *, merchant_account, clock=None):
        self.ledger, self.api, self.account = ledger, api, identity(merchant_account)
        self.clock = clock or (lambda: int(time.time()))
        self.bindings = ProviderBindings(ledger, provider='stripe', merchant_account=merchant_account,
                                        environment='sandbox')
        with ledger.connection() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS stripe_processing (
                  merchant_account TEXT NOT NULL, event_id TEXT NOT NULL,
                  status TEXT NOT NULL, reason TEXT NOT NULL,
                  PRIMARY KEY(merchant_account,event_id));
                CREATE TABLE IF NOT EXISTS stripe_confirmations (
                  merchant_account TEXT NOT NULL, payment_id TEXT NOT NULL,
                  order_id TEXT NOT NULL, confirmed_at INTEGER NOT NULL,
                  PRIMARY KEY(merchant_account,payment_id));
            ''')

    def _finish(self, event_id, status, reason=''):
        with self.ledger.transaction() as db:
            db.execute('''INSERT INTO stripe_processing VALUES (?,?,?,?)
                ON CONFLICT(merchant_account,event_id) DO UPDATE SET
                status=excluded.status,reason=excluded.reason
                WHERE stripe_processing.status NOT IN ('paid','paid-review')''',
                (self.account, event_id, status, reason))
            row = db.execute('SELECT status,reason FROM stripe_processing WHERE merchant_account=? AND event_id=?',
                             (self.account, event_id)).fetchone()
            return dict(row)

    def process(self, event_id):
        identity(event_id)
        now = self.clock()
        if type(now) is not int or now < 0:
            raise Rejected('time-invalid')
        with self.ledger.connection() as db:
            row = db.execute('SELECT * FROM stripe_inbox WHERE merchant_account=? AND live=0 AND event_id=?',
                             (self.account, event_id)).fetchone()
        if not row:
            raise Rejected('stripe-inbox-event-missing')
        if hashlib.sha256(row['payload'].encode()).hexdigest() != row['payload_digest']:
            raise Rejected('stripe-inbox-corrupt')
        event = json.loads(row['payload'])
        if event.get('type') not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded'):
            return self._finish(event_id, 'review', 'unsupported-event-type')
        snapshot = event['data']['object']
        if snapshot.get('payment_status') != 'paid':
            return self._finish(event_id, 'awaiting-payment')
        try:
            session_id = identity(snapshot.get('id'))
            if type(event.get('created')) is not int or not 0 <= event['created'] <= now:
                raise Rejected('stripe-event-time')
            with self.ledger.connection() as db:
                order = db.execute('''SELECT o.* FROM provider_sessions s JOIN orders o ON o.id=s.order_id
                    WHERE s.provider='stripe' AND s.merchant_account=? AND s.environment='sandbox' AND s.session_id=?''',
                    (self.account, session_id)).fetchone()
            if not order:
                return self._finish(event_id, 'awaiting-binding')
            if event['created'] < order['created_at']:
                raise Rejected('stripe-event-predates-order')
            if self.api.account() != self.account:
                raise Rejected('stripe-account-mismatch')
            session = self.api.session(session_id)
            expected = {'id': session_id, 'object': 'checkout.session', 'mode': 'payment',
                        'livemode': False, 'status': 'complete', 'payment_status': 'paid',
                        'currency': 'usd', 'client_reference_id': order['id'],
                        'amount_subtotal': order['amount'], 'amount_total': order['amount']}
            self._check(session, expected, 'stripe-session-mismatch')
            metadata = session.get('metadata')
            if not isinstance(metadata, dict) or metadata.get('release_digest') != order['release_digest']:
                raise Rejected('stripe-release-mismatch')
            payment_id = identity(session.get('payment_intent'))
            if snapshot.get('payment_intent') != payment_id:
                raise Rejected('stripe-event-payment-mismatch')
            payment = self.api.payment(payment_id)
            self._check(payment, {'id': payment_id, 'object': 'payment_intent', 'livemode': False,
                'status': 'succeeded', 'currency': 'usd', 'amount': order['amount'],
                'amount_received': order['amount']}, 'stripe-payment-mismatch')
            charge = payment.get('latest_charge')
            self._check(charge, {'object': 'charge', 'livemode': False, 'paid': True,
                'captured': True, 'refunded': False, 'disputed': False, 'amount_refunded': 0,
                'amount': order['amount'], 'currency': 'usd', 'payment_intent': payment_id},
                'stripe-charge-not-fulfillable')
            # First processed, authenticated successful event fixes an observation
            # timestamp for this payment, independent of later events or retries.
            # This is not a bank settlement timestamp.
            with self.ledger.transaction() as db:
                db.execute('INSERT OR IGNORE INTO stripe_confirmations VALUES (?,?,?,?)',
                           (self.account, payment_id, order['id'], event['created']))
                confirmation = db.execute('SELECT * FROM stripe_confirmations WHERE merchant_account=? AND payment_id=?',
                                          (self.account, payment_id)).fetchone()
                if confirmation['order_id'] != order['id']:
                    raise Rejected('stripe-payment-reused')
            result = self.bindings.record_verified_payment({
                'session_id': session_id, 'event_id': event_id, 'payment_id': payment_id,
                'amount_cents': order['amount'], 'currency': 'USD',
                'paid_at': confirmation['confirmed_at'],
            }, now=now)
            return self._finish(event_id, result['status'])
        except Rejected as error:
            return self._finish(event_id, 'review', str(error))
        # Provider/network and storage exceptions propagate. The inbox remains
        # durable and this event is retryable; no acknowledgement deletes it.

    @staticmethod
    def _check(actual, expected, reason):
        if not isinstance(actual, dict) or any(type(actual.get(k)) is not type(v) or actual.get(k) != v
                                              for k, v in expected.items()):
            raise Rejected(reason)
