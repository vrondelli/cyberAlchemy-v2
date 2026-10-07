#!/usr/bin/env python3
"""Fast source-model and strict trace hostiles for V40."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v40", CASE / "auth-v4b-normal-gate-deny-v40.py")
assert SPEC and SPEC.loader
v40 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v40)


class NormalGateDenyV40Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
        cls.gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()

    def test_named_v30_cardinality_rejection_not_marker_hash_rejection(self):
        result = v40.check_named_v30_rejection(self.authority, self.gate)
        self.assertTrue(result["frozen_source_model_checked"])
        self.assertEqual(result["exact_cardinality_relaxation_rejected_as"],
                         "occurrence cardinality")
        self.assertTrue(result["source_model_gate_deny_unreachable"])

    def test_exact_authority_deltas_and_unchanged_gate(self):
        clean = v40.mutate_authority(self.authority, "clean")
        marked = v40.mutate_authority(self.authority, "marked")
        counterfactual = v40.mutate_authority(
            self.authority, "cardinality-gate-deny")
        bypass = v40.mutate_authority(self.authority, "bypass-deny")
        self.assertEqual(clean, self.authority)
        self.assertEqual(marked.count(v40.PRE), 1)
        self.assertEqual(marked.count(v40.GATE_RESULT), 1)
        self.assertEqual(counterfactual,
                         marked.replace(v40.CARDINALITY_OLD,
                                        v40.CARDINALITY_NEW, 1))
        self.assertEqual(bypass,
                         counterfactual.replace(v40.DENY_ANCHOR,
                             v40.DENY_ANCHOR.replace(
                                 "if gate_decision != "
                                 "gate::CommandBoundaryDecision::Ready",
                                 "if false"), 1))
        self.assertEqual((v40.v29.ORIGINAL_IMPL / v40.GATE).read_text(), self.gate)

    def test_missing_or_duplicate_source_anchor_rejected(self):
        with self.assertRaisesRegex(ValueError, "pre-cardinality source anchor"):
            v40.mutate_authority(self.authority.replace(v40.PRE_ANCHOR, ""),
                                 "marked")
        with self.assertRaisesRegex(ValueError, "cardinality relaxation source anchor"):
            v40.mutate_authority(self.authority + v40.CARDINALITY_OLD,
                                 "cardinality-gate-deny")
        with self.assertRaisesRegex(ValueError, "gate-DENY bypass source anchor"):
            v40.mutate_authority(self.authority.replace(v40.DENY_ANCHOR, ""),
                                 "bypass-deny")

    def test_four_root_counterfactual_gate_deny_has_no_downstream_marker(self):
        for root in v40.ROOTS:
            expected = v40.expected_trace(root, "cardinality-gate-deny", "duplicate")
            self.assertEqual(v40.parse_trace("\n".join(expected), root,
                "cardinality-gate-deny", "duplicate"), expected)
            self.assertTrue(any("decision=Deny" in row for row in expected))
            self.assertFalse(any("AUTH_V39_READY" in row or
                                 "AUTH_V39_authorize" in row for row in expected))
            self.assertFalse(any(f"AUTH_V39_{name} " in row for row in expected
                                 for name in v40.v39.HELPERS))

    def test_ordinary_duplicate_is_pre_gate_not_gate_deny(self):
        for root in v40.ROOTS:
            variant = "marked" if root == "api" else "marked-duplicate"
            expected = v40.expected_trace(root, variant, "duplicate")
            self.assertTrue(any(v40.PRE in row for row in expected))
            self.assertFalse(any(v40.GATE_RESULT in row for row in expected))
            self.assertEqual(v40.parse_trace("\n".join(expected), root,
                                               variant, "duplicate"), expected)
            with self.assertRaisesRegex(ValueError, "marker order/identity"):
                v40.parse_trace("\n".join(expected).replace(
                    expected[-1], f"{v40.GATE_RESULT} request=wrong epoch=1 "
                    "decision=Deny\n" + expected[-1]),
                    root, variant, "duplicate")

    def test_four_root_marked_allow_has_gate_ready_and_full_helper_chain(self):
        for root in v40.ROOTS:
            expected = v40.expected_trace(root, "marked", "allow")
            self.assertTrue(any("decision=Ready" in line for line in expected))
            self.assertEqual(expected[-2:] if root == "api" else expected[-1:],
                             (["AUTH_V39_exact_active_role_grant request=auth_v38_allow",
                               "AUTH_V39_END request=auth_v38_allow decision=ALLOW"]
                              if root == "api" else
                              [f"AUTH_V39_exact_active_role_grant request={v40.request_id(root, 'allow')}"]))
            self.assertEqual(v40.parse_trace("\n".join(expected), root,
                                               "marked", "allow"), expected)

    def test_api_bypass_control_requires_gate_deny_then_downstream(self):
        expected = v40.expected_trace("api", "bypass-deny", "duplicate")
        self.assertLess(next(i for i, line in enumerate(expected) if "decision=Deny" in line),
                        next(i for i, line in enumerate(expected) if "AUTH_V39_READY" in line))
        self.assertIn("AUTH_V39_exact_active_role_grant request=auth_v38_duplicate",
                      expected)
        self.assertEqual(expected[-1],
                         "AUTH_V39_END request=auth_v38_duplicate decision=ALLOW")
        self.assertEqual(v40.parse_trace("\n".join(expected), "api",
                              "bypass-deny", "duplicate"), expected)
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v40.parse_trace("\n".join(expected).replace(
                "AUTH_V39_READY", "AUTH_V39_default_deny"),
                "api", "bypass-deny", "duplicate")

    def test_wrong_request_epoch_and_coalesced_markers_fail(self):
        expected = v40.expected_trace("tenant", "cardinality-gate-deny", "duplicate")
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v40.parse_trace("\n".join(expected).replace("epoch=1", "epoch=2", 1),
                            "tenant", "cardinality-gate-deny", "duplicate")
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v40.parse_trace("\n".join(expected).replace("request=request-0",
                                                   "request=wrong", 1),
                            "tenant", "cardinality-gate-deny", "duplicate")
        with self.assertRaisesRegex(ValueError, "coalesced or duplicate"):
            v40.parse_trace(expected[0] + expected[1], "tenant",
                            "cardinality-gate-deny", "duplicate")


if __name__ == "__main__":
    unittest.main()
