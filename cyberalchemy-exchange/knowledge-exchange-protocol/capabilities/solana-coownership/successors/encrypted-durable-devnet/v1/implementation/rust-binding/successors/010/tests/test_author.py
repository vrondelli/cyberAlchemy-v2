from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_postimplementation_binding_010_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustPostimplementationBinding010Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(
            AUTHOR.canonical_bytes(AUTHOR.build_binding()),
            AUTHOR.canonical_bytes(AUTHOR.build_binding()),
        )

    def test_exact_material_and_mapping_closure(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual(
            "df0bc2d138cfb10ed840eff7dd37ae64bfbe449ae417a75bf7e09ec223e47f98",
            binding["implementation_material"]["digest"],
        )
        self.assertEqual(26, binding["implementation_material"]["artifact_count"])
        self.assertEqual(
            (89, 204, 13, 9),
            (
                len(binding["node_mappings"]),
                len(binding["relation_mappings"]),
                len(binding["proof_mappings"]),
                len(binding["boundary_bindings"]),
            ),
        )

    def test_accepted_predecessor_009_is_exact(self) -> None:
        predecessor = AUTHOR.build_binding()["accepted_predecessor_binding"]
        self.assertEqual(
            "CA2-D65-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-009",
            predecessor["binding_id"],
        )
        self.assertEqual(
            "244e7e1c1e96c2c5f417e2cb141b824b8f77484ef169b7abbc5c9534b7da752b",
            predecessor["binding_material_digest"],
        )
        self.assertEqual(
            "951f34efd9bb805b777a08ac986891e541d5ef811c48e07473fbfc0243a9cd09",
            predecessor["acceptance_decision_sha256"],
        )

    def test_prefunding_and_reconciliation_contract_is_exact(self) -> None:
        contract = AUTHOR.build_binding()["funding_and_reconciliation_binding"]
        self.assertEqual("prefunded-only", contract["funding_mode"])
        self.assertEqual(2_000_000_000, contract["minimum_prefunded_lamports"])
        self.assertEqual(10_000_000_000, contract["maximum_prefunded_lamports"])
        self.assertEqual("forbidden", contract["runner_airdrop"])
        self.assertEqual("PENDING", contract["unsigned_ambiguous_reconciliation_result"])
        self.assertEqual("forbidden", contract["zero_signature_success_inference"])
        self.assertEqual(0, contract["reconciliation_resubmissions"])

    def test_rpc_failure_and_reconciliation_sources_are_exact(self) -> None:
        binding = AUTHOR.build_binding()
        contract = binding["funding_and_reconciliation_binding"]
        artifacts = {item["path"]: item["sha256"] for item in binding["implementation_material"]["artifacts"]}
        self.assertEqual(artifacts["trial-cli/src/executor.rs"], contract["runner_source_sha256"])
        self.assertEqual(artifacts["trial-cli/src/main.rs"], contract["envelope_source_sha256"])
        self.assertEqual(
            [
                "execution-genesis-hash",
                "execution-prefunded-balance",
                "reconcile-genesis-hash",
                "reconcile-payer-balance",
                "reconcile-signature-status",
            ],
            contract["typed_sanitized_rpc_observation_stages"],
        )
        self.assertEqual(
            "retain-predecessor-generic-categorization-not-claimed-by-this-repair",
            contract["later_deployment_and_protocol_rpc_paths"],
        )
        change = binding["implementation_change"]
        self.assertNotIn("rpc_failure", change)
        self.assertEqual(
            "only-the-listed-execution-and-reconciliation-observation-sites",
            change["rpc_failure_observation_scope"]["scope_limit"],
        )

    def test_unchanged_sbf_is_exact(self) -> None:
        sbf = AUTHOR.build_binding()["sbf_identity"]
        self.assertEqual(
            "68c41e9e74fe3a663783e6d710b52da8e47c5315508d355bde1fa48ffbe8f6bb",
            sbf["sha256"],
        )
        self.assertEqual("none", sbf["change_from_predecessor"])
        self.assertEqual(130, sbf["exact_deployment_submission_count"])

    def test_predecessor_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["accepted_predecessor_binding"]["binding_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_stable_receipt_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["frozen_local_evidence"]["stable_cycle_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_runtime_digest_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["frozen_local_evidence"]["runtime_material_digest"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_guide_drift_fails_closed(self) -> None:
        policy = self.policy()
        policy["operator_context"]["devnet_guide_sha256"] = "0" * 64
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_airdrop_policy_overclaim_fails_closed(self) -> None:
        policy = self.policy()
        policy["funding_and_reconciliation_contract"]["runner_airdrop"] = "allowed"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_unsigned_ambiguity_overclaim_fails_closed(self) -> None:
        policy = self.policy()
        policy["funding_and_reconciliation_contract"]["unsigned_ambiguous_reconciliation_result"] = "RECONCILED"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_generic_typed_rpc_claim_fails_closed(self) -> None:
        policy = self.policy()
        policy["source_authorization"]["mapped_intent"] = (
            "bind the prefunded-only Devnet runner, typed sanitized RPC failures, "
            "and fail-closed zero-signature reconciliation repair"
        )
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_additional_typed_rpc_stage_claim_fails_closed(self) -> None:
        policy = self.policy()
        policy["funding_and_reconciliation_contract"]["typed_sanitized_rpc_observation_stages"].append(
            "deployment-send"
        )
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_later_rpc_path_overclaim_fails_closed(self) -> None:
        policy = self.policy()
        policy["funding_and_reconciliation_contract"]["later_deployment_and_protocol_rpc_paths"] = (
            "typed-sanitized-by-this-repair"
        )
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_candidate_has_no_authority_or_external_effect(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-postimplementation-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["funding_or_airdrop"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["deployment_or_devnet"])
        self.assertEqual("not_evaluable", binding["acceptance_gate"]["aggregate_conformance"])


if __name__ == "__main__":
    unittest.main()
