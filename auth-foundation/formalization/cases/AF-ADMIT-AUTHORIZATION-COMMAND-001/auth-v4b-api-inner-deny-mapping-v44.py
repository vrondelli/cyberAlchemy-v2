#!/usr/bin/env python3
"""Selected normal API inner-worker non-READY -> DENY MIR slice.

The enclosing catch_unwind/pool worker, async timeout and HTTP response are
intentionally pending. V40 supplies same-build MIR/binary and finite controls.
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


v41 = load("auth_v41_for_v44", "auth-v4b-deny-return-effect-slice-v41.py")
v42 = load("auth_v42_for_v44", "auth-v4b-bridge-deny-mapping-v42.py")
v40, v5, v26 = v41.v40, v41.v5, v41.v26
ROOT = "api"
API = v40.v38.API
MANIFEST = v40.v38.MANIFEST


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def source_cfg(source: str) -> None:
    non_test = ("#[cfg(not(test))]\n            let outcome = catch_unwind(AssertUnwindSafe(|| {\n"
                "                match engine.with_ready(request, authorize_ready_decision) {")
    test = ("#[cfg(test)]\n            let outcome = catch_unwind(AssertUnwindSafe(|| "
            "engine.authorize(request)));")
    require(source.count(non_test) == source.count(test) == 1 and
            source.count("engine.with_ready(request, authorize_ready_decision)") == 1,
            "V44 normal non-test API worker source/cfg changed")


def switch(block: str, expression: str) -> tuple[str, dict[str, str]]:
    match = re.search(rf"(_\d+) = discriminant\({re.escape(expression)}\);\s*"
                      r"switchInt\(move \1\) -> \[([^]]+)\];", block)
    require(match is not None, "V44 selected discriminant/switch def-use changed")
    arms = re.findall(r"(\d+|otherwise): (bb\d+)", match.group(2))
    require(arms and len(arms) == match.group(2).count("bb") and
            len(dict(arms)) == len(arms), "V44 switch arm set ambiguous")
    return match.group(1), dict(arms)


def unique_def(body: str, local: str, count: int = 1) -> None:
    require(len(re.findall(rf"(?m)^\s*{re.escape(local)} =", body)) == count,
            f"V44 selected local rebound:{local}")


def inspect_inner(api_mir: str, tags: dict) -> dict:
    items = v5.functions(api_mir)
    identity = v5.root_callback(ROOT, api_mir, items)
    name, body = identity["function"], items[identity["function"]]
    require("::authorize::{closure#0}::{closure#0}::{closure#0}" in name and
            "dyn AuthorizationEngine" not in api_mir,
            "V44 concrete normal API closure identity changed")
    blocks = v26.compiled_blocks(body)
    normal, full = v41.successors(blocks)
    call = identity["block"]
    result = identity["call_result_local"]
    unique_def(body, result)
    call_match = re.search(
        rf"{re.escape(result)} = SqliteAdmissionService::with_ready::<"
        r"BinaryAuthorizationDecision>\([^\n]+\) -> \[return: (bb\d+), unwind continue\]",
        blocks[call])
    require(call_match is not None, "V44 concrete service call/result changed")
    first = call_match.group(1)
    result_disc, result_arms = switch(blocks[first], result)
    unique_def(body, result_disc)
    require(set(result_arms) == {"0", "1", "otherwise"} and
            blocks[result_arms["otherwise"]].strip() == "unreachable;",
            "V44 Result arm set/unknown branch changed")
    ok_candidates = [node for key, node in result_arms.items()
                     if key != "otherwise" and f"({result} as Ok)" in blocks[node]]
    require(len(ok_candidates) == 1, "V44 Result Ok downcast arm ambiguous")
    ok_arm = ok_candidates[0]
    error_arm = next(node for key, node in result_arms.items()
                     if key != "otherwise" and node != ok_arm)
    outcome_expr = (f"(({result} as Ok).0: auth_foundation_authorization_admission_service::"
                    "AdmissionOutcome<auth_foundation_authorization_state_model::"
                    "BinaryAuthorizationDecision>)")
    outcome_disc, outcome_arms = switch(blocks[ok_arm], outcome_expr)
    unique_def(body, outcome_disc)
    ready_tag = str(tags["outcome"]["Ready"])
    deny_tag = str(tags["outcome"]["Denied"])
    require(set(outcome_arms) == {ready_tag, "otherwise"} and
            ready_tag != deny_tag,
            "V44 AdmissionOutcome Ready/non-READY arm changed")
    ready_arm, nonready_arm = outcome_arms[ready_tag], outcome_arms["otherwise"]
    require(error_arm == nonready_arm and
            re.search(r"(?m)^\s*_0 = Deny;\s*goto -> (bb\d+);", blocks[nonready_arm])
            is not None, "V44 Err/non-READY DENY constructor changed")
    return_block = re.search(r"goto -> (bb\d+);", blocks[nonready_arm]).group(1)
    ready_expr = (f"(({outcome_expr} as Ready).0: "
                  "auth_foundation_authorization_state_model::BinaryAuthorizationDecision)")
    ready = re.search(
        rf"(_\d+) = copy {re.escape(ready_expr)};\s*"
        r"_0 = copy \1;\s*goto -> (bb\d+);", blocks[ready_arm])
    require(ready is not None and ready.group(2) == return_block,
            "V44 only READY may copy its decision payload")
    ready_payload = ready.group(1)
    unique_def(body, ready_payload)
    require(len(re.findall(r"(?m)^\s*_0 =", body)) == 2 and
            ready_arm not in v41.reach(normal, nonready_arm),
            "V44 alternate decision return or non-READY to READY path")
    deny_returns = v41.preserved_return_local(
        blocks, normal, nonready_arm, "_0 = Deny;", "API inner non-READY")
    ready_returns = v41.preserved_return_local(
        blocks, normal, ready_arm, f"_0 = copy {ready_payload};", "API inner READY")
    require(deny_returns == ready_returns and return_block in deny_returns and
            blocks[return_block].strip() == "return;",
            "V44 inner closure terminal return changed")
    return {"function": name, "call_block": call,
            "call_result_local": result, "result_discriminant": result_disc,
            "result_ok_arm": ok_arm, "result_error_arm": error_arm,
            "outcome_discriminant": outcome_disc,
            "outcome_ready_arm": ready_arm,
            "gate_denied_uses_nonready_arm": nonready_arm,
            "denied_return_blocks": deny_returns,
            "ready_payload_local": ready_payload,
            "err_and_nonready_return_deny": True,
            "only_ready_copies_decision": True,
            "cfg_not_test_concrete_library_mir": True,
            "cross_body_service_return_proven": False,
            "enclosing_worker_catch_pool_proven": False,
            "local_open_effects": v41.effect_rows(blocks, normal, full, first)}


def inspect_same_build(root: str, mir: dict[str, str], identities: dict,
                       variant: str) -> dict:
    require(root == ROOT and MANIFEST in mir and MANIFEST in identities,
            "V44 selected API library MIR absent")
    prior = v41.inspect_same_build(root, mir, identities, variant)
    source = (v40.v29.ORIGINAL_IMPL / API).read_text()
    source_cfg(source)
    tags = v42.enum_tags(variant)
    inner = inspect_inner(mir[MANIFEST], tags)
    identity = identities[MANIFEST]
    require("trace" not in identity["features"] and
            identity["target_kind"] == ["lib"] and
            identity["target_name"] == "auth_foundation_authorization_api" and
            identity["mir_sha256"] == v40.v29.sha(mir[MANIFEST].encode()),
            "V44 API normal library feature/MIR identity changed")
    return {**prior, "v44_inner_api": {
        **inner, "variant": variant,
        "api_library_source_sha256": v40.v29.sha(source.encode()),
        "authority_variant_source_sha256": tags["authority_variant_source_sha256"],
        "state_source_sha256": tags["state_source_sha256"],
        "api_library_package_id": identity["package_id"],
        "api_library_features": identity["features"],
        "api_library_mir_sha256": identity["mir_sha256"],
        "outcome_tags_derived_from_variant_source": tags["outcome"]}}


def evaluate_root(inventory: dict, model: dict) -> dict:
    metadata, _ = v40.v29.v7.root_metadata(ROOT, MANIFEST)
    manifests = v40.v29.package_manifests(ROOT, metadata)
    selected_before = v40.v29.snapshot(v40.v29.selected_files(manifests))
    require(all(name in selected_before for name in
                (API, v40.AUTHORITY, v42.STATE_SOURCE)),
            "V44 API/enum sources absent from selected V40 snapshot")
    previous = v40.inspect_mir
    try:
        v40.inspect_mir = inspect_same_build
        result = v40.evaluate_root(ROOT, inventory, model)
    finally:
        v40.inspect_mir = previous
    require(result["source_bytes_preserved"] and
            result["normal_feature_same_build_mir_and_binary"],
            "V44 V40 same-build/source preservation absent")
    package_ids = set()
    metadata_ids = set()
    lock_ids = set()
    for variant, row in result["variants"].items():
        inner = row["selected_mir_inspection"]["v44_inner_api"]
        require(inner["variant"] == variant and
                inner["api_library_source_sha256"] == row["source_sha256"][API] and
                inner["authority_variant_source_sha256"] ==
                row["source_sha256"][v40.AUTHORITY] and
                inner["state_source_sha256"] ==
                selected_before[v42.STATE_SOURCE] and
                inner["api_library_source_sha256"] == selected_before[API] and
                inner["api_library_mir_sha256"] ==
                row["selected_mir_sha256"][MANIFEST] and
                inner["api_library_package_id"] == row["test_package_id"] and
                all(row["binary_sha256"] == observation["test_binary_sha256"]
                    for observation in row["observations"].values()),
                f"V44 {variant} source/MIR/library/test-binary binding changed")
        package_ids.add(row["test_package_id"])
        metadata_ids.add(row["metadata_sha256"])
        lock_ids.add(row["lock_sha256"])
    require(len(package_ids) == len(metadata_ids) == len(lock_ids) == 1,
            "V44 API package/metadata/lock identity drift")
    return result


def evaluate() -> dict:
    authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()
    model = v40.check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v40.v29.v7.current_inventory()
    root = evaluate_root(inventory, model)
    return {"schema_version": "auth-foundation.v4b-api-inner-deny-mapping/v44-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "root": root, "endpoint_set_closed": False,
            "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Selected normal cfg(not(test)) API library MIR maps Err and Ok(non-READY), including gate DENY, to an inner closure Deny return; only Ok(Ready) copies the decision. V40 finite HTTP observation is corroboration, not a proved service-return execution join. Enclosing catch_unwind/pool, async timeout/HTTP, flip control, indirect effects and owner-wide no-call remain pending."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
