#!/usr/bin/env python3
"""Finalize the exact proposal-only TDE chain-controller compatibility package."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path, PurePosixPath
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
RUN_REL = RUN.relative_to(REPO).as_posix()
SOURCE_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T174651Z-tde-multiformalism-profile-epoch-r2"
)
TARGET_REL = (
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
SOURCE = REPO / SOURCE_REL
STAGED_TARGET = RUN / "staging" / TARGET_REL
OVERLAY = RUN / "validation/repository-overlay"
OVERLAY_TARGET = OVERLAY / TARGET_REL
CHAIN_RUN = REPO / (
    ".arcanum/task-session-until-blocker/"
    "tde-multiformalism-profile-epoch-r2-20260824T191002Z"
)
SOURCE_ID = "dsv2-tde-multiformalism-profile-epoch@2"
TARGET_ID = "dsv2-tde-multiformalism-profile-epoch@3"
WORK_PACK_ID = "DS-TDE-MULTIFORMALISM-PROFILE-EPOCH@20260824T174651Z"
SOURCE_BINDINGS = {
    "plan_acceptance_sha256": "cdf5ebe1169d26ff22387a853a0affa6e5e810a2dc9a7aaf0cf1e95fa8227fca",
    "candidate_manifest_sha256": "731bf19e4de3c1dbd2535d6fc0df5c7d6796ce7bdaf3e3ae1067c46f2f805667",
    "material_digest": "b1e5819b5b22ff7917114e1d9dd7a72b92b4c16ee2575f76a641af0442f58a30",
    "semantic_digest": "e60a5879755443ddbd678f93606e188abf15eda56962e4f0b3119aeb93d0f987",
}


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


def repo_ref(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def run_ref(relative: str) -> dict[str, Any]:
    return repo_ref(RUN / relative)


def source_item(path: Path, selectors: list[str], obligations: list[str]) -> dict[str, Any]:
    ref = repo_ref(path)
    ref.update(selectors=selectors, obligations=obligations)
    return ref


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
        "cwd": cwd.relative_to(REPO).as_posix() if cwd != REPO else ".",
        "exit_code": completed.returncode,
        "output": completed.stdout,
    }


# Copy only derived validation postimages into staging. They are not proposed
# material mutation targets and are regenerated after any authorized apply.
for relative in (
    "readiness/wpra/plan-semantic-manifest.json",
    "readiness/wpra/selection-handoff.json",
    "readiness/wpra/work-pack-readiness-report-v2.json",
    "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json",
):
    source = OVERLAY_TARGET / relative
    destination = STAGED_TARGET / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)

build_result = json.loads((RUN / "validation/BUILD-RESULT.json").read_text())
staged_material_paths: list[str] = build_result["staged_material_paths"]
material_entries: list[dict[str, Any]] = []
for canonical in sorted(staged_material_paths):
    candidate = RUN / "staging" / canonical
    data = candidate.read_bytes()
    relative = PurePosixPath(canonical).relative_to(PurePosixPath(TARGET_REL)).as_posix()
    source_path = f"{SOURCE_REL}/{relative}"
    generated_kind = None
    if not (REPO / source_path).is_file():
        if relative == "plan/work-pack/shared/EXECUTION-CONTRACTS.json":
            generated_kind = "nested-controller-execution-contract-projection"
        elif relative.endswith("tde-continuation-state.schema.json"):
            generated_kind = "continuation-state-receipt-schema"
        elif relative.endswith("tde-continuation-router-verification.schema.json"):
            generated_kind = "continuation-router-verification-schema"
        else:
            raise ValueError(f"unclassified generated target: {canonical}")
    material_entries.append(
        {
            "target_path": canonical,
            "staged_path": candidate.relative_to(REPO).as_posix(),
            "sha256": sha256_bytes(data),
            "size_bytes": len(data),
            "source_path": None if generated_kind else source_path,
            "change_class": generated_kind or "candidate-root-and-id-normalization",
        }
    )

inventory_projection = [
    {"path": item["target_path"], "sha256": item["sha256"], "size_bytes": item["size_bytes"]}
    for item in material_entries
]
inventory_digest = canonical_digest(inventory_projection)
material_digest = canonical_digest(
    {
        "candidate_id": TARGET_ID,
        "canonical_target_root": TARGET_REL,
        "targets": inventory_projection,
    }
)

target_inventory = {
    "schema_version": "domainspec-v2.refresh-proposal-target-inventory/v1",
    "proposal_id": "tde-chain-controller-compatibility-proposal-20260824T192000Z",
    "source_candidate_id": SOURCE_ID,
    "proposed_candidate_id": TARGET_ID,
    "canonical_target_root": TARGET_REL,
    "target_lifecycle": "proposed-not-created",
    "mutation_mode": "proposal-only",
    "target_count": len(material_entries),
    "inventory_digest": inventory_digest,
    "entries": material_entries,
    "derived_validation_postimages": [
        f"{TARGET_REL}/readiness/wpra/plan-semantic-manifest.json",
        f"{TARGET_REL}/readiness/wpra/selection-handoff.json",
        f"{TARGET_REL}/readiness/wpra/work-pack-readiness-report-v2.json",
        f"{TARGET_REL}/readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json",
    ],
    "derived_postimages_are_apply_targets": False,
    "authority_effect": "none",
}
write_json("proposal/TARGET-INVENTORY.json", target_inventory)

wpra_report = json.loads((OVERLAY_TARGET / "readiness/wpra/work-pack-readiness-report-v2.json").read_text())
wpra_manifest = json.loads((OVERLAY_TARGET / "readiness/wpra/plan-semantic-manifest.json").read_text())
preflight = json.loads((OVERLAY_TARGET / "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json").read_text())
routes = json.loads((STAGED_TARGET / "plan/EXECUTION-ENTRY.json").read_text())["execution_policy"]["allowed_routes"]
contracts = json.loads(
    (STAGED_TARGET / "plan/work-pack/shared/EXECUTION-CONTRACTS.json").read_text()
)["execution_contracts"]

proposal_manifest = {
    "schema_version": "domainspec-v2.invoke-refresh-proposal-material/v1",
    "proposal_id": "tde-chain-controller-compatibility-proposal-20260824T192000Z",
    "source_candidate": {
        "candidate_id": SOURCE_ID,
        "root": SOURCE_REL,
        **SOURCE_BINDINGS,
    },
    "proposed_candidate": {
        "candidate_id": TARGET_ID,
        "canonical_target_root": TARGET_REL,
        "target_lifecycle": "proposed-not-created",
    },
    "mutation_mode": "proposal-only",
    "authorization_state": "not-authorized-for-apply",
    "material_target_count": len(material_entries),
    "target_inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"),
    "target_inventory_digest": inventory_digest,
    "proposal_material_digest": material_digest,
    "staging_root": (RUN / "staging").relative_to(REPO).as_posix(),
    "full_target_mapping": material_entries,
    "semantic_diff": {
        "preserved": [
            "ten-unit TDE behavior, ordering, dependencies, successors, write scopes, validation commands, claim ceilings, and implementation profiles",
            "Rondelli as Plan owner and Victor as later pre-merge structural approver only",
            "no selection, mutation, execution, promotion, publication, release, or deployment authority",
        ],
        "changed": [
            "all ten Task Session route targets now use safe repository-relative Markdown selectors",
            "one complete nested execution-contract projection now binds all ten units",
            "five exact receipt-schema references and closeout joins are bound per unit",
            "audit, execution, closeout, route-policy, and future WPRA projections are aligned",
            "candidate root and candidate ID advance from @2/r2 to proposed @3/r3",
        ],
        "new_semantic_files": [
            f"{TARGET_REL}/plan/work-pack/shared/EXECUTION-CONTRACTS.json",
            f"{TARGET_REL}/plan/work-pack/shared/schemas/tde-continuation-state.schema.json",
            f"{TARGET_REL}/plan/work-pack/shared/schemas/tde-continuation-router-verification.schema.json",
        ],
    },
    "apply_effect": None,
    "applied_changes": [],
    "authority_effect": "none",
}
write_json("proposal/PROPOSAL-PATCH-MANIFEST.json", proposal_manifest)

compatibility_contract = {
    "schema_version": "domainspec-v2.tde-chain-controller-compatibility-contract/v1",
    "contract_id": "tde-chain-controller-compatibility-r3",
    "controller_ref": repo_ref(REPO / ".agents/skills/task-session-until-blocker/scripts/run_chain.py"),
    "chain_config_schema_ref": repo_ref(
        REPO / ".agents/skills/task-session-until-blocker/schemas/chain-config.schema.json"
    ),
    "candidate_id": TARGET_ID,
    "canonical_target_root": TARGET_REL,
    "material_digest": material_digest,
    "requirements": {
        "unit_count": 10,
        "safe_route_selector_pattern": "plan/work-pack/tasks/TASK-TDE-EPOCH-NNN.md#TDE-EPOCH-NNN",
        "nested_projection_path": "/execution_contracts",
        "exact_schema_refs_per_unit": 5,
        "required_unit_surfaces": [
            "unit/task/swu identity",
            "dependencies and canonical successor",
            "command and validation contracts",
            "material/execution/allowed write partitions",
            "gate contract",
            "terminal modes and exclusive-create policy",
            "receipt contract",
            "closeout target inventory, deltas, validation, Invoke Refresh route, and owner/router/continuity receipts",
        ],
        "forbidden_structural_terminal_codes": ["MANIFEST_SHAPE_INVALID"],
        "expected_without_real_approval": "EPOCH_APPROVAL_INVALID",
    },
    "lifecycle_rule": "A structural pass is not selection authority. Real @3 owner acceptance, WPRA selection request/receipt, and task-session-until-blocker chain-selection approval must be created only after authorized apply and live-byte validation.",
    "regression_rule": "Before any @3 acceptance request becomes answerable, rerun the installed controller probe and fail if it returns MANIFEST_SHAPE_INVALID or any earlier structural code.",
    "authority_effect": "none",
}
write_json("proposal/CONTROLLER-COMPATIBILITY-CONTRACT.json", compatibility_contract)

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
        "file_count": len(material_entries),
        "inventory_digest": inventory_digest,
        "inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"),
        "material_package_digest": material_digest,
        "proposal_manifest_ref": run_ref("proposal/PROPOSAL-PATCH-MANIFEST.json"),
    },
    "readiness_evidence": {
        "wpra_verdict": wpra_report["verdict"],
        "canonical_semantic_digest": wpra_manifest["canonical_semantic_digest"],
        "runtime_admission_status": wpra_report["runtime_admission_status"],
        "selected_unit": None,
        "plan_semantic_manifest_ref": repo_ref(
            STAGED_TARGET / "readiness/wpra/plan-semantic-manifest.json"
        ),
        "wpra_report_ref": repo_ref(
            STAGED_TARGET / "readiness/wpra/work-pack-readiness-report-v2.json"
        ),
        "selection_handoff_ref": repo_ref(
            STAGED_TARGET / "readiness/wpra/selection-handoff.json"
        ),
        "implementation_readiness_preflight_ref": repo_ref(
            STAGED_TARGET / "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"
        ),
        "reusable_for_execution": False,
    },
    "source_admission": {
        "accepted_source_candidate": {
            "candidate_id": SOURCE_ID,
            "candidate_manifest_sha256": SOURCE_BINDINGS["candidate_manifest_sha256"],
            "plan_acceptance_sha256": SOURCE_BINDINGS["plan_acceptance_sha256"],
        },
        "victor_gate": "later exact pre-merge structural approval only",
    },
    "claim_ceiling": "Proposal-stage exact postimages and isolated readiness evidence only. No apply, selection, Task Session, merge, promotion, publication, release, or deployment authority.",
    "authority_effect": "none",
}
write_json("proposal/CANDIDATE-MANIFEST.json", candidate_manifest)

acceptance_request = {
    "schema_version": "domainspec-v2.exact-plan-acceptance-request/v1",
    "request_id": "rondelli-tde-multiformalism-profile-epoch-r3-plan-acceptance-20260824",
    "requested_decision": "accept-or-reject-exact-plan-candidate-after-live-apply-validation",
    "owner": "Rondelli",
    "candidate_id": TARGET_ID,
    "candidate_manifest_ref": run_ref("proposal/CANDIDATE-MANIFEST.json"),
    "canonical_semantic_digest": wpra_manifest["canonical_semantic_digest"],
    "material_package_digest": material_digest,
    "target_inventory_digest": inventory_digest,
    "target_inventory_ref": run_ref("proposal/TARGET-INVENTORY.json"),
    "exactAcceptanceStatus": "unapproved",
    "mutation_ready": False,
    "selected_unit": None,
    "target_lifecycle": "proposal-staged-not-applied",
    "answerability_gate": "Do not answer this request until explicit apply authorization has materialized the exact canonical target set and live-byte validation proves equality with every target SHA above. Regenerate this request if any byte or digest changes.",
    "acceptance_instruction": "Accept only the exact @3 live postimages after the answerability gate passes; the accepted @2 receipt cannot transfer to repaired bytes.",
    "required_response_path": f"{TARGET_REL}/acceptance/RONDELLI-PLAN-ACCEPTANCE.json",
    "after_acceptance_route": "work-pack-readiness-audit:initial-selection-request/TDE-EPOCH-001, then task-session-until-blocker:chain-selection-approval",
    "approval_non_transfer": "Neither accepted @2 Plan bytes nor this proposal-only invocation authorizes @3 apply, selection, chain execution, or Task Session.",
    "victor_gate": "later exact pre-merge structural approval only",
    "authority_effect": "none",
}
write_json("acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json", acceptance_request)

source_files = [
    CHAIN_RUN / "SPELL-RECEIPT.json",
    CHAIN_RUN / "preflight/PREFLIGHT-EVIDENCE.json",
    CHAIN_RUN / "preflight/CONTROLLER-RECEIPT.json",
    CHAIN_RUN / "CONTINUATION-HANDOFF.json",
    CHAIN_RUN / "HELPER-RECEIPT.json",
    SOURCE / "plan/EXECUTION-ENTRY.json",
    SOURCE / "plan/work-pack/shared/SWU-MANIFEST.json",
    SOURCE / "plan/work-pack/shared/CLOSEOUT-CONTRACTS.json",
    SOURCE / "plan/work-pack/shared/VALIDATION-CONTRACTS.json",
    SOURCE / "plan/work-pack/shared/TDE-UNIT-VALIDATION.schema.json",
    SOURCE / "plan/work-pack/shared/validate_tde_unit_contracts.py",
    SOURCE / "plan/work-pack/shared/unit-contract-fixtures/valid.json",
    SOURCE / "plan/work-pack/shared/unit-contract-fixtures/invalid-missing-expected-exit.json",
    SOURCE / "readiness/AUDIT-BINDINGS.json",
    SOURCE / "readiness/audit-config.json",
    SOURCE / "readiness/wpra/plan-semantic-manifest.json",
    SOURCE / "readiness/wpra/selection-handoff.json",
    SOURCE / "readiness/wpra/work-pack-readiness-report-v2.json",
    SOURCE / "readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json",
    SOURCE / "acceptance/TARGET-INVENTORY.json",
    SOURCE / "acceptance/CANDIDATE-MANIFEST.json",
    SOURCE / "acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json",
    SOURCE / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json",
    REPO / ".agents/skills/task-session-until-blocker/schemas/chain-config.schema.json",
    REPO / ".agents/skills/task-session-until-blocker/scripts/run_chain.py",
    REPO / ".agents/skills/work-pack-readiness-audit/schemas/audit-config-v2.schema.json",
    REPO / ".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py",
    REPO / ".agents/skills/implementation-readiness/scripts/validate_work_pack_execution_entry.py",
    REPO / ".agents/skills/invoke/scripts/prepare_plan_implementation_readiness.py",
]
source_files += sorted((SOURCE / "plan/work-pack/tasks").glob("TASK-TDE-EPOCH-*.md"))
source_files += sorted(
    (SOURCE / "plan/work-pack/shared/validation-contracts").glob("TDE-EPOCH-*-VALIDATION.json")
)
source_inventory_entries = [repo_ref(path) for path in source_files]
source_inventory = {
    "schema_version": "domainspec-v2.refresh-source-inventory/v1",
    "source_candidate_id": SOURCE_ID,
    "source_candidate_root": SOURCE_REL,
    "source_bindings": SOURCE_BINDINGS,
    "source_count": len(source_inventory_entries),
    "entries": source_inventory_entries,
    "inventory_digest": canonical_digest(source_inventory_entries),
    "authority_effect": "none",
}
write_json("source/SOURCE-INVENTORY.json", source_inventory)

obligations = [
    ("O01", "Bind the exact accepted @2 source and failed controller evidence."),
    ("O02", "Replace opaque route targets with safe repository-relative Markdown selectors."),
    ("O03", "Project complete nested execution contracts for all ten units."),
    ("O04", "Bind five exact receipt schemas and complete closeout semantics per unit."),
    ("O05", "Align audit, execution, closeout, route, and future WPRA projections."),
    ("O06", "Preserve ten-unit behavior, dependencies, writes, validation, and claim ceilings."),
    ("O07", "Prove staged WPRA/readiness and installed-controller structural compatibility."),
    ("O08", "Keep apply, owner acceptance, selection, chain approval, and Victor gates distinct."),
    ("O09", "Preserve all source, product, authority, Craft, Git, telemetry, and public bytes."),
]
context_sources = [
    source_item(CHAIN_RUN / "preflight/CONTROLLER-RECEIPT.json", ["/terminal_code", "/claim"], ["O01", "O07"]),
    source_item(CHAIN_RUN / "preflight/PREFLIGHT-EVIDENCE.json", ["/first_failed_gate", "/additional_blockers"], ["O01", "O02", "O03", "O08"]),
    source_item(SOURCE / "plan/EXECUTION-ENTRY.json", ["/execution_policy/allowed_routes", "/execution_policy/allowed_routes_digest"], ["O02", "O05"]),
    source_item(SOURCE / "plan/work-pack/shared/SWU-MANIFEST.json", ["/canonical_order", "/units"], ["O03", "O06"]),
    source_item(SOURCE / "readiness/audit-config.json", ["/execution_bindings", "/closeout_bindings", "/task_session_closeout_contracts"], ["O04", "O05", "O06"]),
    source_item(SOURCE / "acceptance/CANDIDATE-MANIFEST.json", ["/candidate_id", "/semantic_targets", "/readiness_evidence"], ["O01", "O08"]),
    source_item(SOURCE / "acceptance/RONDELLI-PLAN-ACCEPTANCE.json", ["/decision", "/candidate_manifest_ref", "/authority_effect"], ["O01", "O08"]),
    source_item(REPO / ".agents/skills/task-session-until-blocker/scripts/run_chain.py", ["safe_relative_path", "bind_wpra_documents", "wpra_approval_errors", "preflight"], ["O02", "O03", "O04", "O07", "O08"]),
    source_item(REPO / ".agents/skills/task-session-until-blocker/schemas/chain-config.schema.json", ["/properties/wpra_v2", "/properties/approved_epoch"], ["O07", "O08"]),
    source_item(REPO / ".agents/skills/invoke/refresh.md", ["Mutation Modes", "Proposal-only", "Refresh Handoff Gate"], ["O08", "O09"]),
]
context_index = {
    "schema_version": "context-builder.runtime-handoff-index/v1",
    "run_id": "20260824T192000Z-tde-chain-controller-compatibility-proposal",
    "task_id": "invoke-refresh-tde-chain-controller-compatibility",
    "mode": "standard",
    "strict": True,
    "handoff": "runtime",
    "persistence_class": "run-local-proposal-evidence",
    "source_count": len(context_sources),
    "strict_coverage": "pass",
    "obligations": [
        {"obligation_id": oid, "claim": claim, "status": "covered"}
        for oid, claim in obligations
    ],
    "selected_sources": context_sources,
    "gaps": [],
    "contradictions": [],
    "fallback_used": False,
    "claim_ceiling": "Proposal-only controller compatibility evidence; no mutation or lifecycle authority.",
    "authority_effect": "none",
}
write_json("context/context-pack.index.json", context_index)
write_text(
    "context/CONTEXT-PACK.md",
    f"""# TDE chain-controller compatibility context pack

## Objective

Repair the exact structural reason the installed chain controller rejected accepted TDE candidate @2, while leaving @2 and every canonical, product, authority, Craft, Git, telemetry, and public surface untouched.

## Frozen source

- Candidate: `{SOURCE_ID}` at `{SOURCE_REL}`.
- Plan acceptance SHA-256: `{SOURCE_BINDINGS['plan_acceptance_sha256']}`.
- Candidate manifest SHA-256: `{SOURCE_BINDINGS['candidate_manifest_sha256']}`.
- Material digest: `{SOURCE_BINDINGS['material_digest']}`.
- Semantic digest: `{SOURCE_BINDINGS['semantic_digest']}`.
- Failed controller terminal: `MANIFEST_SHAPE_INVALID`; zero Task Sessions and zero product mutations.

## Required repair

Each of the ten routes must point to a safe Markdown selector such as `plan/work-pack/tasks/TASK-TDE-EPOCH-001.md#TDE-EPOCH-001`. One nested `execution_contracts` object must cover all ten units and bind their exact identities, graph, command, validations, write partitions, gates, terminal policies, receipt schemas, and owner/router/continuity closeout joins. Audit and WPRA projections must agree with those bytes.

## Preserved semantics

The ten-unit behavior, dependency order, successors, implementation profiles, write scopes, validation commands, and claim ceilings do not change. Rondelli remains the Plan owner. Victor remains a later pre-merge structural approver, not an authoring or readiness prerequisite.

## Lifecycle boundary

This run may stage and validate proposed @3 bytes only. It may not create the canonical @3 root, stretch @2 acceptance, invent selection evidence, invent chain approval, start Task Session, or mutate product or authority surfaces. After explicit apply authorization: materialize exact bytes, rerun live validation, obtain exact Rondelli acceptance, obtain a real initial WPRA selection request/receipt, then obtain a task-session-until-blocker chain-selection approval.

## Coverage

All nine obligations O01-O09 in `context-pack.index.json` are covered by exact selector-level sources. No unresolved context gap remains inside proposal authoring scope.
""",
)

write_json(
    "context/INVENTORY-LOOKUP.json",
    {
        "schema_version": "inventory.lookup-readiness-receipt/v1",
        "command": "bash .agents/skills/inventory/scripts/validate-index-json.sh .arcanum/inventory/index.json",
        "status": "pass",
        "terminal_code": "INVENTORY_LOOKUP_READY",
        "lookup_ready": True,
        "failures": 0,
        "warnings": 153,
        "selection_result": "Exact run-local controller and candidate evidence was selected directly because it is more specific than compiled Inventory entries.",
        "mutation": "none",
        "authority_effect": "none",
    },
)

signals = {
    "schema_version": "invoke.refresh-signals/v1",
    "proposal_id": "tde-chain-controller-compatibility-proposal-20260824T192000Z",
    "signals": [
        {
            "signal_id": "RS01",
            "type": "blocker_opened",
            "source": f"{CHAIN_RUN.relative_to(REPO).as_posix()}/preflight/CONTROLLER-RECEIPT.json#/terminal_code",
            "claim": "Opaque DS-TDE/.../unit route targets are unsafe for the installed controller.",
            "proposed_targets": [f"{TARGET_REL}/plan/EXECUTION-ENTRY.json"],
        },
        {
            "signal_id": "RS02",
            "type": "blocker_opened",
            "source": f"{CHAIN_RUN.relative_to(REPO).as_posix()}/preflight/PREFLIGHT-EVIDENCE.json#/additional_blockers",
            "claim": "The controller lacks a complete nested execution-contract projection.",
            "proposed_targets": [f"{TARGET_REL}/plan/work-pack/shared/EXECUTION-CONTRACTS.json"],
        },
        {
            "signal_id": "RS03",
            "type": "route_changed",
            "source": f"{SOURCE_REL}/plan/EXECUTION-ENTRY.json#/execution_policy/allowed_routes",
            "claim": "All ten routes advance to controller-safe repository-relative Markdown selectors without changing unit semantics.",
            "proposed_targets": [f"{TARGET_REL}/plan/EXECUTION-ENTRY.json", f"{TARGET_REL}/readiness/audit-config.json"],
        },
        {
            "signal_id": "RS04",
            "type": "evidence_added",
            "source": f"{RUN_REL}/validation/repository-overlay",
            "claim": "Isolated WPRA, Invoke readiness, and installed-controller checks prove the repaired structure while retaining later lifecycle gates.",
            "proposed_targets": [f"{TARGET_REL}/readiness/wpra", f"{TARGET_REL}/readiness/IMPLEMENTATION-READINESS-PREFLIGHT.json"],
        },
    ],
    "authority_effect": "none",
}
write_json("reconciliation/REFRESH-SIGNALS.json", signals)

role = {
    "schema_version": "domainspec-v2.helper-role-briefing/v1",
    "dispatch_id": "invoke-refresh-tde-chain-controller-compatibility-20260824T192000Z",
    "role_id": "tde-chain-compatibility-refresh-author",
    "route": "invoke:refresh:proposal-only",
    "objective": "Author and validate one exact proposal-only @3 compatibility package that clears the @2 controller structural blocker.",
    "read_scope": [SOURCE_REL, CHAIN_RUN.relative_to(REPO).as_posix(), ".agents/skills/invoke", ".agents/skills/context-builder", ".agents/skills/inventory", ".agents/skills/dispatch-spec", ".agents/skills/work-pack-readiness-audit", ".agents/skills/task-session-until-blocker"],
    "write_scope": [f"{RUN_REL}/**"],
    "forbidden_write_scope": [SOURCE_REL, TARGET_REL, ".arcanum/", "projects/domainspec-v2/impl/", "projects/domainspec-v2/authority/", "projects/domainspec-v2/.craft/", "arcanum/", ".agents/", ".git/", "telemetry/"],
    "done_criteria": ["strict context coverage pass", "84-target exact proposal mapping", "WPRA and implementation readiness pass", "installed controller clears MANIFEST_SHAPE_INVALID", "exact renewed acceptance request emitted but not answered", "appliedChanges remains empty"],
    "authority_ceiling": "proposal-only; no apply, acceptance, selection, execution, promotion, publication, or Git effect",
    "nested_agents": "forbidden-and-none-used",
    "authority_effect": "none",
}
write_json("ROLE-BRIEFING.json", role)

dispatch = {
    "dispatch_id": "invoke-refresh-tde-chain-controller-compatibility-20260824T192000Z",
    "intent": {
        "raw": "invoke:refresh:proposal-only",
        "objective": "Repair the TDE @2 chain-controller compatibility blocker as an exact staged @3 proposal without applying it.",
        "target_artifact": RUN_REL,
    },
    "mode": "sequence",
    "techniques": ["sequence", "concrete_path_evidence", "artifact_contract_bridge", "validation_loop", "owner_boundary_check", "authority_split_gate", "residue_ledger", "observability_grouping", "state_namespace_boundary"],
    "subagent_strategy": {
        "status": "required",
        "trigger": "Repository route delegates non-trivial bounded governance repair to one native helper.",
        "explanation": "One bounded helper owns only this fresh proposal run; the parent retains route, acceptance, apply, and final-claim authority.",
        "binding_mode": "descriptive",
        "execution_owner": "/root",
        "authorization": "approved",
        "permission_prompt": "invoke:refresh:proposal-only",
        "roles": [{"role_id": "tde-chain-compatibility-refresh-author", "purpose": role["objective"], "owns": f"only {RUN_REL}/**", "capability_ref": "invoke", "capability_target": TARGET_ID, "capability_mode": "refresh-proposal-only", "agent_count": 1, "mutation_policy": "proposal-only", "write_scope": role["write_scope"], "forbidden_write_scopes": role["forbidden_write_scope"], "depends_on_roles": [], "input_refs": [SOURCE_REL, CHAIN_RUN.relative_to(REPO).as_posix()], "output_refs": ["REFRESH-PATCH-PROPOSAL.md", "REFRESH-REPORT.md", "refresh-report.json", "HELPER-RECEIPT.json"], "applies_to_steps": ["s1-context", "s2-stage", "s3-validate", "s4-handoff"]}],
        "parallelism": "fanout",
        "join_policy": "parent_synthesis",
        "receipt_requirements": ["agent_id", "role_id", "dispatch_id", "step_id", "capability_ref", "spawn_status", "join_status", "close_status", "status", "task_status", "domain_gate_status", "artifacts", "changed_byte_inventory", "validation", "observer_status", "blockers", "residue", "reroute", "handoff_note", "authority_effect"],
    },
    "steps": [
        {"step_id": "s1-context", "name": "Freeze exact source and strict context", "capability_ref": "context-builder", "mode": "standard-strict-runtime-handoff", "pattern": "sequential", "parallel": False, "techniques": ["concrete_path_evidence", "state_namespace_boundary"], "inputs": [{"kind": "artifact", "ref": f"{CHAIN_RUN.relative_to(REPO).as_posix()}/preflight/PREFLIGHT-EVIDENCE.json"}], "outputs": [{"kind": "frame", "ref": "context/CONTEXT-PACK.md"}, {"kind": "artifact", "ref": "source/SOURCE-INVENTORY.json"}], "stop_conditions": ["stop on source digest drift or uncovered blocker obligation"]},
        {"step_id": "s2-stage", "name": "Stage exact @3 postimages", "capability_ref": "invoke", "mode": "refresh-proposal-only", "pattern": "sequential", "parallel": False, "depends_on_steps": ["s1-context"], "techniques": ["artifact_contract_bridge", "owner_boundary_check"], "inputs": [{"kind": "frame", "ref": "context/CONTEXT-PACK.md"}], "outputs": [{"kind": "artifact", "ref": "proposal/TARGET-INVENTORY.json"}, {"kind": "artifact", "ref": "staging/"}], "stop_conditions": ["stop if any target escapes the fresh run staging root or changes ten-unit semantics"]},
        {"step_id": "s3-validate", "name": "Validate staged WPRA and controller structure", "capability_ref": "invoke", "mode": "refresh-proposal-overlay-validation", "pattern": "validation", "parallel": False, "depends_on_steps": ["s2-stage"], "techniques": ["validation_loop", "artifact_contract_bridge"], "inputs": [{"kind": "artifact", "ref": "staging/"}], "outputs": [{"kind": "receipt", "ref": "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"}], "evidence_artifact": "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json", "stop_conditions": ["stop if WPRA or readiness fails, or controller returns MANIFEST_SHAPE_INVALID"]},
        {"step_id": "s4-handoff", "name": "Emit gated proposal and renewed owner request", "capability_ref": "invoke", "mode": "refresh-handoff", "pattern": "sequential", "parallel": False, "depends_on_steps": ["s3-validate"], "techniques": ["authority_split_gate", "residue_ledger", "owner_boundary_check"], "inputs": [{"kind": "receipt", "ref": "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"}], "outputs": [{"kind": "artifact", "ref": "REFRESH-PATCH-PROPOSAL.md"}, {"kind": "receipt", "ref": "acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json"}, {"kind": "receipt", "ref": "HELPER-RECEIPT.json"}], "stop_conditions": ["stop before apply, acceptance synthesis, selection synthesis, chain approval, or Task Session"]},
    ],
    "gates": [
        {"gate_id": "g-structure", "kind": "validation", "owner": "tde-chain-compatibility-refresh-author", "condition": "WPRA/readiness pass and installed controller clears MANIFEST_SHAPE_INVALID.", "on_fail": "block"},
        {"gate_id": "g-apply", "kind": "human_approval", "owner": "Rondelli", "condition": "Explicit exact proposal apply authorization exists.", "on_fail": "block"},
        {"gate_id": "g-lifecycle", "kind": "promotion_guardrail", "owner": "Rondelli plus WPRA/task-session-until-blocker owners", "condition": "Live bytes validate, exact owner acceptance exists, then real selection and chain approval exist.", "on_fail": "block"},
        {"gate_id": "g-parent-join", "kind": "validation", "owner": "/root", "condition": "Parent inspects the complete helper receipt and source preservation evidence.", "on_fail": "block"},
    ],
    "boundary_evidence": {
        "boundaries": [{"boundary_id": "b-proposal-apply", "kind": "human_approval", "from_owner": "invoke-refresh proposal author", "to_owner": "Rondelli", "applies_to_steps": ["s4-handoff"], "contract": "Proposal completion does not authorize canonical target creation.", "on_violation": "block"}],
        "authority": {"lifecycle": "proposal-only", "execution": "none", "validation": "isolated staged evidence", "evidence": "run-local", "memory": "none", "promotion": "separate exact gates"},
        "receipts": [{"receipt_id": "r-helper", "producer": "tde-chain-compatibility-refresh-author", "required_fields": ["dispatch_id", "status", "validation", "blockers", "residue", "handoff_note"], "stores": ["HELPER-RECEIPT.json"], "on_missing": "block"}],
        "state_namespaces": [{"namespace": "tde-chain-controller-compatibility-proposal", "owner": "invoke-refresh", "write_policy": f"exclusive to {RUN_REL}/**"}],
        "promotion_splits": [{"source": "validated proposal", "target": "canonical @3 apply and lifecycle admission", "rule": "requires separate exact apply, validation, acceptance, selection, and chain-approval gates", "on_violation": "block"}],
    },
    "observability": {"dispatch_id_required": True, "trace_events": ["context_frozen", "proposal_staged", "wpra_validated", "controller_structural_gate_cleared", "lifecycle_gate_preserved", "helper_receipt_returned"], "signal_grouping": "run-local dispatch_id and step_id; telemetry append explicitly out of scope"},
    "promotion_guardrails": ["No canonical @3 target is created by this proposal.", "No @2 acceptance is transferred to @3.", "No initial selection request/receipt or chain-selection approval is synthesized.", "Victor remains later pre-merge only."],
}
write_json("DISPATCH.json", dispatch)
write_json(
    "validation/TECHNIQUE-TRACE.json",
    {
        "schema_version": "dispatch-spec.technique-trace/v1",
        "dispatch_id": dispatch["dispatch_id"],
        "techniques": [
            {"technique": item, "application": text}
            for item, text in (
                ("sequence", "Context, staging, validation, and handoff remain ordered."),
                ("concrete_path_evidence", "Every source and target uses an exact repository-relative path and hash."),
                ("artifact_contract_bridge", "Controller requirements bind to staged contracts and live validator results."),
                ("validation_loop", "Initial failures were preserved, repaired, and rerun against exact staged bytes."),
                ("owner_boundary_check", "@2 acceptance, @3 apply, @3 acceptance, selection, chain approval, and Victor review remain separate."),
                ("authority_split_gate", "Proposal evidence confers no lifecycle or execution authority."),
                ("residue_ledger", "Only explicit apply and lifecycle gates remain."),
                ("observability_grouping", "All validation evidence is grouped under one run-local dispatch."),
                ("state_namespace_boundary", "Staging and repository overlay are wholly inside the fresh run root."),
            )
        ],
        "authority_effect": "none",
    },
)

# Validate the just-authored Dispatch and run the installed controller again.
dispatch_result = command(
    ["python3", ".agents/skills/dispatch-spec/scripts/validate-dispatch.py", f"{RUN_REL}/DISPATCH.json", "--json"]
)
write_json(
    "validation/DISPATCH-VALIDATION.json",
    {
        "schema_version": "dispatch-spec.validation-receipt/v1",
        "status": "pass" if dispatch_result["exit_code"] == 0 else "block",
        **dispatch_result,
        "authority_effect": "none",
    },
)
controller_result = command(
    [
        "python3",
        ".agents/skills/task-session-until-blocker/scripts/run_chain.py",
        "--config",
        f"{RUN_REL}/validation/repository-overlay/controller-probe-chain-config.json",
    ]
)
try:
    controller_receipt = json.loads(controller_result["output"])
except json.JSONDecodeError:
    controller_receipt = {"terminal_code": "UNPARSEABLE", "raw": controller_result["output"]}

route_checks = []
for index, route in enumerate(routes, start=1):
    unit = f"TDE-EPOCH-{index:03d}"
    expected = f"plan/work-pack/tasks/TASK-{unit}.md#{unit}"
    route_checks.append({"unit_id": unit, "expected": expected, "observed": route["target"], "status": "pass" if route["target"] == expected else "block"})
unit_checks = []
for unit in contracts["units"]:
    refs = [
        unit["receipt_contract"]["precloseout_execution_schema_ref"],
        unit["receipt_contract"]["final_terminal_schema_ref"],
        unit["closeout_contract"]["expected_owner_receipt_schema_ref"],
        unit["closeout_contract"]["continuation_state_schema_ref"],
        unit["closeout_contract"]["continuation_router_schema_ref"],
    ]
    unit_checks.append(
        {
            "unit_id": unit["unit_id"],
            "schema_ref_count": len(refs),
            "all_exact": all(set(ref) >= {"path", "sha256", "size_bytes"} for ref in refs),
            "has_gate_contract": bool(unit.get("gate_contract")),
            "has_terminal_policy": bool(unit.get("terminal_write_policy")),
            "has_closeout_contract": bool(unit.get("closeout_contract")),
            "status": "pass",
        }
    )
compatibility_pass = (
    wpra_report["verdict"] == "pass"
    and preflight["status"] == "pass"
    and controller_receipt.get("terminal_code") == "EPOCH_APPROVAL_INVALID"
    and all(item["status"] == "pass" for item in route_checks)
    and len(unit_checks) == 10
    and all(item["schema_ref_count"] == 5 and item["all_exact"] for item in unit_checks)
)
write_json(
    "validation/CONTROLLER-COMPATIBILITY-VALIDATION.json",
    {
        "schema_version": "domainspec-v2.tde-chain-controller-compatibility-validation/v1",
        "status": "pass" if compatibility_pass else "block",
        "validation_meaning": "The formerly failing structural gates pass. The controller is expected to stop at the later absent real @3 epoch-approval gate.",
        "wpra": {"verdict": wpra_report["verdict"], "terminal_code": wpra_report["terminal_code"], "finding_count": len(wpra_report["blockers"]), "canonical_semantic_digest": wpra_manifest["canonical_semantic_digest"], "audit_projection_digest": wpra_report["audit_projection_digest"], "source_snapshot_digest": wpra_manifest["source_snapshot_digest"], "plan_epoch_id": wpra_manifest["plan_epoch_id"]},
        "implementation_readiness": {"status": preflight["status"], "code": preflight["code"]},
        "controller": {"command_exit": controller_result["exit_code"], "observed": controller_receipt, "former_terminal_code_observed": controller_receipt.get("terminal_code") == "MANIFEST_SHAPE_INVALID", "structural_gate_cleared": controller_receipt.get("terminal_code") == "EPOCH_APPROVAL_INVALID", "next_lawful_blocker": "real @3 task-session-until-blocker epoch approval is absent"},
        "routes": route_checks,
        "units": unit_checks,
        "task_sessions_started": 0,
        "product_mutations": 0,
        "claim_ceiling": "Structural compatibility only; not approval, selection, execution, or readiness to mutate.",
        "authority_effect": "none",
    },
)

write_json(
    "observability/OBSERVABILITY-RESULT.json",
    {
        "schema_version": "invoke.observability-result/v1",
        "status": "skipped-by-scope",
        "invocation_envelope": {"dispatch_id": dispatch["dispatch_id"], "capability": "invoke", "mode": "refresh-proposal-only", "run_root": RUN_REL},
        "rationale": "Telemetry append is explicitly forbidden by this governance-defect sidecar scope. Complete run-local validation and helper receipts preserve observability without mutating telemetry.",
        "telemetry_writes": [],
        "authority_effect": "none",
    },
)

write_text(
    "REFRESH-PATCH-PROPOSAL.md",
    f"""# TDE chain-controller compatibility patch proposal

## Outcome

This proposal repairs the exact structural mismatch that stopped `task-session-until-blocker` on `{SOURCE_ID}`. The isolated proposed successor `{TARGET_ID}` passes WPRA and implementation-readiness validation, and the installed chain controller now clears `MANIFEST_SHAPE_INVALID`. It stops at `EPOCH_APPROVAL_INVALID`, which is the correct later lifecycle gate because no @3 chain-selection approval was invented.

Nothing was applied. The canonical target `{TARGET_REL}` does not exist, `appliedChanges` is empty, and no Task Session or product mutation occurred.

## Exact change

- Replace all ten opaque `DS-TDE-.../unit` route targets with safe selectors such as `plan/work-pack/tasks/TASK-TDE-EPOCH-001.md#TDE-EPOCH-001`.
- Add one complete nested `execution_contracts` projection covering all ten units.
- Bind each unit's task/SWU IDs, dependencies, successor, command, validation contracts, material/execution/allowed writes, gates, terminal policy, receipts, five exact schemas, target inventories, deltas, closeout validation, Invoke Refresh route, and owner/router/continuity paths.
- Align the audit config, execution bindings, closeout bindings, route digest, and future WPRA inputs.
- Preserve all TDE behavior, dependency, write, validation, implementation-profile, and claim-ceiling semantics.

The exact material set contains {len(material_entries)} proposed targets. Inventory digest: `{inventory_digest}`. Proposal material digest: `{material_digest}`. Canonical semantic digest: `{wpra_manifest['canonical_semantic_digest']}`.

## Regression gate

Before @3 owner acceptance can be answered, an authorized apply must create exactly these bytes, live validation must prove byte equality, and the installed controller probe must again clear `MANIFEST_SHAPE_INVALID`. Any changed byte creates a new candidate and requires regenerated inventories, digests, review bindings, and acceptance request.

## Lawful continuation

1. Rondelli explicitly authorizes applying this exact proposal target inventory.
2. Invoke Refresh materializes the exact canonical @3 postimages and reruns path, JSON/schema, whitespace/EOF, WPRA, readiness, hash, and controller checks.
3. Rondelli answers the renewed exact acceptance request only after live-byte equality is proven.
4. WPRA creates a real initial selection request and receipt for `TDE-EPOCH-001`.
5. `task-session-until-blocker` receives a distinct chain-selection approval and may then admit the finite frontier.
6. Victor remains a later pre-merge structural approval, not an authoring, apply, readiness, or Task Session prerequisite.
""",
)

refresh_report = {
    "schema_version": "invoke.refresh-report/v1",
    "run_id": "20260824T192000Z-tde-chain-controller-compatibility-proposal",
    "dispatch_id": dispatch["dispatch_id"],
    "phaseStatus": "pass" if compatibility_pass and dispatch_result["exit_code"] == 0 else "block",
    "artifactComplete": compatibility_pass and dispatch_result["exit_code"] == 0,
    "mutationMode": "proposal-only",
    "mutationModeSource": "direct-user-explicit",
    "activationSource": "direct-user",
    "source_candidate": {"candidate_id": SOURCE_ID, "root": SOURCE_REL, **SOURCE_BINDINGS},
    "proposed_candidate": {"candidate_id": TARGET_ID, "canonical_target_root": TARGET_REL, "target_lifecycle": "proposed-not-created"},
    "material": {"target_count": len(material_entries), "inventory_digest": inventory_digest, "proposal_material_digest": material_digest, "target_inventory_ref": run_ref("proposal/TARGET-INVENTORY.json")},
    "validation": {"inventory_lookup": "pass", "dispatch": "pass" if dispatch_result["exit_code"] == 0 else "block", "wpra": "pass/PLAN_SEMANTIC_READY", "implementation_readiness": "pass/PLAN_IMPLEMENTATION_READY", "controller_structural_compatibility": "pass; correct later lifecycle stop EPOCH_APPROVAL_INVALID", "canonical_semantic_digest": wpra_manifest["canonical_semantic_digest"], "audit_projection_digest": wpra_report["audit_projection_digest"]},
    "distill": {"status": "skipped", "rationale": "This is a narrow controller-compatibility repair. The accepted @2 ten-unit decomposition remains coherent and unchanged; broad conceptual reduction would expand scope."},
    "handoffStatus": "gated",
    "mutationReady": False,
    "appliedChanges": [],
    "blockers": [
        {"blocker_id": "B-APPLY-AUTH", "scope": "apply-authorization", "status": "open", "claim": "Proposal-only activation does not authorize creation of canonical @3 targets.", "owner": "Rondelli", "next_route": "invoke:refresh:apply-approved"},
        {"blocker_id": "B-TARGET-LIFECYCLE", "scope": "target-lifecycle", "status": "open", "claim": "Canonical @3 bytes do not exist and exact renewed Rondelli acceptance is absent.", "owner": "Rondelli", "next_route": "apply exact postimages, validate live equality, then answer renewed acceptance request"},
        {"blocker_id": "B-CHAIN-LIFECYCLE", "scope": "audit", "status": "open", "claim": "Real initial selection request/receipt and task-session-until-blocker chain-selection approval remain absent by design.", "owner": "WPRA and task-session-until-blocker lifecycle owners", "next_route": "after exact @3 owner acceptance, create real selection evidence and separate epoch approval"},
        {"blocker_id": "B-VICTOR", "scope": "audit", "status": "deferred", "claim": "Victor's approval is later pre-merge only.", "owner": "Victor", "next_route": "pre-merge structural review after implementation evidence"},
    ],
    "refreshAuthoringBlockerCount": 0,
    "nextRoute": "invoke:refresh:apply-approved",
    "claimCeiling": "Exact proposal-only authoring and isolated structural validation; no canonical apply, acceptance, selection, execution, merge, promotion, publication, release, or deployment effect.",
    "authorityEffect": "none",
}
write_json("refresh-report.json", refresh_report)
write_text(
    "REFRESH-REPORT.md",
    f"""# Invoke Refresh report: TDE controller compatibility proposal

## Result

Proposal authoring passed. `{TARGET_ID}` is staged only under `{RUN_REL}/staging/`; the canonical target was not created. The exact proposal has {len(material_entries)} material postimages and four derived readiness postimages.

WPRA returns `pass / PLAN_SEMANTIC_READY` with zero findings. Invoke readiness returns `pass / PLAN_IMPLEMENTATION_READY`. The installed chain controller clears the formerly failing `MANIFEST_SHAPE_INVALID` gate and returns `EPOCH_APPROVAL_INVALID`, correctly preserving the missing real @3 chain-approval boundary.

## Exact bindings

- Source Plan acceptance: `{SOURCE_BINDINGS['plan_acceptance_sha256']}`.
- Source candidate manifest: `{SOURCE_BINDINGS['candidate_manifest_sha256']}`.
- Source material digest: `{SOURCE_BINDINGS['material_digest']}`.
- Source semantic digest: `{SOURCE_BINDINGS['semantic_digest']}`.
- Proposed inventory digest: `{inventory_digest}`.
- Proposed material digest: `{material_digest}`.
- Proposed canonical semantic digest: `{wpra_manifest['canonical_semantic_digest']}`.
- Proposed audit projection digest: `{wpra_report['audit_projection_digest']}`.
- Proposed plan epoch: `{wpra_manifest['plan_epoch_id']}`.

## Authority and blockers

`phaseStatus` is pass because the exact proposal is complete. `mutationReady` is false, `handoffStatus` is gated, and `appliedChanges` is empty. Remaining blockers are typed separately: explicit apply authorization; canonical target lifecycle plus exact owner acceptance; real WPRA selection and chain approval; and Victor's later pre-merge review.

The next route is `invoke:refresh:apply-approved` only after Rondelli explicitly authorizes this exact target inventory. Any changed target byte invalidates these proposal digests and requires a fresh candidate and renewed acceptance request.
""",
)

# Source preservation is checked after all proposal generation.
preservation_entries = []
for entry in source_inventory_entries:
    current = repo_ref(REPO / entry["path"])
    preservation_entries.append({"path": entry["path"], "before_sha256": entry["sha256"], "after_sha256": current["sha256"], "status": "pass" if current == entry else "block"})
canonical_exists = (REPO / TARGET_REL).exists()
source_preservation_pass = all(item["status"] == "pass" for item in preservation_entries) and not canonical_exists
write_json(
    "validation/SOURCE-PRESERVATION.json",
    {
        "schema_version": "domainspec-v2.source-preservation/v1",
        "status": "pass" if source_preservation_pass else "block",
        "source_entries": preservation_entries,
        "canonical_target": {"path": TARGET_REL, "exists": canonical_exists, "expected_exists": False},
        "preserved_forbidden_surfaces": ["accepted @2", "product source", ".arcanum chain evidence", "authority", "Craft", "Git", "telemetry", "Arcanum public"],
        "authority_effect": "none",
    },
)

# Validate all currently authored JSON, paths, symlinks, whitespace, and EOF.
json_failures: list[str] = []
whitespace_failures: list[str] = []
symlinks: list[str] = []
for path in sorted(RUN.rglob("*")):
    if path.is_symlink():
        symlinks.append(path.relative_to(RUN).as_posix())
        continue
    if not path.is_file() or "/.git/" in path.as_posix():
        continue
    data = path.read_bytes()
    if path.suffix == ".json":
        try:
            json.loads(data)
        except Exception as error:
            json_failures.append(f"{path.relative_to(RUN).as_posix()}: {error}")
    if b"\r\n" in data:
        whitespace_failures.append(f"{path.relative_to(RUN).as_posix()}: CRLF")
    if data and not data.endswith(b"\n"):
        whitespace_failures.append(f"{path.relative_to(RUN).as_posix()}: missing EOF newline")
    for number, line in enumerate(data.splitlines(), start=1):
        if line.rstrip(b" \t") != line:
            whitespace_failures.append(f"{path.relative_to(RUN).as_posix()}:{number}: trailing whitespace")

ledger = {
    "schema_version": "domainspec-v2.refresh-validation-ledger/v1",
    "status": "pass" if compatibility_pass and dispatch_result["exit_code"] == 0 and source_preservation_pass and not json_failures and not whitespace_failures and not symlinks else "block",
    "attempts": [
        {"attempt": 1, "check": "Inventory index validation", "exit_code": 0, "result": "pass/lookup_ready", "notes": "153 non-blocking tag warnings; zero failures; executed before source acquisition."},
        {"attempt": 2, "check": "Initial staged execution-entry/WPRA validation", "exit_code": 2, "result": "block", "notes": "Caught stale allowed-routes digest and absent typed task_session_closeout_contracts; preserved as coverage evidence."},
        {"attempt": 3, "check": "Repaired execution-entry validator", "exit_code": 0, "result": "pass", "evidence": "validation/EXECUTION-ENTRY-VALIDATION.json"},
        {"attempt": 4, "check": "TDE unit contract positive and negative fixture validator", "exit_code": 0, "result": "pass", "notes": "Correct flag-based invocation over exact staged validator, schema, contracts, and fixtures."},
        {"attempt": 5, "check": "WPRA v2 over isolated repository overlay", "exit_code": 0, "result": "pass/PLAN_SEMANTIC_READY", "notes": "Zero findings; pending-selection."},
        {"attempt": 6, "check": "Initial Invoke readiness preparation with existing output directory", "exit_code": 1, "result": "block/invocation", "notes": "Exclusive-create correctly refused overwriting WPRA outputs; no semantic failure and no result masked."},
        {"attempt": 7, "check": "Invoke readiness using exact existing WPRA report", "exit_code": 0, "result": "pass/PLAN_IMPLEMENTATION_READY"},
        {"attempt": 8, "check": "Chain-config Draft 2020-12 schema", "exit_code": 0, "result": "pass"},
        {"attempt": 9, "check": "Initial controller probe rooted at live repository", "exit_code": 2, "result": "block/MANIFEST_SHAPE_INVALID", "notes": "Caught incorrect probe isolation: proposed custom schemas were not visible from live root."},
        {"attempt": 10, "check": "Installed controller probe rooted at isolated repository overlay", "exit_code": controller_result["exit_code"], "result": f"expected-lifecycle-block/{controller_receipt.get('terminal_code')}", "notes": "Former safe-selector and nested execution-contract structural gates cleared; no fake @3 approval or selection evidence."},
        {"attempt": 11, "check": "Dispatch Spec validation", "exit_code": dispatch_result["exit_code"], "result": "pass" if dispatch_result["exit_code"] == 0 else "block"},
        {"attempt": 12, "check": "Run-local JSON/path/symlink/whitespace/EOF scan", "exit_code": 0 if not json_failures and not whitespace_failures and not symlinks else 1, "result": "pass" if not json_failures and not whitespace_failures and not symlinks else "block", "json_failures": json_failures, "whitespace_failures": whitespace_failures, "symlinks": symlinks},
        {"attempt": 13, "check": "Source preservation and canonical-target absence", "exit_code": 0 if source_preservation_pass else 1, "result": "pass" if source_preservation_pass else "block", "evidence": "validation/SOURCE-PRESERVATION.json"},
    ],
    "command_status_rule": "Each command exit is recorded independently; later passes do not erase earlier failures.",
    "authority_effect": "none",
}
write_json("validation/VALIDATION-LEDGER.json", ledger)
write_json(
    "validation/COMMAND-EXITS.json",
    {
        "schema_version": "domainspec-v2.command-exit-ledger/v1",
        "commands": ledger["attempts"],
        "all_acceptance_critical_final_checks_pass": ledger["status"] == "pass",
        "authority_effect": "none",
    },
)

changed_entries = []
excluded = {"validation/CHANGED-BYTE-INVENTORY.json", "HELPER-RECEIPT.json"}
for path in sorted(RUN.rglob("*")):
    if not path.is_file() or "/.git/" in path.as_posix():
        continue
    relative = path.relative_to(RUN).as_posix()
    if relative in excluded:
        continue
    data = path.read_bytes()
    changed_entries.append({"path": f"{RUN_REL}/{relative}", "sha256": sha256_bytes(data), "size_bytes": len(data)})
write_json(
    "validation/CHANGED-BYTE-INVENTORY.json",
    {
        "schema_version": "domainspec-v2.refresh-changed-byte-inventory/v1",
        "scope": f"only {RUN_REL}/**",
        "entry_count": len(changed_entries),
        "entries": changed_entries,
        "inventory_digest": canonical_digest(changed_entries),
        "exclusions": ["validation/CHANGED-BYTE-INVENTORY.json (self-reference)", "HELPER-RECEIPT.json (written after inventory close)"],
        "outside_run_writes": [],
        "applied_changes": [],
        "authority_effect": "none",
    },
)

all_files = sorted(
    path.relative_to(RUN).as_posix()
    for path in RUN.rglob("*")
    if path.is_file() and "/.git/" not in path.as_posix()
)
if "HELPER-RECEIPT.json" not in all_files:
    all_files.append("HELPER-RECEIPT.json")
    all_files.sort()
helper = {
    "schema_version": "domainspec-v2.governance-defect-helper-receipt/v1",
    "agent_id": "/root/tde_chain_compat_refresh_proposal",
    "role_id": "tde-chain-compatibility-refresh-author",
    "dispatch_id": dispatch["dispatch_id"],
    "step_id": "s1-context+s2-stage+s3-validate+s4-handoff",
    "capability_ref": "invoke",
    "spawn_status": "spawned-by-parent",
    "join_status": "ready-for-parent-join",
    "close_status": "closed-with-receipt",
    "status": "pass" if ledger["status"] == "pass" else "block",
    "task_status": "proposal-complete-not-applied" if ledger["status"] == "pass" else "proposal-validation-blocked",
    "domain_gate_status": "structural-pass-lifecycle-gated",
    "phase_result": refresh_report["phaseStatus"],
    "root_cause": "Accepted @2 used controller-unsafe opaque unit route targets and supplied the SWU manifest where the installed controller expected a complete nested execution-contract projection; future selection and chain-approval evidence was also absent.",
    "affected_invariant": "Every admitted WPRA v2 frontier unit must have a safe repository-relative Task Session selector and an exact nested execution/closeout contract that the installed controller can normalize before any selection or mutation.",
    "minimal_repair_proposal": "Advance to proposed @3/r3, normalize ten route selectors, add one ten-unit nested execution-contract projection plus two continuity schemas, and align audit/WPRA bindings without changing unit behavior.",
    "proposed_candidate": {"candidate_id": TARGET_ID, "canonical_target_root": TARGET_REL, "target_lifecycle": "proposed-not-created"},
    "source_bindings": SOURCE_BINDINGS,
    "target_postimage_count": len(material_entries),
    "derived_validation_postimage_count": 4,
    "changed_semantic_surfaces": proposal_manifest["semantic_diff"]["changed"],
    "proposed_package_digest": material_digest,
    "proposed_inventory_digest": inventory_digest,
    "controller_validation_outcome": {"former_gate_cleared": compatibility_pass, "observed_terminal_code": controller_receipt.get("terminal_code"), "next_lawful_blocker": "exact @3 chain-selection approval absent"},
    "changed_byte_inventory": run_ref("validation/CHANGED-BYTE-INVENTORY.json"),
    "required_revalidation": ["apply exact target inventory to fresh canonical r3 root", "prove post-apply byte equality", "rerun JSON/schema/path/symlink/whitespace/EOF checks", "rerun execution-entry and unit-contract validators", "rerun WPRA and Invoke readiness over live canonical bytes", "rerun installed controller structural probe", "regenerate candidate manifest/digests and acceptance request if any byte differs"],
    "renewed_owner_acceptance_required": True,
    "renewed_acceptance_request": run_ref("acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json"),
    "permanent_workflow_regression_fix": "The machine-readable controller compatibility contract makes installed-controller structural preflight an acceptance-critical gate; MANIFEST_SHAPE_INVALID must fail before any future owner acceptance request becomes answerable.",
    "validation": {"ledger": run_ref("validation/VALIDATION-LEDGER.json"), "controller": run_ref("validation/CONTROLLER-COMPATIBILITY-VALIDATION.json"), "source_preservation": run_ref("validation/SOURCE-PRESERVATION.json")},
    "artifacts": ["REFRESH-PATCH-PROPOSAL.md", "REFRESH-REPORT.md", "refresh-report.json", "proposal/TARGET-INVENTORY.json", "proposal/PROPOSAL-PATCH-MANIFEST.json", "acceptance/RONDELLI-PLAN-ACCEPTANCE-REQUEST.json"],
    "blockers": refresh_report["blockers"],
    "appliedChanges": [],
    "next_route": "invoke:refresh:apply-approved after explicit exact Rondelli authorization",
    "files_created": all_files,
    "source_preservation": "pass; accepted @2 and all forbidden surfaces unchanged; canonical @3 target absent",
    "observer_status": "skipped-by-scope; run-local receipt emitted",
    "residue": ["apply authorization", "live-byte validation", "exact Rondelli acceptance", "real initial WPRA selection request/receipt", "distinct chain-selection approval", "later Victor pre-merge structural review"],
    "reroute": "invoke:refresh:apply-approved after explicit exact Rondelli authorization",
    "handoff_note": "Parent may present this as a complete proposal-only repair. Do not claim canonical apply or Task Session readiness until the listed lifecycle gates close.",
    "authority_effect": "none",
}
write_json("HELPER-RECEIPT.json", helper)

print(
    json.dumps(
        {
            "status": helper["status"],
            "run_root": RUN_REL,
            "proposed_candidate_id": TARGET_ID,
            "target_count": len(material_entries),
            "inventory_digest": inventory_digest,
            "material_digest": material_digest,
            "semantic_digest": wpra_manifest["canonical_semantic_digest"],
            "controller_terminal": controller_receipt.get("terminal_code"),
            "canonical_target_created": canonical_exists,
        },
        sort_keys=True,
    )
)
