#!/usr/bin/env python3
"""Evaluator-only aggregate coverage of source-sealed macro counterpart."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
ROOT = ARCHIVE / 'g02-r11-task8-macro-lifecycle-pool-r1-20261003'
POOL = ROOT / 'MACRO-POOL.json'
PARQUET = ARCHIVE / 'g02-r11-reference-private/full.parquet'
POOL_SHA = '01f905d78f9075db2e584ca77eb4d2f6ee3a30a7dfcc14762ea4bef6f950145e'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def need(ok, reason):
    if not ok:
        raise ValueError('g02-macro-lifecycle-audit.' + reason)


def main():
    output = ROOT / 'EVALUATOR-COVERAGE.json'
    need(not output.exists() and sha(POOL) == POOL_SHA and sha(PARQUET) == PARQUET_SHA,
         'input-or-output')
    pool = json.loads(POOL.read_text())
    rows = parquet.read_table(PARQUET, columns=['instance_id', 'gold_context']).to_pylist()
    need(len(rows) == len({row['instance_id'] for row in rows}), 'duplicate-reference')
    by_id = {row['instance_id']: row for row in rows}
    gold = {norm(item['file']) for item in
            json.loads(by_id[pool['instance_id']]['gold_context'])}
    before = {norm(path) for path in pool['original_candidate_paths']}
    after = {norm(path) for path in pool['expanded_candidate_paths']}
    added = norm(pool['added_candidate']['path'])
    delivered = {norm(path) for path in pool['already_delivered_paths']}
    need(after == before | {added} and added not in delivered and len(gold) == 2,
         'pool-or-reference-shape')
    counts = {'gold_files': len(gold), 'gold_original_pool': len(gold & before),
              'gold_added_candidate': int(added in gold),
              'gold_expanded_pool': len(gold & after),
              'gold_still_outside_delivered_and_expanded_pool': len(gold-delivered-after)}
    result = {'schema_version': 'are.g02-r11-task8-macro-lifecycle-pool-audit/v1',
              'posture': 'evaluator-only-after-source-pool-seal',
              'source_pool_sha256': POOL_SHA, 'reference_sha256': PARQUET_SHA,
              'counts': counts,
              'claim_ceiling': 'One exposed task, aggregate candidate coverage only; no actual model read, native score, independent validation, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'counts': counts,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
