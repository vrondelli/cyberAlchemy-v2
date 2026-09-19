---
work_pack_id: WP-CDSC2-001
status: complete-via-refresh
complexity: medium
output_mode: split
active_layer: closed
next_owner: evidence-repair
next_swu: none
mutation_authority: selected SWU write scope only
---

# Generation 2 Evidence Repair Work Pack

## Objective

Observe the two missing F3 mutations in an isolated, source-derived harness and
append a deterministic successor calibration generation without changing
generation 1, Savvy, GoldenQuill, or canonical authority.

## Source Design References

- [Specification](SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Glossary](GLOSSARY.md)
- [Decisions](DECISION-LEDGER.md)
- [Gaps](GAP-LEDGER.md)
- [Implementation layering](IMPLEMENTATION-LAYERING.md)
- [Implementation plan](IMPLEMENTATION-PLAN.md)

## SWU Manifest

| SWU | Layer | Parent task | Dependencies | State | Execution owner |
| --- | --- | --- | --- | --- | --- |
| [SWU-CDSC2-001](work-pack/tasks/TASK-CDSC2-CONTRACTS.md#swu-cdsc2-001---parity-preflight-and-successor-contract) | L0 | TASK-CDSC2-CONTRACTS | none | complete | local-fallback |
| [SWU-CDSC2-002](work-pack/tasks/TASK-CDSC2-HARNESS.md#swu-cdsc2-002---source-derived-baseline-harness) | L0 | TASK-CDSC2-HARNESS | 001 | complete | local-fallback |
| [SWU-CDSC2-003](work-pack/tasks/TASK-CDSC2-EXPERIMENTS.md#swu-cdsc2-003---m1-permitted-screen-substitution) | L1 | TASK-CDSC2-EXPERIMENTS | 002 | complete | local-fallback |
| [SWU-CDSC2-004](work-pack/tasks/TASK-CDSC2-EXPERIMENTS.md#swu-cdsc2-004---m2-breaking-guard-bypass) | L1 | TASK-CDSC2-EXPERIMENTS | 002 | complete | local-fallback |
| [SWU-CDSC2-005](work-pack/tasks/TASK-CDSC2-GENERATION.md#swu-cdsc2-005---freeze-repaired-f3-receipt) | L2 | TASK-CDSC2-GENERATION | 003-004 | superseded | local-fallback |
| [SWU-CDSC2-006](work-pack/tasks/TASK-CDSC2-GENERATION.md#swu-cdsc2-006---evaluate-and-append-generation-2) | L2 | TASK-CDSC2-GENERATION | 005 | superseded | local-fallback |
| [SWU-CDSC2-007](work-pack/tasks/TASK-CDSC2-VERIFY.md#swu-cdsc2-007---independent-replay-and-closeout) | L3 | TASK-CDSC2-VERIFY | 006 | superseded | manual |

Each SWU has one parent and one disjoint primary write scope. Execute one SWU
per Task Session.

## Delivery Slices

| Slice | Output | Gate |
| --- | --- | --- |
| L0 | parity preflight, successor wrapper, harness manifest, baseline witness | no enum drift, source drift, predecessor ambiguity, or baseline mismatch |
| L1 | M1 and M2 observation receipts | total deterministic vector outputs and edit-surface compliance |
| L2 | F3 receipt v2, fixture/suite results, second generation-index entry | reviewed evidence, total classification, append-only predecessor chain |
| L3 | independent replay and authority audit | exact equality, clean sources, bounded next route |

## Global Done Contract

- Generation-1 protected files remain byte-identical.
- Savvy and GoldenQuill remain read-only.
- Both mutations run only after baseline equivalence passes.
- Refuted or indeterminate observations remain visible.
- F1/F2 are reused by stable handle.
- Generation 2 has generation 1 as its direct predecessor.
- Every SWU returns a Task Session receipt and observability signal.
- No result claims identity, irreducibility, portability, pattern admission,
  replication, authority, activation, or promotion.

## Blockers And Gaps

The old L2/L3 continuation is superseded by
`refreshes/2026-07-12-three-layer-adjudication/REFRESHED-WORK-PACK.md`.
SWU-CDSC2-005A implemented the selected overlay contract and deterministic
compatibility materializer. SWU-CDSC2-005B froze the twelve-cell adjudication
overlay and parent-valid compatibility receipt. SWU-CDSC2-006R preserved the
deferred outcome and appended the exact successor. SWU-CDSC2-007R independently
replayed the chain, synchronized Inventory, and closed the package.

Runtime must also block on source drift, generation-1 byte drift, baseline
mismatch, overlapping mutant edit surfaces, or predecessor conflict.

## Runtime Handoff

Closed through the refreshed work-pack. No SWU remains. Any `evidence-repair`
continuation requires a new governed package; do not resume old SWU005-SWU007
or mutate the frozen two-generation chain.
