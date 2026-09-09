---
tags: [models, testing, refactor]
node_type: spec
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T15:29:45-03:00
expires: 2026-05-16
conversation_id: 1f37d4b5-f2de-4489-b3e8-1da3fcc18557
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 3
importance_rationale: "Fixed upload schema and E2E tests, localized stability improvements."
---

# Fixing Upload Schema & E2E Tests

**Date:** 2026-03-17 15:29 (UTC-3)
**Tags:** #models #testing #refactor

## Summary

This session diagnosed and fixed three distinct database schema bugs that caused every CSV upload to fail with raw PostgreSQL errors exposed directly in the UI. The root cause was a pattern of Django model fields existing without corresponding DB columns (or vice-versa), stemming from incomplete migrations during the multi-tenant → single-tenant migration and the Phase 1 document management feature. The session also added comprehensive E2E tests using the real `new-aquisicoes-test.csv` file, and improved Celery task error handling to return user-friendly Portuguese messages instead of raw SQL.

### Legacy `company_id` Columns

- **Problem/Goal:** Uploading any CSV triggered `null value in column "company_id" violates not-null constraint` on `upload_files`. The `company_id` column was a NOT NULL legacy from the old multi-tenant architecture, present in 7+ tables but not managed by any Django model.
- **Decision:** Drop `company_id` from all affected tables since the system is now single-tenant.
- **Changes:** Migration `0040` dropped it from `upload_files`; migration `0041` dropped it from 6 more tables (`remessas_aquisicao`, `remessas_liquidacao`, `document_bulk_import_batch`, `document_produto_kit_config`, `fund_filter_config`, `user_profiles`, `event_logs`). Migration `0041` was also fixed to use per-table `RunSQL` and cross-app dependencies so test DB creation works.

### Missing `bancarizador` Column

- **Problem/Goal:** After fixing `company_id`, uploads failed with `column "bancarizador" does not exist` on `aquisicao_manual_staging`, then `aquisicao_manual`, then `contrato_ccb`. The Django model defined these fields but no migration ever created the DB columns.
- **Decision:** Add the missing columns via raw SQL migrations with `IF NOT EXISTS` guards.
- **Changes:** Migration `0029` added `bancarizador` to `aquisicao_manual_staging` and `aquisicao_manual` (+ `cnpj_bancarizador` to production). Migration `0030` added `bancarizador` to `contrato_ccb`.

### User-Friendly Error Messages

- **Problem/Goal:** Raw PostgreSQL errors (e.g. `null value in column "company_id"...`) were displayed directly to users in the upload UI.
- **Decision:** Catch `IntegrityError` and `DatabaseError` specifically in Celery tasks and return Portuguese user-friendly messages.
- **Changes:** Modified `process_aquisicao_upload` and `process_liquidacao_upload` Celery tasks to catch these exceptions with friendly messages.

### Comprehensive E2E Tests

- **Problem/Goal:** No E2E test exercised the full upload pipeline (Phase 1 validation + Phase 2 DB staging) using a real CSV file.
- **Decision:** Create a dedicated E2E test file with 6 focused tests that deeply verify all output tables.
- **Changes:** Created `test_upload_e2e.py` with tests for UploadFile metadata, RemessaAquisicaoId (identity, aggregates, valor_remessa, FK linkage), ContratoCCB (parcelas, values, hashes for both titulos), AquisicaoManualStaging (campo_chave derivation, tipo_produto/cnpj_emissor propagation, FK linkage), re-upload blocking, and error message regression.

Key outputs:
- 4 migrations fixing schema gaps across 9 tables
- `test_upload_e2e.py` — 6 E2E tests pinning the full upload pipeline
- Improved error handling in both aquisicao and liquidacao Celery tasks

## Key Decisions

- **Drop legacy columns:** `company_id` was dropped from all tables rather than backfilling, since the multi-tenant architecture is permanently retired.
- **Add columns via RunSQL:** `bancarizador` columns added with `IF NOT EXISTS` raw SQL rather than Django `AddField` to safely handle partially-applied states.
- **Per-table RunSQL in 0041:** Split the multi-statement SQL into individual `RunSQL` per table with cross-app dependencies (`aquisicao`, `liquidacao`) so test DB creation doesn't fail on missing tables.
- **Registry fixtures in tests:** E2E tests seed `Bancarizador`, `TipoProduto`, and `TipoInstrumento` fixtures matching the CSV's validation requirements.
- **Separate E2E test file:** Created `test_upload_e2e.py` rather than appending to the existing `test_upload_tasks.py` to keep unit tests and integration tests cleanly separated.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tasks/celery_tasks.py` | `modified` | Added `IntegrityError`/`DatabaseError` exception handling with Portuguese user-friendly messages |
| `domains/liquidacao/tasks/celery_tasks.py` | `modified` | Same error handling improvements as aquisicao |
| `migrations/infrastructure_database/0040_drop_upload_files_company_id.py` | `created` | Drops legacy `company_id` from `upload_files` |
| `migrations/infrastructure_database/0041_drop_all_legacy_company_id_columns.py` | `created` | Drops legacy `company_id` from 6 remaining tables; fixed with per-table RunSQL and cross-app deps |
| `migrations/aquisicao/0029_add_missing_bancarizador_columns.py` | `created` | Adds `bancarizador` to `aquisicao_manual_staging` and `aquisicao_manual`; adds `cnpj_bancarizador` to `aquisicao_manual` |
| `migrations/aquisicao/0030_add_missing_bancarizador_contrato_ccb.py` | `created` | Adds `bancarizador` to `contrato_ccb` |
| `domains/aquisicao/tests/test_upload_e2e.py` | `created` | 6 E2E tests verifying the full upload pipeline across all output tables |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Verify no other tables have model-vs-DB column mismatches | Pattern of missing columns suggests more may exist | MEDIUM | Open |
| `BaseGerencial_Cessoes` upload shown processing in screenshot | User had a second upload in progress | LOW | Unknown |

## Open Questions

- Are there any other tables with similar model-defined fields that lack DB columns? A systematic audit comparing Django model fields to actual DB columns would prevent future occurrences.

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[vault/conversations/2026-03-17-1353-csv-separator-autodetect.md]]| `updates` |Previous session fixed CSV separator; this session fixed the DB-level failures that occurred after the separator fix unblocked uploads|
|[[vault/conversations/2026-03-17-1218-complementary-table-tests-and-validation.md]]| `contextualizes` |Complementary table feature added the `bancarizador`/`cnpj_emissor` fields whose missing DB columns were fixed here|
|[[vault/conversations/2026-03-17-1142-emissor-models-refactor.md]]| `contextualizes` |Emissor model rename created the `Bancarizador` registry that the E2E tests seed as a fixture|
