#!/usr/bin/env python3
"""Acquire exact failed-source archives for the sealed G01 r46 selection."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R45_RESULT = BASE / 'guarded-confirm-r45/supply-r1/RESULT.json'
R46_RESULT = BASE / 'guarded-confirm-r46/official-api-r1/RESULT.json'
R46_FREEZE = BASE / 'guarded-confirm-r46/official-api-r1/RUN-FREEZE.json'
R46_DOC = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R46-OFFICIAL-API-RESULT-2026-10-04.md'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R47-SOURCE-PROTOCOL-2026-10-04.md'
HELPER = HERE / 'acquire-bugswarm-selective-r35-source.py'
OUTPUT = BASE / 'guarded-confirm-r47/source-archives-r1'
PINS = {
    'r45_result': '26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09',
    'r46_result': '9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451',
    'r46_freeze': '75bb0892066b67b2ce622fea084d2607a1ab61945123e8b7a0f34409fa8c9ee8',
    'r46_doc': 'ad4aca405ef4c32dc6d76fd1699982eacc7b28d93c889fed357767339b12c419',
    'protocol': '8bcfcf990f892c008991a33f6e6f7d2181842ff14a2488ed022bea4d24de2bc5',
    'helper': '8c1d582fc16adbfeaa04a35dc9276902953d9d39960b7c4359571bd7d4b6b12a',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save_json(name: str, value: object) -> str:
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def load_helper():
    spec = importlib.util.spec_from_file_location('g01_r47_source_helper', HELPER)
    need(spec is not None and spec.loader is not None, 'helper-unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {
        'r45_result': R45_RESULT,
        'r46_result': R46_RESULT,
        'r46_freeze': R46_FREEZE,
        'r46_doc': R46_DOC,
        'protocol': PROTOCOL,
        'helper': HELPER,
    }
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    r45 = json.loads(R45_RESULT.read_bytes())
    r46 = json.loads(R46_RESULT.read_bytes())
    selected_indices = r46['selected_queue_indices']
    need(r46['status'] == 'cross-validated-log-supply-sufficient' and
         r46['global_control_ok'] is True and r46['admitted'] == 27 and
         selected_indices == list(range(11, 35)) and
         r46['gold_opened'] is False and r46['model_calls'] == 0,
         'r46-shape-drift')
    by_index = {row['queue_index']: row for row in r45['rows']}
    selected = [by_index[index] for index in selected_indices]
    need(len(selected) == 24 and
         len({row['repo'].lower() for row in selected}) == 24 and
         all(row['language'] == 'Python' for row in selected),
         'selection-shape-drift')

    helper = load_helper()
    OUTPUT.mkdir(parents=True, mode=0o700)
    helper.OUTPUT = OUTPUT
    save_json('FREEZE.json', {
        'schema_version': 'are.g01-guarded-confirm-r47-source-freeze/v1',
        'input_sha256': PINS,
        'runner_sha256': sha(Path(__file__).read_bytes()),
        'queue_indices': selected_indices,
        'cases': 24,
        'max_archive_bytes': helper.MAX_ARCHIVE,
        'max_file_bytes': helper.MAX_FILE,
        'max_code_bytes': helper.MAX_CODE,
        'max_regular_bytes': helper.MAX_REGULAR,
        'max_members': helper.MAX_MEMBERS,
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    })

    results = []
    for slot, row in enumerate(selected, 1):
        receipt = helper.acquire(slot, row)
        receipt['queue_index'] = row['queue_index']
        receipt['receipt_sha256'] = save_json(f'CASE-{slot:02d}.json', receipt)
        results.append(receipt)
        print(json.dumps({
            'slot': slot,
            'queue_index': row['queue_index'],
            'repo': row['repo'],
            'http_status': receipt['http_status'],
            'archive_bytes': receipt['archive_bytes'],
            'admissible': receipt['admissible'],
        }, sort_keys=True), flush=True)

    admitted = sum(row['admissible'] for row in results)
    result = {
        'schema_version': 'are.g01-guarded-confirm-r47-source-result/v1',
        'input_sha256': PINS,
        'attempted': len(results),
        'admitted': admitted,
        'all_24_admitted': len(results) == admitted == 24,
        'language_counts': {'Python': 24, 'Java': 0},
        'automatic_retries': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
        'results': results,
        'claim_ceiling': 'Exact failed-source availability only; no benchmark result.',
    }
    result_sha = save_json('RESULT.json', result)
    print(json.dumps({
        'attempted': result['attempted'],
        'admitted': result['admitted'],
        'all_24_admitted': result['all_24_admitted'],
        'result_sha256': result_sha,
    }, sort_keys=True))
    if not result['all_24_admitted']:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
