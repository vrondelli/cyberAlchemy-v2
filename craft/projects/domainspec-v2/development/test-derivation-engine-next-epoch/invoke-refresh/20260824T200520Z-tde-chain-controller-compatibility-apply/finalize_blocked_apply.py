#!/usr/bin/env python3
"""Finalize the apply-approved Refresh as blocked by joined governance defects."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path.cwd().resolve()
RUN_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)
RUN = ROOT / RUN_REL


def load_json(relative: str) -> dict:
    return json.loads((RUN / relative).read_text(encoding="utf-8"))


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def exact_ref(relative: str) -> dict:
    payload = (RUN / relative).read_bytes()
    return {
        "path": str(RUN_REL / relative),
        "sha256": sha256_bytes(payload),
        "size_bytes": len(payload),
    }


def write_json(relative: str, document: object) -> None:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    package = load_json("material/material-package.json")
    material_receipt = load_json("material/material-package-receipt.json")
    handoff = load_json("material/refresh-material-handoff-result.json")
    apply_receipt = load_json("material/material-apply-receipt.json")
    lifecycle = load_json("validation/TARGET-LIFECYCLE-WORDING.json")
    source_preservation = load_json("validation/SOURCE-PRESERVATION.json")
    validation_ledger = load_json("validation/VALIDATION-LEDGER.json")
    sidecar = load_json("LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json")
    repair = load_json("governance-defect-sidecar/STAGED-REPAIR-CANDIDATE.json")
    wpra = load_json("validation/live-wpra-attempt-2/work-pack-readiness-report-v2.json")
    readiness = load_json("validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT-attempt-2.json")
    controller = load_json("validation/CONTROLLER-COMPATIBILITY-VALIDATION.json")

    if not (
        material_receipt["patchVerdict"] == "pass"
        and material_receipt["mutationHandoff"] == "ready"
        and handoff["mutationReady"] is True
        and apply_receipt["status"] == "pass"
        and apply_receipt["target_count"] == 84
        and apply_receipt["live_bytes_equal_staged_bytes"] is True
        and lifecycle["status"] == "fail"
        and lifecycle["finding_count"] == 34
        and validation_ledger["status"] == "fail"
        and source_preservation["status"] == "pass"
        and sidecar["join_status"] == "ready-for-parent-inspection"
        and sidecar["status"] == "pass-diagnosis-repair-not-applied"
        and repair["status"] == "staged-proposal-only-not-applied"
    ):
        raise SystemExit("FINALIZE_BLOCK: evidence set differs from the stopped apply state")

    target_paths = [change["target_path"] for change in package["changes"]]
    applied_changes = apply_receipt["applied_changes"]
    signals = [
        {
            "id": "SIG-APPLY-MATERIAL-READY",
            "source_path": str(RUN_REL / "material/refresh-material-handoff-result.json"),
            "signal_type": "evidence_added",
            "target_artifacts": target_paths,
            "claim": "The exact 84-path material package and file-bound handoff passed before apply.",
            "evidence": "Package canonical digest, receipt file digest, path scopes, dependencies, owner, publication boundary, and current staged bytes all matched.",
            "confidence": "high",
            "mutation_safety": "safe",
        },
        {
            "id": "SIG-APPLY-CREATE-COMPLETE",
            "source_path": str(RUN_REL / "material/material-apply-receipt.json"),
            "signal_type": "status_changed",
            "target_artifacts": target_paths,
            "claim": "Exactly 84 canonical @3 files were created and remained byte-equal to the validated staged postimages.",
            "evidence": "Exclusive-create apply receipt and independent changed-byte inventory.",
            "confidence": "high",
            "mutation_safety": "safe",
        },
        {
            "id": "SIG-LIFECYCLE-WORDING-DRIFT",
            "source_path": str(RUN_REL / "validation/TARGET-LIFECYCLE-WORDING.json"),
            "signal_type": "artifact_drift",
            "target_artifacts": sorted({item["path"] for item in lifecycle["findings"]}),
            "claim": "The applied @3 candidate contains 34 invalid current-lifecycle @2 references across 20 paths.",
            "evidence": "Exact line-bound acceptance-critical lifecycle scan, independently classified by the joined sidecar.",
            "confidence": "high",
            "mutation_safety": "blocked",
        },
        {
            "id": "SIG-VALIDATION-COMMAND-DRIFT",
            "source_path": str(RUN_REL / "validation/FAILED-ATTEMPT-LEDGER.json"),
            "signal_type": "blocker_opened",
            "target_artifacts": [str(RUN_REL / "material/material-package.json")],
            "claim": "The declared unit validator used an aggregate JSON file where the validator requires the validation-contracts directory.",
            "evidence": "Exit 1 and `expected 10 contracts, got 0`; corrected read-only directory invocation passes but does not mask the declared-command failure.",
            "confidence": "high",
            "mutation_safety": "blocked",
        },
        {
            "id": "SIG-ROUTE-FRESH-SUCCESSOR",
            "source_path": str(RUN_REL / "governance-defect-sidecar/STAGED-REPAIR-CANDIDATE.json"),
            "signal_type": "route_changed",
            "target_artifacts": [],
            "claim": "The next lawful route is a fresh proposal-only successor, recommended as @4; repaired bytes need new apply authorization and renewed exact owner acceptance.",
            "evidence": "Joined governance-defect receipt and staged repair specification.",
            "confidence": "high",
            "mutation_safety": "needs_review",
        },
    ]
    write_json(
        "reconciliation/REFRESH-SIGNALS.json",
        {
            "schema_version": "domainspec-v2.invoke-refresh-signals/v1",
            "run_id": "invoke-refresh-tde-chain-controller-compatibility-apply-20260824T200520Z",
            "signal_count": len(signals),
            "signals": signals,
            "authority_effect": "none",
        },
    )

    blockers = [
        {
            "id": "B-LIFECYCLE-WORDING",
            "scope": "refresh-authoring",
            "owner": "Invoke successor author",
            "status": "blocked",
            "claim": "The applied @3 candidate contains 34 invalid current-lifecycle references and eight additional current identity labels.",
        },
        {
            "id": "B-VALIDATION-COMMAND",
            "scope": "refresh-authoring",
            "owner": "Invoke material producer",
            "status": "blocked",
            "claim": "The accepted material command is not replayable because --contracts names a file instead of the ten-contract directory.",
        },
        {
            "id": "B-FRESH-SUCCESSOR",
            "scope": "target-lifecycle",
            "owner": "Rondelli",
            "status": "open",
            "claim": "A fresh proposal-only successor, new target inventory, material and semantic digests, independent review, and separate apply authorization are required.",
        },
        {
            "id": "B-OWNER-ACCEPTANCE",
            "scope": "target-lifecycle",
            "owner": "Rondelli",
            "status": "open",
            "claim": "Renewed exact owner acceptance must bind the future live successor after v2 preacceptance closure; the historical v1 request is insufficient.",
        },
        {
            "id": "B-SELECTION-CHAIN",
            "scope": "audit",
            "owner": "WPRA and task-session-until-blocker lifecycle owners",
            "status": "open",
            "claim": "Real initial selection and separate chain approval remain absent and cannot precede exact successor acceptance.",
        },
        {
            "id": "B-VICTOR",
            "scope": "audit",
            "owner": "Victor Boscaro",
            "status": "deferred",
            "claim": "Victor remains the later exact pre-merge structural approver only.",
        },
    ]

    material_binding = {
        "required": True,
        "receiptPresent": True,
        "schemaValid": True,
        "patchVerdict": material_receipt["patchVerdict"],
        "mutationHandoff": material_receipt["mutationHandoff"],
        "packageId": material_receipt["packageId"],
        "packageDigest": material_receipt["packageDigest"],
        "expectedPackageId": handoff["materialPackage"]["expectedPackageId"],
        "expectedPackageDigest": handoff["materialPackage"]["expectedPackageDigest"],
        "validatedPaths": material_receipt["validatedPaths"],
        "dependencyResult": material_receipt["dependencyResult"],
        "ownerBoundaryResult": material_receipt["ownerBoundaryResult"],
        "publicationBoundaryResult": material_receipt["publicationBoundaryResult"],
        "validationCommands": material_receipt["validationCommands"],
        "lifecycleOwner": material_receipt["lifecycleOwner"],
        "authorityClass": material_receipt["authorityClass"],
        "publicationClass": material_receipt["publicationClass"],
        "preApplyHandoffReady": True,
        "postApplyValidation": "blocked",
    }
    validation = [
        {"id": "material-package", "status": "pass", "ref": exact_ref("material/material-package-receipt.json")},
        {"id": "file-bound-handoff", "status": "pass", "ref": exact_ref("material/refresh-material-handoff-result.json")},
        {"id": "exact-84-apply", "status": "pass", "ref": exact_ref("material/material-apply-receipt.json")},
        {"id": "changed-byte-inventory", "status": "pass", "ref": exact_ref("validation/CHANGED-BYTE-INVENTORY.json")},
        {"id": "source-preservation", "status": "pass", "ref": exact_ref("validation/SOURCE-PRESERVATION.json")},
        {"id": "live-wpra", "status": "pass", "code": wpra["terminal_code"], "ref": exact_ref("validation/live-wpra-attempt-2/work-pack-readiness-report-v2.json")},
        {"id": "live-implementation-readiness", "status": "pass", "code": readiness["code"], "ref": exact_ref("validation/LIVE-IMPLEMENTATION-READINESS-PREFLIGHT-attempt-2.json")},
        {"id": "controller-structural-probe", "status": "pass", "expected_stop": controller["expected_lifecycle_stop"], "ref": exact_ref("validation/CONTROLLER-COMPATIBILITY-VALIDATION.json")},
        {"id": "corrected-unit-contracts-read-only", "status": "pass", "ref": exact_ref("validation/CORRECTED-UNIT-CONTRACT-VALIDATION.json")},
        {"id": "declared-unit-contract-command", "status": "fail", "exit_code": 1, "ref": exact_ref("validation/FAILED-ATTEMPT-LEDGER.json")},
        {"id": "target-lifecycle-wording", "status": "fail", "finding_count": 34, "ref": exact_ref("validation/TARGET-LIFECYCLE-WORDING.json")},
        {"id": "independent-governance-defect-sidecar", "status": "pass-diagnosis-repair-not-applied", "ref": exact_ref("LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json")},
    ]
    refresh_report = {
        "mode": "refresh",
        "phaseStatus": "block",
        "phaseStatusBasis": {"artifactComplete": False, "refreshAuthoringBlockerCount": 2},
        "activationSource": "direct-user",
        "mutationMode": "apply-approved",
        "mutationModeSource": "explicit",
        "handoffStatus": "blocked",
        "sourceSignals": signals,
        "targetArtifacts": target_paths,
        "deltaSummary": [
            {"class": "evidence_added", "count": 1},
            {"class": "status_changed", "count": 1},
            {"class": "artifact_drift", "count": 1},
            {"class": "blocker_opened", "count": 1},
            {"class": "route_changed", "count": 1},
        ],
        "proposedChanges": [],
        "appliedChanges": applied_changes,
        "skippedChanges": [
            "canonical or material in-place repair",
            "owner acceptance request",
            "WPRA selection evidence",
            "chain approval",
            "Task Session or product execution",
        ],
        "materialPackage": material_binding,
        "mutationReady": False,
        "blockers": blockers,
        "nextRoute": "invoke:refresh:proposal-only for a fresh dsv2-tde-multiformalism-profile-epoch@4 successor candidate",
        "validation": validation,
        "authority_effect": "none",
        "claim_ceiling": "Exact @3 create-only apply plus stopped validation evidence. No owner acceptance, selection, chain approval, Task Session, product mutation, merge, promotion, publication, release, or deployment.",
    }
    write_json("refresh-report.json", refresh_report)

    report = f"""# Invoke Refresh apply report: TDE chain-controller compatibility

## Outcome Brief

The exact 84-file `@3` candidate was created only after the standard material package and file-bound handoff passed. Every live file is still byte-equal to its approved staged postimage, but post-apply validation found two governance defects, so this Refresh is blocked and cannot proceed to acceptance, selection, or execution.

- Objective: apply and live-validate the exact controller-compatible TDE successor.
- Result: 84 create-only targets applied exactly; lifecycle wording and declared validation-command binding failed acceptance-critical checks.
- Why it matters: the structural controller repair works, but the candidate identity and validation evidence are not safe to accept or execute.

## Boundary and Next Decision

- Changed: exactly 84 canonical files under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3/**`, plus run-local evidence under this apply root.
- Unchanged: accepted `@2`, proposal bytes, material bytes after their validated apply, product implementation, authority, Craft, telemetry, Git, publication, release, deployment, and external state.
- Open questions: none inside diagnosis; the joined sidecar classifies both failures as governance-only.
- User decision: authorize a future proposal-only Refresh only when ready to author a fresh successor; the recommended uncreated identity is `@4`.
- Next action: `invoke:refresh:proposal-only` for a fresh `@4` candidate, followed by new apply authorization, live validation, v2 preacceptance closure, and renewed exact Rondelli acceptance. Selection and chain approval remain later; Victor remains pre-merge only.

## Technical Details

## Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: block
- Phase status basis: applied bytes exist, but two acceptance-critical Refresh-authoring blockers remain
- Handoff readiness: blocked
- Mutation mode: apply-approved
- Applied changes: 84 exact create-only targets
- Material package: pre-apply pass/ready; canonical digest `{material_receipt['packageDigest']}`
- Live byte equality: pass, 84/84, no extras or symlinks
- Live WPRA: `{wpra['terminal_code']}`
- Live implementation readiness: `{readiness['code']}` with `mutation_ready=false`
- Controller: former `MANIFEST_SHAPE_INVALID` cleared; expected stop `{controller['expected_lifecycle_stop']}`; no controller state or Task Session created
- Blocking lifecycle findings: 34 references across 20 paths, plus eight additional current identity labels
- Blocking command finding: declared `--contracts` operand is an aggregate file; corrected read-only directory-bound run passes 10 units but cannot repair the accepted material binding
- Mutation ready: false
- Authority effect: none
- Next route: proposal-only fresh successor, recommended `dsv2-tde-multiformalism-profile-epoch@4`
"""
    (RUN / "REFRESH-REPORT.md").write_text(report, encoding="utf-8")

    helper_receipt = {
        "schema_version": "domainspec-v2.invoke-refresh-apply-helper-receipt/v1",
        "run_id": "invoke-refresh-tde-chain-controller-compatibility-apply-20260824T200520Z",
        "agent_id": "tde_chain_compat_apply",
        "capability_ref": "invoke:refresh:apply-approved",
        "status": "blocked",
        "phase_result": "block",
        "task_status": "stopped-at-joined-governance-defect",
        "spawn_status": "spawned-by-parent",
        "join_status": "ready-for-parent-join",
        "close_status": "closed-with-blocked-receipt",
        "root_cause": sidecar["root_cause"],
        "affected_invariants": sidecar["affected_invariants"],
        "minimal_repair_proposal": sidecar["minimal_repair_proposal"],
        "permanent_workflow_regression_fix": sidecar["permanent_workflow_regression_fix"],
        "applied_changes": {"count": 84, "exact": True, "byte_equal": True, "target_root": apply_receipt["target_root"]},
        "changed_byte_inventory": exact_ref("validation/CHANGED-BYTE-INVENTORY.json"),
        "source_preservation": exact_ref("validation/SOURCE-PRESERVATION.json"),
        "material_package": {"canonical_digest": material_receipt["packageDigest"], "raw_ref": exact_ref("material/material-package.json"), "receipt_ref": exact_ref("material/material-package-receipt.json"), "handoff_ref": exact_ref("material/refresh-material-handoff-result.json"), "apply_ref": exact_ref("material/material-apply-receipt.json")},
        "failed_attempt_ledger": exact_ref("validation/FAILED-ATTEMPT-LEDGER.json"),
        "live_validation": validation,
        "sidecar_join": {"status": "joined", "receipt_ref": exact_ref("LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json"), "staged_repair_ref": exact_ref("governance-defect-sidecar/STAGED-REPAIR-CANDIDATE.json")},
        "renewed_owner_acceptance_required": True,
        "renewed_apply_authorization_required": True,
        "new_candidate_required": True,
        "recommended_successor": "dsv2-tde-multiformalism-profile-epoch@4",
        "mutation_ready": False,
        "blockers": blockers,
        "residue": ["fresh successor proposal", "fresh material and semantic digests", "independent review and v2 preacceptance closure", "renewed apply authorization", "live successor equality", "renewed exact Rondelli acceptance", "real WPRA selection", "separate chain approval", "later Victor pre-merge review"],
        "artifacts": [exact_ref("REFRESH-REPORT.md"), exact_ref("refresh-report.json"), exact_ref("reconciliation/REFRESH-SIGNALS.json"), exact_ref("validation/VALIDATION-LEDGER.json")],
        "next_route": "invoke:refresh:proposal-only for a fresh dsv2-tde-multiformalism-profile-epoch@4 successor candidate",
        "authority_effect": "none",
        "claim_ceiling": "Exact @3 create-only apply and blocked validation evidence only; no acceptance, selection, execution, merge, promotion, publication, release, deployment, commit, push, or telemetry authority.",
    }
    write_json("HELPER-RECEIPT.json", helper_receipt)
    print(json.dumps({"status": "block", "applied": 84, "mutationReady": False, "next_route": helper_receipt["next_route"]}, sort_keys=True))


if __name__ == "__main__":
    main()
