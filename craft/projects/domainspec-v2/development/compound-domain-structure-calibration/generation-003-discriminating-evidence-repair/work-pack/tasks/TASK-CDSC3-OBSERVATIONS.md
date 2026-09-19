# TASK-CDSC3-OBSERVATIONS

## Objective

Freeze the permitted, breaking, and downstream-decision evidence needed for
atomic adjudication without interpreting explanation coverage.

## SWU-CDSC3-004 - Permitted Browser Mutation

**Goal:** observe `T-P-01` through `T-P-04` after replacing the generated
step-9 child under the same interaction contract.

**Dependencies:** accepted SWU-CDSC3-003.

**Source anchors:** accepted target set, baseline witness, generated step
registry adapter, and `SPEC.md#Permitted-Mutation-M3-P`.

**Algorithm:** clone the accepted baseline frame; replace only the declared
child adapter; run the same vectors; capture contract availability, selected
child, route coordination, guard result, notice, requested/committed step, and
route state; compare to baseline per target; repeat; freeze supported/refuted/
indeterminate states and uncertainty; reject any edit outside the allowlist.

**Write scope:** `experiments/generation-003/m3-permitted-child/`,
`evidence/generation-003/m3-permitted-child/`,
`tests/m3-permitted-child.test.mjs`, and `runs/SWU-CDSC3-004/`.

**Done criteria:** four target observations are total; edit surface is exact;
structured and support-image evidence bind the runtime/source/baseline handles;
rerun is identical; protected bytes remain unchanged.

**Acceptance evidence:** mutation diff, raw run, receipt, target comparison,
images, focused test, Task Session receipt, observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/m3-permitted-child.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route to SWU-CDSC3-005 with no adjudication claim.

**Execution status:** complete. The immutable permitted observation handle is
`sha256:0f6aafa8f7a78278a712c44109935dd57d1dae316c9ff2fd02b91ddc76ac7d85`;
four target observations are total and supported, with 125/125 aggregate tests.

## SWU-CDSC3-005 - Breaking Browser Mutation

**Goal:** observe `T-B-01` and `T-B-02` after committing the requested step
instead of the guard result in the generated commit adapter.

**Dependencies:** accepted SWU-CDSC3-003; local serial route also requires 004.

**Source anchors:** accepted target set, baseline witness, generated commit
adapter, and `SPEC.md#Breaking-Mutation-M3-B`.

**Algorithm:** clone baseline; change only committed-step selection; run blocked
and premature vectors; record guard result separately from committed state;
capture destination, notice, route tree, and DOM; compare both targets; repeat;
freeze truthful states/uncertainty; reject edits outside commit adapter.

**Write scope:** `experiments/generation-003/m3-breaking-commit/`,
`evidence/generation-003/m3-breaking-commit/`,
`tests/m3-breaking-commit.test.mjs`, and `runs/SWU-CDSC3-005/`.

**Done criteria:** both target observations are total; guard and commit are not
conflated; edit surface is exact; rerun is identical; protected bytes remain.

**Acceptance evidence:** mutation diff, raw run, receipt, target comparison,
images, focused test, Task Session receipt, observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/m3-breaking-commit.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route to SWU-CDSC3-006.

**Execution status:** complete. The immutable breaking observation handle is
`sha256:879c37a64cf02ab1e28ca819e6a3e6c0de8bc05e061e9b65807d58033e74fdc5`;
both target observations are supported and guard/commit remain separate.

## SWU-CDSC3-006 - Downstream Decision Differential

**Goal:** preregister and compute deterministic baseline/residual test-impact
sets and `D` without assuming nonzero usefulness.

**Dependencies:** accepted SWU-CDSC3-001; local serial route requires 005 before
selection so one Task Session remains active at a time.

**Source anchors:** `SPEC.md#Usefulness-Differential`, parent explanation set,
atomic targets, fixed five-test catalog, and generation-2 `D` residue.

**Ordered algorithm:** define catalog schema; freeze explanation/target-to-test
coverage; validate no output/result fields are inputs; implement two pure
planners; sort/dedupe outputs; calculate symmetric difference; run empty,
nonempty, ordering, missing-coverage, circular-input, and replay vectors; freeze
result with uncertainty and prohibited inferences.

**Write scope:** `contracts/usefulness-differential.schema.yml`,
`runtime/evaluate-usefulness.mjs`, `fixtures/usefulness/`,
`evidence/generation-003/usefulness-differential/`,
`tests/usefulness-differential.test.mjs`, and `runs/SWU-CDSC3-006/`.

**Done criteria:** contract is finite/total; planners are deterministic; `D`
may be empty; result binds exact target/import handles and makes no identity or
promotion claim.

**Acceptance evidence:** catalog, coverage table, fixtures, result receipt,
focused tests, Task Session receipt, observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/usefulness-differential.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route to SWU-CDSC3-007 with all three immutable evidence handles.

**Execution status:** complete. The immutable usefulness result handle is
`sha256:4dd5dc535a28fe0351e9094ac4d7115f929cac4ca7582b1bd3fb46476860c6dd`;
the accepted deterministic differential is empty under the five-test catalog,
and the synthetic control proves a nonempty result is representable.

## Synchronization

SWU004/005/006 are complete and W2 passes with three immutable receipts. No
observation receipt contains adjudication state; SWU007 is selected.
