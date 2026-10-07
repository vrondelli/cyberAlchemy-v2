#!/usr/bin/env python3
"""Freeze source-only G01 confirmation r2 repair queues and original slots."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
EVIDENCE = HERE.parent.parent / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R2-SCORE-BLIND-REPAIR-2026-10-04.md'
OUTPUT = BASE / 'graph-confirm-r1/source-only/REPAIR-MANIFEST-R2.json'
INPUTS = {
    'raw': (BASE / '1.3.1-bugswarm.json', 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d'),
    'order': (BASE / 'source-only-r1/ORDERED-CANDIDATES.json', '63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c'),
    'prior': (BASE / 'METADATA-CANDIDATE-24-R1.json', 'fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d'),
    'split': (BASE / 'graph-dev-r1/METADATA-COHORTS-R1.json', '6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85'),
    'dev_r2': (BASE / 'graph-dev-r2/DEV-METADATA-R2.json', 'c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332'),
    'b_r1': (BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R1.json', 'd3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92'),
    'b_r2': (BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json', '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8'),
    'r1': (BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight/PREFLIGHT-RESULT.json', '6221d6bfd7baeda65bf37257b38e061d33e8140a25aa6f17ed8c534b48b1d951'),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    need(len(sys.argv) == 1 and not OUTPUT.exists(), 'usage-or-output-exists')
    spec = importlib.util.spec_from_file_location('g01_graph_split', HERE / 'select-bugswarm-graph-dev-r1.py')
    need(spec is not None and spec.loader is not None, 'selector-unavailable')
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    need(selector.RAW_SHA == INPUTS['raw'][1] and selector.ORDER_SHA == INPUTS['order'][1]
         and selector.PRIOR_SHA == INPUTS['prior'][1], 'selector-input-drift')
    loaded = {}
    for key, (path, expected) in INPUTS.items():
        data = path.read_bytes()
        need(sha(data) == expected, f'{key}-pin-drift')
        loaded[key] = json.loads(data)
    need(loaded['r1']['attempted'] == 24 and loaded['r1']['admitted'] == 11
         and not loaded['r1']['all_24_admitted'] and not loaded['r1']['gold_opened']
         and loaded['r1']['model_calls'] == 0, 'r1-shape-drift')
    original = [*loaded['split']['cohorts']['reserved_confirmation']['Python'],
                *loaded['split']['cohorts']['reserved_confirmation']['Java']]
    slots = []
    for index, (case, receipt) in enumerate(zip(original, loaded['r1']['rows']), 1):
        need(receipt['ordinal'] == index and receipt['repo'] == case['repo']
             and receipt['failed_commit'] == case['failure_commit']
             and receipt['job_id'] == case['failure_job_id'], f'slot-{index}-drift')
        if receipt['admitted']:
            kind = 'r1_admitted_verify_head'
        elif index in (6, 19, 22):
            need(receipt['source']['http_code'] == '200' and receipt['log']['exit_code'] == 0
                 and receipt['log']['utf8'] and receipt['log']['bytes'] > 0, f'page-only-{index}-drift')
            kind = 'page_repair_then_head'
        else:
            kind = 'replacement_required'
        if kind != 'replacement_required':
            file = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight' / receipt['log']['file']
            need(sha(file.read_bytes()) == receipt['log']['sha256'], f'r1-log-{index}-drift')
        slots.append({'ordinal': index, 'language': case['language'], 'repo': case['repo'],
                      'image_tag': case['image_tag'], 'failed_commit': case['failure_commit'],
                      'job_id': case['failure_job_id'], 'kind': kind,
                      'r1_log_sha256': receipt['log']['sha256'] if kind != 'replacement_required' else None,
                      'r1_log_bytes': receipt['log']['bytes'] if kind != 'replacement_required' else None})
    need(len(slots) == 24 and [row['ordinal'] for row in slots if row['kind'] == 'page_repair_then_head']
         == [6, 19, 22] and sum(row['kind'] == 'replacement_required' for row in slots) == 10,
         'repair-class-drift')

    excluded = [*loaded['prior']['selected'],
                *loaded['split']['cohorts']['development']['Python'],
                *loaded['split']['cohorts']['development']['Java'],
                *loaded['dev_r2']['development'],
                *loaded['b_r1']['selected'], *loaded['b_r2']['development'], *original]
    occupied = {row['repo'].lower() for row in excluded}
    by_tag = {row['image_tag']: row for row in loaded['raw']}
    need(len(by_tag) == len(loaded['raw']) == 4388, 'raw-shape-drift')
    queues = {}
    for language in ('Python', 'Java'):
        floor = max(row['source_order_position'] for row in
                    loaded['split']['cohorts']['reserved_confirmation'][language])
        seen = set(occupied)
        queue = []
        for position, candidate in enumerate(loaded['order']['ordered'][language], 1):
            if position <= floor:
                continue
            record = by_tag.get(candidate['image_tag'])
            need(record is not None and record['repo'] == candidate['repo']
                 and record['lang'] == language
                 and record['failed_job']['job_id'] == candidate['failure_job_id']
                 and record['failed_job']['trigger_sha'] == candidate['failure_commit'],
                 f'ordered-source-identity-{language}-{position}')
            repo = candidate['repo'].lower()
            if (repo in seen or not selector.eligible(record)
                    or int(sha(selector.SEED + repo.encode()), 16) % 2 != 1):
                continue
            seen.add(repo)
            queue.append({'source_order_position': position, 'language': language,
                          'repo': candidate['repo'], 'image_tag': candidate['image_tag'],
                          'failed_commit': candidate['failure_commit'],
                          'job_id': candidate['failure_job_id']})
            if len(queue) == 60:
                break
        initial_slots = sum(row['kind'] == 'replacement_required' and row['language'] == language
                            for row in slots)
        need(initial_slots <= len(queue) <= 60,
             f'insufficient-{language}-queue:{len(queue)}-for-{initial_slots}')
        queues[language] = queue
    result = {'schema_version': 'are.g01-confirm-repair-manifest-r2/v1',
              'input_sha256': {key: pin for key, (_, pin) in INPUTS.items()},
              'protocol_sha256': sha(EVIDENCE.read_bytes()),
              'builder_sha256': sha(Path(__file__).read_bytes()),
              'selector_sha256': sha((HERE / 'select-bugswarm-graph-dev-r1.py').read_bytes()),
              'slots': slots, 'queues': queues, 'queue_cap_per_language': 60,
              'automatic_retries': 0, 'max_log_bytes': 8 * 1024 * 1024,
              'gold_opened': False, 'model_calls': 0}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'manifest_sha256': sha(data), 'slots': len(slots),
                      'queues': {key: len(value) for key, value in queues.items()},
                      'replacement_required': sum(row['kind'] == 'replacement_required' for row in slots)}))


if __name__ == '__main__':
    main()
