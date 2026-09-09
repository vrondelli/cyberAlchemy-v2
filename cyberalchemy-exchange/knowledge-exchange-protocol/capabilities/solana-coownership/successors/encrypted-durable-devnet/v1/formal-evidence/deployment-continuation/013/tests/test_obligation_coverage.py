from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("candidate_013_author", ROOT / "author.py")
assert SPEC is not None and SPEC.loader is not None
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class ObligationCoverageTests(unittest.TestCase):
    def setUp(self) -> None:
        document = json.loads((ROOT / "claims.json").read_text())
        self.obligations = document["required_obligations"]
        self.claims = document["claims"]
        self.provider_results = {"lean": {"status": "PASS_BOUNDED"}}

    def test_complete_semantic_obligation_set_passes(self) -> None:
        coverage = AUTHOR.evaluate_obligation_coverage(
            self.obligations, self.claims, self.provider_results
        )
        self.assertEqual("PASS_BOUNDED", coverage["status"])
        self.assertTrue(coverage["complete"])

    def test_obligation_without_evidence_is_detected(self) -> None:
        obligations = copy.deepcopy(self.obligations)
        obligations[0]["evidence_refs"] = []
        coverage = AUTHOR.evaluate_obligation_coverage(
            obligations, self.claims, self.provider_results
        )
        self.assertEqual("BLOCK", coverage["status"])
        self.assertIn(obligations[0]["obligation_id"], coverage["undischarged_obligations"])

    def test_drifted_theorem_reference_is_detected(self) -> None:
        obligations = copy.deepcopy(self.obligations)
        obligations[0]["evidence_refs"][0]["theorems"].append("missingTheorem")
        coverage = AUTHOR.evaluate_obligation_coverage(
            obligations, self.claims, self.provider_results
        )
        self.assertEqual("BLOCK", coverage["status"])
        issues = coverage["obligations"][0]["issues"]
        self.assertIn("unmapped-theorem:missingTheorem", issues)

    def test_inadequate_projection_result_is_detected(self) -> None:
        coverage = AUTHOR.evaluate_obligation_coverage(
            self.obligations, self.claims, {"lean": {"status": "BLOCK"}}
        )
        self.assertEqual("BLOCK", coverage["status"])
        self.assertGreater(len(coverage["undischarged_obligations"]), 0)

    def test_missing_projection_is_evidence_failure_not_brand_residue(self) -> None:
        coverage = AUTHOR.evaluate_obligation_coverage(
            self.obligations, self.claims, {}
        )
        self.assertEqual("BLOCK", coverage["status"])
        self.assertTrue(any(
            issue.startswith("missing-projection-for-claim:")
            for item in coverage["obligations"]
            for issue in item["issues"]
        ))

    def test_aggregate_claim_remains_not_evaluable(self) -> None:
        receipt = json.loads((ROOT / "generated/provider-receipt.json").read_text())
        self.assertEqual("not_evaluable", receipt["status"])
        self.assertEqual(
            {"rust-model-preservation", "finalized-devnet-observation"},
            {item["residue_id"] for item in receipt["residues"]},
        )


if __name__ == "__main__":
    unittest.main()
