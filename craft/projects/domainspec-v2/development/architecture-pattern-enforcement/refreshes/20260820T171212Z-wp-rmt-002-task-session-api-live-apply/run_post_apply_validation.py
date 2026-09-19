#!/usr/bin/env python3
"""Run and receipt every live post-apply validation without status masking."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any


RUN = Path(__file__).resolve().parent


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/invoke").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate.resolve()
    raise SystemExit("repository root not found")


ROOT = discover_root()
PLAN = (
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_log(path: Path, data: bytes) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": sha(data),
        "size_bytes": len(data),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    if output.parent != RUN:
        raise SystemExit("validation receipt must remain in the bounded run directory")

    target_args = [
        ".agents/skills/task-session",
        ".claude/skills/task-session",
        f"{PLAN}/SWU-MANIFEST.json",
        f"{PLAN}/SWU-CONTRACTS.json",
        f"{PLAN}/EXECUTION-ENTRY.json",
        f"{PLAN}/validate-work-pack.mjs",
        f"{PLAN}/VALIDATION-RESULT.json",
        f"{PLAN}/EXECUTION-ENTRY-VALIDATION.json",
    ]
    commands: list[tuple[str, list[str], Path, int]] = [
        (
            "live-byte-validation",
            ["python3", str(RUN / "validate_live_apply.py"), "--partition", "all"],
            ROOT,
            120,
        ),
        (
            "plan-once-admission-tests",
            ["python3", "arcanum/arcana/task-session/development/test_plan_once_admission.py"],
            ROOT,
            180,
        ),
        (
            "plan-once-governance-tests",
            ["python3", "arcanum/arcana/task-session/development/test_plan_once_governance.py"],
            ROOT,
            240,
        ),
        (
            "full-governance-runner",
            [
                "python3",
                "arcanum/arcana/task-session/development/validate-governance-runner.py",
                "--family",
                "commit-resume",
                "--task-session-dir",
                "arcanum/arcana/task-session",
            ],
            ROOT,
            300,
        ),
        (
            "wp-rmt-002-live-plan-validator",
            ["node", f"{PLAN}/validate-work-pack.mjs", "."],
            ROOT,
            180,
        ),
        (
            "public-canonical-whitespace",
            ["git", "-C", "arcanum", "diff", "--check", "--", "arcana/task-session"],
            ROOT,
            60,
        ),
        (
            "root-projection-and-plan-whitespace",
            ["git", "diff", "--check", "--", *target_args],
            ROOT,
            60,
        ),
    ]

    environment = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    results: list[dict[str, Any]] = []
    any_failure = False
    for command_id, argv, cwd, timeout in commands:
        timed_out = False
        try:
            completed = subprocess.run(
                argv,
                cwd=cwd,
                env=environment,
                check=False,
                capture_output=True,
                timeout=timeout,
            )
            exit_code = completed.returncode
            stdout = completed.stdout
            stderr = completed.stderr
        except subprocess.TimeoutExpired as error:
            timed_out = True
            exit_code = 124
            stdout = error.stdout or b""
            stderr = error.stderr or b""
        stdout_ref = exact_log(RUN / "validation/logs" / f"{command_id}.stdout", stdout)
        stderr_ref = exact_log(RUN / "validation/logs" / f"{command_id}.stderr", stderr)
        passed = exit_code == 0 and not timed_out
        any_failure = any_failure or not passed
        results.append(
            {
                "command_id": command_id,
                "argv": argv,
                "cwd": cwd.relative_to(ROOT).as_posix() or ".",
                "timeout_seconds": timeout,
                "exit_code": exit_code,
                "timed_out": timed_out,
                "result": "pass" if passed else "fail",
                "stdout": stdout_ref,
                "stderr": stderr_ref,
            }
        )

    receipt = {
        "schema_version": "domainspec.wp-rmt-002-post-apply-validation/v1",
        "result": "fail" if any_failure else "pass",
        "command_count": len(results),
        "pass_count": sum(row["result"] == "pass" for row in results),
        "failure_count": sum(row["result"] == "fail" for row in results),
        "failure_status_preserved": True,
        "commands": results,
        "actual_installed_bytes_exercised": True,
        "configured_swu_commands_executed": False,
        "implementation_swu_executed": False,
        "commit": False,
        "push": False,
        "publication": False,
        "deployment": False,
        "authority_effect": "none",
    }
    output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 1 if any_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
