"""Canonical exposed metric semantics. Open Questions: G01-CANONICAL-SOURCE-DEV-R1.md."""
from pathlib import Path
import runpy
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name('score-canonical-source-exposed-r1.py')))
metrics = MODULE['metrics']
fusion = MODULE['fusion']


class CanonicalSourceScore(unittest.TestCase):
    def test_multiple_gold_keeps_full_recall_denominator(self):
        self.assertEqual(metrics(['noise', 'a'], {'a', 'b'}), {'mrr_at_8': .5, 'hit_at_3': 1, 'recall_at_8': .5})

    def test_outside_budget_does_not_count(self):
        ranking = [str(i) for i in range(9)]
        self.assertEqual(metrics(ranking, {'8'}), {'mrr_at_8': 0, 'hit_at_3': 0, 'recall_at_8': 0})

    def test_fusion_keeps_union_and_lexical_ties(self):
        self.assertEqual(fusion(['b', 'a', 'c'], [['a'], ['b']]), ['a', 'b', 'c'])


if __name__ == '__main__':
    unittest.main()
