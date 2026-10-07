#!/usr/bin/env python3
"""Seal all 12 exposed chooser attempts, retaining invalids before gold access."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g02-r11-hybrid-24-choice-exposed-r3-20261004')
PACKET_SHA = 'f82d881f43a9080d8f8996ecbcafbf95edcc18410605336aef0a5bbf9fa4906a'
FREEZE_SHA = '23ffffd250ae3bfb540ef9d995f2bfd87d72de4404eb90c2e0077c5a0a8a6573'
OUTPUT = ROOT / 'SEALED-RESPONSES.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(ROOT / 'PACKETS.json') != PACKET_SHA or \
            sha(ROOT / 'FREEZE.json') != FREEZE_SHA:
        raise SystemExit('output-exists-or-frozen-input-drift')
    packets = json.loads((ROOT / 'PACKETS.json').read_text())['ordered_packets']
    if [p['ordinal'] for p in packets] != list(range(1, 13)):
        raise SystemExit('packet-order-drift')
    preflight = json.loads((ROOT / 'PREFLIGHT.json').read_text())
    if preflight['status'] != 'ready' or len(preflight['admissions']) != 12 or \
            not all(row['admitted'] for row in preflight['admissions']):
        raise SystemExit('preflight-not-admitted')
    run = json.loads((ROOT / 'RUN-RESULT.json').read_text())
    if run.get('status') != 'completed-exposed-diagnostic' or run.get('completed') != 12:
        raise SystemExit('run-not-complete')
    rows = []
    total_tokens = 0
    for packet in packets:
        ordinal = packet['ordinal']
        start_path, response_path = (ROOT / f'STARTED-{ordinal}.json', ROOT / f'RESPONSE-{ordinal}.json')
        start = json.loads(start_path.read_text())
        response = json.loads(response_path.read_text())
        if (start.get('ordinal') != ordinal or response.get('ordinal') != ordinal or
                response.get('packet_sha256') != start.get('packet_sha256') or
                response.get('request_sha256') != start.get('request_sha256') or
                response.get('http_status') != 200 or response.get('finish_reason') != 'stop' or
                response.get('failure_code') is not None):
            raise SystemExit(f'response-identity-or-transport-drift:{ordinal}')
        usage = response.get('usage') or {}
        prompt, completion = usage.get('prompt_tokens'), usage.get('completion_tokens')
        if not isinstance(prompt, int) or not isinstance(completion, int) or prompt <= 0 or completion <= 0:
            raise SystemExit(f'unknown-usage:{ordinal}')
        total_tokens += prompt + completion
        paths = response.get('paths')
        eligible = {item['path'] for item in packet['candidates']}
        if response['status'] == 'valid':
            if not isinstance(paths, list) or len(paths) > 3 or len(paths) != len(set(paths)) or \
                    any(path not in eligible for path in paths):
                raise SystemExit(f'invalid-valid-choice:{ordinal}')
        elif response['status'] == 'invalid':
            if paths is not None or not response.get('validation_error'):
                raise SystemExit(f'invalid-response-shape-drift:{ordinal}')
            paths = []
        else:
            raise SystemExit(f'unknown-status:{ordinal}')
        rows.append({'ordinal': ordinal, 'status': response['status'],
                     'selected_paths': paths, 'started_sha256': sha(start_path),
                     'response_sha256': sha(response_path), 'known_tokens': prompt + completion,
                     'elapsed_ms': response['elapsed_ms']})
    report = {'schema_version': 'g02.r11-hybrid-24-choice-response-seal-r3/v1',
              'posture': 'exposed-development-model-output-sealed-before-gold',
              'packet_sha256': PACKET_SHA, 'freeze_sha256': FREEZE_SHA,
              'preflight_sha256': sha(ROOT / 'PREFLIGHT.json'),
              'run_result_sha256': sha(ROOT / 'RUN-RESULT.json'),
              'rows': rows, 'valid_responses': sum(row['status'] == 'valid' for row in rows),
              'invalid_responses': sum(row['status'] == 'invalid' for row in rows),
              'known_chooser_tokens': total_tokens,
              'claim_ceiling': 'Sealed exposed model read choices only; no actual ARE reads, native F1, independent cohort or superiority.'}
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'valid': report['valid_responses'], 'invalid': report['invalid_responses'],
                      'selected_paths': sum(len(row['selected_paths']) for row in rows),
                      'known_chooser_tokens': total_tokens,
                      'seal_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
