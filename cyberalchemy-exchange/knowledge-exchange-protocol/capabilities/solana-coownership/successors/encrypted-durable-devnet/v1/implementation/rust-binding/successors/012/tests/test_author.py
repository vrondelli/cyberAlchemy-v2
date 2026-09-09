from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUTHOR_PATH = HERE.parent / "author.py"
SPEC = importlib.util.spec_from_file_location("sol2_rust_postimplementation_binding_012_author", AUTHOR_PATH)
assert SPEC and SPEC.loader
AUTHOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHOR)


class RustPostimplementationBinding012Tests(unittest.TestCase):
    def policy(self):
        return json.loads(AUTHOR.POLICY_PATH.read_text(encoding="utf-8"))

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(AUTHOR.canonical_bytes(AUTHOR.build_binding()), AUTHOR.canonical_bytes(AUTHOR.build_binding()))

    def test_exact_mapping_and_residue_closure(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("8ea933a6ece35a77eec24a195674d21ff001e44ff8c23d9ca98ac6d7940be585", binding["implementation_material"]["digest"])
        self.assertEqual((26, 89, 204, 13, 9, 10), (binding["implementation_material"]["artifact_count"], len(binding["node_mappings"]), len(binding["relation_mappings"]), len(binding["proof_mappings"]), len(binding["boundary_bindings"]), len(binding["residue_evidence_binding"]["dispositions"])))

    def test_accepted_predecessor_011_is_exact(self) -> None:
        predecessor = AUTHOR.build_binding()["accepted_predecessor_binding"]
        self.assertEqual("CA2-D65-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-011", predecessor["binding_id"])
        self.assertEqual("b617a45bc515cbc435f29f091d26ae07815ab3195bea89667414cc2f3855242b", predecessor["binding_material_digest"])

    def test_effect_surface_is_exact(self) -> None:
        self.assertEqual([
            "external-journal-write",
            "external-terminal-evidence-write",
            "loopback-postgresql-read-write",
            "public-solana-finalized-read",
            "public-solana-transaction-submit",
        ], AUTHOR.build_binding()["trial_contract"]["enumerated_effect_surface"])

    def test_journal_and_custody_sources_are_bound(self) -> None:
        binding = AUTHOR.build_binding()
        artifacts = {item["path"]: item["sha256"] for item in binding["implementation_material"]["artifacts"]}
        self.assertEqual(artifacts["trial-cli/src/executor.rs"], binding["trial_contract"]["runner_source_sha256"])
        self.assertEqual(artifacts["trial-cli/src/main.rs"], binding["trial_contract"]["envelope_source_sha256"])

    def test_unchanged_sbf_is_exact(self) -> None:
        sbf = AUTHOR.build_binding()["sbf_identity"]
        self.assertEqual("68c41e9e74fe3a663783e6d710b52da8e47c5315508d355bde1fa48ffbe8f6bb", sbf["sha256"])
        self.assertEqual("none", sbf["change_from_predecessor"])
        self.assertEqual(130, sbf["exact_deployment_submission_count"])

    def test_dependency_drift_fails_closed(self) -> None:
        for section, key in (("accepted_predecessor_binding", "binding_sha256"), ("independent_review", "sha256"), ("residue_evidence", "sha256"), ("frozen_local_evidence", "stable_cycle_sha256"), ("frozen_local_evidence", "runtime_material_digest")):
            with self.subTest(section=section, key=key):
                policy = self.policy()
                policy[section][key] = "0" * 64
                with self.assertRaises(AUTHOR.BindingError):
                    AUTHOR.build_binding(policy)

    def test_effect_or_retry_overclaim_fails_closed(self) -> None:
        policy = self.policy()
        policy["trial_contract"]["enumerated_effect_surface"].append("mainnet-submit")
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)
        policy = self.policy()
        policy["trial_contract"]["retry_after_ambiguous_effect"] = "allowed"
        with self.assertRaises(AUTHOR.BindingError):
            AUTHOR.build_binding(policy)

    def test_candidate_has_no_authority_or_external_effect(self) -> None:
        binding = AUTHOR.build_binding()
        self.assertEqual("authored-postimplementation-candidate", binding["lifecycle_status"])
        self.assertEqual("none", binding["authority_effect"])
        self.assertEqual("none", binding["external_effect"])
        self.assertEqual("not-authorized", binding["successor_authorization"]["credentials_or_wallets"])
        self.assertEqual("requires-new-exact-effect-envelope", binding["acceptance_gate"]["devnet_trial"])


if __name__ == "__main__":
    unittest.main()
