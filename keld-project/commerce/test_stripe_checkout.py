import copy
import concurrent.futures
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

from ledger import Ledger, Rejected
from stripe_checkout import StripeCheckout, StripeSandboxAPI


class FakeStripe:
    def __init__(self):
        self.requests = []; self.sessions = {}; self.lock = threading.Lock()
        self.timeout_once = False; self.mutate = lambda s: s

    def account(self):
        return 'acct_fixture'

    def create(self, params, key):
        with self.lock:
            self.requests.append((copy.deepcopy(params), key))
            if key not in self.sessions:
                amount = params['line_items'][0]['price_data']['unit_amount']
                self.sessions[key] = dict(id='cs_test_' + key, object='checkout.session',
                    livemode=False, mode='payment', status='open', currency='usd',
                    amount_subtotal=amount, amount_total=amount,
                    client_reference_id=params['client_reference_id'], expires_at=params['expires_at'],
                    metadata=params['metadata'], url='https://checkout.stripe.com/c/pay/test')
            if self.timeout_once:
                self.timeout_once = False
                raise TimeoutError('simulated response loss after Stripe creation')
            return self.mutate(copy.deepcopy(self.sessions[key]))


class StripeCheckoutTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(); self.addCleanup(tmp.cleanup)
        self.ledger = Ledger(Path(tmp.name) / 'test.db', reservation_seconds=3600)
        self.api = FakeStripe(); self.now = 100
        self.order = self.ledger.create_order('alice', 'request', {
            'productId': 'agent-reasoning-engine', 'offerId': 'release',
            'amountCents': 20000, 'currency': 'USD', 'quantity': 1}, 'a'*64, now=100)
        self.checkout = self.open()

    def open(self, **kwargs):
        return StripeCheckout(self.ledger, self.api, merchant_account='acct_fixture',
            success_url=kwargs.get('success_url', 'https://keld.example/success'),
            cancel_url='https://keld.example/cancel', clock=lambda: self.now)

    def test_timeout_restart_recovers_exact_request_and_session(self):
        self.api.timeout_once = True
        with self.assertRaises(TimeoutError):
            self.checkout.create(self.order['id'], customer='alice')
        result = self.open(success_url='https://keld.example/new').create(self.order['id'], customer='alice')
        self.assertEqual(result['checkoutUrl'], 'https://checkout.stripe.com/c/pay/test')
        self.assertEqual(self.api.requests[0], self.api.requests[1])
        self.assertEqual(len(self.api.sessions), 1)
        self.assertEqual(self.api.requests[0][0]['expires_at'], self.order['expires_at'])
        self.open().create(self.order['id'], customer='alice')
        self.assertEqual(len(self.api.requests), 2)

    def test_concurrent_calls_share_one_session(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.checkout.create(self.order['id'], customer='alice'), range(12)))
        self.assertEqual(len(self.api.sessions), 1)
        self.assertTrue(all(r == results[0] for r in results))
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM provider_sessions').fetchone()[0], 1)

    def test_wrong_customer_and_short_reservation_do_not_call_provider(self):
        with self.assertRaises(Rejected):
            self.checkout.create(self.order['id'], customer='bob')
        self.now = self.order['expires_at'] - 900
        with self.assertRaisesRegex(Rejected, 'reservation-incompatible'):
            self.checkout.create(self.order['id'], customer='alice')
        self.assertEqual(self.api.requests, [])

    def test_changed_amount_live_session_and_bad_url_are_rejected(self):
        for changes in ({'amount_total': 20001}, {'livemode': True},
                        {'url': 'https://checkout.stripe.com.evil.test/pay'},
                        {'metadata': {}}, {'amount_subtotal': True}):
            self.api.mutate = lambda s, changes=changes: dict(s, **changes)
            with self.subTest(changes=changes), self.assertRaises(Rejected):
                self.checkout.create(self.order['id'], customer='alice')
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM provider_sessions').fetchone()[0], 0)

    def test_expiry_during_provider_call_preserves_session_but_returns_no_url(self):
        def late(session):
            self.now = self.order['expires_at']
            return session
        self.api.mutate = late
        with self.assertRaisesRegex(Rejected, 'not-pending'):
            self.checkout.create(self.order['id'], customer='alice')
        with self.ledger.connection() as db:
            self.assertIsNotNone(db.execute('SELECT response_json FROM stripe_checkout_attempts').fetchone()[0])
        with self.assertRaises(Rejected):
            self.checkout.create(self.order['id'], customer='alice')
        self.assertEqual(len(self.api.requests), 1)

    def test_wrong_account_and_live_credentials_rejected(self):
        self.api.account = lambda: 'acct_wrong'
        with self.assertRaisesRegex(Rejected, 'account-mismatch'):
            self.checkout.create(self.order['id'], customer='alice')
        self.assertEqual(self.api.requests, [])
        with self.assertRaisesRegex(Rejected, 'test-key-required'):
            StripeSandboxAPI('sk_live_fixture')

    def test_official_sdk_serializes_request_and_nested_response(self):
        import stripe
        captured = []

        def request(method, url, headers, post_data=None, **kwargs):
            captured.append((method, url, headers, post_data))
            response = ({'id': 'acct_fixture', 'object': 'account'} if url.endswith('/v1/account')
                        else {'id': 'cs_test_fixture', 'object': 'checkout.session',
                              'metadata': {'keld_order_id': self.order['id']}})
            return json.dumps(response), 200, {}

        with patch.object(stripe.RequestsClient, 'request', side_effect=request):
            api = StripeSandboxAPI('sk_test_local_fixture')
            self.assertEqual(api.account(), 'acct_fixture')
            result = api.create({'mode': 'payment', 'line_items': [{'quantity': 1}]}, 'stable-key')
        self.assertEqual(json.loads(json.dumps(result))['metadata']['keld_order_id'], self.order['id'])
        self.assertEqual(captured[1][1], 'https://api.stripe.com/v1/checkout/sessions')
        self.assertEqual(captured[1][2]['Idempotency-Key'], 'stable-key')
        self.assertIn('line_items[0][quantity]=1', captured[1][3])


if __name__ == '__main__':
    unittest.main()
