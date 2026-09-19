---
module: formal-model-proof-provider
version: 0.2.0-candidate-plan
status: owner-prerequisite
updatedAt: 2026-08-24
docType: work-pack
---

# Work Pack Candidate: DomainSpec v2 TLA/TLC Model-Evidence Provider

## Control fields

| Field | Value |
| --- | --- |
| workPackId | `WP-FMP-002` |
| supersedesIfAccepted | `WP-FMP-001` |
| workPackGateStatus | flag — exact owner prerequisites pending |
| executionStatus | not-started |
| mutationAuthorized | false |
| complexity | high |
| outputMode | split |
| admissionTiming | selected-unit-at-task-session |
| executionEntryState | owner-prerequisite |
| selectedUnit | none |
| activeLayerWindow | planning only |
| executionPack | [EXECUTION-PACK.md](EXECUTION-PACK.md) |
| layering | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| baseline | [WRITE-SCOPE-BASELINE.json](WRITE-SCOPE-BASELINE.json) |
| sourceLocks | [SOURCE-LOCKS.json](SOURCE-LOCKS.json) |
| executionEntry | [EXECUTION-ENTRY.json](EXECUTION-ENTRY.json) |

## Objective

Add one explicitly registered TLA/TLC provider beneath the existing architecture-conformance factory. The provider supplies only TLA/TLC-specific contracts, bounded execution semantics, total outcome classification, normalized evidence, and two exact corpora. The factory keeps its existing lock, snapshot, run, repeat, replay, verification, reproduction, accounting, receipt, and atomic evidence-publication lifecycle.

## Non-objectives

This candidate does not implement the EVF-to-factory adapter, create a parallel lifecycle or receipt, change model semantics, repair `FreshnessSafety`, add Zig trace conformance, provision tools, select an SWU, execute TLC, mutate product code, commit, push, publish, promote, release, deploy, certify production, or change authority.

## Frozen six-unit frontier

```text
SWU-FMP2-001 -> SWU-FMP2-002 -> SWU-FMP2-003
             -> SWU-FMP2-004 -> SWU-FMP2-005
             -> SWU-FMP2-006
```

The ordering is a deterministic execution frontier. The corpus meanings stay independent even though the later Task Sessions are serialized.

## Delivery slices and task board

| Layer | SWU | Task | Primary acceptance boundary | Current gate |
| --- | --- | --- | --- | --- |
| L0 | `SWU-FMP2-001` | [TLA semantic kernel and total classifier](tasks/TASK-FMP2-001-SEMANTIC-KERNEL.md) | pure decoder/classifier hostile corpus | candidate; no selection |
| L1 | `SWU-FMP2-002` | [generic factory material-lock seam](tasks/TASK-FMP2-002-FACTORY-MATERIAL-SEAM.md) | shared lock/resolver/direct-replay identity with legacy compatibility | blocked on factory owner |
| L2 | `SWU-FMP2-003` | [registered TLA/TLC provider](tasks/TASK-FMP2-003-TLA-PROVIDER.md) | fake-tool provider emits recomputable existing evidence | depends on 001-002 |
| L2 | `SWU-FMP2-004` | [exact Bolina corpus](tasks/TASK-FMP2-004-BOLINA-CORPUS.md) | attributed 17-case denominator and M10 isolation | depends on 003 |
| L2 | `SWU-FMP2-005` | [exact Order Saga corpus](tasks/TASK-FMP2-005-ORDER-SAGA-CORPUS.md) | separate five-case denominator with named known red | depends on 004 |
| L3 | `SWU-FMP2-006` | [two-corpus integration and closure](tasks/TASK-FMP2-006-INTEGRATION-CLOSEOUT.md) | existing factory lifecycle plus terminal inventory/claim closure | depends on 005 |

## Reduction from `WP-FMP-001`

| Earlier unit | New disposition |
| --- | --- |
| `SWU-FMP-001` | retained as `SWU-FMP2-001` |
| `SWU-FMP-002` | re-homed to factory ownership as `SWU-FMP2-002` |
| `SWU-FMP-003` | generic direct/replay portion merges into factory-owned 002; provider-specific context merges into 003 |
| `SWU-FMP-004` | narrowed and retained as `SWU-FMP2-003` |
| `SWU-FMP-005` | retained as `SWU-FMP2-004` |
| `SWU-FMP-006` | retained as `SWU-FMP2-005` |
| `SWU-FMP-007` | shrunk to existing-lifecycle integration in `SWU-FMP2-006` |
| `SWU-FMP-VERIFY-008` | product-read-only closure merges into `SWU-FMP2-006` |

## Shared invariants

1. Exactly three provider input roles: case manifest, model bundle, proof denominator.
2. Executable Java and non-executable `tla2tools.jar` remain different identity kinds.
3. The factory resolves explicit absolute selectors; the provider never searches PATH, HOME, or the network.
4. Direct and replay bind the same provider, components, executable, artifact, timeout, and exact inputs.
5. TLC runs in private scratch with bounded output, one worker, per-case bounds, and acceptance-critical cleanup.
6. Fatal, incomplete, wrong-property, missing-marker, timeout, signal, and output-limit outcomes never become semantic pass.
7. Provider totals are derived; existing factory proof-accounting recomputation remains sole accounting authority.
8. No FMP-owned factory receipt, verifier, replay engine, reproducer, or publisher is added.
9. Bolina retains seven obligations and ten mutants; M10 requires clean corrected base plus exact legacy mutant discrimination.
10. Order Saga retains three declared outcomes and two mutants; `FreshnessSafety` remains expected-red.

## Baseline, source, and write discipline

The exact earlier 41-target baseline and 24-file/two-tool lock set were revalidated live and are referenced through digest-bound projection files. Before any later Task Session, revalidate the selected unit only against the current live tree and accepted predecessor postimage. Block on drift, collisions, missing predecessor receipts, or unrelated overlap. Stage only exact unit paths; never bulk-stage or destructively restore.

All execution evidence belongs under `projects/domainspec-v2/development/formal-model-proof-provider/execution-runs/wp-fmp-002/`. It does not exist at Plan time.

## Validation strategy

Every unit runs focused tests, factory typecheck, the required regression surface, JSON validation where applicable, and scoped whitespace. The terminal unit also revalidates sources/tools, live execution, replay, verify, reproduce, tamper rejection, output collision, no residue, exact postimages, the six execution receipts, the six owner receipts, the unique successor chain, and claim ceilings. See [VALIDATION-STRATEGY.md](VALIDATION-STRATEGY.md).

## Owner gates and current truth

`BLK-FMP2-FACTORY-MATERIAL-LOCK` and `BLK-FMP2-EXACT-PLAN-SUPERSESSION` remain open. Therefore this candidate routes only to its exact owner prerequisite; it does not route to Task Session or Implementation Readiness selection. `WP-FMP-001` remains operative until an exact response says otherwise.

## Completion criteria

After future acceptance and selection, this Work Pack completes only when the exact six-unit frontier is visited once, all six execution and owner receipts pass, both exact corpora match their declared outcomes, the existing factory lifecycle closes, no product/scratch/foreign residue remains, successor is null, and the claim ceiling is unchanged.

## Claim ceiling

Even completed, this Work Pack supports only deterministic same-host bounded TLA/TLC model evidence for the exact locked Bolina and Order Saga corpora through the existing factory. It is not a theorem, TLAPS proof, implementation-conformance proof, filesystem/security/cross-host proof, generic formal-method certification, publication, release, deployment, production certification, or authority change.
