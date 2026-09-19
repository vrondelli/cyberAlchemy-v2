#!/usr/bin/env python3
"""Fail-closed validation for the ORODI operator-interface successor candidate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[4]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    definitions = load(ROOT / "definitions/ORODI-OPERATOR-INTERFACE-DEFINITIONS.v1-candidate.json")
    projection = load(ROOT / "product-capability-projection.json")
    business = load(ROOT / "business-ontology.json")
    project = load(ROOT / "domainspec/project.json")
    graph = load(ROOT / "domainspec/generated/graph.json")
    system = load(ROOT / "domainspec/generated/system-ontology.json")
    receipt = load(ROOT / "domainspec/generated/system-ontology-receipt.json")

    for record in (definitions, projection, business, system, receipt):
        if record.get("status", "candidate") != "candidate": errors.append("successor record is not candidate")
        if record.get("authority_effect") != "none": errors.append("successor record grants authority")

    predecessor = definitions["predecessor_language"]
    predecessor_path = REPO / predecessor["ref"]
    if not predecessor_path.is_file() or digest(predecessor_path) != predecessor["digest"]:
        errors.append("admitted language predecessor drift")
    immutable = projection["immutable_registry"]
    immutable_path = REPO / immutable["ref"]
    if not immutable_path.is_file() or digest(immutable_path) != immutable["digest"]:
        errors.append("immutable Product Capability registry drift")

    immutable_records = {r["capability_id"]: r["record_digest"] for r in load(immutable_path)["records"]}
    expected_capabilities = {
        "CA2-CAP-ORODI-EVALUATE-CANARY",
        "CA2-CAP-ORODI-VERIFY-ROLLBACK",
        "CA2-CAP-ORODI-MATERIALIZE-RUN-READY-LAB",
        "CA2-CAP-ORODI-COMMISSION-LOCAL-LAB",
    }
    projected = {r["capability_id"] for r in projection["projections"]}
    if projected != expected_capabilities: errors.append("Product Capability projection set mismatch")
    for record in projection["projections"]:
        if immutable_records.get(record["capability_id"]) != record["record_digest"]:
            errors.append(f"immutable Product Capability digest mismatch: {record['capability_id']}")

    concepts = {c["concept_id"] for c in business["concepts"]}
    required_alert_concepts = {
        "orodi.interface.alert-rule",
        "orodi.interface.alert-evaluation",
        "orodi.interface.alert-instance",
        "orodi.interface.alert-state",
        "orodi.interface.alert-evidence",
        "orodi.interface.notification-delivery",
        "orodi.interface.alert-non-actuation",
        "orodi.interface.notification-separation",
    }
    if not required_alert_concepts.issubset(concepts): errors.append("required alert ontology concept missing")
    for relation in business["relations"]:
        if relation["from"] not in concepts or relation["to"] not in concepts:
            errors.append("business ontology relation endpoint missing")
    if business["admission_state"] != "not-granted": errors.append("candidate business ontology claims admission")

    graph_nodes = {node["node_id"]: node for node in graph["nodes"]}
    required_rules = {
        "orodi-operator-interface.ObserverCannotActuate",
        "orodi-operator-interface.TelemetryMustConserve",
        "orodi-operator-interface.SensitiveFieldsMustBeExcluded",
        "orodi-operator-interface.LabelsMustRemainBounded",
        "orodi-operator-interface.VisualStateCannotPromote",
        "orodi-operator-interface.AlertEvaluationCannotActuate",
        "orodi-operator-interface.NotificationDeliveryRequiresAuthority",
    }
    if not required_rules.issubset(graph_nodes): errors.append("required DomainSpec rule missing")
    if any(graph_nodes[node_id]["kind"] != "Rule" for node_id in required_rules if node_id in graph_nodes):
        errors.append("required DomainSpec rule has wrong kind")
    if graph["project_id"] != project["project_id"]: errors.append("compiled graph project mismatch")
    graph_path = ROOT / "domainspec/generated/graph.json"
    system_path = ROOT / "domainspec/generated/system-ontology.json"
    if system["source_graph_digest"] != digest(graph_path): errors.append("system ontology graph digest mismatch")
    if system["nodes"] != graph["nodes"] or system["edges"] != graph["edges"]:
        errors.append("system ontology is not exact graph projection")
    if receipt["system_ontology_digest"] != digest(system_path): errors.append("system ontology receipt mismatch")
    if not receipt["equal_graph_bytes"] or not receipt["equal_system_ontology_bytes"]:
        errors.append("two-run determinism missing")
    if receipt["profile_release_admission"] != "not-granted": errors.append("development profile claims release admission")

    if errors:
        for error in sorted(set(errors)): print(f"ERROR={error}")
        return 1
    print("ORODI_OPERATOR_INTERFACE_DEFINITIONS=pass")
    print("PRODUCT_CAPABILITY_PROJECTION=4/4 immutable")
    print("ALERT_SEMANTICS=local-evaluation notification-delivery-disabled")
    print(f"BUSINESS_ONTOLOGY_CONCEPTS={len(concepts)}")
    print(f"DOMAINSPEC_NODES={len(graph['nodes'])} EDGES={len(graph['edges'])}")
    print("SYSTEM_ONTOLOGY_PROJECTION=deterministic")
    print("ADMISSION_STATE=not-granted")
    print("AUTHORITY_EFFECT=none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
