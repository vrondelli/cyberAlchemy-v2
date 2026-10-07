#!/usr/bin/env python3
"""Bounded normal API blocking-worker MIR mapping; not an effect closure proof."""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "auth_v44_for_v45", CASE / "auth-v4b-api-inner-deny-mapping-v44.py")
assert spec and spec.loader
v44 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v44)
v41, v40, v5, v26 = v44.v41, v44.v40, v44.v5, v44.v26


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError("V45 " + message)


def one(pattern: str, content: str, reason: str) -> re.Match[str]:
    found = list(re.finditer(pattern, content, re.M | re.S))
    require(len(found) == 1, reason)
    return found[0]


def def_count(body: str, local: str, count: int = 1) -> None:
    require(len(re.findall(rf"(?m)^\s*{re.escape(local)} =", body)) == count,
            f"local {local} definition changed")


def call(blocks: dict[str, str], pattern: str, reason: str) -> tuple[str, re.Match[str]]:
    found = [(node, match) for node, content in blocks.items()
             if (match := re.search(pattern, content))]
    require(len(found) == 1, reason)
    return found[0]


def switched(blocks: dict[str, str], node: str, local: str,
             reason: str) -> tuple[str, str, str]:
    disc, arms = v44.switch(blocks[node], local)
    require(set(arms) == {"0", "1", "otherwise"} and
            blocks[arms["otherwise"]].strip() == "unreachable;",
            reason + " switch/unknown arm changed")
    def_count("\n".join(blocks.values()), disc)
    continue_nodes = [candidate for candidate in (arms["0"], arms["1"])
                      if f"({local} as Continue).0" in blocks[candidate] or
                      f"({local} as Ok).0" in blocks[candidate]]
    if not continue_nodes and reason == "put":
        failures = [candidate for candidate in (arms["0"], arms["1"])
                    if f"({local} as Break).0" in blocks[candidate]]
        require(len(failures) == 1, reason + " typed Break arm ambiguous")
        failure = failures[0]
        success = next(candidate for candidate in (arms["0"], arms["1"])
                       if candidate != failure)
    else:
        require(len(continue_nodes) == 1, reason + " typed success arm ambiguous")
        success = continue_nodes[0]
        failure = next(candidate for candidate in (arms["0"], arms["1"])
                       if candidate != success)
    require(arms["0"] == success and arms["1"] == failure,
            reason + " typed branch/discriminant labels changed")
    return disc, success, failure


def only_normal_return(blocks: dict[str, str], normal: dict[str, list[str]]) -> str:
    reachable = v41.reach(normal, "bb0")
    returns = [node for node in reachable if blocks[node].strip() == "return;"]
    require(len(returns) == 1 and
            all(node in reachable for node in blocks if blocks[node].strip() == "return;"),
            "all normal returns changed")
    return returns[0]


def branch_return(blocks: dict[str, str], normal: dict[str, list[str]],
                  start: str, initial: str, label: str, terminal: str) -> None:
    require(v41.preserved_return_local(blocks, normal, start, initial, label) ==
            [terminal], label + " return path changed")


def preserve_value(blocks: dict[str, str], normal: dict[str, list[str]],
                   start: str, local: str, initial: str, end: str,
                   final_use: str, label: str,
                   allowed_intermediate: tuple[str, ...] = ()) -> None:
    """Reject *all* intervening touches, including later lines in the start block."""
    forward = v41.reach(normal, start)
    require(end in forward, label + " terminal use unreachable")
    backward = {end}
    pending = [end]
    while pending:
        current = pending.pop()
        for predecessor, targets in normal.items():
            if current in targets and predecessor not in backward:
                backward.add(predecessor)
                pending.append(predecessor)
    path = forward & backward
    require(start in path and end in path and
            len(re.findall(rf"(?m)^\s*{re.escape(local)} =", blocks[start])) == 1,
            label + " initial value changed")
    selected = [line.strip() for line in blocks[start].splitlines()
                if line.strip().startswith(initial)]
    require(len(selected) == 1 and re.search(rf"\b{re.escape(local)}\b", selected[0]),
            label + " initial value changed")
    found_final = 0
    found_intermediate = {line: 0 for line in allowed_intermediate}
    for node in path:
        lines = blocks[node].splitlines()
        definition_seen = False
        for line in lines:
            stripped = line.strip()
            if node == start and stripped == selected[0] and not definition_seen:
                definition_seen = True
                continue
            if re.search(rf"\b{re.escape(local)}\b", stripped):
                if node == end and stripped == final_use:
                    found_final += 1
                elif stripped in found_intermediate:
                    found_intermediate[stripped] += 1
                else:
                    raise ValueError("V45 " + label +
                                     " value touched between definition and final use")
        if node == start:
            require(definition_seen, label + " initial definition missing")
    require(found_final == 1, label + " exact final use changed")
    require(all(count == 1 for count in found_intermediate.values()),
            label + " required intermediate use changed")


def effect_inventory(blocks: dict[str, str], normal: dict[str, list[str]],
                     full: dict[str, list[str]]) -> dict:
    inventory = v41.effect_rows(blocks, normal, full, "bb0")
    extra = []
    reachable = v41.reach(full, "bb0")
    normal_reachable = v41.reach(normal, "bb0")
    for node in reachable:
        content = blocks[node]
        terminator = content.strip().splitlines()[-1].strip()
        if "unwind terminate(cleanup)" in terminator:
            extra.append({"block": node, "terminator": terminator,
                          "path": "normal" if node in normal_reachable else "cleanup",
                          "kind": "unwind-terminate-cleanup", "effect_status": "open"})
    require(extra, "unwind terminate(cleanup) rows absent")
    inventory["effect_rows"].extend(extra)
    inventory["post_return_effects_closed"] = False
    return inventory


def inspect_parent(api_mir: str, inner: dict) -> dict:
    items = v5.functions(api_mir)
    selected = [(name, body) for name, body in items.items()
                if "::authorize::{closure#0}::{closure#0}(" in name and
                "-> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>" in name]
    require(len(selected) == 1, "normal blocking-worker function ambiguous")
    name, body = selected[0]
    require(inner["function"].startswith(name.split("(_1:")[0] + "::{closure#0}"),
            "parent/inner closure identity changed")
    blocks = v26.compiled_blocks(body)
    normal, full = v41.successors(blocks)
    terminal = only_normal_return(blocks, normal)

    take_node, take = call(blocks,
        r"(_\d+) = EnginePool::take\(copy (_\d+)\) -> \[return: (bb\d+), unwind: bb\d+\]",
        "unique EnginePool::take call changed")
    take_result, first_pool, take_branch = take.groups()
    def_count(body, take_result)
    take_pool_ref = one(rf"{re.escape(first_pool)} = <Arc<EnginePool> as Deref>::deref\(move (_\d+)\)",
                        body, "take pool dereference changed").group(1)
    require(re.search(rf"{re.escape(take_pool_ref)} = &\(_1\.2: "
                      r"std::sync::Arc<EnginePool>\);", body) is not None,
            "take pool capture changed")
    def_count(body, first_pool)
    def_count(body, take_pool_ref)
    take_cf = one(rf"(_\d+) = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::"
                  rf"branch\(move {re.escape(take_result)}\) -> \[return: (bb\d+),",
                  blocks[take_branch], "take Try branch changed")
    take_flow, take_switch_node = take_cf.groups()
    take_disc, take_ok, take_err = switched(blocks, take_switch_node, take_flow, "take")
    def_count(body, take_flow)
    preserve_value(blocks, normal, take_branch, take_flow,
                   f"{take_flow} = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::branch",
                   take_switch_node, f"{take_disc} = discriminant({take_flow});",
                   "take Try result")
    require(take_ok in v41.reach(normal, take_node) and
            take_err in v41.reach(normal, take_node), "take arms unreachable")
    engine_move = one(rf"(_\d+) = move \(\({re.escape(take_flow)} as Continue\)\.0: "
                      r"auth_foundation_authorization_admission_service::SqliteAdmissionService\);",
                      blocks[take_ok], "take Continue engine extraction changed")
    engine_value = engine_move.group(1)
    def_count(body, engine_value)
    engine = one(rf"(_\d+) = move {re.escape(engine_value)};", blocks[take_ok],
                 "take engine transfer changed").group(1)
    def_count(body, engine)
    reference = one(rf"(_\d+) = &mut {re.escape(engine)};", blocks[take_ok],
                    "inner engine reference changed").group(1)
    def_count(body, reference)
    location = one(r"\(_1: (\{closure@[^}]+\})\) -> BinaryAuthorizationDecision",
                   inner["function"], "inner closure type/location changed").group(1)
    closure = one(rf"(_\d+) = {re.escape(location)} \{{ engine: move {re.escape(reference)}, "
                  r"request: move \(_1\.3: auth_foundation_authorization_state_model::"
                  r"InboundAuthorizationRequest\) \};", blocks[take_ok],
                  "inner closure engine/request capture changed").group(1)
    def_count(body, closure)
    wrapped = one(rf"(_\d+) = AssertUnwindSafe::<{re.escape(location)}>\(move "
                  rf"{re.escape(closure)}\);", blocks[take_ok],
                  "AssertUnwindSafe capture changed").group(1)
    def_count(body, wrapped)
    catch = one(rf"(_\d+) = std::panic::catch_unwind::<AssertUnwindSafe<{re.escape(location)}>, "
                rf"BinaryAuthorizationDecision>\(move {re.escape(wrapped)}\) -> "
                r"\[return: (bb\d+), unwind: bb\d+\];", blocks[take_ok],
                "unique catch_unwind capture changed")
    caught, catch_switch_node = catch.groups()
    def_count(body, caught)
    catch_disc, catch_ok, catch_err = switched(blocks, catch_switch_node, caught, "catch")
    preserve_value(blocks, normal, take_ok, caught,
                   f"{caught} = std::panic::catch_unwind", catch_switch_node,
                   f"{catch_disc} = discriminant({caught});", "catch result")
    require(catch_ok not in v41.reach(normal, take_err) and
            catch_ok not in v41.reach(normal, catch_err),
            "take/catch failure reaches success")
    decision = one(rf"(_\d+) = copy \(\({re.escape(caught)} as Ok\)\.0: "
                   r"auth_foundation_authorization_state_model::BinaryAuthorizationDecision\);",
                   blocks[catch_ok], "catch Ok decision extraction changed").group(1)
    def_count(body, decision)
    put_pool_ref = one(r"(_\d+) = &\(_1\.2: std::sync::Arc<EnginePool>\);",
                       blocks[catch_ok], "put pool capture changed").group(1)
    def_count(body, put_pool_ref)
    put_pool = one(rf"(_\d+) = <Arc<EnginePool> as Deref>::deref\(move "
                   rf"{re.escape(put_pool_ref)}\) -> \[return: (bb\d+),",
                   blocks[catch_ok], "put pool dereference changed")
    put_pool_value, put_node = put_pool.groups()
    def_count(body, put_pool_value)
    put_engine = one(rf"(_\d+) = move {re.escape(engine)};", blocks[put_node],
                     "same engine put transfer changed").group(1)
    def_count(body, put_engine)
    preserve_value(blocks, normal, take_ok, engine,
                   f"{engine} = move {engine_value};", put_node,
                   f"{put_engine} = move {engine};", "taken engine",
                   (f"{reference} = &mut {engine};",))
    put = one(rf"(_\d+) = EnginePool::put\(copy {re.escape(put_pool_value)}, "
              rf"move {re.escape(put_engine)}\) -> \[return: (bb\d+), unwind: bb\d+\];",
              blocks[put_node], "unique put same pool/engine changed")
    put_result, put_branch = put.groups()
    def_count(body, put_result)
    put_cf = one(rf"(_\d+) = <Result<\(\), AuthorizationRuntimeError> as Try>::"
                 rf"branch\(move {re.escape(put_result)}\) -> \[return: (bb\d+),",
                 blocks[put_branch], "put Try branch changed")
    put_flow, put_switch_node = put_cf.groups()
    put_disc, put_ok, put_err = switched(blocks, put_switch_node, put_flow, "put")
    def_count(body, put_flow)
    preserve_value(blocks, normal, put_branch, put_flow,
                   f"{put_flow} = <Result<(), AuthorizationRuntimeError> as Try>::branch",
                   put_switch_node, f"{put_disc} = discriminant({put_flow});",
                   "put Try result")
    require(re.search(rf"\(\({re.escape(put_flow)} as Break\)\.0:", blocks[put_err]) and
            put_ok not in v41.reach(normal, put_err),
            "put Break residual/error arm changed")
    result = one(rf"(_\d+) = Result::<BinaryAuthorizationDecision, "
                 rf"AuthorizationRuntimeError>::Ok\(copy {re.escape(decision)}\);",
                 blocks[put_ok], "put Continue Ok(same decision) changed").group(1)
    worker_error = one(r"(_\d+) = AuthorizationRuntimeError::WorkerUnavailable;",
                       blocks[catch_err], "unique catch WorkerUnavailable constructor changed").group(1)
    def_count(body, worker_error)
    error_use = (f"{result} = Result::<BinaryAuthorizationDecision, "
                 f"AuthorizationRuntimeError>::Err(move {worker_error});")
    require(error_use in blocks[catch_err],
            "catch Err exact WorkerUnavailable payload changed")
    preserve_value(blocks, normal, catch_err, worker_error,
                   f"{worker_error} = AuthorizationRuntimeError::WorkerUnavailable;",
                   catch_err, error_use, "catch WorkerUnavailable")
    def_count(body, result, 2)
    merge = one(r"goto -> (bb\d+);", blocks[put_ok],
                "success merge edge changed").group(1)
    require(f"goto -> {merge};" in blocks[catch_err] and
            f"_0 = copy {result};" in blocks[merge],
            "catch result merge changed")
    preserve_value(blocks, normal, catch_ok, decision,
                   f"{decision} = copy (({caught} as Ok).0:", put_ok,
                   f"{result} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy {decision});",
                   "caught decision")
    preserve_value(blocks, normal, put_ok, result,
                   f"{result} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy {decision});",
                   merge, f"_0 = copy {result};", "put success")
    preserve_value(blocks, normal, catch_err, result,
                   f"{result} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move",
                   merge, f"_0 = copy {result};", "catch error")
    branch_return(blocks, normal, merge, f"_0 = copy {result};", "merged result", terminal)
    for node, residual in ((take_err, take_flow), (put_err, put_flow)):
        payload = re.search(
            rf"(_\d+) = copy \(\({re.escape(residual)} as Break\)\.0: "
            r"std::result::Result<std::convert::Infallible, AuthorizationRuntimeError>\);",
            blocks[node])
        require(payload is not None and
                re.search(r"_0 = <Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> "
                          r"as FromResidual<[^\n]+>>::from_residual\(copy " +
                          re.escape(payload.group(1)) + r"\)", blocks[node]),
                "same Break payload to from_residual changed")
        require(put_ok not in v41.reach(normal, node) and
                terminal in v41.reach(normal, node),
                "residual error reaches success or misses return")
    require(put_ok not in v41.reach(normal, catch_err) and
            put_ok in v41.reach(normal, catch_ok),
            "catch arm to put success flow changed")
    return {"function": name, "take_block": take_node, "take_error_arm": take_err,
            "take_continue_arm": take_ok, "catch_block": take_ok,
            "catch_error_arm": catch_err, "catch_ok_arm": catch_ok,
            "put_block": put_node, "put_error_arm": put_err,
            "put_continue_arm": put_ok, "decision_local": decision,
            "terminal_return_block": terminal,
            "same_engine_and_pool_put_on_catch_ok": True,
            "catch_err_and_take_put_errors_separate": True,
            "put_continue_returns_same_decision": True,
            "all_normal_returns_checked": True,
            "local_effects": effect_inventory(blocks, normal, full),
            "inner_to_parent_runtime_join_proven": False,
            "async_timeout_http_proven": False,
            "transitive_effect_closure_proven": False}


def inspect_same_build(root: str, mir: dict[str, str], identities: dict,
                       variant: str) -> dict:
    prior = v44.inspect_same_build(root, mir, identities, variant)
    inner = prior["v44_inner_api"]
    parent = inspect_parent(mir[v44.MANIFEST], inner)
    identity = identities[v44.MANIFEST]
    require(identity["mir_sha256"] == v40.v29.sha(mir[v44.MANIFEST].encode()) and
            identity["target_kind"] == ["lib"] and "trace" not in identity["features"],
            "normal library MIR identity changed")
    return {**prior, "v45_parent_worker": {**parent, "variant": variant,
            "api_library_mir_sha256": identity["mir_sha256"],
            "api_library_package_id": identity["package_id"],
            "api_library_features": identity["features"],
            "api_library_source_sha256": inner["api_library_source_sha256"]}}


def evaluate_root(inventory: dict, model: dict) -> dict:
    previous = v40.inspect_mir
    try:
        v40.inspect_mir = inspect_same_build
        result = v40.evaluate_root("api", inventory, model)
    finally:
        v40.inspect_mir = previous
    require(result["source_bytes_preserved"] and
            result["normal_feature_same_build_mir_and_binary"],
            "V40 same-build/source preservation absent")
    for variant, row in result["variants"].items():
        parent = row["selected_mir_inspection"]["v45_parent_worker"]
        require(parent["variant"] == variant and
                parent["api_library_source_sha256"] == row["source_sha256"][v44.API] and
                parent["api_library_mir_sha256"] == row["selected_mir_sha256"][v44.MANIFEST] and
                parent["api_library_package_id"] == row["test_package_id"] and
                all(row["binary_sha256"] == obs["test_binary_sha256"]
                    for obs in row["observations"].values()),
                f"{variant} source/MIR/package/binary binding changed")
    return result


def evaluate() -> dict:
    authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()
    model = v40.check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v40.v29.v7.current_inventory()
    result = evaluate_root(inventory, model)
    return {"schema_version": "auth-foundation.v4b-api-parent-worker/v45-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "root": result, "endpoint_set_closed": False,
            "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build normal API library MIR locally maps catch Ok decision through same-pool/engine put Continue to Ok(same decision), while take Break, catch Err, and put Break remain distinct errors. This is a conditional per-body mapping; runtime cross-body execution, async timeout/HTTP, indirect effects, and owner-wide no-call are unproved."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
