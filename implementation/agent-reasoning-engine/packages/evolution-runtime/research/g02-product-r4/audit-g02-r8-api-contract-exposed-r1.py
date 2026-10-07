#!/usr/bin/env python3
"""Read-only provenance and metric audit of one exposed ARE instruction test."""

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-r8-api-contract-exposed-20261001')
ROOT = ARCHIVE / 'root'
BASELINE = Path('/home/vlad_/are-benchmark-archive/g02-r8-selection-only-exposed-20261001/are-posthoc')
R8_RAW = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r8-20261001/pairs/01-pr8-mixed-01/raw')
EXPECTED_FREEZE = 'b674835aee312a15f2ff5318ba265d1d19dfc846f74691f953dd8be51a0665ba'
EXPECTED_SEAL = '6885017e3f933129feba0b7f7d23dd2951202a9e9148ae8ef2cdf340094d3953'
EXPECTED_POLICY = '3e70459f61bf977608afffa3cd069a46ac6ad8d23d2daede8940b2c4f582b3b6'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, why):
    if not ok:
        raise ValueError('api-contract-audit.' + why)


def f1(measure):
    c, p = measure['coverage'], measure['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def metrics(path):
    final = read(path)['native']['final']
    return {'file_f1': f1(final['file']), 'span_f1': f1(final['span']),
            'score_sha256': sha(path)}


def main():
    need(sha(ARCHIVE / 'freeze/FREEZE.json') == EXPECTED_FREEZE and
         sha(ROOT / 'EXPOSED-PRE-SCORE-SEAL.json') == EXPECTED_SEAL and
         sha(ROOT / 'policy-pruning/POLICY-SEAL.json') == EXPECTED_POLICY,
         'freeze-or-seal')
    seal = read(ROOT / 'EXPOSED-PRE-SCORE-SEAL.json')
    policy = read(ROOT / 'policy-pruning/POLICY-SEAL.json')
    result = read(ROOT / 'evidence/RESULTS.json')
    prediction = read(ROOT / 'policy-pruning/prediction.json')
    baseline = read(BASELINE / 'prediction.json')
    need(seal['freeze_sha256'] == EXPECTED_FREEZE and seal['score_unopened'] and
         seal['result_sha256'] == sha(ROOT / 'evidence/RESULTS.json') and
         seal['prediction_sha256'] == sha(ROOT / 'evidence/run/prediction.json') and
         policy['source_prediction_sha256'] == seal['prediction_sha256'] and
         policy['prediction_sha256'] == sha(ROOT / 'policy-pruning/prediction.json') and
         result['status'] == 'final_context_selected' and
         result['unknown_usage_dispatched_requests'] == 0 and
         result['known_total_tokens'] == seal['known_model_tokens'] == 95637,
         'provenance-or-usage')
    need(prediction['instance_id'] == baseline['instance_id'] and
         prediction['commit'] == baseline['commit'] and
         prediction['traj_data']['pred_files'] == baseline['traj_data']['pred_files'] and
         sha(R8_RAW / 'evidence/run/prediction.json') ==
         read(BASELINE / 'POLICY-SEAL.json')['source_prediction_sha256'],
         'matched-exposed-task-or-file-set')
    b = metrics(BASELINE / 'native-score.json')
    c = metrics(ROOT / 'policy-pruning/native-score.json')
    need(abs(b['file_f1'] - c['file_f1']) < 1e-12 and
         c['span_f1'] > b['span_f1'], 'metric-direction')
    payload = {
        'schema_version': 'are.g02-r8-api-contract-exposed-audit/v1',
        'status': 'passed-exposed-diagnostic-only',
        'instance_id': prediction['instance_id'],
        'baseline': {**b, 'known_tokens': read(R8_RAW / 'evidence/RESULTS.json')['known_total_tokens']},
        'api_contract_instruction': {**c, 'known_tokens': result['known_total_tokens'],
                                     'model_calls': result['model_calls']},
        'file_set_unchanged': True,
        'span_f1_delta': c['span_f1'] - b['span_f1'],
        'claim_ceiling': 'Exposed same-task ARE-only comparison with a post-hoc baseline score; no matched prospective superiority or transfer proof.',
        'open_questions': ['Does the span gain transfer across other exposed tasks?',
                           'Can ARE acquire missing files rather than only improve span choice?'],
    }
    print(json.dumps(payload, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
