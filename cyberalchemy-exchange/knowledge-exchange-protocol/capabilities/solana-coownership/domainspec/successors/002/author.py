#!/usr/bin/env python3
"""Author the current-grammar successor of the admitted Solana DomainSpec source."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any


SUCCESSOR_ROOT = Path(__file__).resolve().parent
BASE_ROOT = SUCCESSOR_ROOT.parents[1]
REPO_ROOT = SUCCESSOR_ROOT.parents[7]
FEATURE_ID = "no-price-solana-coownership"
PARSER_PATH = REPO_ROOT / "projects/domainspec-v2/impl/cli/src/input/project-model.ts"
BASE_ADMISSION_PATH = BASE_ROOT.parent / "decisions/domainspec-source-admission-001.json"

ENTITY_IDENTITIES = {
    "coownership-evidence": "evidence_id",
    "encryption-key-binding": "knowledge_identity_id",
    "execution-environment": "environment_identity",
    "knowledge-identity": "knowledge_identity_id",
    "program-realization": "program_id",
    "solana-artifact-state": "artifact_version",
    "solana-signing-key-binding": "knowledge_identity_id",
}

VALUE_OBJECT_INVARIANTS = {
    "coowner-membership": "grant-transition-rule",
    "grant-consumption-record": "grant-transition-rule",
    "grant-evidence-contract": "evidence-claim-rule",
    "grant-input-contract": "grant-transition-rule",
    "grant-replay-domain": "grant-transition-rule",
    "knowledge-artifact-version": "grant-transition-rule",
    "network-cost": "grant-transition-rule",
    "no-price-boundary": "grant-transition-rule",
    "recipient-envelope-commitment": "grant-transition-rule",
}

INTEGER_FIELDS = {
    "binding_version",
    "consumed_revision",
    "expected_revision",
    "post_revision",
    "pre_revision",
    "refundable_rent_reserve_lamports",
    "rent_lamports",
    "revision",
    "signing_binding_version",
    "transaction_fee_lamports",
    "valid_from_slot",
    "valid_until_slot",
}

BOOLEAN_FIELDS = {
    "knowledge_consideration_allowed",
    "network_cost_reported_separately",
}


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return value


def canonical_field_id(field_name: str) -> str:
    return field_name.replace("_", "-")


def field_spec(field_name: str, *, required: bool = True) -> dict[str, Any]:
    primitive = "boolean" if field_name in BOOLEAN_FIELDS else "integer" if field_name in INTEGER_FIELDS else "string"
    return {
        "field_id": canonical_field_id(field_name),
        "required": required,
        "type_ref": {"kind": "primitive", "name": primitive},
    }


def typed_fields(raw_fields: list[Any], *, optional: set[str] | None = None) -> list[dict[str, Any]]:
    optional = optional or set()
    result: list[dict[str, Any]] = []
    for raw in raw_fields:
        if not isinstance(raw, str):
            raise ValueError("legacy field list contains a non-string entry")
        result.append(field_spec(raw, required=raw not in optional))
    return result


def migrate_body(node_id: str, kind: str, body: dict[str, Any]) -> dict[str, Any]:
    description = body.get("description")
    if not isinstance(description, str) or not description:
        raise ValueError(f"missing description: {node_id}")

    if kind == "Entity":
        identity = ENTITY_IDENTITIES.get(node_id)
        fields = body.get("fields")
        if identity is None or not isinstance(fields, list) or identity not in fields:
            raise ValueError(f"entity migration is not closed: {node_id}")
        return {
            "description": description,
            "identity_field": canonical_field_id(identity),
            "fields": typed_fields(fields, optional={"valid_until_slot"}),
        }

    if kind == "Value Object":
        invariant = VALUE_OBJECT_INVARIANTS.get(node_id)
        fields = body.get("fields")
        if invariant is None or not isinstance(fields, list):
            raise ValueError(f"value-object migration is not closed: {node_id}")
        return {
            "description": description,
            "fields": typed_fields(fields),
            "invariant_refs": [f"{FEATURE_ID}:{invariant}"],
        }

    if kind == "Event":
        fields = body.get("fields")
        if not isinstance(fields, list):
            raise ValueError(f"event migration is not closed: {node_id}")
        if node_id == "no-price-grant-completed":
            occurrence = field_spec("replay_operation_identity")
            payload = typed_fields([field for field in fields if field != "replay_operation_identity"])
        elif node_id == "no-price-grant-rejected":
            occurrence = field_spec("rejection_observation_id")
            payload = typed_fields(fields)
        else:
            raise ValueError(f"event identity is not declared: {node_id}")
        return {
            "description": description,
            "event_type": node_id,
            "version": "1",
            "occurrence_id": occurrence,
            "occurred_at_policy": "generated",
            "payload": payload,
        }

    if kind == "Interface":
        return {
            "description": description,
            "boundary_kind": "internal",
            "version": "1",
            "compatibility": "exact",
            "operations": [
                {
                    "operation_id": "grant-no-price-coownership",
                    "operation_ref": f"{FEATURE_ID}:grant-no-price-coownership",
                    "request": [
                        {
                            "field_id": "grant-input",
                            "required": True,
                            "type_ref": {"kind": "reference", "selector": f"{FEATURE_ID}:grant-input-contract"},
                        }
                    ],
                    "result": [
                        {
                            "field_id": "grant-evidence",
                            "required": True,
                            "type_ref": {"kind": "reference", "selector": f"{FEATURE_ID}:grant-evidence-contract"},
                        }
                    ],
                }
            ],
        }

    if kind == "State Machine":
        return {
            "description": description,
            "states": list(body["states"]),
            "initial": body["initial"],
            "transitions": [
                {
                    "transition_id": "complete-no-price-grant",
                    "source_state": "originator-only",
                    "target_state": "originator-and-recipient",
                    "guard_ref": f"{FEATURE_ID}:grant-transition-rule",
                    "effect_event_ref": f"{FEATURE_ID}:no-price-grant-completed",
                },
                {
                    "transition_id": "reject-no-price-grant",
                    "source_state": "originator-only",
                    "target_state": "originator-only",
                    "guard_ref": None,
                    "effect_event_ref": f"{FEATURE_ID}:no-price-grant-rejected",
                },
            ],
        }

    if kind == "Mapping":
        return {
            "description": description,
            "source": f"{FEATURE_ID}:knowledge-artifact-version",
            "target": f"{FEATURE_ID}:solana-artifact-state",
        }

    return dict(body)


def author(target_root: Path) -> list[str]:
    base_spec = BASE_ROOT / "specs" / FEATURE_ID
    target_spec = target_root / "specs" / FEATURE_ID
    target_nodes = target_spec / "nodes"
    target_edges = target_spec / "edges"
    target_nodes.mkdir(parents=True, exist_ok=True)
    target_edges.mkdir(parents=True, exist_ok=True)

    project = load_json(BASE_ROOT / "project.json")
    feature = load_json(base_spec / "feature.json")
    binding = load_json(BASE_ROOT / "binding.json")
    base_admission = load_json(BASE_ADMISSION_PATH)
    binding["binding_id"] = "CA2-BINDING-KEP-SOLANA-DOMAINSPEC-002"
    binding["successor"] = {
        "supersedes_binding": {
            "path": "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/domainspec/binding.json",
            "sha256": sha256_file(BASE_ROOT / "binding.json"),
        },
        "supersedes_source_admission": {
            "decision_id": base_admission.get("decision_id"),
            "path": "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/decisions/domainspec-source-admission-001.json",
            "sha256": sha256_file(BASE_ADMISSION_PATH),
        },
        "migration_reason": "The current DomainSpec v2 parser requires closed typed bodies; preserve admitted Solana meaning while replacing legacy shorthand bodies.",
        "parser": {
            "path": "projects/domainspec-v2/impl/cli/src/input/project-model.ts",
            "sha256": sha256_file(PARSER_PATH),
        },
        "authority_effect": "none",
    }

    outputs: dict[Path, bytes] = {
        target_root / "binding.json": canonical_bytes(binding),
        target_root / "project.json": canonical_bytes(project),
        target_spec / "feature.json": canonical_bytes(feature),
    }

    for node_path in sorted((base_spec / "nodes").glob("*.json")):
        node = load_json(node_path)
        node["body"] = migrate_body(str(node["node_id"]), str(node["kind"]), node["body"])
        outputs[target_nodes / node_path.name] = canonical_bytes(node)

    for edge_path in sorted((base_spec / "edges").glob("*.json")):
        outputs[target_edges / edge_path.name] = edge_path.read_bytes()

    changed: list[str] = []
    for path, content in sorted(outputs.items(), key=lambda item: item[0].as_posix()):
        if not path.exists() or path.read_bytes() != content:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            changed.append(path.relative_to(target_root).as_posix())
    return changed


def check_determinism() -> tuple[bool, list[str]]:
    with tempfile.TemporaryDirectory(prefix="kep-solana-domainspec-002-a-") as left_raw, tempfile.TemporaryDirectory(prefix="kep-solana-domainspec-002-b-") as right_raw:
        left = Path(left_raw)
        right = Path(right_raw)
        author(left)
        author(right)
        left_files = sorted(path.relative_to(left) for path in left.rglob("*") if path.is_file())
        right_files = sorted(path.relative_to(right) for path in right.rglob("*") if path.is_file())
        if left_files != right_files:
            return False, ["generated file sets differ"]
        drift = [path.as_posix() for path in left_files if (left / path).read_bytes() != (right / path).read_bytes()]
        return not drift, drift


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    deterministic, drift = check_determinism()
    if not deterministic:
        print(json.dumps({"result": "fail", "drift": drift, "authority_effect": "none"}, sort_keys=True))
        return 1
    changed = author(SUCCESSOR_ROOT)
    if args.check and changed:
        print(json.dumps({"result": "fail", "changed": changed, "authority_effect": "none"}, sort_keys=True))
        return 1
    print(json.dumps({"result": "pass", "changed": changed, "deterministic": True, "authority_effect": "none"}, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
