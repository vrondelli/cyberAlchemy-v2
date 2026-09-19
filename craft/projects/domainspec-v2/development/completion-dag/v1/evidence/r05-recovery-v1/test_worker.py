import dataclasses
import json
import multiprocessing as mp
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from worker import Worker, WorkerFailure, coordination as c, operation as o

class Clock:
    def __init__(self): self.now = 0
    def __call__(self): return 'test-boot', self.now

class SharedClock:
    def __init__(self, value): self.value = value
    def __call__(self): return 'test-boot', self.value.value

def fixture():
    decision = c.reference.plan_workflow_recovery(workflow_id='flow', workflow_execution_id='run',
        failure_occurrence_id='failure', failed_step_id='ship', completed_step_ids=('reserve','charge'),
        orchestrated_operation_ids=('adjust-balance',), mappings=(
            c.reference.RecoveryOperationMapping('reserve','adjust-balance'),
            c.reference.RecoveryOperationMapping('charge','adjust-balance')))
    intent = json.loads(c.canonical(dataclasses.asdict(decision.recovery_intent)))
    bindings = [{'occurrence_id':e['plan_occurrence_id'], 'binding_digest':o.BINDING_DIGEST,
        'payload':{'subject_id':'account','delta':-10}, 'continuation':'retry',
        'policy_ref':'r01-local-retry-v1'} for e in intent['plan']]
    return intent, bindings

def dump(path):
    with sqlite3.connect(path) as db:
        names = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
        return {n:db.execute('SELECT * FROM '+n+' ORDER BY rowid').fetchall() for n in names}

def race(cp, op, barrier, queue, label):
    try:
        worker = Worker(cp, op, label, Clock())
        barrier.wait(5)
        result = worker.acquire('dispatch')
        queue.put(('ok', result['authority']))
    except c.StoreFailure as error: queue.put(('reject', error.code))
    except BaseException as error: queue.put(('error', repr(error)))

def late(cp, op, value, pipe):
    class PausedWorker(Worker):
        def _after_operation(self):
            pipe.send('committed')
            if not pipe.poll(10): raise RuntimeError('release timeout')
            pipe.recv()
    try:
        worker = PausedWorker(cp, op, 'old-worker', SharedClock(value))
        worker.acquire('dispatch')
        pipe.send(worker.run_one())
    except BaseException as error: pipe.send({'error':repr(error)})

class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='r05-worker-')
        self.cp, self.op = [Path(self.tmp.name)/name for name in ('coordination.sqlite','operation.sqlite')]
        self.clock = Clock()
        self.store = c.Store.initialize(self.cp, 'coordination', self.clock)
        o.Ledger.initialize(self.op, {'account':100})
        self.intent, self.bindings = fixture()
    def tearDown(self): self.tmp.cleanup()
    def register(self): self.store.register('register', 'dispatch', self.intent, self.bindings)
    def worker(self): return Worker(self.cp, self.op, 'worker', self.clock)
    def balance(self):
        with sqlite3.connect(self.op) as db:
            return db.execute('SELECT value FROM business_state').fetchone()[0]
    def test_ordered_occurrences_have_unique_attempts_and_identities(self):
        self.register(); worker = self.worker(); worker.acquire('dispatch')
        first, second = worker.run_one(), worker.run_one()
        self.assertEqual([first['status'],second['status']], ['succeeded','succeeded'])
        self.assertNotEqual(first['attempt_id'],second['attempt_id'])
        self.assertNotEqual(first['evidence']['invocation_id'],second['evidence']['invocation_id'])
        self.assertEqual([first['evidence']['invocation_id'],second['evidence']['invocation_id']],
                         [e['invocation_identity'] for e in self.intent['plan']])
        before = (dump(self.cp),dump(self.op))
        self.assertEqual(worker.run_one(), {'status':'progress-complete','terminal_recorded':False})
        self.assertEqual(before,(dump(self.cp),dump(self.op)))
        self.assertEqual(self.balance(),80)
        self.assertEqual(len(self.store.load('dispatch')['progress']),2)
        self.assertEqual(dump(self.cp)['terminals'],[])
    def test_missing_later_binding_stops_before_claim_and_invocation(self):
        self.bindings[1]['binding_digest'] = 'b'*64
        self.register(); before = (dump(self.cp),dump(self.op))
        with self.assertRaises(WorkerFailure) as cm:self.worker().acquire('dispatch')
        self.assertEqual(cm.exception.code,'BINDING_UNAVAILABLE')
        self.assertEqual(before,(dump(self.cp),dump(self.op)))
    def test_invalid_payload_stops_before_claim(self):
        self.bindings[1]['payload']['delta'] = True
        self.register(); before = (dump(self.cp),dump(self.op))
        with self.assertRaises(o.LedgerFailure):self.worker().acquire('dispatch')
        self.assertEqual(before,(dump(self.cp),dump(self.op)))
    def test_resource_alias_and_hardlink_rejected(self):
        for path in [self.cp, Path(self.tmp.name)/'alias.sqlite']:
            if path != self.cp:os.link(self.cp,path)
            with self.assertRaises(WorkerFailure) as cm:Worker(self.cp,path,'worker',self.clock)
            self.assertEqual(cm.exception.code,'RESOURCE_ALIAS')
    def test_wrong_operation_resource_readonly(self):
        other=Path(self.tmp.name)/'other.sqlite'
        o.Ledger.initialize(other,{'account':100},resource_id='other')
        before=other.read_bytes()
        with self.assertRaises(o.LedgerFailure):Worker(self.cp,other,'worker',self.clock)
        self.assertEqual(before,other.read_bytes())
    def test_claim_required(self):
        self.register()
        with self.assertRaises(WorkerFailure):self.worker().run_one()
        self.assertEqual(self.balance(),100)
    def test_expiry_before_start_has_no_business_effect(self):
        self.register(); worker=self.worker(); worker.acquire('dispatch');self.clock.now=5000
        before=(dump(self.cp),dump(self.op))
        with self.assertRaises(c.StoreFailure) as cm:worker.run_one()
        self.assertEqual(cm.exception.code,'LEASE_EXPIRED')
        self.assertEqual(before,(dump(self.cp),dump(self.op)))
    def test_renewal_replaces_generation_and_extends_lease(self):
        self.register(); worker=self.worker(); old=worker.acquire('dispatch')['authority']
        self.clock.now=1000; renewed=worker.renew()
        self.assertEqual(renewed['authority']['lease_generation'],2)
        with self.assertRaises(c.StoreFailure) as cm:
            self.store.start('stale','dispatch',renewed['version'],old,'stale-attempt')
        self.assertEqual(cm.exception.code,'LEASE_GENERATION')
        self.clock.now=5000
        self.assertEqual(worker.run_one()['status'],'succeeded')
    def test_expired_renewal_rejected(self):
        self.register();worker=self.worker();worker.acquire('dispatch');self.clock.now=5000
        with self.assertRaises(c.StoreFailure):worker.renew()
    def test_late_result_is_unknown_then_new_claim_reconciles(self):
        self.register()
        class ExpiringWorker(Worker):
            def _after_operation(inner):self.clock.now=5000
        old=ExpiringWorker(self.cp,self.op,'old',self.clock);old.acquire('dispatch')
        result=old.run_one();self.assertEqual(result['status'],'unknown')
        self.assertEqual(self.balance(),90);self.assertEqual(self.store.load('dispatch')['progress'],[])
        new=self.worker();new.acquire('dispatch')
        self.assertEqual(new.run_one()['status'],'reconciled')
        self.assertEqual(self.balance(),90)
        self.assertEqual(dump(self.cp)['attempts'][0][9],'unknown')
        self.assertEqual(len(dump(self.cp)['attempts']),1)
    def test_known_failure_records_attempt_without_implicit_retry(self):
        self.bindings[0]['payload']['delta']=-200;self.register()
        worker=self.worker();worker.acquire('dispatch')
        self.assertEqual(worker.run_one()['status'],'failed')
        self.assertEqual(self.balance(),100)
        with self.assertRaises(c.StoreFailure) as cm:worker.run_one()
        self.assertEqual(cm.exception.code,'RETRY_NOT_ELIGIBLE')
        self.assertEqual(len(dump(self.cp)['attempts']),1)
        self.assertEqual(dump(self.cp)['retries'],[])
    def test_preexisting_result_without_attempt_cannot_create_progress(self):
        self.register()
        entry=self.intent['plan'][0]
        inv=o.make_invocation(self.intent['intent_id'],self.intent['plan_digest'],entry['plan_occurrence_id'],'account',-10)
        o.Ledger(self.op).apply_or_recognize(inv)
        worker=self.worker();worker.acquire('dispatch')
        with self.assertRaises(c.StoreFailure) as cm:worker.run_one()
        self.assertEqual(cm.exception.code,'RECONCILIATION_PREDECESSOR')
        self.assertEqual(self.store.load('dispatch')['progress'],[])
    def test_lost_operation_response_stays_unknown_until_recognized(self):
        self.register();worker=self.worker();worker.acquire('dispatch')
        class LostResponse(o.Ledger):
            def _after_commit(self):raise OSError('injected response loss')
        with patch.object(o,'Ledger',LostResponse):
            self.assertEqual(worker.run_one()['status'],'unknown')
        self.assertEqual(self.balance(),90)
        self.assertEqual(dump(self.cp)['attempts'][0][9],'unknown')
        self.assertEqual(worker.run_one()['status'],'reconciled')
        self.assertEqual(self.balance(),90)
        self.assertEqual(len(dump(self.cp)['attempts']),1)
    def test_missing_result_outbox_blocks_recognition(self):
        self.register()
        class ExpiringWorker(Worker):
            def _after_operation(inner):self.clock.now=5000
        worker=ExpiringWorker(self.cp,self.op,'old',self.clock);worker.acquire('dispatch')
        self.assertEqual(worker.run_one()['status'],'unknown')
        with sqlite3.connect(self.op) as db:db.execute('DELETE FROM operation_outbox')
        successor=self.worker();successor.acquire('dispatch');before=(dump(self.cp),dump(self.op))
        with self.assertRaises(o.LedgerFailure) as cm:successor.run_one()
        self.assertEqual(cm.exception.classification,'unknown')
        self.assertEqual(before,(dump(self.cp),dump(self.op)))
    def test_two_processes_cannot_claim_same_generation(self):
        self.register();ctx=mp.get_context('fork');barrier=ctx.Barrier(2);queue=ctx.Queue()
        ps=[ctx.Process(target=race,args=(self.cp,self.op,barrier,queue,str(i))) for i in range(2)]
        try:
            for p in ps:p.start()
            results=[queue.get(timeout=10) for _ in ps]
            for p in ps:p.join(5);self.assertEqual(p.exitcode,0)
            self.assertEqual(sorted(r[0] for r in results),['ok','reject'])
            self.assertEqual(len(dump(self.cp)['claims']),1)
        finally:
            for p in ps:
                if p.is_alive():p.kill();p.join()
            queue.close()
    def test_process_takeover_reconciles_and_rejects_late_commit(self):
        self.register();ctx=mp.get_context('fork');value=ctx.Value('q',0);parent,child=ctx.Pipe()
        process=ctx.Process(target=late,args=(self.cp,self.op,value,child))
        try:
            process.start();child.close();self.assertTrue(parent.poll(10));self.assertEqual(parent.recv(),'committed')
            value.value=5000
            successor=Worker(self.cp,self.op,'successor',SharedClock(value))
            self.assertEqual(successor.acquire('dispatch')['authority']['fence'],2)
            self.assertEqual(successor.run_one()['status'],'reconciled')
            before=dump(self.cp);parent.send('resume')
            self.assertTrue(parent.poll(10));result=parent.recv()
            process.join(5);self.assertEqual(process.exitcode,0)
            self.assertEqual(result['status'],'unknown')
            self.assertEqual(dump(self.cp),before);self.assertEqual(self.balance(),90)
            self.assertEqual(len(before['progress']),1);self.assertEqual(len(before['attempts']),1)
        finally:
            if process.is_alive():process.kill();process.join()
            parent.close()

if __name__=='__main__':unittest.main(verbosity=2)
