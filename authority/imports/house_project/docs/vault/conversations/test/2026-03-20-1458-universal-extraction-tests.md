---
tags: [acquisition, pipeline, testing]
node_type: test
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:58:39-03:00
expires: 2026-05-19
conversation_id: 9a557f31-c0c6-48fd-82d2-807cb7d6471f
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Comprehensive test suite addition for universal extraction fallback, GCP compatibility, and bulk import API border cases, completing the Empresa Geradora initiative."
---

# Universal Extraction and Document Upload Validations (Test Audit)

**Date:** 2026-03-20 14:58 (UTC-3)
**Tags:** #acquisition #pipeline #testing

## Summary

This session originated from a test audit request on the document upload and extraction flow (Bulk Import Pipeline). The audit identified missing test coverage for the newly introduced universal extraction fallback mechanisms (which process partial or completely failed extractions) and GCP migration compliance regarding temporal files. We successfully implemented integration and unit tests for these behaviors across three main test files, ensuring the business rules surrounding partial document persistence and exception tracking are verified. During the implementation, the legacy nature of some existing E2E tests was clarified, leading to more focused and targeted tests for the new functionalities.

### Test Audit and Gaps Identification
- **Problem/Goal:** Identify lack of coverage in the recent Empresa Geradora/Universal Extraction changes before final integration.
- **Decision:** Prioritize the critical and important paths: partial data retention, catastrophic failure logging, and GCP-compliant duplicate CSV saving.
- **Changes:** Generated `test_audit_document_upload.md` detailing the required scenarios and classifying their business criticality.

### Implementing Universal Fallback Tests
- **Problem/Goal:** The pipeline persists partially extracted data with `MEDIA`/`BAIXA` confidence and a `PENDENTE` status when critical text isn't found, preventing data loss.
- **Decision:** Inject edge-case Mocks into `test_parallel_bulk_import.py` to simulate `success=False` returns from the Universal Extractor, and catastrophic `Exception` raises in `traverse_and_identify`.
- **Changes:** Added `test_universal_fallback_creates_partial_doc_when_critical_fields_missing`, `test_universal_fallback_fails_completely`, and `TestTraverseAndIdentifyExceptions` with `ZipFile` manipulation.

### GCP Temporaries & API Protections
- **Problem/Goal:** Assure the duplicate generation task doesn't rely strictly on local file systems via `default_storage.save`, and the new API strictly demands multi-tenancy IDs.
- **Decision:** Wrote strict assertions over the Django `default_storage` API in mock configurations.
- **Changes:** Added `test_save_duplicates_csv_uses_default_storage_save_correctly` in `test_skip_reason_duplicate_report.py` and `test_upload_missing_tenant_id_returns_400` in `test_bulk_import.py`.

## Tests Added/Modified

| Test file | Tests added | Business rule validated |
|-----------|-------------|-------------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | Universal Fallback (Partial/Failure) & Exception Logs | Partially generated documents or corrupted ZIPs must be safely tracked in the DB and EventLog without crashing the whole stage. |
| `domains/aquisicao/tests/test_skip_reason_duplicate_report.py` | GCP `default_storage.save` compatibility | Large duplicate reports must bypass block storage local disks and strictly persist on Cloud Storage. |
| `domains/aquisicao/tests/test_bulk_import.py` | Tenant ID presence validation | Bulk imports through the API must demand explicit tenant scoping. |

**Why these tests matter:** They prevent data ingestion silently dropping unparsed documents, avoid environment drift / memory exhaustions on cloud deployment, and prevent un-scoped multi-tenant data bleed.

## Key Decisions

- **Test Boundaries:** Found that the pre-existing `test_upload_e2e.py` references legacy CSV pipelines; therefore, celery tasks were not artificially injected. Integrated the new boundary limits inside `test_bulk_import.py` instead.
- **Mock Strategies:** We simulate catastrophic environments by manipulating `zipfile.ZipFile` side-effects to bypass local test guards.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Injected Universal Extraction fallback scenarios and catastrophic log verification. |
| `domains/aquisicao/tests/test_skip_reason_duplicate_report.py` | `modified` | Added tests verifying proper usage of standard `tempfile` and `default_storage`. |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Added test for missing `tenant_id` on the `BulkImportView`. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `modified` | Updated the status header to reflect the coverage audit completion. |
| `test_audit_document_upload.md` | `created` | Generated an audit matrix mapping the uncovered business rule locations (as Artifact). |
