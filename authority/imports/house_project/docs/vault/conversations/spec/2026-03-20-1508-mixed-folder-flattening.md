---
tags: [pipeline, ccb]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T15:08:00-03:00
expires: 2026-05-19
conversation_id: b2cab91a-5b8e-40c7-bbb2-f9a37b2c227a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/backlog-ccb.md"]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Defined the requirement and flattening strategy to support mixed parent-child folders as a single logical unit in the bulk import pipeline."
version: 0.1.0
last_updated: 2026-03-20
---

# Mixed Folder Flattening Backlog

**Date:** 2026-03-20 15:08 (UTC-3)
**Tags:** #pipeline #ccb

## Summary

The session began with an explanation of the CCB document upload and validation flux, specifically highlighting the three phases: Folder Verification, Extraction, and Cross-Check. Following this, the user asked about the feasibility of modifying the `_find_leaf_folders` logic to support a mixed folder structure (where a parent folder contains documents alongside a child folder that also contains documents).

We analyzed the `process_bulk_import.py` extraction logic and concluded that the change is of **Medium** difficulty. The primary challenge is not allowing the parent folder to pass validation, but rather implementing a "flattening" strategy to prevent the child subfolders from being processed twice as independent pure-leaf folders. The user requested this feature to be added to the backlog, which was documented in `backlog.md`.

### Document Upload Flow Explanation
- **Problem/Goal:** The user needed an overview of what exactly happens when a folder of documents is uploaded.
- **Decision:** N/A (prose explanation).
- **Changes:** Explained the 3 phases based on `upload-flow-diagram.md`: 1) Folder Verification & DB Registration; 2) Document Identification & OCR Extraction; 3) Deduplication & ERP Cross-Check.

### Mixed Folder Support (Parent-Child Flattening)
- **Problem/Goal:** The current folder verification strictly rejects "mixed" folders (folders with both files and subdirectories, `REASON_INVALID_STRUCTURE`). The user wants to support cases like `Dossie/RG.pdf` and `Dossie/Contratos/CCB.pdf` as a single logical unit.
- **Decision:** Decided to add this to the backlog. The implementation will require modifying `_find_leaf_folders` to group parent and child files together while explicitly excluding the child folder from being processed independently, to avoid duplicating DocumentVersions and OCR processing.
- **Changes:** Added the requirement and the flattening strategy rationale to `specs/002-ccb-validation-workflow/backlog-ccb.md`.

## Key Decisions

- **Folder Flattening:** A mixed folder with documents must not simply be marked valid; its subfolders must be actively aggregated and excluded from the pure-leaf list to prevent duplicate OCR and Database rows.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `modified` | Added the "MEDIUM — Suporte a pastas mistas (pai/filha) como unidade lógica única" item. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Support mixed parent-child folders | `process_bulk_import.py` | MEDIUM | backlog |
