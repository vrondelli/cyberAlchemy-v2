#!/usr/bin/env python3
"""Evaluator-only counts for sealed issue-symbol navigation proposals."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g02-r11-issue-symbol-navigation-exposed-r1-20261004/SOURCE-PROPOSALS.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PACKETS = ROOT / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-issue-symbol-navigation-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    SOURCE: '6933b58b6058c8dbb273cd4284bcadba870b05452405a25b57d19e0806da444f',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PACKETS: '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(condition, why):
    if not condition:
        raise SystemExit(why)


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    need(not OUTPUT.exists() and all(sha(path) == pin for path, pin in PINS.items()),
         'output-or-input-pin-drift')
    source_doc = json.loads(SOURCE.read_bytes())
    source = source_doc['rows']
    union = json.loads(UNION.read_bytes())['rows']
    packets = json.loads(PACKETS.read_bytes())['ordered_packets']
    refs = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    by_id = {row['instance_id']: row for row in refs}
    need(len(source) == len(union) == len(packets) == 12 and
         len(by_id) == len(refs) and source_doc['gold_opened'] is False and
         source_doc['model_calls'] == 0, 'denominator-or-isolation-drift')
    rows = []
    for s, u, p in zip(source, union, packets):
        ordinal = s['ordinal']
        ref = by_id[s['instance_id']]
        need(ordinal == u['ordinal'] == p['ordinal'] and
             s['instance_id'] == u['instance_id'] == p['instance_id'] and
             s['base_commit'] == u['base_commit'] == p['base_commit'] == ref['base_commit'],
             f'identity:{ordinal}')
        delivered = {normalize(path) for path in p['delivered_paths']}
        gold = {normalize(item['file']) for item in json.loads(ref['gold_context'])}
        missing = gold - delivered
        old = {normalize(item['path']) for item in u['candidates'] if item['bytes'] <= 262144}
        proposed = [normalize(item['path']) for item in s['proposals']]
        need(len(proposed) == len(set(proposed)) and len(proposed) <= 3 and
             not set(proposed) & delivered, f'proposal-contract:{ordinal}')
        new = set(proposed) - old
        rows.append({'ordinal': ordinal, 'language': s['language'],
                     'missing_gold': len(missing),
                     'prior_union_missing_gold': len(missing & old),
                     'proposals': len(proposed),
                     'proposal_missing_gold': len(set(proposed) & missing),
                     'proposal_non_gold': len(set(proposed) - gold),
                     'new_beyond_union': len(new),
                     'new_gold_beyond_union': len(new & missing),
                     'new_non_gold_beyond_union': len(new - gold)})
    py = [row for row in rows if row['language'] == 'Python']
    totals = Counter()
    for row in py:
        for key, value in row.items():
            if isinstance(value, int) and key != 'ordinal':
                totals[key] += value
    result = {'schema_version': 'g02.r11-issue-symbol-navigation-evaluator-exposed-r1/v1',
              'posture': 'evaluator-only coverage and proposal precision; no actual reads',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'python_tasks': len(py),
              'totals': dict(totals), 'rows': rows,
              'claim_ceiling': 'Exposed proposed-read evidence only; no native File-/Span-F1, fresh transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'python_tasks': len(py), 'totals': dict(totals),
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
