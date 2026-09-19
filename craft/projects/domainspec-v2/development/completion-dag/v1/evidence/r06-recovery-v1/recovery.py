"""Same-boot local recovery polling; each call performs at most one work step."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sqlite3
import sys
import threading

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'r05-recovery-v1/worker.py'
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != '8e7542135fefd0702b9c14ea0cc696fa86d592c32e48c870de434076e88ceb3a':
    raise RuntimeError('R05 worker source drift')
spec = importlib.util.spec_from_file_location('r06_worker', SOURCE)
w = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = w
spec.loader.exec_module(w)
c, o = w.coordination, w.operation

class RecoveryStore(c.Store):
    """Pinned-schema read view, result reconciliation and local outbox projection."""
    def inspect(self, dispatch_id):
        con = None
        try:
            con = self._connect()
            con.execute('BEGIN')
            now = self._preflight(con)
            state = self._snapshot(con, c.text(dispatch_id))
            for name in ('attempts', 'retries', 'terminals'):
                state[name] = [dict(row) for row in con.execute(
                    'SELECT * FROM '+name+' WHERE dispatch_id=? ORDER BY rowid', (dispatch_id,))]
            claim = con.execute("SELECT * FROM claims WHERE dispatch_id=? AND state='current'", (dispatch_id,)).fetchone()
            state['claim'] = dict(claim) if claim else None
            lease = con.execute('SELECT * FROM leases WHERE claim_id=? ORDER BY generation DESC LIMIT 1', (claim['claim_id'],)).fetchone() if claim else None
            state['lease'] = dict(lease) if lease else None
            c.require(not claim or lease is not None, 'LEASE_MISSING')
            events = []
            transitions = con.execute('SELECT * FROM transitions WHERE dispatch_id=? ORDER BY version', (dispatch_id,)).fetchall()
            c.require([r['version'] for r in transitions] == list(range(state['dispatch']['version']+1)), 'TRANSITION_GAP')
            for transition in transitions:
                event = con.execute('SELECT * FROM dispatch_outbox WHERE transition_id=?', (transition['transition_id'],)).fetchone()
                c.require(event is not None and event['event_id'] == transition['transition_id'] and event['payload_json'] == transition['evidence_json'], 'OUTBOX_EVIDENCE')
                envelope = json.loads(event['payload_json'])
                response = envelope['response']
                c.require(response['dispatch_id'] == dispatch_id and response['version'] == transition['version'] and response['transition_id'] == transition['transition_id'] and response['command_digest'] == transition['command_digest'], 'TRANSITION_EVIDENCE')
                events.append({**dict(event), 'payload_digest':c.digest(envelope)})
            state.update(now=now, events=events)
            return state
        except (sqlite3.Error, ValueError, KeyError, TypeError) as error:
            raise c.StoreFailure('READ_UNKNOWN', 'unknown', str(error)) from error
        finally:
            if con:con.close()

    def reconcile_observed(self, tid, did, version, authority, evidence):
        # R03 only accepts a latest unknown attempt. A late older success can
        # also be observed after a later failed attempt. Preserve both outcomes.
        c.keys(evidence, 'invocation_id binding_digest payload_digest result_digest result_json')
        evidence = json.loads(c.canonical(evidence))
        c.require(c.digest(evidence['result_json']) == evidence['result_digest'], 'RESULT_DIGEST')
        def action(con, now):
            row = self._first(con, did)
            for field in ('invocation_id', 'binding_digest', 'payload_digest'):
                c.require(evidence[field] == row[field], 'RESULT_IDENTITY')
            last = con.execute('SELECT * FROM attempts WHERE dispatch_id=? AND occurrence_id=? ORDER BY attempt_number DESC LIMIT 1', (did, row['occurrence_id'])).fetchone()
            c.require(last is not None and last['outcome'] in ('failed', 'unknown'), 'RECONCILIATION_PREDECESSOR')
            con.execute('INSERT INTO progress VALUES(?,?,?,?,?)', (did,row['occurrence_id'],evidence['result_digest'],c.canonical(evidence),now))
            con.execute("UPDATE dispatches SET state='leased' WHERE dispatch_id=?", (did,))
            return {}
        return self._write(tid,did,version,'reconcile-result',evidence,action,authority)

    def acknowledge(self, dispatch_id, event_id, payload_digest):
        """Record local hint observation only. No recovery version or state change."""
        c.text(dispatch_id); c.text(event_id); c.hash_text(payload_digest)
        con = None
        commit_started = False
        try:
            con = self._connect(True)
            con.execute('BEGIN IMMEDIATE')
            now = self._preflight(con)
            row = con.execute('SELECT e.*,t.dispatch_id,t.evidence_json FROM dispatch_outbox e JOIN transitions t ON t.transition_id=e.transition_id WHERE e.event_id=?', (event_id,)).fetchone()
            c.require(row is not None and row['dispatch_id'] == dispatch_id, 'HINT_NOT_FOUND')
            c.require(row['payload_json'] == row['evidence_json'] and c.digest(json.loads(row['payload_json'])) == payload_digest, 'HINT_MISMATCH')
            if row['delivered_at'] is not None:
                con.execute('ROLLBACK')
                return {'event_id':event_id, 'observed_at':row['delivered_at'], 'existing':True}
            con.execute('UPDATE dispatch_outbox SET delivered_at=? WHERE event_id=?', (now,event_id))
            self._before_commit()
            final_now = self._time(con)
            c.require(final_now >= now, 'CLOCK_REGRESSION')
            con.execute('UPDATE metadata SET clock_high_water=? WHERE singleton=1', (final_now,))
            commit_started = True
            con.execute('COMMIT')
            self._after_commit()
            return {'event_id':event_id, 'observed_at':now, 'existing':False}
        except sqlite3.Error as error:
            code = getattr(error,'sqlite_errorcode',0) & 255
            classification = 'retryable' if not commit_started and code in (sqlite3.SQLITE_BUSY,sqlite3.SQLITE_LOCKED) else 'unknown'
            raise c.StoreFailure('PROJECTION_SQLITE',classification,str(error)) from error
        except (OSError, ValueError, KeyError, TypeError) as error:
            raise c.StoreFailure('PROJECTION_UNKNOWN','unknown',str(error)) from error
        finally:
            if con:con.close()

class Recovery:
    """Caller polls every 1000 ms; no network, background daemon or cross-boot resume."""
    def __init__(self, coordination_path, operation_path, dispatch_id, claimant_id,
                 clock=c.native_clock):
        self.paths = coordination_path, operation_path
        self.dispatch_id, self.claimant_id, self.clock = dispatch_id, claimant_id, clock
        self.worker = w.Worker(*self.paths, claimant_id, clock)
        self.store = RecoveryStore(coordination_path, 'coordination', clock)
        self._lock = threading.Lock()

    def _view(self):
        _, invocations = self.worker._preflight(self.dispatch_id)
        state = self.store.inspect(self.dispatch_id)
        # Completion requires current Operation-owned evidence, not just counts.
        for progress in state['progress']:
            actual = self.worker.ledger.recognize(invocations[progress['occurrence_id']])
            c.require(actual is not None and actual['evidence']['result_digest'] == progress['result_digest'] and actual['evidence'] == json.loads(progress['result_evidence_json']), 'PROGRESS_EVIDENCE')
        return state, invocations

    def pending_hints(self):
        with self._lock:
            state, _ = self._view()
            return [event for event in state['events'] if event['delivered_at'] is None]

    def acknowledge(self, event_id, payload_digest):
        with self._lock:
            self._view()
            return self.store.acknowledge(self.dispatch_id, event_id, payload_digest)

    def _after_step(self, result):
        """No-op crash-test seam after a durable step and before response delivery."""

    def poll(self, event_id=None):
        with self._lock:
            try:
                result = self._poll(event_id)
                self._after_step(result)
                return result
            except (c.StoreFailure, o.LedgerFailure, w.WorkerFailure, OSError) as error:
                classification = getattr(error, 'classification', 'unknown' if isinstance(error,OSError) else 'non-retryable')
                return {'status':{'unknown':'unknown','retryable':'waiting'}.get(classification,'blocked'),
                        'code':getattr(error,'code',type(error).__name__), 'classification':classification}

    def _poll(self, event_id):
        state, invocations = self._view()
        if event_id is not None:
            c.require(any(event['event_id']==event_id for event in state['events']), 'HINT_NOT_FOUND')
        if state['dispatch']['state'] == 'terminal':
            c.require(len(state['terminals']) == 1, 'TERMINAL_MISSING')
            return {'status':'terminal', 'terminal':state['terminals'][0]}
        claim, lease, now = state['claim'], state['lease'], state['now']
        held = self.worker._claim
        mine = bool(held and claim and held[1]['claim_id']==claim['claim_id'] and held[1]['lease_id']==lease['lease_id'])
        active = any(attempt['outcome'] is None for attempt in state['attempts'])
        if claim and now < lease['expires_at'] and (not mine or active):
            # An unfinished call must age out; renewing it forever prevents restart.
            return {'status':'waiting', 'reason':'active-attempt' if active else 'active-claim', 'not_before':lease['expires_at']}
        if not mine or now >= lease['expires_at']:
            self.worker = w.Worker(*self.paths, self.claimant_id, self.clock)
            self.worker.acquire(self.dispatch_id)
        elif now >= lease['valid_from'] + 1000:
            self.worker.renew()
        state, invocations = self._view()
        authority = self.worker._claim[1]
        version = state['dispatch']['version']
        done = {row['occurrence_id'] for row in state['progress']}
        pending = [row for row in state['occurrences'] if row['occurrence_id'] not in done]
        if not pending:
            result = self.store.terminal(w.identity(),self.dispatch_id,version,authority,'completed')
            return {'status':'terminal-recorded','disposition':'completed','coordination':result}
        first = pending[0]
        attempts = [row for row in state['attempts'] if row['occurrence_id']==first['occurrence_id']]
        last = max(attempts,key=lambda row:row['attempt_number']) if attempts else None
        observed = self.worker.ledger.recognize(invocations[first['occurrence_id']])
        if observed is not None:
            result = self.store.reconcile_observed(w.identity(),self.dispatch_id,version,authority,observed['evidence'])
            return {'status':'reconciled','coordination':result,'evidence':observed['evidence']}
        if last is None:
            return self.worker.run_one()
        c.require(last['outcome'] in ('failed','unknown'), 'PREDECESSOR_STATE')
        continuation = first['continuation']
        if continuation != 'retry' or last['attempt_number'] == 3:
            disposition = 'escalated' if continuation == 'escalate' else 'exhausted'
            result = self.store.terminal(w.identity(),self.dispatch_id,version,authority,disposition)
            return {'status':'terminal-recorded','disposition':disposition,'coordination':result}
        schedule = next((row for row in state['retries'] if row['occurrence_id']==first['occurrence_id'] and row['successor_number']==last['attempt_number']+1),None)
        if schedule is None:
            result = self.store.schedule(w.identity(),self.dispatch_id,version,authority)
            return {'status':'retry-scheduled','not_before':result['not_before'],'coordination':result}
        c.require(schedule['predecessor_attempt_id']==last['attempt_id'] and schedule['remaining_budget']==3-last['attempt_number'] and schedule['policy_ref']==first['policy_ref'], 'RETRY_EVIDENCE')
        if state['now'] < schedule['not_before']:
            return {'status':'waiting','reason':'retry-delay','not_before':schedule['not_before']}
        return self.worker.run_one()
