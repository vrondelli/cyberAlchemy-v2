#!/usr/bin/env python3
"""Terminal-only recovery of a sealed, evaluator-exposed G02 pair; no model calls."""

import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr5-index64-ans-2464eadb')
CODE = BASE / 'g02-r5-index64-terminal-recovery-r1'
PROJECTOR = CODE / 'project-g02-r5-selected-pruning-r1.py'
PROJECTOR_MANIFEST = CODE / 'PROJECTOR-SOURCE.json'
RECOVERY_FREEZE = CODE / 'RECOVERY-FREEZE.json'
RESULT = CODE / 'RECOVERY-RESULT.json'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
IMAGE = 'are-contextbench-scorer:g01-r1'
IMAGE_ID = 'sha256:e592d8dcd42b3218edd36dbf1b959ef5964f203d099f382a301e2ec9bf1941ff'
PAIR_FREEZE_SHA = 'e48e12d78d1e47fed9f48b72d3b5130db7a2abf0a1d3894f407fa615e74612c9'
PAIR_SEAL_SHA = 'f34dd537fbb7c4c11484a0bd020ede154cbd1175c16b1ec5880b2cb72cdece13'
ARE_PRED_SHA = 'b0eda5fe77f356647c23a868d6a480328d4ef1c4912e7f0ee537117fdf772a89'
DSH_PRED_SHA = '19067ff2e26955d3d86858d486024e184b9dadb7ca07700b3829b2c0bdb43f85'
PROJECTOR_SHA = 'd56c252c7a1e6c07f1eedd0b6bc86c11008dac639d2fd45f8939a327f4bac749'
PROJECTOR_MANIFEST_SHA = '3c47ef26ed29e66c9c2c081b7c1d345e3f25ed29319e3514591253f7cf0b24a1'
SCORER_SHA = '2bddabec8393585faa93df47bc0c2444c094852232bb228c406c4c5dc5325f6f'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-terminal-recovery.{reason}')


def read(path):
    return json.loads(Path(path).read_text())


def save_new(path, value):
    with Path(path).open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def preflight(*, before_run):
    need(ROOT.is_dir() and ROOT.parent == Path('/tmp/are-g02-r4-runs') and
         sha(ROOT / 'FREEZE.json') == PAIR_FREEZE_SHA and
         sha(ROOT / 'PAIR-PRE-SCORE-SEAL.json') == PAIR_SEAL_SHA and
         sha(ROOT / 'evidence/run/prediction.json') == ARE_PRED_SHA and
         sha(ROOT / 'dsh-export/prediction.json') == DSH_PRED_SHA and
         sha(PROJECTOR) == PROJECTOR_SHA and
         sha(PROJECTOR_MANIFEST) == PROJECTOR_MANIFEST_SHA and
         sha(SCORER) == SCORER_SHA, 'sealed-source-drift')
    image = subprocess.run(['docker', 'image', 'inspect', '--format', '{{.Id}}', IMAGE],
                           capture_output=True, text=True)
    need(image.returncode == 0 and image.stdout.strip() == IMAGE_ID, 'scorer-image-drift')
    seal = read(ROOT / 'PAIR-PRE-SCORE-SEAL.json')
    need(seal['status'] == 'both-valid-predictions-and-costs-sealed-before-scoring' and
         seal['predictions']['are']['sha256'] == ARE_PRED_SHA and
         seal['predictions']['dsh']['sha256'] == DSH_PRED_SHA and
         read(ROOT / 'ARE-SETTLEMENT.json')['status'] == 'completed' and
         read(ROOT / 'dsh-control/SETTLEMENT.json')['exit_code'] == 0 and
         not (ROOT / 'PAIR-DECISION.json').exists(), 'arm-or-score-state')
    if before_run:
        need(sha(RECOVERY_FREEZE) == RECOVERY_FREEZE_SHA and
             not (ROOT / 'policy-pruning').exists() and
             not (ROOT / 'POLICY-PROJECTION-TIMING.json').exists() and
             not (ROOT / 'dsh-export/native-score.json').exists() and
             not RESULT.exists(), 'recovery-already-started')
    return seal


def f1(value):
    return (2 * value['coverage'] * value['precision'] /
            (value['coverage'] + value['precision'])
            if value['coverage'] + value['precision'] else 0.0)


def score(arm, work):
    output = ROOT / f'{arm}-score-stdout.txt'
    error = ROOT / f'{arm}-score-stderr.txt'
    with output.open('x') as stdout, error.open('x') as stderr:
        command = ['docker', 'run', '--rm', '--network', 'host',
                   '-v', f'{SCORER_BASE}/repo:/repo:ro',
                   '-v', f'{SCORER_BASE}/upstream:/upstream:ro',
                   '-v', f'{SCORER_BASE}/scoring-cache:/cache',
                   '-v', f'{ROOT}/{work}:/work', IMAGE, 'python',
                   '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
                   '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
                   '--pred', '/work/prediction.json', '--cache', '/cache',
                   '--out', '/work/native-score.json']
        run = subprocess.run(command, stdin=subprocess.DEVNULL, stdout=stdout,
                             stderr=stderr, timeout=300)
    need(run.returncode == 0 and (ROOT / work / 'native-score.json').is_file(),
         f'score-failed:{arm}')


def prepare():
    need(not RECOVERY_FREEZE.exists(), 'freeze-exists')
    seal = preflight(before_run=False)
    need(not (ROOT / 'policy-pruning').exists() and
         not (ROOT / 'dsh-export/native-score.json').exists() and
         not RESULT.exists(), 'terminal-only-state')
    payload = {'schema_version': 'are.g02-r5-terminal-recovery-freeze/v1',
               'status': 'frozen-before-native-score',
               'posture': 'evaluator-exposed-terminal-only-recovery',
               'cause': 'Both model arms and raw predictions sealed; r4 projector rejected pr5 root prefix before native scoring.',
               'pair_freeze_sha256': PAIR_FREEZE_SHA,
               'pair_pre_score_seal_sha256': PAIR_SEAL_SHA,
               'are_prediction_sha256': ARE_PRED_SHA,
               'dsh_prediction_sha256': DSH_PRED_SHA,
               'projector_sha256': PROJECTOR_SHA,
               'projector_manifest_sha256': PROJECTOR_MANIFEST_SHA,
               'scorer_sha256': SCORER_SHA, 'scorer_image_id': IMAGE_ID,
               'recovery_script_sha256': sha(__file__),
               'known_model_tokens': seal['known_model_tokens'],
               'arm_seconds': seal['arm_seconds'],
               'allowed_operations': ['fixed-policy projection of already sealed ARE prediction',
                                      'native score of sealed projected ARE and sealed DSH predictions',
                                      'result receipt'],
               'forbidden_operations': ['GLM request', 'model-arm rerun', 'new task',
                                        'prediction replacement', 'publication'],
               'claim_ceiling': 'One exposed development pair; no causal index effect or superiority claim.',
               'open_questions': ['Will both native scores complete and verify?']}
    save_new(RECOVERY_FREEZE, payload)
    print(json.dumps({'status': payload['status'], 'sha256': sha(RECOVERY_FREEZE)}))


def run():
    seal = preflight(before_run=True)
    need(read(RECOVERY_FREEZE)['recovery_script_sha256'] == sha(__file__),
         'recovery-script-drift')
    started = time.monotonic()
    projected = subprocess.run(['python3', str(PROJECTOR), 'produce-fresh',
                                '--root', str(ROOT)], capture_output=True, text=True,
                               timeout=120)
    need(projected.returncode == 0, 'projector-failed:' + projected.stderr[-400:])
    projection_seconds = time.monotonic() - started
    policy = read(ROOT / 'policy-pruning/POLICY-SEAL.json')
    need(policy['status'] == 'prediction-sealed-before-native-score' and
         policy['source_prediction_sha256'] == ARE_PRED_SHA and
         policy['prediction_sha256'] == sha(ROOT / 'policy-pruning/prediction.json'),
         'policy-seal-drift')
    save_new(ROOT / 'POLICY-PROJECTION-TIMING.json',
             {'schema_version': 'are.g02-r5-terminal-projection-timing/v1',
              'policy_seal_sha256': sha(ROOT / 'policy-pruning/POLICY-SEAL.json'),
              'pair_seal_sha256': PAIR_SEAL_SHA,
              'projection_seconds': projection_seconds})
    score('are', 'policy-pruning')
    score('dsh', 'dsh-export')
    quality = {}
    for arm, path in (('are', ROOT / 'policy-pruning/native-score.json'),
                      ('dsh', ROOT / 'dsh-export/native-score.json')):
        value = read(path)['native']['final']
        quality[arm] = {'span_f1': f1(value['span']), 'file_f1': f1(value['file']),
                        'known_model_tokens': seal['known_model_tokens'][arm],
                        'arm_seconds': seal['arm_seconds'][arm] +
                        (projection_seconds if arm == 'are' else 0),
                        'score_sha256': sha(path)}
    passed = (quality['are']['span_f1'] > quality['dsh']['span_f1'] and
              quality['are']['file_f1'] > quality['dsh']['file_f1'] and
              quality['are']['known_model_tokens'] < quality['dsh']['known_model_tokens'] and
              quality['are']['arm_seconds'] < quality['dsh']['arm_seconds'])
    payload = {'schema_version': 'are.g02-r5-terminal-recovery-result/v1',
               'status': 'both-native-scores-complete',
               'posture': 'evaluator-exposed-development',
               'recovery_freeze_sha256': RECOVERY_FREEZE_SHA,
               'pair_pre_score_seal_sha256': PAIR_SEAL_SHA,
               'policy_seal_sha256': sha(ROOT / 'policy-pruning/POLICY-SEAL.json'),
               'policy_prediction_sha256': policy['prediction_sha256'],
               'policy_projection_timing_sha256': sha(ROOT / 'POLICY-PROJECTION-TIMING.json'),
               'quality': quality, 'observed_four_conditions': passed,
               'claim_ceiling': 'One exposed, terminally recovered pair; not causal index evidence or superiority.',
               'open_questions': ['Does an independent audit reproduce both scores and receipt order?',
                                  'Does the mechanism transfer across repositories on a new cohort?']}
    save_new(RESULT, payload)
    print(json.dumps({'status': payload['status'], 'sha256': sha(RESULT),
                      'quality': quality, 'observed_four_conditions': passed}, sort_keys=True))


if __name__ == '__main__':
    if sys.argv[1:2] not in (['prepare'], ['run']) or \
            (sys.argv[1] == 'prepare' and len(sys.argv) != 2) or \
            (sys.argv[1] == 'run' and (len(sys.argv) != 3 or
                                      len(sys.argv[2]) != 64)):
        raise ValueError('usage: recover-g02-r5-terminal-r1.py prepare|run FREEZE_SHA256')
    if sys.argv[1] == 'prepare':
        prepare()
    else:
        RECOVERY_FREEZE_SHA = sys.argv[2]
        run()
