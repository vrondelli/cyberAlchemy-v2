---
tags: [cyberalchemy-v2, schema, taxonomy, human-view, machine-view, primitive-lifecycle, definitions-governance, research]
node_type: review
is_session: false
layer: knowledge-governance
nature: evidence
status: candidate
created: 2026-06-21
dispatch_id: 2026-06-21-schema-taxonomy-view-primitives
dispatch_type: research
working_folder: cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/
sources: [cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/research.md, cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/synthesis.md]
---

# Review - Non-Vacuity Gate

Reviewer: Popper, Karl.

## Status

**ACCEPT-WITH-REPAIRS.**

## Non-Vacuity Witness

The rule is non-vacuous if a candidate promoted definition, for example
`CAV2-Dxx: governed facets`, must pass four separately checkable declarations
before promotion:

- schema facet: names a schema/shape owner, not just "valid markdown"
- taxonomy facet: names the classification catalog and authority posture
- human-continuation view: exposes status, trust boundary, blockers/residue,
  next route, and evidence
- machine view: provides a parseable/checkable envelope with source,
  validator/proof handle, projection status, and residue

Concrete bite: `research.md:302` says there is no global machine-view validator
yet. Therefore a promotion attempt today must either block or emit typed
residue with owner route and rationale. If it can promote anyway, the rule is
vacuous.

## What Would Falsify It

A validator or reviewer accepts any of these negative controls:

- a schema-valid artifact as authority evidence
- a taxonomy label as promotion
- a readable Markdown explanation as canonical source
- a generated/indexed machine projection as authority
- `not_applicable` with no typed rationale and owner route
- one prose paragraph reused as schema, taxonomy, human view, and machine view
- a promoted load-bearing artifact with a missing facet and no residue

## False-Positive Risk

High unless "load-bearing", "promotion", "declared", and "typed residue" are
mechanically bounded. Otherwise everything can pass by adding ceremonial
fields. The biggest danger is a checkbox constitution: four labels appear, but
none bind to owners, validators, source posture, or promotion consequences.

## Needed Checks / Validators

Minimum gate:

1. `facet-presence`: required facet keys or explicit residue.
2. `facet-disjointness`: schema != taxonomy != human view != machine authority.
3. `source-posture`: canonical/imported/generated/explanatory declared.
4. `taxonomy-owner`: catalog and membership rule named.
5. `human-view-minimum`: trust boundary, status, blockers/residue, next route,
   evidence links.
6. `machine-view-envelope`: parseable id, kind, schema ref, taxonomy ref,
   source-of-truth, validator command/proof status, projection status.
7. `residue-validity`: missing facet has type, owner route, rationale, and
   promotion effect.

## Final Recommendation

Accept the primitive group as a real governance move, but repair before
promotion: define the facet envelope and typed-residue grammar first, then wire
a promotion gate. Until then, the lifecycle rule is conceptually sharp but not
yet operational enough to prevent ceremonial compliance.
