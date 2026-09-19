#!/usr/bin/env python3
"""Validate EVF Lean contracts and their exact Auth request/runtime instances."""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[5]
EVF = ROOT / "projects/domainspec-v2/development/evolvable-validation-framework"
CASE = ROOT / "projects/auth-foundation/formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001"


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def validator(name: str) -> Draft202012Validator:
    schema = load(EVF / "contracts" / name)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def require_valid(checker: Draft202012Validator, value: dict, label: str) -> None:
    errors = list(checker.iter_errors(value))
    if errors:
        raise ValueError(f"{label}: {errors[0].message}")


def require_invalid(checker: Draft202012Validator, value: dict, label: str) -> None:
    if not list(checker.iter_errors(value)):
        raise ValueError(f"negative control accepted: {label}")


def main() -> int:
    try:
        request_schema = validator("lean-theorem-request.v1.schema.json")
        runtime_schema = validator("lean-provider-manifest.v1.schema.json")
        validator("lean-theorem-receipt.v1.schema.json")
        validator("evf-formal-evidence-handle.v1.schema.json")
        request = load(CASE / "THEOREM-OBLIGATION-REQUEST.v2-ready.json")
        runtime = load(CASE / "LEAN-PROVIDER-RUNTIME-BINDING.v1-candidate.json")
        theorem_request = load(CASE / "THEOREM-OBLIGATION-REQUEST.v3-theorem-ready.json")
        theorem_runtime = load(CASE / "LEAN-PROVIDER-RUNTIME-BINDING.v2-theorem-candidate.json")
        require_valid(request_schema, request, "Auth request")
        require_valid(runtime_schema, runtime, "Auth runtime binding")
        require_valid(request_schema, theorem_request, "Auth theorem request")
        require_valid(runtime_schema, theorem_runtime, "Auth theorem runtime binding")
        stale = copy.deepcopy(request)
        stale["theorem_statement_ref"]["current"] = False
        require_invalid(request_schema, stale, "ready request with stale theorem ref")
        open_environment = copy.deepcopy(runtime)
        open_environment["environment_allowlist"] = ["PATH"]
        require_invalid(runtime_schema, open_environment, "non-empty runtime environment")
        network = copy.deepcopy(runtime)
        network["network"] = "allowed"
        require_invalid(runtime_schema, network, "network-enabled runtime")
        duplicate_declaration = copy.deepcopy(theorem_request)
        duplicate_declaration["expected_declarations"].append(
            duplicate_declaration["expected_declarations"][0]
        )
        require_invalid(request_schema, duplicate_declaration, "duplicate expected declaration")
        malformed_declaration = copy.deepcopy(theorem_request)
        malformed_declaration["expected_declarations"] = ["not a Lean declaration"]
        require_invalid(request_schema, malformed_declaration, "malformed expected declaration")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"LEAN_CONTRACT_VALIDATION=block\nDETAIL={error}", file=sys.stderr)
        return 1
    print("LEAN_CONTRACT_VALIDATION=pass")
    print("SCHEMAS=4")
    print("BOUND_INSTANCES=4")
    print("NEGATIVE_CONTROLS=5")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
