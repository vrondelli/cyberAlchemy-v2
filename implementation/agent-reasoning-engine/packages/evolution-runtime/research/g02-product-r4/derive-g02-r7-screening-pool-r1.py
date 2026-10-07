#!/usr/bin/env python3
"""Source-only r7 pool, sealed before native-nonempty eligibility screening."""

import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g02-r4-cohort-code-r1/audit-cross-branch-supply-r1.py'
R4 = BASE / 'g02-product-replication-r4/DEFINITION.json'
R5 = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
R6 = BASE / 'g02-r6-mixed-source-candidate-r1/CANDIDATE.json'
R6_ELIGIBILITY = BASE / 'g02-r6-mixed-source-candidate-r1/NATIVE-ELIGIBILITY-R2.json'
OUTPUT = BASE / 'g02-r7-screening-pool-r1/POOL.json'
EXPECTED = {
    str(PARQUET): '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    str(EXPOSURE): 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    str(R4): '0ee5e493a701e5514a33258cb7db0933e821d567875709a4e23ae7f87fb55199',
    str(R5): 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0',
    str(R6): '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3',
    str(R6_ELIGIBILITY): 'b8680ee8e1b4d5f6cdb9c1b17aff797c01565db57ad73245ba4ebc570c0cc0ea',
}
STRATA = (
    ('Pro', 'ansible/ansible'),
    ('Verified', 'django/django'),
    ('Verified', 'astropy/astropy'),
    ('Multi', 'sveltejs/svelte'),
)
POOL_PER_STRATUM = 10
TARGET_PER_STRATUM = 6
SEED = b'are-g02-r7-native-nonempty-screen-pool-v1\0'
SMOKE = {'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5',
         'SWE-Bench-Pro__go__maintenance__bugfix__720b4d92'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-screening-pool.' + reason)


def main():
    need(not OUTPUT.exists() and all(sha(path) == digest
         for path, digest in EXPECTED.items()), 'input-or-output-drift')
    spec = importlib.util.spec_from_file_location('g02_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    seen = set(SMOKE)
    bindings = []
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            data = json.loads(path.read_text())
            if branch == 'g01' and path.name == 'CONFIG.json' and 'tasks' not in data:
                continue
            ids = exposure.ids_from_manifest(path, branch)
            seen.update(ids)
            bindings.append({'branch': branch, 'path': str(path),
                             'sha256': exposure.digest(path), 'id_count': len(ids)})
    r4 = {row['instance_id'] for row in json.loads(R4.read_text())['ordered_pairs']}
    r5 = {row['instance_id'] for row in json.loads(R5.read_text())['ordered_pairs']}
    r6 = {row['instance_id'] for row in json.loads(R6.read_text())['ordered_tasks']}
    need(len(r4) == len(r5) == len(r6) == 24 and len(r5-r4) == 1,
         'prior-lineage-shape')
    seen.update(r4 | r5 | r6)
    fields = ['instance_id', 'repo', 'repo_url', 'language', 'base_commit',
              'problem_statement', 'source']
    rows = pq.read_table(PARQUET, columns=fields).to_pylist()
    need(len(rows) == len({row['instance_id'] for row in rows}), 'duplicate-id')
    pools = []
    supply = {}
    for source, repo in STRATA:
        eligible = [row for row in rows if row['source'] == source and
                    row['repo'] == repo and row['instance_id'] not in seen and
                    all(isinstance(row[key], str) and row[key] for key in fields) and
                    len(row['base_commit']) == 40]
        eligible.sort(key=lambda row: (hashlib.sha256(
            SEED + source.encode() + b'\0' + repo.encode() + b'\0' +
            row['instance_id'].encode()).hexdigest(), row['instance_id']))
        supply[repo] = len(eligible)
        need(len(eligible) >= POOL_PER_STRATUM, 'insufficient-' + repo)
        pools.append(eligible[:POOL_PER_STRATUM])
    selected = []
    for rank in range(POOL_PER_STRATUM):
        for pool in pools:
            row = pool[rank]
            selected.append({key: row[key] for key in
                             ('instance_id', 'repo', 'repo_url', 'language',
                              'base_commit', 'source')})
    need(len(selected) == len({row['instance_id'] for row in selected}) == 40 and
         not any(row['instance_id'] in seen for row in selected), 'pool-shape')
    payload = {'schema_version': 'are.g02-r7-native-nonempty-screening-pool/v1',
               'status': 'source-only-screening-pool-frozen-before-evaluator-access',
               'objective': 'Select six natively scorable tasks per named repository for a new performance-unseen mixed ContextBench G02 cohort.',
               'selection': {'seed_hex': SEED.hex(),
                             'rank': 'SHA-256(seed, source, repo, instance_id)',
                             'strata': [{'source': s, 'repo': r,
                                         'pool_size': POOL_PER_STRATUM,
                                         'target_size': TARGET_PER_STRATUM}
                                        for s, r in STRATA],
                             'order': 'round-robin by rank across four strata',
                             'eligibility': 'independent evaluator exports only native-gold-nonempty bit for all 40 pool rows; choose first six true rows in each stratum, or fail the pool; no gold paths, scores, or task replacement afterward',
                             'gold_or_score_used_to_form_pool': False},
               'source_sha256': EXPECTED,
               'exposure_file_bindings': bindings,
               'exposure_id_set_sha256': hashlib.sha256(
                   ('\n'.join(sorted(seen)) + '\n').encode()).hexdigest(),
               'excluded_id_count': len(seen), 'eligible_source_supply': supply,
               'ordered_pool': [{'ordinal': i+1, **row}
                                for i, row in enumerate(selected)],
               'claim_ceiling': 'Source-only performance-unseen screening pool; not a campaign or superiority result.',
               'open_questions': ['Will each stratum have at least six native-gold-nonempty tasks?',
                                  'Can the selected exact commits and indexes be hydrated and qualified?',
                                  'Will a complete paired campaign pass both quality and cost gates?']}
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'pool_tasks': len(selected), 'supply': supply}, sort_keys=True))


if __name__ == '__main__':
    main()
