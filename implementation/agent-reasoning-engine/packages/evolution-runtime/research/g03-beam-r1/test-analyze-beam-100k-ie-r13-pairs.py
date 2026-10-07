#!/usr/bin/env python3
"""Synthetic 32-pair/16-cluster analysis tests; no reserved files read."""

import importlib.util
from pathlib import Path
import unittest


TARGET = Path(__file__).with_name('analyze-beam-100k-ie-r13-pairs.py')
SPEC = importlib.util.spec_from_file_location('g03_r13_pair_analysis', TARGET)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
LABEL_SHA = 'c' * 64


def fixture():
    source = {'schema_version':
              'are.g03-beam-100k-ie-r13-label-review-input/v1',
              'cases': [{'probe_id': f'probe-{i:02}',
                         'conversation_key': f'conversation-{i // 2:02}'}
                        for i in range(32)]}
    label = {'schema_version':
             'are.g03-beam-100k-ie-r13-label-decisions/v1',
             'status': 'answer-blind-two-reviewer-labels-sealed',
             'review_input_sha256': MODULE.SOURCE_SHA,
             'label_integrity_gate_passed': True,
             'disposition_counts': {'supported-current': 28,
                                    'conflicted': 4},
             'total_selected_questions': 32,
             'rows': [{'probe_id': f'probe-{i:02}',
                       'disposition': 'supported-current' if i < 28
                       else 'conflicted'} for i in range(32)]}
    audit = {'schema_version':
             'are.g03-beam-100k-ie-r13-source-judge-audit/v1',
             'status': 'audited-64-pairs-two-pass',
             'label_sha256': LABEL_SHA,
             'scorer_transfer_gate_passed': True,
             'repeat_disagreements': 0,
             'raw_attempts_verified': 128,
             'pairs': [{'probe_id': f'probe-{i:02}',
                        'control': {'1': False, '2': False},
                        'treatment': {'1': True, '2': True}}
                       for i in range(32)]}
    answer = {'schema_version': 'are.g03-beam-100k-ie-r13-result/v1',
              'status': 'completed-64-r13-reserved-answers',
              'attempted': 64, 'valid': 64,
              'freeze_sha256': 'a' * 64}
    return source, label, audit, answer


class AnalysisTests(unittest.TestCase):
    def test_full_denominator_and_control_favoring_sensitivity(self):
        result = MODULE.analyze(*fixture(), LABEL_SHA)
        self.assertEqual(result['selected_pairs'], 32)
        self.assertEqual(result['conversation_clusters'], 16)
        self.assertEqual(result['measures']['primary']
                         ['are_minus_bm25_strict_correct_proportion'], 28 / 32)
        self.assertEqual(result['measures']['control_favoring_sensitivity']
                         ['are_minus_bm25_strict_correct_proportion'], 24 / 32)
        self.assertTrue(result['bounded_ie_accuracy_directional_gate_passed'])

    def test_negative_direction_cannot_claim(self):
        values = fixture()
        for pair in values[2]['pairs']:
            pair['control'], pair['treatment'] = pair['treatment'], pair['control']
        result = MODULE.analyze(*values, LABEL_SHA)
        self.assertFalse(result['bounded_ie_accuracy_directional_gate_passed'])

    def test_repeat_disagreement_blocks_analysis(self):
        values = fixture()
        values[2]['repeat_disagreements'] = 1
        values[2]['scorer_transfer_gate_passed'] = False
        with self.assertRaisesRegex(ValueError, 'inputs-or-gates'):
            MODULE.analyze(*values, LABEL_SHA)

    def test_cluster_error_rejected(self):
        values = fixture()
        values[0]['cases'][0]['conversation_key'] = 'new-cluster'
        with self.assertRaisesRegex(ValueError, 'cluster-or-label-counts'):
            MODULE.analyze(*values, LABEL_SHA)

    def test_bootstrap_and_exact_mcnemar_are_deterministic(self):
        first = MODULE.analyze(*fixture(), LABEL_SHA)
        second = MODULE.analyze(*fixture(), LABEL_SHA)
        self.assertEqual(first['measures'], second['measures'])
        self.assertEqual(first['bootstrap']['repetitions'], 20000)
        self.assertEqual(first['measures']['primary']['exact_mcnemar'], {
            'treatment_only': 28, 'control_only': 0,
            'two_sided_exact_p': 2 / (2 ** 28)})

    def test_label_count_mismatch_rejected(self):
        values = fixture()
        values[1]['disposition_counts']['supported-current'] = 29
        with self.assertRaisesRegex(ValueError, 'cluster-or-label-counts'):
            MODULE.analyze(*values, LABEL_SHA)


if __name__ == '__main__':
    unittest.main()
