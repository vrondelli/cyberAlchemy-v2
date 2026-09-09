#!/usr/bin/env python3
"""Validate exact owner acceptance for corrected continuation 004."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
DECISION = VERTICAL / "decisions/prebuilt-image-deployment-acceptance-004.json"
DECISION_SHA256 = "7b350041467c789b913e74d88f22163dc256381b81707c987691127416ced982"
CANDIDATE = ROOT / "prebuilt-image-deployment-candidate-004.json"
CANDIDATE_SHA256 = "1d00e94ae3fdee86831b9e37c90e98550d7487b9e317ed5c4a19bb3d66330fec"
PREACCEPTANCE = ROOT / "evidence/prebuilt-image-deployment-preacceptance-004.json"
PREACCEPTANCE_SHA256 = "26e29a1bce5a81edd400ca4689f22b4fdf4ec379ade65c58ee1d62fb91efecd7"
EXACT_USER_DECISION = "Accept corrected deployment candidate 1d00e94ae3fdee86831b9e37c90e98550d7487b9e317ed5c4a19bb3d66330fec"


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
    check("one-continuation-authority", decision.get("authorization", {}).get("corrected_continuations") == 1 and decision.get("acceptance", {}).get("execution_status") == "authorized-not-yet-consumed", "one-continuation authority missing or already consumed")
    check("candidate-still-self-inert", candidate.get("authority_effect") == "none" and candidate.get("external_effect") == "none", "immutable candidate improperly self-authorizes")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    current = subprocess.run(
        [sys.executable, str(ROOT / "validate-prebuilt-image-deployment-candidate-004.py")],
        cwd=VERTICAL,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    check("fresh-pre-effect-continuation-validation", current.returncode == 0, "fresh pre-effect continuation validation blocked")

    result = "PASS" if not errors else "BLOCK"
    output = {
        "decision_id": decision.get("decision_id"),
        "decision_sha256": sha(DECISION),
        "candidate_sha256": sha(CANDIDATE),
        "preacceptance_sha256": sha(PREACCEPTANCE),
        "checks": checks,
        "result": result,
        "execution_authority": "one-corrected-continuation-ready" if not errors else "not_evaluable",
        "authority_effect": "validates-recorded-owner-authorization-only",
        "external_effect": "read-only-network-observation",
        "errors": errors,
    }
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
