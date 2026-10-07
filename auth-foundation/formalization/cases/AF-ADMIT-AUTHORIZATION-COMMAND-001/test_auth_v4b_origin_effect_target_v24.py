#!/usr/bin/env python3
"""Hostile controls for origin-specific path certainty and target binding."""

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


v24 = module("auth_v24_test", "auth-v4b-origin-effect-target-v24.py")
v23_test = module("auth_v23_test_for_v24", "test_auth_v4b_api_worker_effect_join_v23.py")


def fixture():
    api = v23_test.fixture()
    full = api["llvm_direct_symbol_inspection"]["graph"]
    bound = api["api_generated_body_join"]["generated_body_bindings"]
    worker = bound["blocking-worker"]["symbol_hex"]
    callback = bound["ready-callback-worker"]["symbol_hex"]
    policy = {name: {"symbol_hex": "70" + name.encode().hex(),
                     "manifest": v24.v17.POLICY_MANIFEST, "source_line": index}
              for index, name in enumerate(v24.v17.POLICY_CALLABLES, 1)}
    ready = {"endpoint_id": "ready-decision",
             "manifest": v24.v17.v15.ENDPOINTS["ready-decision"][0],
             "symbol_hex": "7265616479"}
    definitions = full["compiled_local_definitions"] + [
        {"manifest": row["manifest"], "symbol_hex": row["symbol_hex"]}
        for row in policy.values()] + [{"manifest": ready["manifest"],
                                        "symbol_hex": ready["symbol_hex"]}]
    def site(manifest, caller, target, classification, line, opcode="call"):
        return {"manifest": manifest, "function_symbol_hex": caller,
                "target_symbol_hex": target, "classification": classification,
                "line": line, "opcode": opcode}
    sites = [
        site(v24.v19.API_MANIFEST, worker, policy["authorize"]["symbol_hex"],
             "same-symbol-local-definition-candidate", 1),
        site(v24.v19.API_MANIFEST, callback, None, "indirect", 2, "invoke"),
        site(v24.v17.POLICY_MANIFEST, policy["authorize"]["symbol_hex"],
             policy["allow_iff"]["symbol_hex"],
             "same-module-noninterposable-direct", 3),
    ]
    full.update({"compiled_local_definitions": definitions,
                 "compiled_local_definition_count": len(definitions),
                 "compiled_local_definitions_sha256": v24.v22.digest(definitions),
                 "all_local_llvm_call_like_sites": sites,
                 "all_local_llvm_call_like_site_count": len(sites),
                 "all_local_llvm_call_like_sites_sha256": v24.v22.digest(sites)})
    multi = api["api_generated_body_join"]["multi_seed_compiled_graph"]
    multi.update({"compiled_local_definitions": copy.deepcopy(definitions),
                  "compiled_local_definitions_sha256": v24.v22.digest(definitions),
                  "all_local_llvm_call_like_sites": copy.deepcopy(sites),
                  "all_local_llvm_call_like_site_count": len(sites),
                  "all_local_llvm_call_like_sites_sha256": v24.v22.digest(sites)})
    api["policy_symbol_inspection"] = {
        "root_id": "api", "policy_bindings": policy,
        "symbol_census": v24.v17.census_callers(copy.deepcopy(sites), policy),
        "llvm_call_like_site_count": len(sites),
    }
    api["ready_decision_binding"] = ready
    api["decision_shape_inspection"] = {
        "root_id": "api", "role_counts": {"api-blocking-worker-carrier": 1},
        "semantic_endpoint_roles_closed": False,
    }
    return api


class OriginEffectTargetV24(unittest.TestCase):
    def test_candidate_prefix_cannot_launder_direct_descendant(self):
        api = fixture()
        result = v24.adjudicate_api(api)
        worker = result["origins"]["blocking-worker"]["llvm_origin_graph"]
        callback = result["origins"]["ready-callback-worker"]["llvm_origin_graph"]
        self.assertEqual(worker["definite_local_definition_count"], 1)
        self.assertEqual(worker["possible_local_definition_count"], 3)
        self.assertTrue(all(row["edge_certainty"] == "candidate-origin"
                            for row in worker["edges"]))
        self.assertEqual(worker["protected_exact_symbol_references"][0]
                         ["caller_path"], "all-direct")
        self.assertEqual({row["frontier_reason"] for row in callback["frontiers"]},
                         {"indirect", "unwind-edge-unresolved"})
        self.assertFalse(result["semantic_endpoint_roles_closed"])
        self.assertEqual(len(result["origins"]["blocking-worker"]["mir_effects"]), 1)

    def test_site_and_binding_drift_fail_closed(self):
        cases = [
            (lambda a: a["policy_symbol_inspection"]["symbol_census"]["callables"]
             ["authorize"]["outside_policy_exact_symbol_sites"].clear(),
             "caller-site set diverged"),
            (lambda a: a["policy_symbol_inspection"]["symbol_census"]["callables"]
             ["authorize"]["outside_policy_exact_symbol_sites"][0]
             .update(classification="indirect"), "caller-site set diverged"),
            (lambda a: a["policy_symbol_inspection"]["symbol_census"]["callables"]
             ["authorize"]["outside_policy_exact_symbol_sites"][0]
             .update(target_symbol_hex="another"), "caller-site set diverged"),
            (lambda a: a["policy_symbol_inspection"]["policy_bindings"]
             ["authorize"].update(symbol_hex="missing"), "target identity changed"),
            (lambda a: a["ready_decision_binding"].update(symbol_hex="missing"),
             "READY decision target identity changed"),
            (lambda a: a["llvm_direct_symbol_inspection"]["graph"]
             ["all_local_llvm_call_like_sites"][0].update(target_symbol_hex="missing"),
             "full LLVM site census diverged"),
        ]
        for mutate, reason in cases:
            with self.subTest(reason=reason):
                api = fixture()
                mutate(api)
                with self.assertRaisesRegex(ValueError, reason):
                    v24.adjudicate_api(api)

    def test_direct_mispromotion_and_missing_target_fail_closed(self):
        api = fixture()
        targets = v24.source_bound_targets(api)
        full = api["llvm_direct_symbol_inspection"]["graph"]
        full["all_local_llvm_call_like_sites"][0]["classification"] = (
            "same-module-noninterposable-direct")
        full["all_local_llvm_call_like_sites_sha256"] = v24.v22.digest(
            full["all_local_llvm_call_like_sites"])
        with self.assertRaisesRegex(ValueError, "direct target not unique same-module"):
            v24.origin_walk("api", api["api_generated_body_join"]
                            ["generated_body_bindings"]["blocking-worker"], full, targets)


if __name__ == "__main__":
    unittest.main()
