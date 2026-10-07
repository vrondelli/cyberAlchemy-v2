#!/usr/bin/env python3
"""Pre-model r11 r3 successor using the first count-only qualified replacement."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
SELECTOR = BASE / 'g01-r11-clean-cohort-candidate-r1/propose-g01-r11-clean-cohort-r1.py'
R1 = BASE / 'g01-r11-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R2 = BASE / 'g01-r11-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
QUALIFICATION = BASE / 'g01-r11-remaining-typescript-qualification-r1/RESULT.json'
OUTPUT = BASE / 'g01-r11-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
PINS = {
    SELECTOR: '7f8b4cf06e50a8b7d6ee43b5f137aaae7299d7837b3ba34112e206eb9ef57dc9',
    R1: 'dd8a659b36e5f9f6dd13fe7dfb452eb75793777a0348791fa65f302349ebb458',
    R2: '17b06e1428c79d55d5c78072d4ed41221bd3ee627a0b0614a2cc9078f9f7bdd0',
    QUALIFICATION: '9d705ecd9ffe68262d892c98ffcd726e018fe3a2d8103c5c3aec58198e0fea85',
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
    spec = importlib.util.spec_from_file_location('g01_r11_selector', SELECTOR)
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    source, clean, seen, _, exclusions = selector.source_pool()
    r1, r2, qualified = (json.loads(path.read_text()) for path in (R1, R2, QUALIFICATION))
    selected_id = qualified.get('first_eligible_id')
    rows = qualified.get('rows', [])
    if (qualified.get('status') != 'passed' or qualified.get('candidate_sha256') != PINS[R2] or
            qualified.get('model_calls') != 0 or qualified.get('gold_paths_or_content_exported') is not False or
            qualified.get('attempted') != 2 or len(rows) != 2 or
            rows[0]['admitted_gold_files'] == rows[0]['gold_file_count'] or
            rows[1]['instance_id'] != selected_id or
            rows[1]['admitted_gold_files'] != rows[1]['gold_file_count'] or
            rows[1]['excluded_gold_files'] or rows[1]['absent_gold_files']):
        raise ValueError('qualification-drift')
    removed = r2['removed_pre_model_ineligible_id']
    old = r1['ordered_tasks']
    retained = [row for row in old if row['instance_id'] != removed]
    retained_ids = {row['instance_id'] for row in retained}
    if (len(old) != 24 or len(retained) != 23 or len(retained_ids) != 23 or
            selector.id_sha(retained_ids) != r2['retained_23_task_id_set_sha256'] or
            selected_id not in clean or selected_id in retained_ids | seen | exclusions or
            selected_id in (removed, r2['replacement_id'])):
        raise ValueError('candidate-lineage-or-exposure-drift')
    replacement = source[selected_id]
    if (replacement['language'] != 'typescript' or
            replacement['repo_url'] != 'https://github.com/mui/material-ui.git' or
            replacement['base_commit'] != rows[1]['base_commit']):
        raise ValueError('replacement-source-drift')
    selected = [replacement if row['instance_id'] == removed else row for row in old]
    ids = {row['instance_id'] for row in selected}
    origins = Counter(row['repo_url'] for row in selected)
    repos = Counter(row['repo'] for row in selected)
    if (len(ids) != 24 or Counter(row['language'] for row in selected) != selector.QUOTAS or
            max(origins.values()) > selector.MAX_PER_ORIGIN or
            max(repos.values()) > selector.MAX_PER_REPO):
        raise ValueError('replacement-candidate-shape')
    result = {
        'schema_version': 'are.g01-r11-clean-source-only-candidate/v3',
        'status': 'preflight-only-not-frozen', 'seed': selector.SEED,
        'changed_population_from_r10': True, 'language_quota': selector.QUOTAS,
        'max_tasks_per_git_origin': selector.MAX_PER_ORIGIN,
        'max_tasks_per_repository': selector.MAX_PER_REPO,
        'source_parquet_sha256': selector.EXPECTED[selector.PARQUET],
        'exposure_set_sha256': selector.id_sha(seen),
        'eligibility_receipt_sha256': r1['eligibility_receipt_sha256'],
        'index_exclusion_receipt_sha256': r1['index_exclusion_receipt_sha256'],
        'prior_r1_candidate_sha256': PINS[R1], 'prior_r2_candidate_sha256': PINS[R2],
        'replacement_qualification_receipt_sha256': PINS[QUALIFICATION],
        'retained_23_task_id_set_sha256': selector.id_sha(retained_ids),
        'removed_pre_model_ineligible_id': removed, 'replacement_id': selected_id,
        'replacement_qualification_rank': rows[1]['source_order_rank'],
        'ordered_tasks': selected, 'task_id_set_sha256': selector.id_sha(ids),
        'selected_git_origins': len(origins), 'selected_repositories': len(repos),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'Preflight-only successor with one evaluator-only admission-qualified replacement; no full replay, freeze, score, or superiority.',
        'open_questions': ['Will all 24 exact caches, isolated checkouts, and indexes replay?',
                           'Will all native reference files pass independent evaluator-only admission?',
                           'Can storage, source, provider, reliability, quality, and efficiency gates pass?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'replacement_id': selected_id, 'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
