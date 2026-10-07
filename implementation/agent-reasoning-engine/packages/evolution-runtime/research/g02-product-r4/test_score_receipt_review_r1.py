#!/usr/bin/env python3
"""Source-only transformation tests; no gold, model, or VPS access."""

import importlib.util
import unittest
from pathlib import Path


MODULE = Path(__file__).with_name('score-receipt-review-r1.py')
SPEC = importlib.util.spec_from_file_location('score_receipt_review_r1', MODULE)
SCORER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCORER)


class TransformationTest(unittest.TestCase):
    def setUp(self):
        self.original = {'instance_id': 'task', 'traj_data': {
            'pred_files': ['a.py'], 'pred_spans': {'a.py': [{'start': 1, 'end': 3}]},
            'pred_steps': [{'files': ['a.py'], 'spans': {'a.py': [{'start': 1, 'end': 3}]}},
                           {'files': ['b.py'], 'spans': {'b.py': [{'start': 8, 'end': 12}]}}]}}
        self.packet = {'delivered_reads': [
            {'index': 0, 'path': 'a.py', 'start': 1, 'end': 3},
            {'index': 1, 'path': 'b.py', 'start': 8, 'end': 12}]}

    def test_add_delivered_span_and_preserve_steps(self):
        response = {'status': 'valid', 'review': {'add_read_indexes': [1], 'drop_files': []}}
        result, posture, added, dropped = SCORER.transform(self.original, self.packet, response)
        self.assertEqual((posture, added, dropped), ('valid-transformed', 1, 0))
        self.assertEqual(result['traj_data']['pred_files'], ['a.py', 'b.py'])
        self.assertEqual(result['traj_data']['pred_spans']['b.py'], [{'start': 8, 'end': 12}])
        self.assertEqual(result['traj_data']['pred_steps'], self.original['traj_data']['pred_steps'])
        self.assertEqual(self.original['traj_data']['pred_files'], ['a.py'])

    def test_invalid_preserves_original(self):
        result, posture, added, dropped = SCORER.transform(
            self.original, self.packet, {'status': 'invalid', 'review': None})
        self.assertEqual(result, self.original)
        self.assertEqual((posture, added, dropped), ('invalid-preserved', 0, 0))

    def test_rejects_invented_or_conflicting_edits(self):
        for review in ({'add_read_indexes': [2], 'drop_files': []},
                       {'add_read_indexes': [0], 'drop_files': ['a.py']},
                       {'add_read_indexes': [], 'drop_files': ['b.py']}):
            with self.subTest(review=review), self.assertRaises(ValueError):
                SCORER.transform(self.original, self.packet, {'status': 'valid', 'review': review})


if __name__ == '__main__':
    unittest.main()
