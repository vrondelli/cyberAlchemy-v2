from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[5]
sys.path.insert(0, str(ROOT))

from src.evf_residual import evaluate, non_inflating_join  # noqa: E402

MODEL = REPO / "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/formal-evidence/deployment-continuation/013/adversarial-model.json"
OBSERVATIONS = ROOT / "evidence/candidate-013-observations.json"


class EvaluatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.model = json.loads(MODEL.read_text())
        self.observations = json.loads(OBSERVATIONS.read_text())["observations"]
        self.bindings = {"receipt_id": "test", "open_questions_ref": "OPEN-QUESTIONS.md"}

    def test_candidate_013_has_spec_closure_but_evidence_blocks_readiness(self) -> None:
        receipt = evaluate(self.model, self.observations, self.bindings)
        self.assertEqual(15, receipt["coverage"]["specification_closed_paths"])
        self.assertEqual(10, receipt["coverage"]["reachable_safety_paths"])
        self.assertEqual(2, receipt["coverage"]["evidence_supported_paths"])
        self.assertEqual("BLOCK", receipt["aggregate_readiness"])

    def test_join_never_votes_through_provider_disagreement(self) -> None:
        self.assertEqual(("conflict", ["provider-disagreement-no-vote"]), non_inflating_join(["supported", "counterexample"]))

    def test_counterexample_conflicts_with_existing_positive_evidence(self) -> None:
        observations = copy.deepcopy(self.observations)
        observations[0]["outcome"] = "counterexample"
        receipt = evaluate(self.model, observations, self.bindings)
        path = next(item for item in receipt["path_results"] if item["path_id"] == "PATH-013-003")
        self.assertEqual("CONFLICT", path["status"])
        self.assertEqual("BLOCK", receipt["aggregate_readiness"])

    def test_provider_brand_does_not_change_adequacy(self) -> None:
        left = copy.deepcopy(self.observations)
        right = copy.deepcopy(self.observations)
        right[0]["provider_id"] = "another-theorem-provider"
        self.assertEqual(evaluate(self.model, left, self.bindings)["coverage"], evaluate(self.model, right, self.bindings)["coverage"])

    def test_unknown_path_observation_blocks(self) -> None:
        observations = copy.deepcopy(self.observations)
        observations[0]["path_id"] = "PATH-UNKNOWN"
        receipt = evaluate(self.model, observations, self.bindings)
        self.assertTrue(any("observation-for-unknown-path" in item for item in receipt["structural_issues"]))
        self.assertEqual("BLOCK", receipt["aggregate_readiness"])

    def test_observation_authority_inflation_blocks(self) -> None:
        observations = copy.deepcopy(self.observations)
        observations[0]["authority_effect"] = "admit"
        receipt = evaluate(self.model, observations, self.bindings)
        self.assertTrue(any("authority-inflation" in item for item in receipt["structural_issues"]))

    def test_missing_residue_owner_blocks_even_with_evidence(self) -> None:
        model = copy.deepcopy(self.model)
        model["paths"][0].pop("residue_owner")
        receipt = evaluate(model, [], self.bindings)
        self.assertTrue(any("without-owned-residue" in item for item in receipt["structural_issues"]))

    def test_complete_synthetic_evidence_reaches_candidate_only_ceiling(self) -> None:
        observations = []
        for path in self.model["paths"]:
            if path["applicability"] != "reachable":
                continue
            for index, obligation in enumerate(path["obligations"]):
                observations.append({
                    "observation_id": f"{path['path_id']}-obligation-{index}", "path_id": path["path_id"],
                    "obligation_id": obligation, "evidence_kind": path["evidence_kinds"][0], "outcome": "supported",
                    "provider_family": "fixture", "provider_id": "fixture-a", "exact_refs": [{"path":"fixture","sha256":"a"*64}],
                    "claim_ceiling": "bounded fixture", "authority_effect": "none"
                })
            for index, kind in enumerate(path["evidence_kinds"]):
                observations.append({
                    "observation_id": f"{path['path_id']}-kind-{index}", "path_id": path["path_id"],
                    "obligation_id": path["obligations"][0], "evidence_kind": kind, "outcome": "supported",
                    "provider_family": "fixture", "provider_id": "fixture-b", "exact_refs": [{"path":"fixture","sha256":"b"*64}],
                    "claim_ceiling": "bounded fixture", "authority_effect": "none"
                })
        receipt = evaluate(self.model, observations, self.bindings)
        self.assertEqual("READY_CANDIDATE_ONLY", receipt["aggregate_readiness"])
        self.assertEqual(10, receipt["coverage"]["evidence_supported_paths"])
        self.assertEqual("none", receipt["authority_effect"])


if __name__ == "__main__":
    unittest.main()
