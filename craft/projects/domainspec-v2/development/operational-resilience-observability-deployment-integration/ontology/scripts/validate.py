#!/usr/bin/env python3
"""Fail-closed structural and exact-byte validation for the isolated ORODI ontology."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import jsonschema


ONTOLOGY_ROOT = Path(__file__).resolve().parents[1]


def find_repo_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / "cyberAlchemy-v2").is_dir() and (candidate / "projects").is_dir():
            return candidate
    raise RuntimeError("repository root not found")


REPO_ROOT = find_repo_root(ONTOLOGY_ROOT)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest_file(path: Path) -> str:
    return digest_bytes(path.read_bytes())


def heading_section(path: Path, selector: str) -> bytes:
    lines = path.read_bytes().splitlines(keepends=True)
    marker = selector.encode("utf-8")
    starts = [index for index, line in enumerate(lines) if line.rstrip(b"\r\n") == marker]
    if len(starts) != 1:
        raise ValueError(f"selector must match exactly once, found {len(starts)}")
    start = starts[0]
    end = next(
        (index for index in range(start + 1, len(lines)) if lines[index].startswith(b"## ")),
        len(lines),
    )
    return b"".join(lines[start:end])


def referenced_digest(ref: dict[str, str]) -> tuple[str, str]:
    path = REPO_ROOT / ref["ref"]
    if not path.is_file():
        return "missing", str(path)
    return digest_file(path), str(path)


def unique(values: list[str], label: str, errors: list[str]) -> None:
    if len(values) != len(set(values)):
        errors.append(f"{label}: duplicate identifiers")


def validate_records(
    schema: dict[str, Any], definition: str, records: list[dict[str, Any]], errors: list[str]
) -> None:
    wrapper = {
        "$schema": schema["$schema"],
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    validator = jsonschema.Draft202012Validator(wrapper)
    for index, record in enumerate(records):
        for error in validator.iter_errors(record):
            location = ".".join(str(part) for part in error.absolute_path) or "record"
            errors.append(f"{definition}[{index}].{location}: {error.message}")


def validate(write_receipt: bool) -> tuple[list[str], dict[str, Any]]:
    errors: list[str] = []
    checks: list[dict[str, Any]] = []

    profile = load_json(ONTOLOGY_ROOT / "profile.json")
    sources_doc = load_json(ONTOLOGY_ROOT / "sources.json")
    capabilities_doc = load_json(ONTOLOGY_ROOT / "capabilities.json")
    nodes_doc = load_json(ONTOLOGY_ROOT / "nodes.json")
    relations_doc = load_json(ONTOLOGY_ROOT / "relations.json")
    bindings_doc = load_json(ONTOLOGY_ROOT / "implementation-bindings.json")
    construction_doc = load_json(ONTOLOGY_ROOT / "construction-bindings.json")
    capability_projection = load_json(ONTOLOGY_ROOT / "domainspec/capability-projection.json")
    projection = load_json(ONTOLOGY_ROOT / "product-ontology-projection.json")
    residue_doc = load_json(ONTOLOGY_ROOT / "residue.json")
    business_admission = load_json(ONTOLOGY_ROOT / "admission/business-ontology-candidate.json")
    profile_admission = load_json(ONTOLOGY_ROOT / "admission/domainspec-profile-candidate.json")
    schema = load_json(ONTOLOGY_ROOT / "schemas/orodi-ontology.schema.json")

    sources = sources_doc["sources"]
    capabilities = capabilities_doc["capabilities"]
    nodes = nodes_doc["nodes"]
    relations = relations_doc["relations"]
    bindings = bindings_doc["bindings"]
    residues = residue_doc["residue"]

    validate_records(schema, "source", sources, errors)
    validate_records(schema, "capability", capabilities, errors)
    validate_records(schema, "node", nodes, errors)
    validate_records(schema, "relation", relations, errors)
    validate_records(schema, "implementationBinding", bindings, errors)
    validate_records(schema, "residue", residues, errors)
    validate_records(schema, "businessOntologyAdmissionCandidate", [business_admission], errors)
    validate_records(schema, "domainspecProfileAdmissionCandidate", [profile_admission], errors)
    checks.append({"check": "local-schema", "records": len(sources) + len(capabilities) + len(nodes) + len(relations) + len(bindings) + len(residues) + 2})

    source_ids = {item["source_id"] for item in sources}
    capability_ids = {item["capability_id"] for item in capabilities}
    node_by_id = {item["node_id"]: item for item in nodes}
    relation_ids = {item["relation_id"] for item in relations}
    residue_ids = {item["residue_id"] for item in residues}
    unique([item["source_id"] for item in sources], "sources", errors)
    unique([item["capability_id"] for item in capabilities], "capabilities", errors)
    unique([item["node_id"] for item in nodes], "nodes", errors)
    unique([item["relation_id"] for item in relations], "relations", errors)
    unique([item["binding_id"] for item in bindings], "implementation bindings", errors)
    unique([item["residue_id"] for item in residues], "residue", errors)

    for source in sources:
        path = REPO_ROOT / source["path"]
        if not path.is_file():
            errors.append(f"{source['source_id']}: source missing: {source['path']}")
            continue
        try:
            selected = (
                path.read_bytes()
                if source["scope_kind"] == "whole-file"
                else heading_section(path, source["selector"])
            )
        except ValueError as error:
            errors.append(f"{source['source_id']}: {error}")
            continue
        actual = digest_bytes(selected)
        if actual != source["sha256"]:
            errors.append(f"{source['source_id']}: source digest drift {source['sha256']} != {actual}")
    checks.append({"check": "source-currency", "sources": len(sources)})

    for capability in capabilities:
        missing = set(capability["source_refs"]) - source_ids
        if missing:
            errors.append(f"{capability['capability_id']}: unknown sources {sorted(missing)}")

    for node in nodes:
        expected_prefix = f"orodi.{node['branch']}."
        if not node["node_id"].startswith(expected_prefix):
            errors.append(f"{node['node_id']}: branch/prefix mismatch")
        missing_caps = set(node["capability_refs"]) - capability_ids
        missing_sources = set(node["source_refs"]) - source_ids
        if missing_caps:
            errors.append(f"{node['node_id']}: unknown capabilities {sorted(missing_caps)}")
        if missing_sources:
            errors.append(f"{node['node_id']}: unknown sources {sorted(missing_sources)}")

    bridge_business: set[str] = set()
    related_system: set[str] = set()
    for relation in relations:
        from_node = node_by_id.get(relation["from"])
        to_node = node_by_id.get(relation["to"])
        if not from_node or not to_node:
            errors.append(f"{relation['relation_id']}: missing endpoint")
            continue
        evidence_refs = set(relation["evidence"]["business_refs"] + relation["evidence"]["system_refs"])
        missing_sources = evidence_refs - source_ids
        if missing_sources:
            errors.append(f"{relation['relation_id']}: unknown evidence {sorted(missing_sources)}")
        if relation["branch"] == "bridge":
            bridge_business.add(relation["from"])
            related_system.add(relation["to"])
            if from_node["branch"] != "business" or to_node["branch"] != "system":
                errors.append(f"{relation['relation_id']}: bridge polarity must be business -> system")
            if not relation["evidence"]["business_refs"] or not relation["evidence"]["system_refs"]:
                errors.append(f"{relation['relation_id']}: bridge requires evidence on both sides")
            if relation["type"] == "depends_on":
                errors.append(f"{relation['relation_id']}: bridge cannot use depends_on")
        else:
            related_system.update((relation["from"], relation["to"]))
            if from_node["branch"] != "system" or to_node["branch"] != "system":
                errors.append(f"{relation['relation_id']}: system relation requires system endpoints")
            if relation["type"] != "depends_on":
                errors.append(f"{relation['relation_id']}: system relation must use depends_on")
        if relation["type"] == "drifts_from" and relation["alignment_state"] != "contradicted":
            errors.append(f"{relation['relation_id']}: drifts_from requires contradicted evidence")

    expected_business = {node["node_id"] for node in nodes if node["branch"] == "business"}
    expected_system = {node["node_id"] for node in nodes if node["branch"] == "system"}
    if bridge_business != expected_business:
        errors.append(f"business bridge coverage mismatch: missing={sorted(expected_business - bridge_business)}")
    if related_system != expected_system:
        errors.append(f"system relation coverage mismatch: missing={sorted(expected_system - related_system)}")
    checks.append({"check": "graph-integrity", "nodes": len(nodes), "relations": len(relations)})

    bound_system: set[str] = set()
    for binding in bindings:
        if binding["capability_ref"] not in capability_ids:
            errors.append(f"{binding['binding_id']}: unknown capability")
        for node_ref in binding["system_node_refs"]:
            bound_system.add(node_ref)
            if node_ref not in expected_system:
                errors.append(f"{binding['binding_id']}: unknown/non-system node {node_ref}")
        for target in binding["target_refs"]:
            actual, path = referenced_digest(target)
            if actual != target["digest"]:
                errors.append(f"{binding['binding_id']}: target digest mismatch {path}")
        if binding["owner_acceptance_ref"] not in (None, "source.orodi.plan-acceptance"):
            errors.append(f"{binding['binding_id']}: unexpected owner acceptance reference")
        if binding["conformance_ref"] is not None:
            errors.append(f"{binding['binding_id']}: candidate binding must not claim conformance")
        if binding["runtime_evidence_refs"]:
            errors.append(f"{binding['binding_id']}: candidate binding must not claim runtime evidence")
    if bound_system != expected_system:
        errors.append(f"implementation binding coverage mismatch: missing={sorted(expected_system - bound_system)}")
    checks.append({"check": "implementation-binding-integrity", "bindings": len(bindings)})

    swu_manifest = load_json(
        REPO_ROOT
        / "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/"
        "development/refinement-runs/20260826T224923Z-orodi-real-infrastructure-experiment/"
        "stages/09-invoke-plan/work-pack/SWU-MANIFEST.json"
    )
    materialization: dict[str, str] = {}
    for unit in swu_manifest["units"]:
        existing = {
            ref for ref in unit["material_writes"] if (REPO_ROOT / ref).exists()
        }
        expected = (
            set(unit["material_writes"])
            if unit["swu_id"] == "SWU-BWCR-001"
            else {
                "projects/domainspec-v2/impl/operational-resilience/README.md"
            } & set(unit["material_writes"])
            if unit["swu_id"] == "SWU-BWCR-002"
            else set()
        )
        if existing != expected:
            errors.append(
                f"{unit['swu_id']}: implementation materialization drift; "
                f"expected existing={sorted(expected)}, actual={sorted(existing)}"
            )
        materialization[unit["swu_id"]] = f"{len(existing)}/{len(unit['material_writes'])}"
    checks.append({"check": "swu-materialization", "existing_over_declared": materialization})

    focused_test = load_json(ONTOLOGY_ROOT / "evidence/focused-test-verification.json")
    actual_test_digest, test_path = referenced_digest(focused_test["target"])
    if actual_test_digest != focused_test["target"]["digest"]:
        errors.append(f"focused test receipt target drift: {test_path}")
    if focused_test["result"] != {
        "status": "pass", "tests": 19, "passed": 19, "failed": 0, "cancelled": 0, "skipped": 0
    }:
        errors.append("focused test verification does not record the expected 19/19 PASS")
    checks.append({"check": "fresh-focused-swu-001-test", "tests": 19, "passed": 19})

    central_schema = load_json(REPO_ROOT / "cyberAlchemy-v2/goals/schemas/goal-package.schema.json")
    construction_schema = {
        "$schema": central_schema["$schema"],
        "$defs": central_schema["$defs"],
        "$ref": "#/$defs/constructionBinding",
    }
    construction_validator = jsonschema.Draft202012Validator(construction_schema)
    for index, record in enumerate(construction_doc["records"]):
        for error in construction_validator.iter_errors(record):
            errors.append(f"construction[{index}]: {error.message}")
        if record["subject_ref"] not in capability_ids:
            errors.append(f"{record['construction_id']}: unknown capability subject")
        exact_refs = (
            record["definition_refs"]
            + record["product_ontology_refs"]
            + record["business_ontology_refs"]
            + [
                record["domainspec_project"], record["domainspec_profile"], record["domainspec_language"],
                record["domainspec_source_set"], {"ref": record["compiler"]["ref"], "digest": record["compiler"]["digest"]},
                record["compiled_graph"], record["system_ontology"], record["implementation"], record["static_conformance"],
            ]
            + record["runtime_evidence_refs"]
        )
        for ref in exact_refs:
            actual, path = referenced_digest(ref)
            if actual != ref["digest"]:
                errors.append(f"{record['construction_id']}: exact ref drift {path}")
        known_evidence = source_ids | residue_ids
        missing_evidence = set(record["evidence_refs"]) - known_evidence
        if missing_evidence:
            errors.append(f"{record['construction_id']}: unknown evidence refs {sorted(missing_evidence)}")
        if record["project_ref"] != "CA2-PROJECT-CRAFT":
            errors.append(f"{record['construction_id']}: unexpected owning Project")
        if record["stage_states"]["runtime_evidence"] != "absent":
            errors.append(f"{record['construction_id']}: runtime evidence must remain absent")
    if {record["subject_ref"] for record in construction_doc["records"]} != capability_ids:
        errors.append("construction binding coverage does not equal capability set")
    checks.append({"check": "d65-construction-binding-schema-and-digests", "records": len(construction_doc["records"])})

    graph_path = ONTOLOGY_ROOT / "domainspec/generated/graph.json"
    system_path = ONTOLOGY_ROOT / "domainspec/generated/system-ontology.json"
    graph = load_json(graph_path)
    system = load_json(system_path)
    system_receipt = load_json(ONTOLOGY_ROOT / "domainspec/generated/system-ontology-receipt.json")
    if system["source_graph_digest"] != digest_file(graph_path):
        errors.append("system ontology source_graph_digest does not match graph bytes")
    if system["source_project_id"] != graph["project_id"]:
        errors.append("system ontology source project mismatch")
    if system["nodes"] != graph["nodes"] or system["edges"] != graph["edges"]:
        errors.append("system ontology is not an exact graph projection")
    if system_receipt["system_ontology_digest"] != digest_file(system_path):
        errors.append("system ontology receipt digest mismatch")
    if not system_receipt["equal_graph_bytes"] or not system_receipt["equal_system_ontology_bytes"]:
        errors.append("two-run determinism evidence is not PASS")
    if system_receipt["profile_release_admission"] != "not-granted":
        errors.append("development profile must remain unadmitted")
    checks.append({"check": "domainspec-system-projection", "nodes": len(graph["nodes"]), "edges": len(graph["edges"])})

    graph_node_ids = {node["node_id"] for node in graph["nodes"]}
    graph_edge_ids = {edge["edge_id"] for edge in graph["edges"]}
    binding_ids = {binding["binding_id"] for binding in bindings}
    projected_graph_nodes: set[str] = set()
    projected_graph_edges: set[str] = set()
    for item in capability_projection["projections"]:
        capability_ref = item["capability_ref"]
        if capability_ref not in capability_ids:
            errors.append(f"capability projection: unknown capability {capability_ref}")
        if set(item["business_node_refs"]) - expected_business:
            errors.append(f"{capability_ref}: unknown projected business nodes")
        if set(item["architecture_system_node_refs"]) - expected_system:
            errors.append(f"{capability_ref}: unknown projected architecture-system nodes")
        if set(item["domainspec_node_refs"]) - graph_node_ids:
            errors.append(f"{capability_ref}: unknown projected DomainSpec nodes")
        if set(item["domainspec_edge_refs"]) - graph_edge_ids:
            errors.append(f"{capability_ref}: unknown projected DomainSpec edges")
        if item["implementation_binding_ref"] not in binding_ids:
            errors.append(f"{capability_ref}: unknown implementation binding")
        projected_graph_nodes.update(item["domainspec_node_refs"])
        projected_graph_edges.update(item["domainspec_edge_refs"])
    if {item["capability_ref"] for item in capability_projection["projections"]} != capability_ids:
        errors.append("capability projection coverage does not equal capability set")
    if projected_graph_nodes != graph_node_ids:
        errors.append(f"DomainSpec node projection gap: {sorted(graph_node_ids - projected_graph_nodes)}")
    if projected_graph_edges != graph_edge_ids:
        errors.append(f"DomainSpec edge projection gap: {sorted(graph_edge_ids - projected_graph_edges)}")
    if capability_projection["source_graph"]["digest"] != digest_file(graph_path):
        errors.append("capability projection graph digest drift")
    for record in construction_doc["records"]:
        expected_bridge = (
            "projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/"
            f"ontology/domainspec/capability-projection.json#{record['subject_ref']}"
        )
        if record["bridge_validation_ref"] != expected_bridge:
            errors.append(f"{record['construction_id']}: invalid capability bridge locator")
    checks.append({"check": "capability-to-domainspec-trace", "capabilities": len(capability_projection["projections"])})

    business_projection = set(projection["business_node_additions"])
    system_projection = set(projection["system_node_additions"])
    if business_projection != expected_business or system_projection != expected_system:
        errors.append("product ontology projection does not cover the node graph exactly")
    if not set(projection["source_additions"]).issubset(source_ids):
        errors.append("product ontology projection contains unknown source additions")
    if projection["projection_state"] != "blocked-before-owner-admission" or projection["authority_effect"] != "none":
        errors.append("product ontology projection exceeds candidate authority")

    if business_admission.get("admission_owner_ref") != "CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY":
        errors.append("business ontology admission candidate has wrong owner")
    manifest_ref = business_admission.get("product_capability_manifest_ref", {})
    actual, path = referenced_digest(manifest_ref)
    if actual != manifest_ref.get("digest"):
        errors.append(f"business ontology admission predecessor manifest drift {path}")
    for ref in business_admission.get("candidate_refs", []):
        actual, path = referenced_digest(ref)
        if actual != ref["digest"]:
            errors.append(f"business ontology admission candidate exact ref drift {path}")
    if profile_admission.get("admission_owner_ref") != "CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE":
        errors.append("DomainSpec profile admission candidate has wrong owner")
    if profile_admission.get("release_admission") != "not-granted":
        errors.append("DomainSpec profile admission candidate must not grant release admission")
    business_ref = profile_admission.get("business_ontology_candidate_ref", {})
    actual, path = referenced_digest(business_ref)
    if actual != business_ref.get("digest"):
        errors.append(f"DomainSpec profile admission predecessor ontology drift {path}")
    for field in (
        "profile_ref", "domainspec_project_ref", "domainspec_feature_ref", "compiled_graph_ref",
        "system_ontology_ref", "determinism_receipt_ref",
    ):
        ref = profile_admission.get(field, {})
        actual, path = referenced_digest(ref)
        if actual != ref.get("digest"):
            errors.append(f"DomainSpec profile admission candidate {field} exact ref drift {path}")
    checks.append({"check": "digest-bound-admission-candidates", "candidates": 2})

    for residue in residues:
        if set(residue["source_refs"]) - source_ids:
            errors.append(f"{residue['residue_id']}: unknown source refs")
        if set(residue["node_refs"]) - set(node_by_id):
            errors.append(f"{residue['residue_id']}: unknown node refs")
        for resolution_ref in residue.get("resolution_refs", []):
            if not (REPO_ROOT / resolution_ref).is_file():
                errors.append(f"{residue['residue_id']}: missing resolution ref {resolution_ref}")
    required_residue = {
        "orodi.residue.owning-project", "orodi.residue.product-capability",
        "orodi.residue.business-ontology-admission", "orodi.residue.domainspec-profile-admission",
        "orodi.residue.construction-binding-registration", "orodi.residue.swu-bwcr-001-closeout",
        "orodi.residue.unimplemented-swus", "orodi.residue.product-ontology-projection",
        "orodi.residue.machine-graph-conformance", "orodi.residue.runtime-evidence",
    }
    if residue_ids != required_residue:
        errors.append(f"residue set mismatch: missing={sorted(required_residue - residue_ids)}")
    open_residue = sum(1 for residue in residues if residue.get("status") == "open")
    resolved_residue = sum(1 for residue in residues if residue.get("status") == "resolved")
    checks.append({"check": "projection-and-residue", "open_residue": open_residue, "resolved_residue": resolved_residue})

    required_package_files = [
        profile["package_files"][key]
        for key in (
            "sources", "capabilities", "nodes", "relations", "implementation_bindings",
            "construction_bindings", "product_ontology_projection", "residue", "schema",
            "validator", "domainspec_project", "system_ontology", "architecture", "architecture_review",
            "domainspec_capability_projection", "business_ontology_admission_candidate",
            "domainspec_profile_admission_candidate",
        )
    ] + profile["package_files"]["views"]
    missing_package_files = [name for name in required_package_files if not (ONTOLOGY_ROOT / name).is_file()]
    if missing_package_files:
        errors.append(f"declared package files missing: {missing_package_files}")

    digest_inputs = sorted(
        path for path in ONTOLOGY_ROOT.rglob("*")
        if path.is_file() and "validation-receipts" not in path.parts and "__pycache__" not in path.parts
    )
    package_digest = digest_bytes(
        b"".join(
            str(path.relative_to(ONTOLOGY_ROOT)).encode("utf-8") + b"\0" + bytes.fromhex(digest_file(path))
            for path in digest_inputs
        )
    )
    receipt = {
        "schema_version": "domainspec.orodi.ontology-validation-receipt/v1",
        "ontology_id": profile["ontology_id"],
        "status": "pass" if not errors else "fail",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "package_digest": package_digest,
        "counts": {
            "sources": len(sources), "capabilities": len(capabilities), "nodes": len(nodes),
            "relations": len(relations), "implementation_bindings": len(bindings),
            "construction_bindings": len(construction_doc["records"]), "open_residue": open_residue,
            "resolved_residue": resolved_residue,
        },
        "checks": checks,
        "errors": errors,
        "authority_effect": "none",
        "claim_ceiling": "Structural, exact-byte, reference, deterministic-build, and candidate-boundary validation only; no ontology admission, conformance, runtime truth, commissioning, publication, or deployment.",
    }
    if write_receipt:
        output = ONTOLOGY_ROOT / "validation-receipts" / f"validation-{package_digest[:16]}.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        if not output.exists():
            output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        receipt["receipt_path"] = str(output.relative_to(REPO_ROOT))
    return errors, receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    errors, receipt = validate(args.write_receipt)
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
