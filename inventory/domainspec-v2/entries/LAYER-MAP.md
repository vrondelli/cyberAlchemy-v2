---
document_id: domainspec-v2-cyberalchemy-layer-map/v1
status: candidate
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# CyberAlchemy Layer Map

DomainSpec must enter CyberAlchemy v2 as a layered product, not as one copied directory under
`development/`. The file-level proposed placement is recorded on every source-manifest entry.

| Current source area | Proposed CyberAlchemy destination | Rule |
| --- | --- | --- |
| Root thesis, guide, and product README | `product/domainspec-v2/` | Product meaning and audience-facing contract. |
| `architecture/` plus root architecture/crosswalk | `architecture/domainspec-v2/` | System structure, patterns, profiles, and architecture properties. |
| `ontology/` | `ontology/domainspec-v2/` | Product/system/implementation knowledge projections. |
| `impl/` and executable formalization | `implementation/domainspec-v2/` | CLI, generators, schemas, validators, tests, and runtime manifest. |
| `research/` and `discovery/` | `research/domainspec-v2/` | Source-first research and discovery evidence. |
| `development/` and `.craft/` | `development/domainspec-v2/` or retained source archive | Work packs, receipts, baselines, and collaboration history. |
| DomainSpec definitions and authority | `authority/domainspec-v2/` candidate import | Owner-gated; CyberAlchemy definitions must reference, not accidentally redefine, public Arcanum terms. |
| Unclassified root operations material | `development/domainspec-v2/` pending review | No automatic promotion. |

## Invariants

1. Private DomainSpec prose never crosses into public `arcanum/`.
2. CyberAlchemy definitions remain the authority spine; ontology and inventory remain projections.
3. Frozen baselines keep exact path and digest identity until a new successor baseline is admitted.
4. Active implementation imports must be rewritten as one dependency-closed successor, not piecemeal aliases.
5. Old locations are not deleted until every declared consumer resolves the successor path and validation passes.

## Open Questions

- Should development evidence be retained permanently at the source path, copied into a content-addressed archive,
  or rebound through a successor-baseline manifest?
- Does `formalization/` migrate wholly with implementation, or split proof specifications into `specs/domainspec-v2/`?
