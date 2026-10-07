#!/usr/bin/env python3
"""Count untouched source-valid ContextBench development rows after r11."""

from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
RUNS = Path('/opt/are-benchmark-runs')
SOURCE = BASE / 'derive-g02-r11-dev-pool-r1.py'
SOURCE_SHA = '9b7cd5c511adeecda5d181c94a6f0c6a7167df6c3611b8ac7781259ff20482a7'
POOL = BASE / 'g02-r11-dev-pool-r1/POOL.json'
POOL_SHA = '99801b07c14fbb53a27e9d89cbba6648e12e64514bb904d4e5b7c59608878d8b'
OUTPUT = BASE / 'g02-post-r11-source-census-r1/CENSUS.json'


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-post-r11-census.' + reason)


def main():
    need(sha(SOURCE) == SOURCE_SHA and sha(POOL) == POOL_SHA and
         not OUTPUT.exists() and not OUTPUT.parent.exists(), 'source-or-output-drift')
    spec = importlib.util.spec_from_file_location('g02_r11_source', SOURCE)
    source = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    for path, digest in source.PINS.items():
        need(path.is_file() and sha(path) == digest, 'pinned-input-drift')
    for path, (digest, _) in source.PRIOR.items():
        need(path.is_file() and sha(path) == digest, 'prior-input-drift')
    exposure_spec = importlib.util.spec_from_file_location('g02_r11_exposure', source.EXPOSURE)
    exposure = importlib.util.module_from_spec(exposure_spec)
    exposure_spec.loader.exec_module(exposure)
    acceptance = json.loads(source.ACCEPTANCE.read_text())
    development = set(acceptance['scope']['development_instances'])
    reserved = set(acceptance['scope']['reserved_confirmation_instances'])
    need(len(development) == 903 and len(reserved) == 233 and
         not development & reserved, 'partition-drift')
    pool = json.loads(POOL.read_text())
    pool_ids = {row['instance_id'] for row in pool['ordered_pool']}
    need(len(pool['ordered_pool']) == len(pool_ids) == 32 and
         pool_ids <= development and not pool_ids & reserved, 'pool-shape')
    g01, g02 = exposure.manifest_paths(BASE, RUNS)
    seen = set(pool_ids)
    bindings = [{'kind': 'screened-pool', 'path': str(POOL), 'sha256': POOL_SHA,
                 'id_count': len(pool_ids)}]
    for branch, paths in (('g01', g01), ('g02', g02)):
        for path in paths:
            if branch == 'g01' and path.name == 'CONFIG.json':
                config = json.loads(path.read_text())
                if not config.get('tasks'):
                    need(config.get('model_calls') == 0, 'unbound-config')
                    continue
            ids = exposure.ids_from_manifest(path, branch)
            seen.update(ids)
            bindings.append({'kind': branch + '-manifest', 'path': str(path),
                             'sha256': sha(path), 'id_count': len(ids)})
    for path, (digest, key) in source.PRIOR.items():
        selected = json.loads(path.read_text())[key]
        ids = {row['instance_id'] for row in selected}
        need(len(ids) == len(selected), 'prior-duplicate')
        seen.update(ids)
        bindings.append({'kind': 'prior-selected-or-screened', 'path': str(path),
                         'sha256': digest, 'id_count': len(ids)})
    rows = pq.read_table(source.PARQUET, columns=list(exposure.FIELDS)).to_pylist()
    need(len(rows) == 1136 and len({row['instance_id'] for row in rows}) == 1136,
         'dataset-identity')
    counts = Counter()
    invalid = Counter()
    for row in rows:
        identifier = row['instance_id']
        if identifier not in development or identifier in seen:
            continue
        valid = (all(isinstance(row[key], str) and row[key]
                     for key in exposure.FIELDS) and
                 len(row['base_commit']) == 40 and
                 all(char in '0123456789abcdef' for char in row['base_commit']))
        if not valid:
            invalid[(row['source'], row['repo'])] += 1
            continue
        counts[(row['source'], row['repo'])] += 1
    named = [{'source': source_name, 'repo': repo, 'source_valid_count': count}
             for (source_name, repo), count in counts.most_common()]
    invalid_named = [{'source': source_name, 'repo': repo, 'count': count}
                     for (source_name, repo), count in invalid.most_common()]
    payload = {
        'schema_version': 'are.g02-post-r11-source-census/v1',
        'status': 'source-only-development-supply-count',
        'dataset_sha256': sha(source.PARQUET),
        'acceptance_sha256': sha(source.ACCEPTANCE),
        'source_script_sha256': sha(__file__),
        'r11_pool_sha256': POOL_SHA,
        'exposure_bindings': bindings,
        'excluded_id_count': len(seen),
        'development_partition_size': len(development),
        'reserved_partition_excluded': len(reserved),
        'source_valid_remaining': sum(counts.values()),
        'source_invalid_remaining': sum(invalid.values()),
        'by_source_repo': named,
        'invalid_by_source_repo': invalid_named,
        'gold_or_native_score_loaded': False,
        'model_calls': 0,
        'claim_ceiling': 'Source-only supply inventory; no eligibility, model, score, or superiority.',
        'open_questions': ['Which fresh strata can support a predeclared 24-task cohort and reserve tasks?',
                           'Will evaluator-only native-reference admission accept enough tasks?'],
    }
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'],
                      'source_valid_remaining': payload['source_valid_remaining'],
                      'top_groups': named[:16], 'sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
