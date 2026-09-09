#!/usr/bin/env python3
"""Stage the owned typed-overlay repair Invoke Refresh projections."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[5]
RUN = Path(__file__).resolve().parent
STAGED = RUN / "staged"
PRESELECTION = RUN / "preselection" / "swu-manifest.json"
PLANNING = (
    STAGED
    / "cyberAlchemy-v2/development/ontology-evidence-workbench/planning"
)
MANIFEST = PLANNING / "work-pack/swu-manifest.json"
CHAIN = PLANNING / "work-pack/chain-state.json"
READINESS = (
    PLANNING
    / "work-pack/validation/L1-FIRST-WORKING-VERSION.frontier-readiness.json"
)
CONTINUITY = (
    STAGED
    / ".arcanum/task-session/continuity/oew-work-pack-20260727.json"
)
IMPLEMENTATION_PREFIX = (
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench"
)
LOCK_PATH = f"{IMPLEMENTATION_PREFIX}/upstream/L1-BUILD.lock.json"
OVERLAY_MANIFEST = f"{IMPLEMENTATION_PREFIX}/upstream/overlay/overlay-manifest.json"
FIRST_MANIFEST = (
    f"{IMPLEMENTATION_PREFIX}/upstream/overlay/"
    "first-working-version-manifest.json"
)
TYPES = (
    f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
    "src/oew/types.ts"
)
LOADER = (
    f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
    "src/oew/loadOewBundle.ts"
)
STORE = (
    f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
    "src/oew/store.ts"
)
REPAIR_TARGETS = [
    OVERLAY_MANIFEST,
    FIRST_MANIFEST,
    TYPES,
    LOADER,
    STORE,
    LOCK_PATH,
]
LOCK_ROLES = {
    "path": LOCK_PATH,
    "mutation_owner_swu": "SWU-OEW-007T",
    "binding_owner_swu": "SWU-OEW-007T",
    "owner_swu": "SWU-OEW-013B",
    "consumer_swu": "SWU-OEW-013B",
    "build_owner_swu": "SWU-OEW-013B",
    "runtime_owner_swu": "SWU-OEW-013B",
    "required_after_repair": True,
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def write(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n")


def replace_exact(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one exact replacement, found {count}")
    path.write_text(text.replace(old, new))


def stage_manifest() -> None:
    manifest = load(MANIFEST)
    records = {record["swu_id"]: record for record in manifest["swus"]}
    if "SWU-OEW-007T" in records:
        raise RuntimeError("SWU-OEW-007T already exists")

    repair = {
        "swu_id": "SWU-OEW-007T",
        "parent_task": "TASK-OEW-WORKBENCH-001",
        "layer": "L1",
        "wave": "W1",
        "primary_behavior": (
            "Repair the completed-007 overlay's strict TypeScript boundary and "
            "rebind its current manifests/build-lock inputs without claiming "
            "the final build."
        ),
        "dependencies": [
            "SWU-OEW-007",
            "SWU-OEW-008F",
        ],
        "task_contract": "planning/work-pack/tasks/TASK-OEW-WORKBENCH-001.md",
        "source_anchors": [
            (
                "planning/work-pack/session-evidence/SWU-OEW-013B/"
                "attempt-003/receipt.json"
            ),
            (
                "planning/work-pack/session-evidence/SWU-OEW-013B/"
                "attempt-003/build-attempt.json"
            ),
            "planning/work-pack/tasks/TASK-OEW-WORKBENCH-001.md",
            "planning/work-pack/tasks/TASK-OEW-VALIDATION-001.md",
        ],
        "target_inventory": REPAIR_TARGETS,
        "acceptance": (
            "Only types.ts, loadOewBundle.ts, and store.ts receive minimal "
            "strict typing fixes; overlay-manifest.json, "
            "first-working-version-manifest.json, and L1-BUILD.lock.json bind "
            "their exact current bytes while retaining completed-007 history. "
            "The lock keeps owner/build/runtime/consumer SWU-OEW-013B and "
            "records SWU-OEW-007T only as mutation/binding owner. Existing "
            "test:ui-store and the exact dashboard `tsc -b && vite build` pass "
            "without package, tsconfig, generated-build, or TypeScript "
            "weakening changes."
        ),
        "validation": (
            "npm run test:ui-store && "
            "<fresh-locked-workroot>: pnpm --filter "
            "@understand-anything/dashboard build"
        ),
        "validation_scripts": [
            "test:ui-store",
        ],
        "typed_build_validation": {
            "workroot": "fresh-digest-named-L1-workroot",
            "cwd": (
                "<workroot>/"
                "Understand-Anything-2cda14e89535049e49120198886bc0b82e9e630f"
            ),
            "command": "pnpm --filter @understand-anything/dashboard build",
            "expanded_script": "tsc -b && vite build",
            "expected_exit_code": 0,
        },
        "lock_role_contract": LOCK_ROLES,
        "historical_owner_binding": {
            "swu_id": "SWU-OEW-007",
            "status": "completed",
            "receipt": (
                "planning/work-pack/session-evidence/SWU-OEW-007/receipt.json"
            ),
            "receipt_sha256": (
                "f4ac5d2a1c4ca001b49fcd428e371ce56622fe79758dad4f2a1f8adbb480f569"
            ),
            "closeout_receipt": (
                "planning/work-pack/session-evidence/SWU-OEW-007/attempt-001/"
                "closeout-refresh/refresh-receipt.json"
            ),
            "closeout_receipt_sha256": (
                "ead15995c71efd0735877e567b6d325becdef805177045f1c136f95bf6d47a50"
            ),
            "effect": "history-preserved-current-bindings-repaired-by-007T",
        },
        "split_analysis": (
            "The three strict-type fixes and their three authoritative bindings "
            "close one typed-input behavior. The existing focused test is a "
            "read-only validator, while final build production remains "
            "independently owned by 013B."
        ),
        "execution_owner": "task-session-private-typed-overlay-repair",
        "expected_handle": "oew-typed-overlay-repair/v1",
        "expected_result_shape": "standard-swu-yaml",
        "expected_owner_receipt": (
            "planning/work-pack/session-evidence/SWU-OEW-007T/receipt.json"
        ),
        "successor_policy": (
            "stop; report SWU-OEW-013B eligible without selecting it"
        ),
        "status": "planned",
        "candidate": True,
        "selected": False,
    }

    insert_at = next(
        index
        for index, record in enumerate(manifest["swus"])
        if record["swu_id"] == "SWU-OEW-013B"
    )
    manifest["swus"].insert(insert_at, repair)

    final_build = records["SWU-OEW-013B"]
    final_build["dependencies"] = ["SWU-OEW-007T"]
    final_build["target_inventory"] = [
        target for target in final_build["target_inventory"] if target != LOCK_PATH
    ]
    final_build["required_inputs"] = [LOCK_PATH]
    final_build["lock_role_contract"] = LOCK_ROLES
    final_build["status"] = "blocked-awaiting-SWU-OEW-007T"
    final_build["candidate"] = False
    final_build["selected"] = False
    final_build["blocker"]["repair_owner_swu"] = "SWU-OEW-007T"
    final_build["blocker"]["result"] = "routed-not-resolved"
    final_build["blocker"]["reactivation_condition"] = (
        "passing SWU-OEW-007T Task Session and joined owner closeout"
    )

    manifest["remaining_l1_frontier"] = [
        "SWU-OEW-007T",
        "SWU-OEW-013B",
        "SWU-OEW-014",
        "SWU-OEW-014V",
    ]
    manifest["selected_swu"] = None
    manifest["implementation_authorized"] = False
    manifest["mutationRuntimeReady"] = False
    write(PRESELECTION, manifest)

    manifest["selected_swu"] = "SWU-OEW-007T"
    manifest["implementation_authorized"] = True
    manifest["mutationRuntimeReady"] = False
    selected_record = next(
        record
        for record in manifest["swus"]
        if record["swu_id"] == "SWU-OEW-007T"
    )
    selected_record["status"] = "planned-selected-preflight-pending"
    selected_record["selected"] = True
    write(MANIFEST, manifest)


def stage_chain() -> None:
    chain = load(CHAIN)
    chain["scope_extension"] = {
        "class": "direct-user-approved-terminal-repair-extension",
        "source": "active goal continuation instruction on 2026-07-29",
        "scope": "SWU-OEW-007T only",
        "limitations": [
            "Task Session may execute only SWU-OEW-007T",
            "SWU-OEW-013B requires a fresh later selection after 007T passes",
            "SWU-OEW-014 and SWU-OEW-014V remain unselected",
            (
                "L2, authority, promotion, publication, deployment, release, "
                "and production remain forbidden"
            ),
        ],
    }
    chain["session_budget"] = 8
    chain["captured_frontier"] = [
        "SWU-OEW-008F",
        "SWU-OEW-007T",
        "SWU-OEW-013B",
        "SWU-OEW-014",
        "SWU-OEW-014V",
    ]
    chain["current_expected_selector"] = "SWU-OEW-007T"
    chain["status"] = "active-preflight-pending"
    chain["routed_stop_reason"] = chain.pop("stop_reason")
    chain["routed_stop_reason"]["repair_owner_swu"] = "SWU-OEW-007T"
    chain["routed_stop_reason"]["result"] = "routed-not-resolved"
    chain["retry_accounting"] = {
        "previous_session_budget": 6,
        "session_budget": 8,
        "consumed_sessions": 4,
        "reason": (
            "Provide one session each for 007T repair, fresh 013B retry, 014, "
            "and 014V after four consumed sessions."
        ),
        "selector_scope_changed": True,
        "added_selector": "SWU-OEW-007T",
    }
    chain["final_next_route"] = {
        "capability": "task-session",
        "mode": "execute",
        "target": "SWU-OEW-007T",
        "selection": "SWU-OEW-007T",
        "runtime_ready": False,
    }
    chain["manifest_sha256"] = "__STAGED_MANIFEST_SHA256__"
    chain["frontier_readiness"]["sha256"] = "__STAGED_READINESS_SHA256__"
    write(CHAIN, chain)


def stage_continuity() -> None:
    continuity = load(CONTINUITY)
    continuity["updated_at"] = "2026-07-29T04:07:44Z"
    continuity["next_swu"] = "SWU-OEW-007T"
    continuity["next_route"] = {
        "capability": "task-session",
        "mode": "execute",
        "target": "SWU-OEW-007T",
        "runtime_ready": False,
    }
    continuity["routed_blocker"] = {
        "id": continuity.pop("blocker_id"),
        "fingerprint": continuity.pop("blocker_fingerprint"),
        "source_swu": "SWU-OEW-013B",
        "repair_owner_swu": "SWU-OEW-007T",
        "result": "routed-not-resolved",
    }
    continuity["session_budget"] = 8
    write(CONTINUITY, continuity)


def stage_markdown() -> None:
    work_pack = PLANNING / "WORK-PACK.md"
    replace_exact(
        work_pack,
        """Status: L1 chain stopped at 013B typed-dashboard overlay blocker
Complexity: medium
Output mode: split
Selected SWU: `none`
Implementation authorized: `false`
Mutation runtime ready: `false`""",
        """Status: L1 typed-overlay repair selected; Task Session preflight pending
Complexity: medium
Output mode: split
Selected SWU: `SWU-OEW-007T`
Implementation authorized: `true`
Mutation runtime ready: `false`""",
    )
    replace_exact(
        work_pack,
        """| [TASK-OEW-WORKBENCH-001](work-pack/tasks/TASK-OEW-WORKBENCH-001.md) | trust-aware Poker review UI | L1 | 007 and 008F | completed |
| [TASK-OEW-VALIDATION-001](work-pack/tasks/TASK-OEW-VALIDATION-001.md) | final build, browser/a11y production, independent acceptance | L1 | 013B blocked; 014, 014V pending | stopped at 013B attempt 003 |""",
        """| [TASK-OEW-WORKBENCH-001](work-pack/tasks/TASK-OEW-WORKBENCH-001.md) | trust-aware Poker review UI and typed-input repair | L1 | 007 and 008F complete; 007T selected | active at 007T preflight |
| [TASK-OEW-VALIDATION-001](work-pack/tasks/TASK-OEW-VALIDATION-001.md) | final build, browser/a11y production, independent acceptance | L1 | 013B awaits 007T; 014, 014V pending | blocked pending typed repair |""",
    )
    replace_exact(
        work_pack,
        """The manifest preserves every completed, blocked, and superseded record while
exposing only four active remaining L1 candidates: 008F, 013B, 014, and 014V.
Every active candidate has one parent task, one primary behavior, explicit
dependencies, exact target inventory, split analysis, validation, expected
receipt, and Task Session closeout synchronization.""",
        """The manifest preserves every completed, blocked, and superseded record while
inserting one minimal repair into the ordered series:
008F → 007T → 013B → 014 → 014V. The active remainder is exactly 007T, 013B,
014, and 014V. Every active candidate has one parent task, one primary
behavior, explicit dependencies, exact target inventory, split analysis,
validation, expected receipt, and Task Session closeout synchronization.""",
    )
    replace_exact(
        work_pack,
        """- `SWU-OEW-013B` consumes completed 007 + 008F source and emits an
  independently verified immutable build handle;""",
        """- `SWU-OEW-007T` minimally repairs strict typing in the three completed-007
  overlay sources and rebinds the two manifests plus build lock while retaining
  007 history; it does not own or execute the final build;
- `SWU-OEW-013B` consumes the repaired immutable lock and complete 007 + 008F
  source, remains the lock consumer/build/runtime owner, and emits an
  independently verified immutable build handle;""",
    )
    replace_exact(
        work_pack,
        """No
producer handle, verifier result, retained archive, or admitted implementation
write exists.""",
        """No
producer handle, verifier result, retained archive, or admitted implementation
write exists. `SWU-OEW-007T` is now the only selected unit. Its future Task
Session may write exactly three typed sources plus their overlay manifest,
first-working-version manifest, and lock bindings; runtime readiness remains
false until that separate execution passes.""",
    )
    replace_exact(
        work_pack,
        """- `SWU-OEW-013B` attempt 003 confirms that repaired order through successful
  install, exact core build, and dashboard Vitest. The acceptance-critical
  typed dashboard build then fails with 48 errors across the immutable
  completed-007 `loadOewBundle.ts`, `store.ts`, and `types.ts` bytes. Cleanup,
  package immutability, and protected equality pass; no 013B target was
  admitted. The new repair must be owned outside 013B and must update every
  affected overlay, first-working-version manifest, and build-lock binding
  before explicit revalidation/reactivation.""",
        """- `SWU-OEW-013B` attempt 003 confirms that repaired order through successful
  install, exact core build, and dashboard Vitest. The acceptance-critical
  typed dashboard build then fails with 48 errors across the immutable
  completed-007 `loadOewBundle.ts`, `store.ts`, and `types.ts` bytes. Cleanup,
  package immutability, and protected equality pass; no 013B target was
  admitted.
- `SWU-OEW-007T` now owns only the six-path typed-input repair: the three source
  bytes, cumulative overlay manifest, first-working-version manifest, and
  build-lock binding. Completed-007 receipts/history remain immutable. The lock
  continues to name 013B as owner, consumer, build owner, and runtime owner;
  007T is only its one-time mutation/binding owner. The existing
  `test:ui-store` runner and an exact fresh-workroot
  `pnpm --filter @understand-anything/dashboard build` (`tsc -b && vite build`)
  are mandatory. No package/tsconfig/test-file mutation or TypeScript weakening
  is authorized.""",
    )
    old_next = """The captured series is stopped after `SWU-OEW-013B` attempt 003. No SWU is
selected, and `SWU-OEW-014` plus `SWU-OEW-014V` remain planned and unselected.
The only next route is `invoke:refresh:apply-approved` targeting `owned
typed-overlay repair and SWU-OEW-013B reactivation`. That separate owner must
repair the three completed-007 typed overlay bytes, update every affected
overlay/first-working-version manifest and lock binding, prove focused tests
plus the exact dashboard typed build, revalidate the frontier, and explicitly
reactivate 013B. This closeout performs none of those actions and proves no
final build/verifier or browser result."""
    new_next = """The refreshed ordered series is
`008F → 007T → 013B → 014 → 014V`. `SWU-OEW-007T` is the only selected unit;
implementation authorization applies only to its six declared targets and its
mutation runtime is not ready until a fresh Task Session preflight passes.
`SWU-OEW-013B` depends on 007T, consumes the resulting immutable lock, and
retains final-build/runtime ownership. `SWU-OEW-014` and `SWU-OEW-014V` remain
planned and unselected.

The terminal next route is Task Session for `SWU-OEW-007T`. It must stop after
its focused test and exact typed dashboard build evidence; passing 007T may
report 013B eligible but may not select or execute it. This Refresh performed
no source repair, build, verifier, browser, or runtime execution."""
    replace_exact(work_pack, old_next, new_next)

    task_workbench = PLANNING / "work-pack/tasks/TASK-OEW-WORKBENCH-001.md"
    replace_exact(
        task_workbench,
        """State: SWU-OEW-007 and SWU-OEW-008F complete; SWU-OEW-013B selected for final-build validation""",
        """State: SWU-OEW-007 and SWU-OEW-008F complete; SWU-OEW-007T uniquely selected for typed-overlay repair""",
    )
    insert_marker = "## Superseded Component Decomposition\n"
    repair_section = """## Active Typed-Input Repair

### SWU-OEW-007T — Repair the Strict Overlay Boundary

- Primary behavior: repair only the strict TypeScript boundary exposed by
  013B attempt 003, then rebind the exact current input bytes without producing
  the final build.
- Dependencies: completed 007 and 008F receipts.
- Exact target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/types.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/store.ts`
  - `.../upstream/overlay/overlay-manifest.json`
  - `.../upstream/overlay/first-working-version-manifest.json`
  - `.../upstream/L1-BUILD.lock.json`
- Read-only validators: existing `test/ui-store.test.mjs`; no test-file change.
- Validation: `npm run test:ui-store`, then in the exact fresh locked workroot
  `pnpm --filter @understand-anything/dashboard build`, expanded
  `tsc -b && vite build`.
- Done: the three strict source errors are repaired without `any`, tsconfig,
  package, generated-build, or unrelated changes; both manifests bind current
  bytes while retaining completed-007 historical receipt/preimage bindings;
  the lock retains `owner_swu`, `consumer_swu`, `build_owner_swu`, and
  `runtime_owner_swu` as `SWU-OEW-013B` and records `SWU-OEW-007T` only as
  mutation/binding owner.
- Expected handle: `oew-typed-overlay-repair/v1`.
- Split analysis: source fixes and their exact bindings close one typed-input
  behavior. Final build execution and verification remain owned by 013B.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-007T/receipt.json`.
- Handoff: stop; report 013B eligible without selecting it.

"""
    text = task_workbench.read_text()
    if text.count(insert_marker) != 1:
        raise RuntimeError("TASK-OEW-WORKBENCH-001: insert marker mismatch")
    task_workbench.write_text(text.replace(insert_marker, repair_section + insert_marker))
    replace_exact(
        task_workbench,
        """- Next route: Task Session preflight for the uniquely selected
  `SWU-OEW-013B` under `TASK-OEW-VALIDATION-001`.""",
        """- SWU-OEW-007T: selected for a fresh Task Session preflight; no source
  implementation or typed-build evidence exists yet.
- Next route: Task Session for only `SWU-OEW-007T`; 013B remains blocked and
  may be reported eligible only after passing 007T closeout.""",
    )

    task_validation = PLANNING / "work-pack/tasks/TASK-OEW-VALIDATION-001.md"
    replace_exact(
        task_validation,
        """Dependencies: SWU-OEW-008F plus verified SWU-OEW-006P/007 receipts
State: SWU-OEW-013B attempt 003 blocked; no implementation execution selected""",
        """Dependencies: SWU-OEW-007T plus verified SWU-OEW-006P/007/008F receipts
State: SWU-OEW-013B blocked awaiting selected SWU-OEW-007T; 014/014V unselected""",
    )
    replace_exact(
        task_validation,
        """- Dependencies: 008F.
- Target inventory:
  - `.../upstream/L1-BUILD.lock.json`""",
        """- Dependencies: 007T.
- Required immutable input:
  - `.../upstream/L1-BUILD.lock.json`, mutation/binding-owned by 007T while
    retaining 013B as owner, consumer, build owner, and runtime owner.
- Target inventory:""",
    )
    replace_exact(
        task_validation,
        """  A separate Invoke Refresh must own the typed-overlay repair and all affected
  manifest/lock bindings, prove focused and typed-build validation, then
  explicitly reactivate 013B. No successor is selected; 014/014V remain
  planned.""",
        """  `SWU-OEW-007T` now owns the six-path typed-input repair and is the only
  selected unit. 013B no longer owns lock mutation; it remains the immutable
  lock consumer plus final build/runtime owner. Passing 007T must prove the
  existing focused store test and exact fresh-workroot dashboard
  `tsc -b && vite build`, then stop and report 013B eligible without selection.
  No successor is selected; 014/014V remain planned.""",
    )

    wave = PLANNING / "work-pack/waves/W1-L1.md"
    replace_exact(
        wave,
        "Status: stopped at 013B typed-dashboard overlay blocker",
        "Status: 007T typed-overlay repair selected; Task Session preflight pending",
    )
    replace_exact(
        wave,
        """4. 013B clean final feature build plus independent build verification —
   BLOCKED in attempt 003; no implementation execution selected.
5. 014 browser/a11y/isolation producer receipt.
6. 014V independent acceptance verification.""",
        """4. 007T strict typed-overlay repair and exact manifest/lock rebinding —
   SELECTED; runtime preflight not yet run.
5. 013B clean final feature build plus independent build verification —
   BLOCKED until 007T passes and a fresh selection occurs.
6. 014 browser/a11y/isolation producer receipt.
7. 014V independent acceptance verification.""",
    )
    replace_exact(
        wave,
        "Requires receipts 006P, 007, 008F, 013B, 014, and 014V;",
        "Requires receipts 006P, 007, 008F, 007T, 013B, 014, and 014V;",
    )
    replace_exact(
        wave,
        """008F → 013B → 014 → 014V""",
        """008F → 007T → 013B → 014 → 014V""",
    )
    replace_exact(
        wave,
        """Attempt 003 proves the repaired install/core-build/Vitest order, then stops at
the typed dashboard build with 48 errors in three immutable completed-007
overlay sources. The series is stopped, no selector is active, and 014/014V
remain planned and unselected.""",
        """Attempt 003 proves the repaired install/core-build/Vitest order, then stops at
the typed dashboard build with 48 errors in three immutable completed-007
overlay sources. `SWU-OEW-007T` is inserted as the six-path typed-input repair
and is the only selected selector. It may mutate/rebind the lock but must keep
013B as lock consumer, build owner, and runtime owner. 013B depends on 007T and
remains blocked; 014/014V remain planned and unselected.""",
    )


def finalize() -> None:
    chain = load(CHAIN)
    chain["manifest_sha256"] = digest(MANIFEST)
    chain["frontier_readiness"]["sha256"] = digest(READINESS)
    write(CHAIN, chain)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--finalize", action="store_true")
    args = parser.parse_args()
    if args.finalize:
        finalize()
        return 0
    stage_manifest()
    stage_chain()
    stage_continuity()
    stage_markdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
