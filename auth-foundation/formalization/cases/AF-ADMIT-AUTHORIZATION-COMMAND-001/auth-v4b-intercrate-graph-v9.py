#!/usr/bin/env python3
"""Current four-root normal-MIR READY-to-policy graph, bounded candidate.

This joins compiled typed callsites and normal CFGs from v7's *same root-context*
builds. Unresolved effects and the open native endpoint family remain explicit.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path


CASE = Path(__file__).resolve().parent


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v5 = load("auth_v4b_typed_target_census_v5", CASE / "auth-v4b-typed-target-census-v5.py")
v7 = load("auth_v4b_root_context_census_v7", CASE / "auth-v4b-root-context-census-v7.py")
v8 = load("auth_v4b_ready_cfg_v8", CASE / "auth-v4b-ready-cfg-v8.py")
v6 = v7.v6

ADMISSION = "authorization-admission-service/Cargo.toml"
AUTHORITY = "authorization-ready-authority/Cargo.toml"
DECISION = "authorization-ready-decision/Cargo.toml"
GATE = "command-boundary-runtime-v2/Cargo.toml"
POLICY = "standard-runtime/Cargo.toml"
SELECTED = (ADMISSION, AUTHORITY, DECISION, GATE, POLICY)
NAMED_AUTHORIZE = re.compile(r"(?:^|::)authorize(?:$|::|<)")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def root_handoff(root_id: str, root_mir: str) -> dict:
    """Extract the typed root handoff without rejecting a hostile endpoint yet."""
    items = v5.functions(root_mir)
    require(root_mir.count("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>(") == 1,
            f"{root_id}: with_ready call count")
    require(len(v5.CALLBACK.findall(root_mir)) == 1,
            f"{root_id}: READY callback target count")
    selected = []
    for function, body in items.items():
        for block, content in v5.blocks(body).items():
            bound = v5.CALLBACK.findall(content)
            issued = v5.ISSUE.findall(content)
            if bound or issued:
                selected.append((function, body, block, content, bound, issued))
    require(len(selected) == 1, f"{root_id}: callback/with_ready block ambiguous")
    function, body, block, content, bound, issued = selected[0]
    require(len(bound) == len(issued) == 1 and bound[0] == issued[0][1] and
            len(re.findall(rf"(?m)^\s*{re.escape(bound[0])} =", body)) == 1 and
            content.index("auth_foundation_authorization_ready_decision::authorize as") <
            content.index("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>("),
            f"{root_id}: callback argument identity changed")
    if root_id == "api":
        require("::authorize::{closure#0}::{closure#0}::{closure#0}" in function and
                "debug engine =>" in body and "dyn AuthorizationEngine" not in root_mir,
                "api: normal concrete worker changed")
    else:
        require(function.startswith("evaluate(") or function.startswith("evaluate::{closure#"),
                f"{root_id}: handoff outside evaluate")
    blocks = v5.blocks(body)
    graph = v8.normal_successors(body, blocks)
    require(v8.reachable(graph, "bb0", block), f"{root_id}: with_ready unreachable")
    # One syntactic callsite could still run twice if on a normal CFG cycle.
    require(not any(v8.reachable(graph, successor, block) for successor in graph[block]),
            f"{root_id}: repeated with_ready on one selected function path")
    return {"function": function, "block": block, "callback_local": bound[0],
            "call_result_local": issued[0][0], "graph": graph,
            "parsed_functions": items}


def root_native_calls(root_mir: str, *, broad_stage_guard: bool = False) -> list[dict]:
    """Expose native decision candidates without treating root ingress as policy."""
    rows = []
    for function, body in v5.functions(root_mir).items():
        for block, content in v5.blocks(body).items():
            for line in content.splitlines():
                matched = v6.CALL_TERMINATOR.match(line)
                if matched is None:
                    continue
                target = matched.group(2)
                if (v6.effect_class(target) in ("generated-policy", "decision-endpoint-candidate")
                        or (broad_stage_guard and NAMED_AUTHORIZE.search(target))):
                    rows.append({"function": function, "block": block, "target": target})
    return rows


def selected_stage_native_calls(mir: dict[str, str]) -> list[dict]:
    """Find named native decision calls throughout the selected local stages.

    This is a conservative syntax guard, not endpoint-family or effect closure.
    The one expected generated-policy ingress is checked separately below.
    """
    rows = []
    for manifest in (ADMISSION, AUTHORITY, DECISION, GATE):
        for call in root_native_calls(mir[manifest], broad_stage_guard=True):
            rows.append({"manifest": manifest, **call})
    return rows


def selected_cfg(mir: str, function: str) -> dict[str, list[str]]:
    items = v5.functions(mir)
    require(function in items, f"selected function absent:{function}")
    body = items[function]
    return v8.normal_successors(body, v5.blocks(body))


def stitched_graph(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    root_manifest = v6.ROOT_MANIFESTS[root_id]
    require(set((root_manifest, *SELECTED)) <= set(mir) and
            set(mir) == set(identities), f"{root_id}: selected compiled graph incomplete")
    # Reject an extra named stage entry before handoff-shape checks can mask
    # the direct effect as a local-numbering or signature change.
    stage_native = selected_stage_native_calls(mir)
    require(len(stage_native) == 1 and stage_native[0]["manifest"] == DECISION and
            stage_native[0]["target"] == v6.POLICY,
            f"{root_id}: extra or changed named native decision call in selected stage")
    root = root_handoff(root_id, mir[root_manifest])
    native = root_native_calls(mir[root_manifest])
    admission_info = v5.admission_handoff(mir[ADMISSION], v5.functions(mir[ADMISSION]))
    authority = v8.extract_graph(mir[AUTHORITY])
    authority_verdict = v8.require_bounded_pass(authority)
    gate_eq = v8.check_gate_equality_mir(mir[GATE])
    decision_info = v5.decision_policy(mir[DECISION], v5.functions(mir[DECISION]))
    policy_function, _ = v5.selected(v5.functions(mir[POLICY]), "authorize(")
    require(policy_function.startswith("authorize("), f"{root_id}: generated policy entry changed")

    admission_graph = selected_cfg(mir[ADMISSION], admission_info["function"])
    decision_graph = selected_cfg(mir[DECISION], decision_info["function"])
    policy_blocks = [block for block, content in v5.blocks(
        v5.functions(mir[DECISION])[decision_info["function"]]).items()
        if re.search(r"= " + re.escape(v6.POLICY) + r"\(", content)]
    require(len(policy_blocks) == 1 and
            v8.reachable(decision_graph, "bb0", policy_blocks[0]) and
            not any(v8.reachable(decision_graph, next_block, policy_blocks[0])
                    for next_block in decision_graph[policy_blocks[0]]),
            f"{root_id}: generated policy site missing or repeated")
    expected = [{"manifest": DECISION, "function": decision_info["function"],
                 "block": policy_blocks[0], "target": v6.POLICY}]
    require(stage_native == expected,
            f"{root_id}: extra or changed named native decision call in selected stage")
    require(v8.reachable(admission_graph, "bb0", admission_info["block"]),
            f"{root_id}: authority issuer unreachable")

    components = {"root": root["graph"], "admission": admission_graph,
                  "authority": authority["normal_graph"], "decision": decision_graph}
    graph = {f"{stage}:{node}": [f"{stage}:{next_node}" for next_node in successors]
             for stage, component in components.items()
             for node, successors in component.items()}
    chain = [(f"root:{root['block']}", "admission:bb0"),
             (f"admission:{admission_info['block']}", "authority:bb0"),
             *[(f"authority:{block}", "decision:bb0")
               for block in authority["callback_blocks"]],
             (f"decision:{policy_blocks[0]}", "generated-policy:entry")]
    graph["generated-policy:entry"] = []
    for source, target in chain:
        graph[source].append(target)
    # Any direct native call in the root bypasses the selected READY token.
    # An unselected function's reachability is unresolved, so conservatively
    # attach it to this selected root entry rather than silently discard it.
    for call in native:
        source = (f"root:{call['block']}" if call["function"] == root["function"]
                  else "root:bb0")
        graph[source].append("generated-policy:entry")
    return {"root_id": root_id, "graph": graph, "chain": chain,
            "native_root_calls": native, "root_function": root["function"],
            "selected_stage_native_calls": stage_native,
            "root_handoff_block": root["block"],
            "authority_ready_arm": authority["ready_arm"],
            "authority_deny_arm": authority["deny_arm"],
            "authority_verdict": authority_verdict,
            "gate_equality_function": gate_eq,
            "decision_function": decision_info["function"],
            "policy_function": policy_function,
            "package_mir_sha256": {key: identities[key]["mir_sha256"]
                                   for key in (root_manifest, *SELECTED)}}


def check_stitched_property(extracted: dict) -> dict:
    graph = extracted["graph"]
    entry, endpoint = "root:bb0", "generated-policy:entry"
    ready = f"authority:{extracted['authority_ready_arm']}"
    deny = f"authority:{extracted['authority_deny_arm']}"
    violations = []
    if not v8.reachable(graph, entry, endpoint):
        violations.append("selected-policy-endpoint-unreachable")
    if v8.reachable(graph, entry, endpoint, ready):
        violations.append("policy-endpoint-not-dominated-by-same-ready-arm")
    if v8.reachable(graph, deny, endpoint):
        violations.append("policy-endpoint-reachable-from-gate-deny")
    if extracted["native_root_calls"]:
        violations.append("direct-native-root-entrypoint-outside-ready-token")
    return {"status": "pass" if not violations else "fail", "violations": violations,
            "normal_path_only": True, "complete_native_endpoint_set": False,
            "implicit_and_dynamic_effects_closed": False,
            "allow_output_provenance_closed": False}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    extracted = stitched_graph(root_id, mir, identities)
    verdict = check_stitched_property(extracted)
    require(verdict["status"] == "pass", f"{root_id}: intercrate property failed:{verdict['violations']}")
    graph_sha = sha(json.dumps(extracted["graph"], sort_keys=True,
                               separators=(",", ":")).encode())
    return {"status": "pass", "bounded_property": verdict,
            "root_function": extracted["root_function"],
            "root_handoff_block": extracted["root_handoff_block"],
            "authority_ready_arm": extracted["authority_ready_arm"],
            "authority_deny_arm": extracted["authority_deny_arm"],
            "gate_equality_function": extracted["gate_equality_function"],
            "decision_function": extracted["decision_function"],
            "policy_function": extracted["policy_function"],
            "native_root_calls": extracted["native_root_calls"],
            "selected_stage_native_calls": extracted["selected_stage_native_calls"],
            "intercrate_edges": extracted["chain"],
            "normal_graph_sha256": graph_sha,
            "normal_graph_node_count": len(extracted["graph"]),
            "package_mir_sha256": extracted["package_mir_sha256"]}


def evaluate() -> dict:
    current = v7.evaluate(mir_inspector=inspect)
    require(current["status"] == "indeterminate" and
            current["runtime_guarantees_observed"] is False and
            set(current["root_context_builds"]) == set(v6.ROOT_MANIFESTS),
            "root-context predecessor posture changed")
    return {"schema_version": "auth-foundation.v4b-intercrate-normal-graph/v9-candidate",
            "status": "indeterminate", "root_context_builds": current["root_context_builds"],
            "predecessor_source_set_sha256": current["source_set_sha256"],
            "predecessor_rustc_version_sha256": current["rustc_version_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four pinned root-context normal-MIR graphs connect the selected root with_ready function item through admission and authority READY callback to generated policy. Direct known native calls in root MIR fail. This checks paths to the selected policy call site, not whether every ALLOW output derives from it. Intercrate call-return, hidden effects, dynamic/Drop/SQL/FFI/unwind targets and the full endpoint family remain unclosed."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
