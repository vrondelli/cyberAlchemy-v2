#!/usr/bin/env python3
"""Validate the private FormalClaim package and bounded EVF Lean evidence."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[8]
PACKAGE = Path(__file__).resolve().parent
EVF = ROOT / "projects/domainspec-v2/development/evolvable-validation-framework"
FORMALIZATION = ROOT / "projects/domainspec-v2/formalization"
SOURCE_SCHEMA = (
    ROOT
    / "projects/domainspec-v2/development/spec-ontology-branch-decision/contracts/formal-claim-source-payload.v2.schema.json"
)
LEAN_BINDING_SCHEMA = FORMALIZATION / "schemas/formal-claim-lean-binding.schema.json"
CAPABILITY = (
    ROOT
    / "cyberAlchemy-v2/product/knowledge-exchange-protocol/realize-no-price-solana-coownership.product-capability.json"
)
ADOPTION = (
    ROOT
    / "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/decisions/product-capability-adoption-001.json"
)
ONTOLOGY_CANDIDATE = (
    ROOT
    / "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/ontology/candidate.json"
)
PROFILE_REGISTRY = FORMALIZATION / "profiles/formal-language-profiles.json"
IDENTITY_ALGORITHM_TEXT = (
    "sha256-utf8-exact-representation-and-semantic-identity/v1"
)


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    )


def validate_schema(schema_path: Path, value: dict[str, Any], label: str) -> None:
    errors = sorted(
        Draft202012Validator(load(schema_path)).iter_errors(value),
        key=lambda error: list(error.absolute_path),
    )
    if errors:
        first = errors[0]
        location = "/".join(map(str, first.absolute_path)) or "<root>"
        raise ValueError(f"{label} invalid at {location}: {first.message}")


def verify_ref(reference: dict[str, Any]) -> None:
    path = ROOT / reference["path"]
    data = path.read_bytes()
    if reference["sha256"] != sha256(data) or reference["size_bytes"] != len(data):
        raise ValueError(f"stale exact reference: {reference['path']}")
    if "current" in reference and reference["current"] is not True:
        raise ValueError(f"non-current exact reference: {reference['path']}")


def extracted_proposition() -> str:
    source = (PACKAGE / "NoPriceSolanaCoOwnership.lean").read_text(encoding="utf-8")
    begin = "  -- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN\n"
    end = "\n  -- DOMAINSPEC-CANONICAL-PROPOSITION-END"
    if source.count(begin) != 1 or source.count(end) != 1:
        raise ValueError("canonical proposition markers are not unique")
    return source.split(begin, 1)[1].split(end, 1)[0].strip()


def main() -> int:
    try:
        claim = load(PACKAGE / "FORMAL-CLAIM.json")
        preservation = load(PACKAGE / "PRESERVATION-BINDING.json")
        binding = load(PACKAGE / "FORMAL-CLAIM-LEAN-BINDING.json")
        environment = load(PACKAGE / "LEAN-ENVIRONMENT.json")
        policy = load(PACKAGE / "THEOREM-EXECUTION-POLICY.json")
        runtime = load(PACKAGE / "LEAN-PROVIDER-RUNTIME-BINDING.json")
        request = load(PACKAGE / "THEOREM-OBLIGATION-REQUEST.json")
        receipt = load(PACKAGE / "THEOREM-OBLIGATION-RECEIPT.json")
        handle = load(PACKAGE / "EVF-FORMAL-EVIDENCE-HANDLE.json")

        validate_schema(SOURCE_SCHEMA, claim, "FormalClaim")
        validate_schema(LEAN_BINDING_SCHEMA, binding, "Lean binding")
        validate_schema(EVF / "contracts/lean-provider-manifest.v1.schema.json", runtime, "runtime")
        validate_schema(EVF / "contracts/lean-theorem-request.v1.schema.json", request, "request")
        validate_schema(EVF / "contracts/lean-theorem-receipt.v1.schema.json", receipt, "receipt")
        validate_schema(EVF / "contracts/evf-formal-evidence-handle.v1.schema.json", handle, "EVF handle")

        representation = claim["canonical_proposition"]["representation"]
        if extracted_proposition() != representation:
            raise ValueError("Lean projection does not preserve the canonical proposition text")
        if sha256(representation.encode()) != claim["canonical_proposition"]["representation_digest"]:
            raise ValueError("canonical proposition representation digest mismatch")
        semantic_identity = claim["canonical_proposition"]["semantic_identity"]
        if sha256(semantic_identity.encode()) != claim["canonical_proposition"]["semantic_identity_digest"]:
            raise ValueError("canonical proposition semantic identity digest mismatch")

        business = claim["business_binding"]
        if sha256(CAPABILITY.read_bytes()) != business["business_meaning_digest"]:
            raise ValueError("adopted Product Capability digest mismatch")
        if sha256(ADOPTION.read_bytes()) != business["acceptance_digest"]:
            raise ValueError("Product Capability adoption digest mismatch")
        if sha256(PROFILE_REGISTRY.read_bytes()) != claim["formal_language_profile"]["profile_digest"]:
            raise ValueError("formal-language profile registry digest mismatch")
        ontology = load(ONTOLOGY_CANDIDATE)
        if ontology["lifecycle_status"] != "authored-candidate" or ontology["admission_status"] != "not-requested":
            raise ValueError("ontology candidate lifecycle posture drift")
        model_binding = claim["interpretation_environment"]["model_profile_bindings"]
        if len(model_binding) != 1 or model_binding[0]["digest"] != ontology["material_digest"]:
            raise ValueError("ontology candidate material binding mismatch")

        interpretation = dict(claim["interpretation_environment"])
        recorded_environment_digest = interpretation.pop("environment_digest")
        if canonical_digest(interpretation) != recorded_environment_digest:
            raise ValueError("interpretation environment digest mismatch")
        algorithm = claim["canonical_proposition"]["identity_algorithm"]
        if sha256(IDENTITY_ALGORITHM_TEXT.encode()) != algorithm["digest"]:
            raise ValueError("identity algorithm digest mismatch")
        source_inputs = [
            business["business_meaning_digest"],
            business["acceptance_digest"],
            ontology["material_digest"],
            claim["formal_language_profile"]["profile_digest"],
            claim["canonical_proposition"]["representation_digest"],
            claim["canonical_proposition"]["semantic_identity_digest"],
            recorded_environment_digest,
        ]
        source_bytes = b"".join(value.encode() + b"\0" for value in source_inputs)
        if sha256(source_bytes) != claim["claim"]["source_digest"]:
            raise ValueError("FormalClaim source digest mismatch")

        for document in (preservation, binding, environment, policy, runtime, request):
            for key, value in document.items():
                if key.endswith("_ref") and isinstance(value, dict) and "path" in value:
                    verify_ref(value)
        for reference in receipt["input_refs"]:
            verify_ref(reference)
        verify_ref(receipt["request_ref"])
        verify_ref(handle["provider_receipt_ref"])

        receipt_payload = {key: value for key, value in receipt.items() if key != "receipt_payload_digest"}
        handle_payload = {key: value for key, value in handle.items() if key != "handle_payload_digest"}
        if canonical_digest(receipt_payload) != receipt["receipt_payload_digest"]:
            raise ValueError("receipt payload digest mismatch")
        if canonical_digest(handle_payload) != handle["handle_payload_digest"]:
            raise ValueError("EVF handle payload digest mismatch")
        if receipt["normalized_outcome"] != "theorem-checked":
            raise ValueError("Lean theorem is not checked")
        if receipt["execution"]["deterministic"] is not True:
            raise ValueError("Lean provider runs are not deterministic")
        expected = request["expected_declarations"]
        if receipt["source_analysis"].get("missing_expected_declarations") != []:
            raise ValueError("expected Lean theorem declaration is missing")
        if receipt["source_analysis"].get("expected_declarations") != expected:
            raise ValueError("receipt expected declarations drift")
        if handle["claim_ceiling"] != "exact-lean-theorem-declarations-checked-only":
            raise ValueError("EVF handle exceeds or loses the provider claim ceiling")
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"CAV2_KEP_FORMALCLAIM_VALIDATION=block\nDETAIL={error}", file=sys.stderr)
        return 1
    print("CAV2_KEP_FORMALCLAIM_VALIDATION=pass")
    print("FORMAL_CLAIM=source-current-candidate-not-admitted")
    print("LEAN_PROVIDER=theorem-checked-deterministic")
    print("EVF_HANDLE=exact-lean-theorem-declarations-checked-only")
    print("RUNTIME_CONFORMANCE=not-established")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
