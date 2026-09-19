#!/usr/bin/env python3
"""Build proposal-only postimages for the FormalClaim Lean/EVF Plan refresh.

The script never writes to the accepted Plan.  It emits exact target postimages
and a validation-only rebased audit configuration below this Refresh run root.
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
PLAN_REL = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/"
    "invoke-plan/20260824T165704Z-formalclaim-lean-evf-implementation"
)
PLAN = REPO / PLAN_REL
STAGED_REL = RUN.relative_to(REPO) / "staged-targets"
STAGED = REPO / STAGED_REL
VALIDATION_REL = RUN.relative_to(REPO) / "validation/input"
VALIDATION = REPO / VALIDATION_REL

SWU1_RECEIPT_REL = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
    "formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json"
)

SCHEMA_REFS = {
    "precloseout_execution_schema_ref": Path(
        "arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json"
    ),
    "expected_owner_receipt_schema_ref": Path(
        "arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json"
    ),
    "final_terminal_schema_ref": Path(
        "arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json"
    ),
    "continuity_schema_ref": Path("arcanum/arcana/task-session/continuity.schema.json"),
    "continuation_router_schema_ref": Path(
        "arcanum/arcana/continuation-router/schemas/continuation-route.schema.json"
    ),
}


def bytes_digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": bytes_digest(data), "size_bytes": len(data)}


def exact_bytes(path: Path, data: bytes) -> dict[str, object]:
    return {"path": path.as_posix(), "sha256": bytes_digest(data), "size_bytes": len(data)}


def binding(binding_id: str, owner: str, path: Path, selector: str = "") -> dict[str, object]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner,
        "artifact_ref": exact(path),
        "selector": selector,
    }


def write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def typed_unit_contracts(legacy: dict[str, object]) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for unit in legacy["units"]:
        swu = unit["swu_id"]
        typed: dict[str, object] = {
            "unit_id": swu,
            "receipt_profile": "precloseout-execution-v1",
            "declared_owner_receipt_schema_identity": (
                "invoke.precloseout-refresh-closeout-receipt.v1"
            ),
        }
        for field, schema_path in SCHEMA_REFS.items():
            typed[field] = binding(
                f"{swu.lower()}-{field.replace('_ref', '').replace('_', '-')}",
                "invoke" if field == "expected_owner_receipt_schema_ref" else (
                    "continuation-router" if field == "continuation_router_schema_ref" else "task-session"
                ),
                schema_path,
            )
        result.append(typed)
    return result


def build_closeout_postimage(legacy: dict[str, object]) -> dict[str, object]:
    return {
        "schema_version": "domainspec-v2.task-session-closeout-contracts/v2",
        "work_pack_id": legacy["work_pack_id"],
        "common": legacy["common"],
        "task_session_closeout_contracts": typed_unit_contracts(legacy),
        "continuity_policy": {
            "completed_prefix": ["SWU-FCL-001"],
            "current_cursor": "SWU-FCL-002",
            "completion_selector": "/result",
            "joined_closeout_selector_required_by_current_wpra": (
                "/lifecycle_owner_validation/status"
            ),
            "joined_closeout_selector_present_in_terminal_receipt": (
                "/closeout_join/joined_owner_receipts/0/result"
            ),
            "selector_compatibility": "blocked-current-wpra-contract-defect",
        },
        "authority_effect": "none",
    }


def build_audit_bindings_postimage() -> dict[str, object]:
    value = json.loads((PLAN / "readiness/AUDIT-BINDINGS.json").read_text())
    value["continuity"] = {
        "cursor": "SWU-FCL-002",
        "equivalence": (
            "Only SWU-FCL-001 is completed and joined; the next unexecuted canonical "
            "successor is SWU-FCL-002. SWU-FCL-002 through SWU-FCL-014 remain uncompleted."
        ),
        "verification": "SWU-FCL-002",
    }
    value["status"]["chain"] = "started-one-unit-complete"
    return value


def replace_audit_binding_refs(value: object, ref: dict[str, object]) -> None:
    if isinstance(value, dict):
        artifact = value.get("artifact_ref")
        if isinstance(artifact, dict) and artifact.get("path") == (
            PLAN_REL / "readiness/AUDIT-BINDINGS.json"
        ).as_posix():
            value["artifact_ref"] = copy.deepcopy(ref)
        for child in value.values():
            replace_audit_binding_refs(child, ref)
    elif isinstance(value, list):
        for child in value:
            replace_audit_binding_refs(child, ref)


def target_config(
    accepted: dict[str, object],
    target_audit_ref: dict[str, object],
    typed_contracts: list[dict[str, object]],
) -> dict[str, object]:
    value = copy.deepcopy(accepted)
    replace_audit_binding_refs(value, target_audit_ref)
    value["task_session_closeout_contracts"] = typed_contracts
    receipt_ref = exact(SWU1_RECEIPT_REL)
    value["continuity_projection"] = {
        "cursor": "SWU-FCL-002",
        "completed_unit_receipt_refs": [
            {
                "binding_id": "completed-SWU-FCL-001",
                "owner_ref": "task-session",
                "artifact_ref": receipt_ref,
                "selector": "/result",
            }
        ],
        "joined_closeout_receipt_refs": [
            {
                "binding_id": "joined-closeout-SWU-FCL-001",
                "owner_ref": "task-session",
                "artifact_ref": receipt_ref,
                "selector": "/lifecycle_owner_validation/status",
            }
        ],
        "projected_next_successor": {
            "unit_id": "SWU-FCL-002",
            "canonical_successor_ref": {
                "binding_id": "canonical-frontier",
                "owner_ref": "invoke",
                "artifact_ref": target_audit_ref,
                "selector": "/continuity/cursor",
            },
            "projection_owner_ref": "work-pack-readiness-audit",
            "equivalence_validator_ref": {
                "binding_id": "continuity-equivalence",
                "owner_ref": "work-pack-readiness-audit",
                "artifact_ref": target_audit_ref,
                "selector": "/continuity/equivalence",
            },
            "continuation_router_verification_receipt_ref": {
                "binding_id": "continuation-frontier-verification",
                "owner_ref": "invoke",
                "artifact_ref": target_audit_ref,
                "selector": "/continuity/verification",
            },
            "authority_effect": "none",
        },
    }
    return value


def generator_postimage(source: str) -> str:
    marker = 'TERMINAL_VALIDATOR = Path("arcanum/arcana/task-session/scripts/plan-once-material-controller.py")\n'
    addition = marker + (
        'PRECLOSEOUT_SCHEMA = Path("arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json")\n'
        'OWNER_CLOSEOUT_SCHEMA = Path("arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json")\n'
        'CONTINUITY_SCHEMA = Path("arcanum/arcana/task-session/continuity.schema.json")\n'
        'CONTINUATION_SCHEMA = Path("arcanum/arcana/continuation-router/schemas/continuation-route.schema.json")\n'
        'SWU1_RECEIPT = Path("projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json")\n'
    )
    source = source.replace(marker, addition)
    source = source.replace("    expected = []\n", "    expected = []\n    typed_closeouts = []\n")
    loop_marker = "        closeouts.append({\n"
    typed_append = (
        "        typed_closeouts.append({\n"
        "            'unit_id': swu,\n"
        "            'receipt_profile': 'precloseout-execution-v1',\n"
        "            'precloseout_execution_schema_ref': binding(f'{swu.lower()}-precloseout-execution-schema', 'task-session', PRECLOSEOUT_SCHEMA, ''),\n"
        "            'expected_owner_receipt_schema_ref': binding(f'{swu.lower()}-owner-closeout-schema', 'invoke', OWNER_CLOSEOUT_SCHEMA, ''),\n"
        "            'declared_owner_receipt_schema_identity': 'invoke.precloseout-refresh-closeout-receipt.v1',\n"
        "            'final_terminal_schema_ref': binding(f'{swu.lower()}-final-terminal-schema', 'task-session', TERMINAL_SCHEMA, ''),\n"
        "            'continuity_schema_ref': binding(f'{swu.lower()}-continuity-schema', 'task-session', CONTINUITY_SCHEMA, ''),\n"
        "            'continuation_router_schema_ref': binding(f'{swu.lower()}-continuation-router-schema', 'continuation-router', CONTINUATION_SCHEMA, ''),\n"
        "        })\n"
    )
    source = source.replace(loop_marker, typed_append + loop_marker)
    source = source.replace(
        '        "closeout_bindings": closeouts,\n',
        '        "closeout_bindings": closeouts,\n        "task_session_closeout_contracts": typed_closeouts,\n',
    )
    old = (
        '        "continuity_projection": {\n'
        '            "cursor":"SWU-FCL-001","completed_unit_receipt_refs":[],"joined_closeout_receipt_refs":[],\n'
        '            "projected_next_successor": {\n'
        '                "unit_id":"SWU-FCL-001",\n'
    )
    new = (
        '        "continuity_projection": {\n'
        '            "cursor":"SWU-FCL-002",\n'
        '            "completed_unit_receipt_refs":[{"binding_id":"completed-SWU-FCL-001","owner_ref":"task-session","artifact_ref":exact(SWU1_RECEIPT),"selector":"/result"}],\n'
        '            "joined_closeout_receipt_refs":[{"binding_id":"joined-closeout-SWU-FCL-001","owner_ref":"task-session","artifact_ref":exact(SWU1_RECEIPT),"selector":"/lifecycle_owner_validation/status"}],\n'
        '            "projected_next_successor": {\n'
        '                "unit_id":"SWU-FCL-002",\n'
    )
    if old not in source:
        raise RuntimeError("continuity generator marker not found")
    return source.replace(old, new)


def main() -> int:
    legacy = json.loads((PLAN / "work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json").read_text())
    closeout_value = build_closeout_postimage(legacy)
    closeout_data = json_bytes(closeout_value)
    closeout_target_rel = PLAN_REL / "work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json"
    write(STAGED / "work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json", closeout_data)

    audit_value = build_audit_bindings_postimage()
    audit_data = json_bytes(audit_value)
    audit_target_rel = PLAN_REL / "readiness/AUDIT-BINDINGS.json"
    write(STAGED / "readiness/AUDIT-BINDINGS.json", audit_data)
    target_audit_ref = exact_bytes(audit_target_rel, audit_data)

    accepted_config = json.loads((PLAN / "readiness/audit-config.json").read_text())
    config_value = target_config(
        accepted_config,
        target_audit_ref,
        closeout_value["task_session_closeout_contracts"],
    )
    config_data = json_bytes(config_value)
    write(STAGED / "readiness/audit-config.json", config_data)

    generator_source = (PLAN / "readiness/generate_audit_config.py").read_text()
    generator_data = generator_postimage(generator_source).encode()
    write(STAGED / "readiness/generate_audit_config.py", generator_data)

    # Rebase only the self-referential AUDIT-BINDINGS refs for audit execution.
    validation_audit_rel = STAGED_REL / "readiness/AUDIT-BINDINGS.json"
    validation_audit_ref = exact_bytes(validation_audit_rel, audit_data)
    validation_config = target_config(
        accepted_config,
        validation_audit_ref,
        closeout_value["task_session_closeout_contracts"],
    )
    write(VALIDATION / "audit-config.rebased.json", json_bytes(validation_config))

    legacy_probe = copy.deepcopy(validation_config)
    legacy_probe.pop("task_session_closeout_contracts", None)
    write(VALIDATION / "legacy-flat-closeout-probe.json", json_bytes(legacy_probe))

    modern_selector_probe = copy.deepcopy(validation_config)
    modern_selector_probe["continuity_projection"]["joined_closeout_receipt_refs"][0][
        "selector"
    ] = "/closeout_join/joined_owner_receipts/0/result"
    write(VALIDATION / "modern-joined-closeout-selector-probe.json", json_bytes(modern_selector_probe))

    inventory = {
        "schema_version": "invoke.refresh-target-inventory/v1",
        "proposal_only": True,
        "accepted_plan_candidate_id": "DS-FORMALCLAIM-LEAN-EVF-PLAN@20260824T165704Z",
        "targets": [],
    }
    for rel, data, reason in [
        (closeout_target_rel, closeout_data, "Replace legacy flat closeout rows with 14 typed mutation-capable contracts."),
        (audit_target_rel, audit_data, "Project only SWU-FCL-001 complete and advance the unexecuted cursor to SWU-FCL-002."),
        (PLAN_REL / "readiness/generate_audit_config.py", generator_data, "Generate typed closeout contracts and historical continuity on every readiness regeneration."),
        (PLAN_REL / "readiness/audit-config.json", config_data, "Freeze the exact typed contract projection; current WPRA still blocks on its legacy continuity selector."),
    ]:
        before = (REPO / rel).read_bytes()
        inventory["targets"].append(
            {
                "path": rel.as_posix(),
                "before_sha256": bytes_digest(before),
                "before_size_bytes": len(before),
                "after_sha256": bytes_digest(data),
                "after_size_bytes": len(data),
                "reason": reason,
            }
        )
    write(RUN / "TARGET-INVENTORY.json", json_bytes(inventory))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
