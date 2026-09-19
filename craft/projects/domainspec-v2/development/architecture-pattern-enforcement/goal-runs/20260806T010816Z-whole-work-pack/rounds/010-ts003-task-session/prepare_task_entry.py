#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
RUN_DIR = Path(__file__).resolve().parent
READINESS_DIR = (
    ROOT
    / "projects/domainspec-v2/development/architecture-pattern-enforcement/goal-runs/20260806T010816Z-whole-work-pack/rounds/012-ts003-readiness"
)
RUNNER = ROOT / "arcanum/spells/implementation-readiness/scripts/run_execution_loop.py"
FAST_ENTRY = ROOT / ".agents/skills/task-session/scripts/classify-fast-execution-entry.py"


def load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def execute(request_name: str, output_name: str, request: object) -> dict:
    request_path = RUN_DIR / request_name
    output_path = RUN_DIR / output_name
    write(request_path, request)
    subprocess.run(
        ["python3", str(RUNNER), "--request", str(request_path), "--output", str(output_path)],
        cwd=ROOT,
        shell=False,
        check=True,
    )
    return load(output_path)


initialized = load(READINESS_DIR / "implementation-readiness-initialized.json")
decided = load(READINESS_DIR / "implementation-readiness-decided.json")
selection = load(READINESS_DIR / "selection-receipt.json")
audit_config = load(READINESS_DIR / "audit-config.json")
audit_report = load(READINESS_DIR / "run-1/work-pack-readiness-report-v2.json")
admission = load(RUN_DIR / "mutation-admission-receipt.json")

selection_result = execute(
    "selection-entry-request.json",
    "selection-entry-result.json",
    {
        "operation": "selection-entry",
        "policy": initialized["policy"],
        "audit_config": audit_config,
        "audit_report": audit_report,
        "selection_receipt": selection,
        "mutation_admission_receipt": admission,
        "execution_binding": decided["state"]["current_binding"],
    },
)

selection_joined = execute(
    "selection-join-request.json",
    "selection-joined.json",
    {
        "operation": "join",
        "policy": initialized["policy"],
        "state": decided["state"],
        "event": {
            "schema_version": "1.1.0",
            "action_id": decided["action"]["action_id"],
            "event_type": "selection-materialized",
            "receipt_id": None,
            "session_id": None,
            "result": "pass",
            "selected_unit": "SWU-APE-ENUM-TS-003",
            "route_fingerprint": None,
            "next_entry": selection_result["entry"],
            "stop_decision": None,
            "blocker_code": None,
            "authority_effect": "none",
        },
    },
)

available_inputs = audit_report["manifest"]["allowed_routes"][-1]["required_inputs"]

task_action = execute(
    "task-action-request.json",
    "task-action-result.json",
    {
        "operation": "decide",
        "policy": initialized["policy"],
        "state": selection_joined["state"],
        "available_inputs": available_inputs,
        "installed_owner_routes": [{"capability": "task-session", "mode": "execute"}],
    },
)

if not (
    task_action["action"]["action_type"] == "start-task-session"
    and task_action["action"]["selected_unit"] == "SWU-APE-ENUM-TS-003"
    and task_action["state"]["authorization_prompt_count"] == 0
):
    raise SystemExit("TS003 did not reach automatic Task Session entry")

fast_request = {
    "schema_version": "1.0.0",
    "execution_policy": initialized["policy"],
    "execution_entry": selection_joined["state"]["current_entry"],
    "execution_binding": selection_joined["state"]["current_binding"],
    "selected_unit": {
        "work_pack_id": initialized["policy"]["work_pack_id"],
        "swu_id": "SWU-APE-ENUM-TS-003",
    },
    "authority_effect": "none",
}
fast_request_path = RUN_DIR / "fast-entry-request.json"
fast_receipt_path = RUN_DIR / "fast-entry-receipt.json"
write(fast_request_path, fast_request)
subprocess.run(
    ["python3", str(FAST_ENTRY), "--input", str(fast_request_path), "--output", str(fast_receipt_path)],
    cwd=ROOT,
    shell=False,
    check=True,
)
fast_receipt = load(fast_receipt_path)
if not (
    fast_receipt["decision"] == "proceed"
    and fast_receipt["code"] == "TASK_READY"
    and fast_receipt["selected_unit"] == "SWU-APE-ENUM-TS-003"
):
    raise SystemExit("TS003 fast entry did not pass")

print("PASS: TS003 selection joined, Task Session routed, and fast entry ready")
