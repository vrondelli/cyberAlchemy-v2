#!/usr/bin/env python3
"""Score-blind G01 post-r8 candidate from pinned eligibility bits, not labels."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE_SCRIPT = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R8_FREEZE = BASE / 'g01-product-replication-r8/CAMPAIGN-FREEZE.json'
OUTPUT = BASE / 'g01-post-r8-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_SCRIPT_SHA = 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a'
PRIOR_EXPOSURE_SET_SHA = '6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b'
CURRENT_EXPOSURE_SET_SHA = '9e77d358fc924541e8963528be6f4d7c8cc5f54af35176207faf3541035710cf'
R8_FREEZE_SHA = '2bbea55c5ad67535ad706ee85ddb741bf949322f5799d961cf0c9d88f60e6e60'
SEED = 'are-g01-post-r8-four-language-score-blind-24-20260930'
QUOTAS = {'cpp': 6, 'java': 6, 'javascript': 6, 'typescript': 6}
MAX_PER_REPOSITORY = 2
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source')
RECEIPTS = {
    'cpp': (BASE / 'g01-cpp-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
            'a34f63dcc2244882285d922170da5b0e9deabd00e7a3d4dbba3fbd623ee8a780'),
    'java-python-typescript': (BASE / 'g01-multilang-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                               '5800babd4ccb6757ca9f1128807d6990fbbc9eea46157d875a0477a8f5d1afdb'),
    'serverless/serverless': (BASE / 'g01-r7-cgojs-gold-lineage-r1/serverless--serverless-GOLD-LINEAGE-ELIGIBILITY.json',
                              '8fb2d5fb1b935fae26bb8cf061781e14f38f03f815c23252aebd87c463bb3ae1'),
    'sveltejs/svelte': (BASE / 'g01-r7-cgojs-gold-lineage-r1/sveltejs--svelte-GOLD-LINEAGE-ELIGIBILITY.json',
                        'efd767a6871b45c807a15ee1aab2baba77d2d2064d84429787ba673c53018854'),
    'iamkun/dayjs': (BASE / 'g01-r7-cgojs-gold-lineage-r1/iamkun--dayjs-GOLD-LINEAGE-ELIGIBILITY.json',
                     'fb496d3d455ea1218e4bbfadefaeef3171e8e25f6717f58843654da05daa0373'),
    'prettier/prettier': (BASE / 'g01-r7-cgojs-gold-lineage-r1/prettier--prettier-GOLD-LINEAGE-ELIGIBILITY.json',
                         '35c12edbe30fe51ccd1bd8ecb3d5c6288079c069f90173974cd3af9b87283b1a'),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def key(identifier):
    return hashlib.sha256((SEED + '\0' + identifier).encode()).hexdigest(), identifier


def main():
    if (sha(PARQUET) != PARQUET_SHA or sha(EXPOSURE_SCRIPT) != EXPOSURE_SCRIPT_SHA or
            sha(R8_FREEZE) != R8_FREEZE_SHA):
        raise ValueError('pinned-source-drift')
    spec = importlib.util.spec_from_file_location('g01_exposure', EXPOSURE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    exposure = module.exposure(BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != CURRENT_EXPOSURE_SET_SHA or exposure['counts']['union'] != 300:
        raise ValueError('current-exposure-drift')
    r8 = json.loads(R8_FREEZE.read_text())
    r8_ids = {task['instance_id'] for task in r8['ordered_tasks']}
    if (len(r8['ordered_tasks']) != 24 or len(r8_ids) != 24 or
            not r8_ids <= exposure['union'] or
            hashlib.sha256(('\n'.join(sorted(exposure['union'] - r8_ids)) + '\n').encode()).hexdigest()
            != PRIOR_EXPOSURE_SET_SHA):
        raise ValueError('r8-exposure-invalid')
    clean = {}
    for name, (path, digest) in RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError(f'eligibility-receipt-drift:{name}')
        receipt = json.loads(path.read_text())
        if (receipt['posture'] != 'evaluator-only-no-model-no-scores' or
                receipt['gold_paths_or_content_exported'] is not False):
            raise ValueError(f'eligibility-receipt-invalid:{name}')
        for row in receipt['tasks']:
            identifier = row['instance_id']
            if identifier in clean:
                raise ValueError('duplicate-screened-id')
            if row['gold_lineage_clean'] and identifier not in exposure['union']:
                clean[identifier] = row['repo']
    if len(clean) != 77:
        raise ValueError('clean-supply-drift')
    all_rows = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in all_rows}
    if len(source) != len(all_rows) or any(source[i]['repo'] != repo for i, repo in clean.items()):
        raise ValueError('source-join-drift')
    available = Counter(source[i]['language'] for i in clean)
    selected = []
    for language, quota in QUOTAS.items():
        candidates = sorted((source[i] for i in clean if source[i]['language'] == language),
                            key=lambda row: key(row['instance_id']))
        by_repo = Counter()
        by_origin = Counter()
        picked = 0
        for row in candidates:
            if by_repo[row['repo']] >= MAX_PER_REPOSITORY or by_origin[row['repo_url']] >= MAX_PER_REPOSITORY:
                continue
            selected.append(row)
            by_repo[row['repo']] += 1
            by_origin[row['repo_url']] += 1
            picked += 1
            if picked == quota:
                break
        if picked != quota:
            raise ValueError(f'insufficient-diverse-supply:{language}:{picked}/{quota}')
    ids = {row['instance_id'] for row in selected}
    if (len(ids) != 24 or ids & exposure['union'] or
            Counter(row['language'] for row in selected) != QUOTAS or
            any(set(row) != set(SOURCE_FIELDS) for row in selected)):
        raise ValueError('candidate-shape')
    result = {'schema_version': 'are.g01-post-r8-clean-source-only-candidate/v1',
              'status': 'preflight-only-not-frozen', 'seed': SEED, 'language_quota': QUOTAS,
              'max_tasks_per_repository_and_origin': MAX_PER_REPOSITORY,
              'available_clean_by_language': dict(sorted(available.items())),
              'source_parquet_sha256': PARQUET_SHA, 'prior_exposure_set_sha256': PRIOR_EXPOSURE_SET_SHA,
              'current_exposure_set_sha256': CURRENT_EXPOSURE_SET_SHA,
              'r8_freeze_sha256': R8_FREEZE_SHA,
              'eligibility_receipt_sha256': {name: digest for name, (_, digest) in RECEIPTS.items()},
              'ordered_tasks': selected,
              'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest(),
              'source_commit_join_verified': True, 'gold_values_or_paths_used': False,
              'model_calls': 0, 'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Score-blind four-language candidate only; not cache/index proof, frozen protocol, score or superiority.',
              'open_questions': ['Do all selected exact commits and bounded indexes pass fresh preflight?',
                                 'Are all selected native-gold files admitted by the generated indexes?',
                                 'Can storage and provider reliability support a complete paired run?']}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256'],
                      'tasks': len(selected), 'repositories': len({row['repo_url'] for row in selected}),
                      'by_language': dict(Counter(row['language'] for row in selected)),
                      'available_clean_by_language': result['available_clean_by_language']}, sort_keys=True))


if __name__ == '__main__':
    main()
