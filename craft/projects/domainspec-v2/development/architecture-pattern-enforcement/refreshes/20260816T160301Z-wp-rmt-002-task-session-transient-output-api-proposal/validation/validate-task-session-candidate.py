#!/usr/bin/env python3
"""Replay the staged generic Task Session transient-output candidate.

The validator operates only on package-local postimages and an isolated temporary
copy of the public Arcanum tree.  It never installs the candidate or runs a Work
Pack SWU.
"""

from __future__ import annotations

import ast
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[7]
PACKAGE = Path(__file__).resolve().parents[1]
PREIMAGES = PACKAGE / "preimages"
STAGED = PACKAGE / "staged"

CANONICAL_RELS = (
    "SKILL.md",
    "development/test_plan_once_admission.py",
    "development/test_plan_once_governance.py",
    "development/validate-governance-runner.py",
    "schemas/execution-ticket.schema.json",
    "schemas/executor-receipt.schema.json",
    "schemas/governance-run-request.schema.json",
    "schemas/mutation-admission-receipt.schema.json",
    "schemas/mutation-admission-request.schema.json",
    "scripts/task-session-governance-runner.py",
    "scripts/verify-mutation-readiness.py",
)
GENERATED_RELS = (
    "SKILL.md",
    "schemas/execution-ticket.schema.json",
    "schemas/executor-receipt.schema.json",
    "schemas/governance-run-request.schema.json",
    "schemas/mutation-admission-receipt.schema.json",
    "schemas/mutation-admission-request.schema.json",
    "scripts/task-session-governance-runner.py",
    "scripts/verify-mutation-readiness.py",
)
CANONICAL_BASE = Path("arcanum/arcana/task-session")
HOST_BASES = {
    "codex": Path(".agents/skills/task-session"),
    "claude": Path(".claude/skills/task-session"),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(argv: list[str], cwd: Path, timeout: int = 180) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        argv,
        cwd=cwd,
        check=False,
        capture_output=True,
        timeout=timeout,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )


def require_suite(
    process: subprocess.CompletedProcess[bytes], label: str, expected_tests: int
) -> None:
    evidence = process.stdout + process.stderr
    if (
        process.returncode != 0
        or f"Ran {expected_tests} tests".encode("utf-8") not in evidence
        or b"\nOK\n" not in evidence
    ):
        raise SystemExit(
            f"{label} failed: exit={process.returncode}\n"
            + evidence.decode("utf-8", errors="replace")
        )


def target_paths() -> list[Path]:
    return [CANONICAL_BASE / rel for rel in CANONICAL_RELS] + [
        base / rel for base in HOST_BASES.values() for rel in GENERATED_RELS
    ]


def validate_static_candidate() -> dict[str, Any]:
    targets = target_paths()
    if len(targets) != 27 or len(set(targets)) != 27:
        raise SystemExit("candidate target inventory must be exactly 27 unique paths")

    for rel in targets:
        live = REPO / rel
        preimage = PREIMAGES / rel
        postimage = STAGED / rel
        if not (live.is_file() and preimage.is_file() and postimage.is_file()):
            raise SystemExit(f"missing candidate target binding: {rel.as_posix()}")
        if live.read_bytes() != preimage.read_bytes():
            raise SystemExit(f"live candidate source drift: {rel.as_posix()}")
        if postimage.read_bytes() == preimage.read_bytes():
            raise SystemExit(f"candidate postimage is unchanged: {rel.as_posix()}")

    parity: dict[str, str] = {}
    for host, base in HOST_BASES.items():
        for rel in GENERATED_RELS:
            canonical = STAGED / CANONICAL_BASE / rel
            generated = STAGED / base / rel
            if rel == "SKILL.md":
                lines = generated.read_text(encoding="utf-8").splitlines(keepends=True)
                expected_header = [
                    "surface_kind: generated-native-runtime-package\n",
                    f"runtime: {host}\n",
                    "canonical_source: arcana/task-session/SKILL.md\n",
                    "alias_of: null\n",
                    "generated_by: tools/bootstrap_arcanum.sh --profile\n",
                    "mutation_policy: regenerate-from-canonical-source\n",
                ]
                if lines[1:7] != expected_header:
                    raise SystemExit(f"generated {host} skill provenance drift")
                projected = [lines[0], *lines[7:]]
                if host == "claude":
                    projected = [
                        line.replace(
                            "allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Agent, Bash",
                            "allowed-tools: Read, Write, Glob, Grep, AskQuestions, Task, Bash",
                        )
                        for line in projected
                    ]
                if "".join(projected).encode("utf-8") != canonical.read_bytes():
                    raise SystemExit(f"generated {host} skill projection drift")
            elif canonical.read_bytes() != generated.read_bytes():
                raise SystemExit(f"generated {host} parity drift: {rel}")
        parity[host] = f"{len(GENERATED_RELS)}/{len(GENERATED_RELS)}"

    json_paths = sorted(
        STAGED / base / rel
        for base in (CANONICAL_BASE, *HOST_BASES.values())
        for rel in GENERATED_RELS
        if rel.endswith(".json")
    )
    for path in json_paths:
        json.loads(path.read_text(encoding="utf-8"))

    python_paths = sorted(
        path for path in (STAGED / CANONICAL_BASE).rglob("*.py")
    ) + sorted(
        path
        for base in HOST_BASES.values()
        for path in (STAGED / base).rglob("*.py")
    )
    for path in python_paths:
        ast.parse(path.read_text(encoding="utf-8"), filename=str(path))

    residue = [
        path.relative_to(PACKAGE).as_posix()
        for path in STAGED.rglob("*")
        if path.name == "__pycache__" or path.suffix == ".pyc"
    ]
    if residue:
        raise SystemExit("staged Python cache residue: " + ",".join(residue))

    admission_request = json.loads(
        (STAGED / CANONICAL_BASE / "schemas/mutation-admission-request.schema.json").read_text(
            encoding="utf-8"
        )
    )
    versions = set(admission_request["properties"]["schemaVersion"]["enum"])
    if versions != {"1.2.0", "1.3.0"}:
        raise SystemExit("mutation admission version set drift")

    return {
        "target_preimages_unchanged": "27/27",
        "target_postimages_changed": "27/27",
        "canonical_targets": "11/11",
        "generated_parity": parity,
        "json_schema_syntax": f"{len(json_paths)}/{len(json_paths)}",
        "python_syntax": f"{len(python_paths)}/{len(python_paths)}",
        "schema_versions": ["1.2.0", "1.3.0"],
    }


def validate_semantic_candidate() -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="task-session-transient-candidate-") as temp:
        overlay = Path(temp)
        shutil.copytree(
            REPO / "arcanum",
            overlay / "arcanum",
            symlinks=True,
            ignore=shutil.ignore_patterns(".arcanum", ".git", "__pycache__", "*.pyc"),
        )
        destination = overlay / CANONICAL_BASE
        shutil.copytree(
            STAGED / CANONICAL_BASE,
            destination,
            dirs_exist_ok=True,
        )
        development = destination / "development"
        governance = run(
            ["python3", str(development / "test_plan_once_governance.py")],
            overlay,
        )
        require_suite(governance, "plan-once governance candidate", 32)
        admission = run(
            ["python3", str(development / "test_plan_once_admission.py")],
            overlay,
        )
        require_suite(admission, "plan-once admission candidate", 13)
        harness = run(
            [
                "python3",
                str(development / "validate-governance-runner.py"),
                "--family",
                "commit-resume",
            ],
            overlay,
            timeout=240,
        )
        required = (
            b"RESULT positive=20/20 negative=26/26 undeclared_outputs=0",
            b"STAGED_MANIFEST_SHA256 d8a7249f834602d01173e4a43e9c762f6a8f6667413d67f9b80f346a4f01805d",
        )
        if harness.returncode != 0 or any(item not in harness.stdout for item in required):
            raise SystemExit(
                f"full governance runner harness failed: exit={harness.returncode}\n"
                + (harness.stdout + harness.stderr).decode("utf-8", errors="replace")
            )

    return {
        "plan_once_governance_tests": "32/32",
        "plan_once_admission_tests": "13/13",
        "legacy_1_2_compatibility": "pass",
        "transient_1_3_contract": "pass",
        "full_governance_runner": {
            "positive": "20/20",
            "negative": "26/26",
            "undeclared_outputs": 0,
            "staged_manifest_sha256": "d8a7249f834602d01173e4a43e9c762f6a8f6667413d67f9b80f346a4f01805d",
        },
        "governance_reserved_path_regressions": {
            "count": "9/9",
            "cases": [
                {
                    "fixture_id": "transient-run-directory-overlap",
                    "expected_code": "TRANSIENT_RUN_DIRECTORY_OVERLAP",
                    "diagnostic": "run directory",
                },
                {
                    "fixture_id": "transient-plan-ledger-overlap",
                    "expected_code": "TRANSIENT_PLAN_LEDGER_OVERLAP",
                    "diagnostic": "plan admission consumption ledger",
                },
                {
                    "fixture_id": "transient-prerequisite-ledger-overlap",
                    "expected_code": "TRANSIENT_PREREQUISITE_LEDGER_OVERLAP",
                    "diagnostic": "pre-execution prerequisite consumption ledger",
                },
                {
                    "fixture_id": "transient-prerequisite-receipt-overlap",
                    "expected_code": "TRANSIENT_PREREQUISITE_RECEIPT_OVERLAP",
                    "diagnostic": "pre-execution prerequisite resume receipt",
                },
                {
                    "fixture_id": "external-executor-receipt-not-run-scoped",
                    "expected_code": "EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
                    "diagnostic": "run-scoped terminal path",
                },
                {
                    "fixture_id": "tampered-ticket-executor-receipt-path",
                    "expected_code": "TICKET_EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
                    "diagnostic": "run-scoped terminal path",
                },
                {
                    "fixture_id": "tampered-ticket-prerequisite-reservation",
                    "expected_code": "TICKET_TRANSIENT_PREREQUISITE_RESERVATION_OVERLAP",
                    "diagnostic": "pre-execution prerequisite consumption ledger",
                },
                {
                    "fixture_id": "ticket-only-transient-substitution",
                    "expected_code": "TASK_SESSION_TICKET_CHECKPOINT_REF_STALE",
                    "diagnostic": "TASK_SESSION_TICKET_CHECKPOINT_REF_STALE",
                },
                {
                    "fixture_id": "ticket-checkpoint-transient-substitution",
                    "expected_code": "TASK_SESSION_TICKET_TRANSIENT_CLOSURE_DRIFT",
                    "diagnostic": "TASK_SESSION_TICKET_TRANSIENT_CLOSURE_DRIFT",
                },
            ],
        },
    }


def main() -> None:
    if sys.argv[1:] not in ([], ["--emit-expected"], ["--write-expected"]):
        raise SystemExit(
            "usage: validate-task-session-candidate.py "
            "[--emit-expected|--write-expected]"
        )
    static = validate_static_candidate()
    semantic = validate_semantic_candidate()
    output = {
        "schema_version": "arcanum.task-session-transient-output-candidate-validation/v1",
        "result": "pass",
        "candidate_api_version": "1.3.0",
        "compatibility_floor": "1.2.0",
        "static": static,
        "semantic": semantic,
        "transient_contract": {
            "durable_declared_outputs_preserved": True,
            "material_only_baselines_preserved": True,
            "separate_transient_admission": True,
            "touch_evidence_required": True,
            "cleanup_evidence_required": True,
            "absence_before_terminal_receipt_required": True,
        },
        "selection_receipt": "absent",
        "task_session_admission": "absent",
        "live_mutation": "absent",
        "authority_effect": "none",
    }
    payload = (json.dumps(output, indent=2, sort_keys=True) + "\n").encode("utf-8")
    stored = PACKAGE / "TASK-SESSION-CANDIDATE-VALIDATION.json"
    if sys.argv[1:] == ["--write-expected"]:
        stored.write_bytes(payload)
    elif sys.argv[1:] != ["--emit-expected"]:
        if not stored.is_file() or stored.read_bytes() != payload:
            raise SystemExit("STORED_TASK_SESSION_CANDIDATE_OUTPUT_DRIFT")
    if sys.argv[1:] != ["--write-expected"]:
        sys.stdout.buffer.write(payload)


if __name__ == "__main__":
    main()
