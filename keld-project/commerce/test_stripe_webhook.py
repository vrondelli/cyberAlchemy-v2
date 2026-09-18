import concurrent.futures
import hashlib
import hmac
import json
from pathlib import Path
import tempfile
import time
import unittest

from ledger import Ledger, Rejected
from stripe_webhook import StripeInbox


class StripeInboxTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.ledger = Ledger(Path(tmp.name) / 'test.db', reservation_seconds=900)
        self.secret = 'whsec_local_test_only'
        self.inbox = self.open()
        self.event = {'id': 'evt_fixture', 'object': 'event', 'type': 'checkout.session.completed',
                      'livemode': False, 'data': {'object': {'id': 'cs_fixture', 'payment_status': 'paid'}}}

    def open(self):
        return StripeInbox(self.ledger, merchant_account='acct_fixture',
                           environment='sandbox', endpoint_secret=self.secret)

    def signed(self, event=None, timestamp=None, secret=None):
        body = json.dumps(self.event if event is None else event).encode()
        stamp = int(time.time()) if timestamp is None else timestamp
        mac = hmac.new((secret or self.secret).encode(), str(stamp).encode() + b'.' + body,
                       hashlib.sha256).hexdigest()
        return body, f't={stamp},v1={mac}'

    def count(self):
        with self.ledger.connection() as db:
            return db.execute('SELECT count(*) FROM stripe_inbox').fetchone()[0]

    def test_signed_event_durable_and_concurrent_duplicates(self):
        body, header = self.signed()
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.inbox.receive(body, header), range(12)))
        self.assertEqual(sum(not r['duplicate'] for r in results), 1)
        self.assertTrue(self.open().receive(body, header)['duplicate'])
        self.assertEqual(self.count(), 1)
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_events').fetchone()[0], 0)

    def test_tampering_wrong_secret_and_stale_signature_rejected(self):
        body, header = self.signed()
        samples = [(body+b' ', header), self.signed(secret='whsec_wrong'),
                   self.signed(timestamp=int(time.time())-301), (body, 'v1=bad'),
                   (body, None), (body.decode(), header)]
        for sample in samples:
            with self.subTest(sample=sample), self.assertRaises(Rejected):
                self.inbox.receive(*sample)
        self.assertEqual(self.count(), 0)

    def test_signature_rotation_accepts_matching_v1(self):
        body, header = self.signed()
        self.assertTrue(self.inbox.receive(body, header + ',v1=' + '0'*64)['stored'])

    def test_account_environment_and_malformed_data_rejected(self):
        for changes in ({'livemode': True}, {'livemode': 0}, {'account': 'acct_other'},
                        {'data': {}}, {'id': ''}):
            with self.subTest(changes=changes), self.assertRaises(Rejected):
                self.inbox.receive(*self.signed(dict(self.event, **changes)))
        self.assertEqual(self.count(), 0)

    def test_same_event_id_cannot_change_payload(self):
        self.inbox.receive(*self.signed())
        with self.assertRaisesRegex(Rejected, 'stripe-event-conflict'):
            self.inbox.receive(*self.signed(dict(self.event, type='charge.refunded')))
        self.assertEqual(self.count(), 1)


if __name__ == '__main__':
    unittest.main()
