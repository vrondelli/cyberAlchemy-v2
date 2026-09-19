#!/usr/bin/env python3
"""Fail-closed structural and source-integrity checks for the ORODI definition candidate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
PACK_PATH = Path(__file__).resolve().parents[1] / "ORODI-DEFINITION-PACK.v1-candidate.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def heading_section_sha256(path: Path, selector: str) -> str | None:
    data = path.read_bytes()
    marker = (selector + "\n").encode("utf-8")
    start = data.find(marker)
    if start < 0:
        return None
    next_heading = data.find(b"\n## ", start + len(marker))
    end = len(data) if next_heading < 0 else next_heading + 1
    return hashlib.sha256(data[start:end]).hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []
    pack = json.loads(PACK_PATH.read_text(encoding="utf-8"))

    require(pack.get("schema_version") == "domainspec.orodi.definition-pack/v1-candidate", "schema_version mismatch", failures)
    require(pack.get("pack_id") == "DEFINE-PACK-ORODI-CORE-001", "pack_id mismatch", failures)
    require(pack.get("status") == "candidate", "pack must remain candidate", failures)
    require(pack.get("authority_effect") == "none", "pack authority_effect must be none", failures)
    require(pack.get("implementation_effect") == "none", "pack implementation_effect must be none", failures)
    require(pack.get("promotion_effect") == "none", "pack promotion_effect must be none", failures)

    source_ids: set[str] = set()
    for source in pack.get("sources", []):
        source_id = source.get("source_id")
        require(bool(source_id) and source_id not in source_ids, f"duplicate or empty source_id: {source_id}", failures)
        source_ids.add(source_id)
        path = REPO / source.get("path", "")
        require(path.is_file(), f"missing source: {path}", failures)
        if path.is_file():
            require(sha256(path) == source.get("sha256"), f"source digest drift: {source_id}", failures)

    canonical_path = REPO / "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md"
    canonical_ids: set[str] = set()
    for binding in pack.get("canonical_bindings", []):
        definition_id = binding.get("definition_id")
        require(definition_id not in canonical_ids, f"duplicate canonical binding: {definition_id}", failures)
        canonical_ids.add(definition_id)
        selector_digest = heading_section_sha256(canonical_path, binding.get("selector", ""))
        require(selector_digest is not None, f"missing canonical selector: {definition_id}", failures)
        require(binding.get("source_sha256") == selector_digest, f"canonical selector digest drift: {definition_id}", failures)
    require(canonical_ids == {"CAV2-D33", "CAV2-D38", "CAV2-D65", "CAV2-D67"}, "canonical binding set mismatch", failures)

    records = pack.get("handled_definitions", [])
    require(len(records) == 17, f"expected 17 definition records, got {len(records)}", failures)
    concept_ids = [record.get("concept_id") for record in records]
    record_ids = [record.get("record_id") for record in records]
    terms = [record.get("term") for record in records]
    require(len(set(concept_ids)) == len(concept_ids), "duplicate concept_id", failures)
    require(len(set(record_ids)) == len(record_ids), "duplicate record_id", failures)
    require(len(set(terms)) == len(terms), "duplicate term", failures)
    require(set(concept_ids) == set(pack.get("required_concept_ids", [])), "required concept coverage mismatch", failures)

    voice_fields = ("normative_voice", "formal_voice", "plain_language_voice", "domain_context_voice")
    for record in records:
        label = record.get("concept_id", "<unknown>")
        require(record.get("current_disposition") == "propose", f"{label}: disposition must be propose", failures)
        require(record.get("status") == "candidate", f"{label}: status must be candidate", failures)
        require(record.get("canonical_target") == "unassigned", f"{label}: canonical_target must be unassigned", failures)
        require(record.get("authority_effect") == "none", f"{label}: authority_effect must be none", failures)
        require(record.get("current") is True, f"{label}: record must be current", failures)
        require(record.get("decision_owner_route") == "CyberAlchemy v2 definitions-governance owner", f"{label}: definition owner mismatch", failures)
        require(bool(record.get("boundary")), f"{label}: boundary missing", failures)
        require(bool(record.get("challenge_or_refresh_route")), f"{label}: challenge route missing", failures)
        require(bool(record.get("consumer_refs")), f"{label}: consumer refs missing", failures)
        for field in voice_fields:
            require(bool(record.get(field)), f"{label}: {field} missing", failures)
        for source_ref in record.get("source_refs", []):
            require(source_ref in source_ids, f"{label}: unknown source ref {source_ref}", failures)

    concept_set = set(concept_ids)
    relation_ids: set[str] = set()
    for relation in pack.get("relationships", []):
        relation_id = relation.get("relation_id")
        require(relation_id not in relation_ids, f"duplicate relation_id: {relation_id}", failures)
        relation_ids.add(relation_id)
        require(relation.get("source_concept_id") in concept_set, f"{relation_id}: unknown source concept", failures)
        require(relation.get("target_concept_id") in concept_set, f"{relation_id}: unknown target concept", failures)

    alignment = pack.get("downstream_alignment", {})
    ontology_path = REPO / alignment.get("ontology_source_path", "")
    capability_path = REPO / alignment.get("capability_source_path", "")
    require(ontology_path.is_file(), "ontology alignment source missing", failures)
    require(capability_path.is_file(), "capability alignment source missing", failures)
    if ontology_path.is_file():
        require(sha256(ontology_path) == alignment.get("ontology_source_sha256"), "ontology alignment source digest drift", failures)
        ontology = json.loads(ontology_path.read_text(encoding="utf-8"))
        expected_nodes = {node["node_id"] for node in ontology.get("nodes", []) if node.get("branch") == "business"}
        mapped_nodes = {item.get("node_id") for item in alignment.get("business_node_mappings", [])}
        require(mapped_nodes == expected_nodes, f"business-node definition coverage mismatch: expected {sorted(expected_nodes)}, mapped {sorted(mapped_nodes)}", failures)
    if capability_path.is_file():
        require(sha256(capability_path) == alignment.get("capability_source_sha256"), "capability alignment source digest drift", failures)
        capabilities = json.loads(capability_path.read_text(encoding="utf-8"))
        expected_capabilities = {item["capability_id"] for item in capabilities.get("capabilities", [])}
        mapped_capabilities = {item.get("capability_id") for item in alignment.get("capability_mappings", [])}
        require(mapped_capabilities == expected_capabilities, f"capability definition coverage mismatch: expected {sorted(expected_capabilities)}, mapped {sorted(mapped_capabilities)}", failures)

    for mapping_group in ("business_node_mappings", "capability_mappings"):
        for mapping in alignment.get(mapping_group, []):
            for definition_ref in mapping.get("definition_refs", []):
                require(definition_ref in concept_set, f"{mapping_group}: unknown definition ref {definition_ref}", failures)

    result = {
        "schema_version": "domainspec.orodi.definition-validation/v1",
        "pack_id": pack.get("pack_id"),
        "pack_sha256": sha256(PACK_PATH),
        "status": "pass" if not failures else "fail",
        "checks": {
            "exact_source_digests": "pass" if not any("digest drift" in item for item in failures) else "fail",
            "canonical_selectors": "pass" if not any("canonical" in item for item in failures) else "fail",
            "definition_count": len(records),
            "four_voice_records": sum(all(record.get(field) for field in voice_fields) for record in records),
            "relationship_count": len(pack.get("relationships", [])),
            "business_node_mapping_count": len(alignment.get("business_node_mappings", [])),
            "capability_mapping_count": len(alignment.get("capability_mappings", []))
        },
        "failures": failures,
        "authority_effect": "none",
        "claim_ceiling": "Structural and source-integrity validation only; no definition promotion or downstream authority effect."
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
