#!/usr/bin/env python3
"""Bounded normal-MIR policy-result to selected-root output provenance.

This deliberately does not model HTTP/JSON output, call-return execution,
opaque effects, or the complete family of native decision entrypoints.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path


CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_intercrate_graph_v9", CASE / "auth-v4b-intercrate-graph-v9.py")
assert SPEC and SPEC.loader
v9 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v9)
v5, v7, v8, v6 = v9.v5, v9.v7, v9.v8, v9.v6
IMPL = v7.IMPL
DECISION = v9.DECISION
AUTHORITY = v9.AUTHORITY
ADMISSION = v9.ADMISSION
LAYOUTS = {
    "policy": (IMPL / "standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs",
               r"pub enum AuthorizationDecision\s*\{\s*Allow,\s*Deny\(DenyReason\),\s*\}"),
    "binary": (IMPL / "authorization-state-model/src/lib.rs",
               r"pub enum BinaryAuthorizationDecision\s*\{\s*Allow,\s*Deny,\s*\}"),
    "admission": (IMPL / "authorization-ready-authority/src/lib.rs",
                  r"pub enum AdmissionOutcome<T>\s*\{\s*Denied,\s*PreparationFailed\(PreparationFailure\),\s*ReadyStateFailed\(ReadyStateFailure\),\s*Ready\(T\),\s*\}"),
}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def enum_layouts() -> dict[str, str]:
    result = {}
    for name, (path, pattern) in LAYOUTS.items():
        raw = path.read_bytes()
        active = v8.active_rust_source(raw.decode())
        enum_name = {"policy": "AuthorizationDecision",
                     "binary": "BinaryAuthorizationDecision",
                     "admission": "AdmissionOutcome<T>"}[name]
        declarations = list(re.finditer(rf"pub enum {re.escape(enum_name)}\s*\{{", active))
        require(len(declarations) == 1 and len(re.findall(pattern, active)) == 1 and
                "#[cfg" not in active[max(0, declarations[0].start() - 180):declarations[0].start()],
                f"{name}: source enum variant order changed")
        result[name] = hashlib.sha256(raw).hexdigest()
    return result


def selected_body(mir: str, function: str) -> tuple[str, dict[str, str], dict[str, list[str]]]:
    items = v5.functions(mir)
    require(function in items, f"selected MIR function missing:{function}")
    body = items[function]
    blocks = v5.blocks(body)
    return body, blocks, v8.normal_successors(body, blocks)


def sites(blocks: dict[str, str], pattern: str) -> list[tuple[str, re.Match[str]]]:
    compiled = re.compile(pattern)
    return [(node, match) for node, content in blocks.items()
            for match in compiled.finditer(content)]


def one_site(blocks: dict[str, str], pattern: str, label: str) -> tuple[str, re.Match[str]]:
    found = sites(blocks, pattern)
    require(len(found) == 1, f"{label}: expected one MIR site, got {len(found)}")
    return found[0]


def assignment_sites(blocks: dict[str, str], local: str) -> list[tuple[str, str]]:
    pattern = re.compile(rf"^\s*{re.escape(local)} = (.+)$", re.M)
    return [(node, match.group(1)) for node, content in blocks.items()
            for match in pattern.finditer(content)]


def reject_address_escape(blocks: dict[str, str], local: str, label: str) -> None:
    # An address-taken local can be overwritten without another `_n =` MIR
    # assignment. Reject even shared references here: the selected compiled
    # template does not need them, and interior/unsafe alias effects are open.
    marker = re.compile(
        rf"&(?:raw\s+(?:mut|const)\s+|mut\s+)?(?:\(\s*)*"
        rf"(?:\*\s*)?{re.escape(local)}\b")
    escaped = [(node, line.strip()) for node, content in blocks.items()
               for line in content.splitlines()
               if marker.search(line)]
    require(not escaped, f"{label}: {local} address escapes direct def-use check")
    token = re.compile(rf"(?<![A-Za-z0-9_]){re.escape(local)}\b")
    nested_writes = [(node, line.strip()) for node, content in blocks.items()
                     for line in content.splitlines() if " = " in line
                     and (place := line.split(" = ", 1)[0].strip()) != local
                     and token.search(place)]
    require(not nested_writes,
            f"{label}: {local} has an indirect place/discriminant write")


def single_assignment(blocks: dict[str, str], local: str, label: str) -> tuple[str, str]:
    reject_address_escape(blocks, local, label)
    found = assignment_sites(blocks, local)
    require(len(found) == 1, f"{label}: {local} rebound or missing")
    return found[0]


def return_writes(blocks: dict[str, str]) -> list[tuple[str, str]]:
    return assignment_sites(blocks, "_0")


def dominated(graph: dict[str, list[str]], target: str, source: str, label: str) -> None:
    require(v8.reachable(graph, "bb0", target) and
            not v8.reachable(graph, "bb0", target, source),
            f"{label}: {source} does not dominate {target}")


def switch(blocks: dict[str, str], node: str, local: str,
           expected: tuple[str, ...], label: str) -> dict[str, str]:
    term = [line.strip() for line in blocks[node].splitlines() if line.strip()][-1]
    matched = re.fullmatch(rf"switchInt\(move {re.escape(local)}\) -> \[(.+)\];", term)
    require(matched is not None, f"{label}: discriminant switch missing")
    pairs = re.findall(r"(\d+|otherwise): (bb\d+)", matched.group(1))
    require(tuple(key for key, _ in pairs) == expected and
            len(pairs) == len(set(key for key, _ in pairs)),
            f"{label}: variant arms changed")
    return dict(pairs)


def decision_provenance(mir: str) -> dict:
    enum_layouts()
    info = v5.decision_policy(mir, v5.functions(mir))
    body, blocks, graph = selected_body(mir, info["function"])
    call, matched = one_site(blocks,
        rf"(?m)^\s*(_\d+) = {re.escape(v6.POLICY)}\(copy _\d+\) -> \[return: (bb\d+),",
        "decision policy")
    result, resumed = matched.groups()
    require(resumed in graph[call], "decision: policy normal return disconnected")
    single_assignment(blocks, result, "decision policy result")
    disc, matched = one_site(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\({re.escape(result)}\);",
        "decision policy discriminant")
    discriminator = matched.group(1)
    single_assignment(blocks, discriminator, "decision discriminant")
    require(disc == resumed, "decision: policy result not immediately discriminated")
    arms = switch(blocks, disc, discriminator, ("0", "1", "otherwise"), "decision")
    allow, deny = arms["0"], arms["1"]
    require(arms["otherwise"] != allow and arms["otherwise"] != deny,
            "decision: invalid variant arm aliases")
    writes = return_writes(blocks)
    reject_address_escape(blocks, "_0", "decision return place")
    require(len(writes) == 2 and
            (allow, "auth_foundation_authorization_state_model::BinaryAuthorizationDecision::Allow;") in writes and
            (deny, "auth_foundation_authorization_state_model::BinaryAuthorizationDecision::Deny;") in writes,
            "decision: ALLOW/DENY return provenance changed")
    dominated(graph, allow, call, "decision policy call")
    dominated(graph, allow, disc, "decision policy branch")
    require(not v8.reachable(graph, deny, allow) and
            not v8.reachable(graph, arms["otherwise"], allow) and
            v8.reachable(graph, "bb0", deny),
            "decision: non-ALLOW policy arm reaches ALLOW")
    return {"function": info["function"], "policy_call_block": call,
            "policy_result_local": result, "policy_allow_arm": allow,
            "policy_deny_arm": deny, "return_writes": len(writes),
            "normal_path_provenance": "pass"}


def authority_return_provenance(mir: str) -> dict:
    enum_layouts()
    extracted = v8.extract_graph(mir)
    v8.require_bounded_pass(extracted)
    name = extracted["function"]
    _, blocks, graph = selected_body(mir, name)
    require(len(extracted["callback_blocks"]) == 1,
            "authority: selected callback return block ambiguous")
    callback = extracted["callback_blocks"][0]
    matched = re.search(r"(_\d+) = copy _5\(copy (_\d+)\) -> \[return: (bb\d+),",
                        blocks[callback])
    require(matched is not None, "authority: typed callback destination missing")
    result, ready_token, resumed = matched.groups()
    single_assignment(blocks, result, "authority callback result")
    require(resumed in graph[callback] and
            re.search(rf"(?m)^\s*{re.escape(ready_token)} = ReadyAuthorization::<'_, '_> "
                      r"\{ transaction: copy _1, [^;]+;", blocks[callback]) is not None,
            "authority: READY token/callback return changed")
    ready, ready_match = one_site(blocks,
        rf"(?m)^\s*_0 = AdmissionOutcome::<R>::Ready\(move {re.escape(result)}\);",
        "authority Ready result")
    require(ready == resumed, "authority: callback result not returned as Ready")
    writes = return_writes(blocks)
    reject_address_escape(blocks, "_0", "authority return place")
    allowed = re.compile(r"AdmissionOutcome::<R>::(?:Denied|PreparationFailed\(.+\)|ReadyStateFailed\(.+\)|Ready\(.+\));$")
    require(len(writes) >= 2 and all(allowed.fullmatch(value) for _, value in writes) and
            sum("::Ready(" in value for _, value in writes) == 1,
            "authority: unknown or alternate Ready return")
    dominated(graph, ready, callback, "authority callback")
    dominated(graph, ready, extracted["ready_arm"], "authority READY arm")
    require(not v8.reachable(graph, extracted["deny_arm"], ready),
            "authority: gate DENY reaches Ready output")
    return {"function": name, "callback_block": callback,
            "callback_result_local": result, "ready_return_block": ready,
            "return_writes": len(writes), "normal_path_provenance": "pass"}


def admission_return_provenance(mir: str) -> dict:
    enum_layouts()
    info = v5.admission_handoff(mir, v5.functions(mir))
    _, blocks, graph = selected_body(mir, info["function"])
    issuer, matched = one_site(blocks,
        r"(?m)^\s*(_\d+) = with_ready_in_transaction::<R>\([^\n]+copy _3\) -> \[return: (bb\d+),",
        "admission authority issuer")
    issued, resumed = matched.groups()
    require(issuer == info["block"] and resumed in graph[issuer],
            "admission: issuer normal return changed")
    single_assignment(blocks, issued, "admission authority result")
    writes = return_writes(blocks)
    reject_address_escape(blocks, "_0", "admission return place")
    ready_output = None
    denied_outputs, error_outputs = [], []
    for node, value in writes:
        ok = re.fullmatch(r"Result::<AdmissionOutcome<R>, PortFailure>::Ok\(move (_\d+)\);", value)
        if ok:
            local = ok.group(1)
            assigned_node, assignment = single_assignment(blocks, local,
                                                         "admission Ok payload")
            if assignment == f"move {issued};":
                require(assigned_node == node and ready_output is None,
                        "admission: authority result forwarded more than once")
                ready_output = node
            elif assignment == "AdmissionOutcome::<R>::Denied;":
                denied_outputs.append(node)
            else:
                raise ValueError("admission: unknown Ok payload source")
        elif value == "Result::<AdmissionOutcome<R>, PortFailure>::Err(const PortFailure);":
            error_outputs.append(node)
        elif (value.startswith("<Result<AdmissionOutcome<R>, PortFailure> as "
                               "FromResidual<Result<Infallible, PortFailure>>>::from_residual(")
              and "Result::<Infallible, PortFailure>::Err(PortFailure)" in value):
            # The residual's success type is uninhabited and its value is an
            # explicit Err; standard Result::from_residual can only return Err.
            error_outputs.append(node)
        else:
            raise ValueError(f"admission: unclassified return write:{node}:{value[:120]}")
    require(ready_output is not None and denied_outputs and error_outputs and
            len(denied_outputs) + len(error_outputs) + 1 == len(writes),
            "admission: return partition incomplete")
    dominated(graph, ready_output, issuer, "admission authority result")
    require(all(not v8.reachable(graph, node, ready_output) for node in denied_outputs),
            "admission: pre-gate Denied path reaches Ready output")
    return {"function": info["function"], "issuer_block": issuer,
            "authority_result_local": issued, "ready_return_block": ready_output,
            "denied_return_count": len(denied_outputs),
            "error_return_count": len(error_outputs),
            "normal_path_provenance": "pass"}


def root_result_branches(root_id: str, mir: str) -> dict:
    enum_layouts()
    handoff = v9.root_handoff(root_id, mir)
    body, blocks, graph = selected_body(mir, handoff["function"])
    result = handoff["call_result_local"]
    single_assignment(blocks, result, f"{root_id} with_ready result")
    result_node, matched = one_site(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\({re.escape(result)}\);",
        f"{root_id} Result discriminant")
    result_disc = matched.group(1)
    single_assignment(blocks, result_disc, f"{root_id} Result discriminant")
    require(result_node in graph[handoff["block"]],
            f"{root_id}: with_ready result not immediately matched")
    result_arms = switch(blocks, result_node, result_disc,
                         ("0", "1", "otherwise"), f"{root_id} Result")
    ready_node, matched = one_site(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\([^\n]*{re.escape(result)} as Ok[^\n]*AdmissionOutcome<[^\n]*>\)\);",
        f"{root_id} AdmissionOutcome discriminant")
    ready_disc = matched.group(1)
    single_assignment(blocks, ready_disc, f"{root_id} AdmissionOutcome discriminant")
    require(ready_node == result_arms["0"],
            f"{root_id}: non-Ok result reaches AdmissionOutcome match")
    ready_arms = switch(blocks, ready_node, ready_disc,
                        ("3", "otherwise"), f"{root_id} AdmissionOutcome")
    require(ready_arms["3"] != ready_arms["otherwise"],
            f"{root_id}: Ready and non-Ready arms alias")
    return {"function": handoff["function"], "body": body, "blocks": blocks,
            "graph": graph, "call_block": handoff["block"], "result_local": result,
            "result_arms": result_arms, "ready_arms": ready_arms}


def root_output_provenance(root_id: str, mir: str) -> dict:
    selected = root_result_branches(root_id, mir)
    blocks, graph = selected["blocks"], selected["graph"]
    result, call = selected["result_local"], selected["call_block"]
    ready, nonready = selected["ready_arms"]["3"], selected["ready_arms"]["otherwise"]
    error = selected["result_arms"]["1"]
    writes = return_writes(blocks)
    reject_address_escape(blocks, "_0", f"{root_id} return place")
    if root_id == "api":
        require(len(writes) == 2 and any(value == "Deny;" for _, value in writes),
                "api: non-Ready return classification changed")
        positive = ready
        payload, matched = one_site(blocks,
            rf"(?m)^\s*(_\d+) = copy \([^\n]*{re.escape(result)} as Ok[^\n]*as Ready[^\n]*BinaryAuthorizationDecision\);",
            "api Ready decision payload")
        local = matched.group(1)
        single_assignment(blocks, local, "api Ready decision payload")
        require(payload == positive and (positive, f"copy {local};") in writes,
                "api: worker return is not its Ready payload")
        require(not v8.reachable(graph, error, positive) and
                not v8.reachable(graph, nonready, positive),
                "api: error or non-Ready path reaches payload return")
        positive_kind = "BinaryAuthorizationDecision Ready payload"
    else:
        decision_node, matched = one_site(blocks,
            rf"(?m)^\s*(_\d+) = discriminant\([^\n]*{re.escape(result)} as Ok[^\n]*as Ready[^\n]*BinaryAuthorizationDecision\)\);",
            f"{root_id} binary decision discriminant")
        decision_disc = matched.group(1)
        single_assignment(blocks, decision_disc, f"{root_id} decision discriminant")
        require(decision_node == ready,
                f"{root_id}: non-Ready result reaches decision match")
        decision_arms = switch(blocks, decision_node, decision_disc,
                               ("0", "1", "otherwise"), f"{root_id} decision")
        positive = decision_arms["0"]
        require(positive != decision_arms["1"] and
                positive != decision_arms["otherwise"] and
                not any(v8.reachable(graph, arm, positive) for arm in
                        (error, nonready, decision_arms["1"], decision_arms["otherwise"])),
                f"{root_id}: non-ALLOW arm reaches positive return")
        if root_id == "tenant":
            require(len(writes) == 2 and (positive, "const true;") in writes and
                    any(value == "const false;" for _, value in writes),
                    "tenant: positive/negative per-item returns changed")
            positive_kind = "per-item bool true"
        else:
            dynamic_ok = [(node, re.fullmatch(
                r"Result::<bool, Box<dyn StdError>>::Ok\(move (_\d+)\);", value))
                for node, value in writes]
            dynamic_ok = [(node, match.group(1)) for node, match in dynamic_ok if match]
            require(len(dynamic_ok) == 1,
                    f"{root_id}: dynamic Ok(bool) return ambiguous")
            ok_node, boolean = dynamic_ok[0]
            reject_address_escape(blocks, boolean, f"{root_id} Ok(bool) payload")
            boolean_writes = assignment_sites(blocks, boolean)
            require(len(boolean_writes) == 2 and
                    (positive, "const true;") in boolean_writes and
                    any(value == "const false;" for _, value in boolean_writes) and
                    v8.reachable(graph, positive, ok_node),
                    f"{root_id}: Ok(bool) positive source changed")
            for node, value in writes:
                if node == ok_node and value == f"Result::<bool, Box<dyn StdError>>::Ok(move {boolean});":
                    continue
                if value == "Result::<bool, Box<dyn StdError>>::Ok(const false);":
                    continue
                if (value.startswith("<Result<bool, Box<dyn StdError>> as "
                                     "FromResidual<Result<Infallible, ") and
                        ">>::from_residual(copy _" in value):
                    # A Result<Infallible, E> residual has no success value.
                    continue
                raise ValueError(f"{root_id}: unclassified return write:{node}:{value[:120]}")
            require(not any(v8.reachable(graph, arm, positive) for arm in
                            (error, nonready, decision_arms["1"], decision_arms["otherwise"])),
                    f"{root_id}: error path reaches true source")
            positive_kind = "Result::Ok(true)"
    dominated(graph, positive, call, f"{root_id} with_ready call")
    dominated(graph, positive, ready, f"{root_id} Ready arm")
    return {"function": selected["function"], "with_ready_block": call,
            "with_ready_result_local": result, "positive_block": positive,
            "positive_kind": positive_kind, "return_writes": len(writes),
            "normal_path_provenance": "pass"}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    predecessor = v9.inspect(root_id, mir, identities)
    return {**predecessor,
            "decision_result_provenance": decision_provenance(mir[DECISION]),
            "authority_return_provenance": authority_return_provenance(mir[AUTHORITY]),
            "admission_return_provenance": admission_return_provenance(mir[ADMISSION]),
            "selected_root_result_provenance": root_output_provenance(
                root_id, mir[v6.ROOT_MANIFESTS[root_id]])}


def evaluate() -> dict:
    layouts_before = enum_layouts()
    current = v7.evaluate(mir_inspector=inspect)
    require(enum_layouts() == layouts_before, "enum source layout changed during capture")
    require(current["status"] == "indeterminate" and
            current["runtime_guarantees_observed"] is False,
            "root-context predecessor posture changed")
    return {"schema_version": "auth-foundation.v4b-output-provenance/v10a-candidate",
            "status": "indeterminate", "root_context_builds": current["root_context_builds"],
            "enum_source_sha256": layouts_before,
            "bounded_selected_root_result_provenance": "pass",
            "allow_output_provenance_closed": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Compiled same-root-context normal-MIR binds policy ALLOW/DENY return through the authority callback, admission Result::Ok(Ready), and the selected API worker/per-item tenant/prototype/HTTPS outputs. Public HTTP/JSON projections, intercrate call-return execution, native endpoint/effect closure, and runtime observation remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
