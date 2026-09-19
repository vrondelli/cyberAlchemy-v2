#!/usr/bin/env python3
"""Stage the admitted causal-scenario postimages and emit one receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
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
    "refreshes/20260805T164500Z-swu-ape-ont-005-apply-approved/material/staged"
)
target_paths = [
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/contracts/evaluation-scenario.schema.json",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/scenarios/cases.json",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/scenarios/evaluations.expected.json",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/scenarios/check-evaluation-scenario.mjs",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs"
]
sources = [source_root / path for path in target_paths]
outputs = [root / path for path in ticket["declared_outputs"]]
if len(sources) != len(outputs):
    raise SystemExit("declared output count does not match admitted material count")
for source, output in zip(sources, outputs, strict=True):
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, output)

output_by_target = dict(zip(target_paths, outputs, strict=True))
checker_target = (
    "projects/domainspec-v2/development/implementation-conformance/"
    "ontology-experiment/examples/enum/scenarios/check-evaluation-scenario.mjs"
)
staged_experiment_root = (
    root
    / "projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/session-evidence/SWU-APE-ONT-005/20260805T165900Z-work-pack-fast-entry/staged/projects/domainspec-v2/development/"
    "implementation-conformance/ontology-experiment"
)

validation_results = []
stdout_bytes = 0
stderr_bytes = 0
for contract in ticket["validation_contracts"]:
    argv = list(contract["argv"])
    environment = os.environ.copy()
    if argv == ["node", checker_target]:
        argv = ["node", str(output_by_target[checker_target])]
        environment["DOMAINSPEC_ONTOLOGY_EXPERIMENT_ROOT"] = str(staged_experiment_root)
    completed = subprocess.run(
        argv,
        cwd=root if contract["cwd"] == "." else root / contract["cwd"],
        env=environment,
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

receipt_path = run_dir / "terminal-executor-receipt.json"
receipt = {
    "bounded_capture": {
        "max_output_bytes": ticket["executor_contract"]["max_output_bytes"],
        "stderr_bytes": stderr_bytes,
        "stderr_truncated": False,
        "stdout_bytes": stdout_bytes,
        "stdout_truncated": False,
    },
    "idempotency_key": ticket["idempotency_key"],
    "owner_identity": ticket["executor_contract"]["owner_identity"],
    "outputs": [exact_ref(root, output) for output in outputs],
    "receipt_id": "executor-receipt-ape-ont-005-fast-entry",
    "residue": [
        "Local causal schema/fixture proof only; BTE adoption and real provider replay remain deferred."
    ],
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
