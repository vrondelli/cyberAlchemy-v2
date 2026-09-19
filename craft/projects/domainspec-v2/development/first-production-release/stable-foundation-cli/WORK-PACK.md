---
module: stable-foundation-cli
workPackId: WP-SFC-001
version: candidate-1
status: selection-ready
updatedAt: 2026-08-16
docType: work-pack
authorityEffect: none
---

# WORK-PACK: Stable Foundation CLI

## Control fields

| Field | Value |
| --- | --- |
| workPackGateStatus | pass |
| complexity | high |
| outputMode | split |
| executionPackRef | `EXECUTION-PACK.md` |
| layeringArtifactRef | `IMPLEMENTATION-LAYERING.md` |
| dispatchTechniqueTrace | `EXECUTION-DISPATCH.json` |
| distillValidationStatus | pass |
| swuAtomicityStatus | pass; task-shaped count 0 |
| firstUnitNarrownessStatus | pass; `SWU-SFC-001` |
| closeoutSyncStatus | pass |
| admissionTiming | selected-unit-at-task-session |
| executionEntryState | selection-ready |
| allowedRoutesDigest | `dc177fabf7026920418291162bc5f02500c16c8718129ea3e5b3789aa370b308` |
| activeLayerWindow | L0 |
| readinessProfile | release-candidate |
| planEvidenceState | plan-evidence-pending |

## Objective

Implement and evidence the candidate defined by `SPEC.md` and `DESIGN.md`
without changing semantic/profile authority or releasing it. Success means all
20 SWUs close in order with exact receipts, the two-root/security/resource/
compatibility/operator campaigns pass, and an independent verifier can present
the exact candidate to the release owner. Success does not itself authorize release.

## Source bindings

- decision SHA-256: `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`;
- Design manifest input digest: `b97b87b3338ef171dce6016c61f665d8048609836fa602b7e0a5e9e3111cf18f`;
- Design fixed-point digest: `1858fe78c07d97e02dea1d106eb5c485a553602b1cb901008e4f17b685f20f03`;
- detailed machine bindings: `work-pack/shared/SOURCE-BINDINGS.json`.

## Execution policy

The machine projection in `EXECUTION-ENTRY.json` is authoritative for internal
route shape. It declares all 20 ordered SWUs as a finite frontier, exact Task
Session write scopes, required inputs, expected receipts, automatic decisions,
and protected stop classes. No unit is selected by this Work Pack.

## Delivery slices

| Slice | Outcome | Layer | Wave | Validation |
| --- | --- | --- | --- | --- |
| SFC-S1 | closed contract/source/result denominator | L0 | W0 | contract, root, P2/C2, schema mutants |
| SFC-S2 | compiled deterministic read-only CLI | L1 | W1 | command, channel, build, clean-root proof |
| SFC-S3 | security/resource hardening | L2 | W2 | dependency/canary/network/permission/boundary campaigns |
| SFC-S4 | compatibility and immutable recovery | L2/L3 | W3 | N-1, migration, archive, rollback/withdrawal/quarantine drills |
| SFC-S5 | candidate and operator readiness | L3 | W4 | frozen binding, invalidation mutants, independent pilot |

## Task status board

| Task | Goal | Layer | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-SFC-CONTRACT](work-pack/tasks/TASK-SFC-CONTRACT.md) | closed foundation/package boundary | L0 | W0 | ready | not-started |
| [TASK-SFC-INPUT](work-pack/tasks/TASK-SFC-INPUT.md) | explicit project root and P2/C2 binding | L0 | W0 | after 002 | not-started |
| [TASK-SFC-SCHEMAS](work-pack/tasks/TASK-SFC-SCHEMAS.md) | separate result contracts and decoders | L0 | W0 | after 004 | not-started |
| [TASK-SFC-COMMANDS](work-pack/tasks/TASK-SFC-COMMANDS.md) | supported lint/receipt behavior | L1 | W1 | after 006 | not-started |
| [TASK-SFC-BUILD](work-pack/tasks/TASK-SFC-BUILD.md) | one-lock compiled deterministic package | L1 | W1 | after 008 | not-started |
| [TASK-SFC-SECURITY](work-pack/tasks/TASK-SFC-SECURITY.md) | dependency and pointer-only security | L2 | W2 | after 010 | not-started |
| [TASK-SFC-RESOURCES](work-pack/tasks/TASK-SFC-RESOURCES.md) | enforce and measure selected envelope | L2 | W2 | after 010 | not-started |
| [TASK-SFC-COMPATIBILITY](work-pack/tasks/TASK-SFC-COMPATIBILITY.md) | N-1 and immutable history | L2 | W3 | after 012/014 | not-started |
| [TASK-SFC-RELEASE-EVIDENCE](work-pack/tasks/TASK-SFC-RELEASE-EVIDENCE.md) | private candidate/archive/recovery evidence | L3 | W3/W4 | after 016 | not-started |
| [TASK-SFC-PILOT-READINESS](work-pack/tasks/TASK-SFC-PILOT-READINESS.md) | independent operator and release-owner handoff | L3 | W4 | after 018 | not-started |

## SWU manifest

`work-pack/shared/SWU-MANIFEST.json` owns the 20 unit definitions. Each unit has
exactly one parent task, one primary behavior, one independently reviewable
acceptance boundary, split analysis, normalized write scope, source anchors,
validation contracts, closeout target inventory, expected receipt, and successor.

## First-unit gate

`SWU-SFC-001` creates a closed foundation-contract schema, accepted contract,
dependency-free validator, and one killed branch mutant. Those bytes form one
validation behavior and can pass without a package install, profile mutation,
command implementation, or release effect. Splitting schema from validator would
leave neither side executable as a trust check; adding package/build work would
mix an independently verifiable concern.

## Task Session closeout synchronization

The exact per-unit contracts are in `work-pack/shared/CLOSEOUT-CONTRACT.md` and
the SWU manifest. A closeout may update only `WORK-PACK.md`,
`EXECUTION-ENTRY.json`, the shared SWU manifest, the owning task, the owning wave,
and the unit's fixed closeout receipt path. Task Session source receipts remain
separate. Closeout uses Invoke Refresh apply-approved only after exact validation
and never admits the successor by itself.

## Blockers and prerequisites

No blocker prevents Plan authoring or selecting the first contract unit. Later
SWUs fail closed on these typed prerequisites:

| ID | Scope | Condition | Owner/route |
| --- | --- | --- | --- |
| SFC-PR-001 | profile input | owner-ratified P2 receipt with exact 13/16 membership does not exist | profile owner; stop before SWU-004 acceptance |
| SFC-PR-002 | build | exact install-script allowlist and locked-byte review not yet accepted | build/security owners; SWU-009 |
| SFC-PR-003 | evidence | benchmark corpus and clean-root containers/fixtures not yet materialized | validation owner; SWU-014/017 |
| SFC-PR-004 | people | independent verifier, operator, support contact, proposer, and approver identities are late-bound | release owner; SWU-019/020 |
| SFC-PR-005 | release | production/release authorization is absent by design | DomainSpec-v2 Owners; outside this Work Pack execution |

These prerequisites are work inputs, not evidence that the planned controls pass.

## Dispatch technique trace

| Technique | Applied to | Expectation | Status |
| --- | --- | --- | --- |
| `sequence` | ordered 20-SWU frontier | dependencies precede selection | pass |
| `scu_swu_reduction` | each unit | one behavior/acceptance boundary | pass |
| `recomposition_proof` | units → five slices → design | no hidden glue or lost contract | pass |
| `validation_loop` | every SWU and wave | positive plus discriminating negative evidence | pass |
| `owner_boundary_check` | profile/conformance/CLI/release | no owner collapse | pass |
| `execution_receipt_handoff` | Task Session and closeout | receipt shape and target inventory known before mutation | pass |
| `authority_split_gate` | protected effects | implementation never implies promotion/release | pass |
| `residue_ledger` | typed prerequisites | missing evidence remains visible | pass |

## Distill validation

See `DISTILL-VALIDATION.md`. Verdict: pass. The first unit is narrow, all 20
units have split analyses, and the plan recomposes into every selected Design
concern. Planned witness execution remains pending.

## Gate checks

- Design selection: pass and fixed point.
- Exact SWU/parent count: 20/20 and 10 parents.
- SWU atomicity/task-shaped count: pass/0.
- Closeout contract coverage: 20/20.
- Implementation Readiness projection: pass; 20 routes, digest
  `dc177fabf7026920418291162bc5f02500c16c8718129ea3e5b3789aa370b308`.
- Dispatch Spec: pass; zero blocks and zero flags.
- Cross-lane integration projection: pass; exact shared decision digest and zero
  prefix-overlapping future write scopes across 189 Lane A and 88 unique Lane B paths.
- Product implementation, profile mutation, release, Git, and external effects: none in this authoring run.

## Current state and next route

No selected SWU. `EXECUTION-ENTRY.json` routes a future direct Work Pack execution
intent to `implementation-readiness:execute`. The present authorization ends after
planning validation and cross-lane integration; it cannot start Task Session.
