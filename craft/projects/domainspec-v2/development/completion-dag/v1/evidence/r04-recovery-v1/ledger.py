"""R04 local balance adjustment and replay ledger. No coordination-store dependency."""
from __future__ import annotations
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
SCHEMA = HERE.parent / 'r02-recovery-v1/operation.sql'
REFERENCE = ROOT / 'projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/workflow_compensation_v1.py'
PROFILE_HASH = '3e7ff6fd9e72bc8909005bae327956ed2830f3d24400eeffc7bbf8212a7fc8e9'
OPERATION_ID = 'adjust-balance'
MAX_VALUE = 2**63 - 1

class LedgerFailure(Exception):
    def __init__(self, code, classification='non-retryable', detail=''):
        super().__init__(f'{code}: {detail}')
        self.code, self.classification, self.detail = code, classification, detail

def require(value, code):
    if not value: raise LedgerFailure(code)

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False)

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def file_hash(p): return hashlib.sha256(p.read_bytes()).hexdigest()
require(file_hash(SCHEMA) == 'e646328a14cd34ce04089e65a1afa7f99969ea3b90b7c4b51cd963ada058844a', 'SCHEMA_SOURCE_DRIFT')
require(file_hash(REFERENCE) == '89945aae5ee7063dde3bf8cbe0a4f0b2dbd7ce609cdc80707f9b80cba1ea371c', 'REFERENCE_SOURCE_DRIFT')
spec = importlib.util.spec_from_file_location('r04_identity_reference', REFERENCE)
reference = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = reference
spec.loader.exec_module(reference)
BINDING_DIGEST = digest({'operation_id': OPERATION_ID, 'adapter_sha256': file_hash(Path(__file__)), 'schema_sha256': file_hash(SCHEMA), 'payload_version': 1})

def identity(value):
    require(isinstance(value, str) and re.fullmatch('[a-z][a-z0-9]*(?:-[a-z0-9]+)*', value) and len(value) <= 128, 'INVALID_ID')
    return value

def hash_text(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value), 'INVALID_DIGEST')
    return value

def keys(value, fields):
    require(isinstance(value, dict) and set(value) == set(fields.split()), 'INVALID_FIELDS')

def schema_shape(c):
    return [tuple(r) for r in c.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name")]
with sqlite3.connect(':memory:') as c:
    c.executescript(SCHEMA.read_text())
    EXPECTED_SHAPE = schema_shape(c)

def make_invocation(intent_id, plan_digest, occurrence_id, subject_id, delta):
    payload = {'subject_id': subject_id, 'delta': delta}
    return {'intent_id': intent_id, 'plan_digest': plan_digest, 'plan_occurrence_id': occurrence_id,
            'operation_id': OPERATION_ID, 'invocation_id': reference._invocation_identity(intent_id, plan_digest, OPERATION_ID, occurrence_id),
            'binding_digest': BINDING_DIGEST, 'payload_digest': digest(payload), 'payload': payload}

def validate_invocation(value):
    keys(value, 'intent_id plan_digest plan_occurrence_id operation_id invocation_id binding_digest payload_digest payload')
    for f in ['intent_id', 'plan_digest', 'invocation_id', 'binding_digest', 'payload_digest']: hash_text(value[f])
    identity(value['plan_occurrence_id'])
    require(value['operation_id'] == OPERATION_ID, 'OPERATION_MISMATCH')
    require(value['binding_digest'] == BINDING_DIGEST, 'BINDING_MISMATCH')
    expected = reference._invocation_identity(value['intent_id'], value['plan_digest'], OPERATION_ID, value['plan_occurrence_id'])
    require(value['invocation_id'] == expected, 'INVOCATION_IDENTITY')
    payload = value['payload']
    keys(payload, 'subject_id delta')
    identity(payload['subject_id'])
    require(type(payload['delta']) is int and 0 < abs(payload['delta']) <= 1_000_000, 'DELTA_BOUND')
    require(value['payload_digest'] == digest(payload), 'PAYLOAD_DIGEST')

class Ledger:
    """Explicit local Operation authority; typed exceptions, dictionaries as results.

    recognize returns None only for an observed absent result. Unreadable evidence
    raises an unknown LedgerFailure. An absent result is not proof that a stale
    invocation cannot still commit. apply_or_recognize rereads under the write lock.
    """
    def __init__(self, path, resource_id='operation', clock=time.time_ns):
        self.path = Path(path).absolute()
        self.resource_id = identity(resource_id)
        self.clock = clock
        require(not self.path.is_symlink(), 'RESOURCE_ALIAS')
        require(self.path.is_file(), 'MISSING_STORE')
        c = None
        try:
            c = self._connect(False)
        except sqlite3.Error as e:
            raise LedgerFailure('READ_UNKNOWN', 'unknown', str(e)) from e
        finally:
            if c: c.close()

    @classmethod
    def initialize(cls, path, initial_balances, resource_id='operation', clock=time.time_ns):
        identity(resource_id)
        require(isinstance(initial_balances, dict) and 1 <= len(initial_balances) <= 64, 'INITIAL_BALANCES')
        for subject, value in initial_balances.items():
            identity(subject)
            require(type(value) is int and 0 <= value <= MAX_VALUE, 'BALANCE_BOUND')
        path = Path(path).absolute()
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.close(fd)
        c = sqlite3.connect(path, autocommit=True)
        try:
            c.execute('PRAGMA foreign_keys=ON')
            c.execute('PRAGMA journal_mode=DELETE')
            c.execute('PRAGMA synchronous=EXTRA')
            c.executescript('BEGIN IMMEDIATE;\n' + SCHEMA.read_text())
            c.execute('INSERT INTO metadata VALUES(1,1,?,?)', (PROFILE_HASH, resource_id))
            c.executemany('INSERT INTO business_state VALUES(?,?)', sorted(initial_balances.items()))
            c.execute('COMMIT')
        finally:
            c.close()  # Failed initialization is preserved, not overwritten or removed.
        return cls(path, resource_id, clock)

    def _preflight(self, c):
        require(c.execute('PRAGMA user_version').fetchone()[0] == 1, 'SCHEMA_VERSION')
        require(schema_shape(c) == EXPECTED_SHAPE, 'SCHEMA_SHAPE')
        rows = c.execute('SELECT * FROM metadata').fetchall()
        require(len(rows) == 1, 'METADATA')
        r = rows[0]
        require(r['schema_version'] == 1 and r['profile_digest'] == PROFILE_HASH, 'PROFILE_MISMATCH')
        require(r['resource_id'] == self.resource_id, 'RESOURCE_MISMATCH')
        require(c.execute('PRAGMA journal_mode').fetchone()[0] == 'delete', 'JOURNAL_MISMATCH')

    def _connect(self, writable):
        c = sqlite3.connect(self.path.as_uri() + ('?mode=rw' if writable else '?mode=ro'), uri=True, autocommit=True, timeout=0.1)
        c.row_factory = sqlite3.Row
        try:
            self._preflight(c)
            if writable:
                c.execute('PRAGMA foreign_keys=ON')
                c.execute('PRAGMA synchronous=EXTRA')
                require(c.execute('PRAGMA foreign_keys').fetchone()[0] == 1 and c.execute('PRAGMA synchronous').fetchone()[0] == 3, 'CONFIGURATION')
            return c
        except BaseException:
            c.close()
            raise

    @staticmethod
    def _recorded(c, inv):
        row = c.execute('SELECT * FROM invocation_results WHERE invocation_id=?', (inv['invocation_id'],)).fetchone()
        if row is None: return None
        for f in ['operation_id', 'binding_digest', 'payload_digest']:
            require(row[f] == inv[f], 'REPLAY_MISMATCH')
        try:
            result = json.loads(row['result_json'])
        except (ValueError, TypeError) as e:
            raise LedgerFailure('RESULT_CORRUPT', 'unknown', str(e)) from e
        if digest(result) != row['result_digest']:
            raise LedgerFailure('RESULT_DIGEST', 'unknown')
        outbox = c.execute('SELECT * FROM operation_outbox WHERE invocation_id=?', (inv['invocation_id'],)).fetchall()
        if not (len(outbox) == 1 and outbox[0]['event_id'] == inv['invocation_id'] and outbox[0]['payload_json'] == canonical(result)):
            raise LedgerFailure('RESULT_OUTBOX_MISMATCH', 'unknown')
        return {'evidence': {'invocation_id': inv['invocation_id'], 'binding_digest': row['binding_digest'], 'payload_digest': row['payload_digest'], 'result_digest': row['result_digest'], 'result_json': result}, 'replayed': True}

    def recognize(self, invocation):
        inv = json.loads(canonical(invocation))
        validate_invocation(inv)
        c = None
        try:
            c = self._connect(False)
            c.execute('BEGIN')
            return self._recorded(c, inv)
        except sqlite3.Error as e:
            raise LedgerFailure('READ_UNKNOWN', 'unknown', str(e)) from e
        finally:
            if c: c.close()

    def _after_business_mutation(self):
        """No-op; test subclasses inject rollback faults here."""
    def _before_commit(self):
        """No-op; test subclasses pause for actual SIGKILL here."""
    def _after_commit(self):
        """No-op; test subclasses model a lost commit response here."""

    def apply_or_recognize(self, invocation):
        inv = json.loads(canonical(invocation))
        validate_invocation(inv)
        c = None
        commit_started = False
        try:
            c = self._connect(True)
            c.execute('BEGIN IMMEDIATE')
            self._preflight(c)
            existing = self._recorded(c, inv)
            if existing is not None:
                c.execute('ROLLBACK')
                return existing
            payload = inv['payload']
            row = c.execute('SELECT value FROM business_state WHERE subject_id=?', (payload['subject_id'],)).fetchone()
            require(row is not None, 'SUBJECT_MISSING')
            require(type(row['value']) is int and 0 <= row['value'] <= MAX_VALUE, 'STORED_BALANCE_INVALID')
            after = row['value'] + payload['delta']
            require(0 <= after <= MAX_VALUE, 'BALANCE_GUARD')
            result = {'subject_id': payload['subject_id'], 'delta': payload['delta'], 'before': row['value'], 'after': after}
            c.execute('UPDATE business_state SET value=? WHERE subject_id=?', (after, payload['subject_id']))
            self._after_business_mutation()
            at = self.clock()
            require(type(at) is int and 0 <= at <= MAX_VALUE, 'CLOCK_INVALID')
            encoded = canonical(result)
            c.execute('INSERT INTO invocation_results VALUES(?,?,?,?,?,?,?)', (inv['invocation_id'], OPERATION_ID, BINDING_DIGEST, inv['payload_digest'], encoded, digest(result), at))
            c.execute('INSERT INTO operation_outbox VALUES(?,?,?)', (inv['invocation_id'], inv['invocation_id'], encoded))
            self._before_commit()
            commit_started = True
            c.execute('COMMIT')
            self._after_commit()
            return {'evidence': {'invocation_id': inv['invocation_id'], 'binding_digest': BINDING_DIGEST, 'payload_digest': inv['payload_digest'], 'result_digest': digest(result), 'result_json': result}, 'replayed': False}
        except sqlite3.Error as e:
            code = getattr(e, 'sqlite_errorcode', 0) & 255
            classification = 'unknown' if commit_started else 'retryable' if code in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED) else 'non-retryable' if isinstance(e, sqlite3.IntegrityError) else 'unknown'
            raise LedgerFailure('SQLITE_' + str(code), classification, str(e)) from e
        except OSError as e:
            raise LedgerFailure('IO_UNKNOWN', 'unknown', str(e)) from e
        finally:
            if c: c.close()
