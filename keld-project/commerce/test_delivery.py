from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from delivery import Artifact, Delivery
from ledger import Ledger, Rejected


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.data=b'actual artifact content';(self.root/'bundle.tgz').write_bytes(self.data)
        self.artifact=Artifact(hashlib.sha256(self.data).hexdigest(),len(self.data),'bundle.tgz')
        self.ledger=Ledger(self.root/'orders.sqlite',reservation_seconds=900)
        self.delivery=Delivery(self.ledger,self.root,[self.artifact],mode='local-test')
        self.order=self.ledger.create_order('alice','checkout',{'productId':'agent-reasoning-engine','offerId':'release','amountCents':12525,'currency':'USD','quantity':1},self.artifact.sha256,now=100)
    def tearDown(self):self.temp.cleanup()
    def pay(self):
        self.ledger.record_verified_payment({'event_id':'evt1','payment_id':'payment1','order_id':self.order['id'],'customer':'alice','amount_cents':12525,'currency':'USD','paid_at':101},now=102)
    def issue(self):return self.delivery.issue('alice',self.order['id'],now=103)['token']

    def test_owner_payment_expiry_and_replay(self):
        with self.assertRaises(Rejected):self.issue()
        self.pay();token=self.issue()
        with self.assertRaises(Rejected):self.delivery.redeem('bob',token,now=104)
        with self.assertRaises(Rejected):self.delivery.redeem('alice','unknown',now=104)
        self.assertEqual(self.delivery.redeem('alice',token,now=104),self.data)
        with self.assertRaises(Rejected):self.delivery.redeem('alice',token,now=105)
        with self.assertRaises(Rejected):self.delivery.redeem('alice',self.issue(),now=403)

    def test_corruption_does_not_consume_grant_and_revocation_is_rechecked(self):
        self.pay();token=self.issue();(self.root/'bundle.tgz').write_bytes(b'corrupted')
        with self.assertRaisesRegex(Rejected,'integrity'):self.delivery.redeem('alice',token,now=104)
        (self.root/'bundle.tgz').write_bytes(self.data)
        self.assertEqual(self.delivery.redeem('alice',token,now=105),self.data)
        token=self.issue()
        with self.ledger.transaction() as db:db.execute("UPDATE orders SET status='paid-review'")
        with self.assertRaisesRegex(Rejected,'not-authorized'):self.delivery.redeem('alice',token,now=106)

    def test_unapproved_release_and_test_grants_cannot_cross_modes(self):
        self.pay();production=Delivery(self.ledger,self.root,[self.artifact],mode='approved-release')
        with self.assertRaisesRegex(Rejected,'not-approved'):production.issue('alice',self.order['id'],now=103)
        approved=Delivery(self.ledger,self.root,[replace(self.artifact,approved_for_sale=True)],mode='approved-release')
        with self.assertRaisesRegex(Rejected,'grant-invalid'):approved.redeem('alice',self.issue(),now=104)

    def test_concurrent_redeem_once_and_restart(self):
        self.pay();token=self.issue()
        service=Delivery(Ledger(self.root/'orders.sqlite',reservation_seconds=900),self.root,[self.artifact],mode='local-test')
        def attempt(_):
            try:return service.redeem('alice',token,now=104)
            except Rejected:return None
        with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(attempt,range(16)))
        self.assertEqual(results.count(self.data),1)
        with self.ledger.connection() as db:
            self.assertNotEqual(db.execute('SELECT token_hash FROM download_grants').fetchone()[0],token)

    def test_large_snapshot_is_verified_and_independent_of_source(self):
        self.data=b'archive-data-'*(1024*1024)
        (self.root/'bundle.tgz').write_bytes(self.data)
        self.artifact=replace(self.artifact,sha256=hashlib.sha256(self.data).hexdigest(),bytes=len(self.data),approved_for_sale=True)
        with self.ledger.transaction() as db:
            db.execute('UPDATE orders SET release_digest=?',(self.artifact.sha256,))
        self.delivery=Delivery(self.ledger,self.root,[self.artifact],mode='approved-release')
        self.pay();token=self.issue()
        with self.delivery.redeem_snapshot('alice',token,now=104) as snapshot:
            (self.root/'bundle.tgz').write_bytes(b'replaced after verification')
            digest=hashlib.sha256();size=0
            while chunk:=snapshot.read(65536):
                digest.update(chunk);size+=len(chunk)
            self.assertEqual(size,len(self.data))
            self.assertEqual(digest.hexdigest(),self.artifact.sha256)
        self.assertTrue(snapshot.closed)
        with self.assertRaisesRegex(Rejected,'grant-invalid'):
            self.delivery.redeem_snapshot('alice',token,now=105)

    def test_snapshot_failure_closes_file_and_preserves_grant(self):
        self.pay();token=self.issue()
        with patch('delivery.tempfile.TemporaryFile',side_effect=OSError('storage unavailable')):
            with self.assertRaises(OSError):
                self.delivery.redeem_snapshot('alice',token,now=104)
        original=tempfile.TemporaryFile
        created=[]
        def track(*args,**kwargs):
            file=original(*args,**kwargs);created.append(file);return file
        (self.root/'bundle.tgz').write_bytes(self.data+b'excess')
        with patch('delivery.tempfile.TemporaryFile',side_effect=track):
            with self.assertRaisesRegex(Rejected,'integrity'):
                self.delivery.redeem_snapshot('alice',token,now=105)
        self.assertTrue(created[0].closed)
        (self.root/'bundle.tgz').write_bytes(self.data)
        with self.delivery.redeem_snapshot('alice',token,now=106) as snapshot:
            self.assertEqual(snapshot.read(),self.data)

    def test_snapshot_rechecks_approval_and_ownership(self):
        self.pay()
        approved=Delivery(self.ledger,self.root,[replace(self.artifact,approved_for_sale=True)],mode='approved-release')
        token=approved.issue('alice',self.order['id'],now=103)['token']
        with self.assertRaisesRegex(Rejected,'grant-invalid'):
            approved.redeem_snapshot('bob',token,now=104)
        revoked=Delivery(self.ledger,self.root,[self.artifact],mode='approved-release')
        with self.assertRaisesRegex(Rejected,'not-approved'):
            revoked.redeem_snapshot('alice',token,now=104)
        with approved.redeem_snapshot('alice',token,now=104) as snapshot:
            self.assertEqual(snapshot.read(),self.data)

    def test_verified_full_refund_invalidates_existing_unused_grant(self):
        self.pay();token=self.issue()
        reversal={'provider':'stripe','event_id':'refund-event','order_id':self.order['id'],
                  'customer':'alice','payment_id':'payment1','kind':'full-refund',
                  'provider_ref':'re_full','verified_at':104}
        self.ledger.record_verified_reversal(reversal,now=104)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.delivery.redeem_snapshot('alice',token,now=105)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.delivery.issue('alice',self.order['id'],now=105)
        with self.ledger.connection() as db:
            self.assertIsNone(db.execute('SELECT consumed_at FROM download_grants').fetchone()[0])

    def test_partial_refund_preserves_unused_grant_until_verified_lost_dispute(self):
        self.pay();token=self.issue()
        reversal={'provider':'stripe','event_id':'partial-event','order_id':self.order['id'],
                  'customer':'alice','payment_id':'payment1','kind':'partial-refund',
                  'provider_ref':'re_partial','verified_at':104}
        self.assertEqual(self.ledger.record_verified_reversal(reversal,now=104)['disposition'],'review')
        self.assertTrue(self.ledger.entitlement('alice',self.order['id'],now=105)['download_allowed'])
        self.assertEqual(self.delivery.redeem('alice',token,now=105),self.data)
        unused=self.issue()
        dispute={**reversal,'event_id':'lost-event','kind':'lost-dispute',
                 'provider_ref':'du_lost','verified_at':106}
        self.assertEqual(self.ledger.record_verified_reversal(dispute,now=106)['disposition'],'revoked')
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.delivery.redeem('alice',unused,now=107)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            self.delivery.issue('alice',self.order['id'],now=107)

    def test_paths_cannot_escape_artifact_root(self):
        with self.assertRaises(Rejected):Delivery(self.ledger,self.root,[replace(self.artifact,relative_path='../outside')],mode='local-test')
        with tempfile.TemporaryDirectory() as other:
            outside=Path(other)/'outside';outside.write_bytes(self.data)
            (self.root/'link').symlink_to(outside)
            with self.assertRaises(Rejected):Delivery(self.ledger,self.root,[replace(self.artifact,relative_path='link')],mode='local-test')


if __name__=='__main__':unittest.main()
