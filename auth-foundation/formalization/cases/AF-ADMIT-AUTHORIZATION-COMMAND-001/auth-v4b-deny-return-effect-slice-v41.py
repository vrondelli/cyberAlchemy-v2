#!/usr/bin/env python3
"""Selected same-build gate-DENY return/effect slice; never an effect closure.

V40 supplies the finite counterfactual witness and same-build Cargo artifacts.
This parser follows the selected normal MIR return locals, while reporting every
local post-return Drop/call and unwind edge as an open effect obligation.
"""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, name: str):
    spec = importlib.util.spec_from_file_location(label, CASE / name)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v40 = load("auth_v40_for_v41", "auth-v4b-normal-gate-deny-v40.py")
v8 = load("auth_v8_for_v41", "auth-v4b-ready-cfg-v8.py")
v26 = load("auth_v26_for_v41", "auth-v4b-pre-ready-effect-cut-v26.py")
v5 = v8.v5
ROOTS = v40.ROOTS
ORIGINAL_INSPECT_MIR = v40.inspect_mir


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def successors(blocks: dict[str, str]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    normal = v8.normal_successors("", blocks)
    full = v26.local_unwind_successors(blocks, normal)
    return normal, full


def reach(graph: dict[str, list[str]], start: str) -> set[str]:
    require(start in graph, "V41 missing MIR start block")
    seen, pending = set(), [start]
    while pending:
        node = pending.pop()
        if node not in seen:
            seen.add(node)
            pending.extend(graph[node])
    return seen


def preserved_return_local(blocks: dict[str, str], normal: dict[str, list[str]],
                           start: str, initial: str, label: str) -> list[str]:
    nodes = reach(normal, start)
    require(blocks[start].count(initial) == 1 and
            len(re.findall(r"(?m)^\s*_0 =", blocks[start])) == 1,
            f"V41 {label} initial return definition changed")
    require(all(not re.search(r"(?m)^\s*_0 =", blocks[node])
                for node in nodes - {start}),
            f"V41 {label} return local overwritten on selected normal path")
    touches = [(node, line.strip()) for node in nodes
               for line in blocks[node].splitlines()
               if re.search(r"\b_0\b", line)]
    require(len(touches) == 1 and touches[0] == (start, initial),
            f"V41 {label} return place touched after selected definition")
    returns = sorted((node for node in nodes
                      if blocks[node].strip().endswith("return;")),
                     key=lambda value: int(value[2:]))
    require(returns, f"V41 {label} normal return absent")
    return returns


def effect_rows(blocks: dict[str, str], normal: dict[str, list[str]],
                full: dict[str, list[str]], start: str) -> dict:
    ordinary = reach(normal, start)
    require(any(blocks[node].strip().endswith("return;") for node in ordinary),
            "V41 selected normal return absent")
    seeds = {edge for node in ordinary for edge in full[node] if edge not in normal[node]}
    cleanup = set().union(*(reach(full, seed) for seed in seeds)) if seeds else set()
    rows = []
    for node in sorted(ordinary | cleanup, key=lambda value: int(value[2:])):
        term = blocks[node].strip().splitlines()[-1].strip()
        kind = ("drop" if term.startswith("drop(") else
                "assert" if term.startswith("assert(") else
                "call" if " -> [" in term and " = " in term else
                "abort" if term == "abort;" else
                "resume" if term == "resume;" else None)
        if kind:
            rows.append({"block": node, "terminator": term,
                         "path": "normal" if node in ordinary else "cleanup",
                         "kind": kind, "effect_status": "open"})
        unwind = re.search(r"\bunwind(?:: (bb\d+)| (continue|unreachable))", term)
        if unwind:
            rows.append({"block": node, "terminator": term,
                         "path": "normal" if node in ordinary else "cleanup",
                         "kind": "unwind-edge", "target": unwind.group(1) or unwind.group(2),
                         "effect_status": "open"})
    return {"normal_blocks": sorted(ordinary, key=lambda value: int(value[2:])),
            "cleanup_blocks": sorted(cleanup, key=lambda value: int(value[2:])),
            "effect_rows": rows, "local_unwind_present": bool(seeds),
            "post_return_effects_closed": False}


def authority_slice(mir: str) -> dict:
    _, body = v5.selected(v5.functions(mir), "with_ready_in_transaction(")
    blocks = v26.compiled_blocks(body)
    normal, full = successors(blocks)
    gate_calls = [(node, re.search(r"(_\d+) = admit_authorization_command\(copy _\d+\)"
                                   r" -> \[return: (bb\d+),", content))
                  for node, content in blocks.items()
                  if "= admit_authorization_command(" in content]
    require(len(gate_calls) == 1 and gate_calls[0][1] is not None,
            "V41 generated gate call ambiguous")
    gate, gate_match = gate_calls[0]
    gate_result, gate_return = gate_match.groups()
    require(len(re.findall(rf"(?m)^\s*{re.escape(gate_result)} =", body)) == 1,
            "V41 gate result rebound")
    comparisons = [(node, match) for node, content in blocks.items()
                   if (match := re.search(
                       r"(_\d+) = <CommandBoundaryDecision as PartialEq>::ne\(move (_\d+), move (_\d+)\)"
                       r" -> \[return: (bb\d+),", content))]
    require(len(comparisons) == 1, "V41 gate result to READY comparison changed")
    compare_block, comparison = comparisons[0]
    lhs, rhs = comparison.group(2), comparison.group(3)
    lhs_defs = [(node, content) for node, content in blocks.items()
                if re.search(rf"(?m)^\s*{re.escape(lhs)} =", content)]
    rhs_defs = [(node, content) for node, content in blocks.items()
                if re.search(rf"(?m)^\s*{re.escape(rhs)} =", content)]
    require(len(lhs_defs) == len(rhs_defs) == 1 and
            re.search(rf"(?m)^\s*{re.escape(lhs)} = &{re.escape(gate_result)};$", lhs_defs[0][1]) and
            (rhs_match := re.search(
                rf"(?m)^\s*{re.escape(rhs)} = const with_ready_in_transaction::[^;]+::promoted\[(\d+)\];$",
                rhs_defs[0][1])) is not None and
            compare_block in reach(normal, lhs_defs[0][0]) and
            compare_block in reach(normal, rhs_defs[0][0]),
            "V41 comparison operands not uniquely derived from gate and READY")
    promoted_index = rhs_match.group(1)
    promoted = re.findall(
        rf"(?ms)^const with_ready_in_transaction::promoted\[{promoted_index}\]: &CommandBoundaryDecision = \{{(.*?)^}}\n",
        mir)
    require(len(promoted) == 1 and promoted[0].count("CommandBoundaryDecision::Ready") == 1,
            "V41 gate comparison constant is not READY")
    branch = comparison.group(4)
    arms = re.search(rf"switchInt\(move {re.escape(comparison.group(1))}\)"
                     r" -> \[0: (bb\d+), otherwise: (bb\d+)\]", blocks[branch])
    require(arms is not None, "V41 gate READY/DENY branch changed")
    ready, deny = arms.groups()
    callbacks = [node for node, content in blocks.items() if "= copy _5(" in content]
    require(len(callbacks) == 1 and gate_return in reach(normal, gate) and
            compare_block in reach(normal, gate_return) and
            branch in reach(normal, compare_block) and
            ready in reach(normal, branch) and
            callbacks[0] in reach(normal, ready),
            "V41 gate comparison or READY callback chain changed")
    require(re.search(r"(?m)^\s*_0 = AdmissionOutcome::<R>::Denied;$", blocks[deny])
            is not None, "V41 gate DENY does not bind authority return local")
    returns = preserved_return_local(
        blocks, normal, deny, "_0 = AdmissionOutcome::<R>::Denied;", "gate DENY")
    require(not reach(normal, deny).intersection(callbacks),
            "V41 gate DENY reaches READY callback")
    require(all("ReadyStateFailed" not in blocks[node] for node in reach(normal, deny)),
            "V41 gate DENY reaches ReadyStateFailed constructor")
    effects = effect_rows(blocks, normal, full, deny)
    return {"gate_block": gate,
            "gate_result_local": gate_result,
            "comparison_block": compare_block, "branch_block": branch,
            "gate_deny_block": deny, "return_local": "_0",
            "gate_deny_normal_return_blocks": returns,
            "gate_deny_return_local_preserved": True,
            "ready_callback_excluded_on_normal_deny_path": True,
            "ready_state_failed_excluded_on_normal_deny_path": True,
            "gate_deny_not_pre_gate_constructor": True, **effects}


def service_transfer(blocks: dict[str, str], body: str | None = None) -> dict:
    calls = [(node, re.search(
        r"(_\d+) = with_ready_in_transaction::<R>\([^\n]+\) -> "
        r"\[return: (bb\d+), unwind: (bb\d+)\]", content))
             for node, content in blocks.items() if "= with_ready_in_transaction::<R>(" in content]
    require(len(calls) == 1 and calls[0][1] is not None,
            "V41 service authority call changed")
    issuer, match = calls[0]
    outcome, finish_block, unwind_block = match.groups()
    require(sum(len(re.findall(rf"(?m)^\s*{re.escape(outcome)} =", content))
                for content in blocks.values()) == 1,
            "V41 authority outcome local rebound in service")
    finish = re.search(r"(_\d+) = EvaluationEpoch::<'_>::finish\([^\n]+\) -> "
                       r"\[return: (bb\d+), unwind: (bb\d+)\]",
                       blocks[finish_block])
    require(finish is not None, "V41 service epoch.finish transfer changed")
    finish_result, branch_block, finish_unwind = finish.groups()
    branch = re.search(rf"(_\d+) = <_?Result<\(\), PortFailure> as Try>::branch\(move {re.escape(finish_result)}\)"
                       r" -> \[return: (bb\d+), unwind: (bb\d+)\]", blocks[branch_block])
    require(branch is not None,
            "V41 epoch.finish result branch changed")
    branch_result, discriminator = branch.group(1), branch.group(2)
    require(sum(len(re.findall(rf"(?m)^\s*{re.escape(branch_result)} =", content))
                for content in blocks.values()) == 1,
            "V41 Try::branch result rebound")
    if body is not None:
        require(re.search(rf"let mut {re.escape(branch_result)}: std::ops::ControlFlow<"
                          r"std::result::Result<std::convert::Infallible, "
                          r"auth_foundation_authorization_state_model::PortFailure>>;", body)
                is not None, "V41 finish Try::branch enum type changed")
    discriminant = re.search(rf"(_\d+) = discriminant\({re.escape(branch_result)}\);",
                             blocks[discriminator])
    require(discriminant is not None, "V41 finish branch discriminant source changed")
    require(sum(len(re.findall(rf"(?m)^\s*{re.escape(discriminant.group(1))} =", content))
                for content in blocks.values()) == 1,
            "V41 finish branch discriminant rebound")
    arms = re.search(rf"switchInt\(move {re.escape(discriminant.group(1))}\)"
                     r" -> \[0: (bb\d+), 1: (bb\d+)(?:, otherwise: bb\d+)?\]",
                     blocks[discriminator])
    require(arms is not None, "V41 epoch.finish success/error arms changed")
    success_arm, error_arm = arms.groups()
    normal, full = successors(blocks)
    candidates = [(node, content) for node, content in blocks.items()
                  if (transfer := re.search(rf"(_\d+) = move {re.escape(outcome)};", content))
                  and f"_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move {transfer.group(1)});" in content]
    require(len(candidates) == 1, "V41 service authority outcome to Ok return ambiguous")
    ok, ok_content = candidates[0]
    ok_transfer = re.search(rf"(_\d+) = move {re.escape(outcome)};", ok_content)
    require(ok_transfer is not None, "V41 service outcome transfer disappeared")
    temp = ok_transfer.group(1)
    ok_constructor = re.search(
        rf"_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok\(move {re.escape(temp)}\);",
        ok_content)
    require(ok_constructor is not None and ok_transfer.end() < ok_constructor.start() and
            not re.search(rf"\b{re.escape(temp)}\b",
                          ok_content[ok_transfer.end():ok_constructor.start()]) and
            sum(len(re.findall(rf"(?m)^\s*{re.escape(temp)} =", content))
                for content in blocks.values()) == 1,
            "V41 service outcome transfer temp rebound or reordered")
    require(ok in reach(normal, success_arm) and ok not in reach(normal, error_arm),
            "V41 service finish-error reaches Ok outcome")
    require(re.search(r"_0 = .*from_residual\(", blocks[error_arm]) is not None,
            "V41 service finish/error residual branch missing")
    require(all("Result::<AdmissionOutcome<R>, PortFailure>::Ok" not in blocks[node]
                for node in reach(normal, error_arm)),
            "V41 finish-error contains Ok outcome constructor")
    ok_returns = preserved_return_local(
        blocks, normal, ok,
        f"_0 = Result::<AdmissionOutcome<R>, PortFailure>::Ok(move {temp});",
        "service finish-success Ok")
    effects = effect_rows(blocks, normal, full, finish_block)
    error_effects = effect_rows(blocks, normal, full, error_arm)
    return {"issuer_block": issuer, "issuer_outcome_local": outcome,
            "issuer_normal_continuation": finish_block,
            "issuer_unwind_block": unwind_block,
            "finish_result_local": finish_result, "finish_unwind_block": finish_unwind,
            "finish_success_ok_block": ok, "service_return_local": "_0",
            "finish_branch_result_local": branch_result,
            "finish_branch_discriminant_local": discriminant.group(1),
            "finish_success_discriminant": "0/Continue",
            "finish_error_discriminant": "1/Break",
            "finish_success_ok_return_blocks": ok_returns,
            "finish_error_arm": error_arm,
            "finish_error_effect_rows": error_effects["effect_rows"],
            "finish_error_is_not_gate_deny": True,
            "epoch_finish_success_required_for_ok_outcome": True,
            "epoch_finish_error_effects_closed": False, **effects}


def service_slice(mir: str) -> dict:
    items = v5.functions(mir)
    rows = [(name, body) for name, body in items.items()
            if "::with_ready(" in name and "::with_ready::{" not in name]
    require(len(rows) == 1, "V41 selected service method ambiguous")
    return service_transfer(v26.compiled_blocks(rows[0][1]), rows[0][1])


def root_slice(root: str, mir: str) -> dict:
    root_identity = v5.root_callback(root, mir, v5.functions(mir))
    body = v5.functions(mir)[root_identity["function"]]
    blocks = v26.compiled_blocks(body)
    normal, full = successors(blocks)
    handoff = root_identity["block"]
    match = re.search(r"SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>\([^\n]+\)"
                      r" -> \[return: (bb\d+), unwind(?::)? (bb\d+|continue)\]", blocks[handoff])
    require(match is not None, "V41 root service return edge changed")
    effects = effect_rows(blocks, normal, full, match.group(1))
    return {"function": root_identity["function"], "service_call_block": handoff,
            "service_call_result_local": root_identity["call_result_local"],
            "service_normal_continuation": match.group(1),
            "service_unwind_block": match.group(2),
            "service_outcome_to_root_decision_proven": False,
            "root_decision_branch_identity_proven": False,
            "api_outer_worker_timeout_path_pending": root == "api", **effects}


def inspect_same_build(root: str, mir: dict[str, str], identities: dict,
                       variant: str) -> dict:
    original = ORIGINAL_INSPECT_MIR(root, mir, identities, variant)
    require(v40.AUTHORITY_MANIFEST in mir and v40.v38.ADMISSION_MANIFEST in mir,
            "V41 selected return chain MIR absent")
    root_manifest = v40.v38.MANIFEST if root == "api" else v40.v29.v6.ROOT_MANIFESTS[root]
    require(root_manifest in mir, "V41 root MIR absent")
    authority = None if variant == "bypass-deny" else authority_slice(mir[v40.AUTHORITY_MANIFEST])
    service = service_slice(mir[v40.v38.ADMISSION_MANIFEST])
    selected_root = root_slice(root, mir[root_manifest])
    join = v40.v32.inspect(root, mir, identities) if variant == "clean" else None
    require(join is None or len(join["normal_mir_argument_join"]) == 3,
            "V41 V32 same-build selected handoff changed")
    return {**original, "v41_return_slice": {
        "authority": authority, "service": service, "root": selected_root,
        "gate_deny_return_slice_applicable": variant != "bypass-deny",
        "gate_deny_return_slice_not_applicable_reason":
            "intentional V40 gate-DENY bypass control replaces the comparison with if false"
            if variant == "bypass-deny" else None,
        "admission_mir_sha256": identities[v40.v38.ADMISSION_MANIFEST]["mir_sha256"],
        "root_mir_sha256": identities[root_manifest]["mir_sha256"],
        "v32_normal_mir_argument_join": join["normal_mir_argument_join"] if join else None,
        "cross_body_deny_return_proven": False,
        "post_return_effects_closed": False}}


def evaluate_root(root: str, inventory: dict, model: dict) -> dict:
    prior = v40.inspect_mir
    try:
        v40.inspect_mir = inspect_same_build
        result = v40.evaluate_root(root, inventory, model)
    finally:
        v40.inspect_mir = prior
    counterfactual = result["variants"]["cardinality-gate-deny"]
    observation = counterfactual["observations"]["duplicate"]
    require(any("AUTH_V40_GATE" in marker and "decision=Deny" in marker
                for marker in observation["markers"]),
            f"V41 {root}: generated gate DENY runtime marker absent")
    require(not any("AUTH_V39_READY" in marker or "AUTH_V39_authorize" in marker
                    for marker in observation["markers"]),
            f"V41 {root}: READY/authorize marker after gate DENY")
    require(observation["normal_exit"] and observation["decision"] in
            ({"decisions": [False]} if root == "tenant" else {"decision": "DENY"}
             if root != "api" else "DENY",),
            f"V41 {root}: counterfactual terminal DENY changed")
    return result


def evaluate() -> dict:
    authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()
    model = v40.check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v40.v29.v7.current_inventory()
    roots = {root: evaluate_root(root, inventory, model) for root in ROOTS}
    return {"schema_version": "auth-foundation.v4b-deny-return-effect-slice/v41-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "roots": roots, "all_path_ready_dominance": False,
            "endpoint_set_closed": False, "runtime_guarantees_observed": False,
            "claim_limit": "Per-body partial slice only: finite counterfactual gate-DENY preserves the authority return local through normal local cleanup; service finish-success moves its unchanged authority outcome into Ok, while finish-error and all effects stay open. Selected root service-return continuations are inventoried but outcome-to-root-decision mapping is unproved; the API outer worker/timeout path is pending. V40 markers are finite controls, not production reachability, cross-body execution, effect closure, or an owner-wide no-call guarantee."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
