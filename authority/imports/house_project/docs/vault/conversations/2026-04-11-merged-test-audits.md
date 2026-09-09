---
tags: [testing, audit, coverage, idempotency, concurrency, celery]
node_type: audit
is_session: true
layer: integration
nature: technical
status: active
created: 2026-04-11
timestamp: 2026-04-11T20:15:00-03:00
expires: 2026-06-10
conversation_id: merged-tests
decisions_made: false
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identifies 4 critical untested concurrency/idempotency paths in production code that could cause data corruption (duplicate installments, double event emission) under Celery redelivery — high-risk gaps requiring immediate attention."
---

# Test Audits — Implementation Plan & Uncommitted Changes

## Summary

This session merged two test audit sub-sessions from April 11. The first was a stub reviewing the implementation plan's test completeness; the second was a deep audit of 96 production files and 6 test files across uncommitted changes. The audit identified 4 critical, 8 important, and 4 nice-to-have missing tests, plus 8 incomplete and 3 fragile/outdated tests. Key findings center on untested concurrency and idempotency paths — Celery skip-guards, `select_for_update` concurrent approvals, and idempotency middleware isolation — that pose real data-corruption risk.

## Files touched

- `domains/aquisicao/tests/test_approve_remessa.py`
- `domains/aquisicao/tests/test_delete_remessa.py`
- `domains/aquisicao/use_cases/delete_remessa.py`
- Idempotency middleware (reviewed)
- Job status API endpoints (reviewed)
- Batch lifecycle views (reviewed)
- Semantic index test fixtures (reviewed)
- Frontend processing/finalizados contexts (reviewed)
