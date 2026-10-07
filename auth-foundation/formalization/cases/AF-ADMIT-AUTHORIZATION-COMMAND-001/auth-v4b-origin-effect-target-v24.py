#!/usr/bin/env python3
"""Candidate same-build, origin-specific Auth effect/target adjudication.

Definite means a chain of same-module noninterposable LLVM calls from the
selected closure seed. It does not imply public-request or runtime reachability.
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


v23 = module("auth_v23_for_v24", "auth-v4b-api-worker-effect-join-v23.py")
v17 = module("auth_v17_for_v24", "auth-v4b-policy-callable-symbol-v17.py")
v20 = module("auth_v20_for_v24", "auth-v4b-compiled-decision-body-v20.py")
v22, v19, v18 = v23.v22, v23.v19, v23.v19.v18
EXTRA = ("policy_symbol_inspection", "decision_shape_inspection", "ready_decision_binding")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def call_site_row(row: dict) -> tuple:
    return (row["manifest"], row["function_symbol_hex"], row["line"],
            row["opcode"], row["target_symbol_hex"], row["classification"])


def inspect_same_build(root_id: str, mir: dict, llvm: dict, identities: dict) -> dict:
    result = v23.inspect_same_build(root_id, mir, llvm, identities)
    result["policy_symbol_inspection"] = v17.inspect(root_id, mir, llvm, identities)
    result["decision_shape_inspection"] = v20.inspect(root_id, mir, identities)
    if root_id == "api":
        definitions = v17.v15.definitions(llvm)
        result["ready_decision_binding"] = v17.v15.bind_endpoint(
            "ready-decision", llvm, definitions)
    return result


def source_bound_targets(api: dict) -> dict[str, dict]:
    full = api["llvm_direct_symbol_inspection"]["graph"]
    sites = full["all_local_llvm_call_like_sites"]
    definitions = full["compiled_local_definitions"]
    policy = api["policy_symbol_inspection"]
    require(policy["root_id"] == "api" and
            policy["llvm_call_like_site_count"] == len(sites) and
            len(sites) == full["all_local_llvm_call_like_site_count"] and
            v22.digest(sites) == full["all_local_llvm_call_like_sites_sha256"],
            "api: V17/V23 full LLVM site census diverged")
    bindings = policy["policy_bindings"]
    require(set(bindings) == set(v17.POLICY_CALLABLES),
            "api: protected policy binding set changed")
    ready = api["ready_decision_binding"]
    require(ready["endpoint_id"] == "ready-decision" and
            ready["manifest"] == v17.v15.ENDPOINTS["ready-decision"][0],
            "api: READY decision binding changed")
    identities = {(row["manifest"], row["symbol_hex"]) for row in definitions}
    require(len(identities) == len(definitions), "api: duplicate LLVM definition identity")
    targets = {}
    for name, binding in sorted(bindings.items()):
        symbol = binding["symbol_hex"]
        require(binding["manifest"] == v17.POLICY_MANIFEST and
                (binding["manifest"], symbol) in identities and
                symbol not in targets,
                f"api: policy target identity changed: {name}")
        expected = sorted(call_site_row(row) for row in sites
                          if row["target_symbol_hex"] == symbol)
        observed_rows = policy["symbol_census"]["callables"][name]
        observed = sorted(call_site_row(row) for row in
                          observed_rows["internal_exact_symbol_sites"] +
                          observed_rows["outside_policy_exact_symbol_sites"])
        require(observed == expected,
                f"api: V17 caller-site set diverged: {name}")
        targets[symbol] = {"role": "protected-policy:" + name,
                           "manifest": binding["manifest"]}
    require(ready["symbol_hex"] not in targets and
            (ready["manifest"], ready["symbol_hex"]) in identities,
            "api: READY decision target identity changed")
    targets[ready["symbol_hex"]] = {"role": "ready-decision",
                                     "manifest": ready["manifest"]}
    return targets


def origin_walk(root_id: str, seed: dict, full: dict, targets: dict[str, dict]) -> dict:
    """Walk only exact local definitions, retaining candidate-prefix state."""
    definitions = full["compiled_local_definitions"]
    by_key = {(row["manifest"], row["symbol_hex"]): row for row in definitions}
    require(len(by_key) == len(definitions), "duplicate local definition identity")
    by_symbol = {}
    for key in by_key:
        by_symbol.setdefault(key[1], []).append(key)
    seed_key = (seed["manifest"], seed["symbol_hex"])
    require(seed_key in by_key, "origin seed definition missing")
    sites = full["all_local_llvm_call_like_sites"]
    require(len(sites) == full["all_local_llvm_call_like_site_count"] and
            v22.digest(sites) == full["all_local_llvm_call_like_sites_sha256"],
            "origin full-site census changed")
    by_caller = {}
    for site in sites:
        caller = (site["manifest"], site["function_symbol_hex"])
        require(caller in by_key, "origin call site without local definition")
        by_caller.setdefault(caller, []).append(site)
    pending = [(seed_key, False)]
    seen = set(pending)
    edges, frontiers, target_references = [], [], []
    while pending:
        caller, candidate_prefix = pending.pop()
        for site in by_caller.get(caller, []):
            site_id = v22.site_identity(root_id, "llvm", site)
            classification = site["classification"]
            target_symbol = site["target_symbol_hex"]
            target_defs = by_symbol.get(target_symbol, [])
            row = {"site_id": site_id, "caller_manifest": caller[0],
                   "caller_symbol_hex": caller[1], "site_line": site["line"],
                   "opcode": site["opcode"], "classification": classification,
                   "caller_path": "candidate-prefix" if candidate_prefix else "all-direct",
                   "target_symbol_hex": target_symbol,
                   "protected_target_role": targets.get(target_symbol, {}).get("role")}
            if classification == "same-module-noninterposable-direct":
                require(len(target_defs) == 1 and target_defs[0][0] == caller[0],
                        "origin direct target not unique same-module")
                next_candidate = candidate_prefix
            elif classification == "same-symbol-local-definition-candidate":
                require(len(target_defs) == 1,
                        "origin candidate target not unique local definition")
                next_candidate = True
            else:
                require(classification in v18.OPAQUE,
                        "origin unknown LLVM call classification")
                frontiers.append({**row, "frontier_reason": classification})
                next_candidate = None
            if next_candidate is not None:
                target_key = target_defs[0]
                edges.append({**row, "target_manifest": target_key[0],
                              "edge_certainty": "all-direct-local" if
                              not next_candidate else "candidate-origin"})
                state = (target_key, next_candidate)
                if state not in seen:
                    seen.add(state)
                    pending.append(state)
            if row["protected_target_role"] is not None:
                target_references.append(row)
            if site["opcode"] == "invoke":
                frontiers.append({**row, "frontier_reason": "unwind-edge-unresolved"})
    key = lambda row: json.dumps(row, sort_keys=True, separators=(",", ":"))
    edges.sort(key=key)
    frontiers.sort(key=key)
    target_references.sort(key=key)
    # Check the two-state walk against V18's conservative node universes.
    comparison = v18.graph(root_id, by_symbol_to_definitions(by_key), sites, [seed])
    definite = {(key[0], key[1]) for key, uncertain in seen if not uncertain}
    possible = {key for key, _ in seen}
    require(definite == {(row["manifest"], row["symbol_hex"]) for row in
                         comparison["syntactic_same_module_functions"]} and
            possible == {(row["manifest"], row["symbol_hex"]) for row in
                         comparison["syntactic_candidate_functions"]},
            "origin path-state traversal diverged from V18 graph")
    return {"seed_manifest": seed_key[0], "seed_symbol_hex": seed_key[1],
            "definite_local_definition_count": len(definite),
            "possible_local_definition_count": len(possible),
            "candidate_prefix_state_count": sum(uncertain for _, uncertain in seen),
            "edges": edges, "frontiers": frontiers,
            "protected_exact_symbol_references": target_references,
            "cross_body_handoff_proven": False,
            "opaque_targets_closed": False}


def by_symbol_to_definitions(by_key: dict) -> dict:
    result = {}
    for (manifest, symbol), row in by_key.items():
        result.setdefault(symbol, []).append(row)
    return result


def adjudicate_api(api: dict) -> dict:
    slices = v23.slice_api(api)
    targets = source_bound_targets(api)
    full = api["llvm_direct_symbol_inspection"]["graph"]
    bound = api["api_generated_body_join"]["generated_body_bindings"]
    mir = api["selected_graph_inspection"]
    functions = api["api_generated_body_join"]["checked_mir_join"]["selected_mir_functions"]
    shape = api["decision_shape_inspection"]
    require(shape["root_id"] == "api" and
            shape["semantic_endpoint_roles_closed"] is False,
            "api: V20 decision-shape posture changed")
    origins = {}
    for role in v23.ROLES:
        llvm = origin_walk("api", bound[role], full, targets)
        mir_sites = [row for row in mir["blocking_frontier"] if
                     row["manifest"] == v19.API_MANIFEST and
                     row["function"] == functions[role]]
        require(len(mir_sites) == slices[role]["mir_effect_count"],
                f"api: {role} MIR site slice changed")
        origins[role] = {
            "llvm_origin_graph": llvm,
            "mir_effects": [{"site_id": row["site_id"],
                             "class": row["class"], "blocking_reason": row["blocking_reason"],
                             "target": row["target"], "unwind": row["unwind"],
                             "unwind_remains_open": row["unwind_remains_open"]}
                            for row in mir_sites],
            "mir_effects_closed": False,
        }
    return {"origins": origins,
            "protected_target_roles": sorted(row["role"] for row in targets.values()),
            "decision_shape_role_counts": shape["role_counts"],
            "semantic_endpoint_roles_closed": False}


def assemble(build: dict, anchors: list[dict]) -> dict:
    require(set(build.get("root_context_builds", {})) == v22.ROOT_IDS,
            "selected root set changed")
    api = build["root_context_builds"]["api"]
    adjudicated = adjudicate_api(api)
    for root, row in build["root_context_builds"].items():
        require(row["policy_symbol_inspection"]["root_id"] == root and
                row["decision_shape_inspection"]["root_id"] == root,
                f"{root}: policy/decision inspector root mismatch")
        if root != "api":
            require("ready_decision_binding" not in row,
                    "non-API root acquired API READY binding")
    projected = {**build, "root_context_builds": {
        root: {key: value for key, value in row.items() if key not in EXTRA}
        for root, row in build["root_context_builds"].items()}}
    baseline = v23.assemble(projected, anchors)
    return {**baseline,
            "schema_version": "auth-foundation.v4b-origin-effect-target/v24-candidate",
            "api_origin_effect_target": adjudicated,
            "v24_evidence_sha256": v22.digest({
                "v23_joined_evidence_sha256": baseline["joined_evidence_sha256"],
                "api_origin_effect_target": adjudicated}),
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build worker and callback origins retain all-direct versus candidate-prefix local call paths, reconcile V17 protected exact-symbol caller sites, and expose V12 MIR effects. Opaque and unwind effects remain open; source-bound target identity is not public-root reachability, endpoint closure, all-path READY dominance, or runtime proof."}


def evaluate() -> dict:
    inventory, _ = v19.v7.current_inventory()
    v17.check_source_surface(inventory)
    before = v22.current_sources()
    anchors = v22.bind_sources(before)
    build = v19.v7.evaluate(llvm_inspector=inspect_same_build)
    require(v22.current_sources() == before, "selected source drift during V24 capture")
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
