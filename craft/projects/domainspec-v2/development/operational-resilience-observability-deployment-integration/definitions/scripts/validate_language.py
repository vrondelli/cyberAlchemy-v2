#!/usr/bin/env python3
"""Validate the candidate ORODI Ubiquitous Language and exact consumer bindings."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
ROOT = Path(__file__).resolve().parents[1]
LANGUAGE_PATH = ROOT / "ORODI-UBIQUITOUS-LANGUAGE.v1-candidate.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def record_sha256(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def node_set_sha256(root: Path) -> str:
    parts = [f"{path.name}:{sha256(path)}" for path in sorted(root.glob("*.json"))]
    return hashlib.sha256("\n".join(parts).encode("utf-8")).hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []
    language = json.loads(LANGUAGE_PATH.read_text(encoding="utf-8"))

    require(language.get("schema_version") == "domainspec.orodi.ubiquitous-language/v1-candidate", "schema_version mismatch", failures)
    require(language.get("language_id") == "CA2-LANGUAGE-CRAFT-ORODI-UBIQUITOUS", "language_id mismatch", failures)
    require(language.get("status") == "candidate", "language must remain candidate", failures)
    for field in ("authority_effect", "implementation_effect", "promotion_effect"):
        require(language.get(field) == "none", f"{field} must be none", failures)

    concepts_path = REPO / "cyberAlchemy-v2/language/concepts.json"
    concepts = json.loads(concepts_path.read_text(encoding="utf-8"))["concepts"]
    concept_by_id = {item["concept_id"]: item for item in concepts}
    for binding_name, concept_id in (
        ("language_concept_binding", "CA2-CAND-LANGUAGE-001"),
        ("ubiquitous_language_binding", "CA2-CAND-UBIQUITOUS-LANGUAGE-001"),
    ):
        binding = language[binding_name]
        require(concept_id in concept_by_id, f"missing Language Project concept: {concept_id}", failures)
        if concept_id in concept_by_id:
            require(record_sha256(concept_by_id[concept_id]) == binding.get("record_sha256"), f"Language Project concept drift: {concept_id}", failures)

    for binding_name in ("language_project_binding", "practice_binding"):
        binding = language[binding_name]
        path = REPO / binding["source_ref"]
        require(path.is_file(), f"missing source: {binding['source_ref']}", failures)
        if path.is_file():
            require(sha256(path) == binding.get("sha256"), f"source digest drift: {binding_name}", failures)

    pack_binding = language["definition_pack_binding"]
    pack_path = REPO / pack_binding["pack_ref"]
    require(pack_path.is_file(), "definition pack missing", failures)
    pack: dict = {}
    if pack_path.is_file():
        require(sha256(pack_path) == pack_binding.get("sha256"), "definition pack digest drift", failures)
        pack = json.loads(pack_path.read_text(encoding="utf-8"))
        require(pack.get("pack_id") == pack_binding.get("pack_id"), "definition pack id mismatch", failures)
    definition_ids = {item["concept_id"] for item in pack.get("handled_definitions", [])}

    domain_expressions = language.get("domain_expressions", [])
    require(len(domain_expressions) == 17, f"expected 17 domain expressions, got {len(domain_expressions)}", failures)
    require({item.get("definition_ref") for item in domain_expressions} == definition_ids, "domain expression definition coverage mismatch", failures)
    require(len({item.get("entry_id") for item in domain_expressions}) == len(domain_expressions), "duplicate domain expression id", failures)
    require(len({item.get("expression") for item in domain_expressions}) == len(domain_expressions), "duplicate domain expression", failures)
    for item in domain_expressions:
        require(item.get("disposition") == "propose", f"{item.get('entry_id')}: disposition must be propose", failures)

    domainspec = language["domainspec_binding"]
    for path_field, digest_field in (
        ("feature_path", "feature_sha256"),
        ("meta_types_ref", "meta_types_sha256"),
        ("relationships_ref", "relationships_sha256"),
    ):
        path = REPO / domainspec[path_field]
        require(path.is_file(), f"missing DomainSpec source: {domainspec[path_field]}", failures)
        if path.is_file():
            require(sha256(path) == domainspec[digest_field], f"DomainSpec source digest drift: {path_field}", failures)

    node_root = REPO / domainspec["node_root"]
    require(node_root.is_dir(), "DomainSpec node root missing", failures)
    nodes: dict[str, dict] = {}
    if node_root.is_dir():
        require(node_set_sha256(node_root) == domainspec.get("node_set_sha256"), "DomainSpec node-set digest drift", failures)
        for path in sorted(node_root.glob("*.json")):
            node = json.loads(path.read_text(encoding="utf-8"))
            nodes[node["node_id"]] = node

    model_expressions = language.get("model_expressions", [])
    require(len(model_expressions) == 32, f"expected 32 model expressions, got {len(model_expressions)}", failures)
    require({item.get("node_ref") for item in model_expressions} == set(nodes), "DomainSpec model expression coverage mismatch", failures)
    require(len({item.get("entry_id") for item in model_expressions}) == len(model_expressions), "duplicate model expression id", failures)
    for item in model_expressions:
        label = item.get("entry_id", "<unknown>")
        node = nodes.get(item.get("node_ref"))
        require(node is not None, f"{label}: unknown DomainSpec node", failures)
        if node is not None:
            require(item.get("domainspec_kind") == node.get("kind"), f"{label}: DomainSpec kind mismatch", failures)
            require(item.get("code_symbol") == node["node_id"].split(".")[-1], f"{label}: code symbol mismatch", failures)
        require(bool(item.get("usage")), f"{label}: usage missing", failures)
        for definition_ref in item.get("definition_refs", []):
            require(definition_ref in definition_ids, f"{label}: unknown definition ref {definition_ref}", failures)

    expected_states = ["passed", "failed", "missing", "invalid", "inconclusive", "stale", "not-run"]
    require(language.get("evidence_state_vocabulary") == expected_states, "Evidence State vocabulary mismatch", failures)
    require(len(language.get("semantic_distinctions", [])) >= 8, "semantic distinction set incomplete", failures)
    require(len(language.get("reserved_effect_verbs", {}).get("verbs", [])) >= 8, "reserved effect-verb set incomplete", failures)

    support = language.get("implementation_support_expressions", [])
    require(len(support) >= 6, "implementation support vocabulary incomplete", failures)
    require(len({item.get("code_symbol") for item in support}) == len(support), "duplicate implementation support code symbol", failures)

    audit_paths: dict[str, Path] = {}
    for source in language.get("implementation_audit_sources", []):
        path = REPO / source["path"]
        audit_paths[source["path"]] = path
        require(path.is_file(), f"missing implementation audit source: {source['path']}", failures)
        if path.is_file():
            require(sha256(path) == source.get("sha256"), f"implementation audit source drift: {source['path']}", failures)
    for drift in language.get("implementation_drift", []):
        path = audit_paths.get(drift.get("source_path"))
        require(path is not None, f"{drift.get('drift_id')}: undeclared audit source", failures)
        if path is not None and path.is_file():
            require(drift.get("symbol") in path.read_text(encoding="utf-8"), f"{drift.get('drift_id')}: symbol no longer present", failures)
        require(drift.get("effect") in {"future-implementation-migration-only", "future-domainspec-successor-only"}, f"{drift.get('drift_id')}: invalid effect", failures)

    result = {
        "schema_version": "domainspec.orodi.ubiquitous-language-validation/v1",
        "language_id": language.get("language_id"),
        "language_sha256": sha256(LANGUAGE_PATH),
        "status": "pass" if not failures else "fail",
        "checks": {
            "domain_expression_count": len(domain_expressions),
            "model_expression_count": len(model_expressions),
            "domainspec_kind_counts": {kind: sum(item.get("domainspec_kind") == kind for item in model_expressions) for kind in ("Entity", "Rule", "Operation", "Event")},
            "implementation_support_expression_count": len(support),
            "semantic_distinction_count": len(language.get("semantic_distinctions", [])),
            "implementation_drift_count": len(language.get("implementation_drift", [])),
            "exact_source_bindings": "pass" if not any("drift" in item for item in failures) else "fail"
        },
        "failures": failures,
        "authority_effect": "none",
        "claim_ceiling": "Candidate language consistency and drift validation only; no language admission or implementation effect."
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
