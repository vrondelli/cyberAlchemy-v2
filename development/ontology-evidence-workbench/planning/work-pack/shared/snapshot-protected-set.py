#!/usr/bin/env python3
"""Compile and compare deterministic OEW source-only protected-set snapshots."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import sys
import tempfile
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


CONTRACT_SCHEMA = "oew.protected-set-contract.v1"
SNAPSHOT_SCHEMA = "oew.protected-set-snapshot.v2"
COMPARE_SCHEMA = "oew.protected-set-comparison.v1"


class ContractError(RuntimeError):
    """Raised when a contract or protected path is unsafe or invalid."""


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError(f"cannot read JSON {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError(f"expected JSON object: {path}")
    return value


def validate_relative_path(value: str, label: str) -> PurePosixPath:
    if not isinstance(value, str) or not value:
        raise ContractError(f"{label} must be a non-empty string")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise ContractError(f"{label} must be repository-relative without dot segments: {value}")
    return path


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        delete=False,
    ) as stream:
        stream.write(payload)
        temporary = Path(stream.name)
    os.replace(temporary, path)


def is_excluded(
    repository_relative: PurePosixPath,
    scope_relative: PurePosixPath,
    contract: dict[str, Any],
    scope: dict[str, Any],
) -> bool:
    segments = set(contract["global_excluded_segments"])
    if any(part in segments for part in repository_relative.parts):
        return True
    if repository_relative.name in set(contract["global_excluded_file_names"]):
        return True
    if any(repository_relative.name.endswith(suffix) for suffix in contract["global_excluded_suffixes"]):
        return True
    scope_value = scope_relative.as_posix()
    for prefix in scope["excluded_prefixes"]:
        if scope_value == prefix or scope_value.startswith(f"{prefix}/"):
            return True
    return False


def entry_for_path(path: Path, repository_relative: PurePosixPath) -> dict[str, Any]:
    mode = path.lstat().st_mode
    if stat.S_ISLNK(mode):
        target = os.readlink(path)
        payload = target.encode("utf-8")
        return {
            "path": repository_relative.as_posix(),
            "sha256": sha256_bytes(payload),
            "size_bytes": len(payload),
            "type": "symlink",
        }
    if stat.S_ISREG(mode):
        return {
            "path": repository_relative.as_posix(),
            "sha256": sha256_file(path),
            "size_bytes": path.stat().st_size,
            "type": "file",
        }
    raise ContractError(f"special file rejected: {repository_relative.as_posix()}")


def walk_scope(
    repository_root: Path,
    scope: dict[str, Any],
    contract: dict[str, Any],
) -> list[dict[str, Any]]:
    scope_path = validate_relative_path(scope["path"], f"scope {scope.get('id')} path")
    root = repository_root.joinpath(*scope_path.parts)
    if not os.path.lexists(root):
        raise ContractError(f"scope path does not exist: {scope_path.as_posix()}")
    if root.is_symlink():
        raise ContractError(f"scope root may not be a symlink: {scope_path.as_posix()}")

    entries: list[dict[str, Any]] = []

    def visit(path: Path, relative: PurePosixPath) -> None:
        repository_relative = scope_path / relative
        if is_excluded(repository_relative, relative, contract, scope):
            return
        mode = path.lstat().st_mode
        if stat.S_ISDIR(mode):
            with os.scandir(path) as iterator:
                children = sorted(iterator, key=lambda item: item.name)
            for child in children:
                child_relative = relative / child.name
                visit(Path(child.path), child_relative)
            return
        entries.append(entry_for_path(path, repository_relative))

    if root.is_dir():
        with os.scandir(root) as iterator:
            children = sorted(iterator, key=lambda item: item.name)
        for child in children:
            visit(Path(child.path), PurePosixPath(child.name))
    else:
        relative = PurePosixPath(scope_path.name)
        repository_relative = scope_path
        if not is_excluded(repository_relative, relative, contract, scope):
            entries.append(entry_for_path(root, repository_relative))

    entries.sort(key=lambda entry: entry["path"])
    return entries


def require_string_list(value: Any, label: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) or not item for item in value):
        raise ContractError(f"{label} must be a list of non-empty strings")
    if len(set(value)) != len(value):
        raise ContractError(f"{label} must not contain duplicates")
    return value


def validate_contract(contract: dict[str, Any]) -> None:
    if contract.get("schema_version") != CONTRACT_SCHEMA:
        raise ContractError(f"unsupported contract schema: {contract.get('schema_version')}")
    if contract.get("algorithm") != "sha256-canonical-source-entries-v1":
        raise ContractError(f"unsupported algorithm: {contract.get('algorithm')}")
    if contract.get("overlap_policy") != "deduplicate-by-repository-relative-path":
        raise ContractError("overlap_policy must deduplicate by repository-relative path")
    if contract.get("symlink_policy") != "hash-link-text-never-follow":
        raise ContractError("symlink_policy must hash link text and never follow")
    if contract.get("special_file_policy") != "reject":
        raise ContractError("special_file_policy must be reject")
    for key in (
        "global_excluded_segments",
        "global_excluded_file_names",
        "global_excluded_suffixes",
        "required_paths",
    ):
        require_string_list(contract.get(key), key)
    scopes = contract.get("scopes")
    if not isinstance(scopes, list) or not scopes:
        raise ContractError("scopes must be a non-empty list")
    scope_ids: set[str] = set()
    for scope in scopes:
        if not isinstance(scope, dict):
            raise ContractError("each scope must be an object")
        scope_id = scope.get("id")
        if not isinstance(scope_id, str) or not scope_id or scope_id in scope_ids:
            raise ContractError("scope IDs must be unique non-empty strings")
        scope_ids.add(scope_id)
        validate_relative_path(scope.get("path"), f"scope {scope_id} path")
        prefixes = require_string_list(scope.get("excluded_prefixes"), f"scope {scope_id} excluded_prefixes")
        for prefix in prefixes:
            validate_relative_path(prefix, f"scope {scope_id} excluded prefix")


def snapshot(repository_root: Path, contract_path: Path) -> dict[str, Any]:
    repository_root = repository_root.resolve(strict=True)
    if not repository_root.is_dir():
        raise ContractError(f"repository root is not a directory: {repository_root}")
    contract = load_json(contract_path)
    validate_contract(contract)

    scope_summaries: list[dict[str, Any]] = []
    deduplicated: dict[str, dict[str, Any]] = {}
    for scope in contract["scopes"]:
        entries = walk_scope(repository_root, scope, contract)
        scope_summaries.append(
            {
                "digest": sha256_bytes(canonical_bytes(entries)),
                "entry_count": len(entries),
                "id": scope["id"],
                "path": scope["path"],
            }
        )
        for entry in entries:
            prior = deduplicated.get(entry["path"])
            if prior is not None and prior != entry:
                raise ContractError(f"overlapping scope disagreement: {entry['path']}")
            deduplicated[entry["path"]] = entry

    entries = [deduplicated[path] for path in sorted(deduplicated)]
    included_paths = {entry["path"] for entry in entries}
    required_paths = []
    for required in contract["required_paths"]:
        validate_relative_path(required, "required path")
        included = required in included_paths
        required_paths.append({"included": included, "path": required})
        if not included:
            raise ContractError(f"required path is absent or excluded: {required}")

    return {
        "algorithm": contract["algorithm"],
        "authority_effect": "none",
        "contract": {
            "path": contract_path.resolve().relative_to(repository_root).as_posix()
            if contract_path.resolve().is_relative_to(repository_root)
            else str(contract_path.resolve()),
            "sha256": sha256_file(contract_path),
        },
        "entries": entries,
        "entry_count": len(entries),
        "required_paths": required_paths,
        "schema_version": SNAPSHOT_SCHEMA,
        "scopes": scope_summaries,
        "set_digest": sha256_bytes(canonical_bytes(entries)),
    }


def compare(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    if before.get("schema_version") != SNAPSHOT_SCHEMA:
        raise ContractError("before snapshot has an unsupported schema")
    if after.get("schema_version") != SNAPSHOT_SCHEMA:
        raise ContractError("after snapshot has an unsupported schema")
    checks = {
        "algorithm_equal": before.get("algorithm") == after.get("algorithm"),
        "contract_equal": before.get("contract") == after.get("contract"),
        "entries_equal": before.get("entries") == after.get("entries"),
        "entry_count_equal": before.get("entry_count") == after.get("entry_count"),
        "required_paths_equal": before.get("required_paths") == after.get("required_paths"),
        "scope_digests_equal": before.get("scopes") == after.get("scopes"),
        "set_digest_equal": before.get("set_digest") == after.get("set_digest"),
    }
    equal = all(checks.values())
    return {
        "after_set_digest": after.get("set_digest"),
        "authority_effect": "none",
        "before_set_digest": before.get("set_digest"),
        "checks": checks,
        "equal": equal,
        "result": "pass" if equal else "block",
        "schema_version": COMPARE_SCHEMA,
    }


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    snapshot_parser = subparsers.add_parser("snapshot")
    snapshot_parser.add_argument("--repository-root", type=Path, required=True)
    snapshot_parser.add_argument("--contract", type=Path, required=True)
    snapshot_parser.add_argument("--output", type=Path, required=True)

    compare_parser = subparsers.add_parser("compare")
    compare_parser.add_argument("--before", type=Path, required=True)
    compare_parser.add_argument("--after", type=Path, required=True)
    compare_parser.add_argument("--output", type=Path)
    return parser.parse_args(list(argv))


def main(argv: Iterable[str]) -> int:
    args = parse_args(argv)
    try:
        if args.command == "snapshot":
            result = snapshot(args.repository_root, args.contract)
            atomic_write_json(args.output, result)
            print(json.dumps({"entry_count": result["entry_count"], "set_digest": result["set_digest"]}))
            return 0

        result = compare(load_json(args.before), load_json(args.after))
        if args.output:
            atomic_write_json(args.output, result)
        print(json.dumps(result, sort_keys=True))
        return 0 if result["equal"] else 2
    except ContractError as exc:
        print(f"protected-set error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
