"""Fresh-policy pure regressions, no labels/provider calls.

Open Questions: G01-DEFECTS4J-CALLER-R4-PROTOCOL.md.
"""
from pathlib import Path
import runpy
import unittest

ROOT=Path(__file__).parent
TRACE=runpy.run_path(str(ROOT/'preflight-defects4j-trace-view-r4.py'))
BUILD=runpy.run_path(str(ROOT/'build-defects4j-caller-r4.py'))
SCORE=runpy.run_path(str(ROOT/'score-defects4j-caller-r4.py'))

class FreshPolicyTests(unittest.TestCase):
    def test_zero_frame_case_retains_header_exception(self):
        raw='--- example\nFailure without Java frames\n--- another\nFailure\n at a.B.call(B.java:12)\n'
        self.assertEqual(TRACE['bounded_view'](raw),('--- example\nFailure without Java frames\n',[]))

    def test_no_cross_failure_frame_acquisition(self):
        raw='--- example\nFailure\n at java.lang.Thread.run(Thread.java:1)\n--- another\nFailure\n at a.B.call(B.java:12)\n'
        self.assertEqual(TRACE['bounded_view'](raw)[1],[])

    def test_fusion_empty_evidence_ties_lexically(self):
        self.assertEqual(BUILD['fusion'](['b','a'],[]),['a','b'])

    def test_fusion_does_not_expand_candidate_union(self):
        self.assertEqual(BUILD['fusion'](['b','a'],[['gold','b','a']]),['b','a'])

    def test_invalid_response_is_empty_failure(self):
        self.assertEqual(SCORE['metrics']([],{'gold'}),{'mrr_at_8':0,'hit_at_3':0,'recall_at_8':0})

    def test_fifteen_project_exact_signflip(self):
        self.assertEqual(SCORE['signflip']([1]*15),2/(2**15))

if __name__=='__main__':
    unittest.main()
