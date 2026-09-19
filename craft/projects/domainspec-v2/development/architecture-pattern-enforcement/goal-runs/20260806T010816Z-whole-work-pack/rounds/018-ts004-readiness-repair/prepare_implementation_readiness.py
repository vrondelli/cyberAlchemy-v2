#!/usr/bin/env python3
"""Initialize and decide the one-unit TS004 readiness loop."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
RUN_DIR = Path(__file__).resolve().parent
RUNNER = ROOT / "arcanum/spells/implementation-readiness/scripts/run_execution_loop.py"


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def run(request_path: Path, output_path: Path) -> None:
    subprocess.run(
        [
            "python3",
            str(RUNNER),
            "--request",
            str(request_path),
            "--output",
            str(output_path),
        ],
        cwd=ROOT,
        shell=False,
        check=True,
    )


audit_config = json.loads((RUN_DIR / "audit-config.json").read_text(encoding="utf-8"))
audit_report = json.loads(
    (RUN_DIR / "run-1/work-pack-readiness-report-v2.json").read_text(encoding="utf-8")
)
initialize_request = {
    "operation": "initialize-readiness",
    "audit_config": audit_config,
    "audit_report": audit_report,
    "source_invocation_id": "ape-goal-ts004-repair-20260806T024500Z",
    "created_at": "2026-08-06T02:45:00Z",
    "execution_mode": "one-unit",
    "step_budget": 4,
}
initialize_request_path = RUN_DIR / "implementation-readiness-initialize-request.json"
initialized_path = RUN_DIR / "implementation-readiness-initialized.json"
write_json(initialize_request_path, initialize_request)
run(initialize_request_path, initialized_path)
initialized = json.loads(initialized_path.read_text(encoding="utf-8"))

decide_request = {
    "operation": "decide",
    "policy": initialized["policy"],
    "state": initialized["state"],
    "available_inputs": [],
    "installed_owner_routes": [],
}
decide_request_path = RUN_DIR / "implementation-readiness-decide-request.json"
decided_path = RUN_DIR / "implementation-readiness-decided.json"
write_json(decide_request_path, decide_request)
run(decide_request_path, decided_path)
decided = json.loads(decided_path.read_text(encoding="utf-8"))
if not (
    decided["action"]["action_type"] == "select-unit"
    and decided["action"]["selected_unit"] == "SWU-APE-ENUM-TS-004"
    and decided["state"]["phase"] == "awaiting-selection"
    and decided["state"]["authorization_prompt_count"] == 0
):
    raise SystemExit("TS004 readiness did not stop at exact selection")
print("PASS: TS004 readiness initialized and awaits exact selection")
