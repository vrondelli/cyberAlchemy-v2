# Craft Project

Status: **proposed Project coordinating the Craft Product**
Visibility: **private**
Project ID: `CA2-PROJECT-CRAFT`
Product ID: `CA2-PRODUCT-CRAFT`
Method: `CAV2-D20 Craft Method`
Authority effect: **none**

Craft is a first-class CyberAlchemy `CAV2-D60` Project coordinating the development and evolution of the
separate Craft Product. The Product embodies `CAV2-D20 Craft Method` and supplies the immediate context for
`CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION`.

This topology keeps three things separate:

1. **Product** — `CA2-PRODUCT-CRAFT` owns the product proposition and supplies context for Product Features.
2. **Project** — `CA2-PROJECT-CRAFT` coordinates goals, owners, evidence, decisions, artifacts, and work.
3. **Method** — `CAV2-D20` owns the repeatable way Craft builds systems inside CyberAlchemy.
4. **Product Feature** — the first candidate describes governed system construction inside the Product context.

Start with:

1. [CRAFT-IDENTITY-DECISION.json](CRAFT-IDENTITY-DECISION.json) — the user-selected Product, Project, and Method graph.
2. [project.json](project.json) — the machine-checkable CAV2 Project carrier.
3. [../../../product/craft/PRODUCT-THESIS.md](../../../product/craft/PRODUCT-THESIS.md) — the Craft Product Thesis.
4. [product-feature/THESIS.md](product-feature/THESIS.md) — the first draft Product Feature thesis.
5. [product-feature/product-feature.json](product-feature/product-feature.json) — its machine-readable projection.
6. [goals/establish-craft-product-feature.goal.json](goals/establish-craft-product-feature.goal.json) — the first
   draft Goal owned by the Project.

## Name boundary

The Craft Product, Project, and Method do not replace or rename the public Arcanum `craft` capability. That
capability maintains a repository ledger under `.craft/` and is a narrower realization. Shared spelling does not
merge their ownership, authority, implementation, or lifecycle.

## Current boundary

This package establishes a proposed Project linked to the selected Craft Product and canonical Craft Method. It
does not commit the Product Thesis, admit a canonical Product Feature definition, complete migration from legacy
DomainSpec-v2 paths, select a system architecture, implement a runtime or CLI, publish, release, or deploy anything.
