#!/usr/bin/env python3
"""Source-only G01 r11 candidate from frozen evaluator eligibility bits.

This produces a preflight candidate, not a campaign freeze. It never reads
model outcomes, native scores, gold paths, or gold content.
"""

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
PRIOR_SELECTOR = BASE / 'g01-r10-clean-cohort-candidate-r1/propose-g01-r10-clean-cohort-r1.py'
R10_FREEZE = BASE / 'g01-product-replication-r10/CAMPAIGN-FREEZE.json'
PROBE = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
NEW_RECEIPTS = (
    BASE / 'g01-post-r10-new-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
    BASE / 'g01-post-r10-small-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
    BASE / 'g01-post-r10-prior-origin-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json',
)
INDEX_AUDITS = (
    BASE / 'g01-r10-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json',
    BASE / 'g01-r10-index-gold-coverage-r3/GOLD-INDEX-COVERAGE.json',
)
EXPECTED = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE_SCRIPT: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    PRIOR_SELECTOR: '567b376c154bcf720d8d7768018c1052469da0907eee9cfb86af84f15d53ce8b',
    R10_FREEZE: '44a44757822043dfb5bbb440a37eeec5729796058db776459a764a913d94d37c',
    NEW_RECEIPTS[0]: '5f0c5a045c8a42f982a35972f1475ea4c46c3bc46acc94705dcd61e8dd2542f3',
    NEW_RECEIPTS[1]: 'a5335273bcad20b351cd3323e744806b5824bebf7b20aa8ae19eb88ed5f4e219',
    NEW_RECEIPTS[2]: '4f33acef266473abef9ef3321ff0c3b19a1697a44559cadfb5384afcaa86bb28',
    INDEX_AUDITS[0]: 'b0752ad7d749d645f18c1fce9ac41222eedbf8faa8c194647cfb26134cda58f5',
    INDEX_AUDITS[1]: 'ebff1056b4cdc6d4ccdb9505cfe3430788eba93a83c211c912822c6f726ff0d6',
}
SEED = 'are-g01-r11-six-language-clean-source-only-20261001'
QUOTAS = {'cpp': 4, 'go': 1, 'java': 1, 'javascript': 2, 'typescript': 2, 'python': 14}
MAX_PER_ORIGIN = 2
MAX_PER_REPO = 2
OUTPUT = BASE / 'g01-r11-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
EXPECTED_INDEX_EXCLUSIONS = {
    'Multi-SWE-Bench__cpp__maintenance__bugfix__e43d9aa5',
    'SWE-Bench-Pro__python__maintenance__bugfix__6c2ff818',
    'Multi-SWE-Bench__java__maintenance__bugfix__2bd87230',
    'SWE-PolyBench__typescript__evolution__feature__112bbbf5',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def source_pool():
    if any(sha(path) != digest for path, digest in EXPECTED.items()):
        raise ValueError('pinned-input-drift')
    prior = module(PRIOR_SELECTOR, 'g01_r11_prior_selector')
    if prior.PARQUET != PARQUET or prior.PARQUET_SHA != EXPECTED[PARQUET]:
        raise ValueError('source-projection-drift')
    exposure = module(EXPOSURE_SCRIPT, 'g01_r11_exposure')
    g01, g02 = exposure.manifest_paths(BASE, Path('/opt/are-benchmark-runs'))
    if PROBE not in g01 or json.loads(PROBE.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(PROBE)
    seen = set()
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            seen.update(exposure.ids_from_manifest(path, branch))
    r10_ids = {row['instance_id'] for row in json.loads(R10_FREEZE.read_text())['ordered_tasks']}
    if len(r10_ids) != 24:
        raise ValueError('r10-freeze-shape')
    seen.update(r10_ids)
    clean = set()
    for name, (path, digest) in prior.RECEIPTS.items():
        if sha(path) != digest:
            raise ValueError('prior-eligibility-drift:' + name)
        receipt = json.loads(path.read_text())
        if (receipt.get('gold_paths_or_content_exported') is not False or
                receipt.get('model_calls', 0) != 0):
            raise ValueError('prior-eligibility-boundary:' + name)
        clean.update(row['instance_id'] for row in receipt['tasks'] if row['gold_lineage_clean'])
    for path in NEW_RECEIPTS:
        receipt = json.loads(path.read_text())
        if (receipt.get('status') != 'evaluator-only-no-model-no-scores' or
                receipt.get('gold_paths_or_content_exported') is not False or
                receipt.get('model_calls') != 0):
            raise ValueError('new-eligibility-boundary')
        clean.update(row['instance_id'] for row in receipt['tasks'] if row['gold_lineage_clean'])
    exclusions = set()
    for path in INDEX_AUDITS:
        audit = json.loads(path.read_text())
        if (audit.get('posture') != 'evaluator-only-no-model-no-scores' or
                audit.get('gold_paths_or_content_exported') is not False or
                audit.get('model_calls') != 0):
            raise ValueError('index-audit-boundary')
        exclusions.update(row['instance_id'] for row in audit['rows']
                          if row['admitted_gold_files'] != row['gold_file_count'] or
                          row['excluded_gold_files'] or row['absent_gold_files'])
    if exclusions != EXPECTED_INDEX_EXCLUSIONS:
        raise ValueError('index-exclusion-drift')
    clean.difference_update(seen)
    clean.difference_update(exclusions)
    clean.discard(prior.KNOWN_INDEX_INELIGIBLE)
    if len(clean) != 77:
        raise ValueError('clean-supply-drift')
    source_rows = pq.read_table(PARQUET, columns=list(prior.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-invalid')
    if any(not all(isinstance(source[i][field], str) and source[i][field]
                   for field in prior.SOURCE_FIELDS) for i in clean):
        raise ValueError('clean-source-row-invalid')
    return source, clean, seen, prior, exclusions


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError('fresh-output-required')
    source, clean, seen, prior, exclusions = source_pool()
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
    if (len(selected) != 24 or len(ids) != 24 or ids & seen or ids & exclusions or
            max(by_origin.values()) > MAX_PER_ORIGIN or max(by_repo.values()) > MAX_PER_REPO):
        raise ValueError('candidate-shape-invalid')
    result = {
        'schema_version': 'are.g01-r11-clean-source-only-candidate/v1',
        'status': 'preflight-only-not-frozen', 'seed': SEED,
        'changed_population_from_r10': True,
        'language_quota': QUOTAS, 'max_tasks_per_git_origin': MAX_PER_ORIGIN,
        'max_tasks_per_repository': MAX_PER_REPO,
        'source_parquet_sha256': EXPECTED[PARQUET],
        'exposure_set_sha256': id_sha(seen),
        'eligibility_receipt_sha256': {name: digest for name, (_, digest) in prior.RECEIPTS.items()} |
            {path.parent.name: EXPECTED[path] for path in NEW_RECEIPTS},
        'index_exclusion_receipt_sha256': {path.parent.name: EXPECTED[path] for path in INDEX_AUDITS},
        'excluded_known_index_failure_ids_sha256': id_sha(exclusions | {prior.KNOWN_INDEX_INELIGIBLE}),
        'known_clean_unused_after_exclusions': len(clean),
        'ordered_tasks': selected, 'task_id_set_sha256': id_sha(ids),
        'selected_git_origins': len(by_origin), 'selected_repositories': len(by_repo),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'Score-blind, changed-population source candidate only; no cache/index/native-gold admission, campaign freeze, score, or superiority.',
        'open_questions': ['Do all 24 exact commits and task-specific source indexes pass?',
                           'Are all native reference files index-reachable without exporting paths to the selector?',
                           'Can storage, source snapshot, provider and paired-run reliability pass before a separately frozen campaign?'],
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'by_language': dict(Counter(row['language'] for row in selected)),
                      'git_origins': len(by_origin), 'repositories': len(by_repo),
                      'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': result['task_id_set_sha256']},
                     sort_keys=True))


if __name__ == '__main__':
    main()
