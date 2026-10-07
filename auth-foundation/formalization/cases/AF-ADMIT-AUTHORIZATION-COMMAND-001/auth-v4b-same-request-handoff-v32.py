#!/usr/bin/env python3
"""Unselected same-build MIR argument join for the four Auth public roots.

This joins typed actual/formal positions and bounded local def-use in the
selected normal-build artifacts. MIR text is not an executable cross-crate
trace, and the owner-wide native no-call property remains unproved.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
IMPL = CASE.parents[2] / "implementation"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v9 = load("auth_v9_for_v32", CASE / "auth-v4b-intercrate-graph-v9.py")
v11 = load("auth_v11_for_v32", IMPL / "scripts/validate-current-evidence-successor-v11.py")
ROOTS = tuple(v9.v6.ROOT_MANIFESTS)
REQUEST = re.compile(r"(?m)^\s*(_\d+) = SqliteAdmissionService::with_ready::<"
                     r"BinaryAuthorizationDecision>\([^,]+, (?:move|copy) (_\d+), "
                     r"move (_\d+)\) ->")
CONSTRUCTED = re.compile(r"InboundAuthorizationRequest \{ request_id: [^,]+, "
                         r"authentication_evidence_ref: [^,]+, route_id: [^}]+ \};")
ADMISSION_CALL = ("with_ready_in_transaction::<R>(copy _41, copy _42, "
                  "move _43, move _44, copy _3)")
AUTHORITY_SIGNATURE = ("with_ready_in_transaction(_1: &Transaction<'_>, "
                       "_2: &InboundAuthorizationRequest, _3: NonZero<u64>, "
                       "_4: u64, _5: fn(ReadyAuthorization<'_, '_>) -> R)")


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def root_argument_join(root_id: str, body: str, block: str,
                       callback_local: str) -> dict:
    calls = list(REQUEST.finditer(block))
    require(len(calls) == 1 and calls[0].group(3) == callback_local,
            f"{root_id}: root request/callback call actuals changed")
    result_local, request_local, _ = calls[0].groups()
    require(len(re.findall(rf"(?m)^\s*{re.escape(request_local)} =", body)) == 1,
            f"{root_id}: root request local rebound")
    if root_id == "api":
        origin = re.escape(request_local) + r" = move \(_1\.1: " \
                 r"auth_foundation_authorization_state_model::InboundAuthorizationRequest\);"
        origins = list(re.finditer(origin, block))
        require(len(origins) == 1,
                "api: captured inbound request source changed")
        source = "captured-inbound-request"
    else:
        origins = list(re.finditer(rf"(?m)^\s*{re.escape(request_local)} = " +
                                   CONSTRUCTED.pattern, block))
        require(len(origins) == 1,
                f"{root_id}: constructed inbound request source changed")
        source = "constructed-bridge-request"
    require(origins[0].end() < calls[0].start() and
            not re.search(rf"\b{re.escape(request_local)}\b",
                          block[origins[0].end():calls[0].start()]),
            f"{root_id}: request local changed before handoff")
    require(len(re.findall(rf"(?m)^\s*{re.escape(callback_local)} =", body)) == 1,
            f"{root_id}: root callback local rebound")
    return {"request_local": request_local, "request_origin": source,
            "callback_local": callback_local, "call_result_local": result_local,
            "callee_request_parameter": "_2", "callee_callback_parameter": "_3"}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    require(root_id in ROOTS and set(mir) == set(identities),
            "selected root artifact set changed")
    # The existing graph checks selected stage/callback/gate shape, but does
    # not assert a cross-body actual/formal value join.
    prior = v9.inspect(root_id, mir, identities)
    require(prior["bounded_property"]["status"] == "pass",
            f"{root_id}: predecessor normal graph failed")
    root_manifest = v9.v6.ROOT_MANIFESTS[root_id]
    root = v9.root_handoff(root_id, mir[root_manifest])
    root_block = v9.v5.blocks(root["parsed_functions"][root["function"]])[root["block"]]
    first = root_argument_join(root_id, root["parsed_functions"][root["function"]],
                               root_block, root["callback_local"])

    admission = v9.v5.admission_handoff(
        mir[v9.ADMISSION], v9.v5.functions(mir[v9.ADMISSION]))
    admission_body = v9.v5.functions(mir[v9.ADMISSION])[admission["function"]]
    admission_block = v9.v5.blocks(admission_body)[admission["block"]]
    require(admission_block.count(ADMISSION_CALL) == 1 and
            admission["callback_parameter"] == first["callee_callback_parameter"] and
            not re.search(r"(?m)^\s*_2 =", admission_body),
            f"{root_id}: admission request/callback actuals changed")
    require("_42 = &_2;" in admission_block and
            "_43 = copy (_38.0: std::num::NonZero<u64>);" in admission_block and
            "_44 = copy (_38.1: u64);" in admission_block,
            f"{root_id}: admission request/epoch projections changed")

    authority_name, authority_body = v9.v5.selected(
        v9.v5.functions(mir[v9.AUTHORITY]), "with_ready_in_transaction(")
    require(authority_name.startswith(AUTHORITY_SIGNATURE),
            f"{root_id}: authority formal parameter positions changed")
    authority = v11.authority_identity_witness(mir[v9.AUTHORITY])
    require(authority["constructed_ready_is_callback_argument"] and
            authority["normal_cfg_transfer_dominance"],
            f"{root_id}: authority READY request/callback transfer changed")
    callback_blocks = [(block_id, content) for block_id, content in
                       v9.v5.blocks(authority_body).items()
                       if "= copy _5(copy _147) ->" in content]
    require(len(callback_blocks) == 1 and
            "_147 = ReadyAuthorization::<'_, '_> { transaction: copy _1, "
            "evaluation_epoch_id: copy _3, decision_time: copy _4, " in
            callback_blocks[0][1],
            f"{root_id}: authority READY callback actual changed")

    decision_name, _ = v9.v5.selected(v9.v5.functions(mir[v9.DECISION]), "authorize(")
    require(decision_name.startswith("authorize(_1: ReadyAuthorization<'_, '_>)"),
            f"{root_id}: READY decision formal parameter changed")
    selected = {stage: identities[manifest]["mir_sha256"] for stage, manifest in
                (("root", root_manifest), ("admission", v9.ADMISSION),
                 ("authority", v9.AUTHORITY), ("decision", v9.DECISION))}
    return {"status": "indeterminate", "root_id": root_id,
            "normal_mir_argument_join": [
                {"edge": "root-to-admission", **first},
                {"edge": "admission-to-authority", "request_actual": "_42 <- &_2",
                 "epoch_actual": "_43 <- _38.0", "time_actual": "_44 <- _38.1",
                 "callback_actual": "_3", "authority_formals": ["_2", "_3", "_4", "_5"]},
                {"edge": "authority-to-ready-decision", "ready_actual": "_147",
                 "callback_parameter": "_5", "decision_formal": "_1"},
            ], "selected_mir_sha256": selected,
            "cross_body_execution_proven": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    result = v9.v7.evaluate(mir_inspector=inspect)
    require(result["status"] == "indeterminate" and
            set(result["root_context_builds"]) == set(ROOTS),
            "four selected root builds absent")
    joined = {root: result["root_context_builds"][root]["selected_graph_inspection"]
              for root in ROOTS}
    require(all(row["normal_mir_argument_join"] and
                row["cross_body_execution_proven"] is False for row in joined.values()),
            "same-build argument join missing")
    return {"schema_version": "auth-foundation.v4b-same-request-handoff/v32-candidate",
            "status": "indeterminate", "roots": joined,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four same-build normal-MIR actual/formal joins and local transfer checks only; no cross-crate execution, indirect/effect closure, every-native-entrypoint no-call observation, or V11 selection."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
