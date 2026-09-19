# TASK-UIR-DOSSIER-POLICY

## Objective

Convert DEC-UIR-008 and DEC-UIR-009 into a typed, replayable policy-evaluation
generation without fabricating new corpus or identity evidence.

## Smallest Working Units

### SWU-UIR-013 - Dossier Policy Evaluation

**Goal:** record per-candidate portability threshold results and the current
Form/Action independent-positive classification.

**Dependencies:** SWU-UIR-006 and 008 accepted receipts; DEC-UIR-008/009.

**Inputs and outputs:** corpus receipts/projections, accepted review evidence,
decision selectors, a new dossier-policy schema/evaluator, and one immutable
policy-evaluation generation.

**Algorithm:**

1. Group corpus evidence by candidate; never pool evidence between candidates.
2. Count independently authored real corpora, distinct implementation styles,
   and independent agreeing reviewers for each candidate.
3. Mark portability `pass` only when counts meet 2/2/2 and all independence
   attestations validate; otherwise mark `missing` with observed counts.
4. Record Form and Action independent-positive as `missing`, retaining partial
   correspondence handles and DEC-UIR-009 rationale.
5. Reject `fail`, `absent`, `collapsed`, `demoted`, or kill classifications not
   supplied by an explicit finite witness contract.
6. Envelope the complete per-candidate table and replay immutably.

**Edge cases and failure modes:** duplicate corpus under two aliases, one author
counted twice, one reviewer in two roles, styles pooled across candidates,
partial reviewer agreement, empty evidence, and attempted threshold tailoring.

**Write scope:**

- `contracts/dossier-policy-evaluation.schema.yml`
- `evidence/dossier-policy-evaluation.mjs`
- `evidence/build-dossier-policy-generation.mjs`
- `fixtures/contracts/dossier-policy-*`
- `evidence/results/dossier-policy/generation-001/`
- `tests/dossier-policy-evaluation.test.mjs`

**Done criteria:** every candidate has explicit observed/required counts and a
typed state; current portability is below threshold; Form/Action independent
positive is `missing`; no identity or promotion inference appears.

**Acceptance evidence:** threshold boundary matrix, independence negatives,
replay output, generation handle, and SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/dossier-policy-evaluation.test.mjs
```

**Execution owner:** subagent eligible or local-fallback.

**Context Builder anchors:** this task, DEC-UIR-008/009 records, GAP-UIR-005/006,
corpus generation 001 and later 002 when available, dossier generation 001,
accepted UIF findings, and refresh report section "SWU-UIR-013".

**Expected result:** shared SWU result shape; route to SWU-UIR-015 after 012 and
014 pass.
