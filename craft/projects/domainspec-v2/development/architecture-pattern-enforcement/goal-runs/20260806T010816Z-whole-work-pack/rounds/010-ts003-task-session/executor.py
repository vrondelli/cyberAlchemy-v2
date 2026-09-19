#!/usr/bin/env python3
"""Stage the admitted TypeScript Enum fixture matrix and emit one executor receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from ts003_scope import TARGETS


STAGED_ROOT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/"
    "010-ts003-task-session/staged"
)
IMPL_ROOT = Path("projects/domainspec-v2/impl")
SUPPORT = [
    Path(
        "projects/domainspec-v2/development/implementation-conformance/"
        "ontology-experiment/profiles/base-domain.profile.json"
    ),
    Path(
        "projects/domainspec-v2/development/implementation-conformance/"
        "ontology-experiment/profiles/typescript-strict.profile.json"
    ),
    Path(
        "projects/domainspec-v2/development/architecture-pattern-enforcement/"
        "instances/enum/receipts/SWU-APE-ENUM-TS-001B.json"
    ),
    Path(
        "projects/domainspec-v2/development/architecture-pattern-enforcement/"
        "instances/enum/receipts/SWU-APE-ENUM-TS-002.json"
    ),
]
SUPPORT_DIRECTORIES = [Path("validation/poker-team/backend/src")]


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

if ticket["allowed_writes"] != TARGETS or len(ticket["declared_outputs"]) != len(TARGETS):
    raise SystemExit("TS003 executor target inventory differs from exact admission")

staged_outputs: list[Path] = []
for target, declared in zip(TARGETS, ticket["declared_outputs"], strict=True):
    source = root / STAGED_ROOT / target
    output = root / declared
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, output)
    staged_outputs.append(output)

sandbox = Path(tempfile.mkdtemp(prefix="ape-ts003-executor-"))
sandbox_root = sandbox / "repo"
sandbox_impl = sandbox_root / IMPL_ROOT
shutil.copytree(
    root / IMPL_ROOT,
    sandbox_impl,
    ignore=shutil.ignore_patterns("node_modules"),
)
(sandbox_impl / "node_modules").symlink_to(
    root / IMPL_ROOT / "node_modules", target_is_directory=True
)
for support in SUPPORT:
    target = sandbox_root / support
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / support, target)
for support_directory in SUPPORT_DIRECTORIES:
    shutil.copytree(root / support_directory, sandbox_root / support_directory)
(sandbox_root / "validation/poker-team/node_modules").symlink_to(
    root / "validation/poker-team/node_modules", target_is_directory=True
)
for target, staged_output in zip(TARGETS, staged_outputs, strict=True):
    sandbox_target = sandbox_root / target
    sandbox_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(staged_output, sandbox_target)

validation_results = []
stdout_bytes = 0
stderr_bytes = 0
for contract in ticket["validation_contracts"]:
    command_id = contract["command_id"]
    if command_id == "validate-typescript-enum-fixture-matrix":
        argv = [
            "npm", "--prefix", str(sandbox_impl), "exec", "--", "vitest",
            "--root", str(sandbox_impl), "run",
            "architecture-conformance/typescript/fixture-tests/enum/fixture-matrix.test.ts",
        ]
    elif command_id == "validate-typescript-enum-adapter-regression-after-fixtures":
        argv = [
            "npm", "--prefix", str(sandbox_impl), "exec", "--", "vitest",
            "--root", str(sandbox_impl), "run",
            "architecture-conformance/typescript/adapter-tests/enum/adapter.test.ts",
        ]
    elif command_id == "validate-typescript-enum-fixture-types":
        argv = [
            "npm", "--prefix", str(sandbox_impl), "exec", "--", "tsc",
            "--noEmit", "-p",
            str(sandbox_impl / "architecture-conformance/typescript/fixture-tests/enum/tsconfig.json"),
        ]
    elif command_id == "validate-typescript-parent-typecheck-after-fixtures":
        argv = [
            "npm", "--prefix", str(sandbox_impl), "run", "typecheck", "--",
            "--pretty", "false",
        ]
    else:
        raise SystemExit(f"undeclared TS003 validation command: {command_id}")

    completed = subprocess.run(
        argv,
        cwd=sandbox_root,
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
    "outputs": [exact_ref(root, output) for output in staged_outputs],
    "receipt_id": "executor-receipt-ape-ts003-plan-once",
    "residue": [
        "The fixture denominator, adapter regression, focused types, and parent typecheck observed an isolated candidate mirror; Task Session must rerun the exact declared commands on live targets after commit."
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
