---
tags: [upload, testing, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T14:08:01-03:00
expires: 2026-05-16
conversation_id: c1c445bc-d869-47c1-9b2c-32aac574d46e
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 3
importance_rationale: "Fixed CSV column derivation (id_parcela to campo_chave), localized data mapping fix."
---
# CSV Column Derivation Fix (id_parcela → campo_chave)

**Date:** 2026-03-17 14:08 (UTC-3)
**Tags:** #upload #testing #refactor

## Summary

This session was a continuation of the CSV separator fix. After the separator auto-detection was deployed and the container restarted, the user re-uploaded `new-aquisicoes-test.csv` and encountered a second distinct error: "O arquivo enviado não possui as colunas obrigatórias: campo_chave, numero_titulo". The separator was now correctly detected, but the real-world CSV format uses different column names for two required fields: `id_parcela` serves as the per-parcel unique key (what `campo_chave` represents), and `id_titulo` serves as the titulo number (what `numero_titulo` represents).

The fix introduced a `_derive_columns()` extensibility hook to `BaseUploadRules` — a no-op by default, called after FORMATTING_MAP renaming but before mandatory-column validation. `AquisicaoUploadRules` overrides it to synthesize `campo_chave` from `id_parcela` and `numero_titulo` from `id_titulo` when those columns are absent. This preserves backward compatibility with all existing file formats (they continue to produce `campo_chave` and `numero_titulo` directly) while accepting the new format. Three targeted regression tests were added, including one that exactly mirrors the column structure of the user's `new-aquisicoes-test.csv`. The full suite went from 1,354 to 1,357 passing tests.

### CSV Column Name Mismatch (campo_chave / numero_titulo)

- **Problem/Goal:** `new-aquisicoes-test.csv` uses `id_parcela` (e.g. `5421-01`) as the parcel key and `id_titulo` (e.g. `5421`) as the titulo number. The system's mandatory column list requires `campo_chave` and `numero_titulo` by those exact names, so the upload was rejected even after the separator fix.
- **Decision:** Add a `_derive_columns()` hook to `BaseUploadRules` so domain subclasses can synthesize required columns from alternate source columns without modifying the base algorithm. Do this in `AquisicaoUploadRules`, not the base class, so it stays domain-specific.
- **Changes:**
  - Added `_derive_columns()` no-op hook to `BaseUploadRules.process_file()` (called after rename, before validation).
  - Added `_derive_columns()` override to `AquisicaoUploadRules` that copies `id_parcela` → `campo_chave` and `id_titulo` → `numero_titulo` when the canonical names are absent.
  - Added `import polars as pl` to `upload_rules.py` (was missing).

### Test Coverage

- **Problem/Goal:** Tests written in the previous pass only covered separator detection and did not exercise the real-world column layout.
- **Decision:** Write tests using the exact column structure of `new-aquisicoes-test.csv` so future regressions are caught before reaching the UI.
- **Changes:** Added `test_derive_campo_chave_from_id_parcela`, `test_derive_numero_titulo_from_id_titulo`, and `test_process_file_with_real_world_csv_format` to `TestAquisicaoUploadRules`.

Key outputs:
- `infrastructure/remessa/upload_rules_base.py` — `_derive_columns()` hook added
- `domains/aquisicao/domain/upload_rules.py` — domain override for column derivation + polars import
- `domains/aquisicao/tests/test_upload_tasks.py` — 3 new derivation regression tests

## Key Decisions

- **Hook in base, logic in domain:** `_derive_columns()` is a no-op in `BaseUploadRules` and only has meaningful logic in `AquisicaoUploadRules`. This keeps the base class domain-agnostic and avoids accidental coupling to aquisição-specific concepts.
- **Only derive when absent:** The derivation only fires if `campo_chave` / `numero_titulo` is missing — files that already have those columns are unaffected.
- **`id_parcela` doubles as `campo_chave`:** In the new CSV format, `id_parcela` (e.g., `5421-01`) is the unique per-parcel identifier — exactly what `campo_chave` represents. We derive rather than rename so `id_parcela` remains available as an optional column for the staging model.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/remessa/upload_rules_base.py` | `modified` | Added `_derive_columns()` no-op hook called in `process_file()` between rename and validation |
| `domains/aquisicao/domain/upload_rules.py` | `modified` | Added `import polars as pl` + `_derive_columns()` override for campo_chave/numero_titulo derivation |
| `domains/aquisicao/tests/test_upload_tasks.py` | `modified` | Added 3 column derivation regression tests |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Consider whether liquidação needs a similar `_derive_columns()` override for its own CSV variants | This session | LOW | Open |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/conversations/2026-03-17-1353-csv-separator-autodetect.md]] | `derives-from` | The separator fix that preceded this work; both bugs were discovered iteratively from the same upload attempt |
