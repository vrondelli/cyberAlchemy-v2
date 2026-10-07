#!/usr/bin/env python3
"""Focused synthetic controls for the bounded V27 local direct expansion."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("auth-v4b-transitive-direct-cut-v27.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_transitive_direct_cut_v27", SCRIPT)
assert SPEC and SPEC.loader
v27 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v27)


def function(name: str, first: str, cleanup: str = "") -> str:
    return (f"fn {name}() {{\n"
            "    bb0: {\n"
            f"        {first}\n"
            "    }\n"
            "    bb1: {\n"
            "        return;\n"
            "    }\n"
            f"{cleanup}"
            "}\n")


def call(target: str, *, unwind: str = "unwind continue") -> str:
    return f"_0 = {target}() -> [return: bb1, {unwind}];"


def analyze(source: str):
    functions = v27.v5.functions(source)
    selected = functions["selected()"]
    cut = v27.v26.function_cut("root", "selected()", selected)
    return v27.analyze_section("root", source, "selected()", cut)


class TransitiveDirectCutV27(unittest.TestCase):
    def test_unique_local_chain_expands_and_external_remains_open(self) -> None:
        source = (function("selected", call("helper")) +
                  function("helper", call("leaf")) +
                  function("leaf", call("external::effect")))
        result = analyze(source)
        self.assertEqual(result["selected_unresolved_site_count"], 1)
        self.assertEqual(result["resolved_unique_local_direct_edge_count"], 2)
        self.assertEqual(result["expanded_local_functions"], ["helper()", "leaf()"])
        self.assertEqual(result["remaining_open_site_count"], 3)
        self.assertEqual([row["classification"] for row in result["remaining_open_sites"]].count(
                         "open-caller-unwind-continuation"), 2)
        self.assertIn("open-unmatched-or-ambiguous-direct",
                      {row["classification"] for row in result["remaining_open_sites"]})

    def test_indirect_drop_and_unwind_cleanup_stay_open(self) -> None:
        cleanup = ("    bb2 (cleanup): {\n"
                   "        drop(_9) -> [return: bb3, unwind continue];\n"
                   "    }\n"
                   "    bb3 (cleanup): {\n        resume;\n    }\n")
        source = (function("selected", call("helper", unwind="unwind: bb2"), cleanup) +
                  function("helper", "_0 = copy _5() -> [return: bb1, unwind continue];"))
        result = analyze(source)
        self.assertEqual(result["resolved_unique_local_direct_edge_count"], 1)
        classes = {row["classification"] for row in result["remaining_open_sites"]}
        self.assertIn("open-caller-unwind-continuation", classes)
        self.assertIn("open-dynamic-target", classes)
        self.assertIn("open-drop", classes)
        self.assertIn("open-unwind-or-abort", classes)

    def test_repeated_target_is_not_falsely_closed(self) -> None:
        source = (function("selected", call("helper")) +
                  function("helper", call("selected")))
        result = analyze(source)
        self.assertEqual(result["resolved_unique_local_direct_edge_count"], 1)
        self.assertEqual(len(result["repeated_local_edges_left_open"]), 1)
        self.assertIn("open-repeated-local-target",
                      {row["classification"] for row in result["remaining_open_sites"]})

    def test_ambiguous_local_symbol_stays_open(self) -> None:
        source = (function("selected", call("helper")) +
                  function("helper", "return;") +
                  function("helper", "return;"))
        result = analyze(source)
        self.assertEqual(result["resolved_unique_local_direct_edge_count"], 0)
        self.assertEqual(result["remaining_open_site_count"], 1)

    def test_local_policy_target_is_rejected_not_counted_as_resolved(self) -> None:
        source = (function("selected", call("helper")) +
                  function("helper", call(v27.v6.POLICY)))
        with self.assertRaisesRegex(ValueError, "pre-READY native decision effect"):
            analyze(source)

    def test_selected_function_identity_drift_fails(self) -> None:
        source = function("selected", "return;") + function("helper", "return;")
        cut = v27.v26.function_cut("root", "selected()", v27.v5.functions(source)["selected()"])
        with self.assertRaisesRegex(ValueError, "selected compiled function mismatch"):
            v27.analyze_section("root", source, "other()", cut)

    def test_four_root_summary_refuses_claim_promotion(self) -> None:
        build = {"metadata_sha256": "metadata", "lock_sha256": "lock",
                 "selected_graph_inspection": {
                     "status": "indeterminate", "endpoint_set_closed": False,
                     "all_path_ready_dominance": False,
                     "runtime_guarantees_observed": False,
                     "selected_unresolved_site_count": 3,
                     "resolved_unique_local_direct_edge_count": 1,
                     "expanded_local_function_count": 1,
                     "remaining_open_site_count": 4,
                     "source_mir_sha256": {"manifest": "mir"}}}
        self.assertEqual(v27.summarize_root(build)["remaining_open_site_count"], 4)
        build["selected_graph_inspection"]["runtime_guarantees_observed"] = True
        with self.assertRaisesRegex(ValueError, "selected-root claim changed"):
            v27.summarize_root(build)

    def test_four_root_replay_rejects_missing_root(self) -> None:
        incomplete = {"status": "indeterminate", "endpoint_set_closed": False,
                      "all_path_ready_dominance": False,
                      "runtime_guarantees_observed": False,
                      "root_context_builds": {"api": {}}}
        with patch.object(v27.v7, "evaluate", return_value=incomplete):
            with self.assertRaisesRegex(ValueError, "four-root predecessor claim changed"):
                v27.evaluate_all_roots()


if __name__ == "__main__":
    unittest.main()
