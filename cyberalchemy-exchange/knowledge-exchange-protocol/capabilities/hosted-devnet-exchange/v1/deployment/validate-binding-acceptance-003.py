#!/usr/bin/env python3
"""Validate exact VPS deployment-layer binding acceptance 003."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
DECISION = VERTICAL / "decisions/deployment-implementation-binding-acceptance-003.json"
CANDIDATE = ROOT / "implementation-binding-candidate-003.json"
RECORD = ROOT / "implementation-binding-record-003.json"
PREACCEPTANCE = ROOT / "evidence/implementation-binding-preacceptance-003.json"
ARCHIVE = Path("/tmp/ca2-kep-hosted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz")
DECISION_SHA256 = "87146a8a7b26e9912ff9ff6776a883c749296f1fed678d3dd53a4f1b4f924f42"
CANDIDATE_SHA256 = "93d7eb08f5444b85b2cef28e47b95bac76d04a9b167f99c9876348c5c512011d"
RECORD_SHA256 = "f8f0d3465cc76a32827c25c64cc8481071b502ca755537e95edc71010f81c17b"
MATERIAL_SHA256 = "7e0c73b1ddf0b052c3f26a3a005b63ff316969fdb9be9e631e0bb0bbb2a4d21b"
PREACCEPTANCE_SHA256 = "737cfc9b9a4ec38db7aa45de0708193e58536915eaa628cb556a0949a9d1882f"
ARCHIVE_SHA256 = "e1b7365bbca50cba0a4d651721be7cb22ec2ad83eafba4c9c8e481e40a959754"
EXACT_USER_DECISION = "Accept VPS binding candidate 93d7eb08f5444b85b2cef28e47b95bac76d04a9b167f99c9876348c5c512011d"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    for path, expected, label in (
        (DECISION, DECISION_SHA256, "decision"),
        (CANDIDATE, CANDIDATE_SHA256, "candidate"),
        (RECORD, RECORD_SHA256, "binding record"),
        (PREACCEPTANCE, PREACCEPTANCE_SHA256, "preacceptance"),
        (ARCHIVE, ARCHIVE_SHA256, "image archive"),
    ):
        if not path.is_file() or sha(path) != expected:
            errors.append(f"{label} missing or digest drift")

    decision = json.loads(DECISION.read_text())
    candidate = json.loads(CANDIDATE.read_text())
    record = json.loads(RECORD.read_text())
    receipt = json.loads(PREACCEPTANCE.read_text())
    if decision.get("source", {}).get("exact_user_decision") != EXACT_USER_DECISION:
        errors.append("recorded owner decision text drift")
    subject = decision.get("subject", {})
    accepted = decision.get("acceptance", {})
    for value, expected, label in (
        (subject.get("candidate_sha256"), CANDIDATE_SHA256, "decision candidate"),
        (subject.get("binding_record_sha256"), RECORD_SHA256, "decision binding record"),
        (subject.get("deployment_material_sha256"), MATERIAL_SHA256, "decision deployment material"),
        (accepted.get("accepted_candidate_sha256"), CANDIDATE_SHA256, "accepted candidate"),
        (accepted.get("accepted_binding_record_sha256"), RECORD_SHA256, "accepted binding record"),
        (accepted.get("accepted_deployment_material_sha256"), MATERIAL_SHA256, "accepted deployment material"),
    ):
        if value != expected:
            errors.append(f"{label} reference mismatch")
    if accepted.get("lifecycle_status") != "accepted":
        errors.append("VPS binding is not accepted")
    if candidate.get("acceptance_status") != "not-requested":
        errors.append("immutable candidate unexpectedly self-accepts")
    if candidate.get("binding_record", {}).get("sha256") != RECORD_SHA256:
        errors.append("candidate binding-record reference mismatch")
    if record.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("record deployment-material reference mismatch")
    if receipt.get("result") != "PASS" or receipt.get("candidate_sha256") != CANDIDATE_SHA256:
        errors.append("preacceptance is not exact PASS evidence")

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    current = subprocess.run(
        ["python3", str(ROOT / "validate-binding-candidate-003.py")],
        cwd=VERTICAL,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if current.returncode != 0:
        errors.append("fresh candidate validation failed")
    successor = decision.get("successor_authorization", {})
    if successor.get("deployment_conformance_assessment") != "not-authorized-by-this-decision":
        errors.append("decision inflated deployment-conformance authority")
    if successor.get("deployment_or_external_effect") != "not-authorized":
        errors.append("decision inflated deployment authority")
    if decision.get("external_effect") != "none":
        errors.append("decision inflated external-effect claim")

    result = {
        "result": "PASS" if not errors else "BLOCK",
        "decision_id": decision.get("decision_id"),
        "decision_sha256": sha(DECISION),
        "candidate_sha256": sha(CANDIDATE),
        "binding_record_sha256": sha(RECORD),
        "deployment_material_sha256": MATERIAL_SHA256,
        "image_archive_sha256": sha(ARCHIVE) if ARCHIVE.is_file() else None,
        "acceptance_status": "accepted",
        "deployment_conformance": "not_evaluable",
        "vps_execution": "not-authorized",
        "next_route": "CA2-ROUTE-VALIDATE:fresh-post-acceptance-vps-binding-conformance",
        "authority_effect": "acceptance-only",
        "external_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
