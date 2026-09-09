---
module: ontology-evidence-workbench-typed-test-recovery
version: candidate-1
status: candidate-local-implementation-complete
updatedAt: 2026-08-04
docType: work-pack
---

# WORK-PACK: OEW Typed-Test Recovery

## Control fields

| Field | Value |
| --- | --- |
| workPackGateStatus | pass |
| complexity | medium |
| outputMode | split |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| dispatchTechniqueTrace | [PLAN-TECHNIQUE-TRACE.md](PLAN-TECHNIQUE-TRACE.md) |
| distillValidationStatus | pass; two-round read-only audit, see [PLAN-DISTILL.md](PLAN-DISTILL.md) |
| swuAtomicityStatus | pass; task-shaped count 0 |
| firstUnitNarrownessStatus | pass |
| closeoutSyncStatus | candidate-local validation PASS; governed per-SWU reconciliation deferred to `HN-7362EC2F08B7` |
| activeLayerWindow | closed |
| selectedSWU | none; SWU-OEWFR-001 through 007 complete |
| readinessProfile | candidate-local prototype recovery |

## Objective

Make private OEW typed-test failures actionable after mandatory cleanup and
predeclare their terminal reference, without retrying SWU006, selecting the
independent compatibility repair, or changing public lifecycle owners.

Success means all seven implementation SWUs and the verification exemption are
closed with no-network evidence; it does not mean the generalized build,
browser acceptance, SWU006, release, or deployment passed.

## Delivery slices

| Slice | Outcome | Layer | Wave | Validation |
| --- | --- | --- | --- | --- |
| S0 | exact baseline and dirty-tree safety frozen | L0 | [W0](work-pack/waves/W0-READINESS.md) | read-only digest/preflight receipt |
| S1 | bounded sanitizer and exclusive writer | L0 | [W1](work-pack/waves/W1-PRIMITIVES.md) | primitive no-network fixtures |
| S2 | actual typed failure branch preserves evidence and cleanup | L1 | [W2](work-pack/waves/W2-BUILDER-INTEGRATION.md) | injected pass/fail/preference fixtures |
| S3 | admitted terminal output/reference contract | L2 | [W3](work-pack/waves/W3-ADMISSION.md) | planning contract validation |
| S4 | package closure and compatibility decision handoff | L3 | [W4](work-pack/waves/W4-VERIFY.md) | complete no-network verification receipt |

## Task board

| Task | Goal | Layer | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-OEWFR-READINESS](work-pack/tasks/TASK-OEWFR-READINESS.md) | freeze exact baseline | L0 | W0 | baseline frozen | complete-candidate-local |
| [TASK-OEWFR-01](work-pack/tasks/TASK-OEWFR-01-PRIMITIVES.md) | sanitize and persist bounded evidence | L0 | W1 | SWUs 001–002 PASS | complete-candidate-local |
| [TASK-OEWFR-02](work-pack/tasks/TASK-OEWFR-02-BUILDER-INTEGRATION.md) | integrate evidence into actual typed gate | L1 | W2 | SWUs 003–005 PASS | complete-candidate-local |
| [TASK-OEWFR-03](work-pack/tasks/TASK-OEWFR-03-ADMISSION.md) | predeclare terminal evidence contract | L2 | W3 | SWUs 006–007 PASS | complete-candidate-local |
| [TASK-OEWFR-VERIFY](work-pack/tasks/TASK-OEWFR-VERIFY.md) | closure verification and decision handoff | L3 | W4 | V-OEWFR-01..13 PASS | complete-candidate-local |

## SWU manifest

The machine-readable source is [SWU-MANIFEST.json](SWU-MANIFEST.json).

| SWU | Parent | Primary behavior | Dependency | Owner | State |
| --- | --- | --- | --- | --- | --- |
| SWU-OEWFR-001 | [TASK-OEWFR-01](work-pack/tasks/TASK-OEWFR-01-PRIMITIVES.md) | deterministic diagnostic sanitization | readiness | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-002 | [TASK-OEWFR-01](work-pack/tasks/TASK-OEWFR-01-PRIMITIVES.md) | contained exclusive evidence writer | 001 | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-003 | [TASK-OEWFR-02](work-pack/tasks/TASK-OEWFR-02-BUILDER-INTEGRATION.md) | injected command/writer seam | 002 | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-004 | [TASK-OEWFR-02](work-pack/tasks/TASK-OEWFR-02-BUILDER-INTEGRATION.md) | nonzero typed-gate evidence mapping | 003 | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-005 | [TASK-OEWFR-02](work-pack/tasks/TASK-OEWFR-02-BUILDER-INTEGRATION.md) | cleanup and stronger-blocker precedence | 004 | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-006 | [TASK-OEWFR-03](work-pack/tasks/TASK-OEWFR-03-ADMISSION.md) | bounded terminal evidence output slot | 004 | task-session/local-fallback | complete-candidate-local |
| SWU-OEWFR-007 | [TASK-OEWFR-03](work-pack/tasks/TASK-OEWFR-03-ADMISSION.md) | generic terminal reference join contract | 006 | task-session/local-fallback | complete-candidate-local |

## SWU atomicity

| SWU | Candidate children | Why retained | Verdict |
| --- | --- | --- | --- |
| 001 | hashing, redaction, truncation | one pure transform needs all three to be safe/actionable | pass |
| 002 | path guard, exclusive write, re-read | no persisted reference is valid unless all close one writer transaction | pass |
| 003 | runner injection, writer injection | one dependency-injection seam; neither has value without callable defaults | pass |
| 004 | nonzero mapping, reference attachment | one failure transition and acceptance boundary | pass |
| 005 | writer-failure precedence, cleanup precedence | one terminal precedence table validated together | pass |
| 006 | path pattern, schema/bounds/redaction fields | one admitted output slot is invalid if any bound is absent | pass |
| 007 | reference fields, missing-reference negative | one consumer join rule plus its required fail-closed case | pass |

The first selected SWU is 001 because it is pure, reversible, no-network, and
establishes the safety boundary every later write depends on.

## Candidate-local completion evidence

Fast-lane attempt `20260803T222716Z` implemented SWU-OEWFR-001 through 007 in
the declared order. The [validation report](work-pack/session-evidence/FAST-LANE/20260803T222716Z/PROTOTYPE-VALIDATION-REPORT.md)
and [machine receipt](work-pack/session-evidence/FAST-LANE/20260803T222716Z/receipt.json)
record 25/25 builder tests and V-OEWFR-01 through 13 PASS. Current builder and
test postimages are respectively
`2ae10b97a60f924c82c5da068dab23a9ad61c9c1be2f152d35dca57a93fab86e`
(81021 bytes) and
`3f94699d92a0e06a0d33710cd7e8771f98055c560ba31ad9056cc5dd2bf402bd`
(35824 bytes).

This closes the candidate-local recovery Work Pack only. Governed per-SWU
Invoke Refresh/Task Session reconciliation remains assigned to
`HN-7362EC2F08B7`; the compatibility decision, successor binding, fresh retry,
generalized build and browser evidence remain outside this completion claim.

## Task Session closeout synchronization

Every mutation SWU uses terminal receipt
`planning/work-pack/session-evidence/<SWU>/<attempt-id>/receipt.json`, validates
only its declared targets, and routes through `invoke:refresh:apply-approved`.
Baselines are SHA-256 snapshots captured at preflight; any drift blocks.

| SWU | Declared target inventory | Allowed deltas | Owner validation | Successor |
| --- | --- | --- | --- | --- |
| 001 | builder source; builder test | sanitizer code/tests only | targeted Node tests, scoped whitespace | 002 |
| 002 | builder source; builder test | writer/path code/tests only | targeted Node tests, escape/collision negatives | 003 |
| 003 | builder source; builder test | injected seam/defaults/tests only | existing plus injection fixtures | 004 |
| 004 | builder source; builder test | nonzero evidence mapping/tests only | pass/nonzero/empty/oversize/secret fixtures | 005 |
| 005 | builder source; builder test | blocker precedence/cleanup tests only | writer/cleanup failure matrix | 006 |
| 006 | parent OEWSN mutation-admission contract and closeout inventory | terminal output slot only | JSON/schema/path/bounds checks | 007 |
| 007 | parent OEWSN work-pack/task terminal reference clauses | evidence reference join/negative only | link/field/authority checks | none; W4 verification |

Closeout never admits another SWU, retry, network, build, browser, authority,
promotion, publication, deployment, or destructive cleanup. Successors are
selection candidates only and require fresh Task Session admission.

## Validation strategy

See [VALIDATION-STRATEGY.md](VALIDATION-STRATEGY.md). Every implementation SWU
runs targeted no-network Node tests and scoped whitespace/link checks. W4 runs
the combined fixture bank but not the generalized build or browser.

## Blocker and residue ledger

| ID | Class | State | Owner/route |
| --- | --- | --- | --- |
| R-OEWFR-01 | test-side versus config-side repair unselected; real DOM focus unproved | deferred | [compatibility Decision Gate](../design/COMPATIBILITY-DECISION-PACKET.md) then fresh Invoke admission |
| R-OEWFR-02 | another typed/import failure may emerge | retained | future admitted attempt |
| R-OEWFR-03 | retry and immutable-lockfile fetch authority absent | blocking only for runtime retry, not this plan | direct owner decision after package closure |
| R-OEWFR-04 | public generic Task Session maintenance not admitted | deferred | separate public-safe maintenance package |
| R-OEWFR-05 | Inventory append-candidate loses existing entries | separate residue | Inventory owner; outside this package |

## Gate checks

1. Design validator pass is current and fixed-point.
2. One selected SWU exists and is narrow.
3. Every mutation SWU has exact targets, validation, closeout, and successor.
4. No write scope includes public Arcanum, generated runs, compatibility patch
   or binding, patch0004, binding006, or retained workspaces.
5. Distill must pass before Task Session handoff.
6. Full Dispatch Spec validation must pass.
7. Planning pass does not imply registry release or runtime readiness.
