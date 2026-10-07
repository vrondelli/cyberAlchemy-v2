#!/usr/bin/env python3
"""Focused controls for name-independent conservative LLVM function graph."""

import importlib.util
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-llvm-function-graph-v18.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_llvm_function_graph_v18", SCRIPT)
assert SPEC and SPEC.loader
v18 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v18)


def definition(manifest, symbol):
    return {"manifest": manifest, "symbol_hex": symbol, "line": 1, "debug_id": None,
            "linkage": "internal"}


def site(manifest, caller, target, classification, opcode="call", line=2):
    return {"manifest": manifest, "function_symbol_hex": caller,
            "target_symbol_hex": target, "classification": classification,
            "opcode": opcode, "line": line}


class LLVMFunctionGraphV18(unittest.TestCase):
    def test_compiled_feature_branch_includes_benign_named_boolean_body(self):
        source = '''
#[no_mangle]
#[inline(never)]
pub extern "C" fn decision() -> bool { true }
#[cfg(feature = "active")]
#[no_mangle]
#[inline(never)]
pub extern "C" fn permitted() -> bool { decision() }
#[cfg(feature = "active")]
#[no_mangle]
pub extern "C" fn entry() -> bool { permitted() }
#[cfg(not(feature = "active"))]
#[no_mangle]
pub extern "C" fn entry() -> bool { decision() }
'''
        toolchain = v18.IMPL.parents[1] / "tools/toolchain/run"
        with tempfile.TemporaryDirectory(prefix="auth-v18-compiled-fixture-") as directory:
            for active in (False, True):
                output = Path(directory) / ("active.ll" if active else "inactive.ll")
                command = [str(toolchain), "rustc", "--edition=2021", "-",
                           "--crate-type=lib", "--emit=llvm-ir", "-Cdebuginfo=2",
                           "-Copt-level=0", "-Ccodegen-units=1", "-o", str(output)]
                if active:
                    command.extend(["--cfg", 'feature="active"'])
                run = subprocess.run(command, input=source, text=True,
                                     capture_output=True, timeout=120, check=False)
                self.assertEqual(run.returncode, 0, run.stderr)
                llvm = output.read_text()
                manifest = "fixture/Cargo.toml"
                base = v18.v13.inspect("fixture", {manifest: ""}, {manifest: llvm},
                                       {manifest: {"llvm_sha256": hashlib.sha256(llvm.encode()).hexdigest()}})
                parsed = v18.v15.definitions({manifest: llvm})
                defs = {symbol: [{**row, "symbol_hex": symbol} for row in rows]
                        for symbol, rows in parsed.items()}
                entry = v18.v13.symbol_hex("@entry")
                permitted = v18.v13.symbol_hex("@permitted")
                decision = v18.v13.symbol_hex("@decision")
                result = v18.graph("fixture", defs, base["sites"],
                                   [defs[entry][0]])
                self.assertEqual(permitted in defs, active)
                candidates = {row["symbol_hex"] for row in
                              result["syntactic_candidate_functions"]}
                edges = {(row["caller_symbol_hex"], row["target_symbol_hex"])
                         for row in result["direct_edges"] + result["candidate_edges"]}
                self.assertEqual(permitted in candidates, active)
                self.assertIn(decision, defs)
                self.assertIn(decision, candidates)
                self.assertIn((permitted, decision) if active else (entry, decision), edges)
                if active:
                    self.assertIn((entry, permitted), edges)
                self.assertFalse(result["endpoint_set_closed"])

    def test_benign_named_decision_body_is_kept_without_suspect_regex(self):
        defs = {"61": [definition("a", "61")],
                "62": [definition("a", "62")],
                "63": [definition("a", "63")]}
        sites = [site("a", "61", "62", "same-module-noninterposable-direct"),
                 site("a", "62", "63", "same-module-noninterposable-direct")]
        result = v18.graph("fixture", defs, sites, [defs["61"][0]])
        self.assertEqual(result["compiled_local_definition_count"], 3)
        self.assertEqual(result["syntactic_same_module_function_count"], 3)
        self.assertEqual(result["direct_edge_count"], 2)
        self.assertFalse(result["endpoint_set_closed"])

    def test_cross_module_and_opaque_edges_do_not_become_certain(self):
        defs = {"61": [definition("a", "61")],
                "62": [definition("b", "62")],
                "63": [definition("b", "63")]}
        sites = [site("a", "61", "62", "same-symbol-local-definition-candidate"),
                 site("b", "62", "63", "same-module-noninterposable-direct"),
                 site("b", "63", None, "indirect", opcode="invoke")]
        result = v18.graph("fixture", defs, sites, [defs["61"][0]])
        self.assertEqual(result["syntactic_same_module_function_count"], 1)
        self.assertEqual(result["syntactic_candidate_function_count"], 3)
        self.assertEqual(result["candidate_edge_count"], 1)
        self.assertEqual({row["classification"] for row in result["traversed_llvm_frontier"]},
                         {"indirect", "unwind-edge-unresolved"})
        self.assertFalse(result["untraversed_definitions_are_unreachable"])

    def test_unseeded_compiled_function_remains_in_universe(self):
        defs = {"61": [definition("a", "61")],
                "62": [definition("a", "62")]}
        result = v18.graph("fixture", defs, [], [defs["61"][0]])
        self.assertEqual(result["compiled_local_definition_count"], 2)
        self.assertEqual(result["syntactic_candidate_function_count"], 1)
        self.assertFalse(result["untraversed_definitions_are_unreachable"])

    def test_unknown_call_class_fails_closed(self):
        defs = {"61": [definition("a", "61")]}
        with self.assertRaisesRegex(ValueError, "unhandled LLVM call class"):
            v18.graph("fixture", defs, [site("a", "61", None, "new-class")],
                      [defs["61"][0]])

    def test_unknown_call_class_in_untraversed_body_fails_closed(self):
        defs = {"61": [definition("a", "61")],
                "62": [definition("a", "62")]}
        with self.assertRaisesRegex(ValueError, "unhandled LLVM call class"):
            v18.graph("fixture", defs, [site("a", "62", None, "new-class")],
                      [defs["61"][0]])

    def test_duplicate_local_definition_identity_fails_closed(self):
        defs = {"61": [definition("a", "61"), definition("a", "61")]}
        with self.assertRaisesRegex(ValueError, "duplicate local definition identity"):
            v18.graph("fixture", defs, [], [defs["61"][0]])

    def test_graph_serialization_is_hash_seed_independent(self):
        source = '''
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("v18_fixture", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
symbols = ["61", "62", "63", "64", "65"]
defs = {symbol: [{"manifest": "a", "symbol_hex": symbol, "line": 1,
                  "debug_id": None, "linkage": "internal"}] for symbol in symbols}
def site(caller, target, classification, line):
    return {"manifest": "a", "function_symbol_hex": caller,
            "target_symbol_hex": target, "classification": classification,
            "opcode": "call", "line": line}
sites = [site("61", "63", "same-module-noninterposable-direct", 1),
         site("62", "64", "same-module-noninterposable-direct", 2),
         site("63", "65", "same-symbol-local-definition-candidate", 3),
         site("64", "65", "same-symbol-local-definition-candidate", 4),
         site("65", None, "indirect", 5)]
graph = module.graph("fixture", defs, sites, [defs["61"][0], defs["62"][0]])
print(json.dumps(graph, sort_keys=True, separators=(",", ":")))
'''
        outputs = []
        for seed in (1, 2, 3, 17, 71):
            run = subprocess.run([sys.executable, "-c", source, str(SCRIPT)],
                                 env={**os.environ, "PYTHONHASHSEED": str(seed)},
                                 capture_output=True, text=True, timeout=30, check=False)
            self.assertEqual(run.returncode, 0, run.stderr)
            outputs.append(run.stdout)
        self.assertEqual(len(set(outputs)), 1)
        graph = json.loads(outputs[0])
        for field in ("direct_edges", "candidate_edges", "traversed_llvm_frontier"):
            rows = graph[field]
            self.assertEqual(rows, sorted(rows, key=lambda row:
                             json.dumps(row, sort_keys=True, separators=(",", ":"))))


if __name__ == "__main__":
    unittest.main()
