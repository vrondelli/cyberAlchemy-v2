import dataclasses
import json
import multiprocessing as mp
from pathlib import Path
import signal
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from recovery import Recovery, RecoveryStore, w, c, o

class Clock:
    def __init__(self,now=0,boot='test-boot'):self.now,self.boot=now,boot
    def __call__(self):return self.boot,self.now

def fixture(continuation='retry',delta=-10):
    d=c.reference.plan_workflow_recovery(workflow_id='flow',workflow_execution_id='run',failure_occurrence_id='failure',failed_step_id='ship',completed_step_ids=('reserve','charge'),orchestrated_operation_ids=('adjust-balance',),mappings=(c.reference.RecoveryOperationMapping('reserve','adjust-balance'),c.reference.RecoveryOperationMapping('charge','adjust-balance')))
    intent=json.loads(c.canonical(dataclasses.asdict(d.recovery_intent)))
    bindings=[{'occurrence_id':e['plan_occurrence_id'],'binding_digest':o.BINDING_DIGEST,'payload':{'subject_id':'account','delta':delta},'continuation':continuation,'policy_ref':'r01-local-retry-v1'} for e in intent['plan']]
    return intent,bindings

def dump(path):
    with sqlite3.connect(path) as db:
        names=[row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
        return {name:db.execute('SELECT * FROM '+name+' ORDER BY rowid').fetchall() for name in names}

def crash(cp,op,now,action,when,pipe):
    class KillStore(RecoveryStore):
        def _before_commit(self):
            if when=='before':pipe.send('barrier');signal.pause()
        def _after_commit(self):
            if when=='after':pipe.send('barrier');signal.pause()
    try:
        runtime=Recovery(cp,op,'dispatch','crashing-worker',Clock(now))
        runtime.store=KillStore(cp,'coordination',Clock(now))
        if action=='ack':
            event=runtime.pending_hints()[0]
            runtime.acknowledge(event['event_id'],event['payload_digest'])
        else:pipe.send(runtime.poll())
    except BaseException as error:pipe.send({'error':repr(error)})

def compete(cp,op,barrier,queue,label):
    try:
        runtime=Recovery(cp,op,'dispatch',label,Clock())
        barrier.wait(5);queue.put(runtime.poll())
    except BaseException as error:queue.put({'error':repr(error)})

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='r06-recovery-')
        self.cp,self.op=[Path(self.tmp.name)/name for name in ('coordination.sqlite','operation.sqlite')]
        self.clock=Clock()
        self.store=c.Store.initialize(self.cp,'coordination',self.clock)
        o.Ledger.initialize(self.op,{'account':100})
    def tearDown(self):self.tmp.cleanup()
    def setup_runtime(self,continuation='retry',delta=-10):
        self.intent,self.bindings=fixture(continuation,delta)
        self.store.register('register','dispatch',self.intent,self.bindings)
        self.runtime=self.reopen()
        return self.runtime
    def reopen(self):return Recovery(self.cp,self.op,'dispatch','worker',self.clock)
    def state(self):return RecoveryStore(self.cp,'coordination',self.clock).inspect('dispatch')
    def balance(self):
        with sqlite3.connect(self.op) as db:return db.execute('SELECT value FROM business_state').fetchone()[0]
    def invocation(self,index=0):
        entry=self.intent['plan'][index];payload=self.bindings[index]['payload']
        return o.make_invocation(self.intent['intent_id'],self.intent['plan_digest'],entry['plan_occurrence_id'],payload['subject_id'],payload['delta'])
    def test_success_and_terminal_replay_are_durable(self):
        runtime=self.setup_runtime()
        self.assertEqual(runtime.poll()['status'],'succeeded')
        prefix=self.state()['progress']
        self.clock.now=5000;runtime=self.reopen()
        self.assertEqual(runtime.poll()['status'],'succeeded')
        self.assertEqual(self.state()['progress'][0],prefix[0])
        self.assertEqual(runtime.poll()['disposition'],'completed')
        before=dump(self.cp),dump(self.op)
        result=self.reopen().poll('register')
        self.assertEqual(result['status'],'terminal')
        self.assertEqual(result['terminal']['semantic_status'],'satisfied')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(self.balance(),80)
        self.assertEqual(len(self.state()['attempts']),2)
    def test_retry_delay_survives_reopen_without_reset(self):
        runtime=self.setup_runtime(delta=-200)
        self.assertEqual(runtime.poll()['status'],'failed')
        self.assertEqual(runtime.poll()['not_before'],1000)
        schedule=self.state()['retries']
        self.clock.now=999
        self.assertEqual(runtime.poll()['reason'],'retry-delay')
        self.assertEqual(self.reopen().poll()['reason'],'active-claim')
        self.clock.now=5000;runtime=self.reopen()
        self.assertEqual(runtime.poll()['status'],'failed')
        self.assertEqual(self.state()['retries'],schedule)
        self.assertEqual([row['attempt_number'] for row in self.state()['attempts']],[1,2])
    def test_three_attempt_ceiling_and_terminal_cannot_be_bypassed(self):
        runtime=self.setup_runtime(delta=-200)
        for number in range(1,4):
            self.assertEqual(runtime.poll()['status'],'failed')
            if number<3:
                self.assertEqual(runtime.poll()['status'],'retry-scheduled');self.clock.now+=1000
        self.assertEqual(runtime.poll()['disposition'],'exhausted')
        self.assertEqual(self.state()['terminals'][0]['semantic_status'],'unresolved')
        evidence=json.loads(self.state()['terminals'][0]['evidence_json'])
        self.assertEqual(evidence['last_attempt']['attempt_number'],3)
        before=dump(self.cp),dump(self.op)
        self.clock.now=10000
        for _ in range(3):self.assertEqual(self.reopen().poll('register')['status'],'terminal')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(self.balance(),100)
        self.assertEqual(len(self.state()['attempts']),3)
    def test_selected_escalation_records_no_successor(self):
        runtime=self.setup_runtime('escalate',-200)
        self.assertEqual(runtime.poll()['status'],'failed')
        self.assertEqual(runtime.poll()['disposition'],'escalated')
        state=self.state()
        self.assertEqual(len(state['attempts']),1);self.assertEqual(state['retries'],[])
        self.assertEqual(state['terminals'][0]['semantic_status'],'unresolved')
    def test_selected_terminal_failure_needs_no_retry_budget_exhaustion(self):
        runtime=self.setup_runtime('terminal-failure',-200)
        self.assertEqual(runtime.poll()['status'],'failed')
        self.assertEqual(runtime.poll()['disposition'],'exhausted')
        self.assertEqual(len(self.state()['attempts']),1)
    def test_unknown_absence_requires_schedule_before_retry(self):
        runtime=self.setup_runtime()
        class LoseBeforeCommit(o.Ledger):
            def _before_commit(self):raise OSError('injected precommit loss')
        with patch.object(o,'Ledger',LoseBeforeCommit):
            self.assertEqual(runtime.poll()['status'],'unknown')
        self.assertEqual(self.balance(),100)
        self.assertEqual(runtime.poll()['status'],'retry-scheduled')
        self.assertEqual(runtime.poll()['reason'],'retry-delay')
        self.clock.now=1000
        result=runtime.poll();self.assertEqual(result['status'],'succeeded')
        self.assertEqual(result['evidence']['invocation_id'],self.invocation()['invocation_id'])
        self.assertEqual(self.balance(),90)
        self.assertEqual([row['outcome'] for row in self.state()['attempts']],['unknown','succeeded'])
    def test_committed_unknown_reconciles_without_retry(self):
        runtime=self.setup_runtime()
        class LostResponse(o.Ledger):
            def _after_commit(self):raise OSError('response lost')
        with patch.object(o,'Ledger',LostResponse):self.assertEqual(runtime.poll()['status'],'unknown')
        self.clock.now=5000;runtime=self.reopen()
        self.assertEqual(runtime.poll()['status'],'reconciled')
        state=self.state();self.assertEqual(len(state['attempts']),1);self.assertEqual(state['retries'],[])
        self.assertEqual(self.balance(),90)
    def test_unknown_unreadable_ledger_stops_before_schedule(self):
        runtime=self.setup_runtime()
        class LostResponse(o.Ledger):
            def _after_commit(self):raise OSError('response lost')
        with patch.object(o,'Ledger',LostResponse):self.assertEqual(runtime.poll()['status'],'unknown')
        with sqlite3.connect(self.op) as db:db.execute('DELETE FROM operation_outbox')
        before=dump(self.cp),dump(self.op)
        self.assertEqual(runtime.poll()['status'],'unknown')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(self.state()['retries'],[])
    def test_active_attempt_is_not_renewed_forever(self):
        runtime=self.setup_runtime();runtime.worker.acquire('dispatch')
        authority=runtime.worker._claim[1]
        self.store.start('start','dispatch',1,authority,'interrupted')
        for now in [1000,4000]:
            self.clock.now=now;self.assertEqual(runtime.poll()['reason'],'active-attempt')
        self.assertEqual(len(dump(self.cp)['leases']),1)
        self.clock.now=5000
        self.assertEqual(runtime.poll()['status'],'retry-scheduled')
        self.assertEqual(self.state()['attempts'][0]['outcome'],'unknown')
        self.clock.now=6000
        self.assertEqual(runtime.poll()['status'],'succeeded')
        self.assertEqual(self.balance(),90)
    def test_late_older_success_after_newer_failure_is_recognized(self):
        runtime=self.setup_runtime();runtime.worker.acquire('dispatch');authority=runtime.worker._claim[1]
        started=self.store.start('old-start','dispatch',1,authority,'old-attempt')
        self.store.outcome('old-loss','dispatch',started['version'],authority,'old-attempt','unknown',{'cause':'lost-response'})
        self.assertEqual(runtime.poll()['status'],'retry-scheduled');self.clock.now=1000
        class TemporaryFailure(o.Ledger):
            def apply_or_recognize(self,invocation):raise o.LedgerFailure('INJECTED_BUSY','retryable')
        with patch.object(o,'Ledger',TemporaryFailure):self.assertEqual(runtime.poll()['status'],'failed')
        # Older in-flight invocation commits after the newer failed call.
        o.Ledger(self.op).apply_or_recognize(self.invocation())
        before=[row['outcome'] for row in self.state()['attempts']]
        self.assertEqual(runtime.poll()['status'],'reconciled')
        self.assertEqual([row['outcome'] for row in self.state()['attempts']],before)
        self.assertEqual(before,['unknown','failed']);self.assertEqual(self.balance(),90)
    def test_hints_are_optional_and_duplicate_ack_is_projection_only(self):
        runtime=self.setup_runtime();event=runtime.pending_hints()[0]
        before=self.state();business=dump(self.op)
        first=runtime.acknowledge(event['event_id'],event['payload_digest'])
        self.assertFalse(first['existing'])
        state=dump(self.cp)
        self.assertTrue(runtime.acknowledge(event['event_id'],event['payload_digest'])['existing'])
        self.assertEqual(dump(self.cp),state)
        for name in ['dispatch','attempts','retries','progress','terminals']:self.assertEqual(self.state()[name],before[name])
        self.assertEqual(dump(self.op),business)
        self.assertEqual(runtime.poll(event['event_id'])['status'],'succeeded')
        self.assertEqual(runtime.poll(event['event_id'])['status'],'succeeded')
        self.assertEqual(runtime.poll()['disposition'],'completed')
        self.assertEqual(self.balance(),80)
    def test_bad_hint_and_ack_digest_preserve_state(self):
        runtime=self.setup_runtime();event=runtime.pending_hints()[0];before=dump(self.cp),dump(self.op)
        self.assertEqual(runtime.poll('absent')['code'],'HINT_NOT_FOUND')
        with self.assertRaises(c.StoreFailure):runtime.acknowledge(event['event_id'],'0'*64)
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_missing_dispatch_event_blocks_advancement(self):
        runtime=self.setup_runtime()
        with sqlite3.connect(self.cp) as db:db.execute('DELETE FROM dispatch_outbox')
        before=dump(self.cp),dump(self.op)
        self.assertEqual(runtime.poll()['code'],'OUTBOX_EVIDENCE')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_completion_rechecks_operation_evidence(self):
        runtime=self.setup_runtime();runtime.poll();runtime.poll()
        with sqlite3.connect(self.op) as db:db.execute('DELETE FROM operation_outbox')
        before=dump(self.cp),dump(self.op)
        self.assertEqual(runtime.poll()['status'],'unknown')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(self.state()['terminals'],[])
    def test_boot_and_backward_clock_stop_without_terminal(self):
        runtime=self.setup_runtime();self.clock.now=100;runtime.poll();before=dump(self.cp),dump(self.op)
        self.clock.now=99;self.assertEqual(runtime.poll()['code'],'CLOCK_REGRESSION')
        self.clock.now=100;self.clock.boot='other';self.assertEqual(runtime.poll()['code'],'BOOT_MISMATCH')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_busy_coordination_does_not_consume_attempt(self):
        runtime=self.setup_runtime();before=dump(self.cp),dump(self.op)
        with sqlite3.connect(self.cp,autocommit=True) as db:
            db.execute('BEGIN IMMEDIATE');self.assertEqual(runtime.poll()['status'],'waiting');db.execute('ROLLBACK')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(runtime.poll()['status'],'succeeded')
    def test_competing_process_polls_do_not_duplicate_execution(self):
        self.setup_runtime();ctx=mp.get_context('fork');barrier=ctx.Barrier(2);queue=ctx.Queue()
        processes=[ctx.Process(target=compete,args=(self.cp,self.op,barrier,queue,str(i))) for i in range(2)]
        try:
            for process in processes:process.start()
            results=[queue.get(timeout=10) for _ in processes]
            for process in processes:process.join(5);self.assertEqual(process.exitcode,0)
            self.assertEqual(sum(row['status']=='succeeded' for row in results),1)
            self.assertEqual(len(self.state()['attempts']),1);self.assertEqual(self.balance(),90)
        finally:
            for process in processes:
                if process.is_alive():process.kill();process.join()
            queue.close()
    def kill_at(self,action,when):
        ctx=mp.get_context('fork');parent,child=ctx.Pipe(False)
        process=ctx.Process(target=crash,args=(self.cp,self.op,self.clock.now,action,when,child))
        try:
            process.start();child.close();self.assertTrue(parent.poll(10));self.assertEqual(parent.recv(),'barrier')
            process.kill();process.join(5);self.assertEqual(process.exitcode,-signal.SIGKILL)
        finally:
            if process.is_alive():process.kill();process.join()
            parent.close()
    def test_sigkill_schedule_before_and_after_commit(self):
        runtime=self.setup_runtime(delta=-200);runtime.poll();self.clock.now=5000
        self.kill_at('schedule','before');self.assertEqual(self.state()['retries'],[])
        self.clock.now=10000;self.kill_at('schedule','after')
        scheduled=self.state()['retries'];self.assertEqual(len(scheduled),1)
        self.assertEqual(scheduled[0]['not_before'],11000)
        self.clock.now=15000;result=self.reopen().poll()
        self.assertEqual(result['status'],'failed');self.assertEqual(self.state()['retries'],scheduled)
        self.assertEqual(len(self.state()['attempts']),2)
    def test_sigkill_terminal_before_and_after_commit(self):
        runtime=self.setup_runtime();runtime.poll();runtime.poll();progress=self.state()['progress']
        self.clock.now=5000;self.kill_at('terminal','before');self.assertEqual(self.state()['terminals'],[])
        self.clock.now=10000;self.kill_at('terminal','after')
        before=dump(self.cp),dump(self.op)
        self.assertEqual(self.reopen().poll()['status'],'terminal')
        self.assertEqual((dump(self.cp),dump(self.op)),before);self.assertEqual(self.state()['progress'],progress)
    def test_sigkill_ack_before_and_after_commit(self):
        runtime=self.setup_runtime();before=dump(self.cp)
        self.kill_at('ack','before');self.assertEqual(dump(self.cp),before)
        self.kill_at('ack','after');self.assertEqual(self.state()['events'][0]['delivered_at'],0)
        event=self.state()['events'][0];before=dump(self.cp)
        self.assertTrue(self.reopen().acknowledge(event['event_id'],event['payload_digest'])['existing'])
        self.assertEqual(dump(self.cp),before)
        self.assertEqual(self.reopen().poll()['status'],'succeeded')

if __name__=='__main__':unittest.main(verbosity=2)
