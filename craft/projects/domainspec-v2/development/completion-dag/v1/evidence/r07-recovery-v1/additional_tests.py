import importlib
import multiprocessing as mp
import os
from pathlib import Path
import signal
import sqlite3
import sys
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'r06-recovery-v1'))
from test_recovery import RecoveryTests, Clock, fixture, dump
from recovery import Recovery, RecoveryStore, w, c, o

TRACE=[]
def child(cp,op,now,mode,pipe):
    runtime=Recovery(cp,op,'dispatch','child',Clock(now))
    if mode=='resume':
        result=runtime.poll();pipe.send({'pid':os.getpid(),'result':result});return
    if mode=='prefix':
        result=runtime.poll();pipe.send({'pid':os.getpid(),'result':result});signal.pause()
    if mode.startswith('progress-'):
        original_store=c.Store
        class KillProgress(original_store):
            committing_outcome=False
            def outcome(self,*args,**kwargs):
                self.committing_outcome=True
                return super().outcome(*args,**kwargs)
            def _before_commit(self):
                if self.committing_outcome and mode=='progress-before':pipe.send({'pid':os.getpid(),'barrier':mode});signal.pause()
            def _after_commit(self):
                if self.committing_outcome and mode=='progress-after':pipe.send({'pid':os.getpid(),'barrier':mode});signal.pause()
        with patch.object(c,'Store',KillProgress):runtime.poll()
        return
    original=o.Ledger
    class Paused(original):
        def _before_commit(self):
            if mode=='before-operation':pipe.send({'pid':os.getpid(),'barrier':mode});signal.pause()
        def _after_commit(self):
            if mode=='after-operation':pipe.send({'pid':os.getpid(),'barrier':mode});signal.pause()
    with patch.object(o,'Ledger',Paused):runtime.poll()

class AdditionalTests(RecoveryTests):
    def subprocess_step(self,mode,now):
        ctx=mp.get_context('fork');parent,other=ctx.Pipe(False)
        process=ctx.Process(target=child,args=(self.cp,self.op,now,mode,other))
        try:
            process.start();other.close();self.assertTrue(parent.poll(10));result=parent.recv()
            if mode!='resume':process.kill()
            process.join(5)
            self.assertEqual(process.exitcode,0 if mode=='resume' else -signal.SIGKILL)
            TRACE.append({'mode':mode,'clock':now,'exit_code':process.exitcode,**result})
            return result
        finally:
            if process.is_alive():process.kill();process.join()
            parent.close()
    def test_planning_does_not_invoke(self):
        with patch.object(o.Ledger,'apply_or_recognize',autospec=True,side_effect=o.Ledger.apply_or_recognize) as spy:
            self.setup_runtime();self.assertEqual(spy.call_count,0)
            self.assertEqual(self.state()['attempts'],[]);self.assertEqual(self.balance(),100)
            self.assertEqual(self.runtime.poll()['status'],'succeeded');self.assertEqual(spy.call_count,1)
    def test_stored_plan_tamper_rejected_on_reopen(self):
        self.setup_runtime()
        with sqlite3.connect(self.cp) as db:
            sql=db.execute("SELECT sql FROM sqlite_master WHERE name='immutable_intent_update'").fetchone()[0]
            db.execute('DROP TRIGGER immutable_intent_update')
            changed=dict(self.intent);changed['plan']=list(reversed(changed['plan']))
            db.execute('UPDATE intents SET frozen_intent_json=?',(c.canonical(changed),));db.execute(sql)
        before=dump(self.cp),dump(self.op)
        with self.assertRaises(c.reference.WorkflowRecoveryError):self.reopen().poll()
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_two_takeovers_increase_fence(self):
        self.setup_runtime();worker=self.runtime.worker
        fences=[worker.acquire('dispatch')['authority']['fence']]
        for now in [5000,10000]:
            self.clock.now=now;worker=w.Worker(self.cp,self.op,'next',self.clock)
            fences.append(worker.acquire('dispatch')['authority']['fence'])
        self.assertEqual(fences,[1,2,3]);self.assertEqual(len([r for r in dump(self.cp)['claims'] if r[-1]=='current']),1)
    def test_attempts_only_on_execution(self):
        self.setup_runtime(delta=-200);worker=self.runtime.worker;worker.acquire('dispatch');worker.renew()
        self.assertEqual(self.state()['attempts'],[])
        self.assertEqual(self.runtime.poll()['status'],'failed');self.runtime.poll();self.clock.now=1000
        self.assertEqual(self.runtime.poll()['status'],'failed')
        attempts=self.state()['attempts'];self.assertEqual([r['attempt_number'] for r in attempts],[1,2])
        self.assertEqual(len({r['attempt_id'] for r in attempts}),2)
    def test_crash_second_occurrence_preserves_prefix(self):
        self.setup_runtime();self.runtime.poll();prefix=self.state()['progress']
        self.subprocess_step('before-operation',5000)
        self.clock.now=10000
        self.assertEqual(self.reopen().poll()['status'],'retry-scheduled')
        self.clock.now=15000;result=self.subprocess_step('resume',15000)
        self.assertEqual(result['result']['status'],'succeeded')
        self.assertEqual(self.balance(),80)
        self.assertTrue(all(row in self.state()['progress'] for row in prefix))
        self.assertEqual([r['attempt_number'] for r in self.state()['attempts']],[1,1,2])
    def test_killed_attempt_preserves_identity_on_retry(self):
        self.setup_runtime();intent=self.intent
        self.subprocess_step('before-operation',0)
        self.clock.now=5000;runtime=self.reopen();self.assertEqual(runtime.poll()['status'],'retry-scheduled')
        self.clock.now=6000;result=runtime.poll();self.assertEqual(result['status'],'succeeded')
        self.assertEqual(self.state()['intent'],intent)
        self.assertEqual(result['evidence']['invocation_id'],self.invocation()['invocation_id'])
        attempts=self.state()['attempts'];self.assertNotEqual(attempts[0]['attempt_id'],attempts[1]['attempt_id'])
        self.assertEqual(attempts[0]['occurrence_id'],attempts[1]['occurrence_id'])
    def test_kill_between_commits_reconciles_one_application(self):
        self.setup_runtime();self.subprocess_step('after-operation',0)
        self.clock.now=5000
        self.assertEqual(self.state()['progress'],[]);self.assertEqual(self.balance(),90)
        result=self.reopen().poll();self.assertEqual(result['status'],'reconciled')
        replay=o.Ledger(self.op).apply_or_recognize(self.invocation())
        self.assertTrue(replay['replayed']);self.assertEqual(replay['evidence'],result['evidence'])
        self.assertEqual(len(dump(self.op)['operation_outbox']),1);self.assertEqual(self.balance(),90)
    def test_binding_substitution_after_failure_rejected(self):
        self.setup_runtime(delta=-200);self.runtime.poll();before=dump(self.cp),dump(self.op)
        replacement=[{**row,'binding_digest':'f'*64} for row in self.bindings]
        with self.assertRaises(c.StoreFailure):self.store.register('replacement','dispatch',self.intent,replacement)
        self.assertEqual((dump(self.cp),dump(self.op)),before)
        self.assertEqual(self.reopen().poll()['status'],'waiting')
    def test_fresh_process_resumes_after_killed_prefix(self):
        self.setup_runtime();self.subprocess_step('prefix',0);self.clock.now=5000
        prefix=self.state()['progress'];self.assertEqual(len(prefix),1)
        result=self.subprocess_step('resume',5000);self.assertEqual(result['result']['status'],'succeeded')
        self.assertTrue(all(r in self.state()['progress'] for r in prefix))
        self.clock.now=10000;self.assertEqual(self.reopen().poll()['disposition'],'completed')
        before=dump(self.cp),dump(self.op)
        self.assertEqual(self.subprocess_step('resume',10000)['result']['status'],'terminal')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_replay_ack_after_publisher_crash(self):
        self.setup_runtime();event=self.runtime.pending_hints()[0]
        self.kill_at('ack','after')
        result=self.runtime.poll(event['event_id']);self.assertEqual(result['status'],'succeeded')
        evidence=o.Ledger(self.op).apply_or_recognize(self.invocation())
        self.assertTrue(evidence['replayed']);self.assertEqual(evidence['evidence'],result['evidence'])
        self.assertTrue(self.runtime.acknowledge(event['event_id'],event['payload_digest'])['existing'])
        self.assertEqual(self.balance(),90)
    def test_attempt_failure_keeps_required_semantics(self):
        self.setup_runtime(delta=-200);self.runtime.poll()
        state=self.state();self.assertEqual(state['intent']['semantic_status'],'required');self.assertEqual(state['terminals'],[])
        self.runtime.poll();self.clock.now=1000;self.runtime.poll();self.runtime.poll();self.clock.now=2000;self.runtime.poll();self.runtime.poll()
        self.assertEqual(self.state()['intent']['semantic_status'],'required')
        self.assertEqual(self.state()['terminals'][0]['semantic_status'],'unresolved')
    def test_retryable_classification_does_not_select_retry(self):
        self.setup_runtime('escalate')
        class Retryable(o.Ledger):
            def apply_or_recognize(self,inv):raise o.LedgerFailure('INJECTED_BUSY','retryable')
        with patch.object(o,'Ledger',Retryable):self.assertEqual(self.runtime.poll()['status'],'failed')
        self.assertEqual(self.runtime.poll()['disposition'],'escalated');self.assertEqual(self.state()['retries'],[])
    def test_retryable_classification_with_explicit_retry(self):
        self.setup_runtime('retry')
        class Retryable(o.Ledger):
            def apply_or_recognize(self,inv):raise o.LedgerFailure('INJECTED_BUSY','retryable')
        with patch.object(o,'Ledger',Retryable):self.assertEqual(self.runtime.poll()['status'],'failed')
        self.assertEqual(self.runtime.poll()['status'],'retry-scheduled');self.assertEqual(len(self.state()['retries']),1)

    def assert_terminal_rejects_work(self):
        state=self.state();before=dump(self.cp),dump(self.op)
        authority=self.runtime.worker._claim[1]
        for action in [lambda:self.store.start('forbidden-start','dispatch',state['dispatch']['version'],authority,'forbidden-attempt'),lambda:self.store.schedule('forbidden-retry','dispatch',state['dispatch']['version'],authority)]:
            with self.assertRaises(c.StoreFailure) as caught:action()
            self.assertEqual(caught.exception.code,'TERMINAL')
        self.assertEqual((dump(self.cp),dump(self.op)),before)
    def test_completed_rejects_direct_successor(self):
        self.test_success_and_terminal_replay_are_durable();self.assert_terminal_rejects_work()
    def test_exhausted_rejects_direct_successor(self):
        self.test_three_attempt_ceiling_and_terminal_cannot_be_bypassed();self.assert_terminal_rejects_work()
    def test_terminal_failure_rejects_direct_successor(self):
        self.test_selected_terminal_failure_needs_no_retry_budget_exhaustion();self.assert_terminal_rejects_work()
    def test_escalated_rejects_direct_successor(self):
        self.test_selected_escalation_records_no_successor();self.assert_terminal_rejects_work()
    def test_kill_before_progress_commit(self):
        self.setup_runtime();self.subprocess_step('progress-before',0)
        self.clock.now=5000;state=self.state()
        self.assertEqual(state['progress'],[]);self.assertEqual(len(state['events']),3)
        self.assertEqual(self.balance(),90)
        self.assertEqual(self.reopen().poll()['status'],'reconciled');self.assertEqual(self.balance(),90)
    def test_kill_after_progress_commit(self):
        self.setup_runtime();self.subprocess_step('progress-after',0)
        self.clock.now=5000;state=self.state()
        self.assertEqual(len(state['progress']),1);self.assertEqual(len(state['events']),4)
        prefix=state['progress']
        self.assertEqual(self.reopen().poll()['status'],'succeeded')
        self.assertTrue(all(r in self.state()['progress'] for r in prefix));self.assertEqual(self.balance(),80)
    def test_operation_write_boundary(self):
        for file in [HERE.parent/'r03-recovery-v1/store.py',HERE.parent/'r05-recovery-v1/worker.py',HERE.parent/'r06-recovery-v1/recovery.py']:
            source=file.read_text()
            self.assertNotIn('business_state',source)
            self.assertNotIn('ATTACH ',source.upper())
        source=(HERE.parent/'r04-recovery-v1/ledger.py').read_text()
        self.assertIn('UPDATE business_state',source)
        self.assertNotIn('coordination.sqlite',source)
