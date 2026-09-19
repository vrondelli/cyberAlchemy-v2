#!/usr/bin/env python3
"""Validate or materialize the AUTH-EVF-00 exact input freeze.

This validator is deliberately read-only. ``--suggest`` prints a fully rehashed
inventory candidate to stdout; it never mutates repository state.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
REPOSITORY = Path(__file__).resolve().parents[6]
INVENTORY = HERE / "AUTH-EVF-INPUT-INVENTORY.v1-candidate.json"
DEFINITIONS = HERE / "AUTH-EVF-DEFINITIONS.v1-candidate.json"
RECEIPT = HERE / "FREEZE-RECEIPT.json"

EXPECTED_FIELDS = [
    "evaluation_epoch_id",
    "decision_time",
    "authentication_evidence_ref",
    "authentication_evidence_revision",
    "authenticated_subject_id",
    "session_id",
    "authentication_expires_at",
    "route_ref",
    "route_binding_revision",
    "required_permission",
    "scope_evidence_ref",
]

EXPECTED_REVISION_DOMAINS = {
    "authentication-evidence",
    "route-binding",
    "authorization-state",
}

REQUIRED_CATEGORIES = {
    "evf-prerequisite",
    "evf-contract",
    "theorem-route-contract",
    "auth-semantics",
    "domainspec-source",
    "compiled-binding",
    "runtime",
    "provider",
    "test",
    "scope-detector-input",
}

REQUIRED_PATHS = {
    "projects/domainspec-v2/development/evolvable-validation-framework/production/CANDIDATE-MANIFEST.v3-candidate.json",
    "projects/domainspec-v2/development/evolvable-validation-framework/evidence/production-stability/v3-candidate/reference-enforcement/sha256/db04078de50b06aa273ffc303e913fdd220baf4894caeb593b5eb68bf06e1589/REHEARSAL-RECEIPT.json",
    "projects/domainspec-v2/development/evolvable-validation-framework/contracts/evf-enforcement-profile.v1.schema.json",
    "projects/domainspec-v2/formalization/docs/TDE-EVF-INTEGRATION.md",
    "projects/domainspec-v2/formalization/schemas/formal-claim-lean-binding.schema.json",
    "projects/domainspec-v2/formalization/schemas/theorem-evidence-binding.schema.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "projects/auth-foundation/implementation/authorization-service/Cargo.toml",
    "projects/auth-foundation/implementation/authorization-service/Cargo.lock",
    "projects/auth-foundation/implementation/authorization-service/migrations/0002_auth_service_epoch.sql",
    "projects/auth-foundation/implementation/authorization-service/src/lib.rs",
    "projects/auth-foundation/implementation/authorization-service/tests/integration.rs",
    "projects/auth-foundation/implementation/trusted-boundary/src/lib.rs",
    "projects/auth-foundation/implementation/trusted-boundary/tests/trusted_boundary.rs",
    "projects/auth-foundation/implementation/trusted-input-provider/migrations/0001_trusted_inputs.sql",
    "projects/auth-foundation/implementation/trusted-input-provider/src/lib.rs",
    "projects/auth-foundation/implementation/trusted-input-provider/tests/provider.rs",
    "projects/auth-foundation/implementation/trusted-input-runtime/src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs",
    "projects/auth-foundation/implementation/trusted-input-runtime/src/domainspec/system-integration/rust/trusted-input-sqlite.rs",
    "projects/auth-foundation/implementation/sqlite-provider/migrations/0001_auth_state.sql",
    "projects/auth-foundation/implementation/sqlite-provider/src/lib.rs",
    "projects/auth-foundation/implementation/sqlite-provider/tests/provider.rs",
    "projects/auth-foundation/implementation/runtime-adapter/src/lib.rs",
    "projects/auth-foundation/implementation/command-boundary-runtime/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs",
    "projects/auth-foundation/implementation/standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs",
    "projects/auth-foundation/implementation/standard-conformance/authorization-service-binding.json",
    "projects/auth-foundation/implementation/trusted-input-source/specs/trusted-input-resolution/nodes/route-authorization-binding.json",
    "projects/auth-foundation/implementation/command-boundary-source/specs/auth-command-boundary/nodes/boundary-request.json",
    "projects/auth-foundation/implementation/command-boundary-source/specs/auth-command-boundary/nodes/authorization-command.json",
}

SCOPE_REQUIRED_PATHS = {
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
    "projects/auth-foundation/implementation/trusted-boundary/src/lib.rs",
    "projects/auth-foundation/implementation/command-boundary-source/specs/auth-command-boundary/nodes/boundary-request.json",
    "projects/auth-foundation/implementation/command-boundary-source/specs/auth-command-boundary/nodes/authorization-command.json",
    "projects/auth-foundation/implementation/trusted-input-source/specs/trusted-input-resolution/nodes/route-authorization-binding.json",
}

HISTORICAL_ROOT = "projects/auth-foundation/development/auth-service-d65-r2-plan/evf-campaign-v1"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def exact_ref(path_value: str) -> dict[str, Any]:
    path = REPOSITORY / path_value
    data = path.read_bytes()
    return {
        "path": path_value,
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def collection_members(collection: dict[str, Any]) -> list[dict[str, Any]]:
    root_value = collection["root"]
    root = REPOSITORY / root_value
    excluded = set(collection.get("exclude_directories", []))
    if not root.is_dir():
        raise ValueError(f"collection root is not a directory: {root_value}")
    members = []
    for path in root.rglob("*"):
        if not path.is_file() or any(part in excluded for part in path.relative_to(root).parts):
            continue
        relative = path.relative_to(REPOSITORY).as_posix()
        members.append(exact_ref(relative))
    members.sort(key=lambda item: item["path"])
    return members


def rehash_inventory(inventory: dict[str, Any]) -> dict[str, Any]:
    result = json.loads(json.dumps(inventory))
    for item in result["exact_refs"]:
        item.update(exact_ref(item["path"]))
    for collection in result["collections"]:
        members = collection_members(collection)
        collection["members"] = members
        collection["member_count"] = len(members)
        collection["manifest_sha256"] = sha256_bytes(canonical_bytes(members))
    historical = result["historical_prototype"]
    members = collection_members(historical)
    historical["members"] = members
    historical["member_count"] = len(members)
    historical["manifest_sha256"] = sha256_bytes(canonical_bytes(members))
    result["definitions_ref"] = exact_ref(
        "projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2/auth-evf-00/AUTH-EVF-DEFINITIONS.v1-candidate.json"
    )
    return result


def covered_paths(inventory: dict[str, Any]) -> set[str]:
    paths = {item["path"] for item in inventory["exact_refs"]}
    for collection in inventory["collections"]:
        paths.update(item["path"] for item in collection["members"])
    return paths


def validate(inventory: dict[str, Any], definitions: dict[str, Any]) -> dict[str, Any]:
    failures: list[dict[str, str]] = []

    def require(condition: bool, code: str, detail: str) -> None:
        if not condition:
            failures.append({"code": code, "detail": detail})

    require(inventory.get("schema_version") == "auth-evf-input-inventory/v1-candidate", "INVENTORY_SCHEMA", "unexpected inventory schema")
    require(inventory.get("epoch_id") == "AUTH-EVF-EPOCH-002", "EPOCH_ID", "inventory epoch id mismatch")
    require(inventory.get("dag_node_id") == "AUTH-EVF-00", "DAG_NODE", "inventory DAG node mismatch")
    require(inventory.get("status") == "frozen-input-epoch", "INVENTORY_STATUS", "inventory is not frozen")
    require(inventory.get("authority_effect") == "none", "AUTHORITY_EFFECT", "inventory authority effect must be none")
    require(definitions.get("schema_version") == "auth-evf-definitions/v1-candidate", "DEFINITIONS_SCHEMA", "unexpected definitions schema")
    require(definitions.get("epoch_id") == inventory.get("epoch_id"), "DEFINITION_EPOCH", "definitions and inventory epoch mismatch")
    require(definitions.get("authority_effect") == "none", "DEFINITION_AUTHORITY", "definitions authority effect must be none")

    fields = definitions.get("trusted_input_snapshot", {}).get("fields", [])
    require([item.get("field") for item in fields] == EXPECTED_FIELDS, "SNAPSHOT_FIELDS", "TrustedInputSnapshot fields or order differ from the exact eleven-field contract")
    require([item.get("ordinal") for item in fields] == list(range(1, 12)), "SNAPSHOT_ORDINALS", "TrustedInputSnapshot ordinals must be 1 through 11")
    require({item.get("revision_domain") for item in definitions.get("revision_domains", [])} == EXPECTED_REVISION_DOMAINS, "REVISION_DOMAINS", "the three distinct revision domains are not exact")
    epoch_rule = definitions.get("authorization_evaluation_epoch", {})
    ordered = epoch_rule.get("ordered_events", [])
    require(ordered[:3] == ["capture-decision-time-once", "allocate-service-local-epoch-id", "begin-one-deferred-transaction"], "EPOCH_PREFIX", "epoch must capture time, allocate id, and begin one transaction before reads")
    require("resolve-authorization-state-in-same-transaction" in ordered and "evaluate-generated-exact-permission-kernel" in ordered, "EPOCH_CLOSURE", "authorization state and kernel evaluation must remain inside the epoch")
    require(definitions.get("historical_campaign_boundary", {}).get("reuse") == "forbidden-as-production-profile-or-current-observation-evidence", "HISTORICAL_CEILING", "historical campaign reuse ceiling is missing")
    residues = {item.get("id") for item in definitions.get("known_implementation_residue", [])}
    require({"AUTH-EVF-RES-READ-ONLY-CAPABILITY", "AUTH-EVF-RES-EPOCH-ID-SATURATION", "AUTH-EVF-RES-THEOREM-ABSENT", "AUTH-EVF-RES-PROFILE-ABSENT"}.issubset(residues), "RESIDUE", "known non-conformance residue is incomplete")

    seen: set[str] = set()
    categories: set[str] = set()
    exact_failures = 0
    for item in inventory.get("exact_refs", []):
        path_value = item.get("path", "")
        categories.update(item.get("categories", []))
        require(path_value not in seen, "DUPLICATE_PATH", path_value)
        seen.add(path_value)
        try:
            current = exact_ref(path_value)
        except (OSError, ValueError) as exc:
            exact_failures += 1
            failures.append({"code": "REF_MISSING", "detail": f"{path_value}: {exc}"})
            continue
        if current != {key: item.get(key) for key in ("path", "sha256", "size_bytes")}:
            exact_failures += 1
            failures.append({"code": "REF_DRIFT", "detail": path_value})

    collection_failures = 0
    for collection in inventory.get("collections", []):
        categories.update(collection.get("categories", []))
        try:
            current_members = collection_members(collection)
        except (OSError, ValueError) as exc:
            collection_failures += 1
            failures.append({"code": "COLLECTION_MISSING", "detail": f"{collection.get('id')}: {exc}"})
            continue
        stored_members = collection.get("members", [])
        if current_members != stored_members:
            collection_failures += 1
            failures.append({"code": "COLLECTION_DRIFT", "detail": collection.get("id", "")})
        require(collection.get("member_count") == len(stored_members), "COLLECTION_COUNT", collection.get("id", ""))
        require(collection.get("manifest_sha256") == sha256_bytes(canonical_bytes(stored_members)), "COLLECTION_DIGEST", collection.get("id", ""))
        for member in stored_members:
            path_value = member["path"]
            require(path_value not in seen, "DUPLICATE_PATH", path_value)
            seen.add(path_value)

    all_paths = covered_paths(inventory)
    require(REQUIRED_PATHS.issubset(all_paths), "REQUIRED_INPUTS", f"missing: {sorted(REQUIRED_PATHS - all_paths)}")
    require(REQUIRED_CATEGORIES.issubset(categories), "CATEGORY_COVERAGE", f"missing: {sorted(REQUIRED_CATEGORIES - categories)}")
    require(set(inventory.get("scope_detector_required_paths", [])) == SCOPE_REQUIRED_PATHS, "SCOPE_DECLARATION", "scope detector path declaration differs from the exact set")
    require(SCOPE_REQUIRED_PATHS.issubset(all_paths), "SCOPE_INPUTS", f"missing: {sorted(SCOPE_REQUIRED_PATHS - all_paths)}")

    historical = inventory.get("historical_prototype", {})
    require(historical.get("root") == HISTORICAL_ROOT, "HISTORICAL_ROOT", "historical campaign root mismatch")
    require(historical.get("status") == "historical-prototype-only", "HISTORICAL_STATUS", "historical campaign status mismatch")
    try:
        current_historical = collection_members(historical)
    except (OSError, ValueError) as exc:
        current_historical = []
        failures.append({"code": "HISTORICAL_MISSING", "detail": str(exc)})
    stored_historical = historical.get("members", [])
    require(current_historical == stored_historical, "HISTORICAL_DRIFT", "historical campaign bytes changed")
    require(historical.get("member_count") == len(stored_historical), "HISTORICAL_COUNT", "historical member count mismatch")
    require(historical.get("manifest_sha256") == sha256_bytes(canonical_bytes(stored_historical)), "HISTORICAL_DIGEST", "historical manifest digest mismatch")
    require(not any(path == HISTORICAL_ROOT or path.startswith(HISTORICAL_ROOT + "/") for path in all_paths), "HISTORICAL_REUSE", "historical campaign appears in current candidate inputs")

    definitions_current = exact_ref(inventory["definitions_ref"]["path"])
    require(inventory.get("definitions_ref") == definitions_current, "DEFINITIONS_DRIFT", "definitions ref is stale")

    ps20_path = "projects/domainspec-v2/development/evolvable-validation-framework/evidence/production-stability/v3-candidate/reference-enforcement/sha256/db04078de50b06aa273ffc303e913fdd220baf4894caeb593b5eb68bf06e1589/REHEARSAL-RECEIPT.json"
    ps20 = load(REPOSITORY / ps20_path)
    require(ps20.get("result") == "passed-reference-rehearsal", "PS20_RESULT", "EVF-PS-20 result is not passed-reference-rehearsal")
    require(ps20.get("receipt_payload_digest") == "db04078de50b06aa273ffc303e913fdd220baf4894caeb593b5eb68bf06e1589", "PS20_DIGEST", "EVF-PS-20 payload digest mismatch")
    require(ps20.get("auth_application") == "not-granted", "PS20_AUTH_CEILING", "EVF-PS-20 must not grant Auth application")

    successors = {item.get("node_id"): item for item in inventory.get("successor_artifacts", [])}
    for node_id in ("AUTH-EVF-01", "AUTH-EVF-02", "AUTH-EVF-03", "AUTH-EVF-04", "AUTH-EVF-05"):
        require(successors.get(node_id, {}).get("state") == "not-present-by-design", "SUCCESSOR_BOUNDARY", node_id)

    result = "PASS" if not failures else "BLOCK"
    return {
        "schema_version": "auth-evf-freeze-validation/v1",
        "dag_node_id": "AUTH-EVF-00",
        "epoch_id": "AUTH-EVF-EPOCH-002",
        "result": result,
        "candidate_input_paths": len(all_paths),
        "exact_ref_count": len(inventory.get("exact_refs", [])),
        "collection_count": len(inventory.get("collections", [])),
        "collection_member_count": sum(len(item.get("members", [])) for item in inventory.get("collections", [])),
        "historical_member_count": len(stored_historical),
        "scope_detector_input_count": len(SCOPE_REQUIRED_PATHS),
        "snapshot_field_count": len(fields),
        "revision_domain_count": len(definitions.get("revision_domains", [])),
        "exact_ref_failures": exact_failures,
        "collection_failures": collection_failures,
        "failures": failures,
        "claim_ceiling": "AUTH-EVF-00 input and definition freeze validation only; no Auth EVF conformance, implementation, theorem, product, enforcement, release, deployment, or external-effect claim.",
        "authority_effect": "none",
    }


def build_receipt(inventory: dict[str, Any], definitions: dict[str, Any]) -> dict[str, Any]:
    validation = validate(inventory, definitions)
    if validation["result"] != "PASS":
        raise ValueError("cannot issue a freeze receipt for a blocked validation")
    definitions_ref = exact_ref(
        "projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2/auth-evf-00/AUTH-EVF-DEFINITIONS.v1-candidate.json"
    )
    inventory_ref = exact_ref(
        "projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2/auth-evf-00/AUTH-EVF-INPUT-INVENTORY.v1-candidate.json"
    )
    validator_ref = exact_ref(
        "projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2/auth-evf-00/validate_freeze.py"
    )
    epoch_payload = {
        "epoch_id": "AUTH-EVF-EPOCH-002",
        "definitions_ref": definitions_ref,
        "inventory_ref": inventory_ref,
    }
    receipt = {
        "schema_version": "auth-evf-freeze-receipt/v1",
        "receipt_id": "AUTH-EVF-00-FREEZE-RECEIPT-002",
        "dag_node_id": "AUTH-EVF-00",
        "epoch_id": "AUTH-EVF-EPOCH-002",
        "result": "PASS",
        "candidate_epoch_payload_digest": sha256_bytes(canonical_bytes(epoch_payload)),
        "definitions_ref": definitions_ref,
        "inventory_ref": inventory_ref,
        "validator_ref": validator_ref,
        "validation": validation,
        "historical_prototype_manifest": {
            "root": inventory["historical_prototype"]["root"],
            "member_count": inventory["historical_prototype"]["member_count"],
            "manifest_sha256": inventory["historical_prototype"]["manifest_sha256"],
            "status": inventory["historical_prototype"]["status"],
        },
        "successor_frontier": {
            "node_id": "AUTH-EVF-01",
            "state": "ready-for-ontology-and-contract-prototypes",
            "authority_effect": "none",
        },
        "claim_ceiling": "AUTH-EVF-00 exact definitions and candidate-input epoch are current and internally validated. No Auth S0-S12 profile, EVF conformance, implementation correspondence, theorem result, product approval, enforcement, publication, release, deployment, security, or external effect is granted.",
        "authority_effect": "none",
    }
    receipt["receipt_payload_digest"] = sha256_bytes(canonical_bytes(receipt))
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--suggest", action="store_true", help="print a rehashed inventory candidate")
    parser.add_argument("--receipt", action="store_true", help="print a content-bound PASS receipt")
    parser.add_argument("--verify-receipt", action="store_true", help="verify the committed receipt against current bytes")
    args = parser.parse_args()
    inventory = load(INVENTORY)
    if args.suggest:
        print(json.dumps(rehash_inventory(inventory), indent=2, ensure_ascii=False))
        return 0
    if args.receipt:
        try:
            receipt = build_receipt(inventory, load(DEFINITIONS))
        except ValueError as exc:
            print(json.dumps({"result": "BLOCK", "error": str(exc)}, indent=2))
            return 1
        print(json.dumps(receipt, indent=2, ensure_ascii=False))
        return 0
    if args.verify_receipt:
        expected = build_receipt(inventory, load(DEFINITIONS))
        actual = load(RECEIPT)
        result = {
            "schema_version": "auth-evf-freeze-receipt-verification/v1",
            "result": "PASS" if actual == expected else "BLOCK",
            "receipt_payload_digest": actual.get("receipt_payload_digest"),
            "current": actual == expected,
            "authority_effect": "none",
        }
        print(json.dumps(result, indent=2))
        return 0 if result["result"] == "PASS" else 1
    result = validate(inventory, load(DEFINITIONS))
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
