#!/usr/bin/env python3
"""Validate the bounded IOLM candidate contract and its discriminating fixtures."""

from __future__ import annotations

import copy
import json
import re
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


CONTRACT_DIR = Path(__file__).resolve().parent
PROTOTYPE_DIR = CONTRACT_DIR.parents[1]
FIXTURE_DIR = PROTOTYPE_DIR / "fixtures" / "candidate-contract"
SCHEMAS = {
    "input": CONTRACT_DIR / "candidate-input.schema.json",
    "build_receipt": CONTRACT_DIR / "candidate-build-receipt.schema.json",
    "view": CONTRACT_DIR / "candidate-view.schema.json",
}
MINTED_SCHEMA_IDS = {
    "graph": "https://domainspec.dev/schemas/minted-project/graph/v1",
    "source_manifest": "https://domainspec.dev/schemas/minted-project/source-manifest/v1",
    "build_receipt": "https://domainspec.dev/schemas/minted-project/build-receipt/v1",
}
DIGEST = re.compile(r"^[a-f0-9]{64}$")
CANDIDATE_ID = re.compile(r"^[a-z][a-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*)+$")
NODE_ID = re.compile(r"^[a-z][a-z0-9-]*\.[A-Za-z][A-Za-z0-9]*$")
EDGE_ID = re.compile(r"^[a-z][a-z0-9-]*\.edge\.[a-z][a-z0-9-]*$")


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def pointer_parts(pointer: str) -> list[str]:
    if not pointer.startswith("/"):
        raise ValueError(f"JSON pointer must start with '/': {pointer}")
    return [part.replace("~1", "/").replace("~0", "~") for part in pointer[1:].split("/")]


def apply_mutation(document: Any, mutation: dict[str, Any]) -> None:
    parts = pointer_parts(mutation["path"])
    parent = document
    for part in parts[:-1]:
        parent = parent[int(part)] if isinstance(parent, list) else parent[part]
    key = parts[-1]
    operation = mutation["op"]
    if operation == "remove":
        if isinstance(parent, list):
            del parent[int(key)]
        else:
            del parent[key]
    elif operation == "replace":
        if isinstance(parent, list):
            parent[int(key)] = mutation["value"]
        else:
            parent[key] = mutation["value"]
    elif operation == "add":
        if isinstance(parent, list):
            if key == "-":
                parent.append(mutation["value"])
            else:
                parent.insert(int(key), mutation["value"])
        else:
            parent[key] = mutation["value"]
    else:
        raise ValueError(f"unsupported mutation operation: {operation}")


def get_path(document: dict[str, Any], *parts: str) -> Any:
    current: Any = document
    for part in parts:
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def add_error(errors: list[str], code: str) -> None:
    if code not in errors:
        errors.append(code)


def semantic_errors(envelope: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    records = [envelope.get(name) for name in ("input", "build_receipt", "view")]

    if any(not isinstance(record, dict) or "posture" not in record for record in records):
        add_error(errors, "POSTURE_REQUIRED")
    for record in records:
        if not isinstance(record, dict):
            continue
        posture = record.get("posture")
        authority = record.get("authority")
        if posture not in (None, "candidate") or (
            isinstance(authority, str) and (authority == "authoritative" or authority.startswith("authoritative-"))
        ):
            add_error(errors, "AUTHORITATIVE_SELF_LABEL")

    if any(not DIGEST.fullmatch(str(get_path(record, "source_set_digest") or "")) for record in records if isinstance(record, dict)):
        add_error(errors, "SOURCE_DIGEST_REQUIRED")
    if any(not get_path(record, "compiler", "version") for record in records if isinstance(record, dict)):
        add_error(errors, "COMPILER_VERSION_REQUIRED")

    build = envelope.get("build_receipt")
    view = envelope.get("view")
    candidate_input = envelope.get("input")
    if not isinstance(build, dict) or not isinstance(build.get("provenance"), dict):
        add_error(errors, "PROVENANCE_REQUIRED")
    if not isinstance(view, dict) or not isinstance(view.get("provenance"), dict):
        add_error(errors, "PROVENANCE_REQUIRED")
    if isinstance(view, dict):
        for record in [*view.get("nodes", []), *view.get("edges", [])]:
            if not isinstance(record, dict) or not isinstance(record.get("provenance"), dict):
                add_error(errors, "PROVENANCE_REQUIRED")

    if isinstance(build, dict) and "G-DSV2-SG" in build.get("evidence_for", []):
        add_error(errors, "G_DSV2_SG_EVIDENCE_FORBIDDEN")

    candidate_ids = [record.get("candidate_id") for record in records if isinstance(record, dict)]
    if any(not CANDIDATE_ID.fullmatch(str(value or "")) for value in candidate_ids):
        add_error(errors, "STABLE_ID_INVALID")

    if isinstance(view, dict):
        nodes = view.get("nodes", [])
        edges = view.get("edges", [])
        node_ids = [record.get("node_id") for record in nodes if isinstance(record, dict)]
        edge_ids = [record.get("edge_id") for record in edges if isinstance(record, dict)]
        if any(not NODE_ID.fullmatch(str(value or "")) for value in node_ids):
            add_error(errors, "STABLE_ID_INVALID")
        if any(not EDGE_ID.fullmatch(str(value or "")) for value in edge_ids):
            add_error(errors, "STABLE_ID_INVALID")
        if len(set(node_ids)) != len(node_ids) or len(set(edge_ids)) != len(edge_ids):
            add_error(errors, "STABLE_ID_DUPLICATE")
        node_set = set(node_ids)
        if any(edge.get("from") not in node_set or edge.get("to") not in node_set for edge in edges if isinstance(edge, dict)):
            add_error(errors, "STABLE_ENDPOINT_MISSING")
        for record, identity_key in [(record, "node_id") for record in nodes] + [(record, "edge_id") for record in edges]:
            if isinstance(record, dict) and get_path(record, "provenance", "source_record_id") != record.get(identity_key):
                add_error(errors, "PROVENANCE_IDENTITY_MISMATCH")

    if all(isinstance(record, dict) for record in records):
        for field in ("candidate_id", "project_id", "source_set_digest", "compiler"):
            values = [json.dumps(record.get(field), sort_keys=True) for record in records]
            if len(set(values)) != 1:
                add_error(errors, "CROSS_DOCUMENT_IDENTITY_MISMATCH")

    if isinstance(candidate_input, dict):
        artifacts = candidate_input.get("minted_artifacts", {})
        for name, schema_id in MINTED_SCHEMA_IDS.items():
            if get_path(artifacts, name, "schema_id") != schema_id:
                add_error(errors, "MINTED_SCHEMA_BINDING_INVALID")
        if isinstance(build, dict):
            if get_path(build, "provenance", "minted_build_receipt_digest") != get_path(artifacts, "build_receipt", "digest"):
                add_error(errors, "PROVENANCE_DIGEST_MISMATCH")
            if get_path(build, "provenance", "minted_source_manifest_digest") != get_path(artifacts, "source_manifest", "digest"):
                add_error(errors, "PROVENANCE_DIGEST_MISMATCH")
        if isinstance(view, dict):
            if get_path(view, "provenance", "minted_graph_digest") != get_path(artifacts, "graph", "digest"):
                add_error(errors, "PROVENANCE_DIGEST_MISMATCH")
            if get_path(view, "provenance", "minted_source_manifest_digest") != get_path(artifacts, "source_manifest", "digest"):
                add_error(errors, "PROVENANCE_DIGEST_MISMATCH")

    return errors


def schema_errors(envelope: dict[str, Any], validators: dict[str, Draft202012Validator]) -> list[str]:
    errors: list[str] = []
    for name, validator in validators.items():
        value = envelope.get(name)
        for failure in sorted(validator.iter_errors(value), key=lambda item: list(item.absolute_path)):
            path = "/".join(str(part) for part in failure.absolute_path) or "$"
            errors.append(f"{name.upper()}_SCHEMA_INVALID:{path}:{failure.validator}")
    return errors


def validate_envelope(envelope: dict[str, Any], validators: dict[str, Draft202012Validator]) -> list[str]:
    return semantic_errors(envelope) + schema_errors(envelope, validators)


def main() -> int:
    validators: dict[str, Draft202012Validator] = {}
    for name, path in SCHEMAS.items():
        schema = read_json(path)
        Draft202012Validator.check_schema(schema)
        validators[name] = Draft202012Validator(schema, format_checker=FormatChecker())

    manifest = read_json(FIXTURE_DIR / "manifest.json")
    positive = read_json(FIXTURE_DIR / manifest["positive"])
    positive_errors = validate_envelope(positive, validators)
    if positive_errors:
        print(f"FAIL positive:minimal-candidate-envelope errors={','.join(positive_errors)}")
        return 1
    print("ACCEPT positive:minimal-candidate-envelope")

    failures: list[str] = []
    negative_cases = read_json(FIXTURE_DIR / manifest["negative"])["cases"]
    for case in negative_cases:
        mutated = copy.deepcopy(positive)
        for mutation in case["mutations"]:
            apply_mutation(mutated, mutation)
        errors = validate_envelope(mutated, validators)
        missing = [code for code in case["expected_codes"] if code not in errors]
        if not errors or missing:
            failures.append(case["id"])
            print(
                f"FAIL negative:{case['id']} expected={','.join(case['expected_codes'])} "
                f"actual={','.join(errors) or 'ACCEPTED'}"
            )
        else:
            print(f"REJECT negative:{case['id']} code={','.join(case['expected_codes'])}")

    if failures:
        print(f"FAIL candidate-contract negative_failures={len(failures)}")
        return 1
    print(
        f"PASS candidate-contract schemas={len(validators)} positive=1 "
        f"negative={len(negative_cases)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
