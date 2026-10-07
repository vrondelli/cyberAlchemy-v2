#!/usr/bin/env python3
"""Evaluator-only counts for sealed G02 r11 two-hop Python import graph."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
GRAPH = ROOT / 'g02-r11-two-hop-import-exposed-r1-20261004/SOURCE-GRAPH.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PACKETS = ROOT / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-two-hop-import-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    GRAPH: '2de9fcf4db64de71c3b3e7cb29d450604bb071a570be770473bce192fd13cf25',
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


def need(ok, reason):
    if not ok:
        raise SystemExit(reason)


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
    graph_doc = json.loads(GRAPH.read_bytes())
    graph = graph_doc['rows']
    union = json.loads(UNION.read_bytes())['rows']
    packets = json.loads(PACKETS.read_bytes())['ordered_packets']
    refs = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    by_id = {row['instance_id']: row for row in refs}
    need(len(graph) == len(union) == len(packets) == 12 and
         len(by_id) == len(refs) and graph_doc['gold_opened'] is False,
         'denominator-drift')
    rows = []
    for source, old, packet in zip(graph, union, packets):
        ordinal = source['ordinal']
        reference = by_id[source['instance_id']]
        need(ordinal == old['ordinal'] == packet['ordinal'] and
             source['instance_id'] == old['instance_id'] == packet['instance_id'] and
             source['base_commit'] == old['base_commit'] == packet['base_commit'] ==
             reference['base_commit'], f'identity:{ordinal}')
        delivered = {normalize(path) for path in packet['delivered_paths']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        missing = gold - delivered
        old_paths = {normalize(item['path']) for item in old['candidates']
                     if item['bytes'] <= 262144}
        first = {normalize(path) for path in source['one_hop']}
        second = {normalize(path) for path in source['two_hop']}
        need(not first & second and not (first | second) & delivered,
             f'graph-overlap:{ordinal}')
        rows.append({'ordinal': ordinal, 'repo': source['repo'],
                     'language': source['language'],
                     'missing_gold': len(missing),
                     'old_union_missing_gold': len(missing & old_paths),
                     'one_hop_candidates': len(first),
                     'one_hop_missing_gold': len(missing & first),
                     'one_hop_new_beyond_union': len((missing & first) - old_paths),
                     'two_hop_candidates': len(second),
                     'two_hop_missing_gold': len(missing & second),
                     'two_hop_new_beyond_union': len((missing & second) - old_paths)})
    python = [row for row in rows if row['language'] == 'Python']
    totals = Counter()
    for row in python:
        for key, value in row.items():
            if isinstance(value, int) and key != 'ordinal':
                totals[key] += value
    result = {'schema_version': 'g02.r11-two-hop-import-evaluator-exposed-r1/v1',
              'posture': 'evaluator-only candidate-coverage ceiling; no proposed or actual reads',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)),
              'python_tasks': len(python), 'totals': dict(totals), 'rows': rows,
              'claim_ceiling': 'Exposed coverage only; not a selection policy, File-F1, Span-F1, cost or superiority estimate.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'python_tasks': len(python), 'totals': dict(totals),
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
