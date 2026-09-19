#!/usr/bin/env python3
"""Apply one validated create-only Invoke material package exactly."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath


def safe_relative(raw: str) -> Path:
    path = PurePosixPath(raw)
    if not raw or path.is_absolute() or ".." in path.parts or str(path) in {"", "."}:
        raise ValueError(f"unsafe relative path: {raw}")
    return Path(*path.parts)


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", required=True)
    parser.add_argument("--material-package", required=True)
    parser.add_argument("--expected-target-root", required=True)
    args = parser.parse_args()

    repository_root = Path(args.repository_root).resolve()
    material_path = Path(args.material_package).resolve()
    expected_root_rel = safe_relative(args.expected_target_root)
    expected_root = (repository_root / expected_root_rel).resolve(strict=False)
    expected_root.relative_to(repository_root)

    package = json.loads(material_path.read_text(encoding="utf-8"))
    changes = package.get("changes", [])
    if package.get("mutation_mode") != "apply-approved":
        raise ValueError("material package is not apply-approved")
    if package.get("mutation_state") != "materialized":
        raise ValueError("material package is not materialized")
    if not changes or any(change.get("operation") != "create" for change in changes):
        raise ValueError("material package is not non-empty create-only")
    if expected_root.exists() or expected_root.is_symlink():
        raise FileExistsError(f"expected target root already exists: {expected_root_rel}")

    prepared: list[tuple[Path, bytes, str]] = []
    targets: set[str] = set()
    for change in changes:
        target_raw = change["target_path"]
        if target_raw in targets:
            raise ValueError(f"duplicate target: {target_raw}")
        targets.add(target_raw)
        target_rel = safe_relative(target_raw)
        target = (repository_root / target_rel).resolve(strict=False)
        target.relative_to(expected_root)
        if target.exists() or target.is_symlink():
            raise FileExistsError(f"target already exists: {target_raw}")

        output_ref = change["output_ref"]
        source_rel = safe_relative(output_ref["path"])
        source = (repository_root / source_rel).resolve(strict=True)
        source.relative_to(repository_root)
        if not source.is_file() or source.is_symlink():
            raise ValueError(f"output source is not a regular non-symlink file: {source_rel}")
        content = source.read_bytes()
        if sha256(content) != output_ref["sha256"]:
            raise ValueError(f"output source digest mismatch: {source_rel}")
        if len(content) != output_ref["size_bytes"]:
            raise ValueError(f"output source size mismatch: {source_rel}")
        prepared.append((target, content, target_raw))

    approved = set(package["approval"]["scope_paths"])
    inventoried = {entry["target_path"] for entry in package["target_inventory"]}
    if targets != approved or targets != inventoried:
        raise ValueError("change, approval, and target inventory sets differ")

    created: list[Path] = []
    try:
        for target, content, _ in prepared:
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open("xb") as handle:
                handle.write(content)
            created.append(target)
        for target, content, target_raw in prepared:
            actual = target.read_bytes()
            if actual != content or sha256(actual) != sha256(content):
                raise ValueError(f"post-apply mismatch: {target_raw}")
    except Exception:
        for target in reversed(created):
            if target.is_file() and not target.is_symlink():
                target.unlink()
        for directory in sorted(
            {path.parent for path in created}, key=lambda item: len(item.parts), reverse=True
        ):
            current = directory
            while current != repository_root and current != expected_root.parent:
                try:
                    current.rmdir()
                except OSError:
                    break
                current = current.parent
        raise

    print(
        json.dumps(
            {
                "status": "pass",
                "operation": "create-only",
                "applied_target_count": len(created),
                "expected_target_root": str(expected_root_rel),
                "authority_effect": "none"
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
