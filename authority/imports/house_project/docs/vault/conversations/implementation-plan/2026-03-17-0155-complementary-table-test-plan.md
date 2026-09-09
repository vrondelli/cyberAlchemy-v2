---
tags: [spec, testing, models]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:55:02-03:00
expires: 2026-05-16
conversation_id: 311e2667-dc43-4a12-a42b-22c38c885cae
node_type: implementation-plan
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 5
importance_rationale: "Designed test plan for complementary table feature covering business rule validation."
---

# Complementary Table Test Plan

**Date:** 2026-03-17 01:41 (UTC-3)  
**Tags:** #spec #testing #models

## Summary

Reviewed the complementary table implementation plan against existing tests and identified all missing test coverage. Expanded the Verification Plan section from high-level table summaries into 71 fully detailed individual test specifications across 8 test files (5 new, 3 modified). Each test now has a numbered ID, exact method name, specific assertions, and a business rationale ("Why" column).

## Key Decisions

- Added 3 entirely new test categories not in the original plan: Complementary Validation Tests (5 tests), Registry Upload Validation Tests (7 tests for cnpj_emissor/id_instrumento/tipo_produto gate), and CnpjFundo Suggestions API Tests (2 tests)
- TipoInstrumento delete tests check references in both `AquisicaoManual` AND `AquisicaoManualStaging` (original plan only mentioned AquisicaoManual)
- Approve remessa field copy test verifies all 10 new/skipped fields in a single test, plus a separate test for the `id_instrumento` FK copy
- Upload rules tests split into two files: base `OPTIONAL_COLS` logic in `test_base_upload_rules.py`, and aquisição-specific `FORMATTING_MAP` entries in a new `test_upload_rules_aquisicao.py`

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Expanded Verification Plan (lines 584–745) from 6 summary sections to 9 detailed sections with 71 individual tests; updated File Summary table (lines 753–775) from 16 to 20 rows |
