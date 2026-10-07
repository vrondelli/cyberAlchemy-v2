"""Seal all baseline-aware chooser responses and stop if hit gate is impossible."""
import hashlib
import json
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/g02-r11-baseline-delta-exposed-r1-20261005')
PACKETS = Path('/home/vlad_/are-benchmark-archive/g02-r11-baseline-delta-packets-exposed-r1-20261005/PACKETS.json')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def main():
    freeze = read(ROOT / 'FREEZE.json')
    preflight = read(ROOT / 'PREFLIGHT.json')
    run = read(ROOT / 'RUN-RESULT.json')
    packets = read(PACKETS)['ordered_packets']
    if (freeze['status'] != 'frozen-before-model-dispatch' or
            freeze['packet_sha256'] != sha(PACKETS) or
            preflight['status'] != 'ready' or len(preflight['admissions']) != 12 or
            not all(row['admitted'] for row in preflight['admissions']) or
            run['completed'] != 12 or len(packets) != 12):
        raise RuntimeError('input-or-admission-drift')
    rows = []
    for ordinal in range(1, 13):
        started_path = ROOT / f'STARTED-{ordinal}.json'
        response_path = ROOT / f'RESPONSE-{ordinal}.json'
        started = read(started_path)
        response = read(response_path)
        usage = response['payload']['usage']
        if (started['ordinal'] != ordinal or response['ordinal'] != ordinal or
                started['request_sha256'] != response['request_sha256'] or
                started['packet_sha256'] != response['packet_sha256'] or
                response['http_status'] != 200 or response['status'] != 'valid' or
                response['failure_code'] is not None or response['finish_reason'] != 'stop' or
                not isinstance(usage['prompt_tokens'], int) or not isinstance(usage['completion_tokens'], int)):
            raise RuntimeError(f'raw-attempt-invalid:{ordinal}')
        selected = response['selection']
        expected_path = packets[ordinal - 1]['candidates'][selected['id'] - 1]['path'] if selected['id'] else None
        if response['path'] != expected_path:
            raise RuntimeError(f'selection-path-mismatch:{ordinal}')
        rows.append({'ordinal': ordinal, 'started_sha256': sha(started_path),
                     'response_sha256': sha(response_path), 'status': response['status'],
                     'path': response['path'], 'known_tokens': usage['prompt_tokens'] + usage['completion_tokens'],
                     'elapsed_ms': response['elapsed_ms']})
    maximum_hits = sum(row['path'] is not None for row in rows)
    minimum_hits = freeze['advancement_gate']['minimum_new_gold_hits']
    sealed = {
        'schema_version': 'g02.r11-baseline-delta-response-seal-r1/v1',
        'status': 'sealed-complete-exposed-development',
        'packet_sha256': sha(PACKETS), 'freeze_sha256': sha(ROOT / 'FREEZE.json'),
        'preflight_sha256': sha(ROOT / 'PREFLIGHT.json'),
        'run_sha256': sha(ROOT / 'RUN-RESULT.json'),
        'script_sha256': sha(Path(__file__)), 'rows': rows,
        'summary': {'valid_responses': len(rows), 'proposals': maximum_hits,
                    'maximum_possible_new_gold_hits': maximum_hits,
                    'minimum_required_new_gold_hits': minimum_hits,
                    'known_chooser_tokens': sum(row['known_tokens'] for row in rows),
                    'summed_generation_ms': sum(row['elapsed_ms'] for row in rows),
                    'advancement_gate_possible': maximum_hits >= minimum_hits,
                    'evaluator_gold_opened': False},
        'claim_ceiling': 'Proposal-count impossibility gate only; no native quality score, actual ARE read, matched pair or superiority.',
        'open_questions': ['Can a separate causal-evidence policy retain precision without abstaining on almost every task?']
    }
    with (ROOT / 'RESPONSE-SEAL.json').open('x') as stream:
        json.dump(sealed, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps(sealed['summary'], sort_keys=True))


if __name__ == '__main__':
    main()
