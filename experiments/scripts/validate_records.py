#!/usr/bin/env python3
"""Validate canonical CyberAlchemy v2 Experiment records."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PACKAGE = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[3]
BASE = "projects/pythonconstraint-whole/experiments/pythonconstraint-whole"
RECORD_PATH = f"{BASE}/experiment.record.json"
CARRIER_PATH = f"{BASE}/experiment.md"
MATERIAL = ("README.md", "EXPERIMENT-DOCUMENT-TYPE.md", "profile.json", "sources.json", "schemas/experiment-record.schema.json", RECORD_PATH, CARRIER_PATH, "ontology/experiment-view.json", "scripts/validate_records.py")


def read_json(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one object")
        return {}
    return value


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    sources = read_json(PACKAGE / "sources.json", errors)
    record = read_json(PACKAGE / RECORD_PATH, errors)
    view = read_json(PACKAGE / "ontology/experiment-view.json", errors)
    schema = read_json(PACKAGE / "schemas/experiment-record.schema.json", errors)
    project = read_json(REPO / "cyberAlchemy-v2/goals/projects/pythonconstraint-whole/project.json", errors)
    goal = read_json(REPO / "cyberAlchemy-v2/goals/projects/pythonconstraint-whole/goals/pythonconstraint-whole.goal.json", errors)
    research = read_json(REPO / "cyberAlchemy-v2/research/projects/pythonconstraint-whole/research/pythonconstraint-admission/research.record.json", errors)

    source_ids: set[str] = set()
    for source in sources.get("sources", []):
        if not isinstance(source, dict) or set(source) != {"id", "path", "sha256", "posture", "owner_route"}:
            errors.append("invalid source record shape")
            continue
        source_ids.add(source["id"])
        path = REPO / source["path"]
        if not path.is_file():
            errors.append(f"missing source: {source['id']}")
        elif sha(path) != source["sha256"]:
            errors.append(f"source digest drift: {source['id']}")

    required = set(schema.get("required", []))
    if set(record) != required:
        errors.append(f"experiment record keys differ from schema: missing={sorted(required-set(record))} extra={sorted(set(record)-required)}")
    if record.get("canonical_kind") != "experiment" or record.get("schema_version") != "cav2-experiment-record/v1":
        errors.append("invalid Experiment kind or schema version")
    for forbidden in {"outcome", "conclusion", "status", "lifecycle_state", "authority_state", "promotion_state"}:
        if forbidden in record:
            errors.append(f"Experiment record must not carry {forbidden}")
    if record.get("authority_effect") != "none":
        errors.append("Experiment authority_effect must be none")
    if record.get("project_ref") != project.get("project_id"):
        errors.append("Experiment project_ref does not resolve")
    if record.get("experiment_id") not in project.get("experiment_refs", []):
        errors.append("Project does not reference the Experiment")
    if goal.get("goal_id") not in record.get("goal_refs", []):
        errors.append("Experiment does not reference the Goal")
    if research.get("research_id") not in record.get("research_refs", []):
        errors.append("Experiment does not reference the Research")
    protocol_source = record.get("protocol_ref", {}).get("source_id")
    if protocol_source not in source_ids:
        errors.append("Experiment protocol_ref uses an unknown source")

    carrier = (PACKAGE / CARRIER_PATH).read_text(encoding="utf-8")
    if "canonical_kind: experiment" not in carrier or f"experiment_id: {record.get('experiment_id')}" not in carrier:
        errors.append("experiment.md carrier does not match the machine record")
    if record.get("question_or_hypothesis", "") not in carrier.replace("\n", " "):
        errors.append("experiment.md question differs from the machine record")
    if not record.get("run_refs") and "None." not in carrier:
        errors.append("empty run_refs must be visible in experiment.md")

    nodes = view.get("nodes", [])
    node_ids = {item.get("id") for item in nodes if isinstance(item, dict)}
    relation_ids: set[str] = set()
    for relation in view.get("relations", []):
        if relation.get("id") in relation_ids:
            errors.append(f"duplicate relation {relation.get('id')}")
        relation_ids.add(relation.get("id"))
        if relation.get("source") not in node_ids or relation.get("target") not in node_ids:
            errors.append(f"unknown ontology endpoint in {relation.get('id')}")
    for required_node in {"CAV2-D62", project.get("project_id"), goal.get("goal_id"), research.get("research_id"), record.get("experiment_id")}:
        if required_node not in node_ids:
            errors.append(f"missing ontology node {required_node}")
    expected_run_state = "none" if not record.get("run_refs") else "present"
    if view.get("run_evidence_state") != expected_run_state:
        errors.append("ontology run_evidence_state disagrees with run_refs")

    digest = hashlib.sha256()
    for relative in sorted(MATERIAL):
        path = PACKAGE / relative
        if not path.is_file():
            errors.append(f"missing material file {relative}")
            continue
        digest.update(relative.encode() + b"\0" + path.read_bytes() + b"\0")
    material_digest = digest.hexdigest()
    receipt = {"schema_version": "cav2-experiment-validation/v1", "validated_at": datetime.now(timezone.utc).isoformat(), "status": "PASS" if not errors else "BLOCK", "material_digest": material_digest, "counts": {"sources": len(source_ids), "records": 1, "nodes": len(node_ids), "relations": len(relation_ids), "run_refs": len(record.get("run_refs", []))}, "authority_effect": "none", "errors": errors}
    receipts = PACKAGE / "receipts"
    receipts.mkdir(exist_ok=True)
    target = receipts / f"validation-{material_digest[:16]}.json"
    if not target.exists():
        target.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
