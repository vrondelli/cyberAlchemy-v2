#!/usr/bin/env python3
"""Evaluator-only coverage audit for sealed full-repo lexical rankings."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g02-r11-fullrepo-lexical-exposed-r1-20261004/SOURCE-SEAL.json'
SOURCE_SHA = '3ead17963e3736cc0609b7e2eed986849297091aaeeb85c33723b5505311e832'
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
PACKETS_SHA = '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b'
UNION = ARCHIVE / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
UNION_SHA = '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291'
PARQUET = ARCHIVE / 'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
OUTPUT = SOURCE.parent / 'EVALUATOR-AUDIT.json'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def norm(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    pins = {SOURCE: SOURCE_SHA, PACKETS: PACKETS_SHA, UNION: UNION_SHA, PARQUET: PARQUET_SHA}
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    source = json.loads(SOURCE.read_text())
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    union = {row['ordinal']: row for row in json.loads(UNION.read_text())['rows']}
    gold_rows = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    gold_by_id = {row['instance_id']: row for row in gold_rows}
    if len(gold_by_id) != len(gold_rows) or len(source['rows']) != len(packets) != 12:
        raise SystemExit('cohort-shape')
    by_depth = {depth: {'hits': 0, 'outside_relation_union_hits': 0,
                        'repositories_with_hit': set()} for depth in (12, 24, 48, 96)}
    rows = []
    undelivered_total = 0
    for ranked, packet in zip(source['rows'], packets):
        ordinal = packet['ordinal']
        relation = union[ordinal]
        reference = gold_by_id[packet['instance_id']]
        if (ranked['ordinal'] != ordinal or ranked['instance_id'] != packet['instance_id']
                or ranked['base_commit'] != packet['base_commit']
                or reference['base_commit'] != packet['base_commit']
                or relation['instance_id'] != packet['instance_id']):
            raise SystemExit(f'identity-drift:{ordinal}')
        gold = {norm(item['file']) for item in json.loads(reference['gold_context'])}
        delivered = {norm(p) for p in packet['delivered_paths']}
        missing = gold - delivered
        relation_paths = {item['path'] for item in relation['candidates']}
        ranked_paths = [item['path'] for item in ranked['ranked']]
        if len(set(ranked_paths)) != len(ranked_paths) or set(ranked_paths) & delivered:
            raise SystemExit(f'ranking-invalid:{ordinal}')
        undelivered_total += len(missing)
        counts = {}
        for depth, summary in by_depth.items():
            hits = set(ranked_paths[:depth]) & missing
            outside = hits - relation_paths
            summary['hits'] += len(hits)
            summary['outside_relation_union_hits'] += len(outside)
            if hits:
                summary['repositories_with_hit'].add(packet['repo'])
            counts[str(depth)] = {'new_gold_hits': len(hits),
                                  'outside_relation_union_hits': len(outside)}
        rows.append({'ordinal': ordinal, 'repo': packet['repo'],
                     'undelivered_gold_count': len(missing),
                     'relation_union_missing_gold_count': len(missing & relation_paths),
                     'ranked_paths': len(ranked_paths), 'depth_counts': counts})
    summaries = {str(depth): {'hits': item['hits'],
                              'outside_relation_union_hits': item['outside_relation_union_hits'],
                              'repositories_with_hit': len(item['repositories_with_hit'])}
                 for depth, item in by_depth.items()}
    gate = source['policy']['advancement_gate']
    top = summaries['24']
    passed = (top['hits'] >= gate['top24_new_gold_hits_min']
              and top['outside_relation_union_hits'] >= gate['top24_outside_relation_union_gold_min']
              and top['repositories_with_hit'] >= gate['repositories_with_hit_min'])
    report = {'schema_version': 'g02.r11-fullrepo-lexical-evaluator-r1/v1',
              'posture': 'evaluator-only-exposed-development-no-model-or-actual-reads',
              'input_sha256': {str(path): pin for path, pin in pins.items()},
              'script_sha256': sha(Path(__file__)), 'undelivered_gold_total': undelivered_total,
              'gate': gate, 'gate_pass': passed, 'depth_summary': summaries, 'rows': rows,
              'claim_ceiling': 'Candidate coverage only; no GLM choice, native F1, actual ARE reads, independent transfer or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'undelivered_gold_total': undelivered_total,
                      'depth_summary': summaries, 'gate_pass': passed,
                      'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
