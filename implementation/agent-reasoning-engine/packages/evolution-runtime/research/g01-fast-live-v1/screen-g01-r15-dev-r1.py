#!/usr/bin/env python3
"""Freeze a score-blind post-r14 development-only G01 lineage-screen draw."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R12_LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
R13_SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R13_R1 = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R13_R2 = BASE / 'g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
CAP = BASE / 'g01-r14-dev-cap-r1/RESULT.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
R14_MANIFEST = BASE / 'g01-r14-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
R14_SCREEN = BASE / 'g01-r14-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R14_CANDIDATE = BASE / 'g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
ROOT = BASE / 'g01-r15-dev-screen-r1'
OUTPUT = ROOT / 'SOURCE-ONLY-MANIFEST.json'

PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    CAP: 'e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
    R14_MANIFEST: '68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c',
    R14_SCREEN: '182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd',
    R14_CANDIDATE: '014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845',
}
FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url',
          'language', 'base_commit', 'problem_statement', 'source')
TARGETS = (
    ('https://github.com/ansible/ansible.git', 8),
    ('https://github.com/django/django.git', 8),
    ('https://github.com/huggingface/transformers.git', 8),
    ('https://github.com/sympy/sympy.git', 8),
)
SEED = b'are-g01-r15-post-r14-development-only-lineage-screen-r1\0'


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
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    acceptance, cap = load(ACCEPTANCE), load(CAP)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    if (len(dev) != 903 or len(reserve) != 233 or dev & reserve or
            acceptance['dataset_sha256'] != PINS[PARQUET] or
            cap['unscreened_source_valid_dev'] != 198):
        raise ValueError('partition-or-cap-drift')

    spec = importlib.util.spec_from_file_location('g01_r15_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or load(probe).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    for path in (R13_R1, R13_R2, R14_CANDIDATE):
        seen.update(row['instance_id'] for row in load(path)['ordered_tasks'])
    selected_r14 = {row['instance_id'] for row in load(R14_CANDIDATE)['ordered_tasks']}
    if len(selected_r14) != 24 or not selected_r14 <= seen:
        raise ValueError('r14-exposure-drift')

    screened = set()
    for receipt in load(R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        screened.update(row['instance_id'] for row in load(path)['tasks'])
    screened.update(row['instance_id'] for row in load(R13_SCREEN)['tasks'])
    r14_screened = {row['instance_id'] for row in load(R14_SCREEN)['tasks']}
    r14_manifest_ids = {row['instance_id'] for row in load(R14_MANIFEST)['ordered_tasks']}
    if len(r14_screened) != 67 or r14_screened != r14_manifest_ids:
        raise ValueError('r14-screen-drift')
    screened.update(r14_screened)

    source = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source}) != len(source):
        raise ValueError('duplicate-source-id')
    by_origin = {origin: [] for origin, _ in TARGETS}
    for row in source:
        qid = row['instance_id']
        if row['repo_url'] not in by_origin or qid not in dev or qid in seen or qid in screened:
            continue
        if (row['language'] != 'python' or
                not all(isinstance(row[field], str) and row[field] for field in FIELDS) or
                not re.fullmatch(r'[0-9a-f]{40}', row['base_commit'])):
            continue
        by_origin[row['repo_url']].append(row)
    cap_counts = {row['origin']: row['unscreened_source_valid_dev'] for row in cap['by_origin']}
    r14_counts = Counter(row['repo_url'] for row in load(R14_MANIFEST)['ordered_tasks'])
    for origin, values in by_origin.items():
        if len(values) != cap_counts[origin] - r14_counts[origin]:
            raise ValueError('post-r14-source-count-drift:' + origin)

    chosen = []
    for origin, quota in TARGETS:
        values = sorted(by_origin[origin], key=lambda row:
                        (hashlib.sha256(SEED + row['instance_id'].encode()).hexdigest(), row['instance_id']))
        if len(values) < quota:
            raise ValueError('insufficient-origin-supply:' + origin)
        chosen.extend(values[:quota])
    ids = {row['instance_id'] for row in chosen}
    if len(ids) != 32 or ids & (seen | screened | reserve) or not ids <= dev:
        raise ValueError('selected-source-invalid')
    result = {
        'schema_version': 'are.g01-r15-dev-source-screen-manifest/v1',
        'status': 'source-only-frozen-for-evaluator-screen',
        'seed_hex': SEED.hex(), 'source_fields': FIELDS,
        'target_origins_and_quotas': TARGETS,
        'source_parquet_sha256': PINS[PARQUET],
        'acceptance_sha256': PINS[ACCEPTANCE],
        'r14_cap_receipt_sha256': PINS[CAP],
        'r14_screen_manifest_sha256': PINS[R14_MANIFEST],
        'r14_screen_receipt_sha256': PINS[R14_SCREEN],
        'r14_candidate_sha256': PINS[R14_CANDIDATE],
        'exposure_set_sha256': id_sha(seen),
        'prior_screened_id_set_sha256': id_sha(screened),
        'reserved_partition_id_set_sha256': id_sha(reserve),
        'ordered_tasks': chosen, 'task_id_set_sha256': id_sha(ids),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'authority_effect': 'none',
        'claim_ceiling': 'Changed-cap development-only evaluator-screen draw; no benchmark or superiority result',
        'open_questions': [
            'Which selected rows have mechanically clean exact-base gold lineage?',
            'Can a fresh 24-task cohort pass native-reference and source-index admission?'],
    }
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(chosen),
                      'origins': len(TARGETS), 'manifest_sha256': sha(OUTPUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}))


if __name__ == '__main__':
    main()
