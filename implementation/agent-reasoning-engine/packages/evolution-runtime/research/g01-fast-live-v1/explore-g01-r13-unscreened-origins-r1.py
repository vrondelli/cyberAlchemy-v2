#!/usr/bin/env python3
"""Read-only source-field inventory for additional G01 r13 clean-label screens."""
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
LABEL = BASE / 'g01-product-replication-r12/LABEL-LINEAGE-AUDIT.json'
CENSUS = BASE / 'g01-r13-clean-supply-census-r1/CENSUS.json'
PINS = {PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
        EXPOSURE: 'f2f5bcced7e056542e8f92e3ac0c3ed9bd117ba8c110d99918d185c88e3e8b6a',
        LABEL: '8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f',
        CENSUS: 'fff629cdecce763d671295edf36484c4340b4ed71193a2191ecbd3214ac2e15c'}
FIELDS = ('instance_id', 'repo', 'repo_url', 'language', 'base_commit', 'problem_statement', 'source')


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError('pinned-input-drift')
    label, census = json.loads(LABEL.read_text()), json.loads(CENSUS.read_text())
    spec = importlib.util.spec_from_file_location('g01_r13_exposure', EXPOSURE)
    exposure = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exposure)
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    probe = BASE / 'g01-post-r8-large-index-probe-r2/CONFIG.json'
    if probe not in g01 or json.loads(probe.read_text()).get('model_calls') != 0:
        raise ValueError('zero-call-probe-drift')
    g01.remove(probe)
    seen = set().union(*(exposure.ids_from_manifest(path, 'g01') for path in g01),
                       *(exposure.ids_from_manifest(path, 'g02') for path in g02))
    id_sha = hashlib.sha256(('\n'.join(sorted(seen)) + '\n').encode()).hexdigest()
    if id_sha != census['exposure_set_sha256']:
        raise ValueError('exposure-set-drift')
    screened = set()
    screened_clean = set()
    for receipt in label['screened_receipts']:
        path = Path(receipt['path'])
        if sha(path) != receipt['sha256']:
            raise ValueError('screen-drift')
        for row in json.loads(path.read_text())['tasks']:
            screened.add(row['instance_id'])
            if row['gold_lineage_clean'] is True:
                screened_clean.add(row['instance_id'])
    rows = pq.read_table(PARQUET, columns=list(FIELDS)).to_pylist()
    by_origin = defaultdict(list)
    current_clean_by_origin = Counter()
    for row in rows:
        if row['instance_id'] in screened_clean and row['instance_id'] not in seen:
            current_clean_by_origin[row['repo_url']] += 1
        if (row['instance_id'] in seen or row['instance_id'] in screened or
                not all(isinstance(row[field], str) and row[field] for field in FIELDS)):
            continue
        by_origin[row['repo_url']].append(row)
    ranked = sorted(({'origin': origin,
                      'language': Counter(row['language'] for row in values).most_common(1)[0][0],
                      'tasks': len(values),
                      'already_clean_unmanifested': current_clean_by_origin[origin],
                      'possible_new_origin_slots': max(0, 2 - current_clean_by_origin[origin]),
                      'repos': sorted({row['repo'] for row in values}),
                      'source_types': dict(sorted(Counter(row['source'] for row in values).items()))}
                     for origin, values in by_origin.items()),
                    key=lambda item: (-item['tasks'], item['origin']))
    print(json.dumps({'status': 'read-only-unscreened-source-inventory',
                      'unmanifested_unscreened_tasks': sum(len(rows) for rows in by_origin.values()),
                      'origins': len(by_origin),
                      'possible_added_slots_upper_bound': sum(item['possible_new_origin_slots']
                                                               for item in ranked),
                      'top_origins': ranked[:30],
                      'model_calls': 0,
                      'gold_loaded': False}, sort_keys=True))


if __name__ == '__main__':
    main()
