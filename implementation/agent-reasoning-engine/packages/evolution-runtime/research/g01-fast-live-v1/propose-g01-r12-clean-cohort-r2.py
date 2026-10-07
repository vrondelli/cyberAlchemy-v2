#!/usr/bin/env python3
"""Score-blind r12 r2: retain 22 r1-admitted tasks, replace two MUI failures."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SELECTOR = BASE / 'g01-r12-cohort-selector-r1.py'
R1 = BASE / 'g01-r12-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
AUDIT = BASE / 'g01-r12-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
QUALIFICATION = BASE / 'g01-r12-remaining-typescript-qualification-r1/RESULT.json'
OUTPUT = BASE / 'g01-r12-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
PINS = {
    SELECTOR: '8722fec0d40476d8657778b7e29727b936330932953a207fa3b66f4fc97f52e7',
    R1: '3b6ac88cc20c565817a023e58735b7d83624a31e80897b7b1acea54a3cdfa23f',
    AUDIT: 'd1d8bdf797463a31ea865ae381c17da410d0856083f99a84c00f39f2f4463ddd',
    QUALIFICATION: '5f9817dbe06153cadf0d8f657d0686f1d39029eeaa4abbc3b8b04a88974ae3e1',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('fresh-output-or-pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g01_r12_selector', SELECTOR)
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    _, source, clean, seen, r11_ids = selector.source_pool()
    r1, audit, qualified = (json.loads(path.read_text()) for path in (R1, AUDIT, QUALIFICATION))
    old = r1['ordered_tasks']
    failed_rows = [row for row in audit['rows'] if row.get('excluded_gold_files') or row.get('absent_gold_files')]
    removed = [row['instance_id'] for row in old if any(x['instance_id'] == row['instance_id'] for x in failed_rows)]
    replacements = qualified.get('first_two_eligible_ids')
    qualified_rows = {row['instance_id']: row for row in qualified.get('rows', [])}
    if (r1.get('schema_version') != 'are.g01-r12-clean-source-only-candidate/v1' or
            r1.get('status') != 'preflight-only-not-frozen' or r1.get('model_calls') != 0 or
            r1.get('gold_values_or_paths_used') is not False or len(old) != 24 or
            audit.get('status') != 'failed' or audit.get('candidate_sha256') != PINS[R1] or
            audit.get('summary', {}).get('audited') != 24 or audit['summary'].get('excluded') != 2 or
            audit['summary'].get('absent') != 0 or len(failed_rows) != 2 or len(removed) != 2 or
            any(source[i]['language'] != 'typescript' for i in removed) or
            qualified.get('status') != 'passed' or qualified.get('candidate_sha256') != PINS[R1] or
            qualified.get('prior_failure_sha256') != PINS[AUDIT] or
            qualified.get('model_calls') != 0 or qualified.get('gold_paths_or_content_exported') is not False or
            qualified.get('ordered_candidates') != 14 or qualified.get('attempted') != 6 or
            not isinstance(replacements, list) or len(replacements) != 2 or len(set(replacements)) != 2 or
            [qualified_rows[i]['source_order_rank'] for i in replacements] != [2, 6]):
        raise ValueError('failed-cohort-or-qualification-drift')
    old_ids = {row['instance_id'] for row in old}
    for identifier in replacements:
        row = qualified_rows[identifier]
        if (identifier not in clean or identifier in old_ids | seen | r11_ids or
                source[identifier]['language'] != 'typescript' or
                source[identifier]['repo_url'] != 'https://github.com/mui/material-ui.git' or
                source[identifier]['base_commit'] != row['base_commit'] or
                row['admitted_gold_files'] != row['gold_file_count'] or
                row['excluded_gold_files'] or row['absent_gold_files']):
            raise ValueError('replacement-source-or-admission-drift')
    swap = dict(zip(removed, replacements))
    selected = [source[swap[row['instance_id']]] if row['instance_id'] in swap else row for row in old]
    ids = {row['instance_id'] for row in selected}
    by_language = Counter(row['language'] for row in selected)
    by_origin = Counter(row['repo_url'] for row in selected)
    by_repo = Counter(row['repo'] for row in selected)
    if (len(selected) != 24 or len(ids) != 24 or ids & (seen | r11_ids) or
            dict(by_language) != selector.QUOTAS or max(by_origin.values()) > 2 or
            max(by_repo.values()) > 2 or len(by_origin) != 16 or len(by_repo) != 16 or
            any(selected[i] != old[i] for i in range(24) if old[i]['instance_id'] not in swap)):
        raise ValueError('successor-candidate-shape')
    result = {
        'schema_version': 'are.g01-r12-clean-source-only-candidate/v2',
        'status': 'preflight-only-not-frozen', 'seed': selector.SEED,
        'changed_population_from_r11': True, 'language_quota': selector.QUOTAS,
        'max_tasks_per_git_origin': 2, 'max_tasks_per_repository': 2,
        'source_parquet_sha256': r1['source_parquet_sha256'],
        'exposure_set_sha256': r1['exposure_set_sha256'],
        'r11_frozen_id_set_sha256': r1['r11_frozen_id_set_sha256'],
        'r11_freeze_sha256': r1['r11_freeze_sha256'],
        'r41_source_qualification_sha256': r1['r41_source_qualification_sha256'],
        'prior_r1_candidate_sha256': PINS[R1], 'prior_failed_audit_sha256': PINS[AUDIT],
        'replacement_qualification_receipt_sha256': PINS[QUALIFICATION],
        'retained_22_task_id_set_sha256':
            hashlib.sha256(('\n'.join(sorted(old_ids - set(removed))) + '\n').encode()).hexdigest(),
        'removed_pre_model_ineligible_ids': removed, 'replacement_ids': replacements,
        'replacement_qualification_ranks': [2, 6],
        'eligibility_receipt_sha256': r1['eligibility_receipt_sha256'],
        'index_exclusion_receipt_sha256': r1['index_exclusion_receipt_sha256'],
        'ordered_tasks': selected,
        'task_id_set_sha256': hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest(),
        'selected_git_origins': len(by_origin), 'selected_repositories': len(by_repo),
        'selector_sha256': sha(Path(__file__)), 'gold_values_or_paths_used': False,
        'model_calls': 0,
        'claim_ceiling': 'Score-blind two-replacement source candidate only; full cache/index/gold replay, campaign freeze, score, and superiority unproven.',
        'open_questions': ['Will all 24 exact caches, checkouts, and indexes replay?',
                           'Will an independent evaluator-only audit admit all native reference files?',
                           'Can storage, provider, reliability, quality, and efficiency gates pass?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'replacement_ids': replacements, 'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
