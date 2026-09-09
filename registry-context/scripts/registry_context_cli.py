#!/usr/bin/env python3
"""Deterministic local read-only Registry Context resolver."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
REGISTRY_PATH = PACKAGE_ROOT / "registry.json"

REQUEST_KEYS = {
    "schema_ref", "schema_version", "request_id", "context_ref",
    "expected_context_sha256", "consumer_ref", "intended_use",
    "selection_ids", "authority_effect",
}

CLAIM_CEILING = (
    "One deterministic local read-only Registry Context View only; no source "
    "mutation, owner decision, lifecycle transition, authority grant, DomainSpec "
    "release admission, runtime adoption, publication, release, deployment, or "
    "external effect."
)


class ResolutionBlocked(Exception):
    """A well-formed request cannot be resolved without guessing."""


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def digest(value: Any) -> str:
    data = value if isinstance(value, bytes) else canonical_bytes(value)
    return hashlib.sha256(data).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} must contain one JSON object")
    return value


def bounded_repository_path(raw: str) -> Path:
    relative = Path(raw)
    if (
        relative.is_absolute()
        or ".." in relative.parts
        or not raw.startswith("cyberAlchemy-v2/")
    ):
        raise ResolutionBlocked("registry contains an unbounded source path")
    target = (REPOSITORY_ROOT / relative).resolve()
    cav2_root = (REPOSITORY_ROOT / "cyberAlchemy-v2").resolve()
    if cav2_root not in target.parents:
        raise ResolutionBlocked("registry source escapes CyberAlchemy v2")
    return target


def validate_request(request: dict[str, Any]) -> None:
    if set(request) != REQUEST_KEYS:
        missing = sorted(REQUEST_KEYS - set(request))
        extra = sorted(set(request) - REQUEST_KEYS)
        details = []
        if missing:
            details.append(f"missing fields: {', '.join(missing)}")
        if extra:
            details.append(f"unknown fields: {', '.join(extra)}")
        raise ValueError("; ".join(details))
    if request["schema_version"] != "cav2-registry-context-request/v2":
        raise ValueError("unsupported request schema_version")
    if request["schema_ref"] != "../schemas/registry-context.schema.json#/$defs/request":
        raise ValueError("request schema_ref is invalid")
    if request["authority_effect"] != "none":
        raise ValueError("request authority_effect must be none")
    for key in ("request_id", "context_ref", "consumer_ref", "intended_use"):
        if not isinstance(request[key], str) or not request[key].strip():
            raise ValueError(f"{key} must be a non-empty string")
    expected = request["expected_context_sha256"]
    if not isinstance(expected, str) or len(expected) != 64:
        raise ValueError("expected_context_sha256 must be a SHA-256 digest")
    selection_ids = request["selection_ids"]
    if (
        not isinstance(selection_ids, list)
        or not selection_ids
        or not all(isinstance(item, str) and item for item in selection_ids)
        or len(selection_ids) != len(set(selection_ids))
    ):
        raise ValueError("selection_ids must be a non-empty unique string list")


def resolve(request: dict[str, Any]) -> dict[str, Any]:
    validate_request(request)
    registry = load_json(REGISTRY_PATH)
    if registry.get("authority_effect") != "none":
        raise ResolutionBlocked("registry authority_effect is not none")

    contexts = [
        item for item in registry.get("contexts", [])
        if item.get("context_ref") == request["context_ref"]
    ]
    if len(contexts) != 1:
        raise ResolutionBlocked("context_ref is not registered exactly once")
    registered_context = contexts[0]
    context_path = bounded_repository_path(registered_context["context_path"])
    context = load_json(context_path)
    current_context_sha = digest(context)
    expected_context_sha = registered_context["expected_context_sha256"]
    if request["expected_context_sha256"] != expected_context_sha:
        raise ResolutionBlocked("request Context digest does not match registration")
    if current_context_sha != expected_context_sha:
        raise ResolutionBlocked("registered Context digest has drifted")
    if context.get("context_id") != request["context_ref"]:
        raise ResolutionBlocked("Context source identity does not match registration")
    if request["consumer_ref"] not in context.get("consumer_refs", []):
        raise ResolutionBlocked("consumer_ref is not admitted by the named Context")
    if request["intended_use"] not in context.get("intended_uses", []):
        raise ResolutionBlocked("intended_use is not admitted by the named Context")

    allowed = set(registered_context["allowed_selection_ids"])
    requested = request["selection_ids"]
    unknown_or_disallowed = sorted(set(requested) - allowed)
    if unknown_or_disallowed:
        raise ResolutionBlocked(
            "selection IDs are unknown or not allowed for this Context: "
            + ", ".join(unknown_or_disallowed)
        )

    selection_by_id = {item["selection_id"]: item for item in registry.get("selections", [])}
    records: list[dict[str, Any]] = []
    epoch_entries: list[dict[str, str]] = []
    for selection_id in requested:
        selection = selection_by_id.get(selection_id)
        if selection is None:
            raise ResolutionBlocked(f"selection is not registered: {selection_id}")
        source_path = bounded_repository_path(selection["path"])
        raw = source_path.read_bytes()
        if digest(raw) != selection["expected_file_sha256"]:
            raise ResolutionBlocked(f"source file digest has drifted: {selection_id}")
        content = json.loads(raw)
        if not isinstance(content, dict):
            raise ResolutionBlocked(f"selection is not one JSON object: {selection_id}")
        selection_sha = digest(content)
        if selection_sha != selection["expected_selection_sha256"]:
            raise ResolutionBlocked(f"selection digest has drifted: {selection_id}")
        records.append({
            "selection_id": selection_id,
            "selection_sha256": selection_sha,
            "owner_route": selection["owner_route"],
            "content": content,
        })
        epoch_entries.append({"selection_id": selection_id, "selection_sha256": selection_sha})

    request_sha = digest(request)
    source_epoch_sha = digest(epoch_entries)
    context_projection = {
        "context_kind": context["context_kind"],
        "product_ref": context["product_ref"],
        "project_ref": context["project_ref"],
        "goal_ref": context["goal_ref"],
        "bounded_context_refs": context["bounded_context_refs"],
        "purpose": context["purpose"],
        "intended_uses": context["intended_uses"],
        "subject_scope": context["subject_scope"],
        "owner_route": context["owner_route"],
        "lifecycle_state": context["lifecycle_state"],
    }
    identity_sha = digest({
        "request_sha256": request_sha,
        "context_sha256": current_context_sha,
        "source_epoch_sha256": source_epoch_sha,
    })
    view: dict[str, Any] = {
        "schema_ref": "../schemas/registry-context.schema.json#/$defs/view",
        "schema_version": "cav2-registry-context-view/v2",
        "view_id": f"RC2-VIEW-{identity_sha[:24].upper()}",
        "request_id": request["request_id"],
        "request_sha256": request_sha,
        "context_ref": request["context_ref"],
        "context_sha256": current_context_sha,
        "consumer_ref": request["consumer_ref"],
        "intended_use": request["intended_use"],
        "resolution_status": "resolved",
        "source_epoch_sha256": source_epoch_sha,
        "context_projection": context_projection,
        "selected_records": records,
        "claim_ceiling": CLAIM_CEILING,
        "authority_effect": "none",
    }
    view["view_sha256"] = digest(view)
    return view


def blocked(request_id: str | None, message: str) -> dict[str, Any]:
    return {
        "schema_version": "cav2-registry-context-blocked/v2",
        "resolution_status": "blocked",
        "request_id": request_id,
        "errors": [message],
        "authority_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve one registered CyberAlchemy Context")
    subparsers = parser.add_subparsers(dest="command", required=True)
    resolve_parser = subparsers.add_parser("resolve")
    resolve_parser.add_argument("--request", required=True, help="Path to a Registry Context request JSON file")
    args = parser.parse_args()

    request_id: str | None = None
    try:
        request = load_json(Path(args.request))
        candidate_id = request.get("request_id")
        request_id = candidate_id if isinstance(candidate_id, str) else None
        result = resolve(request)
    except ResolutionBlocked as exc:
        print(json.dumps(blocked(request_id, str(exc)), sort_keys=True, separators=(",", ":"), ensure_ascii=False))
        return 2
    except (OSError, json.JSONDecodeError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps(blocked(request_id, f"malformed request or package: {exc}"), sort_keys=True, separators=(",", ":"), ensure_ascii=False))
        return 1
    print(json.dumps(result, sort_keys=True, separators=(",", ":"), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
