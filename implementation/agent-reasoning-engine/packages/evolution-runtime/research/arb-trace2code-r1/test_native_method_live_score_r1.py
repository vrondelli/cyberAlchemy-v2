"""Synthetic metric and mapping tests, no gold reads.
Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R1.json.
"""
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('scoring', Path(__file__).with_name('score-runtime-linked-reader-r1.py'))
scoring = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scoring)


class Tests(unittest.TestCase):
    def test_missing_rank_is_failure_in_denominator(self):
        self.assertEqual(scoring.metrics([], {'a'})['mrr_at_8'], 0)
        self.assertEqual(scoring.metrics(['x', 'a'], {'a'})['mrr_at_8'], .5)

    def test_longest_declared_dollar_type_and_ambiguity(self):
        rows = [{'path': 'a', 'top_level_classes': ['p.$Type']}, {'path': 'b', 'top_level_classes': ['p.$Type$Nested']}]
        self.assertEqual(scoring.mapped_files(['p.$Type$Nested$1'], rows), ({'b'}, []))
        gold, failures = scoring.mapped_files(['unknown'], rows)
        self.assertFalse(gold)
        self.assertEqual(len(failures), 1)

    def test_signflip_ties_not_significant(self):
        self.assertEqual(scoring.signflip([0] * 16), 1)
        self.assertLess(scoring.signflip([.1] * 16), .05)


if __name__ == '__main__':
    unittest.main()
