import dataclasses
import json
import multiprocessing as mp
import os
from pathlib import Path
import signal
import sqlite3
import tempfile
import unittest
from store import Store, StoreFailure, reference, canonical, digest

class Clock:
    def __init__(self, now=0, boot='test-boot'):
        self.now, self.boot = now, boot
    def __call__(self): return self.boot, self.now

def fixture(continuation='retry'):
    d = reference.plan_workflow_recovery(workflow_id='flow', workflow_execution_id='run', failure_occurrence_id='failure', failed_step_id='ship', completed_step_ids=('reserve','charge'), orchestrated_operation_ids=('release','refund'), mappings=(reference.RecoveryOperationMapping('reserve','release'),reference.RecoveryOperationMapping('charge','refund')))
    intent=json.loads(canonical(dataclasses.asdict(d.recovery_intent)))
    bindings=[{'occurrence_id':e['plan_occurrence_id'],'binding_digest':'b'*64,'payload':{'amount':1},'continuation':continuation,'policy_ref':'r01-local-retry-v1'} for e in intent['plan']]
    return intent,bindings

def dump(path):
    with sqlite3.connect(path) as c:
        names=[r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
        return {n:c.execute('SELECT * FROM '+n+' ORDER BY rowid').fetchall() for n in names}

def race(path, barrier, queue, label):
    try:
        s=Store(path,'coordination',Clock())
        barrier.wait(timeout=5)
        r=s.acquire('acquire-'+label,'dispatch',0,'claim-'+label,label,'lease-'+label)
        queue.put(('ok',r))
    except StoreFailure as e: queue.put(('reject',e.code))
    except BaseException as e: queue.put(('error',repr(e)))

def crash(path, pipe, when):
    class KillStore(Store):
        def _before_commit(self):
            if when=='before':
                pipe.send('at-barrier')
                signal.pause()
        def _after_commit(self):
            if when=='after':
                pipe.send('at-barrier')
                signal.pause()
    s=KillStore(path,'coordination',Clock())
    s.acquire('crash-transition','dispatch',0,'crash-claim','worker','crash-lease')

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='r03-test-')
        self.path=Path(self.tmp.name)/'coordination.sqlite'
        self.clock=Clock()
        self.s=Store.initialize(self.path,'coordination',self.clock)
        self.intent,self.bindings=fixture()
        self.r=self.s.register('register','dispatch',self.intent,self.bindings)
    def tearDown(self):self.tmp.cleanup()
    def rejected(self,code,fn):
        before=dump(self.path)
        with self.assertRaises(StoreFailure) as cm:fn()
        self.assertEqual(cm.exception.code,code)
        self.assertEqual(dump(self.path),before)
    def acquire(self):
        self.r=self.s.acquire('acquire','dispatch',0,'claim','worker','lease')
        self.auth=self.r['authority']
    def start(self,tid='start',attempt='attempt'):
        self.r=self.s.start(tid,'dispatch',self.r['version'],self.auth,attempt)
    def finish(self,outcome='succeeded',tid='finish',attempt='attempt'):
        evidence={'invocation_id':self.r.get('invocation_id',self.intent['plan'][0]['invocation_identity']),'result_digest':'c'*64}
        self.r=self.s.outcome(tid,'dispatch',self.r['version'],self.auth,attempt,outcome,evidence)
    def test_registration_reopen_and_identity(self):
        loaded=Store(self.path,'coordination',self.clock).load('dispatch')
        self.assertEqual(loaded['intent'],self.intent)
        self.assertEqual(loaded['dispatch']['version'],0)
        self.assertEqual(len(loaded['occurrences']),2)
        before=dump(self.path)
        self.assertTrue(self.s.register('same','dispatch',self.intent,self.bindings)['existing'])
        self.assertEqual(dump(self.path),before)
    def test_duplicate_failure_mismatch(self):
        changed=json.loads(canonical(self.bindings));changed[0]['payload']['amount']=2
        self.rejected('DUPLICATE_FAILURE_MISMATCH',lambda:self.s.register('other','dispatch',self.intent,changed))
    def test_missing_binding(self):
        self.rejected('BINDING_COVERAGE',lambda:self.s.register('other','dispatch',self.intent,self.bindings[:1]))
    def test_plan_tamper(self):
        changed=json.loads(canonical(self.intent));changed['plan'][0]['invocation_identity']='f'*64
        before=dump(self.path)
        with self.assertRaises(reference.WorkflowRecoveryError):self.s.register('other','dispatch',changed,self.bindings)
        self.assertEqual(dump(self.path),before)
    def test_version_conflict(self):
        self.acquire()
        self.rejected('VERSION_CONFLICT',lambda:self.s.acquire('other','dispatch',0,'other','worker2','lease2'))
    def test_current_claim_rejected(self):
        self.acquire()
        self.rejected('CLAIM_ACTIVE',lambda:self.s.acquire('other','dispatch',1,'other','worker2','lease2'))
    def test_stale_claim_and_takeover_unknown(self):
        self.acquire();self.start()
        old=self.auth;self.clock.now=5000
        self.r=self.s.acquire('takeover','dispatch',2,'new','worker2','new-lease');self.auth=self.r['authority']
        self.assertEqual(self.auth['fence'],2)
        self.assertEqual(dump(self.path)['attempts'][0][9],'unknown')
        self.rejected('CLAIM_INVALID',lambda:self.s.outcome('stale','dispatch',3,old,'attempt','succeeded',{'invocation_id':self.intent['plan'][0]['invocation_identity'],'result_digest':'c'*64}))
    def test_lease_generation(self):
        self.acquire();old=self.auth
        self.r=self.s.renew('renew','dispatch',1,self.auth,'lease2');self.auth=self.r['authority']
        self.rejected('LEASE_GENERATION',lambda:self.s.start('stale','dispatch',2,old,'attempt'))
        self.assertEqual(dump(self.path)['attempts'],[])
    def test_exact_expiry_and_no_attempt(self):
        self.acquire();self.clock.now=5000
        self.rejected('LEASE_EXPIRED',lambda:self.s.start('start','dispatch',1,self.auth,'attempt'))
    def test_expiry_during_transaction_rolls_back(self):
        self.acquire();before=dump(self.path)
        class Expire(Store):
            def _before_commit(inner): self.clock.now=5000
        s=Expire(self.path,'coordination',self.clock)
        with self.assertRaises(StoreFailure):s.start('start','dispatch',1,self.auth,'attempt')
        self.assertEqual(dump(self.path),before)
    def test_partial_progress_rollback(self):
        self.acquire();self.start();before=dump(self.path)
        class Fail(Store):
            def _before_commit(self):raise RuntimeError('injected after progress and outbox writes')
        s=Fail(self.path,'coordination',self.clock)
        with self.assertRaises(RuntimeError):s.outcome('finish','dispatch',2,self.auth,'attempt','succeeded',{'invocation_id':self.r['invocation_id'],'result_digest':'c'*64})
        self.assertEqual(dump(self.path),before)
    def test_progress_outbox_and_lookup(self):
        self.acquire();self.start();self.finish()
        state=dump(self.path)
        self.assertEqual(len(state['progress']),1)
        self.assertEqual(len(state['transitions']),4)
        self.assertEqual(len(state['dispatch_outbox']),4)
        self.assertEqual(self.s.lookup_transition('finish',self.r['command_digest']),self.r)
        self.rejected('COMMAND_MISMATCH',lambda:self.s.lookup_transition('finish','0'*64))
        self.rejected('DUPLICATE_TRANSITION',lambda:self.s.start('finish','dispatch',3,self.auth,'second'))
    def test_retry_not_before_and_budget(self):
        self.acquire()
        for n in range(1,4):
            self.start('start'+str(n),'a'+str(n));self.finish('failed','finish'+str(n),'a'+str(n))
            if n<3:
                self.r=self.s.schedule('schedule'+str(n),'dispatch',self.r['version'],self.auth)
                self.rejected('RETRY_NOT_ELIGIBLE',lambda:self.s.start('early','dispatch',self.r['version'],self.auth,'early'))
                self.clock.now+=1000
        self.rejected('BUDGET_EXHAUSTED',lambda:self.s.schedule('extra','dispatch',self.r['version'],self.auth))
        self.r=self.s.terminal('terminal','dispatch',self.r['version'],self.auth,'exhausted')
        self.rejected('TERMINAL',lambda:self.s.start('after','dispatch',self.r['version'],self.auth,'after'))
    def test_completion_requires_all_progress(self):
        self.acquire();self.start();self.finish()
        self.rejected('INCOMPLETE_RECOVERY',lambda:self.s.terminal('early','dispatch',self.r['version'],self.auth,'completed'))
        self.start('start2','attempt2');self.finish('succeeded','finish2','attempt2')
        self.r=self.s.terminal('terminal','dispatch',self.r['version'],self.auth,'completed')
        self.assertEqual(dump(self.path)['terminals'][0][2],'satisfied')
    def test_wrong_result_identity(self):
        self.acquire();self.start()
        self.rejected('RESULT_IDENTITY',lambda:self.s.outcome('wrong','dispatch',2,self.auth,'attempt','succeeded',{'invocation_id':'wrong','result_digest':'c'*64}))
    def test_malformed_authority_rejected(self):
        self.acquire()
        self.rejected('AUTHORITY_TYPE',lambda:self.s.start('bad','dispatch',1,{**self.auth,'fence':True},'attempt'))
    def test_unknown_reconciliation_preserves_attempt(self):
        self.acquire();self.start();self.clock.now=5000
        self.r=self.s.acquire('takeover','dispatch',2,'new','worker2','new-lease');self.auth=self.r['authority']
        row=self.s.load('dispatch')['occurrences'][0]
        evidence={k:row[k] for k in ['invocation_id','binding_digest','payload_digest']}
        evidence.update(result_json={'ok':True},result_digest=digest({'ok':True}))
        self.r=self.s.reconcile('reconcile','dispatch',3,self.auth,evidence)
        self.assertEqual(dump(self.path)['attempts'][0][9],'unknown')
        self.assertEqual(len(dump(self.path)['progress']),1)
        self.start('next','next-attempt')
        self.assertEqual(self.r['occurrence_id'],self.intent['plan'][1]['plan_occurrence_id'])
    def test_duplicate_attempt_rolls_back(self):
        self.acquire();self.start();self.finish()
        before=dump(self.path)
        with self.assertRaises(StoreFailure):self.s.start('duplicate','dispatch',3,self.auth,'attempt')
        self.assertEqual(dump(self.path),before)

    def test_readonly_mismatch_preserves_database(self):
        before=self.path.read_bytes()
        with self.assertRaises(StoreFailure):Store(self.path,'wrong-resource',self.clock)
        self.clock.boot='different-boot'
        with self.assertRaises(StoreFailure):Store(self.path,'coordination',self.clock)
        self.assertEqual(self.path.read_bytes(),before)
    def test_schema_mismatch_does_not_reinitialize(self):
        with sqlite3.connect(self.path) as c:c.execute('PRAGMA user_version=2')
        before=self.path.read_bytes()
        with self.assertRaises(StoreFailure):Store(self.path,'coordination',self.clock)
        self.assertEqual(self.path.read_bytes(),before)
    def test_clock_regression(self):
        self.clock.now=100;self.acquire();self.clock.now=99
        self.rejected('CLOCK_REGRESSION',lambda:self.s.load('dispatch'))
    def test_busy_writer_preserves_prior_state(self):
        before=dump(self.path)
        with sqlite3.connect(self.path,autocommit=True) as con:
            con.execute('BEGIN IMMEDIATE')
            with self.assertRaises(StoreFailure) as cm:self.s.acquire('acquire','dispatch',0,'c','w','l')
            self.assertEqual(cm.exception.classification,'retryable')
            con.execute('ROLLBACK')
        self.assertEqual(dump(self.path),before)
    def test_concurrent_processes(self):
        ctx=mp.get_context('fork');barrier=ctx.Barrier(2);queue=ctx.Queue()
        ps=[ctx.Process(target=race,args=(self.path,barrier,queue,str(i))) for i in range(2)]
        try:
            for p in ps:p.start()
            outcomes=[queue.get(timeout=10) for _ in ps]
            for p in ps:p.join(timeout=5);self.assertEqual(p.exitcode,0)
            self.assertEqual(sorted(x[0] for x in outcomes),['ok','reject'])
            self.assertEqual(dump(self.path)['dispatches'][0][3],1)
            self.assertEqual(len(dump(self.path)['dispatch_outbox']),2)
        finally:
            for p in ps:
                if p.is_alive():p.kill();p.join()
            queue.close()
    def test_sigkill_before_and_after_commit(self):
        before=dump(self.path)
        for when in ['before','after']:
            ctx=mp.get_context('fork');parent,child=ctx.Pipe(False)
            p=ctx.Process(target=crash,args=(self.path,child,when))
            try:
                p.start();child.close()
                self.assertTrue(parent.poll(10));self.assertEqual(parent.recv(),'at-barrier')
                p.kill();p.join(5);self.assertEqual(p.exitcode,-signal.SIGKILL)
                s=Store(self.path,'coordination',self.clock)
                if when=='before':self.assertEqual(dump(self.path),before)
                else:
                    state=dump(self.path)
                    self.assertEqual(state['dispatches'][0][3],1)
                    self.assertEqual(len(state['transitions']),2);self.assertEqual(len(state['dispatch_outbox']),2)
                    row=state['transitions'][-1]
                    self.assertEqual(s.lookup_transition(row[0],row[3])['transition_id'],'crash-transition')
            finally:
                if p.is_alive():p.kill();p.join()
                parent.close()

if __name__=='__main__':unittest.main(verbosity=2)
