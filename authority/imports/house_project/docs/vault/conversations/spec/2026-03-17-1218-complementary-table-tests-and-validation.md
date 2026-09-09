---
tags: [ccb, testing, spec]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T12:18:06-03:00
expires: 2026-05-16
conversation_id: 7263312d-223a-48a6-ae7e-6ee4fbc332dd
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 5
importance_rationale: "Implemented E2E tests for complementary table with hook refactor, validating feature completeness."
---

# Complementary Table E2E Tests & Hook Refactor

**Date:** 2026-03-17 12:18 (-03:00)
**Tags:** #ccb #testing #spec

## Summary

This session focused on implementing the uncommitted tests related to the Complementary Table feature outlined in the implementation plan. After executing the test implementation, we discovered that the dynamic validation function for complementary table CSV columns (`validate_and_extract_complementary`) was entirely missing from the upload pipeline (`ProcessUploadAquisicaoUseCase`). This was corrected by creating an `apply_complementary_validation` dataframe hook and integrating it with the existing `validate_registries` step. This ensures any missing mandatory complementary column aborts the upload and emits a failure event. We finalized the session by updating the implementation plan to reflect these critical bug fixes and the newly added end-to-end tests.

### Missing Validation Hook Discovered & Fixed
- **Problem/Goal:** While implementing E2E validation for dynamic columns, the tests failed because the upload pipeline was quietly ignoring any missing mandatory complementary columns.
- **Decision:** The pipeline logic in `validation_complementary_columns.py` needed an adapter that could attach a payload to the DataFrame, and this mechanism had to be passed down through the upload service layer so the validation constraints are strictly enforced before deduplication or data persistence.
- **Changes:**
  1. We created `apply_complementary_validation(df, domain)` in `validate_complementary_columns.py` which aggregates the returned struct objects from the raw validation step into a polars column.
  2. We defined `_combined_validator` in `domains/aquisicao/use_cases/upload.py` to combine both `validate_registries` and `apply_complementary_validation`.
  3. We passed `_combined_validator` as the validation routine config inside the usecase.

### Test Coverage Enhancements
- **Problem/Goal:** Essential verification for the newly authored logic around complementary data mapping and error surfacing was missing.
- **Decision:** We identified three primary test goals: ensuring Celery serialization mapping is working as intended, proving the E2E pipeline handles mapping seamlessly, and proving that an omission of a mandatory dynamic column will surface an `ACQUISITION_UPLOAD_FAILED` system event.
- **Changes:** 
  1. Modified `test_upload_tasks.py` and appended `TestBuildAquisicaoStagingInstallment` to guarantee comprehensive mappings of all `AquisicaoManualStaging` builder properties.
  2. We validated `test_bulk_import.py` E2E promotion path (which ensures `ContratoCCB` fields map seamlessly into production records) is securely covered via existing fixtures inside `test_approve_remessa.py`.
  3. Crafted an E2E test `test_missing_mandatory_complementary_column_emits_failed_event` in `test_upload_events.py` ensuring pipeline failure emits correct logging details for mandatory complementary tables.

## Key Decisions

- **Validation Hook:** Used a unified wrapper (`_combined_validator`) in the upload usecase to pass a single callable to the service layer instead of refactoring `ProcessUploadService` to accept more than one hook.
- **Mandatory Dynamic Cols Emits Event:** Upload failures tied directly to missing components in the active dynamic column configurations block the pipeline and surface directly into the event ecosystem.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_upload_tasks.py` | `modified` | Overhauled staging object builder test to map standard optional/mandatory logic and the dynamic extraction payloads accurately. Fixed mock spec type issue. |
| `infrastructure/tests/test_upload_events.py` | `modified` | Generated `ACQUISITION_UPLOAD_FAILED` verification testing for missing mandatory dynamic records. |
| `domains/aquisicao/domain/validate_complementary_columns.py` | `modified` | Formulated `apply_complementary_validation` returning populated `_complementary_data` payload structure. |
| `domains/aquisicao/use_cases/upload.py` | `modified` | Formulated `_combined_validator` to orchestrate multi-layered pipeline pre-requisites. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md` | `modified` | Appended the test summaries, updated the detailed logic describing `apply_complementary_validation`, and logged the pipeline failure hook strategies. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Formalized implementation corrections discovered during testing |
