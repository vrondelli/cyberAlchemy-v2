#!/usr/bin/env python3
"""Independent hash, transformation, order and metric audit of exposed recovery."""

import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr5-index64-ans-2464eadb')
CODE = BASE / 'g02-r5-index64-terminal-recovery-r1'
PROJECTOR = CODE / 'project-g02-r5-selected-pruning-r1.py'
RECOVERY_FREEZE = CODE / 'RECOVERY-FREEZE.json'
RESULT = CODE / 'RECOVERY-RESULT.json'
OUTPUT = ROOT / 'INDEPENDENT-AUDIT.json'
EXPECTED = {
    ROOT / 'FREEZE.json': 'e48e12d78d1e47fed9f48b72d3b5130db7a2abf0a1d3894f407fa615e74612c9',
    ROOT / 'PAIR-PRE-SCORE-SEAL.json': 'f34dd537fbb7c4c11484a0bd020ede154cbd1175c16b1ec5880b2cb72cdece13',
    ROOT / 'ARE-SETTLEMENT.json': 'f33e858b009c2926d05a85407433ce20103712f18c6f1f6c2476a6229d924fe7',
    ROOT / 'dsh-control/SETTLEMENT.json': '3e33789aadddaa10973ff6037c2db056ca4181e7cd33a64e83fe34a67f84dfc5',
    ROOT / 'evidence/run/prediction.json': 'b0eda5fe77f356647c23a868d6a480328d4ef1c4912e7f0ee537117fdf772a89',
    ROOT / 'dsh-export/prediction.json': '19067ff2e26955d3d86858d486024e184b9dadb7ca07700b3829b2c0bdb43f85',
    RECOVERY_FREEZE: 'bcded5276e5bef48aca6dc82e36498ac4d88ae8886b4ccb08f70510b540f4dac',
    RESULT: '5647ec196ef7744283f8799f4f03db7eb743f495e790b543f7fcf0fbf0d3ae95',
    PROJECTOR: 'd56c252c7a1e6c07f1eedd0b6bc86c11008dac639d2fd45f8939a327f4bac749',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-terminal-audit.{reason}')


def f1(value):
    c, p = value['coverage'], value['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    need(ROOT.is_dir() and not OUTPUT.exists() and
         all(sha(path) == digest for path, digest in EXPECTED.items()),
         'source-or-output-drift')
    raw = read(ROOT / 'PAIR-PRE-SCORE-SEAL.json')
    freeze = read(ROOT / 'FREEZE.json')
    recovery = read(RECOVERY_FREEZE)
    result = read(RESULT)
    policy_path = ROOT / 'policy-pruning/POLICY-SEAL.json'
    timing_path = ROOT / 'POLICY-PROJECTION-TIMING.json'
    policy, timing = read(policy_path), read(timing_path)
    need(freeze['task_posture'] == 'exposed-diagnostic' and
         raw['freeze_sha256'] == EXPECTED[ROOT / 'FREEZE.json'] and
         raw['status'] == 'both-valid-predictions-and-costs-sealed-before-scoring' and
         recovery['status'] == 'frozen-before-native-score' and
         recovery['pair_pre_score_seal_sha256'] == EXPECTED[ROOT / 'PAIR-PRE-SCORE-SEAL.json'] and
         result['recovery_freeze_sha256'] == EXPECTED[RECOVERY_FREEZE] and
         result['status'] == 'both-native-scores-complete', 'freeze-lineage')
    for arm, relative in (('are', 'evidence/run/prediction.json'),
                          ('dsh', 'dsh-export/prediction.json')):
        need(raw['predictions'][arm]['sha256'] == EXPECTED[ROOT / relative],
             f'raw-prediction:{arm}')
    need(policy['status'] == 'prediction-sealed-before-native-score' and
         policy['script_sha256'] == EXPECTED[PROJECTOR] and
         policy['source_prediction_sha256'] == EXPECTED[ROOT / 'evidence/run/prediction.json'] and
         policy['prediction_sha256'] == sha(ROOT / 'policy-pruning/prediction.json') and
         policy['packet_sha256'] == sha(ROOT / 'policy-pruning/PACKET.json') and
         policy['features_sha256'] == sha(ROOT / 'policy-pruning/FEATURES.json') and
         result['policy_seal_sha256'] == sha(policy_path) and
         result['policy_prediction_sha256'] == policy['prediction_sha256'] and
         timing['policy_seal_sha256'] == sha(policy_path) and
         timing['pair_seal_sha256'] == EXPECTED[ROOT / 'PAIR-PRE-SCORE-SEAL.json'] and
         result['policy_projection_timing_sha256'] == sha(timing_path),
         'policy-lineage')
    spec = importlib.util.spec_from_file_location('g02_r5_projector', PROJECTOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    original_path, packet, features, probabilities, candidate = module.project(ROOT)
    need(sha(original_path) == EXPECTED[original_path] and
         module.encoded(candidate) == (ROOT / 'policy-pruning/prediction.json').read_bytes() and
         module.encoded(packet) == (ROOT / 'policy-pruning/PACKET.json').read_bytes() and
         module.encoded(features) == (ROOT / 'policy-pruning/FEATURES.json').read_bytes() and
         probabilities == policy['selected_probabilities'], 'policy-replay')
    scores = {}
    for arm, relative in (('are', 'policy-pruning/native-score.json'),
                          ('dsh', 'dsh-export/native-score.json')):
        path = ROOT / relative
        native = read(path)['native']['final']
        row = result['quality'][arm]
        seconds = raw['arm_seconds'][arm] + (timing['projection_seconds'] if arm == 'are' else 0)
        need(row['score_sha256'] == sha(path) and
             abs(row['file_f1'] - f1(native['file'])) < 1e-12 and
             abs(row['span_f1'] - f1(native['span'])) < 1e-12 and
             row['known_model_tokens'] == raw['known_model_tokens'][arm] and
             abs(row['arm_seconds'] - seconds) < 1e-9,
             f'metric-or-cost:{arm}')
        scores[arm] = row
    raw_time = (ROOT / 'PAIR-PRE-SCORE-SEAL.json').stat().st_mtime_ns
    policy_time = policy_path.stat().st_mtime_ns
    timing_time = timing_path.stat().st_mtime_ns
    score_time = min((ROOT / 'policy-pruning/native-score.json').stat().st_mtime_ns,
                     (ROOT / 'dsh-export/native-score.json').stat().st_mtime_ns)
    need(raw_time < policy_time <= timing_time < score_time, 'pre-score-order')
    passed = all(scores['are'][metric] > scores['dsh'][metric]
                 for metric in ('file_f1', 'span_f1')) and all(
                 scores['are'][metric] < scores['dsh'][metric]
                 for metric in ('known_model_tokens', 'arm_seconds'))
    need(result['observed_four_conditions'] == passed, 'condition-recompute')
    payload = {'schema_version': 'are.g02-r5-terminal-independent-audit/v1',
               'status': 'independent-audit-passed',
               'posture': 'evaluator-exposed-development',
               'script_sha256': sha(__file__),
               'recovery_result_sha256': EXPECTED[RESULT],
               'raw_pair_seal_sha256': EXPECTED[ROOT / 'PAIR-PRE-SCORE-SEAL.json'],
               'projector_replay': 'exact prediction, packet, feature and probability match',
               'native_score_hashes': {arm: scores[arm]['score_sha256'] for arm in scores},
               'quality': scores, 'observed_four_conditions': passed,
               'claim_ceiling': 'One valid exposed pair; no causal index effect, cohort interval or superiority.',
               'open_questions': ['Does a distinct untouched cohort reproduce quality and cost advantages?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'observed_four_conditions': passed}, sort_keys=True))


if __name__ == '__main__':
    main()
