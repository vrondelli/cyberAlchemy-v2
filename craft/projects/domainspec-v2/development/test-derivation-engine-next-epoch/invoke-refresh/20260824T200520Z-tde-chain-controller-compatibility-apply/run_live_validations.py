#!/usr/bin/env python3
"""Run acceptance-critical validation against the exact live r3 bytes."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path.cwd().resolve()
RUN_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)
TARGET_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
RUN = ROOT / RUN_REL
TARGET = ROOT / TARGET_REL
VALIDATION = RUN / "validation"
PROOF_CREATED_AT = "2026-08-24T20:05:20Z"
PROOF_INVOCATION_ID = "invoke-refresh-tde-chain-controller-compatibility-apply-20260824T200520Z"


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, document: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def exact_ref(relative_path: Path) -> dict:
    payload = (ROOT / relative_path).read_bytes()
    return {"path": str(relative_path), "sha256": sha256_bytes(payload), "size_bytes": len(payload)}


def run_command(command_id: str, argv: list[str], expected_exits: set[int]) -> dict:
    result = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True)
    stdout_path = VALIDATION / "command-output" / f"{command_id}.stdout.txt"
    stderr_path = VALIDATION / "command-output" / f"{command_id}.stderr.txt"
    stdout_path.parent.mkdir(parents=True, exist_ok=True)
    stdout_path.write_text(result.stdout, encoding="utf-8")
    stderr_path.write_text(result.stderr, encoding="utf-8")
    return {
        "command_id": command_id,
        "argv": argv,
        "exit_code": result.returncode,
        "expected_exits": sorted(expected_exits),
        "status": "pass" if result.returncode in expected_exits else "fail",
        "stdout_ref": exact_ref(stdout_path.relative_to(ROOT)),
        "stderr_ref": exact_ref(stderr_path.relative_to(ROOT)),
    }


def main() -> None:
    package = load_json(RUN / "material/material-package.json")
    baseline = load_json(RUN / "baseline/PREAPPLY-BASELINE.json")
    apply_receipt = load_json(RUN / "material/material-apply-receipt.json")
    if apply_receipt.get("status") != "pass" or apply_receipt.get("target_count") != 84:
        raise SystemExit("LIVE_VALIDATION_BLOCK: exact apply receipt missing")

    target_set = {change["target_path"] for change in package["changes"]}
    live_files = {
        str(path.relative_to(ROOT))
        for path in TARGET.rglob("*")
        if path.is_file() and not path.is_symlink()
    }
    symlinks = sorted(
        str(path.relative_to(ROOT)) for path in TARGET.rglob("*") if path.is_symlink()
    )
    changed_inventory = []
    byte_failures = []
    for change in package["changes"]:
        target = ROOT / change["target_path"]
        staged = ROOT / change["output_ref"]["path"]
        target_payload = target.read_bytes()
        staged_payload = staged.read_bytes()
        current_sha = sha256_bytes(target_payload)
        expected_sha = change["output_ref"]["sha256"]
        status = "pass" if target_payload == staged_payload and current_sha == expected_sha else "fail"
        if status == "fail":
            byte_failures.append(change["target_path"])
        changed_inventory.append(
            {
                "target_path": change["target_path"],
                "staged_path": change["output_ref"]["path"],
                "operation": "create",
                "sha256": current_sha,
                "size_bytes": len(target_payload),
                "status": status,
            }
        )

    json_failures = []
    for path in sorted(TARGET.rglob("*.json")):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            json_failures.append({"path": str(path.relative_to(ROOT)), "error": str(error)})
    markdown_failures = []
    for path in sorted(TARGET.rglob("*.md")):
        payload = path.read_bytes()
        text = payload.decode("utf-8")
        trailing = [index for index, line in enumerate(text.splitlines(), start=1) if line.endswith(" ") or line.endswith("\t")]
        eof_ok = payload.endswith(b"\n") and not payload.endswith(b"\n\n")
        if trailing or not eof_ok:
            markdown_failures.append(
                {"path": str(path.relative_to(ROOT)), "trailing_whitespace_lines": trailing, "single_terminal_newline": eof_ok}
            )

    stale_lifecycle = []
    for path in sorted(TARGET.rglob("*")):
        if not path.is_file() or path.suffix not in {".md", ".json"}:
            continue
        relative = str(path.relative_to(ROOT))
        if "/reconciliation/REFRESH-SIGNALS.json" in relative:
            continue
        text = path.read_text(encoding="utf-8")
        for line_number, line in enumerate(text.splitlines(), start=1):
            if "@2" in line and any(
                marker in line.lower()
                for marker in ("acceptance", "plan candidate", "postimage", "new @2 bytes", "task session verifies")
            ):
                stale_lifecycle.append(
                    {
                        "path": relative,
                        "line": line_number,
                        "observed": line,
                        "expected_candidate": "dsv2-tde-multiformalism-profile-epoch@3",
                    }
                )

    preservation_failures = []
    preservation_results = []
    for entry in baseline["preserved_source_checks"]:
        path = ROOT / entry["path"]
        current_sha = sha256_bytes(path.read_bytes()) if path.is_file() and not path.is_symlink() else None
        status = "pass" if current_sha == entry["before_sha256"] else "fail"
        if status == "fail":
            preservation_failures.append(entry["path"])
        preservation_results.append(
            {"path": entry["path"], "before_sha256": entry["before_sha256"], "after_sha256": current_sha, "status": status}
        )
    for entry in baseline["proposal_bindings"]:
        path = ROOT / entry["path"]
        current_sha = sha256_bytes(path.read_bytes()) if path.is_file() and not path.is_symlink() else None
        status = "pass" if current_sha == entry["sha256"] else "fail"
        if status == "fail":
            preservation_failures.append(entry["path"])
        preservation_results.append(
            {"path": entry["path"], "before_sha256": entry["sha256"], "after_sha256": current_sha, "status": status}
        )

    command_ledger: list[dict] = []
    command_ledger.append(
        run_command(
            "attempt-2-unit-contract-validator",
            [
                "python3",
                str(TARGET_REL / "plan/work-pack/shared/validate_tde_unit_contracts.py"),
                "--schema",
                str(TARGET_REL / "plan/work-pack/shared/TDE-UNIT-VALIDATION.schema.json"),
                "--contracts",
                str(TARGET_REL / "plan/work-pack/shared/VALIDATION-CONTRACTS.json"),
                "--positive",
                str(TARGET_REL / "plan/work-pack/shared/unit-contract-fixtures/valid.json"),
                "--negative",
                str(TARGET_REL / "plan/work-pack/shared/unit-contract-fixtures/invalid-missing-expected-exit.json"),
            ],
            {0},
        )
    )
    command_ledger.append(
        run_command(
            "attempt-2-execution-entry-validator",
            [
                "python3",
                ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py",
                "--projection",
                str(TARGET_REL / "plan/EXECUTION-ENTRY.json"),
                "--output",
                str(RUN_REL / "validation/live-execution-entry-validation-attempt-2.json"),
            ],
            {0},
        )
    )
    command_ledger.append(
        run_command(
            "attempt-2-dispatch-validator",
            [
                "python3",
                "arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py",
                "--json",
                str(TARGET_REL / "DISPATCH.json"),
            ],
            {0},
        )
    )
    wpra_dir = VALIDATION / "live-wpra-attempt-2"
    if wpra_dir.exists():
        raise SystemExit("LIVE_VALIDATION_BLOCK: WPRA output directory already exists")
    command_ledger.append(
        run_command(
            "attempt-2-live-wpra",
            [
                "python3",
                ".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py",
                "--config",
                str(TARGET_REL / "readiness/audit-config.json"),
                "--output-dir",
                str(RUN_REL / "validation/live-wpra-attempt-2"),
            ],
            {0},
        )
    )
    wpra_report = wpra_dir / "work-pack-readiness-report-v2.json"
    if not wpra_report.is_file():
        raise SystemExit("LIVE_VALIDATION_BLOCK: WPRA report missing")
    command_ledger.append(
        run_command(
            "attempt-2-live-implementation-readiness",
            [
                "python3",
                ".agents/skills/invoke/scripts/prepare_plan_implementation_readiness.py",
                "--audit-config",
                str(TARGET_REL / "readiness/audit-config.json"),
                "--audit-report",
                str(wpra_report.relative_to(ROOT)),
                "--proof-invocation-id",
                PROOF_INVOCATION_ID,
                "--proof-created-at",
                PROOF_CREATED_AT,
                "--output",
                str(RUN_REL / "validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT-attempt-2.json"),
            ],
            {0},
        )
    )

    wpra_manifest_path = wpra_dir / "plan-semantic-manifest.json"
    wpra_selection_path = wpra_dir / "selection-handoff.json"
    wpra_manifest = load_json(wpra_manifest_path)
    wpra_report_document = load_json(wpra_report)
    execution_entry_ref = exact_ref(TARGET_REL / "plan/EXECUTION-ENTRY.json")
    controller_config = {
        "schema_version": "1.0.0",
        "chain_id": "apply-probe-tde-multiformalism-profile-epoch-r3-20260824T200520Z",
        "repository_root": ".",
        "state_directory": str(RUN_REL / "validation/controller-probe-state"),
        "scope_id": "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z",
        "manifest_ref": exact_ref(wpra_manifest_path.relative_to(ROOT)),
        "audit_report_ref": exact_ref(wpra_report.relative_to(ROOT)),
        "wpra_v2": {
            "audit_config_ref": exact_ref(TARGET_REL / "readiness/audit-config.json"),
            "execution_contracts_ref": exact_ref(TARGET_REL / "plan/work-pack/shared/EXECUTION-CONTRACTS.json"),
            "selection_handoff_ref": exact_ref(wpra_selection_path.relative_to(ROOT)),
            "initial_selection_request_ref": execution_entry_ref,
            "initial_selection_receipt_ref": execution_entry_ref,
        },
        "audit_verdict": "pass",
        "audit_flags": [],
        "approved_epoch": {
            "epoch_id": wpra_manifest["plan_epoch_id"],
            "audit_projection_digest": wpra_report_document["audit_projection_digest"],
            "canonical_semantic_digest": wpra_manifest["canonical_semantic_digest"],
            "source_snapshot_digest": wpra_manifest["source_snapshot_digest"],
            "decision_gate_approval_receipt_ref": execution_entry_ref,
            "approval_owner_ref": "Rondelli",
            "approval_status": "approved",
        },
        "finite_frontier": wpra_manifest["ready_frontier"],
        "run_budget": {"max_task_session_requests": 10},
        "risk_ceiling": "bounded-write",
        "allowed_task_session_flags": [],
        "persistence": {"mode": "append-only-hash-chain", "collision_policy": "exclusive-create"},
        "compensation": {
            "mode": "none",
            "rationale": "Run-local structural probe only; the deliberately invalid approval ref must stop before state creation.",
        },
    }
    controller_config_path = VALIDATION / "controller-probe-chain-config.json"
    write_json(controller_config_path, controller_config)
    chain_schema = load_json(ROOT / ".agents/skills/task-session-until-blocker/schemas/chain-config.schema.json")
    schema_errors = [error.message for error in Draft202012Validator(chain_schema).iter_errors(controller_config)]
    write_json(
        VALIDATION / "controller-probe-config-validation.json",
        {"schema_version": "domainspec-v2.controller-probe-config-validation/v1", "status": "pass" if not schema_errors else "fail", "errors": schema_errors, "authority_effect": "none"},
    )
    if schema_errors:
        raise SystemExit("LIVE_VALIDATION_BLOCK: controller probe config schema invalid")
    command_ledger.append(
        run_command(
            "attempt-2-live-controller-structural-probe",
            [
                "python3",
                ".agents/skills/task-session-until-blocker/scripts/run_chain.py",
                "--config",
                str(controller_config_path.relative_to(ROOT)),
            ],
            {2},
        )
    )
    controller_stdout = (VALIDATION / "command-output/attempt-2-live-controller-structural-probe.stdout.txt").read_text(encoding="utf-8")
    try:
        controller_observed = json.loads(controller_stdout)
    except json.JSONDecodeError:
        controller_observed = {"status": "invalid-json", "terminal_code": None, "raw": controller_stdout}
    controller_status = (
        "pass"
        if controller_observed.get("terminal_code") == "EPOCH_APPROVAL_INVALID"
        and "MANIFEST_SHAPE_INVALID" not in controller_stdout
        and not (VALIDATION / "controller-probe-state").exists()
        else "fail"
    )

    command_failures = [item["command_id"] for item in command_ledger if item["status"] != "pass"]
    structural_status = "pass" if not (
        target_set != live_files
        or symlinks
        or byte_failures
        or json_failures
        or markdown_failures
        or preservation_failures
        or command_failures
        or controller_status != "pass"
    ) else "fail"
    overall_status = "fail" if stale_lifecycle else structural_status

    write_json(
        VALIDATION / "CHANGED-BYTE-INVENTORY.json",
        {
            "schema_version": "domainspec-v2.changed-byte-inventory/v1",
            "status": "pass" if not byte_failures and target_set == live_files else "fail",
            "target_count": len(changed_inventory),
            "entries": changed_inventory,
            "authority_effect": "none",
        },
    )
    write_json(
        VALIDATION / "SOURCE-PRESERVATION.json",
        {
            "schema_version": "domainspec-v2.source-preservation/v1",
            "status": "pass" if not preservation_failures else "fail",
            "entries": preservation_results,
            "forbidden_surface_failures": preservation_failures,
            "authority_effect": "none",
        },
    )
    write_json(
        VALIDATION / "TARGET-LIFECYCLE-WORDING.json",
        {
            "schema_version": "domainspec-v2.target-lifecycle-wording-validation/v1",
            "status": "fail" if stale_lifecycle else "pass",
            "canonical_candidate": "dsv2-tde-multiformalism-profile-epoch@3",
            "finding_count": len(stale_lifecycle),
            "findings": stale_lifecycle,
            "classification": "governance-only stale successor acceptance wording",
            "repair_rule": "Changed acceptance-bound bytes require a fresh candidate, regenerated digests, closure evidence, independent review, and renewed owner acceptance; do not edit applied bytes in place.",
            "authority_effect": "none",
        },
    )
    write_json(
        VALIDATION / "CONTROLLER-COMPATIBILITY-VALIDATION.json",
        {
            "schema_version": "domainspec-v2.tde-chain-controller-compatibility-validation/v1",
            "status": controller_status,
            "observed": controller_observed,
            "former_gate_cleared": "MANIFEST_SHAPE_INVALID" not in controller_stdout,
            "expected_lifecycle_stop": "EPOCH_APPROVAL_INVALID",
            "state_directory_created": (VALIDATION / "controller-probe-state").exists(),
            "task_sessions_started": 0,
            "product_mutations": 0,
            "authority_effect": "none",
        },
    )
    write_json(
        VALIDATION / "COMMAND-EXITS.json",
        {
            "schema_version": "domainspec-v2.command-exit-ledger/v1",
            "status": "pass" if not command_failures else "fail",
            "rule": "Every exit remains independent; later passes do not mask earlier failures.",
            "commands": command_ledger,
            "earlier_inventory_cli_failure_preserved": True,
            "authority_effect": "none",
        },
    )
    write_json(
        VALIDATION / "VALIDATION-LEDGER.json",
        {
            "schema_version": "domainspec-v2.invoke-refresh-live-validation-ledger/v1",
            "status": overall_status,
            "structural_status": structural_status,
            "acceptance_critical_lifecycle_wording_status": "fail" if stale_lifecycle else "pass",
            "checks": {
                "exact_live_set": "pass" if target_set == live_files else "fail",
                "exact_byte_equality": "pass" if not byte_failures else "fail",
                "symlinks": "pass" if not symlinks else "fail",
                "json_parse": "pass" if not json_failures else "fail",
                "markdown_whitespace_eof": "pass" if not markdown_failures else "fail",
                "source_preservation": "pass" if not preservation_failures else "fail",
                "commands": "pass" if not command_failures else "fail",
                "controller": controller_status,
                "target_lifecycle_wording": "fail" if stale_lifecycle else "pass",
            },
            "json_failures": json_failures,
            "markdown_failures": markdown_failures,
            "symlinks": symlinks,
            "byte_failures": byte_failures,
            "preservation_failures": preservation_failures,
            "command_failures": command_failures,
            "authority_effect": "none",
        },
    )
    print(
        json.dumps(
            {
                "status": overall_status,
                "structural_status": structural_status,
                "stale_lifecycle_findings": len(stale_lifecycle),
                "controller_terminal_code": controller_observed.get("terminal_code"),
            },
            sort_keys=True,
        )
    )
    raise SystemExit(0 if overall_status == "pass" else 1)


if __name__ == "__main__":
    main()
