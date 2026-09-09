#!/usr/bin/env python3
"""Validate the encrypted, durable Devnet Product Capability candidate."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


EXPECTED_CAPABILITY_ID = "CA2-CAP-REALIZE-ENCRYPTED-DURABLE-DEVNET-COOWNERSHIP"
EXPECTED_SOLANA_IDS = tuple(f"KEP-SOL-D{index}" for index in range(1, 18))
EXPECTED_STORAGE_IDS = tuple(f"KEP-DST-D{index}" for index in range(1, 16))
EXPECTED_BINDINGS = EXPECTED_SOLANA_IDS + EXPECTED_STORAGE_IDS
EXPECTED_CONSTRUCTION_STATE = {
    "canonical_definitions": "accepted",
    "product_capability": "authored-candidate-awaiting-owner-adoption",
    "business_ontology": "not_evaluable",
    "domainspec_v2_source": "not_evaluable",
    "compiled_graph_and_system_ontology": "not_evaluable",
    "implementation_binding": "not_evaluable",
    "conformance_evidence": "not_evaluable",
    "devnet_trial": "not_evaluable",
}
EXPECTED_GIT_OBJECT = "1b629e601"


def configure(package_root: Path, repository_root: Path | None = None) -> None:
    global ROOT, REPOSITORY_ROOT, SCHEMA_PATH
    ROOT = package_root.resolve()
    REPOSITORY_ROOT = (repository_root or ROOT.parents[7]).resolve()
    SCHEMA_PATH = REPOSITORY_ROOT / "cyberAlchemy-v2/capability/schemas/capability.schema.json"


configure(Path(__file__).resolve().parent)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one object")
        return {}
    return value


def validate_schema(instance: dict[str, Any], errors: list[str]) -> None:
    schema = load(SCHEMA_PATH, errors)
    if not schema:
        return
    selected = dict(schema)
    selected.pop("$id", None)
    selected["$ref"] = "#/$defs/productCapability"
    try:
        Draft202012Validator.check_schema(selected)
    except SchemaError as exc:
        errors.append(f"Product Capability schema invalid: {exc.message}")
        return
    validator = Draft202012Validator(selected, format_checker=FormatChecker())
    for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path)):
        location = ".".join(str(part) for part in error.absolute_path) or "$"
        errors.append(f"Product Capability schema violation at {location}: {error.message}")


def local_dependency(record: Any, label: str, errors: list[str], digest_key: str = "sha256") -> dict[str, Any]:
    if not isinstance(record, dict):
        errors.append(f"{label} must be an object")
        return {}
    relative = record.get("path")
    if not isinstance(relative, str) or not relative:
        errors.append(f"{label} path missing")
        return {}
    path = (ROOT / relative).resolve()
    if not path.is_file():
        errors.append(f"{label} is missing")
        return {}
    if record.get(digest_key) != sha256(path):
        errors.append(f"{label} digest drift")
    return load(path, errors)


def local_named_dependency(
    record: Any,
    path_key: str,
    digest_key: str,
    label: str,
    errors: list[str],
) -> dict[str, Any]:
    if not isinstance(record, dict):
        errors.append(f"{label} must be an object")
        return {}
    relative = record.get(path_key)
    if not isinstance(relative, str) or not relative:
        errors.append(f"{label} path missing")
        return {}
    path = (ROOT / relative).resolve()
    if not path.is_file():
        errors.append(f"{label} is missing")
        return {}
    if record.get(digest_key) != sha256(path):
        errors.append(f"{label} digest drift")
    return load(path, errors) if path.suffix == ".json" else {}


def git_bytes(record: Any, label: str, errors: list[str]) -> bytes:
    if not isinstance(record, dict):
        errors.append(f"{label} must be an object")
        return b""
    if record.get("git_object") != EXPECTED_GIT_OBJECT:
        errors.append(f"{label} Git object drift")
    path = record.get("path")
    if not isinstance(path, str) or not path:
        errors.append(f"{label} path missing")
        return b""
    try:
        result = subprocess.run(
            ["git", "show", f"{record.get('git_object')}:{path}"],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
        )
    except OSError as exc:
        errors.append(f"{label} Git resolution failed: {exc}")
        return b""
    if result.returncode != 0:
        errors.append(f"{label} Git object dependency is missing")
        return b""
    if record.get("sha256") != sha256_bytes(result.stdout):
        errors.append(f"{label} digest drift")
    return result.stdout


def parse_git_json(value: bytes, label: str, errors: list[str]) -> dict[str, Any]:
    if not value:
        return {}
    try:
        result = json.loads(value)
    except json.JSONDecodeError as exc:
        errors.append(f"{label} is not valid JSON: {exc}")
        return {}
    if not isinstance(result, dict):
        errors.append(f"{label} must contain one object")
        return {}
    return result


def require_adopted(decision: dict[str, Any], expected_digest: str, label: str, errors: list[str]) -> None:
    if decision.get("adoption", {}).get("lifecycle_status") != "adopted":
        errors.append(f"{label} is not adopted")
    subject_digest = decision.get("subject", {}).get("sha256")
    adopted_digest = decision.get("adoption", {}).get("adopted_capability_sha256")
    if subject_digest != expected_digest:
        errors.append(f"{label} subject digest drift")
    if adopted_digest is not None and adopted_digest != expected_digest:
        errors.append(f"{label} adopted digest drift")


def material_digest(paths: list[tuple[str, Path]], git_material: list[tuple[str, bytes]], errors: list[str]) -> str:
    digest = hashlib.sha256()
    for label, path in sorted(paths):
        if not path.is_file():
            errors.append(f"missing material file: {label}")
            continue
        digest.update(label.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    for label, value in sorted(git_material):
        if not value:
            continue
        digest.update(label.encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
    return digest.hexdigest()


def validate() -> dict[str, Any]:
    errors: list[str] = []
    capability_path = ROOT / "product-capability.json"
    candidate_path = ROOT / "product-capability-candidate.json"
    crypto_path = ROOT / "cryptographic-profile.json"
    storage_path = ROOT / "durable-storage-instantiation.json"
    capability = load(capability_path, errors)
    candidate = load(candidate_path, errors)
    crypto = load(crypto_path, errors)
    storage = load(storage_path, errors)
    validate_schema(capability, errors)

    if capability.get("capability_id") != EXPECTED_CAPABILITY_ID:
        errors.append("Product Capability identity drift")
    if capability.get("business_ontology_ref") != "CA2-ONTOLOGY-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET":
        errors.append("future business ontology identity drift")
    if capability.get("lifecycle_posture", {}).get("status", {}).get("value") != "authored-candidate":
        errors.append("Product Capability must remain an authored candidate")
    if capability.get("lifecycle_posture", {}).get("commitment", {}).get("value") != "not-adopted":
        errors.append("Product Capability must remain not adopted")
    if capability.get("authority_effect") != "none":
        errors.append("Product Capability candidate claims authority")
    capability_text = json.dumps(capability, sort_keys=True).lower()
    for phrase in (
        "owner set is {a}",
        "owner set {a, b}",
        "preserve a",
        "finalized activation",
        "retrieve and decrypt",
        "request a policy-authorized",
        "without transferring a knowledge price",
    ):
        if phrase not in capability_text:
            errors.append(f"missing protocol outcome boundary: {phrase}")
    for phrase in (
        "claiming atomicity between solana and external storage",
        "knowledge price, escrow, seller payout, royalty, treasury consideration, or token transfer",
        "mainnet execution",
    ):
        if phrase not in capability_text:
            errors.append(f"missing capability exclusion: {phrase}")

    if candidate.get("candidate_id") != "CA2-CANDIDATE-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-CAPABILITY-001":
        errors.append("candidate envelope identity drift")
    local_dependency(candidate.get("capability"), "candidate Product Capability", errors)
    predecessors = candidate.get("predecessors", {})
    canonical = predecessors.get("canonical_definitions", {})
    local_named_dependency(canonical, "predecessor_path", "predecessor_sha256", "base Solana definitions", errors)
    local_named_dependency(canonical, "extension_path", "extension_sha256", "Solana completion definitions", errors)
    if tuple(canonical.get("selected_ids", [])) != EXPECTED_SOLANA_IDS or canonical.get("lifecycle_status") != "accepted":
        errors.append("accepted Solana definition closure drift")
    definition_decision = local_dependency(predecessors.get("definition_acceptance"), "definition acceptance", errors)
    if definition_decision.get("acceptance", {}).get("lifecycle_status") != "accepted":
        errors.append("Solana completion definitions are not accepted")
    base_capability = local_dependency(predecessors.get("base_solana_product_capability"), "base Solana Product Capability", errors)
    base_adoption = local_dependency(predecessors.get("base_solana_product_capability_adoption"), "base Solana adoption", errors)
    if base_capability.get("capability_id") != "CA2-CAP-REALIZE-NO-PRICE-SOLANA-COOWNERSHIP":
        errors.append("base Solana Product Capability identity drift")
    require_adopted(base_adoption, predecessors.get("base_solana_product_capability", {}).get("sha256", ""), "base Solana Product Capability", errors)

    git_material: list[tuple[str, bytes]] = []
    for capability_key, adoption_key, label in (
        ("durable_storage_product_capability", "durable_storage_product_capability_adoption", "Durable Storage Product Capability"),
        ("sql_three_layer_product_capability", "sql_three_layer_product_capability_adoption", "SQL three-layer Product Capability"),
    ):
        capability_record = predecessors.get(capability_key, {})
        adoption_record = predecessors.get(adoption_key, {})
        capability_bytes = git_bytes(capability_record, label, errors)
        adoption_bytes = git_bytes(adoption_record, f"{label} adoption", errors)
        git_material.extend([(label, capability_bytes), (f"{label} adoption", adoption_bytes)])
        git_capability = parse_git_json(capability_bytes, label, errors)
        git_adoption = parse_git_json(adoption_bytes, f"{label} adoption", errors)
        if git_capability.get("capability_id") != capability_record.get("capability_id"):
            errors.append(f"{label} identity drift")
        require_adopted(git_adoption, capability_record.get("sha256", ""), label, errors)

    specializations = candidate.get("specializations", {})
    local_dependency(specializations.get("cryptographic_profile"), "cryptographic profile", errors)
    local_dependency(specializations.get("durable_storage_instantiation"), "Durable Storage instantiation", errors)
    if crypto.get("profile_id") != "KEP-SOL-CRYPTO-DEVNET-V1" or crypto.get("status") != "candidate-test-only":
        errors.append("cryptographic profile identity or test-only boundary drift")
    content = crypto.get("content_encryption", {})
    if (content.get("construction"), content.get("key_bytes"), content.get("nonce_bytes"), content.get("tag_bytes")) != (
        "XChaCha20-Poly1305-IETF", 32, 24, 16
    ):
        errors.append("content-encryption suite drift")
    envelope = crypto.get("recipient_envelope", {})
    if (
        envelope.get("standard"),
        envelope.get("mode"),
        envelope.get("kem", {}).get("id"),
        envelope.get("kdf", {}).get("id"),
        envelope.get("aead", {}).get("id"),
    ) != ("RFC 9180 HPKE", "Base", "0x0020", "0x0001", "0x0003"):
        errors.append("recipient-envelope suite drift")
    serialization = crypto.get("serialization", {})
    if serialization.get("format") != "CBOR" or serialization.get("profile") != "core deterministic encoding requirements":
        errors.append("deterministic serialization boundary drift")
    if crypto.get("authority_effect") != "none" or crypto.get("external_effect") != "none":
        errors.append("cryptographic profile exceeds its effect ceiling")

    if storage.get("instantiation_id") != "KEP-SOL-DST-INSTANTIATION-DEVNET-V1":
        errors.append("Durable Storage instantiation identity drift")
    if tuple(storage.get("reused_definition_ids", [])) != EXPECTED_STORAGE_IDS:
        errors.append("Durable Storage definition closure drift")
    readiness = storage.get("readiness_rule", {})
    if readiness.get("required_before_transaction_submission") is not True or len(readiness.get("conditions", [])) != 6:
        errors.append("pre-submission storage readiness drift")
    if "do not construct, sign, or submit" not in readiness.get("result_if_incomplete", ""):
        errors.append("storage failure no-submit boundary drift")
    if storage.get("activation_rule", {}).get("solana_commitment") != "finalized":
        errors.append("finalized activation boundary drift")
    if storage.get("activation_rule", {}).get("cross_system_atomicity_claim") != "forbidden":
        errors.append("cross-system atomicity boundary drift")
    reissue = storage.get("reissue_rule", {})
    if "B through" not in reissue.get("requester", "") or "only through the exact Propagation Policy" not in reissue.get("first_trial_fulfiller", ""):
        errors.append("bounded B-request/A-fulfillment reissue authority drift")
    if storage.get("provider_realization", {}).get("status") != "unbound-until-implementation-binding":
        errors.append("storage provider was selected before implementation binding")
    if storage.get("authority_effect") != "none" or storage.get("external_effect") != "none":
        errors.append("Durable Storage instantiation exceeds its effect ceiling")

    policies = candidate.get("selected_policy_values", {})
    if policies.get("activation_commitment") != "finalized" or policies.get("knowledge_price") != "none":
        errors.append("selected activation or no-price policy drift")
    if policies.get("storage_provider") != "unbound":
        errors.append("candidate silently binds a storage provider")
    if tuple(candidate.get("required_definition_bindings", [])) != EXPECTED_BINDINGS:
        errors.append("candidate definition-binding closure drift")
    if candidate.get("construction_state") != EXPECTED_CONSTRUCTION_STATE:
        errors.append("D65 construction state must stop at the authored Product Capability candidate")
    if candidate.get("adoption_status") != "not-requested":
        errors.append("Product Capability adoption was not authorized")
    if candidate.get("successor_authorization") != "none":
        errors.append("Product Capability candidate authorizes a successor")
    if candidate.get("enforcement_effect") != "none" or candidate.get("external_effect") != "none":
        errors.append("Product Capability candidate exceeds its effect ceiling")

    digest = material_digest(
        [
            ("Product Capability", capability_path),
            ("candidate envelope", candidate_path),
            ("cryptographic profile", crypto_path),
            ("Durable Storage instantiation", storage_path),
        ],
        git_material,
        errors,
    )
    return {
        "schema_version": "cav2-kep-solana-encrypted-durable-devnet-capability-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "capability_id": EXPECTED_CAPABILITY_ID,
        "capability_sha256": sha256(capability_path) if capability_path.is_file() else None,
        "capability_status": "authored-candidate",
        "definition_set_id": "KEP-SOL-DEFINITION-SET-002",
        "definition_count": len(EXPECTED_BINDINGS),
        "published_dependency_git_object": EXPECTED_GIT_OBJECT,
        "material_digest": digest,
        "d65_last_evaluable_stage": "authored encrypted durable Devnet Product Capability candidate",
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Validated authored Product Capability candidate only; no adoption, ontology, DomainSpec, implementation, security approval, transaction, publication, deployment, or external effect.",
        "errors": errors,
    }


def main() -> int:
    result = validate()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
