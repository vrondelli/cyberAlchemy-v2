#!/usr/bin/env python3
"""Synthetic-only independent receipt audit tests."""

import importlib.util
import json
from pathlib import Path
import unittest


TARGET = Path(__file__).with_name(
    'audit-beam-100k-ie-r13-source-grounded-judge.py')
SPEC = importlib.util.spec_from_file_location('g03_r13_score_audit', TARGET)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
WIRE_SHA, MAP_SHA, LABEL_SHA = ('a' * 64, 'b' * 64, 'c' * 64)


def fixture():
    ids = [MODULE.digest([MODULE.SEED, f'probe-{i // 2:02}',
                          'control' if i % 2 == 0 else 'treatment'])[:24]
           for i in range(64)]
    wire = {'schema_version':
            'are.g03-beam-100k-ie-r13-source-grounded-wires/v1',
            'status': 'blinded-after-two-human-label-seal-before-judge',
            'label_sha256': LABEL_SHA, 'blind_wires': 64,
            'wires': [{'blind_id': blind} for blind in ids]}
    mapping = {'schema_version':
               'are.g03-beam-100k-ie-r13-source-grounded-map/v1',
               'wire_sha256': WIRE_SHA,
               'rows': [{'blind_id': blind, 'probe_id': f'probe-{i // 2:02}',
                         'arm': 'control' if i % 2 == 0 else 'treatment'}
                        for i, blind in enumerate(ids)]}
    ordered = [{'blind_id': blind,
                'tokenizer_request_sha256': f'token-{i}',
                'generation_request_sha256': f'request-{i}'}
               for i, blind in enumerate(ids)]
    freeze = {'schema_version':
              'are.g03-beam-100k-ie-r13-source-judge-freeze/v1',
              'wire_sha256': WIRE_SHA, 'label_sha256': LABEL_SHA,
              'prompt_sha256': MODULE.PROMPT_SHA,
              'historical_runner_sha256': MODULE.R12_RUNNER_SHA,
              'maximum_judge_calls': 128, 'automatic_retries': 0,
              'ordered_requests': ordered, 'ordered_blind_ids': ids}
    preflight = {'schema_version':
                 'are.g03-beam-100k-ie-r13-source-judge-preflight/v1',
                 'status': 'passed', 'wire_sha256': WIRE_SHA,
                 'tokenizer_requests': 64, 'generation_calls': 0,
                 'rows': [{'ordinal': i + 1, 'blind_id': entry['blind_id'],
                           'tokenizer_request_sha256':
                           entry['tokenizer_request_sha256'],
                           'status': 200, 'admitted_8k': True,
                           'prompt_tokens': 100}
                          for i, entry in enumerate(ordered)]}
    generation = {'schema_version':
                  'are.g03-beam-100k-ie-r13-source-judge-generation-freeze/v1',
                  'maximum_judge_calls': 128, 'automatic_retries': 0,
                  'ordered_blind_ids': ids}
    rows, raws = [], []
    for ordinal in range(1, 129):
        repeat = 1 if ordinal <= 64 else 2
        entry = ordered[ordinal - 1 if repeat == 1 else 128 - ordinal]
        correct = int(entry['blind_id'], 16) % 2 == 1
        content = json.dumps({'correct': correct,
                              'reason_code': 'direct_match' if correct
                              else 'missing'}, separators=(',', ':'))
        raw = {'schema_version':
               'are.g03-beam-100k-ie-r13-source-judge-attempt/v1',
               'ordinal': ordinal, 'repeat': repeat,
               'blind_id': entry['blind_id'],
               'request_sha256': entry['generation_request_sha256'],
               'elapsed_ms': 10,
               'response': {'status': 200, 'payload': {
                   'choices': [{'message': {'content': content},
                                'finish_reason': 'stop'}],
                   'usage': {'prompt_tokens': 100,
                             'completion_tokens': 20}}}}
        rows.append({'ordinal': ordinal, 'repeat': repeat,
                     'blind_id': entry['blind_id'], 'valid': True,
                     'status': 200, 'correct': correct,
                     'reason_code': 'direct_match' if correct else 'missing',
                     'prompt_tokens': 100, 'completion_tokens': 20,
                     'finish_reason': 'stop', 'elapsed_ms': 10})
        raws.append(raw)
    result = {'schema_version':
              'are.g03-beam-100k-ie-r13-source-judge-result/v1',
              'status': 'completed-64-pairs-two-pass',
              'wire_sha256': WIRE_SHA, 'label_sha256': LABEL_SHA,
              'attempted': 128, 'valid': 128, 'automatic_retries': 0,
              'known_prompt_tokens': 12800,
              'known_completion_tokens': 2560, 'rows': rows}
    return wire, mapping, freeze, preflight, generation, result, raws


def run(values):
    return MODULE.evaluate(*values, WIRE_SHA, MAP_SHA, LABEL_SHA)


class AuditTests(unittest.TestCase):
    def test_complete_two_pass_audit(self):
        summary = run(fixture())
        self.assertEqual(len(summary['pairs']), 32)
        self.assertEqual(summary['repeat_disagreements'], 0)
        self.assertTrue(summary['scorer_transfer_gate_passed'])

    def test_repeat_disagreement_is_visible(self):
        values = fixture()
        row, raw = values[5]['rows'][64], values[6][64]
        row['correct'] = not row['correct']
        parsed = json.loads(raw['response']['payload']['choices'][0]
                            ['message']['content'])
        parsed['correct'] = row['correct']
        raw['response']['payload']['choices'][0]['message']['content'] = \
            json.dumps(parsed, separators=(',', ':'))
        summary = run(values)
        self.assertEqual(summary['repeat_disagreements'], 1)
        self.assertFalse(summary['scorer_transfer_gate_passed'])

    def test_raw_request_drift_rejected(self):
        values = fixture()
        values[6][0]['request_sha256'] = 'different'
        with self.assertRaisesRegex(ValueError, 'attempt-identity'):
            run(values)

    def test_arm_map_drift_rejected(self):
        values = fixture()
        values[1]['rows'][0]['arm'] = 'treatment'
        with self.assertRaisesRegex(ValueError, 'blind-map-binding'):
            run(values)

    def test_missing_attempt_rejected(self):
        values = fixture()
        values[6].pop()
        with self.assertRaisesRegex(ValueError, 'lineage'):
            run(values)


if __name__ == '__main__':
    unittest.main()
