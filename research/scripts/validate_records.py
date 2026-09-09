#!/usr/bin/env python3
"""Validate canonical CyberAlchemy v2 Research records."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PACKAGE = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[3]
BASE = "projects/pythonconstraint-whole/research/pythonconstraint-admission"
RECORD_PATH = f"{BASE}/research.record.json"
CARRIER_PATH = f"{BASE}/research.md"
MATERIAL = ("README.md", "RESEARCH-DOCUMENT-TYPE.md", "profile.json", "sources.json", "schemas/research-record.schema.json", RECORD_PATH, CARRIER_PATH, "ontology/research-view.json", "scripts/validate_records.py")


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
    view = read_json(PACKAGE / "ontology/research-view.json", errors)
    schema = read_json(PACKAGE / "schemas/research-record.schema.json", errors)
    project = read_json(REPO / "cyberAlchemy-v2/goals/projects/pythonconstraint-whole/project.json", errors)
    goal = read_json(REPO / "cyberAlchemy-v2/goals/projects/pythonconstraint-whole/goals/pythonconstraint-whole.goal.json", errors)

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
        errors.append(f"research record keys differ from schema: missing={sorted(required-set(record))} extra={sorted(set(record)-required)}")
    if record.get("canonical_kind") != "research" or record.get("schema_version") != "cav2-research-record/v1":
        errors.append("invalid Research kind or schema version")
    for forbidden in {"outcome", "status", "lifecycle_state", "authority_state", "promotion_state"}:
        if forbidden in record:
            errors.append(f"Research record must not carry {forbidden}")
    if record.get("authority_effect") != "none":
        errors.append("Research authority_effect must be none")
    if record.get("project_ref") != project.get("project_id"):
        errors.append("Research project_ref does not resolve")
    if record.get("research_id") not in project.get("research_refs", []):
        errors.append("Project does not reference the Research")
    if goal.get("goal_id") not in record.get("goal_refs", []):
        errors.append("Research does not reference the Goal")
    for source in record.get("sources", []):
        if source.get("source_id") not in source_ids:
            errors.append(f"Research uses unknown source {source.get('source_id')}")

    carrier = (PACKAGE / CARRIER_PATH).read_text(encoding="utf-8")
    if "canonical_kind: research" not in carrier or f"research_id: {record.get('research_id')}" not in carrier:
        errors.append("research.md carrier does not match the machine record")
    if record.get("question", "") not in carrier.replace("\n", " "):
        errors.append("research.md question differs from the machine record")

    nodes = view.get("nodes", [])
    node_ids = {item.get("id") for item in nodes if isinstance(item, dict)}
    relation_ids: set[str] = set()
    for relation in view.get("relations", []):
        if relation.get("id") in relation_ids:
            errors.append(f"duplicate relation {relation.get('id')}")
        relation_ids.add(relation.get("id"))
        if relation.get("source") not in node_ids or relation.get("target") not in node_ids:
            errors.append(f"unknown ontology endpoint in {relation.get('id')}")
    for required_node in {"CAV2-D61", project.get("project_id"), goal.get("goal_id"), record.get("research_id")}:
        if required_node not in node_ids:
            errors.append(f"missing ontology node {required_node}")

    digest = hashlib.sha256()
    for relative in sorted(MATERIAL):
        path = PACKAGE / relative
        if not path.is_file():
            errors.append(f"missing material file {relative}")
            continue
        digest.update(relative.encode() + b"\0" + path.read_bytes() + b"\0")
    material_digest = digest.hexdigest()
    receipt = {"schema_version": "cav2-research-validation/v1", "validated_at": datetime.now(timezone.utc).isoformat(), "status": "PASS" if not errors else "BLOCK", "material_digest": material_digest, "counts": {"sources": len(source_ids), "records": 1, "nodes": len(node_ids), "relations": len(relation_ids)}, "authority_effect": "none", "errors": errors}
    receipts = PACKAGE / "receipts"
    receipts.mkdir(exist_ok=True)
    target = receipts / f"validation-{material_digest[:16]}.json"
    if not target.exists():
        target.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
