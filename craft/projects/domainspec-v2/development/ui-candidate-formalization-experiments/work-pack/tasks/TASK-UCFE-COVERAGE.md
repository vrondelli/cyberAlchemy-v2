# TASK-UCFE-COVERAGE

## Objective

Test whether an existing DomainSpec representation explains Form without loss
before collecting evidence for a distinct type.

## SWU-UCFE-003 - Existing Coverage Audit

**State:** complete with `distinct-route-open`; this is not distinct support.
Acceptance evidence: `runs/SWU-UCFE-003/receipt.json`.

**Goal:** execute the preregistered six-dimension matrix independently for each
Form alternative and emit `covered-existing`, `distinct-route-open`, or
`defer-missing` as a coverage-stage result.

**Dependencies:** SWU-UCFE-002 accepted.

**Inputs/outputs:** immutable preregistration, current DS-D1/DS-D8 handles,
Body War source facts, generated coverage fixtures, per-alternative receipts,
coverage generation 001.

**Algorithm:**

1. Verify preregistration and authority digests.
2. For each alternative, run valid-instance preservation, invalid-instance
   rejection, substitutability, composition parity, consequence parity, and
   no-loss checks.
3. Keep alternative results isolated; never combine partial dimensions from
   different alternatives.
4. Emit `covered-existing` only when one alternative passes all six.
5. Emit `distinct-route-open` when no alternative passes and the audit is
   complete; this is permission to collect evidence, not distinction proof.
6. Emit `defer-missing` for incomplete or stale audits.

**Edge cases:** partial alternatives pooled into a pass, missing negative,
label-derived parity, wildcard edge, authority drift, one consequence silently
dropped, generated fixture treated as independent corpus.

**Write scope:**

- `experiments/form/coverage/fixtures/`
- `experiments/form/coverage/manifest.json`
- `experiments/form/coverage/evaluate-coverage.mjs`
- `experiments/form/coverage/results/generation-001/`
- `tests/form-coverage.test.mjs`

**Done criteria:** every alternative has six typed dimensions; branch result is
deterministic; no missing evidence becomes coverage or collapse.

**Acceptance evidence:** per-alternative matrix, changed-consequence outputs,
immutable generation, focused tests, `runs/SWU-UCFE-003/receipt.json`.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-coverage.test.mjs
```

**Execution owner:** Experiment Harness through local Task Session.

**Context Builder anchors:** accepted preregistration, `EXPERIMENT-CONTRACTS.md#existing-coverage-matrix`,
`ARCHITECTURE.md#5-decision-flow-view`, current definitions/relationships
selectors, Body War receipts.

**Handoff:** `covered-existing` routes to SWU-008; complete non-coverage routes
to SWU-004; incomplete audit blocks.
