---
tags: [ccb, spec, business-rules, refactor, backlog, implementation-plan]
layer: architecture
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T00:00:00-03:00
expires: 2026-05-12
conversation_id: 6f1ee828-7aa5-4b38-a4ae-746d2032a5b2
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 6
importance_rationale: "Refined CCB business rules spec resolving ambiguities in validation requirements."
---

# CCB Business Rules Refinement & Code Alignment Session

**Date:** 2026-03-12
**Tags:** #ccb #spec #business-rules #refactor #backlog

## Summary

Deep refinement session following the initial business rules documentation session. Reviewed `ccb-business-rules.md` for contradictions and ambiguities, resolved each one with the user, and produced a revised v2 of the rules. Also conducted a full audit of code-to-rules gaps and wrote a detailed implementation plan.

Key outputs:
- `ccb-business-rules-v2.md` — fully revised business rules (in brain artifacts)
- `ccb-code-alignement-refactor-implementation.md` — implementation plan for 4 confirmed gaps
- `backlog.md` — extended with 10+ new items including HIGH PRIORITY items for misplaced file tracking, dHash consistency, critical field check, and E4 implementation

## Conversation Arc

**Started:** User asked to review `ccb-business-rules.md` for contradictions and ambiguities — specifically flagging the C4 vs. Section E conflict (was OCR done at identification time or later?) and the C9 vs. E7 double-write issue.

**Ended:** Session closed while designing the aggregate update pattern for batch/folder summary columns — specifically confirming that `EventLogEntities` is a 1-to-N bridge (not a separate event tier), and that folder state lives in mutable columns rather than a separate event table. The next session should finalise the aggregate column schema for `BulkImportBatch` and `DocumentsFolderResult`, then implement the 4 code gaps in the implementation plan.

## Key Decisions

- **C4 scope clarified:** PyMuPDF extraction during identification applies to the CCB file only. Non-CCB companion documents are processed in the async OCR phase (Section E) after batch approval.
- **C3 / E2 renamed:** `ocr_pending` → `scanned_pdf`. Outcome for no-text-layer PDFs is `pendente`. Not auto-retriable.
- **C7 expanded:** Duplicate detection checks `DocumentVersion` table (cross-batch). Same-batch duplicates: both flagged `pendente/duplicate_contrato`, operator picks winner. Loser → `deletado/duplicate` (read-only).
- **C9 / E7 clarified:** CCB `extracted_data` written at identification time. Companion docs at OCR time. Universal key in all payloads: `id`.
- **B3 revised:** `StagedFile` concept dropped — `DocumentVersion` is the single file-level record. Misplaced files from invalid-structure folders should produce `DocumentVersion` rows (not yet implemented — HIGH PRIORITY backlog). Blocker: `checklist_item` is non-nullable on `DocumentVersion`.
- **G6 (new rule):** Every `DocumentVersion` status change must emit an event with reason in payload. A `reason` column on `DocumentVersion` is a planned backlog item.
- **E1 updated:** Companion OCR uses Google Cloud Functions for 50k docs/hour throughput.
- **`invalid_structure` propagation:** both folder (`DocumentsFolderResult`) and per-file level. If a CCB is identifiable among misplaced files, proceed with identification and OCR normally.
- **`EventLogEntities` clarified:** NOT a separate tier for folder/document events. It is a 1-to-N bridge: one `EventLog` row → many affected entity hashes. Used for bulk events (e.g. `DOCUMENT_BULK_IMPORT_APPROVED` → N `contract_hash` rows).
- **Aggregate update pattern (Option C — Hybrid):** Mutable summary columns on `BulkImportBatch` and `DocumentsFolderResult` for fast UI reads. `EventLog` (with `stream_id`) for document history. `EventLogEntities` for bulk events linking to multiple contracts. No event sourcing for aggregates.
- **Event routing confirmed:**
  - Batch lifecycle → `EventLog`
  - Bulk batch events affecting N contracts → `EventLog` + `EventLogEntities`
  - Document events → `EventLog` (correlated by `stream_id`)
  - Folder state → mutable `status`/`reason` columns on `DocumentsFolderResult`

## Code Gaps Identified (4 confirmed)

| Gap | Rule | Status |
|---|---|---|
| Critical field check missing | E4 | Not implemented — code always marks `ocr_complete` |
| `contract_hash` not used in events | H3 | Incorrectly uses PK |
| `ocr_pending` not renamed | C3/E2 | Code uses `ocr_pending` and `no_text_layer` |
| No file-level records for misplaced files | B3 | Folder record created but no file records |

## Backlog Items Added

- ⚠️ HIGH: Track misplaced files in `DocumentVersion` for `invalid_structure` folders
- ⚠️ HIGH: Implement E4 critical field check in `run_ocr.py`
- ⚠️ HIGH: Switch pHash → dHash in all call sites (registration + matching must match)
- ⚠️ HIGH: Add `similarity_threshold` column to `DocumentTemplate`
- ⚠️ HIGH: Add `perceptual_hash` field to `DocumentVersion`
- Fix `entity_id` to use `contract_hash` (H3)
- Fix duplicate detection to check previous occurrence status (C7)
- Add `cedente_cnpj` to `ContratoCCB`
- OCR manual re-trigger from batch review UI
- `reason` column on `DocumentVersion`
- Staging file TTL / retention window
- Pluggable template-matching strategy

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-business-rules.md]] | `updates` | Source of truth for confirmed rules — v2 changes not yet applied to the file |
|[[002-ccb-validation-workflow/ccb-code-alignement-refactor-implementation.md]]| `implements` |Implementation plan for 4 code-to-rules gaps|
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Extended with 10+ new items |
|[[aquisicao/use_cases/process_bulk_import.py]]| `contextualizes` |Pipeline read in full; B3, C3, C7, H3 gaps identified|
|[[aquisicao/use_cases/run_ocr.py]]| `contextualizes` |E4, E2, H3 gaps identified|
|[[aquisicao/tests/test_bulk_import.py]]| `contextualizes` |Test coverage reviewed; update required for scanned_pdf rename|
