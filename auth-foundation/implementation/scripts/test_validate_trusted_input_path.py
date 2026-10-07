#!/usr/bin/env python3
"""Hostile source-edge substitutions for the selected D65 Auth path."""

from __future__ import annotations

import importlib.util
import copy
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-trusted-input.py")
SPEC = importlib.util.spec_from_file_location("validate_trusted_input_path", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def sources() -> dict[str, str]:
    root = MODULE.IMPLEMENTATION
    return {
        "api_source": (root / "authorization-api/src/lib.rs").read_text(encoding="utf-8"),
        "service_source": (root / "authorization-service/src/lib.rs").read_text(encoding="utf-8"),
        "authority_source": (root / "authorization-ready-authority/src/lib.rs").read_text(encoding="utf-8"),
        "decision_source": (root / "authorization-ready-decision/src/lib.rs").read_text(encoding="utf-8"),
        "service_manifest": (root / "authorization-service/Cargo.toml").read_text(encoding="utf-8"),
        "authority_manifest": (root / "authorization-ready-authority/Cargo.toml").read_text(encoding="utf-8"),
        "decision_manifest": (root / "authorization-ready-decision/Cargo.toml").read_text(encoding="utf-8"),
    }


class SelectedPathTests(unittest.TestCase):
    def test_accepted_meaning_and_owner_scope_are_semantically_pinned(self) -> None:
        meaning = MODULE.load(MODULE.ACCEPTED_MEANING)
        scope = MODULE.OWNER_ENDPOINT_SCOPE.read_text(encoding="utf-8")
        acceptance_digest = MODULE.digest(MODULE.MEANING_ACCEPTANCE)
        self.assertTrue(all(MODULE.accepted_lineage_assertions(meaning, scope, acceptance_digest).values()))
        changed = copy.deepcopy(meaning)
        changed["rule"] = changed["rule"].replace("including equal duplicates", "after deduplication")
        self.assertFalse(MODULE.accepted_lineage_assertions(changed, scope, acceptance_digest)["accepted-meaning-critical-predicate"])
        changed = copy.deepcopy(meaning)
        changed["acceptance"]["acceptance_digest"] = "0" * 64
        self.assertFalse(MODULE.accepted_lineage_assertions(changed, scope, acceptance_digest)["accepted-meaning-identity"])
        self.assertFalse(MODULE.accepted_lineage_assertions(meaning, scope.replace("every native", "selected"), acceptance_digest)["owner-scope-all-native-entrypoints"])

    def test_current_selected_edges_are_present(self) -> None:
        self.assertTrue(all(MODULE.selected_service_path_assertions(**sources()).values()))

    def test_each_critical_edge_rejects_a_hostile_substitution(self) -> None:
        cases = (
            ("api_source", "SqliteAdmissionService::open_with_epoch_allocator(", "OtherEngine::open(", "api-concrete-service-builder"),
            ("service_source", "self.admission.with_ready(request, authorize_ready_decision)", "authorize_resolved(raw)", "service-ready-authority-edge"),
            ("service_manifest", 'auth-foundation-authorization-ready-decision = { path = "../authorization-ready-decision" }', 'auth-foundation-runtime-adapter = { path = "../runtime-adapter" }', "service-no-legacy-decision-edge"),
            ("authority_source", "gate::admit_authorization_command(&context)", "skip_gate(&context)", "authority-actual-transaction-to-v2-kernel"),
            ("authority_source", "resolve_authorization_state_in_transaction(transaction, &command)", "resolve_elsewhere(&command)", "authority-actual-transaction-to-v2-kernel"),
            ("authority_manifest", 'auth-foundation-trusted-input-reader = { path = "../trusted-input-reader" }', 'auth-foundation-runtime-adapter = { path = "../runtime-adapter" }', "authority-private-token-and-read-only-preparation"),
            ("decision_source", "pub fn authorize(ready: ReadyAuthorization<'_, '_>)", "pub fn authorize(raw: &AuthorizationCommand)", "decision-ready-only-to-generated-policy"),
            ("decision_source", "kernel::authorize(&context)", "raw_policy(&context)", "decision-ready-only-to-generated-policy"),
        )
        baseline = sources()
        for field, before, after, assertion in cases:
            with self.subTest(field=field, assertion=assertion):
                self.assertIn(before, baseline[field])
                mutated = dict(baseline)
                mutated[field] = mutated[field].replace(before, after, 1)
                self.assertFalse(MODULE.selected_service_path_assertions(**mutated)[assertion])


if __name__ == "__main__":
    unittest.main()
