---
document_id: cav2-domainspec-v2-product-entry/v1
status: legacy-name-migration-source
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# Craft Product — legacy DomainSpec v2 path

Craft is the current name of the Product formerly called DomainSpec v2. This directory preserves the legacy-name
CyberAlchemy candidate and migration evidence; it is not a separate predecessor or successor Product. The current
Craft Product home is `cyberAlchemy-v2/product/craft`. No source or authority move is implied by this notice.

## Product thesis

Read [PRODUCT-THESIS.md](PRODUCT-THESIS.md) for the legacy-name CyberAlchemy thesis projection. It is bound to the exact
current source thesis at:

```text
projects/domainspec-v2/PRODUCT-THESIS.md
sha256:13e2eeb7b59cd89c02283d8e54bbb85ed0b0d0d7479f5c666ad289ff5f28a171
source state at inventory capture: untracked
```

## Canonical roles

| Concern | Current source authority | Proposed CyberAlchemy home |
| --- | --- | --- |
| Product positioning | `projects/domainspec-v2/PRODUCT-THESIS.md` | `product/domainspec-v2/PRODUCT-THESIS.md` |
| Term semantics | `projects/domainspec-v2/definitions/` | Owner-gated authority import; not duplicated here |
| System structure | `projects/domainspec-v2/ARCHITECTURE.md` | `architecture/domainspec-v2/SYSTEM-ARCHITECTURE.md` |
| Product/system traceability | `projects/domainspec-v2/ontology/` | `ontology/domainspec-v2/` successor package |
| Executable runtime | `projects/domainspec-v2/impl/` | `implementation/domainspec-v2/` successor package |
| Exact inventory | N/A | `inventory/domainspec-v2/` |

## Claim ceiling

DomainSpec has a private implemented CLI and bounded local evidence. This candidate entry does not make it
public, published, released, deployed, or production-ready. Only Arcanum is public.

## Open Questions

The owner must complete a dependency-closed rename migration before legacy paths can be redirected, archived, or
removed. Until then, this directory remains provenance and migration input rather than the current Craft home.
