#!/usr/bin/env python3
"""Independently bind six offline raw ARE scores to frozen r11 evidence."""

import hashlib
import json
import math
from pathlib import Path


BASE = Path('/home/vlad_/are-benchmark-archive')
ARCHIVE = BASE / 'g02-product-replication-r11-20261002'
DIAGNOSTIC = BASE / 'g02-r11-raw-vs-pruned-exposed-r1-20261002'
INPUT_SHA = '88d050931c18174ed17f3d0b4fa468c4bd8dfa950f4e6531c90a828862d94b06'
RESULT_SHA = '814375d15df357772761b8cacf0f7b111a3640718cc09b02cea72f3cde2d2989'
EXPECTED = (2, 5, 6, 8, 10, 12)
OUTPUT = DIAGNOSTIC / 'INDEPENDENT-AUDIT.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-raw-pruned-audit.' + reason)


def f1(measure):
    coverage, precision = measure['coverage'], measure['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    input_path = DIAGNOSTIC / 'INPUT-SEAL.json'
    result_path = DIAGNOSTIC / 'RESULT.json'
    need(sha(input_path) == INPUT_SHA and sha(result_path) == RESULT_SHA and
         not OUTPUT.exists(), 'input-result-or-output-drift')
    sealed = json.loads(input_path.read_text())
    result = json.loads(result_path.read_text())
    need(sealed['score_unopened_at_input_seal'] is True and
         result['input_seal_sha256'] == INPUT_SHA and
         result['model_calls'] == sealed['model_calls'] == 0 and
         result['network_posture'] == 'native scorer container --network none' and
         len(sealed['ordered_rows']) == len(result['rows']) == 6,
         'result-shape')
    checks = []
    for bound, row in zip(sealed['ordered_rows'], result['rows']):
        ordinal = bound['ordinal']
        need(ordinal == row['ordinal'] and ordinal in EXPECTED and
             bound['instance_id'] == row['instance_id'] and
             bound['original_files'] > bound['retained_files'],
             f'pair-{ordinal}-selection-drift')
        original = ARCHIVE / 'pairs' / f"{ordinal:02d}-{bound['suffix']}" / 'raw'
        raw_pred = original / 'evidence/run/prediction.json'
        raw_score = DIAGNOSTIC / f'{ordinal:02d}' / 'native-score.json'
        staged_pred = DIAGNOSTIC / f'{ordinal:02d}' / 'prediction.json'
        policy_seal = original / 'policy-pruning/POLICY-SEAL.json'
        policy_pred = original / 'policy-pruning/prediction.json'
        policy_score = original / 'policy-pruning/native-score.json'
        decision = json.loads((original / 'PAIR-DECISION.json').read_text())
        original_audit = json.loads((original / 'INDEPENDENT-AUDIT.json').read_text())
        need(all(path.is_file() for path in (raw_pred, raw_score, staged_pred,
                                           policy_seal, policy_pred, policy_score)) and
             sha(raw_pred) == sha(staged_pred) == bound['raw_prediction_sha256'] and
             sha(policy_seal) == bound['policy_seal_sha256'] and
             sha(policy_pred) == bound['pruned_prediction_sha256'] and
             sha(policy_score) == bound['pruned_score_sha256'] == row['pruned_score_sha256'] and
             sha(raw_score) == row['raw_score_sha256'] and
             original_audit['status'] == 'independent-audit-passed' and
             decision['instance_id'] == bound['instance_id'],
             f'pair-{ordinal}-binding-drift')
        raw_native = json.loads(raw_score.read_text())['native']['final']
        policy_native = json.loads(policy_score.read_text())['native']['final']
        values = {'raw_file_f1': f1(raw_native['file']),
                  'raw_span_f1': f1(raw_native['span']),
                  'pruned_file_f1': f1(policy_native['file']),
                  'pruned_span_f1': f1(policy_native['span'])}
        need(all(math.isclose(row[key], value, rel_tol=0, abs_tol=1e-12)
                 for key, value in values.items()) and
             math.isclose(decision['quality']['are']['file_f1'], values['pruned_file_f1'], abs_tol=1e-12) and
             math.isclose(decision['quality']['are']['span_f1'], values['pruned_span_f1'], abs_tol=1e-12),
             f'pair-{ordinal}-metric-drift')
        checks.append({'ordinal': ordinal, 'raw_score_sha256': sha(raw_score),
                       'pruned_score_sha256': sha(policy_score),
                       'file_delta': values['pruned_file_f1'] - values['raw_file_f1'],
                       'span_delta': values['pruned_span_f1'] - values['raw_span_f1']})
    need(tuple(item['ordinal'] for item in checks) == EXPECTED and
         sum(item['file_delta'] > 0 for item in checks) == 5 and
         sum(item['span_delta'] > 0 for item in checks) == 5 and
         all(item['file_delta'] >= -1e-12 and item['span_delta'] >= -1e-12 for item in checks),
         'observed-delta-shape')
    payload = {'schema_version': 'are.g02-r11-exposed-raw-pruned-audit/v1',
               'status': 'independent-audit-passed',
               'input_seal_sha256': INPUT_SHA, 'result_sha256': RESULT_SHA,
               'script_sha256': sha(Path(__file__)),
               'rows': checks,
               'improved': {'file_f1': 5, 'span_f1': 5},
               'regressed': {'file_f1': 0, 'span_f1': 0},
               'model_calls': 0,
               'claim_ceiling': 'Exposed mechanism diagnostic only; no causal estimate, campaign recovery, or superiority.',
               'open_questions': ['Can an independently chosen acquisition mechanism fix missing relevant files without reversing pruning gains?']}
    OUTPUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': payload['status'], 'audit_sha256': sha(OUTPUT),
                      'improved': payload['improved'], 'regressed': payload['regressed']}))


if __name__ == '__main__':
    main()
