#!/usr/bin/env python3
"""Isolated world run/verify worker. Contract and questions: CONTRACT.md, PLAN.md."""
from __future__ import annotations

import copy
import fcntl
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import sys
import tempfile

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parent / 'runtime'
sys.path.insert(0, str(RUNTIME))
import jsonschema
from prototype import World, canonical, digest
from interaction_world import InteractionWorld
from interaction_dynamics import profile

LIMIT = 32 * 1024 * 1024
SCHEMA = json.loads((HERE / 'contracts.schema.json').read_text())


def validate(kind, value):
    jsonschema.Draft202012Validator({**SCHEMA, '$ref': '#/$defs/' + kind}).validate(value)
    # JSON Schema number handling does not itself rule out every non-JSON float.
    json.dumps(value, allow_nan=False)


def load(path):
    path = Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > LIMIT:
        raise ValueError('ARTIFACT_PATH_OR_SIZE')
    raw = path.read_bytes()
    if len(raw) > LIMIT:
        raise ValueError('ARTIFACT_SIZE')
    def pairs(items):
        value = {}
        for key, item in items:
            if key in value:
                raise ValueError('DUPLICATE_JSON_KEY')
            value[key] = item
        return value
    return json.loads(raw, object_pairs_hook=pairs,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError('NONFINITE'))), raw


def engine_identity():
    paths = [RUNTIME / n for n in ('prototype.py', 'interaction_world.py', 'interaction_dynamics.py')]
    paths += [HERE / n for n in ('worker.py', 'verifier.py', 'contracts.schema.json')]
    paths += [HERE.parent / 'contracts/bridge.schema.json',
              HERE.parent / 'interaction-dynamics/fixtures/trace.schema.json']
    return digest(canonical({'files': {str(p.relative_to(HERE.parent)): digest(p.read_bytes()) for p in paths},
                             'python': platform.python_version(),
                             'jsonschema': importlib.metadata.version('jsonschema')}))


def binding(ticks=100):
    return {'schema_version': 'robot-world.run-input/v1', 'world_id': 'workshop-001',
            'initial_sha256': digest(canonical(World().state)),
            'profile_sha256': digest(canonical(profile())), 'engine_sha256': engine_identity(),
            'max_ticks': ticks, 'policy_mode': 'scripted-interaction-v1',
            'stop_policy': 'horizon-or-profile-quiescence'}


def check_binding(value):
    validate('binding', value)
    if value != binding(value['max_ticks']):
        raise ValueError('WORLD_BINDING_MISMATCH')


def simulate(value, cancelled=lambda: False):
    check_binding(value)
    world = InteractionWorld()
    idle = 0
    stop = 'horizon'
    for _ in range(value['max_ticks']):
        if cancelled():
            stop = 'cancelled'
            break
        start = len(world.events)
        world.step()
        actions = [e['intent']['action'] for e in world.events[start:] if 'agent_id' in e['intent']]
        idle = idle + 1 if actions and all(a == 'wait' for a in actions) else 0
        if idle >= world.config['quiescence_window']:
            stop = 'policy-quiescent-window-censored'
            break
    # Cancellation observed before publication wins, including after the final tick.
    if cancelled():
        stop = 'cancelled'
    result = {'binding': value, 'initial': world.initial, 'profile': world.config,
              'events': world.events, 'frames': world.frames, 'traces': world.traces,
              'final_state': world.state, 'completed_ticks': world.state['tick'],
              'stop_reason': stop, 'constructed': world.state['built'] - world.initial['built']}
    if len(canonical(result)) > LIMIT - 4096:
        raise ValueError('ARTIFACT_SIZE')
    return result


def atomic(path, data):
    """Replace only worker-owned ledger files; fsync content and directory."""
    path = Path(path)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as f:
        temporary = Path(f.name)
        try:
            f.write(data); f.flush(); os.fsync(f.fileno())
            os.replace(temporary, path)
            fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
            try: os.fsync(fd)
            finally: os.close(fd)
        finally:
            temporary.unlink(missing_ok=True)


def execute(request_path, output_path, cancel_path):
    request, raw = load(request_path)
    validate('request', request)
    check_binding(request['input'])
    output = Path(output_path)
    ledger = output.with_suffix(output.suffix + '.attempt')
    request_hash = digest(raw)
    if output.is_symlink() or ledger.is_symlink():
        raise ValueError('ARTIFACT_SYMLINK')
    # The host owns these absolute paths. No task fields are interpreted as paths.
    with open(str(ledger) + '.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if ledger.exists():
            prior, _ = load(ledger)
            if prior.get('request_sha256') != request_hash:
                raise ValueError('COMMAND_ID_CONFLICT')
            if prior.get('phase') != 'accepted':
                raise ValueError('ATTEMPT_RECONCILIATION_REQUIRED')
            result, result_raw = load(output)
            validate('result', result)
            if prior.get('output_sha256') != digest(result_raw) or result['request_sha256'] != request_hash:
                raise ValueError('CACHED_OUTPUT_MISMATCH')
            return result
        if output.exists():
            raise ValueError('UNOWNED_OUTPUT')
        atomic(ledger, canonical({'request_sha256': request_hash, 'phase': 'started'}))
        if request['contract'] == 'robot-world.run/v1':
            if request['predecessor'] is not None:
                raise ValueError('RUN_DEPENDENCY_FORBIDDEN')
            body = simulate(request['input'], lambda: Path(cancel_path).exists())
            status = 'cancelled' if body['stop_reason'] == 'cancelled' else 'succeeded'
        else:
            from verifier import verify
            predecessor = request['predecessor']
            if not isinstance(predecessor, dict) or set(predecessor) != {'utf8_json', 'sha256'}:
                raise ValueError('VERIFY_PREDECESSOR_INVALID')
            if digest(predecessor['utf8_json'].encode()) != predecessor['sha256']:
                raise ValueError('VERIFY_PREDECESSOR_DIGEST')
            previous = json.loads(predecessor['utf8_json'])
            validate('result', previous)
            if previous['contract'] != 'robot-world.run/v1' or previous['status'] != 'succeeded':
                raise ValueError('VERIFY_PREDECESSOR_INVALID')
            if Path(cancel_path).exists():
                body, status = {'reason': 'cancelled-before-verification'}, 'cancelled'
            else:
                body, status = verify(previous['result'], request['input']), 'succeeded'
                body['source_output_sha256'] = predecessor['sha256']
                if Path(cancel_path).exists():
                    body, status = {'reason': 'cancelled-after-verification'}, 'cancelled'
        result = {'schema_version': 'robot-world.worker-result/v1', 'contract': request['contract'],
                  'command_id': request['command_id'], 'fencing_token': request['fencing_token'],
                  'request_sha256': request_hash, 'status': status, 'result': body}
        validate('result', result)
        data = canonical(result) + b'\n'
        if len(data) > LIMIT:
            raise ValueError('ARTIFACT_SIZE')
        atomic(output, data)
        atomic(ledger, canonical({'request_sha256': request_hash, 'phase': 'accepted',
                                  'output_sha256': digest(data)}))
        return result


if __name__ == '__main__':
    try:
        if len(sys.argv) == 3 and sys.argv[1] == 'binding':
            value = binding(int(sys.argv[2])); validate('binding', value)
            print(json.dumps(value))
        elif len(sys.argv) == 4:
            execute(*sys.argv[1:])
        else:
            raise ValueError('Usage: worker.py binding TICKS | INPUT OUTPUT CANCEL')
    except Exception as error:
        print(type(error).__name__ + ':' + str(error)[:1500], file=sys.stderr)
        raise SystemExit(1)
