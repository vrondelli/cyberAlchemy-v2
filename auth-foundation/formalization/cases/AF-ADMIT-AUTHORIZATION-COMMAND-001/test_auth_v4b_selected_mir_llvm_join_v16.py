#!/usr/bin/env python3
"""Hostile controls for the bounded selected MIR/LLVM call join."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_selected_mir_llvm_join_v16", CASE / "auth-v4b-selected-mir-llvm-join-v16.py")
assert SPEC and SPEC.loader
v16 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v16)


def example() -> tuple[dict, dict]:
    graph = {"status": "pass", "bounded_property": {
        "status": "pass", "normal_path_only": True},
        "policy_function": "authorize(_1: ReadyAuthorization<'_, '_>) -> AuthorizationDecision",
        "decision_function": "authorize(_1: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision",
        "selected_stage_native_calls": [{
            "manifest": v16.v9.DECISION,
            "function": "authorize(_1: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision",
            "block": "bb5", "target": v16.v9.v6.POLICY}]}
    census = {"root_id": "api", "selected_endpoint_bindings": {
        "ready-decision": {"manifest": v16.v9.DECISION, "symbol_hex": "aa",
                           "binding": "attached-debug-source-definition-candidate"},
        "generated-policy": {"manifest": v16.v9.POLICY, "symbol_hex": "bb",
                             "binding": "attached-debug-source-definition-candidate"}},
        "exact_symbol_call_candidates": {
            "ready-decision": [], "generated-policy": [{
                "manifest": v16.v9.DECISION, "function_symbol_hex": "aa",
                "target_symbol_hex": "bb", "opcode": "call",
                "classification": "same-symbol-local-definition-candidate", "line": 42}]},
        "exact_symbol_candidate_counts": {"ready-decision": 0, "generated-policy": 1}}
    return graph, census


class SelectedMirLlvmJoinV16(unittest.TestCase):
    def test_unique_same_build_candidate(self) -> None:
        graph, census = example()
        joined = v16.join_selected("api", graph, census)
        self.assertEqual(joined["correspondence"],
                         "same-build-unique-function-and-call-candidate")
        self.assertFalse(joined["instruction_identity_established"])
        self.assertFalse(joined["runtime_guarantees_observed"])

    def test_invoke_is_candidate_with_open_unwind_edge(self) -> None:
        graph, census = example()
        census["exact_symbol_call_candidates"]["generated-policy"][0]["opcode"] = "invoke"
        joined = v16.join_selected("api", graph, census)
        self.assertEqual(joined["llvm_opcode"], "invoke")
        self.assertFalse(joined["llvm_unwind_edge_closed"])

    def test_changed_graph_or_mir_site_fails(self) -> None:
        graph, census = example()
        changes = [
            lambda g: g["bounded_property"].update(status="fail"),
            lambda g: g["bounded_property"].update(normal_path_only=False),
            lambda g: g["selected_stage_native_calls"].append(copy.deepcopy(
                g["selected_stage_native_calls"][0])),
            lambda g: g["selected_stage_native_calls"][0].update(block="other"),
            lambda g: g["selected_stage_native_calls"][0].update(target="other"),
            lambda g: g.update(decision_function="authorize(other)"),
        ]
        for change in changes:
            with self.subTest(change=change):
                altered = copy.deepcopy(graph)
                change(altered)
                with self.assertRaises(ValueError):
                    v16.join_selected("api", altered, census)

    def test_wrong_root_or_definition_binding_fails(self) -> None:
        graph, census = example()
        changes = [
            lambda c: c.update(root_id="tenant"),
            lambda c: c["selected_endpoint_bindings"]["ready-decision"].update(symbol_hex="bb"),
            lambda c: c["selected_endpoint_bindings"]["generated-policy"].update(
                binding="unattached"),
            lambda c: c["selected_endpoint_bindings"]["generated-policy"].update(
                manifest="elsewhere/Cargo.toml"),
        ]
        for change in changes:
            with self.subTest(change=change):
                altered = copy.deepcopy(census)
                change(altered)
                with self.assertRaises(ValueError):
                    v16.join_selected("api", graph, altered)

    def test_extra_or_other_caller_fails(self) -> None:
        graph, census = example()
        changes = [
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"].append(
                copy.deepcopy(c["exact_symbol_call_candidates"]["generated-policy"][0])),
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"][0].update(
                function_symbol_hex="unrelated"),
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"][0].update(
                classification="declaration-or-external-unresolved"),
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"][0].update(
                target_symbol_hex="other"),
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"][0].update(
                opcode="callbr"),
            lambda c: c["exact_symbol_call_candidates"]["generated-policy"][0].update(
                manifest="elsewhere/Cargo.toml"),
            lambda c: c["exact_symbol_call_candidates"]["ready-decision"].append(
                copy.deepcopy(c["exact_symbol_call_candidates"]["generated-policy"][0])),
        ]
        for change in changes:
            with self.subTest(change=change):
                altered = copy.deepcopy(census)
                change(altered)
                with self.assertRaises(ValueError):
                    v16.join_selected("api", graph, altered)

    def test_current_source_location_and_scope(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v16-span-") as temporary:
            root = Path(temporary)
            source = root / "decision/src/lib.rs"
            source.parent.mkdir(parents=True)
            source.write_text("pub fn authorize() {\n    let decision = kernel::authorize(&context);\n}\n")
            decision = {"source": "decision/src/lib.rs",
                        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                        "debug_id": "10", "debug_file_id": "1"}
            site = {"line": 1, "opcode": "invoke"}
            llvm = ("  %decision = invoke i8 @policy(ptr %context)\n"
                    "          to label %bb2 unwind label %cleanup, !dbg !5\n"
                    "!5 = !DILocation(line: 2, column: 20, scope: !11)\n"
                    "!11 = distinct !DILexicalBlock(scope: !10, file: !1, line: 1)\n")
            with patch.object(v16.v15, "IMPL", root):
                bound = v16.source_span_candidate(llvm, site, decision)
                self.assertEqual(bound["source_call_line"], 2)
                self.assertEqual(bound["llvm_debug_location_id"], "5")
                variants = [
                    llvm.replace("!dbg !5", ""),
                    llvm.replace("!dbg !5", "; !dbg !5"),
                    llvm.replace("line: 2", "line: 1"),
                    llvm.replace("scope: !11", "scope: !99"),
                    llvm.replace("!11 = distinct !DILexicalBlock(scope: !10", "!11 = distinct !DILexicalBlock(scope: !11"),
                    llvm.replace("file: !1", "file: !99"),
                    llvm.replace("scope: !11)", "scope: !11, inlinedAt: !7)"),
                    llvm + "!5 = !DILocation(line: 2, column: 20, scope: !10)\n",
                    llvm.replace("to label %bb2 unwind label %cleanup", "to label %bb2"),
                ]
                for altered in variants:
                    with self.subTest(variant=altered[-90:]):
                        with self.assertRaises(ValueError):
                            v16.source_span_candidate(altered, site, decision)
                source.write_text(source.read_text().replace("}\n", "    let decision = kernel::authorize(&context);\n}\n"))
                with self.assertRaisesRegex(ValueError, "source changed"):
                    v16.source_span_candidate(llvm, site, decision)


if __name__ == "__main__":
    unittest.main()
