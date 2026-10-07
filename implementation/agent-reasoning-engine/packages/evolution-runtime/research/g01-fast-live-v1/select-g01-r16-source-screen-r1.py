#!/usr/bin/env python3
"""Seal every remaining source-valid, unscreened post-r15 development task."""

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
CENSUS = BASE / 'g01-r16-source-supply-r1/SUPPLY-CENSUS.json'
R15_SCREEN = BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R15_R1 = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R15_R2 = BASE / 'g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
ROOT = BASE / 'g01-r16-dev-screen-r1'
OUT = ROOT / 'SOURCE-ONLY-MANIFEST.json'
PINS = {
    CENSUS: '35b8990980132ce22cb8faf657c4087aea4d7cec0a615f0ad7fd7efb8b28e757',
    R15_SCREEN: 'dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf',
    R15_R1: 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551',
    R15_R2: '0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496',
}
SEED = b'are-g01-r16-all-remaining-development-source-screen-r1\0'


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
    if ROOT.exists():
        raise ValueError('fresh-exact-output-required')
    spec = importlib.util.spec_from_file_location('prior_g01_screen', PRIOR)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    for path, expected in {**prior.PINS, **PINS}.items():
        if sha(path) != expected:
            raise ValueError('pinned-input-drift:' + str(path))
    census = load(CENSUS)
    acceptance = load(prior.ACCEPTANCE)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    if len(dev) != 903 or len(reserve) != 233 or dev & reserve:
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
    screened = set()
    for receipt in load(prior.R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        screened.update(row['instance_id'] for row in load(path)['tasks'])
    for path in (prior.R13_SCREEN, prior.R14_SCREEN, R15_SCREEN):
        screened.update(row['instance_id'] for row in load(path)['tasks'])
    if (id_sha(seen) != census['exposure_set_sha256'] or
            id_sha(screened) != census['prior_screened_id_set_sha256'] or
            id_sha(reserve) != census['reserved_partition_id_set_sha256']):
        raise ValueError('census-exposure-drift')
    source = pq.read_table(prior.PARQUET, columns=list(prior.FIELDS)).to_pylist()
    if len({row['instance_id'] for row in source}) != len(source):
        raise ValueError('source-duplicate-id')
    rows = [row for row in source
            if row['instance_id'] in dev and row['instance_id'] not in reserve and
            row['instance_id'] not in seen and row['instance_id'] not in screened and
            all(isinstance(row[field], str) and row[field] for field in prior.FIELDS) and
            re.fullmatch('[0-9a-f]{40}', row['base_commit'])]
    counts = Counter((row['repo_url'], row['language']) for row in rows)
    expected = Counter({(entry['origin'], language): count
                        for entry in census['by_origin']
                        for language, count in entry['unscreened_by_language'].items()})
    if len(rows) != 99 or len({row['instance_id'] for row in rows}) != 99 or counts != expected:
        raise ValueError('source-supply-drift')
    rows.sort(key=lambda row: (row['repo_url'], row['language'],
              hashlib.sha256(SEED + row['instance_id'].encode()).hexdigest(), row['instance_id']))
    result = {
        'schema_version': 'are.g01-r16-source-screen-manifest/v1',
        'status': 'source-only-frozen-for-evaluator-screen',
        'source_partition': 'pinned-903-development',
        'source_parquet_sha256': prior.PINS[prior.PARQUET],
        'acceptance_sha256': prior.PINS[prior.ACCEPTANCE],
        'supply_census_sha256': PINS[CENSUS],
        'seed_hex': SEED.hex(), 'source_fields': prior.FIELDS,
        'selection_rule': 'all 99 still-unscreened source-valid development rows after conservative exposure exclusion, ordered by origin/language/seeded id hash',
        'ordered_tasks': rows, 'task_id_set_sha256': id_sha(row['instance_id'] for row in rows),
        'exposure_set_sha256': id_sha(seen),
        'prior_screened_id_set_sha256': id_sha(screened),
        'reserved_partition_id_set_sha256': id_sha(reserve),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'Source-only evaluator screen draw, not a cohort selection or benchmark result',
        'open_questions': [
            'How many of the 99 have mechanically clean exact-base label lineage?',
            'Can a fresh 24-task cohort be selected under a declared origin cap and pass native-reference admission?'],
    }
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(rows),
                      'origins': len({row['repo_url'] for row in rows}),
                      'manifest_sha256': sha(OUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
