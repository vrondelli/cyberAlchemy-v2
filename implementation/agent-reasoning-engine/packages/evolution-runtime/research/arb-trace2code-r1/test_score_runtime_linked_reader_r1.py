"""Synthetic only. Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json."""
import runpy
import unittest
from pathlib import Path
M = runpy.run_path(str(Path(__file__).with_name('score-runtime-linked-reader-r1.py')))


class ScoreTest(unittest.TestCase):
    def test_dollar_top_and_nested_owner(self):
        production = [{'path': 'Types.java', 'top_level_classes': ['p.Types']},
                      {'path': '$Types.java', 'top_level_classes': ['p.$Types']}]
        self.assertEqual(M['mapped_files'](['p.$Types$Inner', 'p.Types'], production), ({'$Types.java', 'Types.java'}, []))

    def test_ambiguous_and_absent_explicit(self):
        production = [{'path': 'a', 'top_level_classes': ['p.Type']}, {'path': 'b', 'top_level_classes': ['p.Type']}]
        gold, failed = M['mapped_files'](['p.Type', 'p.Other'], production)
        self.assertEqual(gold, set())
        self.assertEqual([f['matches'] for f in failed], [2, 0])

    def test_metrics_full_denominator(self):
        self.assertEqual(M['metrics']([], {'a'}), {'mrr_at_8': 0, 'hit_at_3': 0, 'recall_at_8': 0})
        self.assertEqual(M['metrics'](['b', 'a'], {'a'})['mrr_at_8'], .5)
        self.assertEqual(M['metrics'](list('12345678a'), {'a'})['mrr_at_8'], 0)

    def test_exact_signflip(self):
        self.assertEqual(M['signflip']([0, 0]), 1)
        self.assertEqual(M['signflip']([1, 1, 1]), .25)

    def test_public_reply_reconstruction(self):
        reply = {'dispatched': True, 'status': 200, 'prompt_tokens': 7680, 'completion_tokens': 20,
                 'public_response': {'finish_reason': 'stop', 'message': {'role': 'assistant', 'content': '{"candidate_ids":[2,"[1]"]}'}}}
        self.assertEqual(M['public_ids'](reply, 2), [2, 1])
        self.assertIsNone(M['public_ids']({**reply, 'prompt_tokens': 7681}, 2))
        self.assertIsNone(M['public_ids']({**reply, 'completion_tokens': None}, 2))
        reply['public_response']['message']['content'] = '{"candidate_ids":[true]}'
        self.assertIsNone(M['public_ids'](reply, 2))


if __name__ == '__main__':
    unittest.main()
