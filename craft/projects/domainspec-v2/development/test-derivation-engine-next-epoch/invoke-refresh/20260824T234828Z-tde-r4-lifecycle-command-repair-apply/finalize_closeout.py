#!/usr/bin/env python3
"""Finalize TDE @4 apply evidence after both governance sidecars joined."""

from __future__ import annotations

import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
RUN_REL = RUN.relative_to(REPO).as_posix()
PROPOSAL_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/"
    "20260825T001515Z-tde-lifecycle-command-repair-proposal"
)
PROPOSAL = REPO / PROPOSAL_REL
TARGET_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
TARGET = REPO / TARGET_REL
EXPECTED = {
    "candidate_sha": "655e56a9e6798695652789a4147e9ecf57539eeae637bb524c4937f5225dc078",
    "inventory_digest": "e450921cbe2072c9142b992289db3e49564040cda54bc9727fba6a85a89ef565",
    "material_proposal_digest": "e53224d9cade91854acfb9fa4435c38c59b56d06aa3ec6e39098f422b512ca05",
    "semantic_digest": "61aea5107edca198f4dddd67e316af5e8c9a6fcb8c5cdb8f6826f3d5bea8122f",
    "package_digest": "fe48f463b428afec6c8126b33bd4de454b38f5fb362b36306c62a5cedfa9d1ad",
    "material_receipt_sha": "ad2f9421ad241ffc56ed4b8d80609a688526e728b5bd0205a6185bcd03d1f170",
    "failed_readiness_sha": "80061f85aa8e9385b7a8fe8998cac14ff5f843c5400fd3e06c1af5afe8b98242",
    "sidecar_sha": "0f72d5acc5968d135d2c532e7fdd624dcf5094c3631903751638fe3472beeaa4",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def write_json(relative: str, value: Any) -> Path:
    path = RUN / relative
    if path.exists():
        raise SystemExit(f"refusing to overwrite final closeout artifact: {relative}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def write_text(relative: str, value: str) -> Path:
    path = RUN / relative
    if path.exists():
        raise SystemExit(f"refusing to overwrite final closeout artifact: {relative}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.rstrip() + "\n", encoding="utf-8")
    return path


def exact_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {"path": path.relative_to(REPO).as_posix(), "sha256": sha256(data), "size_bytes": len(data)}


def run(argv: list[str]) -> dict[str, Any]:
    completed = subprocess.run(argv, cwd=REPO, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
    return {"argv": argv, "cwd": ".", "exit_code": completed.returncode, "output": completed.stdout}


for required_absent in (
    "validation/DISPATCH-VALIDATION-CORRECTED.json",
    "validation/DISPATCH-MUTATION-POLICY-NEGATIVE-REGRESSION.json",
    "validation/FINAL-COMMAND-EXITS.json",
    "validation/FINAL-VALIDATION-LEDGER.json",
    "validation/CHANGED-BYTE-INVENTORY.json",
    "APPLY-RECEIPT.json",
    "refresh-report.json",
    "REFRESH-REPORT.md",
    "HELPER-RECEIPT.json",
):
    if (RUN / required_absent).exists():
        raise SystemExit(f"final closeout target already exists: {required_absent}")

inventory = json.loads((PROPOSAL / "proposal/TARGET-INVENTORY.json").read_text())
entries = inventory["entries"]
target_failures = []
for entry in entries:
    target = REPO / entry["target_path"]
    staged = REPO / entry["staged_path"]
    if not target.is_file() or target.is_symlink():
        target_failures.append({"path": entry["target_path"], "reason": "missing-or-symlink"})
        continue
    live = target.read_bytes()
    if live != staged.read_bytes() or sha256(live) != entry["sha256"] or len(live) != entry["size_bytes"]:
        target_failures.append({"path": entry["target_path"], "reason": "live-staged-inventory-mismatch"})
live_files = sorted(path for path in TARGET.rglob("*") if path.is_file())
live_symlinks = sorted(path for path in TARGET.rglob("*") if path.is_symlink())
expected_relatives = {Path(entry["target_path"]).relative_to(TARGET_REL).as_posix() for entry in entries}
actual_relatives = {path.relative_to(TARGET).as_posix() for path in live_files}
if actual_relatives != expected_relatives:
    target_failures.append({"reason": "target-set-mismatch", "missing": sorted(expected_relatives - actual_relatives), "extra": sorted(actual_relatives - expected_relatives)})
if live_symlinks:
    target_failures.append({"reason": "symlinks", "paths": [path.relative_to(TARGET).as_posix() for path in live_symlinks]})

candidate_sha = sha256((PROPOSAL / "proposal/CANDIDATE-MANIFEST.json").read_bytes())
package = json.loads((RUN / "material/material-package.json").read_text())
package_receipt = json.loads((RUN / "material/material-package-receipt.json").read_text())
handoff = json.loads((RUN / "material/refresh-material-handoff.json").read_text())
sidecar = RUN / "READINESS-CLI-GOVERNANCE-DEFECT-RECEIPT.json"
failed_readiness = RUN / "validation/FAILED-ATTEMPT-LEDGER.json"
wpra_dir = RUN / "validation/live-wpra"
wpra_report = json.loads((wpra_dir / "work-pack-readiness-report-v2.json").read_text())
readiness = json.loads((RUN / "validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT.json").read_text())
controller = json.loads((RUN / "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json").read_text())
source_preservation = json.loads((RUN / "validation/SOURCE-PRESERVATION.json").read_text())
preacceptance = json.loads((RUN / "validation/PREACCEPTANCE-V2-GATE.json").read_text())
old_validation = json.loads((RUN / "validation/VALIDATION-LEDGER.json").read_text())
old_dispatch_validation = json.loads((RUN / "validation/DISPATCH-VALIDATION.json").read_text())

corrected_dispatch = run(["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", f"{RUN_REL}/DISPATCH.json", "--json"])
try:
    corrected_dispatch_result = json.loads(corrected_dispatch["output"])
except json.JSONDecodeError:
    corrected_dispatch_result = {"raw": corrected_dispatch["output"]}
write_json(
    "validation/DISPATCH-VALIDATION-CORRECTED.json",
    {
        "schema_version": "dispatch-spec.validation-receipt/v1",
        "status": "pass" if corrected_dispatch["exit_code"] == 0 else "block",
        "command": corrected_dispatch,
        "result": corrected_dispatch_result,
        "preserves_failed_validation_ref": exact_ref(RUN / "validation/DISPATCH-VALIDATION.json"),
        "authority_effect": "none",
    },
)

dispatch = json.loads((RUN / "DISPATCH.json").read_text())
observed_policy = dispatch["subagent_strategy"]["roles"][0]["mutation_policy"]
retired_dispatch = json.loads(json.dumps(dispatch))
retired_dispatch["subagent_strategy"]["roles"][0]["mutation_policy"] = "exact-create-only-after-ready-material-handoff"
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as handle:
    json.dump(retired_dispatch, handle)
    retired_path = Path(handle.name)
retired_result = run(["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", str(retired_path), "--json"])
retired_path.unlink()
write_json(
    "validation/DISPATCH-MUTATION-POLICY-NEGATIVE-REGRESSION.json",
    {
        "schema_version": "domainspec-v2.dispatch-mutation-policy-regression/v1",
        "status": "pass" if observed_policy == "lifecycle-owned" and corrected_dispatch["exit_code"] == 0 and retired_result["exit_code"] == 1 else "block",
        "accepted_value": observed_policy,
        "accepted_value_exit": corrected_dispatch["exit_code"],
        "retired_value": "exact-create-only-after-ready-material-handoff",
        "retired_value_expected_exit": 1,
        "retired_value_observed_exit": retired_result["exit_code"],
        "retired_value_output": retired_result["output"],
        "authority_effect": "none",
    },
)

preserved_proposal_refs = json.loads((RUN / "validation/SOURCE-BASELINE.json").read_text())["proposal_refs"]
proposal_failures = []
for reference in preserved_proposal_refs:
    path = REPO / reference["path"]
    if not path.is_file():
        proposal_failures.append({"path": reference["path"], "reason": "missing"})
        continue
    data = path.read_bytes()
    if sha256(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        proposal_failures.append({"path": reference["path"], "reason": "digest-or-size-drift"})

checks = {
    "exact_live_target_set": not target_failures and len(live_files) == 84,
    "preapply_validation": json.loads((RUN / "validation/PREAPPLY-CHECK.json").read_text())["status"] == "pass",
    "preapply_unit": json.loads((RUN / "validation/PREAPPLY-UNIT-VALIDATION.json").read_text())["status"] == "pass",
    "preapply_operands": json.loads((RUN / "validation/PREAPPLY-OPERAND-NEGATIVE-FIXTURES.json").read_text())["status"] == "pass",
    "preapply_lifecycle": json.loads((RUN / "validation/PREAPPLY-LIFECYCLE-WORDING-REGRESSION.json").read_text())["status"] == "pass",
    "material_package_digest": canonical_digest(package) == EXPECTED["package_digest"],
    "material_receipt": sha256((RUN / "material/material-package-receipt.json").read_bytes()) == EXPECTED["material_receipt_sha"] and package_receipt["patchVerdict"] == "pass" and package_receipt["mutationHandoff"] == "ready" and len(package_receipt["validatedPaths"]) == 84 and not package_receipt["reasons"],
    "material_handoff": handoff["phaseStatus"] == "pass" and handoff["handoffStatus"] == "ready" and handoff["mutationReady"] is True and not handoff["blockers"],
    "candidate_manifest": candidate_sha == EXPECTED["candidate_sha"],
    "live_unit": json.loads((RUN / "validation/LIVE-UNIT-VALIDATION.json").read_text())["status"] == "pass",
    "live_operands": json.loads((RUN / "validation/LIVE-OPERAND-NEGATIVE-FIXTURES.json").read_text())["status"] == "pass",
    "live_lifecycle": json.loads((RUN / "validation/LIVE-LIFECYCLE-WORDING-REGRESSION.json").read_text())["status"] == "pass",
    "execution_entry": json.loads((RUN / "validation/LIVE-EXECUTION-ENTRY-VALIDATION.json").read_text())["status"] == "pass",
    "candidate_dispatch": json.loads((RUN / "validation/LIVE-CANDIDATE-DISPATCH-VALIDATION.json").read_text())["status"] == "pass",
    "apply_dispatch_corrected": corrected_dispatch["exit_code"] == 0,
    "dispatch_negative_regression": retired_result["exit_code"] == 1,
    "dispatch_failed_attempt_preserved": old_dispatch_validation["status"] == "block" and old_dispatch_validation["command"]["exit_code"] == 1,
    "wpra": wpra_report["verdict"] == "pass" and wpra_report["terminal_code"] == "PLAN_SEMANTIC_READY" and wpra_report["canonical_semantic_digest"] == EXPECTED["semantic_digest"],
    "readiness": readiness["status"] == "pass" and readiness["code"] == "PLAN_IMPLEMENTATION_READY" and readiness["mutation_ready"] is False and readiness["reusable_for_execution"] is False,
    "readiness_failed_attempt_preserved": sha256(failed_readiness.read_bytes()) == EXPECTED["failed_readiness_sha"],
    "governance_sidecars_joined": sha256(sidecar.read_bytes()) == EXPECTED["sidecar_sha"] and sidecar.exists(),
    "controller": controller["status"] == "pass" and controller["observed_terminal_code"] == "EPOCH_APPROVAL_INVALID" and controller["former_gate_cleared"] and not controller["controller_state_after"],
    "source_preservation": source_preservation["status"] == "pass" and not proposal_failures,
    "preacceptance_gated": preacceptance["status"] == "gated" and preacceptance["owner_request_emitted"] is False,
    "prior_block_ledger_preserved": old_validation["status"] == "block" and old_validation["checks"]["apply_dispatch"] == "block",
}
status = "pass" if all(checks.values()) else "block"

old_commands = json.loads((RUN / "validation/COMMAND-EXITS.json").read_text())["commands"]
final_commands = old_commands + [
    {"attempt": 16, "check": "Corrected apply Dispatch with lifecycle-owned mutation policy", "exit_code": corrected_dispatch["exit_code"], "result": "pass" if corrected_dispatch["exit_code"] == 0 else "block"},
    {"attempt": 17, "check": "Retired apply Dispatch mutation policy negative regression", "exit_code": retired_result["exit_code"], "expected_exit": 1, "result": "pass/rejected" if retired_result["exit_code"] == 1 else "block"},
]
write_json(
    "validation/FINAL-COMMAND-EXITS.json",
    {
        "schema_version": "domainspec-v2.command-exit-ledger/v1",
        "commands": final_commands,
        "preserved_failure_refs": [
            exact_ref(RUN / "validation/FAILED-ATTEMPT-LEDGER.json"),
            exact_ref(RUN / "validation/DISPATCH-VALIDATION.json"),
        ],
        "later_success_does_not_erase_attempt": True,
        "masking_prohibited": True,
        "all_acceptance_critical_final_checks_pass": status == "pass",
        "authority_effect": "none",
    },
)
write_json(
    "validation/FINAL-VALIDATION-LEDGER.json",
    {
        "schema_version": "domainspec-v2.tde-r4-apply-final-validation-ledger/v1",
        "status": status,
        "checks": {key: "pass" if value else "block" for key, value in checks.items()},
        "target_failures": target_failures,
        "proposal_failures": proposal_failures,
        "canonical_file_count": len(live_files),
        "canonical_symlinks": [path.relative_to(TARGET).as_posix() for path in live_symlinks],
        "failed_readiness_exit_preserved": True,
        "failed_dispatch_exit_preserved": True,
        "sidecar_receipt_ref": exact_ref(sidecar),
        "authority_effect": "none",
    },
)
if status != "pass":
    raise SystemExit("FINAL_CLOSEOUT_BLOCKED")

changed_entries = [
    {
        "operation": "create",
        "path": entry["target_path"],
        "sha256": entry["sha256"],
        "size_bytes": entry["size_bytes"],
        "staged_path": entry["staged_path"],
        "live_equals_staged": True,
        "scope": "canonical @4 planning candidate",
    }
    for entry in entries
]
write_json(
    "validation/CHANGED-BYTE-INVENTORY.json",
    {
        "schema_version": "domainspec-v2.tde-r4-apply-changed-byte-inventory/v1",
        "canonical_create_count": 84,
        "canonical_update_count": 0,
        "canonical_delete_count": 0,
        "canonical_changes": changed_entries,
        "product_changes": [],
        "authority_changes": [],
        "prior_artifact_changes": [],
        "run_local_governance_repairs": [
            {"path": f"{RUN_REL}/DISPATCH.json", "operation": "modify", "field": "/subagent_strategy/roles/0/mutation_policy", "value": "lifecycle-owned", "authorized_by": f"{RUN_REL}/READINESS-CLI-GOVERNANCE-DEFECT-RECEIPT.json"}
        ],
        "apply_evidence_root": RUN_REL,
        "authority_effect": "none",
    },
)

apply_receipt = {
    "schema_version": "domainspec-v2.invoke-refresh-apply-receipt/v1",
    "receipt_id": "tde-r4-lifecycle-command-repair-apply-20260824T234828Z",
    "status": "pass",
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "canonical_target_root": TARGET_REL,
    "created_count": 84,
    "updated_count": 0,
    "deleted_count": 0,
    "target_inventory_digest": EXPECTED["inventory_digest"],
    "material_proposal_digest": EXPECTED["material_proposal_digest"],
    "canonical_semantic_digest": EXPECTED["semantic_digest"],
    "candidate_manifest_sha256": EXPECTED["candidate_sha"],
    "material_package_ref": exact_ref(RUN / "material/material-package.json"),
    "material_receipt_ref": exact_ref(RUN / "material/material-package-receipt.json"),
    "material_handoff_ref": exact_ref(RUN / "material/refresh-material-handoff.json"),
    "wpra_report_ref": exact_ref(wpra_dir / "work-pack-readiness-report-v2.json"),
    "implementation_readiness_ref": exact_ref(RUN / "validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT.json"),
    "governance_sidecar_ref": exact_ref(sidecar),
    "final_validation_ledger_ref": exact_ref(RUN / "validation/FINAL-VALIDATION-LEDGER.json"),
    "apply_consumed": True,
    "replay_authorized": False,
    "owner_acceptance_emitted": False,
    "selection_emitted": False,
    "chain_approval_emitted": False,
    "task_session_started": False,
    "product_implementation_started": False,
    "mutation_ready": False,
    "authority_effect": "none",
    "claim_ceiling": "Exact @4 planning candidate applied and structurally validated; no acceptance, selection, execution, merge, promotion, publication, release, or deployment authority."
}
write_json("APPLY-RECEIPT.json", apply_receipt)

signals = json.loads((RUN / "reconciliation/REFRESH-SIGNALS.json").read_text())["signals"]
refresh_report = {
    "mode": "refresh",
    "phaseStatus": "pass",
    "phaseStatusBasis": {"artifactComplete": True, "refreshAuthoringBlockerCount": 0},
    "activationSource": "direct-user",
    "mutationMode": "apply-approved",
    "mutationModeSource": "explicit",
    "handoffStatus": "ready",
    "sourceSignals": signals,
    "targetArtifacts": [entry["target_path"] for entry in entries],
    "deltaSummary": [{"class": "status_changed", "count": 84, "claim": "Exact @4 planning candidate paths changed from absent to created and live-validated."}],
    "proposedChanges": [],
    "appliedChanges": changed_entries,
    "skippedChanges": [],
    "materialPackage": {
        "required": True,
        "receiptPresent": True,
        "schemaValid": True,
        "patchVerdict": "pass",
        "mutationHandoff": "ready",
        "packageId": package_receipt["packageId"],
        "packageDigest": package_receipt["packageDigest"],
        "expectedPackageId": package_receipt["packageId"],
        "expectedPackageDigest": EXPECTED["package_digest"],
        "validatedPaths": package_receipt["validatedPaths"],
        "dependencyResult": "pass",
        "ownerBoundaryResult": "pass",
        "publicationBoundaryResult": "pass",
        "validationCommands": package_receipt["validationCommands"],
        "lifecycleOwner": "Rondelli",
        "authorityClass": "private",
        "publicationClass": "internal",
        "applyConsumed": True,
    },
    "mutationReady": False,
    "blockers": [
        {"id": "PREACCEPTANCE_V2_CLOSURE_REQUIRED", "scope": "target-lifecycle", "owner": "invoke-preacceptance-closure and independent reviewer", "status": "open", "claim": "Two-run no-effect closure, independent review, and reflection adoption are required before a v2 Rondelli owner-acceptance request."},
        {"id": "EXACT_RONDELLI_ACCEPTANCE_REQUIRED", "scope": "target-lifecycle", "owner": "Rondelli", "status": "open", "claim": "No @4 owner acceptance exists; no selection or chain approval is authorized."},
    ],
    "nextRoute": "invoke preacceptance-closure v2 and independent review",
    "validation": [{"check": key, "status": "pass" if value else "block"} for key, value in checks.items()],
    "authorityEffect": "none",
}
write_json("refresh-report.json", refresh_report)

write_text(
    "REFRESH-REPORT.md",
    f"""# Invoke Refresh report: TDE @4 exact apply

## Outcome Brief

The exact 84-file `dsv2-tde-multiformalism-profile-epoch@4` planning candidate was created and live-validated. The lifecycle wording and unit-validation command now pass on canonical bytes, while implementation remains gated behind v2 closure, independent review, and exact owner acceptance.

- Objective: apply the frozen @4 planning candidate without crossing acceptance or execution boundaries.
- Result: 84 create-only files are byte-equal to staging; WPRA, Implementation Readiness, unit, lifecycle, Dispatch, and controller structural checks pass.
- Why it matters: the planning baseline is now live and exact, so the next lawful work is preacceptance evidence—not product implementation.

## Boundary and Next Decision

- Changed: exactly 84 canonical planning files under `{TARGET_REL}/**` plus run-local apply evidence under `{RUN_REL}/**`.
- Unchanged: stopped @3, accepted @2, proposal bytes, material bytes after handoff, product code, authority, owner acceptance, selection, chain approval, Task Session, Victor decision, Git, Craft, telemetry, publication, release, and deployment.
- Open questions: none inside the approved apply scope; v2 consumer closure, independent review, and reflection adoption remain intentionally unperformed.
- User decision: none for apply closeout.
- Next action: run v2 preacceptance closure and independent review before generating a renewed exact Rondelli acceptance request.

## Technical Details

- Phase status: `pass`
- Handoff status: `ready`
- Mutation mode: `apply-approved`
- Applied changes: `84 create`, `0 update`, `0 delete`
- Material package digest: `{EXPECTED['package_digest']}`
- Material receipt SHA-256: `{EXPECTED['material_receipt_sha']}`
- Candidate manifest SHA-256: `{EXPECTED['candidate_sha']}`
- Inventory digest: `{EXPECTED['inventory_digest']}`
- Proposal material digest: `{EXPECTED['material_proposal_digest']}`
- Canonical semantic digest: `{EXPECTED['semantic_digest']}`
- WPRA: `PLAN_SEMANTIC_READY`, runtime admission `pending-selection`, mutation ready `false`
- Implementation readiness: `PLAN_IMPLEMENTATION_READY`, proof-only, reusable `false`, mutation ready `false`
- Controller: expected `EPOCH_APPROVAL_INVALID`; `MANIFEST_SHAPE_INVALID` absent; no controller state or Task Session created
- Governance defects: both initial failed exits remain preserved; sidecar-authorized readiness and Dispatch corrections passed without changing candidate, material, proposal, canonical, or WPRA bytes
- Preacceptance: owner request not emitted; v2 closure/review/adoption are the next gate
- Distill: skipped because the exact frozen ten-unit decomposition was unchanged
- Authority effect: `none`
""",
)

helper = {
    "schema_version": "domainspec-v2.invoke-refresh-helper-receipt/v1",
    "agent_id": "tde_epoch_r4_apply",
    "role_id": "tde-r4-exact-apply-validator",
    "dispatch_id": dispatch["dispatch_id"],
    "step_id": "s4-handoff",
    "capability_ref": "invoke",
    "capability_mode": "refresh-apply-approved",
    "spawn_status": "spawned",
    "join_status": "join-ready",
    "close_status": "closed",
    "status": "pass",
    "task_status": "complete",
    "domain_gate_status": "apply-complete-target-lifecycle-gated",
    "candidate_id": "dsv2-tde-multiformalism-profile-epoch@4",
    "artifacts": [
        exact_ref(RUN / "REFRESH-REPORT.md"),
        exact_ref(RUN / "refresh-report.json"),
        exact_ref(RUN / "APPLY-RECEIPT.json"),
        exact_ref(RUN / "validation/FINAL-VALIDATION-LEDGER.json"),
        exact_ref(RUN / "validation/CHANGED-BYTE-INVENTORY.json"),
    ],
    "changed_byte_inventory": {"canonical_create_count": 84, "canonical_update_count": 0, "canonical_delete_count": 0, "product_change_count": 0, "evidence_root": RUN_REL},
    "validation": {"status": "pass", "checks": checks},
    "observer_status": "run-local-only-telemetry-out-of-scope",
    "blockers": refresh_report["blockers"],
    "residue": ["v2 preacceptance closure", "independent review", "reflection adoption", "exact Rondelli acceptance", "selection", "chain approval", "Task Session", "Victor pre-merge"],
    "reroute": refresh_report["nextRoute"],
    "handoff_note": "Parent must independently verify this receipt and may route only to v2 preacceptance closure; implementation is not admitted.",
    "governance_sidecar_ref": exact_ref(sidecar),
    "failed_attempt_refs": [exact_ref(RUN / "validation/FAILED-ATTEMPT-LEDGER.json"), exact_ref(RUN / "validation/DISPATCH-VALIDATION.json")],
    "owner_request_emitted": False,
    "selection_emitted": False,
    "task_session_started": False,
    "authority_effect": "none",
    "claim_ceiling": apply_receipt["claim_ceiling"],
}
write_json("HELPER-RECEIPT.json", helper)

print(
    json.dumps(
        {
            "status": "pass",
            "run_root": RUN_REL,
            "canonical_create_count": 84,
            "wpra": "PLAN_SEMANTIC_READY",
            "implementation_readiness": "PLAN_IMPLEMENTATION_READY",
            "controller_terminal": "EPOCH_APPROVAL_INVALID",
            "owner_request_emitted": False,
            "implementation_started": False,
            "helper_receipt_sha256": sha256((RUN / "HELPER-RECEIPT.json").read_bytes()),
        },
        indent=2,
    )
)
