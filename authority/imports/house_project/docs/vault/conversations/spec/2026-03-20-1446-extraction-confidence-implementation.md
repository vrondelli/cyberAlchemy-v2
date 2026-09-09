---
tags: [pipeline, ccb, acquisition]
node_type: spec
is_session: true
layer: [application, domain]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:46:12-03:00
expires: 2026-05-19
conversation_id: f7bebc0a-ce88-4c1a-8efd-d2334d9d8c0f
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Implementou a taxonomia de confiança da extração (Alta, Média, Baixa) no db e no pipeline de upload_bulk_import, viabilizando workflows de triagem baseados em assertividade."
---

# Extraction Confidence Implementation

**Date:** 2026-03-20 14:46 (UTC-03:00)
**Tags:** #pipeline #ccb #acquisition

## Summary

This session executed the pending Component 4.5 of the "Empresa Geradora + Universal Extraction" plan. Following the previous session's decision to use an explicit enum, we modified `DocumentVersion` to include `ExtractionConfidence` and tied it into the pipeline logic in `process_bulk_import.py`. 

We ran `gitnexus_impact` to ensure that modifying the internal structure of the `process_bulk_import` did not pose a large blast radius. It returned safely. We applied the confidence assignment rules corresponding to each tier of extraction (Visual Match = ALTA, Empresa Regex = MEDIA, Generic Regex = BAIXA, Failure = NENHUMA). We also ran and fixed the Django test suite resulting from an erroneous migration `unique_together` rule that pointed to a non-existent field, clearing out the bad operation so that the whole suite ran successfully (173 tests OK).

### Implementing Model and Pipeline Logic
- **Problem/Goal:** There was no tracking method for the confidence of data extracted from documents via OCR vs template matching, making it difficult to automate approvals safely.
- **Decision:** Use an explicit Enum `ExtractionConfidence` on `DocumentVersion` with categories ALTA, MEDIA, BAIXA, NENHUMA.
- **Changes:** Added the field to `models.py` and modified `process_bulk_import.py` to correctly map the template matching result to these confidences.

### Migration Fixes
- **Problem/Goal:** Initial auto-generated migration `0038_alter_documentsfolderresult_unique_together_and_more.py` caused a Test environment failure because it referenced `AlterUniqueTogether` with a field that no longer exists (`contrato`).
- **Decision:** The alteration was dropped from the generated operations to match the clean schema.
- **Changes:** Modified migration file to remove `AlterUniqueTogether` thus rescuing `python manage.py test`.

## Tests Added/Modified

No test files were specifically added/modified, but the entire `domains/aquisicao/tests/` suite was verified (173 tests passing) after fixing the migration issue.

## Key Decisions

- **Confidence Mapping Strategy:** Template matching generates ALTA confidence; universal extraction with identified company is MEDIA, without is BAIXA, and failing totally sets it to NENHUMA.
- **Migration Scope:** Clean up Django's auto-generated spurious constraint checks if they break the test db initialization to ensure CI consistency.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `ExtractionConfidence` TextChoices and field to `DocumentVersion`. |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Injected confidence attribution for template matching and universal fallback scenarios. |
| `migrations/aquisicao/0038_alter_documentsfolderresult_unique_together_and_more.py` | `created/modified` | Generated migration for tracking confidence field, fixed manually to avoid schema breaks. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `modified` | Marked Component 4.5 as IMPLEMENTED. |
