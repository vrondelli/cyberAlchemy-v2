#!/usr/bin/env python3
"""Evaluator-only coverage audit; exports counts, never native gold paths."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PRIOR = ROOT / 'g02-r11-retrieval-exposed-r1-20261002/SEAL.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SOURCE.parent / 'EVALUATOR-COVERAGE.json'
PINS = {SOURCE: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
        PRIOR: 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901',
        PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output exists or input drift')
    source = json.loads(SOURCE.read_text())
    prior = {row['ordinal']: row for row in json.loads(PRIOR.read_text())['rows']}
    table = parquet.read_table(PARQUET,
                               columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table) or [r['ordinal'] for r in source['rows']] != list(range(1, 13)):
        raise SystemExit('native or source identity drift')
    channels = ['same_directory', 'python_import', 'cpp_include']
    rows = []
    for row in source['rows']:
        old = prior[row['ordinal']]
        reference = native[row['instance_id']]
        delivered = set(row['delivered_paths'])
        if (row['instance_id'] != old['instance_id'] or
                row['base_commit'] != old['base_commit'] or
                row['base_commit'] != reference['base_commit'] or
                row['issue_sha256'] != old['issue_sha256'] or
                delivered != {normalize(path) for path in old['delivered_paths']}):
            raise SystemExit(f'identity drift: {row["ordinal"]}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        missing = gold - delivered
        pool = {item['path'] for item in row['candidates']}
        eligible = {item['path'] for item in row['candidates']
                    if item['bytes'] <= source['max_read_bytes']}
        bm25 = ({normalize(item['path']) for item in old['raw_top30']} |
                {normalize(item['path']) for item in old['structured_top30']}) - delivered
        if len(pool) != len(row['candidates']) or pool & delivered:
            raise SystemExit(f'candidate drift: {row["ordinal"]}')
        channel_pools = {channel: {item['path'] for item in row['candidates']
                                   if channel in item['channels']}
                         for channel in channels}
        result = {'ordinal': row['ordinal'], 'repo': row['repo'],
                  'missing_gold': len(missing), 'candidate_count': len(pool),
                  'eligible_candidate_count': len(eligible),
                  'union_gold': len(pool & missing),
                  'eligible_union_gold': len(eligible & missing),
                  'union_false_candidates': len(pool - gold),
                  'bm25_top30_gold': len(bm25 & missing),
                  'incremental_gold_over_bm25': len((pool - bm25) & missing),
                  'channel_counts': {channel: {'candidates': len(paths),
                                               'missing_gold': len(paths & missing),
                                               'unique_gold': len((paths - set.union(
                                                   set(), *(channel_pools[other] for other in channels
                                                            if other != channel))) & missing)}
                                     for channel, paths in channel_pools.items()}}
        rows.append(result)
    totals = {key: sum(row[key] for row in rows) for key in
              ('missing_gold', 'candidate_count', 'eligible_candidate_count',
               'union_gold', 'eligible_union_gold', 'union_false_candidates',
               'bm25_top30_gold', 'incremental_gold_over_bm25')}
    output = {'schema_version': 'g02.r11-relation-union-exposed-audit/v1',
              'posture': 'evaluator-only-exposed-development-no-model-no-read',
              'input_sha256': {path.name: pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'rows': rows, 'totals': totals,
              'claim_ceiling': 'Unranked candidate coverage only; no selected read, native F1, cost, independent cohort, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'totals': totals, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
