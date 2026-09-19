#!/usr/bin/env python3
"""Stage the admitted TypeScript decision postimage and emit one receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path


SOURCE_PATH = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260805T205406Z-ts001-validation-contract-apply-approved/"
    "readiness/20260805T221111Z-continuity-repair/task-session/staged/"
    "typescript-representation.json"
)
SOURCE_SHA256 = "d1d59bcaeb74ca9eff8db32fbd52737cb0897a9abed6951196bc321a4e8ada49"
LIVE_TARGET = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/decisions/typescript-representation.json"
)


def exact_ref(root: Path, path: Path) -> dict[str, object]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


parser = argparse.ArgumentParser()
parser.add_argument("--repo-root", required=True)
parser.add_argument("--run-dir", required=True)
arguments = parser.parse_args()
root = Path(arguments.repo_root).resolve()
run_dir = (root / arguments.run_dir).resolve()
ticket_path = run_dir / "execution-ticket.json"
ticket = json.loads(ticket_path.read_text(encoding="utf-8"))

source = root / SOURCE_PATH
source_data = source.read_bytes()
if hashlib.sha256(source_data).hexdigest() != SOURCE_SHA256:
    raise SystemExit("staged decision source digest drifted")
if len(ticket["declared_outputs"]) != 1:
    raise SystemExit("TS001 executor requires exactly one declared staged output")
output = root / ticket["declared_outputs"][0]
output.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, output)

validation_results = []
stdout_bytes = 0
stderr_bytes = 0
for contract in ticket["validation_contracts"]:
    argv = list(contract["argv"])
    if "--decision" in argv:
        decision_index = argv.index("--decision") + 1
        if argv[decision_index] != LIVE_TARGET:
            raise SystemExit("decision validation target differs from admitted live target")
        argv[decision_index] = output.relative_to(root).as_posix()
    completed = subprocess.run(
        argv,
        cwd=root if contract["cwd"] == "." else root / contract["cwd"],
        env=os.environ.copy(),
        shell=False,
        capture_output=True,
        timeout=contract["timeout_seconds"],
        check=False,
    )
    stdout_bytes += len(completed.stdout)
    stderr_bytes += len(completed.stderr)
    validation_results.append(
        {
            **contract,
            "exit_code": completed.returncode,
            "result": "pass" if completed.returncode == 0 else "block",
        }
    )

capture_limit = ticket["executor_contract"]["max_output_bytes"]
capture_within_limit = stdout_bytes <= capture_limit and stderr_bytes <= capture_limit
receipt_path = run_dir / "terminal-executor-receipt.json"
receipt = {
    "bounded_capture": {
        "max_output_bytes": capture_limit,
        "stderr_bytes": stderr_bytes,
        "stderr_truncated": stderr_bytes > capture_limit,
        "stdout_bytes": stdout_bytes,
        "stdout_truncated": stdout_bytes > capture_limit,
    },
    "idempotency_key": ticket["idempotency_key"],
    "owner_identity": ticket["executor_contract"]["owner_identity"],
    "outputs": [exact_ref(root, output)],
    "receipt_id": "executor-receipt-ape-ts001-plan-once",
    "residue": [
        "The decision validator observed the staged postimage before reconciliation; Task Session must rerun the exact live command twice after commit."
    ],
    "result": (
        "pass"
        if capture_within_limit
        and all(item["result"] == "pass" for item in validation_results)
        else "block"
    ),
    "run_id": ticket["run_id"],
    "schema_version": "task-session.executor-receipt.v1",
    "swu_id": ticket["swu_id"],
    "task_id": ticket["task_id"],
    "terminal_sequence": {
        "final_executor_write": True,
        "receipt_path": receipt_path.relative_to(root).as_posix(),
        "sequence_number": 2,
    },
    "ticket_ref": exact_ref(root, ticket_path),
    "touched_files": ticket["declared_outputs"],
    "validation_results": validation_results,
}
receipt_path.write_text(
    json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
