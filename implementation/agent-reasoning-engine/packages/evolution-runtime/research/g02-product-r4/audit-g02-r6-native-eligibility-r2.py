#!/usr/bin/env python3
"""Complete evaluator-only eligibility census after r6 ordinal 4 had empty gold."""

import hashlib
import importlib.util
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r6-mixed-source-candidate-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
PREFLIGHT = ROOT / 'SOURCE-INDEX-PREFLIGHT-R2.json'
OUTPUT = ROOT / 'NATIVE-ELIGIBILITY-R2.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
CACHE = Path('/tmp/are-g02-r6-mixed-source-caches-r1/cache')
R1 = BASE / 'g02-r4-cohort-code-r1/audit-g02-r6-native-eligibility-r1.py'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
PREFLIGHT_SHA = 'a14e2e67774b72153192bda6196137321c2092aaa6b90a74edf0c2cc0b8a286d'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r6-native-eligibility-r2.' + reason)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(PREFLIGHT) == PREFLIGHT_SHA and sha(PARQUET) == PARQUET_SHA and
         R1.is_file(), 'input-or-output-drift')
    spec = importlib.util.spec_from_file_location('g02_eligibility_r1', R1)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(PARQUET))
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    ready = {}
    for name in ('TASK-CACHE-HYDRATION-R2.json', 'PRO-TASK-CACHE-HYDRATION-R2.json'):
        for row in json.loads((ROOT / name).read_text())['results']:
            ready[row['ordinal']] = row
    need(len(tasks) == len(ready) == 24, 'denominator')
    rows = []
    totals = Counter()
    by_source = defaultdict(Counter)
    for task in tasks:
        ordinal = task['ordinal']
        cache = CACHE / ready[ordinal]['cache_leaf']
        commit = task['base_commit']
        need(ready[ordinal]['base_commit'] == commit and
             module.git(cache, 'cat-file', '-e', (commit + '^{commit}').encode()).returncode == 0,
             'cache-binding:' + str(ordinal))
        tree = module.git(cache, 'ls-tree', '-r', '-z', '--name-only', commit.encode())
        need(tree.returncode == 0, 'tree:' + str(ordinal))
        tracked = {part.decode('utf-8', 'surrogateescape')
                   for part in tree.stdout.split(b'\0') if part}
        gold = set(loader.get(task['instance_id']).files())
        counts = Counter()
        if not gold:
            counts['empty_gold_tasks'] = 1
        for path in gold:
            if path not in tracked:
                counts['untracked'] += 1
                continue
            blob = module.git(cache, 'show', (commit + ':' + path).encode('utf-8', 'surrogateescape'))
            need(blob.returncode == 0, 'blob:' + str(ordinal))
            if len(blob.stdout) > 1024 * 1024:
                counts['over_1mib'] += 1
            elif b'\0' in blob.stdout[:8192]:
                counts['binary_first_8192'] += 1
            else:
                counts['text_prebudget_admissible'] += 1
        totals.update(counts)
        by_source[task['source']].update(counts)
        rows.append({'ordinal': ordinal, 'repo': task['repo'], 'source': task['source'],
                     'native_gold_files': len(gold),
                     'text_prebudget_admissible': counts['text_prebudget_admissible'],
                     'not_prebudget_admissible': len(gold)-counts['text_prebudget_admissible']})
    payload = {'schema_version': 'are.g02-r6-native-eligibility/v2',
               'posture': 'evaluator-only-aggregate-bits-no-gold-path-export',
               'candidate_sha256': CANDIDATE_SHA,
               'source_index_preflight_sha256': PREFLIGHT_SHA,
               'parquet_sha256': PARQUET_SHA, 'failed_r1_script_sha256': sha(R1),
               'script_sha256': sha(__file__), 'task_count': len(rows),
               'category_totals': dict(sorted(totals.items())),
               'source_totals': {key: dict(sorted(value.items()))
                                 for key, value in sorted(by_source.items())},
               'rows': rows,
               'disposition': 'Candidate cannot freeze for a 24/24 native File-/Span-F1 claim if any task has empty native gold.',
               'fixed-candidate-rule': 'No task replacement or policy tuning based on these labels; all 24 IDs are evaluator-exposed after this census.',
               'claim_ceiling': 'Eligibility census only; no model, score, matched pair or superiority.',
               'open_questions': ['Which untouched population has enough natively eligible tasks?',
                                  'Can it be source-only selected and checked without altering policy?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'tasks': len(rows), 'totals': payload['category_totals'],
                      'source_totals': payload['source_totals'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
