#!/usr/bin/env python3
"""Unselected four-root composition of the gate model and READY handoff.

The frozen source model relates the authority's gate context to its selected
request and rows. V32 relates the selected root request actual to that same
authority request formal in each root-context build. This is a bounded
source/MIR composition, not a proof of intercrate execution or no-call.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v30 = load("auth_v30_for_v34", "auth-v4b-gate-deny-implication-v30.py")
v32 = load("auth_v32_for_v34", "auth-v4b-same-request-handoff-v32.py")


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def join(root_id: str, handoff: dict, model: dict,
         source_before: dict[str, str], source_after: dict[str, str]) -> dict:
    require(source_before == source_after and
            source_before == {
                "authority": v30.AUTHORITY_SHA,
                "gate": v30.GATE_SHA,
            }, "gate/authority source changed during selected-root capture")
    require(model["source_model_gate_deny_unreachable"] is True and
            model["authority_source_sha256"] == source_before["authority"] and
            model["gate_source_sha256"] == source_before["gate"],
            "frozen gate model/source binding changed")
    require(handoff["root_id"] == root_id and
            handoff["cross_body_execution_proven"] is False and
            len(handoff["normal_mir_argument_join"]) == 3,
            "selected-root handoff evidence changed")
    root, admission, ready = handoff["normal_mir_argument_join"]
    require(root["edge"] == "root-to-admission" and
            root["callee_request_parameter"] == "_2" and
            admission["edge"] == "admission-to-authority" and
            admission["request_actual"] == "_42 <- &_2" and
            admission["authority_formals"] == ["_2", "_3", "_4", "_5"] and
            ready["edge"] == "authority-to-ready-decision" and
            ready["callback_parameter"] == "_5",
            "request/callback join positions changed")
    require(set(handoff["selected_mir_sha256"]) ==
            {"root", "admission", "authority", "decision"},
            "selected-root compiled identity set changed")
    return {
        "root_id": root_id,
        "source_model_gate_context_uses_authority_request": True,
        "normal_mir_root_request_joins_authority_formal": True,
        "same_build_selected_mir_sha256": handoff["selected_mir_sha256"],
        "cross_crate_execution_proven": False,
    }


def evaluate() -> dict:
    source_paths = {"authority": v30.IMPL / v30.AUTHORITY,
                    "gate": v30.IMPL / v30.GATE}
    before = {name: v30.sha(path.read_bytes()) for name, path in source_paths.items()}
    model = v30.check_source(source_paths["authority"].read_text(),
                             source_paths["gate"].read_text())
    result = v32.evaluate()
    after = {name: v30.sha(path.read_bytes()) for name, path in source_paths.items()}
    require(result["status"] == "indeterminate" and
            set(result["roots"]) == set(v32.ROOTS),
            "four selected-root builds absent")
    joined = {root: join(root, result["roots"][root], model, before, after)
              for root in v32.ROOTS}
    return {
        "schema_version": "auth-foundation.v4b-gate-ready-join/v34-candidate",
        "status": "indeterminate",
        "frozen_source_sha256": before,
        "roots": joined,
        "endpoint_set_closed": False,
        "all_path_ready_dominance": False,
        "runtime_guarantees_observed": False,
        "claim_limit": "Frozen gate-context source model composed with four same-build normal-MIR request joins; no cross-crate execution, semantic value equality, native effect closure, runtime no-call observation, or V11 selection.",
    }


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
