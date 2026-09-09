from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_successor_binding_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustSuccessorBindingAuthorTests(unittest.TestCase):
    def test_two_builds_are_byte_identical(self) -> None:
        first = AUTHOR.canonical_bytes(AUTHOR.build_binding())
        second = AUTHOR.canonical_bytes(AUTHOR.build_binding())
        self.assertEqual(first, second)

    def test_mapping_is_total_and_exact_byte_bound(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual(89, len(binding["node_mappings"]))
        self.assertEqual(204, len(binding["relation_mappings"]))
        self.assertEqual(13, len(binding["proof_mappings"]))
        self.assertEqual(9, len(binding["boundary_bindings"]))
        self.assertEqual(12, binding["coverage"]["exact_implementation_artifacts"])
        for mapping in binding["node_mappings"]:
            for target in mapping["implementation_targets"]:
                self.assertRegex(target["sha256"], r"^[0-9a-f]{64}$")
                self.assertEqual("exact-successor-bytes-candidate", target["target_state"])

    def test_implementation_digest_drift_fails_closed(self) -> None:
        policy = json.loads(AUTHOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["implementation_material"]["digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_implementation_artifact_drift_fails_closed(self) -> None:
        policy = json.loads(AUTHOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["implementation_material"]["artifacts"][0]["sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_accepted_predecessor_drift_fails_closed(self) -> None:
        policy = json.loads(AUTHOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["accepted_predecessor_binding"]["binding_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_candidate_proof_ceiling_is_preserved(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual(7, binding["coverage"]["proof_local_candidate_pass"])
        self.assertEqual(4, binding["coverage"]["proof_partial_local_candidate"])
        self.assertEqual(2, binding["coverage"]["proof_not_evaluable"])
        self.assertEqual(0, binding["coverage"]["proof_accepted_conformance"])
        self.assertEqual(0, binding["coverage"]["relation_specific_behavioral_conformance"])
        self.assertEqual("not_evaluable", binding["acceptance_gate"]["implementation_conformance"])

    def test_candidate_has_closed_authority_ceiling(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-successor-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["implementation_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("not-authorized-by-this-candidate", binding["successor_authorization"]["binding_acceptance"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["aggregate_conformance"])


if __name__ == "__main__":
    unittest.main()
