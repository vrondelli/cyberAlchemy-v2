#!/usr/bin/env python3
"""Independent audit of the exposed r7 cache-access recovery diagnostic."""

import argparse
import copy
import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
DEFINITION = BASE / 'g02-product-replication-r7/DEFINITION.json'
DEV_FREEZE = BASE / 'g02-r7-cache-access-dev-pair-r1/FREEZE.json'
DEV_FREEZE_SHA = 'b590a6b7573b9b10729a7172997348945e40a1c568006840fa94b0236a42ae7b'
DEFINITION_SHA = '7bf6328b48d6f519984809ebcb66ec950d2ff883a2a0ad68e067e4397d57bf00'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r7-cache-dev-audit.{reason}')


def f1(value):
    coverage, precision = value['coverage'], value['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def audit(root, planned):
    need(root == Path(planned['root']) and root.is_dir() and
         not (root / 'INDEPENDENT-AUDIT.json').exists(), 'root-or-output')
    freeze = read(root / 'FREEZE.json')
    binding = read(root / 'tasks/binding.json')
    need(freeze['instance_id'] == binding['instance_id'] == planned['instance_id'] and
         binding['base_commit'] == planned['base_commit'] and
         freeze['own_expansions_fix'] is True and
         freeze['task_posture'] == 'exposed-diagnostic',
         'task-binding')
    need(all(sha(root / path) == digest for path, digest in freeze['source_hashes'].items()),
         'frozen-source-drift')
    need(sha(root / 'tasks' / binding['task_file']) == binding['task_sha256'],
         'task-source-drift')
    decision_path = root / 'PAIR-DECISION.json'
    need(decision_path.is_file(), 'decision-missing')
    decision = read(decision_path)
    need(decision['instance_id'] == planned['instance_id'], 'decision-task')
    if decision['strict_four_gate_decision'] == 'unscored-invalid-arm':
        need(not any((root / path).exists() for path in
                     ('PAIR-PRE-SCORE-SEAL.json', 'policy-pruning/native-score.json',
                      'dsh-export/native-score.json')), 'invalid-arm-was-scored')
        return {'ordinal': planned['ordinal'], 'instance_id': planned['instance_id'],
                'repo': planned['repo'], 'status': 'invalid-unscored',
                'reason': decision.get('arm_status'),
                'decision_sha256': sha(decision_path)}
    need(decision['strict_four_gate_decision'] in ('pass', 'fail'), 'decision-kind')
    raw_path = root / 'PAIR-PRE-SCORE-SEAL.json'
    policy_path = root / 'policy-pruning/POLICY-SEAL.json'
    timing_path = root / 'POLICY-PROJECTION-TIMING.json'
    raw, policy, timing = (read(path) for path in (raw_path, policy_path, timing_path))
    need(raw['status'] == 'both-valid-predictions-and-costs-sealed-before-scoring' and
         raw['instance_id'] == planned['instance_id'] and
         raw['freeze_sha256'] == sha(root / 'FREEZE.json') and
         decision['pre_score_seal_sha256'] == sha(raw_path) and
         decision['policy_seal_sha256'] == sha(policy_path) and
         decision['policy_projection_timing_sha256'] == sha(timing_path) and
         policy['status'] == 'prediction-sealed-before-native-score' and
         timing['policy_seal_sha256'] == sha(policy_path) and
         timing['raw_pair_seal_sha256'] == sha(raw_path) and
         timing['projection_seconds'] == decision['policy_projection_seconds'] and
         timing['projection_seconds'] >= 0, 'seal-or-timing-binding')
    for arm, relative in (('are', 'evidence/run/prediction.json'),
                          ('dsh', 'dsh-export/prediction.json')):
        need(raw['predictions'][arm]['sha256'] == sha(root / relative),
             f'raw-prediction-drift:{arm}')
    candidate_path = root / 'policy-pruning/prediction.json'
    need(policy['source_prediction_sha256'] == raw['predictions']['are']['sha256'] and
         policy['prediction_sha256'] == decision['policy_prediction_sha256'] ==
         sha(candidate_path) and
         policy['packet_sha256'] == sha(root / 'policy-pruning/PACKET.json') and
         policy['features_sha256'] == sha(root / 'policy-pruning/FEATURES.json') and
         policy['model_sha256'] == read(DEFINITION)['model_sha256'],
         'policy-binding')
    original, candidate = read(root / 'evidence/run/prediction.json'), read(candidate_path)
    selected, retained = original['traj_data']['pred_files'], candidate['traj_data']['pred_files']
    need(retained and len(retained) == len(set(retained)) and set(retained) <= set(selected) and
         candidate['traj_data']['pred_spans'] == {
             path: original['traj_data']['pred_spans'][path] for path in retained},
         'deletion-only-spans')
    restored = copy.deepcopy(original)
    restored['traj_data']['pred_files'] = retained
    restored['traj_data']['pred_spans'] = candidate['traj_data']['pred_spans']
    need(restored == candidate, 'unexpected-prediction-mutation')
    scores = {}
    for arm, relative in (('are', 'policy-pruning/native-score.json'),
                          ('dsh', 'dsh-export/native-score.json')):
        score_path = root / relative
        native = read(score_path)['native']['final']
        row = decision['quality'][arm]
        expected_seconds = raw['arm_seconds'][arm] + (
            timing['projection_seconds'] if arm == 'are' else 0)
        need(sha(score_path) == row['score_sha256'] and
             abs(f1(native['file']) - row['file_f1']) < 1e-12 and
             abs(f1(native['span']) - row['span_f1']) < 1e-12 and
             row['known_model_tokens'] == raw['known_model_tokens'][arm] and
             abs(row['arm_seconds'] - expected_seconds) < 1e-9,
             f'metric-or-cost:{arm}')
        scores[arm] = {'file_f1': row['file_f1'], 'span_f1': row['span_f1'],
                       'known_model_tokens': row['known_model_tokens'],
                       'arm_seconds': row['arm_seconds'],
                       'score_sha256': row['score_sha256']}
    need(raw_path.stat().st_mtime_ns <= policy_path.stat().st_mtime_ns <=
         timing_path.stat().st_mtime_ns < min((root / 'policy-pruning/native-score.json').stat().st_mtime_ns,
                                             (root / 'dsh-export/native-score.json').stat().st_mtime_ns),
         'score-order')
    passed = all(scores['are'][metric] > scores['dsh'][metric]
                 for metric in ('file_f1', 'span_f1')) and all(
                 scores['are'][metric] < scores['dsh'][metric]
                 for metric in ('known_model_tokens', 'arm_seconds'))
    need((decision['strict_four_gate_decision'] == 'pass') == passed,
         'four-gate-recompute')
    return {'ordinal': planned['ordinal'], 'instance_id': planned['instance_id'],
            'repo': planned['repo'], 'status': 'valid-scored',
            'freeze_sha256': sha(root / 'FREEZE.json'),
            'raw_seal_sha256': sha(raw_path), 'policy_seal_sha256': sha(policy_path),
            'timing_sha256': sha(timing_path),
            'decision_sha256': sha(decision_path), 'quality': scores,
            'original_files': len(selected), 'retained_files': len(retained),
            'four_gate_passed': passed}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    need(sha(DEV_FREEZE) == DEV_FREEZE_SHA and sha(DEFINITION) == DEFINITION_SHA,
         'freeze-or-model-source-drift')
    frozen = read(DEV_FREEZE)
    root = args.root.resolve()
    planned = {'ordinal': 1, 'instance_id': frozen['instance_id'],
               'repo': frozen['repo'], 'base_commit': frozen['base_commit'],
               'root': frozen['pair_root']}
    need(str(root) == frozen['pair_root'] and
         frozen['posture'] == 'evaluator-exposed-reliability-diagnostic-after-terminal-r7',
         'planned-root')
    row = audit(root, planned)
    payload = {'schema_version': 'are.g02-r7-cache-access-dev-audit/v1',
               'status': 'independent-audit-passed',
               'development_freeze_sha256': DEV_FREEZE_SHA,
               'r7_definition_sha256': DEFINITION_SHA,
               'script_sha256': sha(__file__), 'row': row,
               'claim_ceiling': 'One exposed post-r7 reliability diagnostic; not a fresh cohort, r7 repair, or superiority result.',
               'open_questions': ['Will the separately frozen r8 cohort complete 24/24?',
                                  'Will r8 quality and all-in efficiency intervals pass?']}
    output = root / 'INDEPENDENT-AUDIT.json'
    with output.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': row['status'], 'sha256': sha(output),
                      'four_gate_passed': row.get('four_gate_passed')}))

if __name__ == '__main__':
    main()
