#!/usr/bin/env python3
"""Evaluator-only native-gold presence and pre-budget reachability for r6."""

import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r6-mixed-source-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
INDEX_PREFLIGHT = ROOT / 'SOURCE-INDEX-PREFLIGHT-R2.json'
OUTPUT = ROOT / 'NATIVE-ELIGIBILITY.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
CACHE = Path('/tmp/are-g02-r6-mixed-source-caches-r1/cache')
INDEX = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs')
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
INDEX_PREFLIGHT_SHA = 'a14e2e67774b72153192bda6196137321c2092aaa6b90a74edf0c2cc0b8a286d'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
INDEX_SHA = '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r6-native-eligibility.' + reason)


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(INDEX_PREFLIGHT) == INDEX_PREFLIGHT_SHA and
         sha(PARQUET) == PARQUET_SHA and sha(INDEX) == INDEX_SHA,
         'input-or-output-drift')
    source = INDEX.read_text()
    need('size > 1024 * 1024' in source and
         'indexedBytes + size > maximum_index_bytes' in source and
         'buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0)' in source,
         'index-source-unrecognized')
    preflight = json.loads(INDEX_PREFLIGHT.read_text())
    need(preflight['status'] == 'passed' and preflight['passed_count'] == 24,
         'source-preflight-incomplete')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    ready = {}
    for name in ('TASK-CACHE-HYDRATION-R2.json', 'PRO-TASK-CACHE-HYDRATION-R2.json'):
        for row in json.loads((ROOT / name).read_text())['results']:
            ready[row['ordinal']] = row
    need(len(tasks) == len(ready) == 24, 'denominator')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    rows = []
    totals = Counter()
    for task in tasks:
        ordinal = task['ordinal']
        cache = CACHE / ready[ordinal]['cache_leaf']
        commit = task['base_commit']
        need(ready[ordinal]['base_commit'] == commit and
             git(cache, 'cat-file', '-e', (commit + '^{commit}').encode()).returncode == 0,
             'cache-binding:' + str(ordinal))
        tree = git(cache, 'ls-tree', '-r', '-z', '--name-only', commit.encode())
        need(tree.returncode == 0, 'tree:' + str(ordinal))
        tracked = {part.decode('utf-8', 'surrogateescape')
                   for part in tree.stdout.split(b'\0') if part}
        gold = set(loader.get(task['instance_id']).files())
        need(bool(gold), 'empty-gold:' + str(ordinal))
        counts = Counter()
        for path in gold:
            if path not in tracked:
                counts['untracked'] += 1
                continue
            blob = git(cache, 'show', (commit + ':' + path).encode('utf-8', 'surrogateescape'))
            need(blob.returncode == 0, 'blob:' + str(ordinal))
            if len(blob.stdout) > 1024 * 1024:
                counts['over_1mib'] += 1
            elif b'\0' in blob.stdout[:8192]:
                counts['binary_first_8192'] += 1
            else:
                counts['text_prebudget_admissible'] += 1
        totals.update(counts)
        rows.append({'ordinal': ordinal, 'repo': task['repo'], 'source': task['source'],
                     'native_gold_files': len(gold),
                     'text_prebudget_admissible': counts['text_prebudget_admissible'],
                     'not_prebudget_admissible': len(gold)-counts['text_prebudget_admissible']})
    payload = {'schema_version': 'are.g02-r6-native-eligibility/v1',
               'posture': 'evaluator-only-aggregate-bits-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA,
               'source_index_preflight_sha256': INDEX_PREFLIGHT_SHA,
               'parquet_sha256': PARQUET_SHA, 'index_source_sha256': INDEX_SHA,
               'script_sha256': sha(__file__), 'task_count': len(rows),
               'category_totals': dict(sorted(totals.items())), 'rows': rows,
               'index_budget_note': 'Pre-budget 1 MiB and first-8192-byte binary rules only; 64 MiB ordered aggregate budget not evaluated.',
               'fixed-candidate-rule': 'No task replacement or policy tuning based on these opened evaluator labels; if ineligible, abandon or separately relabel the cohort.',
               'claim_ceiling': 'Native-gold presence and pre-budget source admissibility only; no model, score or superiority.',
               'open_questions': ['Does the 64 MiB index admit the reference files under this fixed candidate?',
                                  'Will the full matched campaign clear quality and cost intervals?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'tasks': len(rows), 'totals': payload['category_totals'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
