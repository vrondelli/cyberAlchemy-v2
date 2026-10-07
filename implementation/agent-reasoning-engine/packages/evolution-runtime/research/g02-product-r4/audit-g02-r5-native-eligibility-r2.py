#!/usr/bin/env python3
"""Correct r5 evaluator: native presence and exact index pre-budget rules."""

import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r5-fresh-cohort-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
FAILED_R1 = ROOT / 'NATIVE-ELIGIBILITY.json'
OUTPUT = ROOT / 'NATIVE-ELIGIBILITY-R2.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
FAILED_R1_SHA = '0feabf5377072f064e8ae6054ae0bb296d80633b152e8201f285e3f667d44a72'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-native-eligibility-r2.{reason}')


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args],
                          capture_output=True)


def main():
    need(sha(CANDIDATE) == CANDIDATE_SHA and sha(FAILED_R1) == FAILED_R1_SHA
         and sha(PARQUET) == PARQUET_SHA and sha(INDEX) == INDEX_SHA and not OUTPUT.exists(),
         'input-or-output-drift')
    # The r4 own-expansions base is language-neutral: text files <=1 MiB,
    # lexically indexed up to 32 MiB. R1 incorrectly used a code-extension filter.
    source = INDEX.read_text()
    need('size > 1024 * 1024' in source and
         'indexedBytes + size > maximum_index_bytes' in source and
         'buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0)' in source,
         'index-source-unrecognized')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    pairs = json.loads(CANDIDATE.read_text())['ordered_pairs']
    need(len(pairs) == 24, 'denominator')
    rows = []
    totals = Counter()
    for pair in pairs:
        cache = Path(pair['cache_base']) / 'cache' / pair['cache_name']
        commit = pair['base_commit']
        need(git(cache, 'cat-file', '-e', commit.encode() + b'^{commit}').returncode == 0,
             f'commit:{pair["ordinal"]}')
        tree = git(cache, 'ls-tree', '-r', '-z', '--name-only', commit.encode())
        need(tree.returncode == 0, f'tree:{pair["ordinal"]}')
        tracked = {part.decode('utf-8', 'surrogateescape')
                   for part in tree.stdout.split(b'\0') if part}
        gold = set(loader.get(pair['instance_id']).files())
        need(bool(gold), f'empty-gold:{pair["ordinal"]}')
        counts = Counter()
        for path in gold:
            if path not in tracked:
                counts['untracked'] += 1
                continue
            blob = git(cache, 'show', (commit + ':' + path).encode('utf-8', 'surrogateescape'))
            need(blob.returncode == 0, f'blob:{pair["ordinal"]}')
            if len(blob.stdout) > 1024 * 1024:
                counts['over_1mib'] += 1
            elif b'\0' in blob.stdout[:8192]:
                counts['binary_first_8192'] += 1
            else:
                counts['text_prebudget_admissible'] += 1
        totals.update(counts)
        rows.append({'ordinal': pair['ordinal'], 'repo': pair['repo'],
                     'native_gold_files': len(gold),
                     'text_prebudget_admissible': counts['text_prebudget_admissible'],
                     'not_prebudget_admissible': len(gold)-counts['text_prebudget_admissible']})
    payload = {'schema_version': 'are.g02-r5-native-eligibility/v2',
               'posture': 'evaluator-only-aggregate-bits-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA, 'parquet_sha256': PARQUET_SHA,
               'failed_r1_sha256': FAILED_R1_SHA,
               'failed_r1_reason': 'R1 used an older code-extension filter, not the r4 runner index; its 38-file source-ceiling claim is invalid.',
               'index_source_sha256': INDEX_SHA,
               'script_sha256': sha(__file__), 'pair_count': len(rows),
               'category_totals': dict(sorted(totals.items())), 'rows': rows,
               'index_budget_note': 'Pre-budget 1 MiB and first-8192-byte binary rules only; the 32 MiB ordered aggregate budget remains unchecked.',
               'claim_ceiling': 'Native-gold presence and pre-budget source admissibility only; no complete index reachability, model call, score, or superiority claim.',
               'open_questions': ['Does the full ordered 32 MiB index admit these pre-budget files?',
                                  'Will all 24 pairs score and clear quality/cost gates?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'pairs': len(rows), 'totals': payload['category_totals'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
