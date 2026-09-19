---
module: domainspec-v2-foundation-execution
version: current
status: active-profile-lanes
updatedAt: 2026-07-17
docType: invoke-plan
---

# Invoke Plan: DomainSpec v2 Foundation Execution

## Verdict

The foundation route is refreshed around two independent FPR-02 lanes. W2B owns
the backend first-release profile and Body War boundary; W2U points to the
existing required UI development profile. Neither lane waits for the other.
No SWU is executed or selected by this Invoke refresh, and production remains
unauthorized.

## Control Decision

| Field | Value |
|---|---|
| Complexity | high |
| Output mode | split |
| Active layer | L1, independent W2B/W2U lanes |
| Backend next unit | resume `SWU-FPR02-001` Decision Gate |
| UI next unit | `SWU-UIP-005` under its external work-pack |
| Execution owner | one lane-owned Task Session per SWU |
| Continuation authority | `projects/domainspec-v2/.craft/ledger.yml` |
| Release state | production unauthorized |

## Delivery Boundary

Included:

- reopen the live SGRM guard proof without replacing its identities;
- ratify one non-contradictory authority baseline;
- freeze one exact backend supported profile without waiting for UI work;
- continue the required UI development profile without waiting for backend pilot decisions;
- resolve ontology/spec direction and emit a governed `B -> Spec` map;
- prove the smallest authoritative `Spec -> Sg -> G -> Sg_canonical` slice.

Excluded:

- FPR-05 onward, UI admission into the backend release, hosted/public product,
  arbitrary generation, universal equivalence, release authorization, and
  implementation of either lane during Invoke.

## Ordered Route

| Order | Node | Outcome | Entry gate | Exit evidence |
|---:|---|---|---|---|
| 0 | SGRM-006/007 retry | Current guard proves zero active retired-orchestration references | four live violations are reviewable | exact disposition packet, clean report, seeded failure, digest-drift failure |
| 1 | FPR-01 | One owner-ratified authority baseline | guard is green | baseline, deterministic drift validator, owner receipt, count/path/status mutants |
| 2B | FPR-02B | One exact backend supported profile and stable digest | FPR-01 receipt + lane decision | backend product/profile/pilot matrices, validator, stable digest, red fixtures |
| 2U | FPR-02U | Required UI development profile and authority packet | FPR-01 receipt + lane decision | UI mechanics/graph receipts and DS-D1/DS-D8/profile owner packet |
| 3 | FPR-03 | One governed business plane and total `B -> Spec` map | FPR-02B digest verifies and direction decision is accepted | decision, BO/BK/B manifests, total map, typed negatives |
| 4 | FPR-04 | One authoritative two-node/one-edge `Sg` and bounded independent retraction | FPR-03 receipt verifies | source manifest, schemas, Sg, G, quotient registry, independent comparator, mutants |

## Lifecycle Ownership

- Invoke owns this plan only.
- Task Session owns one selected SWU at a time and must build its context pack at execution time.
- Decision Gate owns unresolved owner choices in FPR-01, FPR-02B, and FPR-03.
- The UI profile work-pack owns `SWU-UIP-*`; foundation artifacts may project
  its state but cannot redefine or advance it.
- Definitions Governance owns canonical definition/count promotion.
- Ontology Harness plus semantic owners own FPR-03 mapping governance.
- Semantic, validation, and engine owners jointly own FPR-04; the compiler cannot own its own oracle.
- Craft remains the sole continuation state owner. Registration/status mutation is a separate approved action.

## Handoff Rule

For backend continuation, resume `SWU-FPR02-001` and resolve the four remaining
backend/profile/pilot decisions before schema work. For UI continuation, select
`SWU-UIP-005` under the UI work-pack. Run one Task Session per lane-owned SWU;
do not join the receipts or use either lane's incomplete state as the other's
blocker.

## Package Navigation

- [Work pack](WORK-PACK.md)
- [Execution pack](EXECUTION-PACK.md)
- [Implementation layering](IMPLEMENTATION-LAYERING.md)
- [Dispatch](DISPATCH.json)
- [Distill validation](DISTILL-VALIDATION.md)
- [Plan transport](PLAN-TRANSPORT.md)
- [Planning context](PLANNING-CONTEXT.md)
- [Current remediation plan report](plans/2026-07-16-fpr01-003-remediation/PLAN-REPORT.md)
- [Current remediation task](work-pack/tasks/TASK-FPR01-003-REMEDIATION.md)
- [Current remediation wave](work-pack/waves/W1R-FPR01-003-REMEDIATION.md)
- [Current child dispatch](dispatches/2026-07-16-fpr01-003-remediation.json)
- [FPR-02 lane contract](../profile-lanes/README.md)
- [FPR-02 lane refresh](refreshes/2026-07-17-fpr02-lane-separation/REFRESH-REPORT.md)
- [FPR-02 lane dispatch](dispatches/2026-07-17-fpr02-lane-separation.json)
