# TASK-CDSC-EVALUATION

## SWU-CDSC-006 - Evaluate Generation 1

**Goal:** Join the three frozen receipts, compute fixture outcomes and one suite
verdict, and append generation 1 without reinterpretation.

**Dependencies:** SWU-CDSC-003, SWU-CDSC-004, and SWU-CDSC-005 accepted.

**Inputs:** frozen generation manifest, three valid receipt handles, evaluator
version, predecessor state, and prohibited-inference contract.

**Outputs:**

- `results/generation-001/f1-result.json`
- `results/generation-001/f2-result.json`
- `results/generation-001/f3-result.json`
- `results/generation-001/suite-result.json`
- `results/generation-001/run-receipt.json`
- `generations/index.json`
- `tests/integration.test.mjs`

**Ordered rules:**

1. Reject absent, duplicate, conflicting, or version-mismatched receipt handles.
2. Recompute every receipt semantic digest.
3. Evaluate each fixture independently with the frozen evaluator.
4. Assert F2 control semantics in the suite classifier.
5. Compute the suite verdict only after all fixture outcomes exist.
6. Append generation and predecessor handles atomically.
7. Re-evaluate from the same frozen inputs and compare semantic result bytes.
8. Record uncertainty and prohibited inferences in every result.

**Edge cases:** any insufficient fixture, F2 residual support, one rubric failure,
mixed F1/F3 explained/supported outcomes, replay drift, missing predecessor,
duplicate generation, and volatile timestamp changes.

**Write scope:** this package's future `results/generation-001/`,
`generations/index.json`, and `tests/integration.test.mjs` only.

**Done criteria:** one total result per fixture, one total suite verdict, stable
semantic digests, byte-equivalent semantic rerun, append-only generation index,
and no authority/promotion term in machine result statuses.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/tests/integration.test.mjs
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** select accepted L0 outputs and exactly the three accepted L1
receipt handles. Do not reread source repositories to revise predicates.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** `results/generation-001/`, `generations/index.json`,
`tests/integration.test.mjs`, and `runs/SWU-CDSC-006/TASK-SESSION-RESULT.md`.
F1 and F2 are `EXPLAINED`; F3 is `INSUFFICIENT-EVIDENCE`; the suite is
`CALIBRATION-DEFER` with an `evidence-repair` route. Integration tests passed
5/5 and the full package passed 30/30.
