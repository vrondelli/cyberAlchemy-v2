#!/usr/bin/env python3
"""Join the exact TS002 terminal receipt into its one-unit outer loop."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
EVIDENCE = Path(__file__).resolve().parent
ACTION_REQUEST = EVIDENCE / "task-action-request.json"
ACTION_RESULT = EVIDENCE / "task-action-result.json"
TERMINAL_RECEIPT = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-002.json"
)
RUNNER = ROOT / (
    "arcanum/spells/implementation-readiness/scripts/run_execution_loop.py"
)


action_request = json.loads(ACTION_REQUEST.read_text(encoding="utf-8"))
action_result = json.loads(ACTION_RESULT.read_text(encoding="utf-8"))
receipt_data = TERMINAL_RECEIPT.read_bytes()
receipt = json.loads(receipt_data)
if not (
    receipt.get("result") == "pass"
    and receipt.get("swu_id") == "SWU-APE-ENUM-TS-002"
):
    raise SystemExit("terminal receipt is not the passing TS002 receipt")

state = action_result["state"]
action = action_result["action"]
request = {
    "operation": "join",
    "policy": action_request["policy"],
    "state": state,
    "event": {
        "schema_version": "1.1.0",
        "action_id": action["action_id"],
        "event_type": "task-session-joined",
        "receipt_id": (
            "ape-swu-receipt:SWU-APE-ENUM-TS-002:"
            + hashlib.sha256(receipt_data).hexdigest()
        ),
        "session_id": action["task_session_id"],
        "result": "pass",
        "selected_unit": action["selected_unit"],
        "route_fingerprint": state["current_binding"]["route_fingerprint"],
        "next_entry": None,
        "stop_decision": None,
        "blocker_code": None,
        "authority_effect": "none",
    },
}
request_path = EVIDENCE / "task-join-request.json"
result_path = EVIDENCE / "task-joined.json"
request_path.write_text(
    json.dumps(request, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
subprocess.run(
    [
        "python3",
        str(RUNNER),
        "--request",
        str(request_path),
        "--output",
        str(result_path),
    ],
    cwd=ROOT,
    shell=False,
    check=True,
)
joined = json.loads(result_path.read_text(encoding="utf-8"))
joined_state = joined["state"]
if not (
    joined_state["phase"] == "complete"
    and joined_state["stop_reason"] == "FRONTIER_COMPLETE"
    and joined_state["visited_units"] == ["SWU-APE-ENUM-TS-002"]
):
    raise SystemExit("outer loop did not close exactly one TS002 unit")
print("PASS: TS002 terminal receipt joined; one-unit frontier complete")
