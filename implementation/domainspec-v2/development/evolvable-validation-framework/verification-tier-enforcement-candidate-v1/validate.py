#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[4]
sys.path.insert(0, str(ROOT))

from evf_tiers.compatibility import evaluate_tde_compatibility  # noqa: E402


def main() -> int:
    errors: list[str] = []
    tests = subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**__import__("os").environ, "PYTHONDONTWRITEBYTECODE": "1"},
        check=False,
    )
    if tests.returncode:
        errors.append("construction-tests-failed")

    for relative in ("profile.json", "contracts/profile.v1.schema.json", "contracts/invocation.v1.schema.json", "contracts/result.v1.schema.json", "compatibility/tde.v1-candidate.json"):
        try:
            value = json.loads((ROOT / relative).read_text())
            if relative.startswith("contracts/"):
                Draft202012Validator.check_schema(value)
        except Exception as exc:  # validation boundary
            errors.append(f"invalid-json-or-schema:{relative}:{type(exc).__name__}")

    mapping = json.loads((ROOT / "compatibility/tde.v1-candidate.json").read_text())
    compatibility = evaluate_tde_compatibility(REPO, mapping)
    profile = json.loads((ROOT / "profile.json").read_text())
    result = {
        "schema_version": "evf.verification-tier-enforcement-validation/v1",
        "result": "PASS" if not errors else "FAIL",
        "candidate_id": profile["profile_id"],
        "implemented_tiers": profile["supported_tiers"],
        "construction_tests": {
            "status": "PASS" if tests.returncode == 0 else "FAIL",
            "count": 26,
        },
        "current_tde_compatibility": compatibility,
        "product_evidence_status": "NOT_EVALUABLE" if compatibility["overall_state"] == "not_evaluable" else "ELIGIBLE_FOR_FRESH_INVOCATION",
        "residue": sorted({residue for item in compatibility["mappings"] for residue in item["residue"]}),
        "errors": errors,
        "claim_ceiling": "V0-V2 enforcement construction and current compatibility eligibility only; tests use constructed inputs and are not provider product evidence.",
        "authority_effect": "none",
        "product_approval": "not-granted",
        "runtime_admission": "not-granted",
        "release_admission": "not-granted",
    }
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
