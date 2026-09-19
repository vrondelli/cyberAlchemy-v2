# TASK-CDSC-CONTRACTS

## Purpose

Own the L0 representation and deterministic computation contract. This task
does not author substantive fixture judgments.

## SWU-CDSC-001 - Freeze Contracts And Fixture Manifest

**State:** complete. Evidence:
`../../runs/SWU-CDSC-001/TASK-SESSION-RESULT.md`.

**Goal:** Define versioned schemas, semantic-field policy, fixture IDs, pinned
selectors, source digests, generation identity, and golden vectors.

**Dependencies:** none.

**Inputs:** `SPEC.md`, `ARCHITECTURE.md`, `DECISION-LEDGER.md`, accepted research
finding, and cited F1/F2/F3 sources as read-only inputs.

**Outputs:**

- `contracts/experiment-envelope.schema.yml`
- `contracts/fixture-manifest.schema.yml`
- `contracts/evidence-receipt.schema.yml`
- `contracts/evaluation-result.schema.yml`
- `contracts/suite-result.schema.yml`
- `fixtures/generation-001/fixture-manifest.yml`
- `fixtures/contracts/*.json`
- `tests/contracts.test.mjs`

**Ordered rules:**

1. Enumerate semantic versus volatile fields for every contract.
2. Pin exactly F1, F2, and F3 with repository-relative selectors and content
   digests.
3. Define stable IDs and predecessor semantics for generation 1.
4. Require finite `A`, `Q`, and total `A x Q` predicate coordinates.
5. Admit `indeterminate` as an evidence value but never as explained or
   not-explained.
6. Define prohibited-inference fields on receipts and results.
7. Test valid, missing, duplicate, conflict, unknown-version, digest-drift, and
   field-order vectors.

**Write scope:** only this package's future `contracts/`, `fixtures/`, and
`tests/contracts.test.mjs`.

**Read-only scope:** cited GoldenQuill and Savvy sources, DS-D1, DS-D8, and
accepted research.

**Done criteria:** all schemas parse; fixture IDs and selectors are frozen;
semantic changes alter digests; volatile changes do not; duplicate/conflicting
predicate coordinates reject; source paths outside the package remain clean.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/tests/contracts.test.mjs
git diff --check -- projects/domainspec-v2/development/compound-domain-structure-calibration
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** select this task, `SPEC.md`, `ARCHITECTURE.md`, accepted
findings, and cited source selectors. Do not load later task outputs.

## SWU-CDSC-002 - Deterministic Evaluator

**State:** complete. Evidence:
`../../runs/SWU-CDSC-002/TASK-SESSION-RESULT.md`.

**Goal:** Implement validation, residue computation, four fixture outcomes,
three suite verdicts, semantic result digests, and append-only generation
support without semantic inference.

**Dependencies:** SWU-CDSC-001 accepted.

**Inputs:** frozen schemas, fixture manifest, golden contract vectors, and the
pseudocode in `ARCHITECTURE.md`.

**Outputs:**

- `evaluation/validate-input.mjs`
- `evaluation/evaluate-fixture.mjs`
- `evaluation/evaluate-suite.mjs`
- `evaluation/canonical-json.mjs`
- `evaluation/generation-index.mjs`
- `tests/evaluator.test.mjs`

**Algorithm:**

```text
validate receipt against versioned contract
validate finite total A x Q coordinate set
if required evidence absent or any required cell indeterminate:
  return INSUFFICIENT-EVIDENCE
compute R from cells where every explanation is not-explained
if R empty: return EXPLAINED
validate boundary invariant, permitted substitution, breaking substitution, D
if any residual condition fails: return RUBRIC-FAIL
return RESIDUAL-SUPPORTED

suite(receipts, replay):
  if any insufficient: CALIBRATION-DEFER
  else if F2 != EXPLAINED or any rubric-fail or replay drift:
    CALIBRATION-FAIL
  else: CALIBRATION-PASS
```

**Edge cases:** empty `A`, empty `Q`, duplicate coordinates, unknown evidence
state, all-explained rows, mixed explanation coverage, zero `D`, unstable `D`,
missing substitution consequence, F2 residual support, predecessor conflict,
and semantic/volatile field changes.

**Write scope:** this package's future `evaluation/` and
`tests/evaluator.test.mjs` only.

**Done criteria:** exhaustive decision-table tests pass; evaluator output is
independent of input order and volatile metadata; no code path writes or
revises predicate values; generation append rejects predecessor conflicts.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/tests/evaluator.test.mjs
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** select accepted SWU-001 outputs, this algorithm, and the
Architecture decision flow. No fixture receipt authoring belongs here.
