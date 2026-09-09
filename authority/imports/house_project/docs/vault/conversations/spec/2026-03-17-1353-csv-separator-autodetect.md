---
tags: [upload, testing]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T13:53:58-03:00
expires: 2026-05-16
conversation_id: c1c445bc-d869-47c1-9b2c-32aac574d46e
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 3
importance_rationale: "Fixed CSV separator auto-detection, localized utility bug fix."
---
# CSV Separator Auto-Detection Fix

**Date:** 2026-03-17 13:45 (UTC-3)
**Tags:** #upload #testing

## Summary

This session diagnosed and fixed a silent bug in the Aquisição CSV upload pipeline that caused valid uploads to fail with a misleading "missing mandatory columns" error. The root cause was a hardcoded semicolon separator (`separator=';'`) in `BaseUploadRules.process_file()` — a method shared by all domains. When a user uploaded `new-aquisicoes-test.csv`, which used commas as the field delimiter, Polars tokenized the entire header row as a single column. None of the `FORMATTING_MAP` lookups matched, so all required fields (`cnpj_fundo`, `sacado_cnpj_cpf`, etc.) appeared missing.

The fix introduced a `_detect_separator()` static method on `BaseUploadRules` using Python's stdlib `csv.Sniffer`. It reads up to 8 KB of the file header and detects the delimiter, supporting comma, semicolon, tab, and pipe. It falls back to `;` if detection is ambiguous, preserving backward compatibility with all existing semicolon-separated files. Five regression tests were added to lock in this behavior for all four separators and the fallback case. The full suite (1,354 tests) passed green after the fix.

### Upload Pipeline — CSV Separator Bug

- **Problem/Goal:** User uploaded a comma-separated aquisição CSV and received "O arquivo enviado não possui as colunas obrigatórias" (missing mandatory columns) despite the file being structurally valid.
- **Decision:** Fix at the infrastructure layer (`BaseUploadRules`) so the fix applies to all domains (aquisição, liquidação) in one place.
- **Changes:** Added `_detect_separator()` using `csv.Sniffer` with `,;|\t` candidates and a safe `;` fallback. Replaced the hardcoded `separator=';'` call with `sep = cls._detect_separator(filepath)`.

### Test Coverage

- **Problem/Goal:** No existing tests exercised different CSV separators — the bug was only caught in production use.
- **Decision:** Add one test per supported separator + a fallback test, all inside the existing `TestAquisicaoUploadRules` class.
- **Changes:** Added `_write_csv_with_sep()` helper and 5 test methods to `test_upload_tasks.py`.

Key outputs:
- `infrastructure/remessa/upload_rules_base.py` — separator auto-detection added
- `domains/aquisicao/tests/test_upload_tasks.py` — 5 new separator regression tests

## Key Decisions

- **Single point of fix:** The fix lives in `BaseUploadRules` (infrastructure layer), not in `AquisicaoUploadRules`, so liquidação and any future domain get it for free.
- **Fallback to `;`:** When `csv.Sniffer` cannot determine the delimiter (e.g., single-column files), we default to `;` to preserve backward compatibility with all existing uploads.
- **All four separators supported:** `,`, `;`, `\t`, `|` — matches the range of separators found in practice in Brazilian fintech data pipelines.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/remessa/upload_rules_base.py` | `modified` | Added `_detect_separator()` static method; replaced hardcoded `separator=';'` in `process_file()` |
| `domains/aquisicao/tests/test_upload_tasks.py` | `modified` | Added `_write_csv_with_sep()` helper + 5 separator regression tests |

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[vault/conversations/2026-03-17-0155-complementary-table-test-plan.md]]| `contextualizes` |Prior session that established upload test patterns used in this session|
