# Refine Result — UOVA Relation Reference Architecture

Status: **complete at design and non-executed plan level**

## Outcome

The portal blocker was a symptom of a cross-component identity problem. The
selected repair is:

> One SourceGraph relation, one admitted scene binding, one immutable revision-bound
> index, lightweight references for live UI, and validated snapshots for detached
> output.

This preserves exact relation identity across Portal, Path, navigation, cards,
geometry, renderer, inspector, Full Index, and static output without making each
component a new semantic owner.

## What changed in the design

- Added an actual compositional KnowledgeScene v1.2 contract.
- Defined RelationRef, index receipt, and self-contained RelationSnapshot contracts.
- Made digest ordering, domain separation, counts, and migration laws normative.
- Required v1/v1.1 migration to compare exact SourceGraph and ViewPack inputs.
- Assigned all downstream work to nine ordered SWUs in four waves.

## Evidence

- three approved read-only reviewers joined;
- design selector: pass, fixed point;
- both JSON Schemas: valid Draft 2020-12;
- conceptual toy game: 15/15 checks passed on attempt 2;
- finite implementation pack: UOVARR-001–009.

The toy game specifically proves that parallel relations sharing endpoints and a
predicate retain separate IDs, selections, paths, and projections. It also rejects
stale/missing refs, drifted copies, wrong geometry revisions, duplicate IDs,
snapshot drift, and source-unbound migration.

## Next route

Run invoke:refresh against stages/09-invoke-plan/WORK-PACK.md. It must issue the
byte-current admission package and resolve the Body War denominator owner gate
before UOVARR-008. Do not resume the old SWU-UOVA-004 contract directly.

## Claim ceiling

No OEW product code, completed UOVA evidence, ontology, Body War source, dependency,
Git state, deployment, promotion, or release was changed. This run does not prove a
working frontend, browser behavior, accessibility conformance, or production
readiness.
