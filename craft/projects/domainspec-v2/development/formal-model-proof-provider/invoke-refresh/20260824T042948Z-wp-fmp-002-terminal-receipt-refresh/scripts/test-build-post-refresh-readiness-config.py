#!/usr/bin/env python3
"""Regression checks for refreshed readiness execution-policy rebinding."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


REPOSITORY_ROOT = Path(__file__).resolve().parents[7]
RUN = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/readiness/"
    "20260824T052135Z-wp-fmp-002-post-refresh-readiness"
)
CANDIDATE = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/"
    "20260824T042948Z-fmp-six-unit-candidate-r2"
)
SCHEMA = Path(
    ".agents/skills/work-pack-readiness-audit/schemas/"
    "audit-config-v2.schema.json"
)
BUILDER = Path(
    "projects/domainspec-v2/development/formal-model-proof-provider/invoke-refresh/"
    "20260824T042948Z-wp-fmp-002-terminal-receipt-refresh/scripts/"
    "build-post-refresh-readiness-config.py"
)
CONFIG_POLICY_KEYS = {
    "work_pack_id",
    "route_policy",
    "allowed_routes",
    "allowed_routes_digest",
    "automatic_decisions",
    "stop_decisions",
    "scope_source",
    "validation_policy",
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_digest(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode(
            "utf-8"
        )
    ).hexdigest()


def load_builder() -> Any:
    spec = importlib.util.spec_from_file_location("post_refresh_builder", REPOSITORY_ROOT / BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load readiness config builder")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def exact_ref_errors(value: Any, location: str = "$") -> tuple[list[str], int]:
    errors: list[str] = []
    count = 0
    if isinstance(value, list):
        for index, child in enumerate(value):
            child_errors, child_count = exact_ref_errors(child, f"{location}/{index}")
            errors.extend(child_errors)
            count += child_count
        return errors, count
    if not isinstance(value, dict):
        return errors, count
    artifact_ref = value.get("artifact_ref")
    if isinstance(artifact_ref, dict):
        count += 1
        raw_path = artifact_ref.get("path")
        if not isinstance(raw_path, str):
            errors.append(f"non-string exact-ref path at {location}")
        else:
            path = REPOSITORY_ROOT / raw_path
            if not path.is_file() or path.is_symlink():
                errors.append(f"missing or symlink exact ref: {raw_path}")
            else:
                content = path.read_bytes()
                if hashlib.sha256(content).hexdigest() != artifact_ref.get("sha256"):
                    errors.append(f"exact-ref digest mismatch: {raw_path}")
                if len(content) != artifact_ref.get("size_bytes"):
                    errors.append(f"exact-ref size mismatch: {raw_path}")
    for key, child in value.items():
        child_errors, child_count = exact_ref_errors(child, f"{location}/{key}")
        errors.extend(child_errors)
        count += child_count
    return errors, count


def main() -> int:
    config = load_json(REPOSITORY_ROOT / RUN / "audit-config.json")
    entry = load_json(REPOSITORY_ROOT / CANDIDATE / "EXECUTION-ENTRY.json")
    schema = load_json(REPOSITORY_ROOT / SCHEMA)
    builder = load_builder()
    errors: list[str] = []

    schema_errors = sorted(
        Draft202012Validator(schema).iter_errors(config),
        key=lambda item: list(item.path),
    )
    errors.extend(
        "config schema invalid at "
        + ("/".join(map(str, error.path)) or "<root>")
        + f": {error.message}"
        for error in schema_errors
    )

    config_policy = config["execution_policy"]
    candidate_policy = entry["execution_policy"]
    if set(config_policy) != CONFIG_POLICY_KEYS:
        errors.append("config execution-policy keys are not the closed v2 set")
    if "digest_algorithm" in config_policy:
        errors.append("candidate-only digest_algorithm leaked into audit config")
    if config_policy["allowed_routes"] != candidate_policy["allowed_routes"]:
        errors.append("config allowed routes differ from refreshed execution entry")
    computed_digest = canonical_digest(config_policy["allowed_routes"])
    if computed_digest != config_policy["allowed_routes_digest"]:
        errors.append("config allowed-routes digest is not canonical")
    if config_policy["allowed_routes_digest"] != candidate_policy["allowed_routes_digest"]:
        errors.append("config allowed-routes digest differs from refreshed execution entry")

    reference_errors, reference_count = exact_ref_errors(config)
    errors.extend(reference_errors)

    mutated_entry = copy.deepcopy(entry)
    mutation_marker = str(CANDIDATE / "SWU-MANIFEST.json")
    mutated_entry["execution_policy"]["allowed_routes"][0]["required_inputs"].append(
        mutation_marker
    )
    mutated_entry["execution_policy"]["allowed_routes_digest"] = canonical_digest(
        mutated_entry["execution_policy"]["allowed_routes"]
    )
    stale_policy_rejected = (
        config_policy["allowed_routes"]
        != mutated_entry["execution_policy"]["allowed_routes"]
        or config_policy["allowed_routes_digest"]
        != mutated_entry["execution_policy"]["allowed_routes_digest"]
    )
    if not stale_policy_rejected:
        errors.append("changed candidate route semantics did not expose stale config")

    policy_builder = getattr(builder, "execution_policy_from_entry", None)
    if policy_builder is None:
        errors.append("builder lacks execution_policy_from_entry rebinding")
    else:
        expected_policy = policy_builder(entry)
        if config_policy != expected_policy:
            errors.append(
                "config execution policy differs from the closed refreshed-entry projection"
            )
        rebound_policy = policy_builder(mutated_entry)
        if rebound_policy["allowed_routes"] != mutated_entry["execution_policy"]["allowed_routes"]:
            errors.append("builder did not rebind changed candidate routes")
        if rebound_policy["allowed_routes_digest"] != mutated_entry["execution_policy"]["allowed_routes_digest"]:
            errors.append("builder did not rebind changed candidate route digest")
        if "digest_algorithm" in rebound_policy:
            errors.append("builder leaked digest_algorithm during changed-route rebinding")
        mutated_config = copy.deepcopy(config)
        mutated_config["execution_policy"] = rebound_policy
        if list(Draft202012Validator(schema).iter_errors(mutated_config)):
            errors.append("changed-route rebound config fails v2 schema")

    result = {
        "schema_version": "fmp.post-refresh-readiness-config-regression.v1",
        "status": "pass" if not errors else "block",
        "routes_equal_candidate": config_policy["allowed_routes"]
        == candidate_policy["allowed_routes"],
        "config_allowed_routes_digest": config_policy["allowed_routes_digest"],
        "candidate_allowed_routes_digest": candidate_policy["allowed_routes_digest"],
        "recomputed_allowed_routes_digest": computed_digest,
        "config_schema_status": "pass" if not schema_errors else "block",
        "exact_ref_count": reference_count,
        "exact_refs_status": "pass" if not reference_errors else "block",
        "changed_route_without_rebinding_status": "block"
        if stale_policy_rejected
        else "unexpected-pass",
        "changed_route_with_rebinding_status": "pass"
        if policy_builder is not None
        and not any("changed-route" in error or "changed candidate" in error for error in errors)
        else "block",
        "errors": errors,
        "authority_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 2


if __name__ == "__main__":
    raise SystemExit(main())
