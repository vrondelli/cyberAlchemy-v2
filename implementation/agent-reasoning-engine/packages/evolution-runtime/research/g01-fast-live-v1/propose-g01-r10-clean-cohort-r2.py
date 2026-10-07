#!/usr/bin/env python3
"""Deterministic G01 r10 successor after evaluator-only index admission failure."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE_HELPER = BASE / 'g01-r10-expansion-screen-r1/screen-g01-r10-new-origins-r1.py'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
EXPOSURE_HELPER_SHA = '09e400f8e67a2d2ef684bce4ceda67186a227d7b2289fa804e5c25d2db930046'
EXPOSURE_SHA = 'daf046ec707d74ef73bb04b50152f6777ef99c0c459ac22b94673a4be502a3f7'
SEED = 'are-g01-r10-five-language-index-admitted-24-r2-20260930'
QUOTAS = {'cpp': 5, 'java': 2, 'javascript': 4, 'typescript': 4, 'python': 9}
MAX_PER_REPO = 2
MAX_PER_ORIGIN = 2
KNOWN_INDEX_INELIGIBLE = 'Multi-SWE-Bench__typescript__maintenance__bugfix__7958c8a7'
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source')
RECEIPTS = {
    'cpp': (BASE / 'g01-cpp-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
            'a34f63dcc2244882285d922170da5b0e9deabd00e7a3d4dbba3fbd623ee8a780'),
    'java-python-typescript': (BASE / 'g01-multilang-gold-lineage-http-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                               '5800babd4ccb6757ca9f1128807d6990fbbc9eea46157d875a0477a8f5d1afdb'),
    'dayjs': (BASE / 'g01-r7-cgojs-gold-lineage-r1/iamkun--dayjs-GOLD-LINEAGE-ELIGIBILITY.json',
              'fb496d3d455ea1218e4bbfadefaeef3171e8e25f6717f58843654da05daa0373'),
    'prettier': (BASE / 'g01-r7-cgojs-gold-lineage-r1/prettier--prettier-GOLD-LINEAGE-ELIGIBILITY.json',
                 '35c12edbe30fe51ccd1bd8ecb3d5c6288079c069f90173974cd3af9b87283b1a'),
    'serverless': (BASE / 'g01-r7-cgojs-gold-lineage-r1/serverless--serverless-GOLD-LINEAGE-ELIGIBILITY.json',
                   '8fb2d5fb1b935fae26bb8cf061781e14f38f03f815c23252aebd87c463bb3ae1'),
    'svelte': (BASE / 'g01-r7-cgojs-gold-lineage-r1/sveltejs--svelte-GOLD-LINEAGE-ELIGIBILITY.json',
                'efd767a6871b45c807a15ee1aab2baba77d2d2064d84429787ba673c53018854'),
    'new-origin-tier1': (BASE / 'g01-r10-expansion-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
                         'ed765ba8269e7a48041d53c4303654de97a3adcaed0e8fbde6c0e62307d6da81'),
    'new-origin-tier2': (BASE / 'g01-r10-expansion-screen-r2/GOLD-LINEAGE-ELIGIBILITY.json',
                         '72ee840bf6871cdbe543cfa99be9cf00ef6991040deae83664f0072031ae12f8'),
}
INDEX_ADMISSION = BASE / 'g01-r10-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
INDEX_ADMISSION_SHA = 'b0752ad7d749d645f18c1fce9ac41222eedbf8faa8c194647cfb26134cda58f5'
OUTPUT = BASE / 'g01-r10-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def id_digest(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if sha(EXPOSURE_HELPER) != EXPOSURE_HELPER_SHA or sha(PARQUET) != PARQUET_SHA:
        raise ValueError('pinned-source-drift')
    spec = importlib.util.spec_from_file_location('g01_r10_exposure_helper', EXPOSURE_HELPER)
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    seen = helper.exposure()
    if id_digest(seen) != EXPOSURE_SHA or len(seen) != 324:
        raise ValueError('exposure-drift')
    clean = {}
    for name, (path, digest) in RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError('eligibility-receipt-drift:' + name)
        receipt = json.loads(path.read_text())
        if (receipt.get('gold_paths_or_content_exported') is not False or
                receipt.get('model_calls', 0) != 0 or
                receipt.get('posture', receipt.get('status')) not in
                ('evaluator-only-no-model-no-scores',)):
            raise ValueError('eligibility-receipt-invalid:' + name)
        for row in receipt['tasks']:
            identifier = row['instance_id']
            if identifier in clean:
                raise ValueError('duplicate-screened-id')
            if row['gold_lineage_clean'] and identifier not in seen:
                clean[identifier] = row['repo']
    clean.pop(KNOWN_INDEX_INELIGIBLE, None)
    if len(clean) != 62:
        raise ValueError('clean-supply-drift')
    if sha(INDEX_ADMISSION) != INDEX_ADMISSION_SHA:
        raise ValueError('index-admission-receipt-drift')
    admission = json.loads(INDEX_ADMISSION.read_text())
    if (admission.get('status') != 'failed' or
            admission.get('candidate_sha256') != '56dfbd8fa8b6e0c3cbc8acc3e5b4e871e11a996dd56f3f9cf68588e4bb531cf7' or
            admission.get('gold_paths_or_content_exported') is not False or
            admission.get('model_calls') != 0 or len(admission.get('rows', [])) != 24):
        raise ValueError('index-admission-shape')
    index_ineligible = {row['instance_id'] for row in admission['rows']
                        if row['excluded_gold_files'] or row['absent_gold_files']}
    if index_ineligible != {'Multi-SWE-Bench__cpp__maintenance__bugfix__e43d9aa5',
                            'SWE-Bench-Pro__python__maintenance__bugfix__6c2ff818'}:
        raise ValueError('index-ineligibility-drift')
    for identifier in index_ineligible:
        clean.pop(identifier)
    if len(clean) != 60:
        raise ValueError('post-admission-supply-drift')
    source_rows = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or any(source[i]['repo'] != repo for i, repo in clean.items()):
        raise ValueError('source-join-drift')
    selected = []
    by_repo, by_origin = Counter(), Counter()
    for language, quota in QUOTAS.items():
        candidates = sorted((source[i] for i in clean if source[i]['language'] == language),
                            key=lambda row: (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                             row['instance_id']))
        picked = 0
        for row in candidates:
            if by_repo[row['repo']] >= MAX_PER_REPO or by_origin[row['repo_url']] >= MAX_PER_ORIGIN:
                continue
            if any(not isinstance(row[field], str) or not row[field] for field in SOURCE_FIELDS):
                raise ValueError('selected-source-field-invalid')
            selected.append(row)
            by_repo[row['repo']] += 1
            by_origin[row['repo_url']] += 1
            picked += 1
            if picked == quota:
                break
        if picked != quota:
            raise ValueError(f'insufficient-diverse-supply:{language}:{picked}/{quota}')
    ids = {row['instance_id'] for row in selected}
    if (len(selected) != 24 or len(ids) != 24 or ids & seen or
            Counter(row['language'] for row in selected) != QUOTAS or
            len({row['repo_url'] for row in selected}) < 12):
        raise ValueError('candidate-shape')
    result = {'schema_version': 'are.g01-r10-clean-source-only-candidate/v1',
              'status': 'preflight-only-not-frozen', 'seed': SEED,
              'language_quota': QUOTAS, 'max_tasks_per_repository': MAX_PER_REPO,
              'max_tasks_per_git_origin': MAX_PER_ORIGIN,
              'source_parquet_sha256': PARQUET_SHA, 'exposure_set_sha256': EXPOSURE_SHA,
              'eligibility_receipt_sha256': {name: digest for name, (_, digest) in RECEIPTS.items()},
              'known_index_ineligible_id': KNOWN_INDEX_INELIGIBLE,
              'index_admission_receipt_sha256': INDEX_ADMISSION_SHA,
              'index_admission_excluded_ids': sorted(index_ineligible),
              'available_clean_by_language': dict(sorted(Counter(source[i]['language'] for i in clean).items())),
              'ordered_tasks': selected, 'task_id_set_sha256': id_digest(ids),
              'source_commit_join_verified': True, 'gold_values_or_paths_used': False,
              'model_calls': 0, 'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Score-blind successor after evaluator-only index eligibility; no new cache/index/gold-file proof, freeze, score or superiority.',
              'open_questions': ['Do all 24 exact commits and indexes pass source-only preflight?',
                                 'Does evaluator-only gold-file admission cover every selected reference file?',
                                 'Can a separately frozen strict 24/24 run meet quality, cost and integrity gates?']}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'by_language': dict(Counter(row['language'] for row in selected)),
                      'repositories': len({row['repo'] for row in selected}),
                      'git_origins': len({row['repo_url'] for row in selected}),
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
