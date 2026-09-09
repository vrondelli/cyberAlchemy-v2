#!/usr/bin/env python3
"""Validate the durable-storage Definition Pack without granting effects."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
EXPECTED_PACK_ID = "DEFINE-PACK-KEP-DURABLE-STORAGE-001"
EXPECTED_DEFINITION_IDS = tuple(f"KEP-DST-D{index}" for index in range(1, 16))
EXPECTED_CHECK_IDS = {
    "required-concept-coverage",
    "single-current-disposition",
    "three-definition-voices",
    "exact-source-bindings",
    "index-synchronization",
    "relationship-endpoint-closure",
    "open-question-visibility",
}
REQUIRED_VOICES = (
    "### Normative Definition",
    "### Formal Model",
    "### Operational Interpretation",
    "### Plain-Language Intuition",
    "### Domain-Context Voice",
    "### Boundary",
    "### Primary Consumers",
)
ALLOWED_DISPOSITIONS = {"reuse", "specialize", "propose", "open"}
REQUIRED_BLOCKED_MARKERS = (
    "Product Capability",
    "ontology",
    "DomainSpec",
    "implementation",
)
EXPECTED_SOLANA_INSTANTIATION_FIELDS = (
    "stored object kinds",
    "recipient-envelope specialization",
    "commitment binding rule",
    "storage readiness rule before Solana mutation",
    "storage failure effect on Solana mutation",
    "consumer-owned durable-storage policy values",
    "durable-storage infrastructure cost classification",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stable_digest(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_object(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path.name}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path.name} must contain one JSON object")
        return {}
    return value


def resolve_repository_file(
    repository_root: Path, relative: object, errors: list[str], label: str
) -> Path | None:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        errors.append(f"{label} must be a non-empty repository-relative path")
        return None
    candidate = (repository_root / relative).resolve()
    try:
        candidate.relative_to(repository_root.resolve())
    except ValueError:
        errors.append(f"{label} escapes repository root")
        return None
    if not candidate.is_file():
        errors.append(f"{label} is missing: {relative}")
        return None
    return candidate


def definition_sections(text: str) -> list[tuple[str, str, str]]:
    matches = list(re.finditer(r"^## (KEP-DST-D\d+): (.+)$", text, flags=re.MULTILINE))
    sections: list[tuple[str, str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections.append((match.group(1), match.group(2), text[match.start():end]))
    return sections


def parse_index(text: str, errors: list[str]) -> dict[str, str]:
    entries: dict[str, str] = {}
    for term, definition_id in re.findall(
        r"^\| ([^|]+?) \| (KEP-DST-D\d+) \|$", text, flags=re.MULTILINE
    ):
        normalized = term.strip()
        if normalized in entries:
            errors.append(f"index contains duplicate term or alias: {normalized}")
        entries[normalized] = definition_id
    return entries


def validate_candidate(
    package_root: Path = PACKAGE_ROOT,
    repository_root: Path = REPOSITORY_ROOT,
) -> dict[str, Any]:
    errors: list[str] = []
    checks: dict[str, list[str]] = {
        "candidate-envelope": [],
        "exact-source-bindings": [],
        "definition-voice-completeness": [],
        "index-synchronization": [],
        "concept-disposition-closure": [],
        "relationship-endpoint-closure": [],
        "open-question-and-effect-boundary": [],
    }

    pack_path = package_root / "definition-pack-candidate.json"
    definitions_path = package_root / "authority/definitions/DEFINITIONS.md"
    index_path = package_root / "authority/definitions/DEFINITIONS-INDEX.md"
    readme_path = package_root / "README.md"
    material_paths = (readme_path, definitions_path, index_path, pack_path)
    for path in material_paths:
        if not path.is_file():
            checks["candidate-envelope"].append(f"missing candidate material: {path.name}")

    pack = load_object(pack_path, checks["candidate-envelope"])
    definitions = definitions_path.read_text(encoding="utf-8") if definitions_path.is_file() else ""
    index_text = index_path.read_text(encoding="utf-8") if index_path.is_file() else ""

    if pack.get("schema_version") != "cav2-define-definition-pack/v1-candidate":
        checks["candidate-envelope"].append("Definition Pack schema drift")
    if pack.get("pack_id") != EXPECTED_PACK_ID or pack.get("status") != "candidate":
        checks["candidate-envelope"].append("Definition Pack must retain its candidate identity")
    if pack.get("authority_effect") != "none" or pack.get("external_effect") != "none":
        checks["candidate-envelope"].append("candidate exceeds its no-effect authority ceiling")
    if pack.get("define_session", {}).get("durable_repository_session") is not False:
        checks["candidate-envelope"].append("candidate must not imply a durable execution session")
    responsibility = pack.get("responsibility_model", {})
    first_consumer = responsibility.get("first_consumer", {})
    if first_consumer.get("capability_id") != "CA2-CAP-REALIZE-NO-PRICE-SOLANA-COOWNERSHIP":
        checks["candidate-envelope"].append("first consumer identity must remain the Solana capability")
    if first_consumer.get("current_state") != "accepted-predecessor-lacks-durable-storage-instantiation":
        checks["candidate-envelope"].append("Solana predecessor responsibility state drift")
    if tuple(first_consumer.get("must_bind", [])) != EXPECTED_SOLANA_INSTANTIATION_FIELDS:
        checks["candidate-envelope"].append("Solana semantic instantiation field closure drift")
    if not responsibility.get("implementation_realization_owner"):
        checks["candidate-envelope"].append("provider realization owner must remain separate")

    source = pack.get("candidate_definition_source", {})
    expected_definition_path = "capabilities/durable-storage/authority/definitions/DEFINITIONS.md"
    expected_index_path = "capabilities/durable-storage/authority/definitions/DEFINITIONS-INDEX.md"
    if source.get("path") != expected_definition_path or source.get("index_path") != expected_index_path:
        checks["exact-source-bindings"].append("candidate definition source paths drift")
    if definitions_path.is_file() and source.get("sha256") != sha256(definitions_path):
        checks["exact-source-bindings"].append("candidate definition source digest drift")
    if index_path.is_file() and source.get("index_sha256") != sha256(index_path):
        checks["exact-source-bindings"].append("candidate definition index digest drift")
    if source.get("lifecycle_status") != "candidate-awaiting-owner-acceptance":
        checks["exact-source-bindings"].append("definition lifecycle status exceeds candidate")

    source_ids: set[str] = set()
    for item in pack.get("sources", []):
        source_id = item.get("source_id")
        if not isinstance(source_id, str) or not source_id or source_id in source_ids:
            checks["exact-source-bindings"].append("source IDs must be unique non-empty strings")
            continue
        source_ids.add(source_id)
        path = resolve_repository_file(
            repository_root, item.get("path"), checks["exact-source-bindings"], source_id
        )
        if path and item.get("sha256") != sha256(path):
            checks["exact-source-bindings"].append(f"source digest drift: {source_id}")
        if not item.get("selectors"):
            checks["exact-source-bindings"].append(f"source has no exact selectors: {source_id}")

    sections = definition_sections(definitions)
    definition_ids = tuple(item[0] for item in sections)
    if definition_ids != EXPECTED_DEFINITION_IDS:
        checks["definition-voice-completeness"].append(
            f"definition heading closure mismatch: {definition_ids}"
        )
    expected_index_entries: dict[str, str] = {}
    alias_count = 0
    for definition_id, title, section in sections:
        if "Status: candidate" not in section:
            checks["definition-voice-completeness"].append(
                f"{definition_id} must remain candidate"
            )
        for voice in REQUIRED_VOICES:
            if voice not in section:
                checks["definition-voice-completeness"].append(
                    f"{definition_id} missing definition voice: {voice}"
                )
        if definition_id != "KEP-DST-D15" and "Solana" in section:
            checks["definition-voice-completeness"].append(
                f"{definition_id} leaks Solana consumer meaning into generic storage"
            )
        term_match = re.search(r"^Term: (.+)$", section, flags=re.MULTILINE)
        aliases_match = re.search(r"^Aliases: (.+)$", section, flags=re.MULTILINE)
        if not term_match or not aliases_match:
            checks["definition-voice-completeness"].append(
                f"{definition_id} missing term or aliases"
            )
            continue
        term = term_match.group(1).strip()
        aliases = [item.strip() for item in aliases_match.group(1).split(",") if item.strip()]
        alias_count += len(aliases)
        if title.casefold() != term.casefold():
            checks["definition-voice-completeness"].append(
                f"{definition_id} title and canonical term drift"
            )
        for lookup_term in (term, *aliases):
            if lookup_term in expected_index_entries:
                checks["index-synchronization"].append(
                    f"definition source repeats term or alias: {lookup_term}"
                )
            expected_index_entries[lookup_term] = definition_id

    actual_index_entries = parse_index(index_text, checks["index-synchronization"])
    if actual_index_entries != expected_index_entries:
        missing = sorted(set(expected_index_entries.items()) - set(actual_index_entries.items()))
        extra = sorted(set(actual_index_entries.items()) - set(expected_index_entries.items()))
        if missing:
            checks["index-synchronization"].append(f"index missing mappings: {missing}")
        if extra:
            checks["index-synchronization"].append(f"index has unexpected mappings: {extra}")

    required_concepts = pack.get("required_concept_ids", [])
    concepts = pack.get("concepts", [])
    concept_ids = [item.get("concept_id") for item in concepts if isinstance(item, dict)]
    if len(concept_ids) != len(set(concept_ids)):
        checks["concept-disposition-closure"].append("concept IDs must be unique")
    if set(required_concepts) != set(concept_ids) or len(required_concepts) != len(concept_ids):
        checks["concept-disposition-closure"].append("required concept coverage is not exact")
    referenced_definitions: list[str] = []
    for concept in concepts:
        if not isinstance(concept, dict):
            checks["concept-disposition-closure"].append("each concept must be an object")
            continue
        disposition = concept.get("current_disposition")
        if disposition not in ALLOWED_DISPOSITIONS:
            checks["concept-disposition-closure"].append(
                f"invalid disposition for {concept.get('concept_id')}: {disposition}"
            )
        if disposition == "specialize" and not concept.get("parent_definition_ref"):
            checks["concept-disposition-closure"].append(
                f"specialization lacks parent: {concept.get('concept_id')}"
            )
        definition_ref = concept.get("source_definition_ref")
        if not isinstance(definition_ref, str):
            checks["concept-disposition-closure"].append(
                f"concept lacks definition reference: {concept.get('concept_id')}"
            )
        else:
            referenced_definitions.append(definition_ref)
    if tuple(referenced_definitions) != EXPECTED_DEFINITION_IDS:
        checks["concept-disposition-closure"].append(
            "concepts must bind each candidate definition exactly once and in declared order"
        )

    relation_ids: set[str] = set()
    concept_id_set = set(concept_ids)
    for relation in pack.get("relationships", []):
        if not isinstance(relation, dict):
            checks["relationship-endpoint-closure"].append("each relationship must be an object")
            continue
        relation_id = relation.get("relation_id")
        if not isinstance(relation_id, str) or not relation_id or relation_id in relation_ids:
            checks["relationship-endpoint-closure"].append(
                "relationship IDs must be unique non-empty strings"
            )
        else:
            relation_ids.add(relation_id)
        for endpoint in ("source_concept_id", "target_concept_id"):
            if relation.get(endpoint) not in concept_id_set:
                checks["relationship-endpoint-closure"].append(
                    f"unresolved {endpoint} in {relation_id}"
                )
        if not relation.get("relation"):
            checks["relationship-endpoint-closure"].append(
                f"relationship predicate is missing in {relation_id}"
            )

    open_questions = pack.get("open_questions", [])
    if not open_questions:
        checks["open-question-and-effect-boundary"].append("open choices must remain visible")
    question_ids = [item.get("question_id") for item in open_questions if isinstance(item, dict)]
    if len(question_ids) != len(set(question_ids)):
        checks["open-question-and-effect-boundary"].append("open-question IDs must be unique")
    blocked_text = "\n".join(pack.get("blocked_actions", []))
    for marker in REQUIRED_BLOCKED_MARKERS:
        if marker not in blocked_text:
            checks["open-question-and-effect-boundary"].append(
                f"blocked-action boundary missing: {marker}"
            )
    declared_check_ids = {item.get("check_id") for item in pack.get("checks", [])}
    if declared_check_ids != EXPECTED_CHECK_IDS:
        checks["open-question-and-effect-boundary"].append("declared check set drift")
    if any(item.get("status") != "pending-validator" for item in pack.get("checks", [])):
        checks["open-question-and-effect-boundary"].append(
            "candidate must not self-assert validator outcomes"
        )

    check_results = []
    for check_id, check_errors in checks.items():
        errors.extend(check_errors)
        check_results.append(
            {"check_id": check_id, "status": "PASS" if not check_errors else "BLOCK", "errors": check_errors}
        )

    material = {
        str(path.relative_to(package_root)): sha256(path) if path.is_file() else "missing"
        for path in material_paths
    }
    return {
        "schema_version": "cav2-kep-durable-storage-definition-validation/v1",
        "result": "PASS" if not errors else "BLOCK",
        "pack_id": pack.get("pack_id"),
        "definition_source_sha256": sha256(definitions_path) if definitions_path.is_file() else None,
        "material_digest": stable_digest(material),
        "counts": {
            "definitions": len(definition_ids),
            "aliases": alias_count,
            "indexed_terms_and_aliases": len(actual_index_entries),
            "concepts": len(concepts),
            "relationships": len(pack.get("relationships", [])),
            "open_questions": len(open_questions),
        },
        "checks": check_results,
        "downstream": {
            "definition_acceptance": "not_evaluable",
            "product_capability": "not_evaluable",
            "business_ontology": "not_evaluable",
            "domainspec_v2": "not_evaluable",
            "implementation_and_runtime": "not_evaluable",
            "solana_consumer_instantiation": "not_evaluable",
        },
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Validated durable-storage Definition Pack candidate only; no acceptance, capability, ontology, DomainSpec, implementation, provider operation, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate_candidate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
