#!/usr/bin/env python3
"""Seal the exposed ARE-only result before policy projection/native scoring."""

import hashlib
import json
from pathlib import Path


ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-api-contract-dev-01')
FREEZE = Path('/opt/are/evolution-runtime/g02-r8-api-contract-exposed-r1/FREEZE.json')
FREEZE_SHA = 'b674835aee312a15f2ff5318ba265d1d19dfc846f74691f953dd8be51a0665ba'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    output = ROOT / 'EXPOSED-PRE-SCORE-SEAL.json'
    if output.exists() or (ROOT / 'policy-pruning').exists() or \
            sha(FREEZE) != FREEZE_SHA:
        raise ValueError('api-contract-seal.input-or-output-drift')
    result_path = ROOT / 'evidence/RESULTS.json'
    prediction_path = ROOT / 'evidence/run/prediction.json'
    result = json.loads(result_path.read_text())
    prediction = json.loads(prediction_path.read_text())
    if result['status'] != 'final_context_selected' or \
            result['unknown_usage_dispatched_requests'] != 0 or \
            prediction['instance_id'] != 'SWE-Bench-Pro__python__maintenance__bugfix__ba13492e':
        raise ValueError('api-contract-seal.invalid-arm')
    payload = {
        'schema_version': 'are.g02-r8-api-contract-exposed-pre-score-seal/v1',
        'posture': 'exposed-ARE-only-before-native-score',
        'freeze_sha256': FREEZE_SHA,
        'result_sha256': sha(result_path),
        'prediction_sha256': sha(prediction_path),
        'known_model_tokens': result['known_total_tokens'],
        'raw_selected_files': prediction['traj_data']['pred_files'],
        'score_unopened': True,
        'claim_ceiling': 'Exposed one-arm mechanism result; no matched pair or superiority.',
        'open_questions': ['Does the fixed deletion-only policy change selection?',
                           'Do native quality and all-in efficiency improve?'],
    }
    with output.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'sealed-before-score', 'sha256': sha(output),
                      'known_tokens': payload['known_model_tokens'],
                      'selected_files': len(payload['raw_selected_files'])}))


if __name__ == '__main__':
    main()
