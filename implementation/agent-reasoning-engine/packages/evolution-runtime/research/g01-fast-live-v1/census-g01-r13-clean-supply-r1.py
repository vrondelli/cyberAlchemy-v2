#!/usr/bin/env python3
"""Score-blind census after r12; all manifested IDs remain conservatively exposed."""
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
CANDIDATE = BASE / 'g01-r12-clean-cohort-candidate-r2/COHORT-CANDIDATE.json'
FREEZE = BASE / 'g01-product-replication-r12/CAMPAIGN-FREEZE.json'
LABEL_JOIN = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
INDEX_R12_R1 = BASE / 'g01-r12-index-gold-coverage-r1/GOLD-INDEX-COVERAGE.json'
OUTPUT = BASE / 'g01-r13-clean-supply-census-r1/CENSUS.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    CANDIDATE: '427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd',
    FREEZE: 'b47ba1b2ea0a540f085758a84cc45599c9fdf6a124e18c144b6e9a8f2c4f6ee4',
    LABEL_JOIN: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    INDEX_R12_R1: 'd1d8bdf797463a31ea865ae381c17da410d0856083f99a84c00f39f2f4463ddd',
}
SOURCE_FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                 'base_commit', 'problem_statement', 'source')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def import_module(path):
    spec = importlib.util.spec_from_file_location('g01_r13_exposure', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError('fresh-exact-output-required')
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    candidate = json.loads(CANDIDATE.read_text())
    freeze = json.loads(FREEZE.read_text())
    label = json.loads(LABEL_JOIN.read_text())
    index_r1 = json.loads(INDEX_R12_R1.read_text())
    if (len(candidate['ordered_tasks']) != 24 or len(freeze['ordered_tasks']) != 24 or
            label['status'] != 'all-selected-mechanically-clean' or
            label['selected_tasks'] != 24 or label['selected_annotations'] != 166 or
            index_r1['summary']['excluded'] != 2):
        raise ValueError('prior-cohort-or-label-shape')
    r12_ids = {row['instance_id'] for row in candidate['ordered_tasks']}
    if (r12_ids != {row['instance_id'] for row in freeze['ordered_tasks']} or
            len(r12_ids) != 24):
        raise ValueError('r12-freeze-drift')
    screened = {}
    screens = []
    for receipt in label['screened_receipts']:
        path = Path(receipt['path'])
        digest = receipt['sha256']
        if (path.parent.parent != BASE or sha(path) != digest or
                candidate['eligibility_receipt_sha256'][receipt['name']] != digest):
            raise ValueError('screen-drift:' + receipt['name'])
        screen = json.loads(path.read_text())
        if (screen.get('gold_paths_or_content_exported') is not False or
                screen.get('model_calls', 0) != 0):
            raise ValueError('screen-boundary:' + receipt['name'])
        for row in screen['tasks']:
            identifier = row['instance_id']
            if identifier in screened:
                raise ValueError('duplicate-screened-id')
            screened[identifier] = row['gold_lineage_clean'] is True
        screens.append({'name': receipt['name'], 'sha256': digest})
    clean = {identifier for identifier, flag in screened.items() if flag}
    if not r12_ids <= clean:
        raise ValueError('r12-not-in-clean-screen')
    exposure = import_module(EXPOSURE)
    g01_paths, g02_paths = exposure.manifest_paths(BASE, RUNS)
    zero_call_probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if (zero_call_probe not in g01_paths or
            json.loads(zero_call_probe.read_text()).get('model_calls') != 0):
        raise ValueError('zero-task-probe-drift')
    g01_paths.remove(zero_call_probe)
    g01_ids = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01_paths))
    g02_ids = set().union(*(exposure.ids_from_manifest(path, 'g02') for path in g02_paths))
    seen = {'union': g01_ids | g02_ids,
            'digests': {'union': id_sha(g01_ids | g02_ids)},
            'counts': {'g01_manifested': len(g01_ids), 'g02_manifested': len(g02_ids),
                       'cross_branch_overlap': len(g01_ids & g02_ids),
                       'union': len(g01_ids | g02_ids)}}
    if not r12_ids <= seen['union']:
        raise ValueError('r12-manifest-not-counted')
    index_excluded = {row['instance_id'] for row in index_r1['rows']
                      if row['excluded_gold_files'] or row['absent_gold_files']}
    if len(index_excluded) != 2:
        raise ValueError('r12-index-exclusions')
    clean.difference_update(seen['union'] | index_excluded)
    source_rows = pq.read_table(PARQUET, columns=list(SOURCE_FIELDS)).to_pylist()
    source = {row['instance_id']: row for row in source_rows}
    if len(source) != len(source_rows) or not clean <= source.keys():
        raise ValueError('source-join-invalid')
    eligible = []
    for identifier in sorted(clean):
        row = source[identifier]
        if not all(isinstance(row[field], str) and row[field] for field in SOURCE_FIELDS):
            raise ValueError('source-field-invalid')
        eligible.append(row)
    by_language = Counter(row['language'] for row in eligible)
    by_origin = defaultdict(list)
    for row in eligible:
        by_origin[row['repo_url']].append(row)
    origin_cap = sum(min(2, len(rows)) for rows in by_origin.values())
    by_language_cap = Counter()
    for rows in by_origin.values():
        for language, count in Counter(row['language'] for row in rows).items():
            by_language_cap[language] += min(2, count)
    result = {
        'schema_version': 'are.g01-r13-clean-source-supply-census/v1',
        'status': 'source-only-census-not-selected',
        'source_parquet_sha256': PINS[PARQUET],
        'exposure_helper_sha256': PINS[EXPOSURE],
        'exposure_set_sha256': seen['digests']['union'],
        'exposure_counts': seen['counts'],
        'r12_frozen_id_set_sha256': id_sha(r12_ids),
        'r12_freeze_sha256': PINS[FREEZE],
        'screen_receipts': screens,
        'screened_ids': len(screened),
        'clean_unmanifested_ids': len(eligible),
        'clean_unmanifested_id_set_sha256': id_sha(clean),
        'by_language': dict(sorted(by_language.items())),
        'git_origins': len(by_origin),
        'two_per_origin_capacity_upper_bound': origin_cap,
        'by_language_two_per_origin_upper_bound': dict(sorted(by_language_cap.items())),
        'r12_r1_index_exclusions_not_reused': len(index_excluded),
        'source_fields_only': list(SOURCE_FIELDS),
        'gold_paths_or_content_exported': False,
        'model_calls': 0,
        'script_sha256': sha(Path(__file__)),
        'claim_ceiling': 'Conservative source-only clean supply after r12; capacity upper bounds do not establish index/gold admission or a new cohort',
        'open_questions': [
            'Is the remaining clean population large and diverse enough for a 24-task successor?',
            'Which additional unscreened source rows can be independently qualified without reusing r12 manifested IDs?'
        ]
    }
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
    print(json.dumps({'status': result['status'],
                      'clean_unmanifested_ids': len(eligible),
                      'by_language': result['by_language'],
                      'git_origins': len(by_origin),
                      'two_per_origin_capacity_upper_bound': origin_cap,
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
