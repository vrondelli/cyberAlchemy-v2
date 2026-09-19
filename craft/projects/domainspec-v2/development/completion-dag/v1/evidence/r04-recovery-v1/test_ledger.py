import multiprocessing as mp
from pathlib import Path
import signal
import sqlite3
import tempfile
import unittest
from ledger import Ledger, LedgerFailure, make_invocation, digest, canonical, MAX_VALUE


def invocation(occurrence='refund-1', delta=-10, subject='account'):
    return make_invocation('a'*64, 'b'*64, occurrence, subject, delta)

def dump(path):
    with sqlite3.connect(path) as c:
        return {n: c.execute('SELECT * FROM '+n+' ORDER BY rowid').fetchall() for n in ['metadata','business_state','invocation_results','operation_outbox']}

def competing(path, barrier, queue):
    try:
        ledger=Ledger(path)
        barrier.wait(timeout=5)
        queue.put(('ok', ledger.apply_or_recognize(invocation())))
    except BaseException as e:queue.put(('error',repr(e)))

def killed(path, pipe, when):
    class FaultLedger(Ledger):
        def _before_commit(self):
            if when=='before':pipe.send('barrier');signal.pause()
        def _after_commit(self):
            if when=='after':pipe.send('barrier');signal.pause()
    FaultLedger(path).apply_or_recognize(invocation())

class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='r04-test-')
        self.path=Path(self.tmp.name)/'operation.sqlite'
        self.ledger=Ledger.initialize(self.path,{'account':100})
    def tearDown(self):self.tmp.cleanup()
    def rejects(self,code,fn):
        before=dump(self.path)
        with self.assertRaises(LedgerFailure) as cm:fn()
        self.assertEqual(cm.exception.code,code)
        self.assertEqual(dump(self.path),before)
    def test_replay_returns_original_result_once(self):
        first=self.ledger.apply_or_recognize(invocation())
        self.assertFalse(first['replayed'])
        again=Ledger(self.path).apply_or_recognize(invocation())
        self.assertTrue(again['replayed']);self.assertEqual(first['evidence'],again['evidence'])
        state=dump(self.path)
        self.assertEqual(state['business_state'],[('account',90)])
        self.assertEqual(len(state['invocation_results']),1);self.assertEqual(len(state['operation_outbox']),1)
    def test_absence_is_readonly_and_not_a_failure_result(self):
        before=self.path.read_bytes()
        self.assertIsNone(self.ledger.recognize(invocation()))
        self.assertEqual(self.path.read_bytes(),before)
    def test_payload_change_same_identity(self):
        self.ledger.apply_or_recognize(invocation())
        self.rejects('REPLAY_MISMATCH',lambda:self.ledger.apply_or_recognize(invocation(delta=-20)))
    def test_binding_change(self):
        self.rejects('BINDING_MISMATCH',lambda:self.ledger.apply_or_recognize({**invocation(),'binding_digest':'c'*64}))
    def test_identity_change(self):
        self.rejects('INVOCATION_IDENTITY',lambda:self.ledger.apply_or_recognize({**invocation(),'invocation_id':'c'*64}))
    def test_payload_digest_change(self):
        self.rejects('PAYLOAD_DIGEST',lambda:self.ledger.apply_or_recognize({**invocation(),'payload_digest':'c'*64}))
    def test_distinct_occurrences_apply_separately(self):
        self.ledger.apply_or_recognize(invocation('first'));self.ledger.apply_or_recognize(invocation('second'))
        self.assertEqual(dump(self.path)['business_state'],[('account',80)])
        self.assertEqual(len(dump(self.path)['invocation_results']),2)
    def test_original_result_survives_later_updates(self):
        first=self.ledger.apply_or_recognize(invocation('first'))
        self.ledger.apply_or_recognize(invocation('second'))
        replay=self.ledger.recognize(invocation('first'))
        self.assertEqual(replay['evidence'],first['evidence'])
        self.assertEqual(replay['evidence']['result_json']['after'],90)
    def test_guard_rejects_without_success_receipt(self):
        self.rejects('BALANCE_GUARD',lambda:self.ledger.apply_or_recognize(invocation(delta=-101)))
        self.assertIsNone(self.ledger.recognize(invocation(delta=-101)))
    def test_missing_subject(self):
        self.rejects('SUBJECT_MISSING',lambda:self.ledger.apply_or_recognize(invocation(subject='missing')))
    def test_closed_payload_and_integer_rules(self):
        self.rejects('DELTA_BOUND',lambda:self.ledger.apply_or_recognize(invocation(delta=True)))
        self.rejects('DELTA_BOUND',lambda:self.ledger.apply_or_recognize(invocation(delta=0)))
        v=invocation();v['payload']['unexpected']=1;v['payload_digest']=digest(v['payload'])
        self.rejects('INVALID_FIELDS',lambda:self.ledger.apply_or_recognize(v))
    def test_overflow_guard(self):
        path=Path(self.tmp.name)/'upper.sqlite';s=Ledger.initialize(path,{'account':MAX_VALUE})
        before=dump(path)
        with self.assertRaises(LedgerFailure):s.apply_or_recognize(invocation(delta=1))
        self.assertEqual(dump(path),before)
    def test_rollback_after_business_write(self):
        class Failing(Ledger):
            def _after_business_mutation(self):raise RuntimeError('injected')
        before=dump(self.path)
        with self.assertRaises(RuntimeError):Failing(self.path).apply_or_recognize(invocation())
        self.assertEqual(dump(self.path),before)
    def test_lost_response_explicit_unknown_then_reconcile(self):
        class Lost(Ledger):
            def _after_commit(self):raise OSError('response lost')
        with self.assertRaises(LedgerFailure) as cm:Lost(self.path).apply_or_recognize(invocation())
        self.assertEqual(cm.exception.classification,'unknown')
        result=Ledger(self.path).recognize(invocation())
        self.assertIsNotNone(result);self.assertTrue(result['replayed'])
        self.assertEqual(dump(self.path)['business_state'],[('account',90)])
    def test_busy_writer_no_effect(self):
        before=dump(self.path)
        with sqlite3.connect(self.path,autocommit=True) as c:
            c.execute('BEGIN IMMEDIATE')
            with self.assertRaises(LedgerFailure) as cm:self.ledger.apply_or_recognize(invocation())
            self.assertEqual(cm.exception.classification,'retryable')
            c.execute('ROLLBACK')
        self.assertEqual(dump(self.path),before)
    def test_resource_schema_rejection_readonly(self):
        before=self.path.read_bytes()
        with self.assertRaises(LedgerFailure):Ledger(self.path,'wrong')
        self.assertEqual(self.path.read_bytes(),before)
        with sqlite3.connect(self.path) as c:c.execute('PRAGMA user_version=2')
        before=self.path.read_bytes()
        with self.assertRaises(LedgerFailure):Ledger(self.path)
        self.assertEqual(self.path.read_bytes(),before)
    def test_missing_store_never_created(self):
        missing=Path(self.tmp.name)/'missing.sqlite'
        with self.assertRaises(LedgerFailure):Ledger(missing)
        self.assertFalse(missing.exists())
    def test_unreadable_store_is_unknown(self):
        bad=Path(self.tmp.name)/'bad.sqlite';bad.write_bytes(b'not a database')
        with self.assertRaises(LedgerFailure) as cm:Ledger(bad)
        self.assertEqual(cm.exception.classification,'unknown');self.assertEqual(bad.read_bytes(),b'not a database')
    def test_missing_outbox_cannot_be_reported_success(self):
        self.ledger.apply_or_recognize(invocation())
        with sqlite3.connect(self.path) as c:c.execute('DELETE FROM operation_outbox')
        self.rejects('RESULT_OUTBOX_MISMATCH',lambda:self.ledger.recognize(invocation()))
        with self.assertRaises(LedgerFailure) as cm:self.ledger.recognize(invocation())
        self.assertEqual(cm.exception.classification,'unknown')
    def test_concurrent_duplicate_processes(self):
        ctx=mp.get_context('fork');barrier=ctx.Barrier(2);q=ctx.Queue()
        ps=[ctx.Process(target=competing,args=(self.path,barrier,q)) for _ in range(2)]
        try:
            for p in ps:p.start()
            results=[q.get(timeout=10) for _ in ps]
            for p in ps:p.join(5);self.assertEqual(p.exitcode,0)
            self.assertEqual([r[0] for r in results],['ok','ok'])
            self.assertEqual(sorted(r[1]['replayed'] for r in results),[False,True])
            self.assertEqual(results[0][1]['evidence'],results[1][1]['evidence'])
            state=dump(self.path);self.assertEqual(state['business_state'],[('account',90)])
            self.assertEqual(len(state['operation_outbox']),1)
        finally:
            for p in ps:
                if p.is_alive():p.kill();p.join()
            q.close()
    def test_sigkill_before_and_after_commit(self):
        before=dump(self.path)
        for when in ['before','after']:
            ctx=mp.get_context('fork');reader,writer=ctx.Pipe(False)
            p=ctx.Process(target=killed,args=(self.path,writer,when))
            try:
                p.start();writer.close();self.assertTrue(reader.poll(10));self.assertEqual(reader.recv(),'barrier')
                p.kill();p.join(5);self.assertEqual(p.exitcode,-signal.SIGKILL)
                ledger=Ledger(self.path)
                if when=='before':self.assertEqual(dump(self.path),before);self.assertIsNone(ledger.recognize(invocation()))
                else:
                    replay=ledger.apply_or_recognize(invocation());self.assertTrue(replay['replayed'])
                    state=dump(self.path);self.assertEqual(state['business_state'],[('account',90)])
                    self.assertEqual(len(state['invocation_results']),1);self.assertEqual(len(state['operation_outbox']),1)
            finally:
                if p.is_alive():p.kill();p.join()
                reader.close()

if __name__=='__main__':unittest.main(verbosity=2)
