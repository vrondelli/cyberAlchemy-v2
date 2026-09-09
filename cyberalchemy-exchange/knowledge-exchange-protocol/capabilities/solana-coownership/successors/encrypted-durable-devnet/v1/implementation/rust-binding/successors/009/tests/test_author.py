from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_postimplementation_binding_009_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustPostimplementationBinding009Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(AUTHOR.canonical_bytes(AUTHOR.build_binding()), AUTHOR.canonical_bytes(AUTHOR.build_binding()))

    def test_exact_material_and_mapping_closure(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("32c71ec1d3fd0779461af4a66c377a11b255a57398fcd4fbd391da2ed1d14383", binding["implementation_material"]["digest"])
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

    def test_full_devnet_genesis_and_authorization_non_substitution_are_exact(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG", binding["devnet_genesis_identity"]["full_base58"])
        authorization = binding["authorization_predecessor_scope"]
        self.assertEqual("current-for-exact-accepted-binding-008-and-old-envelope-unless-owner-revokes", authorization["owner_decision_state"])
        self.assertEqual("exact-accepted-binding-008-and-old-envelope-only", authorization["authorization_scope"])
        self.assertEqual("not-valid-as-authority", authorization["non_substitution"]["binding_009"])
        self.assertEqual("not-valid-as-authority", authorization["non_substitution"]["corrected_envelope"])
        self.assertEqual("not-valid-as-authority", authorization["non_substitution"]["corrected_genesis_trial"])
        self.assertEqual("not-performed", authorization["external_old_envelope"]["content_inspection"])

    def test_authorization_decision_and_external_envelope_identity_are_exact(self) -> None:
        authorization = AUTHOR.build_binding()["authorization_predecessor_scope"]
        self.assertEqual("decisions/devnet-trial-authorization-001.json", authorization["authorization_decision_path"])
        self.assertEqual("901472c0637c9471d9a4b7362455d85fcb7c93ca6c15f00a85776afad95a5ffe", authorization["authorization_decision_sha256"])
        self.assertEqual("/tmp/ca2-kep-devnet-001/terminal-envelope.json", authorization["external_old_envelope"]["path"])
        self.assertEqual("d3ef6fd6d9687995608589cd8d1961b805df10838454328f1f1558c5ba0ec1e9", authorization["external_old_envelope"]["sha256"])

    def test_read_only_preflight_records_no_runner_or_effect(self) -> None:
        preflight = AUTHOR.build_binding()["authorization_predecessor_scope"]["preflight_observation"]
        self.assertEqual("read-only-solana-genesis-hash", preflight["operation"])
        self.assertEqual("stopped-after-read-only-preflight", preflight["stop_state"])
        for field in (
            "accepted_binding_008_runner_invoked",
            "attempt_journal_created",
            "airdrop_requested",
            "signing_performed",
            "transaction_submitted",
            "deployment_performed",
            "effect_observed",
        ):
            self.assertIs(False, preflight[field])

    def test_authorization_overclaim_fails_closed(self) -> None:
        policy = self.policy()
        policy["authorization_predecessor_scope"]["owner_decision_state"] = "revoked-or-exhausted"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_authorization_non_substitution_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["authorization_predecessor_scope"]["non_substitution"]["binding_009"] = "valid"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

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

    def test_accepted_predecessor_drift_fails_closed(self) -> None:
        policy = self.policy(); policy["accepted_predecessor_binding"]["binding_sha256"] = "0" * 64
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
