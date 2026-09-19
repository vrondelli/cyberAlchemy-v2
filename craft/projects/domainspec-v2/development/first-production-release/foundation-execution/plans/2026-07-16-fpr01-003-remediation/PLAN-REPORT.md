---
module: domainspec-v2-fpr01-003-remediation
version: current
status: ready-for-first-task-session
updatedAt: 2026-07-16
docType: invoke-plan-report
---

# Invoke Plan Report: FPR01-003 Remediation

## Verdict

The current foundation plan remains the sole continuation-state plan. It now has one
nested, execution-ready remediation route. `SWU-FPR01003-GUARD-001` is the selected
first unit. `SWU-FPR01003-SAMPLE-001` is parallel-safe but not selected. The joined
replay and `SWU-FPR01-004` remain gated.

## Complexity And Output Selection

- Root package complexity: high; unchanged.
- Remediation route complexity: medium because it has two independent repairs, a join,
  a deterministic replay, and a cross-owner refresh handoff.
- Output mode: split within the existing canonical package; no second work-pack was
  created.
- Templates selected: canonical Invoke `implementation-layering.md`, `work-pack.md`,
  and DomainSpec `execution-pack.md` contracts.
- Template search result: no closer remediation-specific template was found; canonical
  Invoke templates remain the governing shape.

## Context Builder Summary

Planning used strict, bounded, dry-run context selection. No runtime context pack was
materialized; Task Session must build one for the selected SWU.

| Obligation | Selected evidence | Coverage |
|---|---|---|
| O1 classify seven exact guard failures without a broad exception | blocked receipt; definitions receipt; guard allowlist, frozen manifest, implementation, and tests | covered |
| O2 preserve the accepted superseded `DS-D1.10` identity | definitions reconciliation; owner dispositions | covered |
| O3 normalize the sample without inventing semantics | sample `SPEC.md`; `parseNormalizedSpec`; normalized grammar tests | covered |
| O4 replay FPR01-003 deterministically | FPR01-003 receipt; FPR task contract; validator/mutant contract | covered |
| O5 update the receipt only on full PASS | blocked receipt stop condition; work-pack gates | covered |
| O6 keep FPR01-004 unselected until refresh | W1, execution pack, task contract | covered |
| O7 preserve false production/ratification flags | owner decision; blocked receipt; root plan boundary | covered |

Selected project sources: 13. Construction blockers: none. Runtime evidence blockers:
the two named repair conditions, intentionally owned by the selected task.

## Inventory Result

- Lookup mode: repository-local `.arcanum/inventory/index.json` first.
- Relevant compiled entry:
  `domainspec-v2-first-production-release-roadmap-strategy-result-synthesis`.
- Use: orientation only; it confirmed the existing ordered FPR route and did not
  replace live receipts or canonical plan artifacts.
- Inventory mutation: none.

## Gap Check

Structured Interview asked zero questions. The receipts already fix the objective,
write boundaries, exact failures, authority owners, stop conditions, and next
handoff. No unresolved choice changes the remediation route.

## Artifact Boundary

- `WORK-PACK.md` owns global state and the selected SWU.
- `IMPLEMENTATION-LAYERING.md` owns the nested L1 decision boundary.
- `W1R-FPR01-003-REMEDIATION.md` owns ordering and join rules.
- `TASK-FPR01-003-REMEDIATION.md` owns the three SWU execution contracts.
- `EXECUTION-PACK.md` schedules the route but does not redefine SWUs.
- The child dispatch describes the capability handoffs and receipt gates.
- This report records planning evidence and owns no execution state.

## Validation Strategy

| Gate | Positive proof | Negative/fail-closed proof |
|---|---|---|
| guard repair | zero violations, focused tests, frozen-manifest equality | seeded active reference and digest drift remain rejected |
| sample normalization | engine lint green twice, normalized parser tests | missing tables and undeclared endpoints remain rejected |
| FPR01-003 replay | canonical validator green twice with equal digest; aggregate `validate` green | all five named baseline mutants retain distinct failures |
| successor selection | Invoke refresh consumes a PASS receipt | blocked/flagged/missing receipt cannot select FPR01-004 |

## Dispatch Technique Trace

| Technique | Concrete use | Verdict |
|---|---|---|
| `sequence` | plan -> repairs -> joined replay -> refresh -> ratification | pass |
| `scu_swu_reduction` | each repair is one bounded, independently useful SWU | pass |
| `recomposition_proof` | both repairs recompose into the FPR01-003 acceptance matrix | pass |
| `validation_loop` | positive, deterministic, and negative controls at every mutation boundary | pass |
| `owner_boundary_check` | Task Session executes; Invoke refresh synchronizes; owners ratify | pass |
| `handle_handoff` | downstream steps consume receipt paths/digests, not copied authority | pass |
| `residue_ledger` | any new defect returns a named blocker rather than widening scope | pass |
| `execution_receipt_handoff` | every runtime step has a structured receipt contract | pass |
| `concrete_path_evidence` | all writes and evidence artifacts use exact repository paths | pass |
| `observability_grouping` | child dispatch and future receipts share one dispatch ID | pass |
| `authority_split_gate` | lifecycle, execution, validation, evidence, and promotion owners are explicit | pass |

## Next Handoff

Invoke owns no repair. The next authorized lifecycle route is Task Session for
`SWU-FPR01003-GUARD-001`. Context Builder must create its strict runtime pack from the
selectors in the task contract. The sample SWU can be selected later or included in
a separately authorized parallel route.
