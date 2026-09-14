from __future__ import annotations

import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]

from evf_tiers.kernel import digest_value, evaluate  # noqa: E402


def exact_ref(path: Path, relative: str) -> dict[str, object]:
    data = path.read_bytes()
    return {"path": relative, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


class EnforcementTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)
        self.repo.joinpath("profile.json").write_bytes(ROOT.joinpath("profile.json").read_bytes())
        self.repo.joinpath("property.json").write_text('{"rule":"reachable"}\n')
        self.repo.joinpath("subject.json").write_text('{"graph":"frozen"}\n')
        profile_data = self.repo.joinpath("profile.json").read_bytes()
        bounds = {"denominator": 1, "timeout_seconds": 30, "max_output_bytes": 1_048_576}
        bounds["digest"] = digest_value(bounds)
        self.invocation = {
            "schema_version": "evf.verification-tier-invocation/v1",
            "request_id": "test-request",
            "requested_tier": "V0",
            "profile": {
                "path": "profile.json",
                "sha256": hashlib.sha256(profile_data).hexdigest(),
                "profile_id": "evf.core.verification-tiers.v0-v2",
                "profile_version": "1",
            },
            "property": {
                "property_id": "property.reachability",
                "meaning_owner": "test owner",
                "obligation_id": "obligation.1",
                "traits": ["recursive-relational", "bounded-structural"],
                "definition_ref": exact_ref(self.repo / "property.json", "property.json"),
            },
            "subject": exact_ref(self.repo / "subject.json", "subject.json"),
            "bounds": bounds,
            "providers": [],
            "controls": [],
            "effect_ceiling": "read-only-isolated-verification",
        }
        self.invocation["providers"] = [self.receipt("souffle", "datalog-fixed-point", "route-s", "group-s")]

    def tearDown(self) -> None:
        self.temp.cleanup()

    def receipt(
        self,
        provider: str,
        capability: str,
        route: str,
        group: str,
        outcome: str = "no-counterexample",
    ) -> dict[str, object]:
        receipt = {
            "schema_version": "evf.verification-tier-provider-receipt/v1",
            "receipt_kind": "provider-evidence",
            "provider_id": provider,
            "provider_version": "test-exact-version",
            "capability": capability,
            "route_id": route,
            "independence_group": group,
            "property_id": self.invocation["property"]["property_id"],
            "obligation_id": self.invocation["property"]["obligation_id"],
            "subject_sha256": self.invocation["subject"]["sha256"],
            "bounds_digest": self.invocation["bounds"]["digest"],
            "normalized_outcome": outcome,
            "observation_count": self.invocation["bounds"]["denominator"],
            "fresh": True,
            "raw_evidence_valid": True,
            "exact_bindings": True,
            "execution_state": "completed",
            "fixture": False,
        }
        receipt["payload_digest"] = digest_value(receipt)
        return receipt

    def alloy(self, outcome: str = "no-counterexample") -> dict[str, object]:
        return self.receipt("alloy", "relational-model-finding", "route-a", "group-a", outcome)

    def controls(self) -> list[dict[str, object]]:
        return [
            {"control_id": f"control-{kind}", "class": kind, "expected_non_success": True, "detected": True}
            for kind in ("subject", "oracle", "denominator", "evidence", "execution")
        ]

    def assert_result_schema(self, result: dict[str, object]) -> None:
        schema = json.loads(ROOT.joinpath("contracts/result.v1.schema.json").read_text())
        Draft202012Validator(schema).validate(result)

    def test_v0_single_real_route_satisfies_contract(self) -> None:
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assert_result_schema(result)
        self.assertEqual("satisfied", result["contract_state"])
        self.assertEqual("V0", result["verified_tier"])
        self.assertEqual("no_counterexample_within_bounds", result["property_outcome"])

    def test_v1_requires_two_independent_routes(self) -> None:
        self.invocation["requested_tier"] = "V1"
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIsNone(result["verified_tier"])
        self.assertEqual("V0", result["available_lower_tier"])

    def test_v1_two_routes_agree_without_voting(self) -> None:
        self.invocation["requested_tier"] = "V1"
        self.invocation["providers"].append(self.alloy())
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("satisfied", result["contract_state"])
        self.assertEqual("V1", result["verified_tier"])

    def test_provider_disagreement_is_conflict(self) -> None:
        self.invocation["requested_tier"] = "V1"
        self.invocation["providers"].append(self.alloy("counterexample"))
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("conflicting_evidence", result["contract_state"])
        self.assertEqual("conflicting_evidence", result["property_outcome"])
        self.assertIsNone(result["verified_tier"])

    def test_v2_requires_all_control_classes(self) -> None:
        self.invocation["requested_tier"] = "V2"
        self.invocation["providers"].append(self.alloy())
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertEqual("V1", result["available_lower_tier"])
        self.assertIsNone(result["verified_tier"])

    def test_v2_complete_controls_satisfy_contract(self) -> None:
        self.invocation["requested_tier"] = "V2"
        self.invocation["providers"].append(self.alloy())
        self.invocation["controls"] = self.controls()
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("satisfied", result["contract_state"])
        self.assertEqual("V2", result["verified_tier"])

    def test_counterexample_can_satisfy_verification_contract(self) -> None:
        self.invocation["requested_tier"] = "V2"
        self.invocation["providers"] = [
            self.receipt("souffle", "datalog-fixed-point", "route-s", "group-s", "counterexample"),
            self.alloy("counterexample"),
        ]
        self.invocation["controls"] = self.controls()
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("satisfied", result["contract_state"])
        self.assertEqual("counterexample", result["property_outcome"])

    def test_fixture_cannot_satisfy_any_tier(self) -> None:
        self.invocation["providers"][0]["fixture"] = True
        self.invocation["providers"][0]["payload_digest"] = digest_value({k: v for k, v in self.invocation["providers"][0].items() if k != "payload_digest"})
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIsNone(result["verified_tier"])

    def test_shared_independence_group_fails_v1(self) -> None:
        self.invocation["requested_tier"] = "V1"
        other = self.alloy()
        other["independence_group"] = "group-s"
        other["payload_digest"] = digest_value({k: v for k, v in other.items() if k != "payload_digest"})
        self.invocation["providers"].append(other)
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertEqual("V0", result["available_lower_tier"])

    def test_tier_label_from_other_axis_is_invalid(self) -> None:
        self.invocation["requested_tier"] = "L2"
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("invalid_request", result["contract_state"])
        self.assertIsNone(result["verified_tier"])

    def test_closed_request_rejects_unknown_fields(self) -> None:
        self.invocation["automatic_downgrade"] = True
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("invalid_request", result["contract_state"])

    def test_profile_digest_drift_fails_closed(self) -> None:
        self.invocation["profile"]["sha256"] = "0" * 64
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("profile-binding-drift", result["residue"])

    def test_tampered_provider_receipt_fails_closed(self) -> None:
        self.invocation["providers"][0]["normalized_outcome"] = "counterexample"
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("invalid-provider-receipt:souffle", result["residue"])

    def test_irrelevant_provider_capability_is_rejected(self) -> None:
        self.invocation["property"]["traits"] = ["recursive-relational"]
        self.invocation["providers"] = [self.alloy()]
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("provider-capability-not-applicable", result["residue"])

    def test_bounds_digest_tamper_fails_closed(self) -> None:
        self.invocation["bounds"]["denominator"] = 2
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("bounds-digest-invalid", result["residue"])

    def test_subject_drift_fails_closed(self) -> None:
        self.repo.joinpath("subject.json").write_text('{"graph":"changed"}\n')
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("subject-binding-drift", result["residue"])

    def test_property_definition_drift_fails_closed(self) -> None:
        self.repo.joinpath("property.json").unlink()
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("property-definition-drift", result["residue"])

    def test_observation_denominator_mismatch_fails_closed(self) -> None:
        self.invocation["providers"][0]["observation_count"] = 0
        self.invocation["providers"][0]["payload_digest"] = digest_value({k: v for k, v in self.invocation["providers"][0].items() if k != "payload_digest"})
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])

    def test_unresolved_provider_is_not_success(self) -> None:
        self.invocation["providers"] = [self.receipt("souffle", "datalog-fixed-point", "route-s", "group-s", "unresolved")]
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertEqual("inconclusive", result["property_outcome"])

    def test_surviving_v2_control_fails_closed(self) -> None:
        self.invocation["requested_tier"] = "V2"
        self.invocation["providers"].append(self.alloy())
        self.invocation["controls"] = self.controls()
        self.invocation["controls"][0]["detected"] = False
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertEqual("V1", result["available_lower_tier"])

    def test_duplicate_class_cannot_hide_a_surviving_control(self) -> None:
        self.invocation["requested_tier"] = "V2"
        self.invocation["providers"].append(self.alloy())
        self.invocation["controls"] = self.controls()
        self.invocation["controls"].append({"control_id": "control-subject-survivor", "class": "subject", "expected_non_success": True, "detected": False})
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIsNone(result["verified_tier"])

    def test_same_id_version_weakened_profile_cannot_replace_sealed_profile(self) -> None:
        weak = json.loads(self.repo.joinpath("profile.json").read_text())
        weak["tier_requirements"]["V2"] = {"minimum_provider_routes": 1, "independent_routes": False, "negative_control_classes": []}
        self.repo.joinpath("weak-profile.json").write_text(json.dumps(weak))
        data = self.repo.joinpath("weak-profile.json").read_bytes()
        self.invocation["profile"]["path"] = "weak-profile.json"
        self.invocation["profile"]["sha256"] = hashlib.sha256(data).hexdigest()
        self.invocation["requested_tier"] = "V2"
        result = evaluate(self.repo, ROOT, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIn("profile-binding-drift", result["residue"])

    def test_caller_controlled_root_cannot_replace_enforcement_package(self) -> None:
        attacker_root = self.repo / "attacker-package"
        attacker_root.mkdir()
        result = evaluate(self.repo, attacker_root, self.invocation)
        self.assertEqual("not_evaluable", result["contract_state"])
        self.assertIsNone(result["verified_tier"])
        self.assertIn("enforcement-root-not-canonical", result["residue"])


if __name__ == "__main__":
    unittest.main()
