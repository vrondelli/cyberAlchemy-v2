#!/usr/bin/env python3
"""Build strict context, serial dispatch, and Distill-skip evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[5]
RUN = Path(__file__).resolve().parent


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact(relative: str, selectors: list[str], obligations: list[str]) -> dict:
    path = ROOT / relative
    return {
        "path": relative,
        "sha256": digest(path),
        "size_bytes": path.stat().st_size,
        "selectors": selectors,
        "obligations": obligations,
    }


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n")


def main() -> int:
    base = (
        "cyberAlchemy-v2/development/ontology-evidence-workbench/"
    )
    attempt = (
        f"{base}planning/work-pack/session-evidence/"
        "SWU-OEW-013B/attempt-003/"
    )
    impl = "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
    artifacts = [
        artifact(
            f"{attempt}receipt.json",
            ["result", "blockers", "validation", "mutation_admission"],
            ["TYPE-01", "TYPE-06", "TYPE-08"],
        ),
        artifact(
            f"{attempt}build-attempt.json",
            ["commands", "failure", "typed_error_inventory", "cleanup"],
            ["TYPE-01", "TYPE-02", "TYPE-05", "TYPE-06"],
        ),
        artifact(
            f"{base}planning/work-pack/session-evidence/SWU-OEW-013B/"
            "TASK-SESSION-RESULT.md",
            ["attempt_003", "blocker", "evidence_ceiling"],
            ["TYPE-01", "TYPE-08"],
        ),
        artifact(
            f"{attempt}closeout-refresh/refresh-receipt.json",
            ["next_route", "selected_swu", "budget", "evidence_ceiling"],
            ["TYPE-01", "TYPE-07", "TYPE-08"],
        ),
        artifact(
            f"{base}planning/WORK-PACK.md",
            ["Blockers and Residue", "Next Route"],
            ["TYPE-03", "TYPE-07", "TYPE-08"],
        ),
        artifact(
            f"{base}planning/work-pack/tasks/TASK-OEW-WORKBENCH-001.md",
            ["SWU-OEW-007", "SWU-OEW-008F", "Execution State"],
            ["TYPE-02", "TYPE-03", "TYPE-04"],
        ),
        artifact(
            f"{base}planning/work-pack/tasks/TASK-OEW-VALIDATION-001.md",
            ["SWU-OEW-013B", "Attempt 003"],
            ["TYPE-01", "TYPE-05", "TYPE-06"],
        ),
        artifact(
            f"{base}planning/work-pack/waves/W1-L1.md",
            ["Order", "Selection"],
            ["TYPE-03", "TYPE-07"],
        ),
        artifact(
            f"{base}planning/work-pack/swu-manifest.json",
            ["selected_swu", "remaining_l1_frontier", "SWU-OEW-007", "SWU-OEW-013B"],
            ["TYPE-03", "TYPE-04", "TYPE-07", "TYPE-08"],
        ),
        artifact(
            f"{base}planning/work-pack/chain-state.json",
            ["session_budget", "consumed_sessions", "stop_reason", "final_next_route"],
            ["TYPE-07", "TYPE-08"],
        ),
        artifact(
            f"{base}planning/work-pack/shared/validate-l1-frontier.py",
            ["SERIES_ORDER", "EXPECTED_DEPENDENCIES", "target_collisions"],
            ["TYPE-03", "TYPE-06", "TYPE-07"],
        ),
        artifact(
            ".arcanum/task-session/continuity/oew-work-pack-20260727.json",
            ["next_swu", "next_route", "blocker_id", "session_budget"],
            ["TYPE-01", "TYPE-07"],
        ),
        artifact(
            f"{impl}upstream/L1-BUILD.lock.json",
            ["owner_swu", "feature_inputs", "execution_contract", "claims"],
            ["TYPE-03", "TYPE-04", "TYPE-05", "TYPE-08"],
        ),
        artifact(
            f"{impl}upstream/overlay/overlay-manifest.json",
            ["owner_swu", "files"],
            ["TYPE-02", "TYPE-04"],
        ),
        artifact(
            f"{impl}upstream/overlay/first-working-version-manifest.json",
            ["owner_swu", "overlay_manifest", "files"],
            ["TYPE-02", "TYPE-04"],
        ),
        artifact(
            f"{base}planning/work-pack/session-evidence/SWU-OEW-007/receipt.json",
            ["result", "changes", "validation"],
            ["TYPE-02", "TYPE-04"],
        ),
        artifact(
            f"{base}planning/work-pack/session-evidence/SWU-OEW-007/"
            "attempt-001/closeout-refresh/refresh-receipt.json",
            ["result", "owner", "history"],
            ["TYPE-04", "TYPE-08"],
        ),
        artifact(
            f"{impl}upstream/overlay/packages/dashboard/src/oew/types.ts",
            ["full-file"],
            ["TYPE-02"],
        ),
        artifact(
            f"{impl}upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts",
            ["full-file"],
            ["TYPE-02"],
        ),
        artifact(
            f"{impl}upstream/overlay/packages/dashboard/src/oew/store.ts",
            ["full-file"],
            ["TYPE-02"],
        ),
        artifact(
            f"{impl}test/ui-store.test.mjs",
            ["full-file"],
            ["TYPE-05", "TYPE-06"],
        ),
        artifact(
            f"{impl}package.json",
            ["scripts.test:ui-store", "package-root"],
            ["TYPE-05", "TYPE-07"],
        ),
    ]
    context = {
        "schema_version": "invoke.refresh-context.v1",
        "context_id": "oew-l1-typed-overlay-repair-20260729",
        "mode": "strict",
        "budget": {"artifact_limit": 24, "artifact_count": len(artifacts)},
        "obligations": [f"TYPE-{index:02d}" for index in range(1, 9)],
        "artifacts": artifacts,
        "coverage": {
            "TYPE-01": "covered: attempt 003 isolates 48 strict errors in exactly three completed-007 source files",
            "TYPE-02": "covered: the three source bytes and both current manifests are exact inputs",
            "TYPE-03": "covered: one collision-free 007T repair precedes 013B in the ordered series",
            "TYPE-04": "covered: completed-007 receipts stay historical while current bindings move through explicit manifests and lock fields",
            "TYPE-05": "covered: existing test:ui-store plus the exact dashboard tsc -b and Vite build close acceptance",
            "TYPE-06": "covered: target collision, owner collapse, receipt drift, typed-build weakening, and missing completed-lock fields fail closed",
            "TYPE-07": "covered: one package root is retained; budget becomes eight with four consumed; only 007T is selected",
            "TYPE-08": "covered: no final build, browser, L2, authority, publication, release, or production claim is granted",
        },
        "strict_coverage": "pass",
        "excluded_candidates": [
            "new package or test roots: the existing focused runner and shared package root are sufficient",
            "013B scripts/generated outputs: downstream build execution remains a separate SWU",
            "browser, L2, public Arcanum, promotion, publication, deployment, release, and production",
        ],
        "authority_effect": "none",
    }
    write_json(RUN / "context-pack.json", context)

    (RUN / "CONTEXT-PACK.md").write_text(
        """# Strict Context Pack — OEW Typed-Overlay Repair

Status: **PASS**

This run evidence selects the smallest owned repair after 013B attempt 003. It
is not a canonical planning source and proves no source implementation.

## Exact Finding

The frozen install, explicit core build, and dashboard Vitest pass. The exact
dashboard `tsc -b && vite build` fails with 48 strict errors in only
`types.ts`, `loadOewBundle.ts`, and `store.ts`.

## Closed Repair

`SWU-OEW-007T` may later mutate exactly those three source files plus
`overlay-manifest.json`, `first-working-version-manifest.json`, and
`L1-BUILD.lock.json`. The existing `ui-store.test.mjs` is read-only validation.
The lock keeps 013B as owner, consumer, build owner, and runtime owner; 007T is
only the mutation/binding owner. Completed-007 receipts remain immutable.

The ordered series becomes `008F → 007T → 013B → 014 → 014V`. Only 007T is
selected, budget is eight with four consumed, and runtime readiness is false.

Strict coverage: **8/8 obligations covered; no gaps or contradictions.**
"""
    )

    dispatch = {
        "dispatch_id": "oew-l1-typed-overlay-repair-refresh-20260729",
        "parent_dispatch_id": None,
        "intent": {
            "raw": "resume goal with the next steps",
            "objective": (
                "Insert and select one owned typed-overlay repair before 013B "
                "without implementing or executing it."
            ),
            "target_artifact": (
                "nine synchronized private planning/continuity projections and "
                "a terminal Task Session handoff to SWU-OEW-007T"
            ),
            "arcanum_vocabulary": ["context-builder", "invoke", "task-session"],
            "operator_sentence": (
                "Repair only the typed input boundary, preserve completed "
                "history, and keep the final build owned by 013B."
            ),
        },
        "mode": "sequence",
        "techniques": [
            "sequence",
            "frame_handoff",
            "residue_ledger",
            "owner_boundary_check",
            "artifact_contract_bridge",
            "validation_loop",
            "execution_receipt_handoff",
            "authority_split_gate",
            "concrete_path_evidence",
        ],
        "subagent_strategy": {
            "status": "none",
            "trigger": "one bounded serial planning repair with one lifecycle owner",
            "explanation": (
                "The parent delegated one bounded helper; no multi-agent "
                "fan-out or reusable orchestration graph is required."
            ),
            "context": ["Attempt 003 identifies one six-path typed-input repair."],
            "roles": [],
            "parallelism": "none",
            "join_policy": "none",
            "authorization": "not_needed",
            "permission_prompt": "",
            "receipt_requirements": [],
        },
        "subagent_lifecycle": {"status": "none", "agents": []},
        "steps": [
            {
                "step_id": "select-typed-repair-context",
                "name": "Select exact typed blocker and ownership context",
                "capability_ref": "context-builder",
                "mode": "standard-strict",
                "pattern": "route",
                "inputs": [
                    {"kind": "receipt", "ref": "SWU-OEW-013B attempt-003 BLOCK"},
                    {"kind": "external_context", "ref": "direct-user continuation"},
                ],
                "outputs": [
                    {"kind": "frame", "ref": "CONTEXT-PACK.md and context-pack.json"}
                ],
                "techniques": ["frame_handoff", "concrete_path_evidence"],
                "stop_conditions": ["any typed repair obligation lacks exact current evidence"],
            },
            {
                "step_id": "stage-typed-repair",
                "name": "Stage 007T and synchronized planning projections",
                "capability_ref": "invoke",
                "mode": "refresh",
                "pattern": "sequential",
                "depends_on_steps": ["select-typed-repair-context"],
                "inputs": [{"kind": "frame", "ref": "strict context pack"}],
                "outputs": [
                    {"kind": "artifact", "ref": "nine-target staged private tree"},
                    {"kind": "artifact", "ref": "material-package.json"},
                ],
                "techniques": [
                    "residue_ledger",
                    "owner_boundary_check",
                    "artifact_contract_bridge",
                    "authority_split_gate",
                ],
                "stop_conditions": [
                    "repair scope, lock/build roles, package boundary, budget, selector, or authority drifts"
                ],
            },
            {
                "step_id": "validate-apply-typed-repair",
                "name": "Validate and apply exact staged planning bytes",
                "capability_ref": "invoke",
                "mode": "refresh",
                "pattern": "validation",
                "evidence_artifact": (
                    "frontier-regressions.json, negative-probes.json, "
                    "material-receipt.json, refresh-handoff-receipt.json"
                ),
                "depends_on_steps": ["stage-typed-repair"],
                "inputs": [
                    {"kind": "artifact", "ref": "material-package.json"},
                    {"kind": "artifact", "ref": "staged private tree"},
                ],
                "outputs": [
                    {"kind": "receipt", "ref": "material-receipt.json"},
                    {"kind": "receipt", "ref": "refresh-handoff-receipt.json"},
                ],
                "techniques": ["validation_loop", "artifact_contract_bridge"],
                "stop_conditions": [
                    "any digest, frontier, dependency, owner, package, protected-target, or parity check fails"
                ],
            },
            {
                "step_id": "handoff-007t",
                "name": "Route selected 007T to a fresh Task Session",
                "capability_ref": "task-session",
                "mode": "execute",
                "pattern": "handoff",
                "depends_on_steps": ["validate-apply-typed-repair"],
                "inputs": [
                    {"kind": "receipt", "ref": "refresh-handoff-receipt.json"},
                    {"kind": "artifact", "ref": "selected SWU-OEW-007T contract"},
                ],
                "outputs": [
                    {"kind": "receipt", "ref": "future SWU-OEW-007T Task Session receipt"}
                ],
                "techniques": ["execution_receipt_handoff"],
                "stop_conditions": [
                    "fresh preflight blocks; do not claim source repair or typed-build success"
                ],
            },
        ],
        "gates": [
            {
                "gate_id": "G-OEW-007T-CONTEXT",
                "kind": "validation",
                "owner": "context-builder",
                "condition": "All eight typed repair obligations have exact current evidence.",
                "on_fail": "block",
            },
            {
                "gate_id": "G-OEW-007T-MATERIAL",
                "kind": "validation",
                "owner": "invoke-material-validator",
                "condition": "Nine planning targets and all private boundaries pass.",
                "on_fail": "block",
            },
            {
                "gate_id": "G-OEW-007T-ROLES",
                "kind": "validation",
                "owner": "OEW-frontier-validator",
                "condition": (
                    "007T owns only repair mutation/binding while 013B retains "
                    "lock consumer/build/runtime ownership."
                ),
                "on_fail": "block",
            },
            {
                "gate_id": "G-OEW-007T-FRONTIER",
                "kind": "validation",
                "owner": "OEW-frontier-validator",
                "condition": (
                    "All five ordered suffixes, one package root, exact targets, "
                    "commands, and completed dependencies close."
                ),
                "on_fail": "block",
            },
            {
                "gate_id": "G-OEW-AUTHORITY-CEILING",
                "kind": "promotion_guardrail",
                "owner": "ontology-and-release-owners",
                "condition": "No Refresh receipt claims implementation, build, browser, release, or production.",
                "on_fail": "block",
            },
        ],
        "observability": {
            "dispatch_id_required": True,
            "parent_dispatch_id": None,
            "trace_events": [
                "context-selected",
                "typed-repair-staged",
                "negative-probes-passed",
                "frontier-regressions-passed",
                "material-admitted",
                "planning-repair-applied",
                "task-session-handoff",
            ],
            "signal_grouping": "oew-l1-typed-overlay-repair-refresh-20260729",
        },
        "boundary_evidence": {
            "boundaries": [
                {
                    "boundary_id": "attempt-003-to-refresh",
                    "kind": "evidence_return",
                    "from_owner": "task-session",
                    "to_owner": "invoke",
                    "applies_to_steps": [
                        "select-typed-repair-context",
                        "stage-typed-repair",
                    ],
                    "contract": "Attempt 003 supplies diagnosis only; its BLOCK and implementation bytes stay immutable.",
                    "on_violation": "block",
                },
                {
                    "boundary_id": "refresh-to-007t-task-session",
                    "kind": "capability_handoff",
                    "from_owner": "invoke",
                    "to_owner": "task-session",
                    "applies_to_steps": [
                        "validate-apply-typed-repair",
                        "handoff-007t",
                    ],
                    "contract": "Refresh selects a repair contract but supplies no source change, test pass, or typed build result.",
                    "on_violation": "block",
                },
            ],
            "authority": {
                "lifecycle": "Invoke owns private repair authoring",
                "execution": "Task Session owns future 007T execution",
                "validation": "Invoke material and OEW frontier validators",
                "evidence": "private OEW receipt owners",
                "promotion": "ontology, publication, release, and production owners stay separate",
            },
            "receipts": [
                {
                    "receipt_id": "oew-l1-typed-overlay-refresh-receipt",
                    "producer": "invoke",
                    "required_fields": [
                        "artifacts",
                        "validation_result",
                        "status",
                        "blockers",
                        "handoff_note",
                    ],
                    "stores": ["private OEW refresh evidence"],
                    "on_missing": "block",
                }
            ],
        },
        "promotion_guardrails": [
            "refresh has authority_effect none",
            "mutationRuntimeReady remains false until Task Session gates pass",
            "007T must stop before selecting or executing 013B",
            "014, 014V, L2, authority, publication, deployment, release, and production are not selected",
        ],
    }
    write_json(RUN / "DISPATCH.json", dispatch)
    (RUN / "DISPATCH-TECHNIQUE-TRACE.md").write_text(
        """# Dispatch Technique Trace

The route is serial: strict context selection → Invoke Refresh staging →
material/frontier validation and exact apply → Task Session handoff for 007T.
The parent owns scope and claims; one bounded helper owns the Refresh evidence.
No governed fan-out was activated.

Owner-boundary checks keep 007T's one-time source/binding mutation distinct
from 013B's immutable-lock consumption, final build, runtime, and independent
verification responsibilities.
"""
    )
    (RUN / "DISTILL-VALIDATION.md").write_text(
        """# Distill Validation — Conditional Skip

Result: **PASS — SKIPPED**

Attempt 003 already reduces the blocker to one indivisible typed-input repair:
three source files and their three authoritative bindings. The existing focused
runner plus exact dashboard `tsc -b && vite build` are already the smallest
acceptance seam. Splitting source changes from their bindings would create stale
authority surfaces; merging them into 013B would collapse repair and final-build
ownership. This skip grants no Task Session or implementation result.
"""
    )
    write_json(
        RUN / "invoke-invocation-envelope.json",
        {
            "schema_version": "arcanum.sigil-invocation.v1",
            "capability": "invoke",
            "mode": "refresh",
            "mutation_mode": "apply-approved",
            "activation_source": "continuation",
            "target": "SWU-OEW-007T typed-overlay repair planning",
            "selector": "SWU-OEW-007T",
            "execution_claim": "none",
            "authority_effect": "none",
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
