#!/usr/bin/env python3
"""Compile and join the exact RMT-OP-001 plan-once selection."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
REPOSITORY_ROOT = next(
    parent for parent in SCRIPT_PATH.parents if (parent / "AGENTS.md").is_file()
)
RUN_ROOT = SCRIPT_PATH.parent.parent
EXECUTION_ROOT = SCRIPT_PATH.parent
READINESS_SCRIPTS = (
    REPOSITORY_ROOT / "arcanum/spells/implementation-readiness/scripts"
)
sys.path.insert(0, str(READINESS_SCRIPTS))

from execution_loop import join_event  # noqa: E402
from readiness_execution import compile_plan_once_context_entry  # noqa: E402


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected JSON object: {path}")
    return value


def write(name: str, value: dict[str, Any]) -> None:
    (EXECUTION_ROOT / name).write_text(
        json.dumps(value, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    policy = load(EXECUTION_ROOT / "execution-policy.json")
    state = load(EXECUTION_ROOT / "outer-loop-state-awaiting-selection.json")
    action = load(EXECUTION_ROOT / "selection-action.json")
    config = load(RUN_ROOT / "audit-config.json")
    report = load(RUN_ROOT / "audit-2/work-pack-readiness-report-v2.json")
    receipt = load(EXECUTION_ROOT / "selection-receipt.json")
    entry = compile_plan_once_context_entry(
        policy,
        config,
        report,
        receipt,
        state["current_binding"],
    )
    event = {
        "schema_version": "1.1.0",
        "action_id": action["action_id"],
        "event_type": "selection-materialized",
        "receipt_id": None,
        "session_id": None,
        "result": "pass",
        "selected_unit": action["selected_unit"],
        "route_fingerprint": None,
        "next_entry": entry,
        "stop_decision": None,
        "blocker_code": None,
        "authority_effect": "none",
    }
    joined = join_event(state, policy, event)
    write("execution-entry-context-ready.json", entry)
    write("selection-event.json", event)
    write("outer-loop-state-context-ready.json", joined)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
