#!/usr/bin/env python3
"""Deterministic G01 r7 source-only candidate from evaluator eligibility bits."""

import hashlib
import importlib.util
import json
import os
from collections import Counter
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
SUPPLY = BASE / 'g01-cross-branch-supply-r3/SOURCE-SUPPLY-AUDIT.json'
FILE_PRESENCE = BASE / 'g01-cross-branch-gold-eligibility-r3/GOLD-ELIGIBILITY-AUDIT.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EVOLUTION_ROOT = BASE
RUNS_ROOT = Path('/opt/are-benchmark-runs')
PRIOR_SELECTOR = Path(__file__).with_name('propose-cross-branch-cohort-r1.py')
EXPECTED_PRIOR_SELECTOR_SHA = 'dbe2673c7f07fe83682f0003b1cda2165b0584c08f86a47156e4aaa3e696dbcc'
OUTPUT = Path('/opt/are-harness-benchmark/g01-r7-cohort-candidate-r1/COHORT-CANDIDATE.json')
SEED = 'are-g01-r7-positional-label-screened-24-20260929'
QUOTAS = {
    ('c', 'ponylang/ponyc'): 7,
    ('go', 'cli/cli'): 7,
    ('javascript', 'sveltejs/svelte'): 2,
    ('javascript', 'iamkun/dayjs'): 2,
    ('javascript', 'prettier/prettier'): 2,
    ('javascript', 'serverless/serverless'): 1,
    ('rust', 'nushell/nushell'): 2,
    ('rust', 'rayon-rs/rayon'): 1,
}
EXPECTED = {
    'supply': '57d26dc84226850d66eeb934ae2c347b038df946b0e9a86e1823ba1e9323a321',
    'file_presence': '386888a50e1010a87e5cd4b7c091f8072746e98292f62207690cb07a31779239',
    'rust': 'ade30d2cbbfa3244e2d46ffaec0f43413d187d20f5894f721c21d9551cdc3c7b',
    'ponylang/ponyc': 'c4b08f06634e1b3df4f8e7eb2be89ed5911dcaacef1fa6dfb215417954c74e56',
    'cli/cli': '46ed11a5ef78e6fa864e9bd34d9ee972e4473f9305d0c01651b47d43335c70ea',
    'future-architect/vuls': 'bd1029a7bebd5b0b20a010f85a8eff24751e4ec27c88bf8646db73c107930911',
    'sveltejs/svelte': 'efd767a6871b45c807a15ee1aab2baba77d2d2064d84429787ba673c53018854',
    'serverless/serverless': '8fb2d5fb1b935fae26bb8cf061781e14f38f03f815c23252aebd87c463bb3ae1',
    'iamkun/dayjs': 'fb496d3d455ea1218e4bbfadefaeef3171e8e25f6717f58843654da05daa0373',
    'prettier/prettier': '35c12edbe30fe51ccd1bd8ecb3d5c6288079c069f90173974cd3af9b87283b1a',
}
SOURCE_FIELDS = ['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def selection_key(identifier):
    return hashlib.sha256((SEED + '\0' + identifier).encode()).hexdigest(), identifier


def eligibility_path(repo):
    if repo == 'rust':
        return BASE / 'g01-r7-rust-gold-lineage-r3/GOLD-LINEAGE-ELIGIBILITY.json'
    return BASE / 'g01-r7-cgojs-gold-lineage-r1' / (repo.replace('/', '--') + '-GOLD-LINEAGE-ELIGIBILITY.json')


def main():
    if sha(SUPPLY) != EXPECTED['supply'] or sha(FILE_PRESENCE) != EXPECTED['file_presence']:
        raise ValueError('supply-or-presence-receipt-drift')
    supply = json.loads(SUPPLY.read_text())
    presence = json.loads(FILE_PRESENCE.read_text())
    if supply['source_parquet_sha256'] != sha(PARQUET) or presence['source_supply_sha256'] != EXPECTED['supply']:
        raise ValueError('parquet-or-presence-binding-drift')
    if sha(PRIOR_SELECTOR) != EXPECTED_PRIOR_SELECTOR_SHA:
        raise ValueError('prior-selector-drift')
    spec = importlib.util.spec_from_file_location('g01_prior_selector', PRIOR_SELECTOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    prior.verify_exposure_snapshot(supply, EVOLUTION_ROOT, RUNS_ROOT)
    present = {row['instance_id'] for row in presence['rows']
               if row['native_gold_files_present'] and row['loader_error'] is False}
    if len(present) != 881:
        raise ValueError('native-gold-file-presence-drift')
    screened = {}
    for repo in ('rust', 'ponylang/ponyc', 'cli/cli', 'future-architect/vuls',
                 'sveltejs/svelte', 'serverless/serverless', 'iamkun/dayjs', 'prettier/prettier'):
        path = eligibility_path(repo)
        if sha(path) != EXPECTED[repo]:
            raise ValueError(f'lineage-receipt-drift:{repo}')
        receipt = json.loads(path.read_text())
        if receipt['posture'] != 'evaluator-only-no-model-no-scores' or receipt['gold_paths_or_content_exported'] is not False:
            raise ValueError('lineage-receipt-shape')
        for row in receipt['tasks']:
            identifier = row['instance_id']
            if identifier in screened or identifier not in present:
                raise ValueError('duplicate-or-unavailable-id')
            screened[identifier] = {'repo': row['repo'], 'clean': row['gold_lineage_clean']}
    source_rows = pq.read_table(PARQUET, columns=SOURCE_FIELDS).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows):
        raise ValueError('duplicate-source-id')
    selected, available = [], {}
    for (language, repo), count in QUOTAS.items():
        candidates = [source[identifier] for identifier, state in screened.items()
                      if state['clean'] and state['repo'] == repo and source[identifier]['language'] == language]
        candidates.sort(key=lambda row: selection_key(row['instance_id']))
        if len(candidates) < count:
            raise ValueError(f'insufficient-screened-supply:{language}/{repo}')
        available[f'{language}/{repo}'] = len(candidates)
        selected.extend(candidates[:count])
    if (len(selected) != 24 or len({r['instance_id'] for r in selected}) != 24 or
            Counter(r['language'] for r in selected) != {'c': 7, 'go': 7, 'javascript': 7, 'rust': 3} or
            len({r['repo'] for r in selected}) != 8 or
            any(set(r) != set(SOURCE_FIELDS) for r in selected)):
        raise ValueError('cohort-shape')
    result = {'schema_version': 'are.g01-r7-source-only-cohort-candidate/v1',
              'status': 'preflight-only-not-frozen', 'seed': SEED,
              'source_supply_sha256': EXPECTED['supply'], 'file_presence_sha256': EXPECTED['file_presence'],
              'source_parquet_sha256': sha(PARQUET), 'lineage_receipt_sha256': {k: EXPECTED[k] for k in EXPECTED if k not in {'supply', 'file_presence'}},
              'quota_by_language_repo': {f'{language}/{repo}': count for (language, repo), count in QUOTAS.items()},
              'available_by_quota': available, 'ordered_tasks': selected,
              'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(r['instance_id'] for r in selected)) + '\n').encode()).hexdigest(),
              'source_commit_join_verified': True, 'gold_values_or_paths_used': False,
              'model_calls': 0, 'selector_sha256': sha(Path(__file__)),
              'prior_selector_sha256': EXPECTED_PRIOR_SELECTOR_SHA,
              'claim_ceiling': 'Source-only deterministic candidate; not runner/index proof, cohort freeze, score, or superiority.'}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('output-root-not-ready-or-candidate-exists')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256'],
                      'tasks': len(selected), 'repositories': len({r['repo'] for r in selected}),
                      'available_by_quota': available}, sort_keys=True))


if __name__ == '__main__':
    main()
