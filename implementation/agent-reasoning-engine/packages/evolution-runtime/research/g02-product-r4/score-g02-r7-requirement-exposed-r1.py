#!/usr/bin/env python3
"""Score both sealed r7 requirement-development predictions natively."""

import hashlib
import json
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-requirement-exposed-r1'
FREEZE = ROOT / 'FREEZE.json'
SEAL = ROOT / 'PRE-SCORE-SEAL.json'
OUTPUT = ROOT / 'RESULT.json'
FREEZE_SHA = '00574c2cc35758791e9329c6870baf7ab86f229a70bb9c04be4a8c6351a7aad1'
SEAL_SHA = 'c0a5c865fb706b8a65ba174e8f2c5329682be88a178d961cc5785b2ba64f9356'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def f1(measure):
    c, p = measure['coverage'], measure['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    if OUTPUT.exists() or sha(FREEZE) != FREEZE_SHA or sha(SEAL) != SEAL_SHA:
        raise ValueError('g02-r7-requirement-score.freeze-or-seal-drift')
    frozen, sealed = read(FREEZE), read(SEAL)
    if not sealed['score_unopened'] or sealed['freeze_sha256'] != FREEZE_SHA:
        raise ValueError('g02-r7-requirement-score.pre-score-order')
    for arm, root_text in frozen['arm_roots'].items():
        root = Path(root_text)
        row = sealed['arms'][arm]
        prediction = root / 'policy-pruning/prediction.json'
        policy_seal = root / 'policy-pruning/POLICY-SEAL.json'
        if (root / 'policy-pruning/native-score.json').exists() or \
                sha(root / 'evidence/RESULTS.json') != row['result_sha256'] or \
                sha(root / 'evidence/run/prediction.json') != row['prediction_sha256'] or \
                sha(root / 'ARE-SETTLEMENT.json') != row['settlement_sha256'] or \
                read(policy_seal)['prediction_sha256'] != sha(prediction):
            raise ValueError('g02-r7-requirement-score.arm-drift:' + arm)
    results = {}
    for arm, root_text in frozen['arm_roots'].items():
        work = Path(root_text) / 'policy-pruning'
        command = ['docker', 'run', '--rm', '--network', 'host',
                   '-v', f'{SCORER_BASE}/repo:/repo:ro',
                   '-v', f'{SCORER_BASE}/upstream:/upstream:ro',
                   '-v', f'{SCORER_BASE}/scoring-cache:/cache',
                   '-v', f'{work}:/work', 'are-contextbench-scorer:g01-r1',
                   'python', '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
                   '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
                   '--pred', '/work/prediction.json', '--cache', '/cache',
                   '--out', '/work/native-score.json']
        run = subprocess.run(command, capture_output=True, timeout=300, check=False)
        score_path = work / 'native-score.json'
        if run.returncode != 0 or not score_path.is_file():
            raise ValueError('g02-r7-requirement-score.native-failed:' + arm + ':' + str(run.returncode))
        final = read(score_path)['native']['final']
        results[arm] = {
            'score_sha256': sha(score_path),
            'policy_seal_sha256': sha(work / 'POLICY-SEAL.json'),
            'file_f1': f1(final['file']), 'span_f1': f1(final['span']),
            'known_model_tokens': sealed['arms'][arm]['known_model_tokens'],
            'model_calls': sealed['arms'][arm]['model_calls'],
            'duration_seconds': sealed['arms'][arm]['duration_seconds'],
            'selected_files': read(work / 'prediction.json')['traj_data']['pred_files'],
        }
    a, b = results['requirement'], results['baseline']
    payload = {
        'schema_version': 'are.g02-r7-requirement-exposed-result/v1',
        'posture': 'one-evaluator-exposed-task-ARE-only',
        'freeze_sha256': FREEZE_SHA, 'pre_score_seal_sha256': SEAL_SHA,
        'score_script_sha256': sha(__file__), 'arms': results,
        'candidate_minus_baseline': {'file_f1': a['file_f1'] - b['file_f1'],
                                     'span_f1': a['span_f1'] - b['span_f1']},
        'candidate_over_baseline': {'known_model_tokens': a['known_model_tokens'] / b['known_model_tokens'],
                                    'duration_seconds': a['duration_seconds'] / b['duration_seconds']},
        'claim_ceiling': 'One exposed ARE-only task; no independent population, matched DSH, interval, or superiority.',
        'open_questions': ['Does the mechanism preserve requirement coverage in another source family?',
                           'Can it survive a fresh matched DSH cohort?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'scored-exposed-only', 'sha256': sha(OUTPUT),
                      'candidate_minus_baseline': payload['candidate_minus_baseline'],
                      'candidate_over_baseline': payload['candidate_over_baseline']}))


if __name__ == '__main__':
    main()
