# TASK-UCFE-EVIDENCE

## Objective

Collect real candidate-local corpora and separating evidence only when the
coverage audit leaves the distinct route open.

## SWU-UCFE-004 - Normalize Form Corpus A

**State:** complete. Acceptance evidence: `runs/SWU-UCFE-004/receipt.json`.

**Goal:** convert accepted Body War partial Form evidence into the new
CandidateRun corpus-attestation contract without changing source facts.

**Dependencies:** SWU-003 complete with `distinct-route-open`.

**Algorithm:** verify source revision/digests and existing corpus-v2 handles;
record authorship/style attestation; map literal facts to Form hypotheses in a
separate projection; preserve omissions and prohibited inferences; publish
append-only corpus A generation.

**Edge cases:** copied reviewer projection as fact, changed source, alias counted
twice, Action evidence pooled into Form, candidate label as identity.

**Write scope:** `experiments/form/corpora/corpus-a/`,
`tests/form-corpus-a.test.mjs`.

**Done criteria:** corpus A is real, pinned, one-author/one-style, replayable,
and explicitly insufficient for portability.

**Acceptance evidence:** corpus/source/projection handles, replay test, SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-corpus-a.test.mjs
```

**Execution owner:** local-fallback.

**Context Builder anchors:** accepted SWU-003 receipt, UI repair corpus
generation 002, Body War source selectors, this task.

**Handoff:** route to SWU-005.

## SWU-UCFE-005 - Select And Pin Form Corpus B

**State:** blocked-evidence. See `runs/SWU-UCFE-005/BLOCKER.md`.

**Goal:** admit one independently authored real Form corpus in a second
implementation style.

**Dependencies:** SWU-004 accepted and a candidate source supplied.

**Algorithm:**

1. Verify repository/source accessibility and record author identity.
2. Prove source identity differs from corpus A and style differs from
   static DOM/JavaScript.
3. Pin revision, files, selectors, digests, and extraction version.
4. Separate literal facts from candidate projection.
5. Reject the source if authorship independence or style distinction is not
   supported; do not search indefinitely or substitute synthetic fixtures.

**Edge cases:** fork/alias of corpus A, same author under another role, adapted
fixture, framework filename inference, inaccessible revision, source drift.

**Write scope:** `experiments/form/corpora/corpus-b/`,
`tests/form-corpus-b.test.mjs`, run evidence.

**Done criteria:** one valid independent corpus B receipt exists, or the SWU
returns BLOCK with exact missing source/authorship input.

**Acceptance evidence:** source/authorship/style attestations, receipts,
negative independence checks, SWU receipt.

**Verification:** reviewable source/authorship check plus:

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-corpus-b.test.mjs
```

**Execution owner:** manual evidence input plus local Task Session.

**Context Builder anchors:** corpus A receipt, fixed 2/2/2 policy, supplied
corpus B repository/source/author evidence, source-contract boundary.

**Handoff:** block until valid input; on pass route to SWU-006.

## SWU-UCFE-006 - Separating Experiments

**Goal:** run independent-positive, stable-contrast, label-erasure,
criterion-erasure, changed-consequence, and typed-negative experiments across
the two pinned corpora.

**Dependencies:** SWU-005 accepted.

**Algorithm:** execute preregistered vectors unchanged; bind each outcome to
corpus/source/extractor handles; require at least one positive and nearest-
neighbor negative per corpus; erase labels and criteria in separate runs;
measure tracked downstream consequences; publish typed outcomes without score.

**Edge cases:** altered preregistration after results, labels leak through file
paths/framework symbols, criteria reintroduced in fixtures, shared hygiene used
as witness, one corpus omitted, result cherry-picking.

**Write scope:** `experiments/form/separation/fixtures/`,
`experiments/form/separation/run/`, `tests/form-separation.test.mjs`.

**Done criteria:** every hard experiment has a typed pass/missing/invalid result
for each required scope; replay and preregistration digest checks pass.

**Acceptance evidence:** experiment-harness report, fixture/result digests,
matrix, focused tests, SWU receipt.

**Verification:** Experiment Harness validation plus:

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-separation.test.mjs
```

**Execution owner:** Experiment Harness through Task Session.

**Context Builder anchors:** preregistration, corpus A/B receipts,
`EXPERIMENT-CONTRACTS.md#distinct-candidate-matrix`, harness profile.

**Handoff:** route to SWU-007 with all residue preserved.
