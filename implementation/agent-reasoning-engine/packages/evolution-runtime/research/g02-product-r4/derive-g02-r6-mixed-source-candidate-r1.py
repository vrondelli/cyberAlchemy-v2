#!/usr/bin/env python3
"""Draw a mixed-source G02 candidate without reading gold, scores, or model output."""

import hashlib
import importlib.util
import json
from collections import Counter
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g02-r4-cohort-code-r1/audit-cross-branch-supply-r1.py'
R4 = BASE / 'g02-product-replication-r4/DEFINITION.json'
R5 = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
SUPPLY = BASE / 'g02-r6-source-supply-r1/AUDIT.json'
OUTPUT = BASE / 'g02-r6-mixed-source-candidate-r1/CANDIDATE.json'
EXPECTED = {
    str(PARQUET): '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    str(EXPOSURE): 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    str(R4): '0ee5e493a701e5514a33258cb7db0933e821d567875709a4e23ae7f87fb55199',
    str(R5): 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0',
    str(SUPPLY): '26851947a40bf4d218dc1ad1e6e52b294ccf8619dd139b5e58086439d49ca947',
}
QUOTAS = (
    ('Pro', 'ansible/ansible', 6),
    ('Pro', 'internetarchive/openlibrary', 6),
    ('Verified', 'django/django', 6),
    ('Multi', 'sveltejs/svelte', 6),
)
SEED = b'are-g02-r6-mixed-contextbench-source-only-v1\0'
SMOKE = {'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5',
         'SWE-Bench-Pro__go__maintenance__bugfix__720b4d92'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r6-mixed-source.' + reason)


def main():
    need(not OUTPUT.exists(), 'output-exists')
    need(all(sha(path) == digest for path, digest in EXPECTED.items()), 'input-drift')
    spec = importlib.util.spec_from_file_location('g02_exposure', EXPOSURE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    seen = set(SMOKE)
    bindings = []
    g01, g02 = module.manifest_paths(BASE, RUNS)
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            data = json.loads(path.read_text())
            if branch == 'g01' and path.name == 'CONFIG.json' and 'tasks' not in data:
                continue
            ids = module.ids_from_manifest(path, branch)
            seen.update(ids)
            bindings.append({'branch': branch, 'path': str(path),
                             'sha256': module.digest(path), 'id_count': len(ids)})
    r4_ids = {row['instance_id'] for row in json.loads(R4.read_text())['ordered_pairs']}
    r5_ids = {row['instance_id'] for row in json.loads(R5.read_text())['ordered_pairs']}
    need(len(r4_ids) == len(r5_ids) == 24 and len(r5_ids - r4_ids) == 1,
         'r4-r5-lineage')
    seen.update(r4_ids | r5_ids)
    supply = json.loads(SUPPLY.read_text())
    exposure_digest = hashlib.sha256(('\n'.join(sorted(seen)) + '\n').encode()).hexdigest()
    need(supply['exposure_id_set_sha256'] == exposure_digest and
         supply['excluded_id_count'] == len(seen), 'exposure-census-drift')
    fields = ['instance_id', 'repo', 'repo_url', 'language', 'base_commit',
              'problem_statement', 'source']
    rows = pq.read_table(PARQUET, columns=fields).to_pylist()
    need(len(rows) == len({row['instance_id'] for row in rows}), 'duplicate-id')
    selected_by_repo = []
    available = {}
    for source, repo, quota in QUOTAS:
        eligible = [row for row in rows if row['source'] == source and
                    row['repo'] == repo and row['instance_id'] not in seen and
                    all(isinstance(row[key], str) and row[key]
                        for key in fields) and len(row['base_commit']) == 40]
        eligible.sort(key=lambda row: (hashlib.sha256(
            SEED + source.encode() + b'\0' + repo.encode() + b'\0' +
            row['instance_id'].encode()).hexdigest(), row['instance_id']))
        available[repo] = len(eligible)
        need(len(eligible) >= quota, 'insufficient-' + repo)
        selected_by_repo.append(eligible[:quota])
    ordered = []
    for rank in range(6):
        for bucket in selected_by_repo:
            row = bucket[rank]
            ordered.append({key: row[key] for key in
                            ('instance_id', 'repo', 'repo_url', 'language',
                             'base_commit', 'source')})
    need(len(ordered) == len({row['instance_id'] for row in ordered}) == 24 and
         not any(row['instance_id'] in seen for row in ordered), 'selection-shape')
    payload = {
        'schema_version': 'are.g02-r6-mixed-source-candidate/v1',
        'status': 'source-only-candidate-not-frozen-or-hydrated',
        'objective': 'Evaluate fixed ARE 64 MiB index and deletion-only policy against matched DSH on a new mixed ContextBench source population.',
        'selection': {'seed_hex': SEED.hex(), 'rank': 'SHA-256(seed, source, repo, instance_id)',
                      'quotas': [{'source': s, 'repo': r, 'tasks': n} for s, r, n in QUOTAS],
                      'order': 'round-robin by rank across the four listed strata',
                      'gold_or_score_used': False},
        'source_sha256': EXPECTED, 'exposure_file_bindings': bindings,
        'exposure_id_set_sha256': exposure_digest,
        'excluded_id_count': len(seen), 'eligible_supply_by_repo': available,
        'selected_source_counts': dict(Counter(row['source'] for row in ordered)),
        'ordered_tasks': [{'ordinal': i + 1, **row} for i, row in enumerate(ordered)],
        'claim_ceiling': 'Source-only mixed-population candidate; not frozen, hydrated, eligible, dispatched, scored, or a superiority result.',
        'open_questions': ['Are all exact commits and repository origins available in verified caches?',
                           'Can the source-only G02 adapter support Verified and Multi without score leakage?',
                           'Does native evaluator-only eligibility and whole-container resource preflight pass?',
                           'Will a complete matched campaign pass quality and all-in cost intervals?'],
    }
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'tasks': len(ordered), 'available': available,
                      'source_counts': payload['selected_source_counts']}, sort_keys=True))


if __name__ == '__main__':
    main()
