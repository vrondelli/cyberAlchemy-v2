---
module: ontology-vault-runtime-api
version: candidate-v0
status: plan-blocked
updatedAt: 2026-07-30
docType: work-pack
authority_effect: none
---

# WORK-PACK: Ontology Vault Runtime API

## Control Fields

| Field | Value |
| --- | --- |
| workPackGateStatus | block |
| complexity | high |
| outputMode | split |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| dispatchTechniqueTrace | [DISPATCH-TECHNIQUE-TRACE.md](DISPATCH-TECHNIQUE-TRACE.md) |
| distillValidationStatus | pass for Plan artifact |
| swuAtomicityStatus | pass; task-shaped count 0 |
| firstUnitNarrownessStatus | pass for declared first future unit |
| closeoutSyncStatus | pass for planning shape |
| activeLayerWindow | L0 after blockers |
| selected_swu | none |
| planEvidence | plan-evidence-pending |
| readinessProfile | private-local-fixture |

The gate is blocked despite Plan Distill pass. Plan coherence does not select
owners, approve caps/isolation, admit a candidate path, execute a witness, or
make a runtime ready.

## Objective And Success Condition

Deliver one owner-approved private local-fixture runtime that implements only
the designed v0 contract and produces a passing end-to-end evidence set. The
work-pack succeeds only when every required positive/negative witness passes,
source bytes remain unchanged, zero outbound and zero owned residue are proven,
and an authority audit confirms `authority_effect:none`.

Candidate implementation root (inactive):
`cyberAlchemy-v2/implementation/ontology-runtime/`.

## Admission Blockers

| ID | Blocker | Owner | Required action |
| --- | --- | --- | --- |
| B-OWNER-CONTRACT | runtime-contract owner absent | decision-gate | name owner and contract location |
| B-OWNER-IMPLEMENTATION | implementation owner absent | decision-gate | name owner and ratify/replace candidate root |
| B-OWNER-TRANSITIONS | registration/snapshot/run/retention/service owners absent | decision-gate | bind each family |
| B-CAPS | fixture caps unapproved and unmeasured | decision-gate | approve/revise hypotheses |
| B-ISOLATION | filesystem/outbound/memory/timeout enforcement unselected | decision-gate | select enforceable mechanism |
| B-ADAPTERS | CAV2/all adapters absent | later owners | v0 fixture adapter only after gates |
| B-AUGMENTOR-RACE | stale-receipt isolation residue open | Augmentor owner route | controlled replay evidence before later admission |

No blocker is silently assigned to a fabricated owner.

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-000 | owner and execution-root decisions bound | pre-L0 | [W0](work-pack/waves/W0.md) | none | signed decision records; no mutation |
| S-001 | frozen schema/config admission boundary | L0 | [W1](work-pack/waves/W1.md) | S-000 | schema fixtures, deterministic rejection, zero writes |
| S-002 | deterministic fixture snapshot + bounded GETs | L0 | [W1](work-pack/waves/W1.md) | S-001 | replay bytes/IDs, source preservation, ETag/cursor |
| S-003 | exact v0 run/draft operations | L0 | [W2](work-pack/waves/W2.md) | S-002 | native separation, same-adapter diff, immutable draft |
| S-004 | fail-closed isolation/caps/race | L1 | [W3](work-pack/waves/W3.md) | S-003 | security, resource, controlled mutation suites |
| S-005 | repeated lifecycle and claim audit | L2 | [W4](work-pack/waves/W4.md) | S-004 | zero-residue replay + authority audit |
| S-006 | later adapter/package decision | L3 | [W5](work-pack/waves/W5.md) | S-005 + new owner approval | deferred; new package required |

## Task Board

| Task | Goal | Layer | Waves | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-READINESS-OWNERS](work-pack/tasks/TASK-READINESS-OWNERS.md) | bind required owners and choices | pre-L0 | W0 | blocked | not-started |
| [TASK-OVR-CORE](work-pack/tasks/TASK-OVR-CORE.md) | schemas, fixture adapter, compiler, bounded reads | L0 | W1 | blocked by W0 | not-started |
| [TASK-OVR-OPERATIONS](work-pack/tasks/TASK-OVR-OPERATIONS.md) | native validation, byte/local-ID diff, draft bytes | L0 | W2 | blocked by W1 | not-started |
| [TASK-OVR-HARDENING](work-pack/tasks/TASK-OVR-HARDENING.md) | security, caps, controlled race | L1 | W3 | blocked by W2 | not-started |
| [TASK-OVR-TEARDOWN](work-pack/tasks/TASK-OVR-TEARDOWN.md) | repeated lifecycle and zero residue | L2 | W4 | blocked by W3 | not-started |
| [TASK-VERIFY](work-pack/tasks/TASK-VERIFY.md) | full fixture verification | L2 | W4 | ready-after-implementation | not-started |
| [TASK-AUDIT-AUTHORITY](work-pack/tasks/TASK-AUDIT-AUTHORITY.md) | claim/authority audit | L2 | W4 | ready-after-verification | not-started |

## Smallest Working Units

The canonical manifest is
[`work-pack/shared/SWU-MANIFEST.json`](work-pack/shared/SWU-MANIFEST.json).

| SWU | Parent | Primary behavior | Layer | Handoff |
| --- | --- | --- | --- | --- |
| SWU-OVR-001 | TASK-OVR-CORE | admit/reject one frozen registration/schema contract | L0 | blocked |
| SWU-OVR-002 | TASK-OVR-CORE | losslessly extract one fixture package | L0 | blocked |
| SWU-OVR-003 | TASK-OVR-CORE | compile/publish one deterministic immutable snapshot | L0 | blocked |
| SWU-OVR-004 | TASK-OVR-CORE | serve bounded immutable snapshot reads | L0 | blocked |
| SWU-OVR-005 | TASK-OVR-OPERATIONS | wrap one native validator result exactly | L0 | blocked |
| SWU-OVR-006 | TASK-OVR-OPERATIONS | compute one same-adapter byte/local-ID diff | L0 | blocked |
| SWU-OVR-007 | TASK-OVR-OPERATIONS | construct/retrieve immutable draft bytes | L0 | blocked |
| SWU-OVR-008 | TASK-OVR-HARDENING | enforce the path/auth/child/outbound security boundary | L1 | blocked |
| SWU-OVR-009 | TASK-OVR-HARDENING | measure/enforce every approved fixture cap | L1 | blocked |
| SWU-OVR-010 | TASK-OVR-HARDENING | fail closed under controlled source/receipt mutation | L1 | blocked |
| SWU-OVR-011 | TASK-OVR-TEARDOWN | start/use/stop exact owned lifecycle with zero residue | L2 | blocked |

`selected_swu:none`. Future execution must select exactly one SWU after W0;
the recommended first choice is SWU-OVR-001.

## SWU Atomicity Review

| SWU | Candidate children | Why retained | Verdict |
| --- | --- | --- | --- |
| 001 | schemas; config; validator | schema alone is not an admission behavior and validator without frozen bytes is undefined | pass |
| 002 | profile inspect; record extraction; source bindings | only their lossless joined result satisfies adapter contract | pass |
| 003 | identity; double extraction; publication | none independently proves a valid immutable snapshot | pass |
| 004 | metadata; records; sources; ETag | one bounded read contract is accepted as a single interface behavior | pass |
| 005 | child launch; result wrapper | wrapper is meaningless without exact invocation/result | pass |
| 006 | ID set; payload hash; source binding | all are one explicitly bounded diff result | pass |
| 007 | byte construction; retrieval | immutable constructor behavior requires retrievable content identity | pass |
| 008 | auth; path; child; outbound | jointly define one security boundary; acceptance is one negative matrix | pass |
| 009 | measurement; cap decision; cleanup | cap enforcement is invalid without measurement and cleanup | pass |
| 010 | source mutation; stored receipt mutation | both challenge the same complete package-identity invariant | pass |
| 011 | start; use; stop | teardown proof needs the owned lifecycle it closes | pass |

## First-Unit Narrowness

SWU-OVR-001 is the narrowest reversible trust-building unit: it creates only
frozen contract/config bytes, a fail-closed validator, and contract fixtures.
It does not compile, serve, spawn a native validator, or publish runtime state.
Its complete changes can be removed without migration.

## Task Session Closeout Sync

Every mutation-capable SWU has a complete row in
[`work-pack/shared/CLOSEOUT-SYNC-CONTRACT.json`](work-pack/shared/CLOSEOUT-SYNC-CONTRACT.json).
This structural pass does not admit a SWU; owner decisions and one explicit
selection are still mandatory.

## Validation Strategy

| Slice | Positive | Negative | Required evidence |
| --- | --- | --- | --- |
| S-001 | valid fixture config admitted deterministically | malformed/path/unknown/owner-shape cases rejected | schema validator receipt + zero-write proof |
| S-002 | double extraction and replay byte-identical; reads bounded | drift, nondeterminism, collision, invalid cursors | snapshot/query receipts |
| S-003 | exact native result, bounded diff, draft bytes | process failure, cross-adapter/semantic/delivery unsupported | run/artifact receipts |
| S-004 | allowed local access works within caps | traversal, symlink, outbound, each cap, concurrent mutation | security/resource/race receipts |
| S-005 | repeated start/use/stop | unowned target and residue detection | teardown + authority audit receipts |
| S-006 | n/a | premature adapter/release route rejected | decision record only |

Unit, contract, replay, race, isolation, native-separation, capability matrix,
security, resource, curl, and browser layers are required. Browser evidence
proves only observed HTTP/browser behavior.

## Plan Distill And Gate

Plan Distill passes the artifact’s unit structure, atomicity, first-unit
narrowness, recomposition, and navigation. The blocker verdict is nevertheless
`workPackGateStatus:block` because acceptance-critical owner and execution-root
decisions are absent. See
[`PLAN-DISTILL-VALIDATION.md`](PLAN-DISTILL-VALIDATION.md).

## Next Route

`decision-gate`, then deferred. Do not route to Task Session while
`selected_swu:none` or any W0 blocker remains.

