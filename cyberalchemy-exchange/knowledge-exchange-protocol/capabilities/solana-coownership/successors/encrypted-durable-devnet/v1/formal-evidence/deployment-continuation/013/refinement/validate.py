#!/usr/bin/env python3
"""Collect-all validation for candidate-013 Rust refinement evidence."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RECEIPT = ROOT / "generated/refinement-receipt.json"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    replay = subprocess.run(
        [sys.executable, str(ROOT / "author.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=1200,
        check=False,
    )
    if replay.returncode != 0:
        errors.append("author-check: " + (replay.stdout + replay.stderr).strip())
    try:
        receipt = json.loads(RECEIPT.read_text())
        coverage = receipt["coverage"]
        if receipt.get("status") != "PASS_BOUNDED":
            errors.append("refinement status is not PASS_BOUNDED")
        if coverage.get("required_obligations") != 10:
            errors.append("required obligation count drift")
        if coverage.get("mapped_obligations") != 10 or coverage.get("preserved_obligations") != 10:
            errors.append("refinement coverage incomplete")
        if receipt.get("test_execution", {}).get("execution_count") != 2:
            errors.append("two-run test execution missing")
        if receipt.get("test_execution", {}).get("two_run_pass_agreement") is not True:
            errors.append("test executions disagree")
        if receipt.get("baseline", {}).get("claims_sha256") != "c61b98d397eaf3af9918f30f66ad4d6239e031e90262cec005fb12b7963837f0":
            errors.append("claims baseline drift")
        if receipt.get("baseline", {}).get("formal_receipt_sha256") != "be930df2a4180815f624c56367eb38a79caf78ba18fdf8296838084ddaa44c72":
            errors.append("formal receipt baseline drift")
        if receipt.get("authority_effect") != "none" or receipt.get("external_effect") != "none":
            errors.append("authority or external-effect inflation")
    except (OSError, KeyError, json.JSONDecodeError) as exc:
        errors.append(f"receipt unreadable: {exc}")
        receipt = {}
    result = {
        "result": "BLOCK" if errors else "PASS_BOUNDED",
        "receipt_sha256": sha(RECEIPT) if RECEIPT.is_file() else None,
        "obligations": receipt.get("coverage", {}).get("preserved_obligations"),
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
