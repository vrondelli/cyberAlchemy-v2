---
tags: [ccb, pipeline, documents-validation]
node_type: test
is_session: true
layer: [domain, application]
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:42:03-03:00
expires: 2026-05-23
conversation_id: e7fbc0a5-accd-40d1-a60b-ca45daed3557
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Performed exhaustive test coverage audit of the 15 migrated modules and defined the 6-point success criteria contract for the documents_validation migration; all code changes were reverted at user request — output is analysis-only."
satisfaction_score: 7
satisfaction_min: 5
satisfaction_max: 9
satisfaction_std: 1.5
version: 0.1.0
last_updated: 2026-03-24
---

# Migration Test Gap Analysis & Success Criteria

**Date:** 2026-03-24 16:42 (UTC-3)
**Tags:** #ccb #pipeline #documents-validation

## Summary

This session performed an exhaustive test coverage audit of the 15 modules being migrated from `aquisicao` to `documents_validation` as defined in `documents-validation-migration-implementation.md`. The goal was to answer: "what tests must pass for the migration to be provably complete?"

The analysis mapped 617+ existing test methods across 10 test files against all migrated modules (3 use cases, 3 services, 5 domain modules, 1 tasks file, 2 management commands, and an extraction_configs directory). Two coverage gaps were identified: a smoke test for all import paths and unit tests for the previously-untested `extract_id_gemini.py` management command. Test files were drafted but **all code changes were reverted at the user's request** — the session output is analysis-only, preserved in the artifact `implementation_plan.md`.

### Test Coverage Audit

- **Problem/Goal:** Determine if existing tests are sufficient to guarantee behavioral parity after the lift-and-shift migration.
- **Decision:** The existing 617+ tests cover all migrated business logic. Two structural gaps were identified: import path validation and `extract_id_gemini.py` helpers.
- **Changes:** Test files were drafted but reverted. The test specifications are preserved in the conversation artifact for future implementation.

### Success Criteria Contract

- **Problem/Goal:** Define an unambiguous "done" condition for the migration.
- **Decision:** A 6-point pass/fail contract: (1) new domain tests pass, (2) old domain tests pass, (3) no stale imports, (4) no old imports in new domain, (5) smoke imports green, (6) extract_id_gemini helpers green.
- **Changes:** Verification plan was drafted but reverted from the spec. The 6-point contract is preserved in the conversation artifact.

Key outputs:
- Conversation artifact with full coverage matrix, gap analysis, and test code drafts
- All project code changes were **reverted** — no permanent modifications

## Key Decisions

- **6-point verification contract:** All 6 checks must pass for migration to be considered complete. No partial success.
- **`extract_id_gemini.py` testing scope:** Only the pure helper functions (`_detect_mime_type`, `_call_gemini`) need unit tests. Skip `_pdf_first_page_to_image` and `handle()`.
- **`template_matching_config.py` and `bulk_import_config.py` don't need dedicated tests:** Config-only modules tested transitively by 13+ existing tests.
- **All code changes reverted:** User requested no code modifications in this session.

## Files Changed

### Code

No permanent code changes — all modifications were reverted.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/2026-03-24-1642-migration-test-gap-analysis.md` | `created` | This session node |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Embedded test extractions (cross-check + kit-matching) | Implementation spec | ⚠️ HIGH | Pending — must be done during migration execution |
| `conftest.py` for new domain | Implementation spec | ⚠️ HIGH | Pending — must copy fixtures from `aquisicao/tests/conftest.py` |
| `mock.patch` string literals | Implementation spec | MEDIUM | Must be updated alongside import rewrites |

## Open Questions

None — the success criteria are fully defined.
