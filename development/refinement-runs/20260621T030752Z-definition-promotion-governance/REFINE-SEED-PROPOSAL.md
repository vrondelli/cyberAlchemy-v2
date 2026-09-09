# Refine Seed Proposal: Definition Promotion Governance

Status: strategy-proposal
Owner: refine
Run id: 20260621T030752Z-definition-promotion-governance
Date: 2026-06-21

## Operator Intent

Refine a mechanism for definitions to climb from a source tower into a higher
CyberAlchemy v2 tower while keeping an explicit reference back to the origin.
Use two novelty lanes and design governance for promotion before mutating
canonical definitions.

## Target

`cyberAlchemy-v2/authority/definitions/`

Primary concern: a definition such as Arcanum `schema` should not remain trapped
as "only Arcanum" if CyberAlchemy v2 needs it at a higher level, but v2 also
must not silently copy or overwrite the source authority.

## Current Evidence

- `cyberAlchemy-v2/authority/promotion-policy.md` defines a promotion ladder
  from source evidence through local authority.
- `cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md`
  already says imported definitions get project-local representation with
  source authority, tower assignment, local posture, local action, and
  promotion route.
- `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md` represents
  Arcanum terms such as `DEF-ARC-SCHEMA` without redefining them.
- `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md`
  now provides the search ladder for schema and relationship-invariant evidence.
- `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md` has a promotion
  queue but not yet a general upward-promotion mechanism.

## Proposed Mechanism To Refine

Working name: `definition elevation protocol`.

The protocol should separate four movements:

1. **Represent source authority locally.** A source-cluster row says where the
   term comes from, who owns it, and which tower currently hosts it.
2. **Adapt only when the higher tower needs new semantics.** A higher-level v2
   definition is not a copy; it is a local adaptation with its own scope,
   owner, evidence, and boundary.
3. **Promote through the right owner.** Definitions-governance promotes the term
   into `DEFINITIONS.md`; constitution-governance promotes structural rules;
   decision-gate resolves naming, scope, and contested authority.
4. **Reference back to origin.** The source-cluster row records the local
   adaptation reference, promotion record, and relation type such as
   `adapts_from` or `promoted_as_local_adaptation`.

## Candidate Relation Profile

These names are candidates for design review, not canonical terms:

| Relation | Direction | Meaning |
| --- | --- | --- |
| `represents_external_authority` | local row -> source definition | v2 holds a navigable record but not local semantics. |
| `adapts_from` | local definition -> source definition | v2 definition intentionally adapts source meaning for a higher tower. |
| `promoted_as_local_authority` | source-cluster row -> local definition | source row points to the promoted v2 canonical term. |
| `governed_by` | promotion proposal -> gate/constitution | promotion obeys a named rule or owner gate. |
| `supersedes_local_candidate` | promoted definition -> review/candidate | canonical local definition closes or replaces a candidate artifact. |

## Two Novelty Lanes

### Lane A: Upward Promotion By Adaptation

Question: how does `schema` climb from Arcanum source authority into a
CyberAlchemy-level primitive or subtype without losing formal boundaries?

Novel hypothesis: higher-level promotion creates a new local type such as
`authority schema`, `tower schema`, or `promotion schema`, not a generic
redefinition of `schema`.

### Lane B: Origin Reference And Anti-Drift

Question: how does the origin know it has been used higher in the tower?

Novel hypothesis: source-cluster rows should be bidirectional governance
handles. They keep `source_ref`, `local_representation_ref`,
`promoted_adaptation_ref`, `promotion_record_ref`, and `drift_status`, so the
origin remains visible whenever a higher tower uses it.

## Done Criteria For The Refinement Run

- Produce a non-executed design for definition elevation.
- Decide whether the mechanism is a definition, constitution rule, discipline,
  or mixed governance protocol.
- Preserve source authority and local adaptation boundaries.
- Include a promotion record shape.
- Include the two novelty lanes and their convergence criteria.
- Recommend next routes without mutating canonical definitions before review.

## Preset And Research

- Preset: standard
- Research mode: research-if-gap-appears
- External research: not authorized in this strategy proposal

## Write Scope

Allowed before confirmation:

- this refinement run folder only

Recommended after confirmation:

- review/design artifacts in this run folder
- possible review-only artifact under
  `cyberAlchemy-v2/authority/definitions/reviews/`
- possible constitution-governance proposal if the protocol becomes structural
  governance

Not allowed before confirmation:

- promoting a new `CAV2-D*` definition
- changing the Arcanum source definition of `schema`
- rewriting generated skill packages
- making inventory or ontology canonical authority
