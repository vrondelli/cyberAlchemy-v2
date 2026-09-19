#!/usr/bin/env python3
"""Deterministically replay and validate the isolated WP-RMT-002 Refresh proposal."""

from __future__ import annotations

import copy
import hashlib
import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Callable

from jsonschema import Draft202012Validator


REPO = Path(__file__).resolve().parents[7]
PACKAGE = Path(__file__).resolve().parents[1]
PLAN_REL = Path(
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)
LIVE_PLAN = REPO / PLAN_REL
PREIMAGE = PACKAGE / "preimages" / PLAN_REL
STAGED = PACKAGE / "staged" / PLAN_REL
VIEW = PACKAGE / "validation-view" / PLAN_REL
AUDITOR = REPO / ".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py"
DISPATCH_VALIDATOR = REPO / "arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py"
ENTRY_VALIDATOR = REPO / ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py"
ENTRY_SCHEMA = REPO / ".agents/skills/implementation-readiness/schemas/work-pack-execution-entry.schema.json"
ENTRY_RESULT_SHA256 = "af48420708ab62f853a28fff0806b7f95a514ad9ecf87fa15b3f103f052b1fec"
SELECTION_SCHEMA = REPO / ".agents/skills/work-pack-readiness-audit/schemas/selection-receipt.schema.json"
CANDIDATE_TASK_SESSION = PACKAGE / "staged/.agents/skills/task-session"
ADMISSION_REQUEST_SCHEMA = CANDIDATE_TASK_SESSION / "schemas/mutation-admission-request.schema.json"
ADMISSION_SCHEMA = CANDIDATE_TASK_SESSION / "schemas/mutation-admission-receipt.schema.json"
GOVERNANCE_RUN_SCHEMA = CANDIDATE_TASK_SESSION / "schemas/governance-run-request.schema.json"
EXECUTION_TICKET_SCHEMA = CANDIDATE_TASK_SESSION / "schemas/execution-ticket.schema.json"
EXECUTOR_RECEIPT_SCHEMA = CANDIDATE_TASK_SESSION / "schemas/executor-receipt.schema.json"
TASK_SESSION_RUNNER_CANDIDATE = CANDIDATE_TASK_SESSION / "scripts/task-session-governance-runner.py"
TERMINAL_FRAGMENT = PACKAGE / "validation/terminal-receipt-validator.fragment.mjs"
INVOKE_REFRESH_SOURCE = REPO / "arcanum/spells/invoke/refresh.md"
INVOKE_REFRESH_SOURCE_DIGEST = (
    "1fef6b4149210cb8b78a40c7dde1925bf35a676d766aa896955c6a53c4699938",
    16393,
)
WRITE_SCOPE_BASELINE = LIVE_PLAN / "WRITE-SCOPE-BASELINE.json"
WRITE_SCOPE_BASELINE_DIGEST = (
    "990ffc79aaf16bbf1beb563a2eadbe8699aeaaabec9a6373a24d70e64b79a767",
    51192,
)
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
TASK_SESSION_CANDIDATE_VALIDATOR = PACKAGE / "validation/validate-task-session-candidate.py"
TASK_SESSION_CANDIDATE_RESULT = PACKAGE / "TASK-SESSION-CANDIDATE-VALIDATION.json"
FREEZE_PROPOSAL_VALIDATOR = PACKAGE / "validation/freeze-proposal-receipt.py"
REGRESSION_MATRIX = PACKAGE / "REGRESSION-MATRIX.json"
DECISION_REQUEST = PACKAGE / "decision/option-admissibility-request.json"
DECISION_RECEIPT = PACKAGE / "decision/option-admissibility-receipt.json"
DECISION_RECORD = PACKAGE / "decision/decision-record.json"
DECISION_PREFILTER = REPO / ".agents/skills/decision-gate/scripts/prefilter-options.py"
DECISION_REQUEST_SCHEMA = (
    REPO
    / ".agents/skills/decision-gate/schemas/option-admissibility-request.schema.json"
)
DECISION_RECEIPT_SCHEMA = (
    REPO
    / ".agents/skills/decision-gate/schemas/option-admissibility-receipt.schema.json"
)
DECISION_OUTPUT_TOKEN = "<isolated-output>/option-admissibility-receipt.json"
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
ENTRY_KEYS = {
    "schema_version",
    "work_pack_id",
    "admission_timing",
    "frontier",
    "execution_policy",
    "execution_entry",
    "pre_execution_owner_prerequisite",
    "continuation_rule",
    "authority_effect",
}
SIGNAL_IDS = {
    "RS-OPTION-A",
    "RS-GOVERNANCE-DEFECT",
    "RS-TASK-SESSION-CANDIDATE",
    "RS-WP-DEPENDENT-PROOF",
    "RS-INVOKE-REFRESH-CONTRACT",
}
RECEIPT_HOSTILES = {
    "wrong-task": "WP_TERMINAL_RECEIPT_IDENTITY",
    "wrong-swu": "WP_TERMINAL_RECEIPT_IDENTITY",
    "empty-inventory": "WP_TERMINAL_RECEIPT_PASS_MATERIAL_INCOMPLETE",
    "unknown-inventory": "WP_TERMINAL_RECEIPT_MATERIAL_UNKNOWN",
    "stale-inventory": "WP_TERMINAL_RECEIPT_INVENTORY_STALE",
    "validation-evidence": "WP_TERMINAL_RECEIPT_VALIDATION_COUNT",
    "authority": "WP_TERMINAL_RECEIPT_RESULT",
    "wrong-executable": "WP_TERMINAL_RECEIPT_PRIMARY_RUNTIME",
    "forged-self-consistent-hash": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
    "drifted-bytes": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
    "omitted-exact-file": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
    "recursive-directory-omission": "WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH",
    "symlink-escape": "WP_TERMINAL_RECEIPT_MATERIAL_SYMLINK",
    "transient-residue": "WP_TERMINAL_RECEIPT_TRANSIENT_PRESENT",
    "wrong-raw-ordering": "WP_TERMINAL_RECEIPT_INVENTORY_ORDER",
    "receipt-before-material": "WP_TERMINAL_RECEIPT_NOT_LAST",
    "fabricated-later-command": "WP_TERMINAL_RECEIPT_FAIL_FAST_SUFFIX",
    "missing-not-run-suffix": "WP_TERMINAL_RECEIPT_VALIDATION_COUNT",
    "result-inflation": "WP_TERMINAL_RECEIPT_PASS_COHERENCE",
    "copied-topology-wrong-root": "WP_TERMINAL_RECEIPT_REPOSITORY_BINDING",
    "wrong-repository-identity": "WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY_STALE",
    "arbitrary-attempt": "WP_TERMINAL_RECEIPT_ATTEMPT_CONTEXT",
    "reused-attempt": "WP_TERMINAL_RECEIPT_ATTEMPT_REUSED",
    "conflicting-attempt": "WP_TERMINAL_RECEIPT_LEDGER_REF_STALE",
    "stale-selection-ref": "WP_TERMINAL_RECEIPT_SELECTION_REF_STALE",
    "stale-admission-ref": "WP_TERMINAL_RECEIPT_ADMISSION_REF_STALE",
    "stale-context-ref": "WP_TERMINAL_RECEIPT_CONTEXT_REF_STALE",
    "receipt-fixed-path-replacement": "WP_TERMINAL_RECEIPT_FIXED_PATH_BASELINE",
    "full-contract-unit-digest-substitution": "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING",
    "staged-swu-manifest-substitution": "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING",
    "all-writes-baseline-substitution": "WP_TERMINAL_RECEIPT_TARGET_BASELINE",
    "stale-write-scope-baseline-ref": "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_REF_STALE",
    "missing-plan-baseline-coverage": "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_COVERAGE",
    "prestate-not-in-control-refs": "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING",
    "ledger-governance-request-substitution": "WP_TERMINAL_RECEIPT_LEDGER_BINDING",
    "prestate-not-before-material": "WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_ORDER",
    "stale-execution-ticket-ref": "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_REF_STALE",
    "forged-internally-consistent-admission-token": "WP_TERMINAL_RECEIPT_ADMISSION_TOKEN",
    "missing-cargo-admission-output": "WP_TERMINAL_RECEIPT_ADMISSION_BINDING",
    "substituted-cargo-admission-output": "WP_TERMINAL_RECEIPT_ADMISSION_BINDING",
    "missing-cargo-run-contract": "WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING",
    "substituted-cargo-ticket-contract": "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_BINDING",
}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def encoded(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def digest(path: Path) -> tuple[str, int]:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def canonical_digest(value: Any) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def fixture_ref(root: Path, path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def write_fixture_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encoded(value))


def ref_matches(ref: dict[str, Any], path: Path) -> bool:
    sha256, size = digest(path)
    return ref == {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256,
        "size_bytes": size,
    }


def ref_matches_at(ref: dict[str, Any], path: Path, live_relative: str) -> bool:
    sha256, size = digest(path)
    return ref == {
        "path": live_relative,
        "sha256": sha256,
        "size_bytes": size,
    }


def normalize(command: str) -> tuple[list[str], dict[str, str]]:
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
    return ((["env", *assignments] if assignments else []) + tokens, environment)


def executable(argv: list[str]) -> str:
    index = 0
    if argv and argv[0] == "env":
        index = 1
        while index < len(argv) and "=" in argv[index]:
            index += 1
    return argv[index] if index < len(argv) else ""


def run(argv: list[str], *, cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        argv,
        cwd=cwd,
        check=False,
        capture_output=True,
        timeout=timeout,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )


def expected_decision_gate_argv() -> list[str]:
    return [
        "python3",
        DECISION_PREFILTER.relative_to(REPO).as_posix(),
        DECISION_REQUEST.relative_to(REPO).as_posix(),
        "--request-schema",
        DECISION_REQUEST_SCHEMA.relative_to(REPO).as_posix(),
        "--receipt-schema",
        DECISION_RECEIPT_SCHEMA.relative_to(REPO).as_posix(),
        "--output",
        DECISION_OUTPUT_TOKEN,
    ]


def require_pass(process: subprocess.CompletedProcess[bytes], label: str) -> None:
    if process.returncode != 0:
        stderr = process.stderr.decode("utf-8", errors="replace")[-4000:]
        raise ValueError(f"{label} failed ({process.returncode}): {stderr}")


def model_codes(
    manifest: dict[str, Any],
    contracts: dict[str, Any],
    entry: dict[str, Any],
    apply_proposal: dict[str, Any],
    source_intent: dict[str, Any],
    refresh_contract: dict[str, Any],
) -> set[str]:
    codes: set[str] = set()
    swus = manifest.get("swus", [])
    rows = contracts.get("contracts", [])
    if len(swus) != 70 or len(rows) != 70:
        return {"UNIT_DENOMINATOR_INVALID"}

    validation_count = 0
    executable_count = 0
    cargo_primary_count = 0
    cargo_validation_count = 0
    cargo_transient_count = 0
    terminal_policy = contracts.get("contract_policy", {}).get(
        "terminal_receipt_contract", {}
    )
    canonical_sources = terminal_policy.get("canonical_sources", {})
    canonical_source_paths = {
        "selection_receipt_schema_ref": (
            SELECTION_SCHEMA,
            ".agents/skills/work-pack-readiness-audit/schemas/selection-receipt.schema.json",
        ),
        "mutation_admission_request_schema_ref": (
            ADMISSION_REQUEST_SCHEMA,
            ".agents/skills/task-session/schemas/mutation-admission-request.schema.json",
        ),
        "mutation_admission_schema_ref": (
            ADMISSION_SCHEMA,
            ".agents/skills/task-session/schemas/mutation-admission-receipt.schema.json",
        ),
        "governance_run_request_schema_ref": (
            GOVERNANCE_RUN_SCHEMA,
            ".agents/skills/task-session/schemas/governance-run-request.schema.json",
        ),
        "execution_ticket_schema_ref": (
            EXECUTION_TICKET_SCHEMA,
            ".agents/skills/task-session/schemas/execution-ticket.schema.json",
        ),
        "executor_receipt_schema_ref": (
            EXECUTOR_RECEIPT_SCHEMA,
            ".agents/skills/task-session/schemas/executor-receipt.schema.json",
        ),
        "governance_terminal_schema_ref": (
            REPO / ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json",
            ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json",
        ),
        "task_session_governance_runner_ref": (
            TASK_SESSION_RUNNER_CANDIDATE,
            ".agents/skills/task-session/scripts/task-session-governance-runner.py",
        ),
        "write_scope_baseline_ref": (
            WRITE_SCOPE_BASELINE,
            WRITE_SCOPE_BASELINE.relative_to(REPO).as_posix(),
        ),
    }
    if (
        terminal_policy.get("binding_status")
        != "pending-task-session-selection-and-admission"
        or set(canonical_sources) != set(canonical_source_paths)
        or any(
            not ref_matches_at(canonical_sources.get(key, {}), path, live_relative)
            for key, (path, live_relative) in canonical_source_paths.items()
        )
        or "--validation-root"
        in terminal_policy.get("semantic_validator", {}).get("argv_template", [])
        or terminal_policy.get("execution_context_schema", {}).get(
            "additionalProperties"
        )
        is not False
    ):
        codes.add("RECEIPT_CONTEXT_BINDING_DRIFT")
    for index, (swu, contract) in enumerate(zip(swus, rows)):
        successor = swus[index + 1]["id"] if index + 1 < 70 else "__terminal__"
        expected_task = f"TASK-RMT-{swu['id'].split('-')[1]}"
        if (
            swu.get("task_id") != expected_task
            or contract.get("task_id") != expected_task
            or contract.get("swu_id") != swu["id"]
            or contract.get("dependencies") != swu.get("depends_on")
        ):
            codes.add("IDENTITY_OR_DEPENDENCY_DRIFT")
        if (
            swu.get("lifecycle_owner") != "projects/domainspec-v2"
            or contract.get("lifecycle_owner") != "projects/domainspec-v2"
            or swu.get("authority_class") != "private"
            or contract.get("authority_class") != "private"
            or swu.get("publication_class") != "internal"
            or contract.get("publication_class") != "internal"
            or swu.get("material_producer_owner")
            != "task-session:selected-unit-materialization"
            or contract.get("material_producer_owner")
            != "task-session:selected-unit-materialization"
        ):
            codes.add("LIFECYCLE_AUTHORITY_PUBLICATION_DRIFT")
        if (
            contract.get("canonical_successors") != [successor]
            or swu.get("canonical_successor") != successor
        ):
            codes.add("AMBIGUOUS_SUCCESSOR")

        commands = contract.get("validation_contracts", [])
        originals = contract.get("verification", {}).get("commands", [])
        validation_count += len(commands)
        if len(commands) != len(originals) or not commands:
            codes.add("COMMAND_COUNT_DRIFT")
            continue
        for command_index, command in enumerate(commands):
            original = originals[command_index] if command_index < len(originals) else ""
            argv, environment = normalize(original)
            expected_risk = (
                "bounded-write"
                if any(token.startswith("CARGO_TARGET_DIR=") for token in argv)
                else "read-only"
            )
            if "timeout_seconds" not in command or command.get("timeout_seconds") != 120:
                codes.add("MISSING_TIMEOUT")
            if (
                command.get("argv") != argv
                or command.get("cwd") != "."
                or command.get("environment") != environment
                or command.get("expected_exit_code") != 0
                or command.get("max_output_bytes") != 1_048_576
                or command.get("original_command") != original
            ):
                codes.add("COMMAND_ENV_DRIFT")
            if command.get("runtime_identity", {}).get("executable") != executable(argv):
                codes.add("COMMAND_EXECUTABLE_DRIFT")
            if command.get("risk_class") != expected_risk:
                codes.add("CARGO_RISK_DRIFT" if expected_risk == "bounded-write" else "COMMAND_ENV_DRIFT")
            if expected_risk == "bounded-write":
                cargo_validation_count += 1
            executable_count += 1

        primary = contract.get("primary_command", {})
        first = commands[0]
        expected_primary = {
            key: first[key]
            for key in (
                "argv",
                "cwd",
                "risk_class",
                "expected_exit_code",
                "environment",
                "runtime_identity",
            )
        }
        expected_primary["role"] = (
            "validation-only-entry-command; material production remains owner-gated"
        )
        if primary != expected_primary:
            if primary.get("runtime_identity", {}).get("executable") != executable(primary.get("argv", [])):
                codes.add("COMMAND_EXECUTABLE_DRIFT")
            elif primary.get("risk_class") != first.get("risk_class"):
                codes.add("CARGO_RISK_DRIFT")
            else:
                codes.add("COMMAND_ENV_DRIFT")
        if primary.get("risk_class") == "bounded-write":
            cargo_primary_count += 1
        executable_count += 1

        receipt = contract.get("atomicity", {}).get("receipt")
        transient = [item["path"] for item in contract.get("atomicity", {}).get("transient_outputs", [])]
        expected_outputs = [receipt, *transient]
        expected_material = [path for path in swu.get("write_scope", []) if path not in expected_outputs]
        partition = contract.get("write_partition", {})
        if (
            partition.get("material_writes") != expected_material
            or partition.get("execution_outputs") != expected_outputs
            or partition.get("allowed_writes") != [*expected_material, *expected_outputs]
            or partition.get("material_exclusions") != expected_outputs
            or set(expected_material) & set(expected_outputs)
            or contract.get("closeout_contract", {}).get("allowed_delta_policy", {}).get("required_absent_paths") != transient
        ):
            codes.add("CARGO_PARTITION_DRIFT" if transient else "WRITE_PARTITION_INVALID")
        cargo_transient_count += len(transient)
        for material_path in expected_material:
            if (
                material_path.endswith("/")
                and any(output.startswith(material_path) for output in expected_outputs)
                and "excludes exact execution-output children" not in partition.get("partition_rule", "")
            ):
                codes.add("WRITE_PARTITION_INVALID")

        material_package = contract.get("material_package", {})
        if (
            material_package.get("status") != "pending-selected-unit-producer"
            or material_package.get("producer_owner_ref")
            != "task-session:selected-unit-materialization"
            or any(
                material_package.get(key) is not None
                for key in (
                    "package_ref",
                    "producer_receipt_ref",
                    "schema_ref",
                    "declared_sha256",
                    "target_inventory_ref",
                )
            )
            or contract.get("byte_baselines") != []
        ):
            codes.add("MATERIAL_BOUNDARY_DRIFT")

        receipt_contract = contract.get("terminal_receipt_contract", {})
        schema = receipt_contract.get("schema", {})
        if (
            schema.get("additionalProperties") is not False
            or schema.get("properties", {}).get("task_id") != {"const": expected_task}
            or schema.get("properties", {}).get("swu_id") != {"const": swu["id"]}
            or receipt_contract.get("semantic_validator_ref")
            != "#/contract_policy/terminal_receipt_contract/semantic_validator"
            or receipt_contract.get("execution_context_schema_ref")
            != "#/contract_policy/terminal_receipt_contract/execution_context_schema"
            or receipt_contract.get("binding_status")
            != "pending-task-session-selection-and-admission"
            or receipt_contract.get("receipt_written_last") is not True
        ):
            codes.add("RECEIPT_CLOSEOUT_DRIFT")
        closeout = contract.get("closeout_contract", {})
        if (
            closeout.get("allowed_delta_policy", {}).get("undeclared_delta") != "block"
            or closeout.get("owner_receipt_contract", {}).get("owner") != "projects/domainspec-v2"
            or closeout.get("owner_receipt_contract", {}).get("required_status") != "pass"
            or closeout.get("owner_receipt_contract", {}).get("authority_effect") != "none"
        ):
            codes.add("RECEIPT_CLOSEOUT_DRIFT")

    if validation_count != 112 or executable_count != 182:
        codes.add("COMMAND_COUNT_DRIFT")
    if cargo_primary_count != 7 or cargo_validation_count != 7:
        codes.add("CARGO_RISK_DRIFT")
    if cargo_transient_count != 7:
        codes.add("CARGO_PARTITION_DRIFT")

    routes = entry.get("execution_policy", {}).get("allowed_routes", [])
    if set(entry) != ENTRY_KEYS:
        codes.add("ENTRY_ROOT_SHAPE")
    if (
        entry.get("frontier") != ["RMT-OP-001"]
        or len(routes) != 1
        or routes[0].get("frontier_swu") != "RMT-OP-001"
        or entry.get("execution_policy", {}).get("allowed_routes_digest") != canonical_digest(routes)
        or entry.get("execution_entry", {}).get("state") != "selection-ready"
        or entry.get("execution_entry", {}).get("selected_unit") is not None
        or entry.get("execution_entry", {}).get("route_id") is not None
        or entry.get("authority_effect") != "none"
    ):
        codes.add("AUTHORING_READINESS_PROJECTION_CONTRADICTION")

    codes.update(
        option_a_evidence_codes(apply_proposal, source_intent, refresh_contract)
    )
    return codes

    changes = apply_proposal.get("changes", [])
    if (
        apply_proposal.get("target_count") != 6
        or len(changes) != 6
        or [Path(change.get("target", "")).name for change in changes] != list(TARGETS)
    ):
        codes.add("TARGET_SCOPE_DRIFT")
    for change in changes:
        target = REPO / change.get("target", "")
        preimage = REPO / change.get("preimage", {}).get("path", "")
        postimage = REPO / change.get("staged_postimage", {}).get("path", "")
        if (
            not target.is_file()
            or not preimage.is_file()
            or not postimage.is_file()
            or not ref_matches(change["preimage"], preimage)
            or not ref_matches(change["staged_postimage"], postimage)
            or digest(target) != digest(preimage)
        ):
            codes.add("STALE_SOURCE")

    expected_signal_keys = {
        "id",
        "source_path",
        "signal_type",
        "target_artifacts",
        "claim",
        "evidence",
        "confidence",
        "mutation_safety",
    }
    signals = refresh_contract.get("source_signals", [])
    target_artifacts = [f"{PLAN_REL.as_posix()}/{name}" for name in TARGETS]
    proposed_changes = refresh_contract.get("proposed_changes", [])
    signal_by_id = {signal.get("id"): signal for signal in signals}
    expected_signal_targets = {
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
    expected_change_signals = {
        target_artifacts[0]: [
            "RS-EXECUTION-CONTRACT",
            "RS-REFRESH-EVIDENCE-CONTRACT",
        ],
        target_artifacts[1]: [
            "RS-EXECUTION-CONTRACT",
            "RS-RECEIPT-LIVE-CENSUS",
        ],
        target_artifacts[2]: ["RS-CANONICAL-ENTRY"],
        target_artifacts[3]: [
            "RS-EXECUTION-CONTRACT",
            "RS-CANONICAL-ENTRY",
            "RS-RECEIPT-LIVE-CENSUS",
        ],
        target_artifacts[4]: [
            "RS-EXECUTION-CONTRACT",
            "RS-RECEIPT-LIVE-CENSUS",
        ],
        target_artifacts[5]: ["RS-CANONICAL-ENTRY"],
    }
    if (
        len(signals) != 4
        or set(signal_by_id) != SIGNAL_IDS
        or any(set(signal) != expected_signal_keys for signal in signals)
        or any(
            signal.get("signal_type") not in {"artifact_drift", "status_changed"}
            for signal in signals
        )
        or any(
            signal.get("confidence") != "high"
            or signal.get("mutation_safety") != "needs_review"
            for signal in signals
        )
        or any(
            not signal.get("target_artifacts")
            or not set(signal["target_artifacts"]).issubset(set(target_artifacts))
            for signal in signals
        )
        or any(
            signal_by_id.get(signal_id, {}).get("target_artifacts") != targets
            for signal_id, targets in expected_signal_targets.items()
        )
        or refresh_contract.get("target_artifacts") != target_artifacts
        or len(proposed_changes) != 6
        or [item.get("target_artifact") for item in proposed_changes]
        != target_artifacts
        or any(
            set(item)
            != {
                "change_id",
                "target_artifact",
                "signal_ids",
                "operation",
                "summary",
            }
            or item.get("signal_ids")
            != expected_change_signals.get(item.get("target_artifact"))
            or item.get("operation") != "replace"
            for item in proposed_changes
        )
    ):
        codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")
    target_inventory = refresh_contract.get("target_inventory", [])
    if len(target_inventory) != 6:
        codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")
    for index, item in enumerate(target_inventory):
        if index >= len(TARGETS):
            codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")
            continue
        name = TARGETS[index]
        if (
            item.get("target_path") != target_artifacts[index]
            or item.get("operation") != "replace"
            or not ref_matches(item.get("live_ref", {}), LIVE_PLAN / name)
            or not ref_matches(item.get("preimage_ref", {}), PREIMAGE / name)
            or not ref_matches(item.get("staged_postimage_ref", {}), STAGED / name)
            or item.get("live_matches_preimage") is not True
            or item.get("staged_differs_from_preimage") is not True
        ):
            codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")

    source_evidence = refresh_contract.get("source_evidence", [])
    source_inventory = refresh_contract.get("source_inventory", {})
    source_rows = [
        f"{item.get('sha256')}\t{item.get('size_bytes')}\t{item.get('path')}\n"
        for item in sorted(
            source_evidence,
            key=lambda item: str(item.get("path", "")).encode("utf-8"),
        )
    ]
    evidence_paths = [
        PACKAGE / "SOURCE-INTENT.json",
        ENTRY_VALIDATOR,
        ENTRY_SCHEMA,
        TERMINAL_FRAGMENT,
        INVOKE_REFRESH_SOURCE,
        SELECTION_SCHEMA,
        ADMISSION_SCHEMA,
        GOVERNANCE_RUN_SCHEMA,
        EXECUTION_TICKET_SCHEMA,
        REPO / ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json",
        REPO / ".agents/skills/task-session/scripts/task-session-governance-runner.py",
        WRITE_SCOPE_BASELINE,
        STAGED / "VALIDATION-RESULT.json",
        PACKAGE / "official-audit/work-pack-readiness-report-v2.json",
        LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md",
    ]
    evidence_by_path = {item.get("path"): item for item in source_evidence}
    signal_sources_closed = all(
        signal.get("source_path", "").split("#", 1)[0] in evidence_by_path
        for signal in signals
    )
    if (
        len(source_evidence) != len(evidence_paths)
        or not signal_sources_closed
        or digest(INVOKE_REFRESH_SOURCE) != INVOKE_REFRESH_SOURCE_DIGEST
        or digest(WRITE_SCOPE_BASELINE) != WRITE_SCOPE_BASELINE_DIGEST
        or any(
            not ref_matches(
                {
                    "path": item.get("path"),
                    "sha256": item.get("sha256"),
                    "size_bytes": item.get("size_bytes"),
                },
                path,
            )
            for item, path in zip(source_evidence, evidence_paths)
        )
        or source_inventory
        != {
            "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows",
            "file_count": len(source_evidence),
            "total_size_bytes": sum(
                item.get("size_bytes", -1) for item in source_evidence
            ),
            "sha256": hashlib.sha256(
                "".join(source_rows).encode("utf-8")
            ).hexdigest(),
        }
    ):
        codes.add("REFRESH_CONTRACT_INCOMPLETE")
    if not signal_sources_closed:
        codes.add("REFRESH_SOURCE_SIGNAL_UNBOUND")

    dispatch_trace = refresh_contract.get("dispatch_trace", {})
    blockers = refresh_contract.get("blockers", [])
    validation_rows = refresh_contract.get("validation", [])
    material_required = {
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
    if (
        refresh_contract.get("schema_version")
        != "domainspec.invoke-refresh-report/v2"
        or refresh_contract.get("mode") != "refresh"
        or refresh_contract.get("evidence_date") != "2026-08-16"
        or len(refresh_contract.get("execution_path", [])) != 5
        or not ref_matches(
            dispatch_trace.get("dispatch_ref", {}), PACKAGE / "DISPATCH.json"
        )
        or not ref_matches(
            dispatch_trace.get("validation_ref", {}),
            PACKAGE / "DISPATCH-VALIDATION.json",
        )
        or dispatch_trace.get("execution")
        != "single bounded proposal author; no governed multi-agent dispatch"
        or refresh_contract.get("activation_source") != "delegated"
        or refresh_contract.get("mutation_mode") != "proposal-only"
        or refresh_contract.get("mutation_mode_source") != "explicit"
        or refresh_contract.get("phase_status") != "pass"
        or refresh_contract.get("phase_status_basis", {}).get("artifact_complete")
        is not True
        or refresh_contract.get("phase_status_basis", {}).get(
            "refresh_authoring_blocker_count"
        )
        != 0
        or refresh_contract.get("handoff_status") != "gated"
        or refresh_contract.get("applied_changes") != []
        or refresh_contract.get("material_package") != material_required
        or [(item.get("scope"), item.get("status")) for item in blockers]
        != [
            ("refresh-authoring", "resolved"),
            ("apply-authorization", "deferred"),
            ("target-lifecycle", "deferred"),
            ("audit", "open"),
        ]
        or refresh_contract.get("blocker_scopes")
        != {
            "refresh_authoring": 0,
            "apply_authorization": 1,
            "target_lifecycle": 1,
            "audit": 1,
        }
        or len(validation_rows) != 4
        or [item.get("result") for item in validation_rows] != ["pass"] * 4
        or not ref_matches(
            validation_rows[0].get("output_ref", {}),
            STAGED / "EXECUTION-ENTRY-VALIDATION.json",
        )
        or not ref_matches(
            validation_rows[1].get("output_ref", {}),
            STAGED / "VALIDATION-RESULT.json",
        )
        or not ref_matches(
            validation_rows[2].get("output_ref", {}),
            PACKAGE / "official-audit/work-pack-readiness-report-v2.json",
        )
        or not ref_matches(
            validation_rows[3].get("output_ref", {}),
            PACKAGE / "DISPATCH-VALIDATION.json",
        )
        or refresh_contract.get("mutation_ready") is not False
        or refresh_contract.get("result") != "pass"
        or refresh_contract.get("next_route") != "deferred"
        or refresh_contract.get("next_owner")
        != "exact-byte-owner:accept-proposal-bytes"
        or refresh_contract.get("owner") != "invoke:refresh"
        or refresh_contract.get("authority_effect") != "none"
        or refresh_contract.get("publication_effect") != "none"
        or "no live apply" not in refresh_contract.get("claim_ceiling", "")
        or not ref_matches(
            refresh_contract.get("distill", {}).get("source_ref", {}),
            LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md",
        )
    ):
        codes.add("REFRESH_CONTRACT_INCOMPLETE")

    applicability = apply_proposal.get("applicability", {})
    owner_acceptance = source_intent.get("owner_acceptance", {})
    if (
        apply_proposal.get("mode") != "proposal-only-non-applicable"
        or applicability.get("state")
        != "blocked-pending-fresh-exact-owner-acceptance"
        or applicability.get("owner_acceptance") != "absent"
        or applicability.get("apply_authorization") != "absent"
        or applicability.get("mutation_ready") is not False
        or owner_acceptance.get("status") != "absent"
        or owner_acceptance.get("required_next") is not True
        or source_intent.get("apply_authorization") != "absent"
        or source_intent.get("selection_receipt") != "absent"
        or source_intent.get("task_session_admission") != "absent"
        or refresh_contract.get("handoff_status") != "gated"
        or refresh_contract.get("mutation_ready") is not False
        or refresh_contract.get("material_package", {}).get("required") is not False
    ):
        codes.add("ACCEPTANCE_INFLATION")
    return codes


def target_class(relative: str) -> str:
    if relative.startswith("arcanum/"):
        return "canonical-public-task-session"
    if relative.startswith(".agents/"):
        return "generated-codex-parity"
    if relative.startswith(".claude/"):
        return "generated-claude-parity"
    return "dependent-wp-rmt-002-proof"


def option_a_evidence_codes(
    apply_proposal: dict[str, Any],
    source_intent: dict[str, Any],
    refresh_contract: dict[str, Any],
) -> set[str]:
    codes: set[str] = set()
    targets = list(ALL_TARGETS)
    changes = apply_proposal.get("changes", [])
    if (
        apply_proposal.get("schema_version")
        != "domainspec.invoke-refresh-apply-proposal/v2"
        or apply_proposal.get("proposal_id") != PROPOSAL_ID
        or apply_proposal.get("selected_option") != "A"
        or apply_proposal.get("mode") != "proposal-only-non-applicable"
        or apply_proposal.get("target_count") != 33
        or len(changes) != 33
        or [row.get("target") for row in changes] != targets
    ):
        codes.add("TARGET_SCOPE_DRIFT")
    for relative, row in zip(targets, changes):
        live = REPO / relative
        preimage = PACKAGE / "preimages" / relative
        postimage = PACKAGE / "staged" / relative
        if (
            row.get("target_class") != target_class(relative)
            or row.get("operation") != "replace"
            or not ref_matches(row.get("preimage", {}), preimage)
            or not ref_matches(row.get("staged_postimage", {}), postimage)
            or not live.is_file()
            or live.read_bytes() != preimage.read_bytes()
            or postimage.read_bytes() == preimage.read_bytes()
        ):
            codes.add("STALE_SOURCE")

    sealed_defect = load(GOVERNANCE_DEFECT_RECEIPT)
    rejected = sealed_defect.get("rejected_freeze", {})
    superseded = apply_proposal.get("superseded_unreceipted_proposal", {})
    derivation_ref = superseded.get("derivation_ref", {})
    if (
        superseded.get("rejected_freeze_sha256") != rejected.get("sha256")
        or superseded.get("rejected_freeze_file_count")
        != rejected.get("file_count")
        or superseded.get("rejected_freeze_total_size_bytes")
        != rejected.get("total_size_bytes")
        or not ref_matches(
            {
                key: value
                for key, value in derivation_ref.items()
                if key != "selector"
            },
            GOVERNANCE_DEFECT_RECEIPT,
        )
        or derivation_ref.get("selector") != "/rejected_freeze"
        or superseded.get("terminal_receipt_present") is not True
        or superseded.get("receipt_kind") != "governance-defect-block"
    ):
        codes.add("REJECTED_FREEZE_BINDING_STALE")

    activation = source_intent.get("activation_source", {})
    owner_acceptance = source_intent.get("owner_acceptance", {})
    if (
        source_intent.get("schema_version")
        != "domainspec.invoke-refresh-source-intent/v2"
        or source_intent.get("proposal_id") != PROPOSAL_ID
        or source_intent.get("route") != ["decision-gate", "invoke:refresh"]
        or source_intent.get("mode") != "proposal-only"
        or activation
        != {
            "kind": "direct-user",
            "exact_response": "A",
            "selected_option": "A",
            "authority": "proposal-authoring-only",
        }
        or source_intent.get("exact_staged_targets") != targets
        or source_intent.get("target_count") != 33
        or owner_acceptance.get("status") != "absent"
        or owner_acceptance.get("required_next") is not True
        or source_intent.get("apply_authorization") != "absent"
        or source_intent.get("selection_receipt") != "absent"
        or source_intent.get("task_session_admission") != "absent"
        or source_intent.get("swu_execution") != "absent"
        or source_intent.get("authority_effect") != "none"
    ):
        codes.add("ACCEPTANCE_INFLATION")

    signal_keys = {
        "id",
        "source_path",
        "signal_type",
        "target_artifacts",
        "claim",
        "evidence",
        "confidence",
        "mutation_safety",
    }
    signals = refresh_contract.get("source_signals", [])
    signal_by_id = {row.get("id"): row for row in signals}
    public_targets = [
        item for item in targets if not item.startswith(PLAN_REL.as_posix())
    ]
    expected_signal_targets = {
        "RS-OPTION-A": targets,
        "RS-GOVERNANCE-DEFECT": public_targets,
        "RS-TASK-SESSION-CANDIDATE": public_targets,
        "RS-WP-DEPENDENT-PROOF": list(WP_TARGETS),
        "RS-INVOKE-REFRESH-CONTRACT": targets,
    }
    if (
        len(signals) != 5
        or set(signal_by_id) != SIGNAL_IDS
        or any(set(row) != signal_keys for row in signals)
        or any(
            row.get("signal_type")
            not in {
                "evidence_added",
                "blocker_opened",
                "blocker_resolved",
                "status_changed",
                "route_changed",
                "artifact_drift",
                "no_op",
            }
            for row in signals
        )
        or any(row.get("confidence") != "high" for row in signals)
        or any(
            signal_by_id.get(signal_id, {}).get("target_artifacts") != expected
            for signal_id, expected in expected_signal_targets.items()
        )
    ):
        codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")

    proposed = refresh_contract.get("proposed_changes", [])
    if (
        refresh_contract.get("target_artifacts") != targets
        or len(proposed) != 33
        or [row.get("target_artifact") for row in proposed] != targets
        or any(row.get("operation") != "replace" or not row.get("signal_ids") for row in proposed)
        or any(
            not set(row.get("signal_ids", [])).issubset(SIGNAL_IDS)
            for row in proposed
        )
    ):
        codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")

    target_inventory = refresh_contract.get("target_inventory", [])
    if len(target_inventory) != 33:
        codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")
    for relative, row in zip(targets, target_inventory):
        live = REPO / relative
        preimage = PACKAGE / "preimages" / relative
        postimage = PACKAGE / "staged" / relative
        if (
            row.get("target_path") != relative
            or row.get("target_class") != target_class(relative)
            or row.get("operation") != "replace"
            or not ref_matches(row.get("live_ref", {}), live)
            or not ref_matches(row.get("preimage_ref", {}), preimage)
            or not ref_matches(row.get("staged_postimage_ref", {}), postimage)
            or row.get("live_matches_preimage") is not True
            or row.get("staged_differs_from_preimage") is not True
        ):
            codes.add("REFRESH_SIGNAL_MAPPING_DRIFT")

    evidence_paths = [
        DECISION_REQUEST,
        DECISION_RECEIPT,
        DECISION_RECORD,
        DECISION_PREFILTER,
        DECISION_REQUEST_SCHEMA,
        DECISION_RECEIPT_SCHEMA,
        GOVERNANCE_DEFECT_RECEIPT,
        DECISION_GATE_PROPOSAL,
        INVOKE_REFRESH_SOURCE,
        TASK_SESSION_CANDIDATE_RESULT,
        REGRESSION_MATRIX,
        TERMINAL_FRAGMENT,
        STAGED / "VALIDATION-RESULT.json",
        PACKAGE / "official-audit/work-pack-readiness-report-v2.json",
        LIVE_PLAN / "PLAN-RECEIPT.json",
        LIVE_PLAN / "DISTILL-PLAN-VALIDATION.md",
    ]
    source_evidence = refresh_contract.get("source_evidence", [])
    source_by_path = {row.get("path"): row for row in source_evidence}
    rows = [
        f"{row.get('sha256')}\t{row.get('size_bytes')}\t{row.get('path')}\n"
        for row in sorted(
            source_evidence,
            key=lambda item: str(item.get("path", "")).encode("utf-8"),
        )
    ]
    inventory = refresh_contract.get("source_inventory", {})
    if (
        len(source_evidence) != len(evidence_paths)
        or any(
            not ref_matches(
                {
                    "path": row.get("path"),
                    "sha256": row.get("sha256"),
                    "size_bytes": row.get("size_bytes"),
                },
                path,
            )
            for row, path in zip(source_evidence, evidence_paths)
        )
        or any(row.get("source_path", "").split("#", 1)[0] not in source_by_path for row in signals)
        or inventory
        != {
            "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows",
            "file_count": len(source_evidence),
            "total_size_bytes": sum(row.get("size_bytes", -1) for row in source_evidence),
            "sha256": hashlib.sha256("".join(rows).encode("utf-8")).hexdigest(),
        }
    ):
        codes.add("REFRESH_CONTRACT_INCOMPLETE")
    if any(row.get("source_path", "").split("#", 1)[0] not in source_by_path for row in signals):
        codes.add("REFRESH_SOURCE_SIGNAL_UNBOUND")

    material_required = {
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
    dispatch = refresh_contract.get("dispatch_trace", {})
    validation = refresh_contract.get("validation", [])
    blockers = refresh_contract.get("blockers", [])
    decision_command = validation[0] if validation else {}
    if (
        set(decision_command)
        != {
            "id",
            "argv",
            "cwd",
            "output_argument_policy",
            "expected_exit_code",
            "result",
            "output_ref",
        }
        or decision_command.get("id") != "decision-gate-prefilter"
        or decision_command.get("argv") != expected_decision_gate_argv()
        or decision_command.get("cwd") != "."
        or decision_command.get("output_argument_policy")
        != "replace only the <isolated-output> token with a validator-owned temporary directory"
        or decision_command.get("expected_exit_code") != 0
        or decision_command.get("result") != "pass"
    ):
        codes.add("DECISION_GATE_COMMAND_DRIFT")
    if (
        refresh_contract.get("schema_version")
        != "domainspec.invoke-refresh-report/v2"
        or refresh_contract.get("proposal_id") != PROPOSAL_ID
        or refresh_contract.get("mode") != "refresh"
        or refresh_contract.get("activation_source") != "direct-user"
        or refresh_contract.get("mutation_mode") != "proposal-only"
        or refresh_contract.get("mutation_mode_source") != "explicit"
        or len(refresh_contract.get("execution_path", [])) != 6
        or dispatch.get("dispatch_id") != PROPOSAL_ID
        or not ref_matches(dispatch.get("dispatch_ref", {}), PACKAGE / "DISPATCH.json")
        or not ref_matches(dispatch.get("validation_ref", {}), PACKAGE / "DISPATCH-VALIDATION.json")
        or refresh_contract.get("phase_status") != "pass"
        or refresh_contract.get("phase_status_basis", {}).get("artifact_complete") is not True
        or refresh_contract.get("phase_status_basis", {}).get("selected_option") != "A"
        or refresh_contract.get("handoff_status") != "gated"
        or refresh_contract.get("applied_changes") != []
        or refresh_contract.get("material_package") != material_required
        or [(row.get("scope"), row.get("status")) for row in blockers]
        != [
            ("refresh-authoring", "resolved"),
            ("apply-authorization", "deferred"),
            ("target-lifecycle", "deferred"),
            ("audit", "open"),
        ]
        or refresh_contract.get("blocker_scopes")
        != {
            "refresh_authoring": 0,
            "apply_authorization": 1,
            "target_lifecycle": 1,
            "audit": 1,
        }
        or len(validation) != 7
        or [row.get("result") for row in validation] != ["pass"] * 7
        or not ref_matches(validation[0].get("output_ref", {}), DECISION_RECEIPT)
        or not ref_matches(validation[1].get("output_ref", {}), TASK_SESSION_CANDIDATE_RESULT)
        or not ref_matches(validation[2].get("output_ref", {}), REGRESSION_MATRIX)
        or not ref_matches(validation[3].get("output_ref", {}), STAGED / "EXECUTION-ENTRY-VALIDATION.json")
        or not ref_matches(validation[4].get("output_ref", {}), STAGED / "VALIDATION-RESULT.json")
        or not ref_matches(validation[5].get("output_ref", {}), PACKAGE / "official-audit/work-pack-readiness-report-v2.json")
        or not ref_matches(validation[6].get("output_ref", {}), PACKAGE / "DISPATCH-VALIDATION.json")
        or refresh_contract.get("mutation_ready") is not False
        or refresh_contract.get("result") != "pass"
        or refresh_contract.get("next_route") != "deferred"
        or refresh_contract.get("next_owner")
        != "exact-byte-owner:accept-proposal-bytes"
        or refresh_contract.get("owner") != "invoke:refresh"
        or refresh_contract.get("authority_effect") != "none"
        or refresh_contract.get("publication_effect") != "none"
        or refresh_contract.get("distill", {}).get("status") != "skipped"
        or not refresh_contract.get("distill", {}).get("rationale")
        or "no live apply" not in refresh_contract.get("claim_ceiling", "")
    ):
        codes.add("REFRESH_CONTRACT_INCOMPLETE")

    applicability = apply_proposal.get("applicability", {})
    if (
        applicability.get("state")
        != "blocked-pending-independent-audit-and-fresh-exact-owner-acceptance"
        or applicability.get("independent_audit") != "open"
        or applicability.get("owner_acceptance") != "absent"
        or applicability.get("apply_authorization") != "absent"
        or applicability.get("mutation_ready") is not False
        or refresh_contract.get("mutation_ready") is not False
        or refresh_contract.get("material_package", {}).get("required") is not False
    ):
        codes.add("ACCEPTANCE_INFLATION")
    return codes


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def contract_for(contracts: dict[str, Any], swu_id: str) -> dict[str, Any]:
    return next(row for row in contracts["contracts"] if row["swu_id"] == swu_id)


def write_material(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def create_materials(
    validation_root: Path,
    contract: dict[str, Any],
    mode: str,
) -> list[str]:
    if mode == "zero":
        return []
    scopes = contract["write_partition"]["material_writes"]
    selected = scopes if mode == "complete" else scopes[:1]
    paths: list[str] = []
    for index, scope in enumerate(selected):
        if scope.endswith("/"):
            names = (
                ["z-material.json", "ä-material.json"]
                if contract["swu_id"] == "RMT-OP-001"
                else [f"material-{index + 1}.json"]
            )
            for name in names:
                relative_path = f"{scope}{name}"
                write_material(
                    validation_root / relative_path,
                    f"{contract['swu_id']}:{relative_path}\n".encode("utf-8"),
                )
                paths.append(relative_path)
        else:
            write_material(
                validation_root / scope,
                f"{contract['swu_id']}:{scope}\n".encode("utf-8"),
            )
            paths.append(scope)
    return sorted(paths, key=lambda value: value.encode("utf-8"))


def inventory_for(validation_root: Path, material_paths: list[str]) -> dict[str, Any]:
    materials = []
    for relative_path in sorted(material_paths, key=lambda value: value.encode("utf-8")):
        data = (validation_root / relative_path).read_bytes()
        materials.append(
            {
                "path": relative_path,
                "sha256": sha256_bytes(data),
                "size_bytes": len(data),
            }
        )
    rows = "".join(
        f"{item['sha256']}\t{item['size_bytes']}\t{item['path']}\n"
        for item in materials
    ).encode("utf-8")
    return {
        "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows",
        "file_count": len(materials),
        "total_size_bytes": sum(item["size_bytes"] for item in materials),
        "sha256": sha256_bytes(rows),
        "materials": materials,
    }


def refresh_inventory_digest(inventory: dict[str, Any]) -> None:
    rows = "".join(
        f"{item['sha256']}\t{item['size_bytes']}\t{item['path']}\n"
        for item in inventory["materials"]
    ).encode("utf-8")
    inventory["file_count"] = len(inventory["materials"])
    inventory["total_size_bytes"] = sum(
        item["size_bytes"] for item in inventory["materials"]
    )
    inventory["sha256"] = sha256_bytes(rows)


def command_evidence(declared: dict[str, Any], exit_code: int | None) -> dict[str, Any]:
    if exit_code is None:
        return {
            "state": "not-run",
            "declared": copy.deepcopy(declared),
            "observed_runtime": None,
            "exit_code": None,
            "stdout_sha256": None,
            "stderr_sha256": None,
        }
    executable_name = declared["runtime_identity"]["executable"]
    return {
        "state": "executed",
        "declared": copy.deepcopy(declared),
        "observed_runtime": {
            "executable": executable_name,
            "version": "fixture-observation-v1",
            "sha256": "a" * 64,
        },
        "exit_code": exit_code,
        "stdout_sha256": sha256_bytes(b"fixture stdout\n"),
        "stderr_sha256": sha256_bytes(b"fixture stderr\n"),
    }


def projected_validation_commands(contract: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "command_id": command["command_id"],
            "argv": command["argv"],
            "cwd": command["cwd"],
            "timeout_seconds": command["timeout_seconds"],
            "max_output_bytes": command["max_output_bytes"],
        }
        for command in contract["validation_contracts"]
    ]


def build_execution_context_topology(
    repo_root: Path,
    contract: dict[str, Any],
    *,
    receipt_output_baseline_present: bool = False,
    full_contract_unit_digest: bool = False,
    staged_swu_manifest: bool = False,
    all_writes_admission_baselines: bool = False,
    omit_plan_baseline_coverage: bool = False,
    omit_prestate_control_ref: bool = False,
    ledger_binds_governance_request: bool = False,
    forged_admission_token: bool = False,
    admission_transient_mode: str = "exact",
    run_transient_mode: str = "exact",
    ticket_transient_mode: str = "exact",
) -> dict[str, Any]:
    """Create exact synthetic Task Session control refs in one isolated repo root."""
    repo_root_real = str(repo_root.resolve())
    attempt_id = f"fixture-{contract['swu_id'].lower()}-attempt-001"
    attempt_root = Path(".task-session/runs") / attempt_id
    for source, relative_path in (
        (SELECTION_SCHEMA, ".agents/skills/work-pack-readiness-audit/schemas/selection-receipt.schema.json"),
        (ADMISSION_REQUEST_SCHEMA, ".agents/skills/task-session/schemas/mutation-admission-request.schema.json"),
        (ADMISSION_SCHEMA, ".agents/skills/task-session/schemas/mutation-admission-receipt.schema.json"),
        (GOVERNANCE_RUN_SCHEMA, ".agents/skills/task-session/schemas/governance-run-request.schema.json"),
        (EXECUTION_TICKET_SCHEMA, ".agents/skills/task-session/schemas/execution-ticket.schema.json"),
        (EXECUTOR_RECEIPT_SCHEMA, ".agents/skills/task-session/schemas/executor-receipt.schema.json"),
        (TASK_SESSION_RUNNER_CANDIDATE, ".agents/skills/task-session/scripts/task-session-governance-runner.py"),
    ):
        target = repo_root / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    repository_identity_path = repo_root / ".task-session/repository-identity.json"
    repository_identity = {
        "schema_version": "task-session.repository-identity.v1",
        "work_pack_id": "WP-RMT-002",
        "repository_root_realpath": repo_root_real,
        "material_root": ".",
        "authority_effect": "none",
    }
    write_fixture_json(repository_identity_path, repository_identity)
    repository_identity_ref = fixture_ref(repo_root, repository_identity_path)

    work_pack_path = repo_root / ".task-session/controls/work-pack.json"
    swu_path = repo_root / ".task-session/controls/swu.json"
    write_fixture_json(
        work_pack_path,
        {
            "work_pack_id": "WP-RMT-002",
            "selection_marker": f"Selected SWU: {contract['swu_id']}",
        },
    )
    write_fixture_json(
        swu_path,
        {"work_pack_id": "WP-RMT-002", "task_id": contract["task_id"], "swu_id": contract["swu_id"]},
    )
    work_pack_ref = fixture_ref(repo_root, work_pack_path)
    swu_ref = fixture_ref(repo_root, swu_path)

    official_semantic_path = PACKAGE / "official-audit/plan-semantic-manifest.json"
    official_semantic = load(official_semantic_path)
    semantic_source = STAGED / "SWU-MANIFEST.json" if staged_swu_manifest else official_semantic_path
    semantic_manifest_path = repo_root / ".task-session/controls/plan-semantic-manifest.json"
    semantic_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(semantic_source, semantic_manifest_path)
    semantic_manifest_ref = fixture_ref(repo_root, semantic_manifest_path)
    manifest_digest = semantic_manifest_ref["sha256"]
    plan_epoch_id = official_semantic["plan_epoch_id"]
    unit_contract_digest = (
        canonical_digest(contract)
        if full_contract_unit_digest
        else official_semantic["unit_contract_digests"][contract["swu_id"]]
    )
    request_validation = projected_validation_commands(contract)
    validation_contract_digest = canonical_digest(request_validation)
    resolved_material_writes = [
        (
            f"{scope}__task_session_fixture_target_{index:03d}.json"
            if scope.endswith("/")
            else scope
        )
        for index, scope in enumerate(contract["write_partition"]["material_writes"])
    ]
    durable_declared_outputs = [
        f"{attempt_root.as_posix()}/staged/material-{index:03d}.postimage"
        for index in range(len(resolved_material_writes))
    ]
    transient_paths = contract["write_partition"]["transient_outputs"]
    transient_contracts = contract["task_session_execution_contract"][
        "transient_outputs"
    ]
    substituted_transient_paths = [f"{path}-substituted" for path in transient_paths]
    admission_transient_paths = (
        []
        if admission_transient_mode == "missing"
        else substituted_transient_paths
        if admission_transient_mode == "substituted"
        else transient_paths
    )

    selection_path = repo_root / ".task-session/controls/selection-receipt.json"
    selection = {
        "schemaVersion": "1.0.0",
        "selectionVerdict": "select",
        "terminalCode": "SELECTION_READY",
        "requestDigest": "1" * 64,
        "manifestDigest": manifest_digest,
        "planEpochId": plan_epoch_id,
        "canonicalSemanticDigest": official_semantic["canonical_semantic_digest"],
        "taskId": contract["task_id"],
        "swuId": contract["swu_id"],
        "unitContractDigest": unit_contract_digest,
        "dependencyReceiptDigests": [],
        "lifecycleEligibilityDigest": "3" * 64,
        "explicitConfirmationDigest": None,
        "selectionIntentSource": "execution-intent-binding",
        "selectionIntentDigest": "4" * 64,
        "authorityEffect": "none",
        "mutationReady": False,
        "reasons": [],
    }
    Draft202012Validator(load(SELECTION_SCHEMA)).validate(selection)
    write_fixture_json(selection_path, selection)
    selection_ref = fixture_ref(repo_root, selection_path)

    baseline_paths = (
        contract["write_partition"]["allowed_writes"]
        if all_writes_admission_baselines
        else resolved_material_writes
    )
    target_baselines = [
        {"path": path, "state": "absent", "sha256": None, "sizeBytes": None}
        for path in baseline_paths
    ]
    target_baseline_digest = canonical_digest(target_baselines)
    admission_request_digest = "5" * 64
    admission_token = canonical_digest(
        {
            "requestDigest": admission_request_digest,
            "selectionReceiptDigest": selection_ref["sha256"],
            "attemptId": attempt_id,
            "targetBaselineDigest": target_baseline_digest,
            "validationContractDigest": validation_contract_digest,
        }
    )
    if forged_admission_token:
        admission_token = "f" * 64
    admission_path = repo_root / ".task-session/controls/mutation-admission-receipt.json"
    admission = {
        "schemaVersion": "1.3.0" if admission_transient_paths else "1.2.0",
        "admissionProfile": "plan-once-selected-unit",
        "executionMode": "routed-mutation",
        "writeProfile": "material-bound",
        "admissionVerdict": "admit",
        "mutationReady": True,
        "taskId": contract["task_id"],
        "swuId": contract["swu_id"],
        "requestDigest": admission_request_digest,
        "producerSchemaDigest": "6" * 64,
        "materialReceiptDigest": "7" * 64,
        "materialPackageDigest": "8" * 64,
        "controllingPaths": ["SWU-CONTRACTS.json"],
        "dependencyIds": contract["dependencies"],
        "materialWrites": resolved_material_writes,
        "executionOutputs": [
            contract["atomicity"]["receipt"],
            *admission_transient_paths,
        ],
        "allowedWrites": sorted(
            [
                *resolved_material_writes,
                contract["atomicity"]["receipt"],
                *admission_transient_paths,
            ]
        ),
        "validationCommands": contract["verification"]["commands"],
        "lifecycleOwner": contract["lifecycle_owner"],
        "authorityClass": contract["authority_class"],
        "publicationClass": contract["publication_class"],
        "planEpochId": plan_epoch_id,
        "unitContractDigest": unit_contract_digest,
        "attemptId": attempt_id,
        "planManifestDigest": manifest_digest,
        "selectionReceiptDigest": selection_ref["sha256"],
        "targetBaselineDigest": target_baseline_digest,
        "targetBaselines": target_baselines,
        "validationContractDigest": validation_contract_digest,
        "admissionToken": admission_token,
        "singleUse": True,
        "liveValidationRequired": True,
        "reasons": [],
    }
    if admission_transient_paths:
        admission["transientOutputs"] = admission_transient_paths
    Draft202012Validator(load(ADMISSION_SCHEMA)).validate(admission)
    write_fixture_json(admission_path, admission)
    admission_ref = fixture_ref(repo_root, admission_path)
    admission_parent = admission_path.parent.relative_to(repo_root)
    ledger_relative = admission_parent / ".admission-consumption" / f"{admission_ref['sha256']}.json"

    attempt_root_path = repo_root / attempt_root / "attempt-root.json"
    attempt_root_identity = {
        "schema_version": "task-session.attempt-root-identity.v1",
        "work_pack_id": "WP-RMT-002",
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "run_id": attempt_id,
        "attempt_id": attempt_id,
        "repository_identity_ref": repository_identity_ref,
        "attempt_root": attempt_root.as_posix(),
        "authority_effect": "none",
    }
    write_fixture_json(attempt_root_path, attempt_root_identity)
    attempt_root_ref = fixture_ref(repo_root, attempt_root_path)

    static_baseline_path = repo_root / ".task-session/controls/WRITE-SCOPE-BASELINE.json"
    shutil.copy2(WRITE_SCOPE_BASELINE, static_baseline_path)
    if digest(static_baseline_path) != WRITE_SCOPE_BASELINE_DIGEST:
        raise ValueError("fixture static WRITE-SCOPE-BASELINE drift")
    static_baseline_ref = fixture_ref(repo_root, static_baseline_path)
    selected_baseline_rows = [
        row
        for row in load(static_baseline_path)["entries"]
        if row["owner_swu"] == contract["swu_id"]
    ]
    if omit_plan_baseline_coverage:
        selected_baseline_rows = []
    output_prestate_path = repo_root / attempt_root / "execution-output-prestate.json"
    output_prestates = []
    for path in contract["write_partition"]["execution_outputs"]:
        if path == contract["atomicity"]["receipt"] and receipt_output_baseline_present:
            output_prestates.append(
                {"path": path, "state": "present", "sha256": "e" * 64, "size_bytes": 1}
            )
        else:
            if (repo_root / path).exists():
                raise ValueError(f"fixture execution output unexpectedly present before prestate: {path}")
            output_prestates.append(
                {"path": path, "state": "absent", "sha256": None, "size_bytes": None}
            )
    output_prestate = {
        "schema_version": "domainspec.wp-rmt-002-execution-output-prestate/v1",
        "owner": "task-session",
        "work_pack_id": "WP-RMT-002",
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "run_id": attempt_id,
        "attempt_id": attempt_id,
        "plan_epoch_id": plan_epoch_id,
        "unit_contract_digest": unit_contract_digest,
        "selection_receipt_ref": selection_ref,
        "mutation_admission_receipt_ref": admission_ref,
        "write_scope_baseline_ref": static_baseline_ref,
        "selected_baseline_rows": selected_baseline_rows,
        "captured_phase": "pre-execution",
        "execution_outputs": output_prestates,
        "authority_effect": "none",
    }
    write_fixture_json(output_prestate_path, output_prestate)
    output_prestate_ref = fixture_ref(repo_root, output_prestate_path)
    output_prestate_digest = canonical_digest(output_prestates)

    evaluation_path = repo_root / ".task-session/controls/governance-evaluation.json"
    preflight_path = repo_root / ".task-session/controls/closeout-preflight.json"
    write_fixture_json(
        evaluation_path,
        {
            "schema_version": "task-session.governance-evaluation-receipt.v1",
            "task_id": contract["task_id"],
            "swu_id": contract["swu_id"],
            "outcome": "PROCEED",
            "authority_effect": "none",
        },
    )
    write_fixture_json(
        preflight_path,
        {
            "schema_version": "task-session.closeout-preflight.v1",
            "task_id": contract["task_id"],
            "swu_id": contract["swu_id"],
            "result": "PROCEED",
            "authority_effect": "none",
        },
    )
    evaluation_ref = fixture_ref(repo_root, evaluation_path)
    preflight_ref = fixture_ref(repo_root, preflight_path)

    current_run_path = repo_root / attempt_root / "governance-request.json"
    current_run = {
        "schema_version": "task-session.governance-run-request.v1",
        "admission_profile": "plan-once-selected-unit",
        "request_id": f"request-{attempt_id}",
        "run_id": attempt_id,
        "work_pack_ref": work_pack_ref,
        "swu_ref": swu_ref,
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "control_refs": [
            selection_ref,
            admission_ref,
            evaluation_ref,
            preflight_ref,
            *([] if omit_prestate_control_ref else [output_prestate_ref]),
        ],
        "execution_contract": {
            "allowed_writes": resolved_material_writes,
            "declared_outputs": durable_declared_outputs,
            "validation_commands": request_validation,
            "timeout_seconds": 120,
            "max_output_bytes": 1_048_576,
        },
        "owner_identity": {"capability": "task-session", "subject": "synthetic-fixture"},
        "idempotency_key": f"task-session:{attempt_id}",
        "closeout_contract": {
            "required_owner_capabilities": ["invoke"],
            "continuation_policy": "emit-cursor-never-execute-successor",
            "terminal_receipt_path": contract["atomicity"]["receipt"],
        },
        "plan_admission": {
            "plan_epoch_id": plan_epoch_id,
            "unit_contract_digest": unit_contract_digest,
            "attempt_id": attempt_id,
            "selection_receipt_ref": selection_ref,
            "mutation_admission_receipt_ref": admission_ref,
            "admission_token": admission_token,
            "target_baseline_digest": target_baseline_digest,
            "validation_contract_digest": validation_contract_digest,
            "consumption_ledger_path": ledger_relative.as_posix(),
        },
    }
    if transient_paths and run_transient_mode != "missing":
        current_run["execution_contract"]["transient_outputs"] = (
            [
                {**item, "path": f"{item['path']}-substituted"}
                for item in transient_contracts
            ]
            if run_transient_mode == "substituted"
            else transient_contracts
        )
    Draft202012Validator(load(GOVERNANCE_RUN_SCHEMA)).validate(current_run)
    write_fixture_json(current_run_path, current_run)
    current_run_ref = fixture_ref(repo_root, current_run_path)

    admitted_path = repo_root / attempt_root / "admitted-phase.json"
    write_fixture_json(
        admitted_path,
        {
            "schema_version": "task-session.governance-phase-receipt.v1",
            "run_id": attempt_id,
            "task_id": contract["task_id"],
            "swu_id": contract["swu_id"],
            "phase": "admitted",
            "authority_effect": "none",
        },
    )
    admitted_ref = fixture_ref(repo_root, admitted_path)
    executor_receipt_schema_path = (
        repo_root / ".agents/skills/task-session/schemas/executor-receipt.schema.json"
    )
    executor_receipt_schema_ref = fixture_ref(repo_root, executor_receipt_schema_path)
    ticket_plan_admission = {
        **current_run["plan_admission"],
        "target_baselines": [
            {
                "path": item["path"],
                "state": item["state"],
                "sha256": item["sha256"],
                "size_bytes": item["sizeBytes"],
            }
            for item in target_baselines
        ],
    }
    ticket_path = repo_root / attempt_root / "execution-ticket.json"
    ticket = {
        "schema_version": "task-session.execution-ticket.v1",
        "admission_profile": "plan-once-selected-unit",
        "ticket_id": f"ticket:{attempt_id}:{contract['swu_id']}",
        "run_id": attempt_id,
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "request_ref": current_run_ref,
        "predecessor_ref": {"phase": "admitted", "receipt_ref": admitted_ref},
        "control_refs": current_run["control_refs"],
        "baseline_inventory": ticket_plan_admission["target_baselines"],
        "allowed_writes": resolved_material_writes,
        "declared_outputs": durable_declared_outputs,
        "validation_contracts": request_validation,
        "executor_contract": {
            "owner_identity": {"capability": "implementation-executor", "subject": "synthetic-fixture"},
            "argv": contract["primary_command"]["argv"],
            "cwd": ".",
            "environment_names": sorted(contract["primary_command"]["environment"]),
            "timeout_seconds": 120,
            "max_output_bytes": 1_048_576,
            "expected_receipt_path": f"{attempt_root.as_posix()}/terminal-executor-receipt.json",
            "expected_receipt_schema_ref": executor_receipt_schema_ref,
        },
        "owner_identity": current_run["owner_identity"],
        "idempotency_key": current_run["idempotency_key"],
        "closeout_contract": current_run["closeout_contract"],
        "plan_admission": ticket_plan_admission,
    }
    if transient_paths and ticket_transient_mode != "missing":
        ticket["transient_outputs"] = (
            [
                {**item, "path": f"{item['path']}-substituted"}
                for item in transient_contracts
            ]
            if ticket_transient_mode == "substituted"
            else transient_contracts
        )
    Draft202012Validator(load(EXECUTION_TICKET_SCHEMA)).validate(ticket)
    write_fixture_json(ticket_path, ticket)
    ticket_ref = fixture_ref(repo_root, ticket_path)

    ledger_path = repo_root / ledger_relative
    ledger = {
        "schema_version": "task-session.admission-consumption.v1",
        "run_id": attempt_id,
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "attempt_id": attempt_id,
        "admission_token": admission_token,
        "ticket_ref": current_run_ref if ledger_binds_governance_request else ticket_ref,
        "mutation_admission_receipt_ref": admission_ref,
    }
    write_fixture_json(ledger_path, ledger)
    ledger_ref = fixture_ref(repo_root, ledger_path)

    context_path = repo_root / attempt_root / "execution-context.json"
    context = {
        "schema_version": "domainspec.wp-rmt-002-execution-context/v1",
        "profile": "plan-once-selected-unit",
        "work_pack_id": "WP-RMT-002",
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "selected_unit": contract["swu_id"],
        "run_id": attempt_id,
        "attempt_id": attempt_id,
        "repository_root_realpath": repo_root_real,
        "material_root": ".",
        "repository_identity_ref": repository_identity_ref,
        "attempt_root": attempt_root.as_posix(),
        "attempt_root_ref": attempt_root_ref,
        "current_run_ref": current_run_ref,
        "execution_ticket_ref": ticket_ref,
        "selection_receipt_ref": selection_ref,
        "mutation_admission_receipt_ref": admission_ref,
        "plan_semantic_manifest_ref": semantic_manifest_ref,
        "plan_epoch_id": plan_epoch_id,
        "unit_contract_digest": unit_contract_digest,
        "plan_manifest_digest": manifest_digest,
        "validation_contract_digest": validation_contract_digest,
        "target_baseline_digest": target_baseline_digest,
        "resolved_material_writes": resolved_material_writes,
        "durable_declared_outputs": durable_declared_outputs,
        "execution_output_prestate_ref": output_prestate_ref,
        "execution_output_prestate_digest": output_prestate_digest,
        "consumed_admission": {
            "receipt_ref": admission_ref,
            "admission_token": admission_token,
            "attempt_id": attempt_id,
            "consumption_ledger_ref": ledger_ref,
        },
        "authority_effect": "none",
    }
    if not receipt_output_baseline_present:
        Draft202012Validator(
            load(STAGED / "SWU-CONTRACTS.json")["contract_policy"]["terminal_receipt_contract"]["execution_context_schema"]
        ).validate(context)
    write_fixture_json(context_path, context)
    return {
        "attempt_id": attempt_id,
        "repository_identity_path": repository_identity_path,
        "selection_path": selection_path,
        "admission_path": admission_path,
        "semantic_manifest_path": semantic_manifest_path,
        "static_baseline_path": static_baseline_path,
        "output_prestate_path": output_prestate_path,
        "ticket_path": ticket_path,
        "ledger_path": ledger_path,
        "current_run_path": current_run_path,
        "context_path": context_path,
        "context_ref": fixture_ref(repo_root, context_path),
    }


def make_receipt(
    contract: dict[str, Any],
    inventory: dict[str, Any],
    result: str,
    execution_context: dict[str, Any],
    failure_phase: str | None = None,
) -> dict[str, Any]:
    validation_count = len(contract["validation_contracts"])
    if result == "pass":
        primary_exit: int | None = 0
        validation_exits: list[int | None] = [0] * validation_count
        failure_reason = None
        first_failure_index = None
    elif failure_phase == "materialization":
        primary_exit = None
        validation_exits = [None] * validation_count
        failure_reason = "materialization stopped before command execution"
        first_failure_index = None
    elif failure_phase == "primary":
        primary_exit = 17
        validation_exits = [None] * validation_count
        failure_reason = "primary command failed"
        first_failure_index = None
    else:
        primary_exit = 0
        validation_exits = [23, *([None] * (validation_count - 1))]
        failure_reason = "first validation command failed"
        first_failure_index = 0
        failure_phase = "validation"
    primary = command_evidence(contract["primary_command"], primary_exit)
    validations = [
        command_evidence(declared, exit_code)
        for declared, exit_code in zip(
            contract["validation_contracts"], validation_exits
        )
    ]
    validation_rows = []
    for declared, evidence in zip(contract["validation_contracts"], validations):
        row_result = (
            "not-run"
            if evidence["state"] == "not-run"
            else "pass"
            if evidence["exit_code"] == 0
            else "block"
        )
        validation_rows.append(
            {
                "command_id": declared["command_id"],
                "state": evidence["state"],
                "result": row_result,
                "exit_code": evidence["exit_code"],
            }
        )
    return {
        "schema_version": "domainspec.wp-rmt-002-terminal-receipt/v3",
        "work_pack_id": "WP-RMT-002",
        "task_id": contract["task_id"],
        "swu_id": contract["swu_id"],
        "attempt_id": execution_context["attempt_id"],
        "execution_context_ref": execution_context["context_ref"],
        "attempt_contract": copy.deepcopy(contract["attempt_contract"]),
        "result": result,
        "expected_receipt": contract["atomicity"]["receipt"],
        "material_inventory": inventory,
        "command_evidence": {
            "primary": primary,
            "validation_commands": validations,
        },
        "validation": {
            "result": result,
            "failure_phase": failure_phase,
            "failure_reason": failure_reason,
            "declared_command_count": validation_count,
            "executed_command_count": sum(
                item["state"] == "executed" for item in validations
            ),
            "first_failure_index": first_failure_index,
            "commands": validation_rows,
            "failure_exit_preserved": True,
        },
        "lifecycle_owner_validation": {
            "owner": contract["lifecycle_owner"],
            "status": result,
        },
        "receipt_written_last": True,
        "authority_effect": "none",
    }


def install_receipt(
    validation_root: Path,
    contract: dict[str, Any],
    receipt: dict[str, Any],
) -> Path:
    receipt_path = validation_root / contract["atomicity"]["receipt"]
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_bytes(encoded(receipt))
    # A second metadata operation gives the receipt a strict nanosecond-after boundary.
    os.utime(receipt_path, None)
    return receipt_path


def run_receipt_validator(
    repo_root: Path,
    receipt_path: Path,
    swu_id: str,
) -> subprocess.CompletedProcess[bytes]:
    return run(
        [
            "node",
            str(VIEW / "validate-work-pack.mjs"),
            str(repo_root),
            "--logical-plan-root",
            PLAN_REL.as_posix(),
            "--validate-terminal-receipt",
            str(receipt_path),
            "--unit",
            swu_id,
        ],
        cwd=REPO,
    )


def positive_receipt_results(contracts: dict[str, Any]) -> list[dict[str, Any]]:
    scenarios = [
        ("pass-complete-directory", "RMT-OP-001", "complete", "pass", None),
        ("pass-cargo-transient-contract", "RMT-OP-005", "complete", "pass", None),
        ("block-zero-material", "RMT-OP-001", "zero", "block", "materialization"),
        ("block-partial-first-failure", "RMT-OP-003", "partial", "block", "validation"),
    ]
    results = []
    global_schema = contracts["contract_policy"]["terminal_receipt_contract"]["schema"]
    for fixture_id, swu_id, material_mode, result, phase in scenarios:
        with tempfile.TemporaryDirectory(prefix=f"wp-rmt-002-{fixture_id}-") as temp:
            validation_root = Path(temp) / "validation-root"
            validation_root.mkdir()
            contract = contract_for(contracts, swu_id)
            execution_context = build_execution_context_topology(
                validation_root, contract
            )
            material_paths = create_materials(validation_root, contract, material_mode)
            receipt = make_receipt(
                contract,
                inventory_for(validation_root, material_paths),
                result,
                execution_context,
                phase,
            )
            Draft202012Validator(global_schema).validate(receipt)
            Draft202012Validator(contract["terminal_receipt_contract"]["schema"]).validate(receipt)
            receipt_path = install_receipt(validation_root, contract, receipt)
            process = run_receipt_validator(validation_root, receipt_path, swu_id)
            require_pass(process, f"terminal receipt positive fixture {fixture_id}")
            output = json.loads(process.stdout)
            if (
                output.get("status") != "pass"
                or output.get("result") != result
                or output.get("swu_id") != swu_id
                or output.get("authority_effect") != "none"
            ):
                raise ValueError(f"TERMINAL_RECEIPT_POSITIVE_DRIFT:{fixture_id}")
            results.append(
                {
                    "fixture_id": fixture_id,
                    "expected_result": result,
                    "result": "pass",
                }
            )
    return results


def build_hostile_topology(
    temp: str,
    fixture_id: str,
    contracts: dict[str, Any],
) -> tuple[Path, Path, str]:
    swu_id = (
        "RMT-OP-005"
        if fixture_id
        in {
            "transient-residue",
            "missing-cargo-admission-output",
            "substituted-cargo-admission-output",
            "missing-cargo-run-contract",
            "substituted-cargo-ticket-contract",
        }
        else "RMT-OP-003"
        if fixture_id
        in {
            "omitted-exact-file",
            "fabricated-later-command",
            "missing-not-run-suffix",
            "result-inflation",
        }
        else "RMT-OP-001"
    )
    contract = contract_for(contracts, swu_id)
    validation_root = Path(temp) / "validation-root"
    validation_root.mkdir()
    partial_block = fixture_id in {
        "fabricated-later-command",
        "missing-not-run-suffix",
    }
    material_mode = (
        "zero"
        if fixture_id in {"empty-inventory", "transient-residue"}
        else "partial"
        if partial_block
        else "complete"
    )
    execution_context = build_execution_context_topology(
        validation_root,
        contract,
        receipt_output_baseline_present=fixture_id
        == "receipt-fixed-path-replacement",
        full_contract_unit_digest=fixture_id
        == "full-contract-unit-digest-substitution",
        staged_swu_manifest=fixture_id == "staged-swu-manifest-substitution",
        all_writes_admission_baselines=fixture_id
        == "all-writes-baseline-substitution",
        omit_plan_baseline_coverage=fixture_id
        == "missing-plan-baseline-coverage",
        omit_prestate_control_ref=fixture_id == "prestate-not-in-control-refs",
        ledger_binds_governance_request=fixture_id
        == "ledger-governance-request-substitution",
        forged_admission_token=fixture_id
        == "forged-internally-consistent-admission-token",
        admission_transient_mode=(
            "missing"
            if fixture_id == "missing-cargo-admission-output"
            else "substituted"
            if fixture_id == "substituted-cargo-admission-output"
            else "exact"
        ),
        run_transient_mode=(
            "missing" if fixture_id == "missing-cargo-run-contract" else "exact"
        ),
        ticket_transient_mode=(
            "substituted"
            if fixture_id == "substituted-cargo-ticket-contract"
            else "exact"
        ),
    )
    material_paths = create_materials(validation_root, contract, material_mode)
    receipt = make_receipt(
        contract,
        inventory_for(validation_root, material_paths),
        "block" if partial_block else "pass",
        execution_context,
        "validation" if partial_block else None,
    )
    after_write: Callable[[], None] | None = None

    if fixture_id == "wrong-task":
        receipt["task_id"] = "TASK-RMT-EVENT"
    elif fixture_id == "wrong-swu":
        receipt["swu_id"] = "RMT-OP-003"
    elif fixture_id == "unknown-inventory":
        receipt["material_inventory"]["materials"].append(
            {"path": "undeclared/material.bin", "sha256": "b" * 64, "size_bytes": 1}
        )
        refresh_inventory_digest(receipt["material_inventory"])
    elif fixture_id == "stale-inventory":
        receipt["material_inventory"]["sha256"] = "0" * 64
    elif fixture_id == "validation-evidence":
        receipt["command_evidence"]["validation_commands"].pop()
    elif fixture_id == "authority":
        receipt["authority_effect"] = "promotion"
    elif fixture_id == "wrong-executable":
        receipt["command_evidence"]["primary"]["observed_runtime"][
            "executable"
        ] = "python3"
    elif fixture_id == "forged-self-consistent-hash":
        item = receipt["material_inventory"]["materials"][0]
        item["sha256"] = "c" * 64
        item["size_bytes"] += 1
        refresh_inventory_digest(receipt["material_inventory"])
    elif fixture_id == "drifted-bytes":
        target = validation_root / material_paths[0]
        after_write = lambda: write_material(target, b"drifted after inventory\n")
    elif fixture_id == "omitted-exact-file":
        receipt["material_inventory"]["materials"] = [
            item
            for item in receipt["material_inventory"]["materials"]
            if item["path"] != contract["write_partition"]["material_writes"][0]
        ]
        refresh_inventory_digest(receipt["material_inventory"])
    elif fixture_id == "recursive-directory-omission":
        receipt["material_inventory"]["materials"].pop()
        refresh_inventory_digest(receipt["material_inventory"])
    elif fixture_id == "symlink-escape":
        outside = Path(temp) / "outside.bin"
        outside.write_bytes(b"outside\n")
        link = validation_root / contract["write_partition"]["material_writes"][0] / "escape-link"
        link.symlink_to(outside)
    elif fixture_id == "transient-residue":
        transient = validation_root / contract["atomicity"]["transient_outputs"][0]["path"]
        transient.mkdir(parents=True)
    elif fixture_id == "wrong-raw-ordering":
        receipt["material_inventory"]["materials"].reverse()
        refresh_inventory_digest(receipt["material_inventory"])
    elif fixture_id == "fabricated-later-command":
        declared = contract["validation_contracts"][1]
        evidence = command_evidence(declared, 0)
        receipt["command_evidence"]["validation_commands"][1] = evidence
        receipt["validation"]["commands"][1] = {
            "command_id": declared["command_id"],
            "state": "executed",
            "result": "pass",
            "exit_code": 0,
        }
        receipt["validation"]["executed_command_count"] = 2
    elif fixture_id == "missing-not-run-suffix":
        receipt["command_evidence"]["validation_commands"].pop()
    elif fixture_id == "result-inflation":
        receipt = make_receipt(
            contract,
            inventory_for(validation_root, material_paths),
            "block",
            execution_context,
            "validation",
        )
        receipt["result"] = "pass"
        receipt["validation"]["result"] = "pass"
        receipt["validation"]["failure_phase"] = None
        receipt["validation"]["failure_reason"] = None
        receipt["validation"]["first_failure_index"] = None
        receipt["lifecycle_owner_validation"]["status"] = "pass"
    elif fixture_id == "wrong-repository-identity":
        execution_context["repository_identity_path"].write_bytes(
            execution_context["repository_identity_path"].read_bytes() + b"\n"
        )
    elif fixture_id == "arbitrary-attempt":
        receipt["attempt_id"] = "arbitrary-unbound-attempt"
    elif fixture_id == "reused-attempt":
        duplicate = execution_context["ledger_path"].with_name("duplicate-consumption.json")
        shutil.copy2(execution_context["ledger_path"], duplicate)
    elif fixture_id == "conflicting-attempt":
        ledger = load(execution_context["ledger_path"])
        ledger["attempt_id"] = "conflicting-attempt"
        write_fixture_json(execution_context["ledger_path"], ledger)
    elif fixture_id == "stale-selection-ref":
        execution_context["selection_path"].write_bytes(
            execution_context["selection_path"].read_bytes() + b"\n"
        )
    elif fixture_id == "stale-admission-ref":
        execution_context["admission_path"].write_bytes(
            execution_context["admission_path"].read_bytes() + b"\n"
        )
    elif fixture_id == "stale-context-ref":
        execution_context["context_path"].write_bytes(
            execution_context["context_path"].read_bytes() + b"\n"
        )
    elif fixture_id == "stale-write-scope-baseline-ref":
        execution_context["static_baseline_path"].write_bytes(
            execution_context["static_baseline_path"].read_bytes() + b"\n"
        )
    elif fixture_id == "prestate-not-before-material":
        os.utime(execution_context["output_prestate_path"], None)
    elif fixture_id == "stale-execution-ticket-ref":
        execution_context["ticket_path"].write_bytes(
            execution_context["ticket_path"].read_bytes() + b"\n"
        )

    receipt_path = install_receipt(validation_root, contract, receipt)
    if fixture_id == "receipt-before-material":
        target = validation_root / material_paths[0]
        data = target.read_bytes()
        target.write_bytes(data)
        os.utime(target, None)
    elif after_write is not None:
        after_write()
    if fixture_id == "copied-topology-wrong-root":
        copied_root = Path(temp) / "copied-repository-root"
        shutil.copytree(validation_root, copied_root, copy_function=shutil.copy2)
        validation_root = copied_root
        receipt_path = validation_root / contract["atomicity"]["receipt"]
    return validation_root, receipt_path, swu_id


def receipt_hostile_results(contracts: dict[str, Any]) -> list[dict[str, str]]:
    results = []
    for fixture_id, expected in RECEIPT_HOSTILES.items():
        with tempfile.TemporaryDirectory(
            prefix=f"wp-rmt-002-hostile-{fixture_id}-"
        ) as temp:
            validation_root, receipt_path, swu_id = build_hostile_topology(
                temp, fixture_id, contracts
            )
            process = run_receipt_validator(validation_root, receipt_path, swu_id)
            evidence = process.stdout + process.stderr
            if process.returncode == 0 or expected.encode("utf-8") not in evidence:
                raise ValueError(
                    f"receipt hostile {fixture_id} expected {expected}; "
                    f"exit={process.returncode}; evidence={evidence[-1200:].decode('utf-8', errors='replace')}"
                )
            results.append(
                {
                    "fixture_id": (
                        fixture_id
                        if fixture_id.startswith("receipt-")
                        else f"receipt-{fixture_id}"
                    ),
                    "expected_code": expected,
                    "result": "pass",
                }
            )
    return results


def replay_canonical_producers(contracts: dict[str, Any]) -> dict[str, Any]:
    plan = run(
        [
            "node",
            str(VIEW / "validate-work-pack.mjs"),
            ".",
            "--logical-plan-root",
            PLAN_REL.as_posix(),
            "--emit-expected",
        ],
        cwd=REPO,
    )
    require_pass(plan, "staged Work-Pack validator")
    if plan.stdout != (STAGED / "VALIDATION-RESULT.json").read_bytes():
        raise ValueError("STORED_PLAN_OUTPUT_DRIFT")

    entry = run(
        [
            "python3",
            str(ENTRY_VALIDATOR),
            "--projection",
            str(STAGED / "EXECUTION-ENTRY.json"),
        ],
        cwd=REPO,
    )
    require_pass(entry, "canonical execution-entry validator")
    if (
        len(entry.stdout) != 267
        or sha256_bytes(entry.stdout) != ENTRY_RESULT_SHA256
        or entry.stdout
        != (STAGED / "EXECUTION-ENTRY-VALIDATION.json").read_bytes()
    ):
        raise ValueError("ENTRY_CANONICAL_OUTPUT_DRIFT")

    dispatch = run(
        ["python3", str(DISPATCH_VALIDATOR), "DISPATCH.json"], cwd=PACKAGE
    )
    require_pass(dispatch, "canonical dispatch validator")
    if dispatch.stdout != b"VALIDATION=pass\nDISPATCH=DISPATCH.json\n":
        raise ValueError("DISPATCH_CANONICAL_OUTPUT_DRIFT")

    positive_receipts = positive_receipt_results(contracts)

    with tempfile.TemporaryDirectory(prefix="wp-rmt-002-audit-") as temp:
        output = Path(temp) / "official-audit"
        audit = run(
            [
                "python3",
                str(AUDITOR),
                "--config",
                str(PACKAGE / "audit-config.json"),
                "--output-dir",
                str(output),
            ],
            cwd=PACKAGE,
        )
        require_pass(audit, "official Work-Pack Readiness audit")
        for name in (
            "work-pack-readiness-report-v2.json",
            "plan-semantic-manifest.json",
            "selection-handoff.json",
        ):
            if (output / name).read_bytes() != (PACKAGE / "official-audit" / name).read_bytes():
                raise ValueError(f"OFFICIAL_AUDIT_OUTPUT_DRIFT:{name}")
    return {
        "staged_plan_validator": "pass-exact-output",
        "canonical_entry_validator": "pass-exact-output",
        "dispatch_validator": "pass-exact-output",
        "official_readiness_audit": "pass-exact-three-outputs",
        "terminal_receipt_positive_fixtures": positive_receipts,
        "plan_stdout": plan.stdout,
        "entry_stdout": entry.stdout,
    }


def hostile_results(
    manifest: dict[str, Any],
    contracts: dict[str, Any],
    entry: dict[str, Any],
    apply_proposal: dict[str, Any],
    source_intent: dict[str, Any],
    refresh_contract: dict[str, Any],
    replay: dict[str, Any],
) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []

    def model(fixture_id: str, expected: str, mutate: Callable[..., None]) -> None:
        values = [
            copy.deepcopy(manifest),
            copy.deepcopy(contracts),
            copy.deepcopy(entry),
            copy.deepcopy(apply_proposal),
            copy.deepcopy(source_intent),
            copy.deepcopy(refresh_contract),
        ]
        mutate(*values)
        codes = model_codes(*values)
        if expected not in codes:
            raise ValueError(f"hostile {fixture_id} expected {expected}, got {sorted(codes)}")
        results.append({"fixture_id": fixture_id, "expected_code": expected, "result": "pass"})

    model(
        "missing-timeout",
        "MISSING_TIMEOUT",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0]["validation_contracts"][0].pop("timeout_seconds"),
    )
    model(
        "ambiguous-successor",
        "AMBIGUOUS_SUCCESSOR",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0]["canonical_successors"].append("RMT-RULE-001"),
    )
    model(
        "write-partition",
        "WRITE_PARTITION_INVALID",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0]["write_partition"]["material_writes"].append(c["contracts"][0]["atomicity"]["receipt"]),
    )
    model(
        "lifecycle-authority-publication-drift",
        "LIFECYCLE_AUTHORITY_PUBLICATION_DRIFT",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0].__setitem__("publication_class", "public"),
    )
    model(
        "command-env-drift",
        "COMMAND_ENV_DRIFT",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0]["validation_contracts"][0].__setitem__("cwd", "/tmp"),
    )
    model(
        "wrong-executable",
        "COMMAND_EXECUTABLE_DRIFT",
        lambda _m, c, _e, _a, _s, _r: c["contracts"][0]["validation_contracts"][0]["runtime_identity"].__setitem__("executable", "python3"),
    )

    def cargo_contract(rows: dict[str, Any]) -> dict[str, Any]:
        return next(
            row
            for row in rows["contracts"]
            if row["primary_command"]["risk_class"] == "bounded-write"
        )

    model(
        "cargo-risk",
        "CARGO_RISK_DRIFT",
        lambda _m, c, _e, _a, _s, _r: cargo_contract(c)["validation_contracts"][0].__setitem__("risk_class", "read-only"),
    )

    def break_cargo_partition(_m: Any, c: Any, _e: Any, _a: Any, _s: Any, _r: Any) -> None:
        row = cargo_contract(c)
        transient = row["atomicity"]["transient_outputs"][0]["path"]
        row["write_partition"]["execution_outputs"].remove(transient)
        row["write_partition"]["material_writes"].append(transient)

    model("cargo-partition", "CARGO_PARTITION_DRIFT", break_cargo_partition)

    with tempfile.TemporaryDirectory(prefix="wp-rmt-002-entry-hostile-") as temp:
        path = Path(temp) / "EXECUTION-ENTRY.json"
        hostile_entry = copy.deepcopy(entry)
        hostile_entry["readiness_outer_loop"] = {"forbidden": True}
        path.write_bytes(encoded(hostile_entry))
        process = run(
            ["python3", str(ENTRY_VALIDATOR), "--projection", str(path)],
            cwd=REPO,
        )
        evidence = process.stdout + process.stderr
        if (
            process.returncode == 0
            or b"EXECUTION_ENTRY_SCHEMA_INVALID" not in evidence
        ):
            raise ValueError("entry-extra-field hostile did not fail closed")
    results.append(
        {
            "fixture_id": "entry-extra-field",
            "expected_code": "EXECUTION_ENTRY_SCHEMA_INVALID",
            "result": "pass",
        }
    )

    entry_result = load(STAGED / "EXECUTION-ENTRY-VALIDATION.json")
    entry_result["status"] = "block"
    if replay["entry_stdout"] == encoded(entry_result):
        raise ValueError("entry-noncanonical-result hostile did not drift")
    results.append({"fixture_id": "entry-noncanonical-result", "expected_code": "ENTRY_CANONICAL_OUTPUT_DRIFT", "result": "pass"})

    model(
        "stale-source",
        "STALE_SOURCE",
        lambda _m, _c, _e, a, _s, _r: a["changes"][0]["preimage"].__setitem__("sha256", "0" * 64),
    )
    model(
        "stale-rejected-freeze-binding",
        "REJECTED_FREEZE_BINDING_STALE",
        lambda _m, _c, _e, a, _s, _r: a[
            "superseded_unreceipted_proposal"
        ].__setitem__("rejected_freeze_sha256", "0" * 64),
    )
    reserved_path_cases = [
        {
            "fixture_id": "transient-run-directory-overlap",
            "expected_code": "TRANSIENT_RUN_DIRECTORY_OVERLAP",
            "diagnostic": "run directory",
        },
        {
            "fixture_id": "transient-plan-ledger-overlap",
            "expected_code": "TRANSIENT_PLAN_LEDGER_OVERLAP",
            "diagnostic": "plan admission consumption ledger",
        },
        {
            "fixture_id": "transient-prerequisite-ledger-overlap",
            "expected_code": "TRANSIENT_PREREQUISITE_LEDGER_OVERLAP",
            "diagnostic": "pre-execution prerequisite consumption ledger",
        },
        {
            "fixture_id": "transient-prerequisite-receipt-overlap",
            "expected_code": "TRANSIENT_PREREQUISITE_RECEIPT_OVERLAP",
            "diagnostic": "pre-execution prerequisite resume receipt",
        },
        {
            "fixture_id": "external-executor-receipt-not-run-scoped",
            "expected_code": "EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
            "diagnostic": "run-scoped terminal path",
        },
        {
            "fixture_id": "tampered-ticket-executor-receipt-path",
            "expected_code": "TICKET_EXECUTOR_RECEIPT_NOT_RUN_SCOPED",
            "diagnostic": "run-scoped terminal path",
        },
        {
            "fixture_id": "tampered-ticket-prerequisite-reservation",
            "expected_code": "TICKET_TRANSIENT_PREREQUISITE_RESERVATION_OVERLAP",
            "diagnostic": "pre-execution prerequisite consumption ledger",
        },
        {
            "fixture_id": "ticket-only-transient-substitution",
            "expected_code": "TASK_SESSION_TICKET_CHECKPOINT_REF_STALE",
            "diagnostic": "TASK_SESSION_TICKET_CHECKPOINT_REF_STALE",
        },
        {
            "fixture_id": "ticket-checkpoint-transient-substitution",
            "expected_code": "TASK_SESSION_TICKET_TRANSIENT_CLOSURE_DRIFT",
            "diagnostic": "TASK_SESSION_TICKET_TRANSIENT_CLOSURE_DRIFT",
        },
    ]
    reserved_path_evidence = load(TASK_SESSION_CANDIDATE_RESULT).get(
        "semantic", {}
    ).get("governance_reserved_path_regressions", {})
    if reserved_path_evidence != {
        "count": "9/9",
        "cases": reserved_path_cases,
    }:
        raise ValueError("reserved governance-path regression evidence drift")
    results.extend(
        {
            "fixture_id": row["fixture_id"],
            "expected_code": row["expected_code"],
            "result": "pass",
        }
        for row in reserved_path_cases
    )
    model(
        "decision-gate-command-drift",
        "DECISION_GATE_COMMAND_DRIFT",
        lambda _m, _c, _e, _a, _s, r: r["validation"][0]["argv"].insert(
            3, "--request"
        ),
    )
    with tempfile.TemporaryDirectory(prefix="decision-command-hostile-") as temp:
        hostile_output = Path(temp) / "option-admissibility-receipt.json"
        missing_schema = (
            "projects/domainspec-v2/development/architecture-pattern-enforcement/"
            "refreshes/missing-decision-receipt.schema.json"
        )
        hostile_argv = [
            str(hostile_output)
            if item == DECISION_OUTPUT_TOKEN
            else missing_schema
            if item == DECISION_RECEIPT_SCHEMA.relative_to(REPO).as_posix()
            else item
            for item in refresh_contract["validation"][0]["argv"]
        ]
        hostile_decision = run(hostile_argv, cwd=REPO)
        if hostile_decision.returncode == 0:
            raise ValueError("Decision Gate command nonzero hostile did not propagate")
    results.append(
        {
            "fixture_id": "decision-gate-command-nonzero-propagation",
            "expected_code": "DECISION_GATE_COMMAND_NONZERO",
            "result": "pass",
        }
    )
    plan_result = load(STAGED / "VALIDATION-RESULT.json")
    plan_result["result"] = "block"
    if replay["plan_stdout"] == encoded(plan_result):
        raise ValueError("stored-plan-output-drift hostile did not drift")
    results.append({"fixture_id": "stored-plan-output-drift", "expected_code": "STORED_PLAN_OUTPUT_DRIFT", "result": "pass"})
    model(
        "refresh-signal-mapping",
        "REFRESH_SIGNAL_MAPPING_DRIFT",
        lambda _m, _c, _e, _a, _s, r: r["proposed_changes"].pop(),
    )
    model(
        "refresh-signal-source-closure",
        "REFRESH_SOURCE_SIGNAL_UNBOUND",
        lambda _m, _c, _e, _a, _s, r: r["source_signals"][0].__setitem__(
            "source_path", "missing/unbound-source.json#selector"
        ),
    )
    model(
        "acceptance-inflation",
        "ACCEPTANCE_INFLATION",
        lambda _m, _c, _e, _a, s, _r: s["owner_acceptance"].__setitem__("status", "accepted"),
    )

    results.extend(receipt_hostile_results(contracts))
    return results


def main() -> None:
    if sys.argv[1:] not in ([], ["--emit-expected"], ["--write-expected"]):
        raise SystemExit(
            "usage: validate-proposal.py [--emit-expected|--write-expected]"
        )
    emit_expected = sys.argv[1:] == ["--emit-expected"]
    write_expected = sys.argv[1:] == ["--write-expected"]
    manifest = load(STAGED / "SWU-MANIFEST.json")
    contracts = load(STAGED / "SWU-CONTRACTS.json")
    entry = load(STAGED / "EXECUTION-ENTRY.json")
    apply_proposal = load(PACKAGE / "APPLY-PROPOSAL.json")
    source_intent = load(PACKAGE / "SOURCE-INTENT.json")
    refresh_contract = load(PACKAGE / "refresh-report.json")
    codes = model_codes(
        manifest, contracts, entry, apply_proposal, source_intent, refresh_contract
    )
    if codes:
        raise SystemExit("base proposal invalid: " + ",".join(sorted(codes)))

    if {path.name for path in PREIMAGE.iterdir()} != set(TARGETS):
        raise SystemExit("preimage target inventory is not exactly six files")
    if {path.name for path in STAGED.iterdir()} != set(TARGETS):
        raise SystemExit("staged target inventory is not exactly six files")
    for name in TARGETS:
        if digest(PREIMAGE / name) == digest(STAGED / name):
            raise SystemExit(f"target lacks a changed postimage: {name}")
        if digest(VIEW / name) != digest(STAGED / name):
            raise SystemExit(f"validation view target drift: {name}")

    preimage_files = {
        path.relative_to(PACKAGE / "preimages").as_posix()
        for path in (PACKAGE / "preimages").rglob("*")
        if path.is_file()
    }
    staged_files = {
        path.relative_to(PACKAGE / "staged").as_posix()
        for path in (PACKAGE / "staged").rglob("*")
        if path.is_file()
    }
    if preimage_files != set(ALL_TARGETS) or staged_files != set(ALL_TARGETS):
        raise SystemExit("full candidate target inventory is not exactly 33 files")
    for relative in ALL_TARGETS:
        live = REPO / relative
        preimage = PACKAGE / "preimages" / relative
        postimage = PACKAGE / "staged" / relative
        if live.read_bytes() != preimage.read_bytes():
            raise SystemExit(f"live candidate preimage drift: {relative}")
        if postimage.read_bytes() == preimage.read_bytes():
            raise SystemExit(f"candidate target lacks changed postimage: {relative}")

    preserved = {
        "WORK-PACK.md": "e96b5d414279fdd7ad1689bcac70e9292adbbae588a8705e1bb73b2174f7ef37",
        "EXECUTION-PACK.md": "b099f325092d65c3230fb2bdc6e524b8275bf118a9aa7113e0faab76f7d53577",
        "PLAN-RECEIPT.json": "d4a2fe31e1c39557f0c7012f760f67ae695634f6ddaf3757c426576e78794e40",
        "DISTILL-PLAN-VALIDATION.md": "bde8d52c52818ecf576769fd3f5bc4446ea1470c05f1b6fa1df8dd5179b245ee",
    }
    for name, expected in preserved.items():
        if digest(LIVE_PLAN / name)[0] != expected or digest(VIEW / name)[0] != expected:
            raise SystemExit(f"preserved plan evidence drift: {name}")

    if (PACKAGE / "PROPOSAL-RECEIPT.json").exists():
        raise SystemExit("terminal proposal receipt must remain absent")
    if (PACKAGE / "REFRESH-CONTRACT.json").exists():
        raise SystemExit("redundant custom Refresh contract must remain absent")
    if (PACKAGE / "validation/validate-execution-entry.mjs").exists():
        raise SystemExit("retired local execution-entry oracle must remain absent")
    hygiene_residue = [
        path.relative_to(PACKAGE).as_posix()
        for path in PACKAGE.rglob("*")
        if path.is_symlink() or path.name == "__pycache__" or path.suffix == ".pyc"
    ]
    if hygiene_residue:
        raise SystemExit("proposal hygiene residue: " + ",".join(hygiene_residue))

    with tempfile.TemporaryDirectory(prefix="decision-gate-prefilter-") as temp:
        replayed_receipt = Path(temp) / "option-admissibility-receipt.json"
        recorded_decision = refresh_contract["validation"][0]
        recorded_argv = list(recorded_decision["argv"])
        if recorded_argv.count(DECISION_OUTPUT_TOKEN) != 1:
            raise SystemExit("RECORDED_DECISION_GATE_OUTPUT_TOKEN_INVALID")
        replay_argv = [
            str(replayed_receipt) if item == DECISION_OUTPUT_TOKEN else item
            for item in recorded_argv
        ]
        decision = run(replay_argv, cwd=REPO)
        if decision.returncode != recorded_decision["expected_exit_code"]:
            raise SystemExit(
                "RECORDED_DECISION_GATE_COMMAND_EXIT_DRIFT:"
                f"expected={recorded_decision['expected_exit_code']} "
                f"actual={decision.returncode}"
            )
        if replayed_receipt.read_bytes() != DECISION_RECEIPT.read_bytes():
            raise SystemExit("STORED_DECISION_GATE_RECEIPT_DRIFT")

    regression_matrix = load(REGRESSION_MATRIX)
    sealed_decision = load(DECISION_GATE_PROPOSAL)
    matrix_rows = regression_matrix.get("rows", [])
    audit_added_requirements = [
        "transient scope is disjoint from the Task Session run directory before any run write",
        "transient scope is disjoint from the plan admission consumption ledger",
        "transient scope is disjoint from the pre-execution prerequisite consumption ledger",
        "transient scope is disjoint from the pre-execution prerequisite resume receipt",
        "configured executor receipt path outside the run directory is rejected by the legacy run-scoped invariant",
        "tampered ticket executor receipt path blocks before executor launch",
        "tampered ticket prerequisite reservation blocks before receipt join",
        "ticket-only non-reserved transient substitution blocks before executor launch and any admission or executor effect",
        "ticket plus checkpoint-ref transient substitution blocks against exact request and admission closure before executor launch",
    ]
    audit_added_rows = regression_matrix.get("audit_added_rows", [])
    if (
        regression_matrix.get("schema_version")
        != "arcanum.task-session-transient-output-regression-matrix/v1"
        or regression_matrix.get("proposal_id") != PROPOSAL_ID
        or regression_matrix.get("matrix_count") != 15
        or regression_matrix.get("pass_count") != 15
        or [row.get("requirement") for row in matrix_rows]
        != sealed_decision.get("minimum_regression_matrix")
        or any(
            row.get("status") != "pass" or not row.get("evidence")
            for row in matrix_rows
        )
        or regression_matrix.get("audit_added_count") != 9
        or regression_matrix.get("audit_added_pass_count") != 9
        or [row.get("requirement") for row in audit_added_rows]
        != audit_added_requirements
        or any(
            row.get("status") != "pass" or not row.get("evidence")
            for row in audit_added_rows
        )
        or not ref_matches(
            {
                key: value
                for key, value in regression_matrix.get("source_ref", {}).items()
                if key != "selector"
            },
            DECISION_GATE_PROPOSAL,
        )
        or regression_matrix.get("source_ref", {}).get("selector")
        != "/minimum_regression_matrix"
        or regression_matrix.get("live_mutation") != "absent"
        or regression_matrix.get("authority_effect") != "none"
    ):
        raise SystemExit("Decision Gate regression matrix incomplete")

    candidate = run(
        ["python3", str(TASK_SESSION_CANDIDATE_VALIDATOR), "--emit-expected"],
        cwd=PACKAGE,
        timeout=300,
    )
    require_pass(candidate, "staged Task Session candidate validator")
    if candidate.stdout != TASK_SESSION_CANDIDATE_RESULT.read_bytes():
        raise SystemExit("STORED_TASK_SESSION_CANDIDATE_OUTPUT_DRIFT")

    replay = replay_canonical_producers(contracts)
    audit_report = load(PACKAGE / "official-audit/work-pack-readiness-report-v2.json")
    semantic_manifest = load(PACKAGE / "official-audit/plan-semantic-manifest.json")
    handoff = load(PACKAGE / "official-audit/selection-handoff.json")
    entry_routes = entry["execution_policy"]["allowed_routes"]
    audit_routes = handoff.get("allowed_routes", [])
    if (
        audit_report.get("verdict") != "pass"
        or audit_report.get("terminal_code") != "PLAN_SEMANTIC_READY"
        or audit_report.get("selected_unit") is not None
        or audit_report.get("mutation_ready") is not False
        or audit_report.get("runtime_admission_status") != "pending-selection"
        or audit_report.get("source_snapshot", {}).get("drift") is not False
        or len(semantic_manifest.get("ready_frontier", [])) != 70
        or semantic_manifest.get("execution_entry", {}).get("selected_unit") is not None
        or semantic_manifest.get("mutation_ready") is not False
        or handoff.get("selection_required") is not True
        or handoff.get("mutation_ready") is not False
        or len(audit_routes) != 70
        or audit_routes[0] != entry_routes[0]
    ):
        raise SystemExit("official readiness projection invalid")

    hostiles = hostile_results(
        manifest,
        contracts,
        entry,
        apply_proposal,
        source_intent,
        refresh_contract,
        replay,
    )
    fixture_index = load(PACKAGE / "HOSTILE-FIXTURES.json")
    expected_pairs = [
        (item["fixture_id"], item["expected_code"])
        for item in fixture_index["fixtures"]
    ]
    actual_pairs = [(item["fixture_id"], item["expected_code"]) for item in hostiles]
    if fixture_index.get("fixture_count") != 69 or actual_pairs != expected_pairs:
        raise SystemExit("hostile fixture inventory drift")

    plan_result = load(STAGED / "VALIDATION-RESULT.json")
    task_contracts = plan_result.get("task_contracts", {})
    if (
        plan_result.get("result") != "pass"
        or task_contracts.get("exact_executable_bindings") != "182/182"
        or task_contracts.get("bounded_write_cargo_commands") != "7/7"
        or task_contracts.get("cargo_transient_execution_outputs") != "7/7"
        or task_contracts.get("per_swu_terminal_receipt_schemas") != "70/70"
        or task_contracts.get("task_session_execution_context_bindings") != "70/70"
        or task_contracts.get("single_use_attempt_ledgers") != "70/70"
    ):
        raise SystemExit("stored staged Work-Pack result invalid")
    refresh_report = load(PACKAGE / "refresh-report.json")
    if (
        refresh_report.get("result") != "pass"
        or refresh_report.get("mutation_ready") is not False
        or refresh_report.get("handoff_status") != "gated"
        or refresh_report.get("material_package", {}).get("required") is not False
    ):
        raise SystemExit("refresh report state invalid")
    repair_ledger = load(PACKAGE / "REPAIR-LEDGER.json")
    required_failure_ids = {
        "stage-copy-parent-directories",
        "python-command-unavailable",
        "partial-arcanum-overlay-import",
        "governance-transient-phase-placement",
        "block-receipt-empty-transient-schema",
        "official-auditor-relative-path",
        "inherited-six-target-refresh-report",
        "candidate-overlay-dangling-tool-links",
        "option-a-audit-snapshot-refresh",
        "cargo-admission-omission-type-error",
        "package-python-cache-residue",
        "independent-audit-rejected-freeze-binding",
        "independent-audit-governance-path-reservation",
        "stale-proposal-receipt-writer",
        "independent-final-audit-executor-receipt-invariant",
        "independent-final-audit-decision-command-shape",
        "candidate-harness-exact-present-first-replay",
        "independent-final-audit-ticket-closure",
    }
    audit_incidents = repair_ledger.get("audit_incidents", [])
    if (
        repair_ledger.get("schema_version")
        != "domainspec.wp-rmt-002-task-session-transient-repair-ledger/v1"
        or repair_ledger.get("proposal_id") != PROPOSAL_ID
        or {row.get("id") for row in repair_ledger.get("failures", [])}
        != required_failure_ids
        or any(row.get("result") != "repaired" for row in repair_ledger.get("failures", []))
        or audit_incidents
        != [
            {
                "id": "parent-audit-module-import-bytecode",
                "classification": "audit-local-transient-residue-not-candidate-defect",
                "path": "staged/arcanum/arcana/task-session/scripts/__pycache__/task-session-governance-runner.cpython-312.pyc",
                "removed": True,
                "empty_directory_removed": True,
                "post_cleanup_inventory_sha256": "1ec2122bb0a0df989579bf950e6c217a1b67b0ca7f7e526343ca607cb30f7742",
                "post_cleanup_replay": "pass",
            }
        ]
        or repair_ledger.get("public_governance_api_changed") is not True
        or repair_ledger.get("product_acceptance_semantics_changed") is not False
        or repair_ledger.get("authority_effect") != "none"
    ):
        raise SystemExit("repair ledger incomplete")

    if (PACKAGE / "PROPOSAL-RECEIPT.json").exists():
        raise SystemExit("PROPOSAL_RECEIPT_MUST_REMAIN_ABSENT")
    receipt_preview_process = run(
        ["python3", str(FREEZE_PROPOSAL_VALIDATOR), "preview"],
        cwd=PACKAGE,
    )
    require_pass(receipt_preview_process, "proposal receipt preview")
    receipt_preview = json.loads(receipt_preview_process.stdout)
    if (
        receipt_preview.get("receipt_id") != PROPOSAL_ID
        or receipt_preview.get("selected_option") != "A"
        or receipt_preview.get("target_count") != 33
        or receipt_preview.get("decision") != apply_proposal.get("decision")
        or receipt_preview.get("source_inventory")
        != refresh_contract.get("source_inventory")
        or receipt_preview.get("target_inventory")
        != refresh_contract.get("target_inventory")
        or len(receipt_preview.get("live_preimage_rehash_at_freeze", [])) != 33
        or receipt_preview.get("validation", {}).get("counts", {}).get(
            "hostile_fixtures"
        )
        != "69/69"
        or receipt_preview.get("apply_state", {}).get("live_targets_mutated")
        is not False
        or receipt_preview.get("authority_effect") != "none"
    ):
        raise SystemExit("proposal receipt preview semantics invalid")

    output = {
        "schema_version": "domainspec.wp-rmt-002-task-session-transient-proposal-validation/v1",
        "result": "pass",
        "decision_gate": {
            "selected_option": "A",
            "presented_options": "3/3",
            "admissible_options": "3/3",
            "canonical_prefilter_replay": "pass-exact-output",
            "minimum_regression_matrix": "15/15",
            "audit_added_governance_path_regressions": "9/9",
        },
        "target_preimages_unchanged": "33/33",
        "target_postimages_changed": "33/33",
        "canonical_public_task_session_targets": "11/11",
        "generated_codex_parity": "8/8",
        "generated_claude_parity": "8/8",
        "task_session_candidate_validation": load(TASK_SESSION_CANDIDATE_RESULT),
        "preserved_plan_artifacts": "4/4",
        "unit_execution_contracts": "70/70",
        "dependency_edges": "74/74",
        "primary_commands": "70/70",
        "structured_validation_commands": "112/112",
        "exact_executable_bindings": "182/182",
        "bounded_write_cargo_commands": "7/7",
        "cargo_transient_execution_outputs": "7/7",
        "per_swu_terminal_receipt_schemas": "70/70",
        "task_session_execution_context_bindings": "70/70",
        "single_use_attempt_ledgers": "70/70",
        "canonical_successors": "70/70",
        "write_partitions": "70/70",
        "terminal_receipt_preview": "pass-receipt-absent",
        "canonical_producer_replay": {
            key: value for key, value in replay.items() if not key.endswith("_stdout")
        },
        "hostile_fixtures": {
            "result": "pass",
            "count": "69/69",
            "receipt_topology_positive": "4/4",
            "receipt_topology_hostile": "42/42",
            "results": hostiles,
        },
        "official_readiness_audit": {
            "verdict": "pass",
            "terminal_code": "PLAN_SEMANTIC_READY",
            "finite_outer_loop_units": 70,
            "invoke_authoring_frontier": "RMT-OP-001",
            "selected_unit": None,
            "mutation_ready": False,
        },
        "owner_acceptance": "absent",
        "apply_authorization": "absent",
        "proposal_receipt": "absent",
        "runtime_identity_claim": "Task Session-owned observed evidence; this proposal validates shape and exact declared executable binding but does not independently rehash runtime binaries",
        "authority_effect": "none",
    }
    payload = (json.dumps(output, indent=2, sort_keys=True) + "\n").encode("utf-8")
    stored_result = PACKAGE / "VALIDATION-RESULT.json"
    if write_expected:
        stored_result.write_bytes(payload)
    elif not emit_expected:
        if not stored_result.is_file() or stored_result.read_bytes() != payload:
            raise SystemExit("STORED_PACKAGE_VALIDATION_OUTPUT_DRIFT")
    if not write_expected:
        sys.stdout.buffer.write(payload)


if __name__ == "__main__":
    main()
