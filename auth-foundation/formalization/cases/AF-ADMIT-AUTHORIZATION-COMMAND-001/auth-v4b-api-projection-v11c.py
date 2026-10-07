#!/usr/bin/env python3
"""Incremental V11c production API projection, with an explicit open ceiling.

The implemented sublemmas bind the public router and database wrapper to the
selected handler, constructor inputs to the selected poll bodies, the binary
decision to the response argument/header, the V10-checked inner worker to the
outer Result, and the selected worker through runtime timeout Poll in normal
MIR. The function identities are joined syntactically. Library and execution
semantics remain open; no runtime claim is made.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_tenant_projection_v11b", CASE / "auth-v4b-tenant-projection-v11b.py")
assert SPEC and SPEC.loader
v11b = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v11b)
v10, v7, v8, v5, v6 = v11b.v10, v11b.v7, v11b.v8, v11b.v5, v11b.v6
one = v11b.one
exact_normal_uses = v11b.exact_normal_uses
API = "api"


def normal_nodes(graph: dict[str, list[str]]) -> set[str]:
    return {node for node in graph if v8.reachable(graph, "bb0", node)}


def router_projection(mir: str) -> dict:
    source = (v7.IMPL / "authorization-api/src/lib.rs").read_text()
    v10.require(re.search(r'pub const AUTHORIZE_PATH: &str = "/v1/authorize";', source)
                is not None, "api: public route path source changed")
    v10.require(re.search(r'(?m)^const AUTHORIZE_PATH: &str = const "/v1/authorize";$', mir)
                is not None, "api: compiled public route path changed")
    _, blocks, graph = v10.selected_body(
        mir, "authorization_router(_1: AuthorizationRuntime) -> Router")
    v10.require(normal_nodes(graph) == {f"bb{i}" for i in range(7)} and
                all(graph[f"bb{i}"] == [f"bb{i+1}"] for i in range(6)),
                "api: public router normal chain changed")
    _, path = one(blocks, r"(?m)^\s*(_\d+) = const AUTHORIZE_PATH;$",
                  "api public route path")
    path_local = path.group(1)
    post_node, post = one(blocks,
        r"(?m)^\s*(_\d+) = post::<fn\(State<ApiState>, axum::http::Request<Body>\) -> impl Future<Output = Response<Body>> \{authorize\}, [^\n]+>\(authorize\) -> \[return: (bb\d+),",
        "api public POST handler")
    method, route_node = post.groups()
    v10.require(v10.assignment_sites(blocks, "_5") ==
                [("bb0", "Router::<ApiState>::new() -> [return: bb1, unwind: bb11];")],
                "api: public router base changed")
    v10.require(post_node == "bb1" and route_node == "bb2" and
                v10.assignment_sites(blocks, "_4") ==
                    [("bb2", f"Router::<ApiState>::route(move _5, move {path_local}, move {method}) -> [return: bb3, unwind: bb9];")] and
                v10.assignment_sites(blocks, "_3") ==
                    [("bb3", "Router::<ApiState>::fallback::<fn() -> impl Future<Output = Response<Body>> {not_found}, ((),)>(move _4, not_found) -> [return: bb4, unwind: bb11];")] and
                v10.assignment_sites(blocks, "_2") ==
                    [("bb4", "Router::<ApiState>::method_not_allowed_fallback::<fn() -> impl Future<Output = Response<Body>> {method_not_allowed}, ((),)>(move _3, method_not_allowed) -> [return: bb5, unwind: bb11];")] and
                v10.return_writes(blocks) ==
                    [("bb5", "Router::<ApiState>::with_state::<()>(move _2, move _8) -> [return: bb6, unwind: bb11];")],
                "api: public router handler/fallback/state binding changed")
    v10.require(v10.assignment_sites(blocks, "_9") == [("bb5", "move _1;")] and
                v10.assignment_sites(blocks, "_8") ==
                    [("bb5", "ApiState { runtime: move _9 };")],
                "api: public router runtime state changed")
    v10.require(len(v10.return_writes(blocks)) == 1 and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1 and
                re.search(r"(?m)^\s*return;$", blocks["bb6"]) is not None,
                "api: public router has alternate normal return")
    exact_normal_uses(blocks, graph, path_local,
        [rf"{re.escape(path_local)} = const AUTHORIZE_PATH;",
         rf"_\d+ = Router::<ApiState>::route\(move _\d+, move {re.escape(path_local)}, move {re.escape(method)}\) -> .+"],
        "api public route path")
    exact_normal_uses(blocks, graph, method,
        [rf"{re.escape(method)} = post::<.+>\(authorize\) -> .+",
         rf"_\d+ = Router::<ApiState>::route\(move _\d+, move {re.escape(path_local)}, move {re.escape(method)}\) -> .+"],
        "api public route handler")
    exact_normal_uses(blocks, graph, "_5",
        [r"_5 = Router::<ApiState>::new\(\) -> .+",
         rf"_4 = Router::<ApiState>::route\(move _5, move {re.escape(path_local)}, move {re.escape(method)}\) -> .+"],
        "api public router base")
    exact_normal_uses(blocks, graph, "_4",
        [rf"_4 = Router::<ApiState>::route\(move _5, move {re.escape(path_local)}, move {re.escape(method)}\) -> .+",
         r"_3 = Router::<ApiState>::fallback::<.+>\(move _4, not_found\) -> .+"],
        "api public routed intermediate")
    exact_normal_uses(blocks, graph, "_3",
        [r"_3 = Router::<ApiState>::fallback::<.+>\(move _4, not_found\) -> .+",
         r"_2 = Router::<ApiState>::method_not_allowed_fallback::<.+>\(move _3, method_not_allowed\) -> .+"],
        "api public fallback intermediate")
    exact_normal_uses(blocks, graph, "_2",
        [r"_2 = Router::<ApiState>::method_not_allowed_fallback::<.+>\(move _3, method_not_allowed\) -> .+",
         r"_0 = Router::<ApiState>::with_state::<\(\)>\(move _2, move _8\) -> .+"],
        "api public method-fallback intermediate")
    exact_normal_uses(blocks, graph, "_1",
        [r"_9 = move _1;"], "api public router runtime input")
    exact_normal_uses(blocks, graph, "_9",
        [r"_9 = move _1;", r"_8 = ApiState \{ runtime: move _9 \};"],
        "api public router runtime intermediate")
    exact_normal_uses(blocks, graph, "_8",
        [r"_8 = ApiState \{ runtime: move _9 \};",
         r"_0 = Router::<ApiState>::with_state::<\(\)>\(move _2, move _8\) -> .+"],
        "api public router state")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = Router::<ApiState>::with_state::<\(\)>\(move _2, move _8\) -> .+"],
        "api public router result")
    return {"function": "authorization_router", "path": "/v1/authorize",
            "selected_handler": "authorize", "normal_mir_binding": "pass"}


def database_router_wrapper_projection(mir: str) -> dict:
    """Bind the public database constructor to the selected router item."""
    name = ("authorization_router_from_database(_1: impl AsRef<Path>, "
            "_2: AuthorizationApiConfig) -> Result<Router, PortFailure>")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(normal_nodes(graph) == {"bb0", "bb1", "bb2"} and
                graph["bb0"] == ["bb1"] and graph["bb1"] == ["bb2"] and
                v10.assignment_sites(blocks, "_3") ==
                    [("bb0", "authorization_runtime_from_database::<impl AsRef<Path>>(copy _1, copy _2) -> [return: bb1, unwind continue];")] and
                v10.return_writes(blocks) ==
                    [("bb1", "Result::<AuthorizationRuntime, PortFailure>::map::<Router, fn(AuthorizationRuntime) -> Router {authorization_router}>(move _3, authorization_router) -> [return: bb2, unwind continue];")] and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1,
                "api: database router wrapper no longer selects authorization_router")
    exact_normal_uses(blocks, graph, "_1",
        [r"_3 = authorization_runtime_from_database::<impl AsRef<Path>>\(copy _1, copy _2\) -> .+"],
        "api database router path input")
    exact_normal_uses(blocks, graph, "_2",
        [r"_3 = authorization_runtime_from_database::<impl AsRef<Path>>\(copy _1, copy _2\) -> .+"],
        "api database router config input")
    exact_normal_uses(blocks, graph, "_3",
        [r"_3 = authorization_runtime_from_database::<impl AsRef<Path>>\(copy _1, copy _2\) -> .+",
         r"_0 = Result::<AuthorizationRuntime, PortFailure>::map::<Router, fn\(AuthorizationRuntime\) -> Router \{authorization_router\}>\(move _3, authorization_router\) -> .+"],
        "api database router runtime result")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = Result::<AuthorizationRuntime, PortFailure>::map::<Router, fn\(AuthorizationRuntime\) -> Router \{authorization_router\}>\(move _3, authorization_router\) -> .+"],
        "api database router selected result")
    return {"function": name, "selected_router": "authorization_router",
            "normal_mir_binding": "pass", "result_map_semantics_trusted": True,
            "database_runtime_builder_semantics_proven": False}


def deny_projection(mir: str) -> dict:
    _, blocks, graph = v10.selected_body(mir,
        "deny(_1: StatusCode) -> Response<Body>")
    v10.require(normal_nodes(graph) == {"bb0", "bb1"} and
                graph["bb0"] == ["bb1"] and
                v10.assignment_sites(blocks, "_2") == [("bb0", "Deny;")] and
                v10.return_writes(blocks) ==
                    [("bb0", "respond(copy _1, move _2) -> [return: bb1, unwind continue];")] and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1,
                "api: deny helper no longer delegates Deny to respond")
    exact_normal_uses(blocks, graph, "_2",
        [r"_2 = Deny;", r"_0 = respond\(copy _1, move _2\) -> .+"],
        "api deny helper decision")
    exact_normal_uses(blocks, graph, "_1",
        [r"_0 = respond\(copy _1, move _2\) -> .+"],
        "api deny helper status")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = respond\(copy _1, move _2\) -> .+"],
        "api deny return place")
    return {"function": "deny", "selected_decision": "Deny",
            "normal_mir_binding": "pass"}


def respond_projection(mir: str) -> dict:
    _, blocks, graph = v10.selected_body(mir,
        "respond(_1: StatusCode, _2: BinaryAuthorizationDecision) -> Response<Body>")
    node, disc = one(blocks,
        r"(?m)^\s*(_\d+) = discriminant\(_2\);$", "api response decision discriminant")
    v10.require(node == "bb0", "api: response decision source changed")
    v10.single_assignment(blocks, disc.group(1), "api response decision discriminant")
    arms = v10.switch(blocks, node, disc.group(1), ("0", "1", "otherwise"),
                      "api response decision")
    exact_normal_uses(blocks, graph, disc.group(1),
        [rf"{re.escape(disc.group(1))} = discriminant\(_2\);",
         rf"switchInt\(move {re.escape(disc.group(1))}\) -> .+;"],
        "api response decision discriminant")
    allow, deny = arms["0"], arms["1"]
    v10.require(allow != deny and
                re.search(r"(?m)^\s*(_\d+) = const \"ALLOW\";$", blocks[allow]) is not None and
                re.search(r"(?m)^\s*(_\d+) = const \"DENY\";$", blocks[deny]) is not None,
                "api: response ALLOW/DENY polarity changed")
    allow_local = re.search(r"(?m)^\s*(_\d+) = const \"ALLOW\";$", blocks[allow]).group(1)
    deny_local = re.search(r"(?m)^\s*(_\d+) = const \"DENY\";$", blocks[deny]).group(1)
    v10.require(allow_local == deny_local and
                v10.assignment_sites(blocks, allow_local) ==
                    [(deny, 'const "DENY";'), (allow, 'const "ALLOW";')] and
                graph[allow] == ["bb4"] and graph[deny] == ["bb4"],
                "api: response literal merge or writes changed")
    value_node, value = one(blocks,
        rf"(?m)^\s*(_\d+) = copy {re.escape(allow_local)};$",
        "api response selected string")
    selected = value.group(1)
    payload_node, payload_match = one(blocks,
        rf"(?m)^\s*(_\d+) = AuthorizationApiResponse \{{ decision: move {re.escape(selected)} \}};$",
        "api response JSON payload")
    payload = payload_match.group(1)
    json_node, json_match = one(blocks,
        rf"(?m)^\s*(_\d+) = Json::<AuthorizationApiResponse>\(move {re.escape(payload)}\);$",
        "api response JSON wrapper")
    json_value = json_match.group(1)
    v10.require(value_node == payload_node == json_node == "bb4" and
                len(v10.sites(blocks, r"IntoResponse>::into_response\(")) == 1,
                "api: selected decision not projected into JSON response")
    built_node, built = one(blocks,
        r"(?m)^\s*(_\d+) = <\(StatusCode, Json<AuthorizationApiResponse>\) as IntoResponse>::into_response\(move (_\d+)\) -> \[return: (bb\d+),",
        "api response construction")
    response, pair, header_node = built.groups()
    v10.require(built_node == "bb4" and header_node == "bb5" and
                v10.assignment_sites(blocks, pair) ==
                    [("bb4", f"(copy _1, move {json_value});")] and
                ("bb9", f"move {response};") in v10.return_writes(blocks) and
                len(v10.return_writes(blocks)) == 1,
                "api: selected response/status return changed")
    borrow_node, borrow = one(blocks,
        rf"(?m)^\s*(_\d+) = &mut {re.escape(response)};$",
        "api response header borrow")
    borrowed = borrow.group(1)
    headers_node, headers = one(blocks,
        rf"(?m)^\s*(_\d+) = Response::<Body>::headers_mut\(move {re.escape(borrowed)}\) -> \[return: (bb\d+),",
        "api response headers")
    header_map, constant_node = headers.groups()
    header_name_node, header_name_match = one(blocks,
        r"(?m)^\s*(_\d+) = const axum::http::header::CACHE_CONTROL;$",
        "api cache-control header name")
    header_name = header_name_match.group(1)
    header_value_node, header_value_match = one(blocks,
        r'(?m)^\s*(_\d+) = HeaderValue::from_static\(const "no-store"\) -> \[return: (bb\d+),',
        "api no-store header value")
    header_value, insert_node = header_value_match.groups()
    insert_site, _ = one(blocks,
        rf"(?m)^\s*_\d+ = HeaderMap::insert::<HeaderName>\(copy {re.escape(header_map)}, move {re.escape(header_name)}, move {re.escape(header_value)}\) -> \[return: bb8,",
        "api cache-control insertion")
    v10.require(borrow_node == headers_node == "bb5" and constant_node == "bb6" and
                header_name_node == header_value_node == "bb6" and
                insert_node == insert_site == "bb7",
                "api: no-store response header changed")
    v10.single_assignment(blocks, header_name, "api cache-control header name")
    v10.single_assignment(blocks, header_value, "api no-store header value")
    v10.dominated(graph, "bb9", "bb4", "api response construction")
    v10.dominated(graph, "bb9", "bb7", "api no-store header insertion")
    exact_normal_uses(blocks, graph, response,
        [rf"{re.escape(response)} = <\(StatusCode, Json<AuthorizationApiResponse>\) as IntoResponse>::into_response\(move {re.escape(pair)}\) -> .+",
         rf"{re.escape(borrowed)} = &mut {re.escape(response)};",
         rf"_0 = move {re.escape(response)};"],
        "api selected response")
    exact_normal_uses(blocks, graph, allow_local,
        [rf"{re.escape(allow_local)} = const \"DENY\";",
         rf"{re.escape(allow_local)} = const \"ALLOW\";",
         rf"{re.escape(selected)} = copy {re.escape(allow_local)};"],
        "api selected decision literal")
    exact_normal_uses(blocks, graph, selected,
        [rf"{re.escape(selected)} = copy {re.escape(allow_local)};",
         rf"{re.escape(payload)} = AuthorizationApiResponse \{{ decision: move {re.escape(selected)} \}};"],
        "api selected decision value")
    exact_normal_uses(blocks, graph, payload,
        [rf"{re.escape(payload)} = AuthorizationApiResponse \{{ decision: move {re.escape(selected)} \}};",
         rf"{re.escape(json_value)} = Json::<AuthorizationApiResponse>\(move {re.escape(payload)}\);"],
        "api selected response payload")
    exact_normal_uses(blocks, graph, json_value,
        [rf"{re.escape(json_value)} = Json::<AuthorizationApiResponse>\(move {re.escape(payload)}\);",
         rf"{re.escape(pair)} = \(copy _1, move {re.escape(json_value)}\);"],
        "api selected JSON wrapper")
    exact_normal_uses(blocks, graph, pair,
        [rf"{re.escape(pair)} = \(copy _1, move {re.escape(json_value)}\);",
         rf"{re.escape(response)} = <\(StatusCode, Json<AuthorizationApiResponse>\) as IntoResponse>::into_response\(move {re.escape(pair)}\) -> .+"],
        "api selected status/JSON pair")
    exact_normal_uses(blocks, graph, header_map,
        [rf"{re.escape(header_map)} = Response::<Body>::headers_mut\(move {re.escape(borrowed)}\) -> .+",
         rf"_\d+ = HeaderMap::insert::<HeaderName>\(copy {re.escape(header_map)}, move {re.escape(header_name)}, move {re.escape(header_value)}\) -> .+"],
        "api selected response headers")
    exact_normal_uses(blocks, graph, "_1",
        [rf"{re.escape(pair)} = \(copy _1, move {re.escape(json_value)}\);"],
        "api response status input")
    exact_normal_uses(blocks, graph, "_2",
        [rf"{re.escape(disc.group(1))} = discriminant\(_2\);"],
        "api response decision input")
    v10.require(len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1 and
                re.search(r"(?m)^\s*return;$", blocks["bb9"]) is not None,
                "api: alternate response normal return")
    exact_normal_uses(blocks, graph, "_0",
        [rf"_0 = move {re.escape(response)};"],
        "api response return place")
    return {"function": "respond", "allow_literal": "ALLOW",
            "deny_literal": "DENY", "cache_control": "no-store",
            "selected_response_normal_mir_binding": "pass",
            "axum_serde_http_bytes_observed": False}


def worker_projection(mir: str) -> dict:
    checked = v10.root_output_provenance(API, mir)
    inner_name = checked["function"]
    inner_prefix = inner_name.split("(", 1)[0]
    worker_prefix = inner_prefix.rsplit("::{closure#0}", 1)[0]
    names = [name for name in v5.functions(mir) if name.startswith(worker_prefix + "(")
             and name.endswith("-> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>")]
    v10.require(len(names) == 1, "api: selected production worker identity changed")
    name = names[0]
    marker_match = re.search(r"(\{closure@src/lib\.rs:[^}]+\})", inner_name)
    v10.require(marker_match is not None, "api: V10 inner worker marker missing")
    marker = marker_match.group(1)
    _, blocks, graph = v10.selected_body(mir, name)
    capture_node, capture = one(blocks,
        rf"(?m)^\s*(_\d+) = {re.escape(marker)} \{{ engine: move (_\d+), request: move \(_1\.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest\) \}};$",
        "api checked worker closure capture")
    closure_local, engine_ref = capture.groups()
    borrowed_node, borrowed = one(blocks,
        rf"(?m)^\s*{re.escape(engine_ref)} = &mut (_\d+);$",
        "api checked worker engine borrow")
    engine = borrowed.group(1)
    taken_node, taken = one(blocks,
        r"(?m)^\s*(_\d+) = EnginePool::take\(copy (_\d+)\) -> \[return: (bb\d+),",
        "api worker pool take")
    taken_result, take_ref, take_return = taken.groups()
    branch_take_node, branch_take = one(blocks,
        rf"(?m)^\s*(_\d+) = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::branch\(move {re.escape(taken_result)}\) -> \[return: (bb\d+),",
        "api worker taken engine branch")
    take_flow, take_branch = branch_take.groups()
    continued_node, continued = one(blocks,
        rf"(?m)^\s*(_\d+) = move \(\({re.escape(take_flow)} as Continue\)\.0: auth_foundation_authorization_admission_service::SqliteAdmissionService\);$",
        "api worker selected engine")
    taken_engine = continued.group(1)
    take_disc_node, take_disc = one(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\({re.escape(take_flow)}\);$",
        "api worker take branch discriminant")
    take_disc_local = take_disc.group(1)
    take_arms = v10.switch(blocks, take_disc_node, take_disc_local,
                           ("0", "1", "otherwise"), "api worker take result")
    v10.require(take_disc_node == take_branch and
                take_arms == {"0": continued_node, "1": "bb12", "otherwise": "bb10"} and
                v10.assignment_sites(blocks, taken_engine) ==
                    [(continued_node, f"move (({take_flow} as Continue).0: auth_foundation_authorization_admission_service::SqliteAdmissionService);")],
                "api: pool take success/failure arms changed")
    v10.require(take_return == branch_take_node and take_branch in graph[branch_take_node] and
                taken_node == "bb7" and continued_node == borrowed_node == capture_node and
                v10.assignment_sites(blocks, engine) ==
                    [(continued_node, f"move {taken_engine};")],
                "api: checked closure engine is not selected pool engine")
    wrapped_node, wrapped = one(blocks,
        rf"(?m)^\s*(_\d+) = AssertUnwindSafe::<{re.escape(marker)}>\(move {re.escape(closure_local)}\);$",
        "api checked worker unwind wrapper")
    wrapped_local = wrapped.group(1)
    call_node, call = one(blocks,
        rf"(?m)^\s*(_\d+) = std::panic::catch_unwind::<AssertUnwindSafe<{re.escape(marker)}>, BinaryAuthorizationDecision>\(move {re.escape(wrapped_local)}\) -> \[return: (bb\d+),",
        "api checked worker catch_unwind")
    outcome, branch_node = call.groups()
    v10.require(capture_node == wrapped_node == call_node and
                branch_node in graph[call_node],
                "api: V10-checked worker not selected by catch_unwind")
    branch_node_actual, branch = one(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\({re.escape(outcome)}\);$",
        "api checked worker outcome branch")
    outcome_disc = branch.group(1)
    v10.require(branch_node_actual == branch_node,
                "api: checked worker outcome not branched")
    v10.single_assignment(blocks, outcome, "api checked worker outcome")
    v10.single_assignment(blocks, outcome_disc, "api checked worker outcome discriminant")
    arms = v10.switch(blocks, branch_node, outcome_disc,
                      ("0", "1", "otherwise"), "api checked worker result")
    ok_arm, panic_arm = arms["0"], arms["1"]
    decision_node, decision = one(blocks,
        rf"(?m)^\s*(_\d+) = copy \(\({re.escape(outcome)} as Ok\)\.0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision\);$",
        "api checked worker decision payload")
    decision_local = decision.group(1)
    v10.require(decision_node == ok_arm and
                v10.assignment_sites(blocks, decision_local) ==
                    [(ok_arm, f"copy (({outcome} as Ok).0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision);")],
                "api: worker decision is not checked inner result")
    result_node, result = one(blocks,
        rf"(?m)^\s*(_\d+) = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok\(copy {re.escape(decision_local)}\);$",
        "api checked worker Ok result")
    result_local = result.group(1)
    v10.require(result_node != panic_arm and
                v10.assignment_sites(blocks, result_local) ==
                    [(panic_arm, "Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _40);"),
                     (result_node, f"Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy {decision_local});")] and
                ("bb22", f"copy {result_local};") in v10.return_writes(blocks),
                "api: worker return result classification changed")
    v10.require(v10.assignment_sites(blocks, "_40") ==
                [(panic_arm, "AuthorizationRuntimeError::WorkerUnavailable;")],
                "api: worker panic error classification changed")
    writes = v10.return_writes(blocks)
    v10.require(len(writes) == 3 and
                all(node == "bb22" or
                    value.startswith("<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> as FromResidual<Result<Infallible, AuthorizationRuntimeError>>>::from_residual(copy ")
                    for node, value in writes) and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1,
                "api: worker has unclassified normal return")
    pool_node, _ = one(blocks,
        r"(?m)^\s*_\d+ = EnginePool::put\(copy _\d+, move _\d+\) -> \[return: (bb\d+),",
        "api worker pool return")
    put_line = re.search(r"(?m)^\s*_\d+ = EnginePool::put\(copy (_\d+), move (_\d+)\) ->",
                         blocks[pool_node])
    v10.require(put_line is not None, "api: pool return operands changed")
    put_ref, returned_engine = put_line.groups()
    put_result_match = re.search(r"(?m)^\s*(_\d+) = EnginePool::put\(", blocks[pool_node])
    v10.require(put_result_match is not None,
                "api: worker pool return result missing")
    put_result = put_result_match.group(1)
    put_branch_node, put_branch = one(blocks,
        rf"(?m)^\s*(_\d+) = <Result<\(\), AuthorizationRuntimeError> as Try>::branch\(move {re.escape(put_result)}\) -> \[return: (bb\d+),",
        "api worker pool return branch")
    put_flow, put_disc_node = put_branch.groups()
    put_disc_site, put_disc = one(blocks,
        rf"(?m)^\s*(_\d+) = discriminant\({re.escape(put_flow)}\);$",
        "api worker pool return discriminant")
    put_disc_local = put_disc.group(1)
    put_arms = v10.switch(blocks, put_disc_site, put_disc_local,
                          ("0", "1", "otherwise"), "api worker pool return result")
    v10.require(put_branch_node in graph[pool_node] and
                put_disc_site == put_disc_node and
                put_arms == {"0": result_node, "1": "bb20", "otherwise": "bb10"},
                "api: pool return success/failure arms changed")
    v10.require(v10.assignment_sites(blocks, returned_engine) ==
                [(pool_node, f"move {engine};")] and
                len(v10.sites(blocks, r"EnginePool::take\(")) == 1 and
                len(v10.sites(blocks, r"EnginePool::put\(")) == 1,
                "api: different engine returned to pool")
    v10.require(v10.assignment_sites(blocks, "_22") ==
                    [("bb6", "&(_1.2: std::sync::Arc<EnginePool>);")] and
                v10.assignment_sites(blocks, take_ref) ==
                    [("bb6", "<Arc<EnginePool> as Deref>::deref(move _22) -> [return: bb7, unwind: bb32];")] and
                v10.assignment_sites(blocks, "_36") ==
                    [("bb15", "&(_1.2: std::sync::Arc<EnginePool>);")] and
                v10.assignment_sites(blocks, put_ref) ==
                    [("bb15", "<Arc<EnginePool> as Deref>::deref(move _36) -> [return: bb16, unwind: bb31];")],
                "api: worker take/put pool identity changed")
    v10.require(pool_node != panic_arm and
                v8.reachable(graph, ok_arm, pool_node) and
                v10.dominated(graph, result_node, pool_node, "api worker pool return") is None and
                not v8.reachable(graph, panic_arm, result_node) and
                not any(v8.reachable(graph, node, result_node) for node, _ in writes
                        if node not in ("bb22", result_node)),
                "api: worker failure reaches successful result")
    v10.require({node for node, _ in writes} == {"bb12", "bb20", "bb22"} and
                writes[-1] == ("bb22", f"copy {result_local};") and
                re.fullmatch(r"<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> as FromResidual<Result<Infallible, AuthorizationRuntimeError>>>::from_residual\(copy _\d+\) -> \[return: bb50, unwind: bb32\];", writes[0][1]) is not None and
                re.fullmatch(r"<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> as FromResidual<Result<Infallible, AuthorizationRuntimeError>>>::from_residual\(copy _\d+\) -> \[return: bb21, unwind: bb31\];", writes[1][1]) is not None and
                re.search(r"(?m)^\s*return;$", blocks["bb30"]) is not None,
                "api: worker return writes not fully classified")
    exact_normal_uses(blocks, graph, closure_local,
        [rf"{re.escape(closure_local)} = {re.escape(marker)} \{{ engine: move {re.escape(engine_ref)}, request: move \(_1\.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest\) \}};",
         rf"{re.escape(wrapped_local)} = AssertUnwindSafe::<{re.escape(marker)}>\(move {re.escape(closure_local)}\);"],
        "api checked worker closure")
    exact_normal_uses(blocks, graph, taken_result,
        [rf"{re.escape(taken_result)} = EnginePool::take\(copy {re.escape(take_ref)}\) -> .+",
         rf"{re.escape(take_flow)} = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::branch\(move {re.escape(taken_result)}\) -> .+"],
        "api selected pool take result")
    exact_normal_uses(blocks, graph, take_flow,
        [rf"{re.escape(take_flow)} = <Result<SqliteAdmissionService, AuthorizationRuntimeError> as Try>::branch\(move {re.escape(taken_result)}\) -> .+",
         rf"{re.escape(take_disc_local)} = discriminant\({re.escape(take_flow)}\);",
         rf"{re.escape(taken_engine)} = move \(\({re.escape(take_flow)} as Continue\)\.0: .+\);",
         rf"_24 = copy \(\({re.escape(take_flow)} as Break\)\.0: .+\);"],
        "api selected pool take branch")
    exact_normal_uses(blocks, graph, take_disc_local,
        [rf"{re.escape(take_disc_local)} = discriminant\({re.escape(take_flow)}\);",
         rf"switchInt\(move {re.escape(take_disc_local)}\) -> .+;"],
        "api selected pool take discriminant")
    exact_normal_uses(blocks, graph, taken_engine,
        [rf"{re.escape(taken_engine)} = move \(\({re.escape(take_flow)} as Continue\)\.0: .+\);",
         rf"{re.escape(engine)} = move {re.escape(taken_engine)};"],
        "api selected taken engine")
    exact_normal_uses(blocks, graph, put_result,
        [rf"{re.escape(put_result)} = EnginePool::put\(copy {re.escape(put_ref)}, move {re.escape(returned_engine)}\) -> .+",
         rf"{re.escape(put_flow)} = <Result<\(\), AuthorizationRuntimeError> as Try>::branch\(move {re.escape(put_result)}\) -> .+"],
        "api selected pool return result")
    exact_normal_uses(blocks, graph, put_flow,
        [rf"{re.escape(put_flow)} = <Result<\(\), AuthorizationRuntimeError> as Try>::branch\(move {re.escape(put_result)}\) -> .+",
         rf"{re.escape(put_disc_local)} = discriminant\({re.escape(put_flow)}\);",
         rf"_39 = copy \(\({re.escape(put_flow)} as Break\)\.0: .+\);"],
        "api selected pool return branch")
    exact_normal_uses(blocks, graph, put_disc_local,
        [rf"{re.escape(put_disc_local)} = discriminant\({re.escape(put_flow)}\);",
         rf"switchInt\(move {re.escape(put_disc_local)}\) -> .+;"],
        "api selected pool return discriminant")
    exact_normal_uses(blocks, graph, decision_local,
        [rf"{re.escape(decision_local)} = copy \(\({re.escape(outcome)} as Ok\)\.0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision\);",
         rf"{re.escape(result_local)} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok\(copy {re.escape(decision_local)}\);"],
        "api checked worker decision")
    exact_normal_uses(blocks, graph, engine,
        [rf"{re.escape(engine)} = move {re.escape(taken_engine)};",
         rf"{re.escape(engine_ref)} = &mut {re.escape(engine)};",
         rf"{re.escape(returned_engine)} = move {re.escape(engine)};",
         rf"drop\({re.escape(engine)}\) -> .+"],
        "api selected pool engine")
    exact_normal_uses(blocks, graph, engine_ref,
        [rf"{re.escape(engine_ref)} = &mut {re.escape(engine)};",
         rf"{re.escape(closure_local)} = {re.escape(marker)} \{{ engine: move {re.escape(engine_ref)}, request: move \(_1\.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest\) \}};"],
        "api checked worker engine borrow")
    exact_normal_uses(blocks, graph, returned_engine,
        [rf"{re.escape(returned_engine)} = move {re.escape(engine)};",
         rf"_\d+ = EnginePool::put\(copy {re.escape(put_ref)}, move {re.escape(returned_engine)}\) -> .+"],
        "api returned pool engine")
    exact_normal_uses(blocks, graph, result_local,
        [rf"{re.escape(result_local)} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _\d+\);",
         rf"{re.escape(result_local)} = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok\(copy {re.escape(decision_local)}\);",
         rf"_0 = copy {re.escape(result_local)};"],
        "api worker selected Result")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = <Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> as FromResidual<Result<Infallible, AuthorizationRuntimeError>>>::from_residual\(copy _24\) -> .+",
         r"_0 = <Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> as FromResidual<Result<Infallible, AuthorizationRuntimeError>>>::from_residual\(copy _39\) -> .+",
         rf"_0 = copy {re.escape(result_local)};"],
        "api worker return place")
    request_field = "(_1.3: auth_foundation_authorization_state_model::InboundAuthorizationRequest)"
    request_field_uses = [(node, line.strip()) for node, content in blocks.items()
                          if v8.reachable(graph, "bb0", node)
                          for line in content.splitlines() if "_1.3:" in line]
    v10.require(request_field_uses ==
                [(capture_node, f"{closure_local} = {marker} {{ engine: move {engine_ref}, request: move {request_field} }};"),
                 ("bb42", f"drop({request_field}) -> [return: bb30, unwind continue];")] and
                v10.assignment_sites(blocks, "_1") == [] and
                not any(re.search(r"(?<!\w)&(?:mut )?_1\b", content)
                        for node, content in blocks.items()
                        if v8.reachable(graph, "bb0", node)),
                "api: worker captured request field rebound or escaped")
    return {"function": name, "v10_checked_function": inner_name,
            "normal_mir_result_provenance": "pass",
            "catch_unwind_and_pool_semantics_proven": False}


def runtime_poll_projection(mir: str, worker: dict) -> dict:
    """Bound only the selected normal-MIR worker/timeout result spine."""
    name = ("<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}"
            "(_1: Pin<&mut {async fn body of AuthorizationRuntime::authorize()}>, "
            "_2: &mut Context<'_>) -> "
            "Poll<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(v10.assignment_sites(blocks, "_104") ==
                    [("bb0", "copy (_1.0: &mut {async fn body of AuthorizationRuntime::authorize()});")] and
                not any(re.search(r"(?<!\w)&(?:mut )?_104\b", content)
                        for node, content in blocks.items()
                        if v8.reachable(graph, "bb0", node)),
                "api: runtime coroutine body pointer rebinding or escape")
    marker_match = re.search(r"(\{closure@src/lib\.rs:[^}]+\})", worker["function"])
    v10.require(marker_match is not None, "api: selected worker marker missing")
    marker = marker_match.group(1)
    capture = (f"{marker} {{ permit: move _10, metrics: move _44, pool: move _40, "
               "request: move (((*_104) as variant#3).1: "
               "auth_foundation_authorization_state_model::InboundAuthorizationRequest) };")
    v10.require(v10.assignment_sites(blocks, "_49") == [("bb26", capture)] and
                v10.assignment_sites(blocks, "_48") ==
                    [("bb26", f"spawn_blocking::<{marker}, Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>(move _49) -> [return: bb27, unwind: bb64];")] and
                v10.assignment_sites(blocks, "_56") == [("bb28", "move _48;")] and
                v10.assignment_sites(blocks, "_52") ==
                    [("bb28", "timeout::<tokio::task::JoinHandle<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>>(move _53, move _56) -> [return: bb29, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_53") ==
                    [("bb28", "copy ((*_54).3: std::time::Duration);")],
                "api: selected worker handle/evaluation timeout binding changed")
    v10.require(v10.assignment_sites(blocks, "_108") ==
                    [("bb72", "no_retag copy (((*_104) as variant#4).0: &AuthorizationRuntime);")] and
                v10.assignment_sites(blocks, "_43") ==
                    [("bb72", "&((*_108).0: std::sync::Arc<AuthorizationRuntimeInner>);")] and
                v10.assignment_sites(blocks, "_42") ==
                    [("bb72", "<Arc<AuthorizationRuntimeInner> as Deref>::deref(move _43) -> [return: bb23, unwind: bb66];")] and
                v10.assignment_sites(blocks, "_41") ==
                    [("bb23", "&((*_42).0: std::sync::Arc<EnginePool>);")] and
                v10.assignment_sites(blocks, "_40") ==
                    [("bb23", "<Arc<EnginePool> as Clone>::clone(copy _41) -> [return: bb24, unwind: bb66];")],
                "api: worker pool not selected from runtime state")
    v10.require(v10.assignment_sites(blocks, "_51") ==
                    [("bb29", "<tokio::time::Timeout<tokio::task::JoinHandle<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>> as IntoFuture>::into_future(move _52) -> [return: bb30, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_57") ==
                    [("bb32", "<tokio::time::Timeout<tokio::task::JoinHandle<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>> as Future>::poll(move _58, copy _60) -> [return: bb33, unwind: bb62];")] and
                "move _51;" in blocks["bb30"] and
                "&mut (((*_104) as variant#4).1: tokio::time::Timeout<tokio::task::JoinHandle" in blocks["bb31"] and
                "Pin::<&mut tokio::time::Timeout<tokio::task::JoinHandle" in blocks["bb31"],
                "api: selected timeout future/poll binding changed")
    state_timeout = ("(((*_104) as variant#4).1: "
                     "tokio::time::Timeout<tokio::task::JoinHandle<"
                     "std::result::Result<auth_foundation_authorization_state_model::"
                     "BinaryAuthorizationDecision, AuthorizationRuntimeError>>>)")
    state_self = "(((*_104) as variant#4).0: &AuthorizationRuntime)"
    state_request = ("(((*_104) as variant#3).1: "
                     "auth_foundation_authorization_state_model::InboundAuthorizationRequest)")
    self_uses = [(node, line.strip()) for node, content in blocks.items()
                 if v8.reachable(graph, "bb0", node)
                 for line in content.splitlines() if "variant#4).0: &AuthorizationRuntime" in line]
    expected_self_uses = [(node, f"{local} = no_retag copy {state_self};")
                          for node, local in (("bb3", "_105"), ("bb4", "_106"),
                                              ("bb17", "_107"), ("bb24", "_109"),
                                              ("bb27", "_110"), ("bb40", "_111"),
                                              ("bb41", "_112"), ("bb49", "_113"),
                                              ("bb50", "_114"), ("bb72", "_108"))]
    expected_self_uses += [
        ("bb86", f"{state_self} = copy ((*_104).0: &AuthorizationRuntime);"),
        ("bb86", f"_115 = no_retag copy {state_self};"),
    ]
    request_uses = [(node, line.strip()) for node, content in blocks.items()
                    if v8.reachable(graph, "bb0", node)
                    for line in content.splitlines()
                    if "variant#3).1: auth_foundation_authorization_state_model::InboundAuthorizationRequest" in line]
    v10.require(self_uses == expected_self_uses and
                request_uses ==
                    [("bb26", f"_49 = {capture}"),
                     ("bb76", f"drop({state_request}) -> [return: bb59, unwind: bb71];"),
                     ("bb86", f"{state_request} = move ((*_104).1: auth_foundation_authorization_state_model::InboundAuthorizationRequest);")],
                "api: runtime coroutine input state rebinding or escape")
    state_uses = [(node, line.strip()) for node, content in blocks.items()
                  if v8.reachable(graph, "bb0", node)
                  for line in content.splitlines() if "variant#4).1: tokio::time::Timeout" in line]
    v10.require(state_uses ==
                [("bb30", f"{state_timeout} = move _51;"),
                 ("bb31", f"_59 = &mut {state_timeout};"),
                 ("bb35", f"drop({state_timeout}) -> [return: bb36, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_110") ==
                    [("bb27", "no_retag copy (((*_104) as variant#4).0: &AuthorizationRuntime);")] and
                v10.assignment_sites(blocks, "_55") ==
                    [("bb27", "&((*_110).0: std::sync::Arc<AuthorizationRuntimeInner>);")] and
                v10.assignment_sites(blocks, "_54") ==
                    [("bb27", "<Arc<AuthorizationRuntimeInner> as Deref>::deref(move _55) -> [return: bb28, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_59") ==
                    [("bb31", f"&mut {state_timeout};")] and
                v10.assignment_sites(blocks, "_58") ==
                    [("bb31", "Pin::<&mut tokio::time::Timeout<tokio::task::JoinHandle<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>>>::new_unchecked(copy _59) -> [return: bb32, unwind: bb62];")],
                "api: runtime evaluation duration/stored timeout future changed")
    v10.require(v10.switch(blocks, "bb33", "_62", ("0", "1", "otherwise"),
                           "api runtime poll") ==
                {"0": "bb35", "1": "bb34", "otherwise": "bb13"} and
                v10.assignment_sites(blocks, "_62") ==
                    [("bb33", "discriminant(_57);")] and
                v10.assignment_sites(blocks, "_63") ==
                    [("bb35", "move ((_57 as Ready).0: std::result::Result<std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>, tokio::time::error::Elapsed>);")] and
                v10.assignment_sites(blocks, "_50") == [("bb35", "move _63;")],
                "api: timeout Poll Ready/Pending value changed")
    for node, disc, arms in (
        ("bb36", "_67", {"0": "bb37", "1": "bb41", "otherwise": "bb13"}),
        ("bb37", "_66", {"0": "bb38", "1": "bb40", "otherwise": "bb13"}),
        ("bb38", "_65", {"0": "bb39", "1": "bb40", "otherwise": "bb13"}),
    ):
        v10.require(v10.switch(blocks, node, disc, ("0", "1", "otherwise"),
                               "api runtime nested Result") == arms,
                    "api: timeout/join/worker result polarity changed")
    v10.require(v10.assignment_sites(blocks, "_67") ==
                    [("bb36", "discriminant(_50);")] and
                v10.assignment_sites(blocks, "_66") ==
                    [("bb37", "discriminant(((_50 as Ok).0: std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>));")] and
                v10.assignment_sites(blocks, "_65") ==
                    [("bb38", "discriminant(((((_50 as Ok).0: std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>) as Ok).0: std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>));")],
                "api: nested timeout/join/worker discriminants changed")
    v10.require(v10.assignment_sites(blocks, "_84") ==
                [("bb39", "copy ((((((_50 as Ok).0: std::result::Result<std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>, tokio::task::JoinError>) as Ok).0: std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>) as Ok).0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision);")] and
                v10.assignment_sites(blocks, "_102") ==
                    [("bb22", "Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _39);"),
                     ("bb44", "Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _75);"),
                     ("bb47", "Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err(move _83);"),
                     ("bb55", "Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok(copy _84);")] and
                v10.assignment_sites(blocks, "_39") ==
                    [("bb22", "AuthorizationRuntimeError::Saturated;")] and
                v10.assignment_sites(blocks, "_75") ==
                    [("bb44", "AuthorizationRuntimeError::TimedOut;")] and
                v10.assignment_sites(blocks, "_83") ==
                    [("bb47", "AuthorizationRuntimeError::WorkerUnavailable;")],
                "api: runtime success/error result classification changed")
    v10.dominated(graph, "bb55", "bb39", "api runtime checked success")
    v10.require(all({node for node, successors in graph.items() if target in successors} ==
                    expected for target, expected in (
                        ("bb35", {"bb33"}), ("bb37", {"bb36"}),
                        ("bb38", {"bb37"}), ("bb39", {"bb38"}),
                        ("bb55", {"bb87", "bb88"}))) and
                v10.assignment_sites(blocks, "_85") ==
                    [("bb48", "discriminant(_84);")],
                "api: runtime success has alternate normal predecessor")
    v10.require(v10.assignment_sites(blocks, "_0") ==
                    [("bb14", "Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Pending;"),
                     ("bb34", "Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Pending;"),
                     ("bb60", "Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Ready(move _102);")] and
                all(f"discriminant((*_104)) = {state};" in blocks[node]
                    for node, state in (("bb14", 3), ("bb34", 4), ("bb60", 1))) and
                v10.assignment_sites(blocks, "_103") ==
                    [("bb0", "discriminant((*_104));")] and
                v10.switch(blocks, "bb0", "_103",
                           ("0", "1", "2", "3", "4", "otherwise"),
                           "api runtime coroutine state") ==
                    {"0": "bb86", "1": "bb85", "2": "bb84", "3": "bb82",
                     "4": "bb83", "otherwise": "bb13"} and
                "goto -> bb31;" in blocks["bb83"] and
                "goto -> bb10;" in blocks["bb82"] and
                v10.switch(blocks, "bb48", "_85", ("0", "1", "otherwise"),
                           "api runtime decision metrics") ==
                    {"0": "bb50", "1": "bb49", "otherwise": "bb13"} and
                all(v8.reachable(graph, node, "bb55") for node in ("bb49", "bb50")),
                "api: runtime completed/suspended Poll output changed")
    for local, patterns in (
        ("_49", [rf"_49 = {re.escape(capture)}", rf"_48 = spawn_blocking::<.+>\(move _49\) -> .+"]),
        ("_108", [r"_108 = no_retag copy \(\(\(\*_104\) as variant#4\)\.0: &AuthorizationRuntime\);", r"_43 = &\(\(\*_108\)\.0: std::sync::Arc<AuthorizationRuntimeInner>\);"]),
        ("_43", [r"_43 = &\(\(\*_108\)\.0: std::sync::Arc<AuthorizationRuntimeInner>\);", r"_42 = <Arc<AuthorizationRuntimeInner> as Deref>::deref\(move _43\) -> .+"]),
        ("_42", [r"_42 = <Arc<AuthorizationRuntimeInner> as Deref>::deref\(move _43\) -> .+", r"_41 = &\(\(\*_42\)\.0: std::sync::Arc<EnginePool>\);"]),
        ("_41", [r"_41 = &\(\(\*_42\)\.0: std::sync::Arc<EnginePool>\);", r"_40 = <Arc<EnginePool> as Clone>::clone\(copy _41\) -> .+"]),
        ("_40", [r"_40 = <Arc<EnginePool> as Clone>::clone\(copy _41\) -> .+", rf"_49 = {re.escape(capture)}"]),
        ("_48", [rf"_48 = spawn_blocking::<.+>\(move _49\) -> .+", r"_56 = move _48;"]),
        ("_56", [r"_56 = move _48;", r"_52 = timeout::<.+>\(move _53, move _56\) -> .+"]),
        ("_110", [r"_110 = no_retag copy \(\(\(\*_104\) as variant#4\)\.0: &AuthorizationRuntime\);", r"_55 = &\(\(\*_110\)\.0: std::sync::Arc<AuthorizationRuntimeInner>\);"]),
        ("_55", [r"_55 = &\(\(\*_110\)\.0: std::sync::Arc<AuthorizationRuntimeInner>\);", r"_54 = <Arc<AuthorizationRuntimeInner> as Deref>::deref\(move _55\) -> .+"]),
        ("_54", [r"_54 = <Arc<AuthorizationRuntimeInner> as Deref>::deref\(move _55\) -> .+", r"_53 = copy \(\(\*_54\)\.3: std::time::Duration\);"]),
        ("_53", [r"_53 = copy \(\(\*_54\)\.3: std::time::Duration\);", r"_52 = timeout::<.+>\(move _53, move _56\) -> .+"]),
        ("_52", [r"_52 = timeout::<.+>\(move _53, move _56\) -> .+", r"_51 = <.+ as IntoFuture>::into_future\(move _52\) -> .+"]),
        ("_51", [r"_51 = <.+ as IntoFuture>::into_future\(move _52\) -> .+", r".+ = move _51;"]),
        ("_59", [rf"_59 = &mut {re.escape(state_timeout)};", r"_58 = Pin::<.+>::new_unchecked\(copy _59\) -> .+"]),
        ("_58", [r"_58 = Pin::<.+>::new_unchecked\(copy _59\) -> .+", r"_57 = <.+ as Future>::poll\(move _58, copy _60\) -> .+"]),
        ("_57", [r"_57 = <.+ as Future>::poll\(move _58, copy _60\) -> .+", r"_62 = discriminant\(_57\);", r"_63 = move \(\(_57 as Ready\)\.0: .+\);"]),
        ("_62", [r"_62 = discriminant\(_57\);", r"switchInt\(move _62\) -> .+;"]),
        ("_103", [r"_103 = discriminant\(\(\*_104\)\);", r"switchInt\(move _103\) -> .+;"]),
        ("_63", [r"_63 = move \(\(_57 as Ready\)\.0: .+\);", r"_50 = move _63;"]),
        ("_50", [r"_50 = move _63;", r"_67 = discriminant\(_50\);", r"_66 = discriminant\(.+_50 as Ok.+\);", r"_65 = discriminant\(.+_50 as Ok.+\);", r"_84 = copy .+_50 as Ok.+;", r"drop\(_50\) -> \[return: bb48, .+", r"drop\(_50\) -> \[return: bb57, .+"]),
        ("_67", [r"_67 = discriminant\(_50\);", r"switchInt\(move _67\) -> .+;"]),
        ("_66", [r"_66 = discriminant\(.+_50 as Ok.+\);", r"switchInt\(move _66\) -> .+;"]),
        ("_65", [r"_65 = discriminant\(.+_50 as Ok.+\);", r"switchInt\(move _65\) -> .+;"]),
        ("_84", [r"_84 = copy \(\(\(\(\(\(_50 as Ok\).+;", r"_85 = discriminant\(_84\);", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok\(copy _84\);"]),
        ("_39", [r"_39 = AuthorizationRuntimeError::Saturated;", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _39\);"]),
        ("_75", [r"_75 = AuthorizationRuntimeError::TimedOut;", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _75\);"]),
        ("_83", [r"_83 = AuthorizationRuntimeError::WorkerUnavailable;", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _83\);"]),
        ("_102", [r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _39\);", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _75\);", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Err\(move _83\);", r"_102 = Result::<BinaryAuthorizationDecision, AuthorizationRuntimeError>::Ok\(copy _84\);", r"_0 = Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Ready\(move _102\);"]),
    ):
        exact_normal_uses(blocks, graph, local, patterns,
                          f"api runtime selected {local}")
    output_lines = sorted(line.strip() for node, content in blocks.items()
                          if v8.reachable(graph, "bb0", node)
                          for line in content.splitlines()
                          if re.search(r"(?<![A-Za-z0-9_])_0\b", line))
    v10.require(output_lines == sorted([
        "_0 = Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Pending;",
        "_0 = Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Pending;",
        "_0 = Poll::<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>::Ready(move _102);",
    ]), "api: runtime Poll output has alternate normal use")
    return {"function": name, "selected_worker": worker["function"],
            "normal_mir_poll_result_provenance": "pass",
            "tokio_execution_and_cancellation_proven": False}


def async_constructor_projection(mir: str, kind: str) -> dict:
    """Bind public async input capture to the selected poll-body input type."""
    if kind == "handler":
        name = ("authorize(_1: State<ApiState>, _2: axum::http::Request<Body>) "
                "-> {async fn body of authorize()}")
        captures = "__arg0: move _1, request: move _2"
        poll_prefix = "authorize::{closure#0}("
    elif kind == "runtime":
        name = ("<impl at src/lib.rs:247:1: 247:26>::authorize(_1: &AuthorizationRuntime, "
                "_2: InboundAuthorizationRequest) "
                "-> {async fn body of AuthorizationRuntime::authorize()}")
        captures = "self: copy _1, request: move _2"
        poll_prefix = "<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}("
    else:
        raise ValueError(f"api: unknown async constructor kind {kind}")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(normal_nodes(graph) == {"bb0"} and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1 and
                len([value for value in v5.functions(mir) if value.startswith(poll_prefix)]) == 1,
                f"api: {kind} async constructor/poll identity changed")
    node, capture = one(blocks,
        rf"(?m)^\s*_0 = (\{{coroutine@src/lib\.rs:[^}}]+\}}) \{{ {re.escape(captures)} \}};$",
        f"api {kind} async constructor capture")
    marker = capture.group(1)
    v10.require(node == "bb0" and
                v10.return_writes(blocks) == [("bb0", f"{marker} {{ {captures} }};")],
                f"api: {kind} async input capture changed")
    selected_line = rf"_0 = {re.escape(marker)} \{{ {re.escape(captures)} \}};"
    for local in ("_0", "_1", "_2"):
        exact_normal_uses(blocks, graph, local, [selected_line],
                          f"api {kind} async constructor {local}")
    return {"function": name, "poll_function_prefix": poll_prefix,
            "normal_mir_input_capture": "pass",
            "rust_async_lowering_trusted": True}


def request_conversion_projection(mir: str) -> dict:
    name = ("<impl at src/lib.rs:421:1: 421:67>::from(_1: AuthorizationApiRequest) "
            "-> InboundAuthorizationRequest")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(normal_nodes(graph) == {"bb0"} and
                v10.assignment_sites(blocks, "_2") ==
                    [("bb0", "move (_1.0: std::string::String);")] and
                v10.assignment_sites(blocks, "_3") ==
                    [("bb0", "move (_1.1: std::string::String);")] and
                v10.assignment_sites(blocks, "_4") ==
                    [("bb0", "move (_1.2: std::string::String);")] and
                v10.return_writes(blocks) ==
                    [("bb0", "InboundAuthorizationRequest { request_id: move _2, authentication_evidence_ref: move _3, route_id: move _4 };")] and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 1,
                "api: parsed request field projection changed")
    exact_normal_uses(blocks, graph, "_1",
        [rf"{local} = move \(_1\.{index}: std::string::String\);"
         for index, local in enumerate(("_2", "_3", "_4"))],
        "api parsed request input")
    for local, field in (("_2", "request_id"),
                         ("_3", "authentication_evidence_ref"),
                         ("_4", "route_id")):
        exact_normal_uses(blocks, graph, local,
            [rf"{re.escape(local)} = move \(_1\.[012]: std::string::String\);",
             rf"_0 = InboundAuthorizationRequest \{{ .*{field}: move {re.escape(local)}.* \}};"],
            f"api parsed request {field}")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = InboundAuthorizationRequest \{ request_id: move _2, authentication_evidence_ref: move _3, route_id: move _4 \};"],
        "api parsed request return place")
    return {"function": name, "normal_mir_field_mapping": "pass",
            "serde_deserialization_proven": False}


def content_type_projection(mir: str) -> dict:
    v10.require(re.search(r"(?m)^const MAX_AUTHORIZATION_BODY_BYTES: usize = const 1024_usize;$",
                          mir) is not None,
                "api: compiled authorization body limit changed")
    name = "is_json_content_type(_1: std::option::Option<&HeaderValue>) -> bool"
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(normal_nodes(graph) == {"bb0", "bb1", "bb2", "bb3"} and
                v10.assignment_sites(blocks, "_3") ==
                    [("bb0", "std::option::Option::<&HeaderValue>::and_then::<&str, {closure@src/lib.rs:505:19: 505:26}>(copy _1, const ZeroSized: {closure@src/lib.rs:505:19: 505:26}) -> [return: bb1, unwind continue];")] and
                v10.assignment_sites(blocks, "_2") ==
                    [("bb1", "std::option::Option::<&str>::and_then::<&str, {closure@src/lib.rs:506:19: 506:26}>(move _3, const ZeroSized: {closure@src/lib.rs:506:19: 506:26}) -> [return: bb2, unwind continue];")] and
                v10.return_writes(blocks) ==
                    [("bb2", "std::option::Option::<&str>::is_some_and::<{closure@src/lib.rs:507:22: 507:29}>(move _2, const ZeroSized: {closure@src/lib.rs:507:22: 507:29}) -> [return: bb3, unwind continue];")],
                "api: content-type helper chain changed")
    exact_normal_uses(blocks, graph, "_1",
        [r"_3 = std::option::Option::<&HeaderValue>::and_then::<&str, .+>\(copy _1, .+\) -> .+"],
        "api content-type input")
    exact_normal_uses(blocks, graph, "_3",
        [r"_3 = std::option::Option::<&HeaderValue>::and_then::<&str, .+>\(copy _1, .+\) -> .+",
         r"_2 = std::option::Option::<&str>::and_then::<&str, .+>\(move _3, .+\) -> .+"],
        "api content-type decoded header")
    exact_normal_uses(blocks, graph, "_2",
        [r"_2 = std::option::Option::<&str>::and_then::<&str, .+>\(move _3, .+\) -> .+",
         r"_0 = std::option::Option::<&str>::is_some_and::<.+>\(move _2, .+\) -> .+"],
        "api content-type selected token")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = std::option::Option::<&str>::is_some_and::<.+>\(move _2, .+\) -> .+"],
        "api content-type return place")
    expected = (
        ("is_json_content_type::{closure#0}(_1: {closure@src/lib.rs:505:19: 505:26}, _2: &HeaderValue) -> std::option::Option<&str>",
         [("_3", [("bb0", "HeaderValue::to_str(copy _2) -> [return: bb1, unwind continue];")]),
          ("_0", [("bb1", "Result::<&str, ToStrError>::ok(move _3) -> [return: bb2, unwind continue];")])]),
        ("is_json_content_type::{closure#1}(_1: {closure@src/lib.rs:506:19: 506:26}, _2: &str) -> std::option::Option<&str>",
         [("_4", [("bb0", "core::str::<impl str>::split::<char>(copy _2, const ';') -> [return: bb1, unwind continue];")]),
          ("_3", [("bb1", "&mut _4;")]),
          ("_0", [("bb1", "<std::str::Split<'_, char> as Iterator>::next(move _3) -> [return: bb2, unwind continue];")])]),
        ("is_json_content_type::{closure#2}(_1: {closure@src/lib.rs:507:22: 507:29}, _2: &str) -> bool",
         [("_3", [("bb0", "core::str::<impl str>::trim(copy _2) -> [return: bb1, unwind continue];")]),
          ("_4", [("bb1", 'const "application/json";')]),
          ("_0", [("bb1", "core::str::<impl str>::eq_ignore_ascii_case(copy _3, move _4) -> [return: bb2, unwind continue];")])]),
    )
    for closure, assignments in expected:
        _, selected, selected_graph = v10.selected_body(mir, closure)
        v10.require(normal_nodes(selected_graph) ==
                    {"bb0", "bb1", "bb2"} and
                    all(v10.assignment_sites(selected, local) == sites
                        for local, sites in assignments) and
                    len(v10.sites(selected, r"(?m)^\s*return;$")) == 1,
                    f"api: content-type {closure} projection changed")
        if "closure#0" in closure:
            selected_uses = (
                ("_2", [r"_3 = HeaderValue::to_str\(copy _2\) -> .+"]),
                ("_3", [r"_3 = HeaderValue::to_str\(copy _2\) -> .+",
                         r"_0 = Result::<&str, ToStrError>::ok\(move _3\) -> .+"]),
            )
        elif "closure#1" in closure:
            selected_uses = (
                ("_2", [r"_4 = core::str::<impl str>::split::<char>\(copy _2, const ';'\) -> .+"]),
                ("_4", [r"_4 = core::str::<impl str>::split::<char>\(copy _2, const ';'\) -> .+",
                         r"_3 = &mut _4;"]),
                ("_3", [r"_3 = &mut _4;",
                         r"_0 = <std::str::Split<'_, char> as Iterator>::next\(move _3\) -> .+"]),
            )
        else:
            selected_uses = (
                ("_2", [r"_3 = core::str::<impl str>::trim\(copy _2\) -> .+"]),
                ("_3", [r"_3 = core::str::<impl str>::trim\(copy _2\) -> .+",
                         r"_0 = core::str::<impl str>::eq_ignore_ascii_case\(copy _3, move _4\) -> .+"]),
                ("_4", [r'_4 = const "application/json";',
                         r"_0 = core::str::<impl str>::eq_ignore_ascii_case\(copy _3, move _4\) -> .+"]),
            )
        for local, patterns in selected_uses:
            exact_normal_uses(selected, selected_graph, local, patterns,
                              f"api content-type {closure} selected {local}")
        result_sites = dict(assignments)["_0"]
        exact_normal_uses(selected, selected_graph, "_0",
            [rf"_0 = {re.escape(result_sites[0][1])}"],
            f"api content-type {closure} return place")
    return {"function": name, "normal_mir_media_type_projection": "pass",
            "standard_library_semantics_trusted": True,
            "max_body_bytes": 1024}


def handler_poll_projection(mir: str) -> dict:
    """Classify every normal completed result of the selected HTTP handler."""
    name = ("authorize::{closure#0}(_1: Pin<&mut {async fn body of authorize()}>, "
            "_2: &mut Context<'_>) -> Poll<Response<Body>>")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(v10.assignment_sites(blocks, "_53") ==
                    [("bb0", "copy (_1.0: &mut {async fn body of authorize()});")] and
                not any(re.search(r"(?<!\w)&(?:mut )?_53\b", content)
                        for node, content in blocks.items()
                        if v8.reachable(graph, "bb0", node)),
                "api: HTTP handler coroutine pointer rebound or escaped")
    exact_normal_uses(blocks, graph, "_1",
        [r"_53 = copy \(_1\.0: &mut \{async fn body of authorize\(\)\}\);"],
        "api handler poll input")
    exact_normal_uses(blocks, graph, "_2",
        [r"_55 = move _2 as std::ptr::NonNull<std::task::Context<'_>> \(Transmute\);"],
        "api handler poll context")
    v10.require(v10.assignment_sites(blocks, "_52") ==
                    [("bb0", "discriminant((*_53));")] and
                v10.switch(blocks, "bb0", "_52",
                           ("0", "1", "2", "3", "4", "otherwise"),
                           "api handler coroutine state") ==
                    {"0": "bb68", "1": "bb67", "2": "bb66", "3": "bb64",
                     "4": "bb65", "otherwise": "bb12"} and
                "goto -> bb9;" in blocks["bb64"] and
                "goto -> bb25;" in blocks["bb65"],
                "api: HTTP handler coroutine state changed")
    v10.require(v10.assignment_sites(blocks, "_0") ==
                    [("bb13", "Poll::<Response<Body>>::Pending;"),
                     ("bb28", "Poll::<Response<Body>>::Pending;"),
                     ("bb38", "Poll::<Response<Body>>::Ready(move _51);")] and
                all(f"discriminant((*_53)) = {state};" in blocks[node]
                    for node, state in (("bb13", 3), ("bb28", 4), ("bb38", 1))) and
                len(v10.sites(blocks, r"(?m)^\s*return;$")) == 3,
                "api: HTTP handler completed/Pending return classification changed")
    output_lines = sorted(line.strip() for node, content in blocks.items()
                          if v8.reachable(graph, "bb0", node)
                          for line in content.splitlines()
                          if re.search(r"(?<![A-Za-z0-9_])_0\b", line))
    v10.require(output_lines == sorted([
        "_0 = Poll::<Response<Body>>::Pending;",
        "_0 = Poll::<Response<Body>>::Pending;",
        "_0 = Poll::<Response<Body>>::Ready(move _51);",
    ]), "api: HTTP handler return place rebound or escaped")
    state_slot = "(((*_53) as variant#4).0: ApiState)"
    state_uses = [(node, line.strip()) for node, content in blocks.items()
                  if v8.reachable(graph, "bb0", node)
                  for line in content.splitlines() if "variant#4).0: ApiState" in line]
    v10.require(state_uses ==
                [("bb36", f"drop({state_slot}) -> [return: bb38, unwind: bb44];"),
                 ("bb37", f"drop({state_slot}) -> [return: bb38, unwind: bb44];"),
                 ("bb47", "_31 = &((((*_53) as variant#4).0: ApiState).0: AuthorizationRuntime);"),
                 ("bb68", f"{state_slot} = move (_3.0: ApiState);")] and
                v10.assignment_sites(blocks, "_3") ==
                    [("bb68", "move ((*_53).0: axum::extract::State<ApiState>);")],
                "api: handler runtime state rebound or escaped")
    exact_normal_uses(blocks, graph, "_3",
        [r"_3 = move \(\(\*_53\)\.0: axum::extract::State<ApiState>\);",
         r"\(\(\(\*_53\) as variant#4\)\.0: ApiState\) = move \(_3\.0: ApiState\);"],
        "api handler extracted runtime state")
    v10.require(v10.assignment_sites(blocks, "_7") ==
                    [("bb68", "&(((*_53) as variant#4).1: axum::http::Request<axum::body::Body>);")] and
                v10.assignment_sites(blocks, "_6") ==
                    [("bb68", "axum::http::Request::<Body>::headers(move _7) -> [return: bb1, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_5") ==
                    [("bb1", "HeaderMap::get::<HeaderName>(copy _6, const axum::http::header::CONTENT_TYPE) -> [return: bb2, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_4") ==
                    [("bb2", "is_json_content_type(move _5) -> [return: bb3, unwind: bb63];")] and
                v10.switch(blocks, "bb3", "_4", ("0", "otherwise"),
                           "api handler content-type gate") ==
                    {"0": "bb5", "otherwise": "bb4"},
                "api: handler content-type denial polarity changed")
    request_slot = "(((*_53) as variant#4).1: axum::http::Request<axum::body::Body>)"
    request_slot_uses = [(node, line.strip()) for node, content in blocks.items()
                         if v8.reachable(graph, "bb0", node)
                         for line in content.splitlines()
                         if "variant#4).1: axum::http::Request<axum::body::Body>" in line]
    v10.require(request_slot_uses ==
                [("bb4", f"_12 = move {request_slot};"),
                 ("bb54", f"drop({request_slot}) -> [return: bb37, unwind: bb43];"),
                 ("bb68", f"{request_slot} = move ((*_53).1: axum::http::Request<axum::body::Body>);"),
                 ("bb68", f"_7 = &{request_slot};")],
                "api: handler selected request state rebound or escaped")
    v10.require(v10.assignment_sites(blocks, "_13") ==
                    [("bb10", "<{async fn body of body::to_bytes()} as Future>::poll(move _14, copy _16) -> [return: bb11, unwind: bb42];")] and
                v10.assignment_sites(blocks, "_18") ==
                    [("bb11", "discriminant(_13);")] and
                v10.switch(blocks, "bb11", "_18", ("0", "1", "otherwise"),
                           "api handler body Poll") ==
                    {"0": "bb14", "1": "bb13", "otherwise": "bb12"} and
                v10.assignment_sites(blocks, "_19") ==
                    [("bb14", "move ((_13 as Ready).0: std::result::Result<axum::body::Bytes, axum::Error>);")] and
                v10.assignment_sites(blocks, "_8") == [("bb14", "move _19;")] and
                v10.assignment_sites(blocks, "_21") ==
                    [("bb15", "discriminant(_8);")] and
                v10.switch(blocks, "bb15", "_21", ("0", "1", "otherwise"),
                           "api handler body Result") ==
                    {"0": "bb17", "1": "bb16", "otherwise": "bb12"},
                "api: handler body failure polarity changed")
    v10.require(v10.assignment_sites(blocks, "_12") ==
                    [("bb4", "move (((*_53) as variant#4).1: axum::http::Request<axum::body::Body>);")] and
                v10.assignment_sites(blocks, "_11") ==
                    [("bb4", "axum::http::Request::<Body>::into_body(move _12) -> [return: bb6, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_10") ==
                    [("bb6", "to_bytes(move _11, const MAX_AUTHORIZATION_BODY_BYTES) -> [return: bb7, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_9") ==
                    [("bb7", "<{async fn body of body::to_bytes()} as IntoFuture>::into_future(move _10) -> [return: bb8, unwind: bb63];")] and
                v10.assignment_sites(blocks, "_15") ==
                    [("bb9", "&mut (((*_53) as variant#3).2: {async fn body of axum::body::to_bytes()});")] and
                v10.assignment_sites(blocks, "_14") ==
                    [("bb9", "Pin::<&mut {async fn body of body::to_bytes()}>::new_unchecked(copy _15) -> [return: bb10, unwind: bb42];")],
                "api: handler selected bounded body future changed")
    body_slot = "(((*_53) as variant#3).2: {async fn body of axum::body::to_bytes()})"
    body_slot_uses = [(node, line.strip()) for node, content in blocks.items()
                      if v8.reachable(graph, "bb0", node)
                      for line in content.splitlines()
                      if "variant#3).2: {async fn body of axum::body::to_bytes()}" in line]
    v10.require(body_slot_uses ==
                [("bb8", f"{body_slot} = move _9;"),
                 ("bb9", f"_15 = &mut {body_slot};"),
                 ("bb14", f"drop({body_slot}) -> [return: bb15, unwind: bb63];")],
                "api: handler stored body future rebound or escaped")
    v10.require(v10.assignment_sites(blocks, "_24") ==
                    [("bb18", "from_slice::<'_, AuthorizationApiRequest>(copy _25) -> [return: bb19, unwind: bb40];")] and
                v10.assignment_sites(blocks, "_27") ==
                    [("bb19", "discriminant(_24);")] and
                v10.switch(blocks, "bb19", "_27", ("0", "1", "otherwise"),
                           "api handler parsed request") ==
                    {"0": "bb21", "1": "bb20", "otherwise": "bb12"} and
                v10.assignment_sites(blocks, "_28") ==
                    [("bb21", "move ((_24 as Ok).0: AuthorizationApiRequest);")] and
                v10.assignment_sites(blocks, "_23") == [("bb21", "move _28;")],
                "api: handler parsed-request provenance changed")
    v10.require(v10.assignment_sites(blocks, "_22") ==
                    [("bb17", "move ((_8 as Ok).0: axum::body::Bytes);")] and
                v10.assignment_sites(blocks, "_26") ==
                    [("bb45", "&(((*_53) as variant#4).2: axum::body::Bytes);")] and
                v10.assignment_sites(blocks, "_25") ==
                    [("bb45", "<axum::body::Bytes as Deref>::deref(copy _26) -> [return: bb18, unwind: bb40];")],
                "api: handler parser bytes source changed")
    bytes_slot = "(((*_53) as variant#4).2: axum::body::Bytes)"
    bytes_slot_uses = [(node, line.strip()) for node, content in blocks.items()
                       if v8.reachable(graph, "bb0", node)
                       for line in content.splitlines()
                       if "variant#4).2: axum::body::Bytes" in line]
    v10.require(bytes_slot_uses ==
                [("bb17", f"{bytes_slot} = move _22;"),
                 ("bb35", f"drop({bytes_slot}) -> [return: bb36, unwind: bb63];"),
                 ("bb45", f"_26 = &{bytes_slot};"),
                 ("bb49", f"drop({bytes_slot}) -> [return: bb55, unwind: bb63];")],
                "api: handler parsed bytes rebound or escaped")
    v10.require(v10.assignment_sites(blocks, "_31") ==
                    [("bb47", "&((((*_53) as variant#4).0: ApiState).0: AuthorizationRuntime);")] and
                v10.assignment_sites(blocks, "_33") == [("bb47", "move _23;")] and
                v10.assignment_sites(blocks, "_32") ==
                    [("bb47", "<AuthorizationApiRequest as Into<InboundAuthorizationRequest>>::into(move _33) -> [return: bb22, unwind: bb57];")] and
                v10.assignment_sites(blocks, "_30") ==
                    [("bb22", "AuthorizationRuntime::authorize(move _31, move _32) -> [return: bb23, unwind: bb57];")] and
                len(v10.sites(blocks, r"(?m)^\s*_\d+ = AuthorizationRuntime::authorize\(")) == 1,
                "api: selected handler runtime call/request changed")
    v10.require(v10.assignment_sites(blocks, "_29") ==
                    [("bb23", "<{async fn body of AuthorizationRuntime::authorize()} as IntoFuture>::into_future(move _30) -> [return: bb24, unwind: bb57];")] and
                v10.assignment_sites(blocks, "_36") ==
                    [("bb25", "&mut (((*_53) as variant#4).3: {async fn body of AuthorizationRuntime::authorize()});")] and
                v10.assignment_sites(blocks, "_35") ==
                    [("bb25", "Pin::<&mut {async fn body of AuthorizationRuntime::authorize()}>::new_unchecked(copy _36) -> [return: bb26, unwind: bb39];")] and
                v10.assignment_sites(blocks, "_34") ==
                    [("bb26", "<{async fn body of AuthorizationRuntime::authorize()} as Future>::poll(move _35, copy _37) -> [return: bb27, unwind: bb39];")],
                "api: handler runtime future/poll binding changed")
    runtime_slot = "(((*_53) as variant#4).3: {async fn body of AuthorizationRuntime::authorize()})"
    runtime_slot_uses = [(node, line.strip()) for node, content in blocks.items()
                         if v8.reachable(graph, "bb0", node)
                         for line in content.splitlines()
                         if "variant#4).3: {async fn body of AuthorizationRuntime::authorize()}" in line]
    v10.require(runtime_slot_uses ==
                [("bb24", f"{runtime_slot} = move _29;"),
                 ("bb25", f"_36 = &mut {runtime_slot};"),
                 ("bb29", f"drop({runtime_slot}) -> [return: bb30, unwind: bb57];")],
                "api: handler stored runtime future rebound or escaped")
    v10.require(v10.assignment_sites(blocks, "_39") ==
                    [("bb27", "discriminant(_34);")] and
                v10.switch(blocks, "bb27", "_39", ("0", "1", "otherwise"),
                           "api handler runtime Poll") ==
                    {"0": "bb29", "1": "bb28", "otherwise": "bb12"} and
                v10.assignment_sites(blocks, "_40") ==
                    [("bb29", "copy ((_34 as Ready).0: std::result::Result<auth_foundation_authorization_state_model::BinaryAuthorizationDecision, AuthorizationRuntimeError>);")] and
                v10.assignment_sites(blocks, "_43") ==
                    [("bb30", "discriminant(_40);")] and
                v10.switch(blocks, "bb30", "_43", ("0", "1", "otherwise"),
                           "api handler runtime Result") ==
                    {"0": "bb34", "1": "bb31", "otherwise": "bb12"} and
                v10.assignment_sites(blocks, "_42") ==
                    [("bb31", "discriminant(((_40 as Err).0: AuthorizationRuntimeError));")] and
                v10.switch(blocks, "bb31", "_42",
                           ("0", "1", "2", "otherwise"),
                           "api handler runtime error") ==
                    {"0": "bb32", "1": "bb33", "2": "bb32", "otherwise": "bb12"} and
                v10.assignment_sites(blocks, "_44") ==
                    [("bb34", "copy ((_40 as Ok).0: auth_foundation_authorization_state_model::BinaryAuthorizationDecision);")],
                "api: handler runtime success/error polarity changed")
    expected_responses = [
        ("bb5", "deny(const axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE) -> [return: bb69, unwind: bb63];"),
        ("bb16", "deny(const axum::http::StatusCode::PAYLOAD_TOO_LARGE) -> [return: bb53, unwind: bb61];"),
        ("bb20", "deny(const axum::http::StatusCode::BAD_REQUEST) -> [return: bb51, unwind: bb59];"),
        ("bb32", "deny(const axum::http::StatusCode::SERVICE_UNAVAILABLE) -> [return: bb70, unwind: bb57];"),
        ("bb33", "deny(const axum::http::StatusCode::GATEWAY_TIMEOUT) -> [return: bb71, unwind: bb57];"),
        ("bb34", "respond(const axum::http::StatusCode::OK, copy _44) -> [return: bb72, unwind: bb57];"),
    ]
    v10.require(v10.assignment_sites(blocks, "_51") == expected_responses and
                all(v8.reachable(graph, node, "bb38") for node, _ in expected_responses) and
                all(not v8.reachable(graph, node, "bb22")
                    for node in ("bb5", "bb16", "bb20")) and
                all({parent for parent, successors in graph.items()
                     if node in successors} == {expected}
                    for node, expected in (("bb34", "bb30"), ("bb31", "bb30"),
                                           ("bb29", "bb27"))),
                "api: handler response sources or fail-closed branches changed")
    for local, patterns in (
        ("_12", [rf"_12 = move {re.escape(request_slot)};", r"_11 = axum::http::Request::<Body>::into_body\(move _12\) -> .+"]),
        ("_11", [r"_11 = axum::http::Request::<Body>::into_body\(move _12\) -> .+", r"_10 = to_bytes\(move _11, const MAX_AUTHORIZATION_BODY_BYTES\) -> .+"]),
        ("_7", [r"_7 = &\(\(\(\*_53\) as variant#4\)\.1: axum::http::Request<axum::body::Body>\);", r"_6 = axum::http::Request::<Body>::headers\(move _7\) -> .+"]),
        ("_6", [r"_6 = axum::http::Request::<Body>::headers\(move _7\) -> .+", r"_5 = HeaderMap::get::<HeaderName>\(copy _6, const axum::http::header::CONTENT_TYPE\) -> .+"]),
        ("_5", [r"_5 = HeaderMap::get::<HeaderName>\(copy _6, const axum::http::header::CONTENT_TYPE\) -> .+", r"_4 = is_json_content_type\(move _5\) -> .+"]),
        ("_4", [r"_4 = is_json_content_type\(move _5\) -> .+", r"switchInt\(move _4\) -> .+;"]),
        ("_10", [r"_10 = to_bytes\(move _11, const MAX_AUTHORIZATION_BODY_BYTES\) -> .+", r"_9 = <.+ as IntoFuture>::into_future\(move _10\) -> .+"]),
        ("_9", [r"_9 = <.+ as IntoFuture>::into_future\(move _10\) -> .+", rf"{re.escape(body_slot)} = move _9;"]),
        ("_15", [rf"_15 = &mut {re.escape(body_slot)};", r"_14 = Pin::<.+>::new_unchecked\(copy _15\) -> .+"]),
        ("_14", [r"_14 = Pin::<.+>::new_unchecked\(copy _15\) -> .+", r"_13 = <.+ as Future>::poll\(move _14, copy _16\) -> .+"]),
        ("_13", [r"_13 = <.+ as Future>::poll\(move _14, copy _16\) -> .+", r"_18 = discriminant\(_13\);", r"_19 = move \(\(_13 as Ready\)\.0: .+\);"]),
        ("_18", [r"_18 = discriminant\(_13\);", r"switchInt\(move _18\) -> .+;"]),
        ("_19", [r"_19 = move \(\(_13 as Ready\)\.0: .+\);", r"_8 = move _19;"]),
        ("_8", [r"_8 = move _19;", r"_21 = discriminant\(_8\);", r"_22 = move \(\(_8 as Ok\)\.0: axum::body::Bytes\);", r"_45 = discriminant\(_8\);", r"_48 = discriminant\(_8\);", r"drop\(_8\) -> \[return: bb45, .+", r"drop\(_8\) -> \[return: bb55, .+"]),
        ("_22", [r"_22 = move \(\(_8 as Ok\)\.0: axum::body::Bytes\);", rf"{re.escape(bytes_slot)} = move _22;"]),
        ("_26", [rf"_26 = &{re.escape(bytes_slot)};", r"_25 = <axum::body::Bytes as Deref>::deref\(copy _26\) -> .+"]),
        ("_25", [r"_25 = <axum::body::Bytes as Deref>::deref\(copy _26\) -> .+", r"_24 = from_slice::<'_, AuthorizationApiRequest>\(copy _25\) -> .+"]),
        ("_21", [r"_21 = discriminant\(_8\);", r"switchInt\(move _21\) -> .+;"]),
        ("_24", [r"_24 = from_slice::<'_, AuthorizationApiRequest>\(copy _25\) -> .+", r"_27 = discriminant\(_24\);", r"_28 = move \(\(_24 as Ok\)\.0: AuthorizationApiRequest\);", r"_46 = discriminant\(_24\);", r"_47 = discriminant\(_24\);", r"drop\(_24\) -> \[return: bb47, .+", r"drop\(_24\) -> \[return: bb49, .+"]),
        ("_27", [r"_27 = discriminant\(_24\);", r"switchInt\(move _27\) -> .+;"]),
        ("_28", [r"_28 = move \(\(_24 as Ok\)\.0: AuthorizationApiRequest\);", r"_23 = move _28;"]),
        ("_23", [r"_23 = move _28;", r"_33 = move _23;"]),
        ("_33", [r"_33 = move _23;", r"_32 = <AuthorizationApiRequest as Into<InboundAuthorizationRequest>>::into\(move _33\) -> .+"]),
        ("_32", [r"_32 = <AuthorizationApiRequest as Into<InboundAuthorizationRequest>>::into\(move _33\) -> .+", r"_30 = AuthorizationRuntime::authorize\(move _31, move _32\) -> .+"]),
        ("_31", [r"_31 = &\(\(\(\(\*_53\) as variant#4\)\.0: ApiState\)\.0: AuthorizationRuntime\);", r"_30 = AuthorizationRuntime::authorize\(move _31, move _32\) -> .+"]),
        ("_30", [r"_30 = AuthorizationRuntime::authorize\(move _31, move _32\) -> .+", r"_29 = <.+ as IntoFuture>::into_future\(move _30\) -> .+"]),
        ("_29", [r"_29 = <.+ as IntoFuture>::into_future\(move _30\) -> .+", rf"{re.escape(runtime_slot)} = move _29;"]),
        ("_36", [rf"_36 = &mut {re.escape(runtime_slot)};", r"_35 = Pin::<.+>::new_unchecked\(copy _36\) -> .+"]),
        ("_35", [r"_35 = Pin::<.+>::new_unchecked\(copy _36\) -> .+", r"_34 = <.+ as Future>::poll\(move _35, copy _37\) -> .+"]),
        ("_34", [r"_34 = <.+ as Future>::poll\(move _35, copy _37\) -> .+", r"_39 = discriminant\(_34\);", r"_40 = copy \(\(_34 as Ready\)\.0: .+\);"]),
        ("_39", [r"_39 = discriminant\(_34\);", r"switchInt\(move _39\) -> .+;"]),
        ("_40", [r"_40 = copy \(\(_34 as Ready\)\.0: .+\);", r"_43 = discriminant\(_40\);", r"_42 = discriminant\(\(\(_40 as Err\)\.0: AuthorizationRuntimeError\)\);", r"_44 = copy \(\(_40 as Ok\)\.0: .+\);"]),
        ("_43", [r"_43 = discriminant\(_40\);", r"switchInt\(move _43\) -> .+;"]),
        ("_42", [r"_42 = discriminant\(\(\(_40 as Err\)\.0: AuthorizationRuntimeError\)\);", r"switchInt\(move _42\) -> .+;"]),
        ("_44", [r"_44 = copy \(\(_40 as Ok\)\.0: .+\);", r"_51 = respond\(const axum::http::StatusCode::OK, copy _44\) -> .+"]),
        ("_51", [r"_51 = deny\(const axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE\) -> .+", r"_51 = deny\(const axum::http::StatusCode::PAYLOAD_TOO_LARGE\) -> .+", r"_51 = deny\(const axum::http::StatusCode::BAD_REQUEST\) -> .+", r"_51 = deny\(const axum::http::StatusCode::SERVICE_UNAVAILABLE\) -> .+", r"_51 = deny\(const axum::http::StatusCode::GATEWAY_TIMEOUT\) -> .+", r"_51 = respond\(const axum::http::StatusCode::OK, copy _44\) -> .+", r"_0 = Poll::<Response<Body>>::Ready\(move _51\);"]),
    ):
        exact_normal_uses(blocks, graph, local, patterns,
                          f"api handler selected {local}")
    return {"function": name, "selected_runtime_poll": "AuthorizationRuntime::authorize",
            "normal_mir_http_response_provenance": "pass",
            "axum_serde_http_bytes_observed": False}


def fallback_poll_projection(mir: str, function: str, status: str) -> dict:
    ctor = f"{function}() -> {{async fn body of {function}()}}"
    _, ctor_blocks, ctor_graph = v10.selected_body(mir, ctor)
    v10.require(normal_nodes(ctor_graph) == {"bb0"} and
                len(v10.return_writes(ctor_blocks)) == 1 and
                len(v10.sites(ctor_blocks, r"(?m)^\s*return;$")) == 1 and
                re.search(r"(?m)^\s*_0 = \{coroutine@src/lib\.rs:[^\n]+;$",
                          ctor_blocks["bb0"]) is not None,
                f"api: {function} async constructor changed")
    exact_normal_uses(ctor_blocks, ctor_graph, "_0",
        [r"_0 = \{coroutine@src/lib\.rs:[^\n]+;"],
        f"api {function} constructor return place")
    name = (f"{function}::{{closure#0}}(_1: Pin<&mut {{async fn body of {function}()}}>, "
            "_2: &mut Context<'_>) -> Poll<Response<Body>>")
    _, blocks, graph = v10.selected_body(mir, name)
    v10.require(v10.assignment_sites(blocks, "_3") ==
                    [("bb6", f"deny(const axum::http::StatusCode::{status}) -> [return: bb1, unwind: bb2];")] and
                v10.assignment_sites(blocks, "_0") ==
                    [("bb1", "Poll::<Response<Body>>::Ready(move _3);")] and
                "discriminant((*_5)) = 1;" in blocks["bb1"] and
                v10.switch(blocks, "bb0", "_4",
                           ("0", "1", "2", "otherwise"),
                           f"api {function} coroutine state") ==
                    {"0": "bb6", "1": "bb4", "2": "bb3", "otherwise": "bb5"} and
                normal_nodes(graph) == {"bb0", "bb1", "bb3", "bb4", "bb5", "bb6"},
                f"api: {function} fallback status/normal return changed")
    exact_normal_uses(blocks, graph, "_3",
        [rf"_3 = deny\(const axum::http::StatusCode::{status}\) -> .+",
         r"_0 = Poll::<Response<Body>>::Ready\(move _3\);"],
        f"api {function} selected response")
    exact_normal_uses(blocks, graph, "_0",
        [r"_0 = Poll::<Response<Body>>::Ready\(move _3\);"],
        f"api {function} return place")
    return {"function": name, "status": status,
            "normal_mir_fallback_response": "pass"}


def composition_projection(parts: dict) -> dict:
    """Join selected function identities; no library execution is inferred."""
    router = parts["api_router_projection"]
    wrapper = parts["api_database_router_wrapper_projection"]
    handler_ctor = parts["api_handler_constructor_projection"]
    runtime_ctor = parts["api_runtime_constructor_projection"]
    handler = parts["api_handler_poll_projection"]
    runtime = parts["api_runtime_poll_projection"]
    worker = parts["api_worker_projection"]
    v10.require(wrapper["selected_router"] == router["function"] and
                router["selected_handler"] == handler_ctor["function"].split("(", 1)[0] and
                handler["function"].startswith(handler_ctor["poll_function_prefix"]) and
                handler["selected_runtime_poll"] == "AuthorizationRuntime::authorize" and
                runtime_ctor["function"].endswith(
                    "-> {async fn body of AuthorizationRuntime::authorize()}") and
                runtime["function"].startswith(runtime_ctor["poll_function_prefix"]) and
                runtime["selected_worker"] == worker["function"] and
                worker["normal_mir_result_provenance"] == "pass" and
                parts["api_response_projection"]["function"] == "respond" and
                parts["api_deny_projection"]["function"] == "deny" and
                parts["api_request_conversion_projection"]["normal_mir_field_mapping"] == "pass" and
                parts["api_not_found_projection"]["status"] == "NOT_FOUND" and
                parts["api_method_not_allowed_projection"]["status"] == "METHOD_NOT_ALLOWED",
                "api: selected router/handler/runtime/worker identities do not compose")
    return {"bounded_normal_mir_function_chain": "pass",
            "selected_public_builder": wrapper["function"],
            "selected_handler_poll": handler["function"],
            "selected_runtime_poll": runtime["function"],
            "selected_worker": worker["function"],
            "trusted_interprocedural_semantics": [
                "Rust call and async-constructor/poll linkage",
                "standard-library Into/From and Result::map linkage",
                "Axum route dispatch and extraction"]}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    predecessor = v11b.inspect(root_id, mir, identities)
    if root_id == API:
        source = mir[v6.ROOT_MANIFESTS[API]]
        predecessor["api_router_projection"] = router_projection(source)
        predecessor["api_database_router_wrapper_projection"] = database_router_wrapper_projection(source)
        predecessor["api_deny_projection"] = deny_projection(source)
        predecessor["api_response_projection"] = respond_projection(source)
        predecessor["api_worker_projection"] = worker_projection(source)
        predecessor["api_runtime_poll_projection"] = runtime_poll_projection(
            source, predecessor["api_worker_projection"])
        predecessor["api_handler_constructor_projection"] = async_constructor_projection(
            source, "handler")
        predecessor["api_runtime_constructor_projection"] = async_constructor_projection(
            source, "runtime")
        predecessor["api_request_conversion_projection"] = request_conversion_projection(source)
        predecessor["api_content_type_projection"] = content_type_projection(source)
        predecessor["api_handler_poll_projection"] = handler_poll_projection(source)
        predecessor["api_not_found_projection"] = fallback_poll_projection(
            source, "not_found", "NOT_FOUND")
        predecessor["api_method_not_allowed_projection"] = fallback_poll_projection(
            source, "method_not_allowed", "METHOD_NOT_ALLOWED")
        predecessor["api_composition_projection"] = composition_projection(predecessor)
    return predecessor


def evaluate() -> dict:
    current = v7.evaluate(mir_inspector=inspect)
    v10.require(current["status"] == "indeterminate" and
                current["runtime_guarantees_observed"] is False,
                "api root-context predecessor posture changed")
    return {"schema_version": "auth-foundation.v4b-api-projection/v11c-candidate",
            "status": "indeterminate", "root_context_builds": current["root_context_builds"],
            "bounded_api_router_response_subprojection": "pass",
            "bounded_api_worker_subprojection": "pass",
            "bounded_api_runtime_poll_subprojection": "pass",
            "bounded_api_request_conversion_subprojection": "pass",
            "bounded_api_content_type_subprojection": "pass",
            "bounded_api_handler_poll_subprojection": "pass",
            "bounded_api_fallback_subprojection": "pass",
            "bounded_api_constructor_wrapper_subprojection": "pass",
            "bounded_api_syntactic_composition_subprojection": "pass",
            "api_worker_http_composition_closed": False,
            "api_database_runtime_builder_closed": False,
            "public_http_bytes_closed": False, "allow_output_provenance_closed": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "trusted_summaries": ["Axum Router/post/fallback/with_state dispatch",
                                  "Axum IntoResponse and serde JSON encoding",
                                  "Rust call and async-constructor/poll linkage",
                                  "standard-library Into/From and Result::map linkage",
                                  "standard-library Option, split, trim, and ASCII-case semantics"],
            "claim_limit": "Default-feature production normal-MIR selected public router and database wrapper, async input constructors, respond/deny argument/header, V10-checked worker-to-worker-Result, selected worker/timeout Poll-result, request field conversion, handler Poll-response, fallback sublemmas, and function-identity join only. End-to-end execution effects, Tokio/Axum/serde semantics, all paths, actual HTTP bytes, all native endpoints, and runtime guarantees remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
