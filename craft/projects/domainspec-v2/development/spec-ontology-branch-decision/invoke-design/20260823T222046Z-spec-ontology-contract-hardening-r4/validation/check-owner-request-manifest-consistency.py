#!/usr/bin/env python3
"""Fail-closed exact manifest-to-owner-request projection validator."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import stat
from pathlib import Path, PurePosixPath
from typing import Any


PASS = 0
BLOCK = 1
ERROR = 2
MANIFEST_REF = "owner-admission/PACKAGE-MANIFEST.json"
ROLE_REF = "design/ROLE-ASSIGNMENTS.candidate.json"
RESPONSE_SCHEMA_REF = "schemas/owner-response.schema.json"
DEFAULT_REQUEST_REF = "owner-admission/requests-r2/RONDELLI-OWNER-REQUESTS.json"

ROLE_LABEL_TO_IDS = {
    "domainspec-v2-authority-model-and-primary-source-owner": ["RA-01", "RA-02"],
    "business-source-owner": ["RA-03"],
    "formal-claims-owner": ["RA-04"],
    "specification-composition-owner": ["RA-05"],
    "validation-governance-and-lifecycle-owner": ["RA-06", "RA-10"],
    "proof-and-evidence-owner": ["RA-07"],
    "ontology-protocol-and-relationship-authority-owner": ["RA-08", "RA-09"],
    "domainspec-v2-authority-model-owner": ["RA-01"],
    "projection-privacy-publication-owner": ["RA-11", "RA-12", "RA-13"],
    "negative-corpus-and-aggregate-command-owner": ["RA-14", "RA-15"],
    "promotion-lifecycle-owner": ["RA-16"],
}


class Failure(Exception):
    def __init__(self, code: str, path: str, message: str, exit_status: int) -> None:
        super().__init__(message)
        self.code = code
        self.path = path
        self.message = message
        self.exit_status = exit_status


def emit(status: str, **fields: Any) -> None:
    print(json.dumps({"status": status, **fields}, sort_keys=True, separators=(",", ":")))


def stop(code: str, path: str, message: str, exit_status: int = BLOCK) -> None:
    raise Failure(code, path, message, exit_status)


def validate_root(raw_root: str) -> Path:
    root = Path(os.path.abspath(raw_root))
    if root.is_symlink():
        stop("SYMLINK_ROOT", raw_root, "package root must not be a symlink", ERROR)
    if not root.is_dir():
        stop("INVALID_ROOT", raw_root, "package root must be an existing directory", ERROR)
    return root


def safe_regular_file(root: Path, raw_rel: str) -> Path:
    rel = PurePosixPath(raw_rel)
    if (
        not raw_rel
        or rel.is_absolute()
        or any(part in ("", ".", "..") for part in rel.parts)
        or "\\" in raw_rel
    ):
        stop("OUT_OF_ROOT_PATH", raw_rel, "path must be a normalized relative POSIX path", ERROR)
    candidate = root.joinpath(*rel.parts)
    try:
        if os.path.commonpath((str(root), str(candidate))) != str(root):
            stop("OUT_OF_ROOT_PATH", raw_rel, "path escapes package root", ERROR)
    except ValueError:
        stop("OUT_OF_ROOT_PATH", raw_rel, "path is not comparable to package root", ERROR)
    current = root
    for part in rel.parts:
        current = current / part
        try:
            mode = current.lstat().st_mode
        except FileNotFoundError:
            stop("MISSING_FILE", raw_rel, "required file does not exist", ERROR)
        if stat.S_ISLNK(mode):
            stop("SYMLINK_PATH", raw_rel, "symlinks are forbidden", ERROR)
    if not candidate.is_file():
        stop("NOT_REGULAR_FILE", raw_rel, "path is not a regular file", ERROR)
    return candidate


def load_json(root: Path, rel: str) -> dict[str, Any]:
    path = safe_regular_file(root, rel)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        stop("INVALID_JSON", rel, f"cannot parse JSON: {exc}", ERROR)
    if not isinstance(value, dict):
        stop("INVALID_JSON_ROOT", rel, "JSON root must be an object", ERROR)
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def acceptance_hash(manifest: dict[str, Any], rel: str) -> str:
    matches = [
        item.get("sha256")
        for item in manifest.get("acceptance_bound_artifacts", [])
        if isinstance(item, dict) and item.get("path") == rel
    ]
    if len(matches) != 1 or not isinstance(matches[0], str):
        stop("MISSING_ACCEPTANCE_BINDING", MANIFEST_REF, f"manifest needs exactly one hash for {rel}", ERROR)
    return matches[0]


def require_equal(code: str, path: str, actual: Any, expected: Any) -> None:
    if actual != expected:
        stop(code, path, f"observed {actual!r}; expected {expected!r}")


def apply_fixture(root: Path, request_ref: str, request: dict[str, Any], fixture_ref: str) -> tuple[dict[str, Any], str]:
    fixture = load_json(root, fixture_ref)
    if fixture.get("test_only") is not True or fixture.get("protected_product_hv_fixture") is not False:
        stop("INVALID_TEST_FIXTURE", fixture_ref, "fixture must be explicitly test-only and non-HV", ERROR)
    if fixture.get("request_ref") != request_ref:
        stop("INVALID_TEST_FIXTURE", fixture_ref, "fixture request_ref must equal the selected request path", ERROR)
    overrides = fixture.get("virtual_request_overrides")
    if not isinstance(overrides, list) or not overrides:
        stop("INVALID_TEST_FIXTURE", fixture_ref, "fixture needs at least one virtual override", ERROR)
    mutated = copy.deepcopy(request)
    requests = mutated.get("requests")
    if not isinstance(requests, list):
        stop("INVALID_REQUESTS", request_ref, "requests must be an array", ERROR)
    by_id = {item.get("request_id"): item for item in requests if isinstance(item, dict)}
    for item in overrides:
        if not isinstance(item, dict):
            stop("INVALID_TEST_FIXTURE", fixture_ref, "override must be an object", ERROR)
        request_id = item.get("request_id")
        field = item.get("field")
        if request_id not in by_id or field != "decision_scope" or not isinstance(item.get("value"), str):
            stop("INVALID_TEST_FIXTURE", fixture_ref, "only an existing request decision_scope string may be overridden", ERROR)
        by_id[request_id][field] = item["value"]
    fixture_id = fixture.get("fixture_id")
    if not isinstance(fixture_id, str) or not fixture_id:
        stop("INVALID_TEST_FIXTURE", fixture_ref, "fixture_id is required", ERROR)
    return mutated, fixture_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-root", required=True)
    parser.add_argument("--request", default=DEFAULT_REQUEST_REF)
    parser.add_argument("--fixture")
    args = parser.parse_args()

    root = validate_root(args.package_root)
    manifest = load_json(root, MANIFEST_REF)
    roles = load_json(root, ROLE_REF)
    request = load_json(root, args.request)
    fixture_id = None
    if args.fixture:
        request, fixture_id = apply_fixture(root, args.request, request, args.fixture)

    slices = manifest.get("owner_request_slices")
    requests = request.get("requests")
    if not isinstance(slices, list) or len(slices) != 11:
        stop("INVALID_MANIFEST_SLICE_COUNT", MANIFEST_REF, "manifest must contain exactly eleven owner slices", ERROR)
    if not isinstance(requests, list) or len(requests) != 11:
        stop("MISSING_OR_EXTRA_REQUEST", args.request, "request projection must contain exactly eleven requests")

    manifest_ids = [x.get("request_id") for x in slices if isinstance(x, dict)]
    request_ids = [x.get("request_id") for x in requests if isinstance(x, dict)]
    if len(manifest_ids) != len(set(manifest_ids)):
        stop("DUPLICATE_MANIFEST_REQUEST_ID", MANIFEST_REF, "manifest request IDs must be unique", ERROR)
    if len(request_ids) != len(set(request_ids)):
        stop("DUPLICATE_REQUEST_ID", args.request, "request IDs must be unique")
    require_equal("REQUEST_ID_ORDER_MISMATCH", f"{args.request}#/requests", request_ids, manifest_ids)

    require_equal("REQUEST_STATUS_MISMATCH", f"{args.request}#/status", request.get("status"), "prepared-pending-not-sent-no-responses")
    require_equal("AUTHORITY_EFFECT_MISMATCH", f"{args.request}#/authority_effect", request.get("authority_effect"), "none")
    principal = request.get("principal")
    if not isinstance(principal, dict):
        stop("INVALID_PRINCIPAL", f"{args.request}#/principal", "principal must be an object", ERROR)
    require_equal("PRINCIPAL_MISMATCH", f"{args.request}#/principal/principal_id", principal.get("principal_id"), "rondelli")
    require_equal("PRINCIPAL_STATUS_MISMATCH", f"{args.request}#/principal/protected_role_admission_status", principal.get("protected_role_admission_status"), "pending")

    binding = request.get("package_binding")
    if not isinstance(binding, dict):
        stop("INVALID_PACKAGE_BINDING", f"{args.request}#/package_binding", "package_binding must be an object", ERROR)
    expected_binding = {
        "package_id": manifest.get("package_id"),
        "package_manifest_ref": MANIFEST_REF,
        "package_manifest_sha256": sha256(safe_regular_file(root, MANIFEST_REF)),
        "artifact_digest_method": manifest.get("artifact_digest_method"),
        "package_content_digest_method": manifest.get("package_content_digest_method"),
        "manifest_digest_method": manifest.get("manifest_digest_method"),
        "package_manifest_digest": manifest.get("manifest_digest"),
        "package_content_digest": manifest.get("package_content_digest"),
        "role_assignments_ref": ROLE_REF,
        "role_assignments_sha256": acceptance_hash(manifest, ROLE_REF),
        "verification_levels_ref": "design/VERIFICATION-LEVELS.candidate.json",
        "verification_levels_sha256": acceptance_hash(manifest, "design/VERIFICATION-LEVELS.candidate.json"),
        "response_schema_ref": RESPONSE_SCHEMA_REF,
        "response_schema_sha256": acceptance_hash(manifest, RESPONSE_SCHEMA_REF),
    }
    for key, expected in expected_binding.items():
        require_equal("PACKAGE_BINDING_MISMATCH", f"{args.request}#/package_binding/{key}", binding.get(key), expected)
    require_equal("ROLE_FILE_HASH_MISMATCH", ROLE_REF, sha256(safe_regular_file(root, ROLE_REF)), expected_binding["role_assignments_sha256"])
    require_equal("RESPONSE_SCHEMA_HASH_MISMATCH", RESPONSE_SCHEMA_REF, sha256(safe_regular_file(root, RESPONSE_SCHEMA_REF)), expected_binding["response_schema_sha256"])

    role_items = roles.get("role_assignments")
    verifier_assignment = roles.get("verifier_assignment")
    if not isinstance(role_items, list) or not isinstance(verifier_assignment, dict):
        stop("INVALID_ROLE_ASSIGNMENTS", ROLE_REF, "role assignments and verifier assignment are required", ERROR)
    role_by_id = {
        item.get("assignment_id"): item
        for item in role_items
        if isinstance(item, dict) and isinstance(item.get("assignment_id"), str)
    }
    if len(role_by_id) != len(role_items):
        stop("DUPLICATE_ROLE_ASSIGNMENT_ID", ROLE_REF, "primary role assignment IDs must be unique", ERROR)

    for index, (slice_item, request_item) in enumerate(zip(slices, requests)):
        if not isinstance(slice_item, dict) or not isinstance(request_item, dict):
            stop("INVALID_REQUEST_ENTRY", f"{args.request}#/requests/{index}", "request and manifest slice must be objects", ERROR)
        base = f"{args.request}#/requests/{index}"
        request_id = slice_item["request_id"]
        require_equal("REQUEST_ID_MISMATCH", f"{base}/request_id", request_item.get("request_id"), request_id)
        require_equal("MANIFEST_POINTER_MISMATCH", f"{base}/manifest_slice_pointer", request_item.get("manifest_slice_pointer"), f"/owner_request_slices/{index}")
        require_equal("REQUESTED_DECISION_MISMATCH", f"{base}/requested_decision", request_item.get("requested_decision"), "accept-contract-or-reject-contract-or-defer")
        require_equal("VERIFICATION_LEVEL_MISMATCH", f"{base}/required_verification_level", request_item.get("required_verification_level"), slice_item.get("required_verification_level"))
        require_equal("VERIFICATION_ROUTE_MISMATCH", f"{base}/verification_route", request_item.get("verification_route"), slice_item.get("verification_route"))
        require_equal("DECISION_SCOPE_MISMATCH", f"{base}/decision_scope", request_item.get("decision_scope"), slice_item.get("requested_scope"))
        require_equal("EXPLICIT_NON_SCOPE_MISMATCH", f"{base}/explicit_non_scope", request_item.get("explicit_non_scope"), slice_item.get("explicit_non_scope"))
        require_equal("RESPONSE_STATUS_MISMATCH", f"{base}/response_status", request_item.get("response_status"), "pending")
        require_equal("MANIFEST_PENDING_STATUS_MISMATCH", f"{MANIFEST_REF}#/owner_request_slices/{index}/status", slice_item.get("status"), "pending-exact-rondelli-response-and-required-verification")
        require_equal("OWNER_PRINCIPAL_MISMATCH", f"{MANIFEST_REF}#/owner_request_slices/{index}/owner_principal", slice_item.get("owner_principal"), "rondelli")

        expected_owner_ids = ROLE_LABEL_TO_IDS.get(slice_item.get("owner_role"))
        if expected_owner_ids is None:
            stop("UNKNOWN_OWNER_ROLE", f"{MANIFEST_REF}#/owner_request_slices/{index}/owner_role", "owner role has no exact role-assignment mapping", ERROR)
        require_equal("OWNER_ROLE_ASSIGNMENT_MISMATCH", f"{base}/owner_role_assignment_ids", request_item.get("owner_role_assignment_ids"), expected_owner_ids)
        for assignment_id in expected_owner_ids:
            if assignment_id not in role_by_id:
                stop("MISSING_ROLE_ASSIGNMENT", ROLE_REF, f"{assignment_id} is not present", ERROR)

        pointers = slice_item.get("json_pointers")
        if not isinstance(pointers, list) or not pointers:
            stop("INVALID_MANIFEST_POINTERS", f"{MANIFEST_REF}#/owner_request_slices/{index}/json_pointers", "non-empty pointers required", ERROR)
        pointed_primary_ids: list[str] = []
        verifier_subject = False
        for pointer in pointers:
            if pointer == "/verifier_assignment":
                verifier_subject = True
                require_equal("VERIFIER_SUBJECT_ASSIGNMENT_MISMATCH", f"{ROLE_REF}#/verifier_assignment/assignment_id", verifier_assignment.get("assignment_id"), "VA-01")
            elif isinstance(pointer, str) and pointer.startswith("/role_assignments/"):
                raw_index = pointer.removeprefix("/role_assignments/")
                if not raw_index.isdigit() or int(raw_index) >= len(role_items):
                    stop("INVALID_MANIFEST_POINTER", f"{MANIFEST_REF}#/owner_request_slices/{index}/json_pointers", f"unresolved pointer {pointer!r}", ERROR)
                pointed = role_items[int(raw_index)]
                if not isinstance(pointed, dict) or not isinstance(pointed.get("assignment_id"), str):
                    stop("INVALID_ROLE_ASSIGNMENT", f"{ROLE_REF}#{pointer}", "pointed assignment is invalid", ERROR)
                pointed_primary_ids.append(pointed["assignment_id"])
            else:
                stop("INVALID_MANIFEST_POINTER", f"{MANIFEST_REF}#/owner_request_slices/{index}/json_pointers", f"unsupported pointer {pointer!r}", ERROR)
        if verifier_subject:
            require_equal("VERIFIER_SUBJECT_OWNER_ROLE_MISMATCH", f"{MANIFEST_REF}#/owner_request_slices/{index}/owner_role", slice_item.get("owner_role"), "domainspec-v2-authority-model-owner")
            require_equal("VERIFIER_SUBJECT_POINTER_MIX", f"{MANIFEST_REF}#/owner_request_slices/{index}/json_pointers", len(pointers), 1)
        else:
            require_equal("ROLE_POINTER_ASSIGNMENT_MISMATCH", f"{base}/owner_role_assignment_ids", pointed_primary_ids, expected_owner_ids)

    emit(
        "pass",
        package_id=manifest.get("package_id"),
        request_ref=args.request,
        request_count=len(requests),
        exact_scope_matches=len(requests),
        exact_role_pointer_matches=len(requests),
        fixture_id=fixture_id,
        responses_materialized=0,
        authority_effect="none",
    )
    return PASS


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Failure as failure:
        emit(
            "block" if failure.exit_status == BLOCK else "error",
            code=failure.code,
            path=failure.path,
            message=failure.message,
            exit_status=failure.exit_status,
            authority_effect="none",
        )
        raise SystemExit(failure.exit_status)
