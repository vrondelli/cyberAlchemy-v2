---
tags: [infrastructure, pipeline, acquisition, liquidation]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T23:53:00-03:00
expires: 2026-05-17
conversation_id: 3f4d37aa-cc07-45b8-a5b8-60560268363a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 2
importance_rationale: "Fixed CSV upload encoding with Windows-1252 fallback, trivial utility fix."
---

# CSV Upload Encoding Fix (Windows-1252 Fallback)

**Date:** 2026-03-18 23:53 (UTC-3)  
**Tags:** #infrastructure #pipeline #acquisition #liquidation

## Summary

This session addressed a production bug where uploading a CSV file encoded in Windows-1252/Latin-1 (e.g. `template-liquidacoes.csv`) caused the file upload pipeline to fail with a validation error: `'utf-8' codec can't decode byte 0xe7 in position 44: invalid continuation byte`. The error was exposed to the user through the generic "Erro de validação do arquivo" message in the UI.

The root cause was two-fold: the `_detect_separator` static method in `BaseUploadRules` opened files with `encoding='utf-8-sig'` unconditionally, crashing on any non-UTF-8 byte. Similarly, `pl.read_csv` was called without specifying a fallback encoding, causing a `ComputeError` for Latin-1 encoded files.

The fix adds a two-level graceful encoding fallback: if UTF-8 detection fails with a `UnicodeDecodeError`, the separator detection retries with `windows-1252`. If `pl.read_csv` raises a `ComputeError` mentioning decoding issues, it retries with `encoding='windows-1252'`. This approach preserves the existing UTF-8 fast path and only activates the fallback when strictly necessary.

Two regression tests were added to `test_base_upload_rules.py` that write Windows-1252 encoded bytes to a temp file and verify both separator detection and full processing succeed without crashing.

### Encoding Bug in `_detect_separator`

- **Problem/Goal:** `_detect_separator` opened the file with `encoding='utf-8-sig'`, failing with `UnicodeDecodeError` for any byte outside the UTF-8 range (e.g. Latin-1 `ç` at 0xe7).
- **Decision:** Add a `try/except UnicodeDecodeError` catch around the UTF-8 open block, retrying with `encoding='windows-1252'` as fallback. Any secondary failure returns the safe `';'` default.
- **Changes:** Modified `_detect_separator` in `infrastructure/remessa/upload_rules_base.py`.

### Encoding Bug in `process_file`

- **Problem/Goal:** `pl.read_csv(filepath, separator=sep, infer_schema_length=0)` does not specify an encoding, defaulting to UTF-8, and raises `pl.exceptions.ComputeError` for Latin-1 files.
- **Decision:** Wrap the `pl.read_csv` call in a `try/except ComputeError`, inspect the error message for UTF-8 keywords, and retry with `encoding='windows-1252'`.
- **Changes:** Modified `process_file` in `infrastructure/remessa/upload_rules_base.py`.

### Regression Tests

- **Problem/Goal:** No test existed to catch encoding regressions in the CSV upload pipeline.
- **Decision:** Add two unit tests using real Windows-1252 bytes (not mocked) to validate both code paths: separator detection and full file processing.
- **Changes:** Added `test_fallback_to_windows_1252_on_utf8_decode_error` and `test_process_file_with_windows_1252_encoding` to `infrastructure/tests/test_base_upload_rules.py`.

Key outputs:
- `infrastructure/remessa/upload_rules_base.py` — encoding fallback in `_detect_separator` and `process_file`
- `infrastructure/tests/test_base_upload_rules.py` — 2 new regression tests

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `infrastructure/tests/test_base_upload_rules.py` | `test_fallback_to_windows_1252_on_utf8_decode_error` | Upload pipeline must not crash on Windows-1252 CSVs — separator detection must gracefully fall back |
| `infrastructure/tests/test_base_upload_rules.py` | `test_process_file_with_windows_1252_encoding` | Full CSV parsing must succeed for Windows-1252 files; non-ASCII characters must be preserved in column names and values |

**Why these tests matter:** Brazilian financial system partners commonly export CSV files in Windows-1252/Latin-1. Without this fallback, any file containing `ç`, `ã`, `é`, or other accented characters in column headers or data would silently fail upload, causing data loss and support incidents. These tests ensure the failure mode is caught before deployment.

## Key Decisions

- **Fallback, not conversion:** The fix does not convert the entire file to UTF-8 on disk. It reads the file in the correct encoding and lets Polars handle it natively — preserving exact byte values.
- **Error message inspection for Polars:** Since `pl.exceptions.ComputeError` is a generic exception, the fix narrows the fallback to encoding-related errors only by inspecting the lowercased message for `"invalid continuation byte"`, `"utf-8"`, or `"decode"`. Other `ComputeError`s are re-raised.
- **`windows-1252` over `latin-1`:** Windows-1252 is a superset of Latin-1 and covers additional characters used in Brazilian Portuguese files (e.g. typographic quotes). It is the safe default for legacy Brazilian financial CSVs.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/remessa/upload_rules_base.py` | `modified` | Added `UnicodeDecodeError` catch in `_detect_separator`; added `ComputeError` catch with `windows-1252` fallback in `process_file` |
| `infrastructure/tests/test_base_upload_rules.py` | `modified` | Added 2 regression tests for Windows-1252 encoding scenarios |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/conversations/2026-03-18-2001-test-coverage-kit-liquidacao.md]] | `contextualizes` | Prior session that added tests to the liquidação upload domain — this session extends that test coverage to encoding robustness |
