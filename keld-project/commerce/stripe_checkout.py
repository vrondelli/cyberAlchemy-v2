"""Persisted Stripe sandbox checkout creation; customer identity is server supplied."""
import hashlib
import json
import time
from urllib.parse import urlsplit

from ledger import Rejected, identity
from provider_bindings import ProviderBindings


def https_url(value, *, stripe_host=False):
    if not isinstance(value, str) or any(ord(c) < 33 for c in value):
        raise Rejected('checkout-url')
    try:
        parsed = urlsplit(value)
        valid = (parsed.scheme == 'https' and parsed.hostname and not parsed.username
                 and not parsed.password and parsed.port in (None, 443))
    except ValueError:
        valid = False
    if not valid or (stripe_host and parsed.hostname != 'checkout.stripe.com'):
        raise Rejected('checkout-url')
    return value


class StripeSandboxAPI:
    """Only test keys; no global SDK credential state or live-mode switch."""
    def __init__(self, api_key):
        if not isinstance(api_key, str) or not api_key.startswith(('sk_test_', 'rk_test_')):
            raise Rejected('stripe-test-key-required')
        import stripe
        self.client = stripe.StripeClient(api_key, max_network_retries=0,
                                         http_client=stripe.RequestsClient(timeout=10))

    def account(self):
        return self.client.v1.accounts.retrieve_current()['id']

    def create(self, params, key):
        session = self.client.v1.checkout.sessions.create(params, options={'idempotency_key': key})
        return session.to_dict()

    def session(self, session_id):
        return self.client.v1.checkout.sessions.retrieve(session_id).to_dict()

    def payment(self, payment_id):
        return self.client.v1.payment_intents.retrieve(
            payment_id, {'expand': ['latest_charge']}).to_dict()


class StripeCheckout:
    def __init__(self, ledger, api, *, merchant_account, success_url, cancel_url, clock=None):
        identity(merchant_account)
        self.ledger, self.api, self.account = ledger, api, merchant_account
        self.success_url = https_url(success_url)
        self.cancel_url = https_url(cancel_url)
        self.clock = clock or (lambda: int(time.time()))
        self.bindings = ProviderBindings(ledger, provider='stripe',
                                        merchant_account=merchant_account, environment='sandbox')
        with ledger.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS stripe_checkout_attempts (
                merchant_account TEXT NOT NULL, order_id TEXT NOT NULL,
                request_json TEXT NOT NULL, request_key TEXT NOT NULL UNIQUE,
                response_json TEXT, PRIMARY KEY(merchant_account, order_id))''')

    def create(self, order_id, *, customer):
        identity(order_id); identity(customer)
        now = self.clock()
        if type(now) is not int or now < 0:
            raise Rejected('time-invalid')
        with self.ledger.transaction() as db:
            order = db.execute('SELECT * FROM orders WHERE id=? AND customer=?',
                               (order_id, customer)).fetchone()
            if not order:
                raise Rejected('order-missing-or-not-owned')
            if order['status'] != 'pending' or not order['created_at'] <= now < order['expires_at']:
                raise Rejected('checkout-not-pending')
            row = db.execute('SELECT * FROM stripe_checkout_attempts WHERE merchant_account=? AND order_id=?',
                             (self.account, order_id)).fetchone()
            if not row:
                # Leave 60 seconds for account lookup/network latency. Never extend
                # the stored reservation to satisfy Stripe's 30-minute minimum.
                if not 1860 <= order['expires_at'] - now <= 86400:
                    raise Rejected('stripe-reservation-incompatible')
                params = {
                    'mode': 'payment', 'payment_method_types': ['card'],
                    'success_url': self.success_url, 'cancel_url': self.cancel_url,
                    'expires_at': order['expires_at'], 'client_reference_id': order_id,
                    'adaptive_pricing': {'enabled': False}, 'automatic_tax': {'enabled': False},
                    'metadata': {'keld_order_id': order_id, 'release_digest': order['release_digest'],
                                 'early_supporter': str(order['benefit'])},
                    'line_items': [{'quantity': 1, 'price_data': {'currency': 'usd',
                        'unit_amount': order['amount'], 'product_data': {
                            'name': 'Agent Reasoning Engine — sandbox purchase',
                            'description': ('Early-supporter order; updates and support follow KELD terms.'
                                            if order['benefit'] else 'Engine release; no early-supporter benefit.')}}}],
                }
                request_json = json.dumps(params, sort_keys=True, separators=(',', ':'))
                key = hashlib.sha256(json.dumps([self.account, 'sandbox', order_id]).encode()).hexdigest()
                db.execute('INSERT INTO stripe_checkout_attempts VALUES (?,?,?,?,NULL)',
                           (self.account, order_id, request_json, 'keld-' + key))
                row = db.execute('SELECT * FROM stripe_checkout_attempts WHERE merchant_account=? AND order_id=?',
                                 (self.account, order_id)).fetchone()
            attempt = dict(row)
            order = dict(order)
        # Network calls are outside SQLite transactions. A timeout leaves the same
        # request and key persisted; retry never invents a replacement request.
        if self.api.account() != self.account:
            raise Rejected('stripe-account-mismatch')
        params = json.loads(attempt['request_json'])
        session = (json.loads(attempt['response_json']) if attempt['response_json'] else
                   dict(self.api.create(params, attempt['request_key'])))
        self._validate(session, order)
        with self.ledger.transaction() as db:
            prior = db.execute('SELECT response_json FROM stripe_checkout_attempts WHERE merchant_account=? AND order_id=?',
                               (self.account, order_id)).fetchone()[0]
            if prior and json.loads(prior)['id'] != session['id']:
                raise Rejected('stripe-session-conflict')
            if not prior:
                # Persist even if reservation elapsed during the network operation;
                # reconciliation can recover the provider session from this record.
                db.execute('UPDATE stripe_checkout_attempts SET response_json=? WHERE merchant_account=? AND order_id=?',
                           (json.dumps(session), self.account, order_id))
        self.bindings.bind(session['id'], order_id, customer=customer, now=self.clock())
        # bind is idempotent, so recheck current order even on an existing binding.
        with self.ledger.connection() as db:
            current = db.execute('SELECT status,expires_at FROM orders WHERE id=?', (order_id,)).fetchone()
        if current['status'] != 'pending' or self.clock() >= current['expires_at']:
            raise Rejected('checkout-not-pending')
        return {'checkoutUrl': session['url']}

    @staticmethod
    def _validate(session, order):
        expected = {'object': 'checkout.session', 'livemode': False, 'mode': 'payment',
                    'status': 'open', 'currency': 'usd', 'client_reference_id': order['id'],
                    'amount_subtotal': order['amount'], 'amount_total': order['amount'],
                    'expires_at': order['expires_at']}
        if any(type(session.get(k)) is not type(v) or session.get(k) != v for k, v in expected.items()):
            raise Rejected('stripe-session-mismatch')
        identity(session.get('id'))
        if not session['id'].startswith('cs_test_'):
            raise Rejected('stripe-session-mode')
        metadata = session.get('metadata', {})
        if (not isinstance(metadata, dict) or metadata.get('release_digest') != order['release_digest']
                or metadata.get('keld_order_id') != order['id']
                or metadata.get('early_supporter') != str(order['benefit'])):
            raise Rejected('stripe-session-metadata')
        https_url(session.get('url'), stripe_host=True)
