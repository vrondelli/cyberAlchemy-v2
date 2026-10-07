#!/usr/bin/env python3
"""Score-blind successor excluding one previously proven index-ineligible task."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-post-r8-clean-cohort-candidate-r2/propose-post-r8-clean-cohort-r2.py'
PRIOR = BASE / 'g01-post-r8-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
FAILED_PREFLIGHT = BASE / 'g01-post-r7-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json'
OUTPUT = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
PRIOR_SHA = 'cbdda078b1ec68e599167872a30c9f5fddf72a64449666b7eb043074b961fbbe'
FAILED_PREFLIGHT_SHA = 'cba86a63c70267f92885d2c0f695cbd3d1b383271bea9f39e4b11b07d5928c35'
BAD_ID = 'Multi-SWE-Bench__typescript__maintenance__bugfix__7958c8a7'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if sha(PRIOR) != PRIOR_SHA or sha(FAILED_PREFLIGHT) != FAILED_PREFLIGHT_SHA:
        raise ValueError('input-receipt-drift')
    spec = importlib.util.spec_from_file_location('post_r8_prior', PRIOR_SCRIPT)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    old = json.loads(PRIOR.read_text())
    preflight = json.loads(FAILED_PREFLIGHT.read_text())
    failures = [row for row in preflight['source_index']['results'] if row['status'] != 'passed']
    if (old['schema_version'] != 'are.g01-post-r8-clean-source-only-candidate/v1' or
            old['status'] != 'preflight-only-not-frozen' or old['model_calls'] != 0 or
            old['gold_values_or_paths_used'] is not False or
            old['seed'] != prior.SEED or old['language_quota'] != prior.QUOTAS or
            len(failures) != 1 or failures[0]['instance_id'] != BAD_ID or
            failures[0]['error'] != 'source-index.failed' or
            BAD_ID not in {row['instance_id'] for row in old['ordered_tasks']}):
        raise ValueError('failed-index-binding')
    if (sha(prior.PARQUET) != prior.PARQUET_SHA or
            sha(prior.EXPOSURE_SCRIPT) != prior.EXPOSURE_SCRIPT_SHA or
            sha(prior.R8_FREEZE) != prior.R8_FREEZE_SHA):
        raise ValueError('pinned-source-drift')
    exposure_spec = importlib.util.spec_from_file_location('g01_exposure', prior.EXPOSURE_SCRIPT)
    exposure_module = importlib.util.module_from_spec(exposure_spec)
    exposure_spec.loader.exec_module(exposure_module)
    exposure = exposure_module.exposure(BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != prior.CURRENT_EXPOSURE_SET_SHA:
        raise ValueError('current-exposure-drift')
    clean = set()
    for name, (path, digest) in prior.RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError(f'eligibility-receipt-drift:{name}')
        receipt = json.loads(path.read_text())
        if receipt['gold_paths_or_content_exported'] is not False:
            raise ValueError('eligibility-shape')
        clean.update(row['instance_id'] for row in receipt['tasks']
                     if row['gold_lineage_clean'] and row['instance_id'] not in exposure['union'])
    if len(clean) != 77 or BAD_ID not in clean:
        raise ValueError('clean-supply-drift')
    source = {row['instance_id']: row for row in
              pq.read_table(prior.PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()}
    selected = []
    for language, quota in prior.QUOTAS.items():
        candidates = sorted((source[i] for i in clean if i != BAD_ID and source[i]['language'] == language),
                            key=lambda row: prior.key(row['instance_id']))
        by_repo, by_origin = Counter(), Counter()
        picked = 0
        for row in candidates:
            if (by_repo[row['repo']] >= prior.MAX_PER_REPOSITORY or
                    by_origin[row['repo_url']] >= prior.MAX_PER_REPOSITORY):
                continue
            selected.append(row)
            by_repo[row['repo']] += 1
            by_origin[row['repo_url']] += 1
            picked += 1
            if picked == quota:
                break
        if picked != quota:
            raise ValueError(f'insufficient-diverse-supply:{language}')
    ids = {row['instance_id'] for row in selected}
    old_ids = {row['instance_id'] for row in old['ordered_tasks']}
    if (len(ids) != 24 or ids & exposure['union'] or old_ids - ids != {BAD_ID} or
            len(ids - old_ids) != 1 or Counter(row['language'] for row in selected) != prior.QUOTAS):
        raise ValueError('successor-candidate-shape')
    result = {**old, 'schema_version': 'are.g01-post-r8-clean-source-only-candidate/v2',
              'ordered_tasks': selected,
              'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest(),
              'prior_candidate_sha256': PRIOR_SHA,
              'source_index_exclusion': {'instance_id': BAD_ID, 'prior_preflight_sha256': FAILED_PREFLIGHT_SHA,
                                         'reason': 'source-index.inventory-entry-limit'},
              'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Score-blind preflight-only successor after exact known index failure; not cache/index proof, freeze, score or superiority.'}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256'],
                      'replaced': BAD_ID, 'new_id': next(iter(ids - old_ids)),
                      'tasks': len(selected), 'repositories': len({row['repo_url'] for row in selected})}, sort_keys=True))


if __name__ == '__main__':
    main()
