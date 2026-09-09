#!/usr/bin/env python3
"""Validate the private Language Runtime product ontology without side effects by default."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[5]

MATERIAL_FILES = (
    "README.md",
    "profile.json",
    "sources.json",
    "definitions.json",
    "nodes.json",
    "relations.json",
    "residue.json",
    "schema-amendment.json",
    "views/business-view.json",
    "views/system-view.json",
    "views/bridge-view.json",
    "schemas/language-runtime-product-ontology.schema.json",
    "scripts/validate.py",
    "tests/test_negative_mutations.py",
)

PROFILE_KEYS = {
    "schema_ref", "schema_version", "ontology_id", "title", "ontology_type",
    "branches", "bridge", "materialization", "package_root", "package_owner",
    "business_meaning_owner", "system_design_owner", "visibility",
    "candidate_status", "implementation_state", "authority_effect",
    "source_registry", "definition_registry", "node_registry", "relation_registry", "residue_registry",
    "business_view", "system_view", "bridge_view", "schema_path",
    "schema_amendment", "validator_path", "blocked_outputs",
}
SOURCE_KEYS = {"id", "branch", "path", "sha256", "posture", "owner_route"}
DEFINITION_KEYS = {
    "id", "term", "subject_ref", "definition_status", "authority_kind_ref",
    "formal_voice", "plain_language_voice", "domain_context_voice",
    "operational_interpretation", "forbidden_collapse", "source_refs",
    "owner_route", "authority_effect",
}
FORMAL_VOICE_KEYS = {
    "normative_candidate", "expression", "symbols", "boundary_conditions",
}
SYMBOL_KEYS = {"symbol", "meaning"}
NODE_KEYS = {
    "id", "label", "branch", "role", "plain_language", "claim", "scope",
    "source_refs", "owner_route", "candidate_status", "evidence_confidence",
    "commitment_confidence", "implementation_state", "authority_effect",
    "forbidden_collapse", "open_questions",
}
VOCAB_KEYS = {
    "id", "label", "source_branches", "target_branches", "plain_language",
    "forbidden_collapse",
}
RELATION_KEYS = {
    "id", "type", "source", "target", "direction", "owner_route",
    "source_refs", "authority_effect", "claim_limit",
}
RESIDUE_KEYS = {
    "id", "label", "description", "status", "owner_route", "next_action",
    "subject_refs", "source_refs",
}
VIEW_KEYS = {
    "schema_ref", "schema_version", "view_id", "view_kind", "node_refs",
    "relation_refs", "claim_ceiling",
}
SCHEMA_AMENDMENT_KEYS = {
    "schema_ref", "schema_version", "amendment_id", "status", "owner_route",
    "scope", "reason", "changed_shape", "compatibility_effect", "witness",
    "rollout_route", "rollback_route", "authority_effect",
}

BUSINESS_ROLES = {
    "project", "goal", "language", "discipline", "capability",
    "product_output", "business_rule", "business_concept", "outcome", "example",
}
SYSTEM_ROLES = {
    "component", "aggregate", "state_store", "store", "record", "view_model", "engine",
    "interface", "artifact", "emitter",
}

CLAIM_CEILING = (
    "Candidate business-system bridge and system decomposition only; no upstream "
    "product-ontology acceptance, canonical definition, Discipline admission, "
    "Definition Pack acceptance, Runtime Contract acceptance, implementation, "
    "runtime conformance, Goal achievement, publication, or deployment."
)


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


def unique(values: list[Any], label: str, errors: list[str]) -> None:
    strings = [value for value in values if isinstance(value, str)]
    duplicates = sorted({value for value in strings if strings.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def check_nonempty(value: Any, label: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")


def validate_closed_schema_declarations(value: Any, label: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        if value.get("type") == "object" and value.get("additionalProperties") is False:
            required = value.get("required", [])
            properties = value.get("properties", {})
            if isinstance(required, list) and isinstance(properties, dict):
                missing = sorted(set(required) - set(properties))
                if missing:
                    errors.append(f"{label} requires undeclared properties: {', '.join(missing)}")
        for key, child in value.items():
            validate_closed_schema_declarations(child, f"{label}.{key}", errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            validate_closed_schema_declarations(child, f"{label}[{index}]", errors)


def check_refs(
    refs: Any,
    source_by_id: dict[str, dict[str, Any]],
    source_text_by_id: dict[str, str],
    label: str,
    errors: list[str],
) -> set[str]:
    branches: set[str] = set()
    if not isinstance(refs, list) or not refs:
        errors.append(f"{label} must contain source_refs")
        return branches
    for index, ref in enumerate(refs):
        ref_label = f"{label}.source_refs[{index}]"
        if not isinstance(ref, dict) or set(ref) != {"source_id", "selector"}:
            errors.append(f"{ref_label} has an invalid shape")
            continue
        source_id = ref.get("source_id")
        selector = ref.get("selector")
        if source_id not in source_by_id:
            errors.append(f"{ref_label} uses unknown source {source_id!r}")
            continue
        if not isinstance(selector, str) or not selector:
            errors.append(f"{ref_label} selector must be non-empty")
            continue
        if selector not in source_text_by_id.get(str(source_id), ""):
            errors.append(f"{ref_label} selector does not resolve: {selector!r}")
        branch = source_by_id[str(source_id)].get("branch")
        if isinstance(branch, str):
            branches.add(branch)
    return branches


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


def validate_package() -> dict[str, Any]:
    errors: list[str] = []
    profile = load("profile.json", errors)
    sources_doc = load("sources.json", errors)
    definitions_doc = load("definitions.json", errors)
    nodes_doc = load("nodes.json", errors)
    relations_doc = load("relations.json", errors)
    residue_doc = load("residue.json", errors)
    schema_amendment = load("schema-amendment.json", errors)
    schema = load("schemas/language-runtime-product-ontology.schema.json", errors)
    views = {
        "business": load("views/business-view.json", errors),
        "system": load("views/system-view.json", errors),
        "bridge": load("views/bridge-view.json", errors),
    }

    exact_keys(profile, PROFILE_KEYS, "profile", errors)
    expected_profile = {
        "schema_version": "cav2-language-runtime-product-ontology-profile/v1",
        "ontology_id": "cav2.language-runtime-product-bridge",
        "ontology_type": "business-system-bridge",
        "branches": ["business", "system"],
        "bridge": "business-system",
        "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/language/runtime/ontology",
        "package_owner": "CyberAlchemy v2 Language Project owner",
        "visibility": "private",
        "candidate_status": "candidate",
        "implementation_state": "not-implemented",
        "authority_effect": "none",
        "definition_registry": "definitions.json",
        "schema_amendment": "schema-amendment.json",
    }
    for field, expected in expected_profile.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must equal {expected!r}")
    if "unresolved" not in str(profile.get("system_design_owner", "")):
        errors.append("profile must preserve unresolved system-design ownership")

    required_defs = {
        "profile", "sourceRef", "sourceRegistry", "candidateDefinitionRegistry",
        "nodeRegistry", "relationRegistry", "residueRegistry", "view",
        "schemaAmendmentWitness", "validationReceipt",
    }
    if not required_defs.issubset(set(schema.get("$defs", {}))):
        errors.append("schema lacks required package definitions")
    validate_closed_schema_declarations(schema, "schema", errors)

    exact_keys(sources_doc, {"schema_ref", "schema_version", "sources"}, "sources", errors)
    if sources_doc.get("schema_version") != "cav2-language-runtime-product-ontology-sources/v1":
        errors.append("sources schema_version is invalid")
    sources = sources_doc.get("sources", [])
    if not isinstance(sources, list) or not sources:
        errors.append("sources must be a non-empty list")
        sources = []
    source_by_id: dict[str, dict[str, Any]] = {}
    source_text_by_id: dict[str, str] = {}
    for index, source in enumerate(sources):
        label = f"sources[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(source, SOURCE_KEYS, label, errors)
        source_id = source.get("id")
        if not isinstance(source_id, str) or not source_id:
            errors.append(f"{label}.id must be non-empty")
            continue
        if source_id in source_by_id:
            errors.append(f"duplicate source id: {source_id}")
        source_by_id[source_id] = source
        if source.get("branch") not in {"business", "system", "mixed"}:
            errors.append(f"{label}.branch is invalid")
        relative_path = source.get("path")
        if not isinstance(relative_path, str) or Path(relative_path).is_absolute() or ".." in Path(str(relative_path)).parts:
            errors.append(f"{label}.path must be repository-relative")
            continue
        if not relative_path.startswith(("cyberAlchemy-v2/", "arcanum/")):
            errors.append(f"{label}.path is outside allowed private/public source roots")
            continue
        path = REPOSITORY_ROOT / relative_path
        if not path.is_file():
            errors.append(f"{label} source is missing: {relative_path}")
            continue
        raw = path.read_bytes()
        observed = hashlib.sha256(raw).hexdigest()
        if observed != source.get("sha256"):
            errors.append(f"{label} source digest drift: {relative_path}")
        try:
            source_text_by_id[source_id] = raw.decode("utf-8")
        except UnicodeDecodeError:
            errors.append(f"{label} source is not UTF-8 text")
        check_nonempty(source.get("posture"), f"{label}.posture", errors)
        check_nonempty(source.get("owner_route"), f"{label}.owner_route", errors)

    exact_fixture_source = source_by_id.get("SRC-LRPO-GOVERNANCE-POLICY-EXERCISE", {})
    if exact_fixture_source.get("path") != "cyberAlchemy-v2/language/examples/governance-policy-resolution.json":
        errors.append("first Experiment Frame must bind the exact Governance Policy exercise source")
    required_language_sources = {
        "SRC-LRPO-GOVERNANCE-LANGUAGE",
        "SRC-LRPO-LANGUAGE-MEANING-BINDINGS",
        "SRC-LRPO-LANGUAGE-REALIZATION-BINDINGS",
        "SRC-LRPO-LANGUAGE-EDGE-VOCABULARY",
        "SRC-LRPO-LANGUAGE-AUTHORITY-BINDINGS",
    }
    missing_language_sources = sorted(required_language_sources - set(source_by_id))
    if missing_language_sources:
        errors.append(
            "missing Language Context sources: " + ", ".join(missing_language_sources)
        )

    exact_keys(nodes_doc, {"schema_ref", "schema_version", "nodes"}, "nodes", errors)
    if nodes_doc.get("schema_version") != "cav2-language-runtime-product-ontology-nodes/v1":
        errors.append("nodes schema_version is invalid")
    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("nodes must be a non-empty list")
        nodes = []
    node_by_id: dict[str, dict[str, Any]] = {}
    for index, node in enumerate(nodes):
        label = f"nodes[{index}]"
        if not isinstance(node, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(node, NODE_KEYS, label, errors)
        node_id = node.get("id")
        if not isinstance(node_id, str) or not node_id:
            errors.append(f"{label}.id must be non-empty")
            continue
        if node_id in node_by_id:
            errors.append(f"duplicate node id: {node_id}")
        node_by_id[node_id] = node
        branch = node.get("branch")
        role = node.get("role")
        if branch == "business":
            if role not in BUSINESS_ROLES:
                errors.append(f"{label} business node has invalid role {role!r}")
            if node.get("implementation_state") != "not-applicable":
                errors.append(f"{label} business node implementation_state must be not-applicable")
        elif branch == "system":
            if role not in SYSTEM_ROLES:
                errors.append(f"{label} system node has invalid role {role!r}")
            if node.get("implementation_state") != "not-implemented":
                errors.append(f"{label} system node must remain not-implemented")
        else:
            errors.append(f"{label} branch is invalid")
        if node.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        check_refs(node.get("source_refs"), source_by_id, source_text_by_id, label, errors)

    expected_node_roles = {
        "LANG-EX-GOVERNANCE-POLICY-001": "example",
        "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT": "capability",
        "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW": "product_output",
        "CA2-RULE-DEFINE-LANGUAGE-APPLICATION": "business_rule",
        "CA2-RULE-REVIEW-BEFORE-CANDIDATE-EMISSION": "business_rule",
        "CA2-SYS-LANGUAGE-RUNTIME": "component",
        "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL": "component",
        "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE": "artifact",
        "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME": "artifact",
        "CA2-SYS-LANGUAGE-SESSION": "aggregate",
        "CA2-SYS-LANGUAGE-SESSION-STATE": "state_store",
        "CA2-SYS-LANGUAGE-SESSION-STORE": "store",
        "CA2-SYS-LANGUAGE-SESSION-COMMAND": "record",
        "CA2-SYS-LANGUAGE-QUESTION-RECORD": "record",
        "CA2-SYS-LANGUAGE-QUESTION-VIEW": "view_model",
        "CA2-SYS-LANGUAGE-ANSWER-RECORD": "record",
        "CA2-SYS-LANGUAGE-INTERACTIVE-CLI": "interface",
        "CA2-SYS-LANGUAGE-CHAT-QUESTION-VIEW": "interface",
        "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-PREVIEW": "artifact",
        "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-EMITTER": "emitter",
    }
    for node_id, role in expected_node_roles.items():
        if node_by_id.get(node_id, {}).get("role") != role:
            errors.append(f"required node {node_id} must have role {role}")

    exact_keys(
        definitions_doc,
        {"schema_ref", "schema_version", "authority_posture", "definitions"},
        "definitions",
        errors,
    )
    if definitions_doc.get("schema_version") != "cav2-language-runtime-product-ontology-candidate-definitions/v1":
        errors.append("definitions schema_version is invalid")
    if definitions_doc.get("authority_posture") != "ontology-candidate-not-canonical":
        errors.append("definitions must remain ontology candidates, not canonical authority")
    definitions = definitions_doc.get("definitions", [])
    if not isinstance(definitions, list) or not definitions:
        errors.append("definitions must be a non-empty list")
        definitions = []
    definition_ids: list[str] = []
    definition_subjects: list[str] = []
    definition_by_subject: dict[str, dict[str, Any]] = {}
    for index, definition in enumerate(definitions):
        label = f"definitions[{index}]"
        if not isinstance(definition, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(definition, DEFINITION_KEYS, label, errors)
        definition_id = definition.get("id")
        subject_ref = definition.get("subject_ref")
        if isinstance(definition_id, str):
            definition_ids.append(definition_id)
        else:
            errors.append(f"{label}.id must be a string")
        if isinstance(subject_ref, str):
            definition_subjects.append(subject_ref)
            definition_by_subject[subject_ref] = definition
            if subject_ref not in node_by_id:
                errors.append(f"{label} has unknown subject_ref {subject_ref!r}")
        else:
            errors.append(f"{label}.subject_ref must be a string")
        if definition.get("definition_status") != "candidate":
            errors.append(f"{label} must remain candidate")
        if definition.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        formal_voice = definition.get("formal_voice")
        if not isinstance(formal_voice, dict):
            errors.append(f"{label}.formal_voice must be an object")
        else:
            exact_keys(formal_voice, FORMAL_VOICE_KEYS, f"{label}.formal_voice", errors)
            for field in ("normative_candidate", "expression"):
                check_nonempty(formal_voice.get(field), f"{label}.formal_voice.{field}", errors)
            symbols = formal_voice.get("symbols", [])
            if not isinstance(symbols, list):
                errors.append(f"{label}.formal_voice.symbols must be a list")
            else:
                for symbol_index, symbol in enumerate(symbols):
                    symbol_label = f"{label}.formal_voice.symbols[{symbol_index}]"
                    if not isinstance(symbol, dict):
                        errors.append(f"{symbol_label} must be an object")
                        continue
                    exact_keys(symbol, SYMBOL_KEYS, symbol_label, errors)
                    check_nonempty(symbol.get("symbol"), f"{symbol_label}.symbol", errors)
                    check_nonempty(symbol.get("meaning"), f"{symbol_label}.meaning", errors)
            conditions = formal_voice.get("boundary_conditions", [])
            if not isinstance(conditions, list) or not conditions:
                errors.append(f"{label}.formal_voice.boundary_conditions must be non-empty")
        for field in (
            "term", "plain_language_voice", "domain_context_voice",
            "operational_interpretation", "forbidden_collapse", "owner_route",
        ):
            check_nonempty(definition.get(field), f"{label}.{field}", errors)
        check_refs(definition.get("source_refs"), source_by_id, source_text_by_id, label, errors)
    unique(definition_ids, "definition ids", errors)
    unique(definition_subjects, "definition subjects", errors)
    required_definition_subjects = {
        "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL",
        "CA2-SYS-LANGUAGE-SESSION-COMMAND",
        "CA2-SYS-LANGUAGE-QUESTION-VIEW",
        "CA2-RULE-REVIEW-BEFORE-CANDIDATE-EMISSION",
        "CA2-SYS-LANGUAGE-SESSION-STORE",
        "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE",
        "CA2-OUTPUT-DEFINITION-PACK",
        "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT",
        "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW",
        "CA2-RULE-DEFINE-LANGUAGE-APPLICATION",
        "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME",
    }
    missing_definition_subjects = sorted(required_definition_subjects - set(definition_subjects))
    if missing_definition_subjects:
        errors.append(f"missing candidate definitions: {', '.join(missing_definition_subjects)}")
    for subject_ref, definition in definition_by_subject.items():
        authority_kind_ref = definition.get("authority_kind_ref")
        if subject_ref == "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE":
            if authority_kind_ref != "kind.runtime_contract":
                errors.append("Runtime Contract candidate must bind kind.runtime_contract")
        elif authority_kind_ref is not None:
            errors.append(f"{subject_ref} must not bind an authority kind")
    runtime_contract_node = node_by_id.get("CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE", {})
    if runtime_contract_node.get("candidate_status") != "blocked":
        errors.append("Runtime Contract candidate must remain blocked until owner admission")
    runtime_contract_owner = str(runtime_contract_node.get("owner_route", ""))
    if "task-session" not in runtime_contract_owner or "owner gates" not in runtime_contract_owner:
        errors.append("Runtime Contract candidate must route to task-session after owner gates")
    review_definition = definition_by_subject.get("CA2-RULE-REVIEW-BEFORE-CANDIDATE-EMISSION", {})
    review_normative = str(review_definition.get("formal_voice", {}).get("normative_candidate", ""))
    if "Any output-affecting state or preview change invalidates" not in review_normative:
        errors.append("review binding must become stale after state or preview mutation")
    definition_pack_definition = definition_by_subject.get("CA2-OUTPUT-DEFINITION-PACK", {})
    definition_pack_expression = str(definition_pack_definition.get("formal_voice", {}).get("expression", ""))
    if not all(token in definition_pack_expression for token in ("reuse -> reuse", "specialize -> specialize", "propose -> define_new_candidate", "open -> unresolved")):
        errors.append("Definition Pack candidate must preserve the explicit Language-to-Define disposition projection")
    if not all(token in definition_pack_expression for token in ("language_context_view_ref", "language_context_view_digest", "source_epoch", "applied_binding_refs")):
        errors.append("Definition Pack candidate must preserve the Language Context View binding")
    definition_pack_node_claim = str(node_by_id.get("CA2-OUTPUT-DEFINITION-PACK", {}).get("claim", ""))
    if not all(token in definition_pack_node_claim for token in ("Language Context View identity", "digest", "source epoch", "applied binding references")):
        errors.append("Definition Pack product output must preserve the Language Context View binding")
    store_definition = definition_by_subject.get("CA2-SYS-LANGUAGE-SESSION-STORE", {})
    store_boundaries = " ".join(store_definition.get("formal_voice", {}).get("boundary_conditions", []))
    if "Crash" not in store_boundaries or "not claimed" not in store_boundaries:
        errors.append("single-writer store must preserve the crash-durability claim ceiling")
    experiment_definition = definition_by_subject.get("CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME", {})
    experiment_text = json.dumps(experiment_definition, sort_keys=True)
    if "Rule Review Recommendation" not in experiment_text:
        errors.append("Experiment Frame must preserve the unresolved Rule Review Recommendation")
    if "unresolved Language Runtime owner route" not in str(experiment_definition.get("owner_route", "")):
        errors.append("Experiment Frame must preserve unresolved runtime ownership")
    resolver_definition = definition_by_subject.get("CA2-CAP-RESOLVE-LANGUAGE-CONTEXT", {})
    resolver_text = json.dumps(resolver_definition, sort_keys=True)
    if not all(token in resolver_text for token in ("source epoch", "open realization", "VisibleGap")):
        errors.append("Language resolver must preserve exact source epoch and open realization gaps")
    context_view_definition = definition_by_subject.get("CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW", {})
    context_view_text = json.dumps(context_view_definition, sort_keys=True)
    if not all(token in context_view_text for token in ("blocked uses", "owner routes", "stale")):
        errors.append("Language Context View must preserve blocked uses, owner routes, and staleness")
    application_definition = definition_by_subject.get("CA2-RULE-DEFINE-LANGUAGE-APPLICATION", {})
    application_expression = str(application_definition.get("formal_voice", {}).get("expression", ""))
    if not all(token in application_expression for token in ("usable(v)", "fresh(v)", "expose_gap")):
        errors.append("Define Language application must fail closed for non-usable or stale bindings")

    exact_keys(schema_amendment, SCHEMA_AMENDMENT_KEYS, "schema_amendment", errors)
    if schema_amendment.get("schema_version") != "cav2-language-runtime-product-ontology-schema-amendment/v1":
        errors.append("schema amendment version is invalid")
    if schema_amendment.get("amendment_id") != "LRPO-SCHEMA-AMEND-001":
        errors.append("schema amendment id is invalid")
    if schema_amendment.get("status") != "applied-candidate":
        errors.append("schema amendment must remain applied-candidate")
    if schema_amendment.get("authority_effect") != "none":
        errors.append("schema amendment exceeds authority ceiling")
    exact_keys(
        schema_amendment.get("witness", {}) if isinstance(schema_amendment.get("witness"), dict) else {},
        {"validator_path", "required_checks"},
        "schema_amendment.witness",
        errors,
    )
    if schema_amendment.get("witness", {}).get("validator_path") != "scripts/validate.py":
        errors.append("schema amendment witness must bind the package validator")

    exact_keys(relations_doc, {"schema_ref", "schema_version", "relation_vocabulary", "relations"}, "relations", errors)
    if relations_doc.get("schema_version") != "cav2-language-runtime-product-ontology-relations/v1":
        errors.append("relations schema_version is invalid")
    vocabulary = relations_doc.get("relation_vocabulary", [])
    relations = relations_doc.get("relations", [])
    if not isinstance(vocabulary, list) or not vocabulary:
        errors.append("relation_vocabulary must be non-empty")
        vocabulary = []
    if not isinstance(relations, list) or not relations:
        errors.append("relations must be non-empty")
        relations = []
    vocab_by_id: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(vocabulary):
        label = f"relation_vocabulary[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(item, VOCAB_KEYS, label, errors)
        relation_type = item.get("id")
        if not isinstance(relation_type, str) or not relation_type:
            errors.append(f"{label}.id must be non-empty")
            continue
        if relation_type in vocab_by_id:
            errors.append(f"duplicate relation type: {relation_type}")
        vocab_by_id[relation_type] = item
    if "realized_by" in vocab_by_id:
        errors.append("realized_by is forbidden without implementation evidence; use proposed_realization_of")
    if "proposed_realization_of" not in vocab_by_id:
        errors.append("relation vocabulary must include proposed_realization_of")

    relation_by_id: dict[str, dict[str, Any]] = {}
    branch_counts = {"business": 0, "system": 0, "bridge": 0}
    for index, relation in enumerate(relations):
        label = f"relations[{index}]"
        if not isinstance(relation, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(relation, RELATION_KEYS, label, errors)
        relation_id = relation.get("id")
        if not isinstance(relation_id, str) or not relation_id:
            errors.append(f"{label}.id must be non-empty")
            continue
        if relation_id in relation_by_id:
            errors.append(f"duplicate relation id: {relation_id}")
        relation_by_id[relation_id] = relation
        relation_type = relation.get("type")
        vocab = vocab_by_id.get(str(relation_type))
        if vocab is None:
            errors.append(f"{label} uses unknown relation type {relation_type!r}")
        source_node = node_by_id.get(str(relation.get("source")))
        target_node = node_by_id.get(str(relation.get("target")))
        if source_node is None:
            errors.append(f"{label} source endpoint does not resolve")
        if target_node is None:
            errors.append(f"{label} target endpoint does not resolve")
        if source_node and target_node and vocab:
            source_branch = str(source_node.get("branch"))
            target_branch = str(target_node.get("branch"))
            if source_branch not in vocab.get("source_branches", []):
                errors.append(f"{label} source branch violates relation signature")
            if target_branch not in vocab.get("target_branches", []):
                errors.append(f"{label} target branch violates relation signature")
            relation_branch = source_branch if source_branch == target_branch else "bridge"
            branch_counts[relation_branch] += 1
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        evidence_branches = check_refs(relation.get("source_refs"), source_by_id, source_text_by_id, label, errors)
        if source_node and target_node and source_node.get("branch") != target_node.get("branch"):
            if "mixed" not in evidence_branches and not {"business", "system"}.issubset(evidence_branches):
                errors.append(f"{label} bridge relation lacks mixed or two-branch source evidence")

    required_edges = {
        ("consumed_by", "CA2-LANGUAGE-GOVERNANCE-UBIQUITOUS", "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT"),
        ("produces", "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT", "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW"),
        ("consumed_by", "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW", "CA2-CAP-DEFINE-SHARED-MEANING"),
        ("requires", "CA2-CAP-DEFINE-SHARED-MEANING", "CA2-RULE-DEFINE-LANGUAGE-APPLICATION"),
        ("proposed_realization_of", "CA2-SYS-LANGUAGE-RUNTIME", "CA2-CAP-DEFINE-SHARED-MEANING"),
        ("coordinates", "CA2-SYS-LANGUAGE-RUNTIME", "CA2-SYS-LANGUAGE-SESSION"),
        ("has_state", "CA2-SYS-LANGUAGE-SESSION", "CA2-SYS-LANGUAGE-SESSION-STATE"),
        ("persists", "CA2-SYS-LANGUAGE-SESSION-STORE", "CA2-SYS-LANGUAGE-SESSION-STATE"),
        ("contains", "CA2-SYS-LANGUAGE-SESSION-STATE", "CA2-SYS-LANGUAGE-QUESTION-RECORD"),
        ("contains", "CA2-SYS-LANGUAGE-SESSION-STATE", "CA2-SYS-LANGUAGE-ANSWER-RECORD"),
        ("renders", "CA2-SYS-LANGUAGE-INTERACTIVE-CLI", "CA2-SYS-LANGUAGE-QUESTION-VIEW"),
        ("renders", "CA2-SYS-LANGUAGE-CHAT-QUESTION-VIEW", "CA2-SYS-LANGUAGE-QUESTION-VIEW"),
        ("projects", "CA2-SYS-LANGUAGE-QUESTION-VIEW", "CA2-SYS-LANGUAGE-QUESTION-RECORD"),
        ("selects_next", "CA2-SYS-LANGUAGE-QUESTION-TRANSITION-ENGINE", "CA2-SYS-LANGUAGE-QUESTION-RECORD"),
        ("records", "CA2-SYS-LANGUAGE-QUESTION-TRANSITION-ENGINE", "CA2-SYS-LANGUAGE-ANSWER-RECORD"),
        ("reads_reviewed_state", "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-EMITTER", "CA2-SYS-LANGUAGE-SESSION-STATE"),
        ("emits", "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-EMITTER", "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-PREVIEW"),
        ("projects_candidate_of", "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-PREVIEW", "CA2-OUTPUT-DEFINITION-PACK"),
        ("traced_to", "CA2-SYS-LANGUAGE-QUESTION-RECORD", "CA2-CONCEPT-LANGUAGE-QUESTION"),
        ("traced_to", "CA2-SYS-LANGUAGE-ANSWER-RECORD", "CA2-CONCEPT-LANGUAGE-ANSWER"),
        ("supports_goal", "CA2-SYS-LANGUAGE-RUNTIME", "CA2-GOAL-UBIQUITOUS-LANGUAGE-FIRST-EXAMPLE"),
        ("composed_of", "CA2-SYS-LANGUAGE-RUNTIME", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL"),
        ("coordinates", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-SESSION"),
        ("composed_of", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-QUESTION-TRANSITION-ENGINE"),
        ("composed_of", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-SESSION-STORE"),
        ("accepts", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-SESSION-COMMAND"),
        ("produces_view", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-QUESTION-VIEW"),
        ("specified_by", "CA2-SYS-LANGUAGE-RUNTIME", "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE"),
        ("specified_by", "CA2-SYS-RESUMABLE-LANGUAGE-SESSION-KERNEL", "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE"),
        ("uses_fixture", "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME", "LANG-EX-GOVERNANCE-POLICY-001"),
        ("designed_to_observe", "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME", "CA2-OUT-WORK-CONTINUITY"),
        ("constrained_by", "CA2-SYS-LANGUAGE-CANDIDATE-ARTIFACT-EMITTER", "CA2-RULE-REVIEW-BEFORE-CANDIDATE-EMISSION"),
    }
    actual_edges = {
        (str(item.get("type")), str(item.get("source")), str(item.get("target")))
        for item in relations if isinstance(item, dict)
    }
    for edge in sorted(required_edges - actual_edges):
        errors.append(f"missing required edge: {edge[0]} {edge[1]} -> {edge[2]}")
    if any(item.get("type") in {"achieves", "realized_by"} for item in relations if isinstance(item, dict)):
        errors.append("ontology contains a forbidden achieved or realized relation")
    forbidden_direct_renderers = {
        "CA2-SYS-LANGUAGE-INTERACTIVE-CLI",
        "CA2-SYS-LANGUAGE-CHAT-QUESTION-VIEW",
    }
    if any(
        item.get("type") == "renders"
        and item.get("source") in forbidden_direct_renderers
        and item.get("target") == "CA2-SYS-LANGUAGE-QUESTION-RECORD"
        for item in relations if isinstance(item, dict)
    ):
        errors.append("CLI and chat must render Question View, never Question Record directly")
    question_view_projection_count = sum(
        1 for item in relations
        if isinstance(item, dict)
        and item.get("type") == "projects"
        and item.get("source") == "CA2-SYS-LANGUAGE-QUESTION-VIEW"
        and item.get("target") == "CA2-SYS-LANGUAGE-QUESTION-RECORD"
    )
    if question_view_projection_count != 1:
        errors.append("Question View must project exactly one Question Record")
    if any(
        item.get("source") == "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME"
        and item.get("type") in {"evaluates", "tested_by", "observed_by"}
        for item in relations if isinstance(item, dict)
    ):
        errors.append("Experiment Frame must remain design intent, not run evidence")

    exact_keys(residue_doc, {"schema_ref", "schema_version", "residue"}, "residue", errors)
    if residue_doc.get("schema_version") != "cav2-language-runtime-product-ontology-residue/v1":
        errors.append("residue schema_version is invalid")
    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue must be a list")
        residue = []
    residue_ids: list[str] = []
    for index, item in enumerate(residue):
        label = f"residue[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        exact_keys(item, RESIDUE_KEYS, label, errors)
        residue_id = item.get("id")
        if isinstance(residue_id, str):
            residue_ids.append(residue_id)
        for subject_ref in item.get("subject_refs", []):
            if subject_ref not in node_by_id:
                errors.append(f"{label} has unknown subject_ref {subject_ref!r}")
        check_refs(item.get("source_refs"), source_by_id, source_text_by_id, label, errors)
    unique(residue_ids, "residue ids", errors)
    required_residue = {
        "LRPO-RES-001-UPSTREAM-PRODUCT-ONTOLOGY-DRIFT",
        "LRPO-RES-001-LANGUAGE-PACKAGE-DRIFT",
        "LRPO-RES-002-RUNTIME-CONTRACT-AND-IMPLEMENTATION",
        "LRPO-RES-003-SESSION-STATE-SCHEMA",
        "LRPO-RES-004-CLI-CHAT-PROJECTION",
        "LRPO-RES-005-CONTEXT-RETENTION-PRIVACY",
        "LRPO-RES-006-FIRST-EXPERIMENT",
        "LRPO-RES-007-DEFINE-LANGUAGE-SCOPE",
        "LRPO-RES-008-SYSTEM-OWNER-ADMISSION",
        "LRPO-RES-009-CANDIDATE-DEFINITION-PROMOTION",
        "LRPO-RES-010-SINGLE-WRITER-FRAME-EXPIRY",
        "LRPO-RES-011-LANGUAGE-CONTEXT-CONTRACT",
    }
    missing_residue = sorted(required_residue - set(residue_ids))
    if missing_residue:
        errors.append(f"missing required residue: {', '.join(missing_residue)}")

    node_ids = set(node_by_id)
    relation_ids = set(relation_by_id)
    expected_view_kind = {"business": "business", "system": "system", "bridge": "bridge"}
    for key, view in views.items():
        label = f"view[{key}]"
        exact_keys(view, VIEW_KEYS, label, errors)
        if view.get("schema_version") != "cav2-language-runtime-product-ontology-view/v1":
            errors.append(f"{label} schema_version is invalid")
        if view.get("view_kind") != expected_view_kind[key]:
            errors.append(f"{label} view_kind is invalid")
        view_node_refs = view.get("node_refs", [])
        view_relation_refs = view.get("relation_refs", [])
        unique(view_node_refs if isinstance(view_node_refs, list) else [], f"{label} node refs", errors)
        unique(view_relation_refs if isinstance(view_relation_refs, list) else [], f"{label} relation refs", errors)
        for node_ref in view_node_refs:
            if node_ref not in node_ids:
                errors.append(f"{label} unknown node_ref {node_ref!r}")
            elif key in {"business", "system"} and node_by_id[node_ref].get("branch") != key:
                errors.append(f"{label} contains wrong-branch node {node_ref}")
        for relation_ref in view_relation_refs:
            relation = relation_by_id.get(str(relation_ref))
            if relation is None:
                errors.append(f"{label} unknown relation_ref {relation_ref!r}")
                continue
            source_branch = node_by_id.get(str(relation.get("source")), {}).get("branch")
            target_branch = node_by_id.get(str(relation.get("target")), {}).get("branch")
            actual_kind = source_branch if source_branch == target_branch else "bridge"
            if actual_kind != key:
                errors.append(f"{label} contains {actual_kind} relation {relation_ref}")
            if relation.get("source") not in view_node_refs or relation.get("target") not in view_node_refs:
                errors.append(f"{label} relation {relation_ref} endpoints are not both visible")

    digest = material_digest(errors)
    status = "PASS" if not errors else "BLOCK"
    return {
        "schema_version": "cav2-language-runtime-product-ontology-validation/v1",
        "status": status,
        "package_root": "cyberAlchemy-v2/language/runtime/ontology",
        "ontology_type": "business-system-bridge",
        "branches": ["business", "system"],
        "bridge": "business-system",
        "visibility": "private",
        "authority_effect": "none",
        "counts": {
            "sources": len(sources),
            "candidate_definitions": len(definitions),
            "business_nodes": sum(1 for node in nodes if isinstance(node, dict) and node.get("branch") == "business"),
            "system_nodes": sum(1 for node in nodes if isinstance(node, dict) and node.get("branch") == "system"),
            "relation_types": len(vocabulary),
            "business_relations": branch_counts["business"],
            "system_relations": branch_counts["system"],
            "bridge_relations": branch_counts["bridge"],
            "views": len(views),
            "residue": len(residue),
        },
        "material_digest": digest,
        "checks": [
            "closed-record-shapes",
            "closed-schema-required-property-closure",
            "three-voice-candidate-definition-subject-closure",
            "bounded-language-context-source-and-definition-closure",
            "schema-amendment-witness",
            "exact-source-digests-and-selectors",
            "stable-id-and-endpoint-closure",
            "branch-role-and-relation-signatures",
            "mixed-or-two-branch-bridge-evidence",
            "business-system-noncollapse",
            "language-context-view-consumer-chain",
            "runtime-session-state-store-separation",
            "question-answer-business-record-separation",
            "same-question-cli-chat-projection",
            "question-view-only-channel-rendering",
            "kernel-command-state-store-view-closure",
            "runtime-contract-kind-and-blocked-route",
            "exact-governance-policy-experiment-fixture",
            "experiment-design-not-run-evidence",
            "review-before-materialized-candidate-emission",
            "emitter-preview-definition-pack-separation",
            "system-nodes-not-implemented",
            "separate-business-system-bridge-views",
            "visible-owner-routed-residue",
            "authority-effect-none",
        ],
        "errors": errors,
        "claim_ceiling": CLAIM_CEILING,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    result = validate_package()
    if args.write_receipt and result["status"] == "PASS":
        receipt_path = PACKAGE_ROOT / "receipts" / f"validation-{result['material_digest'][:16]}.json"
        if not receipt_path.exists():
            receipt = {
                "schema_ref": "schemas/language-runtime-product-ontology.schema.json#/$defs/validationReceipt",
                "validated_at": datetime.now(timezone.utc).isoformat(),
                **result,
            }
            receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        result = dict(result)
        result["receipt_path"] = str(receipt_path.relative_to(REPOSITORY_ROOT))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
