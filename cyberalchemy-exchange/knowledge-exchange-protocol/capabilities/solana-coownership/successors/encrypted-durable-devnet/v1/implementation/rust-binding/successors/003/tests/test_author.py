from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_construction_binding_003_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustConstructionBinding003Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(
            AUTHOR.canonical_bytes(AUTHOR.build_binding()),
            AUTHOR.canonical_bytes(AUTHOR.build_binding()),
        )

    def test_candidate_closes_dependencies_targets_and_authority(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual(16, len(binding["rust_substrate"]["dependencies"]))
        self.assertEqual(14, len(binding["planned_targets"]))
        self.assertEqual({"system_nodes": 89, "system_relations": 204, "proof_obligations": 13, "boundaries": 9}, binding["selector_closure"])
        self.assertEqual("authored-preimplementation-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["implementation_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("absent", binding["security_posture"]["production_security_approval"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["rpc_or_network"])

    def test_predecessor_drift_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["accepted_predecessor_binding"]["binding_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_assessment_drift_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["accepted_local_assessment"]["assessment_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_provider_version_drift_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["rust_substrate"]["dependencies"][0]["version"] = "=0.10.0"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_provider_feature_drift_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        sqlx = next(item for item in mutated["rust_substrate"]["dependencies"] if item["name"] == "sqlx")
        sqlx["features"].remove("postgres")
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_forbidden_external_capability_drift_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["forbidden_capabilities"].remove("rpc-client-or-request")
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_missing_planned_target_closure_fails_closed(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["planned_targets"] = [
            item for item in mutated["planned_targets"]
            if item["path"] != "runtime/tests/solana_program_test.rs"
        ]
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)

    def test_planned_target_cannot_mutate_preserved_port(self) -> None:
        mutated = copy.deepcopy(self.policy())
        mutated["planned_targets"][0]["path"] = "runtime/src/encrypted_durable_devnet/ports/cryptography.rs"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(mutated)


if __name__ == "__main__":
    unittest.main()
