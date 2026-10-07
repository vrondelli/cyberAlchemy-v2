#!/usr/bin/env python3
"""Seal exposed, gold-blind native-score inputs from prior verified reads."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g01-r17-explicit-dual-view-r2-20261004/SOURCE-SEAL.json'
PACKETS = ROOT / 'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json'
MANIFEST = Path(__file__).resolve().parents[4] / 'benchmarks/contextbench-v1/source-manifest.json'
OUT = ROOT / 'g01-r17-dual-view-native-projection-r1-20261004'
EXPECTED_SOURCE = '67ca94bc226e424aa50d57adbf8f91727e490f1538c7f9c0e189285a057ad892'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_bytes())


def save(path, value):
    data = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)
    return digest(data)


def main():
    if digest(SOURCE.read_bytes()) != EXPECTED_SOURCE or OUT.exists():
        raise SystemExit('source-drift-or-output-exists')
    rows = load(SOURCE)['rows']
    packets = {p['ordinal']: p for p in load(PACKETS)['ordered_packets']}
    instances = {i['instance_id']: i for i in load(MANIFEST)['dataset']['instances']}
    if [r['ordinal'] for r in rows] != [19, 20, 21, 22]:
        raise SystemExit('cohort-drift')
    OUT.mkdir(mode=0o700)
    hashes = {}
    for row in rows:
        ordinal = row['ordinal']
        packet = packets[ordinal]
        identity = instances[packet['instance_id']]
        if row['repo'] != identity['repo'] or packet['repo'] != row['repo']:
            raise SystemExit('repository-drift')
        path = row['path']
        if path not in [c['path'] for c in packet['candidates']]:
            raise SystemExit('selected-path-drift')
        ranges = [{'start': r['start_line'], 'end': r['end_line']} for r in row['ranges']]
        if len(ranges) != 2 or any(r['start'] < 1 or r['end'] < r['start'] for r in ranges):
            raise SystemExit('range-drift')
        prediction = {
            'instance_id': packet['instance_id'],
            'repo_url': identity['repo_url'],
            'commit': identity['base_commit'],
            'traj_data': {
                'pred_steps': [{'files': [path], 'spans': {path: [span]}} for span in ranges],
                'pred_files': [path],
                'pred_spans': {path: ranges},
            },
        }
        name = f'task-{ordinal:02d}-prediction.json'
        hashes[name] = save(OUT / name, prediction)
    seal = {
        'schema_version': 'g01.r17-dual-view-native-projection-r1/v1',
        'posture': 'exposed-post-hoc-source-only-synthetic-trajectory',
        'source_sha256': EXPECTED_SOURCE,
        'packets_sha256': digest(PACKETS.read_bytes()),
        'manifest_sha256': digest(MANIFEST.read_bytes()),
        'prediction_sha256': hashes,
        'claim_ceiling': 'Native score of a synthetic exposed projection only; not a live ARE episode, independent confirmation, or superiority.',
    }
    print(json.dumps({'seal_sha256': save(OUT / 'PREDICTION-SEAL.json', seal), 'predictions': hashes}))


if __name__ == '__main__':
    main()
