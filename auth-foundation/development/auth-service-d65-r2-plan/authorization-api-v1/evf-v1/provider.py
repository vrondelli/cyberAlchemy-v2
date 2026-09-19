#!/usr/bin/env python3
"""EVF provider for the exact Authorization API node-13 candidate."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[6]
PLAN = REPOSITORY / "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1"
CANDIDATE = PLAN / "AUTHORIZATION-API-CANDIDATE.v1.json"
VALIDATOR = REPOSITORY / "projects/auth-foundation/implementation/authorization-api/scripts/validate.py"
FREEZER = REPOSITORY / "projects/auth-foundation/implementation/authorization-api/scripts/freeze_candidate.py"


def execute(command: list[str]) -> dict:
    result = subprocess.run(
        command,
        cwd=REPOSITORY,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stdout or result.stderr or "provider command failed")
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    request = json.loads(Path(args.input).read_text(encoding="utf-8"))
    if set(request) != {"schema_version", "runtime_mode", "expected_candidate_digest"}:
        raise RuntimeError("input fields differ from closed contract")
    if request["schema_version"] != "auth.authorization-api-evf-input/v1":
        raise RuntimeError("unsupported input schema")

    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    actual = candidate["candidate_digest"]
    mode = request["runtime_mode"]
    if mode == "full_validation":
        result = execute([sys.executable, str(VALIDATOR)])
        validation_status = result.get("status")
    elif mode == "identity_control":
        result = execute([sys.executable, str(FREEZER), "--verify"])
        validation_status = result.get("status")
    else:
        raise RuntimeError("unsupported runtime mode")

    matches = request["expected_candidate_digest"] == actual
    output = {
        "provider_id": "auth-api-node13-validator",
        "native_outcome": "checked",
        "validation_status": validation_status,
        "candidate_digest": actual,
        "digest_matches": matches,
        "failed_case_ids": [] if matches else ["candidate-digest-mismatch-control"],
    }
    print(json.dumps(output, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)
