---
tags: [ccb, spec, business-rules, ocr, entities]
layer: domain
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T00:00:00-03:00
expires: 2026-05-12
conversation_id: d6892ea6-7b81-4c27-ba3a-08cfc1c6f9a9
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 7
importance_rationale: "Documented CCB business rules as formal spec, creating the authoritative reference for validation logic."
---

# CCB Phase 6 Business Rules & Process Documentation Session

**Date:** 2026-03-12  
**Tags:** #ccb #spec #business-rules #ocr #phase6

## Summary

Deep review and documentation session for the CCB document validation workflow. Reviewed `ccb-phase6-implementation.md` for ambiguities, then progressively built business-level documentation covering the full pipeline: system configuration, ZIP upload, CCB identification, batch approval, OCR extraction, cross-check, and document lifecycle.

Produced four new spec documents:
- `ccb-business-rules.md` — confirmed business rules by section (A–H)
- `ccb-entities.md` — entity reference with fields, types, and relationship diagram
- `ccb-business-rules.md` (in specs folder) — the canonical file
- `backlog.md` — running list of gaps and future improvements identified during the session

Also updated `ccb-phase6-implementation.md` with review feedback from the initial spec check.

## Key Decisions

- **C4 corrected:** All fields are extracted in a single PyMuPDF pass during folder identification — not just `id_titulo`. No second OCR run happens later. The full `extracted_data` is populated at identification time.
- **C7 corrected:** Duplicate detection checks the **active state** of the previous occurrence. If the previous is `rejeitado` or `deletado`, the new upload is valid and replaces it. Only `aprovado`/`pendente`/`review` occurrences trigger `duplicate_contrato`.
- **`non_critical_threshold` stored as DB column:** `DocumentFieldConfig.non_critical_threshold` is an integer column (default 90), not a hardcoded constant. Not currently exposed to operators — stored so it can be made configurable per doc type in the future without a code change.
- **B3 corrected:** Folders containing both files and subfolders are not marked invalid. Files at non-leaf levels are saved as `StagedFile` records with `misplaced` status and skipped. Traversal continues into the subfolders.
- **Event storage:** No new `DocumentEventLog` table. High-volume pipeline outcomes (folder identification) go to `DocumentsFolderResult`. The global `EventLog` handles business-level events only.
- **E4:** `unmatched` status for missing critical fields must include a `reason` and list of missing field keys in the event payload.
- **Batch review UX:** Must be hierarchical (Batch → Folders → Documents) with statistics at each level. Operators can interact with unmatched/pending folders. No permanent deletion.

## Backlog Items Added (2026-03-12)

1. Missing events for checklist generation failures (`DOCUMENT_CHECKLIST_GENERATION_FAILED`)
2. `extraction_config` subsystem — structured UI for per-doc-type field extraction rules
3. Computer vision fallback cascade for unhappy paths (scanned PDFs, no_id, cross-check failures)
4. Batch review hierarchical UI  
5. OCR confidence scoring — probability value per extracted field
6. `DocumentFieldConfig` structured editing UI
7. Extraction config preview tool (test a regex against a sample PDF)
8. Avoid real-time `AquisicaoManual` query for Cadastros dropdown options
9. OCR failure handling strategy — what to do after max retries
10. `final_name` naming convention for successfully matched documents

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[002-ccb-validation-workflow/ccb-business-rules.md]]| `implements` |Confirmed business rules, organized A–H|
|[[002-ccb-validation-workflow/ccb-entities.md]]| `implements` |Entity reference with fields and relationship diagram|
|[[002-ccb-validation-workflow/backlog-ccb.md]]| `implements` |Running backlog of gaps identified during spec review|
| [[002-ccb-validation-workflow/ccb-phase6-implementation.md]] | `updates` | Reviewed for ambiguities; 6 gaps identified and documented |
|[[aquisicao/services/ocr_service.py]]| `contextualizes` |Reviewed as part of Phase 6 implementation context|
|[[aquisicao/use_cases/run_ocr.py]]| `contextualizes` |Reviewed — confirmed correct for confirmed rules|
