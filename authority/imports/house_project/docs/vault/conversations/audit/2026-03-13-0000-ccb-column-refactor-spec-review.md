---
tags: [ccb, spec-review, schema-migration, column-refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: e87d6c6a-bc8c-4e9f-911e-5e010fbefe7e
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 5
importance_rationale: "Reviewed column refactor spec for CCB schema migration, validating migration strategy."
---

# CCB Tables Column Refactor Spec Review

**Date:** 2026-03-13
**Tags:** #ccb #spec-review #schema-migration #column-refactor

## Summary

Reviewed `ccb-tables-column-refactor.md` for inconsistencies, ambiguities, and errors by cross-referencing against `ccb-entities.md`, `ccb-business-rules.md`, `ccb-business-rules-refactor-implementation.md`, and the current `models.py`. Found 5 red-severity issues, 6 yellow ambiguities, and 2 minor items. All issues were resolved by updating all four spec documents with user decisions.

Key outputs:
- `ccb-tables-column-refactor.md` — major updates: dual hash strategy, new `duplicate_contrato_database` reason, `contrato_extracted_id`/`contract_hash` on DocumentVersion, bidirectional counter logic, `DocumentTypeConfig` deprecation
- `ccb-business-rules.md` — fixed C1 (dHash/pHash), C7 (new duplicate reason), C8 (runtime queries), D3 (rejeitado/batch_rejeitado)
- `ccb-business-rules-refactor-implementation.md` — updated reason tables, pipeline flow steps 5b and 6
- `ccb-entities.md` — updated DocumentVersion schema and reason tables
- `review_report.md` — initial review findings (artifact)

## Conversation Arc

**Started:** User asked to review `ccb-tables-column-refactor.md` for inconsistencies, ambiguities, or errors against the other CCB spec documents and codebase.

**Ended:** All four spec documents updated and aligned. Counter logic rewritten to enforce bidirectional swaps on every status transition. `DocumentTypeConfig` deprecated alongside `DocumentChecklist`.

## Key Decisions

- **Dual hash strategy:** dHash for document PDFs (layout-sensitive), pHash for image-based documents (rotation/scale robust). Both stored in the same `perceptual_hash` field.
- **`duplicate_contrato_database` reason:** Previous-import duplicates now use a distinct reason (`duplicate_contrato_database`) instead of sharing `duplicate_contrato` with same-batch duplicates.
- **Rejeitado allows re-upload:** If a contrato in DB has status `deletado` OR `rejeitado`, the new upload proceeds normally (not treated as duplicate). Previously only `deletado` was handled.
- **`contrato_extracted_id` + `contract_hash` on DocumentVersion:** Added to both `DocumentsFolderResult` and `DocumentVersion` levels so each document knows its contract context.
- **Bidirectional counter logic:** Every folder/document status change must decrement the source counter and increment the destination counter. No "limbo" states.
- **Step 6 increments `folders_aprovado` immediately:** Eliminates the previous limbo where the folder was aprovado but uncounted until all docs were verified.
- **`DocumentTypeConfig` deprecated:** Superseded by `DocumentTemplate` which is global (not per-kit) and stores the same fingerprint/OCR flow data.
- **`ccb_ocr_complete` kept as name:** Description clarified to specify it tracks PyMuPDF text extraction specifically (OCR fallback not yet implemented).
- **C8 updated:** `DocumentChecklist` row creation replaced with runtime query via `resolve_kit_for_contrato` → `KitType.required_docs`.
- **D3 fixed:** Batch rejection now sets `rejeitado / batch_rejeitado` (was `deletado / batch_declined`).
- **gcs_path format:** `{batch.gcs_staging_prefix}/{leaf_folder_path}/` — uses zip path known at creation time, avoids PK dependency.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `DocumentTypeConfig` deprecation migration | Column refactor spec | Documented, not yet implemented |
| Runtime query performance monitoring | C8 decision | Documented as acceptable; cache layer as future option |
| Batch rejection counter zeroing | Counter swap rule | Documented in spec |
| Pipeline error counter decrement | Counter swap rule | Caller must know previous status to decrement correct counter |

## Backlog Items Added

No new backlog items — all changes were documentation/spec updates.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-tables-column-refactor.md]] | `updates` | Major spec updates: counters, fields, deprecations |
| [[002-ccb-validation-workflow/ccb-business-rules.md]] | `updates` | Fixed C1, C7, C8, D3 |
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Updated reason tables, pipeline flow |
| [[002-ccb-validation-workflow/ccb-entities.md]] | `updates` | DocumentVersion schema and reason tables |
