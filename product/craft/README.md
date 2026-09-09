# Craft Product

Status: **selected Product identity with a draft Product Thesis**
Visibility: **private**
Product ID: `CA2-PRODUCT-CRAFT`
Project ID: `CA2-PROJECT-CRAFT`
Method: `CAV2-D20 Craft Method`
Authority effect: **none**

Craft is the new name of the DomainSpec v2 Product. It is the same Product lineage, not a separate successor.
The existing `projects/domainspec-v2` and `cyberAlchemy-v2/product/domainspec-v2` paths remain legacy migration
sources until their bytes and authority bindings are moved deliberately. Craft is developed and evolved through the separate Craft Project and
embodies the Craft Method—the governed method CyberAlchemy uses to carry Product intent through meaning,
specification, exact realization, construction, independent checking, operation, recovery, evolution, and owner
continuation.

The same name intentionally labels three connected but non-interchangeable identities:

1. **Craft Product** — owns the product proposition and supplies context for its Product Features.
2. **Craft Project** — coordinates goals, owners, evidence, decisions, artifacts, and work.
3. **Craft Method** — owns the repeatable way systems are built inside CyberAlchemy.

Start with:

1. [IDENTITY.json](IDENTITY.json) — the Product projection of the owner-selected identity graph.
2. [PRODUCT-THESIS.md](PRODUCT-THESIS.md) — the draft Product Thesis.
3. [product-thesis.record.json](product-thesis.record.json) — its machine-readable projection.
4. [../../goals/projects/craft/CRAFT-IDENTITY-DECISION.json](../../goals/projects/craft/CRAFT-IDENTITY-DECISION.json)
   — the source owner decision across Product, Project, and Method.
5. [../../goals/projects/craft/product-feature/THESIS.md](../../goals/projects/craft/product-feature/THESIS.md)
   — the first candidate Product Feature thesis contextualized by this Product.
6. [CONSTRUCTION-FEEDBACK-LOOP.md](CONSTRUCTION-FEEDBACK-LOOP.md) — the intended loop from typed intent to
   construction, independent evidence, repair, recovery, and owner handoff, with an illustrative example.

## Name and authority boundary

The private Craft Product, Project, and Method do not replace the public Arcanum `craft` capability. That
capability owns repository-ledger behavior under `.craft/` and can realize a bounded part of the private method.
Shared spelling grants no shared authority and does not publish private Product meaning.

## Current boundary

This package establishes Craft as the current Product name and starts its Product Thesis. It does not commit the
thesis, canonically define Product Feature, admit the first feature, physically rename or delete legacy paths,
relocate source authority, select architecture, implement a runtime or CLI, publish, release, or deploy anything.

## Open Questions

The [thesis's Open Product Decisions](PRODUCT-THESIS.md#open-product-decisions) own the unresolved Product choices.
The [companion's Open Questions](CONSTRUCTION-FEEDBACK-LOOP.md#open-questions) identify the evidence and feedback
questions for a bounded construction trial.

## Product capabilities

[ORODI](capabilities/orodi/README.md) owns the six existing operational-resilience
capabilities. Its [related-work register](capabilities/orodi/RELATED-WORK.md) links
definitions, evidence, implementation, alerts, and the proposed Alch event integration.
