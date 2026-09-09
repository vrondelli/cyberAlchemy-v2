#!/usr/bin/env python3
"""Validate the immutable hosted VPS implementation-binding candidate 002."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
CANDIDATE = ROOT / "implementation-binding-candidate-002.json"
RECORD = ROOT / "implementation-binding-record-002.json"
MANIFEST_RECORD = ROOT / "implementation-binding-record-001.json"

CANDIDATE_SHA256 = "d087d4891e6c502825c7c7eeb9f68d14291fc6d1161da423bb55a0124dad82ec"
RECORD_SHA256 = "2bd53a63348dd7475768042b1fcb8a7749580fde282d71d660eb299bbe859249"
MANIFEST_RECORD_SHA256 = "c88e33a9107b9b653e6cc02f3fcf9381980b3d55dbc8a8bd268af1c4b20871b4"
MATERIAL_SHA256 = "83557348feca7b7ac51ffa0fe85087b96a5c8501d2d079a398bdb9018fde83db"
SYSTEM_DECISION_SHA256 = "ba4a83700868f9798eb58dc3dd09a2e2079fb1811c24cf90a762eb20a1408dd3"
SYSTEM_CANDIDATE_SHA256 = "72c4222cac96cb5a691d88e8e3ba63fe5a8e2884e3dd8b3cacd10429b24bc00c"
SYSTEM_SET_DIGEST = "97f9559f6133def75ffacd91fcd92ba272f3d546cc6880149f175a76923bd9c3"
PROTOCOL_DECISION_SHA256 = "36c801bcbcaec8bab5eb5482d30f9d6179f4a3dc9d0f9de6465387ac4da66003"
PROTOCOL_EVIDENCE_SHA256 = "fa43d89920b6537b61fb5076beb4540333c33a22c011152fba3ae9f496e78440"
SELECTORS = {
    "kep-hosted-vps-deployment-transition",
    "kep-hosted-vps-deployment-observation",
    "kep-hosted-offhost-backup",
    "kep-hosted-disposable-restore-verification",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def strings(value: object) -> set[str]:
    found: set[str] = set()
    if isinstance(value, str):
        found.add(value)
    elif isinstance(value, dict):
        for key, item in value.items():
            found.add(str(key))
            found.update(strings(item))
    elif isinstance(value, list):
        for item in value:
            found.update(strings(item))
    return found


def main() -> int:
    errors: list[str] = []
    candidate = json.loads(CANDIDATE.read_text())
    record = json.loads(RECORD.read_text())
    manifest_record = json.loads(MANIFEST_RECORD.read_text())

    for path, expected, label in (
        (CANDIDATE, CANDIDATE_SHA256, "candidate"),
        (RECORD, RECORD_SHA256, "binding record"),
        (MANIFEST_RECORD, MANIFEST_RECORD_SHA256, "historical material manifest"),
    ):
        if sha(path) != expected:
            errors.append(f"{label} digest drift")

    if candidate.get("binding_record", {}).get("sha256") != RECORD_SHA256:
        errors.append("candidate binding-record reference mismatch")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate material reference mismatch")
    material_record = record.get("implementation_material", {})
    if material_record.get("sha256") != MATERIAL_SHA256:
        errors.append("binding-record material reference mismatch")
    if material_record.get("manifest_source", {}).get("sha256") != MANIFEST_RECORD_SHA256:
        errors.append("material manifest source mismatch")

    material = hashlib.sha256()
    files = manifest_record.get("implementation_material", {}).get("files", [])
    for item in files:
        relative = item["path"]
        path = VERTICAL / relative
        if not path.is_file():
            errors.append(f"missing implementation file: {relative}")
            continue
        content = path.read_bytes()
        if hashlib.sha256(content).hexdigest() != item["sha256"]:
            errors.append(f"implementation file digest drift: {relative}")
        material.update(relative.encode())
        material.update(b"\0")
        material.update(content)
        material.update(b"\0")
    observed_material = material.hexdigest()
    if observed_material != MATERIAL_SHA256:
        errors.append("implementation material digest drift")
    if len(files) != 24 or material_record.get("file_count") != 24:
        errors.append("implementation file count mismatch")

    for item in manifest_record.get("external_build_assets", []):
        path = VERTICAL.parents[5] / item["path"]
        if not path.is_file() or sha(path) != item["sha256"]:
            errors.append(f"external build asset missing or drifted: {item['path']}")

    predecessor_checks = {
        VERTICAL / "decisions/deployment-system-ontology-admission-002.json": SYSTEM_DECISION_SHA256,
        VERTICAL / "decisions/protocol-implementation-binding-acceptance-001.json": PROTOCOL_DECISION_SHA256,
        VERTICAL / "evidence/protocol-conformance-assessment-001.json": PROTOCOL_EVIDENCE_SHA256,
    }
    for path, expected in predecessor_checks.items():
        if not path.is_file() or sha(path) != expected:
            errors.append(f"predecessor missing or drifted: {path.relative_to(VERTICAL)}")

    system_candidate = VERTICAL / "domainspec/extensions/hosted-vps-deployment-v1/system-ontology-candidate-002.json"
    if not system_candidate.is_file() or sha(system_candidate) != SYSTEM_CANDIDATE_SHA256:
        errors.append("system ontology candidate missing or drifted")
    else:
        envelope = json.loads(system_candidate.read_text())
        if envelope.get("candidate_set_digest") != SYSTEM_SET_DIGEST:
            errors.append("system ontology candidate-set digest mismatch")

    generated = VERTICAL / "domainspec/extensions/hosted-vps-deployment-v1/generated"
    ontology_strings: set[str] = set()
    for name in ("compiled-graph.json", "system-ontology.json", "bridge.json"):
        path = generated / name
        if not path.is_file():
            errors.append(f"missing generated ontology artifact: {name}")
        else:
            ontology_strings.update(strings(json.loads(path.read_text())))
    absent = sorted(SELECTORS - ontology_strings)
    if absent:
        errors.append(f"admitted selectors absent from generated ontology: {absent}")

    declared = set(candidate.get("admitted_system_ontology_predecessor", {}).get("selectors", []))
    if declared != SELECTORS:
        errors.append("candidate selector declaration mismatch")
    if candidate.get("admitted_system_ontology_predecessor", {}).get("decision_sha256") != SYSTEM_DECISION_SHA256:
        errors.append("candidate system admission reference mismatch")

    for key in ("preflight", "container_smoke"):
        item = candidate.get("local_validation_evidence", {}).get(key, {})
        path = ROOT / item.get("path", "missing")
        if not path.is_file() or sha(path) != item.get("sha256"):
            errors.append(f"local evidence missing or drifted: {key}")

    if candidate.get("acceptance_status") != "not-requested":
        errors.append("candidate improperly claims acceptance")
    if record.get("acceptance_status") != "not-requested":
        errors.append("binding record improperly claims acceptance")
    if candidate.get("successor_state", {}).get("vps_execution") != "not-authorized":
        errors.append("candidate does not deny VPS execution authority")
    if candidate.get("authority_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("candidate improperly claims authority or external effect")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "binding_record_sha256": sha(RECORD),
        "implementation_material_sha256": observed_material,
        "file_count": len(files),
        "admitted_system_ontology_decision_sha256": SYSTEM_DECISION_SHA256,
        "admitted_selectors": sorted(declared),
        "candidate_validation": "PASS" if not errors else "BLOCK",
        "implementation_binding_acceptance": "awaiting-exact-owner-decision" if not errors else "not_evaluable",
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
