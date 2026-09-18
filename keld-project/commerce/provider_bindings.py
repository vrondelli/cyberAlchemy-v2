"""Immutable checkout bindings for trusted, independently verified provider adapters.

This module does not authenticate a webhook, call a provider, or accept browser
payment assertions. Each instance is scoped to one configured merchant account.
"""
import hashlib
import json

from ledger import Rejected, identity


class ProviderBindings:
    def __init__(self, ledger, *, provider, merchant_account, environment):
        identity(provider)
        identity(merchant_account)
        if environment not in ('sandbox', 'live'):
            raise Rejected('provider-environment')
        self.ledger = ledger
        self.scope = (provider, merchant_account, environment)
        with ledger.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS provider_sessions (
                provider TEXT NOT NULL, merchant_account TEXT NOT NULL,
                environment TEXT NOT NULL, session_id TEXT NOT NULL,
                order_id TEXT NOT NULL, bound_at INTEGER NOT NULL,
                PRIMARY KEY(provider, merchant_account, environment, session_id))''')

    def bind(self, session_id, order_id, *, customer, now):
        """Bind a server-created provider session after checking its stored terms.

        The adapter must create the session from the order, verify its returned
        amount/currency and use a stable provider idempotency key. Customer is
        obtained from server authentication. A failed bind must not expose a new
        checkout URL; provider cancellation/reconciliation remains adapter work.
        """
        for value in (session_id, order_id, customer):
            identity(value)
        if type(now) is not int or now < 0:
            raise Rejected('time-invalid')
        with self.ledger.transaction() as db:
            order = db.execute('SELECT * FROM orders WHERE id=? AND customer=?',
                               (order_id, customer)).fetchone()
            if not order:
                raise Rejected('order-missing-or-not-owned')
            old = db.execute('''SELECT * FROM provider_sessions WHERE provider=?
                AND merchant_account=? AND environment=? AND session_id=?''',
                (*self.scope, session_id)).fetchone()
            if old:
                if old['order_id'] != order_id:
                    raise Rejected('provider-session-conflict')
                return dict(old)
            if order['status'] != 'pending' or not order['created_at'] <= now < order['expires_at']:
                raise Rejected('checkout-not-pending')
            db.execute('INSERT INTO provider_sessions VALUES (?,?,?,?,?,?)',
                       (*self.scope, session_id, order_id, now))
            return dict(db.execute('''SELECT * FROM provider_sessions WHERE provider=?
                AND merchant_account=? AND environment=? AND session_id=?''',
                (*self.scope, session_id)).fetchone())

    def _key(self, kind, value):
        identity(value)
        encoded = json.dumps([*self.scope, kind, value], separators=(',', ':')).encode()
        return 'provider:' + hashlib.sha256(encoded).hexdigest()

    def record_verified_payment(self, receipt, *, now):
        """Called only after successful payment verification for this exact scope.

        The adapter verifies account, environment, successful capture/settlement,
        authenticity, and session linkage. Order/customer identities are resolved
        locally. The current ledger only accepts USD; Pix/FX needs a quote model.
        """
        fields = {'session_id', 'event_id', 'payment_id', 'amount_cents', 'currency', 'paid_at'}
        if not isinstance(receipt, dict) or set(receipt) != fields:
            raise Rejected('provider-payment-fields')
        identity(receipt['session_id'])
        with self.ledger.connection() as db:
            binding = db.execute('''SELECT s.order_id, o.customer FROM provider_sessions s
                JOIN orders o ON o.id=s.order_id WHERE s.provider=?
                AND s.merchant_account=? AND s.environment=? AND s.session_id=?''',
                (*self.scope, receipt['session_id'])).fetchone()
        if not binding:
            raise Rejected('provider-session-unbound')
        # Bindings cannot be reassigned. Ledger performs atomic replay/payment checks.
        return self.ledger.record_verified_payment({
            'event_id': self._key('event', receipt['event_id']),
            'payment_id': self._key('payment', receipt['payment_id']),
            'order_id': binding['order_id'], 'customer': binding['customer'],
            'amount_cents': receipt['amount_cents'], 'currency': receipt['currency'],
            'paid_at': receipt['paid_at'],
        }, now=now)
