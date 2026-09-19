#!/usr/bin/env python3
"""Stage the admitted Enum postimages and emit one bounded executor receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path


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

source_root = root / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260804T210925Z-swu-ape-ont-001-apply-approved/material/staged/"
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment"
)
sources = [
    source_root / "domain-meta-types.projection.json",
    source_root / "ontology.json",
]
outputs = [root / path for path in ticket["declared_outputs"]]
for source, output in zip(sources, outputs, strict=True):
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, output)

validation_results = []
for contract in ticket["validation_contracts"]:
    completed = subprocess.run(
        contract["argv"],
        cwd=root if contract["cwd"] == "." else root / contract["cwd"],
        shell=False,
        capture_output=True,
        timeout=contract["timeout_seconds"],
        check=False,
    )
    validation_results.append(
        {
            **contract,
            "exit_code": completed.returncode,
            "result": "pass" if completed.returncode == 0 else "block",
        }
    )

receipt_path = run_dir / "terminal-executor-receipt.json"
receipt = {
    "bounded_capture": {
        "max_output_bytes": ticket["executor_contract"]["max_output_bytes"],
        "stderr_bytes": 0,
        "stderr_truncated": False,
        "stdout_bytes": 0,
        "stdout_truncated": False,
    },
    "idempotency_key": ticket["idempotency_key"],
    "owner_identity": ticket["executor_contract"]["owner_identity"],
    "outputs": [exact_ref(root, output) for output in outputs],
    "receipt_id": "executor-receipt-ape-ont-001-fast-entry-resume",
    "residue": [],
    "result": (
        "pass"
        if all(item["result"] == "pass" for item in validation_results)
        else "block"
    ),
    "run_id": ticket["run_id"],
    "schema_version": "task-session.executor-receipt.v1",
    "swu_id": ticket["swu_id"],
    "task_id": ticket["task_id"],
    "terminal_sequence": {
        "final_executor_write": True,
        "receipt_path": receipt_path.relative_to(root).as_posix(),
        "sequence_number": len(outputs) + 1,
    },
    "ticket_ref": exact_ref(root, ticket_path),
    "touched_files": ticket["declared_outputs"],
    "validation_results": validation_results,
}
receipt_path.write_text(
    json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8"
)
