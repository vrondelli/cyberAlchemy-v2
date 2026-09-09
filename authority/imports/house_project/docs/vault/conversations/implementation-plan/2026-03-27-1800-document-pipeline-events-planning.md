---
tags: [event-system, pipeline, ccb, acquisition]
node_type: implementation-plan
is_session: true
layer: architecture, domain
nature: technical, procedural
status: active
created: 2026-03-27
timestamp: 2026-03-27T18:00:00-03:00
expires: 2026-05-26
conversation_id: document-pipeline-events-planning
# --- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Defines the complete EventLogEntities observability layer for the document validation pipeline — 8 new events, schema alignment (actor/origin), and document_hash identity — directly shaping audit and re-processing capabilities."
user_satisfaction: {mean: 8, min: 6, max: 9, std: 1.2}
---

# Document Pipeline Events: Discovery Review & Implementation Planning

**Date:** 2026-03-27 18:00 (UTC-3)
**Tags:** #event-system #pipeline #ccb #acquisition

## Summary

This session reviewed the `document-pipeline-events-discovery.md` spec for the
document validation pipeline's EventLogEntities observability layer, identified
and fixed several factual errors, made key design decisions about event granularity
and entity identity, and produced a 12-task implementation plan. The session
covered the full pipeline from OCR through cross-check, establishing the principle
of one event per pipeline step with a status/bool discriminator field instead of
paired success/failure event types.

### Discovery Review and Error Correction
- **Problem/Goal:** Validate the discovery doc's claims against actual codebase state
- **Decision:** Fixed incorrect claim that EventLogEntities received "no data" (it receives OCR trio events); fixed claim about cross-check events having "current EventLog usage" (they're never emitted); removed `str(document_version.pk)` as entity_id (violates Rule 13)
- **Changes:** Multiple edits to `document-pipeline-events-discovery.md` correcting context, removing stale claims, updating version to 0.2.0

### Single Event Per Step Design Principle
- **Problem/Goal:** The discovery had inconsistent patterns — some steps had paired events (MATCHED/NOT_FOUND, PASSED/FAILED), others had single events with boolean fields
- **Decision:** Standardized on single event per pipeline step with a status field. `DOCUMENT_CONTRATO_MATCHED` + `DOCUMENT_CONTRATO_NOT_FOUND` merged into `DOCUMENT_CONTRATO_EVALUATED`. `DOCUMENT_CROSS_CHECK_PASSED` + `DOCUMENT_CROSS_CHECK_FAILED` merged into `DOCUMENT_CROSS_CHECK_RESULT`. Rationale: compact enum, easier querying ("all results for step X"), consistent pattern.
- **Changes:** Rewrote discovery sections 3.5-3.9, updated enum registration in section 5

### Document Hash Identity
- **Problem/Goal:** entity_id was using `str(document_version.pk)` which violates Constitution Rule 13 (deterministic hashes for granular entities)
- **Decision:** New `document_hash(original_name, leaf_folder_path, created_at)` function in `entity_identity.py`. Uses existing `compute_entity_hash` pattern (SHA-256 truncated to 32 hex chars). Stable across re-processing.
- **Changes:** Updated discovery to specify hash composition

### OCR Event Simplification
- **Problem/Goal:** Current OCR trio (STARTED + COMPLETED/FAILED) is verbose; extraction method (`pymupdf`/`tesseract`/`force_ocr`) was not tracked
- **Decision:** Single `DOCUMENT_OCR_RESULT` replaces the trio. Method derived from `extract_text_with_fallback` return value (`used_ocr` bool). Dropped `pages` field (always `[0,1,2,3]`), dropped `used_fallback_ocr` (redundant with `method`), dropped `empresa` (inferred in later step). Renamed `classification_method` to `doc_classification_method`.
- **Changes:** Rewrote discovery section 3.1 with new metadata schema

### Cross-Check and Kit Evaluation Events Added
- **Problem/Goal:** Initially cross-check events were deferred; kit evaluation had no event
- **Decision:** Added `DOCUMENT_CROSS_CHECK_RESULT` (single event with `passed` bool and `divergent_fields`). Added `DOCUMENT_KIT_EVALUATED` (folder-level event with kit match result). This gives complete pipeline coverage: 8 events total.
- **Changes:** Updated discovery to include sections 3.7 and 3.6

### Emission Pattern Clarified
- **Problem/Goal:** Constitution Rule 12 mandates `bulk_create`, but pipeline events are emitted per-DV inside loops
- **Decision:** `log_entity_event_safe()` per iteration is correct for sequential per-entity pipeline steps. `bulk_create` is for batch scenarios (approving N contracts). Added explicit note to discovery.
- **Changes:** Added "Emission pattern" paragraph to discovery section 3

Key outputs:
- `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` — reviewed and corrected discovery (v0.2.0)
- `docs/superpowers/plans/2026-03-27-document-pipeline-events.md` — 12-task implementation plan

## Key Decisions

- **Single event per step:** Every pipeline step emits exactly one event with a status/bool discriminator. No paired success/failure event types.
- **document_hash = original_name + leaf_folder_path + created_at:** Deterministic identity for DocumentVersion entities in EventLogEntities.
- **OCR method tracking via return value:** Capture `used_ocr` from `extract_text_with_fallback` instead of restructuring extraction code.
- **Per-DV emission inside loops:** `log_entity_event_safe()` per iteration, not `bulk_create`, for sequential pipeline steps.
- **Cross-check events included now:** Despite feature being incomplete, the events are registered so implementation can wire them when the step runs.
- **Deprecate old events, don't remove:** OCR trio and cross-check pair stay in enum/catalog for historical data; marked DEPRECATED.
- **Schema alignment:** `actor` (FK, nullable), `origin` (CharField) added to EventLogEntities; `entity_id` widened to 255.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` | `modified` | Fixed factual errors, standardized to single-event-per-step pattern, added cross-check and kit events, updated entity_id to document_hash, added emission pattern note |
| `docs/superpowers/plans/2026-03-27-document-pipeline-events.md` | `created` | 12-task implementation plan covering schema migration, hash function, enum/catalog registration, event wiring for all 6 pipeline steps + document view, and constitution update |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `run_ocr_for_version` still emits old OCR trio | Discovery review | MEDIUM | Backlog — not part of CCB pipeline, separate code path |
| `_step_rename_documents` has no event | Pipeline coverage review | LOW | Decided to skip — simple renaming, table state sufficient |
| `DOCUMENT_VIEWED` in `DocumentVersionFileView` | Task 10 note | LOW | Optional — plan marks it as "optionally add" |

## Open Questions

None — all questions resolved during the session.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `validates` | Rule 12 two-dimensional split confirmed as correct model |
| [[document-pipeline-events-discovery]] | `refines` | Session corrected errors and established design principles |
| [[system-axioms]] | `derives-from` | AX-SYS-4 (Immutability) and AX-SYS-5 (Observability) justified keeping contrato/cross-check events despite table state |
| [[system-premises]] | `derives-from` | P-SYS-6 (Implied Knowledge) was the deciding argument for event vs table state |
