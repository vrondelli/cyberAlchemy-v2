# TASK-CDSC2-GENERATION

Status: superseded by
`../../refreshes/2026-07-12-three-layer-adjudication/REFRESHED-WORK-PACK.md`.
Do not execute SWU-CDSC2-005 or SWU-CDSC2-006.

## SWU-CDSC2-005 - Freeze Repaired F3 Receipt

**Goal:** adjudicate the immutable M1/M2 observations into one new F3 receipt
without changing the parent explanation/observable interpretation after seeing
the outcome.

**Dependencies:** SWU-CDSC2-003 and SWU-CDSC2-004 accepted.

**Inputs:** parent F3 receipt, generation-2 manifest, baseline receipt, M1/M2
observation receipts, frozen receipt schema, parity preflight, and parent review
method.

**Algorithm:**

1. Verify all input handles, schema versions, source pins, and deterministic run
   digests.
2. Copy the parent F3 `G`, `A`, `Q`, and approved matrix as the declared
   interpretive baseline; do not add explanations after observing mutations.
3. Replace only the F3 substitution observations and uncertainty records with
   cited generation-2 evidence.
4. Recompute `D` only if the observed substitutions deterministically change
   the baseline-versus-residual decision; otherwise retain zero/indeterminate
   truthfully.
5. Record supported, refuted, disputed, or indeterminate states exactly as the
   observation receipts warrant.
6. Run schema-parity preflight and freeze a new immutable F3 receipt under the
   parent calibration generation-2 evidence subtree.

**Edge cases:** one observation refuted, one indeterminate, baseline handle
mismatch, late matrix edit, duplicate mutation receipt, conflicting raw output,
or attempted identity/pattern inference.

**Write scope:**
`../evidence/generation-002/f3-savvy-page/`, this package's focused receipt test,
Task Session evidence, and status sync only.

**Done criteria:** one parity-valid reviewed F3 receipt cites both observation
handles, preserves uncertainty, and makes no evaluation or promotion claim.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/f3-generation-002-receipt.test.mjs
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** this SWU, parent F3 receipt, accepted generation-2 manifest
and three observation receipts, parity preflight, and no source repository.

## SWU-CDSC2-006 - Evaluate And Append Generation 2

**Goal:** evaluate F3 v2, join stable F1/F2 results, produce one successor suite
result, and atomically append generation 2.

**Dependencies:** SWU-CDSC2-005 accepted.

**Inputs:** stable generation-1 F1/F2 result handles, new F3 receipt, parent
fixture evaluator, successor suite wrapper, generation-1 index tail, and
prohibited-inference contract.

**Algorithm:**

1. Revalidate all protected generation-1 bytes.
2. Evaluate the new F3 receipt with the frozen fixture outcome table.
3. Validate stored F1/F2 results and bind all three unique result handles.
4. Classify the suite with replay state `identical` only after a same-process
   rerun matches.
5. Build the suite envelope with predecessor equal to generation 1.
6. Append exactly one generation-index entry atomically.
7. Rerun from frozen inputs and compare canonical semantic bytes.
8. Write fixture result, suite result, run receipt, and integration test.

**Edge cases:** F3 remains insufficient, F3 is rubric-fail, supported residue,
duplicate handle, wrong control, replay drift, wrong predecessor, duplicate
append, and generation-1 byte drift.

**Write scope:** `../results/generation-002/`, append-only update to
`../generations/index.json`, this package's integration test, Task Session
evidence, and status sync.

**Done criteria:** one total F3 result, one total suite verdict, exact
generation-1 predecessor, two-entry valid index, deterministic rerun, and no
authority-bearing status.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/generation-002-integration.test.mjs
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** this SWU, protected generation-1 manifest, accepted F3 v2
receipt, parent evaluator, successor wrapper, and current generation index.
