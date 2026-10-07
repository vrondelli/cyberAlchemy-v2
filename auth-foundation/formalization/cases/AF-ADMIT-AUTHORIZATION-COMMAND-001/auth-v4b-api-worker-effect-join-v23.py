#!/usr/bin/env python3
"""Same-build candidate worker/callback effect slices, not path reachability."""

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


v19 = module("auth_v19_for_v23", "auth-v4b-api-generated-body-join-v19.py")
v22 = module("auth_v22_for_v23", "auth-v4b-call-effect-ledger-v22.py")
ROLES = ("blocking-worker", "ready-callback-worker")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def inspect_same_build(root_id: str, mir: dict, llvm: dict, identities: dict) -> dict:
    # Inspectors consume the same in-memory sidecars from one V7 root build.
    result = v22.inspect_same_build(root_id, mir, llvm, identities)
    if root_id == "api":
        result["api_generated_body_join"] = v19.inspect(root_id, mir, llvm, identities)
    return result


def slice_api(api: dict) -> dict:
    joined = api["api_generated_body_join"]
    llvm = api["llvm_direct_symbol_inspection"]["graph"]
    mir = api["selected_graph_inspection"]
    multi = joined["multi_seed_compiled_graph"]
    require(joined["root_id"] == llvm["root_id"] == mir["root_id"] == "api",
            "api: root identity changed")
    require(joined["checked_mir_join"]["source_span_join"] == "candidate" and
            joined["checked_mir_join"]["execution_handoffs_proven"] is False and
            joined["endpoint_set_closed"] is False,
            "api: generated-body claim posture changed")
    require(multi["all_local_llvm_call_like_site_count"] ==
            llvm["all_local_llvm_call_like_site_count"] and
            v22.digest(multi["all_local_llvm_call_like_sites"]) ==
            multi["all_local_llvm_call_like_sites_sha256"] and
            multi["all_local_llvm_call_like_sites_sha256"] ==
            llvm["all_local_llvm_call_like_sites_sha256"] and
            v22.digest(multi["compiled_local_definitions"]) ==
            multi["compiled_local_definitions_sha256"] and
            multi["compiled_local_definitions_sha256"] ==
            llvm["compiled_local_definitions_sha256"],
            "api: V19/V18 LLVM census diverged")
    bound = joined["generated_body_bindings"]
    require(set(bound) == {role for role, _, _ in v19.GENERATED} and
            len({row["symbol_hex"] for row in bound.values()}) == len(bound),
            "api: generated role identity changed")
    source_sha = v22.SOURCE_CONTRACT[v19.API_SOURCE][0]
    definitions = {(row["manifest"], row["symbol_hex"])
                   for row in llvm["compiled_local_definitions"]}
    require(len(definitions) == len(llvm["compiled_local_definitions"]) ==
            llvm["compiled_local_definition_count"] and
            v22.digest(llvm["compiled_local_definitions"]) ==
            llvm["compiled_local_definitions_sha256"],
            "api: LLVM definition census changed")
    functions = joined["checked_mir_join"]["selected_mir_functions"]
    result = {}
    for role in ROLES:
        identity = bound[role]
        require(identity["manifest"] == v19.API_MANIFEST and
                identity["source"] == v19.API_SOURCE and
                identity["source_sha256"] == source_sha and
                (identity["manifest"], identity["symbol_hex"]) in definitions,
                f"api: {role} current-source definition absent")
        function = functions[role]
        require(isinstance(function, str) and function and
                all(function != functions[other] for other in ROLES if other != role),
                f"api: {role} MIR function identity invalid")
        mir_sites = [row for row in mir["blocking_frontier"]
                     if row["manifest"] == v19.API_MANIFEST and row["function"] == function]
        llvm_sites = [row for row in llvm["all_local_llvm_call_like_sites"]
                      if (row["manifest"], row["function_symbol_hex"]) ==
                      (identity["manifest"], identity["symbol_hex"])]
        require(mir_sites and llvm_sites, f"api: {role} effect slice empty")
        result[role] = {
            "source": identity["source"], "source_line": identity["source_line"],
            "source_sha256": source_sha, "mir_function": function,
            "llvm_symbol_hex": identity["symbol_hex"],
            "mir_effect_count": len(mir_sites),
            "mir_effect_site_ids_sha256": v22.digest(sorted(row["site_id"] for row in mir_sites)),
            "mir_effect_classes": v22.class_ledger(mir_sites, "api", "mir", "blocking_reason"),
            "llvm_call_like_count": len(llvm_sites),
            "llvm_call_like_site_ids_sha256": v22.digest(sorted(
                v22.site_identity("api", "llvm", row) for row in llvm_sites)),
            "llvm_call_like_classes": v22.class_ledger(
                llvm_sites, "api", "llvm", "classification"),
            "mir_to_llvm_instruction_bijection": False,
            "body_identity": "source-span-candidate",
        }
    return result


def assemble(build: dict, anchors: list[dict]) -> dict:
    require(set(build.get("root_context_builds", {})) == v22.ROOT_IDS,
            "selected root set changed")
    api = build["root_context_builds"]["api"]
    require(all("api_generated_body_join" not in row for root, row in
                build["root_context_builds"].items() if root != "api"),
            "non-API root acquired API generated-body join")
    slices = slice_api(api)
    joined = api["api_generated_body_join"]
    identity_digest = v22.digest({
        "generated_body_bindings": joined["generated_body_bindings"],
        "checked_mir_join": joined["checked_mir_join"],
        "multi_seed_full_llvm_site_sha256": joined["multi_seed_compiled_graph"]
            ["all_local_llvm_call_like_sites_sha256"],
        "multi_seed_definitions_sha256": joined["multi_seed_compiled_graph"]
            ["compiled_local_definitions_sha256"],
    })
    projected = {**build, "root_context_builds": {
        root: {key: value for key, value in row.items()
               if key != "api_generated_body_join"}
        for root, row in build["root_context_builds"].items()}}
    baseline = v22.assemble(projected, anchors)
    return {**baseline,
            "schema_version": "auth-foundation.v4b-api-worker-effect-join/v23-candidate",
            "api_identity_evidence_sha256": identity_digest,
            "joined_evidence_sha256": v22.digest({
                "root_context_build_sha256": baseline["root_context_build_sha256"],
                "api_identity_evidence_sha256": identity_digest,
                "api_worker_callback_effect_slices": slices}),
            "api_worker_callback_effect_slices": slices,
            "api_cross_body_execution_handoffs_proven": False,
            "claim_limit": "One build per selected root joins V19 source-span candidate closure identities to V22 full MIR/LLVM effect censuses. Worker and READY callback slices are nonempty but separate; no MIR/LLVM instruction bijection, Tokio scheduling proof, all-path reachability, endpoint closure, or runtime guarantee."}


def evaluate() -> dict:
    before = v22.current_sources()
    anchors = v22.bind_sources(before)
    build = v19.v7.evaluate(llvm_inspector=inspect_same_build)
    require(v22.current_sources() == before, "selected source drift during same-build capture")
    for row in build["root_context_builds"].values():
        joined = row.pop("llvm_direct_symbol_inspection")
        row.update(joined)
    return assemble(build, anchors)


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
