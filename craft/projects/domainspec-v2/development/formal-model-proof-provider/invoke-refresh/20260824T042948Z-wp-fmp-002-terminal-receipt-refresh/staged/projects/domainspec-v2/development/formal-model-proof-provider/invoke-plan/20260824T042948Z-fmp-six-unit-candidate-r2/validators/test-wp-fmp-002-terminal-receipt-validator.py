#!/usr/bin/env python3
"""Exercise the WP-FMP-002 terminal validator against positive and adversarial fixtures."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


SWU_ID = "SWU-FMP2-001"
TASK_ID = "TASK-FMP2-001-SEMANTIC-KERNEL"
SUCCESSOR = "SWU-FMP2-002"
PHASES = [
    "resolved",
    "governed",
    "admitted",
    "ticketed",
    "execution-received",
    "reconciled",
    "closeout-joined",
    "observed",
]


def write_json(root: Path, rel: str, value: Any) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def exact_ref(root: Path, rel: str) -> dict[str, Any]:
    data = (root / rel).read_bytes()
    return {"path": rel, "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)}


def canonical_sha256(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def copy_file(source: Path, root: Path, rel: str) -> None:
    target = root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)


def build_case(
    root: Path,
    repository_root: Path,
    candidate_root: Path,
    mutation: str | None,
) -> tuple[list[str], str]:
    terminal_schema_rel = "runtime/governance-terminal-receipt.schema.json"
    precloseout_schema_rel = "runtime/precloseout-execution-receipt.schema.json"
    validation_schema_rel = "runtime/governance-evaluation-receipt.schema.json"
    owner_schema_rel = "candidate/schemas/invoke-refresh-owner-receipt.schema.json"
    validator_rel = "candidate/validators/validate-wp-fmp-002-terminal-receipt.py"
    bindings_rel = "candidate/RECEIPT-BINDINGS.json"
    manifest_rel = "candidate/SWU-MANIFEST.json"
    swu_contracts_rel = "candidate/SWU-CONTRACTS.json"
    closeout_contracts_rel = "candidate/CLOSEOUT-CONTRACTS.json"
    terminal_rel = f"runs/receipts/{SWU_ID}.task-session.json"
    precloseout_rel = f"runs/precloseout/{SWU_ID}.task-session.precloseout.json"
    owner_rel = f"runs/closeouts/{SWU_ID}.invoke-refresh.json"

    copy_file(
        repository_root / ".agents/skills/task-session/schemas/governance-terminal-receipt.schema.json",
        root,
        terminal_schema_rel,
    )
    copy_file(
        repository_root / ".agents/skills/task-session/schemas/precloseout-execution-receipt.schema.json",
        root,
        precloseout_schema_rel,
    )
    copy_file(
        repository_root / ".agents/skills/task-session/schemas/governance-evaluation-receipt.schema.json",
        root,
        validation_schema_rel,
    )
    copy_file(candidate_root / "schemas/invoke-refresh-owner-receipt.schema.json", root, owner_schema_rel)
    copy_file(candidate_root / "validators/validate-wp-fmp-002-terminal-receipt.py", root, validator_rel)

    validation_commands = ["fixture-validation-command"]
    manifest = {
        "schema_version": "formal-model-provider-swu-manifest/v2",
        "work_pack_id": "WP-FMP-002",
        "status": "candidate-owner-prerequisite",
        "units": [
            {
                "ordinal": 1,
                "swu_id": SWU_ID,
                "task": f"tasks/{TASK_ID}.md",
                "layer": "L0",
                "dependencies": [],
                "successor": SUCCESSOR,
            }
        ],
        "authority_effect": "none",
    }
    swu_contracts = {
        "schema_version": "formal-model-provider-swu-contracts/v2",
        "work_pack_id": "WP-FMP-002",
        "contracts": [
            {
                "swu_id": SWU_ID,
                "parent_task": f"tasks/{TASK_ID}.md",
                "dependencies": [],
                "product_targets": ["product/example.ts"],
                "validation_commands": validation_commands,
                "expected_receipt": terminal_rel,
                "successor": SUCCESSOR,
            }
        ],
        "authority_effect": "none",
    }
    closeout_contracts = {
        "schema_version": "formal-model-provider-closeout-contracts/v3",
        "work_pack_id": "WP-FMP-002",
        "contracts": [
            {
                "swu_id": SWU_ID,
                "precloseout_execution_receipt": precloseout_rel,
                "execution_receipt": terminal_rel,
                "owner_receipt": owner_rel,
                "successor": SUCCESSOR,
            }
        ],
        "authority_effect": "none",
    }
    write_json(root, manifest_rel, manifest)
    write_json(root, swu_contracts_rel, swu_contracts)
    write_json(root, closeout_contracts_rel, closeout_contracts)

    bindings = {
        "schema_version": "fmp.receipt-bindings.v1",
        "work_pack_id": "WP-FMP-002",
        "receipt_profile": "precloseout-execution-v1",
        "terminal_schema_ref": exact_ref(root, terminal_schema_rel),
        "precloseout_schema_ref": exact_ref(root, precloseout_schema_rel),
        "validation_receipt_schema_ref": exact_ref(root, validation_schema_rel),
        "owner_receipt_schema_ref": exact_ref(root, owner_schema_rel),
        "semantic_validator_ref": exact_ref(root, validator_rel),
        "authority_effect": "none",
    }
    write_json(root, bindings_rel, bindings)

    plain_files = {
        "evidence/request.json": {"kind": "request"},
        "evidence/ticket.json": {"kind": "ticket"},
        "evidence/executor.json": {"kind": "executor"},
        "evidence/admission.json": {"kind": "admission"},
        "evidence/ledger.json": {"kind": "ledger"},
        "evidence/material-commit.json": {"kind": "material-commit"},
        "evidence/reconciliation.json": {"kind": "reconciliation"},
        "evidence/target-inventory.json": {"targets": ["product/example.ts"]},
        "evidence/target-result-inventory.json": {"targets": ["product/example.ts"]},
        "evidence/observation.json": {"kind": "observation"},
        "evidence/cursor.json": {
            "work_pack_id": "WP-FMP-002",
            "current_swu": SWU_ID,
            "successor": SUCCESSOR,
        },
    }
    for phase in PHASES:
        plain_files[f"evidence/phases/{phase}.json"] = {"phase": phase}
    for rel, value in plain_files.items():
        write_json(root, rel, value)

    validation_digest = canonical_sha256(validation_commands)
    validation_receipt = {
        "schema_version": "task-session.governance-evaluation-receipt.v1",
        "request_id": "fixture-validation",
        "evaluation_kind": "validation",
        "policy_ref": exact_ref(root, swu_contracts_rel),
        "input_sha256": validation_digest,
        "outcome": "PASS",
        "allowed_outcomes": ["BLOCK", "FLAG", "PASS"],
        "evaluator_sha256": "1" * 64,
        "diagnostics": [],
    }
    if mutation == "validation_block":
        validation_receipt["outcome"] = "BLOCK"
        validation_receipt["diagnostics"] = ["fixture blocker"]
    write_json(root, "evidence/validation.json", validation_receipt)

    precloseout = {
        "schema_version": "task-session.precloseout-execution-receipt.v1",
        "receipt_id": "fixture-precloseout",
        "run_id": "fixture-run",
        "task_id": TASK_ID,
        "swu_id": SWU_ID,
        "request_ref": exact_ref(root, "evidence/request.json"),
        "ticket_ref": exact_ref(root, "evidence/ticket.json"),
        "executor_receipt_ref": exact_ref(root, "evidence/executor.json"),
        "consumed_admission": {
            "receipt_ref": exact_ref(root, "evidence/admission.json"),
            "admission_token": "2" * 64,
            "attempt_id": "attempt-001",
            "consumption_ledger_ref": exact_ref(root, "evidence/ledger.json"),
        },
        "material_commit_ref": exact_ref(root, "evidence/material-commit.json"),
        "reconciliation_ref": exact_ref(root, "evidence/reconciliation.json"),
        "validation_receipt_ref": exact_ref(root, "evidence/validation.json"),
        "validation_contract_digest": validation_digest,
        "target_inventory_ref": exact_ref(root, "evidence/target-inventory.json"),
        "target_result_inventory_ref": exact_ref(root, "evidence/target-result-inventory.json"),
        "output_refs": [exact_ref(root, "evidence/target-result-inventory.json")],
        "closeout_contract": {
            "route": "invoke:refresh:apply-approved",
            "owner_capability": "invoke",
            "source_receipt_path": precloseout_rel,
            "source_schema_ref": bindings["precloseout_schema_ref"],
            "target_inventory_ref": exact_ref(root, "evidence/target-inventory.json"),
            "expected_owner_receipt_path": owner_rel,
            "expected_owner_receipt_schema_ref": bindings["owner_receipt_schema_ref"],
            "final_terminal_receipt_path": terminal_rel,
            "final_terminal_schema_ref": bindings["terminal_schema_ref"],
            "allowed_delta_classes": ["evidence_added", "status_changed", "route_changed"],
            "continuation_policy": "emit-cursor-never-execute-successor",
        },
        "claim_state": "execution-validated-closeout-pending",
        "owner_identity": {"capability": "task-session", "subject": "fixture"},
        "idempotency_key": "fixture-precloseout-001",
        "result": "pass",
        "residue": [],
    }
    if mutation == "validation_contract_drift":
        precloseout["validation_contract_digest"] = "9" * 64
    write_json(root, precloseout_rel, precloseout)
    precloseout_ref = exact_ref(root, precloseout_rel)

    owner_receipt = {
        "schema_version": "fmp.invoke-refresh-owner-receipt.v1",
        "work_pack_id": "WP-FMP-002",
        "swu_id": SWU_ID,
        "execution_receipt_sha256": precloseout_ref["sha256"],
        "postimage_inventory_sha256": precloseout["target_result_inventory_ref"]["sha256"],
        "successor": SUCCESSOR,
        "result": "pass",
        "lifecycle_owner_validation": {
            "status": "pass",
            "validated_delta_classes": ["evidence_added", "status_changed", "route_changed"],
        },
        "blockers": [],
        "authority_effect": "none",
    }
    if mutation == "wrong_work_pack":
        owner_receipt["work_pack_id"] = "WP-FMP-999"
    elif mutation == "owner_blocker":
        owner_receipt["blockers"] = ["fixture blocker"]
    elif mutation == "wrong_successor":
        owner_receipt["successor"] = "SWU-FMP2-003"
    write_json(root, owner_rel, owner_receipt)

    terminal = {
        "schema_version": "task-session.governance-terminal-receipt.v1",
        "receipt_id": "fixture-terminal",
        "run_id": "fixture-run",
        "task_id": TASK_ID,
        "swu_id": SWU_ID,
        "request_ref": exact_ref(root, "evidence/request.json"),
        "ticket_ref": exact_ref(root, "evidence/ticket.json"),
        "predecessor_ref": {
            "phase": "observed",
            "receipt_ref": exact_ref(root, "evidence/observation.json"),
        },
        "phase_receipts": [
            {"phase": phase, "receipt_ref": exact_ref(root, f"evidence/phases/{phase}.json")}
            for phase in PHASES
        ],
        "executor_receipt_ref": exact_ref(root, "evidence/executor.json"),
        "closeout_join": {
            "required_owner_capabilities": ["invoke"],
            "joined_owner_receipts": [
                {
                    "owner_capability": "invoke",
                    "receipt_ref": exact_ref(root, owner_rel),
                    "result": "pass",
                }
            ],
            "continuation": {
                "policy": "emit-cursor-never-execute-successor",
                "cursor_ref": exact_ref(root, "evidence/cursor.json"),
                "successor_executed": False,
            },
        },
        "observation_ref": exact_ref(root, "evidence/observation.json"),
        "owner_identity": {"capability": "task-session", "subject": "fixture"},
        "idempotency_key": "fixture-terminal-001",
        "result": "pass",
        "output_refs": [exact_ref(root, "evidence/target-result-inventory.json")],
        "residue": [],
        "receipt_profile": "precloseout-execution-v1",
        "precloseout_execution_receipt_ref": precloseout_ref,
        "precloseout_execution_schema_ref": bindings["precloseout_schema_ref"],
    }
    if mutation == "terminal_extra_field":
        terminal["unowned"] = True
    elif mutation == "malformed_hash":
        terminal["request_ref"]["sha256"] = "ABC"
    elif mutation == "wrong_swu":
        terminal["swu_id"] = "SWU-FMP2-999"
    elif mutation == "wrong_task":
        terminal["task_id"] = "TASK-FMP2-WRONG"
    elif mutation == "duplicate_phase":
        terminal["phase_receipts"][1]["phase"] = "resolved"
    elif mutation == "empty_output_refs":
        terminal["output_refs"] = []
    elif mutation == "pass_with_residue":
        terminal["residue"] = ["unexpected residue"]
    elif mutation == "tampered_ref":
        terminal["request_ref"]["sha256"] = "0" * 64
    write_json(root, terminal_rel, terminal)

    command = [
        "python3",
        validator_rel,
        "--repository-root",
        ".",
        "--terminal-receipt",
        terminal_rel,
        "--receipt-bindings",
        bindings_rel,
        "--swu-manifest",
        manifest_rel,
        "--swu-contracts",
        swu_contracts_rel,
        "--closeout-contracts",
        closeout_contracts_rel,
    ]
    return command, terminal_rel


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", default=".")
    parser.add_argument("--candidate-root", required=True)
    args = parser.parse_args()
    repository_root = Path(args.repository_root).resolve()
    candidate_root = Path(args.candidate_root).resolve()
    fixtures = json.loads((candidate_root / "fixtures/terminal-receipt-fixtures.json").read_text())
    results: list[dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="wp-fmp-002-terminal-validator-") as temp:
        root = Path(temp) / "positive"
        command, _ = build_case(root, repository_root, candidate_root, None)
        completed = subprocess.run(command, cwd=root, text=True, capture_output=True, check=False)
        if completed.returncode != 0:
            raise SystemExit(f"positive fixture failed: {completed.stderr}{completed.stdout}")
        results.append({"id": fixtures["positive_case"]["id"], "status": "pass", "exit_code": 0})

        for case in fixtures["negative_cases"]:
            case_root = Path(temp) / case["id"]
            command, _ = build_case(case_root, repository_root, candidate_root, case["mutation"])
            completed = subprocess.run(command, cwd=case_root, text=True, capture_output=True, check=False)
            observed = completed.stderr + completed.stdout
            if completed.returncode == 0:
                raise SystemExit(f"negative fixture unexpectedly passed: {case['id']}")
            if case["expected_error"] not in observed:
                raise SystemExit(
                    f"negative fixture {case['id']} returned wrong diagnostic; "
                    f"expected {case['expected_error']!r}, observed {observed!r}"
                )
            results.append(
                {"id": case["id"], "status": "rejected-as-expected", "exit_code": completed.returncode}
            )

    report = {
        "schema_version": "fmp.terminal-receipt-validator-fixture-result.v1",
        "status": "pass",
        "positive_count": 1,
        "negative_count": len(fixtures["negative_cases"]),
        "results": results,
        "authority_effect": "none",
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
