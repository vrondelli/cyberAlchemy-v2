#!/usr/bin/env python3
"""Write once or verify the terminal proposal receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[7]
PACKAGE = Path(__file__).resolve().parents[1]
RECEIPT = PACKAGE / "PROPOSAL-RECEIPT.json"
PLAN_REL = Path(
    "projects/domainspec-v2/development/refinement-runs/"
    "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
)
LIVE_PLAN = REPO / PLAN_REL
PROPOSAL_ID = "wp-rmt-002-task-session-transient-output-api-proposal-20260816T160301Z"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256(data),
        "size_bytes": len(data),
    }


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def inventory() -> dict[str, Any]:
    materials: list[dict[str, Any]] = []
    rows: list[str] = []
    total = 0
    for path in sorted(
        PACKAGE.rglob("*"),
        key=lambda item: item.relative_to(PACKAGE).as_posix().encode("utf-8"),
    ):
        if path == RECEIPT or path.is_dir():
            continue
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"non-regular package artifact: {path}")
        if path.suffix == ".pyc" or "__pycache__" in path.parts:
            raise ValueError(f"generated Python cache residue: {path}")
        data = path.read_bytes()
        relative = path.relative_to(PACKAGE).as_posix()
        item = {"path": relative, "sha256": sha256(data), "size_bytes": len(data)}
        materials.append(item)
        rows.append(f"{item['sha256']}\t{item['size_bytes']}\t{relative}\n")
        total += len(data)
    return {
        "algorithm": "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>relative_path<LF> rows",
        "file_count": len(materials),
        "total_size_bytes": total,
        "sha256": sha256("".join(rows).encode("utf-8")),
        "materials": materials,
    }


def build_receipt() -> dict[str, Any]:
    apply_proposal = load(PACKAGE / "APPLY-PROPOSAL.json")
    validation = load(PACKAGE / "VALIDATION-RESULT.json")
    audit = load(PACKAGE / "official-audit/work-pack-readiness-report-v2.json")
    semantic_manifest = load(PACKAGE / "official-audit/plan-semantic-manifest.json")
    handoff = load(PACKAGE / "official-audit/selection-handoff.json")
    source_intent = load(PACKAGE / "SOURCE-INTENT.json")
    refresh_contract = load(PACKAGE / "refresh-report.json")
    if (
        validation.get("result") != "pass"
        or audit.get("verdict") != "pass"
        or audit.get("selected_unit") is not None
        or audit.get("mutation_ready") is not False
        or source_intent.get("owner_acceptance", {}).get("status") != "absent"
        or refresh_contract.get("result") != "pass"
        or refresh_contract.get("mutation_ready") is not False
        or refresh_contract.get("handoff_status") != "gated"
    ):
        raise ValueError("proposal is not eligible for a non-applicable terminal receipt")
    live_rehash = []
    for change in apply_proposal["changes"]:
        live = REPO / change["target"]
        preimage = REPO / change["preimage"]["path"]
        if live.read_bytes() != preimage.read_bytes():
            raise ValueError(f"live preimage drift before freeze: {change['target']}")
        live_rehash.append(exact_ref(live))
    preserved = {
        "WORK-PACK.md": "e96b5d414279fdd7ad1689bcac70e9292adbbae588a8705e1bb73b2174f7ef37",
        "EXECUTION-PACK.md": "b099f325092d65c3230fb2bdc6e524b8275bf118a9aa7113e0faab76f7d53577",
        "PLAN-RECEIPT.json": "d4a2fe31e1c39557f0c7012f760f67ae695634f6ddaf3757c426576e78794e40",
        "DISTILL-PLAN-VALIDATION.md": "bde8d52c52818ecf576769fd3f5bc4446ea1470c05f1b6fa1df8dd5179b245ee",
    }
    preservation_refs = []
    for name, expected in preserved.items():
        ref = exact_ref(LIVE_PLAN / name)
        if ref["sha256"] != expected:
            raise ValueError(f"preserved artifact drift: {name}")
        preservation_refs.append(ref)
    return {
        "schema_version": "domainspec.invoke-refresh-proposal-receipt/v1",
        "receipt_id": PROPOSAL_ID,
        "result": "pass",
        "status": "proposal-validated-non-applicable",
        "route": ["decision-gate", "invoke:refresh"],
        "mode": "proposal-only",
        "selected_option": "A",
        "decision": apply_proposal["decision"],
        "work_pack_id": "WP-RMT-002",
        "target_count": len(apply_proposal["changes"]),
        "target_changes": apply_proposal["changes"],
        "source_inventory": refresh_contract["source_inventory"],
        "source_evidence": refresh_contract["source_evidence"],
        "target_inventory": refresh_contract["target_inventory"],
        "live_preimage_rehash_at_freeze": live_rehash,
        "preserved_plan_artifacts": preservation_refs,
        "validation": {
            "package_validation_ref": exact_ref(PACKAGE / "VALIDATION-RESULT.json"),
            "task_session_candidate_validation_ref": exact_ref(
                PACKAGE / "TASK-SESSION-CANDIDATE-VALIDATION.json"
            ),
            "regression_matrix_ref": exact_ref(PACKAGE / "REGRESSION-MATRIX.json"),
            "staged_plan_validation_ref": exact_ref(
                PACKAGE / "staged" / PLAN_REL / "VALIDATION-RESULT.json"
            ),
            "staged_entry_validation_ref": exact_ref(
                PACKAGE / "staged" / PLAN_REL / "EXECUTION-ENTRY-VALIDATION.json"
            ),
            "dispatch_validation_ref": exact_ref(PACKAGE / "DISPATCH-VALIDATION.json"),
            "refresh_report_ref": exact_ref(PACKAGE / "refresh-report.json"),
            "canonical_entry_producer": {
                "script_ref": exact_ref(
                    REPO
                    / ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py"
                ),
                "schema_ref": exact_ref(
                    REPO
                    / ".agents/skills/implementation-readiness/schemas/work-pack-execution-entry.schema.json"
                ),
                "output_sha256": "af48420708ab62f853a28fff0806b7f95a514ad9ecf87fa15b3f103f052b1fec",
                "output_size_bytes": 267,
            },
            "official_audit_report_ref": exact_ref(
                PACKAGE / "official-audit/work-pack-readiness-report-v2.json"
            ),
            "official_semantic_manifest_ref": exact_ref(
                PACKAGE / "official-audit/plan-semantic-manifest.json"
            ),
            "official_selection_handoff_ref": exact_ref(
                PACKAGE / "official-audit/selection-handoff.json"
            ),
            "official_audit": {
                "terminal_code": audit["terminal_code"],
                "finding_count": len(audit["blockers"]) + len(audit["flags"]),
                "source_snapshot_digest": audit["source_snapshot"]["digest"],
                "source_snapshot_drift": audit["source_snapshot"]["drift"],
                "canonical_semantic_digest": audit["canonical_semantic_digest"],
                "plan_epoch_id": semantic_manifest["plan_epoch_id"],
                "finite_outer_loop_units": len(semantic_manifest["ready_frontier"]),
                "selected_unit": audit["selected_unit"],
                "mutation_ready": audit["mutation_ready"],
            },
            "counts": {
                "decision_gate_options": "3/3",
                "sealed_regression_matrix": "15/15",
                "audit_added_governance_path_regressions": "9/9",
                "canonical_public_task_session_targets": "11/11",
                "generated_codex_parity": "8/8",
                "generated_claude_parity": "8/8",
                "plan_once_governance_tests": "32/32",
                "plan_once_admission_tests": "13/13",
                "governance_runner_positive": "20/20",
                "governance_runner_negative": "26/26",
                "units": "70/70",
                "dependency_edges": "74/74",
                "primary_commands": "70/70",
                "structured_validation_commands": "112/112",
                "exact_executable_bindings": "182/182",
                "bounded_write_cargo_commands": "7/7",
                "cargo_transient_execution_outputs": "7/7",
                "terminal_receipt_schemas": "70/70",
                "task_session_execution_context_bindings": "70/70",
                "single_use_attempt_ledgers": "70/70",
                "canonical_successors": "70/70",
                "write_partitions": "70/70",
                "positive_terminal_receipt_topologies": "4/4",
                "terminal_receipt_hostiles": "42/42",
                "hostile_fixtures": "69/69",
            },
            "deterministic_replay": "pass",
        },
        "projection_boundary": {
            "invoke_authoring_frontier": ["RMT-OP-001"],
            "invoke_allowed_route_count": 1,
            "official_finite_outer_loop_units": 70,
            "interpretation": (
                "The producer's 70-row ready_frontier is a finite manifest-order sequence, "
                "not a dependency-filtered task-ready claim; current authoring remains OP001-only."
            ),
            "selected_unit": None,
            "selection_receipt_created": False,
            "task_session_admission_created": False,
            "mutation_ready": False,
        },
        "sequence_policy": {
            "basis": "manifest-array-order",
            "canonical_successor_count": 70,
            "last_successor": "__terminal__",
            "wave_peer_semantics": (
                "deliberately serialized for deterministic continuation without changing depends_on"
            ),
        },
        "repair_ledger_ref": exact_ref(PACKAGE / "REPAIR-LEDGER.json"),
        "apply_state": {
            "owner_acceptance": "absent",
            "apply_authorization": "absent",
            "applicable": False,
            "live_targets_mutated": False,
            "selection_receipt_created": False,
            "task_session_admission_created": False,
            "swu_executed": False,
        },
        "claim_ceiling": (
            "validated proposal bytes only; no owner acceptance, live apply, selection, Task Session "
            "admission, implementation, ontology/candidate migration, PromotionRecords, promotion, "
            "publication, release, deployment, production readiness, Git, network, or external effect; "
            "runtime version and SHA remain Task Session-owned observations, not independently rehashed here"
        ),
        "next_owner": "exact-byte-owner:accept-proposal-bytes",
        "pre_receipt_inventory": inventory(),
        "terminal_receipt_written_last": True,
        "authority_effect": "none",
    }


def write_receipt() -> None:
    if RECEIPT.exists():
        raise SystemExit("refusing to overwrite terminal proposal receipt")
    payload = json.dumps(build_receipt(), indent=2, ensure_ascii=False) + "\n"
    descriptor = os.open(RECEIPT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    try:
        os.write(descriptor, payload.encode("utf-8"))
    finally:
        os.close(descriptor)


def verify_receipt() -> None:
    receipt = load(RECEIPT)
    current_inventory = inventory()
    if receipt.get("pre_receipt_inventory") != current_inventory:
        raise SystemExit("terminal receipt inventory mismatch")
    if (
        receipt.get("result") != "pass"
        or receipt.get("status") != "proposal-validated-non-applicable"
        or receipt.get("terminal_receipt_written_last") is not True
        or receipt.get("authority_effect") != "none"
        or receipt.get("apply_state", {}).get("applicable") is not False
    ):
        raise SystemExit("terminal receipt semantics invalid")
    newest_pre_receipt_mtime = max(
        (PACKAGE / item["path"]).stat().st_mtime_ns
        for item in current_inventory["materials"]
    )
    if RECEIPT.stat().st_mtime_ns <= newest_pre_receipt_mtime:
        raise SystemExit("terminal receipt was not written last")
    print(
        json.dumps(
            {
                "result": "pass",
                "receipt": exact_ref(RECEIPT),
                "inventory": {
                    key: current_inventory[key]
                    for key in ("file_count", "total_size_bytes", "sha256")
                },
                "next_owner": receipt["next_owner"],
                "authority_effect": receipt["authority_effect"],
            },
            indent=2,
            sort_keys=True,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("preview", "write", "verify"))
    args = parser.parse_args()
    if args.mode == "preview":
        print(json.dumps(build_receipt(), indent=2, sort_keys=True))
    elif args.mode == "write":
        write_receipt()
    else:
        verify_receipt()


if __name__ == "__main__":
    main()
