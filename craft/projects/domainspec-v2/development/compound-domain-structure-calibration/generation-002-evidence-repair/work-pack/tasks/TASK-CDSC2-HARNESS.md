# TASK-CDSC2-HARNESS

## Purpose

Freeze and validate the isolated model harness before any mutation runs.

## SWU-CDSC2-002 - Source-Derived Baseline Harness

**Goal:** produce a source-pinned pure harness and prove baseline equivalence
over all preregistered observables.

**Dependencies:** SWU-CDSC2-001 accepted.

**Source anchors:**

- `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515,518-520,571-710`
- `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:3-17,111-174`

**Outputs:**

- `fixtures/generation-002/harness-manifest.json`
- `harness/baseline/session-fixtures.mjs`
- `harness/baseline/navigation-model.mjs`
- `harness/baseline/screen-registry.mjs`
- `harness/baseline/run-vectors.mjs`
- `evidence/generation-002/baseline-equivalence/receipt.json`
- `tests/baseline-harness.test.mjs`

**Frozen vectors:**

1. active complete session requests step 9 and commits step 9;
2. step 9 next transition resolves to step 10;
3. step 9 back transition resolves to step 8;
4. inactive session requests step 9 and is redirected to login with notice;
5. active incomplete session requests a later step and is redirected to its
   first pending step with notice;
6. mounted false returns no route tree; mounted true selects the active screen.

**Algorithm:**

1. Compute source-slice digests using the parent source-slice canonicalization.
2. Freeze source paths, ranges, digests, vectors, observable fields, M1/M2
   definitions, and prohibited inferences in one manifest.
3. Implement pure data-only models for `guardStep`, navigation commitment,
   `nextStep`, `previousStep`, and screen-key selection.
4. Encode expected baseline outputs directly from cited source decisions.
5. Run every vector twice and compare only `allowed`, `requested_step`,
   `committed_step`, `screen_key`, `next_step`, `previous_step`, and
   `notice_present`, and `route_tree_rendered` where applicable.
6. Freeze a baseline receipt only when all values are total and equal.

**Failure modes:** source drift, missing selector, inconsistent session fixture,
non-total output, nondeterministic output, expected/harness mismatch, or harness
logic outside the declared observable surface.

**Write scope:** this package's `fixtures/generation-002/`, `harness/baseline/`,
`evidence/generation-002/baseline-equivalence/`, focused test, Task Session
evidence, and status sync. Savvy is read-only.

**Done criteria:** manifest validates, all source digests match, all baseline
vectors are total and deterministic, equivalence receipt is frozen, Savvy has
no diff.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/baseline-harness.test.mjs
git diff --quiet -- projects/savvy_legal-studio-ai
```

**Execution owner:** `local-fallback` through Task Session.

**Handoff context:** select this SWU, accepted SWU-001 outputs, these exact
source selectors, parent source-digest method, and no broader Savvy context.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** frozen harness manifest, pure baseline modules, seven-vector
equivalence receipt, `tests/baseline-harness.test.mjs`, and
`runs/SWU-CDSC2-002/TASK-SESSION-RESULT.md`. Focused tests passed 5/5 and the
combined suite passed 41/41.
