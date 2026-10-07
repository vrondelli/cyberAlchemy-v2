#!/usr/bin/env python3
"""Evaluator-only coverage counts for the sealed same-directory G02 pool."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/SOURCE-SEAL.json'
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-same-directory-pool-exposed-r1-20261003/AUDIT.json'
PINS = {SOURCE: '58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1',
        PRIOR: 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901',
        PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError('output-exists-or-input-drift')
    source = json.loads(SOURCE.read_text())
    prior = json.loads(PRIOR.read_text())
    if [row['ordinal'] for row in source['rows']] != list(range(1, 13)):
        raise ValueError('source-rows')
    prior_by_ordinal = {row['ordinal']: row for row in prior['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native_by_id = {row['instance_id']: row for row in table}
    if len(native_by_id) != len(table):
        raise ValueError('duplicate-native-id')
    rows = []
    for row in source['rows']:
        ordinal = row['ordinal']
        old = prior_by_ordinal[ordinal]
        native = native_by_id[row['instance_id']]
        candidates = {normalize(x['path']) for x in row['candidates']}
        delivered = {normalize(path) for path in row['delivered_paths']}
        raw30 = {normalize(x['path']) for x in old['raw_top30']}
        structured30 = {normalize(x['path']) for x in old['structured_top30']}
        if (len(candidates) != len(row['candidates']) or candidates & delivered or
                row['instance_id'] != old['instance_id'] or
                row['base_commit'] != old['base_commit'] or
                row['base_commit'] != native['base_commit'] or
                row['issue_sha256'] != old['issue_sha256'] or
                delivered != {normalize(path) for path in old['delivered_paths']}):
            raise ValueError(f'identity-or-pool-drift:{ordinal}')
        gold = {normalize(item['file']) for item in json.loads(native['gold_context'])}
        missing = gold - delivered
        prior_pool = raw30 | structured30
        rows.append({'ordinal': ordinal, 'repo': row['repo'],
                     'candidate_count': len(candidates), 'missing_gold': len(missing),
                     'same_dir_new_gold': len(candidates & missing),
                     'same_dir_incremental_over_bm25_top30': len((candidates - prior_pool) & missing),
                     'same_dir_non_gold': len(candidates - gold),
                     'bm25_union_new_gold': len(prior_pool & missing)})
    summary = {key: sum(row[key] for row in rows) for key in
               ('candidate_count', 'missing_gold', 'same_dir_new_gold',
                'same_dir_incremental_over_bm25_top30', 'same_dir_non_gold', 'bm25_union_new_gold')}
    summary['tasks'] = len(rows)
    receipt = {'schema_version': 'g02.r11-same-directory-pool-exposed-audit/v1',
               'posture': 'evaluator-only-exposed-development-coverage-no-model-no-read',
               'source_seal_sha256': PINS[SOURCE], 'prior_seal_sha256': PINS[PRIOR],
               'native_gold_parquet_sha256': PINS[PARQUET],
               'script_sha256': sha(Path(__file__)), 'rows': rows, 'summary': summary,
               'claim_ceiling': 'Exposed candidate coverage only; no selection, actual reads, native score, costs, independent cohort, or superiority.'}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
