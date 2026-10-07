#!/usr/bin/env python3
"""Score-blind r11 r2 replacement after one r1 pre-model index exclusion."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SELECTOR = BASE / 'g01-r11-clean-cohort-candidate-r1/propose-g01-r11-clean-cohort-r1.py'
PRIOR_CANDIDATE = BASE / 'g01-r11-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
PRIOR_AUDIT = BASE / 'g01-r11-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
OUTPUT = BASE / 'g01-r11-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
PINS = {
    PRIOR_SELECTOR: '7f8b4cf06e50a8b7d6ee43b5f137aaae7299d7837b3ba34112e206eb9ef57dc9',
    PRIOR_CANDIDATE: 'dd8a659b36e5f9f6dd13fe7dfb452eb75793777a0348791fa65f302349ebb458',
    PRIOR_AUDIT: '9aeada6938354b98bd34941e68afb06cce91ce9e8e41b1236aa67eb34e29fac8',
}
FAILED_ID = 'SWE-PolyBench__typescript__maintenance__bugfix__7827bc22'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('fresh-output-or-pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g01_r11_r1_selector', PRIOR_SELECTOR)
    parent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parent)
    source, clean, seen, _, exclusions = parent.source_pool()
    old = json.loads(PRIOR_CANDIDATE.read_text())
    audit = json.loads(PRIOR_AUDIT.read_text())
    failed = [row for row in audit['rows'] if row['status'] != 'audited' or
              row['admitted_gold_files'] != row['gold_file_count'] or
              row['excluded_gold_files'] or row['absent_gold_files']]
    if (old.get('schema_version') != 'are.g01-r11-clean-source-only-candidate/v1' or
            old.get('status') != 'preflight-only-not-frozen' or
            old.get('model_calls') != 0 or old.get('gold_values_or_paths_used') is not False or
            old.get('task_id_set_sha256') != '64625d115e7226b9f8aa8fcc80647958b922b81743bcf95152c0f020bce46858' or
            len(old['ordered_tasks']) != 24 or
            audit.get('status') != 'failed' or audit.get('posture') != 'evaluator-only-no-model-no-scores' or
            audit.get('gold_paths_or_content_exported') is not False or audit.get('model_calls') != 0 or
            audit.get('candidate_sha256') != PINS[PRIOR_CANDIDATE] or
            audit['summary']['audited'] != 24 or audit['summary']['admitted'] != 55 or
            audit['summary']['gold_files'] != 56 or audit['summary']['excluded'] != 1 or
            audit['summary']['absent'] != 0 or len(failed) != 1 or
            failed[0]['instance_id'] != FAILED_ID or failed[0]['language'] != 'typescript' or
            failed[0]['admitted_gold_files'] != 0 or failed[0]['gold_file_count'] != 1):
        raise ValueError('r1-failure-lineage-drift')
    failed_position = next((i for i, row in enumerate(old['ordered_tasks'])
                            if row['instance_id'] == FAILED_ID), None)
    if failed_position is None or FAILED_ID not in clean:
        raise ValueError('failed-task-source-drift')
    retained = [row for row in old['ordered_tasks'] if row['instance_id'] != FAILED_ID]
    retained_ids = {row['instance_id'] for row in retained}
    if len(retained) != 23 or len(retained_ids) != 23 or not retained_ids <= clean:
        raise ValueError('retained-task-shape')
    by_origin = Counter(row['repo_url'] for row in retained)
    by_repo = Counter(row['repo'] for row in retained)
    candidates = sorted((source[i] for i in clean if source[i]['language'] == 'typescript' and
                         i not in retained_ids and i != FAILED_ID and i not in seen and i not in exclusions),
                        key=lambda row: (hashlib.sha256((parent.SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                         row['instance_id']))
    replacement = next((row for row in candidates
                        if by_origin[row['repo_url']] < parent.MAX_PER_ORIGIN and
                        by_repo[row['repo']] < parent.MAX_PER_REPO), None)
    if replacement is None:
        raise ValueError('typescript-replacement-capacity')
    selected = list(old['ordered_tasks'])
    selected[failed_position] = replacement
    ids = {row['instance_id'] for row in selected}
    by_origin[replacement['repo_url']] += 1
    by_repo[replacement['repo']] += 1
    if (len(selected) != 24 or len(ids) != 24 or ids & seen or ids & exclusions or
            Counter(row['language'] for row in selected) != parent.QUOTAS or
            max(by_origin.values()) > parent.MAX_PER_ORIGIN or max(by_repo.values()) > parent.MAX_PER_REPO):
        raise ValueError('replacement-candidate-shape')
    result = {
        'schema_version': 'are.g01-r11-clean-source-only-candidate/v2',
        'status': 'preflight-only-not-frozen', 'seed': parent.SEED,
        'changed_population_from_r10': True, 'language_quota': parent.QUOTAS,
        'max_tasks_per_git_origin': parent.MAX_PER_ORIGIN,
        'max_tasks_per_repository': parent.MAX_PER_REPO,
        'source_parquet_sha256': parent.EXPECTED[parent.PARQUET],
        'exposure_set_sha256': id_sha(seen),
        'eligibility_receipt_sha256': old['eligibility_receipt_sha256'],
        'index_exclusion_receipt_sha256': old['index_exclusion_receipt_sha256'],
        'prior_candidate_sha256': PINS[PRIOR_CANDIDATE],
        'prior_failed_index_audit_sha256': PINS[PRIOR_AUDIT],
        'retained_23_task_id_set_sha256': id_sha(retained_ids),
        'removed_pre_model_ineligible_id': FAILED_ID,
        'replacement_id': replacement['instance_id'],
        'replacement_source_rank': candidates.index(replacement) + 1,
        'ordered_tasks': selected, 'task_id_set_sha256': id_sha(ids),
        'selected_git_origins': len(by_origin), 'selected_repositories': len(by_repo),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'New score-blind preflight-only successor after one r1 index-admission failure; no campaign freeze, score or superiority.',
        'open_questions': ['Does the replacement exact commit pass cache, checkout and bounded index preflight?',
                           'Does evaluator-only native-reference coverage pass 24/24?',
                           'Can a separately frozen campaign meet reliability, quality and efficiency gates?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'retained': len(retained), 'replacement_id': result['replacement_id'],
                      'replacement_source_rank': result['replacement_source_rank'],
                      'git_origins': len(by_origin), 'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
