#!/usr/bin/env python3
"""Select 24 development-only label-clean G01 tasks under cap three."""
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq

BASE = Path('/opt/are/evolution-runtime')
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
SCREEN_SCRIPT = BASE / 'g01-r14-dev-screen-r1/screen-g01-r14-dev-r1.py'
SCREEN_MANIFEST = BASE / 'g01-r14-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
SCREEN_RESULT = BASE / 'g01-r14-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
CAP = BASE / 'g01-r14-dev-cap-r1/RESULT.json'
ACCEPTANCE = BASE / 'g01-r14-dev-cap-r1/acceptance.json'
R45 = BASE / 'g01-r13-r45-source-qualification-r1/SOURCE-QUALIFICATION.json'
OUTPUT = BASE / 'g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    SCREEN_SCRIPT: '9b2ef099c4de55a5681b1cc52a6c931c042c75833e3806397aefd5a9373e2698',
    SCREEN_MANIFEST: '68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c',
    SCREEN_RESULT: '182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd',
    CAP: 'e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d',
    ACCEPTANCE: 'fc305d5e220dc73dc3f98b06ae9c8aa71c10b1f3adf9e9a52c72ee4e302b8171',
    R45: 'c510b10f05df09cec57bcace74a6c10d551f925aa22f2826580f96dca6442af6',
}
SEED = b'are-g01-r14-development-cap-three-cohort-r1\0'
LANGUAGE_QUOTAS = {'python': 21, 'typescript': 3}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if OUTPUT.exists() or OUTPUT.parent.exists() or any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('fresh-output-or-pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g01_r14_screen', SCREEN_SCRIPT)
    screen_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(screen_module)
    selected_screen, exposure_sha, screened_sha, reserve_sha = screen_module.source_basis()
    manifest, result = json.loads(SCREEN_MANIFEST.read_text()), json.loads(SCREEN_RESULT.read_text())
    if (manifest['ordered_tasks'] != selected_screen or manifest['selector_sha256'] != PINS[SCREEN_SCRIPT] or
            result['source_manifest_sha256'] != PINS[SCREEN_MANIFEST] or result['script_sha256'] != PINS[SCREEN_SCRIPT] or
            result['summary']['clean'] != 22 or result['model_calls'] != 0 or
            result['gold_paths_or_content_exported'] is not False or
            manifest['exposure_set_sha256'] != exposure_sha or
            manifest['prior_screened_id_set_sha256'] != screened_sha or
            manifest['reserved_partition_id_set_sha256'] != reserve_sha):
        raise ValueError('screen-lineage-drift')
    prior = json.loads(screen_module.R12_LABEL.read_text())
    clean = set()
    for receipt in prior['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in json.loads(path.read_text())['tasks'] if row['gold_lineage_clean'] is True)
    clean.update(row['instance_id'] for row in json.loads(screen_module.R13_SCREEN.read_text())['tasks']
                 if row['gold_lineage_clean'] is True)
    fresh = {row['instance_id'] for row in result['tasks'] if row['gold_lineage_clean'] is True}
    if len(fresh) != 22 or fresh & clean:
        raise ValueError('fresh-clean-count-or-overlap')
    exposure = screen_module.module(screen_module.EXPOSURE, 'g01_r14_candidate_exposure')
    g01, g02 = exposure.manifest_paths(screen_module.BASE, screen_module.RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    seen.update(row['instance_id'] for path in (screen_module.R13_R1, screen_module.R13_R2)
                for row in json.loads(path.read_text())['ordered_tasks'])
    if id_sha(seen) != exposure_sha or fresh & seen:
        raise ValueError('exposure-drift')
    acceptance = json.loads(ACCEPTANCE.read_text())
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    clean = (clean | fresh) - seen
    clean &= dev
    if len(clean) != 45 or clean & reserve:
        raise ValueError('development-clean-drift')
    source_rows = pq.read_table(PARQUET, columns=list(screen_module.SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-drift')
    by_origin = defaultdict(list)
    for identifier in clean:
        row = source[identifier]
        if not all(isinstance(row[field], str) and row[field] for field in screen_module.SOURCE_FIELDS):
            raise ValueError('clean-source-invalid')
        by_origin[row['repo_url']].append(row)
    if sum(min(3, len(rows)) for rows in by_origin.values()) != 27:
        raise ValueError('cap-three-drift')
    chosen = []
    origin_counts = Counter()
    for language, quota in LANGUAGE_QUOTAS.items():
        origins = sorted((origin for origin, rows in by_origin.items() if rows[0]['language'] == language),
                         key=lambda origin: (hashlib.sha256(SEED + b'origin\0' + origin.encode()).hexdigest(), origin))
        ranked = {origin: sorted(by_origin[origin], key=lambda row:
                                 (hashlib.sha256(SEED + b'task\0' + row['instance_id'].encode()).hexdigest(), row['instance_id']))
                  for origin in origins}
        picked = 0
        for tier in range(3):
            for origin in origins:
                if picked >= quota or tier >= len(ranked[origin]):
                    continue
                row = ranked[origin][tier]
                chosen.append(row)
                origin_counts[origin] += 1
                picked += 1
        if picked != quota:
            raise ValueError('language-quota-capacity:' + language)
    ids = {row['instance_id'] for row in chosen}
    if (len(chosen) != 24 or len(ids) != 24 or ids & (seen | reserve) or
            not ids <= clean or max(origin_counts.values()) > 3 or
            Counter(row['language'] for row in chosen) != LANGUAGE_QUOTAS):
        raise ValueError('candidate-shape')
    candidate = {'schema_version': 'are.g01-r14-development-cap-three-candidate/v1',
                 'status': 'preflight-only-not-frozen', 'seed_hex': SEED.hex(),
                 'changed_population_from_r13': True, 'source_partition': 'original ContextBench development 903 IDs only',
                 'language_quota': LANGUAGE_QUOTAS, 'max_tasks_per_git_origin': 3,
                 'source_parquet_sha256': PINS[PARQUET], 'acceptance_sha256': PINS[ACCEPTANCE],
                 'exposure_set_sha256': exposure_sha, 'reserved_partition_id_set_sha256': reserve_sha,
                 'r45_source_qualification_sha256': PINS[R45], 'dev_cap_receipt_sha256': PINS[CAP],
                 'fresh_screen_manifest_sha256': PINS[SCREEN_MANIFEST],
                 'fresh_screen_receipt_sha256': PINS[SCREEN_RESULT],
                 'known_clean_dev': len(clean), 'known_cap_three_slots': 27,
                 'ordered_tasks': chosen, 'task_id_set_sha256': id_sha(ids),
                 'selected_git_origins': len(origin_counts), 'selector_sha256': sha(Path(__file__)),
                 'gold_values_or_paths_used': False, 'model_calls': 0, 'authority_effect': 'none',
                 'claim_ceiling': 'Source-only two-language development candidate; cache, index, native gold, storage, scores, and superiority unproven',
                 'open_questions': ['Do all 24 exact caches, checkouts, and indexes pass?',
                                    'Does evaluator-only native-reference admission pass 24/24?',
                                    'Can a separate freeze and matched run meet the strict gate?']}
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': candidate['status'], 'tasks': len(chosen),
                      'by_language': dict(Counter(row['language'] for row in chosen)),
                      'git_origins': candidate['selected_git_origins'],
                      'candidate_sha256': sha(OUTPUT), 'task_id_set_sha256': candidate['task_id_set_sha256'],
                      'model_calls': 0}, sort_keys=True))


if __name__ == '__main__':
    main()
