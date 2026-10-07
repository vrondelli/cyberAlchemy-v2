#!/usr/bin/env python3
"""Focused parser and source-mutation controls for the V37 candidate."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v37", CASE / "auth-v4b-normal-downstream-reachability-v37.py")
assert SPEC is not None and SPEC.loader is not None
v37 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v37)


class NormalDownstreamReachabilityV37Tests(unittest.TestCase):
    def test_ready_marker_is_added_once_at_selected_entry(self):
        source = "pub fn authorize(ready: ReadyAuthorization) {\n" + v37.READY_ANCHOR + "}\n"
        changed = v37.mutate_ready(source)
        self.assertEqual(changed.count(v37.READY_MARKER), 1)
        self.assertIn("ready.evaluation_epoch_id()", changed)
        self.assertIn("command.request_id", changed)

    def test_policy_mutant_changes_allow_arm_only(self):
        source = v37.POLICY_ANCHOR + v37.ALLOW_ANCHOR + "    } else {\n        deny()\n    }\n}\n"
        marked = v37.mutate_policy(source, False)
        hostile = v37.mutate_policy(source, True)
        self.assertEqual(marked.count(v37.POLICY_MARKER), 1)
        self.assertIn("AuthorizationDecision::Allow", marked)
        self.assertNotIn("AuthorizationDecision::Allow", hostile)
        self.assertIn("AuthorizationDecision::Deny(DenyReason::NoExactActiveRoleGrant)", hostile)

    def test_missing_or_duplicate_anchors_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "anchor changed"):
            v37.mutate_ready("missing")
        with self.assertRaisesRegex(ValueError, "anchor changed"):
            v37.mutate_policy(v37.POLICY_ANCHOR * 2, False)
        with self.assertRaisesRegex(ValueError, "anchor changed"):
            v37.mutate_policy(v37.POLICY_ANCHOR, True)

    def test_marker_order_and_request_epoch_identity(self):
        text = "AUTH_V37_READY request=request-0 epoch=1\nAUTH_V37_POLICY request=request-0\n"
        self.assertEqual(len(v37.markers(text, "tenant", "marked")), 2)
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v37.markers(text.replace("epoch=1", "epoch=2"), "tenant", "marked")
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v37.markers("\n".join(reversed(text.splitlines())), "tenant", "marked")
        with self.assertRaisesRegex(ValueError, "marker order/identity"):
            v37.markers(text, "tenant", "duplicate-pre-gate")


if __name__ == "__main__":
    unittest.main()
