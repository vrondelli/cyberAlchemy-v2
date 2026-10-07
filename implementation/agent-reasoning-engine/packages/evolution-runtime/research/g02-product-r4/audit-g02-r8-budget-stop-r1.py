#!/usr/bin/env python3
"""Independently account for the terminal unscored r8 first pair."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
DEFINITION = BASE / 'g02-product-replication-r8/DEFINITION.json'
DEFINITION_SHA = '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57'
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-01')
OUTPUT = ROOT / 'FAILURE-AUDIT.json'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-budget-stop-audit.' + reason)


def main():
    need(not OUTPUT.exists() and sha(DEFINITION) == DEFINITION_SHA and
         ROOT.is_dir(), 'source-or-output-drift')
    planned = read(DEFINITION)['ordered_pairs'][0]
    binding = read(ROOT / 'tasks/binding.json')
    freeze = read(ROOT / 'FREEZE.json')
    are = read(ROOT / 'evidence/RESULTS.json')
    transport = read(ROOT / 'dsh-control/transport/RESULTS.json')
    settlement = read(ROOT / 'dsh-control/SETTLEMENT.json')
    arms = read(ROOT / 'DRIVER-ARM-OUTCOME.json')
    receipts = sorted((ROOT / 'dsh-control/transport').glob('[0-9]*.json'))
    last = read(receipts[-1])
    need(planned['root'] == str(ROOT) and
         planned['instance_id'] == binding['instance_id'] == freeze['instance_id'] and
         planned['base_commit'] == binding['base_commit'] and
         are['status'] == 'final_context_selected' and
         are['known_total_tokens'] == 57907 and are['model_calls'] == 6 and
         transport['limits']['token_budget'] == 1000000 and
         transport['limits']['window'] == 1000000 and
         transport['limits']['output_cap'] == 16384 and
         transport['known_total_tokens'] == transport['state']['known_total_tokens'] == 960981 and
         transport['model_calls'] == transport['state']['model_calls'] == 26 and
         transport['unknown_usage_dispatched_requests'] == 0 and
         transport['state']['poisoned'] is True and
         last['kind'] == 'receipt' and last['code'] == 'dsh-transport.request-budget' and
         last['ok'] is False and last['dispatched'] is False and
         settlement['exit_code'] == 1 and
         arms[0]['arm'] == 'are' and arms[0]['code'] == 0 and
         arms[1]['arm'] == 'dsh' and arms[1]['code'] == 0 and
         not any((ROOT / name).exists() for name in
                 ('PAIR-DECISION.json', 'PAIR-PRE-SCORE-SEAL.json',
                  'policy-pruning/native-score.json',
                  'dsh-export/native-score.json')),
         'failure-accounting')
    payload = {'schema_version': 'are.g02-r8-budget-stop-audit/v1',
               'status': 'independent-failure-accounting-passed',
               'definition_sha256': DEFINITION_SHA,
               'script_sha256': sha(__file__),
               'task_ordinal': 1, 'instance_id': planned['instance_id'],
               'are_status': are['status'],
               'are_model_calls': are['model_calls'],
               'are_known_tokens': are['known_total_tokens'],
               'dsh_model_calls': transport['model_calls'],
               'dsh_known_tokens': transport['known_total_tokens'],
               'dsh_budget': transport['limits']['token_budget'],
               'dsh_exit_code': settlement['exit_code'],
               'dsh_terminal_receipt_code': last['code'],
               'dsh_terminal_request_dispatched': last['dispatched'],
               'dsh_unknown_usage_dispatched_requests': 0,
               'r8_validity_gate': 'failed-one-unscored-23-unattempted',
               'source_sha256': {
                   'pair_freeze': sha(ROOT / 'FREEZE.json'),
                   'are_results': sha(ROOT / 'evidence/RESULTS.json'),
                   'dsh_results': sha(ROOT / 'dsh-control/transport/RESULTS.json'),
                   'dsh_last_receipt': sha(receipts[-1]),
                   'dsh_settlement': sha(ROOT / 'dsh-control/SETTLEMENT.json')},
               'claim_ceiling': 'Terminal validity/failure accounting only; no matched native quality or superiority.',
               'open_questions': ['Will a separately frozen exposed DSH-only larger budget finish?',
                                  'Will a new fresh successor satisfy 24/24?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
