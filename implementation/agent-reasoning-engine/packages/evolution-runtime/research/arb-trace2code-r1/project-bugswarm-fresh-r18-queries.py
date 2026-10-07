#!/usr/bin/env python3
"""Seal fresh G01 failure queries using the unchanged development-r2 rule."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R14_DIR = BASE / 'fresh-r11/repair-r14/run'
R13_DIR = BASE / 'fresh-r11/header-r13'
R12_DIR = BASE / 'fresh-r11/preflight-r12'
R14 = R14_DIR / 'RESULT.json'
R17 = BASE / 'fresh-r11/code-only-r17/RESULT.json'
META = BASE / 'source-only-r1/FAILURE-SIDE-METADATA.jsonl'
OUTPUT = BASE / 'fresh-r11/query-only-r18'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R18-QUERY-PROTOCOL-2026-10-04.md'
PINS = {
    'r14': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
    'r17': '6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992',
    'metadata': '5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686',
    'rule': '6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872',
    'protocol': 'd2e3c20f26f75145bec361cc1e4d928821ffb2ab5a793ddd6d6c1e1354a37707',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(condition: bool, reason: str) -> None:
    if not condition:
        raise SystemExit(reason)


def save(name: str, data: bytes) -> None:
    fd = os.open(OUTPUT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)


def main() -> None:
    rule_path = HERE / 'project-bugswarm-graph-dev-r2-queries.py'
    need(not OUTPUT.exists() and sha(R14.read_bytes()) == PINS['r14']
         and sha(R17.read_bytes()) == PINS['r17']
         and sha(META.read_bytes()) == PINS['metadata']
         and sha(rule_path.read_bytes()) == PINS['rule']
         and sha(PROTOCOL.read_bytes()) == PINS['protocol'],
         'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_query_rule', rule_path)
    need(spec is not None and spec.loader is not None, 'query-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    slots = json.loads(R14.read_bytes())['slots']
    roots = json.loads(R17.read_bytes())['records']
    metadata = {row['image_tag']: row for row in
                (json.loads(line) for line in META.read_text().splitlines())}
    need(len(slots) == len(roots) == 24 and len(metadata) == 4388,
         'denominator-or-metadata-drift')
    r13 = json.loads((R13_DIR / 'RESULT.json').read_bytes())['rows']
    need(len(r13) == 24, 'r13-denominator-drift')
    rows = []
    missing_tests = redactions = 0
    for ordinal, (slot, projected) in enumerate(zip(slots, roots), 1):
        final = slot['final']
        tag = final['image_tag']
        item = metadata[tag]
        need(slot['slot'] == projected['slot'] == ordinal
             and all(projected[key] == final[key] for key in
                     ('image_tag', 'repo', 'language', 'failed_commit'))
             and item['failure']['job_id'] == final['job_id']
             and item['failure']['trigger_sha'] == final['failed_commit'],
             f'case-identity-{ordinal}')
        if slot['retained']:
            receipt = r13[ordinal - 1]
            need(receipt['ordinal'] == ordinal and receipt['admitted']
                 and receipt['id'] == tag and receipt['job_id'] == final['job_id']
                 and receipt['failed_commit'] == final['failed_commit'],
                 f'retained-log-receipt-{ordinal}')
            source_dir = {'r12-reused': R12_DIR,
                          'r13-new-capped-get': R13_DIR}.get(receipt['log_source'])
            need(source_dir is not None, f'retained-log-source-{ordinal}')
            log = gzip.decompress((source_dir / receipt['log']['body_file']).read_bytes())
        else:
            receipt_path = R14_DIR / final['evidence']
            need(receipt_path.parent == R14_DIR and receipt_path.is_file(),
                 f'replacement-receipt-path-{ordinal}')
            receipt = json.loads(receipt_path.read_bytes())
            need(receipt['slot'] == ordinal and receipt['admitted']
                 and receipt['image_tag'] == tag and receipt['job_id'] == final['job_id']
                 and receipt['failed_commit'] == final['failed_commit'],
                 f'replacement-log-receipt-{ordinal}')
            log = gzip.decompress((R14_DIR / receipt['log']['body_file']).read_bytes())
        need(sha(log) == final['log_sha256'] == receipt['log']['sha256']
             and len(log) == final['log_bytes'] == receipt['log']['bytes'],
             f'log-bytes-{ordinal}')
        tests = item['failure']['failed_tests']
        need(isinstance(tests, str), f'failed-tests-type-{ordinal}')
        test_part = rule.bounded_prefix(tests.replace('#', '\n'), rule.MAX_TEST_BYTES).strip()
        missing_tests += not bool(test_part)
        log_text = rule.ANSI.sub('', log.decode('utf-8', errors='replace'))
        heading = f'failed tests:\n{test_part}\n' if test_part else ''
        tail = rule.bounded_suffix(log_text,
                                   rule.MAX_QUERY_BYTES - len(heading.encode()) - 16).strip()
        query = f'{heading}log tail:\n{tail}'.strip()
        query, count = rule.SENSITIVE.subn('[REDACTED]', query)
        redactions += count
        need(query and len(query.encode()) <= rule.MAX_QUERY_BYTES,
             f'query-size-{ordinal}')
        rows.append({'ordinal': ordinal, 'id': tag, 'repo': final['repo'],
                     'language': final['language'], 'base_commit': final['failed_commit'],
                     'job_id': final['job_id'], 'log_sha256': final['log_sha256'],
                     'query': query, 'query_sha256': sha(query.encode()),
                     'query_bytes': len(query.encode()), 'redactions': count})
    OUTPUT.mkdir(mode=0o700)
    data = ''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n'
                   for row in rows).encode()
    save('QUERIES.jsonl', data)
    seal = {'schema_version': 'are.g01-fresh-query-seal-r18/v1',
            'r14_sha256': PINS['r14'], 'r17_sha256': PINS['r17'],
            'metadata_sha256': PINS['metadata'], 'rule_sha256': PINS['rule'],
            'protocol_sha256': PINS['protocol'], 'script_sha256': sha(Path(__file__).read_bytes()),
            'cases': 24, 'max_query_bytes': max(row['query_bytes'] for row in rows),
            'missing_test_names': missing_tests, 'redactions': redactions,
            'queries_sha256': sha(data), 'gold_opened': False, 'model_calls': 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + '\n').encode()
    save('QUERY-SEAL.json', encoded)
    print(json.dumps({'cases': 24, 'max_query_bytes': seal['max_query_bytes'],
                      'missing_test_names': missing_tests, 'redactions': redactions,
                      'queries_sha256': sha(data), 'seal_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
