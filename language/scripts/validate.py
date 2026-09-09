#!/usr/bin/env python3
"""Validate the private CyberAlchemy Language Project package."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    ".craft/artifacts/README.md",
    ".craft/index.json",
    ".craft/ledger.yml",
    "CRAFT.md",
    "README.md",
    "profile.json",
    "project.json",
    "goals/ubiquitous-language-first-example.goal.json",
    "concepts.json",
    "meaning-bindings.json",
    "edge-vocabulary.json",
    "realization-bindings.json",
    "authority-bindings.json",
    "languages/governance-ubiquitous-language.json",
    "disciplines/ubiquitous-language-practice.json",
    "examples/governance-policy-resolution.json",
    "examples/governance-evaluation-kernel-language.json",
    "ontology/language-project.json",
    "sources.json",
    "residue.json",
    "schemas/language-project.schema.json",
    "schemas/meaning-package.schema.json",
    "scripts/validate.py",
)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(relative_path: str, errors: list[str]) -> dict[str, Any]:
    path = PACKAGE_ROOT / relative_path
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {relative_path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{relative_path} must contain one JSON object")
        return {}
    return value


def exact_keys(value: dict[str, Any], expected: set[str], label: str, errors: list[str]) -> None:
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} unknown keys: {', '.join(extra)}")


def require_nonempty(value: Any, label: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")


def check_authority(value: Any, label: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "authority_effect" and child != "none":
                errors.append(f"{label}.{key} must be none")
            check_authority(child, f"{label}.{key}", errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            check_authority(child, f"{label}[{index}]", errors)


def validate_closed_schema_declarations(value: Any, label: str, errors: list[str]) -> None:
    """Reject closed object schemas that require undeclared properties."""
    if isinstance(value, dict):
        if value.get("type") == "object" and value.get("additionalProperties") is False:
            required = value.get("required", [])
            properties = value.get("properties", {})
            if isinstance(required, list) and isinstance(properties, dict):
                missing = sorted(set(required) - set(properties))
                if missing:
                    errors.append(
                        f"{label} requires undeclared properties: {', '.join(missing)}"
                    )
        for key, child in value.items():
            validate_closed_schema_declarations(child, f"{label}.{key}", errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            validate_closed_schema_declarations(child, f"{label}[{index}]", errors)


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative_path in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing material file: {relative_path}")
            continue
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_sources(sources_doc: dict[str, Any], errors: list[str]) -> tuple[set[str], int]:
    exact_keys(sources_doc, {"schema_ref", "schema_version", "sources"}, "sources", errors)
    if sources_doc.get("schema_version") != "cav2-language-sources/v1":
        errors.append("sources schema_version is invalid")
    source_ids: set[str] = set()
    locator_only = 0
    source_keys = {
        "source_id", "path", "binding_mode", "start_marker", "end_marker",
        "sha256", "posture", "owner_route"
    }
    for index, source in enumerate(sources_doc.get("sources", [])):
        label = f"sources[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(source, source_keys, label, errors)
        source_id = source.get("source_id")
        if not isinstance(source_id, str) or not source_id:
            errors.append(f"{label}.source_id must be non-empty")
            continue
        if source_id in source_ids:
            errors.append(f"duplicate source id: {source_id}")
        source_ids.add(source_id)
        path = REPOSITORY_ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"missing source path: {source.get('path')}")
            continue
        raw = path.read_bytes()
        mode = source.get("binding_mode")
        if mode == "file-sha256":
            if sha256_bytes(raw) != source.get("sha256"):
                errors.append(f"source digest drift: {source_id}")
        elif mode == "selector-sha256":
            text = raw.decode("utf-8")
            start_marker = source.get("start_marker")
            end_marker = source.get("end_marker")
            if not isinstance(start_marker, str) or not isinstance(end_marker, str):
                errors.append(f"selector source lacks markers: {source_id}")
                continue
            start = text.find(start_marker)
            end = text.find(end_marker, start + len(start_marker)) if start >= 0 else -1
            if start < 0 or end < 0 or end <= start:
                errors.append(f"selector does not resolve: {source_id}")
                continue
            selected = text[start:end].encode("utf-8")
            if sha256_bytes(selected) != source.get("sha256"):
                errors.append(f"source selector digest drift: {source_id}")
        elif mode == "locator-only":
            locator_only += 1
            marker = source.get("start_marker")
            if isinstance(marker, str) and marker not in raw.decode("utf-8"):
                errors.append(f"locator marker does not resolve: {source_id}")
            if source.get("sha256") is not None:
                errors.append(f"locator-only source must not claim a digest: {source_id}")
        else:
            errors.append(f"unknown source binding mode: {source_id}")
        require_nonempty(source.get("posture"), f"{label}.posture", errors)
        require_nonempty(source.get("owner_route"), f"{label}.owner_route", errors)
    return source_ids, locator_only


def validate_project_goal(
    project: dict[str, Any],
    goal: dict[str, Any],
    source_ids: set[str],
    errors: list[str],
) -> tuple[set[str], set[str]]:
    project_keys = {
        "schema_ref", "schema_version", "project_id", "name", "purpose", "scope",
        "exclusions", "owner_routes", "goal_refs", "research_refs", "experiment_refs",
        "evidence_index", "thesis_refs", "lifecycle_state", "challenge_route",
        "authority_effect"
    }
    goal_keys = {
        "schema_ref", "schema_version", "canonical_kind", "goal_id", "title",
        "project_ref", "outcome", "rationale", "thesis_refs", "scope", "exclusions",
        "owner_route", "success_conditions", "evidence_requirements", "evidence_refs",
        "lifecycle_state", "achievement_state", "current_condition", "target_horizon",
        "revision_history", "challenge_route", "blocked_effects", "authority_effect"
    }
    exact_keys(project, project_keys, "project", errors)
    exact_keys(goal, goal_keys, "goal", errors)
    if project.get("schema_version") != "cav2-project/v1":
        errors.append("project schema_version is invalid")
    if goal.get("schema_version") != "cav2-goal/v1" or goal.get("canonical_kind") != "goal":
        errors.append("goal schema_version or canonical_kind is invalid")
    if project.get("project_id") != "CA2-PROJECT-LANGUAGE":
        errors.append("project_id is not the Language Project identity")
    if goal.get("project_ref") != project.get("project_id"):
        errors.append("goal project_ref does not resolve to Project")
    if goal.get("goal_id") not in project.get("goal_refs", []):
        errors.append("Project goal_refs does not include the Goal")
    if not project.get("goal_refs"):
        errors.append("Project must have at least one Goal")
    if project.get("research_refs") != []:
        errors.append("Language Project research_refs must remain empty until it owns a Research record")
    if project.get("experiment_refs") != []:
        errors.append("Language Project experiment_refs must remain empty until it owns an Experiment record")
    if not project.get("thesis_refs") or not goal.get("thesis_refs"):
        errors.append("Project and Goal require thesis references")
    for index, thesis_ref in enumerate(project.get("thesis_refs", []) + goal.get("thesis_refs", [])):
        if not isinstance(thesis_ref, dict) or thesis_ref.get("source_id") not in source_ids:
            errors.append(f"thesis reference {index} uses an unknown source")

    evidence_ids: set[str] = set()
    for index, evidence in enumerate(project.get("evidence_index", [])):
        if not isinstance(evidence, dict) or set(evidence) != {"evidence_id", "kind", "ref", "supports", "claim_limit"}:
            errors.append(f"project evidence_index[{index}] has an invalid shape")
            continue
        evidence_id = evidence.get("evidence_id")
        if evidence_id in evidence_ids:
            errors.append(f"duplicate project evidence id: {evidence_id}")
        if isinstance(evidence_id, str):
            evidence_ids.add(evidence_id)
        if evidence.get("ref") not in source_ids:
            errors.append(f"project evidence uses unknown source: {evidence.get('ref')}")

    condition_ids: set[str] = set()
    all_met = True
    for index, condition in enumerate(goal.get("success_conditions", [])):
        expected = {"id", "statement", "evidence_requirement", "status", "evidence_refs"}
        if not isinstance(condition, dict) or set(condition) != expected:
            errors.append(f"success_conditions[{index}] has an invalid shape")
            continue
        condition_id = condition.get("id")
        if condition_id in condition_ids:
            errors.append(f"duplicate success condition: {condition_id}")
        if isinstance(condition_id, str):
            condition_ids.add(condition_id)
        if condition.get("status") not in {"unmet", "partial", "met"}:
            errors.append(f"invalid success-condition status: {condition_id}")
        if condition.get("status") != "met":
            all_met = False
        for ref in condition.get("evidence_refs", []):
            if ref not in evidence_ids:
                errors.append(f"success condition {condition_id} uses unknown evidence {ref}")
    if goal.get("lifecycle_state") == "achieved" and (not all_met or goal.get("achievement_state") != "proved"):
        errors.append("achieved Goal requires all conditions met and achievement_state proved")
    if goal.get("lifecycle_state") != "achieved" and goal.get("achievement_state") == "proved":
        errors.append("achievement_state proved requires lifecycle_state achieved")
    for index, evidence in enumerate(goal.get("evidence_refs", [])):
        expected = {"evidence_id", "source_id", "supports_conditions", "claim_limit"}
        if not isinstance(evidence, dict) or set(evidence) != expected:
            errors.append(f"goal evidence_refs[{index}] has an invalid shape")
            continue
        if evidence.get("evidence_id") not in evidence_ids:
            errors.append(f"goal uses unknown Project evidence {evidence.get('evidence_id')}")
        if evidence.get("source_id") not in source_ids:
            errors.append(f"goal evidence uses unknown source {evidence.get('source_id')}")
        for condition_id in evidence.get("supports_conditions", []):
            if condition_id not in condition_ids:
                errors.append(f"goal evidence uses unknown condition {condition_id}")
    return evidence_ids, condition_ids


def validate_concepts_language_discipline_example(
    concepts_doc: dict[str, Any],
    language: dict[str, Any],
    discipline: dict[str, Any],
    example: dict[str, Any],
    source_ids: set[str],
    errors: list[str],
) -> tuple[set[str], set[str]]:
    exact_keys(concepts_doc, {"schema_ref", "schema_version", "concepts"}, "concepts", errors)
    concept_keys = {
        "concept_id", "term", "aliases", "status", "normative_voice", "formal_voice",
        "plain_language_voice", "domain_context_voice", "boundary", "owner_route",
        "source_refs", "authority_effect"
    }
    concept_ids: set[str] = set()
    for index, concept in enumerate(concepts_doc.get("concepts", [])):
        label = f"concepts[{index}]"
        if not isinstance(concept, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(concept, concept_keys, label, errors)
        concept_id = concept.get("concept_id")
        if concept_id in concept_ids:
            errors.append(f"duplicate concept id: {concept_id}")
        if isinstance(concept_id, str):
            concept_ids.add(concept_id)
        if concept.get("status") != "candidate":
            errors.append(f"{label} must remain candidate")
        for voice in ("normative_voice", "formal_voice", "plain_language_voice", "domain_context_voice", "boundary"):
            require_nonempty(concept.get(voice), f"{label}.{voice}", errors)
        for source_ref in concept.get("source_refs", []):
            if source_ref not in source_ids:
                errors.append(f"{label} uses unknown source {source_ref}")
    required_concepts = {"CA2-CAND-LANGUAGE-001", "CA2-CAND-UBIQUITOUS-LANGUAGE-001"}
    if not required_concepts.issubset(concept_ids):
        errors.append("concept registry lacks Language or Ubiquitous Language")

    language_keys = {
        "schema_ref", "schema_version", "language_id", "name", "language_concept_ref",
        "specialization_ref", "bounded_context", "communities", "usage_surfaces",
        "concept_entries", "conflict_policy", "revision_state", "owner_routes", "authority_effect"
    }
    exact_keys(language, language_keys, "language", errors)
    if language.get("language_concept_ref") not in concept_ids or language.get("specialization_ref") not in concept_ids:
        errors.append("language concept or specialization ref does not resolve")
    bounded_context = language.get("bounded_context", {})
    exact_keys(bounded_context, {"context_id", "name", "scope", "exclusions"}, "language.bounded_context", errors)
    for key in ("context_id", "name", "scope"):
        require_nonempty(bounded_context.get(key), f"language.bounded_context.{key}", errors)
    if not bounded_context.get("exclusions"):
        errors.append("Ubiquitous Language bounded context requires exclusions")
    if not language.get("communities") or not language.get("usage_surfaces"):
        errors.append("Ubiquitous Language requires named communities and usage surfaces")
    entry_ids: set[str] = set()
    expressions: set[str] = set()
    exercise_ids: set[str] = set()
    entry_keys = {
        "entry_id", "expression", "concept_ref", "meaning_status", "disposition",
        "domain_spec_type_ref", "owner_route", "exercise_ref"
    }
    valid_dispositions = {"reuse", "specialize", "propose", "open"}
    ds_text = (REPOSITORY_ROOT / "projects/domainspec-v2/definitions/meta-types/meta-types.yml").read_text(encoding="utf-8")
    for index, entry in enumerate(language.get("concept_entries", [])):
        label = f"language.concept_entries[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(entry, entry_keys, label, errors)
        entry_id = entry.get("entry_id")
        expression = entry.get("expression")
        if entry_id in entry_ids:
            errors.append(f"duplicate language entry id: {entry_id}")
        if expression in expressions:
            errors.append(f"duplicate current expression binding: {expression}")
        if isinstance(entry_id, str):
            entry_ids.add(entry_id)
        if isinstance(expression, str):
            expressions.add(expression)
        if entry.get("disposition") not in valid_dispositions:
            errors.append(f"invalid disposition for {entry_id}")
        ds_ref = entry.get("domain_spec_type_ref")
        if ds_ref is not None and f"id: {ds_ref}" not in ds_text:
            errors.append(f"unknown DomainSpec type ref: {ds_ref}")
        if isinstance(entry.get("exercise_ref"), str):
            exercise_ids.add(entry["exercise_ref"])

    discipline_keys = {
        "schema_ref", "schema_version", "discipline_id", "name", "kind_ref", "status",
        "purpose", "language_ref", "practice_steps", "first_consumer_ref", "first_output_ref",
        "first_exercise_ref", "validation_mode", "boundary", "owner_route", "authority_effect"
    }
    exact_keys(discipline, discipline_keys, "discipline", errors)
    if discipline.get("kind_ref") != "CAV2-D50" or discipline.get("status") != "candidate":
        errors.append("discipline must remain a CAV2-D50 candidate")
    if discipline.get("language_ref") != language.get("language_id"):
        errors.append("discipline language_ref does not resolve")
    if discipline.get("discipline_id") == language.get("language_id"):
        errors.append("Language and Discipline identities must remain distinct")
    if not discipline.get("practice_steps"):
        errors.append("discipline requires recurring practice steps")

    example_keys = {
        "schema_ref", "schema_version", "example_id", "title", "status", "language_ref",
        "discipline_ref", "meaning_binding_refs", "edge_refs", "realization_binding_refs",
        "goal", "candidate_mappings", "open_questions", "decision_owner", "blocked_actions",
        "authority_effect"
    }
    exact_keys(example, example_keys, "example", errors)
    if example.get("language_ref") != language.get("language_id"):
        errors.append("example language_ref does not resolve")
    if example.get("discipline_ref") != discipline.get("discipline_id"):
        errors.append("example discipline_ref does not resolve")
    expected_package_refs = {
        "meaning_binding_refs": {"LANG-MEANING-RULE-REVIEW-RECOMMENDATION-001"},
        "edge_refs": {"LANG-EDGE-OFFERS-001", "LANG-EDGE-INFORMS-001"},
        "realization_binding_refs": {"LANG-REALIZATION-RULE-REVIEW-RECOMMENDATION-001"},
    }
    for field, expected_refs in expected_package_refs.items():
        if set(example.get(field, [])) != expected_refs:
            errors.append(f"example {field} does not bind the first meaning package")
    if example.get("example_id") not in exercise_ids or discipline.get("first_exercise_ref") != example.get("example_id"):
        errors.append("first example references do not close")
    mapping_keys = {
        "expression", "business_concept_ref", "domainspec_type_candidates",
        "current_proposition", "disposition", "status"
    }
    for index, mapping in enumerate(example.get("candidate_mappings", [])):
        label = f"example.candidate_mappings[{index}]"
        if not isinstance(mapping, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(mapping, mapping_keys, label, errors)
        if mapping.get("status") not in {"candidate-under-review", "open"}:
            errors.append(f"{label} claims a settled status")
        if mapping.get("disposition") not in valid_dispositions:
            errors.append(f"{label} has an invalid disposition")
        for ds_ref in mapping.get("domainspec_type_candidates", []):
            if f"id: {ds_ref}" not in ds_text:
                errors.append(f"{label} uses unknown DomainSpec type {ds_ref}")
    return concept_ids, exercise_ids


def validate_ontology(
    ontology: dict[str, Any],
    source_ids: set[str],
    required_external_ids: set[str],
    errors: list[str],
) -> tuple[int, int]:
    ontology_keys = {
        "schema_ref", "schema_version", "ontology_id", "ontology_type", "branch",
        "visibility", "status", "authority_effect", "nodes", "relation_vocabulary",
        "relations", "claim_ceiling"
    }
    exact_keys(ontology, ontology_keys, "ontology", errors)
    if ontology.get("ontology_type") != "business-domain" or ontology.get("branch") != "business":
        errors.append("ontology must remain the business-domain business branch")
    node_ids: set[str] = set()
    node_roles: dict[str, str] = {}
    node_keys = {"node_id", "label", "role", "status", "ref", "authority_effect"}
    for index, node in enumerate(ontology.get("nodes", [])):
        label = f"ontology.nodes[{index}]"
        if not isinstance(node, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(node, node_keys, label, errors)
        node_id = node.get("node_id")
        if node_id in node_ids:
            errors.append(f"duplicate ontology node id: {node_id}")
        if isinstance(node_id, str):
            node_ids.add(node_id)
            node_roles[node_id] = str(node.get("role"))
    if not required_external_ids.issubset(node_ids):
        errors.append(f"ontology lacks required nodes: {sorted(required_external_ids - node_ids)}")

    vocab: dict[str, dict[str, Any]] = {}
    vocab_keys = {"relation_type", "meaning", "source_roles", "target_roles"}
    for index, item in enumerate(ontology.get("relation_vocabulary", [])):
        label = f"ontology.relation_vocabulary[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(item, vocab_keys, label, errors)
        relation_type = item.get("relation_type")
        if relation_type in vocab:
            errors.append(f"duplicate relation type: {relation_type}")
        if isinstance(relation_type, str):
            vocab[relation_type] = item

    relation_ids: set[str] = set()
    observed_edges: set[tuple[str, str, str]] = set()
    relation_keys = {
        "relation_id", "type", "source", "target", "owner_route",
        "evidence_refs", "claim_limit", "authority_effect"
    }
    for index, relation in enumerate(ontology.get("relations", [])):
        label = f"ontology.relations[{index}]"
        if not isinstance(relation, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(relation, relation_keys, label, errors)
        relation_id = relation.get("relation_id")
        if relation_id in relation_ids:
            errors.append(f"duplicate relation id: {relation_id}")
        if isinstance(relation_id, str):
            relation_ids.add(relation_id)
        source = relation.get("source")
        target = relation.get("target")
        relation_type = relation.get("type")
        if source not in node_ids or target not in node_ids:
            errors.append(f"relation has unknown endpoint: {relation_id}")
            continue
        observed_edges.add((str(source), str(relation_type), str(target)))
        signature = vocab.get(relation_type)
        if signature is None:
            errors.append(f"relation has unknown type: {relation_id}")
            continue
        if node_roles[source] not in signature.get("source_roles", []):
            errors.append(f"relation source role violates signature: {relation_id}")
        if node_roles[target] not in signature.get("target_roles", []):
            errors.append(f"relation target role violates signature: {relation_id}")
        if not relation.get("evidence_refs"):
            errors.append(f"relation lacks evidence: {relation_id}")
        for evidence_ref in relation.get("evidence_refs", []):
            if evidence_ref not in source_ids:
                errors.append(f"relation uses unknown evidence source {evidence_ref}: {relation_id}")
        require_nonempty(relation.get("owner_route"), f"{label}.owner_route", errors)
        require_nonempty(relation.get("claim_limit"), f"{label}.claim_limit", errors)
    required_edges = {
        ("CA2-PROJECT-SPACE-LANGUAGE", "instance_of", "CAV2-D15"),
        ("CA2-PROJECT-LANGUAGE", "instance_of", "CAV2-D60"),
        ("CA2-GOAL-UBIQUITOUS-LANGUAGE-FIRST-EXAMPLE", "instance_of", "CAV2-D59"),
        ("CA2-DISCIPLINE-UBIQUITOUS-LANGUAGE-PRACTICE", "instance_of", "CAV2-D50"),
        ("CA2-CAND-UBIQUITOUS-LANGUAGE-001", "specializes", "CA2-CAND-LANGUAGE-001"),
        ("CA2-PROJECT-LANGUAGE", "occupies", "CA2-PROJECT-SPACE-LANGUAGE"),
        ("CA2-PROJECT-LANGUAGE", "has_goal", "CA2-GOAL-UBIQUITOUS-LANGUAGE-FIRST-EXAMPLE"),
        ("CA2-PROJECT-SPACE-LANGUAGE", "hosts", "CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS"),
        ("CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS", "applies_within", "CA2-BC-GOVERNANCE"),
        ("CA2-DISCIPLINE-UBIQUITOUS-LANGUAGE-PRACTICE", "maintains", "CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS"),
        ("CA2-DISCIPLINE-UBIQUITOUS-LANGUAGE-PRACTICE", "guides", "CAV2-DEFINE-CAND-001"),
        ("CAV2-DEFINE-PACK-CAND-001", "records_slice_of", "CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS"),
        ("LANG-EX-GOVERNANCE-KERNEL-001", "exercises", "CA2-DISCIPLINE-UBIQUITOUS-LANGUAGE-PRACTICE"),
        ("LANG-EX-GOVERNANCE-KERNEL-001", "uses_language", "CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS"),
    }
    missing_edges = sorted(required_edges - observed_edges)
    if missing_edges:
        errors.append(f"ontology lacks required edges: {missing_edges}")
    return len(node_ids), len(relation_ids)


def validate_kernel_example(
    example: dict[str, Any],
    language: dict[str, Any],
    discipline: dict[str, Any],
    meaning_doc: dict[str, Any],
    edge_doc: dict[str, Any],
    realization_doc: dict[str, Any],
    exercise_ids: set[str],
    errors: list[str],
) -> None:
    example_keys = {
        "schema_ref", "schema_version", "example_id", "title", "status", "language_ref",
        "discipline_ref", "meaning_binding_refs", "edge_refs", "realization_binding_refs",
        "goal", "candidate_mappings", "open_questions", "decision_owner", "blocked_actions",
        "authority_effect"
    }
    exact_keys(example, example_keys, "kernel_example", errors)
    if example.get("example_id") != "LANG-EX-GOVERNANCE-KERNEL-001":
        errors.append("kernel example identity is invalid")
    if example.get("status") != "owner-reviewed":
        errors.append("kernel example must record owner-reviewed candidate language")
    if example.get("language_ref") != language.get("language_id"):
        errors.append("kernel example language_ref does not resolve")
    if example.get("discipline_ref") != discipline.get("discipline_id"):
        errors.append("kernel example discipline_ref does not resolve")
    if example.get("example_id") not in exercise_ids:
        errors.append("kernel example is not referenced by a language entry")

    expected_refs = {
        "meaning_binding_refs": {
            "LANG-MEANING-GOVERNANCE-PROGRAM-001",
            "LANG-MEANING-GOVERNANCE-REQUEST-001",
            "LANG-MEANING-GOVERNANCE-FACT-001",
            "LANG-MEANING-GOVERNANCE-FACT-SET-001",
        },
        "edge_refs": {
            "LANG-EDGE-REQUIRES-FACTS-001",
            "LANG-EDGE-EVALUATED-UNDER-001",
            "LANG-EDGE-CONTAINS-FACT-001",
        },
        "realization_binding_refs": {
            "LANG-REALIZATION-GOVERNANCE-PROGRAM-001",
            "LANG-REALIZATION-GOVERNANCE-REQUEST-001",
            "LANG-REALIZATION-GOVERNANCE-FACT-001",
            "LANG-REALIZATION-GOVERNANCE-FACT-SET-001",
        },
    }
    available_refs = {
        "meaning_binding_refs": {item.get("binding_id") for item in meaning_doc.get("bindings", []) if isinstance(item, dict)},
        "edge_refs": {item.get("edge_id") for item in edge_doc.get("edges", []) if isinstance(item, dict)},
        "realization_binding_refs": {item.get("binding_id") for item in realization_doc.get("bindings", []) if isinstance(item, dict)},
    }
    for field, expected in expected_refs.items():
        observed = set(example.get(field, []))
        if observed != expected:
            errors.append(f"kernel example {field} does not bind the accepted candidate slice")
        unresolved = expected - available_refs[field]
        if unresolved:
            errors.append(f"kernel example {field} uses unknown refs: {sorted(unresolved)}")

    mapping_keys = {
        "expression", "business_concept_ref", "domainspec_type_candidates",
        "current_proposition", "disposition", "status"
    }
    expected_mappings = {
        "Governance Program": ("GovernanceProgram", {"DS-D1.1"}),
        "Governance Request": ("GovernanceRequest", {"DS-D1.2"}),
        "Governance Fact": ("GovernanceFact", {"DS-D1.2"}),
        "Governance Fact Set": ("GovernanceFactSet", {"DS-D1.2"}),
    }
    observed_expressions: set[str] = set()
    for index, mapping in enumerate(example.get("candidate_mappings", [])):
        label = f"kernel_example.candidate_mappings[{index}]"
        if not isinstance(mapping, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(mapping, mapping_keys, label, errors)
        expression = mapping.get("expression")
        if isinstance(expression, str):
            observed_expressions.add(expression)
        expected = expected_mappings.get(str(expression))
        if expected is None:
            errors.append(f"{label} has an unexpected expression")
            continue
        concept_ref, ds_refs = expected
        if mapping.get("business_concept_ref") != concept_ref:
            errors.append(f"{label} concept ref is invalid")
        if set(mapping.get("domainspec_type_candidates", [])) != ds_refs:
            errors.append(f"{label} DomainSpec mapping is invalid")
        if mapping.get("disposition") != "propose" or mapping.get("status") != "candidate-under-review":
            errors.append(f"{label} must remain an owner-reviewed candidate proposal")
        require_nonempty(mapping.get("current_proposition"), f"{label}.current_proposition", errors)
    if observed_expressions != set(expected_mappings):
        errors.append("kernel example does not cover Program, Request, Fact, and Fact Set exactly")


def validate_authority_bindings(
    authority_doc: dict[str, Any],
    language_id: Any,
    source_ids: set[str],
    errors: list[str],
) -> int:
    exact_keys(
        authority_doc,
        {"schema_ref", "schema_version", "language_ref", "bindings"},
        "authority_bindings",
        errors,
    )
    if authority_doc.get("schema_version") != "cav2-language-authority-bindings/v1":
        errors.append("authority bindings schema_version is invalid")
    if authority_doc.get("language_ref") != language_id:
        errors.append("authority bindings language_ref does not resolve")
    binding_keys = {
        "binding_id", "concept_ref", "candidate_authority_kind",
        "possible_promoted_authority_kind", "authority_function",
        "governing_definition_refs", "source_refs", "allowed_use", "blocked_use",
        "required_separations", "authority_effect"
    }
    expected_classification = {
        "GovernanceProgram": ("kind.projection", "kind.runtime_contract"),
        "GovernanceRequest": (None, None),
        "GovernanceFact": (None, None),
        "GovernanceFactSet": (None, None),
    }
    observed: set[str] = set()
    binding_ids: set[str] = set()
    for index, binding in enumerate(authority_doc.get("bindings", [])):
        label = f"authority_bindings.bindings[{index}]"
        if not isinstance(binding, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(binding, binding_keys, label, errors)
        binding_id = binding.get("binding_id")
        if binding_id in binding_ids:
            errors.append(f"duplicate authority binding id: {binding_id}")
        if isinstance(binding_id, str):
            binding_ids.add(binding_id)
        concept_ref = binding.get("concept_ref")
        if isinstance(concept_ref, str):
            observed.add(concept_ref)
        classification = expected_classification.get(str(concept_ref))
        if classification is None:
            errors.append(f"{label} has an unexpected concept_ref")
        elif (binding.get("candidate_authority_kind"), binding.get("possible_promoted_authority_kind")) != classification:
            errors.append(f"{label} authority-kind classification is invalid")
        if not {"CAV2-D34", "CAV2-D41"}.issubset(set(binding.get("governing_definition_refs", []))):
            errors.append(f"{label} must bind Authority and Authority Model")
        for source_ref in binding.get("source_refs", []):
            if source_ref not in source_ids:
                errors.append(f"{label} uses unknown source {source_ref}")
        for field in ("authority_function", "allowed_use", "blocked_use"):
            require_nonempty(binding.get(field), f"{label}.{field}", errors)
        if not binding.get("required_separations"):
            errors.append(f"{label} requires explicit non-collapse boundaries")
    if observed != set(expected_classification):
        errors.append("authority bindings must cover Program, Request, Fact, and Fact Set exactly")
    return len(binding_ids)


def validate_meaning_package(
    meaning_doc: dict[str, Any],
    edge_doc: dict[str, Any],
    realization_doc: dict[str, Any],
    language_id: Any,
    errors: list[str],
) -> tuple[int, int, int]:
    exact_keys(
        meaning_doc,
        {"schema_ref", "schema_version", "language_ref", "bindings"},
        "meaning_bindings",
        errors,
    )
    exact_keys(
        edge_doc,
        {"schema_ref", "schema_version", "language_ref", "edges", "known_conflicts"},
        "edge_vocabulary",
        errors,
    )
    exact_keys(
        realization_doc,
        {"schema_ref", "schema_version", "language_ref", "bindings"},
        "realization_bindings",
        errors,
    )
    for label, document in (
        ("meaning_bindings", meaning_doc),
        ("edge_vocabulary", edge_doc),
        ("realization_bindings", realization_doc),
    ):
        if document.get("language_ref") != language_id:
            errors.append(f"{label}.language_ref does not resolve")

    meaning_keys = {
        "binding_id", "concept_ref", "expression_ref", "status",
        "business_meaning", "domain_meaning", "product_meaning",
        "system_realization_ref", "noncollapse_rule", "owner_route",
        "authority_effect"
    }
    meaning_ids: set[str] = set()
    realization_refs: set[str] = set()
    for index, binding in enumerate(meaning_doc.get("bindings", [])):
        label = f"meaning_bindings.bindings[{index}]"
        if not isinstance(binding, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(binding, meaning_keys, label, errors)
        binding_id = binding.get("binding_id")
        if binding_id in meaning_ids:
            errors.append(f"duplicate meaning binding id: {binding_id}")
        if isinstance(binding_id, str):
            meaning_ids.add(binding_id)
        if binding.get("status") != "candidate":
            errors.append(f"{label} must remain candidate")
        expected_terms_by_concept = {
            "RuleReviewRecommendation": {
                "business_meaning": "Recommendation",
                "domain_meaning": "Rule Review Recommendation",
                "product_meaning": "Decision Support Output",
            },
            "GovernanceProgram": {
                "business_meaning": "Governance Program",
                "domain_meaning": "Governance Program",
                "product_meaning": "Governance Program",
            },
            "GovernanceRequest": {
                "business_meaning": "Governance Request",
                "domain_meaning": "Governance Request",
                "product_meaning": "Governance Request",
            },
            "GovernanceFact": {
                "business_meaning": "Governance Fact",
                "domain_meaning": "Governance Fact",
                "product_meaning": "Governance Fact",
            },
            "GovernanceFactSet": {
                "business_meaning": "Governance Fact Set",
                "domain_meaning": "Governance Fact Set",
                "product_meaning": "Governance Fact Set",
            },
        }
        expected_terms = expected_terms_by_concept.get(str(binding.get("concept_ref")))
        if expected_terms is None:
            errors.append(f"{label} uses an unexpected concept_ref")
            expected_terms = {}
        for field, expected_term in expected_terms.items():
            value = binding.get(field, {})
            exact_keys(value, {"term", "definition"}, f"{label}.{field}", errors)
            if value.get("term") != expected_term:
                errors.append(f"{label}.{field}.term must be {expected_term}")
            require_nonempty(value.get("definition"), f"{label}.{field}.definition", errors)
        if "direct translation" not in str(binding.get("noncollapse_rule")):
            errors.append(f"{label} must state the no-direct-translation boundary")
        realization_ref = binding.get("system_realization_ref")
        if isinstance(realization_ref, str):
            realization_refs.add(realization_ref)

    realization_keys = {
        "binding_id", "concept_ref", "status", "selected_domainspec_type_ref",
        "semantic_equivalence", "candidates", "decision_question", "decision_owner",
        "blocked_effects", "authority_effect"
    }
    realization_ids: set[str] = set()
    ds_text = (REPOSITORY_ROOT / "projects/domainspec-v2/definitions/meta-types/meta-types.yml").read_text(encoding="utf-8")
    for index, binding in enumerate(realization_doc.get("bindings", [])):
        label = f"realization_bindings.bindings[{index}]"
        if not isinstance(binding, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(binding, realization_keys, label, errors)
        binding_id = binding.get("binding_id")
        if binding_id in realization_ids:
            errors.append(f"duplicate realization binding id: {binding_id}")
        if isinstance(binding_id, str):
            realization_ids.add(binding_id)
        if binding.get("semantic_equivalence") is not False:
            errors.append(f"{label} must not claim semantic equivalence")
        if binding.get("status") == "open" and binding.get("selected_domainspec_type_ref") is not None:
            errors.append(f"{label} open realization cannot select a DomainSpec type")
        candidate_refs: set[str] = set()
        for candidate_index, candidate in enumerate(binding.get("candidates", [])):
            candidate_label = f"{label}.candidates[{candidate_index}]"
            exact_keys(candidate, {"domainspec_type_ref", "label", "fit_condition"}, candidate_label, errors)
            ds_ref = candidate.get("domainspec_type_ref")
            if isinstance(ds_ref, str):
                candidate_refs.add(ds_ref)
                if f"id: {ds_ref}" not in ds_text:
                    errors.append(f"{candidate_label} uses unknown DomainSpec type {ds_ref}")
            require_nonempty(candidate.get("fit_condition"), f"{candidate_label}.fit_condition", errors)
        if binding.get("concept_ref") == "RuleReviewRecommendation" and candidate_refs != {"DS-D1.1", "DS-D1.2"}:
            errors.append("RuleReviewRecommendation realization must preserve Entity and Value Object candidates")
        selected_ref = binding.get("selected_domainspec_type_ref")
        if binding.get("status") == "selected" and selected_ref not in candidate_refs:
            errors.append(f"{label} selected DomainSpec type is not one of its candidates")
        expected_selected = {
            "GovernanceProgram": "DS-D1.1",
            "GovernanceRequest": "DS-D1.2",
            "GovernanceFact": "DS-D1.2",
            "GovernanceFactSet": "DS-D1.2",
        }
        concept_ref = binding.get("concept_ref")
        if concept_ref in expected_selected:
            if binding.get("status") != "selected" or selected_ref != expected_selected[concept_ref]:
                errors.append(f"{label} does not preserve the accepted candidate semantic mapping")
    unresolved_realizations = sorted(realization_refs - realization_ids)
    if unresolved_realizations:
        errors.append(f"meaning bindings use unknown realization refs: {unresolved_realizations}")

    edge_keys = {
        "edge_id", "verb", "source_concept", "target_concept", "business_sentence",
        "product_consequence", "noncollapse_witness", "domainspec_relationship_ref",
        "adoption_status", "owner_route", "authority_effect"
    }
    edge_ids: set[str] = set()
    verbs: set[str] = set()
    for index, edge in enumerate(edge_doc.get("edges", [])):
        label = f"edge_vocabulary.edges[{index}]"
        if not isinstance(edge, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(edge, edge_keys, label, errors)
        edge_id = edge.get("edge_id")
        if edge_id in edge_ids:
            errors.append(f"duplicate edge id: {edge_id}")
        if isinstance(edge_id, str):
            edge_ids.add(edge_id)
        if isinstance(edge.get("verb"), str):
            verbs.add(edge["verb"])
        if edge.get("adoption_status") != "proposed":
            errors.append(f"{label} must remain proposed in the first exercise")
        if edge.get("domainspec_relationship_ref") is not None:
            errors.append(f"{label} cannot claim an earned DomainSpec relation yet")
        for field in ("business_sentence", "product_consequence", "noncollapse_witness"):
            require_nonempty(edge.get(field), f"{label}.{field}", errors)
    if not {"offers", "informs"}.issubset(verbs):
        errors.append("edge vocabulary must include proposed offers and informs verbs")

    conflict_keys = {
        "conflict_id", "term", "status", "statement", "owner_route",
        "next_action", "authority_effect"
    }
    produces_conflict = False
    for index, conflict in enumerate(edge_doc.get("known_conflicts", [])):
        label = f"edge_vocabulary.known_conflicts[{index}]"
        if not isinstance(conflict, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(conflict, conflict_keys, label, errors)
        if conflict.get("term") == "produces" and conflict.get("status") == "open":
            produces_conflict = True
    if not produces_conflict:
        errors.append("edge vocabulary must preserve the open produces collision")

    return len(meaning_ids), len(edge_ids), len(realization_ids)


def validate_craft_surface(errors: list[str]) -> None:
    ledger_path = PACKAGE_ROOT / ".craft/ledger.yml"
    index_path = PACKAGE_ROOT / ".craft/index.json"
    view_path = PACKAGE_ROOT / "CRAFT.md"
    try:
        ledger_text = ledger_path.read_text(encoding="utf-8")
        index = json.loads(index_path.read_text(encoding="utf-8"))
        view_text = view_path.read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load Craft surface: {exc}")
        return
    required_ledger_markers = (
        "ledger_id: craft.cav2.language_project",
        "  by_id:",
        "  open_decisions:",
        "  blocking_decisions:",
        "  active_blockers:",
        "  active_gaps:",
        "  next_moves:",
        "  artifacts_by_path:",
        "DEC-LANGUAGE-REALIZATION-001",
        "GAP-LANGUAGE-PRODUCES-001",
        "CTX-LANGUAGE-GOVERNANCE-KERNEL",
        "GAP-LANGUAGE-KERNEL-RUNTIME-001",
        "ART-LANGUAGE-AUTHORITY",
    )
    for marker in required_ledger_markers:
        if marker not in ledger_text:
            errors.append(f"Craft ledger lacks required marker: {marker}")
    if ".craft/ledger.yml" not in view_text or "## Boundary" not in view_text:
        errors.append("CRAFT.md must link its source ledger and state its boundary")
    if not isinstance(index, dict):
        errors.append("Craft index must be one JSON object")
        return
    metadata = index.get("metadata", {})
    if metadata.get("ledger_sha256") != sha256_bytes(ledger_path.read_bytes()):
        errors.append("Craft index ledger_sha256 does not match the current ledger")
    required_index_ids = {
        "CTX-LANGUAGE-GOVERNANCE-KERNEL",
        "DEF-LANGUAGE-GOVERNANCE-PROGRAM-001",
        "DEF-LANGUAGE-GOVERNANCE-REQUEST-001",
        "DEF-LANGUAGE-GOVERNANCE-FACT-001",
        "DEF-LANGUAGE-GOVERNANCE-FACT-SET-001",
        "GAP-LANGUAGE-KERNEL-RUNTIME-001",
        "ART-LANGUAGE-AUTHORITY",
        "ART-LANGUAGE-KERNEL-EXAMPLE",
    }
    missing_index_ids = sorted(required_index_ids - set(index.get("by_id", {})))
    if missing_index_ids:
        errors.append(f"Craft index lacks kernel-language ids: {missing_index_ids}")


def validate_residue(residue_doc: dict[str, Any], errors: list[str]) -> int:
    exact_keys(residue_doc, {"schema_ref", "schema_version", "residue"}, "residue", errors)
    residue_ids: set[str] = set()
    residue_keys = {"residue_id", "status", "kind", "statement", "owner_route", "next_action"}
    for index, item in enumerate(residue_doc.get("residue", [])):
        label = f"residue[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(item, residue_keys, label, errors)
        residue_id = item.get("residue_id")
        if residue_id in residue_ids:
            errors.append(f"duplicate residue id: {residue_id}")
        if isinstance(residue_id, str):
            residue_ids.add(residue_id)
        if item.get("status") not in {"open", "blocked", "resolved", "superseded"}:
            errors.append(f"invalid residue status: {residue_id}")
        require_nonempty(item.get("owner_route"), f"{label}.owner_route", errors)
        require_nonempty(item.get("next_action"), f"{label}.next_action", errors)
    return len(residue_ids)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()

    errors: list[str] = []
    profile = load("profile.json", errors)
    project = load("project.json", errors)
    goal = load("goals/ubiquitous-language-first-example.goal.json", errors)
    concepts = load("concepts.json", errors)
    meanings = load("meaning-bindings.json", errors)
    edge_vocabulary = load("edge-vocabulary.json", errors)
    realizations = load("realization-bindings.json", errors)
    authority_bindings = load("authority-bindings.json", errors)
    language = load("languages/governance-ubiquitous-language.json", errors)
    discipline = load("disciplines/ubiquitous-language-practice.json", errors)
    example = load("examples/governance-policy-resolution.json", errors)
    kernel_example = load("examples/governance-evaluation-kernel-language.json", errors)
    ontology = load("ontology/language-project.json", errors)
    sources_doc = load("sources.json", errors)
    residue = load("residue.json", errors)
    schema = load("schemas/language-project.schema.json", errors)
    meaning_schema = load("schemas/meaning-package.schema.json", errors)
    validate_closed_schema_declarations(schema, "schema", errors)
    validate_closed_schema_declarations(meaning_schema, "meaning_schema", errors)

    profile_keys = {
        "schema_ref", "schema_version", "package_id", "package_root", "package_owner",
        "project_ref", "project_space", "ontology_type", "visibility", "status",
        "authority_effect", "definition_authority", "source_registry", "ontology_view",
        "meaning_registry", "edge_vocabulary", "realization_registry", "authority_registry", "craft_ledger",
        "craft_view", "schema_path", "validator_path", "blocked_effects"
    }
    exact_keys(profile, profile_keys, "profile", errors)
    if profile.get("package_root") != "cyberAlchemy-v2/language":
        errors.append("profile package_root is invalid")
    require_nonempty(profile.get("package_owner"), "profile.package_owner", errors)
    if profile.get("visibility") != "private" or profile.get("status") != "candidate":
        errors.append("profile must remain private and candidate")
    project_space = profile.get("project_space", {})
    exact_keys(project_space, {"project_space_id", "concept_ref", "path", "role"}, "profile.project_space", errors)
    if project_space.get("project_space_id") == profile.get("project_ref"):
        errors.append("Project and Project Space must have distinct identities")
    if project_space.get("concept_ref") != "CAV2-D15" or project_space.get("path") != "cyberAlchemy-v2/language":
        errors.append("Project Space binding is invalid")
    if profile.get("project_ref") != project.get("project_id"):
        errors.append("profile project_ref does not resolve")
    profile_paths = {
        "meaning_registry": "meaning-bindings.json",
        "edge_vocabulary": "edge-vocabulary.json",
        "realization_registry": "realization-bindings.json",
        "authority_registry": "authority-bindings.json",
        "craft_ledger": ".craft/ledger.yml",
        "craft_view": "CRAFT.md",
    }
    for field, expected_path in profile_paths.items():
        if profile.get(field) != expected_path:
            errors.append(f"profile {field} must be {expected_path}")

    required_schema_defs = {
        "profile", "project", "goal", "conceptRegistry", "language", "discipline",
        "example", "sourceRegistry", "residueRegistry", "ontology"
    }
    if not required_schema_defs.issubset(set(schema.get("$defs", {}))):
        errors.append("schema lacks required definitions")
    required_meaning_schema_defs = {
        "meaningRegistry", "namedMeaning", "edgeRegistry", "realizationRegistry",
        "authorityBindingRegistry"
    }
    if not required_meaning_schema_defs.issubset(set(meaning_schema.get("$defs", {}))):
        errors.append("meaning package schema lacks required definitions")

    source_ids, locator_only = validate_sources(sources_doc, errors)
    _, condition_ids = validate_project_goal(project, goal, source_ids, errors)
    concept_ids, exercise_ids = validate_concepts_language_discipline_example(
        concepts, language, discipline, example, source_ids, errors
    )
    meaning_count, edge_count, realization_count = validate_meaning_package(
        meanings, edge_vocabulary, realizations, language.get("language_id"), errors
    )
    validate_kernel_example(
        kernel_example, language, discipline, meanings, edge_vocabulary,
        realizations, exercise_ids, errors
    )
    authority_binding_count = validate_authority_bindings(
        authority_bindings, language.get("language_id"), source_ids, errors
    )
    validate_craft_surface(errors)
    required_nodes = {
        "CAV2-D15", "CAV2-D50", "CAV2-D59", "CAV2-D60",
        profile.get("project_ref"), project_space.get("project_space_id"), goal.get("goal_id"),
        language.get("language_id"), discipline.get("discipline_id"), example.get("example_id"),
        kernel_example.get("example_id"),
        "CAV2-DEFINE-CAND-001", "CAV2-DEFINE-PACK-CAND-001",
        *concept_ids,
    }
    ontology_nodes, ontology_relations = validate_ontology(ontology, source_ids, required_nodes, errors)
    residue_count = validate_residue(residue, errors)

    for label, value in (
        ("profile", profile), ("project", project), ("goal", goal), ("concepts", concepts),
        ("language", language), ("discipline", discipline), ("example", example),
        ("kernel_example", kernel_example),
        ("ontology", ontology), ("meanings", meanings), ("edge_vocabulary", edge_vocabulary),
        ("realizations", realizations), ("authority_bindings", authority_bindings)
    ):
        check_authority(value, label, errors)

    digest = material_digest(errors)
    result = {
        "schema_version": "cav2-language-project-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/language",
        "material_digest": digest,
        "counts": {
            "sources": len(source_ids),
            "locator_only_sources": locator_only,
            "projects": 1,
            "project_spaces": 1,
            "goals": 1,
            "success_conditions": len(condition_ids),
            "concept_candidates": len(concept_ids),
            "meaning_bindings": meaning_count,
            "candidate_edges": edge_count,
            "realization_bindings": realization_count,
            "authority_bindings": authority_binding_count,
            "languages": 1,
            "discipline_candidates": 1,
            "examples": 2,
            "ontology_nodes": ontology_nodes,
            "ontology_relations": ontology_relations,
            "open_residue": residue_count,
        },
        "checks": [
        "closed-record-shapes",
        "closed-schema-required-property-closure",
            "source-currency-and-locators",
            "project-project-space-non-collapse",
            "project-goal-closure",
            "definition-three-voice-completeness",
            "language-discipline-non-collapse",
            "bounded-context-and-community",
            "define-disposition-preservation",
            "business-product-system-meaning-noncollapse",
            "cyberalchemy-authority-model-noncollapse",
            "earned-edge-evidence-shape",
            "open-realization-preservation",
            "ontology-endpoint-and-signature-closure",
            "authority-effect-none",
            "craft-ledger-and-view-surface",
            "visible-owner-routed-residue",
        ],
        "claim_ceiling": "Candidate package structure only; no canonical definition, discipline admission, shared-understanding proof, Definition Pack acceptance, Runtime Contract acceptance, FormalClaim admission, implementation or enforcement authority, publication, or deployment.",
        "authority_effect": "none",
        "errors": errors,
    }

    if args.write_receipt and not errors:
        receipt = dict(result)
        receipt["validated_at"] = datetime.now(timezone.utc).isoformat()
        receipts = PACKAGE_ROOT / "receipts"
        receipts.mkdir(exist_ok=True)
        receipt_path = receipts / f"validation-{digest[:16]}.json"
        if not receipt_path.exists():
            receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        result["receipt_path"] = str(receipt_path.relative_to(REPOSITORY_ROOT))

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
