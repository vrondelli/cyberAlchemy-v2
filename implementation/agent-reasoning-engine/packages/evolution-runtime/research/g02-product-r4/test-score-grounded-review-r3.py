#!/usr/bin/env python3
"""No-provider contract and transformation tests for the exposed G02 scorer."""

import importlib.util
import json
import unittest
from pathlib import Path


spec = importlib.util.spec_from_file_location('grounded_score', Path(__file__).with_name('score-grounded-review-r3.py'))
scorer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scorer)

PACKET = {'issue': 'Refresh the session token before serving protected pages.',
          'current_selected_files': ['src/old.js', 'src/router.js'],
          'delivered_reads': [
              {'index': 0, 'path': 'src/old.js', 'start': 1, 'end': 4,
               'snippet': 'function legacyLogin() { return staleToken; }'},
              {'index': 1, 'path': 'src/router.js', 'start': 8, 'end': 12,
               'snippet': 'function serveProtectedPage() { return route(); }'},
              {'index': 2, 'path': 'src/refresh.js', 'start': 20, 'end': 24,
               'snippet': 'function refreshSessionToken() { return renewedToken; }'}]}
ORIGINAL = {'traj_data': {'pred_files': ['src/old.js', 'src/router.js'],
                          'pred_spans': {'src/old.js': [{'start': 1, 'end': 4}],
                                         'src/router.js': [{'start': 8, 'end': 12}]},
                          'pred_steps': [{'read': 'fixed'}]}}
ADD = {'read_index': 2, 'requirement_quote': 'Refresh the session token',
       'evidence_quote': 'function refreshSessionToken()',
       'causal_role': 'The refresh handler creates the renewed token.'}
DROP = {'file': 'src/old.js', 'own_read_index': 0,
        'own_evidence_quote': 'function legacyLogin()', 'replacement_read_index': 2,
        'replacement_evidence_quote': 'function refreshSessionToken()',
        'requirement_quote': 'Refresh the session token',
        'causal_role': 'The legacy login path does not renew the protected session.'}


def response(raw):
    return {'status': 'valid', 'http_status': 200, 'finish_reason': 'stop',
            'content': json.dumps(raw), 'review': scorer.normalize(raw, PACKET)}


class GroundedScoreTests(unittest.TestCase):
    def test_abstain_preserves_prediction(self):
        candidate, posture, added, dropped = scorer.transform(ORIGINAL, PACKET, response({'add': [], 'drop': []}))
        self.assertEqual(candidate, ORIGINAL)
        self.assertEqual((posture, added, dropped), ('valid-abstained', 0, 0))

    def test_cited_add_and_drop_change_only_final_selection(self):
        candidate, posture, added, dropped = scorer.transform(ORIGINAL, PACKET, response({'add': [ADD], 'drop': [DROP]}))
        self.assertEqual((posture, added, dropped), ('valid-transformed', 1, 1))
        self.assertEqual(candidate['traj_data']['pred_files'], ['src/router.js', 'src/refresh.js'])
        self.assertEqual(candidate['traj_data']['pred_spans']['src/refresh.js'], [{'start': 20, 'end': 24}])
        self.assertEqual(candidate['traj_data']['pred_steps'], ORIGINAL['traj_data']['pred_steps'])
        self.assertEqual(ORIGINAL['traj_data']['pred_files'], ['src/old.js', 'src/router.js'])

    def test_invalid_response_preserves_original(self):
        candidate, posture, added, dropped = scorer.transform(ORIGINAL, PACKET,
            {'status': 'invalid', 'review': None})
        self.assertEqual((candidate, posture, added, dropped), (ORIGINAL, 'invalid-preserved', 0, 0))

    def test_fabricated_citations_or_unretained_replacement_fail(self):
        bad_add = dict(ADD, evidence_quote='invented code')
        with self.assertRaisesRegex(ValueError, 'add-citation'):
            scorer.normalize({'add': [bad_add], 'drop': []}, PACKET)
        with self.assertRaisesRegex(ValueError, 'replacement-not-retained'):
            scorer.normalize({'add': [], 'drop': [DROP]}, PACKET)

    def test_receipt_cannot_change_normalized_decision(self):
        forged = response({'add': [ADD], 'drop': []})
        forged['review']['add_read_indexes'] = []
        with self.assertRaisesRegex(ValueError, 'review-content-drift'):
            scorer.transform(ORIGINAL, PACKET, forged)

    def test_bool_is_not_a_read_index(self):
        with self.assertRaisesRegex(ValueError, 'add-citation'):
            scorer.normalize({'add': [dict(ADD, read_index=True)], 'drop': []}, PACKET)

    def test_summary_keeps_cohort_and_repository_separate(self):
        rows = [
            {'cohort': 'r2', 'repo': 'repo/a', 'file_f1': .8, 'base_file_f1': .7,
             'dsh_file_f1': .6, 'span_f1': .5, 'base_span_f1': .4,
             'posture': 'valid-transformed', 'elapsed_ms': 100,
             'usage': {'total_tokens': 20}},
            {'cohort': 'r3', 'repo': 'repo/b', 'file_f1': .2, 'base_file_f1': .3,
             'dsh_file_f1': .4, 'span_f1': .1, 'base_span_f1': .2,
             'posture': 'invalid-preserved', 'elapsed_ms': 200, 'usage': None},
        ]
        summary = scorer.summarize(rows)
        self.assertEqual(summary['cohort:r2']['pairs'], 1)
        self.assertAlmostEqual(summary['repository:r2:repo/a']['mean_file_f1_change'], .1)
        self.assertEqual(summary['cohort:r3']['reviewer_token_usage_missing'], 1)
        self.assertEqual(summary['cohort:r2']['reviewer_total_tokens_known'], 20)


if __name__ == '__main__':
    unittest.main()
