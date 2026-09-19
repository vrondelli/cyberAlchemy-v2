#!/usr/bin/env python3
"""Validate the FormalClaimSourcePayload/v2 positive and adversarial fixtures."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


SCHEMA_VERSION = "domainspec-v2.formal-claim-source-payload/v2"
EXPECTED_CASES = {
    "valid-logic-neutral-source": True,
    "reject-proof-term": False,
    "reject-theorem-declaration": False,
    "reject-proof-result": False,
    "reject-provider-admission": False,
    "reject-executable-profile": False,
    "reject-derived-decidability": False,
    "reject-evidence": False,
    "reject-obligation-discharge": False,
    "reject-promotion": False,
    "reject-publication": False,
    "reject-release": False,
    "reject-second-canonical-proposition": False,
}
FORBIDDEN_KEYS = {
    "proof",
    "proof_term",
    "theorem_declaration",
    "proof_result",
    "provider",
    "provider_admission",
    "executable_profile",
    "derived_decidability",
    "evidence",
    "discharge",
    "obligation_discharge",
    "promotion",
    "publication",
    "release",
}
SECOND_SOURCE_KEYS = {
    "canonical_propositions",
    "canonical_proposition_2",
    "alternate_canonical_proposition",
    "second_canonical_proposition",
}


def load_object(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot load {label} {path}: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object: {path}")
    return value


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def walk_keys(value: Any, location: str = "$") -> list[str]:
    errors: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            child_location = f"{location}.{key}"
            if key in FORBIDDEN_KEYS:
                errors.append(f"forbidden source-state key at {child_location}")
            if key in SECOND_SOURCE_KEYS:
                errors.append(f"second canonical source key at {child_location}")
            errors.extend(walk_keys(child, child_location))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(walk_keys(child, f"{location}[{index}]"))
    return errors


def semantic_errors(payload: dict[str, Any]) -> list[str]:
    errors = walk_keys(payload)
    if payload.get("schema_version") != SCHEMA_VERSION:
        errors.append("payload schema_version is not FormalClaimSourcePayload/v2")
    proposition = payload.get("canonical_proposition")
    if not isinstance(proposition, dict):
        errors.append("canonical_proposition must be exactly one object")
        return errors
    representation = proposition.get("representation")
    representation_digest = proposition.get("representation_digest")
    if isinstance(representation, str) and representation_digest != sha256_text(
        representation
    ):
        errors.append("canonical proposition representation digest mismatch")
    semantic_identity = proposition.get("semantic_identity")
    semantic_identity_digest = proposition.get("semantic_identity_digest")
    if isinstance(semantic_identity, str) and semantic_identity_digest != sha256_text(
        semantic_identity
    ):
        errors.append("canonical proposition semantic identity digest mismatch")
    return errors


def set_path(document: dict[str, Any], path: list[str], value: Any) -> None:
    if not path:
        raise ValueError("fixture mutation path must not be empty")
    cursor: dict[str, Any] = document
    for segment in path[:-1]:
        child = cursor.get(segment)
        if not isinstance(child, dict):
            raise ValueError(f"fixture mutation parent is not an object: {segment}")
        cursor = child
    cursor[path[-1]] = value


def validate_case(
    validator: Draft202012Validator,
    base_payload: dict[str, Any],
    fixture: dict[str, Any],
) -> dict[str, Any]:
    payload = copy.deepcopy(base_payload)
    mutation = fixture.get("mutation")
    if mutation is not None:
        if not isinstance(mutation, dict):
            raise ValueError("fixture mutation must be an object")
        path = mutation.get("path")
        if not isinstance(path, list) or not all(
            isinstance(item, str) and item for item in path
        ):
            raise ValueError("fixture mutation path must be non-empty strings")
        set_path(payload, path, mutation.get("value"))

    diagnostics = semantic_errors(payload)
    diagnostics.extend(
        f"schema invalid at {'/'.join(map(str, error.absolute_path)) or '<root>'}: "
        f"{error.message}"
        for error in sorted(
            validator.iter_errors(payload), key=lambda item: list(item.absolute_path)
        )
    )
    observed_valid = not diagnostics
    expected_valid = fixture.get("expected_valid")
    return {
        "case_id": fixture.get("case_id"),
        "expected_valid": expected_valid,
        "observed_valid": observed_valid,
        "result": "pass" if observed_valid is expected_valid else "fail",
        "diagnostics": diagnostics,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixtures", required=True)
    args = parser.parse_args()

    fixtures_path = Path(args.fixtures)
    schema_path = (
        Path(__file__).resolve().parent.parent
        / "contracts"
        / "formal-claim-source-payload.v2.schema.json"
    )
    try:
        schema = load_object(schema_path, "schema")
        matrix = load_object(fixtures_path, "fixture matrix")
        Draft202012Validator.check_schema(schema)
        base_payload = matrix.get("base_payload")
        fixtures = matrix.get("cases")
        if not isinstance(base_payload, dict):
            raise ValueError("fixture matrix base_payload must be an object")
        if not isinstance(fixtures, list):
            raise ValueError("fixture matrix cases must be an array")
        observed_ids = [fixture.get("case_id") for fixture in fixtures]
        if len(observed_ids) != len(set(observed_ids)):
            raise ValueError("fixture case ids must be unique")
        if set(observed_ids) != set(EXPECTED_CASES):
            raise ValueError("fixture matrix does not contain the exact required cases")
        for fixture in fixtures:
            case_id = fixture.get("case_id")
            if fixture.get("expected_valid") is not EXPECTED_CASES[case_id]:
                raise ValueError(f"fixture expected_valid drift: {case_id}")
        validator = Draft202012Validator(schema)
        results = [
            validate_case(validator, base_payload, fixture) for fixture in fixtures
        ]
    except (KeyError, TypeError, ValueError) as error:
        print(json.dumps({"result": "block", "error": str(error)}, sort_keys=True))
        return 2

    passed = all(item["result"] == "pass" for item in results)
    print(
        json.dumps(
            {
                "schema_version": "domainspec-v2.formal-claim-source-validation/v1",
                "result": "pass" if passed else "fail",
                "case_count": len(results),
                "passed_count": sum(item["result"] == "pass" for item in results),
                "cases": results,
                "claim_ceiling": "source-envelope-contract-implemented",
                "authority_effect": "none",
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
