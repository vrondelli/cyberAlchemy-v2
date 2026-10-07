#!/usr/bin/env python3
"""Candidate same-artifact direct-call expansion of the V26 pre-READY cut.

Only a uniquely matching compiled MIR function in the caller's own package is
expanded. A resolved call site is not a resolved effect: its callee's reachable
terminators are added to the open frontier. Cross-crate handoffs, repeated or
recursive targets, indirect calls, Drop, SQL, FFI, and unwind-continuation
effects remain open. This is not an all-path or runtime no-call proof.
"""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent


def module(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


v26 = module("auth_v4b_pre_ready_cut_for_v27", "auth-v4b-pre-ready-effect-cut-v26.py")
v7 = v26.v7
v9 = v26.v9
v5 = v26.v5
v6 = v26.v6


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def exact_local_target(target: str, functions: dict[str, str]) -> str | None:
    """Reject partial, overloaded, or instance-suffixed name guesses."""
    matches = [name for name in functions if name.split("(", 1)[0] == target]
    return matches[0] if len(matches) == 1 else None


def analyze_section(stage: str, mir: str, selected_function: str,
                    selected_cut: dict) -> dict:
    functions = v5.functions(mir)
    require(selected_function in functions and
            selected_cut["function"] == selected_function,
            f"{stage}: selected compiled function mismatch")
    queue = [selected_function]
    seen: set[str] = set()
    cuts = {selected_function: selected_cut}
    resolved: list[dict] = []
    repeated: list[dict] = []
    open_rows: list[dict] = []
    while queue:
        name = queue.pop(0)
        if name in seen:
            continue
        seen.add(name)
        cut = cuts[name]
        for row in cut["effect_sites"]:
            if row["classification"] != "open-direct-static":
                if row["classification"].startswith("open-") or row["classification"] == "selected-handoff":
                    open_rows.append({"function": name, "block": row["block"],
                                      "target": row["target"],
                                      "classification": row["classification"]})
                continue
            target = exact_local_target(row["target"], functions)
            if target is None:
                open_rows.append({"function": name, "block": row["block"],
                                  "target": row["target"],
                                  "classification": "open-unmatched-or-ambiguous-direct"})
                continue
            edge = {"caller": name, "block": row["block"],
                    "target": row["target"], "callee": target}
            if target in cuts:
                # Conservatively leave a repeated edge open. It may be a
                # recursion cycle; proving a shared DAG would need a separate
                # call-return and invocation-count argument.
                repeated.append(edge)
                open_rows.append({"function": name, "block": row["block"],
                                  "target": row["target"],
                                  "classification": "open-repeated-local-target"})
                continue
            cuts[target] = v26.function_cut(stage, target, functions[target])
            resolved.append(edge)
            if row["unwind_open"]:
                open_rows.append({"function": name, "block": row["block"],
                                  "target": row["target"],
                                  "classification": "open-caller-unwind-continuation"})
            queue.append(target)
    baseline = selected_cut["unresolved_site_count"]
    require(len(resolved) <= baseline + sum(
        cut["unresolved_site_count"] for name, cut in cuts.items()
        if name != selected_function), "resolved site count impossible")
    return {"selected_function": selected_function,
            "selected_unresolved_site_count": baseline,
            "resolved_unique_local_direct_edges": resolved,
            "resolved_unique_local_direct_edge_count": len(resolved),
            "expanded_local_functions": sorted(seen - {selected_function}),
            "expanded_local_function_count": len(seen) - 1,
            "repeated_local_edges_left_open": repeated,
            "remaining_open_sites": open_rows,
            "remaining_open_site_count": len(open_rows),
            "claim_limit": "Only unique same-artifact direct MIR targets are expanded. The counted remaining sites are inventory rows, not a closure metric, path count, or invocation count. Caller unwind continuation remains open even when its direct target is resolved. Repeated targets, dynamic targets, Drop, SQL/FFI, and cross-crate handoffs remain open."}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    prior = v26.inspect(root_id, mir, identities)
    root_manifest = v6.ROOT_MANIFESTS[root_id]
    stage_manifests = {"root": root_manifest,
                       "admission": v9.ADMISSION,
                       "authority": v9.AUTHORITY}
    sections = {stage: analyze_section(stage, mir[manifest],
                                       prior["stages"][stage]["function"],
                                       prior["stages"][stage])
                for stage, manifest in stage_manifests.items()}
    return {"status": "indeterminate", "v26_local_cut": prior,
            "direct_expansions": sections,
            "selected_unresolved_site_count": prior["unresolved_local_site_count"],
            "resolved_unique_local_direct_edge_count": sum(
                row["resolved_unique_local_direct_edge_count"]
                for row in sections.values()),
            "expanded_local_function_count": sum(
                row["expanded_local_function_count"] for row in sections.values()),
            "remaining_open_site_count": sum(
                row["remaining_open_site_count"] for row in sections.values()),
            "source_mir_sha256": {manifest: identities[manifest]["mir_sha256"]
                                  for manifest in stage_manifests.values()},
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "V26 cut plus unique same-artifact direct-call expansion in three selected stage artifacts. This does not resolve cross-crate call/return, repeated targets, indirect dispatch, Drop, SQL/FFI, unwind continuation, same-request identity, full native endpoints, or runtime behavior."}


def evaluate_api() -> dict:
    """One current, source- and Cargo-bound API-root build, not four-root replay."""
    before, predecessor_hash = v7.current_inventory()
    source_snapshot = v7.external_data_snapshot()
    root_id = "api"
    manifest = v6.ROOT_MANIFESTS[root_id]
    manifests = sorted(before["selected_root_package_manifests"][root_id])
    with tempfile.TemporaryDirectory(prefix="auth-v4b-api-direct-cut-v27-") as temporary:
        build = v7.capture_root(root_id, manifest, manifests, Path(temporary),
                                before, mir_inspector=inspect)
    after, refreshed_hash = v7.current_inventory()
    require(after == before and refreshed_hash == predecessor_hash and
            v7.external_data_snapshot() == source_snapshot,
            "API source/Cargo or approved SQL data drift during V27 capture")
    result = build["selected_graph_inspection"]
    require(result["status"] == "indeterminate" and
            result["runtime_guarantees_observed"] is False,
            "API-root V27 claim changed")
    return {"schema_version": "auth-foundation.v4b-transitive-direct-cut/v27-candidate",
            "status": "indeterminate", "root_id": root_id,
            "source_set_sha256": before["source_set_sha256"],
            "predecessor_sha256": predecessor_hash,
            "root_metadata_sha256": build["metadata_sha256"],
            "root_lock_sha256": build["lock_sha256"],
            "source_mir_sha256": result["source_mir_sha256"],
            "analysis": result,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Current API-root instrumented Cargo build only. Direct same-artifact local expansion remains a bounded effect inventory, not all-native-entrypoint no-call or observed runtime guarantee."}


def summarize_root(build: dict) -> dict:
    analysis = build["selected_graph_inspection"]
    require(analysis["status"] == "indeterminate" and
            analysis["endpoint_set_closed"] is False and
            analysis["all_path_ready_dominance"] is False and
            analysis["runtime_guarantees_observed"] is False,
            "V27 selected-root claim changed")
    return {"selected_unresolved_site_count": analysis["selected_unresolved_site_count"],
            "resolved_unique_local_direct_edge_count": analysis["resolved_unique_local_direct_edge_count"],
            "expanded_local_function_count": analysis["expanded_local_function_count"],
            "remaining_open_site_count": analysis["remaining_open_site_count"],
            "source_mir_sha256": analysis["source_mir_sha256"],
            "root_metadata_sha256": build["metadata_sha256"],
            "root_lock_sha256": build["lock_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def evaluate_all_roots() -> dict:
    """Replay the same bounded expansion in all four current root contexts."""
    build = v7.evaluate(mir_inspector=inspect)
    require(build["status"] == "indeterminate" and
            build["endpoint_set_closed"] is False and
            build["all_path_ready_dominance"] is False and
            build["runtime_guarantees_observed"] is False and
            set(build["root_context_builds"]) == set(v6.ROOT_MANIFESTS),
            "V27 four-root predecessor claim changed")
    roots = {root_id: summarize_root(build["root_context_builds"][root_id])
             for root_id in sorted(v6.ROOT_MANIFESTS)}
    require(all(row["remaining_open_site_count"] > 0 for row in roots.values()),
            "V27 open frontier unexpectedly empty")
    return {"schema_version": "auth-foundation.v4b-transitive-direct-cut/v27-candidate",
            "status": "indeterminate", "selected_roots": roots,
            "source_set_sha256": build["source_set_sha256"],
            "predecessor_sha256": build["predecessor_sha256"],
            "rustc_version_sha256": build["rustc_version_sha256"],
            "approved_external_data_sha256": build["approved_external_data_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four selected current root-context builds with unique same-artifact direct-call expansion only. Open rows are inventory, not a closure metric or path counts. Cross-crate call/return, repeated and dynamic targets, Drop, SQL/FFI, unwind continuation, exact request/epoch identity, complete native endpoint reachability, and runtime observation remain unproved."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate_all_roots(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)},
                         sort_keys=True), file=sys.stderr)
        raise SystemExit(1)
