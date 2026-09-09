---
tags: [acquisition, testing]
node_type: test
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T09:54:28-03:00
expires: 2026-05-23
conversation_id: 811aca9a-e319-4405-bd77-640009f8054a
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Fixed mocked dependencies in two unit tests (test_storage.py and test_parallel_bulk_import.py) to resolve pipeline test failures."
---

# Fixing Parallel Import and Storage Tests

**Date:** 2026-03-24 09:54 (UTC-03)
**Tags:** #acquisition #testing

## Summary

The goal of this session was to fix failing tests in the `run_tests.py` suite. There were two specific failures that needed investigation and correction: one in `test_storage.py` and another in `test_parallel_bulk_import.py`. 

First, we fixed `test_ensure_documents_bucket_creates_when_missing` in `domains/aquisicao/tests/test_storage.py` by resetting the `_documents_bucket_ensured` caching flag in the `minio_client`, which allowed the test assertions for bucket creation to pass. 

Second, we fixed `test_rg_extraction_stores_fields` in `domains/aquisicao/tests/test_parallel_bulk_import.py`. The mock was previously incorrectly skipping the `Identificacao` specific extraction path (`extract_text_force_ocr`), and the assertions were looking for the legacy `rg_numero` key instead of the modern `id_documento` key. We updated the mocks and the assertions. All tests are now passing successfully.

### Fix Document Storage Test
- **Problem/Goal:** `test_ensure_documents_bucket_creates_when_missing` was failing because `make_bucket` was not being called by `ensure_documents_bucket`.
- **Decision:** Reset the module-level caching flag `_documents_bucket_ensured` during test setup.
- **Changes:** Modified storage test files to set `_documents_bucket_ensured = False` before calling the method.

### Fix RG Extraction Test
- **Problem/Goal:** `test_rg_extraction_stores_fields` was failing with a `no_template` reason code instead of `extracted_not_cross_checked` because it was falling through to Tesseract extraction without text.
- **Decision:** Correct the mocks in the testing suite for `Identificacao` documents.
- **Changes:** Removed the incorrect `extract_fields` mock, and properly mocked `extract_text_force_ocr` which is the correct pipeline handling path for `Identificacao`. Updated the template extraction mock config to output `id_documento` to match modern unified schema constraints instead of the legacy `rg_numero` constraint.

Key outputs:
- `test_storage.py` — Fixed MinIO client testing mocks.
- `test_parallel_bulk_import.py` — Fixed Identificacao OCR test flows.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_storage.py` | `test_ensure_documents_bucket_creates_when_missing`, `test_ensure_documents_bucket_skips_when_exists` | Validates that the staging documents bucket is created automatically on MinIO interaction if missing. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_rg_extraction_stores_fields` | Validates that Identificacao / RG documents correctly parse fields out of the forced OCR pipeline and map correctly to the standard `id_documento` mapping. |

**Why these tests matter:** These tests guarantee that bucket initialization works safely and that Identificacao bulk classification logic yields the expected reason codes (`extracted_not_cross_checked`) and values without crashing or rejecting valid files as `no_template`.

## Key Decisions

- **Testing Hooks:** Decided to reset module variables specifically in test closures to simulate cold starts. 
- **Schema Validation:** Enforced the modern (`id_documento`) field expectations rather than legacy terms for RG tests.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_storage.py` | `modified` | Reset `_documents_bucket_ensured` caching flag in tests to correctly assert bucket creation. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Update test mocks for RG document OCR to match accurate `extract_text_force_ocr` paths and assert on `id_documento`. |

