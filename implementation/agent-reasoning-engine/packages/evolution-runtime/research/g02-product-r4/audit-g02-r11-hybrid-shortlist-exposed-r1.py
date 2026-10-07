#!/usr/bin/env python3
"""Evaluator-only, counts-only coverage audit of the sealed r11 shortlist."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-hybrid-shortlist-exposed-r1-20261004/SOURCE-SEAL.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = SEAL.parent / 'EVALUATOR-AUDIT.json'
PINS = {
    SEAL: '1ebc6cf69ee9032415d754130054c6f3fe864a850d586a76538a23ed0dbd31e8',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}
GATE = {'minimum_eligible_gold_in_shortlist': 6, 'minimum_repositories_with_hit': 2}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
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
    if OUTPUT.exists() or any(digest(path) != pin for path, pin in PINS.items()):
        raise ValueError('output-exists-or-input-drift')
    seal = json.loads(SEAL.read_text())
    union = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    table = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    if len(native) != len(table) or [row['ordinal'] for row in seal['rows']] != list(range(1, 13)):
        raise ValueError('row-shape-drift')
    rows = []
    by_repo = defaultdict(int)
    for row in seal['rows']:
        source = union[row['ordinal']]
        reference = native[row['instance_id']]
        if any(row[key] != source[key] for key in ('instance_id', 'repo', 'base_commit', 'issue_sha256')) or \
                reference['base_commit'] != row['base_commit']:
            raise ValueError(f'identity-drift:{row["ordinal"]}')
        pool = {item['path'] for item in source['candidates'] if item['bytes'] <= 262144}
        shortlist = [item['path'] for item in row['shortlist']]
        if len(shortlist) != 12 or len(set(shortlist)) != 12 or set(shortlist) - pool:
            raise ValueError(f'shortlist-drift:{row["ordinal"]}')
        delivered = {normalize(path) for path in source['delivered_paths']}
        if set(shortlist) & delivered:
            raise ValueError(f'delivered-overlap:{row["ordinal"]}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        eligible = (gold - delivered) & pool
        hit = len(set(shortlist) & eligible)
        by_repo[row['repo']] += hit
        rows.append({'ordinal': row['ordinal'], 'repo': row['repo'],
                     'eligible_missing_gold': len(eligible),
                     'eligible_gold_in_shortlist': hit, 'shortlist_size': len(shortlist)})
    summary = {'tasks': len(rows), 'shortlisted_files': sum(row['shortlist_size'] for row in rows),
               'eligible_missing_gold': sum(row['eligible_missing_gold'] for row in rows),
               'eligible_gold_in_shortlist': sum(row['eligible_gold_in_shortlist'] for row in rows),
               'repositories_with_hit': sum(value > 0 for value in by_repo.values()),
               'by_repository_hits': dict(sorted(by_repo.items()))}
    passed = (summary['eligible_gold_in_shortlist'] >= GATE['minimum_eligible_gold_in_shortlist'] and
              summary['repositories_with_hit'] >= GATE['minimum_repositories_with_hit'])
    output = {'schema_version': 'g02.r11-hybrid-shortlist-exposed-audit-r1/v1',
              'posture': 'evaluator-only-exposed-development-counts-only-no-model-no-ARE-read',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': digest(Path(__file__)), 'gate': GATE, 'gate_pass': passed,
              'rows': rows, 'summary': summary,
              'claim_ceiling': 'Shortlist coverage only; no selection precision, actual read, native F1, cost, independent transfer, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': passed,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
