#!/usr/bin/env python3
"""Validate the complete staged or applied WP-FMP-002 candidate @2 byte set."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path, PurePosixPath
from typing import Any

from jsonschema import Draft202012Validator


OLD_TREE_DIGEST = "b3358793ee053b271cfd0211686b34a0203815deb883a4cd22d672784b6fa814"
OLD_FILE_COUNT = 39
OLD_ROOT = "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/20260824T030126Z-fmp-six-unit-candidate"
TARGET_PREFIX = "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/20260824T042948Z-fmp-six-unit-candidate-r2/"


def identity(path: Path) -> tuple[str, int]:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def tree_identity(root: Path) -> tuple[str, int]:
    rows = []
    files = sorted(path for path in root.rglob("*") if path.is_file())
    for path in files:
        sha256, size = identity(path)
        rows.append(
            f"{path.relative_to(root).as_posix()}\0{sha256}\0{size}\n".encode()
        )
    return hashlib.sha256(b"".join(rows)).hexdigest(), len(files)


def discover_candidate_entries(root: Path) -> tuple[set[str], set[str]]:
    """Return regular-file and symlink paths without following symlink directories."""
    files: set[str] = set()
    symlinks: set[str] = set()
    if root.is_symlink():
        symlinks.add(".")
        return files, symlinks
    if not root.is_dir():
        return files, symlinks
    for path in root.rglob("*"):
        relative = path.relative_to(root).as_posix()
        if path.is_symlink():
            symlinks.add(relative)
        elif path.is_file():
            files.add(relative)
    return files, symlinks


def target_relative_path(raw_target: str, raw_root: str) -> str:
    target = PurePosixPath(raw_target)
    root = PurePosixPath(raw_root.rstrip("/"))
    if target.is_absolute() or ".." in target.parts:
        raise ValueError(f"unsafe material target: {raw_target}")
    try:
        relative = target.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"material target is outside candidate root: {raw_target}") from exc
    if str(relative) in {"", "."}:
        raise ValueError(f"material target is not a file path: {raw_target}")
    return relative.as_posix()


def is_staged_python_cache(relative: str) -> bool:
    path = PurePosixPath(relative)
    return path.suffix == ".pyc" and "__pycache__" in path.parts


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", default=".")
    parser.add_argument("--staged-candidate-root", required=True)
    parser.add_argument("--target-candidate-root", required=True)
    parser.add_argument("--target-inventory", required=True)
    parser.add_argument("--material-package", required=True)
    parser.add_argument("--phase", choices=["staged", "applied"], required=True)
    args = parser.parse_args()

    repository_root = Path(args.repository_root).resolve()
    staged_input = repository_root / args.staged_candidate_root
    target_input = repository_root / args.target_candidate_root
    staged = staged_input.resolve()
    target = target_input.resolve()
    candidate = staged if args.phase == "staged" else target
    candidate_input = staged_input if args.phase == "staged" else target_input
    errors: list[str] = []

    old = repository_root / OLD_ROOT
    old_digest, old_count = tree_identity(old)
    if (old_digest, old_count) != (OLD_TREE_DIGEST, OLD_FILE_COUNT):
        errors.append("candidate @1 tree identity drifted")
    if args.phase == "staged" and target.exists():
        errors.append("create-only candidate @2 target already exists")
    if args.phase == "applied":
        if not target.is_dir():
            errors.append("applied candidate @2 target is absent")
        if target_input.is_symlink():
            errors.append("applied candidate @2 root is a symlink")

    target_inventory = load_json(repository_root / args.target_inventory)
    package = load_json(repository_root / args.material_package)
    inventory_targets = {item["target_path"] for item in target_inventory["targets"]}
    package_targets = {item["target_path"] for item in package["target_inventory"]}
    approval_targets = set(package["approval"]["scope_paths"])
    change_targets = {item["target_path"] for item in package["changes"]}
    expected_targets = inventory_targets | package_targets | approval_targets | change_targets
    if not inventory_targets == package_targets == approval_targets == change_targets:
        errors.append("target, material, approval, and change inventories differ")

    declared_relative: set[str] = set()
    for raw_target in sorted(expected_targets):
        try:
            declared_relative.add(
                target_relative_path(raw_target, args.target_candidate_root)
            )
        except ValueError as exc:
            errors.append(str(exc))
    if len(declared_relative) != 44:
        errors.append(
            f"declared candidate target count is {len(declared_relative)}, expected 44"
        )

    discovered_files, discovered_symlinks = discover_candidate_entries(candidate)
    for relative in sorted(discovered_symlinks):
        errors.append(f"candidate contains symlink: {relative}")
    undeclared_files = discovered_files - declared_relative
    ignored_staged_cache = (
        {path for path in undeclared_files if is_staged_python_cache(path)}
        if args.phase == "staged"
        else set()
    )
    for relative in sorted(undeclared_files - ignored_staged_cache):
        errors.append(f"undeclared candidate file: {relative}")
    missing_declared = declared_relative - discovered_files
    for relative in sorted(missing_declared):
        errors.append(f"declared candidate target is missing: {relative}")

    files = [candidate / relative for relative in sorted(declared_relative)]
    for path in files:
        rel = path.relative_to(candidate).as_posix()
        if not path.is_file() or path.is_symlink():
            continue
        data = path.read_bytes()
        if not data.endswith(b"\n"):
            errors.append(f"candidate file lacks final newline: {rel}")
        for line_number, line in enumerate(data.splitlines(), 1):
            if line.rstrip(b" \t") != line:
                errors.append(f"trailing whitespace: {rel}:{line_number}")
        if path.suffix == ".json":
            try:
                json.loads(data)
            except json.JSONDecodeError as exc:
                errors.append(f"invalid JSON {rel}: {exc}")
        if OLD_ROOT.encode() in data and rel != "VALIDATION-HARNESS-GOVERNANCE-DEFECT-RECEIPT.json":
            errors.append(f"unowned candidate @1 path residue: {rel}")

    if (
        not candidate_input.is_dir()
        or candidate_input.is_symlink()
        or missing_declared
        or discovered_symlinks
    ):
        result = {
            "schema_version": "fmp.staged-candidate-validation.v1",
            "phase": args.phase,
            "status": "block",
            "candidate_v1_tree_digest": old_digest,
            "candidate_v1_file_count": old_count,
            "candidate_v2_file_count": len(discovered_files),
            "candidate_v2_symlink_count": len(discovered_symlinks),
            "declared_target_count": len(declared_relative),
            "ignored_staged_cache_count": len(ignored_staged_cache),
            "candidate_manifest_sha256": None,
            "candidate_content_digest": None,
            "target_count": len(expected_targets),
            "errors": errors,
            "authority_effect": "none",
        }
        print(json.dumps(result, indent=2, sort_keys=True))
        return 2

    manifest = load_json(candidate / "CANDIDATE-MANIFEST.json")
    artifacts = manifest["artifacts"]
    for artifact in artifacts:
        artifact_path = candidate / artifact["path"]
        if not artifact_path.is_file() or identity(artifact_path)[0] != artifact["sha256"]:
            errors.append(f"candidate manifest mismatch: {artifact['path']}")
    content_digest = hashlib.sha256(
        json.dumps(artifacts, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    if content_digest != manifest["content_digest"]:
        errors.append("candidate content digest mismatch")
    manifest_sha256, _ = identity(candidate / "CANDIDATE-MANIFEST.json")
    for request_name in [
        "OWNER-PREREQUISITE-REQUEST.json",
        "PLAN-ACCEPTANCE-REQUEST.json",
    ]:
        binding = load_json(candidate / request_name)["candidate_manifest"]
        if (
            binding["sha256"] != manifest_sha256
            or binding["content_digest"] != content_digest
            or binding["artifact_count"] != len(artifacts)
        ):
            errors.append(f"candidate request binding mismatch: {request_name}")

    bindings = load_json(candidate / "RECEIPT-BINDINGS.json")
    for key in [
        "terminal_schema_ref",
        "precloseout_schema_ref",
        "validation_receipt_schema_ref",
        "owner_receipt_schema_ref",
        "semantic_validator_ref",
    ]:
        ref = bindings[key]
        bound = repository_root / ref["path"]
        if ref["path"].startswith(TARGET_PREFIX):
            bound = candidate / ref["path"][len(TARGET_PREFIX) :]
        if not bound.is_file() or identity(bound) != (ref["sha256"], ref["size_bytes"]):
            errors.append(f"receipt binding mismatch: {key}")
    for key in [
        "terminal_schema_ref",
        "precloseout_schema_ref",
        "validation_receipt_schema_ref",
        "owner_receipt_schema_ref",
    ]:
        ref = bindings[key]
        bound = repository_root / ref["path"]
        if ref["path"].startswith(TARGET_PREFIX):
            bound = candidate / ref["path"][len(TARGET_PREFIX) :]
        try:
            Draft202012Validator.check_schema(load_json(bound))
        except Exception as exc:
            errors.append(f"invalid receipt schema {key}: {exc}")

    entry = load_json(candidate / "EXECUTION-ENTRY.json")
    routes = entry["execution_policy"]["allowed_routes"]
    route_digest = hashlib.sha256(
        json.dumps(routes, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    if route_digest != entry["execution_policy"]["allowed_routes_digest"]:
        errors.append("execution-entry route digest mismatch")

    for change in package["changes"]:
        ref = change["output_ref"]
        output = repository_root / ref["path"]
        if (
            not output.is_file()
            or output.is_symlink()
            or identity(output) != (ref["sha256"], ref["size_bytes"])
        ):
            errors.append(f"material output mismatch: {change['target_path']}")
            continue
        if args.phase == "applied":
            try:
                relative = target_relative_path(
                    change["target_path"], args.target_candidate_root
                )
            except ValueError:
                continue
            applied_target = candidate / relative
            if (
                not applied_target.is_file()
                or applied_target.is_symlink()
                or identity(applied_target) != (ref["sha256"], ref["size_bytes"])
                or applied_target.read_bytes() != output.read_bytes()
            ):
                errors.append(
                    "applied target bytes differ from declared output: "
                    f"{change['target_path']}"
                )

    result = {
        "schema_version": "fmp.staged-candidate-validation.v1",
        "phase": args.phase,
        "status": "pass" if not errors else "block",
        "candidate_v1_tree_digest": old_digest,
        "candidate_v1_file_count": old_count,
        "candidate_v2_file_count": len(discovered_files),
        "candidate_v2_symlink_count": len(discovered_symlinks),
        "declared_target_count": len(declared_relative),
        "ignored_staged_cache_count": len(ignored_staged_cache),
        "candidate_manifest_sha256": manifest_sha256,
        "candidate_content_digest": content_digest,
        "target_count": len(expected_targets),
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 2


if __name__ == "__main__":
    raise SystemExit(main())
