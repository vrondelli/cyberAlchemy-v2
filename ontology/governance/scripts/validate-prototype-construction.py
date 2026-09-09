#!/usr/bin/env python3
"""Validate and freeze CAV2-D65 revision-2 prototype constructions."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
CONSTRUCTIONS_PATH = PACKAGE_ROOT / "prototype-constructions.json"
SCAFFOLDS_PATH = PACKAGE_ROOT / "ontology-scaffolds.json"
CONSTRUCTION_SCHEMA_PATH = PACKAGE_ROOT / "schemas/prototype-construction.schema.json"
SCAFFOLD_SCHEMA_PATH = PACKAGE_ROOT / "schemas/ontology-scaffold.schema.json"


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def canonical_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def heading_section_bytes(path: Path, selector: str) -> bytes:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next((index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector), None)
    if start is None:
        raise ValueError(f"selector not found: {selector}")
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "".join(lines[start:end]).encode("utf-8")


def json_record_bytes(path: Path, selector: str) -> bytes:
    collection, expression = selector.split(":", 1)
    field, expected = expression.split("=", 1)
    records = load_json(path).get(collection)
    if not isinstance(records, list):
        raise ValueError(f"record collection not found: {collection}")
    matches = [item for item in records if isinstance(item, dict) and str(item.get(field)) == expected]
    if len(matches) != 1:
        raise ValueError(f"selector must resolve exactly one record: {selector}")
    return canonical_json_bytes(matches[0])


def selected_bytes(binding: dict[str, Any], repository_root: Path) -> bytes:
    path = repository_root / str(binding["path"])
    scope = binding["scope_kind"]
    selector = binding.get("selector")
    if scope == "whole-file":
        return path.read_bytes()
    if not isinstance(selector, str):
        raise ValueError("selector is required for selected scope")
    if scope == "heading-section":
        return heading_section_bytes(path, selector)
    if scope == "json-record":
        return json_record_bytes(path, selector)
    raise ValueError(f"unsupported scope: {scope}")


def schema_errors(instance: Any, schema: dict[str, Any], label: str) -> list[str]:
    errors: list[str] = []
    for violation in sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda item: list(item.path)):
        location = ".".join(str(part) for part in violation.path) or "$"
        errors.append(f"{label}.{location}: {violation.message}")
    return errors


def freeze_payload(construction: dict[str, Any]) -> dict[str, Any]:
    bindings = sorted(construction.get("artifact_bindings", []), key=lambda item: str(item.get("id")))
    return {
        "schema_version": "cav2-d65-testable-product-freeze/v1",
        "construction_id": construction.get("construction_id"),
        "subject_ref": construction.get("subject_ref"),
        "revision": construction.get("revision"),
        "components": [
            {
                "id": item.get("id"),
                "path": item.get("path"),
                "scope_kind": item.get("scope_kind"),
                "selector": item.get("selector"),
                "sha256": item.get("sha256"),
            }
            for item in bindings
        ],
    }


def freeze_candidate(construction: dict[str, Any]) -> dict[str, Any]:
    payload = freeze_payload(construction)
    return {
        "candidate_id": f"{construction.get('construction_id')}-CANDIDATE",
        "component_binding_ids": [item["id"] for item in payload["components"]],
        "manifest_sha256": sha256_bytes(canonical_json_bytes(payload)),
    }


def evaluate_registry(
    constructions: dict[str, Any],
    scaffolds: dict[str, Any],
    *,
    repository_root: Path = REPOSITORY_ROOT,
    check_files: bool = True,
) -> dict[str, Any]:
    errors = schema_errors(constructions, load_json(CONSTRUCTION_SCHEMA_PATH), "construction registry")
    errors.extend(schema_errors(scaffolds, load_json(SCAFFOLD_SCHEMA_PATH), "scaffold registry"))
    warnings: list[str] = []
    eligibility: dict[str, dict[str, Any]] = {}

    scaffold_rows = scaffolds.get("scaffolds", []) if isinstance(scaffolds.get("scaffolds"), list) else []
    scaffold_by_id = {item.get("scaffold_id"): item for item in scaffold_rows if isinstance(item, dict)}
    if len(scaffold_by_id) != len(scaffold_rows):
        errors.append("scaffold IDs must be unique")

    for scaffold_id, scaffold in scaffold_by_id.items():
        if scaffold.get("canonicality") != "non-authoritative" or scaffold.get("authority_effect") != "none":
            errors.append(f"ontology scaffold {scaffold_id} must remain non-authoritative")
        if check_files:
            for binding in scaffold.get("source_bindings", []):
                try:
                    actual = sha256_bytes(selected_bytes(binding, repository_root))
                except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
                    errors.append(f"scaffold source {binding.get('id')} is not evaluable: {exc}")
                    continue
                if actual != binding.get("sha256"):
                    errors.append(f"scaffold source drift: {binding.get('id')}")

    rows = constructions.get("constructions", []) if isinstance(constructions.get("constructions"), list) else []
    construction_ids = [item.get("construction_id") for item in rows if isinstance(item, dict)]
    if len(set(construction_ids)) != len(construction_ids):
        errors.append("construction IDs must be unique")

    for construction in rows:
        if not isinstance(construction, dict):
            continue
        construction_id = str(construction.get("construction_id"))
        local_errors: list[str] = []
        blockers: list[str] = []
        bindings = construction.get("artifact_bindings", [])
        binding_ids = [item.get("id") for item in bindings if isinstance(item, dict)]
        if len(set(binding_ids)) != len(binding_ids):
            local_errors.append("artifact binding IDs must be unique")
        for scaffold_ref in construction.get("ontology_scaffold_refs", []):
            scaffold = scaffold_by_id.get(scaffold_ref)
            if scaffold is None:
                local_errors.append(f"ontology scaffold ref does not resolve: {scaffold_ref}")
            elif scaffold.get("construction_id") != construction_id:
                local_errors.append(f"ontology scaffold belongs to another construction: {scaffold_ref}")
        if check_files:
            for binding in bindings:
                try:
                    actual = sha256_bytes(selected_bytes(binding, repository_root))
                except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
                    local_errors.append(f"artifact {binding.get('id')} is not evaluable: {exc}")
                    continue
                if actual != binding.get("sha256"):
                    local_errors.append(f"artifact drift: {binding.get('id')}")

        candidate = construction.get("testable_product_candidate")
        expected_candidate = freeze_candidate(construction)
        if not isinstance(candidate, dict):
            blockers.append("TESTABLE_PRODUCT_CANDIDATE_NOT_FROZEN")
        else:
            if set(candidate.get("component_binding_ids", [])) != set(binding_ids):
                local_errors.append("frozen candidate must include every exact artifact binding")
            if candidate.get("manifest_sha256") != expected_candidate["manifest_sha256"]:
                local_errors.append("frozen candidate manifest digest is non-current")

        contract = construction.get("product_test_contract")
        required_tests = set(contract.get("required_test_ids", [])) if isinstance(contract, dict) else set()
        if not required_tests:
            blockers.append("PRODUCT_TEST_CONTRACT_MISSING")
        evidence_by_test: dict[str, dict[str, Any]] = {}
        evidence_ids: set[str] = set()
        for evidence in construction.get("product_test_evidence", []):
            evidence_id = evidence.get("evidence_id")
            if evidence_id in evidence_ids:
                local_errors.append(f"duplicate product-test evidence id: {evidence_id}")
            evidence_ids.add(evidence_id)
            test_id = evidence.get("test_id")
            if test_id in evidence_by_test:
                local_errors.append(f"duplicate product-test evidence for test: {test_id}")
            evidence_by_test[test_id] = evidence
            if not isinstance(candidate, dict) or evidence.get("candidate_manifest_sha256") != candidate.get("manifest_sha256"):
                local_errors.append(f"product-test evidence is not bound to the frozen candidate: {evidence_id}")
            if check_files:
                binding = evidence.get("evidence_binding", {})
                try:
                    actual = sha256_bytes(selected_bytes(binding, repository_root))
                except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
                    local_errors.append(f"product-test evidence {evidence_id} is not evaluable: {exc}")
                    continue
                if actual != binding.get("sha256"):
                    local_errors.append(f"product-test evidence drift: {evidence_id}")
                try:
                    receipt_path = repository_root / str(binding.get("path", ""))
                    receipt = load_json(receipt_path)
                    receipt_tests = {
                        item.get("test_id"): item.get("result")
                        for item in receipt.get("tests", [])
                        if isinstance(item, dict)
                    }
                    if receipt.get("status") != "PASS":
                        local_errors.append(f"product-test receipt is not PASS: {evidence_id}")
                    if receipt.get("candidate_manifest_sha256") != evidence.get("candidate_manifest_sha256"):
                        local_errors.append(f"product-test receipt candidate mismatch: {evidence_id}")
                    if receipt_tests.get(test_id) != evidence.get("result"):
                        local_errors.append(f"product-test receipt result mismatch: {evidence_id}")
                    test_path_value = receipt.get("test_file_path")
                    test_path = Path(str(test_path_value))
                    if test_path.is_absolute() or ".." in test_path.parts:
                        local_errors.append(f"product-test receipt has unsafe test path: {evidence_id}")
                    elif sha256_bytes((repository_root / test_path).read_bytes()) != receipt.get("test_file_sha256"):
                        local_errors.append(f"product-test program drift: {evidence_id}")
                except (OSError, ValueError, json.JSONDecodeError) as exc:
                    local_errors.append(f"product-test receipt content is not evaluable: {evidence_id}: {exc}")

        missing_tests = sorted(required_tests - set(evidence_by_test))
        failed_tests = sorted(test_id for test_id in required_tests if evidence_by_test.get(test_id, {}).get("result") != "PASS")
        if missing_tests:
            blockers.append("PRODUCT_TEST_EVIDENCE_MISSING:" + ",".join(missing_tests))
        if failed_tests:
            blockers.append("REQUIRED_PRODUCT_TEST_NOT_PASS:" + ",".join(failed_tests))

        approval_eligible = isinstance(candidate, dict) and bool(required_tests) and not missing_tests and not failed_tests and not local_errors
        approval = construction.get("product_approval")
        approval_valid = False
        if isinstance(approval, dict):
            if not approval_eligible:
                local_errors.append("product approval exists before the exact candidate is test-eligible")
            elif approval.get("candidate_manifest_sha256") != candidate.get("manifest_sha256"):
                local_errors.append("product approval is not bound to the exact frozen candidate")
            elif set(approval.get("test_evidence_ids", [])) != {evidence_by_test[test_id].get("evidence_id") for test_id in required_tests}:
                local_errors.append("product approval does not bind the exact required PASS evidence")
            else:
                approval_valid = True

        authority_requests = construction.get("authority_requests", [])
        if authority_requests and not approval_valid:
            local_errors.append("authority request exists before exact tested-product approval")
        if approval_valid:
            approval_id = approval.get("approval_id")
            for request in authority_requests:
                if request.get("product_approval_id") != approval_id:
                    local_errors.append(f"authority request is not bound to product approval: {request.get('request_id')}")

        state = construction.get("state")
        if state == "prototype" and isinstance(candidate, dict):
            local_errors.append("prototype state cannot carry a frozen candidate")
        if state in {"tested", "product_approved"} and not approval_eligible:
            local_errors.append(f"{state} state requires current passing product-test evidence")
        if state == "product_approved" and not approval_valid:
            local_errors.append("product_approved state requires an exact product approval record")

        eligibility[construction_id] = {
            "product_approval_request": "eligible" if approval_eligible else "not_eligible",
            "authority_request": "eligible" if approval_valid else "not_eligible",
            "blockers": sorted(set(blockers)),
        }
        errors.extend(f"{construction_id}: {item}" for item in local_errors)

    return {
        "schema_version": "cav2-d65-prototype-construction-evaluation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "invariant_ref": "CAV2-D65",
        "definition_revision": 2,
        "authority_effect": "none",
        "counts": {"constructions": len(rows), "ontology_scaffolds": len(scaffold_rows)},
        "eligibility": eligibility,
        "errors": errors,
        "warnings": warnings,
        "claim_ceiling": "Prototype consistency and request eligibility only. PASS does not approve a product or grant authority, admission, activation, cutover, publication, release, deployment, or external effect.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze", metavar="CONSTRUCTION_ID", help="print a deterministic candidate freeze without mutating the registry")
    args = parser.parse_args()
    try:
        constructions = load_json(CONSTRUCTIONS_PATH)
        scaffolds = load_json(SCAFFOLDS_PATH)
        if args.freeze:
            matches = [item for item in constructions.get("constructions", []) if item.get("construction_id") == args.freeze]
            if len(matches) != 1:
                raise ValueError(f"construction must resolve exactly once: {args.freeze}")
            result = {"status": "PASS", "authority_effect": "none", "candidate": freeze_candidate(matches[0])}
            code = 0
        else:
            result = evaluate_registry(constructions, scaffolds)
            code = 0 if result["status"] == "PASS" else 1
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        result = {"status": "BLOCK", "authority_effect": "none", "errors": [str(exc)]}
        code = 1
    print(json.dumps(result, indent=2, sort_keys=True))
    return code


if __name__ == "__main__":
    sys.exit(main())
