#!/usr/bin/env python3
"""Evaluator-only coverage audit of sealed reverse-reference candidates."""

import hashlib
import json
import os
from collections import Counter
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
SEAL = ROOT / 'g02-r11-reverse-references-exposed-r1-20261004/SOURCE-SEAL.json'
PACKETS = ROOT / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-reverse-references-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    SEAL: '829fd2932a55312399a7dea8ecdc81f61f8b05b5c57dff28b9e512ac75a5cbf3',
    PACKETS: '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b',
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


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
    source_seal = json.loads(SEAL.read_text())
    source = source_seal['rows']
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    union = json.loads(UNION.read_text())['rows']
    labels = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    references = {row['instance_id']: row for row in labels}
    if (source_seal['schema_version'] != 'g02.r11-reverse-references-source-exposed-r1/v1' or
            len(source) != len(packets) or len(source) != len(union) or len(source) != 12 or
            len(references) != len(labels)):
        raise SystemExit('denominator-drift')
    rows, by_repo = [], Counter()
    for sealed, packet, old in zip(source, packets, union):
        ordinal = sealed['ordinal']
        reference = references[sealed['instance_id']]
        if (packet['ordinal'] != ordinal or old['ordinal'] != ordinal or
                packet['instance_id'] != sealed['instance_id'] or
                old['instance_id'] != sealed['instance_id'] or
                reference['base_commit'] != sealed['base_commit'] or
                packet['base_commit'] != sealed['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        raw = ROOT / 'g02-product-replication-r11-20261002/pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
        pred_path = raw / 'policy-pruning/prediction.json'
        selected = {normalize(path) for path in json.loads(pred_path.read_text())['traj_data']['pred_files']}
        delivered = {normalize(path) for path in old['delivered_paths']}
        if selected != {normalize(path) for path in packet['selected_paths']} or \
                delivered != {normalize(path) for path in packet['delivered_paths']}:
            raise SystemExit(f'packet-prediction-drift:{ordinal}')
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        missing = gold - delivered
        old_union = {normalize(item['path']) for item in old['candidates'] if item['bytes'] <= 262144}
        shortlist = [normalize(item['path']) for item in sealed['shortlist']]
        if (len(shortlist) != len(set(shortlist)) or len(shortlist) > 20 or
                set(shortlist) & (selected | delivered)):
            raise SystemExit(f'shortlist-drift:{ordinal}')
        hits = {str(depth): len(missing & set(shortlist[:depth])) for depth in (3, 10, 20)}
        outside = len((missing - old_union) & set(shortlist))
        by_repo[sealed['repo']] += hits['20']
        rows.append({'ordinal': ordinal, 'repo': sealed['repo'],
                     'shortlist_count': len(shortlist), 'undelivered_gold': len(missing),
                     'hits_by_depth': hits, 'top20_hits_outside_relation_union': outside})
    summary = {'tasks': 12,
               'shortlist_candidates': sum(row['shortlist_count'] for row in rows),
               'undelivered_gold': sum(row['undelivered_gold'] for row in rows),
               'hits_by_depth': {str(depth): sum(row['hits_by_depth'][str(depth)] for row in rows)
                                 for depth in (3, 10, 20)},
               'top20_hits_outside_relation_union': sum(row['top20_hits_outside_relation_union'] for row in rows),
               'repositories_with_top20_hit': sum(value > 0 for value in by_repo.values()),
               'by_repository_hits': dict(sorted(by_repo.items()))}
    gate = source_seal['advancement_gate']
    gate_pass = (summary['hits_by_depth']['20'] >= gate['minimum_top20_new_gold_hits'] and
                 summary['top20_hits_outside_relation_union'] >= gate['minimum_top20_hits_outside_relation_union'] and
                 summary['repositories_with_top20_hit'] >= gate['minimum_repositories_with_hit'] and
                 summary['shortlist_candidates'] <= 240)
    report = {'schema_version': 'g02.r11-reverse-references-evaluator-r1/v1',
              'posture': 'evaluator-only-exposed-shortlist-coverage-no-model-or-ARE-read',
              'input_sha256': {str(path): pin for path, pin in PINS.items()},
              'script_sha256': sha(Path(__file__)), 'gate': gate,
              'gate_pass': gate_pass, 'summary': summary, 'rows': rows,
              'claim_ceiling': 'Recall feasibility on exposed tasks only; no actual read, native F1, cost, independent quality or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'gate_pass': gate_pass,
                      'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
