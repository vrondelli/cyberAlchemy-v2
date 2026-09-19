#!/usr/bin/env python3
"""Fail-closed package identity consistency check for one staged Design package."""

from __future__ import annotations

import argparse
import json
import os
import stat
import sys
from pathlib import Path, PurePosixPath
from typing import Any


PASS = 0
BLOCK = 1
ERROR = 2


class CheckFailure(Exception):
    def __init__(self, code: str, path: str, message: str, exit_status: int) -> None:
        super().__init__(message)
        self.code = code
        self.path = path
        self.message = message
        self.exit_status = exit_status


def emit(status: str, **fields: Any) -> None:
    print(json.dumps({"status": status, **fields}, sort_keys=True, separators=(",", ":")))


def stop(code: str, path: str, message: str, exit_status: int = BLOCK) -> None:
    raise CheckFailure(code, path, message, exit_status)


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


def bound_ids(value: dict[str, Any]) -> list[tuple[str, Any]]:
    found: list[tuple[str, Any]] = []
    if "package_id" in value:
        found.append(("/package_id", value["package_id"]))
    binding = value.get("package_binding")
    if isinstance(binding, dict) and "package_id" in binding:
        found.append(("/package_binding/package_id", binding["package_id"]))
    return found


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-root", required=True)
    parser.add_argument(
        "--fixture",
        help="run-local test-only virtual package_id override fixture",
    )
    parser.add_argument(
        "--binding",
        action="append",
        default=[],
        help="run-local future owner response or verification receipt to check",
    )
    args = parser.parse_args()

    root = validate_root(args.package_root)
    manifest_rel = "owner-admission/PACKAGE-MANIFEST.json"
    manifest = load_json(root, manifest_rel)
    manifest_id = manifest.get("package_id")
    if not isinstance(manifest_id, str) or not manifest_id:
        stop("MISSING_MANIFEST_PACKAGE_ID", manifest_rel, "manifest package_id is required", ERROR)

    artifacts = manifest.get("acceptance_bound_artifacts")
    if not isinstance(artifacts, list):
        stop("INVALID_ARTIFACT_INVENTORY", manifest_rel, "acceptance_bound_artifacts must be an array", ERROR)

    overrides: dict[str, str] = {}
    fixture_id: str | None = None
    if args.fixture:
        fixture = load_json(root, args.fixture)
        fixture_id = fixture.get("fixture_id")
        if fixture.get("test_only") is not True or fixture.get("protected_product_hv_fixture") is not False:
            stop("INVALID_TEST_FIXTURE", args.fixture, "fixture must be explicitly test-only and non-HV", ERROR)
        declared_manifest_id = fixture.get("manifest_package_id")
        if declared_manifest_id != manifest_id:
            stop(
                "FIXTURE_MANIFEST_ID_MISMATCH",
                args.fixture,
                f"fixture declares {declared_manifest_id!r}; manifest declares {manifest_id!r}",
                ERROR,
            )
        raw_overrides = fixture.get("virtual_top_level_package_id_overrides")
        if not isinstance(raw_overrides, list) or not raw_overrides:
            stop("INVALID_TEST_FIXTURE", args.fixture, "fixture needs at least one virtual override", ERROR)
        for item in raw_overrides:
            if not isinstance(item, dict):
                stop("INVALID_TEST_FIXTURE", args.fixture, "override must be an object", ERROR)
            rel = item.get("path")
            package_id = item.get("package_id")
            if not isinstance(rel, str) or not isinstance(package_id, str):
                stop("INVALID_TEST_FIXTURE", args.fixture, "override path and package_id must be strings", ERROR)
            if rel in overrides:
                stop("INVALID_TEST_FIXTURE", args.fixture, f"duplicate override for {rel}", ERROR)
            overrides[rel] = package_id

    artifact_paths: set[str] = set()
    checked_artifact_ids = 0
    for item in artifacts:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            stop("INVALID_ARTIFACT_INVENTORY", manifest_rel, "artifact entry needs a string path", ERROR)
        rel = item["path"]
        if rel in artifact_paths:
            stop("DUPLICATE_ARTIFACT_PATH", rel, "artifact path is duplicated", ERROR)
        artifact_paths.add(rel)
        instance = load_json(root, rel) if rel.endswith(".json") else None
        if rel in overrides:
            instance = dict(instance or {})
            instance["package_id"] = overrides[rel]
        if instance is not None and "package_id" in instance:
            checked_artifact_ids += 1
            if instance["package_id"] != manifest_id:
                stop(
                    "PACKAGE_ID_MISMATCH",
                    rel,
                    f"top-level package_id {instance['package_id']!r} does not equal manifest {manifest_id!r}",
                )

    unknown_overrides = sorted(set(overrides) - artifact_paths)
    if unknown_overrides:
        stop(
            "INVALID_TEST_FIXTURE",
            args.fixture or "<fixture>",
            f"override paths are not acceptance-bound: {unknown_overrides}",
            ERROR,
        )

    request_paths = [
        "owner-admission/RONDELLI-OWNER-REQUESTS.json",
        "owner-admission/VICTOR-VERIFIER-REQUEST.json",
    ]
    checked_request_ids = 0
    for rel in request_paths:
        request = load_json(root, rel)
        ids = bound_ids(request)
        if not ids:
            stop("MISSING_REQUEST_PACKAGE_ID", rel, "pending request has no package binding", ERROR)
        for pointer, package_id in ids:
            checked_request_ids += 1
            if package_id != manifest_id:
                stop(
                    "PACKAGE_ID_MISMATCH",
                    f"{rel}#{pointer}",
                    f"request package_id {package_id!r} does not equal manifest {manifest_id!r}",
                )

    checked_supplied_ids = 0
    for rel in args.binding:
        supplied = load_json(root, rel)
        for pointer, package_id in bound_ids(supplied):
            checked_supplied_ids += 1
            if package_id != manifest_id:
                stop(
                    "PACKAGE_ID_MISMATCH",
                    f"{rel}#{pointer}",
                    f"supplied binding package_id {package_id!r} does not equal manifest {manifest_id!r}",
                )

    emit(
        "pass",
        manifest_package_id=manifest_id,
        checked_acceptance_bound_artifacts=len(artifact_paths),
        checked_acceptance_top_level_package_ids=checked_artifact_ids,
        checked_pending_request_package_ids=checked_request_ids,
        checked_supplied_binding_package_ids=checked_supplied_ids,
        fixture_id=fixture_id,
        authority_effect="none",
    )
    return PASS


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CheckFailure as failure:
        emit(
            "block" if failure.exit_status == BLOCK else "error",
            code=failure.code,
            path=failure.path,
            message=failure.message,
            exit_status=failure.exit_status,
            authority_effect="none",
        )
        raise SystemExit(failure.exit_status)
