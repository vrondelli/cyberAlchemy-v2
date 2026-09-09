from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("candidate_013_paths", ROOT / "enumerate_paths.py")
assert SPEC is not None and SPEC.loader is not None
PATHS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PATHS)


class AdversarialCoverageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.model = json.loads((ROOT / "adversarial-model.json").read_text())

    def evaluate(self, model=None):
        return PATHS.evaluate(model or self.model)

    def test_fifteen_failure_classes_are_deterministically_closed_by_spec(self) -> None:
        receipt = self.evaluate()
        self.assertEqual(15, receipt["coverage"]["declared_paths"])
        self.assertEqual([], receipt["coverage"]["uncovered_paths"])
        self.assertEqual("NOT_EVALUABLE", receipt["aggregate_readiness"])

    def test_exact_knowledge_protocol_failure_class_regression_inventory(self) -> None:
        expected = {
            "stale-or-missing-blockhash", "submission-timeout-unknown-effect",
            "retry-or-replay-after-ambiguity", "finalized-failure-versus-pre-submission-rejection",
            "revision-race-or-already-applied", "wallet-identity-or-authority-mismatch",
            "malformed-public-handoff-card", "recipient-outsider-stale-envelope-or-auth-failure",
            "rust-browser-hpke-drift", "ciphertext-plaintext-or-content-key-context-mismatch",
            "rust-custom-program-discriminant-drift", "serialization-or-length-drift",
            "account-owner-pda-epoch-or-version-mismatch",
            "partial-effect-crash-restart-journal-discontinuity-duplicate-or-reorder",
            "unknown-or-unclassified-failure",
        }
        self.assertEqual(expected, {item["failure_class"] for item in self.model["paths"]})

    def test_missing_reachable_path_residue_blocks(self) -> None:
        model = copy.deepcopy(self.model); model["paths"][0].pop("residue_owner")
        self.assertEqual("BLOCK", self.evaluate(model)["aggregate_readiness"])

    def test_missing_reachable_path_obligation_blocks(self) -> None:
        model = copy.deepcopy(self.model); model["paths"][0]["obligations"] = []
        self.assertEqual("BLOCK", self.evaluate(model)["aggregate_readiness"])

    def test_missing_exclusion_rationale_blocks(self) -> None:
        model = copy.deepcopy(self.model); model["paths"][6].pop("exclusion_rationale")
        self.assertEqual("BLOCK", self.evaluate(model)["aggregate_readiness"])

    def test_duplicate_or_missing_path_identity_blocks(self) -> None:
        model = copy.deepcopy(self.model); model["paths"][1]["path_id"] = model["paths"][0]["path_id"]
        self.assertEqual("BLOCK", self.evaluate(model)["aggregate_readiness"])

    def test_provider_brand_is_not_a_coverage_requirement(self) -> None:
        receipt = self.evaluate()
        self.assertEqual([], receipt["provider_adequacy"]["named_provider_mandates_added"])
        self.assertEqual(
            {"require-tlc-by-name", "require-alloy-by-name", "treat-provider-absence-as-path-absence"},
            set(self.model["provider_policy"]["forbidden_provider_coupling"]),
        )

    def test_unknown_failure_is_reachable_and_fail_closed(self) -> None:
        path = next(item for item in self.model["paths"] if item["path_id"] == "PATH-013-015")
        self.assertEqual("reachable", path["applicability"])
        self.assertEqual("fail-closed-and-block-readiness", path["desired_residue"])

    def test_false_completeness_is_forbidden(self) -> None:
        receipt = self.evaluate()
        self.assertIn("exact declared", receipt["coverage"]["completeness_scope"])
        self.assertTrue(receipt["provider_adequacy"]["unproven_evidence_kinds_remain_residue"])

    def test_v3_baseline_is_digest_bound(self) -> None:
        baseline = self.model["baseline"]
        self.assertEqual("c61b98d397eaf3af9918f30f66ad4d6239e031e90262cec005fb12b7963837f0", baseline["claims_sha256"])
        self.assertEqual("be930df2a4180815f624c56367eb38a79caf78ba18fdf8296838084ddaa44c72", baseline["aggregate_receipt_sha256"])

    def test_stale_baseline_evidence_blocks_generation(self) -> None:
        with mock.patch.object(PATHS, "sha", return_value="0" * 64):
            with self.assertRaisesRegex(ValueError, "stale v3 claims baseline"):
                PATHS.build()


if __name__ == "__main__":
    unittest.main()
