---
tags: [pipeline, acquisition, ccb]
node_type: test
is_session: true
layer: [domain, application]
nature: [technical, reference]
status: active
created: 2026-03-21
timestamp: 2026-03-21T18:12:20-03:00
expires: 2026-05-20
conversation_id: f1c114d2-0109-41f0-8655-5bc2474bb35a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Session produced a structured test audit of 13 uncommitted changes and implemented 41 new tests covering the _sanitize_template_text function (zero coverage before), EMPRESA_KEYWORDS ordering regression guard (F-007), and upload_service blocked_count filter rename — all business-critical paths with no prior safety net."
version: 0.1.0
last_updated: 2026-03-21
---

# Test Audit — EMPRESA_KEYWORDS Reorder, _sanitize_template_text, CCB Config Switch

**Date:** 2026-03-21 18:12 (UTC-3)
**Tags:** #pipeline #acquisition #ccb

## Summary

This session ran the `/test-uncommited-changes` workflow over the uncommitted changes in the repository, producing a QA audit artifact that classified 6 critical, 4 important, and 3 nice-to-have test gaps. The user then requested immediate implementation of all identified gaps. A total of 41 new tests were written and verified across three test files. The session covered four distinct functional areas:

1. **EMPRESA_KEYWORDS reorder** — a fix from session F-007 that placed `capital_consig` before `unico` in the keyword lookup and added `SERVIÇOS SAIR` as a SIAPENET fallback. No tests existed for either the ordering behavior or the new pattern.
2. **CCB extraction config switch** — `_CONFIG_LOOKUP` was changed to use `ccb_cap.json` instead of `ccb_consig.json` for `(CCB, None)`. The existing cache test was fragile (inspected internal dict); replaced with behavioral tests.
3. **`_sanitize_template_text`** — a new function in `manage_document_template.py` that erases captured values from template text before storing it as `document_payload`. The function had zero test coverage at the start of this session.
4. **`duplicate_origin` string renames** — `duplicated_on_upload` → `duplicated_on_file` and `remessa_already_active` → `already_on_database`, plus a filter change in `upload_service.blocked_count` from `duplicate_origin` to `skip_reason`.

All 41 tests pass. 8 pre-existing failures in `test_document_template.py` (DB contamination from a seeded CCB template) are unrelated and pre-dated this session.

### EMPRESA_KEYWORDS Priority Ordering (F-007 regression guard)

- **Problem/Goal:** The EMPRESA_KEYWORDS dict was reordered to place `siapenet`/`dataprev` before `capital_consig` before `unico`. The fix was designed to prevent Averbações SIAPE from being falsely classified as `capital_consig` (F-007). No tests guarded the ordering.
- **Decision:** Write priority/ordering tests that explicitly exercise the conflict scenarios — CCB with `unico | sign` footer, doc with both `dataprev` and `CAPITAL CONSIG`, etc.
- **Changes:** 5 new tests in `test_universal_extraction.py::TestInferEmpresa`: `test_ccb_with_unico_signature_infers_capital_consig`, `test_siapenet_inferred_by_servicos_sair_menu_text`, `test_siapenet_inferred_by_servicos_sair_single_space`, `test_dataprev_takes_priority_over_capital_consig_in_averbacao`, `test_unico_without_capital_consig_infers_unico`.

### _sanitize_template_text (C1–C4, I1–I2, N1)

- **Problem/Goal:** New function introduced with zero test coverage. It erases captured group 1 from each regex in `extraction_config.fields`, keeping labels but removing per-document values from `document_payload.text`. Without tests, a regression silently inflates Jaccard scores for all templates.
- **Decision:** Write unit tests for the function directly (`TestSanitizeTemplateText`) and integration tests for `register_template`/`update_template` paths (`TestRegisterUpdateTemplateSanitization`).
- **Changes:** 9 new tests in `test_document_template.py`: 7 unit tests (erases value, passthrough when None, empty fields, malformed pattern, no capture group, empty/None text, multi-field) + 2 integration tests (register_template payload check, update_template sanitization with extraction_config).

### CCB Config Switch (N3, behavioral caching)

- **Problem/Goal:** `test_config_caching` was inspecting `_config_cache` dict directly — a fragile implementation test. Also, no test explicitly verified that `(CCB, None)` resolves to `ccb_cap.json` content.
- **Decision:** Replace the fragile cache test with a behavioral one (patches `json.load` and counts calls), add `test_ccb_none_empresa_loads_ccb_cap_config` to verify correct field parsing.
- **Changes:** Modified `test_config_caching`, added `test_ccb_none_empresa_loads_ccb_cap_config`.

### Upload Service String Renames (I3, N2)

- **Problem/Goal:** Three string literals were renamed across three files simultaneously. `upload_service.py` also changed `blocked_count` to filter on `skip_reason` instead of `duplicate_origin`. Zero regression tests existed.
- **Decision:** Write pure Polars unit tests in `test_base_upload_rules.py` (no Django ORM needed) that guard the literal values and the filter expression.
- **Changes:** 3 new tests in `TestUploadServiceTagging`: `test_intra_file_dups_tagged_duplicated_on_file`, `test_remessa_blocked_rows_tagged_already_on_database`, `test_blocked_count_computed_via_skip_reason_column`.

Key outputs:
- `test_audit_uncommitted.md` (brain artifact) — full audit with 6 critical, 4 important, 3 nice-to-have gaps
- `domains/aquisicao/tests/test_universal_extraction.py` — 7 new tests
- `domains/aquisicao/tests/test_document_template.py` — 9 new tests (2 new classes)
- `infrastructure/tests/test_base_upload_rules.py` — 3 new tests (1 new class)

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_ccb_with_unico_signature_infers_capital_consig` | CCBs from Capital Consig carry `unico \| sign` footer — must still infer capital_consig not unico |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_siapenet_inferred_by_servicos_sair_menu_text` | When OCR truncates the siapenet.gov.br URL, `SERVIÇOS SAIR` nav bar must trigger siapenet identification |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_dataprev_takes_priority_over_capital_consig_in_averbacao` | Dataprev Averbações with overlapping Capital Consig footer must infer dataprev first |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_unico_without_capital_consig_infers_unico` | Genuine Antifraude/unico docs with no Capital Consig mention must infer unico correctly |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_ccb_none_empresa_loads_ccb_cap_config` (N3) | `(CCB, None)` lookup must use ccb_cap.json — guards the _CONFIG_LOOKUP migration |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_config_caching` (refactored) | Behavioral: config must not be reloaded from disk on repeated calls |
| `domains/aquisicao/tests/test_document_template.py` | `TestSanitizeTemplateText` (7 tests) | Template payload must be a structural fingerprint (labels only), not a per-document data snapshot |
| `domains/aquisicao/tests/test_document_template.py` | `TestRegisterUpdateTemplateSanitization` (2 tests) | register_template and update_template must store sanitized payloads to prevent Jaccard inflation |
| `infrastructure/tests/test_base_upload_rules.py` | `TestUploadServiceTagging` (3 tests) | `duplicate_origin` and `skip_reason` tag values must match between producer (upload_service) and consumer (duplicate CSV / event payload) |

**Why these tests matter:** The `_sanitize_template_text` function directly determines Jaccard matching quality for all templates — without sanitization tests, a regression could cause false-positive template matches leading to extraction with the wrong config, corrupting `valor_liberado`, `taxa_juros`, and `numero_ccb` for all CCBs processed via the generic path. The EMPRESA_KEYWORDS ordering tests protect the F-007 fix from silent reversion.

## Key Decisions

- **Behavioral cache test over internal inspection:** `test_config_caching` was refactored to patch `json.load` and count calls rather than inspect `_config_cache` dict, making it resilient to future implementation changes (e.g., switching to `lru_cache`).
- **Upload service tests as pure Polars unit tests:** Rather than running the full Django-integrated `ProcessUploadService`, the tagging tests construct minimal DataFrames and replicate the polars expressions. This keeps the test fast and non-brittle against infrastructure changes.
- **Audit artifact first, implementation second:** Running `/test-uncommited-changes` before writing code produced a prioritized, categorized list that guided which tests to implement first (criticals before nice-to-haves).

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | `modified` | Added 6 new infer_empresa ordering/priority tests; refactored test_config_caching to behavioral; added ccb_cap config guard test |
| `domains/aquisicao/tests/test_document_template.py` | `modified` | Added `TestSanitizeTemplateText` (7 unit tests) and `TestRegisterUpdateTemplateSanitization` (2 integration tests) |
| `infrastructure/tests/test_base_upload_rules.py` | `modified` | Added `TestUploadServiceTagging` (3 tests) for duplicate_origin rename and blocked_count filter |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `brain/f1c114d2-.../test_audit_uncommitted.md` | `created` | QA audit artifact: 6 critical, 4 important, 3 nice-to-have gaps identified from 13 changed files |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| 8 pre-existing failures in `test_document_template.py` due to seeded CCB template DB contamination | Pre-existing (before this session) | ⚠️ HIGH | Open |
| `manage.py re_extract_dvs` management command (F-009) | `system-fragilities.md` | MEDIUM | Open — no implementation |
| F-008: dual source of truth for `extraction_config` (JSON disk vs DB) | `system-fragilities.md` | MEDIUM | Open — workaround only |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `validates` | Tests guard the infer_empresa and universal extraction logic described in this spec |
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `contextualizes` | F-007 fix (EMPRESA_KEYWORDS reorder) and F-008/F-009 open items are tracked there |
