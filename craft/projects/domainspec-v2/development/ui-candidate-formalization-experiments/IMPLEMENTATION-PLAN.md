---
artifact_id: UCFE-IMPLEMENTATION-PLAN-v1
status: approved
complexity: high
output_mode: split
target_profile: form-pilot
created: 2026-07-12
---

# Implementation Plan

## Objective

Implement and run one governed Form candidate experiment from preregistration
through owner handoff, then extract a reusable candidate profile only after the
pilot is audited. A truthful `defer-missing` or `covered-existing` is as valid
as `distinct-supported`.

## Delivery Boundary

Included:

- candidate-run and existing-coverage contracts;
- Form preregistration with named existing alternatives and falsifiers;
- Body War corpus A normalization;
- gated corpus B selection and authorship attestation;
- separating experiments and independent reviews;
- fixed-policy disposition, owner handoff, and pilot audit;
- conditional reusable profile extraction.

Excluded:

- DS-D1/DS-D8 mutation or promotion;
- simultaneous execution for all nine candidates;
- lowering or tailoring 2/2/2;
- inventing independent sources, authors, reviewers, or experiment outcomes;
- Action-source edge design.

## Delivery Slices

| Slice | Layer | Outcome | SWUs | Promotion evidence |
| --- | --- | --- | --- | --- |
| S0 Contract and preregistration | L0 | Total three-disposition run contract and pinned Form hypotheses | 001-002 | schema/evaluator tests and immutable preregistration |
| S1 Existing coverage | L0/L1 | Six-dimension result for each named existing alternative | 003 | coverage matrix, no-pooling negatives, changed-consequence checks |
| S2 Empirical evidence | L1 | Two real corpora/two styles plus separation receipts, or typed missing | 004-006 | corpus receipts and experiment results |
| S3 Review and evaluation | L2 | Two independent reviews and one typed disposition | 007-008 | attestations, policy/dossier evaluation, handoff |
| S4 Reuse and closeout | L3 | Audited pilot and reusable profile or explicit non-extraction | 009-010 | profile validation and integrated audit |

## Branch Logic

```text
001 contract -> 002 preregister -> 003 coverage audit
                                      |
                     covered-existing +--> 008 disposition
                                      |
                         not complete +--> 004 corpus A
                                                   |
                                              005 corpus B
                                                   |
                                              006 separation
                                                   |
                                              007 reviews
                                                   |
                                              008 disposition
                                                   |
                                              009 profile extraction
                                                   |
                                              010 audit
```

SWU-009 runs only after an audited Form disposition. It extracts process
contracts, never Form evidence or conclusions, into a reusable profile.

## Algorithms

### Candidate disposition

1. Reject malformed, contradictory, duplicate, stale, or cross-candidate input.
2. Evaluate each existing alternative independently on six coverage dimensions.
3. If one named alternative passes all six, emit `covered-existing`.
4. Otherwise evaluate the hard distinct matrix and fixed 2/2/2 counts.
5. If all pass, emit `distinct-supported`.
6. Otherwise emit `defer-missing` with exact missing obligations.
7. Publish an immutable generation and handle-only owner handoff.

No score, weighting, candidate-controlled threshold, or missing-to-fail rewrite
is permitted.

### Corpus independence

1. Pin repository, revision, path, selector, file digest, author identity, and
   implementation style.
2. Reject aliases that reuse the same source as a second corpus.
3. Count each author once per candidate, regardless of repository aliases.
4. Keep literal observations separate from reviewer candidate correspondence.

### Reviewer independence

1. Require reviewer identity and explicit independence attestation.
2. Count a reviewer identity once across roles.
3. Count only agreement on both correspondence and applicability.
4. Preserve disagreements as evidence; do not average or outvote them.

## Validation Strategy

| Slice | Validation |
| --- | --- |
| S0 | JSON-formatted YAML schema closure, evaluator branch tests, canonical identity and replay |
| S1 | Complete six-dimension matrix, alternative isolation, positive equivalence/no-loss checks |
| S2 | source/authorship/style digest checks, 2/2 boundary negatives, erasure and changed-consequence fixtures |
| S3 | reviewer dedupe/independence negatives, fixed policy evaluation, prohibited dispositions, owner boundary |
| S4 | reusable profile fixture replay, full package tests, DomainSpec aggregate validation, immutable source audit |

## Stop Conditions

- Stop if a task would edit canonical definitions, relationships, or candidate status.
- Stop if collapse is inferred from missing or absent evidence.
- Stop if a second corpus lacks independent authorship or a second style.
- Stop if reviewers are unknown, duplicated, or not independence-attested.
- Stop if one candidate's evidence is reused to satisfy another candidate.
- Stop if a disposition is promoted without an owner decision.
- Stop profile extraction if the Form pilot has not reached an audited disposition.

## Recommended Start

Execute `SWU-UCFE-001` only. It closes the disposition and identity contract
before any candidate-specific or external evidence is mutated.
