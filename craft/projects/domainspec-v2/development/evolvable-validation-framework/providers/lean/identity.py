#!/usr/bin/env python3
"""Exact identity and canonical-digest helpers for the EVF Lean provider."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath
from typing import Any


class IdentityError(ValueError):
    """An exact reference is unsafe, absent, or stale."""


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def canonical_digest(value: Any) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def repository_root(start: Path | None = None) -> Path:
    cursor = (start or Path.cwd()).resolve()
    if cursor.is_file():
        cursor = cursor.parent
    for candidate in (cursor, *cursor.parents):
        if (candidate / ".git").exists():
            return candidate
    raise IdentityError("repository root not found")


def resolve_relative(root: Path, path_text: str, *, must_exist: bool = True) -> Path:
    posix = PurePosixPath(path_text)
    if not path_text or posix.is_absolute() or ".." in posix.parts:
        raise IdentityError(f"unsafe repository-relative path: {path_text!r}")
    candidate = root.joinpath(*posix.parts)
    try:
        resolved = candidate.resolve(strict=must_exist)
    except FileNotFoundError as error:
        raise IdentityError(f"missing referenced artifact: {path_text}") from error
    try:
        resolved.relative_to(root.resolve())
    except ValueError as error:
        raise IdentityError(f"reference escapes repository: {path_text}") from error
    return resolved


def exact_ref(root: Path, path: Path) -> dict[str, Any]:
    resolved = path.resolve(strict=True)
    try:
        relative = resolved.relative_to(root.resolve()).as_posix()
    except ValueError as error:
        raise IdentityError(f"artifact is outside repository: {path}") from error
    data = resolved.read_bytes()
    return {"path": relative, "sha256": sha256_bytes(data), "size_bytes": len(data)}


def verify_exact_ref(root: Path, reference: dict[str, Any]) -> Path:
    path_text = reference.get("path")
    if not isinstance(path_text, str):
        raise IdentityError("exact reference path is missing")
    path = resolve_relative(root, path_text)
    data = path.read_bytes()
    actual_digest = sha256_bytes(data)
    actual_size = len(data)
    if reference.get("sha256") != actual_digest:
        raise IdentityError(f"digest mismatch: {path_text}")
    if reference.get("size_bytes") != actual_size:
        raise IdentityError(f"size mismatch: {path_text}")
    if "current" in reference and reference.get("current") is not True:
        raise IdentityError(f"reference is not current: {path_text}")
    return path


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise IdentityError(f"invalid JSON: {path}") from error
    if not isinstance(value, dict):
        raise IdentityError(f"JSON object required: {path}")
    return value
