---
module: domainspec-v2-r1-axioms-closeout
version: current
status: draft
updatedAt: 2026-07-09
docType: implementation-layering
---

# Implementation Layering - R1 AXIOMS Closeout

## Purpose

Define the smallest evidence-backed path for closing R1 without pulling in R2,
R5, or R6a/R6b.

## Source Contract

- Invoke define: `DEFINE.md`
- Invoke design: `DESIGN.md`
- Parent work-pack: `../WORK-PACK.md`
- Parent design: `../DESIGN.md`
- Craft ledger: `../../../.craft/ledger.yml`

## Target And Scope

- Target: DomainSpec v2 R1 AXIOMS closeout.
- Scope: governance prose authority-home migration.
- Current state: partially implemented; `impl/spec/AXIOMS.md` exists, R1 is
  about 80% complete, Saturn scope is resolved, authority home is missing.

## Layer Boundary Rule

After this layer, we know whether the R1 authority-home closeout is safe to
promote to the parent Batch-1 ledger.

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (authority proof) | After this layer, we know whether the retained axioms can live under `authority/` without losing meaning. | Author `authority/AXIOMS.md` with A1/A2/A3-recast and Saturn pointers. | Authority file only. | Projection cleanup, manifest/Craft sync. | Reviewable authority file; A2-C6 binding present. | Continue to projection cleanup. |
| L1 (projection cleanup) | After this layer, we know whether `impl/spec/AXIOMS.md` can stop being authority without breaking docs. | Delete or de-authorize `impl/spec/AXIOMS.md`; repoint live references. | Link scan, delete/stub fallback, docs validation. | Parent ledger sync. | `npm run validate` passes. | Continue to closeout sync. |
| L2 (closeout sync) | After this layer, we know whether R1 can be marked closed in planning state. | Update `IMPORT-MANIFEST.md`, `.craft/ledger.yml`, and `CRAFT.md`. | Manifest and Craft status only. | R2/R5/R6a work. | Full validation commands pass; R1 rows synced. | Close R1. |
| L3 (release/package) | After this layer, we know whether R1 closeout is stable for parent Batch-1 continuation. | No extra implementation; parent Batch-1 uses receipt. | Handoff note and receipt only. | Parent freeze gate until R1-R6b are done. | Task Session result path and validation receipt. | Route to R2/R7/R4/R5 sequence. |

## Non Regression Guardrails

- Do not put axioms in `definitions/`.
- Do not duplicate independent axiom content in `impl/spec`.
- Do not delete Saturn-owned material without a pointer.
- Do not edit engine `src/rules`.
- Do not mark R6a or R6b closed from R1 evidence.

## Recommended Next Layer

- Next layer: L0.
- Key decision unlocked: whether `authority/AXIOMS.md` can carry the retained
  DomainSpec axiom set cleanly.
- Major deferred scope: R6a constitution crosswalk and R5 drift owner home.
