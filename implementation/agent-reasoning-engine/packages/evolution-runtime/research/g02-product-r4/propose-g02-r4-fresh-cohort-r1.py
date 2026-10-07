#!/usr/bin/env python3
"""Source-only 24-task G02 r4 candidate after cross-branch exposure exclusion."""

import hashlib
import importlib.util
import json
import subprocess
from collections import Counter
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE_MODULE = BASE / 'g02-r4-cohort-code-r1/audit-cross-branch-supply-r1.py'
OUTPUT = BASE / 'g02-r4-fresh-cohort-candidate-r1/CANDIDATE.json'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_MODULE_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
SEED = b'are-g02-r4-fresh-four-repository-cohort-r1\0'
REPOSITORIES = (
    ('ansible/ansible', 'ans', 'ansible', 9,
     '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929'),
    ('internetarchive/openlibrary', 'open', 'openlibrary', 6,
     '/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926'),
    ('qutebrowser/qutebrowser', 'qut', 'qutebrowser', 6,
     '/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926'),
    ('future-architect/vuls', 'vuls', 'vuls', 3,
     '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929'),
)
SMOKE_EXCLUSIONS = (
    'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5',
    'SWE-Bench-Pro__go__maintenance__bugfix__720b4d92',
)
FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
          'base_commit', 'problem_statement', 'source')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-r4-fresh-cohort-candidate-r1.{reason}')


def module():
    need(sha(EXPOSURE_MODULE) == EXPOSURE_MODULE_SHA, 'exposure-module-drift')
    spec = importlib.util.spec_from_file_location('g02_cross_branch_exposure', EXPOSURE_MODULE)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def rank(row):
    return (hashlib.sha256(SEED + row['instance_id'].encode()).hexdigest(),
            row['instance_id'])


def current_exposure(source):
    """Bind non-task diagnostics but exclude every task-bearing manifest."""
    g01_paths, g02_paths = source.manifest_paths(BASE, RUNS)
    ids = {'g01': set(), 'g02': set()}
    files = []
    ignored = []
    for branch, paths in (('g01', g01_paths), ('g02', g02_paths)):
        for path in paths:
            binding = {'branch': branch, 'path': str(path), 'sha256': source.digest(path)}
            if branch == 'g01' and path.name == 'CONFIG.json':
                data = json.loads(path.read_text())
                need(isinstance(data, dict), f'invalid-config:{path}')
                if 'tasks' not in data:
                    ignored.append({**binding, 'reason': 'diagnostic-config-without-tasks'})
                    continue
            found = source.ids_from_manifest(path, branch)
            ids[branch].update(found)
            files.append({**binding, 'id_count': len(found)})
    union = ids['g01'] | ids['g02']
    digest = hashlib.sha256(('\n'.join(sorted(union)) + '\n').encode()).hexdigest()
    return {'union': union, 'files': files, 'ignored_files': ignored,
            'union_digest': digest}


def main():
    need(not OUTPUT.exists() and sha(PARQUET) == PARQUET_SHA, 'output-or-parquet-drift')
    seen = current_exposure(module())
    excluded = seen['union'] | set(SMOKE_EXCLUSIONS)
    rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    need(len(rows) == len({row['instance_id'] for row in rows}), 'duplicate-source-id')
    buckets = {}
    supply = {}
    for repo, abbreviation, cache, requested, cache_base in REPOSITORIES:
        eligible = sorted((row for row in rows if row['repo'] == repo and
                           row['source'] == 'Pro' and row['instance_id'] not in excluded and
                           all(isinstance(row[field], str) and row[field] for field in FIELDS) and
                           len(row['base_commit']) == 40), key=rank)
        need(len(eligible) >= requested, f'insufficient-supply:{repo}')
        supply[repo] = len(eligible)
        buckets[repo] = [(row, abbreviation, cache, cache_base) for row in eligible[:requested]]
    selected = []
    for index in range(max(item[3] for item in REPOSITORIES)):
        for repo, _, _, _, _ in REPOSITORIES:
            if index < len(buckets[repo]):
                selected.append(buckets[repo][index])
    need(len(selected) == 24 and
         len({row['instance_id'] for row, _, _, _ in selected}) == 24,
         'selected-denominator')
    tasks = []
    for row, abbreviation, cache, cache_base in selected:
        commit = row['base_commit']
        cache_dir = Path(cache_base) / 'cache' / cache
        available = subprocess.run(['git', '-C', str(cache_dir), 'cat-file', '-e',
                                    commit + '^{commit}'], capture_output=True).returncode == 0
        tasks.append({'instance_id': row['instance_id'], 'repo': row['repo'],
                      'repo_url': row['repo_url'], 'language': row['language'],
                      'base_commit': commit, 'source': row['source'],
                      'problem_statement_sha256': hashlib.sha256(row['problem_statement'].encode()).hexdigest(),
                      'suffix': f"pr4-{abbreviation}-{row['instance_id'][-8:]}",
                      'cache_name': cache, 'cache_base': cache_base,
                      'commit_available_now': available})
    need(len({row['suffix'] for row in tasks}) == 24, 'suffix-collision')
    payload = {'schema_version': 'are.g02-r4-fresh-cohort-candidate/v1',
               'status': 'source-only-candidate-not-frozen',
               'source_parquet_sha256': PARQUET_SHA,
               'source_only_fields': list(FIELDS),
               'exposure_module_sha256': EXPOSURE_MODULE_SHA,
               'exposure_file_bindings': seen['files'],
               'exposure_set_sha256': seen['union_digest'],
               'ignored_non_task_config_bindings': seen['ignored_files'],
               'smoke_test_exclusions': list(SMOKE_EXCLUSIONS),
               'selection': {'seed_hex': SEED.hex(),
                             'method': 'SHA-256(seed + instance_id) ascending per repository; fixed 9/6/6/3 quotas; round-robin order',
                             'repository_targets': {row[0]: row[3] for row in REPOSITORIES},
                             'eligible_supply_after_exclusions': supply,
                             'gold_or_score_used': False},
               'ordered_tasks': tasks,
               'language_counts': dict(Counter(row['language'] for row in tasks)),
               'claim_ceiling': 'Changed-population source-only candidate; no freeze, provider calls, native scores, or superiority claim.',
               'open_questions': ['Can all 24 exact commits be hydrated without old evidence removal?',
                                  'Can the versioned adapter and tmpfs/WSl archive path pass a no-model pair rehearsal?',
                                  'Will the fixed r2-trained selection mechanism beat matched DSH on this changed population?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'tasks': len(tasks), 'supply': supply,
                      'commits_available_now': sum(row['commit_available_now'] for row in tasks),
                      'languages': payload['language_counts']}))


if __name__ == '__main__':
    main()
