#!/usr/bin/env python3
"""Native-score the sealed, fixed-policy exposed packet pair."""

import hashlib
import json
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r6-numbered-packet-exposed-r3'
FREEZE = ROOT / 'FREEZE.json'
SEAL = ROOT / 'PRE-SCORE-SEAL.json'
OUTPUT = ROOT / 'RESULT.json'
FREEZE_SHA = 'cedcee6cfbea8fa060d154c3564a6300c5be38a0bd03e52a775eb2addda0e33f'
SEAL_SHA = '57ea0348e7d30813c525d5a6543bda4dce9d8799d3198c983d10d8e569d4edfb'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def f1(measure):
    c, p = measure['coverage'], measure['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    if OUTPUT.exists() or sha(FREEZE) != FREEZE_SHA or sha(SEAL) != SEAL_SHA:
        raise ValueError('numbered-packet-score.freeze-or-seal-drift')
    frozen, sealed = read(FREEZE), read(SEAL)
    if not sealed['score_unopened'] or sealed['freeze_sha256'] != FREEZE_SHA:
        raise ValueError('numbered-packet-score.pre-score-order')
    roots = {'baseline': Path(frozen['baseline_root']), 'numbered_packet': Path(frozen['candidate_root'])}
    for arm, root in roots.items():
        bound = sealed['arms'][arm]
        for name, relative in [('result', 'evidence/RESULTS.json'),
                               ('prediction', 'evidence/run/prediction.json'),
                               ('settlement', 'ARE-SETTLEMENT.json'),
                               ('events', 'evidence/run/events.jsonl'),
                               ('export', 'evidence/run/export-evidence.json')]:
            if sha(root / relative) != bound['sha256'][name]:
                raise ValueError('numbered-packet-score.arm-drift:' + arm + ':' + name)
        work = root / 'policy-pruning'
        policy = read(work / 'POLICY-SEAL.json')
        if (work / 'native-score.json').exists() or \
                policy['source_prediction_sha256'] != bound['sha256']['prediction'] or \
                policy['prediction_sha256'] != sha(work / 'prediction.json') or \
                policy['status'] != 'prediction-sealed-before-native-score':
            raise ValueError('numbered-packet-score.policy-drift:' + arm)
    results = {}
    for arm, root in roots.items():
        work = root / 'policy-pruning'
        command = ['docker', 'run', '--rm', '--network', 'host',
                   '-v', f'{SCORER_BASE}/repo:/repo:ro',
                   '-v', f'{SCORER_BASE}/upstream:/upstream:ro',
                   '-v', f'{SCORER_BASE}/scoring-cache:/cache',
                   '-v', f'{work}:/work', 'are-contextbench-scorer:g01-r1',
                   'python', '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
                   '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
                   '--pred', '/work/prediction.json', '--cache', '/cache', '--out', '/work/native-score.json']
        run = subprocess.run(command, capture_output=True, timeout=300, check=False)
        score_path = work / 'native-score.json'
        if run.returncode != 0 or not score_path.is_file():
            raise ValueError('numbered-packet-score.native-failed:' + arm + ':' + str(run.returncode))
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
    candidate, baseline = results['numbered_packet'], results['baseline']
    payload = {
        'schema_version': 'are.g02-r6-numbered-packet-exposed-result/v3',
        'posture': 'single-reused-evaluator-exposed-task-ARE-only',
        'freeze_sha256': FREEZE_SHA, 'pre_score_seal_sha256': SEAL_SHA,
        'score_script_sha256': sha(Path(__file__)), 'arms': results,
        'candidate_minus_baseline': {'file_f1': candidate['file_f1'] - baseline['file_f1'],
                                     'span_f1': candidate['span_f1'] - baseline['span_f1']},
        'candidate_over_baseline': {
            'known_model_tokens': candidate['known_model_tokens'] / baseline['known_model_tokens'],
            'duration_seconds': candidate['duration_seconds'] / baseline['duration_seconds']},
        'claim_ceiling': 'One exposed ARE-only task; no prospective cohort, matched DSH, interval, or superiority.',
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': 'scored-exposed-only', 'sha256': sha(OUTPUT),
                      'candidate_minus_baseline': payload['candidate_minus_baseline'],
                      'candidate_over_baseline': payload['candidate_over_baseline']}))


if __name__ == '__main__':
    main()
