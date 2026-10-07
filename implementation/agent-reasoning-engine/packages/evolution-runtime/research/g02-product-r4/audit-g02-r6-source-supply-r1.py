#!/usr/bin/env python3
"""Source-only remaining ContextBench supply after r4/r5 development exposure."""

import hashlib
import importlib.util
import json
from collections import Counter, defaultdict
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g02-r4-cohort-code-r1/audit-cross-branch-supply-r1.py'
R4 = BASE / 'g02-product-replication-r4/DEFINITION.json'
R5 = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
OUTPUT = BASE / 'g02-r6-source-supply-r1/AUDIT.json'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
R4_SHA = '0ee5e493a701e5514a33258cb7db0933e821d567875709a4e23ae7f87fb55199'
R5_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
SMOKE = {'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5',
         'SWE-Bench-Pro__go__maintenance__bugfix__720b4d92'}
OLD_G02_REPOS = {'ansible/ansible', 'internetarchive/openlibrary',
                 'qutebrowser/qutebrowser', 'future-architect/vuls'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r6-supply.{reason}')


def main():
    need(not OUTPUT.exists() and sha(PARQUET) == PARQUET_SHA and
         sha(EXPOSURE) == EXPOSURE_SHA and sha(R4) == R4_SHA and
         sha(R5) == R5_SHA, 'source-drift')
    spec = importlib.util.spec_from_file_location('g02_exposure', EXPOSURE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    seen = set()
    bindings = []
    g01, g02 = module.manifest_paths(BASE, RUNS)
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            digest = module.digest(path)
            if branch == 'g01' and path.name == 'CONFIG.json' and \
                    'tasks' not in json.loads(path.read_text()):
                continue
            ids = module.ids_from_manifest(path, branch)
            seen.update(ids)
            bindings.append({'branch': branch, 'path': str(path),
                             'sha256': digest, 'id_count': len(ids)})
    r4_ids = {p['instance_id'] for p in json.loads(R4.read_text())['ordered_pairs']}
    r5 = json.loads(R5.read_text())
    r5_ids = {p['instance_id'] for p in r5['ordered_pairs']}
    need(len(r4_ids) == 24 and len(r5_ids) == 24 and len(r5_ids - r4_ids) == 1,
         'r4-r5-lineage')
    excluded = seen | r4_ids | r5_ids | SMOKE
    columns = ['instance_id', 'repo', 'repo_url', 'language', 'base_commit',
               'problem_statement', 'source']
    rows = pq.read_table(PARQUET, columns=columns).to_pylist()
    need(len(rows) == len({row['instance_id'] for row in rows}), 'duplicate-id')
    supply = defaultdict(Counter)
    for row in rows:
        if row['instance_id'] in excluded or not all(
                isinstance(row[key], str) and row[key]
                for key in columns) or len(row['base_commit']) != 40:
            continue
        supply[row['source']][row['repo']] += 1
    summaries = {}
    for source, counts in sorted(supply.items()):
        summaries[source] = {'tasks': sum(counts.values()), 'repositories': len(counts),
                             'top_repositories': dict(counts.most_common(20))}
    pro = dict(sorted((repo, count) for repo, count in supply['Pro'].items()
                      if repo in OLD_G02_REPOS))
    payload = {'schema_version': 'are.g02-r6-source-supply-audit/v1',
               'posture': 'source-only-no-gold-no-model-no-task-identifiers-exported',
               'parquet_sha256': PARQUET_SHA, 'exposure_module_sha256': EXPOSURE_SHA,
               'r4_definition_sha256': R4_SHA, 'r5_candidate_sha256': R5_SHA,
               'exposure_file_bindings': bindings,
               'exposure_id_set_sha256': hashlib.sha256(
                   ('\n'.join(sorted(excluded)) + '\n').encode()).hexdigest(),
               'excluded_id_count': len(excluded), 'smoke_exclusion_count': len(SMOKE),
               'script_sha256': sha(__file__), 'remaining_supply': summaries,
               'original_four_repository_pro_supply': pro,
               'original_9_6_6_3_mix_available':
                   all(pro.get(repo, 0) >= count for repo, count in
                       (('ansible/ansible', 9), ('internetarchive/openlibrary', 6),
                        ('qutebrowser/qutebrowser', 6), ('future-architect/vuls', 3))),
               'claim_ceiling': 'Source-only supply census; not hydrated/eligible/frozen/scored and no superiority.',
               'open_questions': ['Which changed source/repository population can be hydrated and held untouched?',
                                  'Can a fresh paired campaign meet quality and all-in time gates?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'audited-source-only', 'sha256': sha(OUTPUT),
                      'supply': summaries, 'old_four_pro': pro,
                      'old_mix_available': payload['original_9_6_6_3_mix_available']},
                     sort_keys=True))


if __name__ == '__main__':
    main()
