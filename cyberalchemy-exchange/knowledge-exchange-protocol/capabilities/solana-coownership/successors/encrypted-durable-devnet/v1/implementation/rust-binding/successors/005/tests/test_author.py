from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_postimplementation_binding_005_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustPostimplementationBinding005Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(AUTHOR.canonical_bytes(AUTHOR.build_binding()), AUTHOR.canonical_bytes(AUTHOR.build_binding()))

    def test_exact_frozen_material_and_selector_closure(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("f03fcc41c8205d836c109677eb2c259da70ef77b59b73c5d1dd2f9e1a014e6aa", binding["implementation_material"]["digest"])
        self.assertEqual(25, binding["implementation_material"]["artifact_count"])
        self.assertEqual(89, len(binding["node_mappings"]))
        self.assertEqual(204, len(binding["relation_mappings"]))
        self.assertEqual(13, len(binding["proof_mappings"]))
        self.assertEqual(9, len(binding["boundary_bindings"]))

    def test_exact_sbf_and_relation_evidence_are_bound(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("68c41e9e74fe3a663783e6d710b52da8e47c5315508d355bde1fa48ffbe8f6bb", binding["sbf_identity"]["sha256"])
        self.assertEqual(130, binding["deployment_budget_residue"]["exact_fixed_chunk_deployment_submission_bound"])
        self.assertEqual(204, binding["local_evidence_binding"]["relation_evidence"]["supported_bounded_local"])
        self.assertTrue(all(item["relation_evidence"]["bounded_result"] == "SUPPORTED_BOUNDED_LOCAL" for item in binding["relation_mappings"]))

    def test_authority_and_external_effects_remain_absent(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-postimplementation-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("human-owner-only", binding["successor_authorization"]["accept_binding"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["deployment_or_devnet"])

    def test_predecessor_acceptance_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["accepted_predecessor_binding"]["binding_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_stable_cycle_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["frozen_local_evidence"]["stable_cycle_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_runtime_digest_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["frozen_local_evidence"]["runtime_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_relation_evidence_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["frozen_local_evidence"]["relation_evidence_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_successor_004_provenance_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["superseded_candidate_provenance"]["binding_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_all_runtime_artifacts_are_exactly_bound(self) -> None:
        binding = AUTHOR.build_binding()
        artifacts = binding["implementation_material"]["artifacts"]
        self.assertEqual(len(artifacts), len({item["path"] for item in artifacts}))
        self.assertTrue(all(len(item["sha256"]) == 64 for item in artifacts))


if __name__ == "__main__":
    unittest.main()
