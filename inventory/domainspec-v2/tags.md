---
document_id: domainspec-v2-project-inventory-tags/v1
status: canonical-local
authority_effect: inventory-only
visibility: private
updated_at: 2026-08-30
---

# Inventory Tags

| Tag | Meaning |
| --- | --- |
| `domainspec-v2` | Concerns the private DomainSpec v2 product. |
| `project-surface` | Describes the complete tracked/non-ignored source surface. |
| `exact-bytes` | Binds observations to byte digests. |
| `cyberalchemy-v2` | Concerns integration with the private authority spine. |
| `layer-map` | Proposes placement into one CyberAlchemy layer. |
| `path-binding` | Identifies a literal repository-path dependency. |
| `frozen-evidence` | May participate in immutable baseline or receipt identity. |
| `drift` | Records disagreement between current sources. |
| `migration` | Concerns successor placement or compatibility. |
| `decision-gate` | Requires an explicit owner choice before mutation. |

## Open Questions

Add tags only when they improve retrieval across multiple entries. Do not encode lifecycle authority in tags.
