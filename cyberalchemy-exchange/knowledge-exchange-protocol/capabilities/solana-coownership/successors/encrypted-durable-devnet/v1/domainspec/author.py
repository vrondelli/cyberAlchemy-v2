#!/usr/bin/env python3
"""Deterministically author the encrypted durable Devnet DomainSpec v2 source."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
V1_ROOT = PACKAGE_ROOT.parent
REPO_ROOT = next(parent for parent in PACKAGE_ROOT.parents if (parent / "projects/domainspec-v2").is_dir())
ONTOLOGY_ROOT = V1_ROOT / "ontology"
FEATURE_ID = "encrypted-durable-devnet-coownership"
PRODUCT_ID = "CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL"
CAPABILITY_ID = "CA2-CAP-REALIZE-ENCRYPTED-DURABLE-DEVNET-COOWNERSHIP"
ONTOLOGY_ID = "CA2-ONTOLOGY-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET"

EXPECTED = {
    "product-capability.json": "1b841eff87f1e4cd87de71b7b339ecd6c67185337fd17c80c0df88977491470f",
    "decisions/product-capability-adoption-001.json": "c3c5b59d0380e53040f1cdcbae8b3ab36b76150b5f1de403881f9469bf8528e8",
    "decisions/ontology-admission-001.json": "8cbc9225bf429c69a3c3b299a611c70d8fedd3fa604dd832cf74e426ad950746",
}
EXPECTED_ONTOLOGY_CANDIDATE = "a8ed43c990f2f5fbd72f527af9cbbb132bc13025827572e71184c19892dcea84"
EXPECTED_ONTOLOGY_MATERIAL = "13a2df74d14b9c3ee5c3c6035a73e42acd780ca6ffbb5b16c819febd52fe9e49"
PARSER_RELATIVE = "projects/domainspec-v2/impl/cli/src/input/project-model.ts"
EXPECTED_PARSER = "2a4e5de81f3714649ed296446e9aad8d9fd73ebcc632f8d9f14105227a00ce34"

OPERATIONS = [
    "prepare-encrypted-material",
    "persist-and-verify-material",
    "grant-coownership",
    "activate-finalized-delivery",
    "retrieve-active-material",
    "verify-recipient-decryption",
    "request-key-reissue",
    "fulfill-key-reissue",
    "reconcile-delivery",
    "observe-infrastructure-costs",
]


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return value


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def field(field_id: str, primitive: str = "string", *, required: bool = True) -> dict[str, Any]:
    return {
        "field_id": field_id,
        "required": required,
        "type_ref": {"kind": "primitive", "name": primitive},
    }


def reference_field(field_id: str, target: str, *, required: bool = True) -> dict[str, Any]:
    return {
        "field_id": field_id,
        "required": required,
        "type_ref": {"kind": "reference", "selector": f"{FEATURE_ID}:{target}"},
    }


def node(node_id: str, kind: str, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "domainspec.node/v1",
        "feature_id": FEATURE_ID,
        "node_id": node_id,
        "kind": kind,
        "body": body,
    }


def entity(node_id: str, description: str, identity: str, extra_fields: list[dict[str, Any]]) -> dict[str, Any]:
    return node(node_id, "Entity", {
        "description": description,
        "identity_field": identity,
        "fields": [field(identity), *extra_fields],
    })


def value_object(
    node_id: str,
    description: str,
    fields: list[dict[str, Any]],
    invariant: str,
) -> dict[str, Any]:
    return node(node_id, "Value Object", {
        "description": description,
        "fields": fields,
        "invariant_refs": [f"{FEATURE_ID}:{invariant}"],
    })


def operation(
    node_id: str,
    description: str,
    reads: list[str],
    writes: list[str],
    effects: list[str],
    guard: str,
    failure: str,
) -> dict[str, Any]:
    return node(node_id, "Operation", {
        "description": description,
        "reads": reads,
        "writes": writes,
        "effects": effects,
        "guard": guard,
        "failure_continuation": failure,
    })


def event(node_id: str, description: str, occurrence_id: str, payload: list[dict[str, Any]]) -> dict[str, Any]:
    return node(node_id, "Event", {
        "description": description,
        "event_type": node_id,
        "version": "1",
        "occurrence_id": field(occurrence_id),
        "occurred_at_policy": "generated",
        "payload": payload,
    })


def rule_node_id(rule_id: str) -> str:
    return "rule-" + rule_id.removeprefix("KEP-SOL2-RULE-").lower()


def edge(edge_id: str, relationship: str, source: str, target: str) -> dict[str, Any]:
    return {
        "schema_version": "domainspec.edge/v1",
        "edge_id": edge_id,
        "feature_id": FEATURE_ID,
        "relationship": relationship,
        "source_node_id": source,
        "target_node_id": target,
        "scope": "feature",
    }


def core_nodes(rules: dict[str, str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = [
        entity("knowledge-identity", "Stable protocol identity distinct from wallets, signing keys, encryption keys, and storage locators.", "knowledge-identity-id", [field("participant-role")]),
        entity("artifact-state", "Program-controlled state for one immutable artifact version and its co-ownership, envelope, revision, policy, and replay coordinates.", "artifact-version-id", [field("encryption-epoch-id"), field("policy-id"), field("revision", "integer"), field("originator-identity-id"), field("owner-set-commitment"), field("active-envelope-commitment"), field("replay-domain-id")]),
        entity("encrypted-artifact", "Deterministically encoded authenticated ciphertext for the exact artifact version under the bound cryptographic profile.", "qualified-byte-identity", [field("artifact-version-id"), field("cryptographic-profile-id"), field("opaque-locator-commitment")]),
        entity("recipient-envelope", "Deterministically encoded recipient ciphertext binding the content key to B's current encryption-key binding.", "envelope-identity", [field("artifact-version-id"), field("encryption-epoch-id"), field("recipient-identity-id"), field("encryption-key-binding-id"), field("qualified-byte-identity")]),
        entity("program-realization", "Exact source, build, program, loader, upgrade, cluster, and fixture identity bounding Solana evidence.", "program-realization-id", [field("source-digest"), field("build-digest"), field("program-id"), field("cluster-genesis"), field("loader-id"), field("upgrade-posture"), field("fixture-id")]),
        entity("storage-realization", "Exact adapter, binding, policy, topology, environment, and version identity bounding storage evidence.", "storage-realization-id", [field("adapter-id"), field("binding-version"), field("topology-id"), field("environment-id"), field("policy-id")]),
        entity("protocol-evidence", "Environment-bounded evidence aggregate for D65 predecessors, crypto, storage, chain, decryption, reissue, negative cases, and costs.", "evidence-bundle-id", [field("d65-binding-digest"), field("program-realization-id"), field("storage-realization-id"), field("environment-id"), field("observation-interval")]),
        entity("operational-storage-registry", "SQL-portable live registry of qualified object identity and current opaque locator metadata.", "registry-entry-id", [field("qualified-byte-identity"), field("object-kind"), field("opaque-locator"), field("current-revision", "integer")]),
        entity("recovery-journal", "Append-only recovery-event stream for the same operation and qualified object identities.", "journal-event-id", [field("operation-id"), field("qualified-byte-identity"), field("event-kind"), field("previous-event-digest")]),
        entity("immutable-archive", "SQL-independent immutable exact-byte archive used for verification and recovery.", "archive-object-id", [field("qualified-byte-identity"), field("object-kind"), field("retention-policy-id")]),
    ]

    value_specs = [
        ("signing-key-binding", "Scoped current binding from one Knowledge Identity to one Solana signing key for an exact authorization purpose.", [field("knowledge-identity-id"), field("solana-public-key"), field("authorization-purpose"), field("binding-version", "integer")], "rule-key-roles-noncollapse"),
        ("encryption-key-binding", "Current recipient encryption-key binding used for HPKE envelope creation and reissue.", [field("knowledge-identity-id"), field("encryption-public-key"), field("suite-id"), field("binding-version", "integer")], "rule-key-roles-noncollapse"),
        ("knowledge-artifact-version", "Immutable knowledge edition coordinated across encrypted bytes, protocol state, policy, and evidence.", [field("artifact-version-id"), field("plaintext-commitment"), field("encryption-epoch-id"), field("policy-id")], "rule-state-identity-exact"),
        ("coowner-membership", "Program-state membership assertion that does not claim legal title or exclusive rights.", [field("artifact-version-id"), field("knowledge-identity-id"), field("membership-revision", "integer")], "rule-preserve-a"),
        ("recipient-envelope-commitment", "Secret-free commitment binding B's active recipient envelope to exact protocol state.", [field("artifact-version-id"), field("recipient-identity-id"), field("encryption-key-binding-id"), field("qualified-byte-identity")], "rule-onchain-no-secrets"),
        ("content-encryption-suite", "Test-only XChaCha20-Poly1305 content-encryption selection with exact key, nonce, AAD, and serialization constraints.", [field("suite-id"), field("key-bytes", "integer"), field("nonce-bytes", "integer"), field("aad-domain")], "rule-cryptographic-profile-exact"),
        ("recipient-envelope-suite", "Test-only RFC 9180 HPKE Base X25519/HKDF-SHA256/ChaCha20Poly1305 envelope selection.", [field("suite-id"), field("kem-id"), field("kdf-id"), field("aead-id"), field("info-domain")], "rule-cryptographic-profile-exact"),
        ("qualified-byte-identity", "Cryptographic-profile-qualified exact-byte commitment shared by storage, chain, retrieval, and evidence.", [field("profile-id"), field("object-kind"), field("byte-length", "integer"), field("sha256")], "rule-exact-byte-identity"),
        ("opaque-storage-locator", "Provider-neutral resolution metadata excluded from immutable object identity.", [field("locator-kind"), field("locator-value"), field("binding-version", "integer")], "rule-locator-outside-object-identity"),
        ("storage-write-receipt", "Evidence that an exact object write was attempted or recorded, without claiming verified retrieval.", [field("operation-id"), field("qualified-byte-identity"), field("layer-id"), field("receipt-digest")], "rule-write-is-not-verified-retrieval"),
        ("verified-retrieval", "Independent retrieval observation whose bytes recompute to the exact qualified object identity.", [field("qualified-byte-identity"), field("layer-id"), field("retrieval-observation-id"), field("recomputed-sha256")], "rule-exact-byte-identity"),
        ("storage-readiness", "Closure over operational, journal, archive, and verified-retrieval obligations before transaction construction.", [field("operation-id"), field("artifact-qualified-identity"), field("envelope-qualified-identity"), field("readiness-digest")], "rule-three-layer-readiness"),
        ("prepared-material", "Verified encrypted material ready for an attempt but not yet active for B.", [field("artifact-version-id"), field("recipient-identity-id"), field("envelope-qualified-identity"), field("preparation-id")], "rule-finalized-activation"),
        ("active-material", "Exact encrypted artifact and envelope available to B only after finalized state and storage reconciliation.", [field("artifact-version-id"), field("recipient-identity-id"), field("envelope-qualified-identity"), field("activation-revision", "integer")], "rule-finalized-activation"),
        ("grant-replay-domain", "Exact context in which one grant or fulfillment operation identity may succeed only once.", [field("artifact-version-id"), field("policy-id"), field("operation-kind"), field("domain-id")], "rule-replay-once"),
        ("grant-consumption-record", "Program-state proof that one exact replay identity has already been consumed.", [field("domain-id"), field("operation-id"), field("consumed-revision", "integer")], "rule-replay-once"),
        ("grant-input-contract", "Closed input for adding B while preserving A and binding durably prepared material.", [field("artifact-version-id"), field("originator-identity-id"), field("recipient-identity-id"), field("expected-revision", "integer"), field("policy-id"), field("envelope-commitment"), field("operation-id")], "rule-state-identity-exact"),
        ("reissue-input-contract", "Closed replay-safe input for B's request and policy-scoped replacement-envelope fulfillment.", [field("artifact-version-id"), field("recipient-identity-id"), field("new-encryption-key-binding-id"), field("expected-revision", "integer"), field("request-id")], "rule-b-request-only"),
        ("network-cost", "Observed Solana fees, rent, and refundable reserves kept separate from knowledge consideration.", [field("observation-id"), field("fee-lamports", "integer"), field("rent-lamports", "integer"), field("refundable-reserve-lamports", "integer")], "rule-no-price-cost-separation"),
        ("storage-cost", "Observed storage, retrieval, archive, and adapter expense kept separate from knowledge consideration.", [field("observation-id"), field("currency-unit"), field("amount", "decimal"), field("cost-class")], "rule-no-price-cost-separation"),
        ("recipient-decryption-observation", "Evidence that B retrieved, authenticated, decrypted, and recomputed the exact fixture commitment without exposing secrets.", [field("observation-id"), field("artifact-version-id"), field("recipient-identity-id"), field("plaintext-commitment")], "rule-evidence-environment-bounded"),
        ("finalized-state-observation", "Independently fetched finalized program state matching expected revision and active envelope commitment.", [field("observation-id"), field("transaction-signature"), field("slot", "integer"), field("revision", "integer"), field("envelope-commitment")], "rule-finalized-activation"),
        ("end-to-end-evidence-contract", "Required evidence closure for D65 digests, identities, storage, chain, decryption, reissue, negative cases, and costs.", [field("evidence-bundle-id"), field("source-manifest-digest"), field("environment-id"), field("closure-status")], "rule-evidence-closure"),
    ]
    items.extend(value_object(*spec) for spec in value_specs)

    items.extend([
        operation("prepare-encrypted-material", "Encrypt one exact fixture and create B's secret-free recipient envelope under the bound test profile.", ["knowledge-identity", "artifact-state"], ["encrypted-artifact", "recipient-envelope"], ["material-prepared"], "Exact artifact version, epoch, policy, recipient encryption binding, algorithms, nonces, AAD, and serialization are bound.", "Return typed preparation failure and publish no material or secret."),
        operation("persist-and-verify-material", "Write encrypted artifact and envelope through operational and journal ports, archive exact bytes, and independently verify retrieval.", ["encrypted-artifact", "recipient-envelope", "storage-realization"], ["operational-storage-registry", "recovery-journal", "immutable-archive", "protocol-evidence"], ["storage-readiness-established"], "All object identities, layers, policy, and storage realization are exact and provider-neutral.", "Return typed storage failure, withhold readiness, and prohibit transaction construction."),
        operation("grant-coownership", "Atomically add B beside A, bind B's prepared envelope commitment, advance revision, and consume replay identity without knowledge consideration.", ["knowledge-identity", "artifact-state", "program-realization", "storage-realization"], ["artifact-state", "protocol-evidence"], ["durable-grant-finalized"], "A's current signing binding, exact state, storage readiness, preserved A, absent B, and unused replay identity all hold.", "Reject without partial protocol-state mutation or material activation."),
        operation("activate-finalized-delivery", "Promote prepared material only after finalized state, expected revision, matching commitment, and current verified retrieval reconcile.", ["artifact-state", "encrypted-artifact", "recipient-envelope", "program-realization", "storage-realization"], ["artifact-state", "protocol-evidence"], ["finalized-delivery-activated"], "Finalized chain observation and exact-byte retrieval agree on the expected active commitment.", "Withhold activation and record reconciliation-required evidence."),
        operation("retrieve-active-material", "Retrieve the active artifact and envelope through provider-neutral ports and reverify their exact qualified byte identities.", ["artifact-state", "storage-realization", "encrypted-artifact", "recipient-envelope"], ["protocol-evidence"], ["active-material-retrieved"], "Material is active for B and current operational and archive observations resolve to exact bytes.", "Return typed delivery failure without changing owner membership or active commitment."),
        operation("verify-recipient-decryption", "Let B authenticate and decrypt the active material and compare the plaintext commitment with the exact fixture commitment.", ["knowledge-identity", "encrypted-artifact", "recipient-envelope", "protocol-evidence"], ["protocol-evidence"], ["recipient-decryption-verified"], "B's current encryption binding matches the active envelope and no secret enters chain, storage metadata, or evidence.", "Return typed authentication or commitment mismatch without exposing plaintext or keys."),
        operation("request-key-reissue", "Record B's replay-safe request for a replacement envelope under a new current encryption-key binding.", ["knowledge-identity", "artifact-state"], ["artifact-state", "protocol-evidence"], ["key-reissue-requested"], "B is a current co-owner and the request matches exact current state and B's new encryption binding.", "Reject without creating, activating, or authorizing replacement material."),
        operation("fulfill-key-reissue", "Under the exact propagation policy, let A replace only B's active envelope commitment after durable preparation and finalized reconciliation.", ["knowledge-identity", "artifact-state", "program-realization", "storage-realization", "recipient-envelope"], ["artifact-state", "recipient-envelope", "protocol-evidence"], ["reissue-fulfilled"], "A's scoped signing binding, B's valid request, exact policy, durable readiness, replay, and protected-state invariants all hold.", "Keep the prior envelope active and preserve all protected protocol state."),
        operation("reconcile-delivery", "Classify ambiguous, mismatched, orphaned, or not-yet-finalized chain and storage observations without claiming cross-system atomicity.", ["artifact-state", "program-realization", "storage-realization", "protocol-evidence"], ["artifact-state", "protocol-evidence"], ["reconciliation-required"], "Every observation is environment-bound and compared by exact identity, revision, commitment, and interval.", "Remain reconciliation-required and emit no success claim."),
        operation("observe-infrastructure-costs", "Record network and storage costs as separate infrastructure observations without knowledge price, payout, royalty, or escrow.", ["program-realization", "storage-realization", "protocol-evidence"], ["protocol-evidence"], ["devnet-trial-observed"], "The observation is bound to disposable Devnet fixtures and exact runtime identities.", "Record missing cost evidence as not_evaluable; do not infer zero cost or economic success."),
    ])

    event_specs = [
        ("material-prepared", "Exact encrypted artifact and recipient envelope were prepared but are not active.", "preparation-id", [field("artifact-version-id"), field("recipient-identity-id")]),
        ("storage-readiness-established", "All required operational, journal, archive, and verified-retrieval obligations closed for exact material.", "readiness-observation-id", [field("readiness-digest"), field("storage-realization-id")]),
        ("durable-grant-finalized", "A remains an owner, B is added, revision advances, replay is consumed, and finalized state matches prepared material.", "grant-operation-id", [field("artifact-version-id"), field("post-revision", "integer"), field("recipient-identity-id")]),
        ("finalized-delivery-activated", "Prepared material became active only after finalized state and storage reconciliation.", "activation-observation-id", [field("artifact-version-id"), field("activation-revision", "integer")]),
        ("active-material-retrieved", "B's active encrypted artifact and envelope were retrieved and their qualified byte identities reverified.", "retrieval-observation-id", [field("artifact-version-id"), field("recipient-identity-id")]),
        ("recipient-decryption-verified", "B decrypted exact active material and matched the source fixture plaintext commitment.", "decryption-observation-id", [field("artifact-version-id"), field("recipient-identity-id"), field("plaintext-commitment")]),
        ("key-reissue-requested", "B recorded a valid request for a replacement envelope without self-fulfillment authority.", "request-id", [field("artifact-version-id"), field("recipient-identity-id")]),
        ("reissue-fulfilled", "A's policy-scoped fulfillment activated a durably verified replacement envelope while preserving protected state.", "fulfillment-operation-id", [field("artifact-version-id"), field("post-revision", "integer"), field("recipient-identity-id")]),
        ("reconciliation-required", "Chain and storage observations are ambiguous or mismatched and no success may be claimed.", "reconciliation-observation-id", [field("artifact-version-id"), field("reason-code")]),
        ("devnet-trial-observed", "Disposable Devnet runtime and infrastructure-cost observations were recorded under exact identities.", "trial-observation-id", [field("program-realization-id"), field("storage-realization-id"), field("environment-id")]),
    ]
    items.extend(event(*spec) for spec in event_specs)

    items.extend([
        node("coownership-state", "State Machine", {
            "description": "A-preserving co-ownership lifecycle for one exact artifact state.",
            "states": ["originator-only", "originator-and-recipient"],
            "initial": "originator-only",
            "transitions": [{"transition_id": "finalize-grant", "source_state": "originator-only", "target_state": "originator-and-recipient", "guard_ref": f"{FEATURE_ID}:rule-atomic-chain-grant", "effect_event_ref": f"{FEATURE_ID}:durable-grant-finalized"}],
        }),
        node("delivery-state", "State Machine", {
            "description": "Prepared, active, and reconciliation-required lifecycle for recipient material.",
            "states": ["absent", "prepared", "active", "reconciliation-required"],
            "initial": "absent",
            "transitions": [
                {"transition_id": "prepare-material", "source_state": "absent", "target_state": "prepared", "guard_ref": f"{FEATURE_ID}:rule-three-layer-readiness", "effect_event_ref": f"{FEATURE_ID}:material-prepared"},
                {"transition_id": "activate-material", "source_state": "prepared", "target_state": "active", "guard_ref": f"{FEATURE_ID}:rule-finalized-activation", "effect_event_ref": f"{FEATURE_ID}:finalized-delivery-activated"},
                {"transition_id": "require-pre-activation-reconciliation", "source_state": "prepared", "target_state": "reconciliation-required", "guard_ref": None, "effect_event_ref": f"{FEATURE_ID}:reconciliation-required"},
                {"transition_id": "require-post-activation-reconciliation", "source_state": "active", "target_state": "reconciliation-required", "guard_ref": None, "effect_event_ref": f"{FEATURE_ID}:reconciliation-required"},
            ],
        }),
        node("reissue-state", "State Machine", {
            "description": "B-requested, A-fulfilled reissue lifecycle that preserves artifact, owner, epoch, policy, and economic state.",
            "states": ["idle", "requested", "fulfilled"],
            "initial": "idle",
            "transitions": [
                {"transition_id": "record-request", "source_state": "idle", "target_state": "requested", "guard_ref": f"{FEATURE_ID}:rule-b-request-only", "effect_event_ref": f"{FEATURE_ID}:key-reissue-requested"},
                {"transition_id": "finalize-fulfillment", "source_state": "requested", "target_state": "fulfilled", "guard_ref": f"{FEATURE_ID}:rule-policy-scoped-a-fulfillment", "effect_event_ref": f"{FEATURE_ID}:reissue-fulfilled"},
            ],
        }),
    ])

    policy_specs = {
        "cryptographic-profile": ["rule-key-roles-noncollapse", "rule-cryptographic-profile-exact", "rule-onchain-no-secrets", "rule-storage-confidentiality"],
        "durable-storage-policy": ["rule-exact-byte-identity", "rule-write-is-not-verified-retrieval", "rule-three-layer-readiness", "rule-provider-unbound"],
        "propagation-policy": ["rule-preserve-a", "rule-b-request-only", "rule-policy-scoped-a-fulfillment", "rule-reissue-preserves-protocol-state"],
        "devnet-execution-policy": ["rule-program-and-trial-identity-exact", "rule-devnet-nonproduction", "rule-evidence-environment-bounded"],
        "no-price-policy": ["rule-no-price-cost-separation"],
    }
    for policy_id, strategies in policy_specs.items():
        items.append(node(policy_id, "Policy", {
            "description": f"Closed {policy_id.replace('-', ' ')} for the disposable encrypted durable Devnet vertical.",
            "strategies": [f"{FEATURE_ID}:{strategy}" for strategy in strategies],
        }))

    for rule_id, statement in sorted(rules.items()):
        items.append(node(rule_node_id(rule_id), "Rule", {"description": statement, "predicate": statement}))

    interface_operations = []
    for operation_id in OPERATIONS:
        request_type = "reissue-input-contract" if "reissue" in operation_id else "grant-input-contract" if operation_id == "grant-coownership" else "knowledge-artifact-version"
        interface_operations.append({
            "operation_id": operation_id,
            "operation_ref": f"{FEATURE_ID}:{operation_id}",
            "request": [reference_field("request", request_type)],
            "result": [reference_field("evidence", "end-to-end-evidence-contract")],
        })
    items.append(node("knowledge-exchange-protocol", "Interface", {
        "description": "Internal protocol boundary for encrypted, durable, no-price Devnet co-ownership and policy-scoped reissue.",
        "boundary_kind": "internal",
        "version": "1",
        "compatibility": "exact",
        "operations": interface_operations,
    }))
    items.append(node("encrypted-durable-devnet-workflow", "Workflow", {
        "description": "End-to-end non-production workflow from encryption through verified storage, finalized grant, decryption, reissue, reconciliation, and cost evidence.",
        "steps": OPERATIONS,
        "compensations": [],
        "compensation_dependencies": [],
    }))
    return items


RULE_OPERATION_MAP = {
    "KEP-SOL2-RULE-KEY-ROLES-NONCOLLAPSE": ["prepare-encrypted-material", "grant-coownership", "request-key-reissue", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-STATE-IDENTITY-EXACT": ["grant-coownership", "activate-finalized-delivery", "request-key-reissue", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-PRESERVE-A": ["grant-coownership", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-ONCHAIN-NO-SECRETS": ["grant-coownership", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-CRYPTOGRAPHIC-PROFILE-EXACT": ["prepare-encrypted-material", "verify-recipient-decryption", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-EXACT-BYTE-IDENTITY": ["prepare-encrypted-material", "persist-and-verify-material", "retrieve-active-material", "verify-recipient-decryption"],
    "KEP-SOL2-RULE-LOCATOR-OUTSIDE-OBJECT-IDENTITY": ["persist-and-verify-material", "retrieve-active-material"],
    "KEP-SOL2-RULE-WRITE-IS-NOT-VERIFIED-RETRIEVAL": ["persist-and-verify-material", "retrieve-active-material"],
    "KEP-SOL2-RULE-THREE-LAYER-READINESS": ["persist-and-verify-material", "grant-coownership", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-STORAGE-BEFORE-SUBMISSION": ["grant-coownership", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-ATOMIC-CHAIN-GRANT": ["grant-coownership"],
    "KEP-SOL2-RULE-REPLAY-ONCE": ["grant-coownership", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-FINALIZED-ACTIVATION": ["activate-finalized-delivery", "fulfill-key-reissue"],
    "KEP-SOL2-RULE-NO-CROSS-SYSTEM-ATOMICITY": ["persist-and-verify-material", "grant-coownership", "activate-finalized-delivery", "fulfill-key-reissue", "reconcile-delivery"],
    "KEP-SOL2-RULE-FAILURE-NO-SUBMISSION-OR-ACTIVATION": ["persist-and-verify-material", "grant-coownership", "activate-finalized-delivery", "fulfill-key-reissue", "reconcile-delivery"],
    "KEP-SOL2-RULE-B-REQUEST-ONLY": ["request-key-reissue"],
    "KEP-SOL2-RULE-POLICY-SCOPED-A-FULFILLMENT": ["fulfill-key-reissue"],
    "KEP-SOL2-RULE-REISSUE-PRESERVES-PROTOCOL-STATE": ["fulfill-key-reissue"],
    "KEP-SOL2-RULE-OLD-ENVELOPE-REMAINS-ON-FAILURE": ["fulfill-key-reissue", "reconcile-delivery"],
    "KEP-SOL2-RULE-STORAGE-CONFIDENTIALITY": ["prepare-encrypted-material", "persist-and-verify-material", "retrieve-active-material"],
    "KEP-SOL2-RULE-PROVIDER-UNBOUND": ["persist-and-verify-material", "retrieve-active-material"],
    "KEP-SOL2-RULE-NO-PRICE-COST-SEPARATION": ["grant-coownership", "fulfill-key-reissue", "observe-infrastructure-costs"],
    "KEP-SOL2-RULE-PROGRAM-AND-TRIAL-IDENTITY-EXACT": ["grant-coownership", "activate-finalized-delivery", "observe-infrastructure-costs"],
    "KEP-SOL2-RULE-DEVNET-NONPRODUCTION": ["grant-coownership", "activate-finalized-delivery", "fulfill-key-reissue", "observe-infrastructure-costs"],
    "KEP-SOL2-RULE-EVIDENCE-ENVIRONMENT-BOUNDED": ["verify-recipient-decryption", "reconcile-delivery", "observe-infrastructure-costs"],
    "KEP-SOL2-RULE-EVIDENCE-CLOSURE": ["verify-recipient-decryption", "reconcile-delivery", "observe-infrastructure-costs"],
}


ONTOLOGY_NODE_MAP = {
    "CA2-CAP-REALIZE-ENCRYPTED-DURABLE-DEVNET-COOWNERSHIP": ["encrypted-durable-devnet-workflow", "knowledge-exchange-protocol"],
    "CA2-CAP-REALIZE-NO-PRICE-SOLANA-COOWNERSHIP": ["grant-coownership", "coownership-state", "no-price-policy"],
    "CA2-CAP-PERSIST-AND-VERIFY-ENCRYPTED-KNOWLEDGE-MATERIAL": ["persist-and-verify-material", "retrieve-active-material", "storage-realization"],
    "CA2-CAP-PROTECT-AND-RECOVER-ENCRYPTED-KNOWLEDGE-MATERIAL": ["durable-storage-policy", "operational-storage-registry", "recovery-journal", "immutable-archive"],
    "CA2-ACTOR-KNOWLEDGE-ORIGINATOR": ["knowledge-identity", "grant-coownership", "fulfill-key-reissue"],
    "CA2-ACTOR-KNOWLEDGE-RECIPIENT": ["knowledge-identity", "verify-recipient-decryption", "request-key-reissue"],
    "CA2-IDENTITY-KNOWLEDGE-PARTICIPANT": ["knowledge-identity"],
    "CA2-SOLANA-SIGNING-KEY-BINDING": ["signing-key-binding"],
    "CA2-ENCRYPTION-KEY-BINDING": ["encryption-key-binding"],
    "CA2-KNOWLEDGE-ARTIFACT-VERSION": ["knowledge-artifact-version", "artifact-state"],
    "CA2-SOLANA-KNOWLEDGE-ARTIFACT-STATE-AGGREGATE": ["artifact-state", "coownership-state", "delivery-state", "reissue-state"],
    "CA2-SOLANA-COOWNER-MEMBERSHIP": ["coowner-membership", "artifact-state"],
    "CA2-PROPAGATION-POLICY": ["propagation-policy"],
    "CA2-SOLANA-COOWNERSHIP-GRANT-INSTRUCTION": ["grant-coownership", "grant-input-contract"],
    "CA2-SOLANA-GRANT-REPLAY-DOMAIN": ["grant-replay-domain"],
    "CA2-SOLANA-GRANT-CONSUMPTION-RECORD": ["grant-consumption-record"],
    "CA2-SOLANA-PROGRAM-REALIZATION-IDENTITY": ["program-realization"],
    "CA2-KEP-SOL2-CRYPTOGRAPHIC-PROFILE": ["cryptographic-profile"],
    "CA2-KEP-SOL2-CONTENT-ENCRYPTION-SUITE": ["content-encryption-suite"],
    "CA2-KEP-SOL2-RECIPIENT-ENVELOPE-SUITE": ["recipient-envelope-suite"],
    "CA2-KEP-SOL2-ENCRYPTED-ARTIFACT": ["encrypted-artifact", "qualified-byte-identity"],
    "CA2-KEP-SOL2-RECIPIENT-ENVELOPE": ["recipient-envelope", "recipient-envelope-commitment"],
    "CA2-KEP-SOL2-QUALIFIED-BYTE-IDENTITY": ["qualified-byte-identity"],
    "CA2-KEP-SOL2-DURABLE-STORAGE-INSTANTIATION": ["storage-realization", "durable-storage-policy"],
    "CA2-KEP-SOL2-OPERATIONAL-SQL-LAYER": ["operational-storage-registry"],
    "CA2-KEP-SOL2-RECOVERY-JOURNAL-LAYER": ["recovery-journal"],
    "CA2-KEP-SOL2-IMMUTABLE-ARCHIVE-LAYER": ["immutable-archive"],
    "CA2-KEP-SOL2-OPAQUE-STORAGE-LOCATOR": ["opaque-storage-locator"],
    "CA2-KEP-SOL2-STORAGE-REALIZATION-IDENTITY": ["storage-realization"],
    "CA2-KEP-SOL2-STORAGE-WRITE-RECEIPT": ["storage-write-receipt"],
    "CA2-KEP-SOL2-VERIFIED-RETRIEVAL": ["verified-retrieval", "retrieve-active-material"],
    "CA2-KEP-SOL2-DURABLE-STORAGE-POLICY": ["durable-storage-policy"],
    "CA2-KEP-SOL2-DURABLE-STORAGE-FAILURE": ["reconciliation-required", "reconcile-delivery"],
    "CA2-KEP-SOL2-STORAGE-READINESS": ["storage-readiness", "persist-and-verify-material"],
    "CA2-KEP-SOL2-PREPARED-MATERIAL": ["prepared-material", "material-prepared"],
    "CA2-KEP-SOL2-FINALIZED-DELIVERY-ACTIVATION": ["activate-finalized-delivery", "finalized-delivery-activated", "delivery-state"],
    "CA2-KEP-SOL2-ACTIVE-MATERIAL": ["active-material", "delivery-state"],
    "CA2-KEP-SOL2-RECONCILIATION-REQUIRED": ["reconciliation-required", "reconcile-delivery", "delivery-state"],
    "CA2-KEP-SOL2-KEY-REISSUE-REQUEST": ["request-key-reissue", "key-reissue-requested", "reissue-input-contract"],
    "CA2-KEP-SOL2-KEY-REISSUE-FULFILLMENT": ["fulfill-key-reissue", "reissue-fulfilled"],
    "CA2-KEP-SOL2-RECIPIENT-DECRYPTION-OBSERVATION": ["recipient-decryption-observation", "recipient-decryption-verified", "verify-recipient-decryption"],
    "CA2-KEP-SOL2-DEVNET-PROTOCOL-TRIAL": ["encrypted-durable-devnet-workflow", "devnet-execution-policy", "devnet-trial-observed"],
    "CA2-KEP-SOL2-END-TO-END-EVIDENCE-BUNDLE": ["protocol-evidence", "end-to-end-evidence-contract"],
    "CA2-KEP-SOL2-NO-PRICE-BOUNDARY": ["no-price-policy"],
    "CA2-KEP-SOL2-NETWORK-COST": ["network-cost", "observe-infrastructure-costs"],
    "CA2-KEP-SOL2-STORAGE-COST": ["storage-cost", "observe-infrastructure-costs"],
    "CA2-OUT-KEP-SOLANA-DURABLE-GRANT-FINALIZED": ["durable-grant-finalized", "coownership-state"],
    "CA2-OUT-KEP-SOLANA-RECIPIENT-DECRYPTION-VERIFIED": ["recipient-decryption-verified"],
    "CA2-OUT-KEP-SOLANA-REISSUE-FULFILLED": ["reissue-fulfilled", "reissue-state"],
}


PROOF_MAP = {
    "KEP-SOL2-PROOF-CRYPTO-KNOWN-ANSWER": ["cryptographic-profile", "prepare-encrypted-material", "verify-recipient-decryption", "rule-cryptographic-profile-exact"],
    "KEP-SOL2-PROOF-DETERMINISTIC-CBOR": ["prepare-encrypted-material", "qualified-byte-identity", "rule-exact-byte-identity"],
    "KEP-SOL2-PROOF-THREE-LAYER-READINESS": ["persist-and-verify-material", "storage-readiness", "operational-storage-registry", "recovery-journal", "immutable-archive", "rule-three-layer-readiness"],
    "KEP-SOL2-PROOF-STORAGE-FAILURE-BLOCKS": ["persist-and-verify-material", "reconcile-delivery", "reconciliation-required", "rule-failure-no-submission-or-activation"],
    "KEP-SOL2-PROOF-GRANT-POSITIVE": ["grant-coownership", "durable-grant-finalized", "coownership-state", "rule-atomic-chain-grant"],
    "KEP-SOL2-PROOF-GRANT-NEGATIVES": ["grant-coownership", "rule-preserve-a", "rule-replay-once", "rule-state-identity-exact"],
    "KEP-SOL2-PROOF-FINALIZED-ACTIVATION": ["activate-finalized-delivery", "finalized-delivery-activated", "delivery-state", "rule-finalized-activation"],
    "KEP-SOL2-PROOF-RECIPIENT-DECRYPTION": ["retrieve-active-material", "verify-recipient-decryption", "recipient-decryption-verified", "recipient-decryption-observation"],
    "KEP-SOL2-PROOF-REISSUE-POSITIVE": ["request-key-reissue", "fulfill-key-reissue", "key-reissue-requested", "reissue-fulfilled", "reissue-state"],
    "KEP-SOL2-PROOF-REISSUE-NEGATIVES": ["request-key-reissue", "fulfill-key-reissue", "rule-b-request-only", "rule-policy-scoped-a-fulfillment", "rule-old-envelope-remains-on-failure"],
    "KEP-SOL2-PROOF-COST-SEPARATION": ["observe-infrastructure-costs", "network-cost", "storage-cost", "no-price-policy"],
    "KEP-SOL2-PROOF-END-TO-END-DEVNET": ["encrypted-durable-devnet-workflow", "protocol-evidence", "end-to-end-evidence-contract", "devnet-trial-observed"],
    "KEP-SOL2-PROOF-SECURITY-REVIEW": ["cryptographic-profile", "rule-cryptographic-profile-exact", "rule-storage-confidentiality"],
}


POLICY_OPERATION_MAP = {
    "cryptographic-profile": ["prepare-encrypted-material", "verify-recipient-decryption", "fulfill-key-reissue"],
    "durable-storage-policy": ["persist-and-verify-material", "activate-finalized-delivery", "retrieve-active-material", "fulfill-key-reissue", "reconcile-delivery"],
    "propagation-policy": ["grant-coownership", "request-key-reissue", "fulfill-key-reissue"],
    "devnet-execution-policy": ["grant-coownership", "activate-finalized-delivery", "fulfill-key-reissue", "observe-infrastructure-costs"],
    "no-price-policy": ["grant-coownership", "fulfill-key-reissue", "observe-infrastructure-costs"],
}


def core_edges() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for operation_id in OPERATIONS:
        items.append(edge(f"protocol-exposes-{operation_id}", "exposes", "knowledge-exchange-protocol", operation_id))
        items.append(edge(f"workflow-orchestrates-{operation_id}", "orchestrates", "encrypted-durable-devnet-workflow", operation_id))

    performers = {
        "knowledge-identity": ["prepare-encrypted-material", "grant-coownership", "verify-recipient-decryption", "request-key-reissue", "fulfill-key-reissue"],
        "storage-realization": ["persist-and-verify-material", "retrieve-active-material", "reconcile-delivery"],
        "program-realization": ["grant-coownership", "activate-finalized-delivery", "fulfill-key-reissue", "observe-infrastructure-costs"],
    }
    for source, operations in performers.items():
        for operation_id in operations:
            items.append(edge(f"{source}-performs-{operation_id}", "performs", source, operation_id))

    produced = {
        "prepare-encrypted-material": "material-prepared",
        "persist-and-verify-material": "storage-readiness-established",
        "grant-coownership": "durable-grant-finalized",
        "activate-finalized-delivery": "finalized-delivery-activated",
        "retrieve-active-material": "active-material-retrieved",
        "verify-recipient-decryption": "recipient-decryption-verified",
        "request-key-reissue": "key-reissue-requested",
        "fulfill-key-reissue": "reissue-fulfilled",
        "reconcile-delivery": "reconciliation-required",
        "observe-infrastructure-costs": "devnet-trial-observed",
    }
    for operation_id, event_id in produced.items():
        items.append(edge(f"{operation_id}-produces-{event_id}", "produces", operation_id, event_id))

    transitions = {
        "material-prepared": "delivery-state",
        "durable-grant-finalized": "coownership-state",
        "finalized-delivery-activated": "delivery-state",
        "reconciliation-required": "delivery-state",
        "key-reissue-requested": "reissue-state",
        "reissue-fulfilled": "reissue-state",
    }
    for event_id, state_id in transitions.items():
        items.append(edge(f"{event_id}-transitions-{state_id}", "transitions", event_id, state_id))

    reads = {
        "prepare-encrypted-material": ["knowledge-identity", "artifact-state"],
        "persist-and-verify-material": ["encrypted-artifact", "recipient-envelope", "storage-realization"],
        "grant-coownership": ["knowledge-identity", "artifact-state", "program-realization", "storage-realization"],
        "activate-finalized-delivery": ["artifact-state", "encrypted-artifact", "recipient-envelope", "program-realization", "storage-realization"],
        "retrieve-active-material": ["artifact-state", "storage-realization", "encrypted-artifact", "recipient-envelope"],
        "verify-recipient-decryption": ["knowledge-identity", "encrypted-artifact", "recipient-envelope", "protocol-evidence"],
        "request-key-reissue": ["knowledge-identity", "artifact-state"],
        "fulfill-key-reissue": ["knowledge-identity", "artifact-state", "program-realization", "storage-realization", "recipient-envelope"],
        "reconcile-delivery": ["artifact-state", "program-realization", "storage-realization", "protocol-evidence"],
        "observe-infrastructure-costs": ["program-realization", "storage-realization", "protocol-evidence"],
    }
    for operation_id, entities in reads.items():
        for entity_id in entities:
            items.append(edge(f"{operation_id}-reads-{entity_id}", "reads", operation_id, entity_id))

    contains = {
        "knowledge-identity": ["signing-key-binding", "encryption-key-binding"],
        "artifact-state": ["knowledge-artifact-version", "coowner-membership", "recipient-envelope-commitment", "grant-replay-domain", "grant-consumption-record", "grant-input-contract", "reissue-input-contract", "prepared-material", "active-material"],
        "encrypted-artifact": ["content-encryption-suite", "qualified-byte-identity"],
        "recipient-envelope": ["recipient-envelope-suite", "qualified-byte-identity", "recipient-envelope-commitment"],
        "program-realization": ["finalized-state-observation", "network-cost"],
        "storage-realization": ["opaque-storage-locator", "storage-write-receipt", "verified-retrieval", "storage-readiness", "storage-cost"],
        "protocol-evidence": ["recipient-decryption-observation", "finalized-state-observation", "end-to-end-evidence-contract", "network-cost", "storage-cost"],
        "operational-storage-registry": ["opaque-storage-locator", "storage-write-receipt"],
        "recovery-journal": ["storage-write-receipt"],
        "immutable-archive": ["qualified-byte-identity", "verified-retrieval"],
    }
    for entity_id, value_objects in contains.items():
        for value_id in value_objects:
            items.append(edge(f"{entity_id}-contains-{value_id}", "contains", entity_id, value_id))

    for policy_id, operations in POLICY_OPERATION_MAP.items():
        for operation_id in operations:
            items.append(edge(f"{policy_id}-applies-{operation_id}", "applies", policy_id, operation_id))

    for rule_id, operations in RULE_OPERATION_MAP.items():
        rule_id_source = rule_node_id(rule_id)
        for operation_id in operations:
            items.append(edge(f"{rule_id_source}-enforces-{operation_id}", "enforces", rule_id_source, operation_id))
    return items


def validate_model_inputs(
    ontology_nodes: set[str],
    ontology_rules: set[str],
    proof_ids: set[str],
) -> None:
    if set(ONTOLOGY_NODE_MAP) != ontology_nodes:
        raise ValueError(f"ontology node mapping is not total: missing={sorted(ontology_nodes - set(ONTOLOGY_NODE_MAP))}, extra={sorted(set(ONTOLOGY_NODE_MAP) - ontology_nodes)}")
    if set(RULE_OPERATION_MAP) != ontology_rules:
        raise ValueError(f"ontology rule mapping is not total: missing={sorted(ontology_rules - set(RULE_OPERATION_MAP))}, extra={sorted(set(RULE_OPERATION_MAP) - ontology_rules)}")
    if set(PROOF_MAP) != proof_ids:
        raise ValueError(f"proof mapping is not total: missing={sorted(proof_ids - set(PROOF_MAP))}, extra={sorted(set(PROOF_MAP) - proof_ids)}")


def direct_required_paths() -> dict[str, Path]:
    return {
        "product-capability.json": V1_ROOT / "product-capability.json",
        "decisions/product-capability-adoption-001.json": V1_ROOT / "decisions/product-capability-adoption-001.json",
        "decisions/ontology-admission-001.json": V1_ROOT / "decisions/ontology-admission-001.json",
    }


def verify_predecessors() -> tuple[dict[str, Any], dict[str, Any]]:
    for relative, path in direct_required_paths().items():
        actual = sha256_file(path)
        if actual != EXPECTED[relative]:
            raise ValueError(f"predecessor digest drift: {relative}: {actual}")
    parser = REPO_ROOT / PARSER_RELATIVE
    if sha256_file(parser) != EXPECTED_PARSER:
        raise ValueError("DomainSpec parser digest drift")
    admission = load_json(V1_ROOT / "decisions/ontology-admission-001.json")
    admitted = admission.get("admission", {})
    if admitted.get("lifecycle_status") != "admitted" or admitted.get("admitted_ontology_id") != ONTOLOGY_ID:
        raise ValueError("ontology predecessor is not admitted")
    if admitted.get("admitted_candidate_sha256") != EXPECTED_ONTOLOGY_CANDIDATE or admitted.get("admitted_material_digest") != EXPECTED_ONTOLOGY_MATERIAL:
        raise ValueError("ontology admission identity drift")
    candidate_path = ONTOLOGY_ROOT / "candidate.json"
    if sha256_file(candidate_path) != EXPECTED_ONTOLOGY_CANDIDATE:
        raise ValueError("ontology candidate digest drift")
    candidate = load_json(candidate_path)
    if candidate.get("material_digest") != EXPECTED_ONTOLOGY_MATERIAL:
        raise ValueError("ontology material digest drift")
    if candidate.get("artifacts") != admission.get("admitted_material", {}).get("artifacts"):
        raise ValueError("ontology admission artifact closure drift")
    for artifact in candidate["artifacts"]:
        path = ONTOLOGY_ROOT / artifact["path"]
        if sha256_file(path) != artifact["sha256"]:
            raise ValueError(f"selected ontology material drift: {artifact['path']}")
    return admission, candidate


def definition_mappings(
    definition_registry: dict[str, Any],
    rule_mappings: dict[str, str],
) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for binding in definition_registry["bindings"]:
        mapped: set[str] = set()
        for ontology_ref in binding["ontology_refs"]:
            if ontology_ref in ONTOLOGY_NODE_MAP:
                mapped.update(ONTOLOGY_NODE_MAP[ontology_ref])
            elif ontology_ref in rule_mappings:
                mapped.add(rule_mappings[ontology_ref])
            else:
                raise ValueError(f"definition mapping has unknown ontology ref: {ontology_ref}")
        result[binding["definition_id"]] = sorted(mapped)
    return dict(sorted(result.items()))


def relation_mappings(
    relation_registry: dict[str, Any],
    edges: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for relation in relation_registry["relations"]:
        source_nodes = ONTOLOGY_NODE_MAP[relation["source"]]
        target_nodes = ONTOLOGY_NODE_MAP[relation["target"]]
        direct = [item["edge_id"] for item in edges if item["source_node_id"] in source_nodes and item["target_node_id"] in target_nodes]
        if not direct:
            relevant = [item["edge_id"] for item in edges if item["source_node_id"] in source_nodes + target_nodes or item["target_node_id"] in source_nodes + target_nodes]
            direct = sorted(relevant)[:4]
        if not direct:
            raise ValueError(f"ontology relation has no system projection: {relation['relation_id']}")
        result[relation["relation_id"]] = {
            "business_relationship": relation["relationship"],
            "source_domain_nodes": source_nodes,
            "target_domain_nodes": target_nodes,
            "system_projection_edges": sorted(direct),
        }
    return dict(sorted(result.items()))


def build_outputs(target_root: Path = PACKAGE_ROOT) -> dict[Path, bytes]:
    admission, candidate = verify_predecessors()
    ontology_nodes_registry = load_json(ONTOLOGY_ROOT / "nodes.json")
    ontology_rules_registry = load_json(ONTOLOGY_ROOT / "rules.json")
    definitions_registry = load_json(ONTOLOGY_ROOT / "definition-bindings.json")
    relations_registry = load_json(ONTOLOGY_ROOT / "relations.json")
    proofs_registry = load_json(ONTOLOGY_ROOT / "proof-requirements.json")
    sources_registry = load_json(ONTOLOGY_ROOT / "sources.json")
    rules = {item["rule_id"]: item["statement"] for item in ontology_rules_registry["rules"]}
    ontology_nodes = {item["id"] for item in ontology_nodes_registry["nodes"]}
    proof_ids = {item["proof_id"] for item in proofs_registry["proof_requirements"]}
    validate_model_inputs(ontology_nodes, set(rules), proof_ids)

    nodes = core_nodes(rules)
    edges = core_edges()
    node_ids = [item["node_id"] for item in nodes]
    edge_ids = [item["edge_id"] for item in edges]
    if len(node_ids) != len(set(node_ids)) or len(edge_ids) != len(set(edge_ids)):
        raise ValueError("authored source identities are not unique")
    declared_nodes = set(node_ids)
    declared_edges = set(edge_ids)
    for values in [*ONTOLOGY_NODE_MAP.values(), *PROOF_MAP.values()]:
        unknown = set(values) - declared_nodes
        if unknown:
            raise ValueError(f"mapping references unknown source nodes: {sorted(unknown)}")

    rule_mappings = {rule_id: rule_node_id(rule_id) for rule_id in rules}
    definition_map = definition_mappings(definitions_registry, rule_mappings)
    relation_map = relation_mappings(relations_registry, edges)
    for record in relation_map.values():
        if set(record["system_projection_edges"]) - declared_edges:
            raise ValueError("relation mapping references unknown source edges")

    repo_prefix = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/"
    binding = {
        "schema_version": "cav2-kep-solana-encrypted-durable-devnet-domainspec-binding/v1",
        "binding_id": "CA2-BINDING-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-DOMAINSPEC-001",
        "route_id": "CA2-ROUTE-IMPLEMENT",
        "product_id": PRODUCT_ID,
        "capability_id": CAPABILITY_ID,
        "ontology_id": ONTOLOGY_ID,
        "source_project_id": "knowledge-exchange-protocol-encrypted-durable-devnet",
        "feature_id": FEATURE_ID,
        "lifecycle_status": "authored-candidate",
        "authorship_authorization": {
            "kind": "current-chat",
            "exact_user_decision": "continue",
            "bounded_interpretation": "Author the immediately named DomainSpec v2 source stage only against ontology material digest 13a2df74d14b9c3ee5c3c6035a73e42acd780ca6ffbb5b16c819febd52fe9e49.",
        },
        "predecessors": {
            "product_capability": {"path": repo_prefix + "product-capability.json", "sha256": EXPECTED["product-capability.json"], "lifecycle_status": "adopted"},
            "product_capability_adoption": {"path": repo_prefix + "decisions/product-capability-adoption-001.json", "sha256": EXPECTED["decisions/product-capability-adoption-001.json"]},
            "ontology_admission": {"path": repo_prefix + "decisions/ontology-admission-001.json", "sha256": EXPECTED["decisions/ontology-admission-001.json"], "admitted_candidate_sha256": EXPECTED_ONTOLOGY_CANDIDATE, "admitted_material_digest": EXPECTED_ONTOLOGY_MATERIAL},
        },
        "grammar_binding": {"path": PARSER_RELATIVE, "sha256": EXPECTED_PARSER},
        "selected_ontology_material": candidate["artifacts"],
        "selected_source_dependencies": {
            "sources": sources_registry["sources"],
            "selections": sources_registry["selections"],
            "source_count": len(sources_registry["sources"]),
            "selection_count": len(sources_registry["selections"]),
        },
        "definition_mappings": definition_map,
        "ontology_node_mappings": dict(sorted(ONTOLOGY_NODE_MAP.items())),
        "ontology_relation_mappings": relation_map,
        "ontology_rule_mappings": dict(sorted(rule_mappings.items())),
        "proof_requirement_mappings": dict(sorted(PROOF_MAP.items())),
        "source_counts": {"nodes": len(nodes), "edges": len(edges)},
        "construction_state": {
            "canonical_definitions": "accepted",
            "product_capability": "adopted",
            "business_ontology": "admitted",
            "domainspec_v2_source": "authored-candidate",
            "compiled_graph_and_system_ontology": "not_evaluable",
            "implementation_binding": "not_evaluable",
            "conformance_evidence": "not_evaluable",
            "devnet_trial": "not_evaluable",
        },
        "successor_authorization": {
            "domainspec_source_admission": "not-authorized-by-this-candidate",
            "compiled_graph_or_system_ontology_admission": "not-authorized",
            "implementation": "not-authorized",
            "credentials_or_wallets": "not-authorized",
            "devnet_transaction": "not-authorized",
            "publication": "not-authorized",
            "deployment": "not-authorized",
        },
        "claim_ceiling": "Authored and locally validated DomainSpec v2 source candidate only; not an admitted source, retained compiled graph, system ontology, implementation binding, conformance proof, transaction, publication, deployment, or external effect.",
        "authority_effect": "none",
        "external_effect": "none",
    }
    project = {
        "schema_version": "domainspec.project/v1",
        "project_id": "knowledge-exchange-protocol-encrypted-durable-devnet",
        "features": [FEATURE_ID],
        "cross_feature_edges": [],
    }
    feature = {
        "schema_version": "domainspec.feature/v1",
        "feature_id": FEATURE_ID,
        "nodes": sorted(node_ids),
        "edges": sorted(edge_ids),
    }
    spec_root = target_root / "specs" / FEATURE_ID
    outputs: dict[Path, bytes] = {
        target_root / "binding.json": canonical_bytes(binding),
        target_root / "project.json": canonical_bytes(project),
        spec_root / "feature.json": canonical_bytes(feature),
    }
    for item in nodes:
        outputs[spec_root / "nodes" / f"{item['node_id']}.json"] = canonical_bytes(item)
    for item in edges:
        outputs[spec_root / "edges" / f"{item['edge_id']}.json"] = canonical_bytes(item)
    return outputs


def source_paths(root: Path = PACKAGE_ROOT) -> set[Path]:
    paths = {root / "binding.json", root / "project.json"}
    spec_root = root / "specs" / FEATURE_ID
    if spec_root.is_dir():
        paths.update(path for path in spec_root.rglob("*.json") if path.is_file())
    return paths


def check_materialized(outputs: dict[Path, bytes], root: Path = PACKAGE_ROOT) -> list[str]:
    expected = set(outputs)
    actual = source_paths(root)
    issues = [f"missing-or-drifted:{path.relative_to(root).as_posix()}" for path, content in outputs.items() if not path.is_file() or path.read_bytes() != content]
    issues.extend(f"unexpected:{path.relative_to(root).as_posix()}" for path in sorted(actual - expected))
    return sorted(issues)


def author(outputs: dict[Path, bytes]) -> list[str]:
    actual = source_paths(PACKAGE_ROOT)
    unexpected = actual - set(outputs)
    if unexpected:
        raise ValueError("unexpected authored source exists; refusing deletion: " + ", ".join(sorted(path.relative_to(PACKAGE_ROOT).as_posix() for path in unexpected)))
    changed: list[str] = []
    for path, content in sorted(outputs.items(), key=lambda item: item[0].as_posix()):
        if not path.is_file() or path.read_bytes() != content:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            changed.append(path.relative_to(PACKAGE_ROOT).as_posix())
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        left = build_outputs(PACKAGE_ROOT)
        right = build_outputs(PACKAGE_ROOT)
        deterministic = {path.relative_to(PACKAGE_ROOT): content for path, content in left.items()} == {path.relative_to(PACKAGE_ROOT): content for path, content in right.items()}
        if not deterministic:
            raise ValueError("two in-memory authoring runs differ")
        if args.check:
            issues = check_materialized(left)
            result = {"result": "pass" if not issues else "fail", "deterministic": True, "issues": issues, "authority_effect": "none"}
            print(json.dumps(result, sort_keys=True))
            return 0 if not issues else 1
        changed = author(left)
        print(json.dumps({"result": "pass", "changed": changed, "deterministic": True, "authority_effect": "none"}, sort_keys=True))
        return 0
    except Exception as exc:
        print(json.dumps({"result": "fail", "error": str(exc), "authority_effect": "none"}, sort_keys=True))
        return 1


if __name__ == "__main__":
    sys.exit(main())
