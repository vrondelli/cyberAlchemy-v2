---
tags: [event-system, ccb, pipeline, observability]
node_type: discovery
is_session: true
layer: architecture, domain
nature: technical, procedural
status: active
created: 2026-03-27
timestamp: 2026-03-27T15:00:00-03:00
expires: 2026-05-26
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md, specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Defines the complete observability contract for the CCB bulk import pipeline — 8 events covering every pipeline step — and resolves design issues before implementation begins."
---

# Document Pipeline Events — Spec Review & Design Decisions

**Date:** 2026-03-27 15:00 (UTC-3)
**Tags:** #event-system #ccb #pipeline #observability

## Summary

This session reviewed the document pipeline events discovery and implementation plan for consistency, correctness, and business logic soundness. The specs define 8 new `EventLogEntities` events to provide full observability over the CCB bulk import pipeline steps (OCR, merge, template matching, field validation, contrato lookup, kit evaluation, cross-check). Claims were verified against the actual codebase, which confirmed the current state (partial OCR trio coverage, missing events for all other steps, schema gaps in `EventLogEntities`).

Eight issues were identified, discussed, and resolved through iterative design decisions. The user made additional refinements after the review, including removing `DOCUMENT_VIEWED` from scope (reducing to 8 events) and changing `entity_domain` from `'aquisicao'` to `'documents_validation'`.

### OCR Emission Location

The implementation plan Step 2.1 originally said to remove all three OCR trio events from `_step_classify_dvs`, but codebase verification revealed that `DOCUMENT_OCR_EXTRACTION_COMPLETED` is actually emitted in `_step_extract_and_match`, not `_step_classify_dvs`. Step 2.1 was corrected to explicitly reference both locations. This would have caused a bug — the old COMPLETED event would have survived cleanup.

### DOCUMENT_MERGE_RESULT — Separate Event vs Folding into OCR_RESULT

We explored whether merge information could be folded into `DOCUMENT_OCR_RESULT` as a `merged_into_dv_id` field. The problem: the merge runs in `_step_merge_identificacao` which executes **after** `_step_classify_dvs` where `DOCUMENT_OCR_RESULT` is emitted. At OCR emission time, we don't yet know which DVs will be merged. Moving OCR emission after the merge would make the event name misleading. Retroactively updating events would break immutability. Decision: keep `DOCUMENT_MERGE_RESULT` as a separate event. Payload was simplified to just `merged_dv_ids` (the deleted DVs), with the survivor identified by the `entity_id` (its `document_hash`). The event only fires when ≥2 Identificacao DVs exist.

### DOCUMENT_CONTRATO_EVALUATED — No Event When No CCB

The original spec included `'no_ccb'` as a `failure_reason` for when a folder has no CCB document. The problem: when `ccb_dv is None`, there is no document to compute a `document_hash` for the `entity_id`. We considered emitting a different event or using `folder_hash`, but concluded that the absence of the event is sufficient signal — the `DOCUMENT_OCR_RESULT` events for the folder already show no document was classified as CCB. `'no_ccb'` was removed from failure_reasons. A reprocessing note was added: events are immutable facts, reprocessing emits new events.

### Renamed VALIDATED → EVALUATED for Field Check Events

The original names `DOCUMENT_CRITICAL_FIELDS_VALIDATED` and `DOCUMENT_NON_CRITICAL_FIELDS_VALIDATED` implied the event only fires when validation actually runs. The user wanted visibility into documents that **lacked** critical fields or templates. Renamed to `DOCUMENT_CRITICAL_FIELDS_EVALUATED` and `DOCUMENT_NON_CRITICAL_FIELDS_EVALUATED` with a new `evaluated: bool` field. When `evaluated=False`, the document had no template or no configured fields — `passed=None`. When `evaluated=True`, the check ran and `passed` reflects the result. These events now emit for **all** documents, including unmatched ones, providing full pipeline observability.

### Tier Changed from 'tech' to 'business'

The implementation plan originally set `tier='tech'` for pipeline events. The user corrected this: these are business-significant audit outcomes (OCR results, contrato matches, cross-check validations), not internal technical telemetry. Changed to `tier='business'` for all pipeline events.

### DOCUMENT_VIEWED Removed from Scope

The user removed `DOCUMENT_VIEWED` from the event set during their own edits, reducing the total from 9 to 8 events. This was a frontend-triggered human event that didn't fit the pipeline-focused scope of this implementation.

### Entity Domain Changed

The user changed `entity_domain` from `'aquisicao'` to `'documents_validation'` to better align with the bounded context where these events originate.

## Epistemic Impact

**Confirmed:**
- The two-table event architecture (EventLog vs EventLogEntities) is correctly two-dimensional: granularity (batch vs entity) and nature (state-changing vs observational). Rule 12 of the event system constitution captures this.
- The `log_entity_event_safe` pattern is correct for sequential per-document pipeline loops. The `bulk_create` pattern is for batch scenarios only.

**Challenged and resolved:**
- The OCR trio pattern (3 separate events for started/completed/failed) was replaced with a single outcome event pattern. One event per step with a status/bool discriminator.
- The assumption that field validation events should only fire when validation runs was challenged — the `evaluated: bool` pattern captures "nothing to check" as a distinct, observable state.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` | Modified | Added pipeline step context table; simplified MERGE_RESULT payload; removed no_ccb from CONTRATO_EVALUATED; renamed VALIDATED→EVALUATED with evaluated:bool; removed DOCUMENT_VIEWED; changed entity_domain to documents_validation; updated enum values and migration checklist |
| `specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md` | Modified | Fixed Step 2.1 OCR emission locations; simplified Step 2.2 payload; updated Steps 2.4/2.5 for EVALUATED rename; updated Step 2.6 for no_ccb removal; removed Step 2.9 (DOCUMENT_VIEWED); changed tier to business; changed entity_domain to documents_validation; updated enum values |

## Connections

| Document | Type | Description |
|---|---|---|
| [[document-pipeline-events-discovery]] | `contextualizes` | This session reviewed and refined the discovery spec |
| [[document-pipeline-events-implementation]] | `contextualizes` | This session reviewed and refined the implementation plan |
| [[event-system-constitution]] | `validates` | Confirmed Rule 12's two-table split and identified remaining amendment needs |

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Constitution Rule 12 amendment (log_entity_event_safe pattern + code example fix) | Discovery Section 6 | HIGH | Open |
| `document_hash` and `folder_hash` functions in entity_identity.py | Discovery Section 3 | HIGH | Open — Phase 1 prerequisite |
| Verify no dashboards/admin views filter on the 5 deprecated event types | Implementation Step 3.3 | MEDIUM | Open |
