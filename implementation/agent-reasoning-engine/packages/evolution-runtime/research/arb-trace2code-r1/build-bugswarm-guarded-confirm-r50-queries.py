#!/usr/bin/env python3
"""Construct unchanged gold-blind failure queries for G01 r50."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R46_DIR = BASE / 'guarded-confirm-r46/official-api-r1'
R46 = R46_DIR / 'RESULT.json'
R48 = BASE / 'guarded-confirm-r48/code-projection-r1/RESULT.json'
META = BASE / 'source-only-r1/FAILURE-SIDE-METADATA.jsonl'
RULE = HERE / 'project-bugswarm-graph-dev-r2-queries.py'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GUARDED-CONFIRM-R50-TREATMENT-CONSTRUCTION-PROTOCOL-2026-10-04.md'
OUTPUT = BASE / 'guarded-confirm-r50/queries'
PINS = {
    'r46': '9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451',
    'r48': 'bcc866fdae18d163850bbaa530a410e071e0e6948ff62710da3d22b6b915413b',
    'metadata': '5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686',
    'rule': '6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872',
    'protocol': 'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> str:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    paths = {'r46': R46, 'r48': R48, 'metadata': META,
             'rule': RULE, 'protocol': PROTOCOL}
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_r50_query_rule', RULE)
    need(spec is not None and spec.loader is not None, 'rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    r46 = json.loads(R46.read_bytes())
    by_index = {row['queue_index']: row for row in r46['rows']}
    sources = json.loads(R48.read_bytes())['records']
    metadata = {row['image_tag']: row for row in
                (json.loads(line) for line in META.read_text().splitlines())}
    indices = r46['selected_queue_indices']
    need(indices == list(range(11, 35)) and len(sources) == 24 and
         len(metadata) == 4388 and r46['gold_opened'] is False and
         r46['model_calls'] == 0, 'input-shape-drift')

    rows = []
    missing_tests = redactions = 0
    for ordinal, (index, source) in enumerate(zip(indices, sources), 1):
        receipt = by_index[index]
        item = metadata[source['image_tag']]
        need(source['slot'] == ordinal and source['repo'] == receipt['repo'] and
             source['image_tag'] == item['image_tag'] and
             source['failed_commit'] == item['failure']['trigger_sha'] and
             receipt['job_id'] == item['failure']['job_id'] and receipt['admitted'],
             f'identity:{ordinal}')
        log_path = R46_DIR / receipt['api_log_file']
        compressed = log_path.read_bytes()
        log = gzip.decompress(compressed)
        need(len(log) == receipt['api_log_bytes'] and
             sha(log) == receipt['api_log_sha256'], f'log-drift:{ordinal}')
        tests = item['failure']['failed_tests']
        need(isinstance(tests, str), f'tests-type:{ordinal}')
        test_part = rule.bounded_prefix(
            tests.replace('#', '\n'), rule.MAX_TEST_BYTES).strip()
        missing_tests += not bool(test_part)
        log_text = rule.ANSI.sub('', log.decode('utf-8', errors='replace'))
        heading = f'failed tests:\n{test_part}\n' if test_part else ''
        tail = rule.bounded_suffix(
            log_text, rule.MAX_QUERY_BYTES - len(heading.encode()) - 16).strip()
        query = f'{heading}log tail:\n{tail}'.strip()
        query, count = rule.SENSITIVE.subn('[REDACTED]', query)
        redactions += count
        need(query and len(query.encode()) <= rule.MAX_QUERY_BYTES,
             f'query-size:{ordinal}')
        rows.append({
            'ordinal': ordinal, 'queue_index': index, 'id': source['image_tag'],
            'repo': source['repo'], 'language': source['language'],
            'base_commit': source['failed_commit'], 'job_id': receipt['job_id'],
            'query': query, 'query_sha256': sha(query.encode()),
            'query_bytes': len(query.encode()), 'redactions': count,
            'log_provenance': {
                'receipt': str((R46_DIR / f'CASE-Q{index:02d}.json').relative_to(BASE)),
                'receipt_sha256': sha((R46_DIR / f'CASE-Q{index:02d}.json').read_bytes()),
                'compressed_log': str(log_path.relative_to(BASE)),
                'compressed_log_sha256': sha(compressed),
                'log_bytes': len(log), 'log_sha256': sha(log),
            },
        })

    OUTPUT.mkdir(parents=True, mode=0o700)
    data = ''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n'
                   for row in rows).encode()
    query_sha = save('QUERIES.jsonl', data)
    seal = {
        'schema_version': 'are.g01-guarded-confirm-r50-query-seal/v1',
        'input_sha256': PINS, 'runner_sha256': sha(Path(__file__).read_bytes()),
        'cases': len(rows), 'max_query_bytes': max(row['query_bytes'] for row in rows),
        'missing_test_names': missing_tests, 'redactions': redactions,
        'queries_sha256': query_sha, 'network_calls': 0, 'gold_opened': False,
        'passing_source_opened': False, 'patches_opened': False, 'model_calls': 0,
    }
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    seal_sha = save('QUERY-SEAL.json', seal_data)
    print(json.dumps({**seal, 'seal_sha256': seal_sha}, sort_keys=True))


if __name__ == '__main__':
    main()
