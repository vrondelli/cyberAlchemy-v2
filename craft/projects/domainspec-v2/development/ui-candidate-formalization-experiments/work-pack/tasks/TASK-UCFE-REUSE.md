# TASK-UCFE-REUSE

## Objective

Extract a candidate-neutral reusable process profile only after the Form pilot
proves the workflow and boundary contracts.

## SWU-UCFE-009 - Reusable Candidate Profile

**Goal:** package process contracts, fixture shapes, gates, and receipt
requirements without copying Form evidence or conclusions.

**Dependencies:** SWU-008 accepted disposition and a pilot process audit pass.

**Algorithm:** identify stable process components; remove Form IDs, source
handles, outcomes, and candidate-specific alternatives; instantiate one neutral
test candidate fixture; replay all three disposition branches; reject any
profile that defaults evidence, reviewers, thresholds, or authority.

**Edge cases:** Form conclusion copied as default, corpus/reviewer placeholders
treated as evidence, candidate-specific DS-D8 edges generalized, promotion
language, unsupported profile version.

**Write scope:** `profiles/candidate-formalization-v1/`,
`tests/candidate-profile.test.mjs`.

**Done criteria:** neutral profile validates, all branches replay, no
candidate-specific evidence remains, and rollout still requires one Task
Session per candidate.

**Acceptance evidence:** profile manifest/digest, neutral vectors, leakage
audit, tests, SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/candidate-profile.test.mjs
```

**Execution owner:** local-fallback; future promotion requires owner approval.

**Context Builder anchors:** audited SWU-008 result, all process contracts,
Form leakage prohibitions, reusable profile boundary.

**Handoff:** route to SWU-010; do not start another candidate automatically.
