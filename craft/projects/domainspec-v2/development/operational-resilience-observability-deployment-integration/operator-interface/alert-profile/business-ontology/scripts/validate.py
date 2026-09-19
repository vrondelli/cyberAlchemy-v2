#!/usr/bin/env python3
"""Validate the ORODI Alert Profile capability-local business ontology."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[8]
PACKAGE = Path(__file__).resolve().parents[1]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name: str) -> dict:
    return json.loads((PACKAGE / name).read_text(encoding="utf-8"))


def main() -> int:
    errors: list[str] = []
    profile = load("profile.json")
    sources = load("sources.json")
    nodes = load("nodes.json")
    relations = load("relations.json")
    definitions = json.loads((ROOT / profile["definition_pack_ref"]).read_text(encoding="utf-8"))
    projection = json.loads((PACKAGE.parent / "product-capability-projection.json").read_text(encoding="utf-8"))

    if profile.get("ontology_type") != "business-domain" or profile.get("branch") != "business": errors.append("ontology-type")
    if profile.get("materialization") != "package-required" or profile.get("visibility") != "private": errors.append("materialization")
    if profile.get("status") != "candidate" or profile.get("admission_state") != "not-granted" or profile.get("authority_effect") != "none": errors.append("authority")

    source_ids: set[str] = set()
    for source in sources.get("sources", []):
        source_id = source.get("source_id")
        if source_id in source_ids: errors.append(f"duplicate-source:{source_id}")
        source_ids.add(source_id)
        path = ROOT / source.get("path", "")
        if not path.is_file(): errors.append(f"missing-source:{source_id}")
        elif digest(path) != source.get("sha256"): errors.append(f"source-drift:{source_id}")

    definition_ids = set(definitions.get("required_concept_ids", []))
    node_rows = nodes.get("nodes", [])
    node_ids = [row.get("node_id") for row in node_rows]
    if len(node_ids) != 12 or len(node_ids) != len(set(node_ids)): errors.append("node-identity")
    for row in node_rows:
        if row.get("definition_ref") not in definition_ids: errors.append(f"definition-ref:{row.get('node_id')}")

    node_set = set(node_ids)
    relation_ids: set[str] = set()
    for relation in relations.get("relations", []):
        relation_id = relation.get("relation_id")
        if relation_id in relation_ids: errors.append(f"duplicate-relation:{relation_id}")
        relation_ids.add(relation_id)
        if relation.get("from") not in node_set or relation.get("to") not in node_set: errors.append(f"relation-endpoint:{relation_id}")
    if len(relation_ids) != 11: errors.append("relation-count")

    projected = {row.get("capability_id"): row.get("record_digest") for row in projection.get("projections", [])}
    expected = {
        "CA2-CAP-ORODI-EVALUATE-CANARY": "5b06c298d4ebe3ce163fefc9982825cae7c89bbf1db0783ab0add9c0260368b3",
        "CA2-CAP-ORODI-VERIFY-ROLLBACK": "9a36d34e72cd2a21142a70d49f7bbe0bcee5e621dc450c8f4065138ad971804e",
        "CA2-CAP-ORODI-MATERIALIZE-RUN-READY-LAB": "4e6353aeff6b28b0f4fb79303c91547c08e57ac877ac931301b3c02bd43c3cb9",
        "CA2-CAP-ORODI-COMMISSION-LOCAL-LAB": "90ebcc11d2fe908ed85709b786138fd6a4d856fdef41f24123fcf40dac71cb85",
    }
    if projected != expected or projection.get("identity_effect") != "preserve-existing-adopted-identities": errors.append("capability-projection")

    result = {
        "schema_version": "cav2.orodi.alert-profile-business-ontology-validation/v1",
        "ontology_id": profile.get("ontology_id"),
        "result": "pass" if not errors else "fail",
        "verified_sources": len(source_ids),
        "verified_nodes": len(node_ids),
        "verified_relations": len(relation_ids),
        "verified_product_capabilities": len(projected),
        "errors": sorted(set(errors)),
        "admission_state": "not-granted",
        "authority_effect": "none"
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
