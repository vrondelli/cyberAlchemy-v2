#!/usr/bin/env python3
"""Candidate READY-decision capability census in four normal compiled roots.

V7 already checks known raw-decision package exclusion, the policy's sole
direct Cargo predecessor, and compiled policy ingress. V27 inventories the
selected pre-READY effect frontier. This layer checks that the only fully
qualified compiled-local MIR reference to the READY decision is the selected
root's function-pointer handoff. rustc may abbreviate another name, so this
does not discover all semantic calls or close indirect/cross-crate effects.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_direct_cut_for_v28", CASE / "auth-v4b-transitive-direct-cut-v27.py")
assert SPEC and SPEC.loader
v27 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v27)
v6, v7 = v27.v6, v27.v7

READY_SYMBOL = "auth_foundation_authorization_ready_decision::authorize"
READY_REFERENCE = re.compile(r"\b" + re.escape(READY_SYMBOL) + r"\b")
POINTER_COERCION = re.compile(
    r"^\s*_\d+ = " + re.escape(READY_SYMBOL) +
    r" as for<[^\n]+ fn\([^\n]+\) -> [^\n]+\(PointerCoercion\([^\n]+\)\);$")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def ready_references(root_id: str, mir: dict[str, str],
                     selected_function: str) -> dict:
    """Reject another fully qualified reference, including in helpers."""
    root_manifest = v6.ROOT_MANIFESTS[root_id]
    require(root_manifest in mir, f"{root_id}: root MIR absent")
    references = []
    for manifest, source in sorted(mir.items()):
        function = None
        for number, line in enumerate(source.splitlines(), 1):
            opened = v6.FUNCTION_START.match(line)
            if opened:
                function = opened.group(1)
            elif line == "}":
                function = None
            matches = list(READY_REFERENCE.finditer(line))
            for _ in matches:
                references.append({"manifest": manifest, "function": function,
                                   "line": number, "text": line.strip()[:240]})
    require(len(references) == 1,
            f"{root_id}: READY decision compiled reference count changed")
    reference = references[0]
    require(reference["manifest"] == root_manifest and
            reference["function"] == selected_function,
            f"{root_id}: READY decision reference outside selected root handoff")
    source_line = mir[root_manifest].splitlines()[reference["line"] - 1]
    require(POINTER_COERCION.fullmatch(source_line) is not None,
            f"{root_id}: READY decision reference is not the selected typed callback")
    return {"selected_root_reference": {key: value for key, value in reference.items()
                                        if key != "text"},
            "compiled_reference_count": 1,
            "claim_limit": "One typed fully qualified READY-decision function-item reference in selected root MIR. rustc name abbreviation may hide other semantic targets; this does not prove callback invocation or exclude indirect/external effects."}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    prior = v27.inspect(root_id, mir, identities)
    require(prior["status"] == "indeterminate" and
            prior["endpoint_set_closed"] is False and
            prior["all_path_ready_dominance"] is False and
            prior["runtime_guarantees_observed"] is False,
            f"{root_id}: predecessor claim changed")
    selected = prior["v26_local_cut"]["stages"]["root"]["function"]
    census = ready_references(root_id, mir, selected)
    require(prior["remaining_open_site_count"] > 0,
            f"{root_id}: pre-READY effect frontier unexpectedly empty")
    return {"status": "indeterminate", "ready_decision_reference": census,
            "v27_remaining_open_site_count": prior["remaining_open_site_count"],
            "v27_resolved_unique_local_direct_edge_count":
                prior["resolved_unique_local_direct_edge_count"],
            "source_mir_sha256": {manifest: row["mir_sha256"]
                                  for manifest, row in sorted(identities.items())},
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build compiled local capability census composed with V27. Known raw-decision package exclusion and sole generated-policy dependency/ingress come from V7. One fully qualified READY-decision function-item reference is accounted for; abbreviated names, indirect, external, Drop, unwind, SQL/FFI, cross-crate execution, request identity, and runtime no-call remain open."}


def evaluate() -> dict:
    build = v7.evaluate(mir_inspector=inspect)
    require(build["status"] == "indeterminate" and
            set(build["root_context_builds"]) == set(v6.ROOT_MANIFESTS) and
            build["endpoint_set_closed"] is False and
            build["all_path_ready_dominance"] is False and
            build["runtime_guarantees_observed"] is False,
            "four-root predecessor claim changed")
    roots = {}
    for root_id, result in sorted(build["root_context_builds"].items()):
        analysis = result["selected_graph_inspection"]
        require(analysis["status"] == "indeterminate" and
                analysis["endpoint_set_closed"] is False and
                analysis["all_path_ready_dominance"] is False and
                analysis["runtime_guarantees_observed"] is False,
                f"{root_id}: capability claim changed")
        roots[root_id] = {
            "ready_decision_reference": analysis["ready_decision_reference"],
            "v27_remaining_open_site_count": analysis["v27_remaining_open_site_count"],
            "source_mir_sha256": analysis["source_mir_sha256"],
            "normal_local_manifest_count": result["local_package_count"],
            "known_raw_decision_absent": result["decision_capability_boundary"][
                "excluded_raw_decision_manifests"],
            "generated_policy_direct_normal_predecessor": result[
                "generated_policy_dependency_boundary"][
                    "generated_policy_direct_normal_predecessor"],
            "root_metadata_sha256": result["metadata_sha256"],
            "root_lock_sha256": result["lock_sha256"],
        }
    return {"schema_version": "auth-foundation.v4b-native-capability-cut/v28-candidate",
            "status": "indeterminate", "selected_roots": roots,
            "source_set_sha256": build["source_set_sha256"],
            "predecessor_sha256": build["predecessor_sha256"],
            "rustc_version_sha256": build["rustc_version_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four root-context local compiler artifacts; known legacy package exclusion, policy capability/ingress, one selected fully qualified READY-decision function-item reference, and a still-open V27 effect frontier. MIR name abbreviation and opaque effects remain open; no all-native-entrypoint no-call or runtime guarantee."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)},
                         sort_keys=True), file=sys.stderr)
        raise SystemExit(1)
