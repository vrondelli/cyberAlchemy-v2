---
module: saga-removal
feature_code: SGRM
status: completed
updatedAt: 2026-07-11
docType: implementation-layering
---

# Implementation Layering: Saga Removal

## Layer Decisions

| Layer | Question answered | Included work | Promotion evidence | Deferred |
| --- | --- | --- | --- | --- |
| L0 - migration contract | Do we know exactly what active Saga surface is removed, what history remains, and what stops execution? | Refresh census; freeze direct-migration policy; enumerate authority, implementation, plan, and read-model targets. | SGRM-001 migration packet and receipt; no source mutation. | Authority and implementation edits. |
| L1 - authority transition | Can canonical DS-D1/DS-D8 represent cross-feature orchestration without Saga? | Remove DS-D1 Saga row; widen Workflow scope; replace Saga relationship signature with Workflow authority; clear only the legacy schema's obsolete source-of projection so root/schema edge validation remains green. | Root YAML/Markdown parse; no active Saga endpoint; later IDs stable; focused schema-field diff; relationship validation passes. | Broad docs/read-model cleanup. |
| L2 - implementation migration | Can authors and validators use Workflow for both scope modes with no Saga schema or fixture? | Add attribute-one-of; migrate Workflow schema/card/fixtures; update relationship and non-collapse validators/tests. | Both valid scopes pass; missing/unknown scope and Saga source fail; full validate passes. | Historical cleanup and release packaging. |
| L3 - recomposition and guard | Does the repository expose zero active Saga surface while preserving history and continuation state? | Sync current docs/plans; cancel hardening routes; install zero-active audit; update Craft/Inventory/observability; final verification. | Classified reference audit passes; read models agree; final Task Session result. | Any future Saga re-entry research. |

## Layer Gates

1. L0 -> L1: migration packet names every owner, target family, historical
   boundary, compatibility assumption, and rollback point.
2. L1 -> L2: root authority validates, no canonical row names Saga, and the
   legacy schema no longer projects the removed edge; schema deletion remains L2.
3. L2 -> L3: content, relationship, instance, non-collapse, and type tests pass.
4. L3 -> close: every remaining Saga match is historical/evidence-classified,
   no active plan schedules hardening, and all receipts are indexed.

## Smallest Coherent Unit

SGRM-001 is the smallest unit: it creates the owner-reviewed migration packet
and live active-reference manifest without changing authority. It satisfies the
planning obligation behind SWU-DSD1-009 and gives later Task Sessions a frozen
removal boundary.

## Recomposition Proof

SGRM-001 freezes the boundary; SGRM-002 creates authority capable of expressing
the selected target; SGRM-003..005 make implementation conform; SGRM-006
removes contradictory current guidance; SGRM-007..008 prove and record the
zero-active state. Removing any layer leaves either no governed authority,
broken authoring/validation, stale current plans, or unverifiable residue.
