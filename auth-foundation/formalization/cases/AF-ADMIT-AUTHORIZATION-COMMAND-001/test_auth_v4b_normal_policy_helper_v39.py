#!/usr/bin/env python3
"""Fast source, causal-delta, and observation hostiles for V39."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v39", CASE / "auth-v4b-normal-policy-helper-v39.py")
assert SPEC and SPEC.loader
v39 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v39)


class NormalPolicyHelperV39Tests(unittest.TestCase):
    def test_selected_policy_public_surface_and_exact_marking(self):
        source = (v39.v29.ORIGINAL_IMPL / v39.POLICY).read_text()
        marked = v39.mark_policy(source)
        for name in ("authorize", *v39.HELPERS):
            self.assertEqual(marked.count(f"{v39.MARKER}{name}"), 1)
        self.assertNotIn("return false;", marked)
        self.assertEqual(len(v39.HELPERS), 8)
        self.assertEqual(len(v39.ACTIVE), 6)
        self.assertEqual(set(v39.HELPERS) - set(v39.ACTIVE), set(v39.DORMANT))

    def test_missing_and_duplicate_anchor_rejected(self):
        source = (v39.v29.ORIGINAL_IMPL / v39.POLICY).read_text()
        with self.assertRaisesRegex(ValueError, "policy anchor changed: allow_iff"):
            v39.mark_policy(source.replace(v39.policy_anchor("allow_iff"), ""))
        with self.assertRaisesRegex(ValueError, "policy anchor changed: allow_iff"):
            v39.mark_policy(source + v39.policy_anchor("allow_iff"))

    def test_false_return_delta_only_at_chosen_helper(self):
        source = (v39.v29.ORIGINAL_IMPL / v39.POLICY).read_text()
        marked = v39.mark_policy(source)
        for name in v39.ACTIVE:
            line = (f'    eprintln!("{v39.MARKER}{name} request={{}}", '
                    'context.request.request_id);\n')
            mutant = v39.mark_policy(source, name)
            self.assertEqual(mutant, marked.replace(
                line, line + "    return false;\n", 1))
            self.assertEqual(mutant.count("return false;"), 1)
        with self.assertRaisesRegex(ValueError, "not an active helper"):
            v39.mark_policy(source, "default_deny")

    def test_marked_allow_requires_all_active_in_order_and_no_dormant(self):
        request = "auth_v38_allow"
        trace = v39.expected_trace(request, "marked", True)
        self.assertEqual(v39.parse_trace("\n".join(trace), request, "marked", True), trace)
        self.assertFalse(any(name in "\n".join(trace) for name in v39.DORMANT))
        with self.assertRaisesRegex(ValueError, "marker order/count/identity"):
            v39.parse_trace("\n".join(trace).replace(
                "unique_resolved_session", "default_deny"), request, "marked", True)
        with self.assertRaisesRegex(ValueError, "marker order/count/identity"):
            v39.parse_trace("\n".join(trace).replace(
                "trusted_scope request=auth_v38_allow",
                "trusted_scope request=wrong"), request, "marked", True)

    def test_each_mutant_requires_truncated_helper_sequence_and_deny(self):
        request = "auth_v38_allow"
        for name in v39.ACTIVE:
            trace = v39.expected_trace(request, name, True)
            self.assertEqual(trace[-1],
                             f"{v39.MARKER}END request={request} decision=DENY")
            self.assertEqual(v39.parse_trace("\n".join(trace), request, name, True), trace)
            with self.assertRaisesRegex(ValueError, "marker order/count/identity"):
                v39.parse_trace("\n".join(trace).replace(
                    f"{v39.MARKER}END", f"{v39.MARKER}default_deny request={request}\n"
                    f"{v39.MARKER}END"), request, name, True)

    def test_clean_and_pre_gate_deny_require_no_policy_entry(self):
        clean = v39.expected_trace("auth_v38_allow", "clean", True)
        duplicate = v39.expected_trace("auth_v38_duplicate", "marked", True,
                                       "duplicate")
        self.assertEqual(len(clean), 2)
        self.assertEqual(len(duplicate), 2)
        self.assertEqual(v39.parse_trace("\n".join(duplicate), "auth_v38_duplicate",
                                         "marked", True, "duplicate"), duplicate)
        with self.assertRaisesRegex(ValueError, "marker order/count/identity"):
            v39.parse_trace("\n".join(duplicate).replace(
                f"{v39.MARKER}END", f"{v39.MARKER}allow_iff request=auth_v38_duplicate\n"
                f"{v39.MARKER}END"), "auth_v38_duplicate", "marked", True, "duplicate")

    def test_duplicate_or_coalesced_marker_rejected(self):
        request = "request-0"
        trace = v39.expected_trace(request, "marked", False)
        with self.assertRaisesRegex(ValueError, "multiple markers"):
            v39.parse_trace("\n".join(trace[:-1] + [trace[-1] + trace[1]]),
                            request, "marked", False)
        with self.assertRaisesRegex(ValueError, "marker order/count/identity"):
            v39.parse_trace("\n".join(trace + [trace[-1]]),
                            request, "marked", False)


if __name__ == "__main__":
    unittest.main()
