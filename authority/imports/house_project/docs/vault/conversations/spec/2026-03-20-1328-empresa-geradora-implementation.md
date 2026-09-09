---
tags: [acquisition, pipeline]
node_type: spec
is_session: true
layer: [application, domain]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T13:28:06-03:00
expires: 2026-05-19
conversation_id: cc323263-802c-46cc-9e1e-1be3c8e00330
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md", "specs/002-ccb-validation-workflow/upload-flow-diagram.md"]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Successfully implemented the Universal Extraction Fallback (empresa geradora) in the document processing pipeline and mapped out the upload validation flow into a Mermaid architecture diagram."
---

# Empresa Geradora Implementation

**Date:** 2026-03-20 13:28 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

This session focused on implementing the "empresa geradora" feature into the document template system. The primary goal was to improve template matching precision and enable a fallback universal regex extraction mechanism when a specific document template fails. The fallback extraction leverages the existing JSON extraction configurations by inferring the company from OCR text. The session also produced a complete Mermaid flowchart diagram mapping the document upload and validation phases up to the cross-check execution.

### Universal Match Fallback
- **Problem/Goal:** CCB and Averbações documents were frequently blocked (`no_template`) because slight visual variations prevented standard template matching, despite sharing the same regulatory structure or issuer.
- **Decision:** Implemented a new `universal_extraction` module that attempts to classify the generating company based on keyword patterns in the raw OCR output, and falls back to extracting fields using universal regex configs.
- **Changes:** Created `universal_extraction.py`, wired it to `_process_folder` in `process_bulk_import.py`, and added an `empresa` field to the `DocumentTemplate` model. Updated template matching logic to filter by `empresa` when present.

### Validation Flow Mapping
- **Problem/Goal:** The user needed a visual understanding of the complex verification steps during document upload up to the cross-check phase.
- **Decision:** Mapped the pipeline into a comprehensive 3-phase Mermaid architecture diagram: 1. Registration; 2. Identification & Extraction; 3. Deduplication and Cross-Check.
- **Changes:** Authored the `upload-flow-diagram.md` containing the properly formatted logic stack.

Key outputs:
- `domains/aquisicao/domain/universal_extraction.py` — Engine for matching generating companies.
- `specs/002-ccb-validation-workflow/upload-flow-diagram.md` — The Mermaid pipeline diagram.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | 23 unit tests covering `infer_empresa` and `extract_fields_universal` | The system accurately extracts company identity from raw text and matches critical CCB variables correctly using universal regex when a direct template match fails. |

**Why these tests matter:** Without them, universal extraction could inadvertently ingest false positives or fail gracefully on bad OCR readings. These guarantee the regex definitions properly bridge gaps before declaring a total extraction failure.

## Key Decisions

- **Architecture:** The universal regex module will re-use the exact same `extract_fields()` logic as the template matcher, ensuring JSON configurations govern both specific and universal matches.
- **Fallback Execution:** The inference layer attempts template matching first, triggering the universal `empresa` checker solely as a fallback mechanism for unrecognized documents.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Adicionou campo `empresa` a `DocumentTemplate` e a nova constante de razão `REASON_EXTRACTED_NO_TEMPLATE`. |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | `EMPRESA_KEYWORDS` regex hooks for Capital Consig, Dataprev, Siapenet. |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Hooked the universal fallback into the template matching outcome and fixed the loop guards to respect universal results. |
| `domains/aquisicao/use_cases/manage_document_template.py` | `modified` | Registered `empresa` schema in `find_matching_template`. |
| `domains/aquisicao/interfaces/views.py` | `modified` | Endpoint payloads updated for `empresa`. |
| `migrations/aquisicao/0036_documenttemplate_empresa.py` | `created` | Missing `empresa` schema. |
| `domains/aquisicao/domain/universal_extraction.py` | `created` | New inference engine. |
| `domains/aquisicao/tests/test_universal_extraction.py` | `created` | Comprehensive test suites. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `created` | Comprehensive flowchart visualising the 3-phase document upload verification matrix. |
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `modified` | Flagged feature as ✅ Implemented. |
