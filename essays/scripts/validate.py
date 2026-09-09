#!/usr/bin/env python3
"""Validate the Essays semantic package and compiled construction projection."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = PACKAGE_ROOT / "schemas/essays.schema.json"
MATERIAL_FILES = (
    "README.md", "PRODUCT-THESIS.md", "profile.json", "sources.json",
    "definitions.json", "nodes.json", "relations.json",
    "product-ontology.json", "capability-ontology.json", "residue.json",
    "schemas/essays.schema.json", "scripts/validate.py",
    "research/open-source-writing-substrate/RESEARCH.md",
    "research/open-source-writing-substrate/selection-candidate.json",
    "research/open-source-writing-substrate/dependency-surface-review.json",
    "domainspec-project/development-profile-source.json",
    "domainspec-project/development-profile.json",
    "domainspec-project/project.json",
    "domainspec-project/specs/essays-runtime/feature.json",
    "scripts/compile-domainspec.ts",
    "system-ontology/BRIDGE.json",
    "implementation/REALIZATION-BASELINE.candidate.json",
    "implementation/OWNER-ACCEPTANCE-REQUEST.json",
    "implementation/OWNER-ACCEPTANCE-RECEIPT.json",
    "implementation/task-session/context/RUNTIME-HANDOFF.md",
    "implementation/task-session/context/runtime-handoff-index.json",
    "implementation/history/REALIZATION-BASELINE-001.superseded.json",
    "implementation/history/OWNER-ACCEPTANCE-REQUEST-001.superseded.json",
    "implementation/decision-gate/option-admissibility-request.json",
    "implementation/decision-gate/option-admissibility-receipt.json",
    "implementation/decision-gate/DECISION.md",
    "implementation/semantic-explorer/REALIZATION-BASELINE.candidate.json",
    "implementation/semantic-explorer/OWNER-ACCEPTANCE-REQUEST.json",
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def load_json(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path.relative_to(REPOSITORY_ROOT)}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path.relative_to(REPOSITORY_ROOT)} must contain one JSON object")
        return {}
    return value


def heading_bytes(path: Path, heading: str) -> bytes:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next(index for index, line in enumerate(lines) if line.rstrip("\r\n") == heading)
    level = len(heading) - len(heading.lstrip("#"))
    end = len(lines)
    for index in range(start + 1, len(lines)):
        stripped = lines[index].lstrip()
        if not stripped.startswith("#"):
            continue
        candidate_level = len(stripped) - len(stripped.lstrip("#"))
        if candidate_level <= level and stripped[candidate_level:candidate_level + 1] == " ":
            end = index
            break
    return "".join(lines[start:end]).encode()


def validate_instance(
    schema: dict[str, Any], definition: str, value: dict[str, Any],
    label: str, errors: list[str],
) -> None:
    validator = Draft202012Validator({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    })
    for violation in sorted(validator.iter_errors(value), key=lambda item: list(item.path)):
        locator = ".".join(str(part) for part in violation.path)
        errors.append(f"{label}{'.' + locator if locator else ''}: {violation.message}")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    checks: list[str] = []
    schema = load_json(SCHEMA_PATH, errors)
    if schema:
        try:
            Draft202012Validator.check_schema(schema)
            checks.append("Draft 2020-12 package schema is structurally valid")
        except Exception as exc:
            errors.append(f"schema is invalid: {exc}")

    documents = {
        "profile": ("profile.json", "profile"),
        "sources": ("sources.json", "sourceRegistry"),
        "definitions": ("definitions.json", "definitionRegistry"),
        "nodes": ("nodes.json", "nodeRegistry"),
        "relations": ("relations.json", "relationRegistry"),
        "product": ("product-ontology.json", "ontologyView"),
        "capability": ("capability-ontology.json", "ontologyView"),
        "residue": ("residue.json", "residueRegistry"),
    }
    loaded: dict[str, dict[str, Any]] = {}
    for name, (relative, definition) in documents.items():
        value = load_json(PACKAGE_ROOT / relative, errors)
        loaded[name] = value
        if schema and value:
            validate_instance(schema, definition, value, relative, errors)
    if not errors:
        checks.append("eight semantic package records conform to closed schemas")

    sources = loaded.get("sources", {})
    source_by_id = {item.get("source_id"): item for item in sources.get("sources", [])}
    selection_ids: set[str] = set()
    for selection in sources.get("selections", []):
        selection_id = selection.get("selection_id")
        if selection_id in selection_ids:
            errors.append(f"duplicate source selection: {selection_id}")
        selection_ids.add(selection_id)
        source = source_by_id.get(selection.get("source_id"))
        if not source:
            errors.append(f"selection uses unknown source: {selection_id}")
            continue
        path = REPOSITORY_ROOT / source.get("path", "")
        if not path.is_file():
            errors.append(f"source is missing: {source.get('source_id')}")
            continue
        current_file_digest = digest(path.read_bytes())
        if current_file_digest != source.get("observed_file_sha256"):
            warnings.append(f"whole-file diagnostic drift: {source.get('source_id')}")
        try:
            if selection.get("selector_kind") == "markdown-heading":
                selected = heading_bytes(path, selection.get("selector", ""))
            else:
                selected = canonical_json(json.loads(path.read_text(encoding="utf-8")))
        except (ValueError, OSError, json.JSONDecodeError, StopIteration) as exc:
            errors.append(f"cannot resolve selection {selection_id}: {exc}")
            continue
        if digest(selected) != selection.get("selection_sha256"):
            errors.append(f"selector digest drift: {selection_id}")
    checks.append("selector-bound source currency checked; unrelated whole-file drift is diagnostic")

    nodes = loaded.get("nodes", {}).get("nodes", [])
    node_ids = [item.get("id") for item in nodes]
    if len(node_ids) != len(set(node_ids)):
        errors.append("node IDs must be unique")
    node_id_set = set(node_ids)
    relations = loaded.get("relations", {}).get("relations", [])
    relation_ids = [item.get("id") for item in relations]
    if len(relation_ids) != len(set(relation_ids)):
        errors.append("relation IDs must be unique")
    relation_id_set = set(relation_ids)
    relation_types = {item.get("type") for item in relations}
    for relation in relations:
        if relation.get("source") not in node_id_set or relation.get("target") not in node_id_set:
            errors.append(f"relation endpoint is unknown: {relation.get('id')}")
        if not set(relation.get("source_refs", [])).issubset(selection_ids):
            errors.append(f"relation source reference is unknown: {relation.get('id')}")
    for node in nodes:
        if not set(node.get("source_refs", [])).issubset(selection_ids):
            errors.append(f"node source reference is unknown: {node.get('id')}")
    for view_name in ("product", "capability"):
        view = loaded.get(view_name, {})
        if not set(view.get("node_refs", [])).issubset(node_id_set):
            errors.append(f"{view_name} ontology uses an unknown node")
        if not set(view.get("relation_refs", [])).issubset(relation_id_set):
            errors.append(f"{view_name} ontology uses an unknown relation")
    checks.append("node, relation, source, and ontology-view closure checked")

    required_nodes = {
        "CA2-PRODUCT-ESSAYS", "CA2-THESIS-ESSAYS", "CA2-PROJECT-ESSAYS",
        "CA2-GOAL-ESSAYS-FIRST-RUNTIME", "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
        "CA2-REF-ARC-WHISPER", "ESSAYS-ARTIFACT-TEXT-INTENT",
        "ESSAYS-ARTIFACT-DRAFT", "ESSAYS-ARTIFACT-REVIEW",
        "ESSAYS-ARTIFACT-LEARNING-RESIDUE", "ESSAYS-ARTIFACT-EXPORT",
        "CA2-CAP-INSPECT-ESSAYS-PRODUCT-MODEL",
        "ESSAYS-OUTCOME-INSPECTABLE-PRODUCT-MODEL",
        "ESSAYS-ARTIFACT-PRODUCT-MODEL-VIEW",
        "ESSAYS-COLLECTION-DEFINITIONS", "ESSAYS-COLLECTION-PRODUCTS",
        "ESSAYS-COLLECTION-PROJECTS", "ESSAYS-COLLECTION-ONTOLOGIES",
    }
    if not required_nodes.issubset(node_id_set):
        errors.append("required Essays product/capability nodes are incomplete")
    required_relation_types = {
        "subproduct_of", "guided_by", "develops", "belongs_to",
        "tests_realization_of", "includes", "candidate_realized_by",
        "consumes", "produces", "exposes_review", "preserves", "derived_from",
    }
    if not required_relation_types.issubset(relation_types):
        errors.append("required Essays product/capability relations are incomplete")
    whisper_edges = [item for item in relations if item.get("type") == "candidate_realized_by"]
    if whisper_edges != [next((item for item in relations if item.get("id") == "ESSAYS-REL-010"), None)]:
        errors.append("Whisper must have exactly one candidate realization edge")
    if any(item.get("type") == "realized_by" and item.get("target") == "CA2-REF-ARC-WHISPER" for item in relations):
        errors.append("Whisper must not be represented as an accepted realization")
    checks.append("Product, Project, Goal, Product Capability, and Whisper non-collapse checked")

    residue = loaded.get("residue", {}).get("residue", [])
    residue_ids = {item.get("residue_id") for item in residue}
    required_residue = {
        "ESSAYS-RES-001-OSS-SUBSTRATE",
        "ESSAYS-RES-002-WHISPER-CAPABILITY-BINDING",
        "ESSAYS-RES-003-DOMAINSPEC-CONSTRUCTION",
        "ESSAYS-RES-004-UX-EVIDENCE",
        "ESSAYS-RES-005-SEMANTIC-EXPLORER-ADMISSION",
    }
    if not required_residue.issubset(residue_ids):
        errors.append("required construction and product residue is incomplete")
    if loaded.get("profile", {}).get("construction_state") != "development-system-ontology-compiled":
        errors.append("package construction state must name the development system ontology")

    construction_paths = {
        "graph": PACKAGE_ROOT / "domainspec-project/.domainspec/generated/graph.json",
        "build_receipt": PACKAGE_ROOT / "domainspec-project/.domainspec/generated/build-receipt.json",
        "system_profile": PACKAGE_ROOT / "system-ontology/PROFILE.json",
        "system_nodes": PACKAGE_ROOT / "system-ontology/NODES.json",
        "system_relations": PACKAGE_ROOT / "system-ontology/RELATIONS.json",
        "bridge": PACKAGE_ROOT / "system-ontology/BRIDGE.json",
        "bridge_validation": PACKAGE_ROOT / "system-ontology/BRIDGE-VALIDATION.json",
    }
    construction = {
        name: load_json(path, errors) for name, path in construction_paths.items()
    }
    graph = construction.get("graph", {})
    system_profile = construction.get("system_profile", {})
    bridge_validation = construction.get("bridge_validation", {})
    if graph.get("project_id") != "essays-runtime":
        errors.append("compiled DomainSpec graph has the wrong project identity")
    graph_digest = digest(construction_paths["graph"].read_bytes()) if construction_paths["graph"].is_file() else ""
    if system_profile.get("compiled_graph_digest") != graph_digest:
        errors.append("system ontology profile does not bind the exact compiled graph")
    if system_profile.get("source_set_digest") != graph.get("source_set_digest"):
        errors.append("system ontology profile does not bind the compiled source set")
    if system_profile.get("implementation_state") != "not-started":
        errors.append("system ontology must not claim implementation before its binding exists")
    if system_profile.get("domainspec_conformance") != "development-profile-build-pass-release-admission-not-granted":
        errors.append("system ontology must preserve the DomainSpec development-only claim ceiling")
    if set(system_profile.get("product_capability_refs", [])) != {
        "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
        "CA2-CAP-INSPECT-ESSAYS-PRODUCT-MODEL",
    }:
        errors.append("system ontology must bind both Essays Product Capabilities")
    if bridge_validation.get("status") != "PASS" or bridge_validation.get("source_graph_digest") != graph_digest:
        errors.append("semantic-to-system bridge validation is missing or stale")
    bridge_digest = digest(construction_paths["bridge"].read_bytes()) if construction_paths["bridge"].is_file() else ""
    if bridge_validation.get("bridge_digest") != bridge_digest:
        errors.append("bridge validation does not bind the exact bridge bytes")
    if len(graph.get("nodes", [])) == 0 or len(graph.get("edges", [])) == 0:
        errors.append("compiled DomainSpec graph must contain nodes and relations")
    accepted_baseline_path = PACKAGE_ROOT / "implementation/REALIZATION-BASELINE.candidate.json"
    accepted_request_path = PACKAGE_ROOT / "implementation/OWNER-ACCEPTANCE-REQUEST.json"
    acceptance_path = PACKAGE_ROOT / "implementation/OWNER-ACCEPTANCE-RECEIPT.json"
    accepted_baseline = load_json(accepted_baseline_path, errors)
    accepted_request = load_json(accepted_request_path, errors)
    owner_acceptance = load_json(acceptance_path, errors)
    if accepted_baseline.get("status") != "candidate-awaiting-owner-acceptance":
        errors.append("immutable accepted realization source must preserve its pre-decision status")
    if accepted_baseline.get("baseline_id") != "ESSAYS-REALIZATION-BASELINE-002":
        errors.append("accepted first-runtime realization identity is not epoch 002")
    if accepted_baseline.get("acceptance", {}).get("state") != "not-accepted":
        errors.append("immutable accepted realization source must not be rewritten with detached acceptance")
    editor_candidate = accepted_baseline.get("editor_adapter_candidate", {})
    dependency_review_path = PACKAGE_ROOT / "research/open-source-writing-substrate/dependency-surface-review.json"
    dependency_review_digest = digest(dependency_review_path.read_bytes()) if dependency_review_path.is_file() else ""
    if editor_candidate.get("dependency_surface_review_digest") != dependency_review_digest:
        errors.append("realization baseline does not bind the exact dependency surface review")
    if editor_candidate.get("candidate_version") != "7.21.3":
        errors.append("Milkdown candidate must bind the verified 7.21.3 release")
    if set(editor_candidate.get("direct_package_allowlist", [])) != {
        "@milkdown/core", "@milkdown/plugin-history",
        "@milkdown/plugin-listener", "@milkdown/preset-commonmark",
    }:
        errors.append("Milkdown direct package allowlist is not the reviewed minimal set")
    if set(editor_candidate.get("direct_package_denylist", [])) != {
        "@milkdown/kit", "@milkdown/react", "@milkdown/crepe",
    }:
        errors.append("Milkdown direct package denylist is incomplete")
    accepted_baseline_digest = digest(accepted_baseline_path.read_bytes()) if accepted_baseline_path.is_file() else ""
    if accepted_request.get("baseline_digest") != accepted_baseline_digest:
        errors.append("accepted owner request does not bind exact first-runtime baseline bytes")
    if accepted_request.get("request_id") != "ESSAYS-REALIZATION-BASELINE-REQUEST-002":
        errors.append("accepted first-runtime owner request identity is not epoch 002")
    if accepted_request.get("current_decision") is not None:
        errors.append("immutable accepted owner request must preserve its pre-decision state")
    decision_request = load_json(
        PACKAGE_ROOT / "implementation/decision-gate/option-admissibility-request.json",
        errors,
    )
    decision_receipt = load_json(
        PACKAGE_ROOT / "implementation/decision-gate/option-admissibility-receipt.json",
        errors,
    )
    if decision_receipt.get("requestDigest") != digest(canonical_json(decision_request)):
        errors.append("decision-gate receipt does not bind the exact admissibility request")
    if decision_receipt.get("routeOutcome") != "gate" or not decision_receipt.get("decisionGateRequired"):
        errors.append("realization baseline must remain routed through the owner decision gate")
    if set(decision_receipt.get("admissibleOptionIds", [])) != {
        "ESSAYS-DECISION-ACCEPT-002",
        "ESSAYS-DECISION-CHALLENGE-002",
        "ESSAYS-DECISION-STOP-002",
    }:
        errors.append("decision-gate admissible option set is incomplete")
    if owner_acceptance.get("status") != "accepted":
        errors.append("detached owner acceptance is missing or not accepted")
    if owner_acceptance.get("selected_option_id") != "ESSAYS-DECISION-ACCEPT-002":
        errors.append("detached owner acceptance selected the wrong decision option")
    if owner_acceptance.get("baseline_digest") != accepted_baseline_digest:
        errors.append("detached owner acceptance does not bind the exact realization baseline")
    if owner_acceptance.get("owner_request_digest") != digest(accepted_request_path.read_bytes()):
        errors.append("detached owner acceptance does not bind the exact owner request")
    decision_receipt_path = PACKAGE_ROOT / "implementation/decision-gate/option-admissibility-receipt.json"
    if owner_acceptance.get("admissibility_receipt_digest") != digest(decision_receipt_path.read_bytes()):
        errors.append("detached owner acceptance does not bind the exact decision-gate receipt")
    if owner_acceptance.get("implementation_scope") != "cyberAlchemy-v2/essays/runtime":
        errors.append("detached owner acceptance has the wrong implementation scope")
    for field in ("publication_effect", "deployment_effect", "external_effect", "successor_effect"):
        if owner_acceptance.get(field) != "none":
            errors.append(f"detached owner acceptance exceeds its effect ceiling: {field}")

    candidate_root = PACKAGE_ROOT / "implementation/semantic-explorer"
    candidate_baseline_path = candidate_root / "REALIZATION-BASELINE.candidate.json"
    candidate_request_path = candidate_root / "OWNER-ACCEPTANCE-REQUEST.json"
    candidate_baseline = load_json(candidate_baseline_path, errors)
    candidate_request = load_json(candidate_request_path, errors)
    if candidate_baseline.get("baseline_id") != "ESSAYS-REALIZATION-BASELINE-003":
        errors.append("semantic-explorer realization identity is not epoch 003")
    if candidate_baseline.get("status") != "candidate-awaiting-owner-acceptance":
        errors.append("semantic-explorer baseline must remain an unaccepted candidate")
    if candidate_baseline.get("construction_subject_ref") != "CA2-CAP-INSPECT-ESSAYS-PRODUCT-MODEL":
        errors.append("semantic-explorer baseline binds the wrong Product Capability")
    if candidate_baseline.get("acceptance", {}).get("state") != "not-accepted":
        errors.append("semantic-explorer baseline must not embed owner acceptance")
    if candidate_baseline.get("predecessor_acceptance_digest") != digest(acceptance_path.read_bytes()):
        errors.append("semantic-explorer baseline does not bind the accepted predecessor receipt")

    candidate_system_paths = {
        "profile_digest": PACKAGE_ROOT / "system-ontology/PROFILE.json",
        "compiled_graph_digest": PACKAGE_ROOT / "domainspec-project/.domainspec/generated/graph.json",
        "domainspec_build_receipt_digest": PACKAGE_ROOT / "domainspec-project/.domainspec/generated/build-receipt.json",
        "bridge_digest": PACKAGE_ROOT / "system-ontology/BRIDGE.json",
        "bridge_validation_digest": PACKAGE_ROOT / "system-ontology/BRIDGE-VALIDATION.json",
        "compiler_digest": PACKAGE_ROOT / "scripts/compile-domainspec.ts",
    }
    candidate_system_binding = candidate_baseline.get("system_ontology_binding", {})
    for field, path in candidate_system_paths.items():
        if not path.is_file() or candidate_system_binding.get(field) != digest(path.read_bytes()):
            errors.append(f"semantic-explorer system binding is stale: {field}")

    candidate_semantic_paths = {
        "definitions_digest": PACKAGE_ROOT / "definitions.json",
        "product_ontology_digest": PACKAGE_ROOT / "product-ontology.json",
        "capability_ontology_digest": PACKAGE_ROOT / "capability-ontology.json",
        "node_registry_digest": PACKAGE_ROOT / "nodes.json",
        "relation_registry_digest": PACKAGE_ROOT / "relations.json",
    }
    candidate_semantic_binding = candidate_baseline.get("semantic_binding", {})
    for field, path in candidate_semantic_paths.items():
        if not path.is_file() or candidate_semantic_binding.get(field) != digest(path.read_bytes()):
            errors.append(f"semantic-explorer semantic binding is stale: {field}")

    system_node_ids = {node.get("node_id") for node in graph.get("nodes", [])}
    for slice_record in candidate_baseline.get("implementation_slices", []):
        unknown = set(slice_record.get("system_refs", [])) - system_node_ids
        if unknown:
            errors.append(f"semantic-explorer slice uses unknown system refs: {slice_record.get('slice_id')}")
    expected_planned_files = {
        "package.json", "scripts/build-product-model.mjs",
        "src/domain/product-model.generated.ts", "src/domain/product-model.ts",
        "src/domain/product-model.test.ts", "src/domain/ontology.ts",
        "src/domain/runtime.ts", "src/domain/runtime.test.ts", "src/App.tsx",
        "src/styles.css", "scripts/browser-acceptance.mjs",
    }
    implementation_target = candidate_baseline.get("implementation_target", {})
    if set(implementation_target.get("planned_files", [])) != expected_planned_files:
        errors.append("semantic-explorer planned implementation file set drifted")
    for field in (
        "dependency_effect", "persistence_effect", "network_effect",
        "ontology_mutation_effect", "publication_effect",
    ):
        if implementation_target.get(field) != "none":
            errors.append(f"semantic-explorer implementation target exceeds its effect ceiling: {field}")

    candidate_baseline_digest = digest(candidate_baseline_path.read_bytes()) if candidate_baseline_path.is_file() else ""
    if candidate_request.get("baseline_digest") != candidate_baseline_digest:
        errors.append("semantic-explorer owner request does not bind the exact candidate baseline")
    if candidate_request.get("request_id") != "ESSAYS-REALIZATION-BASELINE-REQUEST-003":
        errors.append("semantic-explorer owner request identity is not epoch 003")
    if candidate_request.get("current_decision") is not None:
        errors.append("semantic-explorer owner request must remain undecided")
    if {item.get("option_id") for item in candidate_request.get("decision_options", [])} != {
        "ESSAYS-DECISION-ACCEPT-003",
        "ESSAYS-DECISION-CHALLENGE-003",
        "ESSAYS-DECISION-STOP-003",
    }:
        errors.append("semantic-explorer owner decision options are incomplete")
    for field in (
        "implementation_effect", "ontology_mutation_effect", "publication_effect",
        "deployment_effect", "external_effect", "authority_effect",
    ):
        expected = "none-until-exact-owner-acceptance" if field == "implementation_effect" else "none"
        if candidate_request.get(field) != expected:
            errors.append(f"semantic-explorer owner request has invalid {field}")
    if (candidate_root / "OWNER-ACCEPTANCE-RECEIPT.json").exists():
        errors.append("semantic-explorer acceptance receipt must not exist before an exact owner decision")
    checks.append("open-source, capability-binding, construction, and UX residue preserved")
    checks.append("compiled DomainSpec graph, system ontology, and bridge exact-digest closure checked")
    checks.append("accepted first-runtime baseline and detached owner receipt remain immutable")
    checks.append("semantic-explorer epoch binds exact semantic and system bytes and remains unaccepted")
    checks.append("decision options, planned implementation scope, and effect ceilings checked")

    state = hashlib.sha256()
    material_files = set(MATERIAL_FILES)
    material_files.update(
        str(path.relative_to(PACKAGE_ROOT))
        for path in (PACKAGE_ROOT / "domainspec-project/specs").rglob("*.json")
    )
    material_files.update(
        str(path.relative_to(PACKAGE_ROOT))
        for path in (PACKAGE_ROOT / "domainspec-project/.domainspec/generated").glob("*")
        if path.is_file()
    )
    material_files.update(
        str(path.relative_to(PACKAGE_ROOT))
        for path in (PACKAGE_ROOT / "system-ontology").glob("*.json")
    )
    material_files.update(
        str(path.relative_to(PACKAGE_ROOT))
        for path in (PACKAGE_ROOT / "runtime").rglob("*")
        if path.is_file() and "dist" not in path.parts and "node_modules" not in path.parts
    )
    for relative in sorted(material_files):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        state.update(relative.encode())
        state.update(b"\0")
        state.update(path.read_bytes())
        state.update(b"\0")
    for path in PACKAGE_ROOT.rglob("*"):
        if path.is_file() and "receipts" not in path.parts:
            if any(line.endswith((b" ", b"\t")) for line in path.read_bytes().splitlines()):
                errors.append(f"trailing whitespace: {path.relative_to(PACKAGE_ROOT)}")

    result = {
        "schema_version": "cav2-essays-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/essays",
        "counts": {
            "sources": len(source_by_id), "selections": len(selection_ids),
            "definitions": len(loaded.get("definitions", {}).get("proposals", [])),
            "nodes": len(node_ids), "relations": len(relation_ids),
            "residue": len(residue),
            "system_nodes": len(graph.get("nodes", [])),
            "system_relations": len(graph.get("edges", [])),
            "bridge_mappings": construction.get("bridge_validation", {}).get("mapping_count", 0),
        },
        "material_digest": state.hexdigest(),
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "authority_effect": "none",
        "claim_ceiling": "Selector-bound semantic closure plus exact development-profile DomainSpec graph, generated system ontology, bridge, detached owner acceptance, and implementation-material closure only; no DomainSpec release admission, complete CAV2-D65 ConstructionBinding, runtime/frontend conformance, product value, publication, release, or deployment claim.",
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
