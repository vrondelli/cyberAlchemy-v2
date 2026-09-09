---
tags: [models, acquisition, refactor]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T12:35:00-03:00
expires: 2026-05-17
conversation_id: 5fb3c6ba-0ea2-4c92-b260-4b401c991911
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Seeded configs, fixed upload flow, and removed obsolete tables for extra columns rework."
---

# Extra Columns Rework — Seed Configs, Fix Upload Flow, Remove Obsolete Tables

**Date:** 2026-03-18 12:35 (UTC-3)
**Tags:** #models #acquisition #refactor

## Summary

This session completed the extra columns rework for the aquisição upload flow. The core change is that unmapped CSV columns (from column Q onwards in the CSV) are now registered as `ComplementaryTableColumnConfig` entries and stored in the `complementary_data` JSON field on `aquisicao_manual` / `aquisicao_manual_staging`, replacing the obsolete `ParcelasExtraCols`, `AquisicaoExtraCols`, and `LiquidacaoExtraCols` tables. Most code changes (models, upload rules, celery tasks, approve flow) were already implemented in prior sessions; this session focused on seeding the 23 config entries with correct data types, fixing a duplicate column rename bug in the upload pipeline, and removing the three obsolete extra-cols tables.

### Seed ComplementaryTableColumnConfig with Correct Data Types
- **Problem/Goal:** The migration `0031_extra_cols_rework.py` seeded all 23 Q+ columns with `data_type: string`, but several columns have specific types.
- **Decision:** User specified: `taxa_de_desconto`, `taxa_de_juros`, `valor_iof`, `tac`, `seguro` → `float`; `data_nascimento`, `dat_vencimento_original` → `date`. All others remain `string`.
- **Changes:** Updated the `COMPLEMENTARY_COLUMNS` list in migration `0031_extra_cols_rework.py` and applied the migration.

### Duplicate Column Rename Bug
- **Problem/Goal:** When a CSV contains both `CampoChave` and `id_parcela`, both map to `campo_chave` via `FORMATTING_MAP`, causing a Polars `DuplicateError` at rename time.
- **Decision:** When multiple CSV columns map to the same target, only the first match wins the rename; subsequent columns keep their original CSV name. User confirmed `id_parcela` should indeed map to `campo_chave`.
- **Changes:** Updated `BaseUploadRules.process_file()` in `upload_rules_base.py` to deduplicate rename targets.

### Removal of Obsolete Extra Cols Tables
- **Problem/Goal:** Three tables (`parcelas_extra_cols`, `aquisicao_extra_cols`, `liquidacao_extra_cols`) were obsolete now that extra columns go into the `complementary_data` JSON field.
- **Decision:** Remove all three. `AquisicaoExtraCols` and `LiquidacaoExtraCols` had already been dropped in prior migrations. `ParcelasExtraCols` still existed and was removed in this session.
- **Changes:** Deleted `ParcelasExtraCols` model, removed its tests, created migration `0042_drop_parcelas_extra_cols.py`.

### API Crash Loop Fix
- **Problem/Goal:** After restarting Docker, the API crashed with `table "liquidacao_extra_cols" does not exist` because migration `0011_liquidacaoextracols` had never been applied.
- **Decision:** Created the table manually via psql to break the crash loop, then the subsequent migration `0012_drop_liquidacaoextracols` dropped it.
- **Changes:** Created `liquidacao_extra_cols` table in the `house_project` database via direct SQL.

Key outputs:
- `migrations/aquisicao/0031_extra_cols_rework.py` — 23 ComplementaryTableColumnConfig entries with correct data types
- `migrations/infrastructure_database/0042_drop_parcelas_extra_cols.py` — drops the obsolete table

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `infrastructure/tests/test_sprint2_models.py` | Removed `TestParcelasExtraCols` (3 tests) | `ParcelasExtraCols` is obsolete; extra columns now use `complementary_data` JSON |

**Why these tests matter:** The removed tests validated a model that no longer exists. Keeping them would cause import errors. The underlying business rule (extra columns are preserved during upload) is now covered by the `complementary_data` flow tests in `test_validate_complementary_columns.py`.

## Key Decisions

- **`id_parcela` maps to `campo_chave`:** User confirmed this is intentional. When both `CampoChave` and `id_parcela` are present, `CampoChave` wins and `id_parcela` keeps its original name.
- **Extra column data types:** Financial fields (`taxa_de_desconto`, `taxa_de_juros`, `valor_iof`, `tac`, `seguro`) are `float`; temporal fields (`data_nascimento`, `dat_vencimento_original`) are `date`.
- **`complementary_data` is the canonical storage:** All three obsolete extra-cols tables removed in favor of the JSON column on the domain models.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `migrations/aquisicao/0031_extra_cols_rework.py` | `modified` | Fixed data types from `string` to `float`/`date` for 7 columns |
| `infrastructure/remessa/upload_rules_base.py` | `modified` | Fixed duplicate column rename — deduplicates targets so first match wins |
| `infrastructure/database/models.py` | `modified` | Removed `ParcelasExtraCols` model class |
| `infrastructure/tests/test_sprint2_models.py` | `modified` | Removed `ParcelasExtraCols` import and `TestParcelasExtraCols` test class |
| `migrations/infrastructure_database/0042_drop_parcelas_extra_cols.py` | `created` | Migration to drop `parcelas_extra_cols` table |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/human-navigation.md` | `modified` | User changed `README.md` reference to `ontology-constitution.md` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `derives-from` | Session classification follows conventions |
