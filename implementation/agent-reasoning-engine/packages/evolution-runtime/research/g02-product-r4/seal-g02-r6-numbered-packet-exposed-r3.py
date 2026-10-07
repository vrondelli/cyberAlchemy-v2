#!/usr/bin/env python3
"""Seal exposed ARE pair outputs before fixed policy projection or scoring."""

import hashlib
import json
from pathlib import Path


FREEZE = Path('/opt/are/evolution-runtime/g02-r6-numbered-packet-exposed-r3/FREEZE.json')
FREEZE_SHA = 'cedcee6cfbea8fa060d154c3564a6300c5be38a0bd03e52a775eb2addda0e33f'
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'
LEAD = 'lib/ansible/cli/arguments/option_helpers.py'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def main():
    output = FREEZE.parent / 'PRE-SCORE-SEAL.json'
    if output.exists() or sha(FREEZE) != FREEZE_SHA:
        raise ValueError('numbered-packet-seal.freeze-drift')
    frozen = read(FREEZE)
    roots = {'baseline': Path(frozen['baseline_root']), 'numbered_packet': Path(frozen['candidate_root'])}
    arms = {}
    packets = {}
    for arm, root in roots.items():
        if (root / 'policy-pruning').exists() or (root / 'are-score-stdout.txt').exists():
            raise ValueError('numbered-packet-seal.score-already-open:' + arm)
        paths = {
            'result': root / 'evidence/RESULTS.json',
            'prediction': root / 'evidence/run/prediction.json',
            'settlement': root / 'ARE-SETTLEMENT.json',
            'events': root / 'evidence/run/events.jsonl',
            'export': root / 'evidence/run/export-evidence.json',
        }
        result, prediction, settlement, exported = (read(paths[name]) for name in
                                                  ('result', 'prediction', 'settlement', 'export'))
        events = [json.loads(line) for line in paths['events'].read_text().splitlines()]
        initial = [event for event in events if event.get('kind') == 'initial-source-packet']
        if len(initial) != 1 or result['status'] != 'final_context_selected' or \
                result['unknown_usage_dispatched_requests'] != 0 or \
                settlement['status'] != 'completed' or prediction['instance_id'] != TASK_ID or \
                prediction['commit'] != COMMIT or not prediction['traj_data']['pred_files']:
            raise ValueError('numbered-packet-seal.invalid-arm:' + arm)
        packets[arm] = initial[0]
        arms[arm] = {
            'root': str(root),
            'sha256': {name: sha(path) for name, path in paths.items()},
            'known_model_tokens': result['known_total_tokens'],
            'model_calls': result['model_calls'],
            'duration_seconds': settlement['elapsed_seconds'],
            'selected_files': prediction['traj_data']['pred_files'],
            'initial_paths': [item['path'] for item in initial[0]['receipt']],
            'lead_confirmed': any(item['path'] == LEAD and item.get('confirmed_receipts') for item in
                                  exported['delivery_binding']['read_observations']),
        }
    if packets['baseline'].get('numbered_step_proposals') or \
            packets['numbered_packet'].get('numbered_step_proposals') != [
                {'step': 5, 'path': LEAD, 'matched_terms': ['cli', 'help']}]:
        raise ValueError('numbered-packet-seal.proposal-drift')
    if arms['numbered_packet']['initial_paths'] != arms['baseline']['initial_paths'] + [LEAD] or \
            not arms['numbered_packet']['lead_confirmed']:
        raise ValueError('numbered-packet-seal.packet-or-delivery-drift')
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-pre-score-seal/v3',
        'status': 'sealed-before-native-score',
        'freeze_sha256': FREEZE_SHA,
        'score_unopened': True,
        'arms': arms,
        'claim_ceiling': 'Exposed ARE-only development, no prospective or product superiority.',
    }
    with output.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output),
                      'arms': {arm: {'tokens': row['known_model_tokens'], 'calls': row['model_calls'],
                                     'selected_files': len(row['selected_files']), 'lead_confirmed': row['lead_confirmed']}
                               for arm, row in arms.items()}}))


if __name__ == '__main__':
    main()
