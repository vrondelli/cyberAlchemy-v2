#!/usr/bin/env python3
"""Seal two exposed ARE predictions and costs before native scoring."""

import hashlib
import json
from pathlib import Path


FREEZE = Path('/opt/are/evolution-runtime/g02-r6-api-transfer-exposed-r2/FREEZE.json')
FREEZE_SHA = '5508f4a81e01ea0405d9be42fd8f6df33f9b372843c5c84fdd3cd3ee0b0ddadf'
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def main():
    output = FREEZE.parent / 'PRE-SCORE-SEAL.json'
    if output.exists() or sha(FREEZE) != FREEZE_SHA:
        raise ValueError('g02-r6-api-transfer-seal.freeze-drift')
    frozen = read(FREEZE)
    rows = {}
    for arm, root_text in frozen['arm_roots'].items():
        root = Path(root_text)
        if (root / 'policy-pruning').exists() or (root / 'are-score-stdout.txt').exists():
            raise ValueError('g02-r6-api-transfer-seal.score-already-open')
        result_path = root / 'evidence/RESULTS.json'
        prediction_path = root / 'evidence/run/prediction.json'
        settlement_path = root / 'ARE-SETTLEMENT.json'
        result, prediction, settlement = map(read, (result_path, prediction_path, settlement_path))
        if result['status'] != 'final_context_selected' or \
                result['unknown_usage_dispatched_requests'] != 0 or \
                settlement['status'] != 'completed' or \
                prediction['instance_id'] != TASK_ID or prediction['commit'] != COMMIT or \
                not prediction['traj_data']['pred_files']:
            raise ValueError('g02-r6-api-transfer-seal.invalid-arm:' + arm)
        rows[arm] = {
            'root': str(root),
            'result_sha256': sha(result_path),
            'prediction_sha256': sha(prediction_path),
            'settlement_sha256': sha(settlement_path),
            'known_model_tokens': result['known_total_tokens'],
            'model_calls': result['model_calls'],
            'duration_seconds': settlement['elapsed_seconds'],
            'selected_files': prediction['traj_data']['pred_files'],
        }
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-exposed-pre-score-seal/v1',
        'status': 'sealed-before-native-score',
        'freeze_sha256': FREEZE_SHA,
        'arms': rows,
        'score_unopened': True,
        'claim_ceiling': 'Exposed same-task ARE instruction test; no fresh cohort, paired DSH, or superiority.',
        'open_questions': ['Does unchanged pruning retain the selections?',
                           'What are native File-/Span-F1 and cost differences?'],
    }
    with output.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output),
                      'arms': {arm: {'tokens': row['known_model_tokens'],
                                     'calls': row['model_calls'],
                                     'selected_files': len(row['selected_files'])}
                               for arm, row in rows.items()}}))


if __name__ == '__main__':
    main()
