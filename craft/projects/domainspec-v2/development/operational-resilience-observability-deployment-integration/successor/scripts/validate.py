#!/usr/bin/env python3
"""Validate the non-effectful ORODI successor preparation package."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def bound_path(binding: dict) -> Path:
    return REPO / binding["ref"]


def validate_binding(label: str, binding: dict, failures: list[str]) -> None:
    path = bound_path(binding)
    require(path.is_file(), f"{label}: missing {binding.get('ref')}", failures)
    if path.is_file():
        require(sha256(path) == binding.get("sha256"), f"{label}: source digest drift", failures)


def successor_set_digest(paths: list[Path]) -> str:
    lines = [f"{path.relative_to(ROOT).as_posix()}:{sha256(path)}" for path in sorted(paths)]
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def main() -> int:
    failures: list[str] = []
    packet_path = ROOT / "OWNER-DECISION-PACKET.v1-candidate.json"
    product_decision_path = ROOT / "decision-gates/ORODI-PRODUCT-CAPABILITY-ADOPTION-002.decision.json"
    profile_path = ROOT / "domainspec/PROFILE-AMENDMENT.v1-candidate.json"
    source_path = ROOT / "DOMAINSPEC-SOURCE-AMENDMENT.v1-candidate.json"
    migration_path = ROOT / "IMPLEMENTATION-MIGRATION.v1-candidate.json"
    packet = load(packet_path)
    product_decision = load(product_decision_path)
    profile = load(profile_path)
    source = load(source_path)
    migration = load(migration_path)

    require(packet.get("status") == "awaiting-independent-owner-decisions", "packet status must remain awaiting decisions", failures)
    require(packet.get("project_ref") == "CA2-PROJECT-CRAFT", "unexpected coordinating Project", failures)
    require(packet.get("authority_effect") == "none", "packet authority effect must be none", failures)
    require(packet.get("implementation_effect") == "none", "packet implementation effect must be none", failures)
    for label, binding in packet.get("exact_candidates", {}).items():
        validate_binding(f"packet.{label}", binding, failures)

    pack_binding = packet["exact_candidates"]["definition_pack"]
    definition_pack = load(bound_path(pack_binding))
    definition_ids = {item["record_id"] for item in definition_pack.get("handled_definitions", [])}
    proposal = packet.get("definition_disposition_proposal", {})
    shared = set(proposal.get("shared_definition_candidates", []))
    local = set(proposal.get("bounded_context_specialization_candidates", []))
    require(len(definition_ids) == 17, "definition pack must contain 17 handled definitions", failures)
    require(shared.isdisjoint(local), "definition disposition sets overlap", failures)
    require(shared | local == definition_ids, "definition disposition proposal does not cover the exact pack", failures)
    require("CAV2-D70 through CAV2-D81" in proposal.get("allocation_constraint", ""), "reserved definition range not protected", failures)

    owners = load(bound_path(packet["exact_candidates"]["admission_owners"]))
    owner_ids = {item["owner_id"] for item in owners.get("owners", [])}
    required_owner_ids = {
        "CA2-OWNER-CRAFT-PRODUCT",
        "CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY",
        "CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE",
    }
    require(required_owner_ids <= owner_ids, "required registered admission owners are missing", failures)
    decisions = packet.get("decision_requests", [])
    require([item.get("order") for item in decisions] == [1, 2, 3, 4, 5], "decision order must be 1 through 5", failures)
    require(all(item.get("decision_state") != "accepted" for item in decisions), "packet must not manufacture an accepted decision", failures)
    require(all(item.get("dependent_state") == "not_evaluable" for item in decisions), "dependent decisions must remain not_evaluable", failures)

    require(
        sha256(product_decision_path) == "013c8453c91ad2c5b7348408b770d6a2b59e63439cd54357db82a370e3deeaf1",
        "Product Capability owner-decision digest drift",
        failures,
    )
    require(product_decision.get("decision_id") == "ORODI-DECISION-PRODUCT-CAPABILITIES-002", "unexpected Product Capability decision ID", failures)
    require(product_decision.get("owner_ref") == "CA2-OWNER-CRAFT-PRODUCT", "unexpected Product Capability decision owner", failures)
    require(product_decision.get("decision_state") == "adopted", "Product Capability decision is not adopted", failures)
    require(product_decision.get("chosen_option") == "PC-ADOPT-PRESERVE", "Product Capability identities were not preserved", failures)
    product_subject = product_decision.get("subject", {})
    product_manifest_path = REPO / product_subject.get("ref", "")
    require(product_manifest_path.is_file(), "Product Capability decision subject is missing", failures)
    if product_manifest_path.is_file():
        require(sha256(product_manifest_path) == product_subject.get("sha256"), "Product Capability decision subject digest drift", failures)

    for label in ("base_profile_ref", "language_ref", "meta_type_registry_ref", "formation_projection_ref"):
        validate_binding(f"profile.{label}", profile[label], failures)
    require(profile.get("profile_delta", {}).get("add_kinds") == ["Value Object"], "profile must add only Value Object", failures)
    dispositions = {item["symbol"]: item["kind"] for item in profile.get("type_dispositions", [])}
    expected_dispositions = {
        "OperationalObservation": "Entity",
        "EvaluationClaim": "Entity",
        "TelemetryAccounting": "Value Object",
        "ControlReceipt": "Value Object",
        "OperationalEvaluationBundle": "Value Object",
        "OperationalEvaluationReceipt": "Value Object",
    }
    require(dispositions == expected_dispositions, "type dispositions do not match the reviewed identity split", failures)
    require(profile.get("release_admission") == "not-granted", "profile release admission must remain not-granted", failures)

    for label, binding in source.get("base_source", {}).items():
        if isinstance(binding, dict) and "ref" in binding:
            validate_binding(f"source.base_source.{label}", binding, failures)
    validate_binding("source.profile_amendment_ref", source["profile_amendment_ref"], failures)
    add_nodes = source.get("add_nodes", [])
    require(len(add_nodes) == 6, "source amendment must add exactly six nodes", failures)
    require(len({item.get("node_id") for item in add_nodes}) == 6, "source amendment contains duplicate node IDs", failures)
    require(len({item.get("code_symbol") for item in add_nodes}) == 6, "source amendment contains duplicate code symbols", failures)
    for item in add_nodes:
        validate_binding(f"source.node.{item.get('node_id')}", item, failures)
        node = load(bound_path(item))
        require(node.get("node_id") == item.get("node_id"), f"{item.get('node_id')}: node ID mismatch", failures)
        require(node.get("kind") == item.get("kind"), f"{item.get('node_id')}: kind mismatch", failures)
        fields = node.get("body", {}).get("fields", [])
        if node.get("kind") == "Entity":
            require(any(field.get("identity") is True for field in fields), f"{item.get('node_id')}: Entity lacks identity", failures)
        elif node.get("kind") == "Value Object":
            require(all(field.get("identity") is False for field in fields), f"{item.get('node_id')}: Value Object has designated identity", failures)
            require("equal" in node.get("body", {}).get("equality", "").lower(), f"{item.get('node_id')}: Value Object lacks equality", failures)
    shape = source.get("prospective_graph_shape", {})
    require(shape.get("node_count") == source["base_source"]["node_count"] + len(add_nodes), "prospective node count mismatch", failures)
    require(shape.get("edge_count") == source["base_source"]["edge_count"], "unreviewed edge delta detected", failures)
    require(source.get("materialization_state") == "not-materialized", "source amendment must not claim materialization", failures)

    for binding in migration.get("source_bindings", []):
        validate_binding(f"migration.{binding.get('ref')}", binding, failures)
    migration_sources = {binding["ref"]: bound_path(binding).read_text(encoding="utf-8") for binding in migration.get("source_bindings", [])}
    contract_text = migration_sources.get("projects/domainspec-v2/impl/operational-resilience/contracts/operational-evidence.ts", "")
    evaluator_text = migration_sources.get("projects/domainspec-v2/impl/operational-resilience/src/validate-operational-evidence.ts", "")
    require("OperationalEvaluationResult" in contract_text, "current result type drifted before migration", failures)
    require("OperationalEvaluationReceipt" not in contract_text, "preferred receipt type already present; migration contract is stale", failures)
    require("validateOperationalEvidence" in evaluator_text, "current validation symbol drifted before migration", failures)
    require("evaluateOperationalEvidenceBundle" not in evaluator_text, "preferred evaluation symbol already present; migration contract is stale", failures)
    require(migration.get("status") == "blocked-candidate", "migration must remain blocked-candidate", failures)
    require(migration.get("implementation_effect") == "none", "migration implementation effect must be none", failures)

    node_validator = REPO / "toolchains/node-typescript/bin/node-env"
    node_script = "../development/operational-resilience-observability-deployment-integration/successor/scripts/validate-node-formations.ts"
    formation = subprocess.run(
        [str(node_validator), "run", "--project", "projects/domainspec-v2/impl", "--", "node", "--import", "tsx", node_script],
        cwd=REPO,
        text=True,
        capture_output=True,
        check=False,
    )
    require(formation.returncode == 0, f"DomainSpec formation validation failed: {formation.stderr.strip() or formation.stdout.strip()}", failures)
    formation_result = {}
    if formation.stdout.strip():
        try:
            formation_result = json.loads(formation.stdout)
        except json.JSONDecodeError as error:
            failures.append(f"DomainSpec formation validator emitted invalid JSON: {error}")
    require(formation_result.get("status") == "pass", "DomainSpec formation result is not pass", failures)
    require(formation_result.get("kind_counts") == {"Entity": 2, "Value Object": 4}, "formation kind counts mismatch", failures)

    semantic_paths = [packet_path, product_decision_path, profile_path, source_path, migration_path] + [bound_path(item) for item in add_nodes]
    result = {
        "schema_version": "domainspec.orodi.successor-validation/v1",
        "packet_id": packet.get("packet_id"),
        "successor_set_sha256": successor_set_digest(semantic_paths),
        "status": "pass" if not failures else "fail",
        "checks": {
            "definition_dispositions": len(definition_ids),
            "decision_requests": len(decisions),
            "resolved_product_capability_decisions": 1,
            "registered_required_owners": len(required_owner_ids),
            "source_nodes_added": len(add_nodes),
            "entity_nodes_added": sum(item.get("kind") == "Entity" for item in add_nodes),
            "value_object_nodes_added": sum(item.get("kind") == "Value Object" for item in add_nodes),
            "prospective_graph_nodes": shape.get("node_count"),
            "prospective_graph_edges": shape.get("edge_count"),
            "implementation_source_bindings": len(migration.get("source_bindings", [])),
            "domainspec_formation": formation_result.get("status", "fail"),
            "materialization_state": source.get("materialization_state"),
        },
        "failures": failures,
        "authority_effect": "exact-product-capability-manifest-adoption-only",
        "implementation_effect": "none",
        "claim_ceiling": "The exact Product Capability manifest owner decision is verified. No definition promotion, ontology or DomainSpec admission, graph materialization, implementation mutation, conformance, release, commissioning, publication, or deployment is established.",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
