"""Verify a sealed G02 pair, run pinned native scoring, and emit one gate result.

Open questions: README.md. This does not promote a candidate or generalize a
single-task result. It reads gold only after validating both prediction seals.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_hash(path, expected, label):
    if not expected or digest(path) != expected:
        raise ValueError('pair.' + label + '-drift')


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pair', type=Path, required=True)
    parser.add_argument('--upstream', type=Path, required=True)
    parser.add_argument('--gold', type=Path, required=True)
    parser.add_argument('--cache', required=True)
    parser.add_argument('--out-dir', type=Path, required=True)
    args = parser.parse_args()
    pair, seal = args.pair, load(args.pair / 'PAIR-PRE-SCORE-SEAL.json')
    if seal.get('status') != 'both-predictions-sealed-before-native-scoring' or seal.get('gold_read_before_seal') is not False:
        raise ValueError('pair.invalid-seal')
    mapping = {
        'source_only_task_sha256': 'source-only-task.json',
        'freeze_sha256': 'FRESH-PAIR-FREEZE.json',
        'are_pre_score_seal_sha256': 'ARE-PRE-SCORE-SEAL.json',
        'are_results_sha256': 'RESULTS.json',
        'are_settlement_sha256': 'SETTLEMENT.json',
        'dsh_export_sha256': 'dsh-EXPORT.json',
        'dsh_settlement_sha256': 'dsh-SETTLEMENT.json',
        'dsh_prediction_sha256': 'dsh-prediction.json',
    }
    for field, filename in mapping.items():
        check_hash(pair / filename, seal.get(field), field)
    check_hash(pair / 'candidate-prediction.json',
               seal.get('are_candidate_prediction_sha256') or seal.get('are_prediction_sha256'),
               'are-prediction')
    task = load(pair / 'source-only-task.json')
    freeze = load(pair / 'FRESH-PAIR-FREEZE.json')
    if freeze['instance_id'] != task['instance_id'] or freeze['base_commit'] != task['base_commit']:
        raise ValueError('pair.freeze-identity')
    predictions = {arm: load(pair / filename) for arm, filename in
                   [('are', 'candidate-prediction.json'), ('dsh', 'dsh-prediction.json')]}
    for arm, prediction in predictions.items():
        if any(prediction[key] != task[source] for key, source in
               [('instance_id', 'instance_id'), ('repo_url', 'repo_url'), ('commit', 'base_commit')]):
            raise ValueError('pair.' + arm + '-identity')
    are_results, dsh_export = load(pair / 'RESULTS.json'), load(pair / 'dsh-EXPORT.json')
    are_settlement, dsh_settlement = load(pair / 'SETTLEMENT.json'), load(pair / 'dsh-SETTLEMENT.json')
    if are_results['status'] != 'final_context_selected' or dsh_export['status'] != 'final_context_selected':
        raise ValueError('pair.unscoreable-status')
    if are_results['unknown_usage_dispatched_requests'] or dsh_export['accounting'].get('unknown_usage_dispatched_requests'):
        raise ValueError('pair.unknown-model-cost')
    if not dsh_export['accounting'].get('cost_complete') or dsh_export['accounting'].get('unsettled_attempts'):
        raise ValueError('pair.incomplete-control-cost')
    if are_settlement['exit_code'] != 0 or dsh_settlement['exit_code'] != 0:
        raise ValueError('pair.unsettled')
    args.out_dir.mkdir(parents=True, exist_ok=False)
    scores = {}
    for arm, filename in [('are', 'candidate-prediction.json'), ('dsh', 'dsh-prediction.json')]:
        score_path = args.out_dir / (arm + '-native-score.json')
        command = [sys.executable, str(Path(__file__).with_name('score_native.py')),
                   '--upstream', str(args.upstream), '--gold', str(args.gold),
                   '--pred', str(pair / filename), '--cache', args.cache, '--out', str(score_path)]
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        score = load(score_path)
        if score['native'].get('error'):
            raise ValueError('pair.' + arm + '-native-error')
        scores[arm] = {'span_f1': f1(score['native']['final']['span']),
                       'file_f1': f1(score['native']['final']['file']),
                       'score_sha256': digest(score_path)}
    scores['are'].update(model_tokens=are_results['known_total_tokens'], wall_seconds=are_settlement['elapsed_seconds'])
    scores['dsh'].update(model_tokens=dsh_export['accounting']['known_total_tokens'],
                         wall_seconds=dsh_settlement['elapsed_seconds'])
    gates = {metric: scores['are'][metric] > scores['dsh'][metric]
             for metric in ('span_f1', 'file_f1')}
    gates.update({metric: scores['are'][metric] < scores['dsh'][metric]
                  for metric in ('model_tokens', 'wall_seconds')})
    decision = {'schema_version': 'are.g02-sealed-pair-decision/v1',
                'instance_id': task['instance_id'], 'pair_seal_sha256': digest(pair / 'PAIR-PRE-SCORE-SEAL.json'),
                'scores': scores, 'strict_gates': gates, 'passed': all(gates.values()),
                'claim_ceiling': 'one sealed matched task; no full-campaign generalization or promotion',
                'open_questions': ['Will the result replicate on another untouched task?']}
    (args.out_dir / 'PAIR-DECISION.json').write_text(json.dumps(decision, indent=2) + '\n')
    print(json.dumps({'instance_id': task['instance_id'], 'passed': decision['passed'], 'scores': scores}))


if __name__ == '__main__':
    main()
