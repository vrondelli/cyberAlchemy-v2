#!/usr/bin/env python3
"""Seal an exposed first-read comparator before native reference scoring."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ROOT / 'g01-r17-dual-view-native-projection-r1-20261004'
OUT = ROOT / 'g01-r17-first-view-native-comparator-r1-20261004'
SEAL_SHA = '5b93f32c85b57d577dbee70fadcc6c77d08870bb9024d5089d4cad12e1aa0f86'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, obj):
    data = (json.dumps(obj, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)
    return sha(data)


def main():
    if OUT.exists() or sha((SOURCE / 'PREDICTION-SEAL.json').read_bytes()) != SEAL_SHA:
        raise SystemExit('input-drift-or-output-exists')
    original = json.loads((SOURCE / 'PREDICTION-SEAL.json').read_text())
    OUT.mkdir(mode=0o700)
    hashes = {}
    for ordinal in (19, 20, 21, 22):
        name = f'task-{ordinal:02d}-prediction.json'
        data = (SOURCE / name).read_bytes()
        if sha(data) != original['prediction_sha256'][name]:
            raise SystemExit('prediction-drift')
        prediction = json.loads(data)
        traj = prediction['traj_data']
        path = traj['pred_files'][0]
        if len(traj['pred_steps']) != 2 or len(traj['pred_spans'][path]) != 2:
            raise SystemExit('step-shape-drift')
        traj['pred_steps'] = traj['pred_steps'][:1]
        traj['pred_spans'][path] = traj['pred_spans'][path][:1]
        hashes[name] = save(OUT / name, prediction)
    seal = {
        'schema_version': 'g01.r17-first-view-native-comparator-r1/v1',
        'posture': 'exposed-post-hoc-first-read-synthetic-comparator',
        'dual_view_prediction_seal_sha256': SEAL_SHA,
        'prediction_sha256': hashes,
        'claim_ceiling': 'Exposed first-read comparator only; not a live ARE control or independent confirmation.',
    }
    print(json.dumps({'seal_sha256': save(OUT / 'PREDICTION-SEAL.json', seal), 'predictions': hashes}))


if __name__ == '__main__':
    main()
