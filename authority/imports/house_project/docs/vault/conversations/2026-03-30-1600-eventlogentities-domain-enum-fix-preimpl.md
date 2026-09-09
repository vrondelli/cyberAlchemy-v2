---
tags: [event-system, infrastructure, architecture]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-30
timestamp: 2026-03-30T16:00:00-03:00
expires: 2026-05-29
conversation_id: 7e3b1f2a-9c4d-4e8f-b0d1-2a5c6e7f8b9d
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/event_system/implementation-plan-entity-event-catalog-alignment.md, specs/004-operations-control-center/operations-control-center-discovery.md]
promoted_candidates: [docs/vault/constitution/event-system-constitution.md]
expected_importance: 6
importance_rationale: "This session prevented a silent domain-classification defect from being baked into production data by identifying that Step 0 of the catalog-alignment plan would have broken an enum consistency invariant, then applying the full correction (enum rename + migration + catalog fix) before implementation began."
---

# EventLogEntities Catalog Alignment — Pre-Implementation Review and Step 0 Fix

**Date:** 2026-03-30 16:00 (UTC-3)
**Tags:** #event-system #infrastructure #architecture

## Summary

This session reviewed the `EventLogEntities — Catalog Alignment` implementation plan for correctness before execution, identified one blocking inconsistency and two minor gaps, and fixed all of them. The plan's broader goal is to auto-derive `tier`, `entity_domain`, and `object_type` from the event catalog inside `log_entity_event()`, eliminating those parameters from all call sites. Step 1 (adding the `tier` column) was already complete; Steps 2–4 remain pending.

### Blocking Inconsistency — EventType stored values vs. catalog domain

Step 0 of the plan proposed changing the catalog `entity_domain` from `'aquisicao'` to `'documents_validation'` for `DOCUMENT_OCR_ERROR` and `DOCUMENT_CROSS_CHECK_OVERRIDDEN`. However, their EventType enum values encoded `'aquisicao'` as the domain prefix (`'aquisicao.ocr_error'`, `'aquisicao.cross_check_overridden'`). An existing test — `test_event_type_domain_prefix_matches_catalog_entity_domain` — validates that the stored domain prefix always matches the catalog's `entity_domain`. Changing only the catalog without renaming the enum values would have broken that test.

Three options were considered:
1. **Full correction** — rename the EventType enum values, fix the catalog, write a data migration.
2. **Skip Step 0** — keep the catalog as-is and pick a different anchor event for the Step 4 tests.
3. **Suppress the test** — accept the inconsistency.

The user confirmed option 1: these events genuinely belong to `documents_validation`. The full correction was applied: enum values renamed, catalog entries updated, and a reversible `RunPython` migration (0046) written to update existing rows in both `event_logs` and `event_log_entities`.

### Minor Gap 1 — Dead import in process_bulk_import.py

`process_bulk_import.py` imported `log_entity_event_safe` but never called it. After Step 2's signature change it would still compile, but it is dead code. The import was removed.

### Minor Gap 2 — test_ocr.py not mentioned in Step 4

GitNexus flagged `test_ocr.py` as containing tests named after `log_entity_event_safe` behavior that exercise the OCR → `extraction_steps.py` call path. The plan's Step 4 made no mention of this file. A note was added directing implementers to run it after Step 3 to confirm the call-site removals don't break the OCR pipeline path.

### Stale spec reference corrected

`specs/004-operations-control-center/operations-control-center-discovery.md` referenced `aquisicao.cross_check_overridden` (the old stored value). Updated to `documents_validation.cross_check_overridden`.

---

## Epistemic Impact

The existing test `test_event_type_domain_prefix_matches_catalog_entity_domain` encodes the invariant: EventType stored-value domain prefix must always agree with the catalog's `entity_domain`. This session **validates** that invariant by demonstrating it caught a real defect before it reached production. The invariant is currently only enforced by a test. It is a candidate for explicit promotion into the event-system constitution as a standing architectural rule.

No vault constitution was modified. No contradiction was found that required resolving a conflict between two vault nodes — the defect was in draft spec/code, not in ratified rules.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/database/models.py` | modified | Renamed `EventType` enum values: `aquisicao.ocr_error` → `documents_validation.ocr_error`; `aquisicao.cross_check_overridden` → `documents_validation.cross_check_overridden` |
| `infrastructure/messaging/event_catalog.py` | modified | Updated `entity_domain` for both events from `'aquisicao'` to `'documents_validation'` |
| `migrations/infrastructure_database/0046_rename_ocr_and_cross_check_event_type_domain.py` | created | Reversible `RunPython` migration rewriting existing rows in `event_logs` and `event_log_entities` to the new stored values |
| `domains/documents_validation/use_cases/process_bulk_import.py` | modified | Removed unused import of `log_entity_event_safe` |
| `specs/event_system/implementation-plan-entity-event-catalog-alignment.md` | modified | Step 0 expanded to cover full enum + catalog + migration fix; marked ✅ Done; Step 4 updated with test_ocr.py note |
| `specs/004-operations-control-center/operations-control-center-discovery.md` | modified | Corrected stale reference to renamed event type stored value |

---

## Connections

| Document | Relationship | Description |
|----------|-------------|-------------|
| `docs/vault/constitution/event-system-constitution.md` | `contextualizes` | The catalog-as-authority rule drives both the alignment plan and the domain fix; the invariant checked by `test_event_type_domain_prefix_matches_catalog_entity_domain` is a candidate to be made explicit in this constitution |
| `specs/event_system/implementation-plan-entity-event-catalog-alignment.md` | `validates` | This session is the pre-implementation correctness review that corrected the plan before Steps 2–4 begin |

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Steps 2–4 of the catalog-alignment plan remain unimplemented: remove `entity_domain`/`object_type` from `log_entity_event()` signature, update 8 call sites, update tests | Implementation plan | HIGH | pending |
| The enum-domain consistency invariant is only enforced by a test — promote it as a standing rule into the event-system constitution | Session review | MEDIUM | pending |
| `aquisicao.cross_check_passed` / `aquisicao.cross_check_failed` may also be misclassified (referenced alongside the now-renamed `cross_check_overridden`) — verify domain ownership | Session review | LOW | pending |
