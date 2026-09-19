#!/usr/bin/env python3
"""Rebind the frozen WP-FMP-002 v2 readiness config to candidate @2."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


OLD_ROOT = "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/20260824T030126Z-fmp-six-unit-candidate"
NEW_ROOT = "projects/domainspec-v2/development/formal-model-proof-provider/invoke-plan/20260824T042948Z-fmp-six-unit-candidate-r2"
TERMINAL_SCHEMA = ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json"
SEMANTIC_VALIDATOR = f"{NEW_ROOT}/validators/validate-wp-fmp-002-terminal-receipt.py"
EXECUTION_ENTRY = f"{NEW_ROOT}/EXECUTION-ENTRY.json"
CONFIG_EXECUTION_POLICY_FIELDS = (
    "route_policy",
    "allowed_routes",
    "allowed_routes_digest",
    "automatic_decisions",
    "stop_decisions",
    "scope_source",
    "validation_policy",
)


def exact_ref(repository_root: Path, raw_path: str) -> dict[str, Any]:
    path = repository_root / raw_path
    content = path.read_bytes()
    return {
        "path": raw_path,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def canonical_digest(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
        ).encode("utf-8")
    ).hexdigest()


def execution_policy_from_entry(entry: dict[str, Any]) -> dict[str, Any]:
    """Project the refreshed candidate policy into the closed v2 config shape."""
    source = entry.get("execution_policy")
    work_pack_id = entry.get("work_pack_id")
    if not isinstance(source, dict) or not isinstance(work_pack_id, str):
        raise ValueError("execution entry lacks a usable work-pack execution policy")
    missing = [field for field in CONFIG_EXECUTION_POLICY_FIELDS if field not in source]
    if missing:
        raise ValueError(
            "execution entry policy lacks required config fields: "
            + ", ".join(missing)
        )
    routes = source["allowed_routes"]
    if canonical_digest(routes) != source["allowed_routes_digest"]:
        raise ValueError("execution entry allowed-routes digest is not canonical")
    return {
        "work_pack_id": work_pack_id,
        **{field: source[field] for field in CONFIG_EXECUTION_POLICY_FIELDS},
    }


def replace_strings(value: Any) -> Any:
    if isinstance(value, str):
        return value.replace(OLD_ROOT, NEW_ROOT)
    if isinstance(value, list):
        return [replace_strings(item) for item in value]
    if isinstance(value, dict):
        return {key: replace_strings(item) for key, item in value.items()}
    return value


def rebind_artifact_refs(value: Any, repository_root: Path) -> None:
    if isinstance(value, list):
        for item in value:
            rebind_artifact_refs(item, repository_root)
        return
    if not isinstance(value, dict):
        return
    artifact_ref = value.get("artifact_ref")
    if isinstance(artifact_ref, dict) and isinstance(artifact_ref.get("path"), str):
        value["artifact_ref"] = exact_ref(repository_root, artifact_ref["path"])
    for item in value.values():
        rebind_artifact_refs(item, repository_root)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", required=True)
    parser.add_argument("--source-config", required=True)
    parser.add_argument("--output-config", required=True)
    parser.add_argument("--audit-id", required=True)
    args = parser.parse_args()

    repository_root = Path(args.repository_root).resolve()
    config = replace_strings(
        json.loads(Path(args.source_config).read_text(encoding="utf-8"))
    )
    config["audit_id"] = args.audit_id
    execution_entry = json.loads(
        (repository_root / EXECUTION_ENTRY).read_text(encoding="utf-8")
    )
    config["execution_policy"] = execution_policy_from_entry(execution_entry)
    config["receipt_bindings"]["terminal_schema_ref"] = {
        "binding_id": "terminal-receipt-schema-task-session-governance-v1",
        "owner_ref": "task-session",
        "artifact_ref": exact_ref(repository_root, TERMINAL_SCHEMA),
        "selector": "",
    }
    config["receipt_bindings"]["semantic_validator_ref"] = {
        "binding_id": "terminal-receipt-semantic-validator-wp-fmp-002-v1",
        "owner_ref": "invoke-refresh-owner",
        "binding_mode": "opaque-exact-artifact",
        "artifact_ref": exact_ref(repository_root, SEMANTIC_VALIDATOR),
    }
    rebind_artifact_refs(config, repository_root)

    output = Path(args.output_config)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "status": "pass",
                "audit_id": config["audit_id"],
                "terminal_schema_sha256": config["receipt_bindings"]
                ["terminal_schema_ref"]["artifact_ref"]["sha256"],
                "semantic_validator_sha256": config["receipt_bindings"]
                ["semantic_validator_ref"]["artifact_ref"]["sha256"],
                "allowed_route_count": len(
                    config["execution_policy"]["allowed_routes"]
                ),
                "allowed_routes_digest": config["execution_policy"]
                ["allowed_routes_digest"],
                "authority_effect": "none",
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
