"""SDK reservation and attempt registration must share one SQLite commit."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import sqlite3
import tempfile
import unittest

from sdk_bridge import competing_checkout, run
from ledger import Ledger, Rejected


class AtomicPrepareTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.database=str(Path(self.temp.name)/'checkout.sqlite3')
        self.base={'database':self.database,'reservationSeconds':900,'releaseDigest':'a'*64}

    def tearDown(self):
        self.temp.cleanup()

    def call(self,operation,**input):
        return run({**self.base,'operation':operation,'input':{'customer':'buyer','now':100,**input}})

    def prepare(self,key,*,now=100,customer='buyer'):
        return self.call('prepare',customer=customer,now=now,requestKey=key,
                         provider='stripe',account='acct_test',amountCents=20000,
                         terms={'amountCents':20000,'currency':'USD'})

    def bind(self,order):
        claim=self.call('claim',orderId=order['id'])
        self.call('bind',orderId=order['id'],remoteId='remote-'+order['id'],
                  response={'remoteId':'remote-'+order['id'],'checkoutUrl':'https://example.test/pay'},
                  generation=claim['generation'])

    def replacement(self,old,key='second',*,now=1001,customer='buyer',proof=None):
        remote='remote-'+old['id']
        evidence=proof if proof is not None else {
            'kind':'terminal-unpaid','provider':'stripe','providerApi':None,
            'remoteId':remote,'observedAt':now,
            'discovery':{'ids':[remote],'total':1,'complete':True,
                         'interval':{'begin':100,'end':now}}}
        return self.call('replace-prepare',customer=customer,now=now,oldOrderId=old['id'],
                         oldAccount='acct_test',proof=evidence,requestKey=key,
                         provider='stripe',account='acct_test',amountCents=20000,
                         terms={'amountCents':20000,'currency':'USD'})

    def test_failed_attempt_insert_rolls_back_order_and_benefit(self):
        self.assertEqual(self.call('list'),{'orders':[],'next':None})
        with sqlite3.connect(self.database) as db:
            db.execute('''CREATE TRIGGER fail_sdk_attempt BEFORE INSERT ON sdk_attempts
                BEGIN SELECT RAISE(ABORT,'simulated-attempt-failure'); END''')
        input={'requestKey':'retry-key','provider':'stripe','account':'acct_test',
               'amountCents':20000,'terms':{'amountCents':20000,'currency':'USD'}}
        with self.assertRaisesRegex(sqlite3.IntegrityError,'simulated-attempt-failure'):
            self.call('prepare',**input)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM orders').fetchone()[0],0)
            self.assertEqual(db.execute('SELECT count(*) FROM benefits').fetchone()[0],0)
            db.execute('DROP TRIGGER fail_sdk_attempt')
        order=self.call('prepare',**input)
        self.assertEqual(self.call('prepare',**input)['id'],order['id'])
        self.assertEqual(self.call('list')['orders'][0]['id'],order['id'])

    def test_expired_bound_payment_stays_in_review_without_terminal_evidence(self):
        old=self.prepare('first')
        self.bind(old)
        self.assertEqual(self.prepare('first')['id'],old['id'])
        work=self.call('reconcile-claim',now=1001)
        self.call('reconcile-finish',now=1001,
                  work={'orderId':old['id'],'generation':work['generation']},
                  outcome='review',reason='payment-not-complete-after-expiry')
        with self.assertRaisesRegex(Rejected,'customer-checkout-unresolved'):
            self.prepare('second',now=1001)
        self.assertEqual(self.call('list',now=1001)['orders'][0]['id'],old['id'])
        self.assertEqual(self.prepare('another-buyer',now=1001,customer='other')['customer'],'other')
        with self.assertRaisesRegex(Rejected,'reconciliation-terminal-evidence-required'):
            self.call('reconcile-resolve',now=1001,
                      work={'orderId':old['id'],'generation':work['generation']},
                      reason='stripe-expired-unpaid')
        with self.assertRaisesRegex(Rejected,'customer-checkout-unresolved'):
            self.prepare('second',now=1001)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM orders WHERE customer='buyer'").fetchone()[0],1)
            self.assertEqual(db.execute('SELECT state FROM sdk_reconciliation WHERE order_id=?',
                                        (old['id'],)).fetchone()[0],'review')

    def test_uncertain_creation_without_remote_blocks_after_expiry(self):
        old=self.prepare('uncertain')
        claim=self.call('claim',orderId=old['id'])
        self.call('creation-failed',orderId=old['id'],generation=claim['generation'],definite=False)
        with self.assertRaisesRegex(Rejected,'customer-checkout-unresolved'):
            self.prepare('unsafe-retry',now=1001)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM orders').fetchone()[0],1)

    def test_missing_historical_creation_state_is_unresolved(self):
        old=self.prepare('older')
        self.bind(old)
        with sqlite3.connect(self.database) as db:
            db.execute('DELETE FROM sdk_creation WHERE order_id=?',(old['id'],))
            self.assertEqual(competing_checkout(db,'buyer','new-key',1001),
                             'customer-checkout-unresolved')
        # Normal entry also backfills the missing state before reservation.
        with self.assertRaisesRegex(Rejected,'customer-checkout-unresolved'):
            self.prepare('new-key',now=1001)

    def test_unissued_expired_attempt_and_definite_failure_allow_new_order(self):
        unused=self.prepare('unused')
        self.assertNotEqual(self.prepare('fresh',now=1001)['id'],unused['id'])
        definite=self.prepare('definite',customer='other')
        claim=self.call('claim',customer='other',orderId=definite['id'])
        self.call('creation-failed',customer='other',orderId=definite['id'],
                  generation=claim['generation'],definite=True)
        self.assertNotEqual(self.prepare('after-failure',customer='other')['id'],definite['id'])

    def test_late_paid_review_blocks_new_checkout(self):
        old=self.prepare('late')
        self.bind(old)
        settled=self.call('settle',now=1001,orderId=old['id'],
                          remoteId='remote-'+old['id'],paymentId='paid-'+old['id'],
                          amountCents=20000,currency='USD')
        self.assertEqual(settled['status'],'paid-review')
        with self.assertRaisesRegex(Rejected,'customer-checkout-unresolved'):
            self.prepare('second',now=1001)

    def test_historical_second_key_cannot_claim_a_new_provider_resource(self):
        old=self.prepare('old')
        self.bind(old)
        historical_id='b'*32
        with sqlite3.connect(self.database) as db:
            db.execute('''INSERT INTO orders
                (id,customer,request_key,amount,release_digest,status,benefit,created_at,expires_at)
                VALUES(?,?,?,?,?,?,?,?,?)''',
                (historical_id,'buyer','historical-second',20000,'a'*64,'pending',0,1001,2000))
            db.execute('INSERT INTO sdk_attempts(order_id,provider,account,terms) VALUES(?,?,?,?)',
                       (historical_id,'stripe','acct_test','{"amountCents":20000,"currency":"USD"}'))
            db.execute("INSERT INTO sdk_creation(order_id,state) VALUES(?,'ready')",(historical_id,))
        with self.assertRaisesRegex(Rejected,'checkout-reconciliation-required'):
            self.call('claim',now=1100,orderId=historical_id)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT state,generation FROM sdk_creation WHERE order_id=?',
                                        (historical_id,)).fetchone(),('ready',0))

    def test_terminal_proof_closes_old_and_reserves_exactly_one_successor_atomically(self):
        old=self.prepare('first');self.bind(old)
        self.assertIsNone(self.call('replacement-candidate',requestKey='second',now=999))
        candidate=self.call('replacement-candidate',requestKey='second',now=1001)
        self.assertEqual(candidate['id'],old['id'])
        self.assertEqual(candidate['remoteId'],'remote-'+old['id'])
        successor=self.replacement(old)
        self.assertNotEqual(successor['id'],old['id'])
        self.assertEqual(successor['status'],'pending')
        self.assertEqual(self.call('lookup',requestKey='first',now=1001)['status'],'cancelled')
        self.assertEqual(self.call('lookup',requestKey='second',now=1001)['id'],successor['id'])
        with sqlite3.connect(self.database) as db:
            row=db.execute('SELECT provider,remote_id,successor_order_id FROM sdk_terminal_unpaid WHERE order_id=?',(old['id'],)).fetchone()
            self.assertEqual(row,('stripe','remote-'+old['id'],successor['id']))
            self.assertEqual(db.execute('SELECT count(*) FROM orders WHERE customer=?',('buyer',)).fetchone()[0],2)
            self.assertEqual(db.execute('SELECT count(*) FROM benefits WHERE customer=?',('buyer',)).fetchone()[0],1)
        self.assertEqual(self.call('lookup',requestKey='second',now=1001)['replaces_order_id'],old['id'])
        before=Path(self.database).read_bytes()
        self.assertEqual(self.call('lookup-key-readonly',requestKey='second',now=1001),
                         {'found':True,'orderId':successor['id'],'status':'pending','replacesOrderId':old['id']})
        self.assertEqual(self.call('lookup-key-readonly',requestKey='missing',now=1001),{'found':False})
        self.assertEqual(self.call('lookup-key-readonly',customer='different-buyer',requestKey='second',now=1001),{'found':False})
        self.assertEqual(Path(self.database).read_bytes(),before)
        with self.assertRaisesRegex(Rejected,'customer-checkout-pending'):
            self.prepare('third',now=1001)
        with self.assertRaisesRegex(Rejected,'terminal-proof-conflict'):
            self.replacement(old,key='racing-tab')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM orders WHERE customer=?',('buyer',)).fetchone()[0],2)

    def test_replacement_rejects_stale_or_ambiguous_proof_without_closing(self):
        old=self.prepare('first');self.bind(old)
        remote='remote-'+old['id']
        valid={'kind':'terminal-unpaid','provider':'stripe','providerApi':None,
               'remoteId':remote,'observedAt':1001,
               'discovery':{'ids':[remote],'total':1,'complete':True,'interval':{'begin':100,'end':1001}}}
        bad=[
            (dict(valid,observedAt=970),'terminal-proof-invalid'),
            (dict(valid,discovery=dict(valid['discovery'],total=2)),'terminal-proof-invalid'),
            (dict(valid,discovery=dict(valid['discovery'],total=True)),'terminal-proof-invalid'),
            (dict(valid,discovery=dict(valid['discovery'],interval={'begin':101,'end':1001})),'terminal-proof-conflict'),
            (dict(valid,provider='mercadopago'),'terminal-proof-conflict'),
        ]
        for proof,code in bad:
            with self.assertRaisesRegex(Rejected,code):self.replacement(old,proof=proof)
        with self.assertRaisesRegex(Rejected,'terminal-proof-conflict'):
            self.replacement(old,customer='different-buyer')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM orders').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT status FROM orders WHERE id=?',(old['id'],)).fetchone()[0],'pending')

    def test_event_or_late_payment_blocks_terminal_replacement(self):
        old=self.prepare('first');self.bind(old)
        event={'provider':'stripe','account':'acct_test','environment':'sandbox',
               'eventId':'evt-old','eventType':'checkout.session.completed',
               'resourceId':'remote-'+old['id'],'resourceKind':'checkout.session'}
        self.call('event-receive',now=1001,event=event)
        with self.assertRaisesRegex(Rejected,'terminal-event-review-required'):
            self.replacement(old)
        with sqlite3.connect(self.database) as db:
            db.execute('DELETE FROM sdk_event_work')
            db.execute('DELETE FROM sdk_event_inbox')
        paid=self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                       paymentId='paid-'+old['id'],amountCents=20000,currency='USD')
        self.assertEqual(paid['status'],'paid-review')
        with self.assertRaisesRegex(Rejected,'terminal-proof-conflict'):
            self.replacement(old)

    def test_active_reconciliation_lease_blocks_terminal_replacement(self):
        old=self.prepare('first');self.bind(old)
        work=self.call('reconcile-claim',now=1001)
        self.assertEqual(work['id'],old['id'])
        with self.assertRaisesRegex(Rejected,'terminal-reconciliation-active'):
            self.replacement(old)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT status FROM orders WHERE id=?',(old['id'],)).fetchone()[0],'pending')
            self.assertEqual(db.execute('SELECT count(*) FROM sdk_terminal_unpaid').fetchone()[0],0)

    def test_terminal_link_migrates_legacy_rows_without_inventing_successor(self):
        old=self.prepare('legacy');self.bind(old)
        with sqlite3.connect(self.database) as db:
            db.execute('DROP INDEX sdk_terminal_unpaid_successor')
            db.execute('DROP TABLE sdk_terminal_unpaid')
            db.execute('''CREATE TABLE sdk_terminal_unpaid (
                order_id TEXT PRIMARY KEY REFERENCES orders(id),provider TEXT NOT NULL,
                account TEXT NOT NULL,remote_id TEXT NOT NULL,provider_api TEXT,
                observed_at INTEGER NOT NULL,discovery TEXT NOT NULL,recorded_at INTEGER NOT NULL)''')
            db.execute('''INSERT INTO sdk_terminal_unpaid VALUES(?,?,?,?,?,?,?,?)''',
                       (old['id'],'stripe','acct_test','remote-'+old['id'],None,100,'{}',100))
        with self.assertRaisesRegex(Rejected,'lookup-schema-invalid'):
            self.call('lookup-key-readonly',requestKey='legacy')
        self.call('get',orderId=old['id'])
        with sqlite3.connect(self.database) as db:
            self.assertIsNone(db.execute('SELECT successor_order_id FROM sdk_terminal_unpaid WHERE order_id=?',
                                         (old['id'],)).fetchone()[0])
        self.assertEqual(self.call('lookup-key-readonly',requestKey='legacy')['replacesOrderId'],None)

    def test_replacement_cannot_link_an_unrelated_historical_request_key(self):
        historical=self.prepare('reused')
        claim=self.call('claim',orderId=historical['id'])
        self.assertTrue(self.call('creation-failed',orderId=historical['id'],
                                  generation=claim['generation'],definite=True)['definite'])
        old=self.prepare('old');self.bind(old)
        with self.assertRaisesRegex(Rejected,'replacement-link-conflict'):
            self.replacement(old,key='reused')
        self.assertEqual(self.call('get',orderId=old['id'])['status'],'pending')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM sdk_terminal_unpaid').fetchone()[0],0)

    def test_refund_inspection_keeps_completed_refund_evidence_during_dispute_review(self):
        old=self.prepare('first');self.bind(old)
        paid=self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                       paymentId='pi_test',amountCents=20000,currency='USD')
        self.assertEqual(paid['status'],'paid-review')
        initial=self.call('refund-inspect',now=1001)
        self.assertEqual(initial['counts']['queued'],1)
        self.assertEqual(initial['orders'][0]['fullRefundRecorded'],0)
        ledger=Ledger(self.database,reservation_seconds=900)
        base={'provider':'stripe','order_id':old['id'],'customer':'buyer',
              'payment_id':paid['payment_id'],'verified_at':1002}
        ledger.record_verified_reversal({**base,'event_id':'evt-refund','kind':'full-refund','provider_ref':'re_test'},now=1002)
        self.assertEqual(self.call('lookup-key-readonly',requestKey='first',now=1002)['status'],'revoked')
        ledger.record_verified_reversal({**base,'event_id':'evt-dispute','kind':'lost-dispute',
                                         'provider_ref':'du_test','verified_at':1003},now=1003)
        owned=self.call('get',now=1003,orderId=old['id'])
        self.assertEqual((owned['revocation_reason'],owned['late_refund_state'],
                          owned['full_refund_recorded'],owned['lost_dispute_recorded']),
                         ('full-refund','review',1,1))
        self.assertEqual(self.call('list',now=1003)['orders'][0]['lost_dispute_recorded'],1)
        review=self.call('refund-inspect',now=1003,state='review')
        self.assertEqual(review['counts']['review'],1)
        self.assertEqual(review['orders'][0]['fullRefundRecorded'],1)
        self.assertEqual(review['orders'][0]['reversalReviewCount'],1)
        self.assertEqual(review['orders'][0]['lastReason'],'provider-lost-dispute')

    def test_refund_inspection_does_not_initialize_or_change_ledger_bytes(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        with sqlite3.connect(self.database) as db:
            db.execute('DELETE FROM sdk_creation WHERE order_id=?',(old['id'],))
        digest=lambda: hashlib.sha256(Path(self.database).read_bytes()).hexdigest()
        before=digest()
        result=self.call('refund-inspect',now=1001)
        self.assertEqual(result['counts']['queued'],1)
        self.assertEqual(digest(),before)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM sdk_creation WHERE order_id=?',(old['id'],)).fetchone()[0],0)

    def test_refund_inspection_rejects_legacy_or_missing_schema_without_migration(self):
        missing=Path(self.temp.name)/'never-created.sqlite3'
        with self.assertRaisesRegex(Rejected,'refund-inspect-unavailable'):
            run({**self.base,'database':str(missing),'operation':'refund-inspect','input':{'now':100}})
        with self.assertRaisesRegex(Rejected,'refund-review-unavailable'):
            run({**self.base,'database':str(missing),'operation':'refund-review-preflight',
                 'input':{'orderId':'a'*32,'generation':1,'now':100}})
        with self.assertRaisesRegex(Rejected,'refund-review-unavailable'):
            run({**self.base,'database':str(missing),'operation':'refund-review-status',
                 'input':{'work':{'orderId':'a'*32,'generation':1}}})
        self.assertFalse(missing.exists())
        with sqlite3.connect(self.database) as db:
            db.execute('CREATE TABLE late_refund_intents (order_id TEXT PRIMARY KEY,state TEXT NOT NULL)')
        before=hashlib.sha256(Path(self.database).read_bytes()).hexdigest()
        with self.assertRaisesRegex(Rejected,'refund-inspect-schema-invalid'):
            self.call('refund-inspect')
        with self.assertRaisesRegex(Rejected,'refund-review-schema-invalid'):
            self.call('refund-review-preflight',orderId='a'*32,generation=1)
        with self.assertRaisesRegex(Rejected,'refund-review-schema-invalid'):
            self.call('refund-review-status',work={'orderId':'a'*32,'generation':1})
        self.assertEqual(hashlib.sha256(Path(self.database).read_bytes()).hexdigest(),before)
        with sqlite3.connect(self.database) as db:
            columns={row[1] for row in db.execute('PRAGMA table_info(late_refund_intents)')}
        self.assertNotIn('command_started_at',columns)

    def test_refund_claim_lease_retry_and_stale_worker_are_fenced(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        self.assertEqual(claim['orderId'],old['id'])
        self.assertEqual(claim['provider'],'stripe')
        self.assertIsNone(self.call('refund-claim',now=1002))
        work={'orderId':old['id'],'generation':claim['generation']}
        with self.assertRaisesRegex(Rejected,'refund-work-fields'):
            self.call('refund-finish',now=1001,work=work,outcome='retry',reason='provider-timeout')
        finished=self.call('refund-finish',now=1001,work=work,outcome='retry',reason='preflight-read-unavailable')
        self.assertEqual(finished,{'state':'queued','nextAttempt':1061,'reason':'preflight-read-unavailable'})
        self.assertEqual(self.call('refund-inspect',now=1002)['deferred'],1)
        self.assertIsNone(self.call('refund-claim',now=1060))
        next_claim=self.call('refund-claim',now=1061)
        self.assertEqual(next_claim['generation'],claim['generation']+1)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=1061,work=work,outcome='review',reason='stale-worker')
        self.assertEqual(self.call('refund-finish',now=1061,
                         work={'orderId':old['id'],'generation':next_claim['generation']},
                         outcome='review',reason='provider-ambiguous')['state'],'review')
        self.assertIsNone(self.call('refund-claim',now=2000))

    def test_refund_claim_is_single_worker_and_reversal_cancels_active_lease(self):
        old=self.prepare('first');self.bind(old)
        paid=self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                       paymentId='pi_test',amountCents=20000,currency='USD')
        with ThreadPoolExecutor(max_workers=2) as pool:
            claims=list(pool.map(lambda _:self.call('refund-claim',now=1001),range(2)))
        self.assertEqual(sum(claim is not None for claim in claims),1)
        claim=next(claim for claim in claims if claim)
        Ledger(self.database,reservation_seconds=900).record_verified_reversal({
            'provider':'stripe','event_id':'evt-refund','order_id':old['id'],
            'customer':'buyer','payment_id':paid['payment_id'],
            'kind':'full-refund','provider_ref':'re_test','verified_at':1002},now=1002)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=1002,
                      work={'orderId':old['id'],'generation':claim['generation']},
                      outcome='review',reason='stale-provider-read')
        self.assertEqual(self.call('refund-inspect',now=1002)['counts']['succeeded'],1)

    def test_expired_refund_lease_cannot_finish_without_reclaim(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=claim['leaseUntil'],
                      work={'orderId':old['id'],'generation':claim['generation']},
                      outcome='review',reason='provider-ambiguous')
        reclaimed=self.call('refund-claim',now=claim['leaseUntil'])
        self.assertEqual(reclaimed['generation'],claim['generation']+1)

    def test_refund_command_marker_permits_read_only_recheck_not_another_command(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        work={'orderId':old['id'],'generation':claim['generation']}
        proof={'remoteId':'remote-'+old['id'],'paymentId':'pi_test'}
        for changed in ({'paymentId':'pi_other'},{'remoteId':'cs_other'}):
            with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
                self.call('refund-command-start',now=1001,work=work,proof={**proof,**changed})
        started=self.call('refund-command-start',now=1001,work=work,proof=proof)
        self.assertTrue(started['started'])
        self.assertRegex(started['idempotencyKey'],r'^[a-f0-9]{64}$')
        self.assertNotIn('idempotencyKey',claim)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=1002,work=work,proof=proof)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=1002,work=work,outcome='retry',reason='preflight-read-unavailable')
        finished=self.call('refund-finish',now=1002,work=work,
                           outcome='retry',reason='post-command-recheck')
        self.assertEqual(finished['state'],'queued')
        self.assertIsNone(self.call('refund-claim',now=finished['nextAttempt']-1))
        recheck=self.call('refund-claim',now=finished['nextAttempt'])
        self.assertTrue(recheck['commandStarted'])
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=finished['nextAttempt'],
                      work={'orderId':old['id'],'generation':recheck['generation']},proof=proof)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=finished['nextAttempt'],work=work,
                      outcome='review',reason='stale-worker')
        self.assertEqual(self.call('refund-inspect',now=finished['nextAttempt'])['counts']['processing'],1)

    def test_command_marker_requires_live_lease(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=claim['leaseUntil'],
                      work={'orderId':old['id'],'generation':claim['generation']},
                      proof={'remoteId':'remote-'+old['id'],'paymentId':'pi_test'})

    def test_verified_full_refund_resolves_ambiguous_command_review(self):
        old=self.prepare('first');self.bind(old)
        paid=self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                       paymentId='pi_test',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        work={'orderId':old['id'],'generation':claim['generation']}
        self.call('refund-command-start',now=1001,work=work,
                  proof={'remoteId':'remote-'+old['id'],'paymentId':'pi_test'})
        self.call('refund-finish',now=1002,work=work,outcome='review',reason='provider-ambiguous')
        self.assertEqual(self.call('refund-inspect',now=1002)['counts']['review'],1)
        Ledger(self.database,reservation_seconds=900).record_verified_reversal({
            'provider':'stripe','event_id':'evt-confirmed-refund','order_id':old['id'],
            'customer':'buyer','payment_id':paid['payment_id'],
            'kind':'full-refund','provider_ref':'re_test','verified_at':1003},now=1003)
        result=self.call('refund-inspect',now=1003)
        self.assertEqual(result['counts']['succeeded'],1)
        self.assertEqual(result['orders'][0]['fullRefundRecorded'],1)
        self.assertEqual(result['orders'][0]['commandStartedAt'],1001)

    def test_legacy_local_refund_intent_migrates_due_clock_without_loss(self):
        old=self.prepare('first');self.bind(old)
        paid=self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                       paymentId='pi_test',amountCents=20000,currency='USD')
        with sqlite3.connect(self.database) as db:
            db.execute('DROP TABLE late_refund_intents')
            db.execute('''CREATE TABLE late_refund_intents (
                order_id TEXT PRIMARY KEY,payment_id TEXT NOT NULL,state TEXT NOT NULL,
                created_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,
                generation INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,
                last_reason TEXT)''')
            db.execute("INSERT INTO late_refund_intents(order_id,payment_id,state,created_at) VALUES (?,?,'queued',1001)",
                       (old['id'],paid['payment_id']))
        Ledger(self.database,reservation_seconds=900)
        with sqlite3.connect(self.database) as db:
            row=db.execute('SELECT order_id,payment_id,state,next_attempt,command_started_at FROM late_refund_intents').fetchone()
            self.assertEqual(row,(old['id'],paid['payment_id'],'queued',0,None))
        self.assertEqual(self.call('refund-claim',now=1001)['orderId'],old['id'])

    def test_refund_retries_cap_at_audited_review(self):
        old=self.prepare('first');self.bind(old)
        self.call('settle',now=1001,orderId=old['id'],remoteId='remote-'+old['id'],
                  paymentId='pi_test',amountCents=20000,currency='USD')
        now=1001
        for attempt in range(1,9):
            work=self.call('refund-claim',now=now)
            self.assertEqual(work['attempts'],attempt)
            result=self.call('refund-finish',now=now,
                             work={'orderId':old['id'],'generation':work['generation']},
                             outcome='retry',reason='preflight-read-unavailable')
            if attempt<8:
                self.assertEqual(result['state'],'queued')
                now=result['nextAttempt']
            else:
                self.assertEqual(result['state'],'review')
                self.assertEqual(result['reason'],'refund-attempts-exhausted')
        self.assertIsNone(self.call('refund-claim',now=now+7200))

    def test_refund_outcome_atomically_revokes_only_claimed_paid_review_order(self):
        order=self.prepare('late-outcome');self.bind(order)
        self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_late',amountCents=20000,currency='USD')
        work=self.call('refund-claim',now=1001)
        token={'orderId':order['id'],'generation':work['generation']}
        proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late','providerRef':'re_final'}
        for changed in ({'paymentId':'pi_wrong'},{'remoteId':'cs_wrong'},{'providerRef':'wrong'}):
            with self.assertRaises(Rejected):
                self.call('refund-record-outcome',now=1002,work=token,proof={**proof,**changed})
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_reversals').fetchone()[0],0)
            self.assertEqual(db.execute('SELECT state FROM late_refund_intents').fetchone()[0],'processing')
        self.assertEqual(self.call('refund-record-outcome',now=1002,work=token,proof=proof)['state'],'succeeded')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT state FROM late_refund_intents').fetchone()[0],'succeeded')
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-record-outcome',now=1003,work=token,proof=proof)
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            Ledger(self.database,reservation_seconds=900).entitlement('buyer',order['id'],now=1003)

    def test_started_refund_command_expired_lease_reclaims_only_for_read_only_recheck(self):
        order=self.prepare('late-command');self.bind(order)
        self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_late',amountCents=20000,currency='USD')
        work=self.call('refund-claim',now=1001)
        token={'orderId':order['id'],'generation':work['generation']}
        marker=self.call('refund-command-start',now=1002,work=token,
                         proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'})
        self.assertEqual(len(marker['idempotencyKey']),64)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-record-outcome',now=work['leaseUntil'],work=token,
                      proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late','providerRef':'re_final'})
        recheck=self.call('refund-claim',now=work['leaseUntil'])
        self.assertTrue(recheck['commandStarted'])
        self.assertEqual(recheck['generation'],work['generation']+1)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=work['leaseUntil'],
                      work={'orderId':order['id'],'generation':recheck['generation']},
                      proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'})
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT state,last_reason FROM late_refund_intents').fetchone(),
                             ('processing',None))
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],0)

    def test_post_command_recheck_is_bounded_then_requires_review(self):
        order=self.prepare('late-recheck-cap');self.bind(order)
        paid=self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                       paymentId='pi_late',amountCents=20000,currency='USD')
        claim=self.call('refund-claim',now=1001)
        self.call('refund-command-start',now=1001,
                  work={'orderId':order['id'],'generation':claim['generation']},
                  proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'})
        now=1002
        for attempt in range(1,9):
            self.assertEqual(claim['attempts'],attempt)
            finished=self.call('refund-finish',now=now,
                work={'orderId':order['id'],'generation':claim['generation']},
                outcome='retry',reason='post-command-recheck')
            if attempt==8:
                self.assertEqual(finished['state'],'review')
                self.assertEqual(finished['reason'],'refund-recheck-attempts-exhausted')
                break
            self.assertEqual(finished['state'],'queued')
            now=finished['nextAttempt']
            claim=self.call('refund-claim',now=now)
            self.assertTrue(claim['commandStarted'])
        self.assertIsNone(self.call('refund-claim',now=now+3600))
        self.assertEqual(self.call('refund-inspect',now=now)['counts']['review'],1)
        # A later signed, freshly verified D3 event may still resolve the
        # exhausted D2 read loop; the stopped worker must not issue another POST.
        Ledger(self.database,reservation_seconds=900).record_verified_reversal({
            'provider':'stripe','event_id':'evt-late-final','order_id':order['id'],
            'customer':'buyer','payment_id':paid['payment_id'],
            'kind':'full-refund','provider_ref':'re_final','verified_at':now+3601},now=now+3601)
        self.assertEqual(self.call('refund-inspect',now=now+3601)['counts']['succeeded'],1)

    def test_operator_recheck_claim_is_exact_audited_and_command_fenced(self):
        order=self.prepare('late-operator-recheck');self.bind(order)
        paid=self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                       paymentId='pi_late',amountCents=20000,currency='USD')
        first=self.call('refund-claim',now=1001)
        token={'orderId':order['id'],'generation':first['generation']}
        proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'}
        self.call('refund-command-start',now=1001,work=token,proof=proof)
        self.call('refund-finish',now=1002,work=token,outcome='review',
                  reason='refund-recheck-attempts-exhausted')
        preflight={'orderId':order['id'],'generation':first['generation']}
        before=hashlib.sha256(Path(self.database).read_bytes()).hexdigest()
        self.assertEqual(self.call('refund-review-preflight',now=1003,**preflight),{'eligible':True})
        self.assertEqual(hashlib.sha256(Path(self.database).read_bytes()).hexdigest(),before)
        with self.assertRaisesRegex(Rejected,'refund-review-conflict'):
            self.call('refund-review-claim',now=1003,**{**preflight,'generation':99},
                      operatorRef='operator_one')
        claimed=self.call('refund-review-claim',now=1003,**preflight,operatorRef='operator_one')
        self.assertTrue(claimed['commandStarted'])
        self.assertEqual(claimed['generation'],first['generation']+1)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=1003,
                      work={'orderId':order['id'],'generation':claimed['generation']},proof=proof)
        with self.assertRaisesRegex(Rejected,'refund-review-conflict'):
            self.call('refund-review-claim',now=1003,**preflight,operatorRef='operator_two')
        second_token={'orderId':order['id'],'generation':claimed['generation']}
        self.call('refund-finish',now=1003,work=second_token,outcome='review',
                  reason='operator-recheck-inconclusive')
        self.assertEqual(self.call('refund-review-preflight',now=1003,**preflight),{'eligible':False})
        self.assertEqual(self.call('refund-review-preflight',now=1003,orderId=order['id'],
                         generation=claimed['generation']),{'eligible':True})
        final=self.call('refund-review-claim',now=1004,orderId=order['id'],
                        generation=claimed['generation'],operatorRef='operator_two')
        self.assertEqual(self.call('refund-record-outcome',now=1004,
            work={'orderId':order['id'],'generation':final['generation']},
            proof={**proof,'providerRef':'re_final'})['state'],'succeeded')
        with sqlite3.connect(self.database) as db:
            actions=db.execute('''SELECT generation,operator_ref,outcome,reason,provider_ref
                FROM refund_review_actions ORDER BY generation''').fetchall()
            self.assertEqual(actions,[(2,'operator_one','review','operator-recheck-inconclusive',None),
                                      (3,'operator_two','full-refund',None,'re_final')])
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],1)
        self.assertEqual(self.call('refund-review-preflight',now=1004,orderId=order['id'],
                         generation=final['generation']),{'eligible':False})
        self.assertEqual(paid['payment_id'],self.call('get',customer='buyer',
                         orderId=order['id'])['payment_id'])

    def test_expired_operator_recheck_lease_can_be_reclaimed_without_a_command(self):
        order=self.prepare('late-operator-crash');self.bind(order)
        self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_late',amountCents=20000,currency='USD')
        first=self.call('refund-claim',now=1001)
        token={'orderId':order['id'],'generation':first['generation']}
        proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'}
        self.call('refund-command-start',now=1001,work=token,proof=proof)
        self.call('refund-finish',now=1001,work=token,outcome='review',
                  reason='refund-recheck-attempts-exhausted')
        action=self.call('refund-review-claim',now=1002,orderId=order['id'],
                         generation=first['generation'],operatorRef='operator_one')
        selector={'orderId':order['id'],'generation':action['generation']}
        self.assertEqual(self.call('refund-review-preflight',now=action['leaseUntil']-1,
                         **selector),{'eligible':False})
        self.assertEqual(self.call('refund-review-preflight',now=action['leaseUntil'],
                         **selector),{'eligible':True})
        reclaimed=self.call('refund-review-claim',now=action['leaseUntil'],
                            **selector,operatorRef='operator_two')
        self.assertTrue(reclaimed['commandStarted'])
        self.assertEqual(reclaimed['generation'],action['generation']+1)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-command-start',now=action['leaseUntil'],
                work={'orderId':order['id'],'generation':reclaimed['generation']},proof=proof)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('''SELECT operator_ref,outcome FROM refund_review_actions
                ORDER BY generation''').fetchall(),
                [('operator_one','lease-expired'),('operator_two','claimed')])

    def test_signed_full_refund_finishes_an_active_operator_recheck_audit(self):
        order=self.prepare('late-operator-event');self.bind(order)
        paid=self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                       paymentId='pi_late',amountCents=20000,currency='USD')
        first=self.call('refund-claim',now=1001)
        token={'orderId':order['id'],'generation':first['generation']}
        self.call('refund-command-start',now=1001,work=token,
                  proof={'remoteId':'remote-'+order['id'],'paymentId':'pi_late'})
        self.call('refund-finish',now=1001,work=token,outcome='review',
                  reason='refund-recheck-attempts-exhausted')
        action=self.call('refund-review-claim',now=1002,orderId=order['id'],
                         generation=first['generation'],operatorRef='operator_one')
        selector={'orderId':order['id'],'generation':action['generation']}
        self.assertEqual(self.call('refund-review-status',now=1002,work=selector),
                         {'verifiedFullRefund':False})
        Ledger(self.database,reservation_seconds=900).record_verified_reversal({
            'provider':'stripe','event_id':'evt-refund-during-review','order_id':order['id'],
            'customer':'buyer','payment_id':paid['payment_id'],
            'kind':'full-refund','provider_ref':'re_event','verified_at':1003},now=1003)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('''SELECT outcome,provider_ref FROM refund_review_actions
                WHERE order_id=?''',(order['id'],)).fetchone(),('full-refund','re_event'))
        before=hashlib.sha256(Path(self.database).read_bytes()).hexdigest()
        self.assertEqual(self.call('refund-review-status',now=1003,work=selector),
                         {'verifiedFullRefund':True})
        self.assertEqual(self.call('refund-review-status',now=1003,
                         work={**selector,'generation':selector['generation']+1}),
                         {'verifiedFullRefund':False})
        self.assertEqual(hashlib.sha256(Path(self.database).read_bytes()).hexdigest(),before)
        with self.assertRaisesRegex(Rejected,'refund-work-conflict'):
            self.call('refund-finish',now=1003,
                      work={'orderId':order['id'],'generation':action['generation']},
                      outcome='review',reason='operator-recheck-inconclusive')

    def test_successor_insert_failure_rolls_back_terminal_close(self):
        old=self.prepare('first');self.bind(old)
        with sqlite3.connect(self.database) as db:
            db.execute('''CREATE TRIGGER fail_replacement BEFORE INSERT ON sdk_attempts
                BEGIN SELECT RAISE(ABORT,'replacement-insert-failure'); END''')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'replacement-insert-failure'):
            self.replacement(old)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT status FROM orders WHERE id=?',(old['id'],)).fetchone()[0],'pending')
            self.assertEqual(db.execute('SELECT count(*) FROM orders').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM sdk_terminal_unpaid').fetchone()[0],0)

    def test_signed_refund_claim_atomically_revokes_only_bound_paid_order(self):
        order=self.prepare('refund-bound');self.bind(order)
        self.call('settle',now=101,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_paid',amountCents=20000,currency='USD')
        self.assertEqual(self.call('event-find-payment-order',now=102,provider='stripe',
                         account='acct_test',environment='sandbox',paymentId='pi_paid')['id'],order['id'])
        self.assertIsNone(self.call('event-find-payment-order',now=102,provider='stripe',
                         account='wrong',environment='sandbox',paymentId='pi_paid'))
        self.call('event-receive',now=102,event={'provider':'stripe','account':'acct_test',
                  'environment':'sandbox','eventId':'evt_refund','eventType':'refund.updated',
                  'resourceId':'re_exact','resourceKind':'refund'})
        event=self.call('event-claim',now=102)
        proof={'orderId':order['id'],'remoteId':'remote-'+order['id'],
               'paymentId':'pi_paid','providerRef':'re_exact','kind':'full-refund'}
        for changed in ({'paymentId':'pi_other'},{'providerRef':'re_other'},
                        {'remoteId':'cs_wrong'},
                        {'orderId':'missing'}):
            with self.assertRaises(Rejected):
                self.call('event-record-reversal',now=103,event=event,proof={**proof,**changed})
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_reversals').fetchone()[0],0)
            self.assertEqual(db.execute('SELECT state FROM sdk_event_inbox').fetchone()[0],'processing')
        self.assertEqual(self.call('event-record-reversal',now=103,event=event,proof=proof)['state'],'done')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT state FROM sdk_event_inbox').fetchone()[0],'done')
        self.assertEqual(self.call('get',now=104,orderId=order['id'])['access_revoked'],1)
        self.assertEqual(self.call('list',now=104)['orders'][0]['access_revoked'],1)
        self.call('event-receive',now=105,event={'provider':'stripe','account':'acct_test',
                  'environment':'sandbox','eventId':'evt_refund_second','eventType':'refund.updated',
                  'resourceId':'re_exact','resourceKind':'refund'})
        second=self.call('event-claim',now=105)
        self.assertEqual(self.call('event-record-reversal',now=105,event=second,proof=proof)['state'],'done')
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM payment_reversals').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],1)
        with self.assertRaisesRegex(Rejected,'not-owned'):
            self.call('get',customer='other',now=104,orderId=order['id'])
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            Ledger(self.database,reservation_seconds=900).entitlement('buyer',order['id'],now=104)

    def test_owned_late_refund_reads_project_intent_and_verified_reversal_only(self):
        order=self.prepare('late-status');self.bind(order)
        self.call('settle',now=1001,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_late_status',amountCents=20000,currency='USD')
        queued=self.call('get',now=1001,orderId=order['id'])
        self.assertEqual((queued['status'],queued['late_refund_state'],queued['full_refund_recorded']),
                         ('paid-review','queued',0))
        self.assertEqual(self.call('list',now=1001)['orders'][0]['late_refund_state'],'queued')
        self.assertEqual(self.call('list',customer='other',now=1001)['orders'],[])
        with self.assertRaisesRegex(Rejected,'not-owned'):
            self.call('get',customer='other',now=1001,orderId=order['id'])
        work=self.call('refund-claim',now=1001)
        checking=self.call('get',now=1002,orderId=order['id'])
        self.assertEqual((checking['late_refund_state'],checking['late_refund_lease_until']),
                         ('processing',work['leaseUntil']))
        self.call('refund-finish',now=1002,
                  work={'orderId':order['id'],'generation':work['generation']},
                  outcome='review',reason='refund-proof-review')
        self.assertEqual(self.call('list',now=1003)['orders'][0]['late_refund_state'],'review')

    def test_reversal_fencing_and_partial_review_preserve_access(self):
        order=self.prepare('refund-partial');self.bind(order)
        self.call('settle',now=101,orderId=order['id'],remoteId='remote-'+order['id'],
                  paymentId='pi_paid',amountCents=20000,currency='USD')
        self.call('event-receive',now=102,event={'provider':'stripe','account':'acct_test',
                  'environment':'sandbox','eventId':'evt_partial','eventType':'refund.created',
                  'resourceId':'re_partial','resourceKind':'refund'})
        first=self.call('event-claim',now=102)
        proof={'orderId':order['id'],'remoteId':'remote-'+order['id'],
               'paymentId':'pi_paid','providerRef':'re_partial','kind':'partial-refund'}
        with self.assertRaisesRegex(Rejected,'event-work-conflict'):
            self.call('event-record-reversal',now=162,event=first,proof=proof)
        newer=self.call('event-claim',now=163)
        with self.assertRaisesRegex(Rejected,'event-work-conflict'):
            self.call('event-record-reversal',now=163,event=first,proof=proof)
        self.assertEqual(self.call('event-record-reversal',now=163,event=newer,proof=proof)['state'],'review')
        self.assertTrue(Ledger(self.database,reservation_seconds=900).entitlement('buyer',order['id'],now=164)['download_allowed'])
        self.assertEqual(self.call('get',now=164,orderId=order['id'])['access_revoked'],0)
        self.assertEqual(self.call('list',now=164)['orders'][0]['access_revoked'],0)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM access_revocations').fetchone()[0],0)

    def test_paypal_refund_event_is_atomically_bound_to_paid_capture_and_refund_id(self):
        order=self.call('prepare',requestKey='paypal-refund',provider='paypal',
                        account='MERCHANT123',amountCents=20000,
                        terms={'amountCents':20000,'currency':'USD'})
        self.bind(order)
        remote='remote-'+order['id']
        self.call('settle',now=101,orderId=order['id'],remoteId=remote,
                  paymentId='CAPTURE123',amountCents=20000,currency='USD')
        self.assertEqual(self.call('event-find-payment-order',now=102,provider='paypal',
                         account='MERCHANT123',environment='sandbox',
                         paymentId='CAPTURE123')['id'],order['id'])
        self.assertIsNone(self.call('event-find-payment-order',now=102,provider='paypal',
                         account='OTHER',environment='sandbox',paymentId='CAPTURE123'))
        proof={'orderId':order['id'],'remoteId':remote,'paymentId':'CAPTURE123',
               'providerRef':'REFUND123','kind':'full-refund'}
        def receive(event_id,resource_kind='refund'):
            self.call('event-receive',now=102,event={'provider':'paypal','account':'MERCHANT123',
                      'environment':'sandbox','eventId':event_id,
                      'eventType':'PAYMENT.CAPTURE.REFUNDED',
                      'resourceId':'REFUND123','resourceKind':resource_kind})
        receive('WH-WRONG','capture')
        wrong=self.call('event-claim',now=102)
        with self.assertRaisesRegex(Rejected,'event-refund-mismatch'):
            self.call('event-record-reversal',now=103,event=wrong,proof=proof)
        self.call('event-finish',now=103,event=wrong,outcome='review',reason='event-policy-review')
        receive('WH-REFUND')
        first=self.call('event-claim',now=103)
        for change in ({'paymentId':'OTHER'},{'providerRef':'OTHER'},
                       {'remoteId':'OTHER'},{'kind':'lost-dispute'}):
            with self.assertRaises(Rejected):
                self.call('event-record-reversal',now=104,event=first,proof={**proof,**change})
        with self.assertRaisesRegex(Rejected,'event-work-conflict'):
            self.call('event-record-reversal',now=163,event=first,proof=proof)
        newer=self.call('event-claim',now=164)
        with self.assertRaisesRegex(Rejected,'event-work-conflict'):
            self.call('event-record-reversal',now=164,event=first,proof=proof)
        self.assertEqual(self.call('event-record-reversal',now=164,event=newer,proof=proof)['state'],'done')
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            Ledger(self.database,reservation_seconds=900).entitlement('buyer',order['id'],now=165)

    def test_paypal_partial_refund_event_enters_review_without_revocation(self):
        order=self.call('prepare',requestKey='paypal-partial',provider='paypal',
                        account='MERCHANT123',amountCents=20000,
                        terms={'amountCents':20000,'currency':'USD'})
        self.bind(order)
        remote='remote-'+order['id']
        self.call('settle',now=101,orderId=order['id'],remoteId=remote,
                  paymentId='CAPTURE456',amountCents=20000,currency='USD')
        self.call('event-receive',now=102,event={'provider':'paypal','account':'MERCHANT123',
                  'environment':'sandbox','eventId':'WH-PARTIAL',
                  'eventType':'PAYMENT.CAPTURE.REFUNDED',
                  'resourceId':'REFUND456','resourceKind':'refund'})
        event=self.call('event-claim',now=102)
        proof={'orderId':order['id'],'remoteId':remote,'paymentId':'CAPTURE456',
               'providerRef':'REFUND456','kind':'partial-refund'}
        self.assertEqual(self.call('event-record-reversal',now=103,event=event,proof=proof)['state'],'review')
        self.assertTrue(Ledger(self.database,reservation_seconds=900)
                        .entitlement('buyer',order['id'],now=104)['download_allowed'])

    def test_orders_refund_event_requires_exact_order_payment_and_refund_binding(self):
        oid='ORD'+'A'*29;pid='PAY'+'B'*29;rid='REF'+'C'*29
        order=self.call('prepare',requestKey='orders-refund',provider='mercadopago',
                        account='123',amountCents=20000,
                        terms={'amountCents':102000,'currency':'BRL',
                               'providerApi':'orders-v1','payerEmail':'buyer@example.test'})
        claim=self.call('claim',orderId=order['id'])
        self.call('bind',orderId=order['id'],remoteId=oid,
                  response={'remoteId':oid},generation=claim['generation'])
        self.call('settle',now=101,orderId=order['id'],remoteId=oid,
                  paymentId=pid,amountCents=102000,currency='BRL')
        self.call('event-receive',now=102,event={'provider':'mercadopago','account':'123',
                  'environment':'sandbox','eventId':'orders-refund-event',
                  'eventType':'order.notification','resourceId':oid,'resourceKind':'order'})
        event=self.call('event-claim',now=102)
        proof={'orderId':order['id'],'remoteId':oid,'paymentId':pid,
               'providerRef':pid+':'+rid,'kind':'full-refund'}
        for changed in ({'paymentId':'PAY'+'D'*29},{'remoteId':'ORD'+'D'*29},
                        {'providerRef':pid+':REF'+'D'*25},
                        {'providerRef':'PAY'+'D'*29+':'+rid}):
            with self.assertRaises(Rejected):
                self.call('event-record-reversal',now=103,event=event,
                          proof={**proof,**changed})
        self.assertEqual(self.call('event-record-reversal',now=103,event=event,
                                   proof=proof)['state'],'done')
        with self.assertRaisesRegex(Rejected,'delivery-not-authorized'):
            Ledger(self.database,reservation_seconds=900).entitlement('buyer',order['id'],now=104)


if __name__=='__main__':unittest.main()
