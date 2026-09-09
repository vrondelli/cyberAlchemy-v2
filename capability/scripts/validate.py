#!/usr/bin/env python3
"""Validate the private CAV2 Capability Ontology without writing by default."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    "README.md",
    "profile.json",
    "sources.json",
    "definitions.json",
    "capability-references.json",
    "state-model.json",
    "nodes.json",
    "relations.json",
    "views.json",
    "residue.json",
    "schema-amendment-product-capability-v1.json",
    "migration.json",
    "schemas/capability.schema.json",
    "scripts/validate.py",
    "tests/test_negative_mutations.py",
)
CLAIM_CEILING = (
    "Canonical shared private Capability Ontology grammar, canonical CAV2-D67 "
    "reference, external canonical DEF-ARC-CAPABILITY reference, source-bound "
    "projections, one digest-bound Define-owned schema-conforming "
    "candidate record shape, explicit obligations, and candidate partial bridge "
    "relations only; no generic Capability definition, capability-instance "
    "ownership transfer, Product Capability adoption, Definition Pack acceptance, "
    "complete realization, behavioral conformance, saved-session implementation, "
    "product-value proof, permission, authority grant, publication, release, "
    "deployment, or external effect."
)
EXPECTED_NON_IMPLICATIONS = {
    "definition-promotion-does-not-imply-instance-adoption",
    "schema-validity-does-not-imply-working-realization",
    "implementation-does-not-imply-conformance",
    "conformance-does-not-imply-product-value",
    "repeated-use-does-not-imply-authority-or-maturity",
    "context-applicability-does-not-redefine-capability",
    "bridge-projection-does-not-transfer-source-ownership",
}


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


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


def validate_instance(
    schema: dict[str, Any], definition: str, instance: dict[str, Any],
    label: str, errors: list[str],
) -> None:
    validation_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    validator = Draft202012Validator(validation_schema)
    for violation in sorted(validator.iter_errors(instance), key=lambda item: list(item.path)):
        locator = ".".join(str(part) for part in violation.path)
        errors.append(f"{label}{'.' + locator if locator else ''}: {violation.message}")


def unique(values: list[Any], label: str, errors: list[str]) -> None:
    duplicates = sorted({str(value) for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def json_pointer(value: Any, pointer: str) -> Any:
    if pointer in {"", "/"}:
        return value
    current = value
    for raw in pointer.lstrip("/").split("/"):
        part = raw.replace("~1", "/").replace("~0", "~")
        current = current[int(part)] if isinstance(current, list) else current[part]
    return current


def selected_bytes(selection: dict[str, Any], raw: bytes, parsed: Any | None) -> bytes:
    kind = selection.get("selector_kind")
    selector = str(selection.get("selector"))
    if kind == "markdown-heading":
        lines = raw.decode("utf-8").splitlines(keepends=True)
        starts = [index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector]
        if len(starts) != 1:
            raise ValueError(f"heading must resolve once; got {len(starts)}")
        start = starts[0]
        end = next(
            (index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")),
            len(lines),
        )
        return "".join(lines[start:end]).encode("utf-8")
    if parsed is None:
        raise ValueError("JSON selector requires JSON source")
    if kind == "json-pointer":
        return canonical_json(json_pointer(parsed, selector))
    if kind == "json-record":
        collection = json_pointer(parsed, selector)
        field = selection.get("id_field")
        expected = selection.get("id_value")
        matches = [item for item in collection if isinstance(item, dict) and item.get(field) == expected]
        if len(matches) != 1:
            raise ValueError(f"record must resolve once; got {len(matches)}")
        return canonical_json(matches[0])
    raise ValueError(f"unsupported selector kind: {kind!r}")


def material_digest(root: Path, errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = root / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode("utf-8") + b"\0" + path.read_bytes() + b"\0")
    return digest.hexdigest()


def validate_package(
    package_root: Path = PACKAGE_ROOT,
    repository_root: Path = REPOSITORY_ROOT,
) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    profile = load(package_root / "profile.json", "profile", errors)
    sources_doc = load(package_root / "sources.json", "sources", errors)
    definitions_doc = load(package_root / "definitions.json", "definitions", errors)
    references_doc = load(package_root / "capability-references.json", "capability references", errors)
    state_doc = load(package_root / "state-model.json", "state model", errors)
    nodes_doc = load(package_root / "nodes.json", "nodes", errors)
    relations_doc = load(package_root / "relations.json", "relations", errors)
    views_doc = load(package_root / "views.json", "views", errors)
    residue_doc = load(package_root / "residue.json", "residue", errors)
    amendment_doc = load(package_root / "schema-amendment-product-capability-v1.json", "schema amendment", errors)
    migration_doc = load(package_root / "migration.json", "migration", errors)
    schema = load(package_root / "schemas/capability.schema.json", "schema", errors)

    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:
        errors.append(f"Capability schema is invalid: {exc}")
    if schema:
        for label, instance, definition in (
            ("profile", profile, "profile"),
            ("sources", sources_doc, "sourceRegistry"),
            ("definitions", definitions_doc, "definitionRegistry"),
            ("capability references", references_doc, "capabilityReferenceRegistry"),
            ("state model", state_doc, "stateModel"),
            ("nodes", nodes_doc, "nodeRegistry"),
            ("relations", relations_doc, "relationRegistry"),
            ("views", views_doc, "viewRegistry"),
            ("residue", residue_doc, "residueRegistry"),
            ("schema amendment", amendment_doc, "schemaAmendmentWitness"),
            ("migration", migration_doc, "migrationManifest"),
        ):
            validate_instance(schema, definition, instance, label, errors)

    schema_digest = sha256((package_root / "schemas/capability.schema.json").read_bytes())
    if amendment_doc.get("prior_schema_sha256") != "ef054dd45eb592e5384406e12978db813b9724418195a14fb0d189cfb8e1d432":
        errors.append("schema amendment preimage digest changed")
    if amendment_doc.get("prior_material_digest") != "4f70eaad8e336ce87e10310469f9f35b2bba8656635fe45a656c00b58cc8f45c":
        errors.append("schema amendment prior material digest changed")
    if amendment_doc.get("postimage_schema_sha256") != schema_digest:
        errors.append("schema amendment postimage digest does not match live schema")
    if migration_doc.get("source_projection_ref") != migration_doc.get("target_instance_ref"):
        errors.append("migration changes the stable Product Capability identity")
    if migration_doc.get("source_projection_unchanged") is not True:
        errors.append("migration attempts to rewrite the source product projection")

    if profile.get("ontology_type") != "business-system-bridge":
        errors.append("profile must select business-system-bridge")
    if profile.get("package_root") != "cyberAlchemy-v2/capability":
        errors.append("profile package root is invalid")
    if profile.get("canonical_definition_refs") != ["CAV2-D67", "DEF-ARC-CAPABILITY"]:
        errors.append("profile must bind Product and Agent Capability definitions in authority order")
    if profile.get("authority_effect") != "none":
        errors.append("profile exceeds authority ceiling")

    sources = sources_doc.get("sources", [])
    selections = sources_doc.get("selections", [])
    source_by_id: dict[str, dict[str, Any]] = {}
    raw_by_id: dict[str, bytes] = {}
    parsed_by_id: dict[str, Any] = {}
    for index, source in enumerate(sources if isinstance(sources, list) else []):
        source_id = source.get("source_id")
        if source_id in source_by_id:
            errors.append(f"duplicate source id: {source_id}")
        source_by_id[source_id] = source
        relative = Path(str(source.get("path", "")))
        allowed = str(relative).startswith("cyberAlchemy-v2/") or str(relative).startswith("arcanum/")
        if relative.is_absolute() or ".." in relative.parts or not allowed:
            errors.append(f"sources[{index}] path is unbounded")
            continue
        path = repository_root / relative
        if not path.is_file():
            errors.append(f"sources[{index}] source missing: {relative}")
            continue
        raw = path.read_bytes()
        raw_by_id[source_id] = raw
        if sha256(raw) != source.get("observed_file_sha256"):
            warnings.append(f"sources[{index}] containing-file digest changed: {relative}")
        try:
            parsed_by_id[source_id] = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            pass

    selection_by_id: dict[str, dict[str, Any]] = {}
    selection_source_id: dict[str, str] = {}
    selection_value: dict[str, Any] = {}
    for index, selection in enumerate(selections if isinstance(selections, list) else []):
        selection_id = selection.get("selection_id")
        if selection_id in selection_by_id:
            errors.append(f"duplicate selection id: {selection_id}")
        selection_by_id[selection_id] = selection
        source_id = selection.get("source_id")
        selection_source_id[selection_id] = str(source_id)
        if source_id not in raw_by_id:
            errors.append(f"selections[{index}] unavailable source: {source_id!r}")
            continue
        try:
            selected = selected_bytes(selection, raw_by_id[source_id], parsed_by_id.get(source_id))
        except (KeyError, IndexError, TypeError, ValueError, UnicodeDecodeError) as exc:
            errors.append(f"selections[{index}] selector does not resolve: {exc}")
            continue
        if sha256(selected) != selection.get("selection_sha256"):
            errors.append(f"selections[{index}] selected-value digest drift: {selection_id}")
        try:
            selection_value[selection_id] = json.loads(selected)
        except (UnicodeDecodeError, json.JSONDecodeError):
            selection_value[selection_id] = selected.decode("utf-8", errors="replace")
    known_selections = set(selection_by_id)

    external_records: dict[str, dict[str, Any]] = {}
    external_record_ids: dict[str, str] = {}
    external_manifest = migration_doc.get("external_records", [])
    expected_external_paths = {
        "cyberAlchemy-v2/define/capabilities/define-shared-meaning.product-capability.json",
        "cyberAlchemy-v2/define/capabilities/contracts/define-shared-meaning.input-contract.json",
        "cyberAlchemy-v2/define/capabilities/contracts/define-shared-meaning.definition-pack.output-contract.json",
        "cyberAlchemy-v2/define/capabilities/contracts/define-shared-meaning.handled-registry.output-contract.json",
        "cyberAlchemy-v2/define/capabilities/policies/define-shared-meaning.context-policy.json",
        "cyberAlchemy-v2/define/capabilities/realizations/define-cli.realization.json",
        "cyberAlchemy-v2/define/capabilities/obligations/define-shared-meaning.obligations.json",
    }
    manifest_paths = [str(item.get("path")) for item in external_manifest if isinstance(item, dict)]
    if set(manifest_paths) != expected_external_paths or len(manifest_paths) != len(expected_external_paths):
        errors.append("migration must enumerate exactly seven bounded Define owner-local records")
    id_fields = {
        "productCapability": "capability_id",
        "capabilityContract": "contract_id",
        "contextPolicy": "policy_id",
        "realizationBinding": "binding_id",
        "obligationRegistry": "registry_id",
    }
    source_path_to_selection = {
        str(source.get("path")): selection_id
        for selection_id, source_id in selection_source_id.items()
        for source in [source_by_id.get(source_id, {})]
        if selection_by_id.get(selection_id, {}).get("selector_kind") == "json-pointer"
        and selection_by_id.get(selection_id, {}).get("selector") == "/"
    }
    for index, item in enumerate(external_manifest if isinstance(external_manifest, list) else []):
        relative = Path(str(item.get("path", "")))
        if relative.is_absolute() or ".." in relative.parts or not str(relative).startswith("cyberAlchemy-v2/define/capabilities/"):
            errors.append(f"migration external_records[{index}] path is unbounded")
            continue
        path = repository_root / relative
        if not path.is_file():
            errors.append(f"migration external_records[{index}] missing: {relative}")
            continue
        raw = path.read_bytes()
        if sha256(raw) != item.get("sha256"):
            errors.append(f"migration external_records[{index}] raw digest mismatch")
        try:
            value = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"migration external_records[{index}] invalid JSON: {exc}")
            continue
        definition = item.get("schema_def")
        if definition not in id_fields:
            errors.append(f"migration external_records[{index}] unknown schema definition")
            continue
        validate_instance(schema, str(definition), value, f"migration external_records[{index}]", errors)
        record_id = value.get(id_fields[str(definition)])
        if record_id != item.get("record_id"):
            errors.append(f"migration external_records[{index}] record identity mismatch")
        if record_id in external_records:
            errors.append(f"duplicate external record id: {record_id}")
        external_records[str(record_id)] = value
        external_record_ids[str(relative)] = str(record_id)
        selection_id = source_path_to_selection.get(str(relative))
        if not selection_id or selection_value.get(selection_id) != value:
            errors.append(f"migration external_records[{index}] lacks exact whole-record source selection")

    define_product = external_records.get("CA2-CAP-DEFINE-SHARED-MEANING", {})
    if define_product.get("business_ontology_ref") != "B-DEFINE-PRODUCT-CAPABILITY":
        errors.append("Define Product Capability lost its accepted business meaning reference")
    if define_product.get("input_contract_refs") != ["CA2-CAP-CONTRACT-DEFINE-INPUT"]:
        errors.append("Define Product Capability input contract closure mismatch")
    if define_product.get("output_contract_refs") != ["CA2-CAP-CONTRACT-DEFINE-DEFINITION-PACK", "CA2-CAP-CONTRACT-DEFINE-HANDLED-REGISTRY"]:
        errors.append("Define Product Capability output contract closure mismatch")
    if define_product.get("context_policy_refs") != ["CA2-CAP-POLICY-DEFINE-CONTEXT"]:
        errors.append("Define Product Capability ContextPolicy closure mismatch")
    if define_product.get("realization_binding_refs") != ["CA2-CAP-BIND-DEFINE-CLI"]:
        errors.append("Define Product Capability realization binding closure mismatch")
    if define_product.get("obligation_registry_ref") != "CA2-CAP-OBLIGATIONS-DEFINE-SHARED-MEANING":
        errors.append("Define Product Capability obligation registry closure mismatch")
    for ref in (
        define_product.get("input_contract_refs", [])
        + define_product.get("output_contract_refs", [])
        + define_product.get("context_policy_refs", [])
        + define_product.get("realization_binding_refs", [])
        + [define_product.get("obligation_registry_ref")]
    ):
        if ref not in external_records:
            errors.append(f"Define Product Capability has dangling owner-local ref: {ref}")
    owner_responsibilities = [item.get("responsibility") for item in define_product.get("owner_routes", []) if isinstance(item, dict)]
    if set(owner_responsibilities) != {"product-meaning", "definition-pack-shape", "runtime-contract", "runtime-realization", "next-use-suitability"} or len(owner_responsibilities) != 5:
        errors.append("Define Product Capability must preserve five typed owner responsibilities")

    define_policy = external_records.get("CA2-CAP-POLICY-DEFINE-CONTEXT", {})
    if define_policy.get("resolution_order") != ["explicit-context", "current-window-candidate", "saved-session-candidate"]:
        errors.append("Define ContextPolicy resolution order changed")
    if define_policy.get("sufficiency_states") != ["sufficient", "insufficient", "indeterminate"] or define_policy.get("continuation_state") != "sufficient":
        errors.append("Define ContextPolicy must continue only from sufficient")
    define_obligations = external_records.get("CA2-CAP-OBLIGATIONS-DEFINE-SHARED-MEANING", {}).get("obligations", [])
    obligation_ids = [item.get("obligation_id") for item in define_obligations if isinstance(item, dict)]
    if len(define_obligations) != 23 or len(obligation_ids) != len(set(obligation_ids)):
        errors.append("Define obligation registry must contain exactly 23 unique obligations")
    known_gaps = [item for item in define_obligations if item.get("current_status") == "known-gap"]
    if known_gaps:
        errors.append("Define obligation registry contains obsolete runtime known-gap status")
    if any(item.get("current_status") not in {"not-assessed", "known-gap"} for item in define_obligations):
        errors.append("Define candidate obligations may not claim an aggregate verdict")
    define_binding = external_records.get("CA2-CAP-BIND-DEFINE-CLI", {})
    if define_binding.get("agent_capability_ref") != "CA2-AGENT-CAP-DEFINE-CLI" or define_binding.get("agent_capability_reference_ref") != "CA2-REF-DEFINE-CLI":
        errors.append("Define realization binding must identify the standalone Define CLI capability")
    if define_binding.get("coverage") != "substantial" or define_binding.get("conformance_posture", {}).get("state") != "not-assessed":
        errors.append("Define realization binding must remain substantial and behaviorally not assessed")

    definitions = definitions_doc.get("definitions", [])
    definition_by_ref = {
        item.get("definition_ref"): item for item in definitions if isinstance(item, dict)
    }
    if set(definition_by_ref) != {"CAV2-D67", "DEF-ARC-CAPABILITY"}:
        errors.append("definitions must contain exactly Product Capability and Agent Capability references")
    expected_definition_selections = {
        "CAV2-D67": "CAP-SEL-D67",
        "DEF-ARC-CAPABILITY": "CAP-SEL-ARC-AGENT-CAPABILITY",
    }
    for definition_ref, selection_ref in expected_definition_selections.items():
        binding = definition_by_ref.get(definition_ref, {})
        if binding.get("source_selection_ref") != selection_ref:
            errors.append(f"{definition_ref} must bind {selection_ref}")
        if binding.get("local_posture") != "reference-only":
            errors.append(f"{definition_ref} must remain reference-only")

    if state_doc.get("axis_definition_ref") != "CAV2-D23":
        errors.append("state model must bind CAV2-D23")
    if set(state_doc.get("non_implications", [])) != EXPECTED_NON_IMPLICATIONS:
        errors.append("state model must preserve every mandatory non-implication")
    if state_doc.get("authority_effect") != "none":
        errors.append("state model exceeds authority ceiling")

    nodes = nodes_doc.get("nodes", [])
    node_by_id: dict[str, dict[str, Any]] = {}
    for index, node in enumerate(nodes if isinstance(nodes, list) else []):
        node_id = node.get("id")
        if node_id in node_by_id:
            errors.append(f"duplicate node id: {node_id}")
        node_by_id[node_id] = node
        if node.get("authority_effect") != "none":
            errors.append(f"nodes[{index}] exceeds authority ceiling")
        for ref in node.get("source_refs", []):
            if ref not in known_selections:
                errors.append(f"nodes[{index}] unknown source ref: {ref}")
    product_concept = node_by_id.get("CA2-CONCEPT-PRODUCT-CAPABILITY", {})
    agent_concept = node_by_id.get("CA2-CONCEPT-AGENT-CAPABILITY", {})
    reference_concept = node_by_id.get("CA2-CONCEPT-CAPABILITY-REFERENCE", {})
    if product_concept.get("definition_ref") != "CAV2-D67":
        errors.append("Product Capability concept must bind CAV2-D67")
    if agent_concept.get("definition_ref") != "DEF-ARC-CAPABILITY":
        errors.append("Agent Capability concept must bind DEF-ARC-CAPABILITY")
    if reference_concept.get("definition_ref") is not None:
        errors.append("Capability Reference must not become a generic Capability definition")
    boundary_text = " ".join(
        str(item.get("forbidden_collapse", ""))
        for item in (product_concept, agent_concept, reference_concept)
    )
    for required in ("Agent Capability", "Product Capability", "generic Capability", "permission", "ownership transfer"):
        if required not in boundary_text:
            errors.append(f"capability non-collapse boundary missing: {required}")

    residue = residue_doc.get("residue", [])
    residue_by_id = {item.get("id"): item for item in residue if isinstance(item, dict)}
    unique(list(residue_by_id), "residue id", errors)
    for index, item in enumerate(residue if isinstance(residue, list) else []):
        for ref in item.get("subject_refs", []):
            if ref not in node_by_id:
                errors.append(f"residue[{index}] unknown subject ref: {ref}")
        for ref in item.get("source_refs", []):
            if ref not in known_selections:
                errors.append(f"residue[{index}] unknown source ref: {ref}")

    references = references_doc.get("references", [])
    reference_ids: list[Any] = []
    capability_refs: list[Any] = []
    for index, reference in enumerate(references if isinstance(references, list) else []):
        reference_ids.append(reference.get("reference_id"))
        capability_ref = reference.get("capability_ref")
        capability_refs.append(capability_ref)
        kind = reference.get("capability_kind")
        expected_definition = "CAV2-D67" if kind == "product" else "DEF-ARC-CAPABILITY" if kind == "agent" else None
        if reference.get("definition_ref") != expected_definition:
            errors.append(f"references[{index}] capability kind and definition mismatch")
        expected_role = "product_capability_projection" if kind == "product" else "agent_capability_projection"
        if node_by_id.get(capability_ref, {}).get("role") != expected_role:
            errors.append(f"references[{index}] lacks matching {expected_role} node")
        source_ref = reference.get("source_selection_ref")
        if source_ref not in known_selections:
            errors.append(f"references[{index}] unknown source selection: {source_ref}")
        selected = selection_value.get(source_ref)
        selected_identity = selected.get("id", selected.get("capability_id")) if isinstance(selected, dict) else None
        if kind == "product" and isinstance(selected, dict) and selected_identity != capability_ref:
            errors.append(f"references[{index}] source record identity mismatch")
        if reference.get("projection_posture") != "reference-only":
            errors.append(f"references[{index}] attempts capability instance ownership")
        if reference.get("authority_effect") != "none":
            errors.append(f"references[{index}] exceeds authority ceiling")
        lifecycle = reference.get("lifecycle_posture", {})
        for axis in ("kind", "status", "evidence", "commitment", "provenance", "owner"):
            axis_value = lifecycle.get(axis, {})
            if not axis_value.get("vocabulary_ref"):
                errors.append(f"references[{index}] lifecycle axis lacks vocabulary: {axis}")
        for residue_ref in lifecycle.get("residue_refs", []):
            if residue_ref not in residue_by_id:
                errors.append(f"references[{index}] unknown lifecycle residue ref: {residue_ref}")
        for posture_name in ("realization_posture", "conformance_posture"):
            for evidence_ref in reference.get(posture_name, {}).get("evidence_refs", []):
                if evidence_ref not in known_selections:
                    errors.append(f"references[{index}] unknown {posture_name} evidence: {evidence_ref}")
        conformance = reference.get("conformance_posture", {})
        if conformance.get("state") == "not-assessed" and conformance.get("evidence_refs"):
            errors.append(f"references[{index}] not-assessed conformance cannot cite verdict evidence")
        if conformance.get("state") == "conformant" and not conformance.get("evidence_refs"):
            errors.append(f"references[{index}] conformant claim lacks evidence")
    unique(reference_ids, "capability reference id", errors)
    unique(capability_refs, "capability ref", errors)
    required_reference_ids = {
        "CAP-REF-PRODUCT-DEFINE-SHARED-MEANING",
        "CAP-REF-PRODUCT-RESOLVE-LANGUAGE-CONTEXT",
        "CAP-REF-PRODUCT-RESOLVE-REGISTRY-CONTEXT",
        "CAP-REF-AGENT-DEFINE-CLI",
    }
    if not required_reference_ids <= set(reference_ids):
        errors.append("capability references omit one or more required Product or Agent references")

    vocabulary = relations_doc.get("relation_vocabulary", [])
    vocab_by_type = {item.get("type"): item for item in vocabulary if isinstance(item, dict)}
    relations = relations_doc.get("relations", [])
    relation_by_id: dict[str, dict[str, Any]] = {}
    for index, relation in enumerate(relations if isinstance(relations, list) else []):
        relation_id = relation.get("id")
        if relation_id in relation_by_id:
            errors.append(f"duplicate relation id: {relation_id}")
        relation_by_id[relation_id] = relation
        source = node_by_id.get(relation.get("source"))
        target = node_by_id.get(relation.get("target"))
        if not source or not target:
            errors.append(f"relations[{index}] has dangling endpoint")
            continue
        rule = vocab_by_type.get(relation.get("type"))
        if not rule:
            errors.append(f"relations[{index}] unknown relation type")
            continue
        if source.get("role") not in rule.get("source_roles", []) or target.get("role") not in rule.get("target_roles", []):
            errors.append(f"relations[{index}] violates typed endpoint signature")
        if relation.get("authority_effect") != "none":
            errors.append(f"relations[{index}] exceeds authority ceiling")
        relation_source_refs = relation.get("source_refs", [])
        for ref in relation_source_refs:
            if ref not in known_selections:
                errors.append(f"relations[{index}] unknown source ref: {ref}")
        if rule.get("branch_kind") == "bridge":
            if source.get("branch") == target.get("branch"):
                errors.append(f"relations[{index}] bridge relation lacks cross-branch polarity")
            if relation.get("type") in {"realized_by", "contributes_to", "distinguished_from", "uses_agent_capability"}:
                source_paths = {
                    str(source_by_id.get(selection_source_id.get(ref), {}).get("path", ""))
                    for ref in relation_source_refs
                }
                if len(source_paths) < 2:
                    errors.append(f"relations[{index}] bridge lacks separate meaning and realization source evidence")

    views = views_doc.get("views", [])
    view_by_branch = {item.get("branch"): item for item in views if isinstance(item, dict)}
    if set(view_by_branch) != {"business", "system", "bridge"}:
        errors.append("views must contain exactly business, system, and bridge branches")
    for index, view in enumerate(views if isinstance(views, list) else []):
        branch = view.get("branch")
        for ref in view.get("node_refs", []):
            node = node_by_id.get(ref)
            if not node:
                errors.append(f"views[{index}] unknown node ref: {ref}")
            elif branch in {"business", "system"} and node.get("branch") != branch:
                errors.append(f"views[{index}] violates {branch} node polarity")
        for ref in view.get("relation_refs", []):
            relation = relation_by_id.get(ref)
            if not relation:
                errors.append(f"views[{index}] unknown relation ref: {ref}")
                continue
            relation_kind = vocab_by_type.get(relation.get("type"), {}).get("branch_kind")
            if branch == "bridge" and relation_kind != "bridge":
                errors.append(f"views[{index}] contains non-bridge relation")
            if branch in {"business", "system"} and relation_kind not in {branch, "mixed"}:
                errors.append(f"views[{index}] violates {branch} relation polarity")

    digest = material_digest(package_root, errors)
    receipt_current = False
    receipts_dir = package_root / "receipts"
    if receipts_dir.is_dir():
        for path in sorted(receipts_dir.glob("validation-*.json")):
            receipt = load(path, str(path.relative_to(package_root)), errors)
            if schema:
                validate_instance(schema, "validationReceipt", receipt, str(path.relative_to(package_root)), errors)
            if receipt.get("material_digest") == digest and receipt.get("status") == "PASS":
                receipt_current = True
    if not receipt_current:
        warnings.append("no current PASS receipt matches the live material digest")

    checks = [
        "canonical CAV2-D67 reference and external DEF-ARC-CAPABILITY reference without local redefinition",
        "closed Draft 2020-12 schemas for every agent-facing package artifact",
        "schema-amendment preimage and postimage plus digest-bound seven-record migration",
        "closed owner-local Product Capability, contract, ContextPolicy, binding, and obligation records",
        "selector-level source currency across private and public authority boundaries",
        "ProductCapabilityReference or AgentCapabilityReference sum-type closure",
        "source-owned projection identity without capability-instance ownership transfer",
        "CAV2-D23 lifecycle axis separation with source-qualified status vocabularies",
        "realization and conformance posture separation",
        "business, system, and bridge node and typed-relation closure",
        "cross-branch polarity with separate meaning and realization evidence on capability bridges",
        "view and residue reference closure",
        "authority_effect none throughout",
        "content-addressed append-only receipt currency",
    ]
    return {
        "schema_ref": "schemas/capability.schema.json#/$defs/validationReceipt",
        "schema_version": "cav2-capability-validation/v1",
        "validated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/capability",
        "ontology_type": "business-system-bridge",
        "branches": ["business", "system"],
        "bridge": "business-system",
        "authority_effect": "none",
        "counts": {
            "sources": len(sources),
            "selections": len(selections),
            "definitions": len(definitions),
            "capability_references": len(references),
            "nodes": len(nodes),
            "relation_types": len(vocabulary),
            "relations": len(relations),
            "views": len(views),
            "residue": len(residue),
            "external_records": len(external_records),
            "define_obligations": len(define_obligations),
        },
        "material_digest": digest,
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "claim_ceiling": CLAIM_CEILING,
    }


def write_receipt(result: dict[str, Any], package_root: Path = PACKAGE_ROOT) -> Path:
    if result.get("status") != "PASS":
        raise ValueError("cannot write receipt for blocked package")
    path = package_root / "receipts" / f"validation-{result['material_digest'][:16]}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
        if existing.get("material_digest") != result.get("material_digest"):
            raise ValueError(f"receipt collision: {path}")
        return path
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
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
