#!/usr/bin/env python3
"""Score the sealed, already-exposed G02 r11 task-4 code-anchor episode once."""

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path('/tmp/are-g02-r4-runs/g02-r11-code-anchor-r3-task4-r1')
BASE = Path('/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev')
SEAL = ROOT / 'PRE-SCORE-SEAL.json'
FREEZE_SHA = 'd7e5cf6350c08d73615c85bc742153ed69690be1d50bb80fc91ca9d90da8a61f'
SCORE = ROOT / 'evidence/run/native-score.json'
RESULT = ROOT / 'SCORE-RESULT.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    if SCORE.exists() or RESULT.exists() or not SEAL.is_file():
        raise RuntimeError('score-existing-or-seal-missing')
    seal = read(SEAL)
    if seal['status'] != 'prediction-and-cost-sealed-before-native-score' or not seal['score_unopened']:
        raise RuntimeError('pre-score-order')
    bindings = {
        ROOT / 'FREEZE.json': seal['freeze_sha256'],
        ROOT / 'SETTLEMENT.json': seal['settlement_sha256'],
        ROOT / 'evidence/RESULTS.json': seal['results_sha256'],
        ROOT / 'evidence/run/result.json': seal['result_sha256'],
        ROOT / 'evidence/run/prediction.json': seal['prediction_sha256'],
    }
    if seal['freeze_sha256'] != FREEZE_SHA or any(sha(path) != expected for path, expected in bindings.items()):
        raise RuntimeError('sealed-input-drift')
    outcome = read(ROOT / 'evidence/RESULTS.json')
    settlement = read(ROOT / 'SETTLEMENT.json')
    prediction = read(ROOT / 'evidence/run/prediction.json')
    if outcome['status'] != 'final_context_selected' or outcome['unknown_usage_dispatched_requests'] != 0 or \
       outcome['model_calls'] != seal['model_calls'] or outcome['known_total_tokens'] != seal['known_model_tokens'] or \
       settlement['exit_code'] != 0 or settlement['error'] is not None or \
       prediction['instance_id'] != read(ROOT / 'FREEZE.json')['instance_id'] or \
       len(prediction['traj_data']['pred_files']) != seal['predicted_file_count']:
        raise RuntimeError('sealed-outcome-inconsistent')
    command = [
        'docker', 'run', '--rm', '--network', 'host', '--cpus', '1', '--memory', '512m',
        '-v', f'{BASE}/repo:/repo:ro',
        '-v', f'{BASE}/upstream:/upstream:ro',
        '-v', f'{BASE}/scoring-cache:/cache',
        '-v', f'{ROOT}/evidence/run:/work',
        'are-contextbench-scorer:g01-r1', 'python',
        '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
        '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
        '--pred', '/work/prediction.json', '--cache', '/cache', '--out', '/work/native-score.json',
    ]
    with (ROOT / 'score-stdout.txt').open('x') as stdout, (ROOT / 'score-stderr.txt').open('x') as stderr:
        completed = subprocess.run(command, stdout=stdout, stderr=stderr, timeout=300, check=False)
    if completed.returncode != 0 or not SCORE.is_file():
        raise RuntimeError(f'native-score-failed:{completed.returncode}')
    native = read(SCORE)['native']['final']
    result = {
        'schema_version': 'are.g02-r11-code-anchor-r3-task4-score/v1',
        'posture': 'already-exposed-task-specific-ARE-only-development',
        'freeze_sha256': FREEZE_SHA,
        'pre_score_seal_sha256': sha(SEAL),
        'score_script_sha256': sha(Path(__file__)),
        'prediction_sha256': seal['prediction_sha256'],
        'native_score_sha256': sha(SCORE),
        'span_f1': f1(native['span']),
        'file_f1': f1(native['file']),
        'known_model_tokens': seal['known_model_tokens'],
        'model_calls': seal['model_calls'],
        'elapsed_seconds': seal['elapsed_seconds'],
        'archived_r11_are_known_model_tokens': seal['baseline_r11_are_known_model_tokens'],
        'archived_r11_are_span_f1': seal['baseline_r11_are_span_f1'],
        'archived_r11_are_file_f1': seal['baseline_r11_are_file_f1'],
        'frozen_success': (
            f1(native['file']) > seal['baseline_r11_are_file_f1']
            and f1(native['span']) >= seal['baseline_r11_are_span_f1']
        ),
        'claim_ceiling': 'Single exposed task against archived, non-matched ARE result; no transfer, campaign, or superiority claim.',
    }
    with RESULT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'scored-exposed-only', 'result_sha256': sha(RESULT),
                      'span_f1': result['span_f1'], 'file_f1': result['file_f1'],
                      'known_model_tokens': result['known_model_tokens'],
                      'frozen_success': result['frozen_success']}))


if __name__ == '__main__':
    main()
