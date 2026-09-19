#!/usr/bin/env python3
"""Stage the admitted TypeScript Enum profile activation and emit one receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


STAGED_ROOT = (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "goal-runs/20260806T010816Z-whole-work-pack/rounds/"
    "003-ts001b-task-session/staged"
)
EXPERIMENT_ROOT = Path(
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment"
)
DECISION_PATH = Path(
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/decisions/typescript-representation.json"
)
PROVIDER_RECEIPT_PATH = Path(
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "instances/enum/receipts/SWU-APE-ENUM-TS-001A.json"
)
PROVIDER_PATH = Path(
    "projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/index.ts"
)
ONTOLOGY_SOURCE_PATHS = [
    Path("cyberAlchemy-v2/ontology/NODE-MODEL.md"),
    Path("cyberAlchemy-v2/ontology/RELATION-MODEL.md"),
    Path("cyberAlchemy-v2/ontology/projections/README.md"),
    Path("projects/domainspec-v2/definitions/meta-types/meta-types.yml"),
    Path("projects/domainspec-v2/definitions/meta-types/meta-types.md"),
]
TARGETS = [
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-cases.json",
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/activation-evaluations.expected.json",
]


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
    raise SystemExit("TS001B executor target inventory differs from exact admission")

staged_outputs: list[Path] = []
for target, declared in zip(TARGETS, ticket["declared_outputs"], strict=True):
    source = root / STAGED_ROOT / target
    output = root / declared
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, output)
    staged_outputs.append(output)

sandbox = Path(tempfile.mkdtemp(prefix="ape-ts001b-executor-"))
sandbox_root = sandbox / "repo"
shutil.copytree(root / EXPERIMENT_ROOT, sandbox_root / EXPERIMENT_ROOT)
for support_path in [
    DECISION_PATH,
    PROVIDER_RECEIPT_PATH,
    PROVIDER_PATH,
    *ONTOLOGY_SOURCE_PATHS,
]:
    sandbox_support = sandbox_root / support_path
    sandbox_support.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / support_path, sandbox_support)
for target, staged_output in zip(TARGETS, staged_outputs, strict=True):
    sandbox_target = sandbox_root / target
    sandbox_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(staged_output, sandbox_target)

validation_results = []
stdout_bytes = 0
stderr_bytes = 0
focused_stdout: list[bytes] = []
for contract in ticket["validation_contracts"]:
    command_id = contract["command_id"]
    environment = os.environ.copy()
    if command_id in {
        "validate-typescript-enum-profile-activation-1",
        "validate-typescript-enum-profile-activation-2",
    }:
        argv = [
            "node",
            str(
                sandbox_root
                / EXPERIMENT_ROOT
                / "examples/enum/profiles/check-profile-resolution.mjs"
            ),
        ]
        cwd = sandbox_root
        environment["DOMAINSPEC_PROFILE_EXPERIMENT_ROOT"] = str(
            sandbox_root / EXPERIMENT_ROOT
        )
    elif command_id == "validate-typescript-profile-ontology-regression":
        argv = ["node", str(sandbox_root / EXPERIMENT_ROOT / "validate-ontology.mjs")]
        cwd = sandbox_root
    else:
        raise SystemExit(f"undeclared TS001B validation command: {command_id}")

    completed = subprocess.run(
        argv,
        cwd=cwd,
        env=environment,
        shell=False,
        capture_output=True,
        timeout=contract["timeout_seconds"],
        check=False,
    )
    stdout_bytes += len(completed.stdout)
    stderr_bytes += len(completed.stderr)
    if command_id.startswith("validate-typescript-enum-profile-activation-"):
        focused_stdout.append(completed.stdout)
    validation_results.append(
        {
            **contract,
            "exit_code": completed.returncode,
            "result": "pass" if completed.returncode == 0 else "block",
        }
    )

capture_limit = ticket["executor_contract"]["max_output_bytes"]
capture_within_limit = stdout_bytes <= capture_limit and stderr_bytes <= capture_limit
focused_outputs_identical = len(focused_stdout) == 2 and focused_stdout[0] == focused_stdout[1]
focused_stdout_sha256 = (
    hashlib.sha256(focused_stdout[0]).hexdigest()
    if focused_stdout
    else "unavailable"
)
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
    "receipt_id": "executor-receipt-ape-ts001b-plan-once",
    "residue": [
        "Profile activation and ontology regression checks observed an isolated candidate mirror; Task Session must rerun the exact declared commands on live targets after commit.",
        f"Focused resolver outputs were byte-identical: {str(focused_outputs_identical).lower()}.",
        f"Focused resolver stdout sha256: {focused_stdout_sha256}.",
    ],
    "result": (
        "pass"
        if capture_within_limit
        and focused_outputs_identical
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
