#!/usr/bin/env python3
"""Deterministic, check-only validator for the Essays agent-runtime business ontology."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent
REPO = PACKAGE.parents[4]
CAPABILITY = PACKAGE.parents[1] / "essays-agent-runtime.product-capability.json"

checks: list[dict[str, str]] = []


def add(check_id: str, outcome: str, detail: str) -> None:
    checks.append({"check_id": check_id, "outcome": outcome, "detail": detail})


def read_json(relative: str):
    return json.loads((PACKAGE / relative).read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unique(values: list[str]) -> bool:
    return len(values) == len(set(values))


def authority_none(value) -> bool:
    if isinstance(value, dict):
        return all((key != "authority_effect" or item == "none") and authority_none(item) for key, item in value.items())
    if isinstance(value, list):
        return all(authority_none(item) for item in value)
    return True


profile = read_json("PROFILE.json")
sources = read_json("SOURCES.json")
nodes = read_json("NODES.json")
relations = read_json("RELATIONS.json")
views = read_json("VIEWS.json")
bindings = read_json("SCHEMA-BINDINGS.json")
selection = read_json("TYPE-SELECTION.json")
decision = read_json("MATERIALIZATION-DECISION.json")
capability = json.loads(CAPABILITY.read_text(encoding="utf-8"))
residue = [json.loads(line) for line in (PACKAGE / "RESIDUE.jsonl").read_text(encoding="utf-8").splitlines() if line]

core = set(profile["inventory_contract"]["core_files"])
actual = {
    str(path.relative_to(PACKAGE))
    for path in PACKAGE.rglob("*")
    if path.is_file() and "receipts" not in path.relative_to(PACKAGE).parts and "__pycache__" not in path.relative_to(PACKAGE).parts
}
add("closed-package-inventory", "PASS" if core == actual else "BLOCK", f"{len(actual)} material files")

identity_ok = (
    profile.get("ontology_id") == "cav2.essays.agent-runtime.business-domain.v1"
    and profile.get("ontology_type") == "business-domain"
    and profile.get("branch") == "business"
    and profile.get("root_node_id") == "B-ESSAYS-AGENT-RUNTIME-CAPABILITY"
    and profile.get("capability_ref") == "CA2-CAP-ESSAYS-AGENT-RUNTIME"
    and profile.get("visibility") == "private"
)
add("profile-identity", "PASS" if identity_ok else "BLOCK", "stable private business-domain identity")
add("type-selection", "PASS" if selection.get("selected_type") == "business-domain" and selection.get("branch") == "business" else "BLOCK", "business-domain selected before mapping")
add("materialization", "PASS" if decision.get("classification") == "package-required" and decision.get("package_root") == "cyberAlchemy-v2/essays/capabilities/agent-runtime/ontology" else "BLOCK", "durable package boundary")

source_ids = [row["source_id"] for row in sources["sources"]]
source_ok = unique(source_ids)
for row in sources["sources"]:
    path = (REPO / row["path"]).resolve()
    source_ok = source_ok and path.is_file() and REPO in path.parents
    if path.is_file():
        source_ok = source_ok and sha256(path) == row["sha256"] and path.stat().st_size == row["size_bytes"]
        text = path.read_text(encoding="utf-8")
        source_ok = source_ok and all(selector in text for selector in row["selectors"])
add("source-currency-and-selectors", "PASS" if source_ok else "BLOCK", f"{len(source_ids)} exact sources")

capability_required = {
    "schema_ref", "schema_version", "capability_id", "definition_ref", "product_ref", "business_ontology_ref",
    "outcome", "outcome_refs", "scope", "exclusions", "participant_refs", "consumer_refs", "input_contract_refs",
    "output_contract_refs", "context_policy_refs", "owner_routes", "lifecycle_posture", "realization_binding_refs",
    "obligation_registry_ref", "evidence_refs", "revision_history", "challenge_route", "authority_effect", "claim_limit"
}
capability_shape = (
    set(capability) == capability_required
    and capability.get("capability_id") == "CA2-CAP-ESSAYS-AGENT-RUNTIME"
    and capability.get("definition_ref") == "CAV2-D67"
    and capability.get("business_ontology_ref") == profile.get("root_node_id")
    and capability.get("authority_effect") == "none"
    and len(capability.get("owner_routes", [])) == 5
)
add("product-capability-shape", "PASS" if capability_shape else "BLOCK", "CAV2-D67 candidate shape and ontology root binding")

node_ids = [node["id"] for node in nodes["nodes"]]
node_ok = (
    len(node_ids) == 17
    and unique(node_ids)
    and profile["root_node_id"] in node_ids
    and all(
        node.get("branch") == "business"
        and node.get("role") in profile["allowed_node_roles"]
        and node.get("status") == "candidate"
        and node.get("authority_effect") == "none"
        and node.get("forbidden_collapse")
        and all(ref["source_id"] in source_ids for ref in node.get("source_refs", []))
        for node in nodes["nodes"]
    )
)
add("business-node-closure", "PASS" if node_ok else "BLOCK", f"{len(node_ids)} business nodes")

relation_ids = [relation["id"] for relation in relations["relations"]]
relation_ok = (
    len(relation_ids) == 16
    and unique(relation_ids)
    and all(
        relation.get("branch") == "business"
        and relation.get("type") in profile["allowed_relation_types"]
        and relation.get("source") in node_ids
        and relation.get("target") in node_ids
        and relation.get("source") != relation.get("target")
        and relation.get("authority_effect") == "none"
        and all(ref["source_id"] in source_ids for ref in relation.get("source_refs", []))
        for relation in relations["relations"]
    )
)
add("business-relation-closure", "PASS" if relation_ok else "BLOCK", f"{len(relation_ids)} typed relations")

view = views.get("views", [None])[0] if len(views.get("views", [])) == 1 else None
view_ok = bool(view) and set(view.get("node_ids", [])) == set(node_ids) and set(view.get("relation_ids", [])) == set(relation_ids)
add("business-view-total-coverage", "PASS" if view_ok else "BLOCK", "one view covers every owned node and relation")

residue_ok = unique([row["residue_id"] for row in residue]) and all(
    set(row["subject_refs"]) <= set(node_ids)
    and set(row["source_refs"]) <= set(source_ids)
    and row.get("authority_effect") == "none"
    for row in residue
)
add("residue-reference-closure", "PASS" if residue_ok else "BLOCK", f"{len(residue)} explicit gaps")

schema = read_json("schemas/business-ontology.schema.json")
schema_ok = schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema" and set(schema.get("$defs", {})) >= {"profile", "sources", "nodes", "relations", "views", "residue"} and bindings.get("owned_schema") == "schemas/business-ontology.schema.json"
add("owned-schema-bindings", "PASS" if schema_ok else "BLOCK", "owned schema and record bindings")

all_records = [profile, sources, nodes, relations, views, bindings, selection, decision, residue, capability]
add("authority-effect-none", "PASS" if all(authority_none(record) for record in all_records) else "BLOCK", "all records preserve no-authority posture")

unresolved_refs = (
    capability["input_contract_refs"]
    + capability["output_contract_refs"]
    + capability["context_policy_refs"]
    + capability["realization_binding_refs"]
    + [capability["obligation_registry_ref"]]
)
dependent_source_ids = {
    "SRC-ESSAYS-AGENT-RUNTIME-INPUT-CONTRACT",
    "SRC-ESSAYS-WORKSPACE-SNAPSHOT-CONTRACT",
    "SRC-ESSAYS-AGENT-PROPOSAL-CONTRACT",
    "SRC-ESSAYS-BROWSER-EVIDENCE-CONTRACT",
    "SRC-ESSAYS-COMMAND-RECEIPT-CONTRACT",
    "SRC-ESSAYS-AGENT-RUNTIME-CONTEXT-POLICY",
    "SRC-ESSAYS-AGENT-RUNTIME-OBLIGATIONS",
    "SRC-ESSAYS-AGENT-RUNTIME-REALIZATION-PRECONDITIONS",
    "SRC-ESSAYS-AGENT-RUNTIME-RECORDS-DECISION",
}
record_decision = json.loads((REPO / "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-capability-records/selection.json").read_text(encoding="utf-8"))
dependent_ok = (
    len(unresolved_refs) == 8
    and dependent_source_ids <= set(source_ids)
    and set(record_decision["subject"]["record_ids"]) == set(unresolved_refs)
    and record_decision["subject"]["material_digest"] == "65c57262318437ac8e22be79a44f4675c65f7e3aa81227bb43d7defe2d5028e5"
)
add("capability-dependent-records", "PASS" if dependent_ok else "BLOCK", f"{len(unresolved_refs)} named records close against the adopted exact bundle")
add("approval-timing", "PASS" if "SRC-ESSAYS-APPROVAL-TIMING-DECISION" in source_ids else "BLOCK", "owner approval is deferred to the exact pre-merge candidate")
add("d65-successors", "FLAG", "system ontology, DomainSpec source, compiled graph, implementation binding, and conformance evidence do not exist")

blocked = sum(check["outcome"] == "BLOCK" for check in checks)
flagged = sum(check["outcome"] == "FLAG" for check in checks)
overall = "BLOCK" if blocked else "FLAG" if flagged else "PASS"
material = hashlib.sha256()
for relative in sorted(core):
    material.update(relative.encode("utf-8"))
    material.update(b"\0")
    material.update((PACKAGE / relative).read_bytes())
    material.update(b"\0")

output = {
    "schema_version": "cav2.essays.agent-runtime.business-ontology.validation/v1",
    "ontology_id": profile.get("ontology_id"),
    "overall": overall,
    "material_digest": material.hexdigest(),
    "summary": {
        "checks": len(checks),
        "passed": sum(check["outcome"] == "PASS" for check in checks),
        "flagged": flagged,
        "blocked": blocked,
        "sources": len(source_ids),
        "nodes": len(node_ids),
        "relations": len(relation_ids),
        "views": len(views.get("views", [])),
        "residue_entries": len(residue)
    },
    "checks": checks,
    "claim_ceiling": "Private candidate Product Capability and business ontology only; no adoption, system realization, DomainSpec construction, implementation, conformance, admission, promotion, execution, publication, release, deployment, or external effect.",
    "authority_effect": "none"
}
print(json.dumps(output, indent=2, sort_keys=True))
raise SystemExit(1 if blocked else 0)
