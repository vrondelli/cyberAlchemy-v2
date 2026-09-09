#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RECEIPT = ROOT / "generated/exploration-receipt.json"


def main() -> int:
    errors: list[str] = []
    checked = subprocess.run(
        [sys.executable, str(ROOT / "author.py"), "--check"],
        cwd=ROOT, text=True, capture_output=True, timeout=60, check=False,
    )
    if checked.returncode != 0:
        errors.append("author-check: " + (checked.stdout + checked.stderr).strip())
    try:
        receipt = json.loads(RECEIPT.read_text())
        if receipt.get("status") != "PASS_BOUNDED":
            errors.append("bounded exploration did not pass")
        if receipt.get("finite_universe", {}).get("enumerated_states") != 120:
            errors.append("finite universe cardinality drift")
        if len(receipt.get("obligation_results", [])) != 5:
            errors.append("bounded obligation coverage drift")
        if receipt.get("authority_effect") != "none" or receipt.get("external_effect") != "none":
            errors.append("authority or external-effect inflation")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"receipt unreadable: {exc}")
        receipt = {}
    print(json.dumps({
        "result": "BLOCK" if errors else "PASS_BOUNDED",
        "receipt_sha256": hashlib.sha256(RECEIPT.read_bytes()).hexdigest() if RECEIPT.is_file() else None,
        "errors": errors,
        "authority_effect": "none"
    }, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
