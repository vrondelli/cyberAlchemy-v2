from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_postimplementation_binding_008_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustPostimplementationBinding008Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(AUTHOR.canonical_bytes(AUTHOR.build_binding()), AUTHOR.canonical_bytes(AUTHOR.build_binding()))

    def test_exact_material_and_mapping_closure(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("b814e04ff8bdaa256636554bde259bf7307ac668dd5ba450e786f80fd4fe2f98", binding["implementation_material"]["digest"])
        self.assertEqual(26, binding["implementation_material"]["artifact_count"])
        self.assertEqual((89, 204, 13, 9), (len(binding["node_mappings"]), len(binding["relation_mappings"]), len(binding["proof_mappings"]), len(binding["boundary_bindings"])))

    def test_authority_claim_repair_is_exact(self) -> None:
        binding = AUTHOR.build_binding()
        boundary = binding["operator_authorization_boundary"]
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", boundary["authority_effect"])
        self.assertEqual("external-not-attested-by-runner", boundary["authorization_attestation"])
        self.assertEqual("separate-from-authority-effect", boundary["effect_observation_model"]["local_effect"])
        self.assertEqual("separate-from-authority-effect", boundary["effect_observation_model"]["observed_external_effect"])

    def test_prepare_guide_and_deferred_choice_are_bound(self) -> None:
        binding = AUTHOR.build_binding()
        boundary = binding["operator_authorization_boundary"]
        self.assertEqual("not-executed-by-binding-author", boundary["prepare_command"]["execution_state"])
        self.assertEqual("external-not-attested-by-runner", boundary["prepare_command"]["authorization_attestation"])
        self.assertEqual("deferred", boundary["cryptographic_governance_provenance"]["status"])
        self.assertEqual(64, len(boundary["devnet_guide"]["sha256"]))

    def test_sbf_and_relation_evidence_remain_exact(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("68c41e9e74fe3a663783e6d710b52da8e47c5315508d355bde1fa48ffbe8f6bb", binding["sbf_identity"]["sha256"])
        self.assertEqual(130, binding["sbf_identity"]["exact_deployment_submission_count"])
        self.assertEqual(204, binding["local_evidence_binding"]["relation_evidence"]["supported_bounded_local"])

    def test_stable_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["frozen_local_evidence"]["stable_cycle_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError): AUTHOR.build_binding(policy)

    def test_runtime_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["frozen_local_evidence"]["runtime_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError): AUTHOR.build_binding(policy)

    def test_predecessor_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["predecessor_candidate"]["binding_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError): AUTHOR.build_binding(policy)

    def test_guide_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["operator_context"]["devnet_guide_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError): AUTHOR.build_binding(policy)

    def test_relation_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["frozen_local_evidence"]["relation_evidence_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError): AUTHOR.build_binding(policy)

    def test_candidate_has_no_acceptance_or_external_effect(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-postimplementation-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["deployment_or_devnet"])
        self.assertEqual("not_evaluable", binding["acceptance_gate"]["aggregate_conformance"])


if __name__ == "__main__":
    unittest.main()
