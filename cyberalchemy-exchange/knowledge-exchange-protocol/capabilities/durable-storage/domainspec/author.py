#!/usr/bin/env python3
"""Materialize the authored Durable Storage DomainSpec v2 source."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FEATURE = "durable-storage"


def write(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


NODES = {
    "knowledge-material-object": ("Entity", "Immutable encrypted knowledge material identified by qualified exact-byte identity.", ["object_id", "object_kind", "byte_identity"]),
    "byte-identity": ("Value Object", "Domain-separated algorithm-versioned digest of exact bytes.", ["domain", "algorithm", "algorithm_version", "digest"]),
    "storage-binding": ("Value Object", "Exact namespace, policy, and realization under which an operation is evaluated.", ["namespace", "policy_version", "realization_id"]),
    "storage-locator": ("Value Object", "Replaceable lookup hint that is never object identity.", ["locator_kind", "locator_value"]),
    "recipient-envelope": ("Entity", "Encrypted recipient envelope stored without plaintext, private keys, credentials, or unwrapped content keys.", ["object_id", "recipient_binding", "epoch"]),
    "write-receipt": ("Entity", "Evidence that exact bytes were accepted by one realization under one binding; not proof of future retrieval.", ["object_id", "binding", "locator", "observed_at"]),
    "verified-retrieval": ("Entity", "Retrieved bytes whose qualified identity and required context were verified before dependent use.", ["object_id", "binding", "locator", "observed_at"]),
    "storage-policy": ("Policy", "Versioned retention, access, locality, and recovery requirements independent of provider selection.", ["policy_id", "version", "requirements"]),
    "storage-failure": ("Event", "Typed absent, unavailable, unauthorized, expired, mismatched, policy-mismatched, or ambiguous result.", ["failure_kind", "binding", "observed_at"]),
    "reissue-envelope": ("Operation", "Write and verify replacement bytes, commit the active replacement, then retire prior bytes under policy.", ["old_object_id", "replacement_object_id", "binding"]),
    "realization-identity": ("Value Object", "Exact adapter build, provider kind, configuration schema, endpoint class, locality, and environment identity.", ["adapter", "build", "provider_kind", "configuration_schema", "endpoint_class", "locality", "environment"]),
    "storage-evidence": ("Entity", "Claim evidence bounded to exact realization, binding, policy, environment, and observation interval.", ["evidence_id", "realization_id", "binding", "interval", "result"]),
    "infrastructure-cost": ("Value Object", "Storage infrastructure cost kept separate from knowledge consideration and owner compensation.", ["amount", "unit", "cost_kind"]),
    "confidentiality-boundary": ("Rule", "Only encrypted bytes and allowed metadata may enter storage or evidence.", ["classification", "allowed"]),
    "storage-instantiation": ("Entity", "Complete consumer specialization of object kinds, policies, contexts, realizations, and dependent effects.", ["consumer_id", "semantic_slots", "status"]),
    "storage-input-contract": ("Value Object", "Closed input contract for a storage operation.", ["object_kind", "bytes", "expected_identity", "binding", "context"]),
    "storage-evidence-contract": ("Value Object", "Closed result contract for bounded storage evidence.", ["realization_id", "binding", "policy", "environment", "interval", "result"]),
    "instantiation-context-policy": ("Policy", "Requires every consumer reuse, specialization, and semantic slot before implementation binding.", ["required_slots", "allowed_specializations"]),
    "storage-obligations": ("Rule", "Exact-byte verification, typed failure, confidentiality, evidence bounds, cost separation, and reissue ordering are invariant.", ["obligation_ids"]),
    "persist-material": ("Operation", "Persist classified exact bytes under one current binding and return a bounded write receipt.", ["input_contract", "write_receipt"]),
    "retrieve-and-verify": ("Operation", "Resolve candidate bytes, verify identity and context, and only then return verified retrieval.", ["expected_identity", "binding", "verified_retrieval"]),
    "durability-state": ("State Machine", "Object readiness progresses only from absent to written to verified; failure never advances state.", ["absent", "written", "verified"]),
    "object-verified-retrievable": ("Event", "Exact bytes were retrieved and verified under the declared binding and observation interval.", ["object_id", "evidence_id"]),
    "failure-bounded": ("Event", "A typed failure was emitted with no false storage success.", ["failure_kind", "evidence_id"]),
    "envelope-reissue-safe": ("Event", "Replacement became active only after successful write and verification.", ["old_object_id", "replacement_object_id", "evidence_id"]),
    "knowledge-exchange-protocol": ("Interface", "Provider-neutral durable-storage boundary exposed to Knowledge Exchange Protocol consumers.", ["persist", "retrieve_and_verify", "reissue"]),
    "storage-system-mapping": ("Mapping", "Maps admitted durable-storage business meaning into the compiled system ontology without selecting a provider.", ["source_ontology", "target_system"]),
}


EDGES = [
    ("protocol-exposes-persist", "exposes", "knowledge-exchange-protocol", "persist-material"),
    ("protocol-exposes-retrieve", "exposes", "knowledge-exchange-protocol", "retrieve-and-verify"),
    ("protocol-exposes-reissue", "exposes", "knowledge-exchange-protocol", "reissue-envelope"),
    ("policy-applies-persist", "applies", "storage-policy", "persist-material"),
    ("policy-applies-retrieve", "applies", "storage-policy", "retrieve-and-verify"),
    ("context-applies-instantiation", "applies", "instantiation-context-policy", "storage-instantiation"),
    ("obligations-enforce-persist", "enforces", "storage-obligations", "persist-material"),
    ("obligations-enforce-retrieve", "enforces", "storage-obligations", "retrieve-and-verify"),
    ("confidentiality-enforces-persist", "enforces", "confidentiality-boundary", "persist-material"),
    ("persist-reads-input", "reads", "persist-material", "storage-input-contract"),
    ("persist-produces-write", "produces", "persist-material", "write-receipt"),
    ("retrieve-produces-verified", "produces", "retrieve-and-verify", "verified-retrieval"),
    ("retrieve-produces-failure", "produces", "retrieve-and-verify", "storage-failure"),
    ("reissue-produces-safe", "produces", "reissue-envelope", "envelope-reissue-safe"),
    ("verified-transitions-state", "transitions", "object-verified-retrievable", "durability-state"),
    ("failure-transitions-state", "transitions", "failure-bounded", "durability-state"),
    ("object-contains-identity", "contains", "knowledge-material-object", "byte-identity"),
    ("receipt-contains-locator", "contains", "write-receipt", "storage-locator"),
    ("evidence-contains-realization", "contains", "storage-evidence", "realization-identity"),
    ("evidence-contains-cost", "contains", "storage-evidence", "infrastructure-cost"),
    ("mapping-maps-protocol", "maps", "storage-system-mapping", "knowledge-exchange-protocol"),
]

DEFINITION_MAPPINGS = {
    "KEP-DST-D1": ["knowledge-material-object", "byte-identity"],
    "KEP-DST-D2": ["storage-locator", "byte-identity"],
    "KEP-DST-D3": ["storage-binding", "storage-policy"],
    "KEP-DST-D4": ["write-receipt", "persist-material"],
    "KEP-DST-D5": ["verified-retrieval", "retrieve-and-verify"],
    "KEP-DST-D6": ["storage-failure", "failure-bounded"],
    "KEP-DST-D7": ["reissue-envelope", "envelope-reissue-safe"],
    "KEP-DST-D8": ["realization-identity", "storage-evidence"],
    "KEP-DST-D9": ["storage-evidence", "storage-evidence-contract"],
    "KEP-DST-D10": ["infrastructure-cost"],
    "KEP-DST-D11": ["confidentiality-boundary", "recipient-envelope"],
    "KEP-DST-D12": ["storage-instantiation", "instantiation-context-policy"],
    "KEP-DST-D13": ["storage-input-contract", "persist-material", "retrieve-and-verify"],
    "KEP-DST-D14": ["storage-evidence-contract", "storage-evidence"],
    "KEP-DST-D15": ["storage-obligations", "durability-state"],
}

ONTOLOGY_NODE_MAPPINGS = {
    "CA2-CAP-PERSIST-AND-VERIFY-ENCRYPTED-KNOWLEDGE-MATERIAL": ["knowledge-exchange-protocol", "persist-material", "retrieve-and-verify"],
    "CA2-ACTOR-KEP-DURABLE-STORAGE-CONSUMER": ["knowledge-exchange-protocol"],
    "CA2-ACTOR-KEP-DURABLE-STORAGE-REALIZATION-OWNER": ["realization-identity"],
    "CA2-KEP-DURABLE-KNOWLEDGE-MATERIAL-OBJECT": ["knowledge-material-object"],
    "CA2-KEP-CONTENT-ADDRESSED-BYTE-IDENTITY": ["byte-identity"],
    "CA2-KEP-DURABLE-STORAGE-BINDING": ["storage-binding"],
    "CA2-KEP-STORAGE-LOCATOR": ["storage-locator"],
    "CA2-KEP-STORED-RECIPIENT-ENVELOPE": ["recipient-envelope"],
    "CA2-KEP-STORAGE-WRITE-RECEIPT": ["write-receipt"],
    "CA2-KEP-VERIFIED-RETRIEVAL": ["verified-retrieval"],
    "CA2-KEP-DURABLE-STORAGE-POLICY": ["storage-policy"],
    "CA2-KEP-DURABLE-STORAGE-FAILURE": ["storage-failure"],
    "CA2-KEP-REISSUE-SAFE-ENVELOPE-REPLACEMENT": ["reissue-envelope"],
    "CA2-KEP-DURABLE-STORAGE-REALIZATION-IDENTITY": ["realization-identity"],
    "CA2-KEP-DURABLE-STORAGE-EVIDENCE": ["storage-evidence"],
    "CA2-KEP-DURABLE-STORAGE-INFRASTRUCTURE-COST": ["infrastructure-cost"],
    "CA2-KEP-DURABLE-STORAGE-CONFIDENTIALITY-BOUNDARY": ["confidentiality-boundary"],
    "CA2-KEP-DURABLE-STORAGE-CAPABILITY-INSTANTIATION": ["storage-instantiation"],
    "CA2-CAP-CONTRACT-KEP-DURABLE-STORAGE-INPUT": ["storage-input-contract"],
    "CA2-CAP-CONTRACT-KEP-DURABLE-STORAGE-EVIDENCE": ["storage-evidence-contract"],
    "CA2-CAP-POLICY-KEP-DURABLE-STORAGE-INSTANTIATION": ["instantiation-context-policy"],
    "CA2-CAP-OBLIGATIONS-KEP-DURABLE-STORAGE": ["storage-obligations"],
    "CA2-OUT-KEP-DURABLE-OBJECT-VERIFIED-RETRIEVABLE": ["object-verified-retrievable", "durability-state"],
    "CA2-OUT-KEP-DURABLE-STORAGE-FAILURE-BOUNDED": ["failure-bounded", "storage-failure"],
    "CA2-OUT-KEP-DURABLE-ENVELOPE-REISSUE-SAFE": ["envelope-reissue-safe", "reissue-envelope"],
}

RULE_MAPPINGS = {
    "KEP-DST-RULE-IMMUTABLE-OBJECT": "byte-identity",
    "KEP-DST-RULE-QUALIFIED-BYTE-IDENTITY": "byte-identity",
    "KEP-DST-RULE-BINDING-POLICY-EXACT": "storage-binding",
    "KEP-DST-RULE-LOCATOR-NOT-IDENTITY": "storage-locator",
    "KEP-DST-RULE-WRITE-NOT-DURABILITY": "durability-state",
    "KEP-DST-RULE-VERIFY-BEFORE-DEPENDENT-USE": "retrieve-and-verify",
    "KEP-DST-RULE-FAILURE-NO-SUCCESS": "storage-failure",
    "KEP-DST-RULE-REISSUE-SEQUENCE": "reissue-envelope",
    "KEP-DST-RULE-PROVIDER-NOT-OBJECT-IDENTITY": "realization-identity",
    "KEP-DST-RULE-EVIDENCE-BOUNDED": "storage-evidence",
    "KEP-DST-RULE-COST-SEPARATION": "infrastructure-cost",
    "KEP-DST-RULE-NO-SECRET-MATERIAL": "confidentiality-boundary",
    "KEP-DST-RULE-INSTANTIATION-COMPLETE": "storage-instantiation",
}

PROOF_MAPPINGS = {
    "KEP-DST-PROOF-EXACT-BYTE-ROUNDTRIP": ["persist-material", "retrieve-and-verify", "object-verified-retrievable"],
    "KEP-DST-PROOF-MISMATCH-REJECTED": ["retrieve-and-verify", "storage-failure"],
    "KEP-DST-PROOF-WRITE-NOT-RETRIEVAL": ["write-receipt", "durability-state"],
    "KEP-DST-PROOF-CONFIDENTIALITY-CLASSIFICATION": ["confidentiality-boundary", "persist-material"],
    "KEP-DST-PROOF-REISSUE-ORDERING": ["reissue-envelope", "envelope-reissue-safe"],
    "KEP-DST-PROOF-REALIZATION-IDENTITY-EXACT": ["realization-identity", "storage-evidence"],
    "KEP-DST-PROOF-EVIDENCE-CLAIM-BOUNDED": ["storage-evidence", "storage-evidence-contract"],
    "KEP-DST-PROOF-COST-SEPARATION": ["infrastructure-cost"],
    "KEP-DST-PROOF-INSTANTIATION-COMPLETE": ["storage-instantiation", "instantiation-context-policy"],
}


def main() -> None:
    node_dir = ROOT / f"specs/{FEATURE}/nodes"
    edge_dir = ROOT / f"specs/{FEATURE}/edges"
    for node_id, (kind, description, fields) in NODES.items():
        body_key = "strategies" if kind == "Policy" else "fields"
        body = {"description": description, body_key: fields}
        write(node_dir / f"{node_id}.json", {"schema_version": "domainspec.node/v1", "node_id": node_id, "feature_id": FEATURE, "kind": kind, "body": body})
    for edge_id, relationship, source, target in EDGES:
        write(edge_dir / f"{edge_id}.json", {"schema_version": "domainspec.edge/v1", "edge_id": edge_id, "feature_id": FEATURE, "relationship": relationship, "source_node_id": source, "target_node_id": target, "scope": "feature"})
    write(ROOT / "project.json", {"schema_version": "domainspec.project/v1", "project_id": "knowledge-exchange-protocol", "features": [FEATURE], "cross_feature_edges": []})
    write(ROOT / f"specs/{FEATURE}/feature.json", {"schema_version": "domainspec.feature/v1", "feature_id": FEATURE, "nodes": list(NODES), "edges": [edge[0] for edge in EDGES]})
    ontology_admission = json.loads((ROOT.parent / "decisions/ontology-admission-001.json").read_text(encoding="utf-8"))
    write(ROOT / "binding.json", {
        "schema_version": "cav2-kep-durable-storage-domainspec-binding/v1",
        "binding_id": "CA2-BINDING-KEP-DURABLE-STORAGE-DOMAINSPEC-001",
        "lifecycle_status": "authored-candidate",
        "route_id": "CA2-ROUTE-IMPLEMENT",
        "product_id": "CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL",
        "capability_id": "CA2-CAP-PERSIST-AND-VERIFY-ENCRYPTED-KNOWLEDGE-MATERIAL",
        "ontology_id": "CA2-ONTOLOGY-KEP-DURABLE-STORAGE",
        "source_project_id": "knowledge-exchange-protocol",
        "feature_id": FEATURE,
        "predecessors": {
            "definition_acceptance": {"path": "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/durable-storage/decisions/definition-set-acceptance-001.json", "sha256": "e8ba35fb8912a426def05f4a449e07ac49578afd0f8633e75350309735209206"},
            "product_capability": {"path": "cyberAlchemy-v2/product/knowledge-exchange-protocol/persist-and-verify-encrypted-knowledge-material.product-capability.json", "sha256": "51de7881e4cb2915a85475e21cad60ff7ce933f207678270eb437b35931e9422"},
            "ontology_admission": {"path": "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/durable-storage/decisions/ontology-admission-001.json", "sha256": "b9a8c17a77bc9ea7b957cc81ea2b82f9da15ce435bb63a33f63bcaa1bcd46d35", "admitted_material_digest": "4e86b970b65f1e0ae9bd11dab1f68a113af537ba532ea47661fb8e9f12cea1c3"},
        },
        "selected_ontology_material": ontology_admission["admitted_material"]["artifacts"],
        "definition_mappings": DEFINITION_MAPPINGS,
        "ontology_node_mappings": ONTOLOGY_NODE_MAPPINGS,
        "ontology_rule_mappings": RULE_MAPPINGS,
        "proof_requirement_mappings": PROOF_MAPPINGS,
        "construction_state": {"canonical_definitions": "accepted", "product_capability": "adopted", "business_ontology": "admitted", "domainspec_v2_source": "authored-candidate", "compiled_graph_and_system_ontology": "not_evaluable", "implementation_binding": "not_evaluable", "conformance_evidence": "not_evaluable"},
        "claim_ceiling": "Authored DomainSpec v2 source only; no compilation, implementation, provider selection, publication, deployment, or external effect.",
        "authority_effect": "none",
        "external_effect": "none",
    })


if __name__ == "__main__":
    main()
