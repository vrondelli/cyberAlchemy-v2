#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path


PLAN_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PLAN_ROOT / "execution/s0"


def main() -> int:
    manifest = json.loads((PLAN_ROOT / "PREDECESSORS.json").read_text(encoding="utf-8"))
    checks = []
    for source in manifest["sources"]:
        path = Path(source["path"])
        actual = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
        checks.append({
            "id": source["id"],
            "path": str(path),
            "expected_sha256": source["sha256"],
            "actual_sha256": actual,
            "state": "passed" if actual == source["sha256"] else ("missing" if actual is None else "stale"),
        })
    passed = all(item["state"] == "passed" for item in checks) and bool(manifest.get("known_counterevidence"))
    result = {
        "schema_version": "auth.orodi-s0-result/v1-candidate",
        "node": "S0",
        "status": "passed" if passed else "failed",
        "sources": checks,
        "known_counterevidence": manifest.get("known_counterevidence", []),
        "counterevidence_retained": bool(manifest.get("known_counterevidence")),
        "deployment_effect": False,
        "authority_effect": "none",
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUTPUT_ROOT / "RESULT.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
