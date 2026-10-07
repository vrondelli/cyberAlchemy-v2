"""Pure scoring regression tests; no source/labels/provider access.

Open Questions: G01-DEFECTS4J-CALLER-DEV-R1-PROTOCOL.md.
"""
from pathlib import Path
import runpy
import unittest

SCORE = runpy.run_path(str(Path(__file__).with_name('score-defects4j-caller-dev-r1.py')))


class ScoreTests(unittest.TestCase):
    def test_empty_prediction_is_failure(self):
        self.assertEqual(SCORE['metrics']([], {'gold.java'}),
                         {'mrr_at_8':0, 'hit_at_3':0, 'recall_at_8':0})

    def test_cutoffs_and_multiple_gold(self):
        ranking = [str(i) for i in range(1,10)]
        self.assertEqual(SCORE['metrics'](ranking, {'3','9'}),
                         {'mrr_at_8':1/3, 'hit_at_3':1, 'recall_at_8':.5})
        self.assertEqual(SCORE['metrics'](ranking, {'9'})['mrr_at_8'],0)

    def test_exact_project_signflip(self):
        self.assertEqual(SCORE['signflip']([1]*9+[0]*7),2/512)
        self.assertEqual(SCORE['signflip']([1,-1]),1)
        self.assertEqual(SCORE['signflip']([0]*16),1)


if __name__ == '__main__':
    unittest.main()
