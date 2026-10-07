#!/usr/bin/env python3
"""Hostile controls for the compact same-build Auth call/effect ledger."""

import copy
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-call-effect-ledger-v22.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_call_effect_ledger_v22", SCRIPT)
assert SPEC and SPEC.loader
v22 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v22)


def fixture(root_id="api"):
    sites = [
        {"manifest": "a/Cargo.toml", "function_symbol_hex": "61", "line": 1,
         "opcode": "call", "target_symbol_hex": "62",
         "classification": "same-module-noninterposable-direct"},
        {"manifest": "a/Cargo.toml", "function_symbol_hex": "61", "line": 2,
         "opcode": "invoke", "target_symbol_hex": None, "classification": "indirect"},
    ]
    frontier = {"caller_manifest": "a/Cargo.toml", "caller_symbol_hex": "61",
                "site_line": 2, "opcode": "invoke", "target_symbol_hex": None,
                "classification": "indirect"}
    graph = {"root_id": root_id, "all_local_llvm_call_like_sites": sites,
             "all_local_llvm_call_like_site_count": len(sites),
             "all_local_llvm_call_like_sites_sha256": v22.digest(sites),
             "traversed_llvm_frontier": [frontier],
             "traversed_llvm_frontier_count": 1,
             "untraversed_local_call_like_site_count": 0,
             "compiled_local_definition_count": 2}
    effect_row = {"manifest": "a/Cargo.toml", "function": "caller", "block": "bb0",
                  "line": 1, "target": "callback", "class": "indirect", "unwind": "continue"}
    effect = {**effect_row, "site_id": f"{root_id}:a/Cargo.toml:caller:bb0:1",
              "blocking_reason": "indirect", "local_candidates": [],
              "unwind_remains_open": True}
    mir = {"root_id": root_id, "blocking_frontier": [effect],
           "blocking_frontier_count": 1, "compiled_effect_site_count": 1,
           "compiled_effect_sites_sha256": v22.digest([effect_row])}
    return {"llvm_direct_symbol_inspection": {"graph": graph},
            "selected_graph_inspection": mir}


class CallEffectLedgerV22(unittest.TestCase):
    def test_binds_current_selected_source_anchors(self):
        anchors = v22.bind_sources(v22.current_sources())
        self.assertEqual(len(anchors), 11)
        self.assertEqual(len({(row["source"], row["anchor_sha256"]) for row in anchors}), 11)

    def test_source_drift_and_changed_callback_target_fail(self):
        original = b"service.with_ready(request, authorize_ready_decision);"
        contract = {"bridge.rs": (v22.sha(original), (original.decode(),))}
        self.assertEqual(len(v22.bind_sources({"bridge.rs": original}, contract)), 1)
        altered = original.replace(b"authorize_ready_decision", b"another_decision")
        with self.assertRaisesRegex(ValueError, "selected source drift"):
            v22.bind_sources({"bridge.rs": altered}, contract)
        updated_digest = {"bridge.rs": (v22.sha(altered), (original.decode(),))}
        with self.assertRaisesRegex(ValueError, "anchor missing or duplicate"):
            v22.bind_sources({"bridge.rs": altered}, updated_digest)
        with self.assertRaisesRegex(ValueError, "anchor missing or duplicate"):
            v22.bind_sources({"bridge.rs": original + b"\n" + original},
                              {"bridge.rs": (v22.sha(original + b"\n" + original),
                                             (original.decode(),))})

    def test_same_build_root_join_and_unresolved_classes(self):
        roots = {name: fixture(name) for name in v22.ROOT_IDS}
        build = {"root_context_builds": roots,
                 "instrumentation": "RUSTFLAGS=--emit=mir,llvm-ir,link -Ccodegen-units=1",
                 "source_set_sha256": "b" * 64, "rustc_version_sha256": "c" * 64}
        result = v22.assemble(build, [])
        self.assertEqual(set(result["roots"]), v22.ROOT_IDS)
        self.assertEqual(result["roots"]["api"]["llvm_site_count"], 2)
        self.assertEqual(result["roots"]["api"]["mir_unwind_open_count"], 1)
        self.assertIn("indirect", result["roots"]["api"]["llvm_classes"])
        self.assertFalse(result["endpoint_set_closed"])
        self.assertFalse(result["all_path_ready_dominance"])
        self.assertFalse(result["runtime_guarantees_observed"])
        missing = copy.deepcopy(build)
        del missing["root_context_builds"]["https"]
        with self.assertRaisesRegex(ValueError, "selected root set changed"):
            v22.assemble(missing, [])
        missing_inspection = copy.deepcopy(build)
        del missing_inspection["root_context_builds"]["api"]["selected_graph_inspection"]
        with self.assertRaises(KeyError):
            v22.assemble(missing_inspection, [])
        wrong_instrumentation = copy.deepcopy(build)
        wrong_instrumentation["instrumentation"] = "different-build"
        with self.assertRaisesRegex(ValueError, "same-build MIR/LLVM"):
            v22.assemble(wrong_instrumentation, [])

    def test_missing_duplicate_and_unclassified_sites_fail(self):
        joined = fixture()
        llvm = joined["llvm_direct_symbol_inspection"]
        mir = joined["selected_graph_inspection"]
        self.assertEqual(v22.summarize("api", llvm, mir)["llvm_site_count"], 2)
        missing = copy.deepcopy(llvm)
        missing["graph"]["all_local_llvm_call_like_sites"].pop()
        with self.assertRaisesRegex(ValueError, "LLVM full-site coverage"):
            v22.summarize("api", missing, mir)
        duplicate = copy.deepcopy(llvm)
        rows = duplicate["graph"]["all_local_llvm_call_like_sites"]
        rows.append(copy.deepcopy(rows[0]))
        duplicate["graph"]["all_local_llvm_call_like_site_count"] = len(rows)
        duplicate["graph"]["all_local_llvm_call_like_sites_sha256"] = v22.digest(rows)
        with self.assertRaisesRegex(ValueError, "duplicate LLVM full-site key"):
            v22.summarize("api", duplicate, mir)
        unclassified = copy.deepcopy(llvm)
        unclassified["graph"]["all_local_llvm_call_like_sites"][0]["classification"] = ""
        unclassified["graph"]["all_local_llvm_call_like_sites_sha256"] = v22.digest(
            unclassified["graph"]["all_local_llvm_call_like_sites"])
        with self.assertRaisesRegex(ValueError, "missing llvm class"):
            v22.summarize("api", unclassified, mir)
        missing_effect = copy.deepcopy(mir)
        missing_effect["blocking_frontier"] = []
        with self.assertRaisesRegex(ValueError, "frontier count mismatch"):
            v22.summarize("api", llvm, missing_effect)
        altered_effect = copy.deepcopy(mir)
        altered_effect["blocking_frontier"][0]["target"] = "changed"
        with self.assertRaisesRegex(ValueError, "MIR effect digest mismatch"):
            v22.summarize("api", llvm, altered_effect)
        duplicate_effect = copy.deepcopy(mir)
        duplicate_effect["blocking_frontier"].append(copy.deepcopy(duplicate_effect["blocking_frontier"][0]))
        duplicate_effect["blocking_frontier_count"] = 2
        duplicate_effect["compiled_effect_site_count"] = 2
        original_row = {key: duplicate_effect["blocking_frontier"][0][key]
                        for key in ("manifest", "function", "block", "line", "target", "class", "unwind")}
        duplicate_effect["compiled_effect_sites_sha256"] = v22.digest([original_row, original_row])
        with self.assertRaisesRegex(ValueError, "duplicate mir site identity"):
            v22.summarize("api", llvm, duplicate_effect)
        invalid_unwind = copy.deepcopy(mir)
        invalid_unwind["blocking_frontier"][0]["unwind_remains_open"] = "yes"
        with self.assertRaisesRegex(ValueError, "MIR effect identity/unwind mismatch"):
            v22.summarize("api", llvm, invalid_unwind)
        invalid_frontier = copy.deepcopy(llvm)
        invalid_frontier["graph"]["traversed_llvm_frontier"][0]["site_line"] = 99
        with self.assertRaisesRegex(ValueError, "traversed LLVM frontier"):
            v22.summarize("api", invalid_frontier, mir)


if __name__ == "__main__":
    unittest.main()
