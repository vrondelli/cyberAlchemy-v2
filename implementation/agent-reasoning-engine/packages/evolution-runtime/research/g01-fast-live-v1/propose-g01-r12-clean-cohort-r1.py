#!/usr/bin/env python3
"""Score-blind r12 successor after the terminal r11 source failure.

All r11 frozen IDs are excluded, including unattempted tasks. This keeps the
prior conservative manifest exposure boundary rather than relabeling its
holdout after the r11 stop. No model outputs, scores, or gold values are read.
"""

from collections import Counter
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
PRIOR_SCRIPT = BASE / 'g01-r11-clean-cohort-candidate-r1/propose-g01-r11-clean-cohort-r1.py'
R11_FREEZE = BASE / 'g01-product-replication-r11/CAMPAIGN-FREEZE.json'
R41_RECEIPT = BASE / 'g01-source-r12-prospective-r41-evidence/SOURCE-QUALIFICATION.json'
OUTPUT = BASE / 'g01-r12-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
PINS = {
    PRIOR_SCRIPT: '7f8b4cf06e50a8b7d6ee43b5f137aaae7299d7837b3ba34112e206eb9ef57dc9',
    R11_FREEZE: '8614ceff2338089f98630ea30c1ed887db55d004de6c77cbddb7a50098048081',
    R41_RECEIPT: '310e2703d06b95a193eeeb25d4888f2b5d011d9e2c1cbde36355fa81dd17b6d4',
}
SEED = 'are-g01-r12-four-language-clean-source-only-20261001'
QUOTAS = {'cpp': 3, 'javascript': 2, 'typescript': 2, 'python': 17}
MAX_PER_ORIGIN = 2
MAX_PER_REPO = 2


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def source_pool():
    if any(sha(path) != expected for path, expected in PINS.items()):
        raise ValueError('pinned-r11-or-r41-drift')
    r11 = load_module(PRIOR_SCRIPT, 'g01_r12_prior_selector')
    if any(sha(path) != expected for path, expected in r11.EXPECTED.items()):
        raise ValueError('prior-source-or-receipt-drift')
    prior = r11.module(r11.PRIOR_SELECTOR, 'g01_r12_prior_r10_selector')
    if prior.PARQUET != r11.PARQUET or prior.PARQUET_SHA != r11.EXPECTED[r11.PARQUET]:
        raise ValueError('source-projection-drift')
    r41 = json.loads(R41_RECEIPT.read_text())
    if (r41.get('status') != 'source-qualified-not-campaign-frozen' or
            r41.get('source_tree_sha256') !=
            'bac9fcdf9d485b6bec42eb9372261dab9fc58797145e17917542f197b5ef13de' or
            r41.get('model_calls') != 0):
        raise ValueError('source-qualification-drift')
    exposure = r11.module(r11.EXPOSURE_SCRIPT, 'g01_r12_exposure')
    g01, g02 = exposure.manifest_paths(BASE, Path('/opt/are-benchmark-runs'))
    if r11.PROBE not in g01 or json.loads(r11.PROBE.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(r11.PROBE)
    seen = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            seen.update(exposure.ids_from_manifest(path, branch))
    r10_ids = {row['instance_id'] for row in json.loads(r11.R10_FREEZE.read_text())['ordered_tasks']}
    freeze = json.loads(R11_FREEZE.read_text())
    if freeze.get('status') != 'frozen-before-dispatch' or len(r10_ids) != 24 or len(freeze['ordered_tasks']) != 24:
        raise ValueError('frozen-cohort-shape')
    r11_ids = {row['instance_id'] for row in freeze['ordered_tasks']}
    if len(r11_ids) != 24:
        raise ValueError('r11-duplicate-id')
    seen.update(r10_ids | r11_ids)
    attempted = [row for row in freeze['ordered_tasks']
                 if (BASE / 'g01-product-replication-r11' / row['slug'] / 'PAIR-RESULT.json').exists()]
    if (len(attempted) != 13 or attempted != freeze['ordered_tasks'][:13] or
            any((BASE / 'g01-product-replication-r11' / row['slug'] / 'PAIR-RESULT.json').exists()
                for row in freeze['ordered_tasks'][13:])):
        raise ValueError('r11-attempt-boundary-drift')
    clean = set()
    for name, (path, digest) in prior.RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError('prior-eligibility-drift:' + name)
        receipt = json.loads(path.read_text())
        if receipt.get('gold_paths_or_content_exported') is not False or receipt.get('model_calls', 0) != 0:
            raise ValueError('prior-eligibility-boundary:' + name)
        clean.update(row['instance_id'] for row in receipt['tasks'] if row['gold_lineage_clean'])
    for path in r11.NEW_RECEIPTS:
        receipt = json.loads(path.read_text())
        if (receipt.get('status') != 'evaluator-only-no-model-no-scores' or
                receipt.get('gold_paths_or_content_exported') is not False or receipt.get('model_calls') != 0):
            raise ValueError('new-eligibility-boundary')
        clean.update(row['instance_id'] for row in receipt['tasks'] if row['gold_lineage_clean'])
    exclusions = set()
    for path in r11.INDEX_AUDITS:
        audit = json.loads(path.read_text())
        if (audit.get('posture') != 'evaluator-only-no-model-no-scores' or
                audit.get('gold_paths_or_content_exported') is not False or audit.get('model_calls') != 0):
            raise ValueError('index-audit-boundary')
        exclusions.update(row['instance_id'] for row in audit['rows']
                          if row['admitted_gold_files'] != row['gold_file_count'] or
                          row['excluded_gold_files'] or row['absent_gold_files'])
    if exclusions != r11.EXPECTED_INDEX_EXCLUSIONS:
        raise ValueError('index-exclusion-drift')
    clean.difference_update(seen | exclusions | {prior.KNOWN_INDEX_INELIGIBLE})
    if len(clean) != 53 or clean & r11_ids:
        raise ValueError('current-clean-supply-drift')
    source_rows = pq.read_table(r11.PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-invalid')
    if any(not all(isinstance(source[i][field], str) and source[i][field]
                   for field in prior.SOURCE_FIELDS) for i in clean):
        raise ValueError('clean-source-row-invalid')
    return r11, source, clean, seen, r11_ids


def build_candidate():
    r11, source, clean, seen, r11_ids = source_pool()
    selected = []
    by_origin, by_repo = Counter(), Counter()
    for language, quota in QUOTAS.items():
        candidates = sorted((source[i] for i in clean if source[i]['language'] == language),
                            key=lambda row: (hashlib.sha256((SEED + '\0' + row['instance_id']).encode()).hexdigest(),
                                             row['instance_id']))
        picked = 0
        for row in candidates:
            if by_origin[row['repo_url']] >= MAX_PER_ORIGIN or by_repo[row['repo']] >= MAX_PER_REPO:
                continue
            selected.append(row)
            by_origin[row['repo_url']] += 1
            by_repo[row['repo']] += 1
            picked += 1
            if picked == quota:
                break
        if picked != quota:
            raise ValueError('language-diversity-capacity:' + language)
    ids = {row['instance_id'] for row in selected}
    if (len(selected) != 24 or len(ids) != 24 or ids & (seen | r11_ids) or
            max(by_origin.values()) > MAX_PER_ORIGIN or max(by_repo.values()) > MAX_PER_REPO):
        raise ValueError('candidate-shape-invalid')
    return {
        'schema_version': 'are.g01-r12-clean-source-only-candidate/v1',
        'status': 'preflight-only-not-frozen', 'seed': SEED,
        'changed_population_from_r11': True,
        'language_quota': QUOTAS, 'max_tasks_per_git_origin': MAX_PER_ORIGIN,
        'max_tasks_per_repository': MAX_PER_REPO,
        'source_parquet_sha256': r11.EXPECTED[r11.PARQUET],
        'exposure_set_sha256': r11.id_sha(seen),
        'r11_frozen_id_set_sha256': r11.id_sha(r11_ids),
        'r11_freeze_sha256': PINS[R11_FREEZE],
        'r41_source_qualification_sha256': PINS[R41_RECEIPT],
        'eligibility_receipt_sha256': {name: digest for name, (_, digest) in prior_receipts(r11).items()} |
            {path.parent.name: r11.EXPECTED[path] for path in r11.NEW_RECEIPTS},
        'index_exclusion_receipt_sha256': {path.parent.name: r11.EXPECTED[path] for path in r11.INDEX_AUDITS},
        'known_clean_unused_after_exclusions': len(clean),
        'ordered_tasks': selected, 'task_id_set_sha256': r11.id_sha(ids),
        'selected_git_origins': len(by_origin), 'selected_repositories': len(by_repo),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'Score-blind four-language changed-population source candidate only; no cache/index/native-gold admission, campaign freeze, score, or superiority.',
        'open_questions': ['Do all 24 exact commits and task-specific source indexes pass?',
                           'Are all native reference files index-reachable without exporting paths to the selector?',
                           'Can storage, source snapshot, provider and paired-run reliability pass before a separately frozen campaign?'],
    }


def prior_receipts(r11):
    prior = r11.module(r11.PRIOR_SELECTOR, 'g01_r12_prior_receipts')
    return prior.RECEIPTS


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--select', action='store_true')
    args = parser.parse_args()
    if args.check == args.select:
        raise ValueError('choose-check-or-select')
    result = build_candidate()
    if args.select:
        if OUTPUT.exists() or OUTPUT.parent.exists():
            raise ValueError('fresh-output-root-required')
        OUTPUT.parent.mkdir(mode=0o700)
        fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as stream:
            stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(result['ordered_tasks']),
                      'by_language': dict(Counter(row['language'] for row in result['ordered_tasks'])),
                      'git_origins': result['selected_git_origins'],
                      'repositories': result['selected_repositories'],
                      'task_id_set_sha256': result['task_id_set_sha256'],
                      'candidate_sha256': sha(OUTPUT) if args.select else None,
                      'model_calls': 0}, sort_keys=True))


if __name__ == '__main__':
    main()
