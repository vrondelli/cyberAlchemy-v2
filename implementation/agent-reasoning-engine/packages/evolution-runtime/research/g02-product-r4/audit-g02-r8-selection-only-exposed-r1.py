#!/usr/bin/env python3
"""Read-only hash/accounting audit of the exposed selection-only diagnostic."""

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-r8-selection-only-exposed-20261001')
R8_RAW = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r8-20261001/pairs/01-pr8-mixed-01/raw')
EXPECTED = {
    'freeze': '8cea32ba0c1851c3d2d77067c665ad185fe06128af1a4c95b0d6f7f014266c6e',
    'tools': 'e501ab831365dd4bc3e090462f5cb0f1c8a5aa9e1e4b336c81b4c8905af96c9f',
    'seal': 'e1e4d740b4c52919fe31b494515d488dee2eb4f478f46765d449e5c8f8144312',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, why):
    if not ok:
        raise ValueError('selection-only-audit.' + why)


def f1(measure):
    coverage, precision = measure['coverage'], measure['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    root = ARCHIVE / 'root'
    need(sha(ARCHIVE / 'freeze/FREEZE.json') == EXPECTED['freeze'], 'freeze')
    need(sha(ARCHIVE / 'tools/SELECTION-ONLY-DEV-TOOLS.json') == EXPECTED['tools'], 'tools')
    need(sha(root / 'EXPOSED-PRE-SCORE-SEAL.json') == EXPECTED['seal'], 'seal')
    seal = read(root / 'EXPOSED-PRE-SCORE-SEAL.json')
    settlement = read(root / 'dsh-control/SETTLEMENT.json')
    transport = read(root / 'dsh-control/transport/RESULTS.json')
    exported = read(root / 'dsh-export/EXPORT.json')
    dsh_prediction = read(root / 'dsh-export/prediction.json')
    dsh_score = read(root / 'dsh-export/native-score.json')
    are_policy_seal = read(ARCHIVE / 'are-posthoc/POLICY-SEAL.json')
    are_score = read(ARCHIVE / 'are-posthoc/native-score.json')
    need(seal['freeze_sha256'] == EXPECTED['freeze'] and seal['score_unopened'], 'pre-score-posture')
    for field, path in (
        ('settlement_sha256', root / 'dsh-control/SETTLEMENT.json'),
        ('transport_results_sha256', root / 'dsh-control/transport/RESULTS.json'),
        ('export_sha256', root / 'dsh-export/EXPORT.json'),
        ('prediction_sha256', root / 'dsh-export/prediction.json'),
    ):
        need(seal[field] == sha(path), field)
    need(settlement['exit_code'] == 0 and settlement['failure'] is None, 'settlement')
    need(exported['status'] == 'final_context_selected' and
         exported['prediction_sha256'] == seal['prediction_sha256'] and
         transport['model_calls'] == seal['model_calls'] == 14 and
         transport['known_total_tokens'] == seal['known_model_tokens'] == 279004 and
         transport['unknown_usage_dispatched_requests'] == 0 and
         not transport['unsettled_attempts'], 'transport-or-export')
    names = []
    for path in sorted((root / 'dsh-control/tools').glob('[0-9]' * 6 + '.json')):
        record = read(path)
        if record.get('kind') == 'tool-intent':
            names.append(record['call']['function']['name'])
    need(names == seal['tool_call_names'] and 'apply_edits' not in names and
         len(names) == 21, 'read-only-tools')
    need(are_policy_seal['source_prediction_sha256'] ==
         sha(R8_RAW / 'evidence/run/prediction.json') and
         are_policy_seal['prediction_sha256'] ==
         sha(ARCHIVE / 'are-posthoc/prediction.json'), 'are-posthoc-source')
    need(dsh_prediction['instance_id'] == are_score['native']['instance_id'] ==
         dsh_score['native']['instance_id'], 'task-identity')
    row = {
        'schema_version': 'are.g02-r8-selection-only-exposed-audit/v1',
        'status': 'passed-exposed-diagnostic-only',
        'instance_id': dsh_prediction['instance_id'],
        'dsh': {'model_calls': 14, 'known_tokens': 279004,
                'file_f1': f1(dsh_score['native']['final']['file']),
                'span_f1': f1(dsh_score['native']['final']['span']),
                'score_sha256': sha(root / 'dsh-export/native-score.json')},
        'are_posthoc': {'known_tokens': read(R8_RAW / 'evidence/RESULTS.json')['known_total_tokens'],
                        'file_f1': f1(are_score['native']['final']['file']),
                        'span_f1': f1(are_score['native']['final']['span']),
                        'score_sha256': sha(ARCHIVE / 'are-posthoc/native-score.json')},
        'claim_ceiling': 'Same exposed task, different DSH protocol and post-hoc ARE score; not a matched prospective pair, cohort estimate, or superiority claim.',
        'open_questions': ['Can ARE improve missing-file acquisition without leakage?',
                           'Can a selection-only comparator be prospectively matched and valid on all tasks?'],
    }
    print(json.dumps(row, sort_keys=True, indent=2))


if __name__ == '__main__':
    main()
