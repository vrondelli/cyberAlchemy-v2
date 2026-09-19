#!/usr/bin/env python3
"""Initialize the live WP-RMT-002 loop and bind its first selection request."""

from __future__ import annotations

import hashlib
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

from execution_loop import decide_next_action  # noqa: E402
from readiness_execution import (  # noqa: E402
    initialize_from_readiness,
    selection_intent_projection,
)


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


def exact(path: Path) -> dict[str, Any]:
    content = path.read_bytes()
    return {
        "path": path.relative_to(REPOSITORY_ROOT).as_posix(),
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> int:
    config_path = RUN_ROOT / "audit-config.json"
    report_path = RUN_ROOT / "audit-2/work-pack-readiness-report-v2.json"
    manifest_path = RUN_ROOT / "audit-2/plan-semantic-manifest.json"
    sidecar_path = RUN_ROOT / "CONFIG-NORMALIZATION-SIDECAR.json"
    apply_receipt_path = (
        REPOSITORY_ROOT
        / "projects/domainspec-v2/development/architecture-pattern-enforcement/"
        "refreshes/20260820T171212Z-wp-rmt-002-task-session-api-live-apply/"
        "LIVE-APPLY-RECEIPT.json"
    )
    config = load(config_path)
    report = load(report_path)
    policy, state = initialize_from_readiness(
        config,
        report,
        source_invocation_id="goal-wp-rmt-002-20260820T173252Z",
        created_at="2026-08-20T17:32:52Z",
        execution_mode="until-real-blocker",
        step_budget=140,
    )
    write("execution-policy.json", policy)
    write("outer-loop-state-initial.json", state)
    selection_binding = state["current_binding"]
    state, action = decide_next_action(
        state,
        policy,
        available_inputs=[],
        installed_owner_routes=[],
    )
    if action["action_type"] != "select-unit":
        raise ValueError(f"expected select-unit action, got {action['action_type']}")
    if action["selected_unit"] != "RMT-OP-001":
        raise ValueError(f"unexpected first unit: {action['selected_unit']}")
    write("outer-loop-state-awaiting-selection.json", state)
    write("selection-action.json", action)
    request = {
        "schemaVersion": "1.0.0",
        "manifestRef": exact(manifest_path),
        "auditConfigPath": config_path.relative_to(REPOSITORY_ROOT).as_posix(),
        "taskId": "TASK-RMT-OP",
        "swuId": "RMT-OP-001",
        "executionIntentBinding": selection_intent_projection(selection_binding),
        "dependencyReceipts": [],
        "lifecycleEligibility": {
            "eligible": True,
            "state": "live-refresh-applied-and-plan-semantic-ready",
            "evidenceRefs": [
                exact(apply_receipt_path),
                exact(report_path),
                exact(sidecar_path),
            ],
        },
    }
    write("selection-request.json", request)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
