#!/usr/bin/env python3
"""Fail-closed validator for the CyberAlchemy Workspace capability ontology."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / "cyberAlchemy-v2/workspace"
MATERIAL_FILES = [
    "README.md",
    "capability-ontology.json",
    "definitions.json",
    "evidence/essays-explorer-evidence.json",
    "nodes.json",
    "profile.json",
    "relations.json",
    "residue.json",
    "scripts/validate.py",
    "sources.json",
    "domainspec-project/development-profile-source.json",
    "domainspec-project/development-profile.json",
    "domainspec-project/project.json",
    "domainspec-project/specs/cyberalchemy-workspace/feature.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-snapshot.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-record.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/inspect-workspace.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-interface.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-shell.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-home-page.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-explorer.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-view-model.json",
    "domainspec-project/specs/cyberalchemy-workspace/nodes/workspace-binding.json",
    "domainspec-project/.domainspec/generated/SPEC.md",
    "domainspec-project/.domainspec/generated/build-receipt.json",
    "domainspec-project/.domainspec/generated/graph.json",
    "domainspec-project/.domainspec/generated/markdown-view.json",
    "domainspec-project/.domainspec/generated/source-manifest.json",
    "scripts/compile-domainspec.ts",
    "system-ontology/BRIDGE.json",
    "system-ontology/BRIDGE-VALIDATION.json",
    "system-ontology/NODES.json",
    "system-ontology/PROFILE.json",
    "system-ontology/RELATIONS.json",
]


def load(relative: str):
    return json.loads((PACKAGE / relative).read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_digest() -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update((PACKAGE / relative).read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def main() -> int:
    errors: list[str] = []
    for relative in MATERIAL_FILES:
        if not (PACKAGE / relative).is_file():
            errors.append(f"MISSING_MATERIAL:{relative}")

    try:
        profile = load("profile.json")
        sources = load("sources.json")
        definitions = load("definitions.json")
        nodes_doc = load("nodes.json")
        relations_doc = load("relations.json")
        view = load("capability-ontology.json")
        residue_doc = load("residue.json")
        evidence = load("evidence/essays-explorer-evidence.json")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"LOAD_FAILED:{exc}")
        profile = sources = definitions = nodes_doc = relations_doc = view = residue_doc = evidence = {}

    if profile.get("ontology_id") != "cav2.workspace.capability":
        errors.append("PROFILE_ONTOLOGY_ID_INVALID")
    if profile.get("product_capability_ref") != "CA2-CAP-INSPECT-CYBERALCHEMY-WORKSPACE":
        errors.append("PROFILE_CAPABILITY_REF_INVALID")
    if profile.get("authority_effect") != "none":
        errors.append("PROFILE_AUTHORITY_EFFECT_INVALID")

    source_ids: set[str] = set()
    for source in sources.get("sources", []):
        source_id = source.get("source_id")
        if source_id in source_ids:
            errors.append(f"DUPLICATE_SOURCE:{source_id}")
        source_ids.add(source_id)
        path = ROOT / str(source.get("path", ""))
        if not path.is_file():
            errors.append(f"SOURCE_MISSING:{source_id}")
        elif source.get("posture") == "self-registration-bound-runtime-source":
            if source.get("currentness_check") != "registry-entry-plus-runtime-snapshot":
                errors.append(f"SOURCE_CURRENTNESS_CONTRACT_INVALID:{source_id}")
        elif sha256(path) != source.get("expected_sha256"):
            errors.append(f"SOURCE_DIGEST_DRIFT:{source_id}")

    canonical_refs = {item.get("definition_ref") for item in definitions.get("canonical_bindings", [])}
    if canonical_refs != {"CAV2-D19", "CAV2-D33", "CAV2-D60", "CAV2-D65", "CAV2-D67"}:
        errors.append("CANONICAL_BINDINGS_INVALID")
    proposal_ids = {item.get("definition_id") for item in definitions.get("proposals", [])}
    if proposal_ids != {"WORKSPACE-DEF-001", "WORKSPACE-DEF-002", "WORKSPACE-DEF-003", "WORKSPACE-DEF-004"}:
        errors.append("LOCAL_DEFINITIONS_INVALID")

    nodes = nodes_doc.get("nodes", [])
    node_ids = [node.get("id") for node in nodes]
    if len(node_ids) != len(set(node_ids)):
        errors.append("DUPLICATE_NODE_ID")
    node_set = set(node_ids)
    required_nodes = {
        "CA2-PRODUCT-CYBERALCHEMY",
        "CA2-PROJECT-CYBERALCHEMY-WORKSPACE",
        "CA2-GOAL-CYBERALCHEMY-WORKSPACE-FIRST-VERTICAL",
        "CA2-CAP-INSPECT-CYBERALCHEMY-WORKSPACE",
        "WORKSPACE-ARTIFACT-SNAPSHOT",
        "WORKSPACE-COLLECTION-DEFINITIONS",
        "WORKSPACE-COLLECTION-PRODUCTS",
        "WORKSPACE-COLLECTION-PROJECTS",
        "WORKSPACE-COLLECTION-ONTOLOGIES",
        "CA2-PROJECT-ESSAYS",
    }
    if not required_nodes.issubset(node_set):
        errors.append("REQUIRED_NODES_MISSING")
    for node in nodes:
        if node.get("authority_effect") != "none":
            errors.append(f"NODE_AUTHORITY_EFFECT_INVALID:{node.get('id')}")
        for source_ref in node.get("source_refs", []):
            if source_ref not in source_ids:
                errors.append(f"NODE_SOURCE_UNRESOLVED:{node.get('id')}:{source_ref}")

    relation_ids: set[str] = set()
    external_targets = {"CAV2-D60", "CAV2-D67", "ESSAYS-REALIZATION-BASELINE-003"}
    for relation in relations_doc.get("relations", []):
        relation_id = relation.get("id")
        if relation_id in relation_ids:
            errors.append(f"DUPLICATE_RELATION:{relation_id}")
        relation_ids.add(relation_id)
        if relation.get("source") not in node_set:
            errors.append(f"RELATION_SOURCE_UNRESOLVED:{relation_id}")
        if relation.get("target") not in node_set | external_targets:
            errors.append(f"RELATION_TARGET_UNRESOLVED:{relation_id}")
        if relation.get("authority_effect") != "none":
            errors.append(f"RELATION_AUTHORITY_EFFECT_INVALID:{relation_id}")

    if set(view.get("node_refs", [])) != node_set:
        errors.append("VIEW_NODE_CLOSURE_INVALID")
    if set(view.get("relation_refs", [])) != relation_ids:
        errors.append("VIEW_RELATION_CLOSURE_INVALID")
    if view.get("authority_effect") != "none":
        errors.append("VIEW_AUTHORITY_EFFECT_INVALID")

    if evidence.get("source_digest") != "4d0296c48a86eeaa7246681748454fc48e58ed717d1baf75c0d02b0bcd88a19f":
        errors.append("ESSAYS_EVIDENCE_DIGEST_INVALID")
    if evidence.get("authority_effect") != "none":
        errors.append("EVIDENCE_AUTHORITY_EFFECT_INVALID")
    try:
        graph = load("domainspec-project/.domainspec/generated/graph.json")
        build_receipt = load("domainspec-project/.domainspec/generated/build-receipt.json")
        system_profile = load("system-ontology/PROFILE.json")
        bridge_validation = load("system-ontology/BRIDGE-VALIDATION.json")
        if len(graph.get("nodes", [])) != 9 or len(graph.get("edges", [])) != 8:
            errors.append("DOMAINSPEC_GRAPH_CARDINALITY_INVALID")
        if build_receipt.get("status") != "pass":
            errors.append("DOMAINSPEC_BUILD_RECEIPT_INVALID")
        graph_digest = sha256(PACKAGE / "domainspec-project/.domainspec/generated/graph.json")
        if system_profile.get("ontology_id") != "cav2.workspace.system-runtime.v1":
            errors.append("SYSTEM_ONTOLOGY_ID_INVALID")
        if system_profile.get("compiled_graph_digest") != graph_digest:
            errors.append("SYSTEM_GRAPH_DIGEST_DRIFT")
        if bridge_validation.get("status") != "PASS" or bridge_validation.get("mapping_count") != 8:
            errors.append("BRIDGE_VALIDATION_INVALID")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"SYSTEM_ARTIFACT_LOAD_FAILED:{exc}")
    for item in residue_doc.get("residue", []):
        if item.get("authority_effect") != "none":
            errors.append(f"RESIDUE_AUTHORITY_EFFECT_INVALID:{item.get('id')}")

    status = "PASS" if not errors else "BLOCK"
    print(json.dumps({
        "schema_version": "cav2-workspace-validation/v1",
        "status": status,
        "errors": sorted(errors),
        "node_count": len(nodes),
        "relation_count": len(relation_ids),
        "material_digest": material_digest() if all((PACKAGE / p).is_file() for p in MATERIAL_FILES) else None,
        "authority_effect": "none",
        "claim_ceiling": "Semantic package structure, exact source currentness, closure, and no-effect posture only; no capability adoption, implementation, runtime acceptance, publication, release, deployment, or external effect."
    }, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
