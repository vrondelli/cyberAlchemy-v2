"""R03 SQLite coordination candidate. No Operation calls or business database access."""
from __future__ import annotations
import dataclasses
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[6]
R02 = HERE.parent / 'r02-recovery-v1'
SCHEMA = R02 / 'coordination.sql'
REFERENCE = ROOT / 'projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/workflow_compensation_v1.py'
SCHEMA_HASH = '233d1e70e1f61b9b6b8ce7d421080ba65e884d706388d38f5c27cbc4b1f3e538'
PROFILE_HASH = '3e7ff6fd9e72bc8909005bae327956ed2830f3d24400eeffc7bbf8212a7fc8e9'
REFERENCE_HASH = '89945aae5ee7063dde3bf8cbe0a4f0b2dbd7ce609cdc80707f9b80cba1ea371c'

class StoreFailure(Exception):
    def __init__(self, code, classification='non-retryable', detail=''):
        super().__init__(f'{code}: {detail}')
        self.code, self.classification, self.detail = code, classification, detail

def require(value, code):
    if not value:
        raise StoreFailure(code)

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False)

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

require(file_hash(SCHEMA) == SCHEMA_HASH, 'SCHEMA_SOURCE_DRIFT')
require(file_hash(REFERENCE) == REFERENCE_HASH, 'REFERENCE_SOURCE_DRIFT')
spec = importlib.util.spec_from_file_location('r03_recovery_reference', REFERENCE)
reference = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = reference
spec.loader.exec_module(reference)

def text(value):
    require(isinstance(value, str) and 0 < len(value) <= 512, 'INVALID_ID')
    return value

def hash_text(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value), 'INVALID_DIGEST')
    return value

def keys(value, expected):
    require(isinstance(value, dict) and set(value) == set(expected.split()), 'INVALID_FIELDS')

def native_clock():
    return Path('/proc/sys/kernel/random/boot_id').read_text().strip(), time.monotonic_ns() // 1_000_000

def schema_shape(con):
    return [tuple(r) for r in con.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name")]

with sqlite3.connect(':memory:') as prototype:
    prototype.executescript(SCHEMA.read_text())
    EXPECTED_SHAPE = schema_shape(prototype)

def verify_registration(intent, bindings):
    keys(intent, 'schema_version intent_id workflow_id workflow_execution_id failure_occurrence_id failed_step_id completed_step_journal_digest plan_digest semantic_status plan')
    require(intent['schema_version'] == 'domainspec.workflow-recovery-intent/v2' and intent['semantic_status'] == 'required', 'INTENT_STATE')
    require(isinstance(intent['plan'], list) and 1 <= len(intent['plan']) <= 8, 'PLAN_BOUND')
    for field in ['workflow_id','workflow_execution_id','failure_occurrence_id','failed_step_id']:
        require(re.fullmatch('[a-z][a-z0-9]*(?:-[a-z0-9]+)*', text(intent[field])), 'INTENT_ID')
    for field in ['intent_id','completed_step_journal_digest','plan_digest']:
        hash_text(intent[field])
    entries = []
    for row in intent['plan']:
        keys(row, 'plan_occurrence_id step_id operation_id depends_on invocation_identity')
        require(isinstance(row['depends_on'], list), 'PLAN_DEPENDENCIES')
        for field in ['plan_occurrence_id','step_id','operation_id']:
            require(re.fullmatch('[a-z][a-z0-9]*(?:-[a-z0-9]+)*', text(row[field])), 'PLAN_ID')
        hash_text(row['invocation_identity'])
        entries.append(reference.RecoveryPlanEntry(**{**row, 'depends_on': tuple(row['depends_on'])}))
    reference._verify_intent(reference.RecoveryIntent(**{**intent, 'plan': tuple(entries)}))
    require(isinstance(bindings, list) and len(bindings) == len(entries), 'BINDING_COVERAGE')
    for row, entry in zip(bindings, entries):
        keys(row, 'occurrence_id binding_digest payload continuation policy_ref')
        require(row['occurrence_id'] == entry.plan_occurrence_id, 'BINDING_OCCURRENCE')
        hash_text(row['binding_digest'])
        require(isinstance(row['payload'], dict), 'PAYLOAD_TYPE')
        canonical(row['payload'])
        require(row['continuation'] in ['retry','escalate','terminal-failure'], 'CONTINUATION')
        require(row['policy_ref'] == 'r01-local-retry-v1', 'POLICY')

class Store:
    """Thread/process-local facade. Each public transition owns one SQLite transaction.

    Typed exceptions specialize R02's Failure union: .classification and .code are
    explicit. Raw SQL, callbacks, and an arbitrary Command.kind are not public APIs.
    """
    def __init__(self, path, resource_id, clock=native_clock):
        self.path = Path(path).absolute()
        require(not self.path.is_symlink(), 'RESOURCE_ALIAS')
        self.resource_id, self.clock = text(resource_id), clock
        require(self.path.is_file(), 'MISSING_STORE')
        try:
            con = sqlite3.connect(self.path.as_uri() + '?mode=ro', uri=True, autocommit=True)
            con.row_factory = sqlite3.Row
            try:
                self._preflight(con)
            finally:
                con.close()
        except sqlite3.Error as e:
            raise StoreFailure('STORE_UNREADABLE', 'unknown', str(e)) from e

    @classmethod
    def initialize(cls, path, resource_id, clock=native_clock):
        path = Path(path).absolute()
        text(resource_id)
        boot, now = clock()
        text(boot)
        require(type(now) is int and 0 <= now < 2**63 - 5000, 'CLOCK_INVALID')
        # Exclusive creation never overwrites an owner-controlled database.
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        con = sqlite3.connect(path, autocommit=True)
        try:
            con.execute('PRAGMA journal_mode=DELETE')
            con.execute('PRAGMA synchronous=EXTRA')
            con.executescript('BEGIN IMMEDIATE;\n' + SCHEMA.read_text())
            con.execute('INSERT INTO metadata VALUES(1,1,?,?,?,?)', (PROFILE_HASH, boot, resource_id, now))
            con.execute('COMMIT')
        except BaseException:
            if con.in_transaction:
                con.execute('ROLLBACK')
            raise  # Preserve failed initialization for diagnosis, never delete it.
        finally:
            con.close()
        return cls(path, resource_id, clock)

    def _preflight(self, con):
        require(con.execute('PRAGMA user_version').fetchone()[0] == 1, 'SCHEMA_VERSION')
        require(schema_shape(con) == EXPECTED_SHAPE, 'SCHEMA_SHAPE')
        rows = con.execute('SELECT * FROM metadata').fetchall()
        require(len(rows) == 1, 'METADATA')
        row = rows[0]
        require(row['schema_version'] == 1 and row['profile_digest'] == PROFILE_HASH, 'PROFILE_MISMATCH')
        require(row['resource_id'] == self.resource_id, 'RESOURCE_MISMATCH')
        require(con.execute('PRAGMA journal_mode').fetchone()[0] == 'delete', 'JOURNAL_MISMATCH')
        return self._time(con)

    def _time(self, con):
        boot, now = self.clock()
        row = con.execute('SELECT * FROM metadata WHERE singleton=1').fetchone()
        require(boot == row['boot_id'], 'BOOT_MISMATCH')
        require(type(now) is int and row['clock_high_water'] <= now < 2**63 - 5000, 'CLOCK_REGRESSION')
        return now

    def _connect(self, writable=False):
        con = sqlite3.connect(self.path.as_uri() + ('?mode=rw' if writable else '?mode=ro'), uri=True, autocommit=True, timeout=0.1)
        con.row_factory = sqlite3.Row
        try:
            self._preflight(con)
            if writable:
                con.execute('PRAGMA foreign_keys=ON')
                con.execute('PRAGMA synchronous=EXTRA')
                require(con.execute('PRAGMA foreign_keys').fetchone()[0] == 1 and con.execute('PRAGMA synchronous').fetchone()[0] == 3, 'CONFIGURATION')
            return con
        except BaseException:
            con.close()
            raise

    def _snapshot(self, con, dispatch_id):
        row = con.execute('SELECT * FROM dispatches WHERE dispatch_id=?', (dispatch_id,)).fetchone()
        require(row is not None, 'DISPATCH_MISSING')
        intent = con.execute('SELECT * FROM intents WHERE intent_id=?', (row['intent_id'],)).fetchone()
        plan = [dict(x) for x in con.execute('SELECT * FROM occurrences WHERE dispatch_id=? ORDER BY ordinal', (dispatch_id,))]
        decoded = json.loads(intent['frozen_intent_json'])
        bindings = [{'occurrence_id':r['occurrence_id'], 'binding_digest':r['binding_digest'], 'payload':json.loads(r['payload_json']), 'continuation':r['continuation'], 'policy_ref':r['policy_ref']} for r in plan]
        verify_registration(decoded, bindings)
        require(decoded['intent_id'] == intent['intent_id'] and decoded['plan_digest'] == intent['plan_digest'] and digest(bindings) == intent['binding_digest'], 'STORED_IDENTITY_DRIFT')
        for i, (r, e) in enumerate(zip(plan, decoded['plan'])):
            require(r['ordinal'] == i and r['operation_id'] == e['operation_id'] and r['invocation_id'] == e['invocation_identity'] and r['payload_digest'] == digest(json.loads(r['payload_json'])), 'STORED_PLAN_DRIFT')
        return {'dispatch':dict(row), 'intent':decoded, 'occurrences':plan, 'progress':[dict(x) for x in con.execute('SELECT * FROM progress WHERE dispatch_id=? ORDER BY occurrence_id', (dispatch_id,))]}

    def load(self, dispatch_id):
        con = None
        try:
            con = self._connect()
            con.execute('BEGIN')
            return self._snapshot(con, text(dispatch_id))
        except sqlite3.Error as e:
            raise StoreFailure('READ_UNKNOWN', 'unknown', str(e)) from e
        finally:
            if con: con.close()

    def lookup_transition(self, transition_id, command_digest):
        con = None
        try:
            con = self._connect()
            row = con.execute('SELECT * FROM transitions WHERE transition_id=?', (text(transition_id),)).fetchone()
            if row is None: return None
            require(row['command_digest'] == hash_text(command_digest), 'COMMAND_MISMATCH')
            return json.loads(row['evidence_json'])['response']
        except sqlite3.Error as e:
            raise StoreFailure('READ_UNKNOWN', 'unknown', str(e)) from e
        finally:
            if con: con.close()

    def _before_commit(self):
        """No-op seam overridden only by fault-injection test subclasses."""

    def _after_commit(self):
        """No-op seam for a lost-response process test."""

    def _write(self, tid, did, version, kind, payload, action, authority=None):
        text(tid); text(did)
        require(type(version) is int and version >= -1, 'VERSION_INVALID')
        cmd_digest = digest({'dispatch_id':did,'expected_version':version,'kind':kind,'payload':payload,'authority':authority})
        con = None
        try:
            con = self._connect(True)
            con.execute('BEGIN IMMEDIATE')
            now = self._preflight(con)
            require(not con.execute('SELECT 1 FROM transitions WHERE transition_id=?',(tid,)).fetchone(), 'DUPLICATE_TRANSITION')
            if version >= 0:
                snapshot = self._snapshot(con,did)
                require(snapshot['dispatch']['version'] == version, 'VERSION_CONFLICT')
                require(snapshot['dispatch']['state'] != 'terminal', 'TERMINAL')
            expires = None
            if authority is not None:
                keys(authority,'claim_id fence lease_id lease_generation')
                text(authority['claim_id']); text(authority['lease_id'])
                require(type(authority['fence']) is int and authority['fence'] > 0 and type(authority['lease_generation']) is int and authority['lease_generation'] > 0, 'AUTHORITY_TYPE')
                claim = con.execute("SELECT * FROM claims WHERE dispatch_id=? AND claim_id=? AND state='current'",(did,authority['claim_id'])).fetchone()
                require(claim is not None and claim['fence'] == authority['fence'], 'CLAIM_INVALID')
                lease = con.execute('SELECT * FROM leases WHERE claim_id=? ORDER BY generation DESC LIMIT 1',(claim['claim_id'],)).fetchone()
                require(lease is not None and lease['lease_id'] == authority['lease_id'] and lease['generation'] == authority['lease_generation'], 'LEASE_GENERATION')
                require(lease['valid_from'] <= now < lease['expires_at'], 'LEASE_EXPIRED')
                expires = lease['expires_at']
            extra = action(con,now)
            if extra.pop('_existing',False):
                con.execute('ROLLBACK')
                return extra
            next_version = version + 1
            if version >= 0:
                require(con.execute('UPDATE dispatches SET version=? WHERE dispatch_id=? AND version=?',(next_version,did,version)).rowcount == 1,'VERSION_CONFLICT')
            state = con.execute('SELECT state FROM dispatches WHERE dispatch_id=?',(did,)).fetchone()[0]
            response = {'dispatch_id':did,'version':next_version,'state':state,'transition_id':tid,'command_digest':cmd_digest,**extra}
            evidence = canonical({'kind':kind,'response':response})
            con.execute('INSERT INTO transitions VALUES(?,?,?,?,?)',(tid,did,next_version,cmd_digest,evidence))
            con.execute('INSERT INTO dispatch_outbox VALUES(?,?,?,NULL)',(tid,tid,evidence))
            self._before_commit()
            final_now = self._time(con)
            require(final_now >= now, 'CLOCK_REGRESSION')
            if expires is not None: require(final_now < expires,'LEASE_EXPIRED')
            con.execute('UPDATE metadata SET clock_high_water=? WHERE singleton=1',(final_now,))
            con.execute('COMMIT')
            self._after_commit()
            return response
        except sqlite3.Error as e:
            code = getattr(e,'sqlite_errorcode',0) & 255
            classification = 'retryable' if code in (sqlite3.SQLITE_BUSY,sqlite3.SQLITE_LOCKED) else 'non-retryable' if isinstance(e,sqlite3.IntegrityError) else 'unknown'
            raise StoreFailure('SQLITE_'+str(code),classification,str(e)) from e
        finally:
            if con: con.close()  # An uncommitted transaction rolls back on close.

    def register(self, tid, dispatch_id, intent, bindings):
        # Freeze caller objects before validation and transaction execution.
        intent, bindings = json.loads(canonical(intent)), json.loads(canonical(bindings))
        verify_registration(intent,bindings)
        def action(con,now):
            existing=con.execute('SELECT * FROM intents WHERE workflow_execution_id=? AND failure_occurrence_id=?',(intent['workflow_execution_id'],intent['failure_occurrence_id'])).fetchone()
            if existing:
                require(existing['frozen_intent_json']==canonical(intent) and existing['binding_digest']==digest(bindings),'DUPLICATE_FAILURE_MISMATCH')
                row=con.execute('SELECT * FROM dispatches WHERE intent_id=?',(existing['intent_id'],)).fetchone()
                require(row['dispatch_id']==dispatch_id,'DUPLICATE_DISPATCH_IDENTITY')
                return {'_existing':True,'dispatch_id':dispatch_id,'version':row['version'],'state':row['state'],'existing':True}
            con.execute('INSERT INTO intents VALUES(?,?,?,?,?,?,?,?,?)',(intent['intent_id'],intent['workflow_execution_id'],intent['failure_occurrence_id'],intent['workflow_id'],intent['failed_step_id'],intent['completed_step_journal_digest'],intent['plan_digest'],canonical(intent),digest(bindings)))
            con.execute("INSERT INTO dispatches VALUES(?,?,'ready',0,0)",(dispatch_id,intent['intent_id']))
            for i,(entry,binding) in enumerate(zip(intent['plan'],bindings)):
                con.execute('INSERT INTO occurrences VALUES(?,?,?,?,?,?,?,?,?,?)',(dispatch_id,entry['plan_occurrence_id'],i,entry['operation_id'],entry['invocation_identity'],binding['binding_digest'],digest(binding['payload']),canonical(binding['payload']),binding['continuation'],binding['policy_ref']))
            return {}
        return self._write(tid,dispatch_id,-1,'register-recovery',{'intent':intent,'bindings':bindings},action)

    def acquire(self,tid,did,version,claim_id,claimant_id,lease_id):
        for v in [claim_id,claimant_id,lease_id]:text(v)
        def action(con,now):
            current=con.execute("SELECT * FROM claims WHERE dispatch_id=? AND state='current'",(did,)).fetchone()
            if current:
                lease=con.execute('SELECT * FROM leases WHERE claim_id=? ORDER BY generation DESC LIMIT 1',(current['claim_id'],)).fetchone()
                require(lease is not None and now >= lease['expires_at'],'CLAIM_ACTIVE')
                con.execute("UPDATE claims SET state='superseded' WHERE claim_id=?",(current['claim_id'],))
                con.execute("UPDATE attempts SET finished_at=?,outcome='unknown',evidence_json=? WHERE dispatch_id=? AND outcome IS NULL",(now,canonical({'cause':'claim-takeover'}),did))
            fence=con.execute('SELECT max_fence FROM dispatches WHERE dispatch_id=?',(did,)).fetchone()[0]+1
            con.execute('INSERT INTO claims VALUES(?,?,?,?,?,?,?)',(claim_id,did,claimant_id,fence,version,now,'current'))
            con.execute('INSERT INTO leases VALUES(?,?,1,?,?,NULL)',(lease_id,claim_id,now,now+5000))
            con.execute("UPDATE dispatches SET state='leased',max_fence=? WHERE dispatch_id=?",(fence,did))
            return {'authority':{'claim_id':claim_id,'fence':fence,'lease_id':lease_id,'lease_generation':1}}
        return self._write(tid,did,version,'acquire-claim',{'claim_id':claim_id,'claimant_id':claimant_id,'lease_id':lease_id},action)

    def renew(self,tid,did,version,authority,new_lease_id):
        text(new_lease_id)
        def action(con,now):
            gen=authority['lease_generation']+1
            con.execute('INSERT INTO leases VALUES(?,?,?,?,?,?)',(new_lease_id,authority['claim_id'],gen,now,now+5000,authority['lease_id']))
            return {'authority':{**authority,'lease_id':new_lease_id,'lease_generation':gen}}
        return self._write(tid,did,version,'renew-lease',{'lease_id':new_lease_id},action,authority)

    @staticmethod
    def _first(con,did):
        row=con.execute('SELECT o.* FROM occurrences o LEFT JOIN progress p ON p.dispatch_id=o.dispatch_id AND p.occurrence_id=o.occurrence_id WHERE o.dispatch_id=? AND p.occurrence_id IS NULL ORDER BY o.ordinal LIMIT 1',(did,)).fetchone()
        require(row is not None,'NO_INCOMPLETE_OCCURRENCE')
        return row

    def start(self,tid,did,version,authority,attempt_id):
        text(attempt_id)
        def action(con,now):
            require(not con.execute('SELECT 1 FROM attempts WHERE dispatch_id=? AND outcome IS NULL',(did,)).fetchone(),'ATTEMPT_ACTIVE')
            row=self._first(con,did)
            n=con.execute('SELECT count(*) FROM attempts WHERE dispatch_id=? AND occurrence_id=?',(did,row['occurrence_id'])).fetchone()[0]+1
            require(n<=3,'BUDGET_EXHAUSTED')
            if n>1:
                retry=con.execute('SELECT * FROM retries WHERE dispatch_id=? AND occurrence_id=? AND successor_number=?',(did,row['occurrence_id'],n)).fetchone()
                require(retry is not None and now>=retry['not_before'],'RETRY_NOT_ELIGIBLE')
            con.execute('INSERT INTO attempts VALUES(?,?,?,?,?,?,?,?,NULL,NULL,NULL)',(attempt_id,did,row['occurrence_id'],n,authority['claim_id'],authority['lease_id'],authority['fence'],now))
            con.execute("UPDATE dispatches SET state='executing' WHERE dispatch_id=?",(did,))
            return {'attempt_id':attempt_id,'invocation_id':row['invocation_id'],'occurrence_id':row['occurrence_id']}
        return self._write(tid,did,version,'start-attempt',{'attempt_id':attempt_id},action,authority)

    def outcome(self,tid,did,version,authority,attempt_id,outcome,evidence):
        require(outcome in ['succeeded','failed','unknown'],'OUTCOME_INVALID')
        require(isinstance(evidence,dict) and evidence,'EVIDENCE_REQUIRED')
        evidence=json.loads(canonical(evidence))
        def action(con,now):
            attempt=con.execute('SELECT * FROM attempts WHERE dispatch_id=? AND attempt_id=?',(did,attempt_id)).fetchone()
            require(attempt is not None and attempt['outcome'] is None,'ATTEMPT_NOT_ACTIVE')
            require(attempt['claim_id']==authority['claim_id'] and attempt['fence']==authority['fence'],'ATTEMPT_OWNER')
            row=self._first(con,did)
            require(row['occurrence_id']==attempt['occurrence_id'],'PROGRESS_ORDER')
            if outcome=='succeeded':
                require(evidence.get('invocation_id')==row['invocation_id'],'RESULT_IDENTITY')
                result_digest=hash_text(evidence.get('result_digest'))
                con.execute('INSERT INTO progress VALUES(?,?,?,?,?)',(did,row['occurrence_id'],result_digest,canonical(evidence),now))
            con.execute('UPDATE attempts SET outcome=?,finished_at=?,evidence_json=? WHERE attempt_id=?',(outcome,now,canonical(evidence),attempt_id))
            con.execute("UPDATE dispatches SET state='leased' WHERE dispatch_id=?",(did,))
            return {}
        return self._write(tid,did,version,'record-outcome',{'attempt_id':attempt_id,'outcome':outcome,'evidence':evidence},action,authority)

    def reconcile(self,tid,did,version,authority,evidence):
        """Record caller-verified Operation result without rewriting a lost attempt.

        The store validates identity and shape, not the external result's truth.
        R04/R05 must supply a result observed from the exact Operation resource.
        """
        keys(evidence,'invocation_id binding_digest payload_digest result_digest result_json')
        evidence=json.loads(canonical(evidence))
        hash_text(evidence['result_digest'])
        require(digest(evidence['result_json'])==evidence['result_digest'],'RESULT_DIGEST')
        def action(con,now):
            row=self._first(con,did)
            for field in ['invocation_id','binding_digest','payload_digest']:
                require(evidence[field]==row[field],'RESULT_IDENTITY')
            last=con.execute('SELECT * FROM attempts WHERE dispatch_id=? AND occurrence_id=? ORDER BY attempt_number DESC LIMIT 1',(did,row['occurrence_id'])).fetchone()
            require(last is not None and last['outcome']=='unknown','RECONCILIATION_PREDECESSOR')
            con.execute('INSERT INTO progress VALUES(?,?,?,?,?)',(did,row['occurrence_id'],evidence['result_digest'],canonical(evidence),now))
            con.execute("UPDATE dispatches SET state='leased' WHERE dispatch_id=?",(did,))
            return {}
        return self._write(tid,did,version,'reconcile-result',evidence,action,authority)

    def schedule(self,tid,did,version,authority):
        def action(con,now):
            row=self._first(con,did)
            require(row['continuation']=='retry','RETRY_NOT_SELECTED')
            attempt=con.execute('SELECT * FROM attempts WHERE dispatch_id=? AND occurrence_id=? ORDER BY attempt_number DESC LIMIT 1',(did,row['occurrence_id'])).fetchone()
            require(attempt is not None and attempt['outcome'] in ['failed','unknown'],'RETRY_PREDECESSOR')
            require(attempt['attempt_number']<3,'BUDGET_EXHAUSTED')
            con.execute('INSERT INTO retries VALUES(?,?,?,?,?,?,?)',(did,row['occurrence_id'],attempt['attempt_id'],attempt['attempt_number']+1,now+1000,3-attempt['attempt_number'],row['policy_ref']))
            con.execute("UPDATE dispatches SET state='retry-scheduled' WHERE dispatch_id=?",(did,))
            return {'not_before':now+1000}
        return self._write(tid,did,version,'schedule-retry',{},action,authority)

    def terminal(self,tid,did,version,authority,disposition):
        require(disposition in ['completed','exhausted','escalated'],'TERMINAL_INVALID')
        def action(con,now):
            require(not con.execute('SELECT 1 FROM attempts WHERE dispatch_id=? AND outcome IS NULL',(did,)).fetchone(),'ATTEMPT_ACTIVE')
            last=None
            if disposition=='completed':
                counts=[con.execute('SELECT count(*) FROM '+table+' WHERE dispatch_id=?',(did,)).fetchone()[0] for table in ['occurrences','progress']]
                require(counts[0]==counts[1],'INCOMPLETE_RECOVERY')
            else:
                row=self._first(con,did)
                last=con.execute('SELECT * FROM attempts WHERE dispatch_id=? AND occurrence_id=? ORDER BY attempt_number DESC LIMIT 1',(did,row['occurrence_id'])).fetchone()
                require(last is not None and last['outcome'] in ['failed','unknown'],'TERMINAL_EVIDENCE')
                allowed=(row['continuation']=='escalate') if disposition=='escalated' else (row['continuation']=='terminal-failure' or (row['continuation']=='retry' and last['attempt_number']==3))
                require(allowed,'TERMINAL_NOT_SELECTED')
            evidence=canonical({'disposition':disposition,'source_version':version,'last_attempt':dict(last) if last else None})
            con.execute('INSERT INTO terminals VALUES(?,?,?,?,?,?,?)',(did,disposition,'satisfied' if disposition=='completed' else 'unresolved',last['attempt_id'] if last else None,'explicit-policy-or-progress',evidence,now))
            con.execute("UPDATE dispatches SET state='terminal' WHERE dispatch_id=?",(did,))
            return {'disposition':disposition}
        return self._write(tid,did,version,'record-terminal',{'disposition':disposition},action,authority)
