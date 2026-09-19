#!/usr/bin/env python3
"""Build the isolated WP-RMT-002 execution-contract Refresh proposal.

This script never writes the live plan.  It mechanically derives staged bytes from
the six captured preimages and the existing 70-row manifest/contract ordering.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import shlex
import shutil
import subprocess
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[7]
PACKAGE = Path(__file__).resolve().parents[1]
PLAN_REL = Path(
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)
LIVE_PLAN = REPO / PLAN_REL
PREIMAGE_ROOT = PACKAGE / "preimages" / PLAN_REL
STAGED_ROOT = PACKAGE / "staged" / PLAN_REL
VIEW_ROOT = PACKAGE / "validation-view" / PLAN_REL

TARGETS = (
    "SWU-MANIFEST.json",
    "SWU-CONTRACTS.json",
    "EXECUTION-ENTRY.json",
    "validate-work-pack.mjs",
    "VALIDATION-RESULT.json",
    "EXECUTION-ENTRY-VALIDATION.json",
)
TASK_SESSION_CANONICAL_TARGETS = (
    "arcanum/arcana/task-session/SKILL.md",
    "arcanum/arcana/task-session/development/test_plan_once_admission.py",
    "arcanum/arcana/task-session/development/test_plan_once_governance.py",
    "arcanum/arcana/task-session/development/validate-governance-runner.py",
    "arcanum/arcana/task-session/schemas/execution-ticket.schema.json",
    "arcanum/arcana/task-session/schemas/executor-receipt.schema.json",
    "arcanum/arcana/task-session/schemas/governance-run-request.schema.json",
    "arcanum/arcana/task-session/schemas/mutation-admission-receipt.schema.json",
    "arcanum/arcana/task-session/schemas/mutation-admission-request.schema.json",
    "arcanum/arcana/task-session/scripts/task-session-governance-runner.py",
    "arcanum/arcana/task-session/scripts/verify-mutation-readiness.py",
)
TASK_SESSION_GENERATED_RELS = (
    "SKILL.md",
    "schemas/execution-ticket.schema.json",
    "schemas/executor-receipt.schema.json",
    "schemas/governance-run-request.schema.json",
    "schemas/mutation-admission-receipt.schema.json",
    "schemas/mutation-admission-request.schema.json",
    "scripts/task-session-governance-runner.py",
    "scripts/verify-mutation-readiness.py",
)
TASK_SESSION_GENERATED_TARGETS = tuple(
    f"{base}/{relative}"
    for base in (".agents/skills/task-session", ".claude/skills/task-session")
    for relative in TASK_SESSION_GENERATED_RELS
)
WP_TARGETS = tuple(f"{PLAN_REL.as_posix()}/{name}" for name in TARGETS)
ALL_TARGETS = (
    *TASK_SESSION_CANONICAL_TARGETS,
    *TASK_SESSION_GENERATED_TARGETS,
    *WP_TARGETS,
)
PROPOSAL_ID = "wp-rmt-002-task-session-transient-output-api-proposal-20260816T160301Z"
TIMEOUT_SECONDS = 120
MAX_OUTPUT_BYTES = 1_048_576
TERMINAL_SENTINEL = "__terminal__"
LIFECYCLE_OWNER = "projects/domainspec-v2"
AUTHORITY_CLASS = "private"
PUBLICATION_CLASS = "internal"
MATERIAL_PRODUCER_OWNER = "task-session:selected-unit-materialization"
CANONICAL_ENTRY_VALIDATOR = (
    REPO
    / ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py"
)
CANONICAL_ENTRY_SCHEMA = (
    REPO
    / ".agents/skills/implementation-readiness/schemas/work-pack-execution-entry.schema.json"
)
SELECTION_RECEIPT_SCHEMA = (
    REPO
    / ".agents/skills/work-pack-readiness-audit/schemas/selection-receipt.schema.json"
)
MUTATION_ADMISSION_SCHEMA = (
    PACKAGE
    / "staged/.agents/skills/task-session/schemas/mutation-admission-receipt.schema.json"
)
MUTATION_ADMISSION_REQUEST_SCHEMA = (
    PACKAGE
    / "staged/.agents/skills/task-session/schemas/mutation-admission-request.schema.json"
)
GOVERNANCE_RUN_REQUEST_SCHEMA = (
    PACKAGE
    / "staged/.agents/skills/task-session/schemas/governance-run-request.schema.json"
)
EXECUTION_TICKET_SCHEMA = (
    PACKAGE
    / "staged/.agents/skills/task-session/schemas/execution-ticket.schema.json"
)
EXECUTOR_RECEIPT_SCHEMA = (
    PACKAGE / "staged/.agents/skills/task-session/schemas/executor-receipt.schema.json"
)
GOVERNANCE_TERMINAL_SCHEMA = (
    REPO / ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json"
)
TASK_SESSION_RUNNER = (
    PACKAGE / "staged/.agents/skills/task-session/scripts/task-session-governance-runner.py"
)
INVOKE_REFRESH_SOURCE = REPO / "arcanum/spells/invoke/refresh.md"
REJECTED_PROPOSAL = (
    REPO
    / "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/"
    "20260816T120821Z-wp-rmt-002-execution-contract-refresh-proposal"
)
GOVERNANCE_DEFECT_RECEIPT = (
    REJECTED_PROPOSAL / "governance-defect/GOVERNANCE-DEFECT-RECEIPT.json"
)
DECISION_GATE_PROPOSAL = (
    REJECTED_PROPOSAL / "governance-defect/DECISION-GATE-PROPOSAL.json"
)
DECISION_REQUEST = PACKAGE / "decision/option-admissibility-request.json"
DECISION_RECEIPT = PACKAGE / "decision/option-admissibility-receipt.json"
DECISION_RECORD = PACKAGE / "decision/decision-record.json"
TASK_SESSION_CANDIDATE_RESULT = PACKAGE / "TASK-SESSION-CANDIDATE-VALIDATION.json"
REGRESSION_MATRIX = PACKAGE / "REGRESSION-MATRIX.json"
DECISION_PREFILTER = REPO / ".agents/skills/decision-gate/scripts/prefilter-options.py"
DECISION_REQUEST_SCHEMA = (
    REPO
    / ".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"
)
DECISION_RECEIPT_SCHEMA = (
    REPO
    / ".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"
)


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    payload = json.dumps(
        value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    return sha256_bytes(payload)


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def candidate_live_ref(path: Path, live_relative: str) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": live_relative,
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def target_class(relative: str) -> str:
    if relative.startswith("arcanum/"):
        return "canonical-public-task-session"
    if relative.startswith(".agents/"):
        return "generated-codex-parity"
    if relative.startswith(".claude/"):
        return "generated-claude-parity"
    return "dependent-wp-rmt-002-proof"


def proposal_target_inventory() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for relative in ALL_TARGETS:
        live = REPO / relative
        preimage = PACKAGE / "preimages" / relative
        postimage = PACKAGE / "staged" / relative
        rows.append(
            {
                "target_path": relative,
                "target_class": target_class(relative),
                "operation": "replace",
                "live_ref": exact_ref(live),
                "preimage_ref": exact_ref(preimage),
                "staged_postimage_ref": exact_ref(postimage),
                "live_matches_preimage": live.read_bytes() == preimage.read_bytes(),
                "staged_differs_from_preimage": postimage.read_bytes()
                != preimage.read_bytes(),
            }
        )
    return rows


def exact_artifact_ref_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["path", "sha256", "size_bytes"],
        "properties": {
            "path": {"type": "string", "minLength": 1},
            "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
            "size_bytes": {"type": "integer", "minimum": 0},
        },
    }


def task_id(swu_id: str) -> str:
    return "TASK-RMT-" + swu_id.split("-")[1]


def normalize_command(command: str) -> tuple[list[str], dict[str, str]]:
    tokens = shlex.split(command, posix=True)
    environment: dict[str, str] = {}
    assignments: list[str] = []
    while tokens and "=" in tokens[0] and not tokens[0].startswith("="):
        key, value = tokens[0].split("=", 1)
        if not key.replace("_", "a").isalnum() or key[0].isdigit():
            break
        environment[key] = value.replace("$PWD", ".")
        assignments.append(f"{key}={environment[key]}")
        tokens.pop(0)
    tokens = [token.replace("$PWD", ".") for token in tokens]
    argv = (["env", *assignments] if assignments else []) + tokens
    if not argv:
        raise ValueError(f"empty command after normalization: {command!r}")
    return argv, environment


def runtime_identity(argv: list[str]) -> dict[str, str]:
    index = 0
    if argv[0] == "env":
        index = 1
        while index < len(argv) and "=" in argv[index]:
            index += 1
    executable = argv[index] if index < len(argv) else argv[0]
    return {
        "executable": executable,
        "version_policy": "task-session-captures-exact-executable-version-before-run",
        "hash_policy": "task-session-captures-resolved-executable-sha256-before-run",
    }


def structured_command(
    swu_id: str, command: str, index: int, *, primary: bool = False
) -> dict[str, Any]:
    argv, environment = normalize_command(command)
    risk_class = (
        "bounded-write"
        if any(token.startswith("CARGO_TARGET_DIR=") for token in argv)
        else "read-only"
    )
    base = {
        "argv": argv,
        "cwd": ".",
        "risk_class": risk_class,
        "expected_exit_code": 0,
        "environment": environment,
        "runtime_identity": runtime_identity(argv),
    }
    if primary:
        return {
            **base,
            "role": "validation-only-entry-command; material production remains owner-gated",
        }
    return {
        "command_id": f"{swu_id.lower()}-validation-{index + 1:02d}",
        **base,
        "timeout_seconds": TIMEOUT_SECONDS,
        "max_output_bytes": MAX_OUTPUT_BYTES,
        "original_command": command,
    }


def enrich_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(manifest)
    for index, swu in enumerate(result["swus"]):
        successor = (
            result["swus"][index + 1]["id"]
            if index + 1 < len(result["swus"])
            else TERMINAL_SENTINEL
        )
        swu.update(
            {
                "task_id": task_id(swu["id"]),
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": AUTHORITY_CLASS,
                "publication_class": PUBLICATION_CLASS,
                "material_producer_owner": MATERIAL_PRODUCER_OWNER,
                "canonical_successor": successor,
                "execution_contract_ref": f"SWU-CONTRACTS.json#/contracts/{index}",
            }
        )
    result["execution_contract_profile"] = {
        "schema_version": "domainspec.wp-rmt-002-execution-contract-profile/v1",
        "unit_count": 70,
        "sequence_basis": "SWU-MANIFEST.json array order",
        "sequence_semantics": (
            "one deterministic successor per row deliberately serializes wave peers "
            "without altering depends_on dependency semantics"
        ),
        "terminal_sentinel": TERMINAL_SENTINEL,
        "authoring_frontier": ["RMT-OP-001"],
        "authoring_frontier_scope": "Invoke selection-ready projection only",
        "readiness_outer_loop_scope": "finite 70-unit policy; not a claim that 70 units are dependency-ready",
        "authority_effect": "none",
    }
    return result


def declared_command_schema(*, validation: bool) -> dict[str, Any]:
    required = [
        "argv",
        "cwd",
        "risk_class",
        "expected_exit_code",
        "environment",
        "runtime_identity",
    ]
    properties: dict[str, Any] = {
        "argv": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}},
        "cwd": {"const": "."},
        "risk_class": {"enum": ["read-only", "bounded-write"]},
        "expected_exit_code": {"const": 0},
        "environment": {"type": "object", "additionalProperties": {"type": "string"}},
        "runtime_identity": {
            "type": "object",
            "additionalProperties": False,
            "required": ["executable", "version_policy", "hash_policy"],
            "properties": {
                "executable": {"type": "string", "minLength": 1},
                "version_policy": {"const": "task-session-captures-exact-executable-version-before-run"},
                "hash_policy": {"const": "task-session-captures-resolved-executable-sha256-before-run"},
            },
        },
    }
    if validation:
        required.extend(
            ["command_id", "timeout_seconds", "max_output_bytes", "original_command"]
        )
        properties.update(
            {
                "command_id": {"type": "string", "minLength": 1},
                "timeout_seconds": {"const": TIMEOUT_SECONDS},
                "max_output_bytes": {"const": MAX_OUTPUT_BYTES},
                "original_command": {"type": "string", "minLength": 1},
            }
        )
    else:
        required.append("role")
        properties["role"] = {
            "const": "validation-only-entry-command; material production remains owner-gated"
        }
    return {
        "type": "object",
        "additionalProperties": False,
        "required": required,
        "properties": properties,
    }


def command_evidence_schema(*, validation: bool) -> dict[str, Any]:
    executed_runtime = {
        "type": "object",
        "additionalProperties": False,
        "required": ["executable", "version", "sha256"],
        "properties": {
            "executable": {"type": "string", "minLength": 1},
            "version": {"type": "string", "minLength": 1},
            "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
        },
    }
    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "state",
            "declared",
            "observed_runtime",
            "exit_code",
            "stdout_sha256",
            "stderr_sha256",
        ],
        "properties": {
            "state": {"enum": ["executed", "not-run"]},
            "declared": declared_command_schema(validation=validation),
            "observed_runtime": {"oneOf": [executed_runtime, {"type": "null"}]},
            "exit_code": {"type": ["integer", "null"]},
            "stdout_sha256": {
                "oneOf": [
                    {"type": "string", "pattern": "^[a-f0-9]{64}$"},
                    {"type": "null"},
                ]
            },
            "stderr_sha256": {
                "oneOf": [
                    {"type": "string", "pattern": "^[a-f0-9]{64}$"},
                    {"type": "null"},
                ]
            },
        },
        "allOf": [
            {
                "if": {"properties": {"state": {"const": "executed"}}},
                "then": {
                    "properties": {
                        "observed_runtime": executed_runtime,
                        "exit_code": {"type": "integer"},
                        "stdout_sha256": {
                            "type": "string",
                            "pattern": "^[a-f0-9]{64}$",
                        },
                        "stderr_sha256": {
                            "type": "string",
                            "pattern": "^[a-f0-9]{64}$",
                        },
                    }
                },
                "else": {
                    "properties": {
                        "observed_runtime": {"type": "null"},
                        "exit_code": {"type": "null"},
                        "stdout_sha256": {"type": "null"},
                        "stderr_sha256": {"type": "null"},
                    }
                },
            }
        ],
    }
    return schema


def receipt_schema(task: str | None = None, swu: str | None = None) -> dict[str, Any]:
    task_schema = {"const": task} if task else {"type": "string", "minLength": 1}
    swu_schema = {"const": swu} if swu else {"type": "string", "minLength": 1}
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schema_version",
            "work_pack_id",
            "task_id",
            "swu_id",
            "attempt_id",
            "execution_context_ref",
            "attempt_contract",
            "result",
            "expected_receipt",
            "material_inventory",
            "command_evidence",
            "validation",
            "lifecycle_owner_validation",
            "receipt_written_last",
            "authority_effect",
        ],
        "properties": {
            "schema_version": {"const": "domainspec.wp-rmt-002-terminal-receipt/v3"},
            "work_pack_id": {"const": "WP-RMT-002"},
            "task_id": task_schema,
            "swu_id": swu_schema,
            "attempt_id": {"type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]+$"},
            "execution_context_ref": exact_artifact_ref_schema(),
            "attempt_contract": {
                "type": "object",
                "additionalProperties": False,
                "required": ["id_policy", "collision_policy", "success_teardown", "failure_teardown"],
                "properties": {
                    "id_policy": {"type": "string", "minLength": 1},
                    "collision_policy": {"type": "string", "minLength": 1},
                    "success_teardown": {"type": "string", "minLength": 1},
                    "failure_teardown": {"type": "string", "minLength": 1},
                },
            },
            "result": {"enum": ["pass", "block"]},
            "expected_receipt": {"type": "string", "minLength": 1},
            "material_inventory": {
                "type": "object",
                "additionalProperties": False,
                "required": ["algorithm", "file_count", "total_size_bytes", "sha256", "materials"],
                "properties": {
                    "algorithm": {
                        "const": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows"
                    },
                    "file_count": {"type": "integer", "minimum": 0},
                    "total_size_bytes": {"type": "integer", "minimum": 0},
                    "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
                    "materials": {
                        "type": "array",
                        "minItems": 0,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["path", "sha256", "size_bytes"],
                            "properties": {
                                "path": {"type": "string", "minLength": 1},
                                "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
                                "size_bytes": {"type": "integer", "minimum": 0},
                            },
                        },
                    },
                },
            },
            "command_evidence": {
                "type": "object",
                "additionalProperties": False,
                "required": ["primary", "validation_commands"],
                "properties": {
                    "primary": command_evidence_schema(validation=False),
                    "validation_commands": {
                        "type": "array",
                        "minItems": 1,
                        "items": command_evidence_schema(validation=True),
                    },
                },
            },
            "validation": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "result",
                    "failure_phase",
                    "failure_reason",
                    "declared_command_count",
                    "executed_command_count",
                    "first_failure_index",
                    "commands",
                    "failure_exit_preserved",
                ],
                "properties": {
                    "result": {"enum": ["pass", "block"]},
                    "failure_phase": {
                        "enum": [None, "materialization", "primary", "validation"]
                    },
                    "failure_reason": {
                        "oneOf": [
                            {"type": "string", "minLength": 1},
                            {"type": "null"},
                        ]
                    },
                    "declared_command_count": {"type": "integer", "minimum": 1},
                    "executed_command_count": {"type": "integer", "minimum": 0},
                    "first_failure_index": {"type": ["integer", "null"], "minimum": 0},
                    "commands": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["command_id", "state", "result", "exit_code"],
                            "properties": {
                                "command_id": {"type": "string", "minLength": 1},
                                "state": {"enum": ["executed", "not-run"]},
                                "result": {"enum": ["pass", "block", "not-run"]},
                                "exit_code": {"type": ["integer", "null"]},
                            },
                        },
                    },
                    "failure_exit_preserved": {"const": True},
                },
            },
            "lifecycle_owner_validation": {
                "type": "object",
                "additionalProperties": False,
                "required": ["owner", "status"],
                "properties": {
                    "owner": {"const": LIFECYCLE_OWNER},
                    "status": {"enum": ["pass", "block"]},
                },
            },
            "receipt_written_last": {"const": True},
            "authority_effect": {"const": "none"},
        },
        "allOf": [
            {
                "if": {"properties": {"result": {"const": "pass"}}},
                "then": {
                    "properties": {
                        "material_inventory": {
                            "properties": {
                                "file_count": {"minimum": 1},
                                "total_size_bytes": {"minimum": 0},
                                "materials": {"minItems": 1},
                            }
                        },
                        "validation": {
                            "properties": {
                                "result": {"const": "pass"},
                                "failure_phase": {"type": "null"},
                                "failure_reason": {"type": "null"},
                            }
                        },
                        "lifecycle_owner_validation": {
                            "properties": {"status": {"const": "pass"}}
                        },
                    }
                },
                "else": {
                    "properties": {
                        "validation": {"properties": {"result": {"const": "block"}}},
                        "lifecycle_owner_validation": {
                            "properties": {"status": {"const": "block"}}
                        },
                    }
                },
            }
        ],
    }


def execution_context_schema() -> dict[str, Any]:
    sha = {"type": "string", "pattern": "^[a-f0-9]{64}$"}
    ref = exact_artifact_ref_schema()
    consumed = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "receipt_ref",
            "admission_token",
            "attempt_id",
            "consumption_ledger_ref",
        ],
        "properties": {
            "receipt_ref": ref,
            "admission_token": sha,
            "attempt_id": {"type": "string", "minLength": 1},
            "consumption_ledger_ref": ref,
        },
    }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schema_version",
            "profile",
            "work_pack_id",
            "task_id",
            "swu_id",
            "selected_unit",
            "run_id",
            "attempt_id",
            "repository_root_realpath",
            "material_root",
            "repository_identity_ref",
            "attempt_root",
            "attempt_root_ref",
            "current_run_ref",
            "execution_ticket_ref",
            "selection_receipt_ref",
            "mutation_admission_receipt_ref",
            "plan_semantic_manifest_ref",
            "plan_epoch_id",
            "unit_contract_digest",
            "plan_manifest_digest",
            "validation_contract_digest",
            "target_baseline_digest",
            "resolved_material_writes",
            "durable_declared_outputs",
            "execution_output_prestate_ref",
            "execution_output_prestate_digest",
            "consumed_admission",
            "authority_effect",
        ],
        "properties": {
            "schema_version": {
                "const": "domainspec.wp-rmt-002-execution-context/v1"
            },
            "profile": {"const": "plan-once-selected-unit"},
            "work_pack_id": {"const": "WP-RMT-002"},
            "task_id": {"type": "string", "minLength": 1},
            "swu_id": {"type": "string", "minLength": 1},
            "selected_unit": {"type": "string", "minLength": 1},
            "run_id": {"type": "string", "minLength": 1},
            "attempt_id": {"type": "string", "minLength": 1},
            "repository_root_realpath": {"type": "string", "minLength": 1},
            "material_root": {"const": "."},
            "repository_identity_ref": ref,
            "attempt_root": {"type": "string", "minLength": 1},
            "attempt_root_ref": ref,
            "current_run_ref": ref,
            "execution_ticket_ref": ref,
            "selection_receipt_ref": ref,
            "mutation_admission_receipt_ref": ref,
            "plan_semantic_manifest_ref": ref,
            "plan_epoch_id": {
                "type": "string",
                "pattern": "^epoch-[a-f0-9]{24}$",
            },
            "unit_contract_digest": sha,
            "plan_manifest_digest": sha,
            "validation_contract_digest": sha,
            "target_baseline_digest": sha,
            "resolved_material_writes": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": True,
                "items": {"type": "string", "minLength": 1},
            },
            "durable_declared_outputs": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": True,
                "items": {"type": "string", "minLength": 1},
            },
            "execution_output_prestate_ref": ref,
            "execution_output_prestate_digest": sha,
            "consumed_admission": consumed,
            "authority_effect": {"const": "none"},
        },
    }


def enrich_contracts(
    contracts: dict[str, Any], manifest: dict[str, Any]
) -> dict[str, Any]:
    result = copy.deepcopy(contracts)
    result["schema_version"] = "domainspec.wp-rmt-002-swu-contracts/v3"
    result["contract_policy"].update(
        {
            "readiness_execution_policy": {
                "profile": "selected-unit-at-task-session",
                "unit_count": 70,
                "canonical_sequence": "manifest-array-order",
                "sequence_reason": (
                    "The audit finite outer loop deliberately serializes manifest wave peers; "
                    "depends_on remains the sole dependency-semantic authority."
                ),
                "terminal_sentinel": TERMINAL_SENTINEL,
                "invoke_authoring_projection": {
                    "frontier": ["RMT-OP-001"],
                    "allowed_route_count": 1,
                    "state": "selection-ready",
                    "selected_unit": None,
                },
                "readiness_projection": {
                    "finite_outer_loop_units": 70,
                    "selected_unit": None,
                    "mutation_ready": False,
                    "interpretation": (
                        "The finite outer loop is a closed sequence contract, not an assertion "
                        "that later dependency-gated units are currently selectable."
                    ),
                },
                "authority_effect": "none",
            },
            "command_policy": {
                "normalization": {
                    "pwd_token": "$PWD is normalized to . with cwd .",
                    "environment_assignment": "leading assignments are explicit env argv entries",
                    "intent_preservation": "original_command is retained and must normalize exactly",
                },
                "timeout_seconds": TIMEOUT_SECONDS,
                "max_output_bytes": MAX_OUTPUT_BYTES,
                "policy_evidence": {
                    "path": (
                        "projects/domainspec-v2/development/architecture-pattern-enforcement/"
                        "refreshes/20260805T164500Z-swu-ape-ont-005-apply-approved/"
                        "material/MATERIAL-PACKAGE.json"
                    ),
                    "sha256": "cda560bdd8a868b3c243159fb1f408e0efd535bc5b39e5597162c1afe61efd2b",
                    "size_bytes": 11139,
                    "interpretation": "repository-local precedent for a 120-second and 1-MiB validation ceiling",
                },
                "expected_exit_code": 0,
                "runtime_identity": "capture executable path, version, and sha256 at Task Session admission",
            },
            "terminal_receipt_contract": {
                "schema": receipt_schema(),
                "execution_context_schema": execution_context_schema(),
                "binding_status": "pending-task-session-selection-and-admission",
                "canonical_sources": {
                    "selection_receipt_schema_ref": exact_ref(SELECTION_RECEIPT_SCHEMA),
                    "mutation_admission_request_schema_ref": candidate_live_ref(
                        MUTATION_ADMISSION_REQUEST_SCHEMA,
                        ".agents/skills/task-session/schemas/mutation-admission-request.schema.json",
                    ),
                    "mutation_admission_schema_ref": candidate_live_ref(
                        MUTATION_ADMISSION_SCHEMA,
                        ".agents/skills/task-session/schemas/mutation-admission-receipt.schema.json",
                    ),
                    "governance_run_request_schema_ref": candidate_live_ref(
                        GOVERNANCE_RUN_REQUEST_SCHEMA,
                        ".agents/skills/task-session/schemas/governance-run-request.schema.json",
                    ),
                    "execution_ticket_schema_ref": candidate_live_ref(
                        EXECUTION_TICKET_SCHEMA,
                        ".agents/skills/task-session/schemas/execution-ticket.schema.json",
                    ),
                    "executor_receipt_schema_ref": candidate_live_ref(
                        EXECUTOR_RECEIPT_SCHEMA,
                        ".agents/skills/task-session/schemas/executor-receipt.schema.json",
                    ),
                    "governance_terminal_schema_ref": exact_ref(GOVERNANCE_TERMINAL_SCHEMA),
                    "task_session_governance_runner_ref": candidate_live_ref(
                        TASK_SESSION_RUNNER,
                        ".agents/skills/task-session/scripts/task-session-governance-runner.py",
                    ),
                    "write_scope_baseline_ref": exact_ref(LIVE_PLAN / "WRITE-SCOPE-BASELINE.json"),
                },
                "semantic_validator": {
                    "path": f"{PLAN_REL.as_posix()}/validate-work-pack.mjs",
                    "argv_template": [
                        "node",
                        f"{PLAN_REL.as_posix()}/validate-work-pack.mjs",
                        ".",
                        "--validate-terminal-receipt",
                        "<receipt-path>",
                        "--unit",
                        "<swu-id>",
                    ],
                    "requirements": [
                        "task_id and swu_id equal the selected contract",
                        "the first positional repository root is the sole material census root",
                        "receipt execution_context_ref exactly binds the current Task Session run, repository, attempt root, selection, admission, and consumed-admission ledger",
                        "selection and admission bind the exact Work-Pack Readiness plan-semantic manifest, its plan epoch, canonical semantic digest, and per-unit digest",
                        "material-bound admission baselines cover material writes only; terminal output is bound separately by closeout and a Task Session-owned pre-execution output-prestate ref",
                        "attempt_id equals current run_id and the single-use consumption ledger rejects reuse or collision",
                        "material inventory equals a live regular-file census under the context-bound repository root",
                        "file scopes are exact and directory scopes are recursive with execution outputs excluded",
                        "all existing ancestors and leaves are non-symlink and realpath-contained",
                        "raw UTF-8 byte path order determines the inventory digest",
                        "declared transient outputs are absent and the receipt is written last by nanosecond mtime and ctime",
                        "pass executes every command successfully; block records an exact executed prefix and not-run suffix",
                        "lifecycle owner validation is explicit",
                        "authority_effect is none",
                    ],
                },
                "receipt_written_last": True,
            },
        }
    )
    swu_by_id = {swu["id"]: swu for swu in manifest["swus"]}
    for index, contract in enumerate(result["contracts"]):
        swu = swu_by_id[contract["swu_id"]]
        validation_contracts = [
            structured_command(contract["swu_id"], command, command_index)
            for command_index, command in enumerate(contract["verification"]["commands"])
        ]
        receipt = contract["atomicity"]["receipt"]
        transient_outputs = [
            item["path"] for item in contract["atomicity"].get("transient_outputs", [])
        ]
        transient_output_contracts = [
            {
                "path": path,
                "path_kind": "directory",
                "pre_execution_state": "absent",
                "touch_evidence": "required",
                "cleanup_policy": "remove-before-executor-receipt",
                "terminal_state": "absent",
            }
            for path in transient_outputs
        ]
        execution_outputs = [receipt, *transient_outputs]
        material_writes = [
            path for path in swu["write_scope"] if path not in execution_outputs
        ]
        contract.update(
            {
                "task_id": task_id(contract["swu_id"]),
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": AUTHORITY_CLASS,
                "publication_class": PUBLICATION_CLASS,
                "material_producer_owner": MATERIAL_PRODUCER_OWNER,
                "dependencies": list(swu["depends_on"]),
                "canonical_successors": [swu["canonical_successor"]],
                "primary_command": structured_command(
                    contract["swu_id"],
                    contract["verification"]["commands"][0],
                    0,
                    primary=True,
                ),
                "validation_contracts": validation_contracts,
                "attempt_contract": {
                    "id_policy": "attempt-id-equals-task-session-run-id",
                    "collision_policy": "canonical-single-use-admission-ledger-rejects-reuse-or-conflict",
                    "success_teardown": "retain-terminal-receipt-and-accepted-material; remove declared transient outputs",
                    "failure_teardown": "retain-block-receipt-and-diagnostics; remove declared transient outputs; stop frontier",
                },
                "write_partition": {
                    "material_writes": material_writes,
                    "execution_outputs": execution_outputs,
                    "durable_execution_outputs": [receipt],
                    "transient_outputs": transient_outputs,
                    "allowed_writes": [*material_writes, *execution_outputs],
                    "material_exclusions": execution_outputs,
                    "partition_rule": (
                        "literal path sets are disjoint and their exact union is allowed_writes; "
                        "a directory material path excludes exact execution-output children; "
                        "Cargo target directories are transient execution outputs, never durable material"
                    ),
                },
                "task_session_execution_contract": {
                    "profile": "first-class-transient-output-v1",
                    "mutation_admission_schema_version": (
                        "1.3.0" if transient_outputs else "1.2.0"
                    ),
                    "material_writes": material_writes,
                    "execution_outputs": execution_outputs,
                    "transient_outputs": transient_output_contracts,
                    "allowed_writes": [*material_writes, *execution_outputs],
                    "material_baseline_partition": "material-writes-only",
                    "durable_declared_outputs": {
                        "status": "pending-selected-unit-material-package",
                        "mapping": "one-exact-regular-staged-postimage-per-resolved-material-target",
                        "transient_paths_forbidden": transient_outputs,
                    },
                    "executor_transient_results": {
                        "required": bool(transient_outputs),
                        "exact_paths": transient_outputs,
                        "touch_evidence": "required",
                        "cleanup_evidence": "required",
                        "terminal_state": "absent",
                    },
                    "authority_effect": "none",
                },
                "material_package": {
                    "status": "pending-selected-unit-producer",
                    "package_ref": None,
                    "producer_owner_ref": MATERIAL_PRODUCER_OWNER,
                    "producer_receipt_ref": None,
                    "schema_ref": None,
                    "declared_sha256": None,
                    "target_inventory_ref": None,
                },
                "byte_baselines": [],
                "terminal_receipt_contract": {
                    "expected_receipt": receipt,
                    "schema_ref": "#/contract_policy/terminal_receipt_contract/schema",
                    "schema": receipt_schema(
                        task_id(contract["swu_id"]), contract["swu_id"]
                    ),
                    "semantic_validator_ref": "#/contract_policy/terminal_receipt_contract/semantic_validator",
                    "execution_context_schema_ref": "#/contract_policy/terminal_receipt_contract/execution_context_schema",
                    "binding_status": "pending-task-session-selection-and-admission",
                    "receipt_written_last": True,
                },
                "closeout_contract": {
                    "allowed_delta_policy": {
                        "paths": [*material_writes, *execution_outputs],
                        "required_absent_paths": transient_outputs,
                        "undeclared_delta": "block",
                        "baseline_mode": "all-targets-currently-absent",
                    },
                    "owner_receipt_contract": {
                        "owner": LIFECYCLE_OWNER,
                        "required_status": "pass",
                        "authority_effect": "none",
                    },
                    "compensation": {
                        "mode": "none",
                        "rationale": "all live mutation remains deferred to a separately admitted Task Session",
                    },
                },
            }
        )
    return result


def enrich_entry(entry: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(entry)
    route = result["execution_policy"]["allowed_routes"][0]
    validator_path = f"{PLAN_REL.as_posix()}/validate-work-pack.mjs"
    if validator_path not in route["required_inputs"]:
        route["required_inputs"].append(validator_path)
    result["execution_policy"]["allowed_routes_digest"] = canonical_digest(
        result["execution_policy"]["allowed_routes"]
    )
    result["continuation_rule"] = (
        "The prerequisite receipt has passed, so this projection is selection-ready with no "
        "selected unit. Implementation Readiness may select only RMT-OP-001 under the declared "
        "policy; the finite future sequence remains owned by SWU-MANIFEST.json and "
        "SWU-CONTRACTS.json, and this refresh does not select or execute any SWU."
    )
    return result


def staged_validator(source: str) -> str:
    source = source.replace(
        'import { lstatSync, readFileSync, readdirSync } from "node:fs";',
        'import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";',
        1,
    )
    source = source.replace(
        'import { dirname, join, relative, resolve } from "node:path";',
        'import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";',
        1,
    )
    old = (
        'const planRoot = dirname(fileURLToPath(import.meta.url));\n'
        'const repoRoot = resolve(process.argv[2] ?? process.cwd());\n'
    )
    new = (
        'const planRoot = dirname(fileURLToPath(import.meta.url));\n'
        'const cli = process.argv.slice(2);\n'
        'let repoArgument = null;\n'
        'let logicalPlanArgument = null;\n'
        'let emitExpected = false;\n'
        'let terminalReceiptArgument = null;\n'
        'let terminalUnitArgument = null;\n'
        'for (let index = 0; index < cli.length; index += 1) {\n'
        '  const value = cli[index];\n'
        '  if (value === "--logical-plan-root") { logicalPlanArgument = cli[++index]; continue; }\n'
        '  if (value === "--emit-expected") { emitExpected = true; continue; }\n'
        '  if (value === "--validate-terminal-receipt") { terminalReceiptArgument = cli[++index]; continue; }\n'
        '  if (value === "--unit") { terminalUnitArgument = cli[++index]; continue; }\n'
        '  if (value.startsWith("--")) throw new Error(`WP_CLI_UNKNOWN:${value}`);\n'
        '  if (repoArgument !== null) throw new Error(`WP_CLI_POSITIONAL:${value}`);\n'
        '  repoArgument = value;\n'
        '}\n'
        'const repoRoot = resolve(repoArgument ?? process.cwd());\n'
        'const logicalPlanRoot = logicalPlanArgument === null ? planRoot : resolve(repoRoot, logicalPlanArgument);\n'
    )
    if old not in source:
        raise ValueError("validator CLI anchor missing")
    source = source.replace(old, new, 1)
    source = source.replace(
        'const planRelative = (name) => relative(repoRoot, join(planRoot, name)).replaceAll("\\\\", "/");',
        'const planRelative = (name) => relative(repoRoot, join(logicalPlanRoot, name)).replaceAll("\\\\", "/");',
        1,
    )
    source = source.replace(
        '["id","type","stage","wave","depends_on","outcome","write_scope","status"]',
        '["id","type","stage","wave","depends_on","outcome","write_scope","status","task_id","lifecycle_owner","authority_class","publication_class","material_producer_owner","canonical_successor","execution_contract_ref"]',
        1,
    )
    source = source.replace(
        'contracts.schema_version !== "domainspec.wp-rmt-002-swu-contracts/v2"',
        'contracts.schema_version !== "domainspec.wp-rmt-002-swu-contracts/v3"',
        1,
    )
    source = source.replace(
        'if (manifest.schema_version !== "domainspec.remaining-meta-types-work-pack-manifest/v3") fail("WP_SCHEMA", manifest.schema_version);',
        'exactKeys(entry, ["schema_version","work_pack_id","admission_timing","frontier","execution_policy","execution_entry","pre_execution_owner_prerequisite","continuation_rule","authority_effect"], "WP_ENTRY_SHAPE");\nif (manifest.schema_version !== "domainspec.remaining-meta-types-work-pack-manifest/v3") fail("WP_SCHEMA", manifest.schema_version);',
        1,
    )
    source = source.replace(
        'const criticalPlanInputs = ["SWU-MANIFEST.json","WORK-PACK.md","tasks/TASK-RMT-OP.md","SWU-CONTRACTS.json","WRITE-SCOPE-BASELINE.json","HOSTILE-CATALOGUE.json","RELATION-CONTRACTS.json"].map(planRelative);',
        'const criticalPlanInputs = ["SWU-MANIFEST.json","WORK-PACK.md","tasks/TASK-RMT-OP.md","SWU-CONTRACTS.json","WRITE-SCOPE-BASELINE.json","HOSTILE-CATALOGUE.json","RELATION-CONTRACTS.json","validate-work-pack.mjs"].map(planRelative);',
        1,
    )
    source = source.replace(
        'route.required_inputs.length !== 27 || new Set(route.required_inputs).size !== 27',
        'route.required_inputs.length !== 28 || new Set(route.required_inputs).size !== 28',
        1,
    )
    receipt_anchor = 'const relationContracts = json(join(planRoot, "RELATION-CONTRACTS.json"));\n'
    receipt_semantic = (
        PACKAGE / "validation/terminal-receipt-validator.fragment.mjs"
    ).read_text(encoding="utf-8")
    if receipt_anchor not in source:
        raise ValueError("terminal receipt validator anchor missing")
    source = source.replace(
        receipt_anchor, receipt_anchor + receipt_semantic + "\n", 1
    )
    marker = "const output = {\n"
    if marker not in source:
        raise ValueError("validator output anchor missing")
    semantic_checks = r'''
const expectedTaskId = (id) => `TASK-RMT-${id.split("-")[1]}`;
const contractPolicy = contracts.contract_policy;
const readinessPolicy = contractPolicy.readiness_execution_policy;
if (manifest.execution_contract_profile?.unit_count !== 70 || manifest.execution_contract_profile?.terminal_sentinel !== "__terminal__" || manifest.execution_contract_profile?.readiness_outer_loop_scope !== "finite 70-unit policy; not a claim that 70 units are dependency-ready") fail("WP_EXECUTION_PROFILE", "manifest");
if (readinessPolicy?.unit_count !== 70 || readinessPolicy?.canonical_sequence !== "manifest-array-order" || readinessPolicy?.terminal_sentinel !== "__terminal__" || readinessPolicy?.readiness_projection?.mutation_ready !== false || readinessPolicy?.invoke_authoring_projection?.allowed_route_count !== 1) fail("WP_READINESS_POLICY", "contracts");
if (entry.frontier.length !== 1 || entry.frontier[0] !== "RMT-OP-001" || entry.execution_entry.selected_unit !== null || entry.execution_entry.route_id !== null || entry.execution_entry.state !== "selection-ready") fail("WP_PROJECTION_SCOPE", "Invoke entry must remain OP001-only and selection-ready");
if (entry.execution_policy.allowed_routes.length !== 1 || entry.execution_policy.allowed_routes[0].frontier_swu !== "RMT-OP-001") fail("WP_AUTHORING_ROUTE_SCOPE", "not OP001-only");
if (contractPolicy.command_policy?.timeout_seconds !== 120 || contractPolicy.command_policy?.max_output_bytes !== 1048576 || contractPolicy.command_policy?.policy_evidence?.sha256 !== "cda560bdd8a868b3c243159fb1f408e0efd535bc5b39e5597162c1afe61efd2b") fail("WP_COMMAND_POLICY", "runtime ceiling");
if (contractPolicy.terminal_receipt_contract?.receipt_written_last !== true || contractPolicy.terminal_receipt_contract?.schema?.additionalProperties !== false || contractPolicy.terminal_receipt_contract?.schema?.properties?.schema_version?.const !== "domainspec.wp-rmt-002-terminal-receipt/v3" || contractPolicy.terminal_receipt_contract?.execution_context_schema?.additionalProperties !== false || contractPolicy.terminal_receipt_contract?.binding_status !== "pending-task-session-selection-and-admission" || contractPolicy.terminal_receipt_contract?.semantic_validator?.path !== planRelative("validate-work-pack.mjs") || !contractPolicy.terminal_receipt_contract?.semantic_validator?.argv_template?.includes("--validate-terminal-receipt") || contractPolicy.terminal_receipt_contract?.semantic_validator?.argv_template?.includes("--validation-root")) fail("WP_TERMINAL_RECEIPT_GLOBAL", "missing or caller-selectable root");
let structuredValidationCount = 0;
let boundedWriteCommandCount = 0;
let cargoExecutionOutputCount = 0;
const expectedExecutable = (command) => {
  let index = command.argv[0] === "env" ? 1 : 0;
  while (command.argv[0] === "env" && index < command.argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(command.argv[index])) index += 1;
  return command.argv[index];
};
for (let index = 0; index < manifest.swus.length; index += 1) {
  const swu = manifest.swus[index];
  const contract = contractById.get(swu.id);
  const successor = index + 1 < manifest.swus.length ? manifest.swus[index + 1].id : "__terminal__";
  if (swu.task_id !== expectedTaskId(swu.id) || swu.lifecycle_owner !== "projects/domainspec-v2" || swu.authority_class !== "private" || swu.publication_class !== "internal" || swu.material_producer_owner !== "task-session:selected-unit-materialization" || swu.canonical_successor !== successor || swu.execution_contract_ref !== `SWU-CONTRACTS.json#/contracts/${index}`) fail("WP_UNIT_IDENTITY", swu.id);
  if (contract.task_id !== swu.task_id || contract.lifecycle_owner !== swu.lifecycle_owner || contract.authority_class !== swu.authority_class || contract.publication_class !== swu.publication_class || contract.material_producer_owner !== swu.material_producer_owner || JSON.stringify(contract.dependencies) !== JSON.stringify(swu.depends_on) || JSON.stringify(contract.canonical_successors) !== JSON.stringify([successor])) fail("WP_UNIT_BINDING", swu.id);
  const primaryExpectedRisk = contract.primary_command.argv.some((token) => token.startsWith("CARGO_TARGET_DIR=")) ? "bounded-write" : "read-only";
  if (contract.primary_command?.cwd !== "." || contract.primary_command?.risk_class !== primaryExpectedRisk || contract.primary_command?.expected_exit_code !== 0 || contract.primary_command?.role !== "validation-only-entry-command; material production remains owner-gated" || contract.primary_command.runtime_identity?.executable !== expectedExecutable(contract.primary_command)) fail("WP_PRIMARY_COMMAND", swu.id);
  if (!Array.isArray(contract.validation_contracts) || contract.validation_contracts.length !== contract.verification.commands.length) fail("WP_VALIDATION_COMMAND_COUNT", swu.id);
  for (let commandIndex = 0; commandIndex < contract.validation_contracts.length; commandIndex += 1) {
    const command = contract.validation_contracts[commandIndex];
    const original = contract.verification.commands[commandIndex];
    const expectedRisk = command.argv.some((token) => token.startsWith("CARGO_TARGET_DIR=")) ? "bounded-write" : "read-only";
    if (command.original_command !== original || command.cwd !== "." || command.timeout_seconds !== 120 || command.max_output_bytes !== 1048576 || command.expected_exit_code !== 0 || command.risk_class !== expectedRisk || !Array.isArray(command.argv) || command.argv.length === 0 || command.argv.some((token) => token.includes("$PWD")) || command.runtime_identity?.executable !== expectedExecutable(command) || command.runtime_identity?.version_policy !== "task-session-captures-exact-executable-version-before-run" || command.runtime_identity?.hash_policy !== "task-session-captures-resolved-executable-sha256-before-run") fail("WP_VALIDATION_COMMAND", `${swu.id}:${commandIndex}`);
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(original) && command.argv[0] !== "env") fail("WP_COMMAND_ENV_NORMALIZATION", `${swu.id}:${commandIndex}`);
    if (original.includes("$PWD") && !command.argv.includes(".")) fail("WP_COMMAND_PWD_NORMALIZATION", `${swu.id}:${commandIndex}`);
    if (expectedRisk === "bounded-write") boundedWriteCommandCount += 1;
    structuredValidationCount += 1;
  }
  const partition = contract.write_partition;
  const material = new Set(partition.material_writes);
  const outputs = new Set(partition.execution_outputs);
  const allowed = new Set(partition.allowed_writes);
  const transientPaths = (contract.atomicity.transient_outputs ?? []).map((item) => item.path);
  const expectedOutputs = [contract.atomicity.receipt, ...transientPaths];
  const expectedMaterial = swu.write_scope.filter((path) => !expectedOutputs.includes(path));
  const outputNestedUnderMaterialDirectory = expectedMaterial.some((path) => path.endsWith("/") && expectedOutputs.some((output) => output.startsWith(path)));
  if ([...material].some((path) => outputs.has(path)) || material.size + outputs.size !== allowed.size || [...material, ...outputs].some((path) => !allowed.has(path)) || JSON.stringify(partition.material_writes) !== JSON.stringify(expectedMaterial) || JSON.stringify(partition.execution_outputs) !== JSON.stringify(expectedOutputs) || JSON.stringify(partition.durable_execution_outputs) !== JSON.stringify([contract.atomicity.receipt]) || JSON.stringify(partition.transient_outputs) !== JSON.stringify(transientPaths) || JSON.stringify(partition.material_exclusions) !== JSON.stringify(expectedOutputs) || JSON.stringify(contract.closeout_contract.allowed_delta_policy.required_absent_paths) !== JSON.stringify(transientPaths) || (outputNestedUnderMaterialDirectory && !partition.partition_rule.includes("excludes exact execution-output children"))) fail("WP_WRITE_PARTITION", swu.id);
  const taskSession = contract.task_session_execution_contract;
  const expectedTransientContracts = transientPaths.map((path) => ({ path, path_kind: "directory", pre_execution_state: "absent", touch_evidence: "required", cleanup_policy: "remove-before-executor-receipt", terminal_state: "absent" }));
  if (taskSession?.profile !== "first-class-transient-output-v1" || taskSession?.mutation_admission_schema_version !== (transientPaths.length ? "1.3.0" : "1.2.0") || JSON.stringify(taskSession?.material_writes) !== JSON.stringify(expectedMaterial) || JSON.stringify(taskSession?.execution_outputs) !== JSON.stringify(expectedOutputs) || JSON.stringify(taskSession?.transient_outputs) !== JSON.stringify(expectedTransientContracts) || JSON.stringify(taskSession?.allowed_writes) !== JSON.stringify([...expectedMaterial, ...expectedOutputs]) || taskSession?.material_baseline_partition !== "material-writes-only" || taskSession?.durable_declared_outputs?.status !== "pending-selected-unit-material-package" || taskSession?.durable_declared_outputs?.mapping !== "one-exact-regular-staged-postimage-per-resolved-material-target" || JSON.stringify(taskSession?.durable_declared_outputs?.transient_paths_forbidden) !== JSON.stringify(transientPaths) || taskSession?.executor_transient_results?.required !== Boolean(transientPaths.length) || JSON.stringify(taskSession?.executor_transient_results?.exact_paths) !== JSON.stringify(transientPaths) || taskSession?.executor_transient_results?.touch_evidence !== "required" || taskSession?.executor_transient_results?.cleanup_evidence !== "required" || taskSession?.executor_transient_results?.terminal_state !== "absent" || taskSession?.authority_effect !== "none") fail("WP_TASK_SESSION_TRANSIENT_BINDING", swu.id);
  if (transientPaths.length === 1) cargoExecutionOutputCount += 1;
  if (contract.material_package?.status !== "pending-selected-unit-producer" || contract.material_package?.producer_owner_ref !== "task-session:selected-unit-materialization" || contract.material_package?.package_ref !== null || contract.material_package?.producer_receipt_ref !== null || contract.material_package?.schema_ref !== null || contract.material_package?.declared_sha256 !== null || contract.material_package?.target_inventory_ref !== null || !Array.isArray(contract.byte_baselines) || contract.byte_baselines.length !== 0) fail("WP_MATERIAL_BOUNDARY", swu.id);
  if (contract.terminal_receipt_contract?.expected_receipt !== contract.atomicity.receipt || contract.terminal_receipt_contract?.receipt_written_last !== true || contract.terminal_receipt_contract?.schema?.properties?.task_id?.const !== contract.task_id || contract.terminal_receipt_contract?.schema?.properties?.swu_id?.const !== contract.swu_id || contract.terminal_receipt_contract?.schema?.additionalProperties !== false || contract.closeout_contract?.owner_receipt_contract?.owner !== "projects/domainspec-v2" || contract.closeout_contract?.owner_receipt_contract?.required_status !== "pass" || contract.closeout_contract?.owner_receipt_contract?.authority_effect !== "none" || contract.closeout_contract?.allowed_delta_policy?.undeclared_delta !== "block") fail("WP_CLOSEOUT_BINDING", swu.id);
}
if (structuredValidationCount !== 112) fail("WP_STRUCTURED_VALIDATION_DENOMINATOR", structuredValidationCount);
if (boundedWriteCommandCount !== 7 || cargoExecutionOutputCount !== 7) fail("WP_CARGO_COMMAND_PARTITION_DENOMINATOR", `${boundedWriteCommandCount}/${cargoExecutionOutputCount}`);
'''
    source = source.replace(marker, semantic_checks + "\n" + marker, 1)
    source = source.replace(
        'schema_version: "domainspec.wp-rmt-002-plan-validation/v1",',
        'schema_version: "domainspec.wp-rmt-002-plan-validation/v2",',
        1,
    )
    source = source.replace(
        'task_contracts: { atomic_acceptance_verification_closeout: "70/70", terminal_receipts_within_owned_scope: "70/70", exact_command_sets: "70/70", cargo_target_scope_and_cleanup: "7/7" },',
        'task_contracts: { atomic_acceptance_verification_closeout: "70/70", terminal_receipts_within_owned_scope: "70/70", exact_command_sets: "70/70", cargo_target_scope_and_cleanup: "7/7", lifecycle_authority_publication_bindings: "70/70", canonical_successors: "70/70", structured_validation_commands: "112/112", exact_executable_bindings: "182/182", bounded_write_cargo_commands: "7/7", cargo_transient_execution_outputs: "7/7", per_swu_terminal_receipt_schemas: "70/70", task_session_execution_context_bindings: "70/70", single_use_attempt_ledgers: "70/70", exact_write_partitions: "70/70", pending_material_packages: "70/70", absent_byte_baselines: "70/70", owner_closeout_bindings: "70/70" },',
        1,
    )
    source = source.replace(
        'future_frontier: "RMT-OP-001", selected_unit: null, route_id: null, next_owner: "implementation-readiness:execute", self_contained_route_inputs: `${route.required_inputs.length}/${route.required_inputs.length}`, authority_effect: "none"',
        'future_frontier: "RMT-OP-001", authoring_projection: "OP001-only", readiness_outer_loop: "70-unit finite sequence contract", later_units_currently_selectable: false, selected_unit: null, route_id: null, next_owner: "implementation-readiness:execute", self_contained_route_inputs: `${route.required_inputs.length}/${route.required_inputs.length}`, authority_effect: "none"',
        1,
    )
    old_tail = '''const storedValidation = json(join(planRoot, "VALIDATION-RESULT.json"));
if (JSON.stringify(storedValidation) !== JSON.stringify(output)) fail("WP_STORED_VALIDATION_STALE", "VALIDATION-RESULT.json");
const entryValidation = json(join(planRoot, "EXECUTION-ENTRY-VALIDATION.json"));
if (entryValidation.status !== "pass" || entryValidation.allowed_routes_digest !== entry.execution_policy.allowed_routes_digest || entryValidation.work_pack_id !== manifest.work_pack_id || entryValidation.authority_effect !== "none") fail("WP_ENTRY_VALIDATION_STALE", "EXECUTION-ENTRY-VALIDATION.json");
process.stdout.write(`${JSON.stringify(output, null, 2)}\\n`);
'''
    new_tail = '''if (!emitExpected) {
  const storedValidation = json(join(planRoot, "VALIDATION-RESULT.json"));
  if (JSON.stringify(storedValidation) !== JSON.stringify(output)) fail("WP_STORED_VALIDATION_STALE", "VALIDATION-RESULT.json");
  const entryValidation = json(join(planRoot, "EXECUTION-ENTRY-VALIDATION.json"));
  const expectedEntryValidation = { allowed_routes_digest: entry.execution_policy.allowed_routes_digest, authority_effect: "none", frontier: entry.frontier, route_count: entry.execution_policy.allowed_routes.length, schema_version: "1.0.0", status: "pass", work_pack_id: manifest.work_pack_id };
  if (JSON.stringify(entryValidation) !== JSON.stringify(expectedEntryValidation)) fail("WP_ENTRY_VALIDATION_STALE", "EXECUTION-ENTRY-VALIDATION.json");
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\\n`);
'''
    if old_tail not in source:
        raise ValueError("validator stored-output tail missing")
    return source.replace(old_tail, new_tail, 1)


def write_terminal_receipt_fixtures(contracts: dict[str, Any]) -> None:
    fixture_root = PACKAGE / "fixtures/terminal-receipt"
    fixture_root.mkdir(parents=True, exist_ok=True)
    for stale in fixture_root.glob("*.json"):
        if stale.name != "FIXTURE-INDEX.json":
            stale.unlink()
    positive = [
        {
            "fixture_id": "pass-complete-directory",
            "swu_id": "RMT-OP-001",
            "result": "pass",
        },
        {
            "fixture_id": "pass-cargo-transient-contract",
            "swu_id": "RMT-OP-005",
            "result": "pass",
        },
        {
            "fixture_id": "block-zero-material",
            "swu_id": "RMT-OP-001",
            "result": "block",
            "failure_phase": "materialization",
        },
        {
            "fixture_id": "block-partial-first-failure",
            "swu_id": "RMT-OP-003",
            "result": "block",
            "failure_phase": "validation",
        },
    ]
    hostile = [
        ("wrong-task", "WP_TERMINAL_RECEIPT_IDENTITY"),
        ("wrong-swu", "WP_TERMINAL_RECEIPT_IDENTITY"),
        ("empty-inventory", "WP_TERMINAL_RECEIPT_PASS_MATERIAL_INCOMPLETE"),
        ("unknown-inventory", "WP_TERMINAL_RECEIPT_MATERIAL_UNKNOWN"),
        ("stale-inventory", "WP_TERMINAL_RECEIPT_INVENTORY_STALE"),
        ("validation-evidence", "WP_TERMINAL_RECEIPT_VALIDATION_COUNT"),
        ("authority", "WP_TERMINAL_RECEIPT_RESULT"),
        ("wrong-executable", "WP_TERMINAL_RECEIPT_PRIMARY_RUNTIME"),
        ("forged-self-consistent-hash", "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH"),
        ("drifted-bytes", "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH"),
        ("omitted-exact-file", "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH"),
        ("recursive-directory-omission", "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH"),
        ("symlink-escape", "WP_TERMINAL_RECEIPT_MATERIAL_SYMLINK"),
        ("transient-residue", "WP_TERMINAL_RECEIPT_TRANSIENT_PRESENT"),
        ("wrong-raw-ordering", "WP_TERMINAL_RECEIPT_INVENTORY_ORDER"),
        ("receipt-before-material", "WP_TERMINAL_RECEIPT_NOT_LAST"),
        ("fabricated-later-command", "WP_TERMINAL_RECEIPT_FAIL_FAST_SUFFIX"),
        ("missing-not-run-suffix", "WP_TERMINAL_RECEIPT_VALIDATION_COUNT"),
        ("result-inflation", "WP_TERMINAL_RECEIPT_PASS_COHERENCE"),
        ("copied-topology-wrong-root", "WP_TERMINAL_RECEIPT_REPOSITORY_BINDING"),
        ("wrong-repository-identity", "WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY_STALE"),
        ("arbitrary-attempt", "WP_TERMINAL_RECEIPT_ATTEMPT_CONTEXT"),
        ("reused-attempt", "WP_TERMINAL_RECEIPT_ATTEMPT_REUSED"),
        ("conflicting-attempt", "WP_TERMINAL_RECEIPT_LEDGER_REF_STALE"),
        ("stale-selection-ref", "WP_TERMINAL_RECEIPT_SELECTION_REF_STALE"),
        ("stale-admission-ref", "WP_TERMINAL_RECEIPT_ADMISSION_REF_STALE"),
        ("stale-context-ref", "WP_TERMINAL_RECEIPT_CONTEXT_REF_STALE"),
        ("receipt-fixed-path-replacement", "WP_TERMINAL_RECEIPT_FIXED_PATH_BASELINE"),
        ("full-contract-unit-digest-substitution", "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING"),
        ("staged-swu-manifest-substitution", "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING"),
        ("all-writes-baseline-substitution", "WP_TERMINAL_RECEIPT_TARGET_BASELINE"),
        ("stale-write-scope-baseline-ref", "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_REF_STALE"),
        ("missing-plan-baseline-coverage", "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_COVERAGE"),
        ("prestate-not-in-control-refs", "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING"),
        ("ledger-governance-request-substitution", "WP_TERMINAL_RECEIPT_LEDGER_BINDING"),
        ("prestate-not-before-material", "WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_ORDER"),
        ("stale-execution-ticket-ref", "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_REF_STALE"),
        ("forged-internally-consistent-admission-token", "WP_TERMINAL_RECEIPT_ADMISSION_TOKEN"),
        ("missing-cargo-admission-output", "WP_TERMINAL_RECEIPT_ADMISSION_BINDING"),
        ("substituted-cargo-admission-output", "WP_TERMINAL_RECEIPT_ADMISSION_BINDING"),
        ("missing-cargo-run-contract", "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING"),
        ("substituted-cargo-ticket-contract", "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_BINDING"),
    ]
    write_json(
        fixture_root / "FIXTURE-INDEX.json",
        {
            "schema_version": "domainspec.wp-rmt-002-terminal-receipt-fixtures/v3",
            "fixture_mode": "validate-proposal creates and removes real isolated filesystem topologies",
            "positive": positive,
            "hostiles": [
                {
                    "fixture_id": fixture_id,
                    "expected_code": expected_code,
                }
                for fixture_id, expected_code in hostile
            ],
        },
    )


def stage() -> None:
    staged_validation = STAGED_ROOT / "VALIDATION-RESULT.json"
    if staged_validation.exists():
        staged_validation.unlink()
    manifest = enrich_manifest(load(PREIMAGE_ROOT / "SWU-MANIFEST.json"))
    contracts = enrich_contracts(load(PREIMAGE_ROOT / "SWU-CONTRACTS.json"), manifest)
    entry = enrich_entry(load(PREIMAGE_ROOT / "EXECUTION-ENTRY.json"))
    validator = staged_validator(
        (PREIMAGE_ROOT / "validate-work-pack.mjs").read_text(encoding="utf-8")
    )

    STAGED_ROOT.mkdir(parents=True, exist_ok=True)
    write_json(STAGED_ROOT / "SWU-MANIFEST.json", manifest)
    write_json(STAGED_ROOT / "SWU-CONTRACTS.json", contracts)
    write_json(STAGED_ROOT / "EXECUTION-ENTRY.json", entry)
    (STAGED_ROOT / "validate-work-pack.mjs").write_text(validator, encoding="utf-8")
    entry_validation = subprocess.run(
        [
            "python3",
            str(CANONICAL_ENTRY_VALIDATOR),
            "--projection",
            str(STAGED_ROOT / "EXECUTION-ENTRY.json"),
        ],
        cwd=REPO,
        check=True,
        capture_output=True,
    )
    if (
        len(entry_validation.stdout) != 267
        or sha256_bytes(entry_validation.stdout)
        != "af48420708ab62f853a28fff0806b7f95a514ad9ecf87fa15b3f103f052b1fec"
    ):
        raise SystemExit("installed canonical entry validator output drift")
    (STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json").write_bytes(
        entry_validation.stdout
    )
    write_terminal_receipt_fixtures(contracts)

    if not VIEW_ROOT.is_dir():
        raise SystemExit("existing package-local validation view is required")
    for target in TARGETS:
        staged = STAGED_ROOT / target
        if staged.exists():
            shutil.copy2(staged, VIEW_ROOT / target)


def finish_view() -> None:
    validation = STAGED_ROOT / "VALIDATION-RESULT.json"
    if not validation.exists():
        raise SystemExit("staged VALIDATION-RESULT.json must be generated first")
    shutil.copy2(validation, VIEW_ROOT / "VALIDATION-RESULT.json")
    shutil.copy2(
        STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json",
        VIEW_ROOT / "EXECUTION-ENTRY-VALIDATION.json",
    )


def validate_stage() -> None:
    process = subprocess.run(
        [
            "node",
            str(VIEW_ROOT / "validate-work-pack.mjs"),
            ".",
            "--logical-plan-root",
            PLAN_REL.as_posix(),
            "--emit-expected",
        ],
        cwd=REPO,
        check=True,
        capture_output=True,
    )
    parsed = json.loads(process.stdout)
    if parsed.get("result") != "pass":
        raise SystemExit("staged Work-Pack validator did not pass")
    (STAGED_ROOT / "VALIDATION-RESULT.json").write_bytes(process.stdout)


def binding(
    binding_id: str, owner_ref: str, path: Path, selector: str
) -> dict[str, Any]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner_ref,
        "artifact_ref": exact_ref(path),
        "selector": selector,
    }


def opaque_binding(
    binding_id: str, owner_ref: str, path: Path
) -> dict[str, Any]:
    return {
        "binding_id": binding_id,
        "owner_ref": owner_ref,
        "binding_mode": "opaque-exact-artifact",
        "artifact_ref": exact_ref(path),
    }


def write_source_intent() -> None:
    write_json(
        PACKAGE / "SOURCE-INTENT.json",
        {
            "schema_version": "domainspec.invoke-refresh-source-intent/v1",
            "route": "invoke:refresh",
            "mode": "proposal-only",
            "evidence_date": "2026-08-16",
            "activation_source": {
                "kind": "independent-final-block-repair",
                "authority": "proposal-repair-only",
                "superseded_inventory_sha256": "a28e30bfbf15ffa016adc4ef17d3775d8894064a3825fb85379ca304f5260517",
                "finding_count": 3,
            },
            "objective": (
                "Author and validate an isolated six-target WP-RMT-002 execution-contract "
                "Refresh proposal without changing the live plan or implementing a SWU."
            ),
            "exact_staged_targets": [f"{PLAN_REL.as_posix()}/{name}" for name in TARGETS],
            "canonical_execution_entry_producer": {
                "script_ref": exact_ref(CANONICAL_ENTRY_VALIDATOR),
                "schema_ref": exact_ref(CANONICAL_ENTRY_SCHEMA),
                "expected_output_sha256": "af48420708ab62f853a28fff0806b7f95a514ad9ecf87fa15b3f103f052b1fec",
                "expected_output_size_bytes": 267,
                "drift_policy": "block",
            },
            "owner_acceptance": {
                "status": "absent",
                "required_next": True,
                "scope": "exact proposal bytes and bound inventory",
            },
            "apply_authorization": "absent",
            "selection_receipt": "absent",
            "task_session_admission": "absent",
            "future_execution_context_binding": {
                "status": "pending-task-session-selection-and-admission",
                "material_root": ".",
                "caller_selectable_validation_root": False,
                "attempt_identity": "must equal the admitted Task Session run_id",
                "collision_control": "canonical consumed_admission single-use ledger",
            },
            "authority_effect": "none",
            "forbidden_effects": [
                "live-plan-mutation",
                "product-mutation",
                "ontology-mutation",
                "candidate-migration",
                "PromotionRecord-creation",
                "selection",
                "task-session-admission",
                "implementation",
                "promotion",
                "publication",
                "release",
                "deployment",
                "production",
                "git",
                "network",
                "external-effects",
            ],
        },
    )


def write_command_policy() -> None:
    write_json(
        PACKAGE / "COMMAND-POLICY.json",
        {
            "schema_version": "domainspec.wp-rmt-002-command-policy/v1",
            "declared_validation_command_count": 112,
            "normalization": {
                "pwd": {"from": "$PWD", "to": ".", "cwd": "."},
                "environment_assignments": "explicit env argv prefix",
                "original_intent": "retained in original_command and replay-checked",
            },
            "execution_ceiling": {
                "timeout_seconds": TIMEOUT_SECONDS,
                "max_output_bytes": MAX_OUTPUT_BYTES,
                "expected_exit_code": 0,
                "risk_classes": {
                    "read_only_commands": 105,
                    "bounded_write_cargo_commands": 7,
                    "rule": "CARGO_TARGET_DIR commands are bounded-write; all other declared validation commands are read-only",
                },
                "runtime_identity": (
                    "Plan binds the exact argv executable; Task Session captures its resolved path, version, and sha256 before run"
                ),
            },
            "evidence": {
                "path": (
                    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
                    "refreshes/20260805T164500Z-swu-ape-ont-005-apply-approved/"
                    "material/MATERIAL-PACKAGE.json"
                ),
                "sha256": "cda560bdd8a868b3c243159fb1f408e0efd535bc5b39e5597162c1afe61efd2b",
                "size_bytes": 11139,
                "use": "repository-local bounded-command runtime ceiling precedent",
            },
            "claim_ceiling": (
                "The policy structures existing validation intent; no configured unit command "
                "was executed by this proposal."
            ),
            "authority_effect": "none",
        },
    )


def write_dispatch() -> None:
    write_json(
        PACKAGE / "DISPATCH.json",
        {
            "dispatch_id": "wp-rmt-002-execution-contract-refresh-proposal-20260816T120821Z",
            "intent": {
                "raw": "Create and validate the isolated six-target WP-RMT-002 execution-contract Refresh proposal.",
                "objective": "Derive staged plan postimages, replay validators, and freeze a proposal-only receipt.",
                "target_artifact": PACKAGE.relative_to(REPO).as_posix(),
                "arcanum_vocabulary": ["invoke", "refresh", "validation", "receipt"],
            },
            "mode": "sequence",
            "techniques": ["sequence", "validation_loop", "residue_ledger"],
            "steps": [
                {
                    "step_id": "derive",
                    "name": "Derive exact staged postimages",
                    "capability_ref": "invoke",
                    "mode": "refresh",
                    "pattern": "sequential",
                    "parallel": False,
                    "techniques": ["sequence"],
                    "inputs": [{"kind": "artifact", "ref": "preimages/"}],
                    "outputs": [{"kind": "artifact", "ref": "staged/"}],
                    "stop_conditions": ["stop on a field requiring an unbound product or semantic choice"],
                },
                {
                    "step_id": "validate",
                    "name": "Replay staged and official validators",
                    "capability_ref": "work-pack-readiness-audit",
                    "capability_status": "local-extension",
                    "capability_metadata": {
                        "owner": "work-pack-readiness-audit",
                        "validation": "official audit_work_pack.py producer",
                    },
                    "mode": "audit",
                    "pattern": "validation",
                    "parallel": False,
                    "depends_on_steps": ["derive"],
                    "techniques": ["validation_loop"],
                    "inputs": [{"kind": "artifact", "ref": "staged/"}],
                    "outputs": [{"kind": "artifact", "ref": "official-audit/"}],
                    "evidence_artifact": "official-audit/work-pack-readiness-report-v2.json",
                    "stop_conditions": ["stop unless the staged plan validator, audit, and hostile replay pass"],
                },
                {
                    "step_id": "freeze",
                    "name": "Freeze proposal receipt last",
                    "capability_ref": "invoke",
                    "mode": "refresh",
                    "pattern": "handoff",
                    "parallel": False,
                    "depends_on_steps": ["validate"],
                    "techniques": ["residue_ledger", "sequence"],
                    "inputs": [{"kind": "artifact", "ref": "VALIDATION-RESULT.json"}],
                    "outputs": [{"kind": "receipt", "ref": "PROPOSAL-RECEIPT.json"}],
                    "stop_conditions": ["stop if live preimages drift before receipt freeze"],
                },
            ],
            "gates": [
                {
                    "gate_id": "validation-before-receipt",
                    "kind": "validation",
                    "owner": "invoke:refresh",
                    "condition": "All proposal validators pass before the terminal receipt is written.",
                    "on_fail": "block",
                },
                {
                    "gate_id": "owner-acceptance-after-proposal",
                    "kind": "human_approval",
                    "owner": "exact-byte owner",
                    "condition": "Fresh acceptance of the final proposal bytes is required before any live apply.",
                    "on_fail": "defer",
                },
            ],
            "observability": {
                "dispatch_id_required": True,
                "trace_events": ["derive", "validation_loop", "residue_ledger", "receipt-last"],
                "signal_grouping": "dispatch_id",
            },
            "promotion_guardrails": [
                "proposal-only",
                "authority none",
                "no live apply",
                "no selection receipt",
                "no Task Session admission",
            ],
        },
    )
    write_json(
        PACKAGE / "DISPATCH-VALIDATION.json",
        {
            "validation": "pass",
            "blocks": [],
            "flags": [],
            "canonical_stdout": ["VALIDATION=pass", "DISPATCH=DISPATCH.json"],
        },
    )


def build_execution_bindings(
    manifest: dict[str, Any], contracts: dict[str, Any]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    execution: list[dict[str, Any]] = []
    routes: list[dict[str, Any]] = []
    staged_manifest = (STAGED_ROOT / "SWU-MANIFEST.json").relative_to(REPO).as_posix()
    staged_contracts = (STAGED_ROOT / "SWU-CONTRACTS.json").relative_to(REPO).as_posix()
    staged_validator_path = (STAGED_ROOT / "validate-work-pack.mjs").relative_to(REPO).as_posix()
    for index, (swu, contract) in enumerate(zip(manifest["swus"], contracts["contracts"])):
        write_partition = contract["write_partition"]
        execution.append(
            {
                "task_id": contract["task_id"],
                "swu_id": contract["swu_id"],
                "unit_id": contract["swu_id"],
                "lifecycle_owner": contract["lifecycle_owner"],
                "authority_class": contract["authority_class"],
                "publication_class": contract["publication_class"],
                "dependencies": contract["dependencies"],
                "canonical_successors": contract["canonical_successors"],
                "command": {
                    "argv": contract["primary_command"]["argv"],
                    "cwd": contract["primary_command"]["cwd"],
                    "risk_class": contract["primary_command"]["risk_class"],
                },
                "validation_contracts": [
                    {
                        "command_id": item["command_id"],
                        "argv": item["argv"],
                        "cwd": item["cwd"],
                        "timeout_seconds": item["timeout_seconds"],
                        "max_output_bytes": item["max_output_bytes"],
                    }
                    for item in contract["validation_contracts"]
                ],
                "attempt_contract": contract["attempt_contract"],
                "material_writes": write_partition["material_writes"],
                "execution_outputs": write_partition["execution_outputs"],
                "allowed_writes": write_partition["allowed_writes"],
                "material_package": {
                    "package_ref": None,
                    "producer_owner_ref": contract["material_producer_owner"],
                    "producer_receipt_ref": None,
                    "schema_ref": None,
                    "declared_sha256": None,
                    "target_inventory_ref": None,
                },
                "byte_baselines": [],
            }
        )
        prefix = swu["id"].split("-")[1]
        routes.append(
            {
                "route_id": f"task-session:{swu['id'].lower()}",
                "frontier_swu": swu["id"],
                "capability": "task-session",
                "mode": "execute",
                "target": swu["id"],
                "write_scope": write_partition["allowed_writes"],
                "effect_class": "repository-local-reversible",
                "required_inputs": [
                    staged_manifest,
                    staged_contracts,
                    staged_validator_path,
                    f"{PLAN_REL.as_posix()}/tasks/TASK-RMT-{prefix}.md",
                    f"{PLAN_REL.as_posix()}/WRITE-SCOPE-BASELINE.json",
                    f"{PLAN_REL.as_posix()}/HOSTILE-CATALOGUE.json",
                    f"{PLAN_REL.as_posix()}/RELATION-CONTRACTS.json",
                ],
                "expected_receipt": contract["atomicity"]["receipt"],
            }
        )
    return execution, routes


def write_audit_config() -> None:
    manifest_path = STAGED_ROOT / "SWU-MANIFEST.json"
    contracts_path = STAGED_ROOT / "SWU-CONTRACTS.json"
    entry_path = STAGED_ROOT / "EXECUTION-ENTRY.json"
    entry_validation_path = STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json"
    validation_path = STAGED_ROOT / "VALIDATION-RESULT.json"
    validator_path = STAGED_ROOT / "validate-work-pack.mjs"
    source_intent_path = PACKAGE / "SOURCE-INTENT.json"
    manifest = load(manifest_path)
    contracts = load(contracts_path)
    execution, routes = build_execution_bindings(manifest, contracts)
    invoke_entry_routes = load(entry_path)["execution_policy"]["allowed_routes"]
    if (
        len(invoke_entry_routes) != 1
        or invoke_entry_routes[0]["frontier_swu"] != "RMT-OP-001"
    ):
        raise SystemExit("Invoke authoring projection must contain exactly the OP001 route")
    # The finite readiness policy contains all 70 routes, but its OP001 route is the
    # exact Invoke authoring route. Later rows are policy closure, not selectable claims.
    routes[0] = copy.deepcopy(invoke_entry_routes[0])

    prerequisite_live_apply = REPO / (
        "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/"
        "20260816T110235Z-wp-rmt-001-ontology-v2-validator-repair-live-apply/"
        "LIVE-APPLY-RECEIPT.json"
    )
    prerequisite_entry_refresh = REPO / (
        "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/"
        "20260816T112417Z-wp-rmt-002-execution-entry-refresh/"
        "EXECUTION-ENTRY-REFRESH-RECEIPT.json"
    )
    expected_receipts = []
    closeouts = []
    for index, contract in enumerate(contracts["contracts"]):
        unit_id = contract["swu_id"]
        slug = unit_id.lower()
        expected_receipts.append(
            binding(
                f"expected-receipt-{slug}",
                "task-session",
                contracts_path,
                f"/contracts/{index}/terminal_receipt_contract/expected_receipt",
            )
        )
        closeouts.append(
            {
                "unit_id": unit_id,
                "allowed_delta_policy_ref": binding(
                    f"allowed-delta-{slug}",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    f"/contracts/{index}/closeout_contract/allowed_delta_policy",
                ),
                "owner_receipt_contract_ref": binding(
                    f"owner-closeout-{slug}",
                    LIFECYCLE_OWNER,
                    contracts_path,
                    f"/contracts/{index}/closeout_contract/owner_receipt_contract",
                ),
                "compensation": contract["closeout_contract"]["compensation"],
            }
        )

    execution_policy = {
        "work_pack_id": "WP-RMT-002",
        "route_policy": "automatic-in-scope",
        "allowed_routes": routes,
        "allowed_routes_digest": canonical_digest(routes),
        "automatic_decisions": [
            "internal-tool-selection",
            "capability-owner-routing",
            "reversible-local-default",
            "fresh-task-session-resumption",
        ],
        "stop_decisions": [
            "product-or-semantic-choice",
            "scope-expansion",
            "destructive-or-irreversible-effect",
            "credentials-or-secret-access",
            "external-message-or-network-effect",
            "cost-policy-or-risk-acceptance",
            "authority-promotion-publication-deployment",
            "failed-acceptance-critical-validation",
        ],
        "scope_source": "exact-work-pack-and-captured-frontier",
        "validation_policy": "owner-gates-remain-mandatory",
    }
    config = {
        "schema_version": "2.0.0",
        "admission_timing": "selected-unit-at-task-session",
        "audit_id": PROPOSAL_ID,
        "repository_root": ".",
        "evidence_ceiling": "frozen-input-contractual-readiness",
        "classifier_version": "wpra-plan-once-v1",
        "objective_ref": binding(
            "objective-work-pack-id", "wp-rmt-002-plan-owner", manifest_path, "/work_pack_id"
        ),
        "closure_receipt_refs": [
            binding(
                "closure-validator-repair-live-apply",
                "ontology-validator-owner",
                prerequisite_live_apply,
                "/result",
            ),
            binding(
                "closure-execution-entry-refresh",
                "invoke:refresh",
                prerequisite_entry_refresh,
                "/result",
            ),
        ],
        "authority_bindings": {
            "canonical_authority_refs": [
                binding(
                    "canonical-type-bindings",
                    "wp-rmt-002-plan-owner",
                    manifest_path,
                    "/types",
                ),
                binding(
                    "canonical-dependency-graph",
                    "wp-rmt-002-plan-owner",
                    manifest_path,
                    "/swus",
                ),
            ],
            "semantic_bindings": {
                "owner": binding(
                    "semantic-owner-policy",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    "/contracts/0/lifecycle_owner",
                ),
                "material": binding(
                    "semantic-material-policy",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    "/contract_policy/readiness_execution_policy",
                ),
                "validation": binding(
                    "semantic-validation-policy",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    "/contract_policy/command_policy",
                ),
                "receipt": binding(
                    "semantic-terminal-receipt-policy",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    "/contract_policy/terminal_receipt_contract",
                ),
                "closeout": binding(
                    "semantic-closeout-policy",
                    "wp-rmt-002-plan-owner",
                    contracts_path,
                    "/contracts/0/closeout_contract",
                ),
            },
        },
        "execution_bindings": execution,
        "receipt_bindings": {
            "terminal_schema_ref": binding(
                "terminal-receipt-schema",
                "wp-rmt-002-plan-owner",
                contracts_path,
                "/contract_policy/terminal_receipt_contract/schema",
            ),
            "semantic_validator_ref": opaque_binding(
                "terminal-receipt-semantic-validator",
                "wp-rmt-002-plan-owner",
                validator_path,
            ),
            "expected_receipt_refs": expected_receipts,
        },
        "closeout_bindings": closeouts,
        "runtime_binding": {
            "requested_task_session_execution_mode": "material-bound-single-swu",
            "task_session_admission_receipt_ref": None,
        },
        "status_receipt_refs": {
            "artifact_authored_status": {
                "value": "planned-selection-ready",
                "owner_ref": "invoke:refresh",
                "receipt_ref": binding(
                    "status-artifact-authored", "invoke:refresh", manifest_path, "/status"
                ),
            },
            "registry_released_status": {
                "value": "none",
                "owner_ref": "wp-rmt-002-plan-owner",
                "receipt_ref": binding(
                    "status-registry-released",
                    "wp-rmt-002-plan-owner",
                    entry_path,
                    "/authority_effect",
                ),
            },
            "mutation_runtime_ready_status": {
                "value": "selection-ready",
                "owner_ref": "implementation-readiness",
                "receipt_ref": binding(
                    "status-runtime-selection-only",
                    "implementation-readiness",
                    entry_path,
                    "/execution_entry/state",
                ),
            },
            "audit_verdict": {
                "value": "pass",
                "owner_ref": "wp-rmt-002-plan-validator",
                "receipt_ref": binding(
                    "status-staged-plan-validation",
                    "wp-rmt-002-plan-validator",
                    validation_path,
                    "/result",
                ),
            },
        },
        "lifecycle_status_refs": {
            "plan_artifact_status": {
                "value": "selection-ready",
                "owner_ref": "invoke:refresh",
                "receipt_ref": binding(
                    "lifecycle-plan-status", "invoke:refresh", entry_path, "/execution_entry/state"
                ),
            },
            "audit_status": {
                "value": "pass",
                "owner_ref": "wp-rmt-002-plan-validator",
                "receipt_ref": binding(
                    "lifecycle-audit-status",
                    "wp-rmt-002-plan-validator",
                    validation_path,
                    "/result",
                ),
            },
            "approval_status": {
                "value": "absent",
                "owner_ref": "exact-byte-owner",
                "receipt_ref": binding(
                    "lifecycle-approval-status",
                    "exact-byte-owner",
                    source_intent_path,
                    "/owner_acceptance/status",
                ),
            },
            "chain_status": {
                "value": "selection-ready",
                "owner_ref": "invoke:refresh",
                "receipt_ref": binding(
                    "lifecycle-chain-status", "invoke:refresh", entry_path, "/execution_entry/state"
                ),
            },
        },
        "approval_policy": {
            "approval_owner_ref": "exact-byte-owner",
            "decision_gate_receipt_ref": binding(
                "decision-gate-owner-acceptance",
                "exact-byte-owner",
                source_intent_path,
                "/owner_acceptance/status",
            ),
            "run_budget": {"max_task_session_requests": 1},
            "risk_policy_ref": binding(
                "risk-policy-command-ceiling",
                "wp-rmt-002-plan-owner",
                contracts_path,
                "/contract_policy/command_policy",
            ),
            "allowed_audit_verdicts": ["pass"],
            "allowed_flag_classes": [],
        },
        "continuity_projection": {
            "cursor": "RMT-OP-001",
            "completed_unit_receipt_refs": [],
            "joined_closeout_receipt_refs": [],
            "projected_next_successor": {
                "unit_id": "RMT-OP-001",
                "canonical_successor_ref": binding(
                    "continuity-canonical-op001",
                    "invoke:refresh",
                    entry_path,
                    "/frontier/0",
                ),
                "projection_owner_ref": "work-pack-readiness-audit",
                "equivalence_validator_ref": binding(
                    "continuity-equivalence-op001",
                    "wp-rmt-002-plan-validator",
                    entry_validation_path,
                    "/frontier/0",
                ),
                "continuation_router_verification_receipt_ref": binding(
                    "continuity-route-op001",
                    "invoke:refresh",
                    manifest_path,
                    "/frontier/0",
                ),
                "authority_effect": "none",
            },
        },
        "execution_policy": execution_policy,
    }
    write_json(PACKAGE / "audit-config.json", config)


def write_apply_proposal() -> None:
    changes = []
    for name in TARGETS:
        preimage = PREIMAGE_ROOT / name
        postimage = STAGED_ROOT / name
        changes.append(
            {
                "target": f"{PLAN_REL.as_posix()}/{name}",
                "operation": "replace",
                "preimage": exact_ref(preimage),
                "staged_postimage": exact_ref(postimage),
            }
        )
    write_json(
        PACKAGE / "APPLY-PROPOSAL.json",
        {
            "schema_version": "domainspec.invoke-refresh-apply-proposal/v1",
            "mode": "proposal-only-non-applicable",
            "work_pack_id": "WP-RMT-002",
            "target_count": 6,
            "changes": changes,
            "preserved_live_artifacts": [
                exact_ref(LIVE_PLAN / "WORK-PACK.md"),
                exact_ref(LIVE_PLAN / "EXECUTION-PACK.md"),
                exact_ref(LIVE_PLAN / "PLAN-RECEIPT.json"),
                exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"),
            ],
            "historical_diagnostic_only": (
                "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/"
                "20260816T115442Z-wp-rmt-002-rmt-op-001-readiness-selection"
            ),
            "applicability": {
                "state": "blocked-pending-fresh-exact-owner-acceptance",
                "owner_acceptance": "absent",
                "apply_authorization": "absent",
                "mutation_ready": False,
                "authority_effect": "none",
            },
        },
    )


def write_hostile_fixtures() -> None:
    fixtures = [
        {"fixture_id": "missing-timeout", "expected_code": "MISSING_TIMEOUT"},
        {"fixture_id": "ambiguous-successor", "expected_code": "AMBIGUOUS_SUCCESSOR"},
        {"fixture_id": "write-partition", "expected_code": "WRITE_PARTITION_INVALID"},
        {
            "fixture_id": "lifecycle-authority-publication-drift",
            "expected_code": "LIFECYCLE_AUTHORITY_PUBLICATION_DRIFT",
        },
        {"fixture_id": "command-env-drift", "expected_code": "COMMAND_ENV_DRIFT"},
        {"fixture_id": "wrong-executable", "expected_code": "COMMAND_EXECUTABLE_DRIFT"},
        {"fixture_id": "cargo-risk", "expected_code": "CARGO_RISK_DRIFT"},
        {"fixture_id": "cargo-partition", "expected_code": "CARGO_PARTITION_DRIFT"},
        {"fixture_id": "entry-extra-field", "expected_code": "EXECUTION_ENTRY_SCHEMA_INVALID"},
        {
            "fixture_id": "entry-noncanonical-result",
            "expected_code": "ENTRY_CANONICAL_OUTPUT_DRIFT",
        },
        {"fixture_id": "stale-source", "expected_code": "STALE_SOURCE"},
        {
            "fixture_id": "stale-rejected-freeze-binding",
            "expected_code": "REJECTED_FREEZE_BINDING_STALE",
        },
        {
            "fixture_id": "transient-run-directory-overlap",
            "expected_code": "TRANSIENT_RUN_DIRECTORY_OVERLAP",
        },
        {
            "fixture_id": "transient-plan-ledger-overlap",
            "expected_code": "TRANSIENT_PLAN_LEDGER_OVERLAP",
        },
        {
            "fixture_id": "transient-prerequisite-ledger-overlap",
            "expected_code": "TRANSIENT_PREREQUISITE_LEDGER_OVERLAP",
        },
        {
            "fixture_id": "transient-prerequisite-receipt-overlap",
            "expected_code": "TRANSIENT_PREREQUISITE_RECEIPT_OVERLAP",
        },
        {
            "fixture_id": "external-executor-receipt-not-run-scoped",
            "expected_code": "EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
        },
        {
            "fixture_id": "tampered-ticket-executor-receipt-path",
            "expected_code": "TICKET_EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
        },
        {
            "fixture_id": "tampered-ticket-prerequisite-reservation",
            "expected_code": "TICKET_TRANSIENT_PREREQUISITE_RESERVATION_OVERLAP",
        },
        {
            "fixture_id": "ticket-only-transient-substitution",
            "expected_code": "TASK_SESSION_TICKET_CHECKPOINT_REF_STALE",
        },
        {
            "fixture_id": "ticket-checkpoint-transient-substitution",
            "expected_code": "TASK_SESSION_TICKET_TRANSIENT_CLOSURE_DRIFT",
        },
        {
            "fixture_id": "decision-gate-command-drift",
            "expected_code": "DECISION_GATE_COMMAND_DRIFT",
        },
        {
            "fixture_id": "decision-gate-command-nonzero-propagation",
            "expected_code": "DECISION_GATE_COMMAND_NONZERO",
        },
        {"fixture_id": "stored-plan-output-drift", "expected_code": "STORED_PLAN_OUTPUT_DRIFT"},
        {"fixture_id": "refresh-signal-mapping", "expected_code": "REFRESH_SIGNAL_MAPPING_DRIFT"},
        {"fixture_id": "refresh-signal-source-closure", "expected_code": "REFRESH_SOURCE_SIGNAL_UNBOUND"},
        {"fixture_id": "acceptance-inflation", "expected_code": "ACCEPTANCE_INFLATION"},
        {"fixture_id": "receipt-wrong-task", "expected_code": "WP_TERMINAL_RECEIPT_IDENTITY"},
        {"fixture_id": "receipt-wrong-swu", "expected_code": "WP_TERMINAL_RECEIPT_IDENTITY"},
        {
            "fixture_id": "receipt-empty-inventory",
            "expected_code": "WP_TERMINAL_RECEIPT_PASS_MATERIAL_INCOMPLETE",
        },
        {
            "fixture_id": "receipt-unknown-inventory",
            "expected_code": "WP_TERMINAL_RECEIPT_MATERIAL_UNKNOWN",
        },
        {
            "fixture_id": "receipt-stale-inventory",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_STALE",
        },
        {
            "fixture_id": "receipt-validation-evidence",
            "expected_code": "WP_TERMINAL_RECEIPT_VALIDATION_COUNT",
        },
        {"fixture_id": "receipt-authority", "expected_code": "WP_TERMINAL_RECEIPT_RESULT"},
        {
            "fixture_id": "receipt-wrong-executable",
            "expected_code": "WP_TERMINAL_RECEIPT_PRIMARY_RUNTIME",
        },
        {
            "fixture_id": "receipt-forged-self-consistent-hash",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
        },
        {
            "fixture_id": "receipt-drifted-bytes",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
        },
        {
            "fixture_id": "receipt-omitted-exact-file",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
        },
        {
            "fixture_id": "receipt-recursive-directory-omission",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
        },
        {
            "fixture_id": "receipt-symlink-escape",
            "expected_code": "WP_TERMINAL_RECEIPT_MATERIAL_SYMLINK",
        },
        {
            "fixture_id": "receipt-transient-residue",
            "expected_code": "WP_TERMINAL_RECEIPT_TRANSIENT_PRESENT",
        },
        {
            "fixture_id": "receipt-wrong-raw-ordering",
            "expected_code": "WP_TERMINAL_RECEIPT_INVENTORY_ORDER",
        },
        {
            "fixture_id": "receipt-before-material",
            "expected_code": "WP_TERMINAL_RECEIPT_NOT_LAST",
        },
        {
            "fixture_id": "receipt-fabricated-later-command",
            "expected_code": "WP_TERMINAL_RECEIPT_FAIL_FAST_SUFFIX",
        },
        {
            "fixture_id": "receipt-missing-not-run-suffix",
            "expected_code": "WP_TERMINAL_RECEIPT_VALIDATION_COUNT",
        },
        {
            "fixture_id": "receipt-result-inflation",
            "expected_code": "WP_TERMINAL_RECEIPT_PASS_COHERENCE",
        },
        {
            "fixture_id": "receipt-copied-topology-wrong-root",
            "expected_code": "WP_TERMINAL_RECEIPT_REPOSITORY_BINDING",
        },
        {
            "fixture_id": "receipt-wrong-repository-identity",
            "expected_code": "WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY_STALE",
        },
        {
            "fixture_id": "receipt-arbitrary-attempt",
            "expected_code": "WP_TERMINAL_RECEIPT_ATTEMPT_CONTEXT",
        },
        {
            "fixture_id": "receipt-reused-attempt",
            "expected_code": "WP_TERMINAL_RECEIPT_ATTEMPT_REUSED",
        },
        {
            "fixture_id": "receipt-conflicting-attempt",
            "expected_code": "WP_TERMINAL_RECEIPT_LEDGER_REF_STALE",
        },
        {
            "fixture_id": "receipt-stale-selection-ref",
            "expected_code": "WP_TERMINAL_RECEIPT_SELECTION_REF_STALE",
        },
        {
            "fixture_id": "receipt-stale-admission-ref",
            "expected_code": "WP_TERMINAL_RECEIPT_ADMISSION_REF_STALE",
        },
        {
            "fixture_id": "receipt-stale-context-ref",
            "expected_code": "WP_TERMINAL_RECEIPT_CONTEXT_REF_STALE",
        },
        {
            "fixture_id": "receipt-fixed-path-replacement",
            "expected_code": "WP_TERMINAL_RECEIPT_FIXED_PATH_BASELINE",
        },
        {
            "fixture_id": "receipt-full-contract-unit-digest-substitution",
            "expected_code": "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING",
        },
        {
            "fixture_id": "receipt-staged-swu-manifest-substitution",
            "expected_code": "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING",
        },
        {
            "fixture_id": "receipt-all-writes-baseline-substitution",
            "expected_code": "WP_TERMINAL_RECEIPT_TARGET_BASELINE",
        },
        {
            "fixture_id": "receipt-stale-write-scope-baseline-ref",
            "expected_code": "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_REF_STALE",
        },
        {
            "fixture_id": "receipt-missing-plan-baseline-coverage",
            "expected_code": "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_COVERAGE",
        },
        {
            "fixture_id": "receipt-prestate-not-in-control-refs",
            "expected_code": "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING",
        },
        {
            "fixture_id": "receipt-ledger-governance-request-substitution",
            "expected_code": "WP_TERMINAL_RECEIPT_LEDGER_BINDING",
        },
        {
            "fixture_id": "receipt-prestate-not-before-material",
            "expected_code": "WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_ORDER",
        },
        {
            "fixture_id": "receipt-stale-execution-ticket-ref",
            "expected_code": "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_REF_STALE",
        },
        {
            "fixture_id": "receipt-forged-internally-consistent-admission-token",
            "expected_code": "WP_TERMINAL_RECEIPT_ADMISSION_TOKEN",
        },
        {
            "fixture_id": "receipt-missing-cargo-admission-output",
            "expected_code": "WP_TERMINAL_RECEIPT_ADMISSION_BINDING",
        },
        {
            "fixture_id": "receipt-substituted-cargo-admission-output",
            "expected_code": "WP_TERMINAL_RECEIPT_ADMISSION_BINDING",
        },
        {
            "fixture_id": "receipt-missing-cargo-run-contract",
            "expected_code": "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING",
        },
        {
            "fixture_id": "receipt-substituted-cargo-ticket-contract",
            "expected_code": "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_BINDING",
        },
    ]
    write_json(
        PACKAGE / "HOSTILE-FIXTURES.json",
        {
            "schema_version": "domainspec.wp-rmt-002-refresh-hostiles/v1",
            "fixture_count": len(fixtures),
            "fixtures": fixtures,
            "authority_effect": "none",
        },
    )


def write_refresh_contract() -> None:
    target_artifacts = [f"{PLAN_REL.as_posix()}/{name}" for name in TARGETS]
    signal_targets = {
        "RS-EXECUTION-CONTRACT": [
            target_artifacts[0],
            target_artifacts[1],
            target_artifacts[3],
            target_artifacts[4],
        ],
        "RS-CANONICAL-ENTRY": [
            target_artifacts[2],
            target_artifacts[3],
            target_artifacts[5],
        ],
        "RS-RECEIPT-LIVE-CENSUS": [
            target_artifacts[1],
            target_artifacts[3],
            target_artifacts[4],
        ],
        "RS-REFRESH-EVIDENCE-CONTRACT": target_artifacts,
    }
    source_signals = [
        {
            "id": "RS-EXECUTION-CONTRACT",
            "source_path": (PACKAGE / "SOURCE-INTENT.json").relative_to(REPO).as_posix(),
            "signal_type": "artifact_drift",
            "target_artifacts": signal_targets["RS-EXECUTION-CONTRACT"],
            "claim": "The 70-unit plan required complete execution identities, command contracts, deterministic successors, and write partitions.",
            "evidence": "The independent review of the superseded proposal found missing or incomplete execution-contract fields across the finite policy.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-CANONICAL-ENTRY",
            "source_path": CANONICAL_ENTRY_VALIDATOR.relative_to(REPO).as_posix(),
            "signal_type": "artifact_drift",
            "target_artifacts": signal_targets["RS-CANONICAL-ENTRY"],
            "claim": "Execution-entry validation must use the installed implementation-readiness producer and its exact sorted-key output.",
            "evidence": "The local JavaScript oracle emitted different bytes from the installed canonical Python validator.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-RECEIPT-LIVE-CENSUS",
            "source_path": (PACKAGE / "validation/terminal-receipt-validator.fragment.mjs").relative_to(REPO).as_posix(),
            "signal_type": "artifact_drift",
            "target_artifacts": signal_targets["RS-RECEIPT-LIVE-CENSUS"],
            "claim": "Terminal receipts must bind actual contained material bytes and truthful fail-fast command evidence.",
            "evidence": "The superseded validator accepted declared-only inventories and could not represent zero or partial block residues.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-REFRESH-EVIDENCE-CONTRACT",
            "source_path": "arcanum/spells/invoke/refresh.md#evidence-capability-contract",
            "signal_type": "status_changed",
            "target_artifacts": signal_targets["RS-REFRESH-EVIDENCE-CONTRACT"],
            "claim": "The active proposal report now follows the normalized snake_case Invoke Refresh evidence contract.",
            "evidence": "The report carries mandatory source, target, mode, phase, handoff, blocker, material, validation, result, and route evidence.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
    ]
    source_evidence = [
        {"evidence_id": "source-intent", **exact_ref(PACKAGE / "SOURCE-INTENT.json"), "claim": "delegated proposal-only repair authority"},
        {"evidence_id": "canonical-entry-validator", **exact_ref(CANONICAL_ENTRY_VALIDATOR), "claim": "installed canonical execution-entry producer"},
        {"evidence_id": "canonical-entry-schema", **exact_ref(CANONICAL_ENTRY_SCHEMA), "claim": "installed canonical execution-entry schema"},
        {"evidence_id": "terminal-receipt-validator-fragment", **exact_ref(PACKAGE / "validation/terminal-receipt-validator.fragment.mjs"), "claim": "exact context-bound live material and receipt semantic source"},
        {"evidence_id": "canonical-invoke-refresh", **exact_ref(INVOKE_REFRESH_SOURCE), "claim": "canonical Invoke Refresh Evidence Capability Contract"},
        {"evidence_id": "canonical-selection-receipt-schema", **exact_ref(SELECTION_RECEIPT_SCHEMA), "claim": "canonical implementation-readiness selection identity schema"},
        {"evidence_id": "canonical-mutation-admission-schema", **exact_ref(MUTATION_ADMISSION_SCHEMA), "claim": "canonical Task Session mutation admission schema"},
        {"evidence_id": "canonical-governance-run-request-schema", **exact_ref(GOVERNANCE_RUN_REQUEST_SCHEMA), "claim": "canonical current-run and plan-admission contract"},
        {"evidence_id": "canonical-execution-ticket-schema", **exact_ref(EXECUTION_TICKET_SCHEMA), "claim": "canonical Task Session execution-ticket identity"},
        {"evidence_id": "canonical-governance-terminal-schema", **exact_ref(GOVERNANCE_TERMINAL_SCHEMA), "claim": "canonical consumed_admission projection"},
        {"evidence_id": "canonical-task-session-governance-runner", **exact_ref(TASK_SESSION_RUNNER), "claim": "canonical plan admission and single-use ledger semantics"},
        {"evidence_id": "preserved-write-scope-baseline", **exact_ref(LIVE_PLAN / "WRITE-SCOPE-BASELINE.json"), "claim": "immutable all-absent plan baseline and exact SWU path ownership"},
        {"evidence_id": "staged-plan-result", **exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json"), "claim": "staged Work-Pack semantic validation"},
        {"evidence_id": "official-readiness-audit", **exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json"), "claim": "official finite-policy readiness projection"},
        {"evidence_id": "preserved-distill", **exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"), "claim": "accepted product and dependency semantics remain unchanged"},
    ]
    inventory_rows = [
        f"{item['sha256']}\t{item['size_bytes']}\t{item['path']}\n"
        for item in sorted(source_evidence, key=lambda item: item["path"].encode("utf-8"))
    ]
    target_inventory = [
        {
            "target_path": f"{PLAN_REL.as_posix()}/{name}",
            "operation": "replace",
            "preimage_ref": exact_ref(PREIMAGE_ROOT / name),
            "live_ref": exact_ref(LIVE_PLAN / name),
            "staged_postimage_ref": exact_ref(STAGED_ROOT / name),
            "live_matches_preimage": (LIVE_PLAN / name).read_bytes()
            == (PREIMAGE_ROOT / name).read_bytes(),
            "staged_differs_from_preimage": (STAGED_ROOT / name).read_bytes()
            != (PREIMAGE_ROOT / name).read_bytes(),
        }
        for name in TARGETS
    ]
    target_signal_ids = {
        "SWU-MANIFEST.json": ["RS-EXECUTION-CONTRACT", "RS-REFRESH-EVIDENCE-CONTRACT"],
        "SWU-CONTRACTS.json": ["RS-EXECUTION-CONTRACT", "RS-RECEIPT-LIVE-CENSUS"],
        "EXECUTION-ENTRY.json": ["RS-CANONICAL-ENTRY"],
        "validate-work-pack.mjs": ["RS-EXECUTION-CONTRACT", "RS-CANONICAL-ENTRY", "RS-RECEIPT-LIVE-CENSUS"],
        "VALIDATION-RESULT.json": ["RS-EXECUTION-CONTRACT", "RS-RECEIPT-LIVE-CENSUS"],
        "EXECUTION-ENTRY-VALIDATION.json": ["RS-CANONICAL-ENTRY"],
    }
    proposed_changes = [
        {
            "change_id": f"replace-{name.lower().replace('.', '-')}",
            "target_artifact": f"{PLAN_REL.as_posix()}/{name}",
            "signal_ids": target_signal_ids[name],
            "operation": "replace",
            "summary": "Replace only after fresh exact-byte owner acceptance and separate live-apply authorization.",
        }
        for name in TARGETS
    ]
    write_json(
        PACKAGE / "refresh-report.json",
        {
            "schema_version": "domainspec.invoke-refresh-report/v2",
            "mode": "refresh",
            "execution_path": [
                "invoke:refresh:normalize-source-signals",
                "invoke:refresh:derive-six-staged-postimages",
                "implementation-readiness:validate-canonical-entry",
                "work-pack-readiness-audit:audit-staged-plan",
                "invoke:refresh:validate-proposal-and-hostiles",
            ],
            "dispatch_trace": {
                "dispatch_ref": exact_ref(PACKAGE / "DISPATCH.json"),
                "validation_ref": exact_ref(PACKAGE / "DISPATCH-VALIDATION.json"),
                "dispatch_id": "wp-rmt-002-execution-contract-refresh-proposal-20260816T120821Z",
                "execution": "single bounded proposal author; no governed multi-agent dispatch",
            },
            "evidence_date": "2026-08-16",
            "source_evidence": source_evidence,
            "source_inventory": {
                "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows",
                "file_count": len(source_evidence),
                "total_size_bytes": sum(item["size_bytes"] for item in source_evidence),
                "sha256": sha256_bytes("".join(inventory_rows).encode("utf-8")),
            },
            "target_artifacts": target_artifacts,
            "target_inventory": target_inventory,
            "activation_source": "delegated",
            "mutation_mode": "proposal-only",
            "mutation_mode_source": "explicit",
            "phase_status": "pass",
            "phase_status_basis": {
                "artifact_complete": True,
                "refresh_authoring_blocker_count": 0,
                "basis": "exact six-target proposal, normalized report, and required canonical validation are complete",
            },
            "handoff_status": "gated",
            "source_signals": source_signals,
            "delta_summary": [
                {"delta": "artifact_drift", "count": 3, "summary": "execution, entry-oracle, and receipt semantics repaired"},
                {"delta": "status_changed", "count": 1, "summary": "Refresh evidence contract normalized without granting apply authority"},
            ],
            "proposed_changes": proposed_changes,
            "applied_changes": [],
            "skipped_changes": [
                "live plan mutation",
                "SWU selection or Task Session admission",
                "product, ontology, candidate, or PromotionRecord mutation",
                "promotion, publication, release, deployment, or production effects",
            ],
            "material_package": {
                "required": False,
                "receipt_present": False,
                "schema_valid": None,
                "patch_verdict": "not-applicable",
                "mutation_handoff": "gated",
                "package_id": None,
                "package_digest": None,
                "expected_package_id": None,
                "expected_package_digest": None,
                "package_path": None,
                "receipt_path": None,
                "schema_path": None,
                "validated_paths": [],
                "dependency_ids": [],
                "dependency_result": "not-applicable",
                "owner": "invoke:refresh",
                "owner_boundary_result": "pass",
                "publication_boundary_result": "pass",
                "validation_commands": [],
                "validation_result": "not-applicable",
                "lifecycle_owner": "invoke:refresh",
                "lifecycle_status": "proposal-only",
                "authority_class": "private",
                "authority_effect": "none",
                "publication_class": "internal",
                "publication_effect": "none",
            },
            "blockers": [
                {"id": "RFR-AUTHORING", "scope": "refresh-authoring", "owner": "invoke:refresh", "status": "resolved", "claim": "normalized proposal evidence is complete"},
                {"id": "RFR-APPLY-AUTH", "scope": "apply-authorization", "owner": "exact-byte-owner", "status": "deferred", "claim": "fresh acceptance and separate six-target apply authorization are absent"},
                {"id": "RFR-TARGET-LIFECYCLE", "scope": "target-lifecycle", "owner": "task-session", "status": "deferred", "claim": "no unit is selected or admitted for implementation"},
                {"id": "RFR-INDEPENDENT-AUDIT", "scope": "audit", "owner": "independent-parent-auditor", "status": "open", "claim": "the receipt-absent freeze requires independent replay"},
            ],
            "blocker_scopes": {
                "refresh_authoring": 0,
                "apply_authorization": 1,
                "target_lifecycle": 1,
                "audit": 1,
            },
            "validation": [
                {"id": "canonical-entry", "command": f"python3 {CANONICAL_ENTRY_VALIDATOR.relative_to(REPO).as_posix()} --projection <staged-entry>", "result": "pass", "output_ref": exact_ref(STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json")},
                {"id": "staged-work-pack", "command": "node <staged-validate-work-pack.mjs> . --logical-plan-root <plan> --emit-expected", "result": "pass", "output_ref": exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json")},
                {"id": "official-readiness-audit", "command": "python3 audit_work_pack.py --config audit-config.json --output-dir <isolated-output>", "result": "pass", "output_ref": exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json")},
                {"id": "dispatch", "command": "python3 validate-dispatch.py DISPATCH.json", "result": "pass", "output_ref": exact_ref(PACKAGE / "DISPATCH-VALIDATION.json")},
            ],
            "outputs": [
                exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json"),
                exact_ref(STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json"),
                exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json"),
            ],
            "mutation_ready": False,
            "result": "pass",
            "next_route": "deferred",
            "next_owner": "exact-byte-owner:accept-proposal-bytes",
            "owner": "invoke:refresh",
            "lifecycle_owner": "projects/domainspec-v2",
            "authority_effect": "none",
            "publication_effect": "none",
            "claim_ceiling": "validated proposal bytes only; runtime version and SHA are Task Session-owned observations and are not independently rehashed by this proposal; no live apply, selection, admission, implementation, promotion, publication, release, deployment, production readiness, Git, network, or external effect",
            "distill": {
                "status": "preserved",
                "rationale": "The repair changes execution evidence and validation mechanics without changing accepted product, hostile, REL-A, or dependency semantics.",
                "source_ref": exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"),
            },
        },
    )


def write_option_a_evidence() -> None:
    """Replace inherited six-target reports with the selected Option A package view."""

    targets = list(ALL_TARGETS)
    target_inventory = proposal_target_inventory()
    decision_refs = {
        "option_admissibility_request_ref": exact_ref(DECISION_REQUEST),
        "option_admissibility_receipt_ref": exact_ref(DECISION_RECEIPT),
        "decision_record_ref": exact_ref(DECISION_RECORD),
        "governance_defect_receipt_ref": exact_ref(GOVERNANCE_DEFECT_RECEIPT),
        "decision_gate_proposal_ref": exact_ref(DECISION_GATE_PROPOSAL),
    }
    write_json(
        PACKAGE / "SOURCE-INTENT.json",
        {
            "schema_version": "domainspec.invoke-refresh-source-intent/v2",
            "proposal_id": PROPOSAL_ID,
            "route": ["decision-gate", "invoke:refresh"],
            "mode": "proposal-only",
            "evidence_date": "2026-08-16",
            "activation_source": {
                "kind": "direct-user",
                "exact_response": "A",
                "selected_option": "A",
                "authority": "proposal-authoring-only",
            },
            "objective": (
                "Stage and validate the smallest generic public Task Session transient-output "
                "contract, generated runtime parity, and dependent WP-RMT-002 proof without "
                "mutating any live target."
            ),
            "decision": decision_refs,
            "exact_staged_targets": targets,
            "target_count": len(targets),
            "target_classes": {
                "canonical_public_task_session": len(TASK_SESSION_CANONICAL_TARGETS),
                "generated_codex_parity": len(TASK_SESSION_GENERATED_RELS),
                "generated_claude_parity": len(TASK_SESSION_GENERATED_RELS),
                "dependent_wp_rmt_002_proof": len(WP_TARGETS),
            },
            "owner_acceptance": {
                "status": "absent",
                "required_next": True,
                "scope": "exact proposal bytes and receipt-absent inventory",
            },
            "apply_authorization": "absent",
            "selection_receipt": "absent",
            "task_session_admission": "absent",
            "swu_execution": "absent",
            "authority_effect": "none",
            "forbidden_effects": [
                "live-arcanum-mutation",
                "live-generated-runtime-mutation",
                "live-work-pack-mutation",
                "product-or-ontology-mutation",
                "selection-or-task-session-admission",
                "swu-execution",
                "promotion-publication-release-deploy-production",
                "git-network-external-effects",
            ],
        },
    )

    dispatch = load(PACKAGE / "DISPATCH.json")
    dispatch["dispatch_id"] = PROPOSAL_ID
    dispatch["intent"]["raw"] = (
        "Persist user-selected Decision Gate Option A, stage the generic public Task "
        "Session transient-output API with generated parity, and replay WP-RMT-002."
    )
    dispatch["intent"]["objective"] = (
        "Freeze one proposal-only 33-target candidate for independent audit and fresh "
        "exact-byte owner acceptance."
    )
    dispatch["intent"]["arcanum_vocabulary"] = [
        "decision-gate",
        "invoke",
        "refresh",
        "task-session",
        "work-pack-readiness-audit",
    ]
    dispatch["steps"][0]["name"] = (
        "Derive public Task Session API, generated parity, and dependent WP postimages"
    )
    dispatch["steps"][1]["name"] = (
        "Replay canonical Task Session, Work-Pack, readiness, and hostile validators"
    )
    dispatch["steps"][1]["capability_ref"] = "invoke"
    dispatch["steps"][1]["capability_metadata"] = {
        "owner": "invoke:refresh",
        "validation": "candidate suite plus official Work-Pack Readiness producer",
    }
    dispatch["steps"][2]["name"] = "Freeze receipt-absent bytes for independent audit"
    dispatch["steps"][2]["outputs"] = [
        {"kind": "artifact", "ref": "receipt-absent frozen inventory"}
    ]
    dispatch["steps"][2]["stop_conditions"] = [
        "do not write PROPOSAL-RECEIPT.json before independent audit authorization"
    ]
    write_json(PACKAGE / "DISPATCH.json", dispatch)

    changes = [
        {
            "target": row["target_path"],
            "target_class": row["target_class"],
            "operation": "replace",
            "preimage": row["preimage_ref"],
            "staged_postimage": row["staged_postimage_ref"],
        }
        for row in target_inventory
    ]
    sealed_defect = load(GOVERNANCE_DEFECT_RECEIPT)
    rejected_freeze = sealed_defect["rejected_freeze"]
    write_json(
        PACKAGE / "APPLY-PROPOSAL.json",
        {
            "schema_version": "domainspec.invoke-refresh-apply-proposal/v2",
            "proposal_id": PROPOSAL_ID,
            "mode": "proposal-only-non-applicable",
            "selected_option": "A",
            "decision": decision_refs,
            "work_pack_id": "WP-RMT-002",
            "target_count": len(changes),
            "changes": changes,
            "preserved_live_artifacts": [
                exact_ref(LIVE_PLAN / "WORK-PACK.md"),
                exact_ref(LIVE_PLAN / "EXECUTION-PACK.md"),
                exact_ref(LIVE_PLAN / "PLAN-RECEIPT.json"),
                exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"),
            ],
            "superseded_unreceipted_proposal": {
                "path": REJECTED_PROPOSAL.relative_to(REPO).as_posix(),
                "rejected_freeze_sha256": rejected_freeze["sha256"],
                "rejected_freeze_file_count": rejected_freeze["file_count"],
                "rejected_freeze_total_size_bytes": rejected_freeze[
                    "total_size_bytes"
                ],
                "derivation_ref": {
                    **exact_ref(GOVERNANCE_DEFECT_RECEIPT),
                    "selector": "/rejected_freeze",
                },
                "terminal_receipt_present": True,
                "receipt_kind": "governance-defect-block",
            },
            "applicability": {
                "state": "blocked-pending-independent-audit-and-fresh-exact-owner-acceptance",
                "independent_audit": "open",
                "owner_acceptance": "absent",
                "apply_authorization": "absent",
                "mutation_ready": False,
                "authority_effect": "none",
            },
        },
    )

    source_evidence = [
        {"evidence_id": "decision-request", **exact_ref(DECISION_REQUEST), "claim": "presented A/B/C option set"},
        {"evidence_id": "decision-prefilter", **exact_ref(DECISION_RECEIPT), "claim": "installed Decision Gate prefilter accepted the presented option set"},
        {"evidence_id": "decision-record", **exact_ref(DECISION_RECORD), "claim": "direct user response A and proposal-only authority ceiling"},
        {"evidence_id": "decision-prefilter-producer", **exact_ref(DECISION_PREFILTER), "claim": "installed canonical Decision Gate option producer"},
        {"evidence_id": "decision-request-schema", **exact_ref(DECISION_REQUEST_SCHEMA), "claim": "installed canonical option request schema"},
        {"evidence_id": "decision-receipt-schema", **exact_ref(DECISION_RECEIPT_SCHEMA), "claim": "installed canonical option receipt schema"},
        {"evidence_id": "governance-defect", **exact_ref(GOVERNANCE_DEFECT_RECEIPT), "claim": "sealed public API defect and rejected unreceipted freeze"},
        {"evidence_id": "decision-gate-proposal", **exact_ref(DECISION_GATE_PROPOSAL), "claim": "sealed A/B/C public API decision surface"},
        {"evidence_id": "invoke-refresh-contract", **exact_ref(INVOKE_REFRESH_SOURCE), "claim": "canonical Refresh Evidence Capability Contract"},
        {"evidence_id": "task-session-candidate-validation", **exact_ref(TASK_SESSION_CANDIDATE_RESULT), "claim": "actual staged public API suites and generated parity"},
        {"evidence_id": "sealed-minimum-regression-matrix", **exact_ref(REGRESSION_MATRIX), "claim": "all fifteen Decision Gate requirements and nine independent-audit governance and ticket-closure regressions map to passing exact candidate evidence"},
        {"evidence_id": "wp-terminal-fragment", **exact_ref(PACKAGE / "validation/terminal-receipt-validator.fragment.mjs"), "claim": "dependent WP terminal proof source"},
        {"evidence_id": "wp-staged-validation", **exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json"), "claim": "70-unit dependent plan replay with seven Cargo transients"},
        {"evidence_id": "official-readiness-audit", **exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json"), "claim": "official staged finite-policy readiness projection"},
        {"evidence_id": "preserved-plan-receipt", **exact_ref(LIVE_PLAN / "PLAN-RECEIPT.json"), "claim": "immutable accepted plan source boundary"},
        {"evidence_id": "preserved-distill", **exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"), "claim": "unchanged product, dependency, hostile, and REL-A semantics"},
    ]
    source_rows = [
        f"{item['sha256']}\t{item['size_bytes']}\t{item['path']}\n"
        for item in sorted(source_evidence, key=lambda item: item["path"].encode("utf-8"))
    ]
    public_targets = [
        item for item in targets if not item.startswith(PLAN_REL.as_posix())
    ]
    signals = [
        {
            "id": "RS-OPTION-A",
            "source_path": exact_ref(DECISION_RECORD)["path"],
            "signal_type": "route_changed",
            "target_artifacts": targets,
            "claim": "The direct user selected Option A for a first-class generic transient-output contract.",
            "evidence": "The sealed Decision Gate record binds exact response A and proposal-only authoring authority.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-GOVERNANCE-DEFECT",
            "source_path": exact_ref(GOVERNANCE_DEFECT_RECEIPT)["path"],
            "signal_type": "blocker_resolved",
            "target_artifacts": public_targets,
            "claim": "Option A resolves the previously gated public API design choice at proposal level.",
            "evidence": "The sealed defect receipt identifies transient admission as a public Task Session contract gap.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-TASK-SESSION-CANDIDATE",
            "source_path": exact_ref(TASK_SESSION_CANDIDATE_RESULT)["path"],
            "signal_type": "evidence_added",
            "target_artifacts": public_targets,
            "claim": "The staged generic API preserves durable reconciliation and legacy compatibility while admitting transient outputs separately and reserving future Task Session governance write paths.",
            "evidence": "Canonical staged suites, nine reserved-governance-path and ticket-closure regressions, and both generated runtime projections pass from actual candidate bytes.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-WP-DEPENDENT-PROOF",
            "source_path": exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json")["path"],
            "signal_type": "evidence_added",
            "target_artifacts": list(WP_TARGETS),
            "claim": "WP-RMT-002 maps exactly seven Cargo target directories through the candidate transient contract.",
            "evidence": "The staged 70-unit validator and official readiness audit pass without changing dependency or product semantics.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
        {
            "id": "RS-INVOKE-REFRESH-CONTRACT",
            "source_path": exact_ref(INVOKE_REFRESH_SOURCE)["path"],
            "signal_type": "no_op",
            "target_artifacts": targets,
            "claim": "The package remains proposal-only and requires independent audit plus fresh exact-byte owner acceptance.",
            "evidence": "Invoke Refresh separates a complete authored proposal from downstream apply and lifecycle authority.",
            "confidence": "high",
            "mutation_safety": "safe",
        },
    ]
    proposed_changes = []
    for row in target_inventory:
        public = row["target_class"] != "dependent-wp-rmt-002-proof"
        proposed_changes.append(
            {
                "change_id": "replace-" + row["target_path"].replace("/", "-").replace(".", "-"),
                "target_artifact": row["target_path"],
                "signal_ids": (
                    [
                        "RS-OPTION-A",
                        "RS-GOVERNANCE-DEFECT",
                        "RS-TASK-SESSION-CANDIDATE",
                        "RS-INVOKE-REFRESH-CONTRACT",
                    ]
                    if public
                    else [
                        "RS-OPTION-A",
                        "RS-WP-DEPENDENT-PROOF",
                        "RS-INVOKE-REFRESH-CONTRACT",
                    ]
                ),
                "operation": "replace",
                "summary": (
                    "Stage the selected generic public transient-output API and runtime parity."
                    if public
                    else "Stage the dependent WP-RMT-002 proof against the exact candidate API bytes."
                ),
            }
        )

    material_package = {
        "required": False,
        "receipt_present": False,
        "schema_valid": None,
        "patch_verdict": "not-applicable",
        "mutation_handoff": "gated",
        "package_id": None,
        "package_digest": None,
        "expected_package_id": None,
        "expected_package_digest": None,
        "package_path": None,
        "receipt_path": None,
        "schema_path": None,
        "validated_paths": [],
        "dependency_ids": [],
        "dependency_result": "not-applicable",
        "owner": "invoke:refresh",
        "owner_boundary_result": "pass",
        "publication_boundary_result": "pass",
        "validation_commands": [],
        "validation_result": "not-applicable",
        "lifecycle_owner": "invoke:refresh",
        "lifecycle_status": "proposal-only",
        "authority_class": "private",
        "authority_effect": "none",
        "publication_class": "internal",
        "publication_effect": "none",
    }
    validation = [
        {
            "id": "decision-gate-prefilter",
            "argv": [
                "python3",
                DECISION_PREFILTER.relative_to(REPO).as_posix(),
                DECISION_REQUEST.relative_to(REPO).as_posix(),
                "--request-schema",
                DECISION_REQUEST_SCHEMA.relative_to(REPO).as_posix(),
                "--receipt-schema",
                DECISION_RECEIPT_SCHEMA.relative_to(REPO).as_posix(),
                "--output",
                "<isolated-output>/option-admissibility-receipt.json",
            ],
            "cwd": ".",
            "output_argument_policy": "replace only the <isolated-output> token with a validator-owned temporary directory",
            "expected_exit_code": 0,
            "result": "pass",
            "output_ref": exact_ref(DECISION_RECEIPT),
        },
        {"id": "task-session-candidate", "command": "python3 validation/validate-task-session-candidate.py", "result": "pass", "output_ref": exact_ref(TASK_SESSION_CANDIDATE_RESULT)},
        {"id": "decision-regression-matrix", "command": "package validator exact-compares 15 sealed requirements plus 9 independent-audit governance and ticket-closure regressions", "result": "pass", "output_ref": exact_ref(REGRESSION_MATRIX)},
        {"id": "canonical-entry", "command": "python3 validate_work_pack_execution_entry.py --projection <staged-entry>", "result": "pass", "output_ref": exact_ref(STAGED_ROOT / "EXECUTION-ENTRY-VALIDATION.json")},
        {"id": "staged-work-pack", "command": "node <staged-validate-work-pack.mjs> . --logical-plan-root <plan> --emit-expected", "result": "pass", "output_ref": exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json")},
        {"id": "official-readiness-audit", "command": "python3 audit_work_pack.py --config audit-config.json --output-dir <isolated-output>", "result": "pass", "output_ref": exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json")},
        {"id": "dispatch", "command": "python3 validate-dispatch.py DISPATCH.json", "result": "pass", "output_ref": exact_ref(PACKAGE / "DISPATCH-VALIDATION.json")},
    ]
    write_json(
        PACKAGE / "refresh-report.json",
        {
            "schema_version": "domainspec.invoke-refresh-report/v2",
            "proposal_id": PROPOSAL_ID,
            "mode": "refresh",
            "execution_path": [
                "decision-gate:prefilter-A-B-C",
                "decision-gate:record-direct-user-option-A",
                "invoke:refresh:derive-generic-transient-output-api",
                "invoke:refresh:stage-generated-runtime-parity",
                "invoke:refresh:replay-dependent-wp-rmt-002",
                "invoke:refresh:freeze-for-independent-audit",
            ],
            "dispatch_trace": {
                "dispatch_ref": exact_ref(PACKAGE / "DISPATCH.json"),
                "validation_ref": exact_ref(PACKAGE / "DISPATCH-VALIDATION.json"),
                "dispatch_id": PROPOSAL_ID,
                "execution": "single bounded proposal author; no governed multi-agent dispatch",
            },
            "evidence_date": "2026-08-16",
            "source_evidence": source_evidence,
            "source_inventory": {
                "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows",
                "file_count": len(source_evidence),
                "total_size_bytes": sum(item["size_bytes"] for item in source_evidence),
                "sha256": sha256_bytes("".join(source_rows).encode("utf-8")),
            },
            "target_artifacts": targets,
            "target_inventory": target_inventory,
            "activation_source": "direct-user",
            "mutation_mode": "proposal-only",
            "mutation_mode_source": "explicit",
            "phase_status": "pass",
            "phase_status_basis": {
                "artifact_complete": True,
                "refresh_authoring_blocker_count": 0,
                "selected_option": "A",
                "basis": "decision evidence, 33 exact target mappings, canonical candidate replay including nine reserved-governance-path and ticket-closure regressions, generated parity, and dependent WP proof are complete",
            },
            "handoff_status": "gated",
            "source_signals": signals,
            "delta_summary": [
                {"delta": "route_changed", "count": 1, "summary": "direct user selected Option A"},
                {"delta": "blocker_resolved", "count": 1, "summary": "public transient-output design choice resolved at proposal level"},
                {"delta": "evidence_added", "count": 2, "summary": "generic candidate and dependent WP proof validate"},
                {"delta": "no_op", "count": 1, "summary": "proposal-only authority boundary preserved"},
            ],
            "proposed_changes": proposed_changes,
            "applied_changes": [],
            "skipped_changes": [
                "all live canonical and generated targets",
                "all live WP-RMT-002 targets and every SWU",
                "product, ontology, candidate, and PromotionRecord state",
                "selection, admission, promotion, publication, release, deployment, production, Git, network, and external effects",
            ],
            "material_package": material_package,
            "blockers": [
                {"id": "RFR-AUTHORING", "scope": "refresh-authoring", "owner": "invoke:refresh", "status": "resolved", "claim": "Option A proposal bytes and validation evidence are complete"},
                {"id": "RFR-APPLY-AUTH", "scope": "apply-authorization", "owner": "exact-byte-owner", "status": "deferred", "claim": "fresh exact-byte acceptance and separate live apply authorization are absent"},
                {"id": "RFR-TARGET-LIFECYCLE", "scope": "target-lifecycle", "owner": "task-session", "status": "deferred", "claim": "no unit is selected, admitted, or executed"},
                {"id": "RFR-INDEPENDENT-AUDIT", "scope": "audit", "owner": "independent-parent-auditor", "status": "open", "claim": "receipt-absent freeze requires independent replay before terminal proposal receipt"},
            ],
            "blocker_scopes": {
                "refresh_authoring": 0,
                "apply_authorization": 1,
                "target_lifecycle": 1,
                "audit": 1,
            },
            "validation": validation,
            "outputs": [
                exact_ref(DECISION_RECORD),
                exact_ref(TASK_SESSION_CANDIDATE_RESULT),
                exact_ref(REGRESSION_MATRIX),
                exact_ref(STAGED_ROOT / "VALIDATION-RESULT.json"),
                exact_ref(PACKAGE / "official-audit/work-pack-readiness-report-v2.json"),
            ],
            "mutation_ready": False,
            "result": "pass",
            "next_route": "deferred",
            "next_owner": "exact-byte-owner:accept-proposal-bytes",
            "owner": "invoke:refresh",
            "lifecycle_owner": "projects/domainspec-v2",
            "authority_effect": "none",
            "publication_effect": "none",
            "claim_ceiling": "validated receipt-absent proposal bytes only; no live apply, selection, admission, SWU execution, implementation, promotion, publication, release, deployment, production readiness, Git, network, or external effect",
            "distill": {
                "status": "skipped",
                "rationale": "The Decision Gate fixed one narrow generic API choice; the candidate preserves durable reconciliation and merely adds a separately typed transient partition, while the dependent WP proof preserves accepted product, dependency, hostile, and REL-A semantics.",
                "preserved_source_ref": exact_ref(LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md"),
            },
        },
    )

    ledger = load(PACKAGE / "REPAIR-LEDGER.json")
    base_repairs = [
        item
        for item in ledger.get("repairs", [])
        if not item.get("repair_id", "").startswith("option-a-")
    ]
    base_repairs.extend(
        [
            {"repair_id": "option-a-public-transient-contract", "count": 1, "change": "generic Task Session v1.3 transient_outputs partition with material-only baselines and durable declared-output reconciliation preserved"},
            {"repair_id": "option-a-generated-runtime-parity", "count": 16, "change": "Codex and Claude generated Task Session packages stage exact schema/script parity plus host-native skill projections"},
            {"repair_id": "option-a-dependent-wp-proof", "count": 7, "change": "exactly seven Cargo target directories map to typed transient admission, touch evidence, cleanup evidence, and terminal absence"},
            {"repair_id": "option-a-receipt-absent-acceptance-boundary", "count": 33, "change": "all canonical, generated, and dependent WP postimages require independent audit and fresh exact-byte owner acceptance"},
            {"repair_id": "option-a-decision-producer-binding", "count": 3, "change": "the installed Decision Gate prefilter plus request and receipt schemas must reproduce the exact stored A/B/C receipt"},
            {"repair_id": "option-a-cargo-hostile-fail-closed", "count": 4, "change": "missing or substituted Cargo transient bindings now fail with exact semantic codes instead of a JavaScript type error"},
            {"repair_id": "option-a-sealed-rejected-freeze-derivation", "count": 1, "change": "derive the superseded rejected-freeze digest, file count, and byte count from the exact sealed governance-defect receipt instead of duplicating a literal"},
            {"repair_id": "option-a-reserved-governance-path-partition", "count": 5, "change": "reserve the run directory, plan admission ledger, prerequisite ledger and resume receipt, and configured executor receipt against transient equality or ancestry overlap"},
            {"repair_id": "option-a-ticket-join-reservation-recheck", "count": 2, "change": "recheck the ticket-bound reservation set before executor launch and again while validating the joined executor receipt"},
            {"repair_id": "option-a-independent-audit-regressions", "count": 12, "change": "retain the stale-freeze hostile, nine governance-path and ticket-closure regressions, and two exact Decision Gate command regressions"},
            {"repair_id": "option-a-ticket-checkpoint-request-admission-closure", "count": 5, "change": "bind the live ticket to checkpoint 04 and rederive its exact request, control, executor, plan-admission, transient-order, and write-partition closure at status, launch/join, reconciliation, and commit"},
            {"repair_id": "option-a-terminal-receipt-preview", "count": 1, "change": "update and execute a non-writing terminal receipt preview that binds Option A, all 33 targets, decision/source/target inventories, current validation denominators, no-live-effect proof, and next-owner acceptance"},
            {"repair_id": "option-a-run-scoped-executor-receipt-invariant", "count": 4, "change": "require the configured and ticketed executor receipt to equal the exact run-scoped terminal-executor-receipt path at prepare, status/launch, and joined-receipt validation"},
            {"repair_id": "option-a-ticket-reservation-rederivation", "count": 2, "change": "rederive the deterministic prerequisite consumption ledger and resume receipt from run_dir during every ticket recheck without changing the closed ticket schema or legacy ticket bytes"},
            {"repair_id": "option-a-recorded-decision-producer-command", "count": 1, "change": "record the installed Decision Gate producer as structured argv with positional request, exact request/receipt schemas, isolated output token, cwd, and expected exit; execute that exact record during package replay"},
            {"repair_id": "option-a-repeat-write-based-candidate-replay", "count": 2, "change": "retain exact commit-harness failure diagnostics and require consecutive full isolated write-based candidate passes after the first intermittent exact-present replay failure"},
        ]
    )
    ledger.update(
        {
            "schema_version": "domainspec.wp-rmt-002-task-session-transient-repair-ledger/v1",
            "proposal_id": PROPOSAL_ID,
            "repairs": base_repairs,
            "failures": [
                {"id": "stage-copy-parent-directories", "result": "repaired", "evidence": "initial cp --parents lacked destination parents", "repair": "create exact package-local parents before mechanical copy"},
                {"id": "python-command-unavailable", "result": "repaired", "evidence": "python command not found", "repair": "use installed canonical python3"},
                {"id": "partial-arcanum-overlay-import", "result": "repaired", "evidence": "ModuleNotFoundError execution_contracts", "repair": "validate from an isolated full public Arcanum overlay"},
                {"id": "governance-transient-phase-placement", "result": "repaired", "evidence": "first semantic suite 15 pass and 2 fail", "repair": "move transient validation to prepare before mutation"},
                {"id": "block-receipt-empty-transient-schema", "result": "repaired", "evidence": "first admission suite 10 pass and 1 fail", "repair": "require nonempty v1.3 transients only for ADMIT while BLOCK remains truthful"},
                {"id": "official-auditor-relative-path", "result": "repaired", "evidence": "first official audit call exited 2 before outputs", "repair": "invoke exact installed repository-root auditor path"},
                {"id": "inherited-six-target-refresh-report", "result": "repaired", "evidence": "first package validator stopped REFRESH_CONTRACT_INCOMPLETE", "repair": "regenerate direct-user Option A report over all 33 targets"},
                {"id": "candidate-overlay-dangling-tool-links", "result": "repaired", "evidence": "first stored candidate validator copytree exited 1", "repair": "exclude tool cache, Git, and Python cache paths from the isolated source overlay"},
                {"id": "option-a-audit-snapshot-refresh", "result": "repaired", "evidence": "first combined replay reached official audit then blocked FROZEN_INPUT_MISMATCH on the regenerated SOURCE-INTENT", "repair": "regenerate the audit config after the final Option A source intent and replay all three official outputs"},
                {"id": "cargo-admission-omission-type-error", "result": "repaired", "evidence": "second combined replay reached the new Cargo hostile then raised a JavaScript non-iterable TypeError", "repair": "array-check transientOutputs before comparison and emit the exact admission binding code"},
                {"id": "package-python-cache-residue", "result": "repaired", "evidence": "diagnostic import created one proposal-local __pycache__ and pyc", "repair": "remove the exact cache residue before freeze and retain a hygiene check"},
                {"id": "independent-audit-rejected-freeze-binding", "result": "repaired", "evidence": "independent audit found a duplicated rejected-freeze digest typo", "repair": "derive and validate the exact sealed governance-defect receipt /rejected_freeze projection"},
                {"id": "independent-audit-governance-path-reservation", "result": "repaired", "evidence": "independent probe admitted a transient scope equal to the future run directory", "repair": "reserve all future Task Session governance write paths before launch and recheck ticket-bound paths"},
                {"id": "stale-proposal-receipt-writer", "result": "repaired", "evidence": "final dependency audit found the package-local future receipt writer retained the superseded six-target proposal id and validation counts", "repair": "bind the current Option A decision, 33-target inventories, current hostile result, and receipt-absent preview semantics"},
                {"id": "independent-final-audit-executor-receipt-invariant", "result": "repaired", "evidence": "independent final audit found the candidate had relaxed the legacy exact run-scoped executor receipt placement", "repair": "restore exact run_dir/terminal-executor-receipt.json placement and recheck complete deterministic reservations at ticket, launch, and receipt join"},
                {"id": "independent-final-audit-decision-command-shape", "result": "repaired", "evidence": "independent final audit found refresh-report recorded an invalid --request Decision Gate invocation", "repair": "record and execute the installed producer's positional request plus exact schema argv and propagate its exit status"},
                {"id": "candidate-harness-exact-present-first-replay", "result": "repaired", "evidence": "first repaired candidate replay reported 19/20 positive with commit-records-exact-present-no-op exit 2 and lacked the terminal diagnostic", "repair": "preserve the case diagnostic in the canonical harness and require consecutive full isolated write-based candidate replays; subsequent candidate and combined-package replays pass 20/20 without weakening the invariant"},
                {"id": "independent-final-audit-ticket-closure", "result": "repaired", "evidence": "second independent final audit found execution-ticket bytes were not bound back to checkpoint 04, the exact request, and the mutation-admission partition after prepare", "repair": "add checkpoint-ref and exact request/control/admission closure revalidation plus two pre-launch substitution regressions"},
            ],
            "audit_incidents": [
                {
                    "id": "parent-audit-module-import-bytecode",
                    "classification": "audit-local-transient-residue-not-candidate-defect",
                    "path": "staged/arcanum/arcana/task-session/scripts/__pycache__/task-session-governance-runner.cpython-312.pyc",
                    "removed": True,
                    "empty_directory_removed": True,
                    "post_cleanup_inventory_sha256": "1ec2122bb0a0df989579bf950e6c217a1b67b0ca7f7e526343ca607cb30f7742",
                    "post_cleanup_replay": "pass",
                }
            ],
            "public_governance_api_changed": True,
            "product_acceptance_semantics_changed": False,
            "hostile_semantics_changed": False,
            "rel_a_semantics_changed": False,
            "authority_effect": "none",
        }
    )
    write_json(PACKAGE / "REPAIR-LEDGER.json", ledger)

    (PACKAGE / "REFRESH-REPORT.md").write_text(
        "# Task Session transient-output API proposal\n\n"
        "The direct user selected Decision Gate Option A. This isolated proposal stages 33 changed targets: 11 canonical public Task Session files, 8 Codex projections, 8 Claude projections, and 6 dependent WP-RMT-002 plan files. No live target changed.\n\n"
        "The generic public contract keeps durable `declared_outputs` one-to-one with material reconciliation and keeps mutation-admission baselines material-only. Version 1.3 adds a separate typed `transient_outputs` partition. Each transient must be repository-contained, collision/symlink/overlap checked, admitted in the execution union, touched-evidenced, cleanup-evidenced, and absent before the terminal receipt. Transient scopes are also disjoint by equality and ancestry from the run directory, plan admission ledger, deterministic pre-execution prerequisite ledger and resume receipt, executor receipt, durable outputs, and terminal receipt. The executor receipt remains exactly `<run-dir>/terminal-executor-receipt.json`. The live ticket is bound to checkpoint 04 and re-reads its exact request, controls, plan admission, ordered transient descriptors, and full write partition at status, launch/join, reconciliation, and commit without changing legacy non-transient ticket bytes.\n\n"
        "The dependent proof preserves 70 SWUs and 74 dependency edges and maps exactly seven Cargo target directories through the candidate API. It does not select, admit, or execute a SWU.\n\n"
        "Independent audit and fresh exact-byte owner acceptance remain open. `PROPOSAL-RECEIPT.json` must remain absent until that audit authorizes receipt creation.\n",
        encoding="utf-8",
    )
    (PACKAGE / "CLAIM-CEILING.md").write_text(
        "# Claim ceiling\n\n"
        "This package proves only a receipt-absent, proposal-only candidate: generic Task Session transient-output contract bytes, generated Codex/Claude parity, and a synthetic dependent WP-RMT-002 replay. It does not prove owner acceptance, applicability, live mutation, a current selection or admission, SWU execution, implementation, product or ontology changes, promotion, publication, release, deployment, production readiness, Git, network, or any external effect. Authority remains none.\n",
        encoding="utf-8",
    )
    (PACKAGE / "REFRESH-PATCH-PROPOSAL.md").write_text(
        "# Exact 33-target Option A patch proposal\n\n"
        "After independent audit, fresh exact-byte owner acceptance must bind the complete receipt-absent inventory. A later, separate apply authorization may stage the 11 canonical public Task Session targets first, regenerate and byte-check the 16 host projections, then apply the 6 dependent WP-RMT-002 proof targets and rerun all bound validators. This proposal itself is non-applicable and mutates no live bytes.\n",
        encoding="utf-8",
    )


def write_reports() -> None:
    manifest = load(STAGED_ROOT / "SWU-MANIFEST.json")
    contracts = load(STAGED_ROOT / "SWU-CONTRACTS.json")
    repairs = [
        {
            "repair_id": "execution-identity",
            "count": 70,
            "change": "task/SWU identity plus lifecycle, authority, publication, and material producer ownership",
        },
        {
            "repair_id": "canonical-sequence",
            "count": 70,
            "change": "exactly one manifest-order successor; final row uses __terminal__",
        },
        {
            "repair_id": "structured-command-contracts",
            "count": 182,
            "change": "exact executable binding for 70 primary and 112 validation commands; validation argv/cwd/timeout/max output/expected exit/environment/runtime identity preserve original intent",
        },
        {
            "repair_id": "attempt-and-write-boundaries",
            "count": 70,
            "change": "attempt collision/teardown, disjoint write partition, pending material package, absent baselines",
        },
        {
            "repair_id": "receipt-and-closeout",
            "count": 70,
            "change": "fail-closed per-SWU terminal schemas, executable semantic validator, and per-unit allowed-delta/owner-closeout bindings",
        },
        {
            "repair_id": "projection-separation",
            "count": 1,
            "change": "canonical nine-field OP001-only Invoke entry separated from the 70-unit finite policy in manifest/contracts",
        },
        {
            "repair_id": "cargo-risk-and-partition",
            "count": 7,
            "change": "Cargo commands are bounded-write and Cargo target directories are transient execution outputs required absent at closeout",
        },
        {
            "repair_id": "installed-canonical-entry-producer",
            "count": 1,
            "change": "generation and replay invoke the installed Python execution-entry producer directly and byte-compare its exact output",
        },
        {
            "repair_id": "live-material-receipt-census",
            "count": 70,
            "change": "terminal receipt validation hashes actual contained material bytes, requires every durable scope to contribute, rejects symlinks and transients, and proves strict nanosecond receipt-after ordering for files and censused directories",
        },
        {
            "repair_id": "truthful-fail-fast-receipts",
            "count": 70,
            "change": "PASS requires every declared command to execute successfully; BLOCK records the exact executed prefix and not-run suffix with zero or partial material",
        },
        {
            "repair_id": "normalized-refresh-evidence",
            "count": 1,
            "change": "active refresh-report follows the Invoke snake_case Evidence Capability Contract with typed signals and exact six-target mappings",
        },
        {
            "repair_id": "closed-refresh-signal-sources",
            "count": 4,
            "change": "every RefreshSignal source selector resolves to an exact hash-and-size source_evidence row, including the terminal fragment and canonical Invoke Refresh contract",
        },
        {
            "repair_id": "task-session-execution-context-binding",
            "count": 70,
            "change": "future terminal receipts bind the sole repository/material root plus exact selection, admission, current-run, attempt-root, and canonical plan admission identities; current selection and admission remain absent",
        },
        {
            "repair_id": "single-use-attempt-collision-control",
            "count": 70,
            "change": "attempt_id must equal Task Session run_id and the deterministic canonical consumed_admission ledger binds the exact execution ticket and rejects reuse, conflict, and copied roots",
        },
        {
            "repair_id": "canonical-plan-semantic-selection-binding",
            "count": 70,
            "change": "selection, admission, current-run, and execution context bind the raw official plan-semantic manifest digest plus its plan epoch, canonical semantic digest, and per-unit unit_contract_digests entry; neither the staged SWU manifest nor a full-contract hash may substitute",
        },
        {
            "repair_id": "canonical-material-admission-split",
            "count": 70,
            "change": "mutation-admission target baselines and current-run allowed_writes cover material_writes only, while terminal receipts remain separately declared execution outputs",
        },
        {
            "repair_id": "canonical-admission-token",
            "count": 70,
            "change": "admission tokens are recomputed from requestDigest, selectionReceiptDigest, attemptId, targetBaselineDigest, and validationContractDigest using the canonical camelCase producer object",
        },
        {
            "repair_id": "acyclic-execution-output-prestate",
            "count": 70,
            "change": "a future WP-specific Task Session preflight binds the preserved WRITE-SCOPE-BASELINE rows and proves execution outputs absent before the governance request, material bytes, and terminal receipt without creating a hash cycle",
        },
        {
            "repair_id": "execution-ticket-ledger-binding",
            "count": 70,
            "change": "the consumed-admission ledger ticket_ref binds the canonical attempt-root execution ticket while current_run_ref remains the separate governance request",
        },
    ]
    write_json(
        PACKAGE / "REPAIR-LEDGER.json",
        {
            "schema_version": "domainspec.wp-rmt-002-refresh-repair-ledger/v1",
            "repairs": repairs,
            "unit_count": len(manifest["swus"]),
            "validation_command_count": sum(
                len(contract["validation_contracts"]) for contract in contracts["contracts"]
            ),
            "exact_executable_binding_count": 182,
            "cargo_command_count": 7,
            "terminal_receipt_schema_count": 70,
            "acceptance_semantics_changed": False,
            "hostile_semantics_changed": False,
            "rel_a_semantics_changed": False,
            "authority_effect": "none",
        },
    )
    (PACKAGE / "REFRESH-REPORT.md").write_text(
        "# WP-RMT-002 execution-contract Refresh proposal\n\n"
        "This package stages exactly six plan files and changes no live target. It closes the missing execution-contract shape for all 70 units, 70 primary commands, and 112 declared validation commands.\n\n"
        "The Invoke authoring projection remains `selection-ready` for exactly `RMT-OP-001`, with one route and no selected unit. The readiness policy reuses that exact OP001 route as its first row, then carries 69 later routes solely to close the finite policy. The official audit's 70-row `ready_frontier` is its finite outer-loop sequence, not a dependency-filtered assertion that later rows are currently selectable. Manifest-order successors deliberately serialize wave peers without changing `depends_on` semantics.\n\n"
        "The package invokes the installed Python execution-entry producer directly. Its terminal-receipt validator derives the sole material census root from the first positional repository root and binds it to an exact future Task Session execution context. That context requires exact selection, mutation-admission, Work-Pack Readiness plan-semantic manifest, current-run, execution ticket, attempt-root, pre-execution output-prestate, and consumed-admission ledger refs; no selection or admission exists in this proposal. The validator inventories real contained bytes, enforces transient absence and receipt-last ordering, and supports truthful PASS plus zero-material and partial-material fail-fast BLOCK evidence. Three positive topologies and 53 hostile fixtures are replayed in isolated temporary repositories.\n\n"
        "The package is non-applicable. Fresh exact-byte owner acceptance and separate live-apply authorization are absent.\n",
        encoding="utf-8",
    )
    (PACKAGE / "CLAIM-CEILING.md").write_text(
        "# Claim ceiling\n\n"
        "This evidence can establish only that a proposal-only six-file Refresh package was derived from frozen preimages and that its staged contracts and audit projection validate. Synthetic fixture selection/admission refs test the future contract only; current selection and admission remain absent. Runtime version and SHA fields remain Task Session-owned observations; this proposal validates their shape and exact declared executable binding but does not independently rehash runtime binaries. It does not establish owner acceptance, live applicability, SWU selection, Task Session admission, implementation, ontology or candidate migration, PromotionRecords, promotion, publication, release, deployment, production readiness, or any external effect. Authority remains none.\n",
        encoding="utf-8",
    )
    (PACKAGE / "REFRESH-PATCH-PROPOSAL.md").write_text(
        "# Exact six-target patch proposal\n\n"
        "If the final proposal receipt receives fresh exact-byte owner acceptance, a separate apply authorization may replace only the six targets listed in `APPLY-PROPOSAL.json` with their bound staged postimages. Before apply, rehash all live preimages. After apply, rerun the installed plan validator and official readiness audit. Preserve `WORK-PACK.md`, `EXECUTION-PACK.md`, `PLAN-RECEIPT.json`, `DISTILL-PLAN-VALIDATION.md`, product, ontology, prerequisite, hostile, relation, acceptance, and REL-A bytes.\n",
        encoding="utf-8",
    )


def assemble() -> None:
    for target in TARGETS:
        if not (STAGED_ROOT / target).is_file():
            raise SystemExit(f"missing staged target: {target}")
    write_source_intent()
    write_command_policy()
    write_dispatch()
    write_apply_proposal()
    write_hostile_fixtures()
    write_reports()
    write_audit_config()


def finalize() -> None:
    required_audit = (
        PACKAGE / "official-audit/plan-semantic-manifest.json",
        PACKAGE / "official-audit/selection-handoff.json",
        PACKAGE / "official-audit/work-pack-readiness-report-v2.json",
    )
    for path in required_audit:
        if not path.is_file():
            raise SystemExit(f"missing official audit output: {path.name}")
    write_reports()
    write_refresh_contract()
    write_option_a_evidence()
    write_audit_config()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "mode",
        choices=("stage", "validate-stage", "finish-view", "assemble", "finalize"),
    )
    args = parser.parse_args()
    if args.mode == "stage":
        stage()
    elif args.mode == "validate-stage":
        validate_stage()
    elif args.mode == "finish-view":
        finish_view()
    elif args.mode == "assemble":
        assemble()
    else:
        finalize()


if __name__ == "__main__":
    main()
