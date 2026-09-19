#!/usr/bin/env python3
"""Bounded executor for DS-FORMALCLAIM-LEAN-EVF SWU-FCL-001."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


RUN_REL = (
    "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
    "formalclaim-lean-evf/SWU-FCL-001/task-session/"
    "ts-fcl-001-20260824t181605z"
)
TARGETS = [
    "projects/domainspec-v2/development/spec-ontology-branch-decision/contracts/formal-claim-source-payload.v2.schema.json",
    "projects/domainspec-v2/development/spec-ontology-branch-decision/fixtures/formal-claim-source-payload.v2.json",
    "projects/domainspec-v2/development/spec-ontology-branch-decision/tools/validate_formal_claim_source_payload.py",
]
STAGED_BY_TARGET = {
    target: f"{RUN_REL}/staged/{target}" for target in TARGETS
}
VALIDATION = {
    "command_id": "validate-source-envelope",
    "argv": [
        "python3",
        "projects/domainspec-v2/development/spec-ontology-branch-decision/tools/validate_formal_claim_source_payload.py",
        "--fixtures",
        "projects/domainspec-v2/development/spec-ontology-branch-decision/fixtures/formal-claim-source-payload.v2.json",
    ],
    "cwd": ".",
    "timeout_seconds": 120,
    "max_output_bytes": 1048576,
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_ref(root: Path, relative: str) -> dict[str, Any]:
    data = (root / relative).read_bytes()
    return {"path": relative, "sha256": sha256(data), "size_bytes": len(data)}


def add_file_patch(root: Path) -> str:
    lines = ["*** Begin Patch"]
    for target in TARGETS:
        if (root / target).exists():
            raise RuntimeError(f"admitted create target is no longer absent: {target}")
        content = (root / STAGED_BY_TARGET[target]).read_text(encoding="utf-8")
        lines.append(f"*** Add File: {root / target}")
        lines.extend(f"+{line}" for line in content.splitlines())
    lines.append("*** End Patch")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    root = Path(args.repo_root).resolve()
    run_dir = (root / args.run_dir).resolve()
    ticket_path = run_dir / "execution-ticket.json"
    ticket = json.loads(ticket_path.read_text(encoding="utf-8"))
    receipt_path = run_dir / "terminal-executor-receipt.json"
    receipt_relative = receipt_path.relative_to(root).as_posix()

    if ticket["allowed_writes"] != TARGETS or ticket["declared_outputs"] != TARGETS:
        raise RuntimeError("ticket target/output closure differs from SWU-FCL-001")

    patch = add_file_patch(root)
    applied = subprocess.run(
        ["apply_patch"],
        input=patch.encode("utf-8"),
        cwd=root,
        env={"PATH": os.environ.get("PATH", "")},
        capture_output=True,
        timeout=30,
        check=False,
    )
    if applied.returncode != 0:
        sys.stderr.buffer.write(applied.stdout)
        sys.stderr.buffer.write(applied.stderr)
        return applied.returncode

    completed = subprocess.run(
        VALIDATION["argv"],
        cwd=root,
        env={"PATH": os.environ.get("PATH", "")},
        capture_output=True,
        timeout=VALIDATION["timeout_seconds"],
        check=False,
    )
    result = "pass" if completed.returncode == 0 else "block"
    receipt = {
        "schema_version": "task-session.executor-receipt.v1",
        "receipt_id": "executor:ts-fcl-001-20260824t181605z",
        "run_id": ticket["run_id"],
        "task_id": ticket["task_id"],
        "swu_id": ticket["swu_id"],
        "ticket_ref": exact_ref(root, ticket_path.relative_to(root).as_posix()),
        "owner_identity": {
            "capability": "implementation-executor",
            "subject": "codex-swu-fcl-001",
        },
        "idempotency_key": ticket["idempotency_key"],
        "result": result,
        "touched_files": TARGETS,
        "outputs": [exact_ref(root, target) for target in TARGETS],
        "validation_results": [
            {
                **VALIDATION,
                "exit_code": completed.returncode,
                "result": result,
            }
        ],
        "bounded_capture": {
            "max_output_bytes": VALIDATION["max_output_bytes"],
            "stdout_bytes": len(completed.stdout),
            "stderr_bytes": len(completed.stderr),
            "stdout_truncated": len(completed.stdout) > VALIDATION["max_output_bytes"],
            "stderr_truncated": len(completed.stderr) > VALIDATION["max_output_bytes"],
        },
        "terminal_sequence": {
            "sequence_number": 1,
            "receipt_path": receipt_relative,
            "final_executor_write": True,
        },
        "residue": [] if result == "pass" else ["acceptance-critical validation failed"],
    }
    receipt_path.write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    if completed.stdout:
        sys.stdout.buffer.write(completed.stdout[: VALIDATION["max_output_bytes"]])
    if completed.stderr:
        sys.stderr.buffer.write(completed.stderr[: VALIDATION["max_output_bytes"]])
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
