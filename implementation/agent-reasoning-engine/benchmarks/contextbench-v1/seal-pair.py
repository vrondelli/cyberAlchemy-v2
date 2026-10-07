"""Seal a settled, source-only G02 pair before any gold is read.

Open questions: README.md. This records integrity; scoring is a separate step.
"""
import argparse
import hashlib
import json
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pair', type=Path, required=True)
    args = parser.parse_args()
    pair = args.pair
    task, freeze = load(pair / 'source-only-task.json'), load(pair / 'FRESH-PAIR-FREEZE.json')
    are, result = load(pair / 'RESULTS.json'), load(pair / 'result.json')
    are_settlement, dsh_settlement = load(pair / 'SETTLEMENT.json'), load(pair / 'dsh-SETTLEMENT.json')
    dsh = load(pair / 'dsh-EXPORT.json')
    predictions = {name: load(pair / name) for name in
                   ('model-prediction.json', 'candidate-prediction.json', 'dsh-prediction.json')}
    if freeze['instance_id'] != task['instance_id'] or freeze['base_commit'] != task['base_commit']:
        raise ValueError('seal.freeze-identity')
    if digest(pair / 'source-only-task.json') != freeze['source_only_task_sha256']:
        raise ValueError('seal.task-drift')
    if any(pred[key] != task[source] for pred in predictions.values() for key, source in
           (('instance_id', 'instance_id'), ('repo_url', 'repo_url'), ('commit', 'base_commit'))):
        raise ValueError('seal.prediction-identity')
    if are['status'] != 'final_context_selected' or result['status'] != 'final_context_selected':
        raise ValueError('seal.are-status')
    if are_settlement['exit_code'] != 0 or dsh_settlement['exit_code'] != 0:
        raise ValueError('seal.settlement')
    if are['unknown_usage_dispatched_requests'] or dsh['accounting'].get('unknown_usage_dispatched_requests'):
        raise ValueError('seal.unknown-cost')
    if dsh['status'] != 'final_context_selected' or not dsh['accounting'].get('cost_complete') or dsh['accounting'].get('unsettled_attempts'):
        raise ValueError('seal.dsh-status-or-cost')
    if dsh['prediction_sha256'] != digest(pair / 'dsh-prediction.json'):
        raise ValueError('seal.dsh-prediction-drift')
    are_seal = {
        'schema_version': 'are.g02-pair-are-pre-score-seal/v1',
        'status': 'are-arm-settled-and-prediction-sealed-before-control-scoring',
        'instance_id': task['instance_id'],
        'source_only_task_sha256': digest(pair / 'source-only-task.json'),
        'freeze_sha256': digest(pair / 'FRESH-PAIR-FREEZE.json'),
        'are_results_sha256': digest(pair / 'RESULTS.json'),
        'are_result_sha256': digest(pair / 'result.json'),
        'are_settlement_sha256': digest(pair / 'SETTLEMENT.json'),
        'are_candidate_prediction_sha256': digest(pair / 'candidate-prediction.json'),
        'are_model_prediction_sha256': digest(pair / 'model-prediction.json'),
        'selector_receipt_sha256': digest(pair / 'selector-receipt.json'),
        'gold_read_before_seal': False,
        'open_questions': ['Will the native scores pass both quality gates?'],
    }
    write_new(pair / 'ARE-PRE-SCORE-SEAL.json', are_seal)
    pair_seal = {
        'schema_version': 'are.g02-pair-pre-score-seal/v1',
        'status': 'both-predictions-sealed-before-native-scoring',
        'instance_id': task['instance_id'], 'base_commit': task['base_commit'],
        'source_only_task_sha256': digest(pair / 'source-only-task.json'),
        'freeze_sha256': digest(pair / 'FRESH-PAIR-FREEZE.json'),
        'are_pre_score_seal_sha256': digest(pair / 'ARE-PRE-SCORE-SEAL.json'),
        'are_candidate_prediction_sha256': digest(pair / 'candidate-prediction.json'),
        'dsh_prediction_sha256': digest(pair / 'dsh-prediction.json'),
        'are_results_sha256': digest(pair / 'RESULTS.json'),
        'are_settlement_sha256': digest(pair / 'SETTLEMENT.json'),
        'dsh_export_sha256': digest(pair / 'dsh-EXPORT.json'),
        'dsh_settlement_sha256': digest(pair / 'dsh-SETTLEMENT.json'),
        'gold_read_before_seal': False,
        'open_questions': ['Will this breadth task pass all strict gates?'],
    }
    write_new(pair / 'PAIR-PRE-SCORE-SEAL.json', pair_seal)
    print(json.dumps({'status': pair_seal['status'], 'instance_id': task['instance_id'],
                      'pair_seal_sha256': digest(pair / 'PAIR-PRE-SCORE-SEAL.json')}))


if __name__ == '__main__':
    main()
