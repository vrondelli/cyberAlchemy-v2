#!/usr/bin/env python3
"""Seal the four cold-copied GLM choices before evaluator gold access."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g01-r17-explicit-file-chooser-exposed-r1-20261004')
PACKETS_SHA = '1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148'
FREEZE_SHA = 'b75947b8bf53f8c15209ffd85086dcace3029ecffb63373acf9f6c599791d644'
OUTPUT = ROOT / 'SEALED-RESPONSES.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(ROOT/'PACKETS.json') != PACKETS_SHA or sha(ROOT/'FREEZE.json') != FREEZE_SHA:
        raise SystemExit('output-exists-or-input-drift')
    packets = json.loads((ROOT/'PACKETS.json').read_text())['ordered_packets']
    run = json.loads((ROOT/'RUN-RESULT.json').read_text())
    if run['completed'] != 4 or run['valid'] != 4 or run['status'] != 'completed-exposed-diagnostic':
        raise SystemExit('run-incomplete')
    rows = []
    for packet in packets:
        ordinal = packet['ordinal']
        response_path = ROOT/f'RESPONSE-{ordinal}.json'
        response = json.loads(response_path.read_text())
        eligible = {item['id']: item['path'] for item in packet['candidates']}
        if (response['status'] != 'valid' or response['ordinal'] != ordinal or
                len(response['ids']) > 2 or
                response['paths'] != [eligible[id] for id in response['ids']] or
                response['http_status'] != 200 or response['finish_reason'] != 'stop'):
            raise SystemExit(f'response-invalid:{ordinal}')
        rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                     'repo': packet['repo'], 'selected_paths': response['paths'],
                     'response_sha256': sha(response_path), 'usage': response['usage']})
    seal = {'schema_version': 'g01.r17-explicit-file-responses-seal-r1/v1',
            'posture': 'sealed-before-gold-exposed-development',
            'input_sha256': {'packets': PACKETS_SHA, 'freeze': FREEZE_SHA,
                             'run_result': sha(ROOT/'RUN-RESULT.json')},
            'script_sha256': sha(Path(__file__)), 'rows': rows,
            'valid_responses': 4,
            'known_chooser_tokens': sum(r['usage']['prompt_tokens']+r['usage']['completion_tokens'] for r in rows),
            'claim_ceiling': 'Exposed choice only; no actual ARE read, native F1, independent result or superiority.'}
    data = (json.dumps(seal, sort_keys=True, indent=2)+'\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT|os.O_EXCL|os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream: stream.write(data)
    print(json.dumps({'valid_responses':4, 'known_chooser_tokens':seal['known_chooser_tokens'],
                      'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__': main()
