---
artifact_id: FPR02-LANE-CONTRACT
status: active
updated: 2026-07-17
authority: DEC-FPR02-SUPPORTED-PROFILE
machine_view: fpr02-lanes.yml
---

# FPR-02 Profile Lanes

FPR-02 is a parent profile family with two independently resumable lanes:

- `FPR-02B` owns the backend first-release profile, Body War pilot boundary,
  exact claims, negative classes, rollback, origin, redaction, and stable digest.
- `FPR-02U` owns the required-by-design UI development profile and its later
  DS-D1, DS-D8, and supported-profile owner packet.

The lanes share the ratified FPR-01 baseline and existing compiler substrate,
but neither lane depends on the other lane completing. A blocked UI concept,
authority decision, or empirical-confidence item cannot block backend work. A
backend pilot, provider, origin, or claim decision cannot block UI development.

## Authority split

| Surface | Owner |
|---|---|
| Lane-separation decision | [`DEC-FPR02-SUPPORTED-PROFILE`](../decisions/2026-07-17-fpr02-supported-profile-decision.md) |
| Machine lane projection | [`fpr02-lanes.yml`](fpr02-lanes.yml) |
| Backend execution | [`TASK-FPR-02-SUPPORTED-PROFILE`](../foundation-execution/work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md) |
| UI execution | [`Required UI Profile Work Pack`](../../ui-profile-implementation/WORK-PACK.md) |
| Continuation state | [`projects/domainspec-v2/.craft/ledger.yml`](../../../.craft/ledger.yml) |
| Release admission | first-production-release owner; neither lane self-admits |

The YAML file is a machine-readable projection of the decision. It does not
activate a supported profile, change canonical type/relationship authority, or
authorize production.

## Coordination policy

1. Use distinct profile identifiers, artifacts, fixtures, receipts, and Task
   Sessions for each lane.
2. A lane may consume shared compiler/kernel improvements only through an
   explicit versioned contract that preserves the other lane's current tests.
3. Ordinary incompleteness or a blocker inside one lane never changes the
   other lane's readiness.
4. A shared-substrate incompatibility becomes a named coordination blocker only
   when there is concrete failing evidence against a shared invariant.
5. UI inclusion in any release requires a future explicit owner decision; no
   implicit join with `FPR-02B` exists.

## Current next moves

- Backend: resume `SWU-FPR02-001` at the exact backend profile/contract boundary;
  four backend/pilot decision groups remain before implementation.
- UI: run `SWU-UIP-005` under its existing work-pack. UI authority and
  confidence residue remain local to that lane.
