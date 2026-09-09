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

# Review - Definitional-Soundness Gate

Reviewer: Quine, W. V.

## Status

**ACCEPT-WITH-REPAIRS.**

`governed facets` is usable, but only if "facet" is defined as a required
declared obligation surface, not as a new authority layer. Prefer `governed
facet obligations` or `promotion facet obligations`; if `governed facets` is
kept, define it defensively.

## Preferred Definitions

`governed facet`: a typed declaration required before promotion, naming an
object's schema, classification, human continuation surface, and
machine-checkable representation, with owner route, source posture, validation
boundary, and explicit residue when absent. A facet is not authority by itself.

`schema facet`: structural shape reference: fields, types, enums, refs,
cardinality, parse/validation rules. It yields shape evidence only.

`classification facet`: controlled category/status vocabulary with owner,
scope, membership rule, source posture, and promotion state. Prefer this over
bare `taxonomy facet`.

`human-continuation view`: human decision/continuation surface: purpose, trust
posture, status, blockers, residue, next route, evidence links. Readability is
not canonicity.

`machine-checkable view`: parseable/checkable representation with schema ref,
classification, typed refs/edges, provenance, validator/proof handles,
projection status, and residue. Checkability is not authority.

## Term Risks

`facet` risks sounding like "aspect of an ontology," so it needs the obligation
wording.

`taxonomy` risks absorbing ontology and relation catalogs. Use
`classification` unless you explicitly include relation-catalog pointers without
collapsing them.

`view` risks source-of-truth confusion. Every view needs `source_of_truth`,
`generated_from`, `view_status`, and `validation_boundary`.

`governed` is too broad unless it resolves into owner route, promotion effect,
and residue handling.

## Non-Collapse Repairs

Add axioms:

- Facet completeness is a promotion precondition, not promotion.
- Aggregating facets does not create authority.
- Schema validity is shape evidence, not authority evidence.
- Classification assignment is not ontology membership or promotion.
- Human-readable is not canonical.
- Machine-readable is not authoritative or a proof beyond named checks.
- Ontology may consume facets, but facets do not replace ontology.

## Final Recommendation

Accept the primitive group with the repaired name `governed facet obligations`,
use `classification facet` instead of `taxonomy facet`, and make missing facets
typed residue with owner route and rationale. This preserves the needed
Quinean discipline: no entity without criteria of identity, no authority
without an owner and promotion rule.
