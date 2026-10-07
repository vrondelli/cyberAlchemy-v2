#!/usr/bin/env python3
"""Score-blind G01 candidate successor after one exact source-index failure."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-post-r7-multilang-cohort-candidate-r1/propose-post-r7-multilang-cohort-r1.py'
PRIOR_CANDIDATE = BASE / 'g01-post-r7-multilang-cohort-candidate-r1/COHORT-CANDIDATE.json'
PRIOR_PREFLIGHT = BASE / 'g01-post-r7-runner-index-preflight-r1/RUNNER-INDEX-PREFLIGHT.json'
CACHES = BASE / 'g01-post-r7-source-caches-r1/SOURCE-CACHES.json'
OUTPUT = BASE / 'g01-post-r7-multilang-cohort-candidate-r2/COHORT-CANDIDATE.json'
EXPECTED_PRIOR_SCRIPT_SHA = 'e9ab66adb21fe4e92adb3d2b1aab635bac2c568c93bb1545eaf249dfe3c52ed2'
EXPECTED_PRIOR_CANDIDATE_SHA = '1e43240ce5246d55e04b2eae117fa14ef40d04598f6da27c967af090f6d7cb39'
EXPECTED_PRIOR_PREFLIGHT_SHA = 'cba86a63c70267f92885d2c0f695cbd3d1b383271bea9f39e4b11b07d5928c35'
EXPECTED_CACHES_SHA = '998d53a850e7e38f858797847070b77094e4f2b569b20a87bfb7f4808d42b2e4'
EXCLUDED_ID = 'Multi-SWE-Bench__typescript__maintenance__bugfix__7958c8a7'
EXPECTED_TRACKED_ENTRIES = 40743
WORKER_ENTRY_LIMIT = 10000


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def load_prior():
    if sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT_SHA:
        raise ValueError('prior-selector-drift')
    spec = importlib.util.spec_from_file_location('g01_prior_selector', PRIOR_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify_single_failure(prior, candidate, preflight, caches):
    if (preflight['status'] != 'failed' or preflight['candidate_sha256'] != EXPECTED_PRIOR_CANDIDATE_SHA or
            preflight['caches_sha256'] != EXPECTED_CACHES_SHA or
            preflight['cache_check']['passed'] != 24 or
            sum(row['status'] == 'passed' for row in preflight['checkout_probes']) != 24):
        raise ValueError('prior-preflight-shape')
    rows = preflight['source_index']['results']
    failed = [row for row in rows if row['status'] != 'passed']
    if (len(rows) != 24 or len(failed) != 1 or failed[0]['instance_id'] != EXCLUDED_ID or
            failed[0]['error'] != 'source-index.failed' or
            failed[0]['detail'] != 'recovery-process.source-worker.index-failed'):
        raise ValueError('single-index-failure-drift')
    task = next(row for row in candidate['ordered_tasks'] if row['instance_id'] == EXCLUDED_ID)
    cache = next(row for row in caches['repositories'] if row['repo'] == task['repo'])
    if (cache['origin'] != task['repo_url'] or task['base_commit'] not in cache['commits'] or
            cache['repository_path'] != failed[0]['repository_path']):
        raise ValueError('failed-task-cache-binding')
    run = subprocess.run(['git', '-C', cache['repository_path'], 'ls-tree', '-rlz', task['base_commit']],
                         capture_output=True, timeout=30)
    if run.returncode or len(run.stdout) > 8 * 1024**2:
        raise ValueError('inventory-read-failed')
    entries = run.stdout.count(b'\0')
    if entries != EXPECTED_TRACKED_ENTRIES or entries <= WORKER_ENTRY_LIMIT:
        raise ValueError('inventory-entry-count-drift')
    return {'instance_id': EXCLUDED_ID, 'reason': 'source-index.inventory-entry-limit',
            'tracked_entries': entries, 'worker_entry_limit': WORKER_ENTRY_LIMIT,
            'prior_preflight_sha256': EXPECTED_PRIOR_PREFLIGHT_SHA}


def main():
    for path, expected in ((PRIOR_CANDIDATE, EXPECTED_PRIOR_CANDIDATE_SHA),
                           (PRIOR_PREFLIGHT, EXPECTED_PRIOR_PREFLIGHT_SHA),
                           (CACHES, EXPECTED_CACHES_SHA)):
        if sha(path) != expected:
            raise ValueError('input-receipt-drift')
    prior = load_prior()
    old = json.loads(PRIOR_CANDIDATE.read_text())
    preflight = json.loads(PRIOR_PREFLIGHT.read_text())
    caches = json.loads(CACHES.read_text())
    if (old['status'] != 'preflight-only-not-frozen' or old['seed'] != prior.SEED or
            old['language_quota'] != prior.QUOTAS or old['max_tasks_per_repo'] != prior.MAX_PER_REPO or
            old['gold_values_or_paths_used'] is not False or old['model_calls'] != 0):
        raise ValueError('prior-candidate-drift')
    exclusion = verify_single_failure(prior, old, preflight, caches)
    if sha(prior.SUPPLY) != prior.EXPECTED_SUPPLY_SHA or sha(prior.PARQUET) != prior.EXPECTED_PARQUET_SHA:
        raise ValueError('source-snapshot-drift')
    spec = importlib.util.spec_from_file_location('g01_supply', prior.EXPOSURE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    exposure = module.exposure(prior.BASE, Path('/opt/are-benchmark-runs'))
    if exposure['digests']['union'] != prior.EXPECTED_EXPOSURE_SET_SHA:
        raise ValueError('exposure-drift')
    clean = {}
    for name, (path, expected) in prior.RECEIPTS.items():
        if sha(path) != expected:
            raise ValueError(f'eligibility-receipt-drift:{name}')
        receipt = json.loads(path.read_text())
        if receipt['gold_paths_or_content_exported'] is not False:
            raise ValueError('eligibility-receipt-shape')
        for row in receipt['tasks']:
            identifier = row['instance_id']
            if row['gold_lineage_clean'] and identifier not in exposure['union']:
                if identifier in clean:
                    raise ValueError('duplicate-clean-id')
                clean[identifier] = row['repo']
    if len(clean) != 101 or EXCLUDED_ID not in clean:
        raise ValueError('clean-supply-drift')
    rows = pq.read_table(prior.PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in rows}
    if len(source) != len(rows) or any(identifier not in source for identifier in clean):
        raise ValueError('source-join-drift')
    selected = []
    for language, quota in prior.QUOTAS.items():
        candidates = sorted((source[identifier] for identifier in clean
                             if identifier != EXCLUDED_ID and source[identifier]['language'] == language),
                            key=lambda row: prior.selection_key(row['instance_id']))
        by_repo = Counter()
        for row in candidates:
            if by_repo[row['repo']] >= prior.MAX_PER_REPO:
                continue
            selected.append(row)
            by_repo[row['repo']] += 1
            if sum(item['language'] == language for item in selected) == quota:
                break
    ids = {row['instance_id'] for row in selected}
    old_ids = {row['instance_id'] for row in old['ordered_tasks']}
    if (len(ids) != 24 or Counter(row['language'] for row in selected) != prior.QUOTAS or
            max(Counter(row['repo'] for row in selected).values()) > prior.MAX_PER_REPO or
            old_ids - ids != {EXCLUDED_ID} or len(ids - old_ids) != 1 or
            any(set(row) != set(prior.SOURCE_FIELDS) for row in selected)):
        raise ValueError('successor-candidate-shape')
    result = {**old, 'schema_version': 'are.g01-post-r7-multilang-source-only-candidate/v2',
              'ordered_tasks': selected,
              'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest(),
              'available_clean_by_language': dict(sorted(Counter(source[i]['language'] for i in clean if i != EXCLUDED_ID).items())),
              'prior_candidate_sha256': EXPECTED_PRIOR_CANDIDATE_SHA,
              'source_index_exclusion': exclusion,
              'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Pre-model source-index-ineligible r1 task excluded by fixed limit; score-blind replacement only, not runner/index proof, freeze, or superiority.'}
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-output-boundary')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256'],
                      'replaced': EXCLUDED_ID, 'new_repo': next(row['repo'] for row in selected if row['instance_id'] in ids - old_ids),
                      'tasks': len(selected), 'repositories': len({row['repo'] for row in selected})}, sort_keys=True))


if __name__ == '__main__':
    main()
