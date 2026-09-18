import concurrent.futures
from pathlib import Path
import tempfile
import unittest

from ledger import Ledger, Rejected
from provider_bindings import ProviderBindings


class ProviderBindingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.ledger = Ledger(Path(self.tmp.name) / 'ledger.db', reservation_seconds=900)
        self.stripe = self.adapter('stripe')

    def adapter(self, provider, account='merchant-a', environment='sandbox'):
        return ProviderBindings(self.ledger, provider=provider,
                                merchant_account=account, environment=environment)

    def order(self, customer):
        return self.ledger.create_order(customer, 'checkout', {
            'productId': 'agent-reasoning-engine', 'offerId': 'release',
            'amountCents': 20000, 'currency': 'USD', 'quantity': 1,
        }, 'a' * 64, now=100)

    def receipt(self, **changes):
        return dict(session_id='session', event_id='event', payment_id='payment',
                    amount_cents=20000, currency='USD', paid_at=110, **changes)

    def bind(self, adapter, customer):
        order = self.order(customer)
        adapter.bind('session', order['id'], customer=customer, now=101)
        return order

    def test_restart_and_concurrent_duplicate_delivery(self):
        order = self.bind(self.stripe, 'alice')
        restarted = self.adapter('stripe')
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: restarted.record_verified_payment(
                self.receipt(), now=111), range(16)))
        self.assertTrue(all(r['status'] == 'paid' for r in results))
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0], 1)
        self.assertTrue(self.ledger.entitlement('alice', order['id'], now=112)['download_allowed'])

    def test_identical_ids_are_isolated_by_provider_account_and_environment(self):
        scopes = [self.stripe, self.adapter('paypal'), self.adapter('stripe', 'merchant-b'),
                  self.adapter('stripe', environment='live')]
        payments = []
        for i, adapter in enumerate(scopes):
            self.bind(adapter, f'buyer-{i}')
            payments.append(adapter.record_verified_payment(self.receipt(), now=111)['payment_id'])
        self.assertEqual(len(set(payments)), 4)

    def test_binding_cannot_be_stolen_or_reassigned(self):
        alice = self.bind(self.stripe, 'alice')
        bob = self.order('bob')
        with self.assertRaisesRegex(Rejected, 'not-owned'):
            self.stripe.bind('new-session', alice['id'], customer='bob', now=102)
        with self.assertRaisesRegex(Rejected, 'conflict'):
            self.stripe.bind('session', bob['id'], customer='bob', now=102)
        result = self.stripe.record_verified_payment(self.receipt(), now=111)
        self.assertEqual(result['id'], alice['id'])
        with self.assertRaises(Rejected):
            self.ledger.entitlement('bob', bob['id'], now=112)

    def test_unbound_or_mismatched_receipts_do_not_grant_access(self):
        order = self.bind(self.stripe, 'alice')
        receipts = [dict(self.receipt(), session_id='unknown'),
                    dict(self.receipt(), customer='bob'),
                    dict(self.receipt(), amount_cents=20001),
                    dict(self.receipt(), currency='BRL'),
                    dict(self.receipt(), paid_at=True)]
        for receipt in receipts:
            with self.subTest(receipt=receipt), self.assertRaises(Rejected):
                self.stripe.record_verified_payment(receipt, now=111)
        with self.assertRaises(Rejected):
            self.ledger.entitlement('alice', order['id'], now=112)
        with self.assertRaisesRegex(Rejected, 'unbound'):
            self.adapter('paypal').record_verified_payment(self.receipt(), now=111)

    def test_competing_providers_cannot_replace_winning_payment(self):
        order = self.bind(self.stripe, 'alice')
        paypal = self.adapter('paypal')
        paypal.bind('session', order['id'], customer='alice', now=101)
        winner = self.stripe.record_verified_payment(self.receipt(), now=111)
        with self.assertRaisesRegex(Rejected, 'order-already-paid'):
            paypal.record_verified_payment(self.receipt(), now=111)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT payment_id FROM orders WHERE id=?',
                                       (order['id'],)).fetchone()[0], winner['payment_id'])

    def test_expiry_and_changed_replay(self):
        order = self.bind(self.stripe, 'alice')
        with self.assertRaisesRegex(Rejected, 'not-pending'):
            self.stripe.bind('late-session', order['id'], customer='alice', now=1000)
        result = self.stripe.record_verified_payment(self.receipt(), now=1001)
        self.assertEqual(result['status'], 'paid-review')
        with self.assertRaisesRegex(Rejected, 'event-identity-conflict'):
            self.stripe.record_verified_payment(dict(self.receipt(), amount_cents=21000), now=1002)
        with self.assertRaises(Rejected):
            self.ledger.entitlement('alice', order['id'], now=1002)


if __name__ == '__main__':
    unittest.main()
