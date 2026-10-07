"""Seal prediction and cost before any native scoring for the exposed task-1 rerun."""
import hashlib
import json
from pathlib import Path

ROOT = Path('/tmp/are-g02-r4-runs/g02-r11-callcap12-exposed-task1-r1')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def main():
    run = ROOT / 'evidence/run'
    if (run / 'native-score.json').exists() or (ROOT / 'SCORE-RESULT.json').exists():
        raise RuntimeError('score-already-opened')
    settlement = read(ROOT / 'SETTLEMENT.json')
    result = read(run / 'result.json')
    outcome = read(ROOT / 'evidence/RESULTS.json')
    prediction = read(run / 'prediction.json')
    events = [json.loads(line) for line in (run / 'events.jsonl').read_text().splitlines()]
    model = [receipt for receipt in result['receipts'] if receipt['kind'] == 'model']
    known = sum(receipt['input_tokens'] + receipt['output_tokens'] for receipt in model)
    unknown = sum(receipt.get('input_tokens') is None or receipt.get('output_tokens') is None for receipt in model)
    if (settlement['exit_code'] != 0 or settlement['error'] is not None or
            result['status'] != 'final_context_selected' or
            outcome['status'] != result['status'] or
            outcome['model_calls'] != len(model) or outcome['known_total_tokens'] != known or
            outcome['unknown_usage_dispatched_requests'] != unknown or
            prediction['instance_id'] != read(ROOT / 'FREEZE.json')['instance_id']):
        raise RuntimeError('outcome-inconsistent')
    seal = {
        'schema_version': 'are.g02-r11-callcap12-exposed-task1-pre-score-seal/v1',
        'status': 'prediction-and-cost-sealed-before-native-score',
        'score_unopened': True,
        'freeze_sha256': sha(ROOT / 'FREEZE.json'),
        'settlement_sha256': sha(ROOT / 'SETTLEMENT.json'),
        'results_sha256': sha(ROOT / 'evidence/RESULTS.json'),
        'result_sha256': sha(run / 'result.json'),
        'prediction_sha256': sha(run / 'prediction.json'),
        'events_sha256': sha(run / 'events.jsonl'),
        'model_calls': len(model),
        'known_model_tokens': known,
        'unknown_usage_calls': unknown,
        'finalization_start': [{'step': event['step'], 'reason': event['reason']}
                               for event in events if event.get('kind') == 'finalization-start'],
        'elapsed_seconds': settlement['elapsed_seconds'],
        'claim_ceiling': 'One exposed ARE-only development rerun; no matched pair or superiority claim.'
    }
    with (ROOT / 'PRE-SCORE-SEAL.json').open('x') as stream:
        json.dump(seal, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'seal_sha256': sha(ROOT / 'PRE-SCORE-SEAL.json'),
                      'model_calls': len(model), 'known_tokens': known,
                      'finalization_start': seal['finalization_start']}))


if __name__ == '__main__':
    main()
