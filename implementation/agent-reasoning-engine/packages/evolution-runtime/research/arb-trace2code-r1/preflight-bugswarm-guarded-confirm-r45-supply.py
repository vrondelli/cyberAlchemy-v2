#!/usr/bin/env python3
"""Census the complete untouched BugSwarm queue tail for G01 r45."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'selective-r28'
OUTPUT = BASE / 'guarded-confirm-r45/supply-r1'
QUEUE = ROOT / 'repair-r32/QUEUE.json'
R33_RESULT = ROOT / 'rebalanced-r33/RESULT.json'
R34_RESULT = ROOT / 'final-r34/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R45-SUPPLY-PROTOCOL-2026-10-04.md'
R44_RESULT = HERE.parents[1] / 'evidence/G01-BUGSWARM-GRAPH-DEV-B-R44-GUARDED-ENTITY-TRANSFER-RESULT-2026-10-04.md'
R33_HELPER = HERE / 'run-bugswarm-selective-r33-rebalanced-admission.py'
R29_HELPER = HERE / 'preflight-bugswarm-selective-r29.py'
R31_HELPER = HERE / 'repair-bugswarm-selective-r31-alternate-client.py'
IDENTITY_HELPER = HERE / 'preflight-bugswarm-fresh-r11.py'
PINS = {
    'queue': '42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e',
    'r33_result': 'bbdb33fce8bc165f16a4dc255510fd0c4f588f8deebbd19adffedba1eb356002',
    'r34_result': 'fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c',
    'protocol': '5e66a2288e65bcb20131629c965e75955ce645bb5c5b66fc5ef44158acf744b4',
    'r44_result': '24c16ff119cd4be96b702b2848cf6382eaf8c8aa143d8ef7891f174006ae78a6',
    'r33_helper': '4c1ac95a81abcd00715ef32bd3049f6e66357d98fe8ba052a3aa171d2073e8c7',
    'r29_helper': 'cccc9b0f998b5d6b7e0354899e22172aa67b732604b2a7c3c1222ddf3dbc6787',
    'r31_helper': 'bc202982f7e37b3da2784f3768c11246692938aa5dce453215f52b0b6e630b9b',
    'identity_helper': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc',
}
PYTHON_START = 10


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, value: object) -> None:
    encoded = ((json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
               if not isinstance(value, bytes) else value)
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)


def import_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    need(spec is not None and spec.loader is not None, f'helper-unavailable:{name}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {
        'queue': QUEUE,
        'r33_result': R33_RESULT,
        'r34_result': R34_RESULT,
        'protocol': PROTOCOL,
        'r44_result': R44_RESULT,
        'r33_helper': R33_HELPER,
        'r29_helper': R29_HELPER,
        'r31_helper': R31_HELPER,
        'identity_helper': IDENTITY_HELPER,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')

    queue = json.loads(QUEUE.read_bytes())
    r33_result = json.loads(R33_RESULT.read_bytes())
    r34_result = json.loads(R34_RESULT.read_bytes())
    python_queue = queue['queues']['Python']
    java_queue = queue['queues']['Java']
    remaining = python_queue[PYTHON_START:]
    need(queue['gold_opened'] is False and queue['model_calls'] == 0 and
         len(python_queue) == 39 and len(java_queue) == 3 and
         r33_result['queue_consumed'] == {'Python': 7, 'Java': 3} and
         r33_result['gold_opened'] is False and r33_result['model_calls'] == 0 and
         r34_result['python_queue_consumed_total'] == 10 and
         r34_result['status'] == 'source-log-admitted' and
         r34_result['gold_opened'] is False and r34_result['model_calls'] == 0,
         'predecessor-shape-drift')
    need(len(remaining) == 29 and
         [row['queue_index'] for row in remaining] == list(range(11, 40)) and
         all(row['language'] == 'Python' for row in remaining) and
         len({row['repo'].lower() for row in remaining}) == 29,
         'untouched-tail-drift')

    r33 = import_module('g01_r45_r33', R33_HELPER)
    r29 = import_module('g01_r45_r29', R29_HELPER)
    r31 = import_module('g01_r45_r31', R31_HELPER)
    identity = import_module('g01_r45_identity', IDENTITY_HELPER)
    OUTPUT.mkdir(parents=True, mode=0o700)
    r33.OUTPUT = OUTPUT
    save('RUN-FREEZE.json', {
        'schema_version': 'are.g01-guarded-confirm-r45-supply-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'queue_language': 'Python',
        'queue_indices': list(range(11, 40)),
        'attempts': 29,
        'required_passers': 24,
        'automatic_retries': 0,
        'maximum_log_bytes': 8 * 1024 * 1024,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    })

    rows = []
    network_calls = 0
    for candidate in remaining:
        record, calls = r33.attempt(candidate['queue_index'], candidate,
                                    r29, r31, identity)
        rows.append(record)
        network_calls += calls

    passers = [row for row in rows if row['admitted']]
    selected = passers[:24]
    sufficient = len(passers) >= 24
    result = {
        'schema_version': 'are.g01-guarded-confirm-r45-supply-result/v1',
        'status': ('source-log-supply-sufficient' if sufficient else
                   'terminal-source-log-supply-deficit'),
        'input_sha256': PINS,
        'attempted': len(rows),
        'admitted': len(passers),
        'required': 24,
        'sufficient': sufficient,
        'selected_queue_indices': [row['queue_index'] for row in selected],
        'selected_repositories': [row['repo'] for row in selected],
        'network_calls': network_calls,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': rows,
        'claim_ceiling': (
            'Authenticated score-blind source/log availability only; no label, '
            'ranking, model, score, efficiency, or superiority result.'
        ),
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'attempted': result['attempted'],
        'admitted': result['admitted'],
        'required': result['required'],
        'network_calls': result['network_calls'],
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not sufficient:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
