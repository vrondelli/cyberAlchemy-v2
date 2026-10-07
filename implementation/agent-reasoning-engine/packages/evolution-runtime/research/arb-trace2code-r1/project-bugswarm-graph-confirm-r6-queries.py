#!/usr/bin/env python3
"""Project bounded G01 confirmation queries from authenticated failure-side logs."""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R1 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r1-preflight'
R2 = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
R5 = BASE / 'graph-confirm-r4/code-only/RESULT.json'
META = BASE / 'source-only-r1/FAILURE-SIDE-METADATA.jsonl'
OUTPUT = BASE / 'graph-confirm-r4/query-only'
PINS = {
    'r2': 'a55087a01c1b157ea7fcd6dfa4327037a3e4cb13c72df5e0c31b44d80513c22c',
    'r5': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'metadata': '5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686',
    'rule': '6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872',
}
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-GRAPH-CONFIRM-R6-QUERY-BASELINE-PROTOCOL-2026-10-04.md'


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
    need(not OUTPUT.exists() and sha(rule_path.read_bytes()) == PINS['rule'] and
         sha((R2 / 'REPAIR-RESULT.json').read_bytes()) == PINS['r2'] and
         sha(R5.read_bytes()) == PINS['r5'] and sha(META.read_bytes()) == PINS['metadata'],
         'output-or-input-pin-drift')
    spec = importlib.util.spec_from_file_location('g01_query_rule', rule_path)
    need(spec is not None and spec.loader is not None, 'query-rule-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    slots = json.loads((R2 / 'REPAIR-RESULT.json').read_bytes())['rows']
    roots = json.loads(R5.read_bytes())['records']
    metadata = {row['image_tag']: row for row in
                (json.loads(line) for line in META.read_text().splitlines())}
    need(len(slots) == len(roots) == 24 and len(metadata) == 4388,
         'denominator-or-metadata-drift')
    OUTPUT.mkdir(mode=0o700)
    rows = []
    missing_tests = redactions = 0
    for index, (slot, projected) in enumerate(zip(slots, roots), 1):
        final = slot['final']
        tag = final['image_tag']
        item = metadata[tag]
        need(slot['slot'] == projected['slot'] == index and
             projected['image_tag'] == tag and projected['repo'] == final['repo'] and
             projected['failed_commit'] == final['failed_commit'] and
             item['failure']['job_id'] == final['job_id'] and
             item['failure']['trigger_sha'] == final['failed_commit'],
             f'case-identity-{index}')
        if slot['retained']:
            log = (R1 / f'HTTPS-LOG-{index:02d}.txt').read_bytes()
        else:
            attempt = slot['attempts'][-1]
            need(attempt['admitted'], f'log-admission-{index}')
            log = gzip.decompress((R2 / attempt['log']['body_file']).read_bytes())
        need(sha(log) == final['log_sha256'] and len(log) == final['log_bytes'],
             f'log-hash-{index}')
        tests = item['failure']['failed_tests']
        need(isinstance(tests, str), f'failed-tests-type-{index}')
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
             f'query-size-{index}')
        rows.append({'ordinal': index, 'id': tag, 'repo': final['repo'],
                     'language': final['language'], 'base_commit': final['failed_commit'],
                     'job_id': final['job_id'], 'log_sha256': final['log_sha256'],
                     'query': query, 'query_sha256': sha(query.encode()),
                     'query_bytes': len(query.encode()), 'redactions': count})
    data = ''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n'
                   for row in rows).encode()
    save('QUERIES.jsonl', data)
    seal = {'schema_version': 'are.g01-confirm-query-seal-r6/v1',
            'r2_sha256': PINS['r2'], 'r5_sha256': PINS['r5'],
            'metadata_sha256': PINS['metadata'], 'rule_sha256': PINS['rule'],
            'protocol_sha256': sha(PROTOCOL.read_bytes()),
            'script_sha256': sha(Path(__file__).read_bytes()),
            'query_rule': 'development r2 unchanged, 256-byte failed-test prefix plus ANSI-stripped log tail <=1024 UTF-8 bytes with sensitive-pattern redaction',
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
