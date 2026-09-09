#!/usr/bin/env python3
"""Validate the frozen hosted VPS implementation-binding candidate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
CANDIDATE = ROOT / "implementation-binding-candidate-001.json"
RECORD = ROOT / "implementation-binding-record-001.json"

CANDIDATE_SHA256 = "432e8981902220a40a681756c75716eea82bbb0c710e767e8e010783c8a70d83"
RECORD_SHA256 = "c88e33a9107b9b653e6cc02f3fcf9381980b3d55dbc8a8bd268af1c4b20871b4"
MATERIAL_SHA256 = "83557348feca7b7ac51ffa0fe85087b96a5c8501d2d079a398bdb9018fde83db"
PROTOCOL_DECISION_SHA256 = "36c801bcbcaec8bab5eb5482d30f9d6179f4a3dc9d0f9de6465387ac4da66003"
PROTOCOL_EVIDENCE_SHA256 = "fa43d89920b6537b61fb5076beb4540333c33a22c011152fba3ae9f496e78440"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
MISSING_SELECTORS = {
    "kep-hosted-vps-deployment-transition",
    "kep-hosted-vps-deployment-observation",
    "kep-hosted-offhost-backup",
    "kep-hosted-disposable-restore-verification",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def all_strings(value: object) -> set[str]:
    found: set[str] = set()
    if isinstance(value, str):
        found.add(value)
    elif isinstance(value, dict):
        for key, item in value.items():
            found.add(str(key))
            found.update(all_strings(item))
    elif isinstance(value, list):
        for item in value:
            found.update(all_strings(item))
    return found


def main() -> int:
    errors: list[str] = []
    candidate = json.loads(CANDIDATE.read_text())
    record = json.loads(RECORD.read_text())

    if sha(CANDIDATE) != CANDIDATE_SHA256:
        errors.append("candidate digest drift")
    if sha(RECORD) != RECORD_SHA256:
        errors.append("binding-record digest drift")
    if candidate.get("binding_record", {}).get("sha256") != RECORD_SHA256:
        errors.append("candidate binding-record reference mismatch")
    if candidate.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("candidate material reference mismatch")
    if record.get("implementation_material", {}).get("sha256") != MATERIAL_SHA256:
        errors.append("binding-record material reference mismatch")
    if record.get("implementation_material", {}).get("digest_algorithm") != "sha256-listed-path-null-bytes-null/v1":
        errors.append("binding-record digest algorithm mismatch")

    material = hashlib.sha256()
    files = record.get("implementation_material", {}).get("files", [])
    for item in files:
        relative = item["path"]
        path = VERTICAL / relative
        if not path.is_file():
            errors.append(f"missing implementation file: {relative}")
            continue
        value = path.read_bytes()
        if hashlib.sha256(value).hexdigest() != item["sha256"]:
            errors.append(f"implementation file digest drift: {relative}")
        material.update(relative.encode())
        material.update(b"\0")
        material.update(value)
        material.update(b"\0")
    observed_material = material.hexdigest()
    if observed_material != MATERIAL_SHA256:
        errors.append("implementation material digest drift")
    if len(files) != candidate.get("implementation_material", {}).get("file_count"):
        errors.append("implementation file count mismatch")

    for item in record.get("external_build_assets", []):
        path = VERTICAL.parents[5] / item["path"]
        if not path.is_file() or sha(path) != item["sha256"]:
            errors.append(f"external build asset missing or drifted: {item['path']}")

    pattern = (ROOT / record["pattern_source"]["path"]).resolve()
    if not pattern.is_file() or sha(pattern) != record["pattern_source"]["sha256"]:
        errors.append("co-op deployment pattern source missing or drifted")

    predecessor_checks = {
        VERTICAL / "decisions/protocol-implementation-binding-acceptance-001.json": PROTOCOL_DECISION_SHA256,
        VERTICAL / "evidence/protocol-conformance-assessment-001.json": PROTOCOL_EVIDENCE_SHA256,
        VERTICAL / "decisions/system-ontology-admission-001.json": SYSTEM_ADMISSION_SHA256,
    }
    for path, expected in predecessor_checks.items():
        if not path.is_file() or sha(path) != expected:
            errors.append(f"predecessor missing or drifted: {path.relative_to(VERTICAL)}")

    evidence_checks = candidate.get("local_validation_evidence", {})
    for key in ("preflight", "container_smoke"):
        item = evidence_checks.get(key, {})
        path = ROOT / item.get("path", "missing")
        if not path.is_file() or sha(path) != item.get("sha256"):
            errors.append(f"local evidence missing or drifted: {key}")
    preflight = json.loads((ROOT / "evidence/preflight.json").read_text())
    smoke = json.loads((ROOT / "evidence/container-smoke.json").read_text())
    if preflight.get("result") != "pass" or preflight.get("deployment_conformance") != "not_evaluable":
        errors.append("preflight claim posture mismatch")
    if smoke.get("result") != "pass" or smoke.get("external_effects") != "none":
        errors.append("container-smoke claim posture mismatch")

    ontology = json.loads((VERTICAL / "domainspec/generated/system-ontology.json").read_text())
    graph = json.loads((VERTICAL / "domainspec/generated/compiled-graph.json").read_text())
    admitted_strings = all_strings(ontology) | all_strings(graph)
    declared_missing = set(candidate.get("missing_admitted_system_ontology_selectors", []))
    if declared_missing != MISSING_SELECTORS:
        errors.append("missing-selector declaration mismatch")
    unexpectedly_present = sorted(MISSING_SELECTORS & admitted_strings)
    if unexpectedly_present:
        errors.append(f"selectors declared missing are present: {unexpectedly_present}")

    if candidate.get("acceptance_status") != "not_evaluable":
        errors.append("candidate improperly claims acceptance readiness")
    if record.get("deployment_conformance") != "not_evaluable":
        errors.append("binding record improperly claims conformance")
    if candidate.get("authority_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("candidate improperly claims authority or external effect")
    if candidate.get("successor_state", {}).get("vps_execution") != "not-authorized":
        errors.append("candidate does not deny VPS execution authority")

    result = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_sha256": sha(CANDIDATE),
        "binding_record_sha256": sha(RECORD),
        "implementation_material_sha256": observed_material,
        "file_count": len(files),
        "missing_admitted_system_ontology_selectors": sorted(declared_missing),
        "candidate_validation": "PASS" if not errors else "BLOCK",
        "implementation_binding_acceptance": "not_evaluable",
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
