"""Authenticated Stripe snapshot-event inbox; no fulfillment or HTTP transport."""
import hashlib
import json
import time

import stripe

from ledger import Rejected, identity


class StripeInbox:
    def __init__(self, ledger, *, merchant_account, environment, endpoint_secret):
        identity(merchant_account)
        if environment not in ('sandbox', 'live'):
            raise Rejected('stripe-environment')
        if not isinstance(endpoint_secret, str) or not endpoint_secret.startswith('whsec_') or len(endpoint_secret) <= 6:
            raise Rejected('stripe-endpoint-secret-required')
        self.ledger = ledger
        self.account = merchant_account
        self.live = environment == 'live'
        self.secret = endpoint_secret
        with ledger.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS stripe_inbox (
                merchant_account TEXT NOT NULL, live INTEGER NOT NULL,
                event_id TEXT NOT NULL, event_type TEXT NOT NULL,
                payload TEXT NOT NULL, payload_digest TEXT NOT NULL,
                received_at INTEGER NOT NULL,
                PRIMARY KEY(merchant_account, live, event_id))''')

    def receive(self, body, signature):
        """Pass original request bytes and Stripe-Signature, before JSON middleware.

        Secret must belong to this configured merchant's endpoint/environment.
        Signature freshness is checked on arrival; persisted events are replayed
        internally later, not submitted again with an old signature.
        """
        if not isinstance(body, bytes) or len(body) > 1024 * 1024:
            raise Rejected('stripe-body')
        if not isinstance(signature, str) or len(signature) > 8192:
            raise Rejected('stripe-signature')
        try:
            stripe.Webhook.construct_event(body, signature, self.secret, tolerance=300)
            event = json.loads(body)
        except (ValueError, UnicodeError, stripe.SignatureVerificationError):
            # Never propagate SDK exceptions containing request bodies/signatures.
            raise Rejected('stripe-authentication') from None
        if not isinstance(event, dict) or event.get('object') != 'event':
            raise Rejected('stripe-event')
        if type(event.get('livemode')) is not bool or event['livemode'] != self.live:
            raise Rejected('stripe-environment-mismatch')
        # Standalone own-account snapshot events omit account. A configured endpoint
        # secret binds that case; connected-account envelopes must match explicitly.
        if 'account' in event and event['account'] != self.account:
            raise Rejected('stripe-account-mismatch')
        for name in ('id', 'type'):
            identity(event.get(name))
        if not isinstance(event.get('data'), dict) or not isinstance(event['data'].get('object'), dict):
            raise Rejected('stripe-event-data')
        payload = json.dumps(event, sort_keys=True, separators=(',', ':'), allow_nan=False)
        digest = hashlib.sha256(payload.encode()).hexdigest()
        with self.ledger.transaction() as db:
            old = db.execute('''SELECT payload_digest FROM stripe_inbox
                WHERE merchant_account=? AND live=? AND event_id=?''',
                (self.account, int(self.live), event['id'])).fetchone()
            if old:
                if old['payload_digest'] != digest:
                    raise Rejected('stripe-event-conflict')
                return {'event_id': event['id'], 'stored': True, 'duplicate': True}
            db.execute('INSERT INTO stripe_inbox VALUES (?,?,?,?,?,?,?)',
                       (self.account, int(self.live), event['id'], event['type'],
                        payload, digest, int(time.time())))
        return {'event_id': event['id'], 'stored': True, 'duplicate': False}
