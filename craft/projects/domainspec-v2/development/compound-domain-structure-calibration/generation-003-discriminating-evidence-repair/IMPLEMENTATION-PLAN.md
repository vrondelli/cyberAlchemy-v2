---
artifact_id: CDSC3-IMPLEMENTATION-PLAN-v0.1
status: ready-with-runtime-gate
complexity: high
output_mode: split
next_swu: SWU-CDSC3-001
---

# Generation 3 Implementation Plan

## Objective

Implement the approved specification and architecture as nine serialized SWUs.
The plan begins with representation and protection, blocks before browser
downloads without approval, accepts every observation/evaluation outcome, and
ends with one independent audit.

## Source Anchors

- [Specification](SPEC.md), [Architecture](ARCHITECTURE.md),
  [Glossary](GLOSSARY.md), [Decisions](DECISION-LEDGER.md), and
  [Gaps](GAP-LEDGER.md).
- Closed generation-2 [audit](../generation-002-evidence-repair/runs/SWU-CDSC2-007R/AUDIT.md),
  projection, results, provenance, and index tail.
- Frozen parent F3 and M1/M2 receipts.
- UI-repair corpus `record:sha256:b707fc6a7309fc1904ea34f75965c14552432317e0617db6cae92390b6653432`,
  policy `record:sha256:327c2354f02488f964f20c05e2becdf1b884d19fb830ac75c5b19cfbe2905f94`,
  and dossier `record:sha256:da3828d98c1444080030fffc1b4d6d8e9d3f177193645898da83974af1c2d0e8`.
- Savvy `app/page.tsx`, `lib/savvy-fsm.ts`, package manifest, and lockfile are
  read-only source inputs.

## Delivery Tasks

| Task | SWUs | Layer | Outcome |
| --- | --- | --- | --- |
| `TASK-CDSC3-CONTRACTS` | 001-002 | L0 | protected imports, atomic targets, runtime/browser contracts |
| `TASK-CDSC3-BASELINE` | 003 | L0 | source-derived browser baseline equivalence |
| `TASK-CDSC3-OBSERVATIONS` | 004-006 | L1 | permitted, breaking, and usefulness receipts |
| `TASK-CDSC3-ADJUDICATION` | 007 | L2a | 36-cell overlay and deterministic v1 projection |
| `TASK-CDSC3-GENERATION` | 008 | L2b | total results and exact generation-3 append |
| `TASK-CDSC3-VERIFY` | 009 | L3 | fresh replay, authority audit, Inventory closeout |

## Ordered Plan

### 1. Contract And Import Proof

Implement versioned schemas and direct validators for protected imports,
atomic targets, browser manifest/observations, usefulness differential, and
generation-3 overlay. Freeze the six targets with parent-field digests and add
negative vectors for outcome-derived, combined, missing, duplicate,
overlapping, and reordered semantic targets.

The import validator binds generation 2 as exact predecessor and verifies UI
repair inputs remain `DEFER`/`missing`; it cannot interpret them as local
portability evidence.

### 2. Browser Runtime Gate

Preflight confirms no global or Savvy-installed Playwright currently exists.
SWU002 must first emit a Decision Gate if no approved package-local runtime is
present:

1. Pin package-local `@playwright/test` plus Chromium and lock exact artifacts
   (recommended).
2. Bind a user-provided existing Playwright executable and browser cache.
3. Defer browser execution and stop before evidence writes.

No network install or browser download occurs without explicit approval. After
resolution, freeze runtime version, executable digest, browser revision, and
generated-harness dependency map.

### 3. Source-Derived Baseline

Pin exact Savvy source slices, generate a minimal route-tree/browser harness,
and exercise finite navigation vectors. Baseline must reproduce child,
interaction, guard, notice, requested-step, committed-step, and route-state
expectations. A mismatch blocks both mutations.

### 4. Mutation Observations

`M3-P` changes only the generated child adapter and observes T-P-01..04.
`M3-B` changes only the generated commit adapter and observes T-B-01..02.
Each run freezes inputs, structured outputs, supporting screenshots, edit diff,
runtime handle, source manifest handle, and uncertainty.

### 5. Usefulness Differential

Freeze the five-test catalog and explanation/target coverage map before
execution. Run baseline and hypothetical-residual planners twice, sort their
sets, and compute symmetric difference. Preserve empty `D` without flagging
implementation failure.

### 6. Atomic Adjudication And Projection

Review exactly six explanations by six atomic targets. Reviewers consume target
and observation handles but no evaluator output. Structural coverage maps
`full -> explained`, `none -> not-explained`, and `partial/disputed ->
indeterminate`. Materialize a deterministic parent-valid v1 receipt that
retains parent interpretation, maps atomic targets to current Q coordinates,
binds `D`, and carries all unresolved/non-portable uncertainty.

### 7. Evaluate And Append

Rebuild projection, evaluate F3 twice with frozen v1 code, join stable F1/F2,
evaluate suite twice, and accept any total outcome. Create provenance and run
receipts, append one generation after exact generation 2, and prove duplicate
and wrong-tail rejection.

### 8. Independent Audit

A fresh process rebuilds targets, observations, planners, overlay, projection,
results, and chain. It verifies protected bytes, browser/source boundaries,
target provenance, all receipts, no authority inference, and Inventory
read-model-only synchronization.

## Validation Strategy

| Slice | Required Validation |
| --- | --- |
| L0 contracts | schema/direct parity; all negative vectors reject; predecessor and UI handles exact |
| L0 browser | explicit runtime decision receipt; source digests; baseline vectors total and equivalent |
| L1 observations | disjoint edit surfaces; total browser outputs; deterministic rerun; screenshots non-authoritative |
| L1 usefulness | fixed catalog/coverage; sorted unique sets; empty/nonempty/replay fixtures |
| L2 adjudication | 36 unique coordinates; target/observation provenance; dispute and uncertainty retention |
| L2 generation | parent-valid projection; total evaluator output; exact predecessor; atomic append; replay |
| L3 | fresh process; protected hashes; authority scan; all Task Session receipts; Inventory index consistency |

## Parallelism

The default route is serial. After SWU003 baseline acceptance, SWU004 and
SWU005 have disjoint generated mutation/evidence paths and may run in parallel
only through an explicitly authorized runtime with complete handoff packs.
SWU006 may also run after SWU001, but serial local execution is preferred to
keep the human review surface small. All outputs join at SWU007.

## Runtime Gate

`B-CDSC3-PLAYWRIGHT` is resolved by `DEC-CDSC3-011`. SWU002 is authorized to
install pinned package-local `@playwright/test` plus Chromium and freeze the
runtime, browser, executable, and lock digests. The authorization does not close
`GAP-CDSC3-009`: SWU002 must still prove deterministic launch and contract
behavior before any browser evidence task proceeds.

## Completion

The plan is complete when SWU009 closes. A calibration PASS would validate the
rubric only; it would not promote any UI or compound concept.
