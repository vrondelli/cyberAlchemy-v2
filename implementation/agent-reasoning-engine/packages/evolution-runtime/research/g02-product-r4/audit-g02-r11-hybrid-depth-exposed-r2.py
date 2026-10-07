#!/usr/bin/env python3
"""Evaluator-only count audit of the sealed r11 hybrid rank-depth curve."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-hybrid-depth-exposed-r2-20261004/SOURCE-SEAL.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SEAL.parent / 'EVALUATOR-AUDIT.json'
PINS = {SEAL: '7e2c65289f0dd8e45822dd313c037945d48ba6e45fe4825fef5cea19f7453a63',
        UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
        PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'}
DEPTHS = (12, 24, 48, 96)


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    seal = json.loads(SEAL.read_text())
    union = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table) or seal['depths'] != list(DEPTHS) or \
            [row['ordinal'] for row in seal['rows']] != list(range(1, 13)):
        raise SystemExit('cohort-shape-drift')
    rows = []
    by_repo = defaultdict(lambda: {str(k): 0 for k in DEPTHS})
    for row in seal['rows']:
        source = union[row['ordinal']]
        reference = native[row['instance_id']]
        if any(row[key] != source[key] for key in ('instance_id', 'repo', 'base_commit', 'issue_sha256')) or \
                reference['base_commit'] != row['base_commit']:
            raise SystemExit(f'identity-drift:{row["ordinal"]}')
        pool = {item['path'] for item in source['candidates'] if item['bytes'] <= 262144}
        ranking = row['ranked_paths']
        if len(ranking) != min(row['eligible_candidates'], max(DEPTHS)) or \
                len(ranking) != len(set(ranking)) or set(ranking) - pool:
            raise SystemExit(f'ranking-shape-drift:{row["ordinal"]}')
        delivered = {normalize(path) for path in source['delivered_paths']}
        if set(ranking) & delivered:
            raise SystemExit(f'delivered-overlap:{row["ordinal"]}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        eligible = (gold - delivered) & pool
        counts = {str(k): len(set(ranking[:k]) & eligible) for k in DEPTHS}
        for k in DEPTHS:
            by_repo[row['repo']][str(k)] += counts[str(k)]
        rows.append({'ordinal': row['ordinal'], 'repo': row['repo'],
                     'eligible_missing_gold': len(eligible), 'hits_by_depth': counts})
    totals = {str(k): sum(row['hits_by_depth'][str(k)] for row in rows) for k in DEPTHS}
    report = {'schema_version': 'g02.r11-hybrid-depth-exposed-audit-r2/v1',
              'posture': 'evaluator-only-exposed-development-counts-only-no-model-no-ARE-read',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'tasks': len(rows),
              'eligible_missing_gold': sum(row['eligible_missing_gold'] for row in rows),
              'hits_by_depth': totals, 'by_repository_hits': dict(sorted(by_repo.items())),
              'rows': rows, 'claim_ceiling': 'Coverage at larger chooser depths only; no GLM chooser, actual read, native F1, cost, independent transfer or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'tasks': len(rows), 'eligible_missing_gold': report['eligible_missing_gold'],
                      'hits_by_depth': totals, 'by_repository_hits': report['by_repository_hits'],
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
