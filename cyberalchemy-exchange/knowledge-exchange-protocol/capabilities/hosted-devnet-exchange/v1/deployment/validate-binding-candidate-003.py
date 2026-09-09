#!/usr/bin/env python3
"""Validate immutable hosted VPS deployment-layer binding candidate 003."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
CANDIDATE = ROOT / "implementation-binding-candidate-003.json"
RECORD = ROOT / "implementation-binding-record-003.json"
CANDIDATE_SHA256 = "93d7eb08f5444b85b2cef28e47b95bac76d04a9b167f99c9876348c5c512011d"
RECORD_SHA256 = "f8f0d3465cc76a32827c25c64cc8481071b502ca755537e95edc71010f81c17b"
MATERIAL_SHA256 = "7e0c73b1ddf0b052c3f26a3a005b63ff316969fdb9be9e631e0bb0bbb2a4d21b"
SYSTEM_DECISION_SHA256 = "ba4a83700868f9798eb58dc3dd09a2e2079fb1811c24cf90a762eb20a1408dd3"
APPLICATION_ACCEPTANCE_SHA256 = "15b7856fce63707c3579cf66b9ad053e269f1cec897f0bb4315971dda6f0c873"
APPLICATION_CONFORMANCE_SHA256 = "619a1c3a17a12dd92f5ad3aa3c86e189bacdddbfec266ba519e3b08fb488f67c"
PREFLIGHT_SHA256 = "809ff71fee3841d3e7c5d1ce7961361251b276a48e3d33aa4b2aa83318c01d43"
SMOKE_SHA256 = "2bea73c922864b4e0fc433f007acf036cd62fb76eb7587fc5749e9fc2455359e"
ARCHIVE = Path("/tmp/ca2-kep-hosted-36d3ececb415a0f8d8a00cecb69918e097ae7e43065ffd150fa78f1ac01f1543.tar.gz")
ARCHIVE_SHA256 = "e1b7365bbca50cba0a4d651721be7cb22ec2ad83eafba4c9c8e481e40a959754"
SELECTORS = {
    "kep-hosted-vps-deployment-transition",
    "kep-hosted-vps-deployment-observation",
    "kep-hosted-offhost-backup",
    "kep-hosted-disposable-restore-verification",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    candidate = json.loads(CANDIDATE.read_text())
    record = json.loads(RECORD.read_text())

    for path, expected, label in (
        (CANDIDATE, CANDIDATE_SHA256, "candidate"),
        (RECORD, RECORD_SHA256, "binding record"),
        (VERTICAL / "decisions/deployment-system-ontology-admission-002.json", SYSTEM_DECISION_SHA256, "deployment system admission"),
        (VERTICAL / "decisions/implementation-binding-acceptance-002.json", APPLICATION_ACCEPTANCE_SHA256, "application acceptance"),
        (VERTICAL / "evidence/conformance-assessment-003.json", APPLICATION_CONFORMANCE_SHA256, "application conformance"),
        (ROOT / "evidence/preflight.json", PREFLIGHT_SHA256, "deployment preflight"),
        (ROOT / "evidence/container-smoke-003.json", SMOKE_SHA256, "container smoke"),
        (ARCHIVE, ARCHIVE_SHA256, "image archive"),
    ):
        if not path.is_file() or sha(path) != expected:
            errors.append(f"{label} missing or digest drift")

    material = hashlib.sha256()
    files = record.get("implementation_material", {}).get("files", [])
    for item in files:
        relative = item.get("path")
        path = VERTICAL / str(relative)
        if not path.is_file():
            errors.append(f"missing deployment material: {relative}")
            continue
        content = path.read_bytes()
        if hashlib.sha256(content).hexdigest() != item.get("sha256"):
            errors.append(f"deployment material digest drift: {relative}")
        material.update(str(relative).encode())
        material.update(b"\0")
        material.update(content)
        material.update(b"\0")
    observed_material = material.hexdigest()
    if len(files) != 10:
        errors.append("deployment material file count mismatch")
    if observed_material != MATERIAL_SHA256:
        errors.append("deployment material aggregate digest drift")
    if record.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("binding-record material reference mismatch")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate material reference mismatch")
    if candidate.get("binding_record", {}).get("sha256") != RECORD_SHA256:
        errors.append("candidate binding-record reference mismatch")

    declared = set(record.get("selected_ontology_dependencies", {}).get("selectors", []))
    if declared != SELECTORS:
        errors.append("selected deployment selector set mismatch")
    bindings = record.get("selector_bindings", {})
    bound_paths = {item.get("path") for item in files}
    for selector in SELECTORS:
        paths = bindings.get(selector, [])
        if not paths or not set(paths) <= bound_paths:
            errors.append(f"selector has empty or unbound deployment paths: {selector}")

    preflight = json.loads((ROOT / "evidence/preflight.json").read_text())
    smoke = json.loads((ROOT / "evidence/container-smoke-003.json").read_text())
    if preflight.get("result") != "pass" or preflight.get("remote_effects") != "none":
        errors.append("preflight posture is not local PASS")
    if smoke.get("result") != "pass" or smoke.get("external_effects") != "none":
        errors.append("container smoke posture is not local PASS")
    if smoke.get("image", {}).get("archive_sha256") != ARCHIVE_SHA256:
        errors.append("smoke archive identity mismatch")

    if candidate.get("acceptance_status") != "not-requested":
        errors.append("candidate improperly claims acceptance")
    if candidate.get("successor_authorization") != "none":
        errors.append("candidate improperly grants successor authority")
    if candidate.get("authority_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("candidate improperly claims authority or external effect")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "binding_record_sha256": sha(RECORD),
        "deployment_material_sha256": observed_material,
        "file_count": len(files),
        "image_archive_sha256": sha(ARCHIVE) if ARCHIVE.is_file() else None,
        "admitted_selectors": sorted(declared),
        "candidate_validation": "PASS" if not errors else "BLOCK",
        "deployment_binding_acceptance": "awaiting-exact-owner-decision" if not errors else "not_evaluable",
        "deployment_conformance": "not_evaluable",
        "vps_execution": "not-authorized",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
