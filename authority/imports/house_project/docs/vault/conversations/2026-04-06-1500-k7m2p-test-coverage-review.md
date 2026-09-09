---
tags: [frontend, merge, minor-fixes-fe, testing, test-coverage, implementation-plan]
node_type: test
is_session: true
layer: application, architecture
nature: technical
status: active
created: 2026-04-06
timestamp: 2026-04-06T15:00:00±00:00
expires: 2026-06-05
conversation_id: k7m2p
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Identified and addressed critical test coverage gaps in the merge plan, adding four automated tests for backend features and preventing integration regressions."
---

# Test Coverage Review: merge-minor-fixes-fe Plan & Discovery

**Date:** 2026-04-06 15:00 (UTC)
**Tags:** #frontend #merge #testing #test-coverage #minor-fixes-fe

## Summary

This session reviewed test coverage for the `minor-fixes-fe` to `main` merge implementation plan and discovery documents. The merge involves complex conflict resolution across 9 files (3 frontend, 2 backend, 4 scripts/tests) and introduces several new backend features and modified endpoints that posed integration risk.

The session identified a critical test coverage gap: the implementation plan described multiple new backend capabilities — the `pending-overview` endpoint and `GetPendingOverviewUseCase`, computed fields on the `BulkImportListView` (for enhanced batch processing metadata), authentication hardening on previously unprotected views, and cache priming logic in celery tasks — but these features lacked explicit automated test coverage in the plan.

Four test cases were identified as necessary: (1) the pending-overview endpoint must be tested for correct responses and access control enforcement; (2) the computed fields on `BulkImportListView.get()` (`computed_duplicates`, `_has_pending_ocr`, `not_identified`, `pct_found`, `processing_complete`) must validate that queryset annotations produce correct values without breaking the existing batch import flow; (3) auth hardening on `ListarAquisicoesAgregadasView` and `CalcularMetricasAquisicaoView` must confirm that permission checks are enforced; and (4) a regression test for the celery `prime_portfolio_cache` task was needed to ensure the queryset mutation doesn't corrupt the remessas list (a bug identified in conflict resolution).

The decision was made to add Phase 2.5 ("Automated Test Coverage") to the implementation plan, inserting four new test cases at the precursor stage — before the merge branch is merged to main. The plan version was bumped from v0.3.0 to v0.4.0 to reflect this addition and to signal to executors that automated test coverage must pass before proceeding to Phase 1 (Merge with Conflict Resolution).

## Epistemic Impact

No vault nodes were challenged or validated during this session. The session was analytical and focused on completeness rather than knowledge creation. However, the session confirmed that the implementation plan was a living document needing refinement as risks surfaced. This strengthens confidence in the plan's value as a pre-merge safety gate.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md` | modified | Added Phase 2.5 (four automated tests) to cover gaps: pending-overview endpoint, computed fields on BulkImportListView, auth hardening, and celery task regression. Bumped version from v0.3.0 to v0.4.0. |
| `specs/refactor/docs/frontend/merge-minor-fixes-fe-discovery.md` | reviewed | No changes — confirmed context and scope. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `merge-minor-fixes-fe-implementation-plan.md` | `derives-from` | This session's testing analysis directly informed the plan's Phase 2.5 addition. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Execute Phase 2.5 automated tests before Phase 1 merge | session | HIGH | pending |
| Verify celery `prime_portfolio_cache` bug fix in conflict resolution | test phase | HIGH | pending |
| Validate computed fields don't cause N+1 queries | test phase | MEDIUM | pending |

## Open Questions

- Should the four Phase 2.5 tests run in isolation, or as part of the broader integration test suite?
- Is there risk of the pending-overview endpoint conflicting with existing aquisição routes during the merge?
