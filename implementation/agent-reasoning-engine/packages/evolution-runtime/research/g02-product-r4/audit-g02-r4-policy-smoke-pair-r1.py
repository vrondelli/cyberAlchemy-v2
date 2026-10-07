#!/usr/bin/env python3
"""Independent hash, prediction, ordering and metric audit of the r4 smoke pair."""

import copy
import hashlib
import json
from pathlib import Path


ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-smoke-ansible-policy-r4')
OUTPUT = ROOT / 'INDEPENDENT-AUDIT.json'
TASK = 'SWE-Bench-Pro__python__maintenance__bugfix__9c878ad5'
DRIVER = Path('/opt/are/evolution-runtime/g02-product-replication-tools-r4-policy-gitfix-r1')
DRIVER_MANIFEST_SHA = '925b163bc9d2fa44ec2c47793bd186928d5d2ff8f119a7b75d5bb2826a9aba60'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-smoke-audit.{reason}')


def f1(value):
    coverage, precision = value['coverage'], value['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    need(ROOT.is_dir() and not OUTPUT.exists() and
         sha(DRIVER / 'GITFIX-SOURCE.json') == DRIVER_MANIFEST_SHA,
         'root-or-driver-drift')
    freeze = read(ROOT / 'FREEZE.json')
    binding = read(ROOT / 'tasks/binding.json')
    raw = read(ROOT / 'PAIR-PRE-SCORE-SEAL.json')
    policy = read(ROOT / 'policy-pruning/POLICY-SEAL.json')
    decision = read(ROOT / 'PAIR-DECISION.json')
    are = read(ROOT / 'evidence/RESULTS.json')
    dsh = read(ROOT / 'dsh-export/EXPORT.json')
    are_settlement = read(ROOT / 'ARE-SETTLEMENT.json')
    dsh_settlement = read(ROOT / 'dsh-control/SETTLEMENT.json')
    need(freeze['task_posture'] == 'exposed-diagnostic' and
         freeze['instance_id'] == binding['instance_id'] == raw['instance_id'] ==
         decision['instance_id'] == TASK, 'task-binding')
    need(all(sha(ROOT / path) == digest for path, digest in freeze['source_hashes'].items()),
         'frozen-source-drift')
    need(sha(ROOT / 'FREEZE.json') == raw['freeze_sha256'] and
         sha(ROOT / 'PAIR-PRE-SCORE-SEAL.json') == decision['pre_score_seal_sha256'] and
         sha(ROOT / 'policy-pruning/POLICY-SEAL.json') == decision['policy_seal_sha256'],
         'seal-binding')
    for arm, path in (('are', 'evidence/run/prediction.json'),
                      ('dsh', 'dsh-export/prediction.json')):
        need(sha(ROOT / path) == raw['predictions'][arm]['sha256'],
             f'raw-prediction-drift:{arm}')
    need(policy['status'] == 'prediction-sealed-before-native-score' and
         policy['source_prediction_sha256'] == raw['predictions']['are']['sha256'] and
         policy['prediction_sha256'] == decision['policy_prediction_sha256'] ==
         sha(ROOT / 'policy-pruning/prediction.json') and
         policy['packet_sha256'] == sha(ROOT / 'policy-pruning/PACKET.json') and
         policy['features_sha256'] == sha(ROOT / 'policy-pruning/FEATURES.json'),
         'policy-binding')
    original = read(ROOT / 'evidence/run/prediction.json')
    candidate = read(ROOT / 'policy-pruning/prediction.json')
    selected = original['traj_data']['pred_files']
    retained = candidate['traj_data']['pred_files']
    need(set(retained) <= set(selected) and retained and len(retained) == len(set(retained)) and
         candidate['traj_data']['pred_spans'] == {
             path: original['traj_data']['pred_spans'][path] for path in retained},
         'deletion-only-spans')
    restored = copy.deepcopy(original)
    restored['traj_data']['pred_files'] = retained
    restored['traj_data']['pred_spans'] = candidate['traj_data']['pred_spans']
    need(restored == candidate, 'unexpected-prediction-mutation')
    need(are['status'] == dsh['status'] == 'final_context_selected' and
         are['model_calls'] > 0 and raw['known_model_tokens']['are'] == are['known_total_tokens'] and
         raw['known_model_tokens']['dsh'] == dsh['accounting']['known_total_tokens'] and
         are_settlement['exit_code'] == dsh_settlement['exit_code'] == 0,
         'arm-settlement')
    scores = {}
    for arm, path in (('are', 'policy-pruning/native-score.json'),
                      ('dsh', 'dsh-export/native-score.json')):
        final = read(ROOT / path)['native']['final']
        row = decision['quality'][arm]
        need(sha(ROOT / path) == row['score_sha256'] and
             abs(f1(final['file']) - row['file_f1']) < 1e-12 and
             abs(f1(final['span']) - row['span_f1']) < 1e-12 and
             row['known_model_tokens'] == raw['known_model_tokens'][arm] and
             row['arm_seconds'] == raw['arm_seconds'][arm],
             f'score-or-cost:{arm}')
        scores[arm] = {'file_f1': row['file_f1'], 'span_f1': row['span_f1'],
                       'known_model_tokens': row['known_model_tokens'],
                       'arm_seconds': row['arm_seconds']}
    need((ROOT / 'PAIR-PRE-SCORE-SEAL.json').stat().st_mtime_ns <=
         (ROOT / 'policy-pruning/POLICY-SEAL.json').stat().st_mtime_ns <
         min((ROOT / 'policy-pruning/native-score.json').stat().st_mtime_ns,
             (ROOT / 'dsh-export/native-score.json').stat().st_mtime_ns),
         'score-order')
    passed = all(scores['are'][key] > scores['dsh'][key]
                 for key in ('file_f1', 'span_f1')) and all(
                 scores['are'][key] < scores['dsh'][key]
                 for key in ('known_model_tokens', 'arm_seconds'))
    need((decision['strict_four_gate_decision'] == 'pass') == passed and not passed,
         'decision-mismatch')
    payload = {'schema_version': 'are.g02-r4-policy-smoke-audit/v1',
               'status': 'independent-audit-passed',
               'task_posture': 'already-exposed-excluded-smoke-id',
               'driver_manifest_sha256': DRIVER_MANIFEST_SHA,
               'freeze_sha256': sha(ROOT / 'FREEZE.json'),
               'pre_score_seal_sha256': sha(ROOT / 'PAIR-PRE-SCORE-SEAL.json'),
               'policy_seal_sha256': sha(ROOT / 'policy-pruning/POLICY-SEAL.json'),
               'decision_sha256': sha(ROOT / 'PAIR-DECISION.json'),
               'script_sha256': sha(__file__), 'original_files': len(selected),
               'retained_files': len(retained), 'scores': scores,
               'token_ratio': scores['are']['known_model_tokens'] / scores['dsh']['known_model_tokens'],
               'time_ratio': scores['are']['arm_seconds'] / scores['dsh']['arm_seconds'],
               'four_gate_passed': passed,
               'claim_ceiling': 'One exposed smoke pair; no fresh-cohort or superiority inference.',
               'open_questions': ['Will a fresh task preserve quality and cost?',
                                  'Can the complete 24-pair cohort satisfy the frozen intervals?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'four_gate_passed': passed, 'token_ratio': payload['token_ratio'],
                      'time_ratio': payload['time_ratio']}))


if __name__ == '__main__':
    main()
