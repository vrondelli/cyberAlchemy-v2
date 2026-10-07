#!/usr/bin/env python3
"""Seal live GLM-selected final context from eight confirmed native reads."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive')
RUN = ROOT / 'g01-r17-dual-read-selector-exposed-r1-20261004'
OUT = ROOT / 'g01-r17-dual-read-live-predictions-r1-20261004'
MANIFEST = Path(__file__).resolve().parents[4] / 'benchmarks/contextbench-v1/source-manifest.json'
PACKETS_SHA = '30be79bff7eb212ae1635b81c32dedbd27ea9418c3db7d8d5bbcd36eebce8053'
FREEZE_SHA = 'e0e1abc3a3be414ab30be699f5807a7f496936803d2538ba76de34b82cda257b'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_bytes())


def save(path, obj):
    data = (json.dumps(obj, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)
    return sha(data)


def main():
    if OUT.exists() or sha((RUN / 'PACKETS.json').read_bytes()) != PACKETS_SHA:
        raise SystemExit('packet-drift-or-output-exists')
    if sha((RUN / 'FREEZE.json').read_bytes()) != FREEZE_SHA:
        raise SystemExit('freeze-drift')
    run = load(RUN / 'RUN-RESULT.json')
    if run['status'] != 'completed-exposed-microepisode' or run['completed'] != 4 or run['valid'] != 4:
        raise SystemExit('incomplete-run')
    packets = load(RUN / 'PACKETS.json')['ordered_packets']
    identities = {i['instance_id']: i for i in load(MANIFEST)['dataset']['instances']}
    OUT.mkdir(mode=0o700)
    predictions = {}
    responses = {}
    total_tokens = 0
    for packet in packets:
        ordinal = packet['ordinal']
        response_path = RUN / f'RESPONSE-{ordinal}.json'
        response = load(response_path)
        ids = response['ids']
        if response['status'] != 'valid' or response['http_status'] != 200 or \
                response['finish_reason'] != 'stop' or not ids or \
                len(ids) != len(set(ids)) or any(x not in (1, 2) for x in ids):
            raise SystemExit('response-invalid')
        identity = identities[packet['instance_id']]
        if identity['repo'] != packet['repo'] or identity['base_commit'] != packet['commit']:
            raise SystemExit('identity-drift')
        path = packet['path']
        all_views = packet['views']
        if [v['id'] for v in all_views] != [1, 2]:
            raise SystemExit('view-drift')
        steps = [{'files': [path], 'spans': {path: [{
            'start': v['start_line'], 'end': v['end_line']}]
        }} for v in all_views]
        chosen = [{'start': all_views[x - 1]['start_line'],
                   'end': all_views[x - 1]['end_line']} for x in ids]
        prediction = {'instance_id': packet['instance_id'],
                      'repo_url': identity['repo_url'], 'commit': packet['commit'],
                      'traj_data': {'pred_steps': steps, 'pred_files': [path],
                                    'pred_spans': {path: chosen}}}
        name = f'task-{ordinal:02d}-prediction.json'
        predictions[name] = save(OUT / name, prediction)
        responses[str(ordinal)] = {'response_sha256': sha(response_path.read_bytes()), 'ids': ids}
        usage = response['usage']
        if not isinstance(usage.get('prompt_tokens'), int) or not isinstance(usage.get('completion_tokens'), int):
            raise SystemExit('usage-missing')
        total_tokens += usage['prompt_tokens'] + usage['completion_tokens']
    seal = {'schema_version': 'g01.r17-dual-read-live-predictions-r1/v1',
            'posture': 'sealed-live-model-selected-context-before-native-scoring',
            'packet_sha256': PACKETS_SHA, 'freeze_sha256': FREEZE_SHA,
            'run_result_sha256': sha((RUN / 'RUN-RESULT.json').read_bytes()),
            'manifest_sha256': sha(MANIFEST.read_bytes()),
            'predictions_sha256': predictions, 'responses': responses,
            'known_model_tokens': total_tokens, 'model_calls': 4,
            'claim_ceiling': 'Four exposed GLM selections over previously delivered native reads; not a full ARE episode, independent campaign, or superiority.'}
    print(json.dumps({'seal_sha256': save(OUT / 'PREDICTION-SEAL.json', seal),
                      'known_model_tokens': total_tokens, 'predictions': predictions}))


if __name__ == '__main__':
    main()
