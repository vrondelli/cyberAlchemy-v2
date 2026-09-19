"""Bounded local worker. Scheduling, terminal policy and outbox delivery are external."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import sys
import threading
import uuid

HERE = Path(__file__).resolve().parent

def pinned(name, relative, expected):
    path = HERE.parent / relative
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise RuntimeError('worker dependency drift: ' + relative)
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

coordination = pinned('r05_coordination', 'r03-recovery-v1/store.py', '9100aff5af3ab8df3a48bf39b2c50982583db57f3621fbd6f578bfbcf5abb601')
operation = pinned('r05_operation', 'r04-recovery-v1/ledger.py', 'fe753b4071f9b31bb34fa0626fd90f4e9a87bafed537e7a095c1a4c58bc7cf12')

class WorkerFailure(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)

def identity():
    return str(uuid.uuid4())

class Worker:
    """One serialized caller per instance; multiple processes are fenced by Store.

    renew() is explicit. A caller should renew every 1000 ms between bounded
    calls. A blocking Operation may outlive its lease: its ledger result remains
    durable, but the expired worker cannot record coordination progress.
    """
    def __init__(self, coordination_path, operation_path, claimant_id,
                 clock=coordination.native_clock):
        self.coordination_path = Path(coordination_path)
        self.operation_path = Path(operation_path)
        self.claimant_id = claimant_id
        self.clock = clock
        self._lock = threading.Lock()
        self._claim = None
        self._resources()

    def _resources(self):
        if (self.coordination_path.resolve() == self.operation_path.resolve()
                or os.path.samefile(self.coordination_path, self.operation_path)):
            raise WorkerFailure('RESOURCE_ALIAS')
        # Constructors do read-only schema/profile/resource preflight; never create.
        self.store = coordination.Store(self.coordination_path, 'coordination', self.clock)
        self.ledger = operation.Ledger(self.operation_path, resource_id='operation')

    def _preflight(self, dispatch_id):
        self._resources()
        snapshot = self.store.load(dispatch_id)
        invocations = {}
        # Resolve the entire frozen plan before a claim, attempt or business call.
        for row in snapshot['occurrences']:
            if row['operation_id'] != operation.OPERATION_ID or row['binding_digest'] != operation.BINDING_DIGEST:
                raise WorkerFailure('BINDING_UNAVAILABLE')
            payload = json.loads(row['payload_json'])
            if set(payload) != {'subject_id', 'delta'}:
                raise WorkerFailure('PAYLOAD_INVALID')
            invocation = operation.make_invocation(
                snapshot['intent']['intent_id'], snapshot['intent']['plan_digest'],
                row['occurrence_id'], payload['subject_id'], payload['delta'])
            operation.validate_invocation(invocation)
            if invocation['invocation_id'] != row['invocation_id'] or invocation['payload_digest'] != row['payload_digest']:
                raise WorkerFailure('INVOCATION_MISMATCH')
            invocations[row['occurrence_id']] = invocation
        return snapshot, invocations

    def acquire(self, dispatch_id):
        with self._lock:
            if self._claim is not None:
                raise WorkerFailure('CLAIM_ALREADY_HELD')
            snapshot, _ = self._preflight(dispatch_id)
            result = self.store.acquire(identity(), dispatch_id,
                snapshot['dispatch']['version'], identity(), self.claimant_id, identity())
            self._claim = (dispatch_id, dict(result['authority']))
            return result

    def _current(self):
        if self._claim is None:
            raise WorkerFailure('CLAIM_REQUIRED')
        dispatch_id, authority = self._claim
        snapshot, invocations = self._preflight(dispatch_id)
        return dispatch_id, authority, snapshot, invocations

    def renew(self):
        with self._lock:
            dispatch_id, authority, snapshot, _ = self._current()
            result = self.store.renew(identity(), dispatch_id,
                snapshot['dispatch']['version'], authority, identity())
            self._claim = (dispatch_id, dict(result['authority']))
            return result

    def _after_operation(self):
        """Fault-injection boundary; production has no callback or adapter registry."""

    def run_one(self):
        with self._lock:
            dispatch_id, authority, snapshot, invocations = self._current()
            if snapshot['dispatch']['state'] == 'terminal':
                raise WorkerFailure('TERMINAL')
            completed = {row['occurrence_id'] for row in snapshot['progress']}
            pending = [row for row in snapshot['occurrences'] if row['occurrence_id'] not in completed]
            if not pending:
                return {'status': 'progress-complete', 'terminal_recorded': False}
            row = pending[0]
            invocation = invocations[row['occurrence_id']]
            # An existing ledger result can only advance an unknown predecessor.
            # This supports fenced takeover without inventing another attempt.
            recognized = self.ledger.recognize(invocation)
            if recognized is not None:
                result = self.store.reconcile(identity(), dispatch_id,
                    snapshot['dispatch']['version'], authority, recognized['evidence'])
                return {'status': 'reconciled', 'coordination': result,
                        'evidence': recognized['evidence']}
            attempt_id = identity()
            started = self.store.start(identity(), dispatch_id,
                snapshot['dispatch']['version'], authority, attempt_id)
            try:
                applied = self.ledger.apply_or_recognize(invocation)
            except operation.LedgerFailure as failure:
                outcome = 'unknown' if failure.classification == 'unknown' else 'failed'
                evidence = {'code': failure.code, 'classification': failure.classification,
                            'invocation_id': invocation['invocation_id']}
                return self._record(dispatch_id, authority, started, attempt_id, outcome, evidence)
            self._after_operation()
            return self._record(dispatch_id, authority, started, attempt_id,
                                'succeeded', applied['evidence'])

    def _record(self, dispatch_id, authority, started, attempt_id, outcome, evidence):
        try:
            result = self.store.outcome(identity(), dispatch_id, started['version'],
                authority, attempt_id, outcome, evidence)
        except coordination.StoreFailure as failure:
            # The Operation may have committed. Never label loss of coordination
            # authority a business failure or automatically invoke a successor.
            return {'status': 'unknown', 'attempt_id': attempt_id,
                    'coordination_error': failure.code, 'evidence': evidence}
        return {'status': outcome, 'attempt_id': attempt_id,
                'coordination': result, 'evidence': evidence}
