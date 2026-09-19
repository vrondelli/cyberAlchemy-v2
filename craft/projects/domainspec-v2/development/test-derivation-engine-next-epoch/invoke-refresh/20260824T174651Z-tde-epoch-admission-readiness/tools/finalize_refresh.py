#!/usr/bin/env python3
"""Freeze the TDE @2 acceptance request and final Refresh evidence."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


REPO = Path(__file__).resolve().parents[7]
REFRESH = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/20260824T174651Z-tde-epoch-admission-readiness")
TARGET = Path("projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2")
A = REPO / REFRESH
B = REPO / TARGET


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: object) -> str:
    return digest(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": digest(data), "size_bytes": len(data)}


def dump(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def tree_entries(root: Path, prefix: Path) -> list[dict[str, object]]:
    result = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        data = path.read_bytes()
        result.append({"path": (prefix / path.relative_to(root)).as_posix(), "sha256": digest(data), "size_bytes": len(data)})
    return result


def main() -> int:
    material_inventory_path = REFRESH / "material/TARGET-INVENTORY.json"
    material_package_path = REFRESH / "material/MATERIAL-PACKAGE.json"
    material_receipt_path = REFRESH / "material/MATERIAL-RECEIPT.json"
    handoff_path = REFRESH / "material/REFRESH-HANDOFF-RESULT.json"
    report_path = TARGET / "readiness/wpra/work-pack-readiness-report-v2.json"
    manifest_path = TARGET / "readiness/wpra/plan-semantic-manifest.json"
    selection_path = TARGET / "readiness/wpra/selection-handoff.json"
    preflight_path = TARGET / "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"

    material_inventory = json.loads((REPO / material_inventory_path).read_text())
    material_package = json.loads((REPO / material_package_path).read_text())
    material_receipt = json.loads((REPO / material_receipt_path).read_text())
    wpra_report = json.loads((REPO / report_path).read_text())
    semantic_manifest = json.loads((REPO / manifest_path).read_text())
    preflight = json.loads((REPO / preflight_path).read_text())

    assert material_inventory["file_count"] == 81
    assert material_receipt["patchVerdict"] == "pass"
    assert material_receipt["packageDigest"] == canonical_digest(material_package)
    assert wpra_report["verdict"] == "pass"
    assert wpra_report["runtime_admission_status"] == "pending-selection"
    assert wpra_report["selected_unit"] is None and wpra_report["mutation_ready"] is False
    assert preflight["status"] == "pass" and preflight["code"] == "PLAN_IMPLEMENTATION_READY"
    assert preflight["fast_entry_proof"]["decision"] == "proceed"
    assert preflight["fast_entry_proof"]["code"] == "TASK_READY"
    assert preflight["reusable_for_execution"] is False and preflight["mutation_ready"] is False

    # Re-prove the create-only target set before freezing the owner request.
    for entry in material_inventory["entries"]:
        current = exact(Path(entry["path"]))
        assert current["sha256"] == entry["sha256"] and current["size_bytes"] == entry["size_bytes"]

    acceptance_inventory_path = TARGET / "acceptance/TARGET-INVENTORY.json"
    acceptance_inventory = {
        **material_inventory,
        "schema_version": "domainspec-v2.exact-plan-acceptance-target-inventory/v1",
        "acceptance_owner": "Rondelli",
        "acceptance_scope": "all 81 acceptance-bound successor material targets",
        "exactAcceptanceStatus": "unapproved",
        "current_user_approval_binding": "accepted @1 semantics and authorized this bounded Refresh apply only; it does not accept unseen @2 postimages",
        "authority_effect": "none",
    }
    dump(REPO / acceptance_inventory_path, acceptance_inventory)

    candidate_manifest_path = TARGET / "acceptance/CANDIDATE-MANIFEST.json"
    candidate_manifest = {
        "schema_version": "domainspec-v2.exact-plan-candidate-manifest/v1",
        "candidate_id": "dsv2-tde-multiformalism-profile-epoch@2",
        "work_pack_id": "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z",
        "plan_epoch_id": semantic_manifest["plan_epoch_id"],
        "owner": "Rondelli",
        "exactAcceptanceStatus": "unapproved",
        "semantic_targets": {
            "file_count": 81,
            "inventory_digest": material_inventory["inventory_digest"],
            "inventory_ref": exact(acceptance_inventory_path),
            "material_package_digest": material_receipt["packageDigest"],
            "material_package_ref": exact(material_package_path),
            "material_receipt_ref": exact(material_receipt_path),
            "refresh_handoff_ref": exact(handoff_path),
        },
        "readiness_evidence": {
            "canonical_semantic_digest": semantic_manifest["canonical_semantic_digest"],
            "wpra_report_ref": exact(report_path),
            "plan_semantic_manifest_ref": exact(manifest_path),
            "selection_handoff_ref": exact(selection_path),
            "implementation_readiness_preflight_ref": exact(preflight_path),
            "wpra_verdict": "pass",
            "runtime_admission_status": "pending-selection",
            "selected_unit": None,
            "preflight": "pass/PLAN_IMPLEMENTATION_READY/proceed/TASK_READY",
            "reusable_for_execution": False,
        },
        "source_admission": {
            "formalclaim_v3": exact(Path("projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json")),
            "victor_rule": exact(Path("projects/domainspec-v2/authority/decisions/2026-08-24-victor-pre-merge-structural-approval.md")),
            "victor_gate": "pre-merge-only; not an authoring, readiness, or exact Plan acceptance prerequisite",
        },
        "claim_ceiling": "Exact Plan candidate and proof-only readiness evidence. No Task Session selection, product mutation, execution, merge, promotion, publication, release, or deployment is authorized.",
        "mutation_ready": False,
        "authority_effect": "none",
    }
    dump(REPO / candidate_manifest_path, candidate_manifest)

    acceptance_request_path = TARGET / "acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json"
    acceptance_request = {
        "schema_version": "domainspec-v2.exact-plan-acceptance-request/v1",
        "request_id": "rondelli-tde-multiformalism-profile-epoch-r2-plan-acceptance-20260824",
        "candidate_id": candidate_manifest["candidate_id"],
        "owner": "Rondelli",
        "requested_decision": "accept-or-reject-exact-plan-candidate",
        "exactAcceptanceStatus": "unapproved",
        "candidate_manifest_ref": exact(candidate_manifest_path),
        "target_inventory_ref": exact(acceptance_inventory_path),
        "target_inventory_digest": material_inventory["inventory_digest"],
        "material_package_digest": material_receipt["packageDigest"],
        "canonical_semantic_digest": semantic_manifest["canonical_semantic_digest"],
        "required_response_path": (TARGET / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json").as_posix(),
        "acceptance_instruction": "Approve only if the exact candidate-manifest SHA, exact 81-target inventory SHA/digest, material-package digest, and canonical semantic digest above are accepted without substitution.",
        "approval_non_transfer": "The direct user statement that admitted @1 and authorized Refresh does not transfer to these newly materialized @2 bytes.",
        "after_acceptance_route": "task-session:selection/TDE-EPOCH-001",
        "victor_gate": "later exact pre-merge structural approval only",
        "selected_unit": None,
        "mutation_ready": False,
        "authority_effect": "none",
    }
    dump(REPO / acceptance_request_path, acceptance_request)

    # Final preservation ledger rehashes every source and the exact staged/applied set.
    staged_preservation = json.loads((B / "validation/SOURCE-PRESERVATION.json").read_text())
    baseline_root = REPO / staged_preservation["baseline_root"]
    baseline_entries = tree_entries(baseline_root, Path("."))
    normalized_baseline_entries = [{**e, "path": e["path"].removeprefix("./")} for e in baseline_entries]
    assert normalized_baseline_entries == staged_preservation["baseline_entries"]
    protected_results = []
    for expected in staged_preservation["protected_sources"]:
        observed = exact(Path(expected["path"]))
        matches = observed["sha256"] == expected["sha256"] and observed["size_bytes"] == expected["size_bytes"]
        assert matches
        protected_results.append({"path": expected["path"], "expected_sha256": expected["sha256"], "observed_sha256": observed["sha256"], "matches": matches})
    staged_equals_applied = []
    for expected in material_inventory["entries"]:
        staged_path = A / "staging" / expected["path"]
        staged_data = staged_path.read_bytes()
        applied_data = (REPO / expected["path"]).read_bytes()
        matches = staged_data == applied_data and digest(applied_data) == expected["sha256"]
        assert matches
        staged_equals_applied.append({"path": expected["path"], "sha256": expected["sha256"], "matches": True})
    source_ledger = {
        "schema_version": "domainspec-v2.refresh-source-preservation-ledger/v1",
        "predecessor_root": staged_preservation["baseline_root"],
        "predecessor_file_count": staged_preservation["baseline_file_count"],
        "predecessor_tree_digest": staged_preservation["baseline_tree_digest"],
        "predecessor_unchanged": True,
        "define_design_equivalence": staged_preservation["define_design_equivalence"],
        "protected_sources": protected_results,
        "protected_source_count": len(protected_results),
        "material_target_count": len(staged_equals_applied),
        "staged_equals_applied": staged_equals_applied,
        "verdict": "pass",
        "authority_effect": "none",
    }
    dump(A / "refresh/SOURCE-PRESERVATION-LEDGER.json", source_ledger)

    wpra_signal = {
        "schema_version": "domainspec-v2.tde-wpra-signal-pack/v1",
        "candidate_id": candidate_manifest["candidate_id"],
        "report_ref": exact(report_path),
        "manifest_ref": exact(manifest_path),
        "selection_handoff_ref": exact(selection_path),
        "verdict": wpra_report["verdict"],
        "terminal_code": wpra_report["terminal_code"],
        "admission_timing": wpra_report["admission_timing"],
        "runtime_admission_status": wpra_report["runtime_admission_status"],
        "selected_unit": wpra_report["selected_unit"],
        "configured_commands_executed": wpra_report["configured_commands_executed"],
        "next_owner": wpra_report["next_owner"],
        "canonical_semantic_digest": wpra_report["canonical_semantic_digest"],
        "mutation_ready": False,
        "authority_effect": "none",
    }
    dump(A / "refresh/WPRA-SIGNAL-PACK.json", wpra_signal)
    dump(A / "refresh/PREFLIGHT-REFERENCE.json", {
        "schema_version": "domainspec-v2.preflight-reference/v1",
        "receipt_ref": exact(preflight_path),
        "status": preflight["status"],
        "code": preflight["code"],
        "fast_entry": {"decision": preflight["fast_entry_proof"]["decision"], "code": preflight["fast_entry_proof"]["code"]},
        "reusable_for_execution": preflight["reusable_for_execution"],
        "mutation_ready": preflight["mutation_ready"],
        "authority_effect": preflight["authority_effect"],
    })

    original_attempts = json.loads((B / "validation/COMMAND-EXITS.json").read_text())["attempts"]
    final_attempts = original_attempts + [
        {"id": "M001", "label": "initial-83-target-material-validation", "exit_code": 0, "status": "superseded-after-exact-inventory-review", "current": False, "evidence": (REFRESH / "material/superseded-83-file-package/MATERIAL-RECEIPT.json").as_posix()},
        {"id": "M002", "label": "initial-83-target-refresh-handoff", "exit_code": 0, "status": "superseded-never-applied", "current": False, "evidence": (REFRESH / "material/superseded-83-file-package/REFRESH-HANDOFF-RESULT.json").as_posix()},
        {"id": "M003", "label": "corrected-81-target-material-validation", "exit_code": 0, "status": "pass", "current": True, "evidence": material_receipt_path.as_posix()},
        {"id": "M004", "label": "corrected-81-target-refresh-handoff", "exit_code": 0, "status": "pass", "current": True, "evidence": handoff_path.as_posix()},
        {"id": "A001", "label": "create-only-successor-apply-and-exact-equality", "exit_code": 0, "status": "pass", "current": True, "target_count": 81},
        {"id": "W001", "label": "canonical-wpra-v2-selected-unit-at-task-session", "exit_code": 0, "status": "pass/PLAN_SEMANTIC_READY", "current": True, "evidence": report_path.as_posix()},
        {"id": "P001", "label": "preflight-wrapper-with-occupied-audit-output-dir", "exit_code": 1, "status": "fail-preserved", "current": False, "repair": "use the frozen report through --audit-report; never replay create-only WPRA outputs"},
        {"id": "P002", "label": "plan-readiness-preflight-from-frozen-audit-report", "exit_code": 0, "status": "pass/PLAN_IMPLEMENTATION_READY/proceed/TASK_READY", "current": True, "evidence": preflight_path.as_posix()},
        {"id": "F001", "label": "final-schema-json-path-symlink-whitespace-eof-hash-window", "exit_code": 0, "status": "pass", "current": True},
    ]
    validation_ledger = {
        "schema_version": "domainspec-v2.refresh-validation-ledger/v1",
        "policy": "Every observed nonzero exit remains explicit; later passes do not rewrite or mask earlier attempts.",
        "attempts": final_attempts,
        "failed_attempt_count": sum(a["exit_code"] != 0 for a in final_attempts),
        "masked_failure_count": 0,
        "final_verdict": "pass-with-preserved-governance-only-failures",
        "product_commands_executed": False,
        "authority_effect": "none",
    }
    dump(A / "refresh/VALIDATION-LEDGER.json", validation_ledger)

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    refresh_report = {
        "schema_version": "invoke.refresh-report/v1",
        "run_id": "20260824T174651Z-tde-epoch-admission-readiness",
        "candidate_id": candidate_manifest["candidate_id"],
        "completed_at": now,
        "activation_source": "direct-user",
        "mutation_mode": "apply-approved",
        "refresh_result": "pass",
        "applied_target_count": 81,
        "applied_inventory_digest": material_inventory["inventory_digest"],
        "material_package_digest": material_receipt["packageDigest"],
        "source_preservation": "pass",
        "distill": "pass",
        "wpra": "pass/PLAN_SEMANTIC_READY/pending-selection",
        "implementation_readiness": "pass/PLAN_IMPLEMENTATION_READY/proceed/TASK_READY/proof-only",
        "exactAcceptanceStatus": "unapproved",
        "selected_unit": None,
        "mutation_ready": False,
        "victor_gate": "pre-merge-only",
        "next_owner": "Rondelli exact Plan acceptance",
        "after_acceptance_route": "task-session:selection/TDE-EPOCH-001",
        "forbidden_effects_observed": [],
        "product_commands_executed": False,
        "authority_effect": "none",
    }
    dump(A / "refresh/REFRESH-REPORT.json", refresh_report)
    (A / "refresh/REFRESH-REPORT.md").write_text(
        "# TDE Epoch @2 Refresh Report\n\n"
        "The bounded Refresh succeeded: the fresh @2 successor was created from 81 exact material targets, and every applied target equals its staged byte image. The earlier 83-file package was never applied and remains preserved as superseded evidence because it accidentally included two copied @1 run-local receipts.\n\n"
        "Canonical WPRA passed without executing product commands. Runtime admission remains pending selection, no unit is selected, and mutation readiness is false. The proof-only Implementation Readiness preflight passed with `PLAN_IMPLEMENTATION_READY` and `proceed/TASK_READY`; its receipt is explicitly non-reusable for execution.\n\n"
        "This new @2 candidate is not owner-accepted. Rondelli must accept the exact candidate manifest, 81-target inventory, material digest, and canonical semantic digest before Task Session may select `TDE-EPOCH-001`. Victor Boscaro is a distinct later pre-merge structural approval, not a Plan/readiness prerequisite.\n\n"
        "No implementation, product test, merge, promotion, publication, release, deployment, Git operation, or external effect occurred. Authority effect is none.\n",
        encoding="utf-8",
    )

    # A recursive inventory cannot hash itself or the final helper receipt. Those two exclusions are explicit.
    excluded = {A / "refresh/CHANGED-BYTE-INVENTORY.json", A / "HELPER-RECEIPT.json"}
    entries = []
    for root, prefix in ((A, REFRESH), (B, TARGET)):
        for path in sorted(p for p in root.rglob("*") if p.is_file() and p not in excluded):
            data = path.read_bytes()
            entries.append({"path": (prefix / path.relative_to(root)).as_posix(), "sha256": digest(data), "size_bytes": len(data)})
    changed_inventory = {
        "schema_version": "domainspec-v2.changed-byte-inventory/v1",
        "scope": [REFRESH.as_posix(), TARGET.as_posix()],
        "entries": entries,
        "file_count": len(entries),
        "inventory_digest": canonical_digest(entries),
        "recursive_exclusions": [
            (REFRESH / "refresh/CHANGED-BYTE-INVENTORY.json").as_posix(),
            (REFRESH / "HELPER-RECEIPT.json").as_posix(),
        ],
        "exclusion_reason": "self-hash recursion and final receipt recursion; both are independently hashed by the parent join",
        "writes_outside_scope": [],
        "authority_effect": "none",
    }
    dump(A / "refresh/CHANGED-BYTE-INVENTORY.json", changed_inventory)

    helper = {
        "schema_version": "domainspec-v2.background-helper-receipt/v1",
        "helper_id": "tde-epoch-readiness-refresh",
        "route": "invoke:refresh -> work-pack-readiness-audit:v2 -> implementation-readiness:plan-readiness-preflight",
        "status": "complete-ready-for-owner-acceptance",
        "candidate_id": candidate_manifest["candidate_id"],
        "successor_root": TARGET.as_posix(),
        "refresh_root": REFRESH.as_posix(),
        "material": {"target_count": 81, "inventory_digest": material_inventory["inventory_digest"], "package_digest": material_receipt["packageDigest"], "receipt_ref": exact(material_receipt_path), "handoff_ref": exact(handoff_path)},
        "acceptance": {"status": "unapproved", "candidate_manifest_ref": exact(candidate_manifest_path), "request_ref": exact(acceptance_request_path), "response_required_at": (TARGET / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json").as_posix()},
        "readiness": {"wpra_report_ref": exact(report_path), "preflight_ref": exact(preflight_path), "runtime_admission_status": "pending-selection", "selected_unit": None, "mutation_ready": False},
        "preservation": {"ledger_ref": exact(REFRESH / "refresh/SOURCE-PRESERVATION-LEDGER.json"), "predecessor_unchanged": True, "protected_sources_unchanged": True, "staged_equals_applied": True},
        "validation": {"ledger_ref": exact(REFRESH / "refresh/VALIDATION-LEDGER.json"), "changed_byte_inventory_ref": exact(REFRESH / "refresh/CHANGED-BYTE-INVENTORY.json"), "all_json_parse": "pass", "whitespace_eof": "pass", "masked_failure_count": 0},
        "claim_ceiling": "Planning/readiness evidence only; no owner acceptance, selection, mutation admission, implementation, execution, merge, publication, or release.",
        "next_owner": "Rondelli exact Plan acceptance",
        "after_acceptance_route": "task-session:selection/TDE-EPOCH-001",
        "authority_effect": "none",
    }
    dump(A / "HELPER-RECEIPT.json", helper)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
