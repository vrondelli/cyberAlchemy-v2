#!/usr/bin/env python3
"""Validate exact owner acceptance for deployment candidate 003."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
DECISION = VERTICAL / "decisions/prebuilt-image-deployment-acceptance-003.json"
DECISION_SHA256 = "187dee4df80b9962a94f536722c9062c77eb2d9b2d236ddeb87a343ea20ebb16"
CANDIDATE = ROOT / "prebuilt-image-deployment-candidate-003.json"
CANDIDATE_SHA256 = "c742b093a7d49dab81064676c217b0de3df222512ad51bc88fb4ac5405f76dec"
PREACCEPTANCE = ROOT / "evidence/prebuilt-image-deployment-preacceptance-003.json"
PREACCEPTANCE_SHA256 = "e8119267877bfc3b38a5e4278fab1e88855452800250baa1edc4fbe90600593d"
EXACT_USER_DECISION = "Accept deployment candidate c742b093a7d49dab81064676c217b0de3df222512ad51bc88fb4ac5405f76dec"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    checks: list[dict[str, str]] = []
    errors: list[str] = []

    def check(check_id: str, condition: bool, failure: str) -> None:
        checks.append({"check_id": check_id, "status": "PASS" if condition else "BLOCK"})
        if not condition:
            errors.append(failure)

    for path, expected, check_id in (
        (DECISION, DECISION_SHA256, "acceptance-byte-identity"),
        (CANDIDATE, CANDIDATE_SHA256, "candidate-byte-identity"),
        (PREACCEPTANCE, PREACCEPTANCE_SHA256, "preacceptance-byte-identity"),
    ):
        check(check_id, path.is_file() and sha(path) == expected, f"{check_id} missing or digest drift")

    decision = json.loads(DECISION.read_text())
    candidate = json.loads(CANDIDATE.read_text())
    receipt = json.loads(PREACCEPTANCE.read_text())
    check("owner-decision-exact", decision.get("source", {}).get("exact_user_decision") == EXACT_USER_DECISION, "owner decision text mismatch")
    check("accepted-candidate-exact", decision.get("acceptance", {}).get("accepted_candidate_sha256") == CANDIDATE_SHA256 and decision.get("subject", {}).get("candidate_sha256") == CANDIDATE_SHA256, "accepted candidate reference mismatch")
    check("preacceptance-pass", receipt.get("result") == "PASS" and receipt.get("candidate_sha256") == CANDIDATE_SHA256, "preacceptance is not exact PASS evidence")
    check("one-attempt-authority", decision.get("authorization", {}).get("attempts") == 1 and decision.get("acceptance", {}).get("execution_status") == "authorized-not-yet-consumed", "one-attempt execution authority missing or already consumed")
    check("candidate-still-self-inert", candidate.get("authority_effect") == "none" and candidate.get("external_effect") == "none", "immutable candidate improperly self-authorizes")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    current = subprocess.run(
        [sys.executable, str(ROOT / "validate-prebuilt-image-deployment-candidate-003.py")],
        cwd=VERTICAL,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    check("fresh-pre-effect-candidate-validation", current.returncode == 0, "fresh pre-effect candidate validation blocked")

    result = "PASS" if not errors else "BLOCK"
    output = {
        "decision_id": decision.get("decision_id"),
        "decision_sha256": sha(DECISION),
        "candidate_sha256": sha(CANDIDATE),
        "preacceptance_sha256": sha(PREACCEPTANCE),
        "checks": checks,
        "result": result,
        "execution_authority": "one-attempt-ready" if not errors else "not_evaluable",
        "authority_effect": "validates-recorded-owner-authorization-only",
        "external_effect": "read-only-network-observation",
        "errors": errors,
    }
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
