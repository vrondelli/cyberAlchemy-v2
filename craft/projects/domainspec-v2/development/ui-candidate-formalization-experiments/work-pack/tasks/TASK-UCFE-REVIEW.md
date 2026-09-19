# TASK-UCFE-REVIEW

## Objective

Collect independent review and produce one fixed-policy Form disposition and
handle-only owner handoff.

## SWU-UCFE-007 - Independent Reviewer Attestations

**Goal:** collect two independent reviews of Form correspondence and
applicability against the complete evidence package.

**Dependencies:** SWU-006 accepted and two reviewer identities supplied.

**Algorithm:** validate reviewer identity and independence; provide the same
handle-indexed evidence package to each reviewer; collect correspondence and
applicability decisions separately; count identity once across roles; preserve
disagreement; publish immutable attestations.

**Edge cases:** same person under two roles, reviewer authored a corpus,
reviewer helped author candidate criteria, partial review, acknowledgement
without judgment, changed evidence after review.

**Write scope:** `contracts/reviewer-attestation.schema.yml`,
`experiments/form/reviews/`, `tests/form-review.test.mjs`.

**Done criteria:** two valid independent attestations exist, or BLOCK identifies
the missing reviewer/independence input without weakening policy.

**Acceptance evidence:** reviewer identities, independence attestations,
evidence digest, judgments, tests, SWU receipt.

**Verification:** manual identity/independence review plus:

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-review.test.mjs
```

**Execution owner:** manual empirical reviewers; Task Session validates records.

**Context Builder anchors:** complete SWU-006 evidence index, fixed reviewer
policy, supplied reviewer identity/independence records.

**Handoff:** block until valid inputs; on pass route to SWU-008.

## SWU-UCFE-008 - Form Disposition And Owner Handoff

**Goal:** evaluate coverage, distinct evidence, policy counts, and reviews into
one immutable disposition and non-mutating owner handoff.

**Dependencies:** SWU-003 for coverage branch; SWU-004 through 007 for distinct
branch; explicit not-applicable receipts for skipped units.

**Algorithm:** verify all handles and predecessor chains; apply invalid ->
covered-existing -> distinct-supported -> defer-missing precedence; record
observed/required counts and hard conjunct states; reject prohibited
dispositions and authority payloads; publish disposition and handoff.

**Edge cases:** stale/swapped handles, false coverage from partial alternatives,
false distinct pass, threshold tailoring, missing-to-fail drift, embedded
promotion, timestamp-sensitive identity, overwrite attempt.

**Write scope:** `evidence/form-disposition.mjs`,
`experiments/form/results/generation-001/`, `handoffs/form-owner-review/`,
`tests/form-disposition.test.mjs`.

**Done criteria:** one truthful typed disposition, complete residue, immutable
generation, and handle-only owner handoff exist; no authority changed.

**Acceptance evidence:** disposition/handoff handles, conjunct/count matrix,
replay, prohibited-inference tests, SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-disposition.test.mjs
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** accepted branch receipts, fixed evaluation
precedence, current authority digests, owner firewall.

**Handoff:** route to SWU-009; canonical owner action remains outside this plan.
