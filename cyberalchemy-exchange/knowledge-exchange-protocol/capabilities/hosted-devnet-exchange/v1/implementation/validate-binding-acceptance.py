#!/usr/bin/env python3
"""Validate the exact hosted implementation-binding acceptance decision."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
DECISION_SHA256 = "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748"
CANDIDATE_SHA256 = "25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925"
BINDING_SHA256 = "50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92"
MATERIAL_SHA256 = "e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f"
PREACCEPTANCE_SHA256 = "97fe92202ef0b3f89bb3061d8377254f7a6a776ace6baa86909b61d2cd8790e4"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
EXACT_USER_DECISION = """Accept hosted implementation binding candidate
CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-001 with binding-record digest
50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92,
implementation-material digest
e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f,
and candidate-record digest
25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925."""


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one object")
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate() -> list[str]:
    errors: list[str] = []
    decision_path = VERTICAL / "decisions/implementation-binding-acceptance-001.json"
    candidate_path = ROOT / "implementation-binding-candidate.json"
    binding_path = ROOT / "implementation-binding.json"
    receipt_path = ROOT / "evidence/implementation-binding-preacceptance-001.json"
    system_admission_path = VERTICAL / "decisions/system-ontology-admission-001.json"
    decision = load(decision_path)
    candidate = load(candidate_path)
    binding = load(binding_path)
    receipt = load(receipt_path)
    system_admission = load(system_admission_path)

    expected_hashes = {
        decision_path: DECISION_SHA256,
        candidate_path: CANDIDATE_SHA256,
        binding_path: BINDING_SHA256,
        receipt_path: PREACCEPTANCE_SHA256,
        system_admission_path: SYSTEM_ADMISSION_SHA256,
    }
    for path, expected in expected_hashes.items():
        if sha(path) != expected:
            errors.append(f"digest drift: {path.name}")

    if decision.get("source", {}).get("exact_user_decision") != EXACT_USER_DECISION:
        errors.append("recorded owner decision text drift")
    subject = decision.get("subject", {})
    if subject.get("candidate_sha256") != CANDIDATE_SHA256:
        errors.append("decision candidate digest drift")
    if subject.get("binding_record_sha256") != BINDING_SHA256:
        errors.append("decision binding-record digest drift")
    if subject.get("implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("decision implementation-material digest drift")
    accepted = decision.get("acceptance", {})
    if accepted.get("lifecycle_status") != "accepted":
        errors.append("implementation binding decision is not accepted")
    if accepted.get("accepted_candidate_sha256") != CANDIDATE_SHA256:
        errors.append("accepted candidate digest drift")
    if accepted.get("accepted_binding_record_sha256") != BINDING_SHA256:
        errors.append("accepted binding-record digest drift")
    if accepted.get("accepted_implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("accepted implementation-material digest drift")

    if candidate.get("acceptance_status") != "not-requested":
        errors.append("immutable candidate unexpectedly self-accepts")
    if candidate.get("binding_record", {}).get("sha256") != BINDING_SHA256:
        errors.append("candidate binding-record digest drift")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate material digest drift")
    if binding.get("implementation_material_sha256") != MATERIAL_SHA256:
        errors.append("binding material identity drift")
    if receipt.get("result") != "PASS" or receipt.get("candidate_sha256") != CANDIDATE_SHA256:
        errors.append("preacceptance evidence is not exact PASS evidence")
    if system_admission.get("admission", {}).get("lifecycle_status") != "admitted":
        errors.append("system ontology predecessor is not admitted")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    for script in ("author_binding.py", "validate-binding-candidate.py"):
        args = ["python3", str(ROOT / script)]
        if script == "author_binding.py":
            args.append("--check")
        check = subprocess.run(args, cwd=ROOT, env=env, capture_output=True, text=True, check=False)
        if check.returncode != 0:
            errors.append(f"fresh check failed: {script}")

    if decision.get("successor_authorization", {}).get("implementation_conformance_assessment") != "not-authorized-by-this-decision":
        errors.append("decision inflated conformance authority")
    if decision.get("external_effect") != "none":
        errors.append("decision inflated external-effect authority")
    return errors


if __name__ == "__main__":
    failures = validate()
    result = {
        "result": "PASS" if not failures else "BLOCK",
        "decision_id": "CA2-DECISION-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-ACCEPTANCE-001",
        "decision_sha256": DECISION_SHA256,
        "candidate_sha256": CANDIDATE_SHA256,
        "binding_record_sha256": BINDING_SHA256,
        "implementation_material_sha256": MATERIAL_SHA256,
        "acceptance_status": "accepted",
        "implementation_conformance": "not_evaluable",
        "next_route": "CA2-ROUTE-VALIDATE:fresh-post-acceptance-hosted-conformance",
        "authority_effect": "acceptance-only",
        "external_effect": "none",
        "errors": failures,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if failures else 0)
