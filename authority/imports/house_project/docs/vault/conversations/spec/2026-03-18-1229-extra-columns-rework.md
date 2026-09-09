---
tags: [acquisition, models, refactor, testing]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T12:29:59-03:00
expires: 2026-05-17
conversation_id: f53c92e5-e2bf-426f-ba68-e62ee3a74a94
#
expected_importance: 6
importance_rationale: "Reworked extra columns implementation after architecture pivot, significant code and schema changes."
version: 0.1.0
last_updated: 2026-03-18
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
---

# Extra Columns Rework

**Date:** 2026-03-18 12:29 (UTC-3)
**Tags:** #acquisition #models #refactor #testing

## Summary

This session reworked the CSV upload pipeline's extra columns architecture. The system previously used separate tables (`AquisicaoExtraCols`, `LiquidacaoExtraCols`, `ParcelasExtraCols`) to store columns not in `FORMATTING_MAP`. This was inconsistent with the `complementary_data` JSONField that already existed on the staging and production models. The rework consolidated all extra column storage into the `complementary_data` field, dropped unused legacy fields (`bancarizador`, `cnpj_bancarizador`), fixed the `ValorNominalAtual` mapping (was incorrectly mapping to `valor_nominal_original`, now correctly maps to `valor_nominal_atual`), and seeded 23 Q+ column configurations for mandatory validation.

The session began with a deep analysis of the feature's current state, identifying inconsistencies between code, documentation, and previous implementation plans. An implementation plan was approved and executed. The primary challenge during verification was that Polars DataFrames carrying Python `dict` objects (from the validator's `_complementary_data` column) caused panics in `join()`, `filter()`, and `write_csv()` operations. This was solved by stripping Object-typed columns before Polars operations and re-attaching them via a keyed join before passing data to the staging service.

### Extra Columns Architecture Consolidation

- **Problem/Goal:** Three separate tables (`AquisicaoExtraCols`, `LiquidacaoExtraCols`, `ParcelasExtraCols`) were used for extra column storage, but `complementary_data` JSONField already existed on `AquisicaoManual`/`AquisicaoManualStaging`. This duplication was confusing and inconsistent.
- **Decision:** Delete all three extra-cols tables. Stop creating `ParcelasExtraCols` entries. Keep all non-`FORMATTING_MAP` columns through `process_file()` so they flow into `complementary_data`.
- **Changes:** Deleted `AquisicaoExtraCols` and `LiquidacaoExtraCols` models. Removed `ParcelasExtraCols` creation block from `StageRemessaService`. Removed column filtering in `upload_rules_base.py`.

### ValorNominalAtual Mapping Fix

- **Problem/Goal:** `ValorNominalAtual` was mapped to `valor_nominal_original` in `FORMATTING_MAP`, which was semantically incorrect — "atual" means "current", not "original".
- **Decision:** Map `ValorNominalAtual` to `valor_nominal_atual` (new field). Add `valor_nominal_atual` field to both `AquisicaoManual` and `AquisicaoManualStaging`.
- **Changes:** Updated `FORMATTING_MAP`, added field to models, celery tasks, approve flow, and export fields. All test CSV fixtures updated to provide `valor_nominal` alongside `ValorNominalAtual`.

### Legacy Field Removal

- **Problem/Goal:** `bancarizador` and `cnpj_bancarizador` fields on `AquisicaoManual`/`AquisicaoManualStaging` were duplicates of `cnpj_emissor` and had no distinct purpose.
- **Decision:** Drop both columns via migration. Remove the obsolete `get_bancarizador_suggestions_OBSOLETE()` function.
- **Changes:** Migration drops fields. Dead code removed from `process_bulk_import.py`.

### Polars Object Dtype Handling

- **Problem/Goal:** After removing column filtering, the validator's `_complementary_data` (dict) and `_tipo_instrumento_pk` columns with Polars Object dtype caused panics in Polars `join()`/`filter()`/`write_csv()` operations.
- **Decision:** Strip Object-typed columns immediately after validation, perform all Polars operations, then re-attach via left join on dedup keys before passing to `StageRemessaService`.
- **Changes:** Updated `upload_service.py` (strip/re-attach pattern), `stage_remessa_service.py` (drop Object cols before contract filter), and `_save_duplicates_csv` (drop before CSV write).

### ComplementaryTableColumnConfig Seeding

- **Problem/Goal:** 23 Q+ columns from CSVs needed to be registered as `ComplementaryTableColumnConfig` entries for mandatory validation.
- **Decision:** Seed all 23 columns in the migration with `is_mandatory=False`.
- **Changes:** Migration `0031_extra_cols_rework.py` seeds 23 entries. Tests updated to account for seeded data.

Key outputs:
- `migrations/aquisicao/0031_extra_cols_rework.py` — Combined schema + data migration
- `migrations/liquidacao/0012_drop_liquidacaoextracols.py` — Drop LiquidacaoExtraCols table

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `infrastructure/tests/test_base_upload_rules.py` | `test_process_file_keeps_extra_cols_through` | Unknown CSV columns must pass through for complementary_data storage |
| `infrastructure/tests/test_stage_remessa_service.py` | Removed 3 `ParcelasExtraCols` tests, added unknown-col safety test | Extra columns no longer create separate table rows |
| `domains/aquisicao/tests/test_new_model_columns.py` | Removed `TestAquisicaoExtraCols`, `TestLiquidacaoExtraCols` | Deleted models no longer need tests |
| `domains/aquisicao/tests/test_complementary_table.py` | Updated 5 tests for seeded data awareness | Complementary column CRUD works alongside migration-seeded configs |
| `domains/aquisicao/tests/test_upload_tasks.py` | Updated 9 CSV fixtures | Upload pipeline handles `valor_nominal_atual` mapping correctly |
| `domains/aquisicao/tests/conftest.py` | Updated default CSV row | Shared test fixtures provide both `ValorNominalAtual` and `valor_nominal` |
| `domains/aquisicao/tests/test_remessa_dedup.py` | Updated CSV fixtures | Dedup pipeline works with new column set |
| `domains/aquisicao/tests/test_skip_reason_duplicate_report.py` | Updated CSV fixtures + DB reference | Skip reason reporting works with reworked columns |
| `infrastructure/tests/test_upload_events.py` | Updated 3 CSV fixtures | Upload events emit correctly with new column set |

**Why these tests matter:** Without these updates, all upload pipeline tests would fail because `valor_nominal_original` would be missing from test CSVs after the `ValorNominalAtual` remapping. The Polars Object dtype fixes ensure the pipeline doesn't crash when extra columns (destined for `complementary_data`) flow through.

## Key Decisions

- **Consolidated storage:** `complementary_data` JSONField is now the single storage mechanism for extra columns. No more separate spillover tables.
- **All columns kept:** `process_file()` no longer filters to REQUIRED+OPTIONAL columns. All columns pass through so unknown ones can populate `complementary_data`.
- **Object dtype stripping:** Polars Object-typed columns are stripped before DataFrame operations and re-attached via left join before passing to the staging service. This is a systematic pattern applied in `upload_service.py`.
- **`ContratoCCB.bancarizador` untouched:** Only `AquisicaoManual`/`AquisicaoManualStaging` fields were dropped, per user instruction.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `valor_nominal_atual`, removed `bancarizador`/`cnpj_bancarizador`, deleted `AquisicaoExtraCols` |
| `domains/liquidacao/repositories/models.py` | `modified` | Deleted `LiquidacaoExtraCols` model |
| `domains/aquisicao/domain/upload_rules.py` | `modified` | Fixed `ValorNominalAtual→valor_nominal_atual` mapping, updated OPTIONAL/DECIMAL cols |
| `infrastructure/remessa/upload_rules_base.py` | `modified` | Removed column filtering to keep all columns |
| `infrastructure/remessa/upload_service.py` | `modified` | Object dtype strip/re-attach pattern, CSV write protection |
| `infrastructure/remessa/stage_remessa_service.py` | `modified` | Removed `ParcelasExtraCols` block, Object dtype filter for contracts |
| `domains/aquisicao/tasks/celery_tasks.py` | `modified` | Added `valor_nominal_atual` to staging builder |
| `domains/aquisicao/use_cases/approve_remessa.py` | `modified` | Added `valor_nominal_atual` to staging→production copy |
| `infrastructure/remessa/remessa_fields.py` | `modified` | Added `valor_nominal_atual` to export fields |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Removed `get_bancarizador_suggestions_OBSOLETE()` |
| `migrations/aquisicao/0031_extra_cols_rework.py` | `created` | Schema changes + seed 23 ComplementaryTableColumnConfig |
| `migrations/liquidacao/0012_drop_liquidacaoextracols.py` | `created` | Drop LiquidacaoExtraCols table |
| `domains/aquisicao/tests/conftest.py` | `modified` | Added `valor_nominal` to default CSV row |
| `domains/aquisicao/tests/test_upload_tasks.py` | `modified` | Updated 9 CSV fixtures with `valor_nominal` |
| `domains/aquisicao/tests/test_upload_e2e.py` | (unchanged) | Tests pass with pipeline fixes |
| `domains/aquisicao/tests/test_remessa_dedup.py` | `modified` | Added `valor_nominal` to CSV fixture |
| `domains/aquisicao/tests/test_skip_reason_duplicate_report.py` | `modified` | Added `valor_nominal`, fixed DB reference |
| `domains/aquisicao/tests/test_new_model_columns.py` | `modified` | Removed deleted model tests |
| `domains/aquisicao/tests/test_complementary_table.py` | `modified` | Updated for migration-seeded configs |
| `infrastructure/tests/test_base_upload_rules.py` | `modified` | Changed column filtering assertion |
| `infrastructure/tests/test_stage_remessa_service.py` | `modified` | Removed ParcelasExtraCols tests |
| `infrastructure/tests/test_upload_events.py` | `modified` | Updated CSV fixtures |

## Open Questions

- Should `valor_nominal` (mapped to `valor_nominal_original`) be added as a required column alongside the existing `valor_nominal_original` identity mapping? Currently both work, but the CSV must provide at least one.
- The 23 seeded Q+ columns are all non-mandatory. Should any be made mandatory by default?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/conversations/2026-03-17-refining-extra-columns-workflow.md]] | `updates` | Refines the extra columns workflow established in the prior session |
