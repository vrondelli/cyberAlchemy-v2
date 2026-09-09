# Intent-schema experiment claim boundary

## Claims the run may support

- The named files and selectors were sampled, hashed, and projected under the
  documented protocol.
- The candidate JSON shape did or did not validate for the produced fixtures and
  live rows.
- A field was declared, inferred, or unresolved at the observed counts.
- Reviewers recorded concrete ambiguity, overlap, missingness, or
  intent-replacement observations.
- The held-out rows did or did not pass unchanged schema and population rules.
- The evidence makes a candidate field action more or less defensible for this
  bounded local corpus.

## Claims the run cannot support

- That the record captures every possible human or organizational intent.
- That a schema-valid value is true, authorized, approved, complete, or
  semantically necessary.
- That frequency determines which `CAV2-D39` fields are canonical.
- That the candidate record redefines Intent or promotes a definition/schema.
- That the repository has an implemented reasoning engine or evaluator.
- That a reasoning process is unbiased, bias-cancelling, or generally safer.
- That agent agreement, sample count, validator success, or receipt existence
  supplies authority.

## Structural versus semantic evidence

`CAV2-D56` separates the two:

- The JSON schemas and validator establish **shape evidence** by inspection.
- Population observations establish **bounded interpretation evidence** about how
  the candidate works on named sources.
- The operator plus intent-contract owner supplies the **selection decision**.
- Definitions-governance alone owns any later canonical-definition change.

No one layer may impersonate another.

## Privacy and mutation boundary

All records, metrics, and source handles stay under
`cyberAlchemy-v2/development/agent-reasoning-engine/`. The run reads but does not
write the selected source artifacts. Nothing is copied into public Arcanum or
the orchestrator evidence repository.

## Required result wording

Use: “In the bounded 15-record local corpus, the candidate field showed …”

Do not use: “The correct universal intent schema is …”

The final schema-selection artifact must label every action local and revisable,
record unresolved observations, and cite the owner approval separately from the
experiment receipt.
