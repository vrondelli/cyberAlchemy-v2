#!/usr/bin/env python3
"""Evaluator-only aggregate native-gold ceiling after the source union seal."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive/g02-r11-cpp-union-ceiling-r1-20261003')
SOURCE = ROOT / 'SOURCE-UNION.json'
PARQUET = Path('/home/vlad_/are-benchmark-archive/g02-r11-reference-private/full.parquet')
SOURCE_SHA = '86b8a3ed5790313bbee666e6c85f928c035565fe3199696734b0ead676ac3fde'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha_file(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-cpp-union-audit.' + reason)


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    output = ROOT / 'EVALUATOR-COVERAGE.json'
    need(not output.exists() and sha_file(SOURCE) == SOURCE_SHA and
         sha_file(PARQUET) == PARQUET_SHA, 'input-or-output')
    sealed = json.loads(SOURCE.read_text())
    need(sealed['posture'] == 'exposed-source-only-before-evaluator' and
         [row['ordinal'] for row in sealed['rows']] == [4, 8, 12], 'source-shape')
    reference = {row['instance_id']: row for row in
                 parquet.read_table(PARQUET, columns=['instance_id', 'gold_context']).to_pylist()}
    rows = []
    for row in sealed['rows']:
        gold = {norm(item['file']) for item in
                json.loads(reference[row['instance_id']]['gold_context'])}
        delivered = {norm(path) for path in row['delivered_paths']}
        channels = {key: {norm(path) for path in value}
                    for key, value in row['channel_paths'].items()}
        union = {norm(path) for path in row['union_paths']}
        need(union == set().union(*channels.values()) and
             not union & delivered, 'union-shape')
        missing = gold - delivered
        rows.append({'ordinal': row['ordinal'], 'undelivered_gold': len(missing),
                     'union_candidates': len(union), 'union_gold': len(union & missing),
                     'gold_outside_union': len(missing - union),
                     'channel_coverage': {key: len(value & missing)
                                          for key, value in channels.items()}})
    totals = {key: sum(row[key] for row in rows)
              for key in ('undelivered_gold', 'union_candidates', 'union_gold', 'gold_outside_union')}
    result = {'schema_version': 'are.g02-r11-cpp-union-ceiling-audit/v1',
              'posture': 'evaluator-only-after-source-seal',
              'source_sha256': SOURCE_SHA, 'reference_sha256': PARQUET_SHA,
              'rows': rows, 'totals': totals,
              'claim_ceiling': 'Three exposed C++ tasks, candidate coverage only; no delivered reads, model choice, native score, independent validation, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as target:
        target.write(data)
    print(json.dumps({'rows': rows, 'totals': totals,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
