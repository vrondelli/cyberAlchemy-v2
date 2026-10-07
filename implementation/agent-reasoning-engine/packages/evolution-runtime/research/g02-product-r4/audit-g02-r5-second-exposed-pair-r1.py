#!/usr/bin/env python3
"""Independent receipt, policy and metric audit of the second exposed r5 pair."""

import copy
import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr5-index64-ans-83c269c9')
DEFINITION = BASE / 'g02-r5-index64-exposed-ans-83c269c9-r1/FREEZE.json'
OUTPUT = ROOT / 'INDEPENDENT-AUDIT.json'
DEFINITION_SHA = '6063ef9a2d94aa9f92ac3d1a5267a7c7748deb2294bcdda7bd1bb0f791388a65'
PAIR_FREEZE_SHA = '076034b0d32b321d2addcf1f89e8735a4b5410c5dbcdd02fc3a8b68ee9b0e8d7'
DECISION_SHA = 'd92820ffdf972ba10f446c0e3b60c816ac4bd68be7878d843c12c0c21a10513d'
PAIR_SEAL_SHA = '04f518f31b0e86c1652ca7661df4c52bae349f0cbc78d5cbc3db8e2172ce229a'
POLICY_SEAL_SHA = '9a96471b6fbc4322990ac89b7e0f7c22173bb87b8664a85b08b76fda22b68485'
MODEL_SHA = 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2'
PROJECTOR_SHA = 'd56c252c7a1e6c07f1eedd0b6bc86c11008dac639d2fd45f8939a327f4bac749'
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__83c269c9'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-second-pair-audit.{reason}')


def f1(value):
    c, p = value['coverage'], value['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    need(not OUTPUT.exists() and ROOT.is_dir() and
         sha(DEFINITION) == DEFINITION_SHA and
         sha(ROOT / 'FREEZE.json') == PAIR_FREEZE_SHA and
         sha(ROOT / 'PAIR-DECISION.json') == DECISION_SHA and
         sha(ROOT / 'PAIR-PRE-SCORE-SEAL.json') == PAIR_SEAL_SHA and
         sha(ROOT / 'policy-pruning/POLICY-SEAL.json') == POLICY_SEAL_SHA,
         'frozen-input-drift')
    definition, freeze, binding = (read(p) for p in
                                   (DEFINITION, ROOT / 'FREEZE.json', ROOT / 'tasks/binding.json'))
    need(definition['instance_id'] == freeze['instance_id'] ==
         binding['instance_id'] == TASK_ID and
         definition['base_commit'] == binding['base_commit'] and
         freeze['task_posture'] == 'exposed-diagnostic' and
         freeze['own_expansions_fix'] is True and
         all(sha(ROOT / path) == digest for path, digest in freeze['source_hashes'].items()) and
         sha(ROOT / 'tasks' / binding['task_file']) == binding['task_sha256'],
         'identity-or-source-binding')
    raw = read(ROOT / 'PAIR-PRE-SCORE-SEAL.json')
    policy = read(ROOT / 'policy-pruning/POLICY-SEAL.json')
    timing = read(ROOT / 'POLICY-PROJECTION-TIMING.json')
    decision = read(ROOT / 'PAIR-DECISION.json')
    need(raw['status'] == 'both-valid-predictions-and-costs-sealed-before-scoring' and
         raw['freeze_sha256'] == PAIR_FREEZE_SHA and
         decision['pre_score_seal_sha256'] == PAIR_SEAL_SHA and
         decision['policy_seal_sha256'] == POLICY_SEAL_SHA and
         decision['policy_projection_timing_sha256'] == sha(ROOT / 'POLICY-PROJECTION-TIMING.json') and
         policy['status'] == 'prediction-sealed-before-native-score' and
         policy['script_sha256'] == PROJECTOR_SHA and
         policy['model_sha256'] == MODEL_SHA and
         timing['policy_seal_sha256'] == POLICY_SEAL_SHA and
         timing['raw_pair_seal_sha256'] == PAIR_SEAL_SHA and
         timing['projection_seconds'] == decision['policy_projection_seconds'] >= 0,
         'seal-lineage')
    for arm, relative in (('are', 'evidence/run/prediction.json'),
                          ('dsh', 'dsh-export/prediction.json')):
        need(raw['predictions'][arm]['sha256'] == sha(ROOT / relative),
             f'raw-prediction:{arm}')
    original, candidate = read(ROOT / 'evidence/run/prediction.json'), \
                          read(ROOT / 'policy-pruning/prediction.json')
    selected, retained = original['traj_data']['pred_files'], candidate['traj_data']['pred_files']
    need(policy['source_prediction_sha256'] == raw['predictions']['are']['sha256'] and
         policy['prediction_sha256'] == decision['policy_prediction_sha256'] ==
         sha(ROOT / 'policy-pruning/prediction.json') and
         policy['packet_sha256'] == sha(ROOT / 'policy-pruning/PACKET.json') and
         policy['features_sha256'] == sha(ROOT / 'policy-pruning/FEATURES.json') and
         retained and len(retained) == len(set(retained)) and set(retained) <= set(selected) and
         candidate['traj_data']['pred_spans'] == {
             path: original['traj_data']['pred_spans'][path] for path in retained},
         'policy-or-deletion-only')
    replay = copy.deepcopy(original)
    replay['traj_data']['pred_files'] = retained
    replay['traj_data']['pred_spans'] = candidate['traj_data']['pred_spans']
    need(replay == candidate, 'unexpected-prediction-mutation')
    scores = {}
    for arm, relative in (('are', 'policy-pruning/native-score.json'),
                          ('dsh', 'dsh-export/native-score.json')):
        path = ROOT / relative
        native = read(path)['native']['final']
        row = decision['quality'][arm]
        expected_seconds = raw['arm_seconds'][arm] + (
            timing['projection_seconds'] if arm == 'are' else 0)
        need(row['score_sha256'] == sha(path) and
             abs(row['file_f1'] - f1(native['file'])) < 1e-12 and
             abs(row['span_f1'] - f1(native['span'])) < 1e-12 and
             row['known_model_tokens'] == raw['known_model_tokens'][arm] and
             abs(row['arm_seconds'] - expected_seconds) < 1e-9,
             f'metric-or-cost:{arm}')
        scores[arm] = row
    need((ROOT / 'PAIR-PRE-SCORE-SEAL.json').stat().st_mtime_ns <
         (ROOT / 'policy-pruning/POLICY-SEAL.json').stat().st_mtime_ns <=
         (ROOT / 'POLICY-PROJECTION-TIMING.json').stat().st_mtime_ns <
         min((ROOT / 'policy-pruning/native-score.json').stat().st_mtime_ns,
             (ROOT / 'dsh-export/native-score.json').stat().st_mtime_ns),
         'pre-score-order')
    passed = all(scores['are'][key] > scores['dsh'][key]
                 for key in ('file_f1', 'span_f1')) and all(
                 scores['are'][key] < scores['dsh'][key]
                 for key in ('known_model_tokens', 'arm_seconds'))
    need((decision['strict_four_gate_decision'] == 'pass') == passed,
         'four-condition-recompute')
    payload = {'schema_version': 'are.g02-r5-second-exposed-pair-audit/v1',
               'status': 'independent-audit-passed',
               'posture': 'evaluator-exposed-development',
               'script_sha256': sha(__file__), 'definition_sha256': DEFINITION_SHA,
               'pair_freeze_sha256': PAIR_FREEZE_SHA,
               'pair_pre_score_seal_sha256': PAIR_SEAL_SHA,
               'decision_sha256': DECISION_SHA, 'policy_seal_sha256': POLICY_SEAL_SHA,
               'original_files': len(selected), 'retained_files': len(retained),
               'quality': scores, 'observed_four_conditions': passed,
               'claim_ceiling': 'One exposed pair; no causal index effect, cohort interval or superiority.',
               'open_questions': ['Can time regressions be reduced without sacrificing quality?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'observed_four_conditions': passed}, sort_keys=True))


if __name__ == '__main__':
    main()
