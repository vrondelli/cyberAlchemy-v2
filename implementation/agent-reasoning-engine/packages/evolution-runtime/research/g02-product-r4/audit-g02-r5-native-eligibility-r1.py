#!/usr/bin/env python3
"""Evaluator-only admission bits for a sealed G02 r5 source-only candidate."""

import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
OUTPUT = BASE / 'g02-r5-fresh-cohort-candidate-r1/NATIVE-ELIGIBILITY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
CANDIDATE_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
SOURCE_EXTS = {'.c', '.cc', '.cpp', '.go', '.h', '.java', '.js', '.jsx',
               '.kt', '.py', '.rs', '.ts', '.tsx'}
MAX_FILE_BYTES = 262144


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-native-eligibility.{reason}')


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args],
                          capture_output=True, text=True)


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(PARQUET) == PARQUET_SHA and
         not OUTPUT.exists(), 'input-or-output-drift')
    candidate = json.loads(CANDIDATE.read_text())
    pairs = candidate['ordered_pairs']
    need(candidate['status'] == 'source-only-candidate-not-frozen' and
         len(pairs) == 24 and len({p['instance_id'] for p in pairs}) == 24,
         'candidate-shape')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    rows = []
    totals = Counter()
    for pair in pairs:
        cache = Path(pair['cache_base']) / 'cache' / pair['cache_name']
        commit = pair['base_commit']
        need(git(cache, 'cat-file', '-e', commit + '^{commit}').returncode == 0,
             f'missing-commit:{pair["ordinal"]}')
        listing = git(cache, 'ls-tree', '-r', '--name-only', commit)
        need(listing.returncode == 0, f'ls-tree:{pair["ordinal"]}')
        tracked = set(listing.stdout.splitlines())
        gold = set(loader.get(pair['instance_id']).files())
        counts = Counter()
        for path in gold:
            if path not in tracked:
                counts['untracked'] += 1
            elif Path(path).suffix.lower() not in SOURCE_EXTS:
                counts['unsupported_extension'] += 1
            else:
                size = git(cache, 'cat-file', '-s', f'{commit}:{path}')
                need(size.returncode == 0, f'blob-size:{pair["ordinal"]}')
                counts['over_size_cap' if int(size.stdout.strip()) > MAX_FILE_BYTES
                       else 'index_eligible'] += 1
        need(bool(gold), f'empty-native-gold:{pair["ordinal"]}')
        totals.update(counts)
        rows.append({'ordinal': pair['ordinal'], 'repo': pair['repo'],
                     'native_gold_files': len(gold),
                     'index_eligible': counts['index_eligible'],
                     'other': len(gold) - counts['index_eligible']})
    payload = {'schema_version': 'are.g02-r5-native-eligibility/v1',
               'posture': 'evaluator-only-aggregate-bits-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'pair_count': len(rows),
               'category_totals': dict(sorted(totals.items())), 'rows': rows,
               'claim_ceiling': 'Native-gold/source-index eligibility only; no model, native score, or superiority claim.',
               'open_questions': ['Does every task complete as a matched scored pair?',
                                  'Will native quality and cost clear the prospective gates?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'pairs': len(rows), 'totals': payload['category_totals'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
