#!/usr/bin/env python3
"""Select one score-blind G01 r15 development candidate under cap eight."""

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
EXPOSURE = BASE / 'g01-span-refinement-tools-r3/audit-cross-branch-supply-r1.py'
R12_LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
R13_SCREEN = BASE / 'g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R13_R1 = BASE / 'g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R13_R2 = BASE / 'g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
R14_MANIFEST = BASE / 'g01-r14-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
R14_SCREEN = BASE / 'g01-r14-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R14_CANDIDATE = BASE / 'g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R15_MANIFEST = BASE / 'g01-r15-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
R15_SCREEN = BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
SUPPLY = BASE / 'g01-r15-dev-screen-r1/SUPPLY-AUDIT.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
R46 = BASE / 'g01-r14-r46-source-evidence-r1/SOURCE-QUALIFICATION.json'
ROOT = BASE / 'g01-r15-clean-cohort-candidate-r1'
OUTPUT = ROOT / 'COHORT-CANDIDATE.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    R14_MANIFEST: '68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c',
    R14_SCREEN: '182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd',
    R14_CANDIDATE: '014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845',
    R15_MANIFEST: '5901c25e4ad341689df104260a24974035a61c217db8aca7d081adcf792ce60a',
    R15_SCREEN: 'dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf',
    SUPPLY: '7e99cbc4ed738af83416d61a5e1ad2e6c0715091adc698eb0d434b06289c5538',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
    R46: 'df9f803944461aec3f27e5babdec762fd5675da212766e566fd689a189955b66',
}
FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url',
          'language', 'base_commit', 'problem_statement', 'source')
SEED = b'are-g01-r15-development-cap-eight-cohort-r1\0'
LANGUAGE_QUOTAS = {'python': 18, 'typescript': 6}
CAP = 8


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
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    manifest15, screen15, supply = load(R15_MANIFEST), load(R15_SCREEN), load(SUPPLY)
    if (manifest15['gold_values_or_paths_used'] is not False or
            manifest15['model_calls'] != 0 or
            screen15['gold_paths_or_content_exported'] is not False or
            screen15['model_calls'] != 0 or
            screen15['source_manifest_sha256'] != PINS[R15_MANIFEST] or
            supply['remaining_clean'] != 32 or supply['cap_eight_slots'] != 30):
        raise ValueError('screen-or-supply-drift')
    clean = set()
    for receipt in load(R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    for path in (R13_SCREEN, R14_SCREEN, R15_SCREEN):
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)

    spec = importlib.util.spec_from_file_location('g01_r15_candidate_exposure', EXPOSURE)
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
    if id_sha(seen) != manifest15['exposure_set_sha256']:
        raise ValueError('exposure-drift')
    acceptance = load(ACCEPTANCE)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    clean = (clean - seen) & dev
    if len(clean) != 32 or clean & reserve or id_sha(reserve) != manifest15['reserved_partition_id_set_sha256']:
        raise ValueError('development-clean-drift')
    source_rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-drift')
    by_origin = defaultdict(list)
    for identifier in clean:
        row = source[identifier]
        if not all(isinstance(row[field], str) and row[field] for field in FIELDS):
            raise ValueError('clean-source-invalid')
        by_origin[row['repo_url']].append(row)
    if sum(min(CAP, len(rows)) for rows in by_origin.values()) != 30:
        raise ValueError('cap-eight-drift')

    chosen = []
    origin_counts = Counter()
    for language, quota in LANGUAGE_QUOTAS.items():
        origins = sorted((origin for origin, rows in by_origin.items()
                          if rows[0]['language'] == language),
                         key=lambda origin: (hashlib.sha256(SEED + b'origin\0' + origin.encode()).hexdigest(), origin))
        ranked = {origin: sorted(by_origin[origin], key=lambda row:
                                 (hashlib.sha256(SEED + b'task\0' + row['instance_id'].encode()).hexdigest(),
                                  row['instance_id'])) for origin in origins}
        picked = 0
        for tier in range(CAP):
            for origin in origins:
                if picked >= quota or tier >= len(ranked[origin]):
                    continue
                chosen.append(ranked[origin][tier])
                origin_counts[origin] += 1
                picked += 1
        if picked != quota:
            raise ValueError('language-quota-capacity:' + language)
    ids = {row['instance_id'] for row in chosen}
    if (len(chosen) != 24 or len(ids) != 24 or ids & (seen | reserve) or
            not ids <= clean or max(origin_counts.values()) > CAP or
            Counter(row['language'] for row in chosen) != LANGUAGE_QUOTAS):
        raise ValueError('candidate-shape')
    candidate = {
        'schema_version': 'are.g01-r15-development-cap-eight-candidate/v1',
        'status': 'preflight-only-not-frozen', 'seed_hex': SEED.hex(),
        'changed_population_from_r14': True,
        'source_partition': 'original ContextBench development 903 IDs only',
        'language_quota': LANGUAGE_QUOTAS,
        'max_tasks_per_git_origin': CAP,
        'source_parquet_sha256': PINS[PARQUET],
        'acceptance_sha256': PINS[ACCEPTANCE],
        'exposure_set_sha256': id_sha(seen),
        'reserved_partition_id_set_sha256': id_sha(reserve),
        'r46_source_qualification_sha256': PINS[R46],
        'r15_source_manifest_sha256': PINS[R15_MANIFEST],
        'r15_screen_receipt_sha256': PINS[R15_SCREEN],
        'r15_supply_audit_sha256': PINS[SUPPLY],
        'known_clean_dev': len(clean), 'known_cap_eight_slots': 30,
        'ordered_tasks': chosen, 'task_id_set_sha256': id_sha(ids),
        'selected_git_origins': len(origin_counts),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'authority_effect': 'none',
        'claim_ceiling': 'Development-only two-language changed-cap candidate; cache/index/reference/storage, matched scores, and superiority unproven',
        'open_questions': [
            'Do all 24 exact caches, checkouts, source indexes, and native references pass?',
            'Can a separate freeze and matched run meet the strict 24/24 gate?'],
    }
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': candidate['status'], 'tasks': len(chosen),
                      'by_language': dict(Counter(row['language'] for row in chosen)),
                      'by_origin': dict(sorted(origin_counts.items())),
                      'candidate_sha256': sha(OUTPUT),
                      'task_id_set_sha256': candidate['task_id_set_sha256'],
                      'model_calls': 0}, sort_keys=True))


if __name__ == '__main__':
    main()
