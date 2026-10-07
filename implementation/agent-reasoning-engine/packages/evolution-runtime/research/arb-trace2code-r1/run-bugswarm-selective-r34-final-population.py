#!/usr/bin/env python3
"""Complete the fixed 17-Python/7-Java G01 mechanism-test population."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'selective-r28'
OUTPUT = ROOT / 'final-r34'
QUEUE = ROOT / 'repair-r32/QUEUE.json'
R33_RESULT = ROOT / 'rebalanced-r33/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R34-FINAL-POPULATION-PROTOCOL-2026-10-04.md'
R33_HELPER = HERE / 'run-bugswarm-selective-r33-rebalanced-admission.py'
R29_HELPER = HERE / 'preflight-bugswarm-selective-r29.py'
R31_HELPER = HERE / 'repair-bugswarm-selective-r31-alternate-client.py'
IDENTITY_HELPER = HERE / 'preflight-bugswarm-fresh-r11.py'
PINS = {
    'queue': '42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e',
    'r33_result': 'bbdb33fce8bc165f16a4dc255510fd0c4f588f8deebbd19adffedba1eb356002',
    'protocol': '51fc4eff8770f122d4441ed17d13b17d6ef8ae777ebcc729f32ed6158542bcbc',
    'r33_helper': '4c1ac95a81abcd00715ef32bd3049f6e66357d98fe8ba052a3aa171d2073e8c7',
    'r29_helper': 'cccc9b0f998b5d6b7e0354899e22172aa67b732604b2a7c3c1222ddf3dbc6787',
    'r31_helper': 'bc202982f7e37b3da2784f3768c11246692938aa5dce453215f52b0b6e630b9b',
    'identity_helper': '2c13af917a8cfdc7e5aa5ea8f8c29f246deaac77bc9ada0395b61e8394d177bc',
}
TARGETS = [15, 18, 19]
PYTHON_START_INDEX = 7


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
        'protocol': PROTOCOL,
        'r33_helper': R33_HELPER,
        'r29_helper': R29_HELPER,
        'r31_helper': R31_HELPER,
        'identity_helper': IDENTITY_HELPER,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    queue = json.loads(QUEUE.read_bytes())
    prior = json.loads(R33_RESULT.read_bytes())
    need(prior['status'] == 'terminal-unfilled' and prior['filled_slots'] == 21 and
         prior['language_counts'] == {'Python': 14, 'Java': 7} and
         prior['queue_consumed'] == {'Python': 7, 'Java': 3} and
         [row['slot'] for row in prior['rows'] if row['repo'] is None] == TARGETS and
         prior['gold_opened'] is False and prior['model_calls'] == 0,
         'r33-shape-drift')
    python_queue = queue['queues']['Python']
    need(len(python_queue) == 39 and
         python_queue[PYTHON_START_INDEX]['queue_index'] == 8,
         'python-queue-drift')

    r33 = import_module('g01_r34_r33', R33_HELPER)
    r29 = import_module('g01_r34_r29', R29_HELPER)
    r31 = import_module('g01_r34_r31', R31_HELPER)
    identity = import_module('g01_r34_identity', IDENTITY_HELPER)
    OUTPUT.mkdir(parents=True, mode=0o700)
    r33.OUTPUT = OUTPUT
    save('RUN-FREEZE.json', {
        'schema_version': 'are.g01-selective-r34-final-population-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'targets': TARGETS,
        'replacement_language': 'Python',
        'python_queue_start_index': 8,
        'target_language_counts': {'Python': 17, 'Java': 7},
        'automatic_retries': 0,
        'gold_opened': False,
        'model_calls': 0,
    })

    next_index = PYTHON_START_INDEX
    bindings = {}
    attempts = []
    network_calls = 0
    for slot in TARGETS:
        final = None
        while next_index < len(python_queue):
            candidate = python_queue[next_index]
            next_index += 1
            record, calls = r33.attempt(slot, candidate, r29, r31, identity)
            attempts.append(record)
            network_calls += calls
            if record['admitted']:
                final = record
                break
        bindings[slot] = final
        save(f'SLOT-{slot:02d}.json', {
            'slot': slot,
            'target_language': 'Python',
            'filled': final is not None,
            'final': None if final is None else {
                'repo': final['repo'],
                'image_tag': final['image_tag'],
                'failed_commit': final['failed_commit'],
                'job_id': final['job_id'],
                'language': final['language'],
                'source_order_position': final['source_order_position'],
                'attempt_receipt': (
                    f'S{slot:02d}-PQ{final["queue_index"]:02d}-ATTEMPT.json'
                ),
            },
        })

    final_rows = []
    for row in prior['rows']:
        slot = row['slot']
        if row['repo'] is not None:
            final_rows.append({**row, 'r34_retained': True})
            continue
        replacement = bindings[slot]
        final_rows.append({
            'slot': slot,
            'retained': False,
            'r34_retained': False,
            'repo': None if replacement is None else replacement['repo'],
            'image_tag': None if replacement is None else replacement['image_tag'],
            'failed_commit': None if replacement is None else replacement['failed_commit'],
            'job_id': None if replacement is None else replacement['job_id'],
            'language': 'Python',
            'source_order_position': (None if replacement is None else
                                      replacement['source_order_position']),
            'evidence': (None if replacement is None else
                         f'S{slot:02d}-PQ{replacement["queue_index"]:02d}-ATTEMPT.json'),
        })

    filled = [row for row in final_rows if row['repo'] is not None]
    repos = [row['repo'].lower() for row in filled]
    language_counts = {
        language: sum(row['language'] == language for row in filled)
        for language in ('Python', 'Java')
    }
    all_filled = (len(filled) == len(repos) == len(set(repos)) == 24 and
                  language_counts == {'Python': 17, 'Java': 7})
    result = {
        'schema_version': 'are.g01-selective-r34-final-population-result/v1',
        'status': 'source-log-admitted' if all_filled else 'terminal-unfilled',
        'input_sha256': PINS,
        'filled_slots': len(filled),
        'r33_retained_slots': 21,
        'replacement_attempts': len(attempts),
        'python_queue_consumed_total': next_index,
        'language_counts': language_counts,
        'network_calls': network_calls,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'rows': final_rows,
        'claim_ceiling': (
            'Source/log-admitted availability-selected mechanism cohort only; '
            'no ranking, score, efficiency, or superiority result.'
        ),
    }
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    save('RESULT.json', encoded)
    print(json.dumps({
        'status': result['status'],
        'filled_slots': len(filled),
        'replacement_attempts': len(attempts),
        'python_queue_consumed_total': next_index,
        'language_counts': language_counts,
        'network_calls': network_calls,
        'result_sha256': sha(encoded),
    }, sort_keys=True))
    if not all_filled:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
