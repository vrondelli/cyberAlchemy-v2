#!/usr/bin/env python3
"""Score-blind r10 successor: retain admitted r1 tasks, backfill only two slots."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
R1_SELECTOR = BASE / 'g01-r10-clean-cohort-candidate-r1/propose-g01-r10-clean-cohort-r1.py'
R1_SELECTOR_SHA = '567b376c154bcf720d8d7768018c1052469da0907eee9cfb86af84f15d53ce8b'
R1_CANDIDATE = BASE / 'g01-r10-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R1_CANDIDATE_SHA = '56dfbd8fa8b6e0c3cbc8acc3e5b4e871e11a996dd56f3f9cf68588e4bb531cf7'
R1_ADMISSION = BASE / 'g01-r10-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
R1_ADMISSION_SHA = 'b0752ad7d749d645f18c1fce9ac41222eedbf8faa8c194647cfb26134cda58f5'
OUTPUT = BASE / 'g01-r10-clean-cohort-candidate-r4/COHORT-CANDIDATE.json'
SEED = 'are-g01-r10-r4-python-backfill-20260930'
QUOTAS = {'cpp': 4, 'java': 2, 'javascript': 4, 'typescript': 4, 'python': 10}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def id_digest(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def load(path):
    return json.loads(path.read_text())


def main():
    if (sha(R1_SELECTOR) != R1_SELECTOR_SHA or sha(R1_CANDIDATE) != R1_CANDIDATE_SHA or
            sha(R1_ADMISSION) != R1_ADMISSION_SHA or OUTPUT.exists() or
            not OUTPUT.parent.is_dir()):
        raise ValueError('pinned-input-or-fresh-output-boundary')
    spec = importlib.util.spec_from_file_location('g01_r10_r1_selector', R1_SELECTOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    if (sha(prior.PARQUET) != prior.PARQUET_SHA or
            sha(prior.EXPOSURE_HELPER) != prior.EXPOSURE_HELPER_SHA):
        raise ValueError('source-or-exposure-helper-drift')
    spec = importlib.util.spec_from_file_location('g01_r10_exposure', prior.EXPOSURE_HELPER)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    seen = exposure.exposure()
    if len(seen) != 324 or id_digest(seen) != prior.EXPOSURE_SHA:
        raise ValueError('exposure-drift')
    old, audit = load(R1_CANDIDATE), load(R1_ADMISSION)
    if (old['status'] != 'preflight-only-not-frozen' or
            old['gold_values_or_paths_used'] is not False or len(old['ordered_tasks']) != 24 or
            audit['status'] != 'failed' or audit['candidate_sha256'] != R1_CANDIDATE_SHA or
            audit['gold_paths_or_content_exported'] is not False or audit['model_calls'] != 0 or
            len(audit['rows']) != 24):
        raise ValueError('prior-candidate-or-admission-shape')
    admission = {row['instance_id']: row for row in audit['rows']}
    if len(admission) != 24:
        raise ValueError('duplicate-admission-id')
    failed = {identifier for identifier, row in admission.items()
              if row['status'] != 'audited' or row['excluded_gold_files'] or row['absent_gold_files']}
    if failed != {'Multi-SWE-Bench__cpp__maintenance__bugfix__e43d9aa5',
                  'SWE-Bench-Pro__python__maintenance__bugfix__6c2ff818'}:
        raise ValueError('index-ineligibility-drift')
    selected = [task for task in old['ordered_tasks'] if task['instance_id'] not in failed]
    if len(selected) != 22 or any(admission[task['instance_id']]['admitted_gold_files'] !=
                                  admission[task['instance_id']]['gold_file_count'] for task in selected):
        raise ValueError('retained-admission-drift')
    clean = set()
    for name, (path, digest) in prior.RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError('eligibility-receipt-drift:' + name)
        receipt = load(path)
        if (receipt.get('gold_paths_or_content_exported') is not False or
                receipt.get('model_calls', 0) != 0):
            raise ValueError('eligibility-receipt-shape:' + name)
        clean.update(row['instance_id'] for row in receipt['tasks'] if row['gold_lineage_clean'])
    clean.difference_update(seen)
    clean.difference_update(failed | {prior.KNOWN_INDEX_INELIGIBLE})
    if len(clean) != 60:
        raise ValueError('clean-supply-drift')
    source_rows = pq.read_table(prior.PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows):
        raise ValueError('source-ids-duplicate')
    by_repo = Counter(task['repo'] for task in selected)
    by_origin = Counter(task['repo_url'] for task in selected)
    chosen = {task['instance_id'] for task in selected}
    candidates = sorted((source[identifier] for identifier in clean
                         if identifier not in chosen and source[identifier]['language'] == 'python'),
                        key=lambda row: (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                         row['instance_id']))
    backfill = []
    for row in candidates:
        if by_repo[row['repo']] >= 2 or by_origin[row['repo_url']] >= 2:
            continue
        if any(not isinstance(row[field], str) or not row[field] for field in prior.SOURCE_FIELDS):
            raise ValueError('backfill-source-field-invalid')
        selected.append(row)
        backfill.append(row['instance_id'])
        chosen.add(row['instance_id'])
        by_repo[row['repo']] += 1
        by_origin[row['repo_url']] += 1
        if len(backfill) == 2:
            break
    if (len(backfill) != 2 or len(selected) != 24 or len(chosen) != 24 or
            chosen & seen or Counter(row['language'] for row in selected) != QUOTAS or
            max(by_repo.values()) > 2 or max(by_origin.values()) > 2 or
            len(by_origin) < 12):
        raise ValueError('candidate-capacity-or-shape')
    result = {'schema_version': 'are.g01-r10-clean-source-only-candidate/v4',
              'status': 'preflight-only-not-frozen', 'seed': SEED,
              'language_quota': QUOTAS, 'max_tasks_per_repository': 2,
              'max_tasks_per_git_origin': 2,
              'source_parquet_sha256': prior.PARQUET_SHA,
              'exposure_set_sha256': prior.EXPOSURE_SHA,
              'eligibility_receipt_sha256': {name: digest for name, (_, digest) in prior.RECEIPTS.items()},
              'prior_candidate_sha256': R1_CANDIDATE_SHA,
              'prior_index_admission_sha256': R1_ADMISSION_SHA,
              'retained_admitted_ids_sha256': id_digest(task['instance_id'] for task in selected[:22]),
              'removed_pre_model_ineligible_ids': sorted(failed),
              'backfilled_ids': backfill,
              'ordered_tasks': selected, 'task_id_set_sha256': id_digest(chosen),
              'source_commit_join_verified': True, 'gold_values_or_paths_used': False,
              'model_calls': 0, 'selector_sha256': sha(Path(__file__)),
              'claim_ceiling': 'Score-blind preflight-only successor; no model quality, cohort freeze, or superiority proof.',
              'open_questions': ['Do the two new Python tasks pass exact cache/index/native-gold admission?',
                                 'Can the full cohort pass storage, prospective source and provider readiness?',
                                 'Will a separately frozen strict campaign pass quality, cost and integrity gates?']}
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'retained_admitted': 22, 'backfilled': len(backfill),
                      'by_language': dict(Counter(row['language'] for row in selected)),
                      'repositories': len(by_repo), 'git_origins': len(by_origin),
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
