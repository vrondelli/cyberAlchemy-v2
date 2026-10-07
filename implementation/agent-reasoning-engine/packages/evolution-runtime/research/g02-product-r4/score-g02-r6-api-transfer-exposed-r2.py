#!/usr/bin/env python3
"""Score both sealed exposed ARE selections with the pinned native scorer."""

import hashlib
import json
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r6-api-transfer-exposed-r2'
FREEZE = ROOT / 'FREEZE.json'
SEAL = ROOT / 'PRE-SCORE-SEAL.json'
OUTPUT = ROOT / 'RESULT.json'
FREEZE_SHA = '5508f4a81e01ea0405d9be42fd8f6df33f9b372843c5c84fdd3cd3ee0b0ddadf'
SEAL_SHA = '9494e8f1acdedd3be56e8c6aa52a150706f87208a28efdbfc095dad47996f69f'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def f1(measure):
    coverage, precision = measure['coverage'], measure['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    if OUTPUT.exists() or sha(FREEZE) != FREEZE_SHA or sha(SEAL) != SEAL_SHA:
        raise ValueError('g02-r6-api-transfer-score.freeze-or-seal-drift')
    frozen, sealed = read(FREEZE), read(SEAL)
    if not sealed['score_unopened'] or sealed['freeze_sha256'] != FREEZE_SHA:
        raise ValueError('g02-r6-api-transfer-score.pre-score-order')
    for arm, root_text in frozen['arm_roots'].items():
        root = Path(root_text)
        row = sealed['arms'][arm]
        prediction = root / 'policy-pruning/prediction.json'
        policy_seal = root / 'policy-pruning/POLICY-SEAL.json'
        score = root / 'policy-pruning/native-score.json'
        if score.exists() or sha(root / 'evidence/RESULTS.json') != row['result_sha256'] or \
                sha(root / 'evidence/run/prediction.json') != row['prediction_sha256'] or \
                sha(root / 'ARE-SETTLEMENT.json') != row['settlement_sha256'] or \
                read(policy_seal)['prediction_sha256'] != sha(prediction):
            raise ValueError('g02-r6-api-transfer-score.arm-drift:' + arm)
    results = {}
    for arm, root_text in frozen['arm_roots'].items():
        root = Path(root_text)
        work = root / 'policy-pruning'
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
        if run.returncode != 0 or not (work / 'native-score.json').is_file():
            raise ValueError('g02-r6-api-transfer-score.native-failed:' + arm + ':' + str(run.returncode))
        final = read(work / 'native-score.json')['native']['final']
        results[arm] = {
            'score_sha256': sha(work / 'native-score.json'),
            'policy_seal_sha256': sha(work / 'POLICY-SEAL.json'),
            'file_f1': f1(final['file']),
            'span_f1': f1(final['span']),
            'known_model_tokens': sealed['arms'][arm]['known_model_tokens'],
            'model_calls': sealed['arms'][arm]['model_calls'],
            'duration_seconds': sealed['arms'][arm]['duration_seconds'],
            'selected_files': read(work / 'prediction.json')['traj_data']['pred_files'],
        }
    a, b = results['api_contract'], results['baseline']
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-exposed-result/v1',
        'posture': 'one-evaluator-exposed-task-ARE-only',
        'freeze_sha256': FREEZE_SHA, 'pre_score_seal_sha256': SEAL_SHA,
        'score_script_sha256': sha(__file__), 'arms': results,
        'candidate_minus_baseline': {'file_f1': a['file_f1'] - b['file_f1'],
                                     'span_f1': a['span_f1'] - b['span_f1']},
        'candidate_over_baseline': {'known_model_tokens': a['known_model_tokens'] / b['known_model_tokens'],
                                    'duration_seconds': a['duration_seconds'] / b['duration_seconds']},
        'claim_ceiling': 'One exposed same-task ARE-only comparison; no independent population, DSH matched pair, confidence interval, or superiority.',
        'open_questions': ['Does the result persist across other exposed tasks?',
                           'Can a source-acquisition mechanism improve File-F1 without cost regression?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'scored-exposed-only', 'sha256': sha(OUTPUT),
                      'candidate_minus_baseline': payload['candidate_minus_baseline'],
                      'candidate_over_baseline': payload['candidate_over_baseline']}))


if __name__ == '__main__':
    main()
