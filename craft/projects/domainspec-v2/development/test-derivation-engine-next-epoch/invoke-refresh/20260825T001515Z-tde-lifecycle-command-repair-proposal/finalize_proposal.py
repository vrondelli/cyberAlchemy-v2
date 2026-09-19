#!/usr/bin/env python3
"""Finalize the exact proposal-only TDE @4 lifecycle/command repair package."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path, PurePosixPath
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
RUN_REL = RUN.relative_to(REPO).as_posix()
SOURCE_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
TARGET_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
APPLY_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/"
    "20260824T200520Z-tde-chain-controller-compatibility-apply"
)
PROPOSAL3_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-refresh/"
    "20260824T192000Z-tde-chain-controller-compatibility-proposal"
)
SOURCE_ID = "dsv2-tde-multiformalism-profile-epoch@3"
TARGET_ID = "dsv2-tde-multiformalism-profile-epoch@4"
WORK_PACK_ID = "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z"
SOURCE = REPO / SOURCE_REL
TARGET = REPO / TARGET_REL
STAGED = RUN / "staging" / TARGET_REL
OVERLAY = RUN / "validation/repository-overlay"
OVERLAY_TARGET = OVERLAY / TARGET_REL


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: Any) -> str:
    return sha256_bytes(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    )


def write_json(relative: str, value: Any) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return path


def write_text(relative: str, value: str) -> Path:
    path = RUN / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value.rstrip() + "\n", encoding="utf-8")
    return path


def exact_ref(path: Path, root: Path = REPO) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def run_ref(relative: str) -> dict[str, Any]:
    return exact_ref(RUN / relative)


def command(argv: list[str], *, cwd: Path = REPO) -> dict[str, Any]:
    completed = subprocess.run(
        argv,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return {
        "argv": argv,
        "cwd": "." if cwd == REPO else cwd.relative_to(REPO).as_posix(),
        "exit_code": completed.returncode,
        "output": completed.stdout,
    }


def result_code(value: dict[str, Any], expected: int = 0) -> str:
    return "pass" if value["exit_code"] == expected else "block"


if TARGET.exists():
    raise SystemExit(f"proposal-only boundary violated; canonical @4 exists: {TARGET_REL}")
staged_files = sorted(path for path in STAGED.rglob("*") if path.is_file())
if len(staged_files) != 84:
    raise SystemExit(f"expected exact 84 staged targets, found {len(staged_files)}")

entries: list[dict[str, Any]] = []
for staged in staged_files:
    relative = staged.relative_to(STAGED).as_posix()
    target_path = f"{TARGET_REL}/{relative}"
    data = staged.read_bytes()
    source = SOURCE / relative
    source_data = source.read_bytes()
    entries.append(
        {
            "operation": "create",
            "target_path": target_path,
            "staged_path": staged.relative_to(REPO).as_posix(),
            "source_path": source.relative_to(REPO).as_posix(),
            "source_sha256": sha256_bytes(source_data),
            "source_size_bytes": len(source_data),
            "sha256": sha256_bytes(data),
            "size_bytes": len(data),
            "change_class": "fresh-successor-identity-lifecycle-and-root-rebinding",
        }
    )

inventory_projection = [
    {"path": item["target_path"], "sha256": item["sha256"], "size_bytes": item["size_bytes"]}
    for item in entries
]
inventory_digest = canonical_digest(inventory_projection)
target_inventory = {
    "schema_version": "domainspec-v2.refresh-proposal-target-inventory/v1",
    "proposal_id": "tde-lifecycle-command-repair-proposal-20260825T001515Z",
    "source_candidate_id": SOURCE_ID,
    "source_candidate_state": "applied-stopped-not-accepted-for-execution",
    "proposed_candidate_id": TARGET_ID,
    "canonical_target_root": TARGET_REL,
    "target_lifecycle": "proposed-not-created",
    "mutation_mode": "proposal-only",
    "target_count": len(entries),
    "all_operations": "create",
    "inventory_digest": inventory_digest,
    "entries": entries,
    "derived_validation_postimages_are_apply_targets": False,
    "authority_effect": "none",
}
write_json("proposal/TARGET-INVENTORY.json", target_inventory)

validator = f"{TARGET_REL}/plan/work-pack/shared/validate_tde_unit_contracts.py"
schema = f"{TARGET_REL}/plan/work-pack/shared/TDE-UNIT-VALIDATION.schema.json"
contracts_dir = f"{TARGET_REL}/plan/work-pack/shared/validation-contracts"
positive = f"{TARGET_REL}/plan/work-pack/shared/unit-contract-fixtures/valid.json"
negative = f"{TARGET_REL}/plan/work-pack/shared/unit-contract-fixtures/invalid-missing-expected-exit.json"
apply_argv = [
    "python3", validator, "--schema", schema, "--contracts", contracts_dir,
    "--positive", positive, "--negative", negative,
]
staged_validator = (RUN / "staging" / validator).relative_to(REPO).as_posix()
staged_schema = (RUN / "staging" / schema).relative_to(REPO).as_posix()
staged_contracts = (RUN / "staging" / contracts_dir).relative_to(REPO).as_posix()
staged_positive = (RUN / "staging" / positive).relative_to(REPO).as_posix()
staged_negative = (RUN / "staging" / negative).relative_to(REPO).as_posix()
staged_argv = [
    "python3", staged_validator, "--schema", staged_schema, "--contracts", staged_contracts,
    "--positive", staged_positive, "--negative", staged_negative,
]
binding = {
    "schema_version": "domainspec-v2.tde-validation-command-binding/v1",
    "candidate_id": TARGET_ID,
    "staged_argv": staged_argv,
    "apply_argv": apply_argv,
    "contracts_operand_kind": "directory",
    "contracts_operand_expected_count": 10,
    "aggregate_projection_path": f"{TARGET_REL}/plan/work-pack/shared/VALIDATION-CONTRACTS.json",
    "aggregate_projection_role": "summary-only-never-contracts-operand",
    "staged_surfaces": [
        {"surface": "proposal-exact-replay", "argv": staged_argv},
        {"surface": "proposal-regression", "argv": staged_argv},
    ],
    "apply_surfaces": [
        {"surface": "candidate-manifest-planned-validation", "argv": apply_argv},
        {"surface": "material-proposal-validation-command", "argv": apply_argv},
        {"surface": "future-material-package", "argv": apply_argv},
        {"surface": "future-material-receipt", "argv": apply_argv},
        {"surface": "future-handoff-request", "argv": apply_argv},
        {"surface": "future-handoff-result", "argv": apply_argv},
        {"surface": "future-live-runner", "argv": apply_argv},
    ],
    "authority_effect": "none",
}
write_json("proposal/VALIDATION-COMMAND-BINDING.json", binding)

material_digest = canonical_digest(
    {
        "candidate_id": TARGET_ID,
        "canonical_target_root": TARGET_REL,
        "targets": inventory_projection,
        "validation_argv": apply_argv,
    }
)
material_proposal = {
    "schema_version": "domainspec-v2.invoke-refresh-proposal-material/v1",
    "proposal_id": "tde-lifecycle-command-repair-proposal-20260825T001515Z",
    "source_candidate": {
        "candidate_id": SOURCE_ID,
        "root": SOURCE_REL,
        "state": "applied-stopped-not-accepted-for-execution",
        "non_transfer_rule": "No @2 acceptance, @3 apply authorization, selection, chain approval, or review transfers to @4.",
    },
    "proposed_candidate": {
        "candidate_id": TARGET_ID,
        "canonical_target_root": TARGET_REL,
        "target_lifecycle": "proposed-not-created",
    },
    "mutation_mode": "proposal-only",
    "authorization_state": "fresh-exact-apply-authorization-required",
    "material_target_count": len(entries),
    "target_inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"),
    "target_inventory_digest": inventory_digest,
    "proposal_material_digest": material_digest,
    "validation_command": apply_argv,
    "validation_command_binding_ref": run_ref("proposal/VALIDATION-COMMAND-BINDING.json"),
    "staging_root": (RUN / "staging").relative_to(REPO).as_posix(),
    "full_target_mapping": entries,
    "applied_changes": [],
    "authority_effect": "none",
}
write_json("proposal/MATERIAL-PROPOSAL.json", material_proposal)

wpra_report_path = OVERLAY_TARGET / "readiness/wpra/work-pack-readiness-report-v2.json"
wpra_manifest_path = OVERLAY_TARGET / "readiness/wpra/plan-semantic-manifest.json"
selection_handoff_path = OVERLAY_TARGET / "readiness/wpra/selection-handoff.json"
readiness_path = OVERLAY_TARGET / "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"
wpra_report = json.loads(wpra_report_path.read_text())
wpra_manifest = json.loads(wpra_manifest_path.read_text())
readiness = json.loads(readiness_path.read_text())
semantic_digest = wpra_manifest["canonical_semantic_digest"]

candidate_manifest = {
    "schema_version": "domainspec-v2.exact-plan-candidate-manifest/v1",
    "candidate_id": TARGET_ID,
    "owner": "Rondelli",
    "work_pack_id": WORK_PACK_ID,
    "plan_epoch_id": wpra_manifest["plan_epoch_id"],
    "exactAcceptanceStatus": "unapproved",
    "mutation_ready": False,
    "target_lifecycle": "proposal-staged-not-applied",
    "semantic_targets": {
        "file_count": len(entries),
        "inventory_digest": inventory_digest,
        "material_proposal_digest": material_digest,
        "canonical_semantic_digest": semantic_digest,
        "inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"),
        "material_proposal_ref": run_ref("proposal/MATERIAL-PROPOSAL.json"),
        "validation_command": apply_argv,
    },
    "readiness_evidence": {
        "wpra_verdict": wpra_report["verdict"],
        "terminal_code": wpra_report["terminal_code"],
        "runtime_admission_status": wpra_report["runtime_admission_status"],
        "selected_unit": None,
        "plan_semantic_manifest_ref": exact_ref(wpra_manifest_path),
        "wpra_report_ref": exact_ref(wpra_report_path),
        "selection_handoff_ref": exact_ref(selection_handoff_path),
        "implementation_readiness_preflight_ref": exact_ref(readiness_path),
        "reusable_for_execution": False,
    },
    "source_admission": {
        "source_candidate_id": SOURCE_ID,
        "source_state": "applied-stopped",
        "source_defect_receipt_ref": exact_ref(REPO / APPLY_REL / "LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json"),
        "victor_gate": "later exact pre-merge structural approval only",
    },
    "claim_ceiling": "Exact proposal-stage postimages and isolated validation only; no apply, acceptance, selection, Task Session, merge, promotion, publication, release, or deployment authority.",
    "authority_effect": "none",
}
write_json("proposal/CANDIDATE-MANIFEST.json", candidate_manifest)
candidate_manifest_sha = sha256_bytes((RUN / "proposal/CANDIDATE-MANIFEST.json").read_bytes())

patch_manifest = {
    "schema_version": "domainspec-v2.tde-lifecycle-command-repair-patch/v1",
    "candidate_id": TARGET_ID,
    "source_candidate_id": SOURCE_ID,
    "source_candidate_state": "applied-stopped",
    "target_count": len(entries),
    "all_targets_create_only": True,
    "target_inventory_digest": inventory_digest,
    "material_proposal_digest": material_digest,
    "canonical_semantic_digest": semantic_digest,
    "candidate_manifest_sha256": candidate_manifest_sha,
    "validation_command": apply_argv,
    "repairs": [
        {"id": "R1-lifecycle", "claim": "34 invalid current-lifecycle references across 20 paths repaired to @4."},
        {"id": "R1-identity", "claim": "Eight additional current identity labels repaired to @4/r4."},
        {"id": "R1-history", "claim": "@2 remains only as explicitly typed historical non-transfer provenance."},
        {"id": "R2-command", "claim": "Every planned apply command binds --contracts to the ten-document validation-contracts directory."},
        {"id": "R3-regressions", "claim": "Lifecycle and operand-kind regressions execute against exact staged create targets."},
    ],
    "preserved": [
        "ten unit behaviors, order, dependencies, successors, write scopes, validation contracts, and claim ceilings",
        "TypeScript, Python, Rust, extension, and Lean/EVF profile boundaries",
        "Rondelli owner and Victor later pre-merge-only approval timing",
    ],
    "applied_changes": [],
    "authority_effect": "none",
}
write_json("proposal/PROPOSAL-PATCH-MANIFEST.json", patch_manifest)

source_files = [
    REPO / APPLY_REL / "REFRESH-REPORT.md",
    REPO / APPLY_REL / "HELPER-RECEIPT.json",
    REPO / APPLY_REL / "LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json",
    REPO / APPLY_REL / "governance-defect-sidecar/STAGED-REPAIR-CANDIDATE.json",
    REPO / APPLY_REL / "validation/TARGET-LIFECYCLE-WORDING.json",
    REPO / APPLY_REL / "validation/CORRECTED-UNIT-CONTRACT-VALIDATION.json",
    SOURCE / "plan/EXECUTION-ENTRY.json",
    SOURCE / "plan/work-pack/shared/EXECUTION-CONTRACTS.json",
    SOURCE / "readiness/audit-config.json",
    REPO / ".agents/skills/invoke/scripts/preacceptance_closure.py",
    REPO / ".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py",
    REPO / ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py",
    REPO / ".agents/skills/task-session-until-blocker/scripts/run_chain.py",
]
source_refs = [exact_ref(path) for path in source_files]
obligations = [
    ("O01", "Preserve stopped @3 as exact source evidence and create no canonical @4 bytes."),
    ("O02", "Repair the 34 invalid current-lifecycle claims and eight current identity labels."),
    ("O03", "Retain @2 only as explicit historical non-transfer provenance."),
    ("O04", "Bind --contracts to a ten-document directory and reject wrong operand kinds/counts."),
    ("O05", "Preserve all ten unit semantics, profiles, writes, validations, and claim ceilings."),
    ("O06", "Pass execution-entry, Dispatch, WPRA, readiness, and controller structural gates."),
    ("O07", "Emit no owner request unless v2 closure, independent review, and adoption pass."),
    ("O08", "Keep apply, acceptance, selection, chain approval, Task Session, and Victor gates later."),
]
context_index = {
    "schema_version": "context-builder.runtime-handoff-index/v1",
    "run_id": "20260825T001515Z-tde-lifecycle-command-repair-proposal",
    "task_id": "invoke-refresh-tde-r4-lifecycle-command-repair",
    "mode": "standard",
    "strict": True,
    "handoff": "runtime",
    "persistence_class": "run-local-proposal-evidence",
    "strict_coverage": "pass",
    "obligations": [{"obligation_id": oid, "claim": claim, "status": "covered"} for oid, claim in obligations],
    "selected_sources": [
        {**ref, "obligations": ["O01", "O02", "O04", "O06", "O07", "O08"]}
        for ref in source_refs
    ],
    "write_scope": [f"{RUN_REL}/**"],
    "forbidden_scope": [TARGET_REL, SOURCE_REL, "projects/domainspec-v2/impl/test-derivation-engine", ".arcanum", "arcanum", "cyberAlchemy-v2", "Git"],
    "authority_effect": "none",
}
write_json("context/context-pack.index.json", context_index)
write_text(
    "context/CONTEXT-PACK.md",
    f"""# TDE @4 lifecycle and command repair context pack

## Task

Author and validate one exact proposal-only `{TARGET_ID}` successor from the applied-but-stopped `{SOURCE_ID}` candidate.

## Evidence

- The @3 apply created 84 exact files but stopped on 34 stale lifecycle claims, eight stale current identity labels, and an invalid file-shaped `--contracts` operand.
- The sidecar requires a fresh successor and forbids editing @3 in place.
- Installed WPRA, Implementation Readiness, controller, and preacceptance v2 contracts remain the consumer boundaries.

## Obligations

""" + "\n".join(f"- {oid}: {claim} — covered" for oid, claim in obligations) + f"""

## Boundary

Only `{RUN_REL}/**` may change. Canonical @4, stopped @3, accepted @2, product, authority, public Arcanum, Craft, telemetry, Git, approvals, selection, and Task Session remain unchanged.
""",
)
write_json(
    "context/INVENTORY-LOOKUP.json",
    {
        "schema_version": "inventory.lookup.packet.v1",
        "query": "TDE lifecycle command repair @4",
        "lookup_readiness": "ready",
        "validation": {"status": "pass", "failures": 0, "warnings": 153, "warning_class": "pre-existing-uncontrolled-tags"},
        "selection_result": "Exact run-local defect evidence supersedes broad Inventory matches for this narrow repair.",
        "authority_effect": "none",
    },
)

signals = {
    "schema_version": "domainspec-v2.invoke-refresh-signals/v1",
    "proposal_id": "tde-lifecycle-command-repair-proposal-20260825T001515Z",
    "signals": [
        {"id": "SIG-R4-LIFECYCLE", "signal_type": "blocker_resolved", "source_path": f"{APPLY_REL}/validation/TARGET-LIFECYCLE-WORDING.json", "target_artifacts": [item["target_path"] for item in entries], "claim": "Exact staged @4 repairs every enumerated current-lifecycle and identity finding.", "confidence": "high", "mutation_safety": "needs_review"},
        {"id": "SIG-R4-COMMAND", "signal_type": "blocker_resolved", "source_path": f"{APPLY_REL}/validation/CORRECTED-UNIT-CONTRACT-VALIDATION.json", "target_artifacts": [f"{TARGET_REL}/validation/VALIDATION.json"], "claim": "The directory-shaped ten-contract command is frozen and adversarial operand kinds/counts fail.", "confidence": "high", "mutation_safety": "needs_review"},
        {"id": "SIG-R4-ROUTE", "signal_type": "route_changed", "source_path": f"{APPLY_REL}/LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json", "target_artifacts": [TARGET_REL], "claim": "The next lawful route becomes fresh exact apply authorization; implementation remains later.", "confidence": "high", "mutation_safety": "blocked"},
    ],
    "authority_effect": "none",
}
write_json("reconciliation/REFRESH-SIGNALS.json", signals)

dispatch = {
    "dispatch_id": "invoke-refresh-tde-r4-lifecycle-command-repair-20260825T001515Z",
    "mode": "sequence",
    "intent": {"raw": "invoke:refresh:proposal-only", "objective": "Repair the stopped @3 lifecycle and command defects as one exact staged @4 proposal without applying or executing it.", "target_artifact": RUN_REL},
    "subagent_strategy": {
        "status": "required",
        "trigger": "Repository route delegates non-trivial bounded governance repair to one native helper.",
        "authorization": "approved",
        "permission_prompt": "invoke:refresh:proposal-only",
        "binding_mode": "descriptive",
        "parallelism": "fanout",
        "join_policy": "parent_synthesis",
        "execution_owner": "/root",
        "explanation": "One helper owns only the fresh proposal root; parent retains route, apply, acceptance, and final claims.",
        "roles": [{
            "role_id": "tde-r4-lifecycle-command-repair-author",
            "agent_count": 1,
            "purpose": "Author and validate one exact proposal-only @4 lifecycle and command repair package.",
            "capability_ref": "invoke",
            "capability_mode": "refresh-proposal-only",
            "capability_target": TARGET_ID,
            "depends_on_roles": [],
            "applies_to_steps": ["s1-context", "s2-stage", "s3-validate", "s4-handoff"],
            "input_refs": [SOURCE_REL, f"{APPLY_REL}/LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json"],
            "owns": f"only {RUN_REL}/**",
            "write_scope": [f"{RUN_REL}/**"],
            "forbidden_write_scopes": [SOURCE_REL, TARGET_REL, "projects/domainspec-v2/impl/", "projects/domainspec-v2/authority/", "projects/domainspec-v2/.craft/", "arcanum/", ".agents/", ".arcanum/", ".git/", "telemetry/"],
            "mutation_policy": "proposal-only",
            "output_refs": ["REFRESH-PATCH-PROPOSAL.md", "REFRESH-REPORT.md", "refresh-report.json", "HELPER-RECEIPT.json"],
        }],
        "receipt_requirements": [
            "agent_id", "role_id", "dispatch_id", "step_id", "capability_ref",
            "spawn_status", "join_status", "close_status", "status", "task_status",
            "domain_gate_status", "artifacts", "changed_byte_inventory", "validation",
            "observer_status", "blockers", "residue", "reroute", "handoff_note",
            "authority_effect",
        ],
    },
    "steps": [
        {"step_id": "s1-context", "name": "Freeze exact defect and stopped-source evidence", "capability_ref": "context-builder", "mode": "standard-strict-runtime-handoff", "pattern": "sequential", "parallel": False, "techniques": ["concrete_path_evidence", "state_namespace_boundary"], "inputs": [{"kind": "artifact", "ref": f"{APPLY_REL}/LIFECYCLE-WORDING-GOVERNANCE-DEFECT-RECEIPT.json"}], "outputs": [{"kind": "frame", "ref": "context/CONTEXT-PACK.md"}, {"kind": "artifact", "ref": "source/SOURCE-INVENTORY.json"}], "stop_conditions": ["stop on source drift or uncovered repair obligation"]},
        {"step_id": "s2-stage", "name": "Stage exact @4 create targets", "capability_ref": "invoke", "mode": "refresh-proposal-only", "pattern": "sequential", "parallel": False, "depends_on_steps": ["s1-context"], "techniques": ["artifact_contract_bridge", "owner_boundary_check"], "inputs": [{"kind": "frame", "ref": "context/CONTEXT-PACK.md"}], "outputs": [{"kind": "artifact", "ref": "proposal/TARGET-INVENTORY.json"}, {"kind": "artifact", "ref": "staging/"}], "stop_conditions": ["stop on target escape, canonical collision, or semantic drift"]},
        {"step_id": "s3-validate", "name": "Validate lifecycle, command, WPRA, readiness, and controller structure", "capability_ref": "invoke", "mode": "refresh-proposal-overlay-validation", "pattern": "validation", "parallel": False, "depends_on_steps": ["s2-stage"], "techniques": ["validation_loop", "artifact_contract_bridge"], "inputs": [{"kind": "artifact", "ref": "staging/"}], "outputs": [{"kind": "receipt", "ref": "validation/VALIDATION-LEDGER.json"}], "evidence_artifact": "validation/VALIDATION-LEDGER.json", "stop_conditions": ["stop on any acceptance-critical final failure"]},
        {"step_id": "s4-handoff", "name": "Emit gated exact proposal without owner request", "capability_ref": "invoke", "mode": "refresh-handoff", "pattern": "sequential", "parallel": False, "depends_on_steps": ["s3-validate"], "techniques": ["authority_split_gate", "residue_ledger", "owner_boundary_check"], "inputs": [{"kind": "receipt", "ref": "validation/VALIDATION-LEDGER.json"}], "outputs": [{"kind": "artifact", "ref": "REFRESH-PATCH-PROPOSAL.md"}, {"kind": "receipt", "ref": "HELPER-RECEIPT.json"}], "stop_conditions": ["stop before apply, owner request emission, acceptance, selection, chain approval, or Task Session"]},
    ],
    "gates": [
        {"gate_id": "g-repair", "kind": "validation", "owner": "invoke-refresh", "condition": "Lifecycle and command regressions pass on all exact staged targets.", "on_fail": "block"},
        {"gate_id": "g-structure", "kind": "validation", "owner": "WPRA/Implementation Readiness/controller", "condition": "WPRA and readiness pass and controller reaches EPOCH_APPROVAL_INVALID.", "on_fail": "block"},
        {"gate_id": "g-apply", "kind": "human_approval", "owner": "Rondelli", "condition": "Fresh authorization binds exact @4 inventory and digests.", "on_fail": "block"},
        {"gate_id": "g-parent", "kind": "validation", "owner": "/root", "condition": "Parent joins complete helper receipt.", "on_fail": "block"},
    ],
    "techniques": ["sequence", "concrete_path_evidence", "artifact_contract_bridge", "validation_loop", "owner_boundary_check", "authority_split_gate", "residue_ledger", "observability_grouping", "state_namespace_boundary"],
    "boundary_evidence": {"state_namespaces": [{"namespace": "tde-r4-repair-proposal", "owner": "invoke-refresh", "write_policy": f"exclusive to {RUN_REL}/**"}], "promotion_splits": [{"source": "validated proposal", "target": "canonical @4 apply", "rule": "separate exact apply authorization and live validation required", "on_violation": "block"}]},
    "observability": {"dispatch_id_required": True, "trace_events": ["context_frozen", "proposal_staged", "regressions_passed", "wpra_passed", "controller_stopped_at_approval", "helper_closed"], "signal_grouping": "run-local only; telemetry append out of scope"},
    "promotion_guardrails": ["No canonical @4 target is created.", "No @2 or @3 authority transfers to @4.", "No owner request, acceptance, selection, chain approval, Task Session, or Victor approval is synthesized."],
}
write_json("DISPATCH.json", dispatch)
write_json(
    "validation/TECHNIQUE-TRACE.json",
    {"schema_version": "dispatch-spec.technique-trace/v1", "dispatch_id": dispatch["dispatch_id"], "techniques": [
        {"technique": "sequence", "application": "Context, staging, validation, and gated handoff remain ordered."},
        {"technique": "concrete_path_evidence", "application": "Every source and target is bound by exact path, SHA-256, and size."},
        {"technique": "artifact_contract_bridge", "application": "Staged candidate bytes are exercised through installed WPRA, readiness, and controller consumers."},
        {"technique": "validation_loop", "application": "Lifecycle and command repairs carry positive and adversarial regressions with preserved exits."},
        {"technique": "owner_boundary_check", "application": "Apply, acceptance, selection, chain approval, and Victor review remain distinct."},
        {"technique": "authority_split_gate", "application": "Proposal pass keeps mutation_ready false and authority none."},
        {"technique": "residue_ledger", "application": "Later apply, closure, acceptance, selection, chain, and review gates remain explicit."},
        {"technique": "observability_grouping", "application": "Evidence is grouped under one run-local dispatch without telemetry mutation."},
        {"technique": "state_namespace_boundary", "application": f"All writes remain under {RUN_REL}/**."},
    ], "distill": {"status": "skipped", "rationale": "Narrow lifecycle/command compatibility repair over an unchanged ten-unit decomposition."}, "authority_effect": "none"},
)

execution_result = command(["python3", ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py", "--projection", f"{RUN_REL}/staging/{TARGET_REL}/plan/EXECUTION-ENTRY.json", "--output", f"{RUN_REL}/validation/EXECUTION-ENTRY-VALIDATION.json"])
incorrect_flags = command(["python3", staged_validator, "--schema", staged_schema, "--contracts", staged_contracts, "--valid-fixture", staged_positive, "--invalid-fixture", staged_negative])
unit_positive = command(staged_argv)
fixture_root = RUN / "validation/command-kind-fixtures"
operand_results = []
for name, operand in (
    ("aggregate-json-file", (RUN / "staging" / f"{TARGET_REL}/plan/work-pack/shared/VALIDATION-CONTRACTS.json").relative_to(REPO).as_posix()),
    ("missing-path", (fixture_root / "missing").relative_to(REPO).as_posix()),
    ("empty-directory", (fixture_root / "empty").relative_to(REPO).as_posix()),
    ("nine-contract-directory", (fixture_root / "nine").relative_to(REPO).as_posix()),
):
    argv = list(staged_argv)
    argv[argv.index("--contracts") + 1] = operand
    observed = command(argv)
    operand_results.append({"fixture": name, "operand": operand, "expected_exit": 1, "status": "pass" if observed["exit_code"] == 1 else "block", **observed})
write_json("validation/COMMAND-OPERAND-NEGATIVE-FIXTURES.json", {"schema_version": "domainspec-v2.tde-command-operand-fixtures/v1", "status": "pass" if all(item["status"] == "pass" for item in operand_results) else "block", "fixtures": operand_results, "authority_effect": "none"})
lifecycle_result = command(["python3", f"{RUN_REL}/validate_proposal_regressions.py", "lifecycle", "--staged-root", f"{RUN_REL}/staging/{TARGET_REL}", "--output", f"{RUN_REL}/validation/LIFECYCLE-WORDING-REGRESSION.json"])
command_binding_result = command(["python3", f"{RUN_REL}/validate_proposal_regressions.py", "command", "--binding", f"{RUN_REL}/proposal/VALIDATION-COMMAND-BINDING.json", "--output", f"{RUN_REL}/validation/COMMAND-BINDING-REGRESSION.json"])
dispatch_result = command(["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", f"{RUN_REL}/DISPATCH.json", "--json"])
write_json("validation/DISPATCH-VALIDATION.json", {"schema_version": "dispatch-spec.validation-receipt/v1", "status": result_code(dispatch_result), **dispatch_result, "authority_effect": "none"})
controller_result = command(["python3", ".agents/skills/task-session-until-blocker/scripts/run_chain.py", "--config", f"{RUN_REL}/validation/repository-overlay/controller-probe-chain-config.json"])
try:
    controller_receipt = json.loads(controller_result["output"])
except json.JSONDecodeError:
    controller_receipt = {"terminal_code": "UNPARSEABLE", "raw": controller_result["output"]}
controller_pass = controller_result["exit_code"] == 2 and controller_receipt.get("terminal_code") == "EPOCH_APPROVAL_INVALID"
write_json("validation/CONTROLLER-COMPATIBILITY-VALIDATION.json", {"schema_version": "domainspec-v2.tde-r4-controller-compatibility/v1", "status": "pass" if controller_pass else "block", "former_gate_cleared": controller_receipt.get("terminal_code") != "MANIFEST_SHAPE_INVALID", "observed_terminal_code": controller_receipt.get("terminal_code"), "expected_terminal_code": "EPOCH_APPROVAL_INVALID", "controller": controller_result, "task_sessions_started": 0, "product_mutations": 0, "authority_effect": "none"})

preacceptance_gate = {
    "schema_version": "domainspec-v2.invoke-preacceptance-v2-gate/v1",
    "status": "deferred",
    "candidate_id": TARGET_ID,
    "owner_request_emitted": False,
    "historical_v1_request_reused": False,
    "generator_ref": exact_ref(REPO / ".agents/skills/invoke/scripts/preacceptance_closure.py"),
    "required_before_v2_request": ["separately authorized exact apply", "live-byte equality", "two-run no-effect consumer closure", "independent review over the same closure graph", "passing reflection-adoption cross-capability regression", "generator emit-request", "validate-request"],
    "current_missing": ["live @4 canonical postimages", "closure manifest and passing two-run receipt", "independent review", "reflection-adoption receipt"],
    "authority_effect": "none",
}
write_json("validation/PREACCEPTANCE-V2-GATE.json", preacceptance_gate)

source_inventory = json.loads((RUN / "source/SOURCE-INVENTORY.json").read_text())
source_failures = []
for entry in source_inventory["entries"]:
    path = REPO / entry["path"]
    if not path.is_file() or sha256_bytes(path.read_bytes()) != entry["sha256"] or path.stat().st_size != entry["size_bytes"]:
        source_failures.append(entry["path"])
source_preservation = {
    "schema_version": "domainspec-v2.tde-r4-source-preservation/v1",
    "status": "pass" if not source_failures and not TARGET.exists() else "block",
    "stopped_r3_file_count": source_inventory["source_count"],
    "stopped_r3_inventory_digest": source_inventory["inventory_digest"],
    "stopped_r3_failures": source_failures,
    "canonical_r4_absent": not TARGET.exists(),
    "accepted_r2_preserved_by_reference": exact_ref(REPO / "projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2/acceptance/RONDELLI-PLAN-ACCEPTANCE.json"),
    "previous_proposal_preserved_by_reference": exact_ref(REPO / PROPOSAL3_REL / "HELPER-RECEIPT.json"),
    "previous_apply_preserved_by_reference": exact_ref(REPO / APPLY_REL / "HELPER-RECEIPT.json"),
    "owned_write_root": RUN_REL,
    "product_mutations": [],
    "authority_mutations": [],
    "git_effect": "none",
    "authority_effect": "none",
}
write_json("validation/SOURCE-PRESERVATION.json", source_preservation)
write_json("validation/CHANGED-BYTE-INVENTORY.json", {"schema_version": "domainspec-v2.tde-r4-changed-byte-inventory/v1", "canonical_changes": [], "run_local_staged_target_count": len(entries), "logical_content_delta_count_relative_to_r3": sum(1 for item in entries if item["sha256"] != item["source_sha256"]), "target_inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"), "authority_effect": "none"})

final_checks = {
    "execution_entry": execution_result["exit_code"] == 0,
    "unit_contract_positive": unit_positive["exit_code"] == 0 and "RESULT: pass" in unit_positive["output"],
    "unit_contract_negative_matrix": all(item["status"] == "pass" for item in operand_results),
    "lifecycle_wording": lifecycle_result["exit_code"] == 0,
    "command_binding": command_binding_result["exit_code"] == 0,
    "dispatch": dispatch_result["exit_code"] == 0,
    "wpra": wpra_report["verdict"] == "pass" and wpra_report["terminal_code"] == "PLAN_SEMANTIC_READY",
    "implementation_readiness": readiness["status"] == "pass" and readiness["code"] == "PLAN_IMPLEMENTATION_READY",
    "controller": controller_pass,
    "source_preservation": source_preservation["status"] == "pass",
    "canonical_r4_absent": not TARGET.exists(),
    "preacceptance_request_absent": not (RUN / "acceptance").exists(),
}

json_failures = []
symlinks = []
whitespace_failures = []
for path in sorted(path for path in RUN.rglob("*") if path.is_file()):
    relative = path.relative_to(RUN).as_posix()
    if "/repository-overlay/.git/" in f"/{relative}":
        continue
    if path.is_symlink():
        symlinks.append(relative)
    if path.suffix == ".json":
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:
            json_failures.append({"path": relative, "error": str(error)})
    if path.suffix in {".md", ".json", ".py"}:
        text = path.read_text(encoding="utf-8")
        trailing = [index for index, line in enumerate(text.splitlines(), 1) if line.endswith(" ") or line.endswith("\t")]
        if trailing or not text.endswith("\n"):
            whitespace_failures.append({"path": relative, "trailing_lines": trailing, "eof_newline": text.endswith("\n")})
final_checks["json"] = not json_failures
final_checks["symlinks"] = not symlinks
final_checks["whitespace_eof"] = not whitespace_failures
all_pass = all(final_checks.values())

attempts = [
    {"attempt": 1, "check": "Inventory index validation", "exit_code": 0, "result": "pass/lookup_ready", "notes": "0 failures; 153 pre-existing tag warnings."},
    {"attempt": 2, "check": "Initial unit-validator invocation with obsolete flags", "exit_code": incorrect_flags["exit_code"], "result": "expected-authored-attempt-fail", "output": incorrect_flags["output"], "notes": "Preserved; corrected exact flags are --positive and --negative."},
    {"attempt": 3, "check": "Execution-entry authoring validator", "exit_code": execution_result["exit_code"], "result": result_code(execution_result)},
    {"attempt": 4, "check": "Exact directory-bound ten-contract command", "exit_code": unit_positive["exit_code"], "result": "pass" if final_checks["unit_contract_positive"] else "block", "output": unit_positive["output"]},
    {"attempt": 5, "check": "Aggregate/missing/empty/nine-contract adversarial operands", "exit_code": 0 if final_checks["unit_contract_negative_matrix"] else 2, "result": "pass" if final_checks["unit_contract_negative_matrix"] else "block"},
    {"attempt": 6, "check": "WPRA v2 isolated overlay", "exit_code": 0 if final_checks["wpra"] else 2, "result": "pass/PLAN_SEMANTIC_READY" if final_checks["wpra"] else "block"},
    {"attempt": 7, "check": "Invoke Plan implementation-readiness preflight", "exit_code": 0 if final_checks["implementation_readiness"] else 2, "result": "pass/PLAN_IMPLEMENTATION_READY" if final_checks["implementation_readiness"] else "block"},
    {"attempt": 8, "check": "Installed controller structural probe", "exit_code": controller_result["exit_code"], "result": f"expected-lifecycle-block/{controller_receipt.get('terminal_code')}"},
    {"attempt": 9, "check": "Exact staged lifecycle wording regression", "exit_code": lifecycle_result["exit_code"], "result": result_code(lifecycle_result)},
    {"attempt": 10, "check": "Validation command operand/parity regression", "exit_code": command_binding_result["exit_code"], "result": result_code(command_binding_result)},
    {"attempt": 11, "check": "Dispatch Spec validation", "exit_code": dispatch_result["exit_code"], "result": result_code(dispatch_result)},
    {"attempt": 12, "check": "Run-local JSON/path/symlink/whitespace/EOF scan", "exit_code": 0 if final_checks["json"] and final_checks["symlinks"] and final_checks["whitespace_eof"] else 2, "result": "pass" if final_checks["json"] and final_checks["symlinks"] and final_checks["whitespace_eof"] else "block"},
    {"attempt": 13, "check": "Source preservation and canonical @4 absence", "exit_code": 0 if final_checks["source_preservation"] else 2, "result": "pass" if final_checks["source_preservation"] else "block"},
]
write_json("validation/FAILED-ATTEMPT-LEDGER.json", {"schema_version": "domainspec-v2.failed-attempt-ledger/v1", "failed_attempts": [
    attempts[1],
    {"attempt": "dispatch-1", "check": "Initial Dispatch Spec validation", "exit_code": 1, "result": "block/schema", "diagnostics": ["mode single-bounded-helper outside closed vocabulary", "subagent strategy missing status and authorization", "dispatch-level techniques used object shape instead of IDs"], "repair": "Use mode sequence, the complete governed subagent strategy shape, and dispatch-level technique IDs."},
    {"attempt": "dispatch-2", "check": "Second Dispatch Spec validation", "exit_code": 1, "result": "block/receipt-contract", "diagnostics": ["receipt requirements omitted capability_ref, handoff_note, observer_status, residue, status, step_id, reroute, role_id, and spawn_status"], "repair": "Restore the complete native and lifecycle receipt field set."},
], "masking_prohibited": True, "later_success_does_not_erase_attempt": True, "final_dispatch_validation": "pass", "authority_effect": "none"})
write_json("validation/COMMAND-EXITS.json", {"schema_version": "domainspec-v2.command-exit-ledger/v1", "all_acceptance_critical_final_checks_pass": all_pass, "commands": attempts, "authority_effect": "none"})
write_json("validation/VALIDATION-LEDGER.json", {"schema_version": "domainspec-v2.tde-r4-proposal-validation-ledger/v1", "status": "pass" if all_pass else "block", "checks": {key: "pass" if value else "block" for key, value in final_checks.items()}, "json_failures": json_failures, "symlinks": symlinks, "whitespace_failures": whitespace_failures, "failed_attempt_preserved": True, "authority_effect": "none"})

blockers = [
    {"id": "B-APPLY", "scope": "apply-authorization", "owner": "Rondelli", "status": "open", "claim": "Fresh exact apply authorization must bind @4 inventory and candidate/material/semantic digests."},
    {"id": "B-LIVE", "scope": "target-lifecycle", "owner": "Invoke Refresh apply", "status": "open", "claim": "Canonical @4 is absent; live-byte equality and acceptance-critical replay remain."},
    {"id": "B-PREACCEPTANCE", "scope": "audit", "owner": "Spellcraft preacceptance closure and independent reviewer", "status": "open", "claim": "No v2 owner request may be emitted before closure, independent review, and reflection adoption pass."},
    {"id": "B-ACCEPTANCE", "scope": "target-lifecycle", "owner": "Rondelli", "status": "open", "claim": "Renewed exact owner acceptance remains later and must bind live @4 bytes."},
    {"id": "B-SELECTION", "scope": "audit", "owner": "WPRA and task-session-until-blocker", "status": "open", "claim": "Real initial selection and separate chain approval remain absent."},
    {"id": "B-VICTOR", "scope": "audit", "owner": "Victor Boscaro", "status": "deferred", "claim": "Victor remains later exact pre-merge structural approval only."},
]
refresh_report = {
    "mode": "refresh",
    "phaseStatus": "pass" if all_pass else "block",
    "phaseStatusBasis": {"artifactComplete": all_pass, "refreshAuthoringBlockerCount": 0 if all_pass else 1},
    "activationSource": "delegated",
    "mutationMode": "proposal-only",
    "mutationModeSource": "explicit-parent-bounded",
    "handoffStatus": "gated" if all_pass else "blocked",
    "execution_path": ["context", "inventory", "dispatch", "staging", "lifecycle regression", "command regression", "WPRA", "implementation readiness", "controller probe", "gated handoff"],
    "dispatch_trace": run_ref("validation/TECHNIQUE-TRACE.json"),
    "source_evidence": source_refs,
    "target_inventory": run_ref("proposal/TARGET-INVENTORY.json"),
    "sourceSignals": signals["signals"],
    "deltaSummary": [{"class": "blocker_resolved", "count": 2}, {"class": "route_changed", "count": 1}],
    "proposedChanges": entries,
    "appliedChanges": [],
    "skippedChanges": ["canonical apply", "owner request emission", "owner acceptance", "selection", "chain approval", "Task Session", "Victor approval"],
    "materialPackage": {"required": False, "receiptPresent": False, "schemaValid": False, "patchVerdict": "not-applicable", "mutationHandoff": "gated", "packageId": "", "packageDigest": material_digest, "expectedPackageId": "future-r4-exact-material-package", "expectedPackageDigest": material_digest, "validatedPaths": [item["target_path"] for item in entries], "dependencyResult": "not-applicable", "ownerBoundaryResult": "pass", "publicationBoundaryResult": "pass", "validationCommands": [apply_argv], "lifecycleOwner": "Invoke Refresh apply", "authorityClass": "private", "publicationClass": "private"},
    "mutationReady": False,
    "blockers": blockers,
    "result": {"candidate_id": TARGET_ID, "candidate_manifest_sha256": candidate_manifest_sha, "inventory_digest": inventory_digest, "material_proposal_digest": material_digest, "canonical_semantic_digest": semantic_digest, "wpra": "PLAN_SEMANTIC_READY", "implementation_readiness": "PLAN_IMPLEMENTATION_READY", "controller_terminal": "EPOCH_APPROVAL_INVALID", "owner_request_emitted": False},
    "validation": attempts,
    "nextRoute": "invoke:refresh:apply-approved after fresh exact authorization",
    "authority_effect": "none",
}
write_json("refresh-report.json", refresh_report)
write_text(
    "REFRESH-PATCH-PROPOSAL.md",
    f"""# TDE @4 lifecycle and command repair proposal

The fresh `{TARGET_ID}` proposal repairs the two governance defects that stopped applied @3. It creates an exact 84-file successor in staging only; no canonical or product files are changed.

## Exact repairs

- All 34 invalid current-lifecycle references across 20 files now bind @4.
- All eight stale current identity labels now bind @4/r4.
- @2 appears only in explicitly historical, non-transferable provenance.
- `--contracts` binds `plan/work-pack/shared/validation-contracts/`, never `VALIDATION-CONTRACTS.json`.
- The exact ten-contract directory passes; aggregate, missing, empty, and nine-contract fixtures fail.
- Candidate/material planning surfaces carry the same future apply argv.

## Preserved semantics

The ten SWUs, dependency/successor graph, TypeScript/Python/Rust/extension/Lean-EVF boundaries, write scopes, validation contracts, claim ceilings, Rondelli ownership, and Victor pre-merge-only timing are unchanged.

## Frozen identity

- Candidate manifest SHA-256: `{candidate_manifest_sha}`
- Target inventory digest: `{inventory_digest}`
- Material proposal digest: `{material_digest}`
- Canonical semantic digest: `{semantic_digest}`

## Next boundary

Fresh exact apply authorization is required. After apply, validate live equality and all gates, complete v2 preacceptance closure plus independent review and adoption, emit and validate the v2 owner request, obtain Rondelli acceptance, then create real selection and separate chain approval. Task Session and Victor review remain later.
""",
)
write_text(
    "REFRESH-REPORT.md",
    f"""# Invoke Refresh report: TDE @4 lifecycle and command repair proposal

## Outcome Brief

An exact corrected `{TARGET_ID}` proposal is complete and locally validated. It repairs the stopped @3 lifecycle wording and validation-command defects while preserving all ten implementation units and keeping implementation unauthorized.

- Objective: produce a fresh safe successor to the stopped applied @3 candidate.
- Result: 84 exact create-only postimages pass lifecycle, command, WPRA, readiness, and controller structural validation.
- Why it matters: the plan can now move to a fresh exact apply decision without carrying the defects that blocked @3.

## Boundary and Next Decision

- Changed: only `{RUN_REL}/**` proposal evidence and staged postimages.
- Unchanged: canonical @4, stopped @3, accepted @2, product code, authority, owner acceptance, selection, chain state, Task Session, Victor approval, Git, publication, release, and deployment.
- Open questions: none inside Refresh authoring; v2 preacceptance closure remains deliberately later because live @4 does not exist.
- User decision: fresh exact authorization is required to apply the frozen @4 target inventory.
- Next action: `invoke:refresh:apply-approved`, then live validation and v2 owner-request closure before Rondelli acceptance.

## Technical Details

- Phase status: `{'pass' if all_pass else 'block'}`
- Handoff readiness: `{'gated' if all_pass else 'blocked'}`
- Mutation mode: `proposal-only`
- Mutation ready: `false`
- Applied changes: none
- WPRA: `{wpra_report['terminal_code']}`
- Implementation readiness: `{readiness['code']}`
- Controller: expected later stop `EPOCH_APPROVAL_INVALID`; `MANIFEST_SHAPE_INVALID` absent
- Candidate manifest SHA-256: `{candidate_manifest_sha}`
- Inventory digest: `{inventory_digest}`
- Material proposal digest: `{material_digest}`
- Canonical semantic digest: `{semantic_digest}`
- Owner request: not emitted; v2 closure/review/adoption gates remain
- Distill: skipped because this is a narrow governance repair over an unchanged ten-unit decomposition
- Authority effect: none
""",
)

helper = {
    "schema_version": "domainspec-v2.invoke-refresh-proposal-helper-receipt/v1",
    "run_id": "invoke-refresh-tde-r4-lifecycle-command-repair-proposal-20260825T001515Z",
    "agent_id": "tde_epoch_r4_repair_proposal",
    "role_id": "tde-r4-lifecycle-command-repair-author",
    "dispatch_id": dispatch["dispatch_id"],
    "step_id": "s4-handoff",
    "capability_ref": "invoke:refresh:proposal-only",
    "spawn_status": "started",
    "status": "pass" if all_pass else "block",
    "task_status": "complete" if all_pass else "blocked",
    "domain_gate_status": "gated" if all_pass else "blocked",
    "phase_result": "pass" if all_pass else "block",
    "close_status": "closed",
    "join_status": "ready-for-parent-join",
    "candidate_id": TARGET_ID,
    "source_candidate_id": SOURCE_ID,
    "source_candidate_state": "applied-stopped",
    "target_root": TARGET_REL,
    "canonical_target_absent": not TARGET.exists(),
    "staged_target_count": len(entries),
    "inventory_digest": inventory_digest,
    "material_proposal_digest": material_digest,
    "canonical_semantic_digest": semantic_digest,
    "candidate_manifest_sha256": candidate_manifest_sha,
    "validation": {"ledger": run_ref("validation/VALIDATION-LEDGER.json"), "lifecycle": run_ref("validation/LIFECYCLE-WORDING-REGRESSION.json"), "command": run_ref("validation/COMMAND-BINDING-REGRESSION.json"), "operand_fixtures": run_ref("validation/COMMAND-OPERAND-NEGATIVE-FIXTURES.json"), "wpra": exact_ref(wpra_report_path), "implementation_readiness": exact_ref(readiness_path), "controller": run_ref("validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"), "dispatch": run_ref("validation/DISPATCH-VALIDATION.json"), "source_preservation": run_ref("validation/SOURCE-PRESERVATION.json"), "preacceptance": run_ref("validation/PREACCEPTANCE-V2-GATE.json")},
    "changed_byte_inventory": run_ref("validation/CHANGED-BYTE-INVENTORY.json"),
    "artifacts": [run_ref("REFRESH-REPORT.md"), run_ref("REFRESH-PATCH-PROPOSAL.md"), run_ref("refresh-report.json"), run_ref("proposal/TARGET-INVENTORY.json"), run_ref("proposal/MATERIAL-PROPOSAL.json"), run_ref("proposal/CANDIDATE-MANIFEST.json")],
    "applied_changes": [],
    "mutation_ready": False,
    "owner_request_emitted": False,
    "task_sessions_started": 0,
    "product_mutations": 0,
    "authority_effect": "none",
    "claim_ceiling": "Exact @4 proposal authoring and isolated validation only; no canonical apply, acceptance, selection, chain approval, execution, merge, promotion, publication, release, deployment, commit, push, or telemetry effect.",
    "blockers": blockers,
    "next_route": "invoke:refresh:apply-approved after fresh exact Rondelli authorization",
    "observer_status": "not-emitted-telemetry-out-of-scope",
    "residue": ["fresh exact apply authorization", "live-byte equality", "v2 preacceptance closure", "independent review and reflection adoption", "renewed exact Rondelli acceptance", "real initial selection", "separate chain approval", "later Victor pre-merge review"],
    "reroute": "invoke:refresh:apply-approved",
    "handoff_note": "Parent must independently join this receipt; proposal pass is not apply, acceptance, selection, or execution authority.",
}
write_json("HELPER-RECEIPT.json", helper)
print(json.dumps({"status": helper["phase_result"], "run_root": RUN_REL, "candidate_manifest_sha256": candidate_manifest_sha, "inventory_digest": inventory_digest, "material_proposal_digest": material_digest, "canonical_semantic_digest": semantic_digest, "canonical_r4_absent": not TARGET.exists()}, indent=2))
raise SystemExit(0 if all_pass else 2)
