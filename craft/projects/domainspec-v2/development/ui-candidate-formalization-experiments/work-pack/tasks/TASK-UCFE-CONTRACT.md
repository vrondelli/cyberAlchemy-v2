# TASK-UCFE-CONTRACT

## Objective

Define the total candidate-run contract and publish an immutable Form
preregistration before any empirical evaluation begins.

## SWU-UCFE-001 - Candidate Run Contract Kernel

**State:** complete. Acceptance evidence: `runs/SWU-UCFE-001/receipt.json`.

**Goal:** implement the smallest contract that can represent candidate inputs,
coverage alternatives, evidence planes, three valid dispositions, invalid run
state, canonical identity, lineage, and prohibited inferences.

**Dependencies:** none.

**Inputs:** `SPEC.md`, `EXPERIMENT-CONTRACTS.md`, `ARCHITECTURE.md`, canonical
JSON conventions from the UI repair package, and fixed policy handles.

**Algorithm:**

1. Validate one candidate ID and one law version.
2. Require at least one named existing alternative and preregistered
   distinct/covered/defer hypotheses.
3. Reject duplicate alternatives, contradictory falsifiers, cross-candidate
   evidence, scores, weights, threshold overrides, and authority payloads.
4. Evaluate record completeness only; do not evaluate Form evidence yet.
5. Permit disposition values only after their required typed evidence fields
   are complete; otherwise use no disposition and a typed run state.
6. Build canonical content, record, and generation IDs with predecessor support.

**Edge cases:** empty alternatives, duplicate aliases, candidate ID mismatch,
unknown policy version, stale predecessor, unsupported disposition, embedded
DS-D1/DS-D8 mutation, timestamp-only replay, non-identical overwrite.

**Write scope:**

- `contracts/candidate-run.schema.yml`
- `contracts/coverage-evaluation.schema.yml`
- `contracts/candidate-disposition.schema.yml`
- `evidence/candidate-run.mjs`
- `fixtures/contracts/candidate-run-*`
- `tests/candidate-run.test.mjs`

**Done criteria:** every contract branch is total and fail-closed; the three
dispositions are distinct; invalid/missing input cannot become collapse or
support; identity/replay vectors pass.

**Acceptance evidence:** schemas, golden vectors, malformed matrix, focused
test output, and `runs/SWU-UCFE-001/receipt.json`.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/candidate-run.test.mjs
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** this task, `SPEC.md`, `EXPERIMENT-CONTRACTS.md`,
`ARCHITECTURE.md` decision flow, `work-pack/shared/context.md`, and UI repair
canonical/policy contracts.

**Handoff:** unlock SWU-UCFE-002 only on pass.

## SWU-UCFE-002 - Form Preregistration

**State:** complete. Acceptance evidence: `runs/SWU-UCFE-002/receipt.json`.

**Goal:** pin the Form candidate law, current authority/candidate handles,
nearest existing alternatives, hypotheses, falsifiers, policy version, and
experiment matrix before observing new results.

**Dependencies:** SWU-UCFE-001 accepted.

**Algorithm:**

1. Pin Form candidate source and digest.
2. Enumerate exact existing alternatives: compound structure; Component plus
   fields/`submits`; Operation/Action plus Interface/Rule/Mapping; distinct Form.
3. For each alternative, specify expected positives, negatives, consequences,
   and falsifiers.
4. Pin Body War as corpus A input only; mark corpus B and reviewers missing.
5. Freeze the preregistration as generation 001; reject post-result in-place
   edits.

**Edge cases:** unnamed alternative, wildcard edge, candidate labels used as
witnesses, missing falsifier, changed source digest, result data embedded into
preregistration, overwrite attempt.

**Write scope:**

- `experiments/form/preregistration.yml`
- `experiments/form/alternatives.yml`
- `experiments/form/run-manifest.json`
- `tests/form-preregistration.test.mjs`

**Done criteria:** preregistration is complete, immutable, source-pinned, and
contains no experiment outcome.

**Acceptance evidence:** manifest handles, alternative/falsifier matrix, test
output, and `runs/SWU-UCFE-002/receipt.json`.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-preregistration.test.mjs
```

**Execution owner:** local-fallback.

**Context Builder anchors:** accepted SWU-001 receipt, Form candidate card,
UIF verdict/replication rows for Form, current DS-D1/DS-D8 handles, and this
task's algorithm.

**Handoff:** route to SWU-UCFE-003.
