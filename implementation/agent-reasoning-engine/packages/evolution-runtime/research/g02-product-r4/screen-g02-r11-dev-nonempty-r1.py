#!/usr/bin/env python3
"""Evaluator-only native-nonempty bits for the sealed r11 source pool."""

from collections import Counter, defaultdict
import hashlib
import json
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
POOL = BASE / 'g02-r11-dev-pool-r1/POOL.json'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/NATIVE-NONEMPTY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
POOL_SHA = '99801b07c14fbb53a27e9d89cbba6648e12e64514bb904d4e5b7c59608878d8b'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    if OUTPUT.exists() or sha(POOL) != POOL_SHA or sha(PARQUET) != PARQUET_SHA:
        raise ValueError('g02-r11-dev-nonempty.input-or-output-drift')
    pool = json.loads(POOL.read_text())
    rows = pool['ordered_pool']
    if (len(rows) != 32 or len({row['instance_id'] for row in rows}) != 32 or
            pool['status'] != 'source-only-pool-not-screened-frozen-or-dispatched' or
            pool['selection']['gold_or_score_used_to_form_pool'] is not False):
        raise ValueError('g02-r11-dev-nonempty.pool-shape')
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
    payload = {
        'schema_version': 'are.g02-r11-dev-native-nonempty-screen/v1',
        'posture': 'evaluator-only-bits-no-gold-path-or-score-export',
        'pool_sha256': POOL_SHA, 'parquet_sha256': PARQUET_SHA,
        'script_sha256': sha(__file__), 'screened_count': len(bits),
        'by_repo': {repo: dict(counts) for repo, counts in sorted(totals.items())},
        'bits': bits, 'model_calls': 0,
        'claim_ceiling': 'Native eligibility bits only; not source reachability, matched quality, or superiority.',
        'open_questions': ['Does each repository meet the declared six-eligible threshold?',
                           'Can selected exact commits and arm clone paths be qualified without performance-label access?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'screened': len(bits), 'by_repo': payload['by_repo'],
                      'sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
