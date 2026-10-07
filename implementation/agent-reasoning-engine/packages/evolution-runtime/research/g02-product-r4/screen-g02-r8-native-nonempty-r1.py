#!/usr/bin/env python3
"""Export only native-gold-nonempty bits for the already fixed r8 pool."""

import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
POOL = BASE / 'g02-r8-screening-pool-r1/POOL.json'
OUTPUT = BASE / 'g02-r8-screening-pool-r1/NATIVE-NONEMPTY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
POOL_SHA = 'ff0eb2511efb20c5d86b13a391984782a98d309a7f911216a440833f595dc389'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(POOL) != POOL_SHA or sha(PARQUET) != PARQUET_SHA:
        raise ValueError('g02-r8-native-nonempty.input-or-output-drift')
    pool = json.loads(POOL.read_text())
    rows = pool['ordered_pool']
    if len(rows) != 32 or pool['status'] != 'source-only-screening-pool-frozen-before-evaluator-access':
        raise ValueError('g02-r8-native-nonempty.pool-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    bits = []
    totals = defaultdict(Counter)
    for row in rows:
        eligible = bool(set(loader.get(row['instance_id']).files()))
        bits.append({'ordinal': row['ordinal'], 'repo': row['repo'],
                     'source': row['source'], 'native_gold_nonempty': eligible})
        totals[row['repo']]['screened'] += 1
        totals[row['repo']]['eligible' if eligible else 'empty_gold'] += 1
    payload = {'schema_version': 'are.g02-r8-native-nonempty-screen/v1',
               'posture': 'evaluator-only-bits-no-gold-path-or-score-export',
               'pool_sha256': POOL_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'screened_count': len(bits),
               'by_repo': {repo: dict(counts) for repo, counts in sorted(totals.items())},
               'bits': bits,
               'claim_ceiling': 'Native scorable-task eligibility only; not source reachability, matched quality or superiority.',
               'open_questions': ['Does each repository meet the declared six-eligible threshold?',
                                  'Can selected exact source commits and indexes be qualified without performance-label access?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'screened': len(bits), 'by_repo': payload['by_repo'],
                      'sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
