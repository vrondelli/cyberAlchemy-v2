#!/usr/bin/env python3
"""Hostile controls for the bounded local pre-READY effect cut."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-pre-ready-effect-cut-v26.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_pre_ready_effect_cut_v26", SCRIPT)
assert SPEC and SPEC.loader
cut = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cut)


def body(early: str, denied: str = "return;") -> str:
    return ("    bb0: {\n" + early + "\n    }\n"
            "    bb1: {\n"
            "        switchInt(copy _1) -> [0: bb2, otherwise: bb3];\n"
            "    }\n"
            "    bb2: {\n        " + denied + "\n    }\n"
            "    bb3: {\n        return;\n    }\n")


class PreReadyEffectCutV26(unittest.TestCase):
    def test_deny_branch_and_pre_handoff_effects_are_retained(self) -> None:
        source = body("        _2 = copy _7(copy _8) -> [return: bb1, unwind continue];",
                      "drop(_9) -> [return: bb4, unwind continue];")
        source += "    bb4: {\n        return;\n    }\n"
        result = cut.function_cut("authority", "with_ready_in_transaction(", source,
                                  exclude="bb3")
        self.assertEqual(result["reachable_blocks"], ["bb0", "bb1", "bb2", "bb4"])
        self.assertEqual(result["open_nonhandoff_site_count"], 2)
        self.assertEqual(result["unresolved_site_count"], 2)
        self.assertEqual(result["open_unwind_count"], 2)
        classes = {row["classification"] for row in result["effect_sites"]}
        self.assertIn("open-dynamic-target", classes)
        self.assertIn("open-drop", classes)

    def test_pre_ready_named_policy_and_decision_calls_fail(self) -> None:
        targets = (cut.v6.POLICY,
                   "SqliteAuthorizationService::authorize")
        for target in targets:
            source = body(f"        _2 = {target}(copy _8) -> "
                          "[return: bb1, unwind continue];")
            with self.subTest(target=target), self.assertRaisesRegex(
                    ValueError, "pre-READY native decision effect"):
                cut.function_cut("authority", "with_ready_in_transaction(", source,
                                 exclude="bb3")

    def test_handoff_return_paths_are_conservatively_retained(self) -> None:
        source = body("        _2 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>(copy _8) -> [return: bb1, unwind continue];")
        result = cut.function_cut("root", "selected_worker", source, handoff="bb0")
        self.assertEqual(result["reachable_blocks"], ["bb0", "bb1", "bb2", "bb3"])
        self.assertEqual(result["effect_sites"][0]["classification"], "selected-handoff")
        self.assertEqual(result["selected_handoff_site_count"], 1)
        self.assertEqual(result["unresolved_site_count"], 1)
        changed = source.replace("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>",
                                 "other_call")
        with self.assertRaisesRegex(ValueError, "selected handoff effect changed"):
            cut.function_cut("root", "selected_worker", changed, handoff="bb0")

    def test_unknown_effect_is_open_not_control_only(self) -> None:
        source = body("        _2 = weird!(copy _8) -> [return: bb1, unwind continue];")
        result = cut.function_cut("authority", "with_ready_in_transaction(", source,
                                  exclude="bb3")
        self.assertTrue(result["effect_sites"][0]["classification"].startswith("open-"))
        self.assertTrue(result["effect_sites"][0]["unwind_open"])

    def test_unwind_only_cleanup_is_enumerated_and_policy_mutant_rejected(self) -> None:
        source = body("        _2 = prepare(copy _8) -> [return: bb1, unwind: bb4];")
        source += "    bb4 (cleanup): {\n        drop(_9) -> [return: bb5, unwind continue];\n    }\n"
        source += "    bb5 (cleanup): {\n        resume;\n    }\n"
        result = cut.function_cut("authority", "with_ready_in_transaction(", source,
                                  exclude="bb3")
        self.assertEqual(result["local_cleanup_only_blocks"], ["bb4", "bb5"])
        self.assertIn("open-drop", {row["classification"] for row in result["effect_sites"]})
        mutant = source.replace("drop(_9)", f"{cut.v6.POLICY}(copy _9)")
        with self.assertRaisesRegex(ValueError, "pre-READY native decision effect"):
            cut.function_cut("authority", "with_ready_in_transaction(", mutant,
                             exclude="bb3")

    def test_unwind_into_excluded_ready_arm_cannot_hide_policy(self) -> None:
        source = body("        _2 = prepare(copy _8) -> [return: bb1, unwind: bb3];")
        source = source.replace("    bb3: {\n        return;",
            f"    bb3: {{\n        _4 = {cut.v6.POLICY}(copy _8) -> "
            "[return: bb4, unwind continue];")
        source += "    bb4: {\n        return;\n    }\n"
        with self.assertRaisesRegex(ValueError, "pre-READY native decision effect"):
            cut.function_cut("authority", "with_ready_in_transaction(", source,
                             exclude="bb3")

    def test_missing_anchor_fails_closed(self) -> None:
        graph = {"bb0": ["bb1"], "bb1": []}
        with self.assertRaisesRegex(ValueError, "anchor missing"):
            cut.cut_nodes(graph, handoff="bb4")
        with self.assertRaisesRegex(ValueError, "handoff unreachable"):
            cut.cut_nodes({"bb0": [], "bb1": []}, handoff="bb1")


if __name__ == "__main__":
    unittest.main()
