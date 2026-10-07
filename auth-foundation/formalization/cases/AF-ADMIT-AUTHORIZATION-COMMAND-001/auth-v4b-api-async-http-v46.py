#!/usr/bin/env python3
"""Same-build conditional API worker -> async poll -> HTTP MIR composition.

This does not prove Tokio/Axum/serde execution semantics, cancellation, or
actual HTTP bytes. V40 supplies four finite in-process observations.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v45 = load("auth_v45_for_v46", "auth-v4b-api-parent-worker-v45.py")
v11c = load("auth_v11c_for_v46", "auth-v4b-api-projection-v11c.py")
v40 = v45.v40


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError("V46 " + reason)


def inspect_composition(mir: str, parent: dict) -> dict:
    """Compose already-bounded V45/V11c per-body selectors on one MIR string."""
    worker = v11c.worker_projection(mir)
    require(worker["function"] == parent["function"] and
            worker["normal_mir_result_provenance"] == "pass" and
            parent["put_continue_returns_same_decision"] and
            parent["all_normal_returns_checked"],
            "V45 parent and V11c worker identities/provenance diverged")
    runtime = v11c.runtime_poll_projection(mir, worker)
    handler = v11c.handler_poll_projection(mir)
    runtime_constructor = v11c.async_constructor_projection(mir, "runtime")
    handler_constructor = v11c.async_constructor_projection(mir, "handler")
    router = v11c.router_projection(mir)
    request_conversion = v11c.request_conversion_projection(mir)
    response = v11c.respond_projection(mir)
    denied = v11c.deny_projection(mir)
    require(runtime["selected_worker"] == parent["function"] and
            runtime["normal_mir_poll_result_provenance"] == "pass" and
            runtime["function"].startswith(runtime_constructor["poll_function_prefix"]) and
            runtime_constructor["normal_mir_input_capture"] == "pass" and
            handler["function"].startswith(handler_constructor["poll_function_prefix"]) and
            handler_constructor["normal_mir_input_capture"] == "pass" and
            router["selected_handler"] == handler_constructor["function"].split("(", 1)[0] and
            router["path"] == "/v1/authorize" and
            request_conversion["normal_mir_field_mapping"] == "pass" and
            handler["selected_runtime_poll"] == "AuthorizationRuntime::authorize" and
            handler["normal_mir_http_response_provenance"] == "pass" and
            response["function"] == "respond" and denied["function"] == "deny" and
            response["selected_response_normal_mir_binding"] == "pass" and
            denied["selected_decision"] == "Deny" and
            response["allow_literal"] == "ALLOW" and
            response["deny_literal"] == "DENY" and
            response["cache_control"] == "no-store",
            "runtime/handler/response branch composition changed")
    # The direct V11c selectors also enforce: spawn_blocking closure and
    # JoinHandle capture, evaluation timeout future/Poll, nested timeout/join/
    # worker Result arms, runtime decision/metrics/return, handler Poll and
    # status-specific respond/deny calls. They remain MIR projections only.
    return {"parent_function": parent["function"],
            "runtime_poll_function": runtime["function"],
            "handler_poll_function": handler["function"],
            "runtime_constructor_function": runtime_constructor["function"],
            "handler_constructor_function": handler_constructor["function"],
            "public_route_path": router["path"],
            "async_constructor_capture_selectors": "pass",
            "public_router_selector": "pass",
            "request_conversion_selector": "pass",
            "worker_to_runtime_selector": "pass",
            "runtime_to_http_selector": "pass",
            "normal_library_same_mir_string": True,
            "conditional_completed_worker_ok_decision_to_http_200": True,
            "timeout_error_http_status": "GATEWAY_TIMEOUT",
            "join_or_worker_error_http_status": "SERVICE_UNAVAILABLE",
            "timeout_cancels_blocking_worker_proven": False,
            "tokio_axum_serde_execution_proven": False,
            "http_bytes_proven": False,
            "transitive_effect_closure_proven": False}


def inspect_same_build(root: str, mir: dict[str, str], identities: dict,
                       variant: str) -> dict:
    prior = v45.inspect_same_build(root, mir, identities, variant)
    require(root == "api" and v45.v44.MANIFEST in mir and
            v45.v44.MANIFEST in identities,
            "selected normal API library missing")
    identity = identities[v45.v44.MANIFEST]
    library = mir[v45.v44.MANIFEST]
    parent = prior["v45_parent_worker"]
    composition = inspect_composition(library, parent)
    require(identity["target_kind"] == ["lib"] and
            identity["target_name"] == "auth_foundation_authorization_api" and
            "trace" not in identity["features"] and
            identity["mir_sha256"] == v40.v29.sha(library.encode()) and
            identity["mir_sha256"] == parent["api_library_mir_sha256"] and
            identity["package_id"] == parent["api_library_package_id"] and
            identity["features"] == parent["api_library_features"],
            "V45/V46 selected library artifact identity drift")
    return {**prior, "v46_async_http": {**composition,
            "variant": variant,
            "api_library_source_sha256": parent["api_library_source_sha256"],
            "api_library_mir_sha256": identity["mir_sha256"],
            "api_library_package_id": identity["package_id"],
            "api_library_features": identity["features"]}}


def bind_variant(variant: str, row: dict, selected_before: dict) -> None:
    parent = row["selected_mir_inspection"]["v45_parent_worker"]
    joined = row["selected_mir_inspection"]["v46_async_http"]
    api, manifest = v45.v44.API, v45.v44.MANIFEST
    require(joined["variant"] == variant and
            joined["async_constructor_capture_selectors"] == "pass" and
            joined["public_router_selector"] == "pass" and
            joined["request_conversion_selector"] == "pass" and
            joined["worker_to_runtime_selector"] == "pass" and
            joined["runtime_to_http_selector"] == "pass" and
            joined["normal_library_same_mir_string"] is True and
            joined["conditional_completed_worker_ok_decision_to_http_200"] is True and
            joined["timeout_error_http_status"] == "GATEWAY_TIMEOUT" and
            joined["join_or_worker_error_http_status"] == "SERVICE_UNAVAILABLE" and
            joined["public_route_path"] == "/v1/authorize" and
            joined["timeout_cancels_blocking_worker_proven"] is False and
            joined["tokio_axum_serde_execution_proven"] is False and
            joined["http_bytes_proven"] is False and
            joined["transitive_effect_closure_proven"] is False and
            joined["parent_function"] == parent["function"] and
            joined["api_library_source_sha256"] == parent["api_library_source_sha256"] ==
            row["source_sha256"][api] == selected_before[api] and
            joined["api_library_mir_sha256"] == parent["api_library_mir_sha256"] ==
            row["selected_mir_sha256"][manifest] and
            joined["api_library_package_id"] == parent["api_library_package_id"] ==
            row["test_package_id"] and
            joined["api_library_features"] == parent["api_library_features"] and
            all(row["binary_sha256"] == observation["test_binary_sha256"]
                for observation in row["observations"].values()),
            f"{variant} V45/V46 source/MIR/package/binary binding changed")


def evaluate_root(inventory: dict, model: dict) -> dict:
    metadata, _ = v40.v29.v7.root_metadata("api", v45.v44.MANIFEST)
    manifests = v40.v29.package_manifests("api", metadata)
    selected_before = v40.v29.snapshot(v40.v29.selected_files(manifests))
    require(v45.v44.API in selected_before and
            v40.AUTHORITY in selected_before and
            v45.v44.v42.STATE_SOURCE in selected_before,
            "selected V40 API/authority/state source snapshot incomplete")
    previous = v40.inspect_mir
    try:
        v40.inspect_mir = inspect_same_build
        result = v40.evaluate_root("api", inventory, model)
    finally:
        v40.inspect_mir = previous
    require(result["source_bytes_preserved"] and
            result["normal_feature_same_build_mir_and_binary"] and
            set(result["variants"]) ==
            {"clean", "marked", "cardinality-gate-deny", "bypass-deny"},
            "V40 finite same-build API variant set changed")
    for variant, row in result["variants"].items():
        bind_variant(variant, row, selected_before)
    require(len({row["metadata_sha256"] for row in result["variants"].values()}) == 1 and
            len({row["lock_sha256"] for row in result["variants"].values()}) == 1,
            "V40 API metadata/lock identity drift")
    return result


def evaluate() -> dict:
    authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()
    model = v40.check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v40.v29.v7.current_inventory()
    result = evaluate_root(inventory, model)
    return {"schema_version": "auth-foundation.v4b-api-async-http/v46-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "root": result, "endpoint_set_closed": False,
            "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build normal API MIR conditionally composes a completed V45 worker Ok(decision), before evaluation timeout, with V11c selected async constructors, JoinHandle/timeout Poll, nested Result, runtime return and valid parsed-request handler HTTP response selectors. V40 four finite in-process observations corroborate selected outcomes. Tokio scheduling/cancellation, Axum/serde execution, actual HTTP bytes, transitive effects, all-path no-call and owner-wide runtime guarantees remain unproved; timeout does not imply blocking worker cancellation."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
