from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_binding_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustBindingAuthorTests(unittest.TestCase):
    def test_two_builds_are_byte_identical(self) -> None:
        first = AUTHOR.canonical_bytes(AUTHOR.build_binding())
        second = AUTHOR.canonical_bytes(AUTHOR.build_binding())
        self.assertEqual(first, second)

    def test_mapping_is_total_over_admitted_ontology(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual(89, len(binding["node_mappings"]))
        self.assertEqual(204, len(binding["relation_mappings"]))
        self.assertEqual(13, len(binding["proof_mappings"]))
        self.assertEqual(9, len(binding["boundary_bindings"]))
        self.assertEqual(89, len({item["system_id"] for item in binding["node_mappings"]}))
        self.assertEqual(204, len({item["system_relation_id"] for item in binding["relation_mappings"]}))

    def test_predecessor_digest_drift_fails_closed(self) -> None:
        policy = json.loads(AUTHOR.POLICY_PATH.read_text())
        mutated = copy.deepcopy(policy)
        mutated["admitted_predecessor"]["candidate_set_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_existing_and_planned_targets_are_not_collapsed(self) -> None:
        binding = AUTHOR.build_binding()
        states = {item["coverage_state"] for item in binding["node_mappings"]}
        self.assertEqual({"existing-symbol-candidate", "planned-extension"}, states)
        self.assertGreater(binding["coverage"]["existing_symbol_candidates"], 0)
        self.assertGreater(binding["coverage"]["planned_extension_nodes"], 0)
        for proof in binding["proof_mappings"]:
            self.assertEqual("not_evaluable", proof["evidence_state"])

    def test_candidate_has_closed_authority_ceiling(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["implementation_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["implementation"])
        self.assertEqual("not_evaluable", binding["acceptance_gate"]["conformance"])


if __name__ == "__main__":
    unittest.main()
