#!/usr/bin/env python3
"""Regression checks for manifest-driven applied candidate validation."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[7]
RUN = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/invoke-refresh/"
    "20260824T042948Z-wp-fmp-002-terminal-receipt-refresh"
)
OLD = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/"
    "20260824T030126Z-fmp-six-unit-candidate"
)
STAGED = RUN / "staged/projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/20260824T042948Z-fmp-six-unit-candidate-r2"
TARGET = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/"
    "20260824T042948Z-fmp-six-unit-candidate-r2"
)
VALIDATOR = RUN / "scripts/validate-staged-candidate.py"


def copy_fixture(root: Path) -> None:
    shutil.copytree(REPOSITORY_ROOT / OLD, root / OLD)
    shutil.copytree(REPOSITORY_ROOT / STAGED, root / STAGED)
    shutil.copytree(REPOSITORY_ROOT / TARGET, root / TARGET)
    (root / RUN).mkdir(parents=True, exist_ok=True)
    shutil.copy2(REPOSITORY_ROOT / RUN / "TARGET-INVENTORY.json", root / RUN)
    shutil.copy2(REPOSITORY_ROOT / RUN / "material-package.json", root / RUN)
    bindings = json.loads(
        (root / TARGET / "RECEIPT-BINDINGS.json").read_text(encoding="utf-8")
    )
    for binding in bindings.values():
        if not isinstance(binding, dict) or "path" not in binding:
            continue
        relative = Path(binding["path"])
        source = REPOSITORY_ROOT / relative
        if source.is_file() and not (root / relative).is_file():
            (root / relative).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, root / relative)
    cache = root / STAGED / "validators/__pycache__/regression-residue.cpython-312.pyc"
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(b"validation-only cache residue")


def validate(root: Path) -> tuple[int, dict[str, object]]:
    command = [
        sys.executable,
        str(REPOSITORY_ROOT / VALIDATOR),
        "--repository-root",
        str(root),
        "--staged-candidate-root",
        str(STAGED),
        "--target-candidate-root",
        str(TARGET),
        "--target-inventory",
        str(RUN / "TARGET-INVENTORY.json"),
        "--material-package",
        str(RUN / "material-package.json"),
        "--phase",
        "applied",
    ]
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    result = subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        env=environment,
        check=False,
        capture_output=True,
        text=True,
    )
    if not result.stdout:
        raise AssertionError(f"validator produced no JSON: {result.stderr}")
    return result.returncode, json.loads(result.stdout)


def assert_blocked(
    root: Path, expected_error_fragment: str
) -> dict[str, object]:
    exit_code, receipt = validate(root)
    if exit_code != 2 or receipt["status"] != "block":
        raise AssertionError(
            f"expected block/2, got {receipt['status']}/{exit_code}: {receipt}"
        )
    if not any(
        expected_error_fragment in error for error in receipt.get("errors", [])
    ):
        raise AssertionError(
            f"missing error fragment {expected_error_fragment!r}: {receipt}"
        )
    return receipt


def main() -> int:
    results: list[dict[str, object]] = []

    with tempfile.TemporaryDirectory(prefix="wp-fmp-002-validator-pass-") as raw:
        root = Path(raw)
        copy_fixture(root)
        exit_code, receipt = validate(root)
        if exit_code != 0 or receipt["status"] != "pass":
            raise AssertionError(f"cache-residue pass failed: {receipt}")
        results.append(
            {
                "case": "staged-pycache-does-not-cause-applied-drift",
                "exit_code": exit_code,
                "status": receipt["status"],
            }
        )

    with tempfile.TemporaryDirectory(prefix="wp-fmp-002-validator-tamper-") as raw:
        root = Path(raw)
        copy_fixture(root)
        with (root / TARGET / "WORK-PACK.md").open("ab") as handle:
            handle.write(b"tampered\n")
        receipt = assert_blocked(
            root, "applied target bytes differ from declared output"
        )
        results.append(
            {
                "case": "tampered-declared-target-rejected",
                "exit_code": 2,
                "status": receipt["status"],
            }
        )

    with tempfile.TemporaryDirectory(prefix="wp-fmp-002-validator-extra-") as raw:
        root = Path(raw)
        copy_fixture(root)
        (root / TARGET / "UNDECLARED.txt").write_text(
            "not in the material package\n", encoding="utf-8"
        )
        receipt = assert_blocked(root, "undeclared candidate file: UNDECLARED.txt")
        results.append(
            {
                "case": "extra-live-target-rejected",
                "exit_code": 2,
                "status": receipt["status"],
            }
        )

    with tempfile.TemporaryDirectory(prefix="wp-fmp-002-validator-symlink-") as raw:
        root = Path(raw)
        copy_fixture(root)
        (root / TARGET / "UNDECLARED-LINK").symlink_to("WORK-PACK.md")
        receipt = assert_blocked(root, "candidate contains symlink: UNDECLARED-LINK")
        results.append(
            {
                "case": "live-symlink-rejected",
                "exit_code": 2,
                "status": receipt["status"],
            }
        )

    print(
        json.dumps(
            {
                "schema_version": "fmp.apply-validator-regression.v1",
                "status": "pass",
                "cases": results,
                "authority_effect": "none",
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
