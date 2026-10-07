#!/usr/bin/env python3
"""Synthetic tests only; never opens reserved answer or label files."""

import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


TARGET = Path(__file__).with_name('build-beam-100k-ie-r13-judge-wires.py')
SPEC = importlib.util.spec_from_file_location('g03_r13_judge_wires', TARGET)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def fixture():
    cases = {}
    entries, rows, attempts = [], [], []
    for index in range(32):
        probe = f'probe-{index:02}'
        cases[probe] = {'probe_id': probe, 'question': f'Question {index}?',
                        'native_reference_answer': f'Answer {index}',
                        'source_chat_ids': [0],
                        'cited_turns': [{'id': 0, 'role': 'user',
                                         'content': f'Source {index}'}]}
        for arm in ('control', 'treatment'):
            ordinal = len(entries) + 1
            answer = f'Response {index} {arm}'
            request_sha = MODULE.sha(f'request-{ordinal}'.encode())
            entries.append({'probe_id': probe, 'arm': arm,
                            'request_sha256': request_sha})
            rows.append({'ordinal': ordinal, 'probe_id': probe, 'arm': arm,
                         'valid': True,
                         'answer_sha256': MODULE.sha(answer.encode())})
            attempts.append({'schema_version':
                             'are.g03-beam-100k-ie-r13-attempt/v1',
                             'ordinal': ordinal, 'probe_id': probe,
                             'arm': arm, 'request_sha256': request_sha,
                             'response': {'status': 200, 'payload': {
                                 'choices': [{'message': {'content': answer}}]}}})
    wire = {'schema_version': 'are.g03-beam-100k-ie-r13-answer-wires/v1',
            'wires': entries}
    result = {'schema_version': 'are.g03-beam-100k-ie-r13-result/v1',
              'status': 'completed-64-r13-reserved-answers',
              'wire_sha256': MODULE.PINS[MODULE.ANSWER_WIRES],
              'attempted': 64, 'valid': 64, 'automatic_retries': 0,
              'evaluator_fields_read': False, 'rows': rows}
    audit = {'schema_version': 'are.g03-beam-100k-ie-r13-answer-audit/v1',
             'status': 'passed-raw-receipt-audit',
             'result_sha256': MODULE.PINS[MODULE.ANSWER_RESULT],
             'wire_sha256': MODULE.PINS[MODULE.ANSWER_WIRES],
             'complete_matched_pairs': 32, 'valid': 64}
    return cases, wire, result, audit, attempts


class BuilderTests(unittest.TestCase):
    def test_complete_blind_wires(self):
        wires, mapping, largest = MODULE.make_wires(*fixture())
        self.assertEqual((len(wires), len(mapping), largest), (64, 64, 9))
        self.assertEqual(len({row['blind_id'] for row in wires}), 64)
        self.assertEqual({row['arm'] for row in mapping},
                         {'control', 'treatment'})

    def test_changed_answer_rejected(self):
        cases, wire, result, audit, attempts = fixture()
        attempts[5]['response']['payload']['choices'][0]['message'][
            'content'] = 'wrong answer'
        with self.assertRaisesRegex(ValueError, 'answer-hash'):
            MODULE.make_wires(cases, wire, result, audit, attempts)

    def test_missing_pair_rejected(self):
        cases, wire, result, audit, attempts = fixture()
        wire['wires'][1]['arm'] = 'control'
        result['rows'][1]['arm'] = 'control'
        attempts[1]['arm'] = 'control'
        with self.assertRaisesRegex(ValueError, 'matched-blind-pairs'):
            MODULE.make_wires(cases, wire, result, audit, attempts)

    def test_label_gate_precedes_answer_read(self):
        def fake_sha(path):
            if path in (MODULE.SOURCE, MODULE.SOURCE_PREFLIGHT):
                return MODULE.PINS[path]
            if 'ANSWER' in str(path):
                raise AssertionError('answer path was opened before label seal')
            return 'f' * 64

        argv = [str(TARGET), '--label-sha256', '0' * 64,
                '--wires', str(MODULE.ROOT / 'UNWRITTEN-TEST-WIRES.json'),
                '--map', str(MODULE.ROOT / 'UNWRITTEN-TEST-MAP.json')]
        with patch.object(sys, 'argv', argv), patch.object(MODULE, 'file_sha',
                                                         side_effect=fake_sha):
            with self.assertRaisesRegex(ValueError, 'source-or-label-drift'):
                MODULE.main()


if __name__ == '__main__':
    unittest.main()
