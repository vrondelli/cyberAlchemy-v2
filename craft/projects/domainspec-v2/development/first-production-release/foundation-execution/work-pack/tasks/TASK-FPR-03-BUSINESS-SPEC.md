---
task_id: TASK-FPR-03-BUSINESS-SPEC
owner_node: FPR-03
layer: L2
status: blocked
---

# TASK-FPR-03-BUSINESS-SPEC

## Objective

Resolve the existing ontology/spec direction frontier and create one governed business ontology/knowledge plane with a total, provenance-preserving map into authoritative Spec sources.

## Dependency

Verified FPR-02 profile digest and negative matrix.

## SWU-FPR03-001: Resolve `FR-FPR-ONTOLOGY-DIRECTION`

- Source anchors: Craft frontier; prior spec-as-ontology findings; active contract-to-authoring lens; accepted `B=(BO,BK,provenance,authority) -> Spec` chain; FPR-01 dispositions.
- Write scope: `development/first-production-release/decisions/ontology-spec-direction.md` only plus Decision Gate receipt.
- Done criteria: decide direction, precedence, supersession, provenance, contradiction handling, promotion owner, and what remains generated-only; explicitly preserve non-collapse between B, Spec, Sg, G, and UI graph.
- Acceptance evidence: accepted Decision Gate artifact reviewed through Definitions Governance.
- Validation: no bidirectional-authority ambiguity; every contradiction path has an owner and outcome; Craft frontier can be updated from the receipt later.
- Owner: semantic owner + definitions owners through Decision Gate.
- Handoff: accepted decision only to FPR03-002.

## SWU-FPR03-002: Governed Business Plane

- Dependencies: FPR03-001.
- Write scope:
  - `graphs/business-ontology.json`
  - `graphs/business-knowledge.json`
  - `graphs/business-graph-manifest.json`
  - their three schemas
- Done criteria: bounded BO/BK artifacts include stable IDs, provenance, authority receipt reference, contradiction state, and real `CreateSuggestedTrack/CT-1` plus `ActivityEvidenceCandidate/EC-3/EC-4` witnesses.
- Acceptance evidence: schema-valid graph manifest with nonempty exact node/assertion sets and deterministic digest.
- Validation: schema validation; missing provenance/authority/identity fixtures fail.
- Owner: ontology/business owners using Ontology Harness; semantic owner reviews promotion.
- Handoff: exact B manifest to FPR03-003.

## SWU-FPR03-003: Total B-to-Spec Map

- Dependencies: FPR03-002.
- Write scope:
  - `graphs/b-s-map.json`
  - `schemas/b-s-map.schema.json`
  - `tools/validate-business-spec-map.cjs`
  - `fixtures/business-spec/`
  - FPR-03 evidence/receipt
- Done criteria: every in-profile B element maps to an authoritative Spec endpoint with rule, provenance, authority, and contradiction disposition; no orphan/multiply-owned endpoint; mapping is total over the declared denominator.
- Acceptance evidence: positive totality report and killed deletion, mistyped endpoint, orphan rule, collapsed-identity, and conflicting-authority mutants.
- Validation: planned map verifier command; independent exact-set comparison; deterministic replay.
- Owner: semantic/validation owners; mapper and exact-set verifier must be separable modules.
- Handoff: verified B-to-Spec receipt opens FPR-04.

## Synchronization

The learning-map application may later consume the generated Sg, not BO/BK or this mapping as a write authority.

