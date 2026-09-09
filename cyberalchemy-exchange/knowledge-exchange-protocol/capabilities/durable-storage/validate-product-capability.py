#!/usr/bin/env python3
"""Validate the Durable Storage Product Capability candidate without effects."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
PRODUCT_ROOT = PACKAGE_ROOT.parents[1]
EXPECTED_DEFINITION_IDS = [f"KEP-DST-D{index}" for index in range(1, 16)]
EXPECTED_DEFINITION_DIGEST = "4edb03caab66af2eedf79ad31a47d09b19aec0d975deccfd217195046258c4df"
EXPECTED_DECISION_DIGEST = "e8ba35fb8912a426def05f4a449e07ac49578afd0f8633e75350309735209206"
EXPECTED_CAPABILITY_ID = "CA2-CAP-PERSIST-AND-VERIFY-ENCRYPTED-KNOWLEDGE-MATERIAL"
REQUIRED_RESPONSIBILITY_KEYS = {
    "generic_capability_owns",
    "consumer_instantiation_owns",
    "implementation_binding_owns",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stable_digest(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def load_object(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path.name}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path.name} must contain one object")
        return {}
    return value


def validate_candidate(
    package_root: Path = PACKAGE_ROOT,
    product_root: Path = PRODUCT_ROOT,
) -> dict[str, Any]:
    errors: list[str] = []
    capability_path = product_root / "persist-and-verify-encrypted-knowledge-material.product-capability.json"
    envelope_path = package_root / "product-capability-candidate.json"
    definition_path = package_root / "authority/definitions/DEFINITIONS.md"
    decision_path = package_root / "decisions/definition-set-acceptance-001.json"
    for path in (capability_path, envelope_path, definition_path, decision_path):
        if not path.is_file():
            errors.append(f"missing Product Capability material: {path.name}")

    capability = load_object(capability_path, errors)
    envelope = load_object(envelope_path, errors)
    decision = load_object(decision_path, errors)

    if sha256(definition_path) != EXPECTED_DEFINITION_DIGEST:
        errors.append("accepted durable-storage definition bytes drift")
    if sha256(decision_path) != EXPECTED_DECISION_DIGEST:
        errors.append("definition acceptance decision bytes drift")
    if decision.get("acceptance", {}).get("accepted_definition_source_sha256") != EXPECTED_DEFINITION_DIGEST:
        errors.append("definition acceptance does not bind the expected source")

    required_capability_keys = {
        "schema_ref", "schema_version", "capability_id", "definition_ref", "product_ref",
        "business_ontology_ref", "outcome", "outcome_refs", "scope", "exclusions",
        "participant_refs", "consumer_refs", "input_contract_refs", "output_contract_refs",
        "context_policy_refs", "owner_routes", "lifecycle_posture", "realization_binding_refs",
        "obligation_registry_ref", "evidence_refs", "revision_history", "challenge_route",
        "authority_effect", "claim_limit",
    }
    if set(capability) != required_capability_keys:
        errors.append("Product Capability closed shape drift")
    if capability.get("schema_version") != "cav2-product-capability/v1":
        errors.append("Product Capability schema version drift")
    if capability.get("capability_id") != EXPECTED_CAPABILITY_ID:
        errors.append("Product Capability identity drift")
    if capability.get("definition_ref") != "CAV2-D67" or capability.get("authority_effect") != "none":
        errors.append("Product Capability kind or authority ceiling drift")
    if capability.get("business_ontology_ref") != "CA2-ONTOLOGY-KEP-DURABLE-STORAGE":
        errors.append("future business ontology identity drift")
    if len(capability.get("owner_routes", [])) != 5:
        errors.append("Product Capability must retain five owner routes")
    lifecycle = capability.get("lifecycle_posture", {})
    if lifecycle.get("status", {}).get("value") != "authored-candidate":
        errors.append("Product Capability must remain an authored candidate")
    if lifecycle.get("commitment", {}).get("value") != "not-adopted":
        errors.append("Product Capability candidate must not self-adopt")
    forbidden_provider_names = ("Arweave", "IPFS", "Amazon S3", "Filecoin")
    capability_text = json.dumps(capability, sort_keys=True)
    for provider in forbidden_provider_names:
        if provider in capability_text:
            errors.append(f"Product Capability selects provider: {provider}")
    required_phrases = (
        "verified retrieval",
        "provider-neutral",
        "consumer instantiation",
        "implementation binding",
    )
    normalized_text = capability_text.lower()
    for phrase in required_phrases:
        if phrase not in normalized_text:
            errors.append(f"Product Capability misses boundary phrase: {phrase}")

    if envelope.get("candidate_id") != "CA2-CANDIDATE-KEP-DURABLE-STORAGE-CAPABILITY-001":
        errors.append("candidate envelope identity drift")
    binding = envelope.get("capability", {})
    if binding.get("capability_id") != EXPECTED_CAPABILITY_ID:
        errors.append("candidate envelope capability identity drift")
    if capability_path.is_file() and binding.get("sha256") != sha256(capability_path):
        errors.append("candidate capability digest drift")
    predecessor = envelope.get("predecessors", {})
    definitions = predecessor.get("canonical_definitions", {})
    if definitions.get("sha256") != EXPECTED_DEFINITION_DIGEST:
        errors.append("candidate predecessor definition digest drift")
    if definitions.get("selected_ids") != EXPECTED_DEFINITION_IDS:
        errors.append("candidate predecessor definition closure drift")
    acceptance = predecessor.get("definition_acceptance", {})
    if acceptance.get("sha256") != EXPECTED_DECISION_DIGEST:
        errors.append("candidate predecessor acceptance digest drift")
    if envelope.get("required_definition_bindings") != EXPECTED_DEFINITION_IDS:
        errors.append("required definition binding closure drift")
    responsibility = envelope.get("responsibility_boundary", {})
    if set(responsibility) != REQUIRED_RESPONSIBILITY_KEYS:
        errors.append("three-owner responsibility boundary drift")
    if any(not responsibility.get(key) for key in REQUIRED_RESPONSIBILITY_KEYS):
        errors.append("responsibility boundary contains an empty owner lane")
    expected_state = {
        "canonical_definitions": "accepted",
        "product_capability": "authored-candidate-awaiting-owner-adoption",
        "business_ontology": "not_evaluable",
        "domainspec_v2_source": "not_evaluable",
        "compiled_graph_and_system_ontology": "not_evaluable",
        "implementation_binding": "not_evaluable",
        "conformance_evidence": "not_evaluable",
        "runtime_evidence": "not_evaluable",
    }
    if envelope.get("construction_state") != expected_state:
        errors.append("D65 Product Capability construction state drift")
    if envelope.get("adoption_status") != "not-requested" or envelope.get("successor_authorization") != "none":
        errors.append("candidate envelope exceeds adoption boundary")
    if envelope.get("external_effect") != "none" or envelope.get("enforcement_effect") != "none":
        errors.append("candidate envelope claims an effect")

    material = {
        "capability": sha256(capability_path) if capability_path.is_file() else "missing",
        "envelope": sha256(envelope_path) if envelope_path.is_file() else "missing",
        "definitions": sha256(definition_path) if definition_path.is_file() else "missing",
        "definition_acceptance": sha256(decision_path) if decision_path.is_file() else "missing",
    }
    return {
        "schema_version": "cav2-kep-durable-storage-product-capability-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "capability_id": capability.get("capability_id"),
        "capability_sha256": sha256(capability_path) if capability_path.is_file() else None,
        "definition_count": len(envelope.get("required_definition_bindings", [])),
        "material_digest": stable_digest(material),
        "d65_last_evaluable_stage": "authored Product Capability candidate",
        "authority_effect": "none",
        "external_effect": "none",
        "errors": errors,
    }


def main() -> int:
    result = validate_candidate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
