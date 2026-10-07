#!/usr/bin/env python3
"""Fail-closed controls for the API generated-body source/debug join."""

import hashlib
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("auth-v4b-api-generated-body-join-v19.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_api_generated_body_join_v19", SCRIPT)
assert SPEC and SPEC.loader
v19 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v19)


class ApiGeneratedBodyJoinV19(unittest.TestCase):
    def fixture(self):
        source_path = v19.v7.IMPL / v19.API_SOURCE
        source = source_path.read_bytes()
        anchors = v19.source_anchors(source)
        checksum = hashlib.md5(source).hexdigest()
        metadata = [f'!1 = !DIFile(filename: "{source_path.name}", '
                    f'directory: "{source_path.parent}", checksumkind: CSK_MD5, '
                    f'checksum: "{checksum}")']
        headers = []
        for index, (role, name, _) in enumerate(v19.GENERATED, 2):
            symbol = role.replace("-", "_")
            metadata.append(
                f'!{index} = distinct !DISubprogram(name: "{name}", '
                f'linkageName: "{symbol}", scope: !0, file: !1, '
                f'line: {anchors[role]}, type: !0)')
            headers.append(f'define void @{symbol}() !dbg !{index} {{\n  ret void\n}}')
        llvm = "\n".join(headers + metadata) + "\n"
        parsed = v19.v15.definitions({v19.API_MANIFEST: llvm})
        definitions = {symbol: [{**row, "symbol_hex": symbol} for row in rows]
                       for symbol, rows in parsed.items()}
        return llvm, definitions, source, source_path

    def test_all_generated_roles_bind_distinct_attached_definitions(self):
        llvm, definitions, source, path = self.fixture()
        bound = v19.bind_generated(llvm, definitions, source, path)
        self.assertEqual(set(bound), {role for role, _, _ in v19.GENERATED})
        self.assertEqual(len({row["symbol_hex"] for row in bound.values()}), 4)
        self.assertTrue(all(row["source_sha256"] == hashlib.sha256(source).hexdigest()
                            for row in bound.values()))
        self.assertTrue(all(row["manifest"] == v19.API_MANIFEST for row in bound.values()))

    def test_stale_checksum_and_duplicate_debug_row_fail_closed(self):
        llvm, definitions, source, path = self.fixture()
        stale = llvm.replace(hashlib.md5(source).hexdigest(), "0" * 32)
        with self.assertRaisesRegex(ValueError, "source checksum changed"):
            v19.bind_generated(stale, definitions, source, path)
        duplicate = llvm + next(line for line in llvm.splitlines()
                                if 'name: "{closure#0}"' in line and
                                f'line: {v19.source_anchors(source)["blocking-worker"]}' in line) + "\n"
        with self.assertRaisesRegex(ValueError, "debug subprogram ambiguous"):
            v19.bind_generated(duplicate, definitions, source, path)

    def test_missing_or_misattached_definition_fails_closed(self):
        llvm, definitions, source, path = self.fixture()
        missing = dict(definitions)
        missing.pop(v19.v13.symbol_hex("@blocking_worker"))
        with self.assertRaisesRegex(ValueError, "attached unique definition missing"):
            v19.bind_generated(llvm, missing, source, path)
        wrong = {key: [dict(row) for row in rows] for key, rows in definitions.items()}
        wrong[v19.v13.symbol_hex("@blocking_worker")][0]["debug_id"] = "999"
        with self.assertRaisesRegex(ValueError, "attached unique definition missing"):
            v19.bind_generated(llvm, wrong, source, path)

    def test_shifted_worker_line_and_second_worker_closure_fail_closed(self):
        llvm, definitions, source, path = self.fixture()
        line = v19.source_anchors(source)["blocking-worker"]
        shifted = llvm.replace(f"line: {line},", f"line: {line + 1},")
        with self.assertRaisesRegex(ValueError, "blocking-worker debug subprogram ambiguous"):
            v19.bind_generated(shifted, definitions, source, path)
        second = llvm + (
            f'!99 = distinct !DISubprogram(name: "{{closure#0}}", '
            f'linkageName: "other_worker", scope: !0, file: !1, '
            f'line: {line}, type: !0)\n')
        with self.assertRaisesRegex(ValueError, "blocking-worker debug subprogram ambiguous"):
            v19.bind_generated(second, definitions, source, path)

    def test_semantic_handoffs_are_not_direct_graph_edges(self):
        self.assertEqual(len(v19.HANDOFFS), 3)
        self.assertEqual({(source, target) for source, target, _ in v19.HANDOFFS},
                         {("handler-poll", "runtime-poll"),
                          ("runtime-poll", "blocking-worker"),
                          ("blocking-worker", "ready-callback-worker")})
        self.assertFalse(v19.v18.graph("fixture", {
            "61": [{"manifest": "fixture", "symbol_hex": "61", "line": 1,
                    "debug_id": None, "linkage": "internal"}]}, [],
            [{"manifest": "fixture", "symbol_hex": "61"}])["endpoint_set_closed"])

    def test_mir_generated_markers_must_match_bound_source_lines(self):
        bound = {role: {"source_line": line} for role, line in {
            "handler-poll": 474, "runtime-poll": 285,
            "blocking-worker": 306, "ready-callback-worker": 324}.items()}
        parts = {
            "api_composition_projection": {"bounded_normal_mir_function_chain": "pass"},
            "api_handler_poll_projection": {"function": "authorize::{closure#0}(...)"},
            "api_runtime_poll_projection": {"function":
                "<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}(...)"},
            "api_worker_projection": {
                "function": "worker(_1: {closure@src/lib.rs:306:50: 306:57})",
                "v10_checked_function":
                    "inner(_1: {closure@src/lib.rs:324:57: 324:59})",
                "normal_mir_result_provenance": "pass"},
            "api_handler_constructor_projection": {"function": "handler-ctor"},
            "api_runtime_constructor_projection": {"function": "runtime-ctor"},
        }
        def selected_body(_mir, name):
            line = 474 if name == "handler-ctor" else 285
            return name, {"bb0": f"_0 = {{coroutine@src/lib.rs:{line}:1: {line + 1}:2 (#0)}};"}, {}
        with patch.object(v19.v11c.v10, "selected_body", side_effect=selected_body):
            self.assertEqual(v19.checked_mir_join(parts, bound, "fixture")
                             ["source_span_join"], "candidate")
            parts["api_worker_projection"]["function"] = (
                "worker(_1: {closure@src/lib.rs:324:50: 324:57})")
            with self.assertRaisesRegex(ValueError, "blocking-worker MIR/LLVM source line changed"):
                v19.checked_mir_join(parts, bound, "fixture")
            parts["api_worker_projection"]["function"] = (
                "worker(_1: {closure@src/lib.rs:306:50: 306:57})")
            def shifted_runtime(_mir, name):
                line = 474 if name == "handler-ctor" else 306
                return name, {"bb0": f"_0 = {{coroutine@src/lib.rs:{line}:1: {line + 1}:2 (#0)}};"}, {}
            with patch.object(v19.v11c.v10, "selected_body", side_effect=shifted_runtime):
                with self.assertRaisesRegex(ValueError, "runtime-poll MIR/LLVM source line changed"):
                    v19.checked_mir_join(parts, bound, "fixture")


if __name__ == "__main__":
    unittest.main()
