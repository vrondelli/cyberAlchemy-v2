#!/usr/bin/env python3
"""Validate the private Registry Context candidate package without side effects by default."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]

MATERIAL_FILES = (
    "README.md",
    "profile.json",
    "sources.json",
    "definitions.json",
    "nodes.json",
    "relations.json",
    "operations.json",
    "residue.json",
    "views/business-view.json",
    "views/system-view.json",
    "views/bridge-view.json",
    "examples/define-context-request.json",
    "examples/define-context-view.json",
    "schemas/registry-context.schema.json",
    "scripts/validate.py",
    "tests/test_negative_mutations.py",
)

PROFILE_KEYS = {
    "schema_ref", "schema_version", "ontology_id", "title", "ontology_type",
    "ontology_type_selection", "branches", "bridge", "materialization",
    "package_root", "package_owner", "business_meaning_owner",
    "system_design_owner", "visibility", "candidate_status",
    "implementation_state", "authority_effect", "currency_policy",
    "source_registry", "definition_registry", "node_registry",
    "relation_registry", "operation_registry", "residue_registry",
    "business_view", "system_view", "bridge_view", "context_request_example",
    "context_view_example", "schema_path", "validator_path", "blocked_outputs",
}
SOURCE_KEYS = {"id", "branch", "path", "observed_file_sha256", "posture", "owner_route"}
SELECTION_KEYS = {
    "selection_id", "source_id", "selector_kind", "selector", "id_field",
    "id_value", "selection_sha256",
}
DEFINITION_KEYS = {
    "id", "term", "subject_ref", "definition_status", "formal_voice",
    "plain_language_voice", "domain_context_voice", "operational_interpretation",
    "forbidden_collapse", "source_refs", "owner_route", "authority_effect",
}
FORMAL_KEYS = {"normative_candidate", "expression", "symbols", "boundary_conditions"}
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
OPERATION_KEYS = {
    "id", "label", "input_ref", "output_ref", "steps", "allowed_effects",
    "blocked_effects", "terminal_outcomes", "failure_policy", "owner_route",
    "source_refs", "authority_effect",
}
RESIDUE_KEYS = {
    "id", "label", "description", "status", "owner_route", "next_action",
    "subject_refs", "source_refs",
}
VIEW_KEYS = {
    "schema_ref", "schema_version", "view_id", "view_kind", "node_refs",
    "relation_refs", "claim_ceiling",
}
REQUEST_KEYS = {
    "schema_version", "request_id", "consumer_ref", "purpose", "context_scope",
    "registry_queries", "binding_policy", "currency_policy",
    "expected_source_epoch", "output_profile_ref", "authority_effect",
    "request_digest_algorithm", "request_digest",
}
SCOPE_KEYS = {
    "product_ref", "thesis_ref", "project_ref", "goal_ref", "capability_ref",
    "language_ref",
}
QUERY_KEYS = {
    "query_id", "registry_ref", "registry_anchor_selection_ref",
    "required_selection_refs", "optional_selection_refs",
}
VIEW_RECORD_KEYS = {
    "record_ref", "record_kind", "registry_ref", "selection_ref",
    "selection_sha256", "selected_projection", "disposition", "owner_route",
    "authority_effect",
}
VIEW_BINDING_KEYS = {
    "binding_id", "relation_type", "source_ref", "target_ref", "binding_state",
    "owner_route", "source_selection_refs", "noncollapse_rule", "blocked_uses",
    "authority_effect",
}
VIEW_RESIDUE_KEYS = {
    "residue_id", "kind", "subject_ref", "explanation", "blocking",
    "owner_route", "source_selection_refs",
}
CONTEXT_VIEW_KEYS = {
    "schema_version", "view_id", "request_ref", "request_digest", "consumer_ref",
    "purpose", "context_scope", "resolution_status", "source_epoch", "records",
    "bindings", "residue", "blocked_uses", "claim_ceiling", "authority_effect",
    "view_digest_algorithm", "view_digest",
}

BUSINESS_ROLES = {
    "product", "thesis", "project", "goal", "capability", "product_output",
    "business_rule", "business_concept",
}
SYSTEM_ROLES = {"component", "adapter", "snapshot", "record", "ledger"}

REQUIRED_NODE_ROLES = {
    "CA2-CONCEPT-REGISTRY": "business_concept",
    "CA2-CONCEPT-BINDING": "business_concept",
    "CA2-CONCEPT-REGISTRY-CONTEXT-SOURCE-SELECTION": "business_concept",
    "CA2-CONCEPT-REGISTRY-CONTEXT-REQUEST": "business_concept",
    "CA2-CAP-RESOLVE-REGISTRY-CONTEXT": "capability",
    "CA2-OUTPUT-REGISTRY-CONTEXT-VIEW": "product_output",
    "CA2-CONCEPT-REGISTRY-CONTEXT-RESIDUE": "business_concept",
    "CA2-RULE-REGISTRY-CONTEXT-INTEGRITY": "business_rule",
    "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT": "capability",
    "CA2-OUTPUT-LANGUAGE-CONTEXT-VIEW": "product_output",
    "CA2-SYS-REGISTRY-CONTEXT-RESOLVER": "component",
    "CA2-SYS-REGISTRY-ADAPTER": "adapter",
    "CA2-SYS-REGISTRY-SOURCE-SNAPSHOT": "snapshot",
    "CA2-SYS-REGISTRY-CONTEXT-REQUEST": "record",
    "CA2-SYS-REGISTRY-CONTEXT-VIEW": "record",
    "CA2-SYS-REGISTRY-RESOLUTION-RUN-RECORD": "record",
    "CA2-SYS-REGISTRY-RESOLUTION-LEDGER": "ledger",
}

CLAIM_CEILING = (
    "Candidate Registry Context meaning, request/view contract, source-selection "
    "algorithm, and business-system bridge only; no canonical definition, source "
    "mutation, implicit binding, Product Thesis acceptance, Project or Goal effect, "
    "Language realization selection, runtime acceptance, implementation, CLI/chat "
    "integration, publication, release, deployment, or external effect."
)


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path, label: str, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {label}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{label} must contain one JSON object")
        return {}
    return value


def exact_keys(value: Any, expected: set[str], label: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} unknown keys: {', '.join(extra)}")


def nonempty(value: Any, label: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")


def unique_strings(values: Any, label: str, errors: list[str]) -> list[str]:
    if not isinstance(values, list):
        errors.append(f"{label} must be a list")
        return []
    strings = [value for value in values if isinstance(value, str)]
    if len(strings) != len(values):
        errors.append(f"{label} must contain only strings")
    duplicates = sorted({value for value in strings if strings.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")
    return strings


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


def json_pointer(value: Any, pointer: str) -> Any:
    if pointer in {"", "/"}:
        return value
    current = value
    for raw_part in pointer.lstrip("/").split("/"):
        part = raw_part.replace("~1", "/").replace("~0", "~")
        current = current[int(part)] if isinstance(current, list) else current[part]
    return current


def markdown_heading(raw: bytes, heading: str) -> bytes:
    text = raw.decode("utf-8")
    lines = text.splitlines(keepends=True)
    starts = [index for index, line in enumerate(lines) if line.rstrip("\r\n") == heading]
    if len(starts) != 1:
        raise ValueError(f"heading must resolve exactly once: {heading!r}")
    start = starts[0]
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "".join(lines[start:end]).encode("utf-8")


def selected_bytes(
    selection: dict[str, Any], raw: bytes, parsed: Any | None
) -> bytes:
    kind = selection.get("selector_kind")
    selector = selection.get("selector")
    if kind == "markdown-heading":
        if selection.get("id_field") is not None or selection.get("id_value") is not None:
            raise ValueError("markdown-heading cannot declare ID fields")
        return markdown_heading(raw, str(selector))
    if parsed is None:
        raise ValueError("JSON selector requires a JSON source")
    if kind == "json-pointer":
        if selection.get("id_field") is not None or selection.get("id_value") is not None:
            raise ValueError("json-pointer cannot declare ID fields")
        return canonical_json(json_pointer(parsed, str(selector)))
    if kind == "json-record":
        id_field = selection.get("id_field")
        id_value = selection.get("id_value")
        if not isinstance(id_field, str) or not isinstance(id_value, str):
            raise ValueError("json-record requires id_field and id_value")
        collection = json_pointer(parsed, str(selector))
        if not isinstance(collection, list):
            raise ValueError("json-record selector must resolve to a list")
        matches = [item for item in collection if isinstance(item, dict) and item.get(id_field) == id_value]
        if len(matches) != 1:
            raise ValueError(f"json-record must resolve exactly once; got {len(matches)}")
        return canonical_json(matches[0])
    raise ValueError(f"unsupported selector kind: {kind!r}")


def selection_refs(
    values: Any, known: set[str], label: str, errors: list[str]
) -> list[str]:
    refs = unique_strings(values, label, errors)
    for ref in refs:
        if ref not in known:
            errors.append(f"{label} uses unknown selection {ref!r}")
    return refs


def material_digest(package_root: Path, errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative_path in sorted(MATERIAL_FILES):
        path = package_root / relative_path
        if not path.is_file():
            errors.append(f"missing material file: {relative_path}")
            continue
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_package(
    package_root: Path = PACKAGE_ROOT,
    repository_root: Path = REPOSITORY_ROOT,
) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    profile = load(package_root / "profile.json", "profile.json", errors)
    sources_doc = load(package_root / "sources.json", "sources.json", errors)
    definitions_doc = load(package_root / "definitions.json", "definitions.json", errors)
    nodes_doc = load(package_root / "nodes.json", "nodes.json", errors)
    relations_doc = load(package_root / "relations.json", "relations.json", errors)
    operations_doc = load(package_root / "operations.json", "operations.json", errors)
    residue_doc = load(package_root / "residue.json", "residue.json", errors)
    schema = load(package_root / "schemas/registry-context.schema.json", "schema", errors)
    request = load(package_root / "examples/define-context-request.json", "request example", errors)
    context_view = load(package_root / "examples/define-context-view.json", "view example", errors)
    views = {
        kind: load(package_root / f"views/{kind}-view.json", f"{kind} view", errors)
        for kind in ("business", "system", "bridge")
    }

    exact_keys(profile, PROFILE_KEYS, "profile", errors)
    expected_profile = {
        "schema_version": "cav2-registry-context-profile/v1",
        "ontology_id": "cav2.registry-context",
        "ontology_type": "business-system-bridge",
        "branches": ["business", "system"],
        "bridge": "business-system",
        "materialization": "package-required",
        "package_root": "cyberAlchemy-v2/product/registry-context",
        "package_owner": "CyberAlchemy v2 product owner",
        "visibility": "private",
        "candidate_status": "candidate",
        "implementation_state": "not-implemented",
        "authority_effect": "none",
        "currency_policy": "selection-digest-fail-closed",
    }
    for field, expected in expected_profile.items():
        if profile.get(field) != expected:
            errors.append(f"profile {field} must equal {expected!r}")
    if "unresolved" not in str(profile.get("system_design_owner", "")):
        errors.append("profile must preserve unresolved runtime ownership")
    type_selection = profile.get("ontology_type_selection", {})
    if not isinstance(type_selection, dict) or type_selection.get("source") != "inferred" or type_selection.get("confidence") != "high":
        errors.append("profile must record high-confidence inferred business-system-bridge selection")

    required_defs = {
        "profile", "sourceRegistry", "candidateDefinitionRegistry", "nodeRegistry",
        "relationRegistry", "operationRegistry", "residueRegistry", "ontologyView",
        "contextRequest", "contextView", "validationReceipt",
    }
    if not required_defs.issubset(set(schema.get("$defs", {}))):
        errors.append("schema lacks required package definitions")
    validate_closed_schema_declarations(schema, "schema", errors)

    exact_keys(
        sources_doc,
        {"schema_ref", "schema_version", "selection_digest_algorithm", "sources", "selections"},
        "sources",
        errors,
    )
    if sources_doc.get("schema_version") != "cav2-registry-context-sources/v1":
        errors.append("sources schema_version is invalid")
    if sources_doc.get("selection_digest_algorithm") != "sha256-selected-bytes/v1":
        errors.append("selection digest algorithm is invalid")

    sources = sources_doc.get("sources", [])
    if not isinstance(sources, list) or not sources:
        errors.append("sources must be a non-empty list")
        sources = []
    source_by_id: dict[str, dict[str, Any]] = {}
    raw_by_id: dict[str, bytes] = {}
    parsed_by_id: dict[str, Any] = {}
    for index, source in enumerate(sources):
        label = f"sources[{index}]"
        exact_keys(source, SOURCE_KEYS, label, errors)
        if not isinstance(source, dict):
            continue
        source_id = source.get("id")
        if not isinstance(source_id, str) or not source_id:
            errors.append(f"{label}.id must be non-empty")
            continue
        if source_id in source_by_id:
            errors.append(f"duplicate source id: {source_id}")
        source_by_id[source_id] = source
        relative_path = source.get("path")
        if not isinstance(relative_path, str):
            errors.append(f"{label}.path must be a string")
            continue
        relative = Path(relative_path)
        if relative.is_absolute() or ".." in relative.parts or not relative_path.startswith("cyberAlchemy-v2/"):
            errors.append(f"{label}.path must be a bounded cyberAlchemy-v2 repository path")
            continue
        path = repository_root / relative
        if not path.is_file():
            errors.append(f"{label} source is missing: {relative_path}")
            continue
        raw = path.read_bytes()
        raw_by_id[source_id] = raw
        observed = sha256(raw)
        if observed != source.get("observed_file_sha256"):
            warnings.append(
                f"{label} containing-file digest changed while selection currency remains authoritative: {relative_path}"
            )
        try:
            parsed_by_id[source_id] = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            pass
        nonempty(source.get("posture"), f"{label}.posture", errors)
        nonempty(source.get("owner_route"), f"{label}.owner_route", errors)

    selections = sources_doc.get("selections", [])
    if not isinstance(selections, list) or not selections:
        errors.append("selections must be a non-empty list")
        selections = []
    selection_by_id: dict[str, dict[str, Any]] = {}
    observed_selection_sha: dict[str, str] = {}
    selected_projection_by_id: dict[str, dict[str, Any]] = {}
    for index, selection in enumerate(selections):
        label = f"selections[{index}]"
        exact_keys(selection, SELECTION_KEYS, label, errors)
        if not isinstance(selection, dict):
            continue
        selection_id = selection.get("selection_id")
        source_id = selection.get("source_id")
        if not isinstance(selection_id, str) or not selection_id:
            errors.append(f"{label}.selection_id must be non-empty")
            continue
        if selection_id in selection_by_id:
            errors.append(f"duplicate selection id: {selection_id}")
        selection_by_id[selection_id] = selection
        if source_id not in source_by_id or source_id not in raw_by_id:
            errors.append(f"{label} uses unavailable source {source_id!r}")
            continue
        try:
            selected = selected_bytes(
                selection, raw_by_id[str(source_id)], parsed_by_id.get(str(source_id))
            )
        except (KeyError, IndexError, TypeError, ValueError, UnicodeDecodeError) as exc:
            errors.append(f"{label} selector does not resolve: {exc}")
            continue
        observed = sha256(selected)
        observed_selection_sha[selection_id] = observed
        if selection.get("selector_kind") == "markdown-heading":
            selected_projection_by_id[selection_id] = {
                "encoding": "utf8-markdown",
                "content": selected.decode("utf-8"),
            }
        else:
            selected_projection_by_id[selection_id] = {
                "encoding": "canonical-json",
                "content": json.loads(selected.decode("utf-8")),
            }
        if observed != selection.get("selection_sha256"):
            errors.append(
                f"{label} selected-value digest drift: {selection_id}"
            )
    known_selections = set(selection_by_id)

    exact_keys(
        definitions_doc,
        {"schema_ref", "schema_version", "authority_posture", "definitions"},
        "definitions",
        errors,
    )
    if definitions_doc.get("authority_posture") != "ontology-candidate-not-canonical":
        errors.append("candidate definitions must remain non-canonical")
    definitions = definitions_doc.get("definitions", [])
    if not isinstance(definitions, list) or not definitions:
        errors.append("definitions must be a non-empty list")
        definitions = []

    exact_keys(nodes_doc, {"schema_ref", "schema_version", "nodes"}, "nodes", errors)
    nodes = nodes_doc.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        errors.append("nodes must be a non-empty list")
        nodes = []
    node_by_id: dict[str, dict[str, Any]] = {}
    for index, node in enumerate(nodes):
        label = f"nodes[{index}]"
        exact_keys(node, NODE_KEYS, label, errors)
        if not isinstance(node, dict):
            continue
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
        selection_refs(node.get("source_refs"), known_selections, f"{label}.source_refs", errors)
    for node_id, role in REQUIRED_NODE_ROLES.items():
        if node_by_id.get(node_id, {}).get("role") != role:
            errors.append(f"required node {node_id} must have role {role}")
    if "unresolved" not in str(node_by_id.get("CA2-SYS-REGISTRY-CONTEXT-RESOLVER", {}).get("owner_route", "")):
        errors.append("Registry Context Resolver must preserve unresolved runtime owner")
    ledger_boundary = str(node_by_id.get("CA2-SYS-REGISTRY-RESOLUTION-LEDGER", {}).get("forbidden_collapse", ""))
    if not all(token in ledger_boundary for token in ("Registry", "source of current truth", "owner decision")):
        errors.append("resolution ledger must not collapse into registry, current truth, or owner decision")

    definition_ids: list[str] = []
    definition_subjects: list[str] = []
    for index, definition in enumerate(definitions):
        label = f"definitions[{index}]"
        exact_keys(definition, DEFINITION_KEYS, label, errors)
        if not isinstance(definition, dict):
            continue
        definition_id = definition.get("id")
        subject_ref = definition.get("subject_ref")
        if isinstance(definition_id, str):
            definition_ids.append(definition_id)
        else:
            errors.append(f"{label}.id must be a string")
        if isinstance(subject_ref, str):
            definition_subjects.append(subject_ref)
            if subject_ref not in node_by_id:
                errors.append(f"{label} has unknown subject_ref {subject_ref!r}")
        else:
            errors.append(f"{label}.subject_ref must be a string")
        if definition.get("definition_status") != "candidate":
            errors.append(f"{label} must remain candidate")
        if definition.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        formal = definition.get("formal_voice")
        exact_keys(formal, FORMAL_KEYS, f"{label}.formal_voice", errors)
        if isinstance(formal, dict):
            symbols = formal.get("symbols", [])
            if not isinstance(symbols, list) or not symbols:
                errors.append(f"{label}.formal_voice.symbols must be non-empty")
            else:
                for symbol_index, symbol in enumerate(symbols):
                    exact_keys(symbol, SYMBOL_KEYS, f"{label}.formal_voice.symbols[{symbol_index}]", errors)
            if not isinstance(formal.get("boundary_conditions"), list) or not formal.get("boundary_conditions"):
                errors.append(f"{label}.formal_voice.boundary_conditions must be non-empty")
        selection_refs(definition.get("source_refs"), known_selections, f"{label}.source_refs", errors)
    unique_strings(definition_ids, "definition ids", errors)
    unique_strings(definition_subjects, "definition subjects", errors)
    required_definition_subjects = {
        "CA2-CAP-RESOLVE-REGISTRY-CONTEXT",
        "CA2-CONCEPT-REGISTRY-CONTEXT-REQUEST",
        "CA2-OUTPUT-REGISTRY-CONTEXT-VIEW",
        "CA2-CONCEPT-REGISTRY-CONTEXT-SOURCE-SELECTION",
        "CA2-CONCEPT-REGISTRY-CONTEXT-RESIDUE",
    }
    missing_defs = sorted(required_definition_subjects - set(definition_subjects))
    if missing_defs:
        errors.append(f"missing candidate definitions: {', '.join(missing_defs)}")

    exact_keys(
        relations_doc,
        {"schema_ref", "schema_version", "relation_vocabulary", "relations"},
        "relations",
        errors,
    )
    vocabulary = relations_doc.get("relation_vocabulary", [])
    if not isinstance(vocabulary, list) or not vocabulary:
        errors.append("relation vocabulary must be a non-empty list")
        vocabulary = []
    vocab_by_id: dict[str, dict[str, Any]] = {}
    for index, entry in enumerate(vocabulary):
        label = f"relation_vocabulary[{index}]"
        exact_keys(entry, VOCAB_KEYS, label, errors)
        if isinstance(entry, dict) and isinstance(entry.get("id"), str):
            if entry["id"] in vocab_by_id:
                errors.append(f"duplicate relation vocabulary id: {entry['id']}")
            vocab_by_id[entry["id"]] = entry
    relations = relations_doc.get("relations", [])
    if not isinstance(relations, list) or not relations:
        errors.append("relations must be a non-empty list")
        relations = []
    relation_by_id: dict[str, dict[str, Any]] = {}
    business_relations = 0
    system_relations = 0
    bridge_relations = 0
    for index, relation in enumerate(relations):
        label = f"relations[{index}]"
        exact_keys(relation, RELATION_KEYS, label, errors)
        if not isinstance(relation, dict):
            continue
        relation_id = relation.get("id")
        if not isinstance(relation_id, str):
            errors.append(f"{label}.id must be a string")
            continue
        if relation_id in relation_by_id:
            errors.append(f"duplicate relation id: {relation_id}")
        relation_by_id[relation_id] = relation
        source = node_by_id.get(str(relation.get("source")))
        target = node_by_id.get(str(relation.get("target")))
        if source is None:
            errors.append(f"{label} has unknown source endpoint {relation.get('source')!r}")
        if target is None:
            errors.append(f"{label} has unknown target endpoint {relation.get('target')!r}")
        vocab = vocab_by_id.get(str(relation.get("type")))
        if vocab is None:
            errors.append(f"{label} uses unknown relation type {relation.get('type')!r}")
        if source and target and vocab:
            source_branch = source.get("branch")
            target_branch = target.get("branch")
            if source_branch not in vocab.get("source_branches", []):
                errors.append(f"{label} source branch violates relation vocabulary")
            if target_branch not in vocab.get("target_branches", []):
                errors.append(f"{label} target branch violates relation vocabulary")
            if source_branch == target_branch == "business":
                business_relations += 1
            elif source_branch == target_branch == "system":
                system_relations += 1
            else:
                bridge_relations += 1
        if relation.get("direction") != "directed":
            errors.append(f"{label} must be directed")
        if relation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        selection_refs(relation.get("source_refs"), known_selections, f"{label}.source_refs", errors)

    exact_keys(
        operations_doc,
        {"schema_ref", "schema_version", "operations"},
        "operations",
        errors,
    )
    operations = operations_doc.get("operations", [])
    if not isinstance(operations, list) or not operations:
        errors.append("operations must be a non-empty list")
        operations = []
    operation_ids: list[str] = []
    for index, operation in enumerate(operations):
        label = f"operations[{index}]"
        exact_keys(operation, OPERATION_KEYS, label, errors)
        if not isinstance(operation, dict):
            continue
        if isinstance(operation.get("id"), str):
            operation_ids.append(operation["id"])
        if operation.get("input_ref") not in node_by_id:
            errors.append(f"{label} has unknown input_ref")
        if operation.get("output_ref") not in node_by_id:
            errors.append(f"{label} has unknown output_ref")
        if operation.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        for field in ("steps", "allowed_effects", "blocked_effects", "terminal_outcomes"):
            if not isinstance(operation.get(field), list) or not operation.get(field):
                errors.append(f"{label}.{field} must be non-empty")
        selection_refs(operation.get("source_refs"), known_selections, f"{label}.source_refs", errors)
    unique_strings(operation_ids, "operation ids", errors)
    if set(operation_ids) != {"RC-OP-RESOLVE-CONTEXT", "RC-OP-VALIDATE-CONTEXT", "RC-OP-EXPLAIN-CONTEXT"}:
        errors.append("operation set must be resolve, validate, and explain only")

    exact_keys(
        residue_doc,
        {"schema_ref", "schema_version", "residue"},
        "residue",
        errors,
    )
    residue = residue_doc.get("residue", [])
    if not isinstance(residue, list):
        errors.append("residue must be a list")
        residue = []
    residue_ids: list[str] = []
    for index, item in enumerate(residue):
        label = f"residue[{index}]"
        exact_keys(item, RESIDUE_KEYS, label, errors)
        if not isinstance(item, dict):
            continue
        if isinstance(item.get("id"), str):
            residue_ids.append(item["id"])
        for ref in unique_strings(item.get("subject_refs"), f"{label}.subject_refs", errors):
            if ref not in node_by_id:
                errors.append(f"{label} uses unknown subject {ref!r}")
        selection_refs(item.get("source_refs"), known_selections, f"{label}.source_refs", errors)
    unique_strings(residue_ids, "residue ids", errors)
    if "RC-RES-001-RUNTIME-OWNER" not in residue_ids:
        errors.append("runtime owner residue must remain explicit")

    for kind, view in views.items():
        exact_keys(view, VIEW_KEYS, f"{kind}_view", errors)
        if view.get("view_kind") != kind:
            errors.append(f"{kind}_view has wrong view_kind")
        node_refs = unique_strings(view.get("node_refs"), f"{kind}_view.node_refs", errors)
        relation_refs = unique_strings(view.get("relation_refs"), f"{kind}_view.relation_refs", errors)
        for ref in node_refs:
            if ref not in node_by_id:
                errors.append(f"{kind}_view uses unknown node {ref!r}")
            elif kind in {"business", "system"} and node_by_id[ref].get("branch") != kind:
                errors.append(f"{kind}_view contains wrong-branch node {ref!r}")
        for ref in relation_refs:
            relation = relation_by_id.get(ref)
            if relation is None:
                errors.append(f"{kind}_view uses unknown relation {ref!r}")
                continue
            if relation.get("source") not in node_refs or relation.get("target") not in node_refs:
                errors.append(f"{kind}_view relation {ref} endpoints are not both included")

    exact_keys(request, REQUEST_KEYS, "request", errors)
    exact_keys(request.get("context_scope"), SCOPE_KEYS, "request.context_scope", errors)
    if request.get("schema_version") != "cav2-registry-context-request/v1":
        errors.append("request schema_version is invalid")
    if request.get("authority_effect") != "none":
        errors.append("request exceeds authority ceiling")
    if request.get("binding_policy") != {
        "explicit_only": True,
        "label_similarity": "forbidden",
        "open_realization": "preserve-as-residue",
        "missing_owner": "preserve-as-residue",
    }:
        errors.append("request binding policy must remain explicit-only and fail closed")
    if request.get("currency_policy") != {
        "mode": "selection-digest",
        "whole_file_drift": "diagnostic",
        "selection_drift": "block",
        "missing_selection": "block",
        "ambiguous_selection": "block",
    }:
        errors.append("request currency policy is invalid")
    queries = request.get("registry_queries", [])
    if not isinstance(queries, list) or not queries:
        errors.append("request registry_queries must be non-empty")
        queries = []
    query_ids: list[str] = []
    requested_selection_refs: list[str] = []
    for index, query in enumerate(queries):
        label = f"request.registry_queries[{index}]"
        exact_keys(query, QUERY_KEYS, label, errors)
        if not isinstance(query, dict):
            continue
        if isinstance(query.get("query_id"), str):
            query_ids.append(query["query_id"])
        anchor = query.get("registry_anchor_selection_ref")
        required_refs = selection_refs(
            query.get("required_selection_refs"), known_selections,
            f"{label}.required_selection_refs", errors,
        )
        optional_refs = selection_refs(
            query.get("optional_selection_refs"), known_selections,
            f"{label}.optional_selection_refs", errors,
        )
        if anchor not in required_refs:
            errors.append(f"{label} registry anchor must be a required selection")
        requested_selection_refs.extend(required_refs + optional_refs)
    unique_strings(query_ids, "request query ids", errors)
    requested_selection_refs = sorted(set(requested_selection_refs))
    expected_request_digest = sha256(
        canonical_json({key: value for key, value in request.items() if key != "request_digest"})
    )
    if request.get("request_digest") != expected_request_digest:
        errors.append("request digest mismatch")

    exact_keys(context_view, CONTEXT_VIEW_KEYS, "context_view", errors)
    if context_view.get("schema_version") != "cav2-registry-context-view/v1":
        errors.append("context view schema_version is invalid")
    if context_view.get("request_ref") != request.get("request_id"):
        errors.append("context view request_ref mismatch")
    if context_view.get("request_digest") != expected_request_digest:
        errors.append("context view request_digest mismatch")
    for field in ("consumer_ref", "purpose", "context_scope"):
        if context_view.get(field) != request.get(field):
            errors.append(f"context view {field} does not match request")
    if context_view.get("authority_effect") != "none":
        errors.append("context view exceeds authority ceiling")

    source_epoch = context_view.get("source_epoch", {})
    exact_keys(source_epoch, {"algorithm", "selections", "digest"}, "context_view.source_epoch", errors)
    if isinstance(source_epoch, dict) and source_epoch.get("algorithm") != "sha256-canonical-selection-set/v1":
        errors.append("source epoch algorithm is invalid")
    epoch_items = source_epoch.get("selections", []) if isinstance(source_epoch, dict) else []
    if not isinstance(epoch_items, list):
        errors.append("source epoch selections must be a list")
        epoch_items = []
    epoch_refs: list[str] = []
    for index, item in enumerate(epoch_items):
        label = f"context_view.source_epoch.selections[{index}]"
        exact_keys(item, {"selection_ref", "selection_sha256"}, label, errors)
        if not isinstance(item, dict):
            continue
        ref = item.get("selection_ref")
        if isinstance(ref, str):
            epoch_refs.append(ref)
        if ref not in selection_by_id:
            errors.append(f"{label} uses unknown selection {ref!r}")
        elif item.get("selection_sha256") != selection_by_id[ref].get("selection_sha256"):
            errors.append(f"{label} digest does not match source registry")
    if epoch_refs != sorted(epoch_refs) or len(epoch_refs) != len(set(epoch_refs)):
        errors.append("source epoch selection refs must be sorted and unique")
    if epoch_refs != requested_selection_refs:
        errors.append("source epoch must equal the request selection closure")
    expected_epoch_digest = sha256(canonical_json(epoch_items))
    if isinstance(source_epoch, dict) and source_epoch.get("digest") != expected_epoch_digest:
        errors.append("source epoch digest mismatch")
    if request.get("expected_source_epoch") not in {None, expected_epoch_digest}:
        errors.append("request expected_source_epoch does not match resolved epoch")

    records = context_view.get("records", [])
    if not isinstance(records, list) or not records:
        errors.append("context view records must be non-empty")
        records = []
    record_refs: list[str] = []
    record_selection_refs: list[str] = []
    for index, record in enumerate(records):
        label = f"context_view.records[{index}]"
        exact_keys(record, VIEW_RECORD_KEYS, label, errors)
        if not isinstance(record, dict):
            continue
        if isinstance(record.get("record_ref"), str):
            record_refs.append(record["record_ref"])
        selection_ref = record.get("selection_ref")
        if isinstance(selection_ref, str):
            record_selection_refs.append(selection_ref)
        if selection_ref not in epoch_refs:
            errors.append(f"{label} selection is outside source epoch")
        selection = selection_by_id.get(selection_ref)
        if isinstance(selection, dict):
            if record.get("selection_sha256") != selection.get("selection_sha256"):
                errors.append(f"{label} selection digest does not match source registry")
        projection = record.get("selected_projection")
        if not isinstance(projection, dict):
            errors.append(f"{label} must carry selected projection")
        else:
            exact_keys(projection, {"encoding", "content"}, f"{label}.selected_projection", errors)
            if projection != selected_projection_by_id.get(selection_ref):
                errors.append(f"{label} selected projection does not match registered selection")
        if record.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
    unique_strings(record_refs, "context view record refs", errors)
    unique_strings(record_selection_refs, "context view record selection refs", errors)
    if sorted(record_selection_refs) != epoch_refs:
        errors.append("context view records must cover every source epoch selection exactly once")

    bindings = context_view.get("bindings", [])
    if not isinstance(bindings, list):
        errors.append("context view bindings must be a list")
        bindings = []
    binding_ids: list[str] = []
    for index, binding in enumerate(bindings):
        label = f"context_view.bindings[{index}]"
        exact_keys(binding, VIEW_BINDING_KEYS, label, errors)
        if not isinstance(binding, dict):
            continue
        if isinstance(binding.get("binding_id"), str):
            binding_ids.append(binding["binding_id"])
        if binding.get("binding_state") != "explicit-source-backed":
            errors.append(f"{label} must be explicit-source-backed")
        if binding.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        for endpoint_field in ("source_ref", "target_ref"):
            endpoint = binding.get(endpoint_field)
            if endpoint not in record_refs:
                errors.append(
                    f"{label} binding endpoint must be present in context view records: {endpoint!r}"
                )
        refs = selection_refs(
            binding.get("source_selection_refs"), set(epoch_refs),
            f"{label}.source_selection_refs", errors,
        )
        if not refs:
            errors.append(f"{label} must preserve source selections")
        if not isinstance(binding.get("blocked_uses"), list) or not binding.get("blocked_uses"):
            errors.append(f"{label}.blocked_uses must be non-empty")
    unique_strings(binding_ids, "context view binding ids", errors)

    view_residue = context_view.get("residue", [])
    if not isinstance(view_residue, list):
        errors.append("context view residue must be a list")
        view_residue = []
    view_residue_ids: list[str] = []
    blocking_residue = False
    for index, item in enumerate(view_residue):
        label = f"context_view.residue[{index}]"
        exact_keys(item, VIEW_RESIDUE_KEYS, label, errors)
        if not isinstance(item, dict):
            continue
        if isinstance(item.get("residue_id"), str):
            view_residue_ids.append(item["residue_id"])
        blocking_residue = blocking_residue or item.get("blocking") is True
        selection_refs(
            item.get("source_selection_refs"), set(epoch_refs),
            f"{label}.source_selection_refs", errors,
        )
    unique_strings(view_residue_ids, "context view residue ids", errors)
    open_residue = next(
        (item for item in view_residue if isinstance(item, dict) and item.get("residue_id") == "RC-VIEW-RES-OPEN-RULE-REVIEW-REALIZATION"),
        None,
    )
    if not open_residue or open_residue.get("kind") != "open-realization" or open_residue.get("blocking") is not True:
        errors.append("open RuleReviewRecommendation realization must remain blocking residue")
    status = context_view.get("resolution_status")
    if blocking_residue and status != "blocked":
        errors.append("blocking residue requires blocked resolution status")
    if not blocking_residue and status == "blocked":
        errors.append("blocked resolution status requires blocking residue")
    if not isinstance(context_view.get("blocked_uses"), list) or not context_view.get("blocked_uses"):
        errors.append("context view blocked_uses must be non-empty")
    expected_view_digest = sha256(
        canonical_json({key: value for key, value in context_view.items() if key != "view_digest"})
    )
    if context_view.get("view_digest") != expected_view_digest:
        errors.append("context view digest mismatch")

    digest = material_digest(package_root, errors)
    receipts_dir = package_root / "receipts"
    current_receipt_found = False
    if receipts_dir.is_dir():
        for path in sorted(receipts_dir.glob("validation-*.json")):
            receipt = load(path, str(path.relative_to(package_root)), errors)
            if receipt.get("schema_version") != "cav2-registry-context-validation/v1":
                errors.append(f"{path.name} has invalid receipt schema_version")
            if receipt.get("authority_effect") != "none":
                errors.append(f"{path.name} exceeds receipt authority ceiling")
            if receipt.get("material_digest") == digest and receipt.get("status") == "PASS":
                current_receipt_found = True
    if not current_receipt_found:
        warnings.append("no current PASS receipt matches the live material digest")

    counts = {
        "sources": len(sources),
        "selections": len(selections),
        "candidate_definitions": len(definitions),
        "business_nodes": sum(1 for node in nodes if isinstance(node, dict) and node.get("branch") == "business"),
        "system_nodes": sum(1 for node in nodes if isinstance(node, dict) and node.get("branch") == "system"),
        "relation_types": len(vocabulary),
        "business_relations": business_relations,
        "system_relations": system_relations,
        "bridge_relations": bridge_relations,
        "operations": len(operations),
        "views": len(views),
        "residue": len(residue),
        "context_records": len(records),
        "context_bindings": len(bindings),
        "context_residue": len(view_residue),
    }
    checks = [
        "closed machine-readable package shapes",
        "high-confidence business-system-bridge selection",
        "source file diagnostics and fail-closed selected-value currency",
        "stable ID uniqueness and reference closure",
        "candidate Definition posture and three-voice coverage",
        "business/system branch polarity and bridge evidence",
        "Registry, Binding, Selection, View, Residue, and Ledger non-collapse",
        "read-only resolve/validate/explain operation ceiling",
        "bounded request with registered selection refs and no arbitrary paths",
        "explicit-source-backed bindings only",
        "digest-bound selected-content coverage and binding endpoint closure",
        "request, source-epoch, and view digest determinism",
        "blocking residue and resolution-status consistency",
        "authority_effect none throughout",
        "append-only receipt currency",
    ]
    return {
        "schema_ref": "schemas/registry-context.schema.json#/$defs/validationReceipt",
        "schema_version": "cav2-registry-context-validation/v1",
        "validated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/product/registry-context",
        "ontology_type": "business-system-bridge",
        "branches": ["business", "system"],
        "bridge": "business-system",
        "visibility": "private",
        "authority_effect": "none",
        "counts": counts,
        "material_digest": digest,
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "claim_ceiling": CLAIM_CEILING,
    }


def write_receipt(result: dict[str, Any], package_root: Path = PACKAGE_ROOT) -> Path:
    if result.get("status") != "PASS":
        raise ValueError("cannot materialize a PASS receipt for a blocked package")
    receipts_dir = package_root / "receipts"
    receipts_dir.mkdir(parents=True, exist_ok=True)
    path = receipts_dir / f"validation-{result['material_digest'][:16]}.json"
    rendered = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
        if existing.get("material_digest") != result.get("material_digest"):
            raise ValueError(f"receipt collision at {path}")
        return path
    path.write_text(rendered, encoding="utf-8")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    result = validate_package()
    if args.write_receipt and result["status"] == "PASS":
        result["receipt_path"] = str(write_receipt(result).relative_to(REPOSITORY_ROOT))
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
