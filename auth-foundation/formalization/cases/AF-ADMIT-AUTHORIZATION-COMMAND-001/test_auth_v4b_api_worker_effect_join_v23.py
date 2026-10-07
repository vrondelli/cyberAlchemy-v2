#!/usr/bin/env python3
"""Hostile controls for the bounded same-build API closure/effect join."""

import copy
import importlib.util
import unittest
from pathlib import Path

CASE = Path(__file__).resolve().parent


def module(label, filename):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


v23 = module("auth_v23_test", "auth-v4b-api-worker-effect-join-v23.py")
v22_test = module("auth_v22_test_for_v23", "test_auth_v4b_call_effect_ledger_v22.py")


def fixture():
    api = v22_test.fixture("api")
    graph = api["llvm_direct_symbol_inspection"]["graph"]
    functions = {"blocking-worker": "worker-mir", "ready-callback-worker": "callback-mir"}
    source_sha = v23.v22.SOURCE_CONTRACT[v23.v19.API_SOURCE][0]
    bound = {role: {"role": role, "manifest": v23.v19.API_MANIFEST,
                    "source": v23.v19.API_SOURCE, "source_line": 300 + index,
                    "source_sha256": source_sha, "symbol_hex": f"{index + 1:02x}"}
             for index, (role, _, _) in enumerate(v23.v19.GENERATED)}
    definitions = [{"manifest": v23.v19.API_MANIFEST,
                    "symbol_hex": row["symbol_hex"]} for row in bound.values()]
    sites = [{"manifest": v23.v19.API_MANIFEST,
              "function_symbol_hex": bound[role]["symbol_hex"], "line": index + 1,
              "opcode": "call", "target_symbol_hex": None,
              "classification": "indirect"}
             for index, role in enumerate(v23.ROLES)]
    graph.update({"compiled_local_definitions": definitions,
                  "compiled_local_definition_count": len(definitions),
                  "compiled_local_definitions_sha256": v23.v22.digest(definitions),
                  "all_local_llvm_call_like_sites": sites,
                  "all_local_llvm_call_like_site_count": len(sites),
                  "all_local_llvm_call_like_sites_sha256": v23.v22.digest(sites),
                  "traversed_llvm_frontier": [], "traversed_llvm_frontier_count": 0,
                  "untraversed_local_call_like_site_count": len(sites)})
    effects = []
    for index, role in enumerate(v23.ROLES):
        row = {"manifest": v23.v19.API_MANIFEST, "function": functions[role],
               "block": "bb0", "line": index + 1, "target": "callback",
               "class": "indirect", "unwind": "unwind unreachable"}
        effects.append({**row, "site_id": f"api:{row['manifest']}:{row['function']}:bb0:{row['line']}",
                        "blocking_reason": "indirect", "local_candidates": [],
                        "unwind_remains_open": False})
    mir = api["selected_graph_inspection"]
    mir.update({"blocking_frontier": effects, "blocking_frontier_count": len(effects),
                "compiled_effect_site_count": len(effects),
                "compiled_effect_sites_sha256": v23.v22.digest([
                    {key: row[key] for key in
                     ("manifest", "function", "block", "line", "target", "class", "unwind")}
                    for row in effects])})
    api["api_generated_body_join"] = {
        "root_id": "api", "generated_body_bindings": bound,
        "checked_mir_join": {"source_span_join": "candidate",
                             "execution_handoffs_proven": False,
                             "selected_mir_functions": functions},
        "multi_seed_compiled_graph": {
            "all_local_llvm_call_like_site_count": len(sites),
            "all_local_llvm_call_like_sites": copy.deepcopy(sites),
            "all_local_llvm_call_like_sites_sha256": v23.v22.digest(sites),
            "compiled_local_definitions": copy.deepcopy(definitions),
            "compiled_local_definitions_sha256": v23.v22.digest(definitions)},
        "endpoint_set_closed": False,
    }
    return api


class ApiWorkerEffectJoinV23(unittest.TestCase):
    def test_nonempty_separate_role_slices_and_full_census(self):
        api = fixture()
        slices = v23.slice_api(api)
        self.assertEqual(set(slices), set(v23.ROLES))
        for row in slices.values():
            self.assertEqual(row["mir_effect_count"], 1)
            self.assertEqual(row["llvm_call_like_count"], 1)
            self.assertFalse(row["mir_to_llvm_instruction_bijection"])
        roots = {root: v22_test.fixture(root) for root in v23.v22.ROOT_IDS}
        roots["api"] = api
        build = {"root_context_builds": roots,
                 "instrumentation": "RUSTFLAGS=--emit=mir,llvm-ir,link -Ccodegen-units=1",
                 "source_set_sha256": "b" * 64, "rustc_version_sha256": "c" * 64}
        result = v23.assemble(build, [])
        self.assertEqual(result["status"], "indeterminate")
        self.assertFalse(result["api_cross_body_execution_handoffs_proven"])
        self.assertFalse(result["runtime_guarantees_observed"])
        self.assertEqual(len(result["joined_evidence_sha256"]), 64)
        self.assertIn("api_generated_body_join", api)

    def test_role_and_full_site_drift_fail_closed(self):
        for mutate, reason in [
            (lambda a: a["api_generated_body_join"]["generated_body_bindings"]
             ["blocking-worker"].update(symbol_hex="missing"), "definition absent"),
            (lambda a: a["api_generated_body_join"]["checked_mir_join"]
             ["selected_mir_functions"].update(**{"blocking-worker": "missing"}),
             "effect slice empty"),
            (lambda a: a["api_generated_body_join"]["generated_body_bindings"]
             ["blocking-worker"].update(manifest="other/Cargo.toml"), "definition absent"),
            (lambda a: a["api_generated_body_join"]["multi_seed_compiled_graph"]
             .update(all_local_llvm_call_like_site_count=1), "LLVM census diverged"),
            (lambda a: a["api_generated_body_join"]["multi_seed_compiled_graph"]
             .update(all_local_llvm_call_like_sites_sha256="bad"), "LLVM census diverged"),
            (lambda a: a["selected_graph_inspection"]["blocking_frontier"].pop(),
             "effect slice empty"),
            (lambda a: a["api_generated_body_join"]["generated_body_bindings"]
             ["blocking-worker"].update(symbol_hex=a["api_generated_body_join"]
             ["generated_body_bindings"]["ready-callback-worker"]["symbol_hex"]),
             "role identity changed"),
            (lambda a: a["api_generated_body_join"]["generated_body_bindings"]
             ["blocking-worker"].update(source_sha256="stale"), "definition absent"),
            (lambda a: a["api_generated_body_join"]["checked_mir_join"]
             ["selected_mir_functions"].update(**{"blocking-worker": "callback-mir"}),
             "MIR function identity invalid"),
            (lambda a: a["llvm_direct_symbol_inspection"]["graph"]
             ["all_local_llvm_call_like_sites"].pop(0), "effect slice empty"),
            (lambda a: a["llvm_direct_symbol_inspection"]["graph"]
             ["compiled_local_definitions"].pop(), "LLVM definition census changed"),
        ]:
            with self.subTest(reason=reason):
                api = fixture()
                mutate(api)
                with self.assertRaisesRegex(ValueError, reason):
                    v23.slice_api(api)


if __name__ == "__main__":
    unittest.main()
