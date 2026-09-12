"""Scorer identity edge cases. Open questions: README.md."""
import unittest
from score import score
class ScoreTests(unittest.TestCase):
 def test_ambiguous_failure_cannot_hide(self):
  self.assertFalse(score({'FAIL_TO_PASS':['x'],'PASS_TO_PASS':[]},{'a > x':'pass','b > x':'fail'})['resolved'])
 def test_missing_fails(self):
  self.assertFalse(score({'FAIL_TO_PASS':['x'],'PASS_TO_PASS':[]},{})['resolved'])
 def test_all_matches_pass(self):
  self.assertTrue(score({'FAIL_TO_PASS':['x'],'PASS_TO_PASS':['y']},{'a > x':'pass','b > x':'pass','c > y':'pass'})['resolved'])
 def test_skipped_expected_is_not_pass(self):
  self.assertFalse(score({'FAIL_TO_PASS':['x'],'PASS_TO_PASS':[]},{'a > x':'skip'})['resolved'])
if __name__=='__main__':unittest.main()
