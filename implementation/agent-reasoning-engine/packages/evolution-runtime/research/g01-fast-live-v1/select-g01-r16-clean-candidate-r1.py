#!/usr/bin/env python3
"""Score-blind post-r15 G01 cohort from sealed clean development supply."""

from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
PRIOR = BASE / 'screen-g01-r15-dev-r1.py'
CENSUS = BASE / 'g01-r16-source-supply-r1/SUPPLY-CENSUS.json'
MANIFEST = BASE / 'g01-r16-dev-screen-r1/SOURCE-ONLY-MANIFEST.json'
SCREEN = BASE / 'g01-r16-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R15_SCREEN = BASE / 'g01-r15-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json'
R15_R1 = BASE / 'g01-r15-clean-cohort-candidate-r1/COHORT-CANDIDATE.json'
R15_R2 = BASE / 'g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
ROOT = BASE / 'g01-r16-clean-cohort-candidate-r1'
OUT = ROOT / 'COHORT-CANDIDATE.json'
PINS = {
    CENSUS: '35b8990980132ce22cb8faf657c4087aea4d7cec0a615f0ad7fd7efb8b28e757',
    MANIFEST: '6f969430e052295d9bf495078589a39379518bb7747a6c8ac9beee00556e446d',
    SCREEN: '646c3d367332531c8d7bd82d225ded47edadccc08230e395e00c965515aea5f0',
    R15_SCREEN: 'dbc20b1c2462395326ad508d8c08e6855a7e81c6c8aa20d1e19ea9e446016eaf',
    R15_R1: 'a92236424aed884f6abf962fb4cb9670fd44be32cc4e6b477a1b6ffddae83551',
    R15_R2: '0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496',
}
SEED = b'are-g01-r16-clean-development-round-robin-cap-eight-r1\0'


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
    census, manifest, screen = load(CENSUS), load(MANIFEST), load(SCREEN)
    acceptance = load(prior.ACCEPTANCE)
    dev = set(acceptance['scope']['development_instances'])
    reserve = set(acceptance['scope']['reserved_confirmation_instances'])
    if (screen['source_manifest_sha256'] != PINS[MANIFEST] or
            screen['status'] != 'evaluator-only-no-model-no-scores' or
            screen['model_calls'] != 0 or screen['gold_paths_or_content_exported'] is not False or
            screen['summary']['tasks'] != 99 or screen['summary']['clean'] != 31 or
            {row['instance_id'] for row in screen['tasks']} !=
            {row['instance_id'] for row in manifest['ordered_tasks']}):
        raise ValueError('r16-screen-drift')
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
    if id_sha(seen) != census['exposure_set_sha256']:
        raise ValueError('exposure-drift')
    clean = set()
    for receipt in load(prior.R12_LABEL)['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    for path in (prior.R13_SCREEN, prior.R14_SCREEN, R15_SCREEN, SCREEN):
        clean.update(row['instance_id'] for row in load(path)['tasks']
                     if row['gold_lineage_clean'] is True)
    clean = (clean - seen) & dev
    if len(clean) != 36 or clean & reserve or census['known_clean_unselected'] != 5:
        raise ValueError('clean-supply-drift')
    source_rows = pq.read_table(prior.PARQUET, columns=list(prior.FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-drift')
    by_origin = {}
    for identifier in clean:
        row = source[identifier]
        by_origin.setdefault(row['repo_url'], []).append(row)
    origins = sorted(by_origin, key=lambda origin:
                     (hashlib.sha256(SEED + b'origin\0' + origin.encode()).hexdigest(), origin))
    for origin in origins:
        by_origin[origin].sort(key=lambda row:
            (hashlib.sha256(SEED + b'task\0' + row['instance_id'].encode()).hexdigest(),
             row['instance_id']))
    selected = []
    for tier in range(8):
        for origin in origins:
            if tier < len(by_origin[origin]):
                selected.append(by_origin[origin][tier])
                if len(selected) == 24:
                    break
        if len(selected) == 24:
            break
    counts = Counter(row['repo_url'] for row in selected)
    languages = Counter(row['language'] for row in selected)
    if (len(selected) != 24 or len({row['instance_id'] for row in selected}) != 24 or
            len(counts) != 5 or max(counts.values()) > 8 or
            languages != {'python': 21, 'typescript': 3} or
            {row['instance_id'] for row in selected} & (seen | reserve)):
        raise ValueError('candidate-shape')
    result = {
        'schema_version': 'are.g01-r16-development-cap-eight-candidate-r1/v1',
        'status': 'preflight-only-not-frozen',
        'source_partition': 'pinned-903-development',
        'source_parquet_sha256': prior.PINS[prior.PARQUET],
        'acceptance_sha256': prior.PINS[prior.ACCEPTANCE],
        'reserved_partition_id_set_sha256': id_sha(reserve),
        'exposure_set_sha256': id_sha(seen),
        'r16_source_manifest_sha256': PINS[MANIFEST],
        'r16_eligibility_sha256': PINS[SCREEN],
        'seed_hex': SEED.hex(), 'max_tasks_per_git_origin': 8,
        'selection_rule': 'seeded origin order, seeded task order, round-robin origin tiers up to cap eight and 24 tasks; only Boolean exact-base lineage eligibility',
        'ordered_tasks': selected, 'task_id_set_sha256': id_sha(row['instance_id'] for row in selected),
        'selected_git_origins': len(counts),
        'language_counts': dict(sorted(languages.items())),
        'by_origin': dict(sorted(counts.items())),
        'selector_sha256': sha(Path(__file__)),
        'gold_values_or_paths_used': False, 'model_calls': 0,
        'claim_ceiling': 'Changed-origin development preflight candidate only; no native-reference admission, matched score or superiority',
        'open_questions': [
            'Will the exact 24 tasks pass cache, bounded-index and native-reference admission?',
            'Can an opt-in late-binding campaign finish all matched pairs and its predeclared quality/efficiency gates?'],
    }
    ROOT.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'tasks': len(selected),
                      'by_origin': result['by_origin'], 'language_counts': result['language_counts'],
                      'candidate_sha256': sha(OUT),
                      'task_id_set_sha256': result['task_id_set_sha256']}, sort_keys=True))


if __name__ == '__main__':
    main()
