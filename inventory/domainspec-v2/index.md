---
document_id: domainspec-v2-project-inventory-index/v1
status: current
authority_effect: none
visibility: private
captured_at: 2026-08-31T02:01:05Z
---

# DomainSpec v2 Project Inventory

This is the human projection of `domainspec-v2-project-inventory@1`. The machine source is
[`index.json`](index.json); the exact file ledger is [`source-manifest.json`](source-manifest.json).
Inventory records source state and migration risk. It does not promote, relocate, accept, publish, or
delete anything.

## Snapshot

| Measure | Value |
| --- | ---: |
| Source entries | 10956 |
| Present bytes inventoried | 98598963 |
| Dirty or missing entries | 309 |
| External files containing the literal source path | 1027 |
| Those consumers inside CyberAlchemy v2 | 725 |
| Source manifest digest | `377362acdbaa687839389790d92f1e6e5be9352cdcaf460f081daca12d13114d` |

Ignored and ephemeral files are intentionally outside the exact-byte ledger. Tracked files that are
currently missing remain represented as `kind: missing` and `git_state: deleted`.

## Source areas

| Source area | Entries |
| --- | ---: |
| `(root)` | 15 |
| `.craft` | 12 |
| `architecture` | 27 |
| `authority` | 29 |
| `definitions` | 25 |
| `development` | 8854 |
| `discovery` | 2 |
| `formalization` | 59 |
| `impl` | 1715 |
| `ontology` | 32 |
| `research` | 186 |

## Proposed CyberAlchemy layers

| Target layer | Entries |
| --- | ---: |
| `architecture/domainspec-v2` | 29 |
| `authority/domainspec-v2` | 54 |
| `development/domainspec-v2` | 8871 |
| `implementation/domainspec-v2` | 1776 |
| `ontology/domainspec-v2` | 32 |
| `product/domainspec-v2` | 6 |
| `research/domainspec-v2` | 188 |

## Git state

| State | Entries |
| --- | ---: |
| `clean` | 10647 |
| `deleted` | 4 |
| `modified` | 69 |
| `untracked` | 236 |

## Inventory entries

| ID | Status | Record |
| --- | --- | --- |
| `domainspec-v2-project-surface` | current | [Project surface](entries/PROJECT-SURFACE.md) |
| `domainspec-v2-layer-map` | candidate | [Layer map](entries/LAYER-MAP.md) |
| `domainspec-v2-path-risk` | current | [Path and evidence risk](entries/PATH-AND-EVIDENCE-RISK.md) |
| `domainspec-v2-gaps` | open | [Gaps and contradictions](entries/GAPS-AND-CONTRADICTIONS.md) |
| `domainspec-v2-migration-readiness` | blocked-on-decision | [Migration readiness](entries/MIGRATION-READINESS.md) |

## Open Questions

The migration-mode decision remains open. See [Migration readiness](entries/MIGRATION-READINESS.md)
and the separately owned Decision Gate record before any source relocation or canonical promotion.
