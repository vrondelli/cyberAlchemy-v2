#!/usr/bin/env python3
"""Seal r34 failure queries using the unchanged BugSwarm development-r2 rule."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
SELECTIVE = BASE / 'selective-r28'
R29 = SELECTIVE / 'preflight-r29'
R31 = SELECTIVE / 'alternate-client-r31'
R33 = SELECTIVE / 'rebalanced-r33'
R34_DIR = SELECTIVE / 'final-r34'
R34 = R34_DIR / 'RESULT.json'
R36 = SELECTIVE / 'code-projection-r36/RESULT.json'
META = BASE / 'source-only-r1/FAILURE-SIDE-METADATA.jsonl'
RULE = HERE / 'project-bugswarm-graph-dev-r2-queries.py'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R37-QUERY-PROTOCOL-2026-10-04.md'
OUTPUT = SELECTIVE / 'query-only-r37'
PINS = {
    'r34': 'fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c',
    'r36': '14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
    'metadata': '5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686',
    'rule': '6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest(path: Path) -> str:
    return sha(path.read_bytes())


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> str:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    return sha(data)


def resolve_log(row: dict) -> tuple[bytes, dict]:
    slot = row['slot']
    evidence = row['evidence']
    if evidence.startswith('preflight-r29/'):
        receipt_path = R29 / f'CASE-{slot:02d}.json'
        receipt = json.loads(receipt_path.read_bytes())
        need(receipt['ordinal'] == slot and receipt['admitted']
             and receipt['image_tag'] == row['image_tag']
             and receipt['repo'] == row['repo'] and receipt['language'] == row['language']
             and receipt['job_id'] == row['job_id']
             and receipt['failed_commit'] == row['failed_commit']
             and evidence == f"preflight-r29/{receipt['log']['body_file']}",
             f'r29-receipt:{slot}')
        log_path = SELECTIVE / evidence
        expected_sha = receipt['log']['sha256']
        expected_bytes = receipt['log']['bytes']
    elif evidence.startswith('alternate-client-r31/'):
        receipt_path = R31 / f'CASE-{slot:02d}.json'
        receipt = json.loads(receipt_path.read_bytes())
        need(receipt['ordinal'] == slot and receipt['repaired']
             and receipt['repo'] == row['repo'] and receipt['language'] == row['language']
             and receipt['job_id'] == row['job_id']
             and evidence == f"alternate-client-r31/{receipt['body_file']}",
             f'r31-receipt:{slot}')
        log_path = SELECTIVE / evidence
        expected_sha = receipt['body_sha256']
        expected_bytes = receipt['body_bytes']
    else:
        need('/' not in evidence and evidence.endswith('-ATTEMPT.json'),
             f'attempt-evidence-name:{slot}')
        receipt_dir = R33 if row['r34_retained'] else R34_DIR
        receipt_path = receipt_dir / evidence
        receipt = json.loads(receipt_path.read_bytes())
        need(receipt['slot'] == slot and receipt['admitted']
             and receipt['image_tag'] == row['image_tag']
             and receipt['repo'] == row['repo'] and receipt['language'] == row['language']
             and receipt['job_id'] == row['job_id']
             and receipt['failed_commit'] == row['failed_commit'],
             f'attempt-receipt:{slot}')
        log_path = receipt_dir / receipt['log']['body_file']
        expected_sha = receipt['log']['sha256']
        expected_bytes = receipt['log']['bytes']
    need(receipt_path.is_file() and log_path.is_file(), f'log-path:{slot}')
    compressed = log_path.read_bytes()
    log = gzip.decompress(compressed)
    need(len(log) == expected_bytes and sha(log) == expected_sha,
         f'log-content:{slot}')
    provenance = {
        'receipt': str(receipt_path.relative_to(SELECTIVE)),
        'receipt_sha256': digest(receipt_path),
        'compressed_log': str(log_path.relative_to(SELECTIVE)),
        'compressed_log_sha256': sha(compressed),
        'log_bytes': len(log),
        'log_sha256': sha(log),
    }
    return log, provenance


def main() -> None:
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in (('r34', R34), ('r36', R36), ('metadata', META), ('rule', RULE)):
        need(digest(path) == PINS[name], f'input-pin-drift:{name}')
    spec = importlib.util.spec_from_file_location('g01_query_rule', RULE)
    need(spec is not None and spec.loader is not None, 'query-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    population = json.loads(R34.read_bytes())
    projection = json.loads(R36.read_bytes())
    metadata = {row['image_tag']: row for row in
                (json.loads(line) for line in META.read_text().splitlines())}
    need(population['filled_slots'] == projection['cases'] == 24
         and len(population['rows']) == len(projection['records']) == 24
         and len(metadata) == 4388 and not population['gold_opened']
         and not projection['gold_opened'] and population['model_calls'] == 0
         and projection['model_calls'] == 0, 'input-shape-drift')

    rows = []
    missing_tests = redactions = 0
    for ordinal, (case, projected) in enumerate(
            zip(population['rows'], projection['records']), 1):
        need(case['slot'] == projected['slot'] == ordinal
             and all(projected[key] == case[key] for key in
                     ('image_tag', 'repo', 'language', 'failed_commit')),
             f'case-identity:{ordinal}')
        item = metadata[case['image_tag']]
        need(item['failure']['job_id'] == case['job_id']
             and item['failure']['trigger_sha'] == case['failed_commit'],
             f'metadata-identity:{ordinal}')
        log, provenance = resolve_log(case)
        tests = item['failure']['failed_tests']
        need(isinstance(tests, str), f'failed-tests-type:{ordinal}')
        test_part = rule.bounded_prefix(
            tests.replace('#', '\n'), rule.MAX_TEST_BYTES,
        ).strip()
        missing_tests += not bool(test_part)
        log_text = rule.ANSI.sub('', log.decode('utf-8', errors='replace'))
        heading = f'failed tests:\n{test_part}\n' if test_part else ''
        tail = rule.bounded_suffix(
            log_text, rule.MAX_QUERY_BYTES - len(heading.encode()) - 16,
        ).strip()
        query = f'{heading}log tail:\n{tail}'.strip()
        query, count = rule.SENSITIVE.subn('[REDACTED]', query)
        redactions += count
        need(query and len(query.encode()) <= rule.MAX_QUERY_BYTES,
             f'query-size:{ordinal}')
        rows.append({
            'ordinal': ordinal,
            'id': case['image_tag'],
            'repo': case['repo'],
            'language': case['language'],
            'base_commit': case['failed_commit'],
            'job_id': case['job_id'],
            'query': query,
            'query_sha256': sha(query.encode()),
            'query_bytes': len(query.encode()),
            'redactions': count,
            'log_provenance': provenance,
        })

    OUTPUT.mkdir(mode=0o700)
    data = ''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n'
                   for row in rows).encode()
    queries_sha = save('QUERIES.jsonl', data)
    seal = {
        'schema_version': 'are.g01-selective-r37-query-seal/v1',
        'r34_sha256': PINS['r34'],
        'r36_sha256': PINS['r36'],
        'metadata_sha256': PINS['metadata'],
        'rule_sha256': PINS['rule'],
        'protocol_sha256': digest(PROTOCOL),
        'runner_sha256': digest(Path(__file__)),
        'cases': len(rows),
        'max_query_bytes': max(row['query_bytes'] for row in rows),
        'missing_test_names': missing_tests,
        'redactions': redactions,
        'queries_sha256': queries_sha,
        'network_calls': 0,
        'gold_opened': False,
        'passing_source_opened': False,
        'patches_opened': False,
        'model_calls': 0,
    }
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    seal_sha = save('QUERY-SEAL.json', encoded)
    print(json.dumps({'cases': len(rows), 'max_query_bytes': seal['max_query_bytes'],
                      'missing_test_names': missing_tests, 'redactions': redactions,
                      'queries_sha256': queries_sha, 'seal_sha256': seal_sha}))


if __name__ == '__main__':
    main()
