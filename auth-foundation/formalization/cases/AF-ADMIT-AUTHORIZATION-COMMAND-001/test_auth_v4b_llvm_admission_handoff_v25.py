#!/usr/bin/env python3
"""Hostile controls for the selected candidate LLVM admission handoff."""

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


v25 = module("auth_v25_test", "auth-v4b-llvm-admission-handoff-v25.py")
v24_test = module("auth_v24_test_for_v25", "test_auth_v4b_origin_effect_target_v24.py")


def fixture():
    api = v24_test.fixture()
    full = api["llvm_direct_symbol_inspection"]["graph"]
    callback = api["api_generated_body_join"]["generated_body_bindings"][
        "ready-callback-worker"]["symbol_hex"]
    name = ("_RINvMs2_CsaqLNEbAuSBX_47auth_foundation_authorization_admission_service"
            "NtB6_22SqliteAdmissionService10with_readyNtCsjg6O6mvWsbc_41"
            "auth_foundation_authorization_state_model27BinaryAuthorizationDecision"
            "ECs3781Av9JDnJ_33auth_foundation_authorization_api")
    target = name.encode().hex()
    full["compiled_local_definitions"].append({"manifest": v25.API,
                                                "symbol_hex": target})
    full["all_local_llvm_call_like_sites"].append({
        "manifest": v25.API, "function_symbol_hex": callback,
        "target_symbol_hex": target,
        "classification": "same-symbol-local-definition-candidate",
        "line": 4, "opcode": "call"})
    full["compiled_local_definition_count"] = len(full["compiled_local_definitions"])
    full["compiled_local_definitions_sha256"] = v25.v24.v22.digest(
        full["compiled_local_definitions"])
    full["all_local_llvm_call_like_site_count"] = len(full["all_local_llvm_call_like_sites"])
    full["all_local_llvm_call_like_sites_sha256"] = v25.v24.v22.digest(
        full["all_local_llvm_call_like_sites"])
    multi = api["api_generated_body_join"]["multi_seed_compiled_graph"]
    import copy
    multi["compiled_local_definitions"] = copy.deepcopy(full["compiled_local_definitions"])
    multi["compiled_local_definitions_sha256"] = full["compiled_local_definitions_sha256"]
    multi["all_local_llvm_call_like_sites"] = copy.deepcopy(full["all_local_llvm_call_like_sites"])
    multi["all_local_llvm_call_like_site_count"] = full["all_local_llvm_call_like_site_count"]
    multi["all_local_llvm_call_like_sites_sha256"] = full["all_local_llvm_call_like_sites_sha256"]
    api["policy_symbol_inspection"]["symbol_census"] = v25.v24.v17.census_callers(
        full["all_local_llvm_call_like_sites"],
        api["policy_symbol_inspection"]["policy_bindings"])
    api["policy_symbol_inspection"]["llvm_call_like_site_count"] = len(
        full["all_local_llvm_call_like_sites"])
    effects = api["selected_graph_inspection"]["blocking_frontier"]
    for row in effects:
        if row["function"] == "callback-mir":
            row["target"] = "SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>"
    api[v25.EXTRA] = {
        "root_function": "callback-mir", "root_block": "bb0",
        "root_callback_local": "_7", "admission_function": "SqliteAdmissionService::with_ready(",
        "admission_block": "bb4", "admission_callback_parameter": "_3",
        "authority_callback_blocks": ["bb8"], "authority_ready_arm": "bb7",
        "authority_deny_arm": "bb9",
        "mir_sha256": {name: "a" * 64 for name in (v25.API, v25.ADMISSION,
                                                 v25.AUTHORITY)},
    }
    api["artifacts"] = {name: {"mir_sha256": "a" * 64}
                        for name in (v25.API, v25.ADMISSION, v25.AUTHORITY)}
    return api


def rehash_llvm(api):
    full = api["llvm_direct_symbol_inspection"]["graph"]
    sites = full["all_local_llvm_call_like_sites"]
    full["all_local_llvm_call_like_sites_sha256"] = v25.v24.v22.digest(sites)
    multi = api["api_generated_body_join"]["multi_seed_compiled_graph"]
    import copy
    multi["all_local_llvm_call_like_sites"] = copy.deepcopy(sites)
    multi["all_local_llvm_call_like_sites_sha256"] = full["all_local_llvm_call_like_sites_sha256"]
    api["policy_symbol_inspection"]["symbol_census"] = v25.v24.v17.census_callers(
        sites, api["policy_symbol_inspection"]["policy_bindings"])


def substitute_llvm_target(api):
    full = api["llvm_direct_symbol_inspection"]["graph"]
    old = full["all_local_llvm_call_like_sites"][-1]["target_symbol_hex"]
    new = bytes.fromhex(old).decode().replace("10with_ready", "10other_call").encode().hex()
    full["all_local_llvm_call_like_sites"][-1]["target_symbol_hex"] = new
    for row in full["compiled_local_definitions"]:
        if row["symbol_hex"] == old:
            row["symbol_hex"] = new
    full["compiled_local_definitions_sha256"] = v25.v24.v22.digest(
        full["compiled_local_definitions"])
    multi = api["api_generated_body_join"]["multi_seed_compiled_graph"]
    import copy
    multi["compiled_local_definitions"] = copy.deepcopy(full["compiled_local_definitions"])
    multi["compiled_local_definitions_sha256"] = full["compiled_local_definitions_sha256"]
    rehash_llvm(api)


class LlvmAdmissionHandoffV25(unittest.TestCase):
    def test_candidate_is_not_promoted_to_execution_proof(self):
        result = v25.adjudicate(fixture())
        self.assertTrue(result["same_build_candidate_reconciliation"])
        self.assertFalse(result["cross_body_handoff_proven"])
        self.assertFalse(result["all_native_decision_entrypoints_closed"])
        self.assertEqual(result["llvm_admission_candidate"]["edge_certainty"],
                         "candidate-origin")

    def test_mutations_fail_closed(self):
        cases = [
            (lambda a: a[v25.EXTRA].update(root_function="wrong"),
             "normal-MIR handoff identity"),
            (lambda a: a[v25.EXTRA].update(admission_callback_parameter="_4"),
             "normal-MIR handoff identity"),
            (lambda a: a[v25.EXTRA].update(authority_callback_blocks=[]),
             "normal-MIR handoff identity"),
            (lambda a: a[v25.EXTRA]["mir_sha256"].update({v25.API: "b" * 64}),
             "normal-MIR handoff sidecar digest"),
            (lambda a: a["selected_graph_inspection"]["blocking_frontier"][1]
             .update(target="other"), "callback MIR admission call"),
            (lambda a: (a["llvm_direct_symbol_inspection"]["graph"]
             ["all_local_llvm_call_like_sites"][-1].update(classification="indirect"),
             rehash_llvm(a)), "API callback admission LLVM candidate count"),
            (substitute_llvm_target, "API callback admission LLVM candidate count"),
        ]
        for mutate, reason in cases:
            with self.subTest(reason=reason):
                api = fixture()
                mutate(api)
                with self.assertRaisesRegex(ValueError, reason):
                    v25.adjudicate(api)


if __name__ == "__main__":
    unittest.main()
