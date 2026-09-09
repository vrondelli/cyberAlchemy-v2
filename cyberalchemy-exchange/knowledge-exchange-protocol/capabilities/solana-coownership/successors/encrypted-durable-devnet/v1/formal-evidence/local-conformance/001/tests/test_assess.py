from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
ASSESSOR_PATH = HERE.parent / "assess.py"
SPEC = importlib.util.spec_from_file_location("sol2_independent_local_conformance", ASSESSOR_PATH)
assert SPEC and SPEC.loader
ASSESSOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ASSESSOR)


def validation_fixture() -> dict:
    tests = ASSESSOR.rust_test_names_from_source()
    return {
        "cargo_version": "cargo-test-fixture",
        "rustc_version": "rustc-test-fixture",
        "cargo_mode": "offline-and-locked",
        "target_directory": "fresh-temporary-outside-repository",
        "commands": [
            {"command": command, "status": "PASS"}
            for command in json.loads(ASSESSOR.POLICY_PATH.read_text())["cargo_validation"]["commands"]
        ],
        "observed_test_count": len(tests),
        "tests_passed": len(tests),
        "tests_failed": 0,
        "observed_tests": tests,
    }


class IndependentLocalConformanceTests(unittest.TestCase):
    def test_two_assessments_are_byte_identical_for_same_observation(self) -> None:
        observation = validation_fixture()
        first = ASSESSOR.canonical_bytes(ASSESSOR.build_assessment(validation_override=observation))
        second = ASSESSOR.canonical_bytes(ASSESSOR.build_assessment(validation_override=observation))
        self.assertEqual(first, second)

    def test_assessment_closes_exact_mapping_surface(self) -> None:
        assessment = ASSESSOR.build_assessment(validation_override=validation_fixture())
        self.assertEqual("89/89 PASS", assessment["mapping_assessment"]["exact_node_targets"])
        self.assertEqual("204/204 PASS", assessment["mapping_assessment"]["compile_time_bound_relation_records"])
        self.assertEqual("13/13 assessed", assessment["mapping_assessment"]["proof_records"])
        self.assertEqual("9/9 represented", assessment["mapping_assessment"]["system_boundaries"])

    def test_binding_digest_drift_fails_closed(self) -> None:
        policy = json.loads(ASSESSOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["accepted_binding"]["binding_material_digest"] = "0" * 64
        with self.assertRaises(ASSESSOR.AssessmentError):
            ASSESSOR.build_assessment(mutated, validation_fixture())

    def test_implementation_digest_drift_fails_closed(self) -> None:
        policy = json.loads(ASSESSOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["implementation"]["material_digest"] = "0" * 64
        with self.assertRaises(ASSESSOR.AssessmentError):
            ASSESSOR.build_assessment(mutated, validation_fixture())

    def test_missing_required_proof_test_fails_closed(self) -> None:
        observation = validation_fixture()
        observation["observed_tests"].remove("proof_kep_sol2_proof_deterministic_cbor")
        observation["observed_test_count"] -= 1
        observation["tests_passed"] -= 1
        with self.assertRaises(ASSESSOR.AssessmentError):
            ASSESSOR.build_assessment(validation_override=observation)

    def test_proof_summary_and_aggregate_ceiling_are_preserved(self) -> None:
        assessment = ASSESSOR.build_assessment(validation_override=validation_fixture())
        self.assertEqual(7, assessment["proof_summary"]["local_conformance_supported"])
        self.assertEqual(4, assessment["proof_summary"]["partial_local_conformance"])
        self.assertEqual(2, assessment["proof_summary"]["not_evaluable"])
        self.assertEqual(0, assessment["proof_summary"]["accepted_conformance"])
        self.assertEqual("indeterminate", assessment["aggregate_assessment"]["result"])
        self.assertEqual("not-accepted", assessment["aggregate_assessment"]["acceptance_status"])

    def test_assessment_has_closed_authority_ceiling(self) -> None:
        assessment = ASSESSOR.build_assessment(validation_override=validation_fixture())
        self.assertEqual("independent-assessment-candidate", assessment["lifecycle_status"])
        self.assertEqual("none", assessment["authority_effect"])
        self.assertEqual("none", assessment["implementation_effect"])
        self.assertEqual("none", assessment["external_effect"])
        self.assertEqual("absent", assessment["capability_ceiling"]["network"])


if __name__ == "__main__":
    unittest.main()
