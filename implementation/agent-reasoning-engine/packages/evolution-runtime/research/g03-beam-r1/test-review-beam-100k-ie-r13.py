#!/usr/bin/env python3
"""Synthetic tests; never open the private BEAM answer or label files."""

import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('review-beam-100k-ie-r13.py')


def load_helper():
    spec = importlib.util.spec_from_file_location('beam_r13_review_helper', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ReviewHelperTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.helper = load_helper()
        self.helper.ROOT = self.root
        self.helper.INPUT_SHA = 'a' * 64
        self.helper.HISTORIES_SHA = 'b' * 64
        self.cases = {f'probe-{i:02d}': {
            'probe_id': f'probe-{i:02d}', 'conversation_key': f'conv-{i // 2:02d}',
            'question': f'Question {i}', 'native_reference_answer': 'Reference',
            'source_chat_ids': [1], 'cited_turns': [
                {'id': 1, 'role': 'user', 'content': 'first', 'time_anchor': None}],
        } for i in range(32)}
        self.histories = {f'conv-{i:02d}': [
            {'id': 1, 'role': 'user', 'content': 'first', 'time_anchor': None},
            {'id': 2, 'role': 'assistant', 'content': 'later', 'time_anchor': None},
        ] for i in range(16)}
        self.template = {
            'schema_version': 'are.g03-beam-100k-ie-r13-review-form/v1',
            'reviewer': 'Vlad', 'review_input_sha256': self.helper.INPUT_SHA,
            'full_histories_sha256': self.helper.HISTORIES_SHA,
            'arm_answers_seen': False, 'scorer_outputs_seen': False,
            'decisions': [{'probe_id': key, 'disposition': None,
                           'evidence_turn_ids': [], 'reason': None}
                          for key in sorted(self.cases)],
        }
        raw = (json.dumps(self.template) + '\n').encode()
        path = self.root / 'LABEL-REVIEW-VLAD-TEMPLATE.json'
        path.write_bytes(raw)
        self.helper.TEMPLATE_SHA = {'Vlad': hashlib.sha256(raw).hexdigest()}

    def tearDown(self):
        self.tmp.cleanup()

    def test_incremental_record_preserves_prior_work_and_permissions(self):
        self.helper.record('Vlad', 'probe-00', 'supported-current', [1],
                           'Reference is supported.', self.cases, self.histories)
        self.helper.record('Vlad', 'probe-01', 'conflicted', [2],
                           'A later update conflicts.', self.cases, self.histories)
        path = self.root / 'LABEL-REVIEW-VLAD.json'
        value = json.loads(path.read_text())
        by_id = {row['probe_id']: row for row in value['decisions']}
        self.assertEqual(by_id['probe-00']['disposition'], 'supported-current')
        self.assertEqual(by_id['probe-01']['disposition'], 'conflicted')
        self.assertTrue(by_id['probe-01']['full_history_reviewed'])
        self.assertEqual(value['status'], 'in-progress-answer-blind-review')
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
        self.assertFalse(list(self.root.glob('*.tmp')))

    def test_invalid_turn_is_rejected_without_creating_form(self):
        with self.assertRaisesRegex(ValueError, 'record-evidence'):
            self.helper.record('Vlad', 'probe-00', 'supported-current', [99],
                               'Wrong evidence turn.', self.cases, self.histories)
        self.assertFalse((self.root / 'LABEL-REVIEW-VLAD.json').exists())

    def test_template_drift_is_rejected(self):
        path = self.root / 'LABEL-REVIEW-VLAD-TEMPLATE.json'
        path.write_text('{}')
        with self.assertRaisesRegex(ValueError, 'template-drift'):
            self.helper.record('Vlad', 'probe-00', 'supported-current', [1],
                               'Reference is supported.', self.cases, self.histories)


if __name__ == '__main__':
    unittest.main()
