---
document_id: domainspec-v2-migration-readiness/v1
status: blocked-on-decision
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# Migration Readiness

## Ready now

- The source surface can be enumerated and hashed deterministically.
- Every file has a proposed CyberAlchemy layer classification.
- Literal source-path consumers can be discovered repeatably.
- New DomainSpec product, architecture, and ontology destinations are currently absent, avoiding target overwrite.
- Canonical-document candidates can be written without relocating implementation or frozen evidence.

## Blocked before relocation

Repository extraction is a protected architecture and authority decision. Three materially different paths exist:

| Option | Description | Reversibility | Main cost/risk |
| --- | --- | --- | --- |
| `MIG-A` Governed adoption | Add CyberAlchemy canonical entry surfaces; keep the existing source and frozen evidence where they are; start new work in CyberAlchemy. | High | Leaves two physical roots during transition. |
| `MIG-B` Staged successor migration | Copy a dependency-closed active product slice into CyberAlchemy, create a new baseline and path map, rebind consumers, then deprecate the old active root while retaining evidence. | Medium | More validation and temporary duplication; best match for a real migration. |
| `MIG-C` Direct relocation | Move the current tree and rewrite consumers in one step. | Low | Breaks exact-path evidence and mixes pre-existing dirty bytes with migration changes. |

`MIG-C` is structurally inadmissible without an explicit destructive/authority owner gate and a complete preservation
mechanism. `MIG-A` and `MIG-B` remain real choices. The inventory recommends `MIG-B` because it moves the active
product into CyberAlchemy while preserving old evidence and providing an observable rollback boundary.

## Stop condition

No source relocation, canonical promotion, deletion, or consumer rewrite occurs until the owner chooses an
admissible option and that choice is persisted in the Decision Gate record.

## Open Questions

Choose `MIG-A` or `MIG-B`, or request more context. Direct relocation remains blocked on missing preservation and
destructive-action authority.
