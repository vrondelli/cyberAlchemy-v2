#!/usr/bin/env python3
"""Source-only clean-supply census, excluding every r13 r1/r2 selected ID."""
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
R13_FREEZE = BASE / 'g01-product-replication-r13/CAMPAIGN-FREEZE.json'
OUTPUT = BASE / 'g01-post-r13-clean-supply-census-r1/CENSUS.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    R13_FREEZE: '0f67532e8a8367d4f8b275c07db638c23405a12fa865dc66904ae2a44ec2007d',
}
FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
          'base_commit', 'problem_statement', 'source')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def rows_ids(path):
    rows = json.loads(path.read_text())['ordered_tasks']
    ids = {row['instance_id'] for row in rows}
    if len(rows) != 24 or len(ids) != 24:
        raise ValueError('selected-cohort-shape:' + str(path))
    return ids


def main():
    if OUTPUT.exists() or OUTPUT.parent.exists():
        raise ValueError('fresh-output-root-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g01_post_r13_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01_paths, g02_paths = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01_paths or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01_paths.remove(probe)
    g01_ids = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01_paths))
    g02_ids = set().union(*(exposure.ids_from_manifest(path, 'g02') for path in g02_paths))
    seen = {'union': g01_ids | g02_ids,
            'counts': {'g01_manifested': len(g01_ids), 'g02_manifested': len(g02_ids),
                       'cross_branch_overlap': len(g01_ids & g02_ids), 'union': len(g01_ids | g02_ids)},
            'digests': {'union': id_sha(g01_ids | g02_ids)}}
    r1_ids, r2_ids, freeze_ids = (rows_ids(path) for path in (R13_R1, R13_R2, R13_FREEZE))
    if r2_ids != freeze_ids or len(r1_ids | r2_ids) != 25:
        raise ValueError('r13-lineage-shape')
    r12_label = json.loads(R12_LABEL.read_text())
    r13_screen = json.loads(R13_SCREEN.read_text())
    if (r13_screen['summary']['tasks'] != 56 or r13_screen['summary']['clean'] != 18 or
            r13_screen['model_calls'] != 0 or r13_screen['gold_paths_or_content_exported'] is not False):
        raise ValueError('r13-screen-shape')
    screened = {}
    receipts = []
    for receipt in r12_label['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        data = json.loads(path.read_text())
        if data.get('model_calls', 0) != 0 or data.get('gold_paths_or_content_exported') is not False:
            raise ValueError('prior-screen-boundary')
        for row in data['tasks']:
            identifier = row['instance_id']
            if identifier in screened:
                raise ValueError('duplicate-screened-id')
            screened[identifier] = row['gold_lineage_clean'] is True
        receipts.append({'path': str(path), 'sha256': receipt['sha256']})
    for row in r13_screen['tasks']:
        identifier = row['instance_id']
        if identifier in screened:
            raise ValueError('duplicate-r13-screen-id')
        screened[identifier] = row['gold_lineage_clean'] is True
    clean = {identifier for identifier, value in screened.items() if value}
    excluded = seen['union'] | r1_ids | r2_ids
    if not freeze_ids <= excluded:
        raise ValueError('freeze-not-excluded')
    available = clean - excluded
    source_rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not available <= source.keys():
        raise ValueError('source-join')
    by_language, by_origin = Counter(), defaultdict(list)
    for identifier in sorted(available):
        row = source[identifier]
        if not all(isinstance(row[field], str) and row[field] for field in FIELDS):
            raise ValueError('source-field-invalid')
        by_language[row['language']] += 1
        by_origin[row['repo_url']].append(row)
    cap = sum(min(2, len(rows)) for rows in by_origin.values())
    result = {
        'schema_version': 'are.g01-post-r13-clean-source-supply-census/v1',
        'status': 'source-only-census-not-selected',
        'input_sha256': {str(path): digest for path, digest in PINS.items()},
        'exposure_counts': seen['counts'], 'exposure_set_sha256': seen['digests']['union'],
        'r13_r1_id_set_sha256': id_sha(r1_ids), 'r13_r2_id_set_sha256': id_sha(r2_ids),
        'r13_frozen_id_set_sha256': id_sha(freeze_ids),
        'r13_candidate_union_ids_excluded': len(r1_ids | r2_ids),
        'screen_receipts': receipts,
        'screened_ids': len(screened), 'screened_clean_ids': len(clean),
        'clean_unexposed_ids': len(available), 'clean_unexposed_id_set_sha256': id_sha(available),
        'by_language': dict(sorted(by_language.items())), 'git_origins': len(by_origin),
        'two_per_origin_capacity_upper_bound': cap,
        'by_origin_counts': {origin: len(rows) for origin, rows in sorted(by_origin.items())},
        'source_fields_only': list(FIELDS), 'gold_paths_or_content_exported': False,
        'model_calls': 0, 'script_sha256': sha(Path(__file__)),
        'claim_ceiling': 'Previously screened clean source supply only; no fresh cohort, native-reference admission, model score, or superiority',
        'open_questions': ['Is a full fresh 24-task cohort possible under the two-per-origin cap?',
                           'Which as-yet-unscreened source rows can pass evaluator-only lineage and native-reference admission?'],
    }
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'], 'clean_unexposed_ids': len(available),
                      'git_origins': len(by_origin), 'two_per_origin_capacity_upper_bound': cap,
                      'by_language': dict(sorted(by_language.items())), 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
