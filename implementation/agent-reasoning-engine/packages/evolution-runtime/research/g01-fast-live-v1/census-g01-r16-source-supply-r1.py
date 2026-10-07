#!/usr/bin/env python3
"""Source-only post-r15 development supply census; no gold or model access."""

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
PRIOR = BASE / 'screen-g01-r15-dev-r1.py'
R15_SCREEN = BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R15_R1 = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R15_R2 = BASE / 'g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
R15_FREEZE = BASE / 'g01-product-replication-r15/CAMPAIGN-FREEZE.json'
OUT = BASE / 'g01-r16-source-supply-r1/SUPPLY-CENSUS.json'
PINS = {
    R15_SCREEN: 'dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf',
    R15_R1: 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551',
    R15_R2: '0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496',
    R15_FREEZE: 'd68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load(path):
    return json.loads(path.read_text())


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if OUT.exists():
        raise ValueError('fresh-exact-output-required')
    spec = importlib.util.spec_from_file_location('prior_g01_screen', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    for path, expected in {**prior.PINS, **PINS}.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    acceptance = load(prior.ACCEPTANCE)
    development = set(acceptance['scope']['development_instances'])
    reserved = set(acceptance['scope']['reserved_confirmation_instances'])
    if len(development) != 903 or len(reserved) != 233 or development & reserved:
        raise ValueError('partition-drift')
    exposure_spec = importlib.util.spec_from_file_location('g01_exposure', prior.EXPOSURE)
    exposure = importlib.util.module_from_spec(exposure_spec)
    exposure_spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or load(probe).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    for path in (prior.R13_R1, prior.R13_R2, prior.R14_CANDIDATE, R15_R1, R15_R2):
        seen.update(row['instance_id'] for row in load(path)['ordered_tasks'])
    r1_ids = {row['instance_id'] for row in load(R15_R1)['ordered_tasks']}
    r2_ids = {row['instance_id'] for row in load(R15_R2)['ordered_tasks']}
    freeze_ids = {row['instance_id'] for row in load(R15_FREEZE)['ordered_tasks']}
    if len(r1_ids) != 24 or len(r2_ids) != 24 or len(r1_ids | r2_ids) != 27 or freeze_ids != r2_ids:
        raise ValueError('r15-selected-id-drift')
    screened = set()
    clean = set()
    for receipt in load(prior.R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        rows = load(path)['tasks']
        screened.update(row['instance_id'] for row in rows)
        clean.update(row['instance_id'] for row in rows if row['gold_lineage_clean'] is True)
    for path in (prior.R13_SCREEN, prior.R14_SCREEN, R15_SCREEN):
        rows = load(path)['tasks']
        screened.update(row['instance_id'] for row in rows)
        clean.update(row['instance_id'] for row in rows if row['gold_lineage_clean'] is True)
    source_rows = pq.read_table(prior.PARQUET, columns=list(prior.FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source_rows}) != len(source_rows):
        raise ValueError('source-duplicate-id')
    eligible = []
    for row in source_rows:
        identifier = row['instance_id']
        if identifier not in development or identifier in reserved or identifier in seen:
            continue
        if not all(isinstance(row[field], str) and row[field] for field in prior.FIELDS):
            continue
        if not re.fullmatch('[0-9a-f]{40}', row['base_commit']):
            continue
        eligible.append(row)
    unscreened = [row for row in eligible if row['instance_id'] not in screened]
    known_clean = [row for row in eligible if row['instance_id'] in clean]
    unscreened_counts = Counter((row['repo_url'], row['language']) for row in unscreened)
    clean_counts = Counter((row['repo_url'], row['language']) for row in known_clean)
    origins = sorted({origin for origin, _ in unscreened_counts | clean_counts})
    by_origin = [{'origin': origin,
                  'unscreened_by_language': dict(sorted((language, count) for (src, language), count
                                                      in unscreened_counts.items() if src == origin)),
                  'known_clean_by_language': dict(sorted((language, count) for (src, language), count
                                                      in clean_counts.items() if src == origin))}
                 for origin in origins]
    result = {
        'schema_version': 'are.g01-r16-source-supply-census/v1',
        'status': 'source-only-census',
        'source_parquet_sha256': prior.PINS[prior.PARQUET],
        'acceptance_sha256': prior.PINS[prior.ACCEPTANCE],
        'r15_candidate_sha256': {'r1': PINS[R15_R1], 'r2': PINS[R15_R2]},
        'r15_freeze_sha256': PINS[R15_FREEZE],
        'r15_conservatively_exposed_selected_ids': len(r1_ids | r2_ids),
        'exposure_set_sha256': id_sha(seen),
        'prior_screened_id_set_sha256': id_sha(screened),
        'reserved_partition_id_set_sha256': id_sha(reserved),
        'unscreened_source_valid': len(unscreened),
        'known_clean_unselected': len(known_clean),
        'by_origin': by_origin,
        'gold_loaded': False, 'model_calls': 0,
        'claim_ceiling': 'Fresh source-only development supply after r15; no label, cache, index, score, or superiority admission',
        'open_questions': [
            'Can a separately sealed source-only screen produce enough clean tasks under an origin-diversity cap?',
            'Can a fresh selected cohort pass native-reference, storage and complete live-pair gates?'],
    }
    OUT.parent.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'unscreened_source_valid': len(unscreened),
                      'known_clean_unselected': len(known_clean), 'origins': len(origins),
                      'receipt_sha256': sha(OUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
