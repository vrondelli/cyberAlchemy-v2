# TASK-CDSC2-CONTRACTS

## Purpose

Create the generation-2 entrypoint that enforces frozen schema vocabulary and
constructs predecessor-bound successor suite envelopes without changing parent
v1 modules.

## SWU-CDSC2-001 - Parity Preflight And Successor Contract

**Goal:** implement versioned generation-2 validation and successor-envelope
support, plus byte guards for generation 1.

**Dependencies:** none.

**Inputs:**

- `../contracts/evidence-receipt.schema.yml`
- `../evaluation/validate-input.mjs`
- `../evaluation/evaluate-suite.mjs`
- `../evaluation/canonical-json.mjs`
- `../generations/index.json`
- generation-1 receipts/results/suite/audit

**Outputs:**

- `contracts/harness-manifest.schema.yml`
- `contracts/observation-receipt.schema.yml`
- `runtime/validate-generation-002.mjs`
- `runtime/evaluate-successor-suite.mjs`
- `fixtures/contracts/generation-001-protected-files.json`
- `fixtures/contracts/parity-vectors.json`
- `tests/contracts-successor.test.mjs`

**Algorithm:**

1. Freeze paths and SHA-256 byte digests for every generation-1 receipt,
   result, run receipt, suite result, index entry projection, replay, and audit.
2. Load allowed explanation kinds and observable classes from the parent frozen
   JSON schema.
3. Wrap parent receipt validation, then reject any kind/class outside those
   enum sets.
4. Define schemas for harness manifests and observation receipts with semantic
   versus volatile fields and canonical digest rules.
5. Build a successor suite function that reuses the parent classifier but
   rebuilds the envelope with the required predecessor generation ID.
6. Reject null, unknown, non-tail, duplicate, or generation-1-self predecessor
   attempts.
7. Verify protected generation-1 digests after every focused test.

**Edge cases:** unknown kind, unknown class, schema missing enum, structurally
valid but vocabulary-invalid receipt, wrong result count, duplicate fixture,
null predecessor, predecessor not current index tail, volatile metadata change,
and protected-file drift.

**Write scope:** this package's `contracts/`, `runtime/`, `fixtures/contracts/`,
`tests/contracts-successor.test.mjs`, Task Session evidence, and status sync.
Parent evaluator/contracts/results remain read-only.

**Done criteria:** all positive parent receipts pass; every enum drift vector
fails; successor suite output validates with the exact generation-1
predecessor; protected bytes match.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/contracts-successor.test.mjs
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** select this SWU, parent schema/evaluator modules, exact
generation-1 artifacts, and no Savvy or GoldenQuill source.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** `contracts/`, `runtime/`, `fixtures/contracts/`,
`tests/contracts-successor.test.mjs`, and
`runs/SWU-CDSC2-001/TASK-SESSION-RESULT.md`. Focused tests passed 6/6 and the
combined parent/successor suite passed 36/36.
