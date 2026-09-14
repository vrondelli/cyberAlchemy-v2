#!/usr/bin/env python3
"""Verify the candidate product from a source-only CyberAlchemy v2 copy.

The copy intentionally omits legacy orchestration directories, build caches,
run state, and evidence. Open questions are owned by
../authority/definitions/DEFINITIONS.md#open-questions.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
from pathlib import Path


CA2 = Path(__file__).resolve().parents[2]
DEFAULT_STAGE_PARENT = CA2 / "orchestrator/api/target/test-tmp/m9-standalone"
COPY_PATHS = (
    "orchestrator",
    "trusted-dataset-materialization",
    "development/robot-world-kep",
    "tools/toolchain",
    "authority/decisions/work-orchestration-semantic-admission",
)
REQUIRED_EVIDENCE = (
    "trusted-dataset-materialization/runs/postgres-conformance-report.json",
)
EXCLUDED_DIRS = {
    ".git",
    "__pycache__",
    "browser-evidence",
    "evidence",
    "node_modules",
    "runs",
    "target",
}
FORBIDDEN_REFS = (
    "/home/vrondelli/projects/cya-orquestrator",
    "projects/cyberalchemy-orchestrator",
)
PROVENANCE_ALLOWLIST = (
    "orchestrator/migration/",
    "orchestrator/rwo/legacy-fixtures/",
    "orchestrator/define/HANDLED-DEFINITIONS.json",
    "orchestrator/define/ORCHESTRATOR-DEFINITION-PACK.v1-candidate.json",
    "orchestrator/define/SOURCES.json",
    "orchestrator/examples/trusted-dataset/LEGACY-PROVENANCE.json",
    "orchestrator/tests/verify_standalone.py",
    "orchestrator/tests/build_retirement_manifest.py",
    "development/robot-world-kep/SOURCE-DEPENDENCIES.json",
    "development/robot-world-kep/interaction-dynamics/REPORT.md",
)


def ignore(_directory: str, names: list[str]) -> set[str]:
    return {name for name in names if name in EXCLUDED_DIRS}


def prepare(stage_parent: Path) -> Path:
    stage_root = stage_parent / "cyberAlchemy-v2"
    if stage_parent.exists():
        shutil.rmtree(stage_parent)
    stage_root.mkdir(parents=True)
    for relative in COPY_PATHS:
        source = CA2 / relative
        target = stage_root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, target, ignore=ignore)
    for relative in REQUIRED_EVIDENCE:
        target = stage_root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(CA2 / relative, target)
    return stage_root


def is_allowlisted(relative: str) -> bool:
    return any(relative == item or relative.startswith(item) for item in PROVENANCE_ALLOWLIST)


def scan(stage_root: Path) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    for path in sorted(item for item in stage_root.rglob("*") if item.is_file()):
        relative = path.relative_to(stage_root).as_posix()
        if is_allowlisted(relative):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for forbidden in FORBIDDEN_REFS:
            if forbidden in content:
                findings.append({"path": relative, "reference": forbidden})
    return findings


def run(stage_root: Path, command: list[str], cwd: Path | None = None) -> dict[str, object]:
    rendered = " ".join(command)
    print(f"RUN {rendered}", flush=True)
    environment = dict(os.environ)
    scratch = stage_root / ".test-tmp"
    scratch.mkdir(exist_ok=True)
    environment["TMPDIR"] = str(scratch)
    completed = subprocess.run(
        command,
        cwd=cwd or stage_root,
        env=environment,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if completed.returncode:
        print(completed.stdout, end="")
        raise RuntimeError(f"COMMAND_FAILED:{rendered}")
    tail = completed.stdout.splitlines()[-4:]
    for line in tail:
        print(line)
    return {"command": rendered, "status": "PASS", "exit_code": completed.returncode}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage-parent", type=Path, default=DEFAULT_STAGE_PARENT)
    args = parser.parse_args()
    stage_root = prepare(args.stage_parent.resolve())
    findings = scan(stage_root)
    if findings:
        raise RuntimeError("ACTIVE_LEGACY_REFERENCE:" + json.dumps(findings, sort_keys=True))

    launcher = str(stage_root / "tools/toolchain/run-rwo")
    commands: list[dict[str, object]] = []
    commands.append(run(stage_root, ["python3", "orchestrator/examples/robot-talks/build.py", "--check"]))
    commands.append(run(stage_root, ["python3", "orchestrator/examples/robot-world/build.py", "--check"]))
    for manifest in (
        "orchestrator/rwo/Cargo.toml",
        "orchestrator/runtime/Cargo.toml",
        "orchestrator/capabilities/orchestration/Cargo.toml",
        "orchestrator/api/Cargo.toml",
        "orchestrator/examples/robot-world/Cargo.toml",
    ):
        commands.append(run(stage_root, [launcher, "cargo", "test", "--offline", "--manifest-path", manifest]))
    commands.append(run(stage_root, ["node", "--test", "test/ui-model.test.mjs"], stage_root / "orchestrator/frontend"))
    commands.append(run(stage_root, ["python3", "trusted-dataset-materialization/validate.py"]))
    commands.append(run(stage_root, ["python3", "development/robot-world-kep/orchestrator-integration/build.py"]))
    commands.append(
        run(
            stage_root,
            ["python3", "-m", "unittest", "-v", "test_contracts", "test_integration"],
            stage_root / "development/robot-world-kep/orchestrator-integration",
        )
    )
    commands.append(run(stage_root, ["python3", "development/robot-world-kep/runtime/run.py", "validate"]))

    print(
        json.dumps(
            {
                "schema_version": "cav2-orchestrator-standalone-verification/v1-candidate",
                "status": "PASS",
                "stage_root": str(stage_root),
                "legacy_directories_copied": [],
                "required_evidence": list(REQUIRED_EVIDENCE),
                "active_legacy_reference_findings": findings,
                "checks": commands,
                "authority_effect": "none",
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
