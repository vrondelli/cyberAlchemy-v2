#!/usr/bin/env python3
"""Hostile local policy-ingress controls for selected closure MIR census."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-selected-closure-census-v6.py")
spec = importlib.util.spec_from_file_location("auth_v4b_selected_closure_census_v6", SCRIPT)
assert spec and spec.loader
census = importlib.util.module_from_spec(spec)
spec.loader.exec_module(census)


class SelectedClosureCensusV6(unittest.TestCase):
    def setUp(self) -> None:
        self.names = ("allow_iff", "authorization_admissible", "authorize",
                      "complete_active_roles", "default_deny", "exact_active_role_grant",
                      "session_current", "trusted_scope", "unique_resolved_session")
        self.mir = {
            census.ALLOWED_CALLER: f"_1 = {census.POLICY}(copy _2) -> [return: bb1, unwind: bb2];",
            "authorization-state-reader/Cargo.toml": "fn read() {}",
            census.POLICY_MANIFEST: "fn internal() {}",
        }

    def test_unique_ready_decision_ingress(self) -> None:
        self.assertEqual(len(census.compiled_policy_ingress(self.mir, self.names)["direct"]), 1)

    def test_hidden_reader_decision_and_pregate_policy_call_fail(self) -> None:
        self.mir["authorization-state-reader/Cargo.toml"] += (
            f"\nfn harmless_name() {{ _3 = {census.POLICY}(copy _4) -> [return: bb1]; }}"
        )
        with self.assertRaisesRegex(ValueError, "outside sole READY decision"):
            census.compiled_policy_ingress(self.mir, self.names)

    def test_function_pointer_and_unknown_policy_reference_fail(self) -> None:
        self.mir["authorization-state-reader/Cargo.toml"] += (
            f"\n_3 = {census.POLICY} as fn(&EvaluationContext) -> AuthorizationDecision;"
        )
        with self.assertRaisesRegex(ValueError, "function-pointer ingress"):
            census.compiled_policy_ingress(self.mir, self.names)
        self.mir["authorization-state-reader/Cargo.toml"] = f"_3 = pointer_to({census.POLICY});"
        with self.assertRaisesRegex(ValueError, "unclassified generated policy MIR reference"):
            census.compiled_policy_ingress(self.mir, self.names)

    def test_no_ready_decision_call_fails(self) -> None:
        self.mir[census.ALLOWED_CALLER] = "fn authorize() {}"
        with self.assertRaisesRegex(ValueError, "outside sole READY decision"):
            census.compiled_policy_ingress(self.mir, self.names)

    def test_boolean_policy_helper_cross_crate_ingress_fails(self) -> None:
        helper = f"{census.POLICY_CRATE}::allow_iff"
        self.mir["authorization-state-reader/Cargo.toml"] = (
            f"fn read() {{ _3 = {helper}(copy _4) -> [return: bb1]; }}"
        )
        with self.assertRaisesRegex(ValueError, "helper ingress outside sole READY decision"):
            census.compiled_policy_ingress(self.mir, self.names)
        self.assertEqual(census.effect_class(helper), "generated-policy")

    def test_boolean_policy_helper_reification_fails(self) -> None:
        self.mir["authorization-state-reader/Cargo.toml"] = (
            f"_3 = {census.POLICY_CRATE}::default_deny as fn(&EvaluationContext) -> bool;"
        )
        with self.assertRaisesRegex(ValueError, "function-pointer ingress"):
            census.compiled_policy_ingress(self.mir, self.names)

    def test_internal_generated_helper_call_is_observed_not_cross_crate(self) -> None:
        self.mir[census.POLICY_MANIFEST] = (
            f"_3 = {census.POLICY_CRATE}::allow_iff(copy _4) -> [return: bb1];"
        )
        result = census.compiled_policy_ingress(self.mir, self.names)
        self.assertEqual(result["internal_direct"][0]["name"], "allow_iff")
        self.assertEqual(len(result["direct"]), 1)

    def test_missing_generated_callable_name_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "invalid policy callable set"):
            census.compiled_policy_ingress(self.mir, self.names[:-1])
        with self.assertRaisesRegex(ValueError, "source-bound generated policy callable set missing"):
            census.policy_callable_names({"generated_policy_callables": []})

    def test_compiled_dynamic_drop_callback_sql_and_unparsed_edges_remain_open(self) -> None:
        source = """fn evaluate(_1: fn()) {
    bb0: {
        _2 = copy _1() -> [return: bb1, unwind continue];
    }
    bb1: {
        _3 = <Iter as Iterator>::map::<Value, fn(Value) -> Value>(move _4, copy _1) -> [return: bb2, unwind: bb5];
    }
    bb2: {
        _5 = rusqlite::Connection::prepare(copy _6, const "SELECT 1") -> [return: bb3, unwind: bb5];
    }
    bb3: {
        drop(_7) -> [return: bb4, unwind continue];
    }
    bb4: {
        _8 = opaque() -> [return: bb5];
    }
}
"""
        result = census.compiled_effect_edges({"reader/Cargo.toml": source})
        self.assertEqual(result["function_counts"]["reader/Cargo.toml"], 1)
        self.assertEqual(result["terminator_count"], 5)
        self.assertEqual(result["class_counts"]["dynamic-target"], 1)
        self.assertEqual(result["class_counts"]["callback-carrier"], 1)
        self.assertEqual(result["class_counts"]["sql-boundary"], 1)
        self.assertEqual(result["class_counts"]["drop"], 1)
        self.assertEqual(result["class_counts"]["unparsed-terminator"], 1)
        self.assertEqual(result["unresolved_count"], 5)
        self.assertEqual(result["unresolved_sample"][0]["block"], "bb0")

    def test_raw_endpoint_async_and_unwind_effects_remain_open(self) -> None:
        source = """fn evaluate() {
    bb0: {
        _1 = SqliteAuthorizationService::authorize(move _2, move _3) -> [return: bb1, unwind: bb5];
    }
    bb1: {
        _4 = tokio::task::spawn_blocking(move _5) -> [return: bb2, unwind: bb5];
    }
    bb2: {
        assert(const false, "unexpected") -> [success: bb3, unwind: bb5];
    }
    bb3: {
        drop(_6) -> [return: bb4, unwind: bb5];
    }
    bb5 (cleanup): {
        resume;
    }
}
"""
        result = census.compiled_effect_edges({"api/Cargo.toml": source})
        self.assertEqual(result["class_counts"]["decision-endpoint-candidate"], 1)
        self.assertEqual(result["class_counts"]["callback-carrier"], 1)
        self.assertEqual(result["class_counts"]["assert-panic"], 1)
        self.assertEqual(result["class_counts"]["drop"], 1)
        self.assertEqual(result["class_counts"]["unwind-resume"], 1)
        self.assertEqual(result["unresolved_count"], 5)
        self.assertGreaterEqual(result["unwind_edge_count"], 4)

    def test_unexpected_empty_compiled_package_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "empty compiled MIR package"):
            census.compiled_effect_edges({"reader/Cargo.toml": ""})


if __name__ == "__main__":
    unittest.main()
