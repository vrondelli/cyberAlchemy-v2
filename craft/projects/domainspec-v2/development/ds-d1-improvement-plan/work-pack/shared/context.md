---
feature_code: DSD1
docType: shared-context
status: draft
updatedAt: 2026-07-11
---

# Shared Context: DS-D1 Improvement Plan

## Operating Truth

DS-D1 is moving from a broad candidate set toward governed category authority.
The accepted research originally evaluated 14 backend candidates; the active
registry now has 13 after the accepted Saga collapse. Several remaining types
still need stronger semantic laws. The UI
11 are visible because DS-D8 endpoint signatures use them, but DS-D1 has not
formed them as first-class categories yet.

## Authority Boundaries

| Surface | Authority |
| --- | --- |
| `definitions/meta-types/` | Canonical DS-D1 human and machine authority. |
| `impl/spec/meta-types/` | Necessary implementation view for schemas and validation. |
| `definitions/relationships/` | DS-D8 relationship authority; can pressure DS-D1, not promote it. |
| `development/*/WORK-PACK.md` | Planning/execution memory; not category authority by itself. |
| `CRAFT.md` | Continuation state and ledger summary; not a source of type law. |

## Required Vocabulary

| Term | Use |
| --- | --- |
| shape-candidate | A type has schema/fixture shape but not full semantic authority. |
| semantic-hardening | Work to add finite laws, non-examples, and correction routes. |
| formation-deferred | A candidate label is visible but not first-class DS-D1 authority. |
| endpoint-used | DS-D8 uses the label in relationship signatures or examples. |
| promoted | The type has enough human and machine evidence for the selected authority level. |
| relationship non-collapse test | A relationship earns DS-D2/DS-D8 authority only if removing it changes at least one tracked property: reject/allow decision, derivation consequence, projection consequence, composition path consequence, owner route consequence, or generated artifact consequence; see `domainspec-v2-D18..D25`. |
| typed composable graph fragment | The current R3 graph is finite, typed, and composable through declared obligations, but does not claim full category laws; see `domainspec-v2-D19`. |

## Common Pitfalls

- Do not convert endpoint-use into formation authority.
- Do not call a type proven because it has a schema.
- Treat the Saga collapse decision and SGRM-001..008 closeout as consumed; do not reopen hardening or completed repository-local migration without new evidence and a governed decision.
- Do not add broad category laws inside this DS-D1 improvement pass.
- Do not import private implementation derivation rules into public validators.
