#!/usr/bin/env python3
"""Source-only successor: 23 unattempted r4 tasks plus one ranked Ansible task."""

import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
R4 = BASE / 'g02-product-replication-r4/DEFINITION.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE_MODULE = BASE / 'g02-r4-cohort-code-r1/audit-cross-branch-supply-r1.py'
OUTPUT = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
R4_SHA = '0ee5e493a701e5514a33258cb7db0933e821d567875709a4e23ae7f87fb55199'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
SEED = b'are-g02-r4-fresh-four-repository-cohort-r1\0'
SMOKE_EXCLUSIONS = {'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5',
                    'SWE-Bench-Pro__go__maintenance__bugfix__720b4d92'}
ANSIBLE_CACHE = Path('/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929/cache/ansible')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-cohort.{reason}')


def git(*args):
    return subprocess.run(['git', '-C', str(ANSIBLE_CACHE), *args],
                          capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and sha(R4) == R4_SHA and sha(PARQUET) == PARQUET_SHA
         and sha(EXPOSURE_MODULE) == EXPOSURE_SHA, 'pinned-source-drift')
    r4 = json.loads(R4.read_text())
    need(r4['status'] == 'frozen-before-model-dispatch' and
         len(r4['ordered_pairs']) == 24 and
         r4['ordered_pairs'][0]['instance_id'].endswith('58ff6ae6'), 'r4-shape')
    spec = importlib.util.spec_from_file_location('g02_exposure', EXPOSURE_MODULE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    prior = set()
    bindings = []
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            digest = exposure.digest(path)
            if branch == 'g01' and path.name == 'CONFIG.json':
                config = json.loads(path.read_text())
                if 'tasks' not in config:
                    continue
            ids = exposure.ids_from_manifest(path, branch)
            prior.update(ids)
            bindings.append({'branch': branch, 'path': str(path),
                             'sha256': digest, 'id_count': len(ids)})
    old_ids = {pair['instance_id'] for pair in r4['ordered_pairs']}
    need(len(old_ids) == 24, 'old-duplicate')
    rows = pq.read_table(PARQUET, columns=['instance_id', 'repo', 'repo_url',
                                           'language', 'base_commit', 'source']).to_pylist()
    eligible = sorted((row for row in rows if row['repo'] == 'ansible/ansible'
                       and row['source'] == 'Pro' and row['instance_id'] not in
                       (prior | old_ids | SMOKE_EXCLUSIONS)
                       and all(isinstance(row[key], str) and row[key]
                               for key in ('instance_id', 'repo_url', 'language', 'base_commit'))
                       and len(row['base_commit']) == 40),
                      key=lambda row: (hashlib.sha256(SEED + row['instance_id'].encode()).hexdigest(),
                                       row['instance_id']))
    need(bool(eligible), 'replacement-supply')
    row = eligible[0]
    commit = row['base_commit']
    ref = 'refs/heads/are-g02-r5-' + commit
    need(git('cat-file', '-e', commit + '^{commit}').returncode == 0 and
         git('rev-parse', '--verify', ref).stdout.strip() == commit and
         git('remote', 'get-url', 'origin').stdout.strip() == row['repo_url'],
         'replacement-source-binding')
    replacement = {'ordinal': 1, 'instance_id': row['instance_id'],
                   'repo': row['repo'], 'language': row['language'],
                   'base_commit': commit,
                   'suffix': 'pr5-ans-' + row['instance_id'][-8:],
                   'root': '/tmp/are-g02-r4-runs/g02-cross-layer-pr5-ans-' + row['instance_id'][-8:],
                   'cache_name': 'ansible',
                   'cache_base': str(ANSIBLE_CACHE.parent.parent)}
    pairs = [replacement]
    for old in r4['ordered_pairs'][1:]:
        current = dict(old)
        current['ordinal'] = len(pairs) + 1
        current['suffix'] = old['suffix'].replace('pr4-', 'pr5-', 1)
        current['root'] = old['root'].replace('pr4-', 'pr5-', 1)
        pairs.append(current)
    need(len(pairs) == 24 and len({p['instance_id'] for p in pairs}) == 24 and
         len({p['root'] for p in pairs}) == 24 and
         all(not Path(p['root']).exists() for p in pairs), 'successor-shape')
    payload = {'schema_version': 'are.g02-r5-source-only-cohort-candidate/v1',
               'status': 'source-only-candidate-not-frozen',
               'r4_definition_sha256': R4_SHA, 'source_parquet_sha256': PARQUET_SHA,
               'exposure_module_sha256': EXPOSURE_SHA,
               'exposure_file_bindings': bindings,
               'exposure_set_sha256': hashlib.sha256(
                   ('\n'.join(sorted(prior)) + '\n').encode()).hexdigest(),
               'selection': {'method': 'retain r4 ordinals 2-24; replace exposed ordinal 1 '
                            'with first SHA-256(seed + ID)-ranked eligible Ansible Pro task',
                            'seed_hex': SEED.hex(), 'gold_or_score_used': False},
               'ordered_pairs': pairs,
               'claim_ceiling': 'No-model, source-only candidate; not a frozen campaign or superiority result.',
               'open_questions': ['Does evaluator-only native eligibility hold for all 24?',
                                  'Can a separately frozen 16K-output DSH comparator settle all pairs?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'pairs': len(pairs),
                      'replacement': row['instance_id'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
