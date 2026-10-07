#!/usr/bin/env python3
"""Hostile controls for the four-root compiled decision-body census."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_compiled_decision_body_v20", CASE / "auth-v4b-compiled-decision-body-v20.py")
assert SPEC and SPEC.loader
v20 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v20)


class CompiledDecisionBodyV20(unittest.TestCase):
    def test_benign_name_with_allow_is_not_exempt(self) -> None:
        mir = """fn permitted() -> BinaryAuthorizationDecision {
    bb0: {
        _0 = BinaryAuthorizationDecision::Allow;
        return;
    }
}
"""
        rows, counts = v20.decision_bodies({"authorization-state-reader/Cargo.toml": mir})
        self.assertEqual(counts["authorization-state-reader/Cargo.toml"], 1)
        self.assertEqual(rows[0]["constructors"], {"Allow": 1})
        with self.assertRaisesRegex(ValueError, "unclassified compiled decision-shaped body"):
            v20.classify_row(rows[0])

    def test_nested_result_carrier_and_added_allow_fail(self) -> None:
        signature = ("<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}::"
                     "{closure#0}(_1: Worker) -> Result<BinaryAuthorizationDecision, "
                     "AuthorizationRuntimeError>")
        base = {"manifest": "authorization-api/Cargo.toml", "signature": signature,
                "line": 1, "constructors": {}}
        self.assertEqual(v20.classify_row(base)["role"], "api-blocking-worker-carrier")
        with self.assertRaisesRegex(ValueError, "compiled decision constructors changed"):
            v20.classify_row({**base, "constructors": {"Allow": 1}})

    def test_duplicate_displayed_signatures_keep_line_identity(self) -> None:
        mir = """fn AuthorizationDecision::Deny(_1: DenyReason) -> AuthorizationDecision {
    bb0: {
        _0 = AuthorizationDecision::Deny(move _1);
    }
}
fn AuthorizationDecision::Deny(_1: DenyReason) -> AuthorizationDecision {
    bb0: {
        _0 = AuthorizationDecision::Deny(move _1);
    }
}
"""
        rows, _ = v20.decision_bodies({"standard-runtime/Cargo.toml": mir})
        self.assertEqual(len(rows), 2)
        self.assertNotEqual(rows[0]["line"], rows[1]["line"])
        self.assertEqual([v20.classify_row(row)["role"] for row in rows],
                         ["policy-deny-variant-constructor"] * 2)

    def test_unparsed_or_incomplete_function_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "unparsed MIR function header"):
            v20.decision_bodies({"x/Cargo.toml": "fn permitted() -> BinaryAuthorizationDecision\n"})
        with self.assertRaisesRegex(ValueError, "incomplete or empty"):
            v20.decision_bodies({"x/Cargo.toml":
                "fn permitted() -> BinaryAuthorizationDecision {\n"})

    def test_command_gate_is_not_implicitly_downstream(self) -> None:
        mir = """fn gate() -> CommandBoundaryDecision {
    bb0: {
        _0 = CommandBoundaryDecision::Ready;
    }
}
"""
        rows, counts = v20.decision_bodies({"command-boundary-runtime-v2/Cargo.toml": mir})
        self.assertEqual(counts["command-boundary-runtime-v2/Cargo.toml"], 1)
        self.assertEqual(rows, [])

    def test_pre_ready_binary_allow_in_known_ingress_is_not_exempt(self) -> None:
        mir = """fn deny(_1: StatusCode) -> Response<Body> {
    bb0: {
        _2 = BinaryAuthorizationDecision::Allow;
    }
}
"""
        rows, _ = v20.decision_bodies({"authorization-api/Cargo.toml": mir})
        self.assertEqual(rows[0]["constructors"], {"Allow": 1})
        with self.assertRaisesRegex(ValueError, "compiled decision constructors changed"):
            v20.classify_row(rows[0])

    def test_new_decision_typed_local_in_existing_package_is_unclassified(self) -> None:
        mir = """fn innocent() -> () {
    let _1: AdmissionOutcome<BinaryAuthorizationDecision>;
    bb0: {
        return;
    }
}
"""
        rows, _ = v20.decision_bodies({"authorization-admission-service/Cargo.toml": mir})
        self.assertEqual(len(rows), 1)
        with self.assertRaisesRegex(ValueError, "unclassified compiled decision-shaped body"):
            v20.classify_row(rows[0])

    def test_bridge_result_carrier_accepts_zero_argument_evaluate(self) -> None:
        row = {"manifest": "authentication-prototype/bridge/Cargo.toml",
               "signature": "evaluate() -> Result<bool, Box<dyn StdError>>",
               "line": 1, "constructors": {}}
        self.assertEqual(v20.classify_row(row)["role"], "bridge-result-carrier")

    def test_derived_support_methods_cannot_replace_each_other(self) -> None:
        rows = [{"role": role, "signature": f"<impl at src/lib.rs:1:1: 1:2>::{method}(_1: &Decision) -> ()"}
                for role, methods in v20.EXPECTED_SUPPORT_METHODS.items()
                for method in sorted(methods)]
        v20.check_support_methods("api", rows)
        changed = [dict(row) for row in rows]
        changed[0]["signature"] = changed[1]["signature"]
        with self.assertRaisesRegex(ValueError, "method set changed"):
            v20.check_support_methods("api", changed)


if __name__ == "__main__":
    unittest.main()
