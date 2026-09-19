---
work_pack_id: WP-CDSC-001
status: complete
complexity: medium
output_mode: split
active_layer: L3
next_owner: evidence-repair-owner
next_swu: none
mutation_authority: closed generation; future work requires a new bounded generation
---

# Compound Domain Structure Calibration Work Pack

## Objective

Implement and run the three-fixture residual-analysis calibration defined by
`SPEC.md` and `ARCHITECTURE.md` without mutating fixture repositories, DS-D1,
DS-D8, candidates, validators, patterns, or promotion state.

## Source Design References

- [Specification](SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Glossary](GLOSSARY.md)
- [Decisions](DECISION-LEDGER.md)
- [Gaps](GAP-LEDGER.md)
- [Implementation layering](IMPLEMENTATION-LAYERING.md)

## SWU Manifest

| SWU | Layer | Parent task | Dependencies | State | Execution owner |
| --- | --- | --- | --- | --- | --- |
| [SWU-CDSC-001](work-pack/tasks/TASK-CDSC-CONTRACTS.md#swu-cdsc-001---freeze-contracts-and-fixture-manifest) | L0 | TASK-CDSC-CONTRACTS | none | complete | local-fallback |
| [SWU-CDSC-002](work-pack/tasks/TASK-CDSC-CONTRACTS.md#swu-cdsc-002---deterministic-evaluator) | L0 | TASK-CDSC-CONTRACTS | 001 | complete | local-fallback |
| [SWU-CDSC-003](work-pack/tasks/TASK-CDSC-FIXTURES.md#swu-cdsc-003---f1-fabrication-gate-receipt) | L1 | TASK-CDSC-FIXTURES | 001-002 | complete | local-fallback |
| [SWU-CDSC-004](work-pack/tasks/TASK-CDSC-FIXTURES.md#swu-cdsc-004---f2-usehasmounted-receipt) | L1 | TASK-CDSC-FIXTURES | 001-002 | complete | local-fallback |
| [SWU-CDSC-005](work-pack/tasks/TASK-CDSC-FIXTURES.md#swu-cdsc-005---f3-savvy-page-receipt) | L1 | TASK-CDSC-FIXTURES | 001-002 | complete | local-fallback |
| [SWU-CDSC-006](work-pack/tasks/TASK-CDSC-EVALUATION.md#swu-cdsc-006---evaluate-generation-1) | L2 | TASK-CDSC-EVALUATION | 003-005 | complete | local-fallback |
| [SWU-CDSC-007](work-pack/tasks/TASK-CDSC-VERIFY.md#swu-cdsc-007---independent-replay-and-closeout) | L3 | TASK-CDSC-VERIFY | 006 | complete | manual |

Every SWU has exactly one parent task. Execute one selected SWU per Task
Session. W1 SWUs may run in parallel only after W0 is accepted and runtime
subagent permission is explicitly granted.

## Delivery Slices

| Slice | Output | Validation |
| --- | --- | --- |
| L0 | schemas, frozen manifest, golden vectors, deterministic evaluator | contract and evaluator tests |
| L1 | one immutable reviewed receipt per fixture | receipt validation and source-boundary scan |
| L2 | generation-1 fixture results, suite verdict, append-only index | integration tests and deterministic rerun |
| L3 | independent replay, audit, result routing | semantic equality, authority scan, receipt audit |

## Global Done Contract

- Exactly the selected SWU write scope changed.
- Fixture repositories and canonical DomainSpec definitions remained read-only.
- All semantic inputs carry stable IDs, selectors, versions, and digests.
- Missing or disputed evidence remains `INSUFFICIENT-EVIDENCE`.
- F2 prevents `CALIBRATION-PASS` unless its outcome is `EXPLAINED`.
- Frozen inputs replay to the same semantic fixture and suite results.
- Prior generations remain byte-available and unchanged.
- Task Session records commands, files, blockers, residue, and handoff.
- No output claims identity, irreducibility, portability, pattern admission,
  replication, activation, authority, or promotion.

## Validation Strategy

1. Schema and golden-vector tests for every contract.
2. Exhaustive outcome-table tests for fixture and suite classifiers.
3. Positive, negative, incomplete, conflict, and replay fixtures.
4. Read-only source-boundary scan for GoldenQuill and Savvy paths.
5. Stable semantic-digest and predecessor checks.
6. Independent replay from generation inputs.
7. Final prohibited-inference and authority-boundary scan.

## Blockers And Gaps

No blocker prevents `SWU-CDSC-001`. Expected evidence gaps remain in
`GAP-LEDGER.md` and are owned by later SWUs. Any source drift detected during
001 creates a new pinned selector decision or blocks generation 1; it must not
be silently normalized.

## Runtime Handoff

This work-pack is complete with `CALIBRATION-DEFER`. Any continuation must
create a new bounded evidence-repair generation for the two untested F3
substitutions. Generation 1 remains immutable and authorizes no promotion.
