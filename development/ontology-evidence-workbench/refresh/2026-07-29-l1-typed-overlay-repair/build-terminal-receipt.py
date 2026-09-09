#!/usr/bin/env python3
"""Emit the terminal Invoke Refresh report and receipt for the 007T route."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[5]
RUN = Path(__file__).resolve().parent
BASE = (
    "cyberAlchemy-v2/development/ontology-evidence-workbench/"
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reference(relative: str) -> dict:
    path = ROOT / relative
    return {
        "path": relative,
        "sha256": digest(path),
        "size_bytes": path.stat().st_size,
    }


def run_reference(name: str) -> dict:
    return reference(str((RUN / name).relative_to(ROOT)))


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n")


def main() -> int:
    material_receipt = json.loads((RUN / "material-receipt.json").read_text())
    material = json.loads((RUN / "material-package.json").read_text())
    targets = []
    for change in material["changes"]:
        path = ROOT / change["target_path"]
        targets.append(
            {
                "path": change["target_path"],
                "sha256": digest(path),
                "size_bytes": path.stat().st_size,
            }
        )

    receipt = {
        "schema_version": "invoke-refresh-receipt.v1",
        "refresh_id": "OEW-L1-TYPED-OVERLAY-REPAIR-20260729",
        "route": "invoke:refresh:apply-approved",
        "result": "pass",
        "activation_source": {
            "kind": "continuation",
            "request": "resume goal with the next steps",
            "date": "2026-07-29",
            "scope": (
                "insert and select only SWU-OEW-007T, synchronize the private "
                "planning frontier, and hand off without implementation"
            ),
        },
        "source_blocker": {
            "id": "SWU013B_TYPED_DASHBOARD_BUILD_FAILED",
            "fingerprint": (
                "c052bfcdabf4db11c6b690e9015d64253b9e4c755955a5cc621d666d48b97c53"
            ),
            "receipt": (
                f"{BASE}planning/work-pack/session-evidence/SWU-OEW-013B/"
                "attempt-003/receipt.json"
            ),
            "receipt_sha256": (
                "9105708c048eefc7abbfdff7952b00cf10d3b06fe8de513e85292e23b7d8c61c"
            ),
            "build_attempt": (
                f"{BASE}planning/work-pack/session-evidence/SWU-OEW-013B/"
                "attempt-003/build-attempt.json"
            ),
            "build_attempt_sha256": (
                "b6d58cea05a575c6af3a447f7952aaefb6f49e927939b01a54a6f180ab35e75c"
            ),
            "closeout_receipt": (
                f"{BASE}planning/work-pack/session-evidence/SWU-OEW-013B/"
                "attempt-003/closeout-refresh/refresh-receipt.json"
            ),
            "closeout_receipt_sha256": (
                "70a160f79999f57c52598b90c45a70374c2b429b89af0f6ab5d0a14cffd4eb82"
            ),
            "result": "routed-to-selected-repair-not-yet-resolved",
        },
        "material_package": {
            **run_reference("material-package.json"),
            "canonical_digest": material_receipt["packageDigest"],
            "validator_receipt": run_reference("material-receipt.json"),
            "live_validator_receipt": run_reference("live-material-receipt.json"),
            "handoff_receipt": run_reference("refresh-handoff-receipt.json"),
            "patch_verdict": "pass",
            "mutation_handoff": "ready",
            "mutation_ready": True,
            "mutation_runtime_ready": False,
            "applied_path_count": 9,
            "applied_bytes_equal_staged": True,
        },
        "repair_swu": {
            "selector": "SWU-OEW-007T",
            "status": "planned-selected-preflight-pending",
            "dependencies": ["SWU-OEW-007", "SWU-OEW-008F"],
            "future_write_count": 6,
            "future_write_paths": [
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/overlay/overlay-manifest.json"
                ),
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/overlay/first-working-version-manifest.json"
                ),
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/overlay/packages/dashboard/src/oew/types.ts"
                ),
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts"
                ),
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/overlay/packages/dashboard/src/oew/store.ts"
                ),
                (
                    "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                    "upstream/L1-BUILD.lock.json"
                ),
            ],
            "focused_validation": "npm run test:ui-store",
            "typed_build_validation": (
                "pnpm --filter @understand-anything/dashboard build"
            ),
            "typed_build_expanded": "tsc -b && vite build",
            "expected_handle": "oew-typed-overlay-repair/v1",
            "implementation_executed": False,
        },
        "lock_role_separation": {
            "path": (
                "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                "upstream/L1-BUILD.lock.json"
            ),
            "current_sha256": (
                "41025feacb8f24afc6f962a465430751492e6553afef0c027aff049b1d70e78e"
            ),
            "current_owner_swu": "SWU-OEW-013B",
            "mutation_owner_swu": "SWU-OEW-007T",
            "binding_owner_swu": "SWU-OEW-007T",
            "consumer_swu": "SWU-OEW-013B",
            "build_owner_swu": "SWU-OEW-013B",
            "runtime_owner_swu": "SWU-OEW-013B",
            "future_target_unchanged_by_refresh": True,
            "result": "pass",
        },
        "selection": {
            "selected_swu": "SWU-OEW-007T",
            "current_expected_selector": "SWU-OEW-007T",
            "remaining_l1_frontier": [
                "SWU-OEW-007T",
                "SWU-OEW-013B",
                "SWU-OEW-014",
                "SWU-OEW-014V",
            ],
            "captured_series": [
                "SWU-OEW-008F",
                "SWU-OEW-007T",
                "SWU-OEW-013B",
                "SWU-OEW-014",
                "SWU-OEW-014V",
            ],
            "session_budget_before": 6,
            "session_budget_after": 8,
            "consumed_sessions": 4,
            "mutation_runtime_ready": False,
            "swu_013b_selected": False,
            "swu_014_selected": False,
            "swu_014v_selected": False,
            "l2_selected": False,
            "result": "pass",
        },
        "validation": [
            "strict context coverage: pass 22 artifacts and 8/8 obligations",
            "Dispatch Spec: pass",
            "Distill: skipped with exact bounded-repair rationale",
            "canonical material package and Refresh handoff: pass and ready",
            "live byte equality: pass 9/9",
            "staged and live planning validation: pass 13/13 each",
            "preselection frontier validation: pass 19/19 staged and live",
            "frontier regression: pass all five suffixes staged and live",
            "negative role/target/history/build probes: pass 5/5 staged and live",
            "single package root and unchanged package hash: pass",
            "six future 007T implementation targets unchanged: pass 6/6",
            "protected set: 12991 entries and exact digest equality",
            "selected/current selector 007T; runtime false; 013B/014/014V/L2 unselected",
        ],
        "targets": targets,
        "package_hash": {
            "before": (
                "a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004"
            ),
            "after": (
                "a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004"
            ),
            "unchanged": True,
            "package_root_count": 1,
        },
        "frontier_validator": {
            "path": (
                f"{BASE}planning/work-pack/shared/validate-l1-frontier.py"
            ),
            "sha256": digest(
                ROOT / f"{BASE}planning/work-pack/shared/validate-l1-frontier.py"
            ),
            "modified": True,
            "readiness_receipt": run_reference("live-frontier-readiness.json"),
            "regression_receipt": run_reference("live-frontier-regressions.json"),
            "negative_receipt": run_reference("live-negative-probes.json"),
            "check_count": 19,
            "regression_case_count": 5,
            "negative_probe_count": 5,
            "result": "pass",
        },
        "protected_and_unrelated_changes": {
            "protected_entry_count": 12991,
            "protected_set_digest": (
                "100134c4cb2f8ef71bcb0b4f9463c2bfc683a3ad4d844dd811979fb681ac97fa"
            ),
            "protected_equal": True,
            "future_target_count": 6,
            "future_targets_equal": True,
            "unrelated_dirty_worktree_preserved": True,
            "historical_007_receipts_rewritten": False,
        },
        "execution": {
            "source_repair_executed": False,
            "focused_test_executed": False,
            "dashboard_typed_build_executed": False,
            "swu_013b_executed": False,
            "final_build_executed": False,
            "independent_verifier_executed": False,
            "browser_executed": False,
        },
        "next_route": {
            "capability": "task-session",
            "mode": "execute",
            "target": "SWU-OEW-007T",
            "selection": "SWU-OEW-007T",
            "runtime_ready": False,
        },
        "evidence_ceiling": (
            "Refresh planning/selection/handoff only; 007T source repair, "
            "focused tests, typed dashboard build, 013B final build/verifier, "
            "browser, L2, authority, publication, deployment, release, and "
            "production have not run."
        ),
        "authority_effect": "none",
        "blockers": [],
    }
    write_json(RUN / "refresh-receipt.json", receipt)

    report = {
        "schemaVersion": "invoke.refresh-report.v1",
        "refreshId": receipt["refresh_id"],
        "mode": "refresh",
        "executionPath": (
            "continuation Invoke Refresh -> strict context -> serial private "
            "dispatch -> staged frontier/role validation -> canonical material "
            "handoff -> exact nine-path apply -> Task Session handoff"
        ),
        "phaseStatus": "pass",
        "handoffStatus": "ready",
        "mutationReady": True,
        "mutationRuntimeReady": False,
        "selectedSwu": "SWU-OEW-007T",
        "targetInventory": [item["path"] for item in targets],
        "validation": {
            "planning": "pass-13-of-13-staged-and-live",
            "frontier": "pass-19-of-19-staged-and-live",
            "frontierRegression": "pass-5-of-5-staged-and-live",
            "negativeProbes": "pass-5-of-5-staged-and-live",
            "liveTargetEquality": "pass-9-of-9",
            "futureTargetEquality": "pass-6-of-6",
            "packageRootCount": 1,
            "packageSha256": receipt["package_hash"]["after"],
            "protectedSet": "pass-12991-equal",
        },
        "blockerScopes": {
            "refresh-authoring": 0,
            "apply-authorization": 0,
            "target-lifecycle": 1,
            "audit": 0,
        },
        "blockers": [
            {
                "id": "SWU-OEW-007T-TARGET-WORK",
                "scope": "target-lifecycle",
                "owner": "task-session",
                "status": "open",
                "claim": (
                    "The selected six-path source/binding repair and its "
                    "focused plus typed-build acceptance still require execution."
                ),
            }
        ],
        "nextRoute": receipt["next_route"],
        "evidenceCeiling": receipt["evidence_ceiling"],
        "authorityEffect": "none",
        "result": "pass",
    }
    write_json(RUN / "refresh-report.json", report)
    (RUN / "REFRESH-REPORT.md").write_text(
        """# Invoke Refresh Report — OEW Typed-Overlay Repair Route

Phase status: **PASS**  
Handoff status: **READY**  
Selected SWU: **SWU-OEW-007T**  
Mutation mode: **apply-approved**  
Durable `mutationRuntimeReady`: **false**

## Applied Planning Repair

The ordered series is now:

```text
008F → 007T → 013B → 014 → 014V
```

Only 007T is selected. It owns a future six-path typed-input repair: three
completed-007 source files and their overlay, first-working-version, and build
lock bindings. Completed-007 receipt history is preserved.

The lock role split is explicit: 007T may mutate/rebind it, but 013B remains
the lock owner/consumer and the final build/runtime owner. 013B no longer owns
the lock as a mutation target and depends on 007T.

## Validation

- Strict context: 22 artifacts, 8/8 obligations — pass.
- Serial private Dispatch Spec — pass.
- Distill — skipped with indivisible-repair rationale.
- Planning checks: 13/13 staged and live — pass.
- Frontier checks: 19/19 staged and live — pass.
- Ordered suffix regressions: 5/5 staged and live — pass.
- Negative probes: 5/5 staged and live — pass.
- Canonical material/handoff: pass/ready; 9/9 live bytes equal staging.
- Future 007T targets: 6/6 unchanged by this Refresh.
- Package registry: one root, unchanged SHA-256
  `a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004`.
- Protected set: 12,991 entries, exact digest equality.

## Budget and Ceiling

The session budget is 8 with 4 consumed, reserving one session each for 007T,
a fresh 013B retry, 014, and 014V. Only 007T is selected; 013B, 014, 014V, and
L2 remain unselected.

This Refresh did not change implementation source, manifests, the build lock,
tests, package metadata, or tsconfig; it did not run the focused test, typed
dashboard build, 013B build/verifier, or browser. The terminal next route is a
fresh `task-session:execute` for `SWU-OEW-007T`.
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
