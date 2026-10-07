#!/usr/bin/env python3
"""Candidate same-build API callback -> admission specialization handoff.

An exact LLVM symbol reference is only a linker candidate. This verifier does
not turn the MIR normal-path argument into an all-path or runtime guarantee.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def module(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


v24 = module("auth_v24_for_v25", "auth-v4b-origin-effect-target-v24.py")
v9 = module("auth_v9_for_v25", "auth-v4b-intercrate-graph-v9.py")
API = v24.v19.API_MANIFEST
ADMISSION = v9.ADMISSION
AUTHORITY = v9.AUTHORITY
EXTRA = "normal_mir_handoff"


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def decoded(symbol: str) -> str:
    require(isinstance(symbol, str), "LLVM symbol identity absent")
    try:
        return bytes.fromhex(symbol).decode("ascii")
    except (ValueError, UnicodeDecodeError) as error:
        raise ValueError("LLVM symbol identity malformed") from error


def inspect_same_build(root_id: str, mir: dict, llvm: dict, identities: dict) -> dict:
    result = v24.inspect_same_build(root_id, mir, llvm, identities)
    if root_id == "api":
        root = v9.root_handoff(root_id, mir[API])
        admission = v9.v5.admission_handoff(
            mir[ADMISSION], v9.v5.functions(mir[ADMISSION]))
        authority = v9.v8.extract_graph(mir[AUTHORITY])
        v9.v8.require_bounded_pass(authority)
        result[EXTRA] = {
            "root_function": root["function"],
            "root_block": root["block"],
            "root_callback_local": root["callback_local"],
            "admission_function": admission["function"],
            "admission_block": admission["block"],
            "admission_callback_parameter": admission["callback_parameter"],
            "authority_callback_blocks": authority["callback_blocks"],
            "authority_ready_arm": authority["ready_arm"],
            "authority_deny_arm": authority["deny_arm"],
            "mir_sha256": {name: identities[name]["mir_sha256"]
                           for name in (API, ADMISSION, AUTHORITY)},
        }
    return result


def adjudicate(api: dict) -> dict:
    handoff = api[EXTRA]
    selected = api["api_generated_body_join"]["checked_mir_join"]["selected_mir_functions"]
    require(handoff["root_function"] == selected["ready-callback-worker"] and
            handoff["root_block"] and handoff["root_callback_local"] and
            "::with_ready(" in handoff["admission_function"] and
            handoff["admission_block"] and
            handoff["admission_callback_parameter"] == "_3" and
            len(handoff["authority_callback_blocks"]) == 1 and
            handoff["authority_ready_arm"] != handoff["authority_deny_arm"] and
            set(handoff["mir_sha256"]) == {API, ADMISSION, AUTHORITY},
            "same-build normal-MIR handoff identity changed")
    require(all(handoff["mir_sha256"][name] ==
                api["artifacts"][name]["mir_sha256"]
                for name in (API, ADMISSION, AUTHORITY)),
            "normal-MIR handoff sidecar digest changed")
    base = v24.adjudicate_api(api)
    graph = base["origins"]["ready-callback-worker"]["llvm_origin_graph"]
    seed = graph["seed_symbol_hex"]
    immediate = [row for row in graph["edges"] if
                 row["caller_manifest"] == API and row["caller_symbol_hex"] == seed]
    candidates = [row for row in immediate if
                  "22SqliteAdmissionService10with_ready" in
                  decoded(row["target_symbol_hex"]) and
                  "27BinaryAuthorizationDecision" in
                  decoded(row["target_symbol_hex"])]
    require(len(candidates) == 1, "API callback admission LLVM candidate count changed")
    edge = candidates[0]
    require(edge["classification"] == "same-symbol-local-definition-candidate" and
            edge["caller_path"] == "all-direct" and
            edge["edge_certainty"] == "candidate-origin" and
            edge["target_manifest"] == API and edge["opcode"] in {"call", "invoke"} and
            "47auth_foundation_authorization_admission_service" in
            decoded(edge["target_symbol_hex"]),
            "API callback admission LLVM candidate identity changed")
    mir_effects = base["origins"]["ready-callback-worker"]["mir_effects"]
    require(len([row for row in mir_effects if row["target"] ==
                 "SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>"]) == 1,
            "API callback MIR admission call changed")
    return {
        "normal_mir_handoff": handoff,
        "llvm_admission_candidate": {
            "site_id": edge["site_id"], "caller_symbol_hex": seed,
            "target_symbol_hex": edge["target_symbol_hex"],
            "target_manifest": edge["target_manifest"],
            "classification": edge["classification"],
            "edge_certainty": edge["edge_certainty"],
        },
        "same_build_candidate_reconciliation": True,
        "cross_body_handoff_proven": False,
        "all_native_decision_entrypoints_closed": False,
    }


def assemble(build: dict, anchors: list[dict]) -> dict:
    require(set(build.get("root_context_builds", {})) == v24.v22.ROOT_IDS,
            "selected root set changed")
    api = build["root_context_builds"]["api"]
    require(all(EXTRA not in row for root, row in build["root_context_builds"].items()
                if root != "api"), "non-API root acquired API handoff")
    joined = adjudicate(api)
    projected = {**build, "root_context_builds": {
        root: {key: value for key, value in row.items() if key != EXTRA}
        for root, row in build["root_context_builds"].items()}}
    baseline = v24.assemble(projected, anchors)
    return {**baseline,
            "schema_version": "auth-foundation.v4b-llvm-admission-handoff/v25-candidate",
            "api_llvm_admission_handoff": joined,
            "v25_evidence_sha256": v24.v22.digest({
                "v24_evidence_sha256": baseline["v24_evidence_sha256"],
                "api_llvm_admission_handoff": joined}),
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build normal-MIR function-item/READY handoff and one exact-symbol LLVM candidate from the selected API callback to the admission specialization. The LLVM edge is not a resolved execution edge; indirect, unwind, external, async, and other native decision entrypoints remain open."}


def evaluate() -> dict:
    inventory, _ = v24.v19.v7.current_inventory()
    v24.v17.check_source_surface(inventory)
    before = v24.v22.current_sources()
    anchors = v24.v22.bind_sources(before)
    build = v24.v19.v7.evaluate(llvm_inspector=inspect_same_build)
    require(v24.v22.current_sources() == before,
            "selected source drift during V25 capture")
    for row in build["root_context_builds"].values():
        joined = row.pop("llvm_direct_symbol_inspection")
        row.update(joined)
    return assemble(build, anchors)


def main() -> int:
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
        return 0
    except (ValueError, KeyError, AssertionError) as error:
        print(json.dumps({"status": "blocked", "reason": str(error)}, sort_keys=True))
        return 2


if __name__ == "__main__":
    sys.exit(main())
