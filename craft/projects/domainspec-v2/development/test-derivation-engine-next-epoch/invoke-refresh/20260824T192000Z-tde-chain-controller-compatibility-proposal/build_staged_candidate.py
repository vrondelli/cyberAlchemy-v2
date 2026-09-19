#!/usr/bin/env python3
"""Build an isolated proposal-only TDE @3 postimage set and validation overlay."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
SOURCE_ROOT = PurePosixPath(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2"
)
TARGET_ROOT = PurePosixPath(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
SOURCE_ID = "dsv2-tde-multiformalism-profile-epoch@2"
TARGET_ID = "dsv2-tde-multiformalism-profile-epoch@3"
STAGING = RUN / "staging"
OVERLAY = RUN / "validation" / "repository-overlay"
EVIDENCE_ROOT = PurePosixPath(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "evidence/tde-multiformalism-profile-epoch"
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_ref(repo_relative: str | PurePosixPath, source_root: Path) -> dict[str, Any]:
    value = str(repo_relative)
    path = source_root / value
    data = path.read_bytes()
    return {"path": value, "sha256": sha256_bytes(data), "size_bytes": len(data)}


def staged_path(repo_relative: str | PurePosixPath) -> Path:
    return STAGING / str(repo_relative)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def transform_text(text: str) -> str:
    text = text.replace(str(SOURCE_ROOT), str(TARGET_ROOT))
    text = text.replace(SOURCE_ID, TARGET_ID)
    text = text.replace("exact final @2 candidate", "exact final @3 candidate")
    text = text.replace("final @2 candidate", "final @3 candidate")
    text = text.replace("fresh exact @2 Plan successor", "fresh exact @3 Plan successor")
    text = text.replace("candidate @2", "candidate @3")
    return text


def schema_ref(path: str) -> dict[str, Any]:
    candidate = staged_path(path)
    if candidate.exists():
        return exact_ref(path, STAGING)
    return exact_ref(path, REPO)


def exact_artifact_schema(schema_id: str, title: str, required: list[str], properties: dict[str, Any]) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": schema_id,
        "title": title,
        "type": "object",
        "additionalProperties": False,
        "required": required,
        "properties": properties,
        "$defs": {
            "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
            "exactArtifactRef": {
                "type": "object",
                "additionalProperties": False,
                "required": ["path", "sha256", "size_bytes"],
                "properties": {
                    "path": {"type": "string", "minLength": 1},
                    "sha256": {"$ref": "#/$defs/sha256"},
                    "size_bytes": {"type": "integer", "minimum": 0},
                },
            },
        },
    }


def build_custom_schemas() -> list[str]:
    base = TARGET_ROOT / "plan/work-pack/shared/schemas"
    continuation_path = str(base / "tde-continuation-state.schema.json")
    router_path = str(base / "tde-continuation-router-verification.schema.json")
    exact_ref_def = {"$ref": "#/$defs/exactArtifactRef"}
    continuation_schema = exact_artifact_schema(
        "https://domainspec.dev/schemas/tde/continuation-state/1-0-0",
        "TdeContinuationState",
        [
            "schema_version", "work_pack_id", "completed_swu",
            "invoke_closeout_receipt_ref", "router_verification_receipt_ref",
            "next_swu", "next_owner", "execution_started", "authority_effect",
        ],
        {
            "schema_version": {"const": "domainspec-v2.tde-continuation-state/v1"},
            "work_pack_id": {"type": "string", "minLength": 1},
            "completed_swu": {"type": "string", "minLength": 1},
            "invoke_closeout_receipt_ref": exact_ref_def,
            "router_verification_receipt_ref": exact_ref_def,
            "next_swu": {"type": ["string", "null"], "minLength": 1},
            "next_owner": {"type": ["string", "null"], "minLength": 1},
            "execution_started": {"const": False},
            "authority_effect": {"const": "none"},
        },
    )
    router_schema = exact_artifact_schema(
        "https://domainspec.dev/schemas/tde/continuation-router-verification/1-0-0",
        "TdeContinuationRouterVerification",
        [
            "schema_version", "receipt_id", "work_pack_id", "completed_swu",
            "verdict", "returned_next_route", "successor_executed", "authority_effect",
        ],
        {
            "schema_version": {"const": "domainspec-v2.tde-continuation-router-verification/v1"},
            "receipt_id": {"type": "string", "minLength": 1},
            "work_pack_id": {"type": "string", "minLength": 1},
            "completed_swu": {"type": "string", "minLength": 1},
            "verdict": {"enum": ["pass", "block"]},
            "returned_next_route": {"type": ["string", "null"], "minLength": 1},
            "successor_executed": {"const": False},
            "authority_effect": {"const": "none"},
        },
    )
    write_json(staged_path(continuation_path), continuation_schema)
    write_json(staged_path(router_path), router_schema)
    return [continuation_path, router_path]


def safe_routes(execution_entry: dict[str, Any]) -> list[dict[str, Any]]:
    routes = execution_entry["execution_policy"]["allowed_routes"]
    for route in routes:
        unit = route["frontier_swu"]
        route["mode"] = "execute"
        route["target"] = f"plan/work-pack/tasks/TASK-{unit}.md#{unit}"
    routes_digest = sha256_bytes(
        json.dumps(routes, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    execution_entry["execution_policy"]["allowed_routes_digest"] = routes_digest
    return routes


def build_execution_contracts(
    swu_manifest: dict[str, Any],
    audit_config: dict[str, Any],
    routes: list[dict[str, Any]],
    custom_schema_paths: list[str],
) -> dict[str, Any]:
    binding_by_unit = {item["unit_id"]: item for item in audit_config["execution_bindings"]}
    unit_by_id = {item["swu_id"]: item for item in swu_manifest["units"]}
    precloseout_schema = schema_ref(
        "arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json"
    )
    terminal_schema = schema_ref(
        "arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json"
    )
    owner_schema = schema_ref(
        "arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json"
    )
    continuation_schema = schema_ref(custom_schema_paths[0])
    router_schema = schema_ref(custom_schema_paths[1])
    units: list[dict[str, Any]] = []
    for unit_id in swu_manifest["canonical_order"]:
        source = unit_by_id[unit_id]
        binding = binding_by_unit[unit_id]
        terminal_path = binding["execution_outputs"][-1]
        unit_evidence_dir = str(PurePosixPath(terminal_path).parent)
        closeout_dir = str(EVIDENCE_ROOT / "closeout" / unit_id)
        precloseout_path = f"{unit_evidence_dir}/PRECLOSEOUT-EXECUTION-RECEIPT.json"
        target_inventory_path = f"{closeout_dir}/TARGET-INVENTORY.json"
        owner_receipt_path = f"{closeout_dir}/INVOKE-REFRESH-RECEIPT.json"
        continuation_state_path = f"{closeout_dir}/CONTINUATION-STATE.json"
        router_receipt_path = f"{closeout_dir}/CONTINUATION-ROUTER-VERIFICATION.json"
        dependencies = list(source["dependencies"])
        canonical_successor = source["successor"]
        if canonical_successor == "__complete__":
            canonical_successor = None
        selection_requires = ["exact-rondelli-plan-acceptance"] + [
            f"{dependency}-invoke-closeout-pass" for dependency in dependencies
        ]
        contract = {
            "unit_id": unit_id,
            "task_id": binding["task_id"],
            "swu_id": binding["swu_id"],
            "lifecycle_owner": binding["lifecycle_owner"],
            "authority_class": binding["authority_class"],
            "publication_class": binding["publication_class"],
            "attempt_contract": binding["attempt_contract"],
            "dependencies": dependencies,
            "canonical_successor": canonical_successor,
            "command": binding["command"],
            "validation_contracts": binding["validation_contracts"],
            "material_writes": binding["material_writes"],
            "execution_outputs": binding["execution_outputs"],
            "allowed_writes": binding["allowed_writes"],
            "gate_contract": {
                "selection_requires": selection_requires,
                "execution_requires": [
                    "exact-unit-selection-receipt",
                    "task-session-single-use-mutation-admission",
                ],
                "on_unsatisfied": "block-before-mutation",
                "completion_rule": "All declared validation commands pass, Task Session exclusively creates its terminal receipt, Invoke Refresh closeout joins, and the successor remains unexecuted.",
            },
            "terminal_modes": ["pass", "flag", "block"],
            "terminal_write_policy": {
                "create_mode": "exclusive-create",
                "first_terminal": "preserve-never-overwrite",
                "successor_execution": False,
            },
            "receipt_contract": {
                "receipt_profile": "precloseout-execution-v1",
                "path": terminal_path,
                "precloseout_execution_receipt_path": precloseout_path,
                "precloseout_execution_schema_ref": precloseout_schema,
                "final_terminal_schema_ref": terminal_schema,
            },
            "closeout_contract": {
                "route": "invoke:refresh:apply-approved",
                "target_inventory_path": target_inventory_path,
                "target_inventory": [
                    target_inventory_path,
                    owner_receipt_path,
                    continuation_state_path,
                    router_receipt_path,
                ],
                "allowed_delta_classes": [
                    "evidence_added", "status_changed", "blocker_resolved", "route_changed"
                ],
                "allowed_delta_policy": "exact-target-inventory-only",
                "validation_commands": [
                    {
                        "command_id": f"{unit_id.lower()}-closeout-owner-json",
                        "argv": ["python3", "-m", "json.tool", owner_receipt_path],
                        "cwd": ".",
                        "timeout_seconds": 60,
                        "max_output_bytes": 1048576,
                    },
                    {
                        "command_id": f"{unit_id.lower()}-closeout-continuity-json",
                        "argv": ["python3", "-m", "json.tool", continuation_state_path],
                        "cwd": ".",
                        "timeout_seconds": 60,
                        "max_output_bytes": 1048576,
                    },
                ],
                "expected_owner_receipt": owner_receipt_path,
                "expected_owner_receipt_schema_ref": owner_schema,
                "continuation_state_path": continuation_state_path,
                "continuation_state_schema_ref": continuation_schema,
                "continuation_router_verification_receipt": router_receipt_path,
                "continuation_router_schema_ref": router_schema,
                "continuation_policy": "emit-cursor-never-execute-successor",
            },
            "claim_ceiling": source["claim_ceiling"],
        }
        units.append(contract)
    return {
        "schema_version": "domainspec-v2.tde-execution-contracts/v1",
        "candidate_id": TARGET_ID,
        "work_pack_id": swu_manifest["work_pack_id"],
        "execution_contracts": {
            "admission_timing": "selected-unit-at-task-session",
            "authority_effect": "none",
            "mutation_ready": False,
            "execution_policy": {"allowed_routes": routes},
            "units": units,
        },
        "claim_ceiling": "Planning and structural controller-compatibility contract only; no selection, mutation, execution, merge, promotion, publication, release, or deployment authority.",
        "authority_effect": "none",
    }


def update_exact_refs(value: Any) -> None:
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes"} <= set(value):
            path = value["path"]
            target = staged_path(path)
            source = target if target.exists() else REPO / path
            if source.is_file():
                data = source.read_bytes()
                value["sha256"] = sha256_bytes(data)
                value["size_bytes"] = len(data)
        for child in value.values():
            update_exact_refs(child)
    elif isinstance(value, list):
        for child in value:
            update_exact_refs(child)


def build_overlay(audit_config: dict[str, Any]) -> None:
    if OVERLAY.exists():
        shutil.rmtree(OVERLAY)
    (OVERLAY / ".git").mkdir(parents=True, exist_ok=True)
    (OVERLAY / ".git" / "PROPOSAL-OVERLAY").write_text(
        "Private validation overlay; not a Git repository and not a canonical target.\n",
        encoding="utf-8",
    )
    shutil.copytree(staged_path(TARGET_ROOT), OVERLAY / str(TARGET_ROOT), dirs_exist_ok=True)

    refs: set[str] = set()

    def collect(value: Any) -> None:
        if isinstance(value, dict):
            if {"path", "sha256", "size_bytes"} <= set(value) and isinstance(value["path"], str):
                refs.add(value["path"])
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(audit_config)
    execution_contracts = json.loads(
        staged_path(TARGET_ROOT / "plan/work-pack/shared/EXECUTION-CONTRACTS.json").read_text()
    )
    collect(execution_contracts)
    for ref in sorted(refs):
        destination = OVERLAY / ref
        if destination.exists():
            continue
        source = REPO / ref
        if source.is_file():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    for binding in audit_config["execution_bindings"]:
        (OVERLAY / binding["command"]["cwd"]).mkdir(parents=True, exist_ok=True)
        for command in binding["validation_contracts"]:
            (OVERLAY / command["cwd"]).mkdir(parents=True, exist_ok=True)


def main() -> None:
    if STAGING.exists():
        shutil.rmtree(STAGING)
    if OVERLAY.exists():
        shutil.rmtree(OVERLAY)
    inventory_path = REPO / str(SOURCE_ROOT / "acceptance/TARGET-INVENTORY.json")
    source_inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    source_targets = source_inventory["entries"]
    for entry in source_targets:
        source_rel = PurePosixPath(entry["path"])
        relative = source_rel.relative_to(SOURCE_ROOT)
        target_rel = TARGET_ROOT / relative
        data = (REPO / str(source_rel)).read_bytes()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError as error:
            raise SystemExit(f"non-text material target is unsupported: {source_rel}: {error}")
        destination = staged_path(target_rel)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(transform_text(text), encoding="utf-8")

    custom_schemas = build_custom_schemas()
    execution_entry_path = staged_path(TARGET_ROOT / "plan/EXECUTION-ENTRY.json")
    execution_entry = json.loads(execution_entry_path.read_text(encoding="utf-8"))
    routes = safe_routes(execution_entry)
    write_json(execution_entry_path, execution_entry)

    swu_path = staged_path(TARGET_ROOT / "plan/work-pack/shared/SWU-MANIFEST.json")
    swu_manifest = json.loads(swu_path.read_text(encoding="utf-8"))
    swu_manifest["candidate_id"] = TARGET_ID
    write_json(swu_path, swu_manifest)

    audit_path = staged_path(TARGET_ROOT / "readiness/audit-config.json")
    audit_config = json.loads(audit_path.read_text(encoding="utf-8"))
    audit_config["execution_policy"]["allowed_routes"] = routes
    audit_config["execution_policy"]["allowed_routes_digest"] = execution_entry["execution_policy"]["allowed_routes_digest"]
    audit_config["audit_id"] = "DS-TDE-EPOCH-READINESS-20260824T192000Z"

    contracts_path = TARGET_ROOT / "plan/work-pack/shared/EXECUTION-CONTRACTS.json"
    contracts = build_execution_contracts(swu_manifest, audit_config, routes, custom_schemas)
    write_json(staged_path(contracts_path), contracts)
    contracts_ref = exact_ref(contracts_path, STAGING)
    nested = contracts["execution_contracts"]
    schema_bindings = {
        "precloseout_execution_schema_ref": (
            nested["units"][0]["receipt_contract"]["precloseout_execution_schema_ref"],
            "task-session",
        ),
        "expected_owner_receipt_schema_ref": (
            nested["units"][0]["closeout_contract"]["expected_owner_receipt_schema_ref"],
            "invoke",
        ),
        "final_terminal_schema_ref": (
            nested["units"][0]["receipt_contract"]["final_terminal_schema_ref"],
            "task-session",
        ),
        "continuity_schema_ref": (
            nested["units"][0]["closeout_contract"]["continuation_state_schema_ref"],
            "invoke",
        ),
        "continuation_router_schema_ref": (
            nested["units"][0]["closeout_contract"]["continuation_router_schema_ref"],
            "continuation-router",
        ),
    }
    audit_config["task_session_closeout_contracts"] = []
    for unit_id in swu_manifest["canonical_order"]:
        typed: dict[str, Any] = {
            "unit_id": unit_id,
            "receipt_profile": "precloseout-execution-v1",
            "declared_owner_receipt_schema_identity": "invoke.precloseout-refresh-closeout-receipt.v1",
        }
        for field, (artifact_ref, owner_ref) in schema_bindings.items():
            typed[field] = {
                "artifact_ref": artifact_ref,
                "binding_id": f"{field.removesuffix('_ref').replace('_', '-')}-{unit_id.lower()}",
                "owner_ref": owner_ref,
                "selector": "",
            }
        audit_config["task_session_closeout_contracts"].append(typed)
    for index, closeout in enumerate(audit_config["closeout_bindings"]):
        closeout["owner_receipt_contract_ref"] = {
            "artifact_ref": contracts_ref,
            "binding_id": f"closeout-contract-{closeout['unit_id'].lower()}",
            "owner_ref": "invoke",
            "selector": f"/execution_contracts/units/{index}/closeout_contract",
        }
        closeout["allowed_delta_policy_ref"] = {
            "artifact_ref": contracts_ref,
            "binding_id": f"closeout-deltas-{closeout['unit_id'].lower()}",
            "owner_ref": "invoke",
            "selector": f"/execution_contracts/units/{index}/closeout_contract/allowed_delta_classes",
        }
    update_exact_refs(audit_config)
    write_json(audit_path, audit_config)

    # The audit config hash is not embedded into the material target set. Re-read
    # after final serialization before creating the isolated canonical-path overlay.
    build_overlay(audit_config)

    generated = sorted(
        str(path.relative_to(STAGING)) for path in STAGING.rglob("*") if path.is_file()
    )
    result = {
        "schema_version": "domainspec-v2.tde-chain-compatibility-build/v1",
        "source_candidate_id": SOURCE_ID,
        "source_candidate_root": str(SOURCE_ROOT),
        "proposed_candidate_id": TARGET_ID,
        "proposed_candidate_root": str(TARGET_ROOT),
        "source_material_count": len(source_targets),
        "new_contract_count": 1,
        "new_schema_count": len(custom_schemas),
        "staged_material_count": len(generated),
        "staged_material_paths": generated,
        "canonical_target_created": False,
        "overlay_root": str(OVERLAY.relative_to(REPO)),
        "authority_effect": "none",
    }
    write_json(RUN / "validation" / "BUILD-RESULT.json", result)
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
