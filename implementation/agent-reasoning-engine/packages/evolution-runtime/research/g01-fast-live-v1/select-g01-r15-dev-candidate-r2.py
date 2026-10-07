#!/usr/bin/env python3
"""Replace r15 r1 native-reference-ineligible slots without model scores."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
R1_SELECTOR = BASE / 'select-g01-r15-dev-candidate-r1.py'
R1_CANDIDATE = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R1_AUDIT = BASE / 'g01-r15-native-reference-audit-r1/NATIVE-REFERENCE-AUDIT.json'
ROOT = BASE / 'g01-r15-clean-cohort-candidate-r2'
OUTPUT = ROOT / 'COHORT-CANDIDATE.json'
PINS = {
    R1_SELECTOR: 'c74c03fe2f9951ff47a138c30f41c029a324dcbf66220128a41388b45d05dc21',
    R1_CANDIDATE: 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551',
    R1_AUDIT: 'df3b9e054de1f1f752d4b04f98de4b6b23303a612f2297df6db1b7f057f17661',
}
SEED = b'are-g01-r15-development-cap-eight-preflight-replacement-r2\0'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def load(path):
    return json.loads(path.read_text())


def main():
    if ROOT.exists():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('r1-input-drift')
    spec = importlib.util.spec_from_file_location('g01_r15_r1_selector', R1_SELECTOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    for path, digest in prior.PINS.items():
        if sha(path) != digest:
            raise ValueError('prior-input-drift:' + str(path))
    r1, audit = load(R1_CANDIDATE), load(R1_AUDIT)
    tasks = r1['ordered_tasks']
    by_audit = {row['instance_id']: row for row in audit['rows']}
    if (r1['status'] != 'preflight-only-not-frozen' or len(tasks) != 24 or
            r1['model_calls'] != 0 or r1['gold_values_or_paths_used'] is not False or
            audit['status'] != 'failed' or audit['candidate_sha256'] != PINS[R1_CANDIDATE] or
            audit['summary']['audited'] != 24 or audit['summary']['worker_unavailable'] != 0 or
            audit['model_calls'] != 0 or audit['gold_paths_or_content_exported'] is not False or
            len(by_audit) != 24 or set(by_audit) != {row['instance_id'] for row in tasks}):
        raise ValueError('r1-audit-binding')
    failed = {identifier for identifier, row in by_audit.items()
              if row['status'] != 'audited' or
              row['admitted_gold_files'] != row['gold_file_count'] or
              row['excluded_gold_files'] or row['absent_gold_files']}
    if (len(failed) != 3 or
            any(by_audit[identifier]['language'] != 'typescript' for identifier in failed) or
            audit['summary']['excluded'] != 7 or audit['summary']['absent'] != 0):
        raise ValueError('r1-failure-shape')
    retained = [row for row in tasks if row['instance_id'] not in failed]
    if len(retained) != 21 or Counter(row['language'] for row in retained) != {'python': 18, 'typescript': 3}:
        raise ValueError('retained-shape')

    clean = set()
    for receipt in load(prior.R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    for path in (prior.R13_SCREEN, prior.R14_SCREEN, prior.R15_SCREEN):
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    exposure_spec = importlib.util.spec_from_file_location('g01_r15_r2_exposure', prior.EXPOSURE)
    exposure = importlib.util.module_from_spec(exposure_spec)
    exposure_spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(prior.BASE, prior.RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or load(probe).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    for path in (prior.R13_R1, prior.R13_R2, prior.R14_CANDIDATE):
        seen.update(row['instance_id'] for row in load(path)['ordered_tasks'])
    if id_sha(seen) != r1['exposure_set_sha256']:
        raise ValueError('exposure-drift')
    acceptance = load(prior.ACCEPTANCE)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    clean = (clean - seen) & dev
    if len(clean) != 32 or clean & reserve:
        raise ValueError('clean-supply-drift')
    source_rows = pq.read_table(prior.PARQUET, columns=list(prior.FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-drift')
    if any(source[row['instance_id']] != row for row in tasks):
        raise ValueError('r1-source-row-drift')

    r1_ids = {row['instance_id'] for row in tasks}
    origin_counts = Counter(row['repo_url'] for row in retained)
    eligible = [source[identifier] for identifier in clean - r1_ids
                if source[identifier]['language'] == 'python']
    eligible.sort(key=lambda row: (hashlib.sha256(SEED + row['repo_url'].encode() + b'\0' +
                                                   row['instance_id'].encode()).hexdigest(),
                                   row['instance_id']))
    replacements = []
    for row in eligible:
        if origin_counts[row['repo_url']] >= 8:
            continue
        replacements.append(row)
        origin_counts[row['repo_url']] += 1
        if len(replacements) == 3:
            break
    chosen = retained + replacements
    ids = {row['instance_id'] for row in chosen}
    if (len(replacements) != 3 or len(chosen) != 24 or len(ids) != 24 or
            ids & (seen | reserve | failed) or not ids <= clean or
            Counter(row['language'] for row in chosen) != {'python': 21, 'typescript': 3} or
            max(origin_counts.values()) > 8 or len(origin_counts) != 5):
        raise ValueError('r2-candidate-shape')
    candidate = {
        'schema_version': 'are.g01-r15-development-cap-eight-candidate-r2/v1',
        'status': 'preflight-only-not-frozen', 'seed_hex': SEED.hex(),
        'source_partition': r1['source_partition'],
        'language_quota': {'python': 21, 'typescript': 3},
        'max_tasks_per_git_origin': 8,
        'source_parquet_sha256': r1['source_parquet_sha256'],
        'acceptance_sha256': r1['acceptance_sha256'],
        'reserved_partition_id_set_sha256': r1['reserved_partition_id_set_sha256'],
        'exposure_set_sha256': r1['exposure_set_sha256'],
        'r46_source_qualification_sha256': r1['r46_source_qualification_sha256'],
        'r1_candidate_sha256': PINS[R1_CANDIDATE],
        'r1_native_reference_audit_sha256': PINS[R1_AUDIT],
        'retained_preflight_eligible_tasks': len(retained),
        'replaced_preflight_ineligible_ids': sorted(failed),
        'replacement_ids': sorted(row['instance_id'] for row in replacements),
        'ordered_tasks': chosen, 'task_id_set_sha256': id_sha(ids),
        'selected_git_origins': len(origin_counts),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'authority_effect': 'none',
        'claim_ceiling': 'Changed-language development preflight candidate; no r2 cache/index/reference admission, score, or superiority',
        'open_questions': [
            'Do all 24 r2 exact caches, checkouts, indexes and native references pass?',
            'Can a new freeze and matched run meet strict 24/24 quality and reliability gates?']}
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': candidate['status'], 'tasks': len(chosen),
                      'retained': len(retained), 'replacements': len(replacements),
                      'by_origin': dict(sorted(origin_counts.items())),
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': candidate['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
