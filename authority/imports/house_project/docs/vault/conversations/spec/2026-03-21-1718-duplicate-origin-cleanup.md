---
tags: [acquisition, pipeline, infrastructure]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T17:18:00-03:00
expires: 2026-05-20
conversation_id: 163bbe4e-b0ff-49e0-8081-77652728dff4
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "Reduced `duplicate_origin` to exactly two values (`duplicated_on_file`, `already_on_database`) across upload pipeline and legacy view, eliminating `remessa_already_active` and `duplicated_on_upload` to simplify deduplication contracts; localized refactor with no architectural impact."
version: 0.1.0
last_updated: 2026-03-21
---

# Duplicate Origin Field Cleanup

**Date:** 2026-03-21 17:18 (UTC-3)
**Tags:** #acquisition #pipeline #infrastructure

## Summary

This session standardized the `duplicate_origin` field across the CSV upload pipeline. The field had three informal values — `already_on_database`, `remessa_already_active`, and `duplicated_on_upload` — but the user's intention was to have exactly two: `already_on_database` (any row blocked by the database layer) and `duplicated_on_file` (any row duplicated within the uploaded file itself).

The session also investigated 17 test failures found when running the full test suite. The failures fell into three independent groups: a universal extraction regex mismatch (already resolved before the session started), a DB contamination issue in template-count tests (caused by production-seeded templates persisting into the test database), and a PyMuPDF crash from fake PDF bytes in a test without proper OCR mocks. The user reviewed the diagnosis and chose to revert the test fixes, keeping only the `duplicate_origin` source-code changes.

The stray debug script `test_ccb_cap.py` left at the project root was moved to `/tmp/` to unblock pytest collection.

### `duplicate_origin` Contract Reduction

- **Problem/Goal:** Three informal values existed for `duplicate_origin`. The user clarified the semantic intent: only two values should exist, with `remessa_already_active` folded into `already_on_database` (both represent DB-level blocks) and `duplicated_on_upload` renamed to `duplicated_on_file`.
- **Decision:** `remessa_already_active` → `already_on_database`; `duplicated_on_upload` → `duplicated_on_file`. The `blocked_count` filter in `upload_service.py` was shifted from `duplicate_origin == 'remessa_already_active'` to `skip_reason == 'remessa'` (the stable semantic signal) since `duplicate_origin` for remessa-blocked rows now overlaps with DB-blocked rows.
- **Changes:** Updated `upload_rules_base.py`, `upload_service.py` (3 sites), `dashboard/views.py` (legacy `UploadMovimentationsView`), and `infrastructure/tests/test_base_upload_rules.py`.

### Test Failure Diagnosis (Reverted)

- **Problem/Goal:** Running the full test suite revealed 17 failures unrelated to the `duplicate_origin` work.
- **Decision:** After diagnosing all three groups, the user chose to revert the test fixes. Only the source-code changes were retained.
- **Changes:** Reverted `domains/aquisicao/tests/conftest.py` and `domains/aquisicao/tests/test_parallel_bulk_import.py` to their pre-session state.

Key outputs:
- `infrastructure/remessa/upload_rules_base.py` — `duplicated_on_upload` → `duplicated_on_file`
- `infrastructure/remessa/upload_service.py` — `remessa_already_active` → `already_on_database`; `blocked_count` filter uses `skip_reason`
- `dashboard/views.py` — `duplicated_on_upload` → `duplicated_on_file` in legacy view
- `infrastructure/tests/test_base_upload_rules.py` — assertion updated to `duplicated_on_file`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `infrastructure/tests/test_base_upload_rules.py` | `test_split_intra_file_duplicates_tags_dups_with_origin` | Intra-file duplicates must be tagged with `duplicate_origin = 'duplicated_on_file'` |

**Why these tests matter:** The `duplicate_origin` field drives routing logic in the pipeline — rows tagged as `duplicated_on_file` are excluded from DB insert counts and routed to the duplicate CSV report. A wrong value silently produces incorrect upload statistics.

## Key Decisions

- **`remessa_already_active` removed:** Remessa-level blocked rows and installment-level blocked rows both originate from the database deduplication layer — they share the same semantic meaning. Collapsing them under `already_on_database` removes a spurious third state.
- **`blocked_count` filter migrated to `skip_reason`:** Since `already_on_database` now covers both remessa and installment blocks, the only reliable signal to count remessa-specific blocks is `skip_reason == 'remessa'`, which is stable and user-facing.
- **Test fixes reverted:** The 17 failing tests (DB contamination, PyMuPDF mock gap) were diagnosed but not fixed at the user's request.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/remessa/upload_rules_base.py` | `modified` | `duplicated_on_upload` → `duplicated_on_file` in `split_intra_file_duplicates` |
| `infrastructure/remessa/upload_service.py` | `modified` | `remessa_already_active` → `already_on_database`; `blocked_count` filter uses `skip_reason == 'remessa'` |
| `dashboard/views.py` | `modified` | `duplicated_on_upload` → `duplicated_on_file` in `UploadMovimentationsView.format_duplicates` |
| `infrastructure/tests/test_base_upload_rules.py` | `modified` | Updated assertion from `duplicated_on_upload` to `duplicated_on_file` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| 17 failing tests (DB contamination in template-count tests + PyMuPDF mock gap) | Session diagnosis | MEDIUM | Open — user chose not to fix this session |
