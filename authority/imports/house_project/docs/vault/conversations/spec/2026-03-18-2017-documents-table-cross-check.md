---
tags: [ccb, spec, models]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T20:17:40-03:00
expires: 2026-05-17
conversation_id: 7717cb28-c93e-40ac-9b7c-88e6b4889914
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 6
importance_rationale: "Designed documents-to-AquisicaoManual cross-check spec, new data integrity mechanism."
---

# Documents ↔ AquisicaoManual Cross-Check Spec

**Date:** 2026-03-18 20:17 (UTC-3)
**Tags:** #ccb #spec #models

## Summary

This session designed and documented a new feature for the CCB validation pipeline: a configurable mapping between `DocumentTemplate` extracted fields and `AquisicaoManual` columns, plus an automated cross-check rule that validates OCR-extracted values against the financial database. The session produced a detailed implementation plan spec (`documents-table-check.md`) placed in the `002-ccb-validation-workflow` spec directory.

The session started with codebase research to understand all relevant models (`DocumentTemplate`, `AquisicaoManual`, `ComplementaryTableColumnConfig`, `DocumentVersion`, `DocumentsFolderResult`, `ContratoCCB`), the existing extraction pipeline, and how `contrato_extracted_id` links documents to contracts. The user confirmed two key design decisions: (1) matching should use OR semantics across installments (pass if at least one matches), and (2) available target columns should include both model-level fields and dynamic extra columns from `ComplementaryTableColumnConfig`.

### Field-to-Column Mapping Design
- **Problem/Goal:** Users need a way to tell the system which extracted field corresponds to which database column, so the system can verify OCR accuracy.
- **Decision:** A new `TemplateFieldColumnMapping` model stores per-template mappings from `field_name` to `target_column`. Target columns can be model-level (`sacado_cnpj_cpf`) or dynamic extra columns (`complementary_data.<key>`). Mappings are managed via a bulk-replace PUT API.
- **Changes:** Designed the model, CRUD use case, and 3 API endpoints.

### Cross-Check Validation Logic
- **Problem/Goal:** After OCR extraction, there's no verification that extracted values match the actual data in `aquisicao_manual`.
- **Decision:** A pure domain function `cross_check_fields()` compares extracted values against installment rows. String comparisons are case-insensitive; numeric comparisons use ±0.01 tolerance; dates are parsed and compared exactly. Empty/null extracted values are skipped (don't fail). A field passes if **any** installment matches (OR semantics). The overall check passes if **all** mapped fields pass.
- **Changes:** Designed the domain function and its integration into `_process_folder` as Step 5 after contrato matching.

### Pipeline Integration
- **Problem/Goal:** The pipeline already had `REASON_CROSS_CHECK_FAILED` and `REASON_EXTRACTED_NOT_CROSS_CHECKED` constants but no actual cross-check logic.
- **Decision:** Cross-check runs after contrato matching (Step 4) for all DVs with a matched template and extracted data. Templates with no mappings configured are unaffected (keep `extracted_not_cross_checked` reason). Failed cross-checks set `DocumentVersion.reason = 'cross_check_failed'`.
- **Changes:** Designed the pipeline integration point and behavioral rules.

Key outputs:
- `specs/002-ccb-validation-workflow/documents-table-check.md` — full implementation spec with 26 planned test cases

## Key Decisions

- **OR semantics for installment matching:** A field passes if the extracted value matches at least one installment row for the contract. This handles multi-parcel contracts correctly.
- **Available columns scope:** Model-level `AquisicaoManual` fields + dynamic `ComplementaryTableColumnConfig` rows (domain='aquisicao'). `ContratoCCB` columns excluded.
- **Comparison tolerance:** Numeric fields use ±0.01 Decimal tolerance; strings are case-insensitive and whitespace-stripped; dates require exact equality.
- **No-mapping = no-change:** Templates without configured mappings keep their existing `extracted_not_cross_checked` reason — zero behavioral change for unconfigured templates.
- **Folder status unaffected:** Cross-check failure updates `DocumentVersion.reason` but does not change `DocumentsFolderResult` status — folder status is determined by CCB matching.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `created` | Full implementation spec for the cross-check feature: new model, CRUD use case, API endpoints, domain logic, pipeline integration, and 26 test cases |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `derives-from` | The cross-check feature was already referenced in the backlog as a planned capability (Rule E4, cross-check failure handling) |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `contextualizes` | The KitType template-aware design established the `DocumentTemplate.critical_fields` and `non_critical_fields` that this feature maps to columns |
