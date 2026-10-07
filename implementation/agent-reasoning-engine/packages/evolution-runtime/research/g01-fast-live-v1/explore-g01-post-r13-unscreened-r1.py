#!/usr/bin/env python3
"""Read-only, source-field-only inventory for score-blind post-r13 screening."""
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
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
CENSUS = BASE / 'g01-post-r13-clean-supply-census-r1/CENSUS.json'
PINS = {
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
    R12_LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
    R13_SCREEN: '67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc',
    R13_R1: '86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5',
    R13_R2: 'e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d',
    CENSUS: 'd74a2e95232bbb4d68d61f49e4600f9465d09400bf856ed82ec91446a63be320',
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


def main():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    census = json.loads(CENSUS.read_text())
    spec = importlib.util.spec_from_file_location('g01_post_r13_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-task-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    seen.update(row['instance_id'] for path in (R13_R1, R13_R2)
                for row in json.loads(path.read_text())['ordered_tasks'])
    screened = set()
    for receipt in json.loads(R12_LABEL.read_text())['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('prior-screen-drift')
        screened.update(row['instance_id'] for row in json.loads(path.read_text())['tasks'])
    screened.update(row['instance_id'] for row in json.loads(R13_SCREEN.read_text())['tasks'])
    if len(screened) != census['screened_ids']:
        raise ValueError('screened-count-drift')
    rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    by_origin = defaultdict(list)
    for row in rows:
        if (row['instance_id'] in seen or row['instance_id'] in screened or
                not all(isinstance(row[field], str) and row[field] for field in FIELDS) or
                len(row['base_commit']) != 40):
            continue
        by_origin[row['repo_url']].append(row)
    prior = census['by_origin_counts']
    inventory = [{'origin': origin, 'unscreened': len(values),
                  'languages': dict(sorted(Counter(row['language'] for row in values).items())),
                  'already_clean': prior.get(origin, 0),
                  'possible_added_slots': max(0, 2-prior.get(origin, 0))}
                 for origin, values in by_origin.items()]
    inventory.sort(key=lambda row: (-row['possible_added_slots'], -row['unscreened'], row['origin']))
    print(json.dumps({'status': 'read-only-source-only-inventory',
                      'unscreened_source_valid': sum(len(values) for values in by_origin.values()),
                      'origins': len(by_origin),
                      'possible_added_slots_upper_bound': sum(row['possible_added_slots'] for row in inventory),
                      'top_origins': inventory[:40], 'model_calls': 0, 'gold_loaded': False}, sort_keys=True))


if __name__ == '__main__':
    main()
