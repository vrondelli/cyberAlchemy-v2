---
tags: [testing, acquisition, ccb]
node_type: test
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T16:00:03-03:00
expires: 2026-05-18
conversation_id: 6756620d-b5d2-4a07-9829-9b4551d79308
#
expected_importance: 4
importance_rationale: "Analyzed 109 test failures tracing root cause to deprecated RG doc_type in fixtures."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md"]
promoted_candidates: []
---

# Test Failures Analysis: Unsupported doc_type 'RG'

**Date:** 2026-03-19 16:00 (UTC-3)
**Tags:** #testing #acquisition #ccb

## Summary

The session focused on running and analyzing the project's test suite to identify the most critical failures, without taking immediate action to fix them. A total of 109 tests in the `aquisicao` module were failing (22 `failed` and 87 `errors`). The root cause for almost all of these failures was a shared `ValueError: Unsupported doc_type 'RG'` occurring during test setup. This indicated that test fixtures (specifically `kit_consignado`) were still trying to create `KitType` configurations using the deprecated `RG` document type, conflicting with a recent domain change that unified `RG` and `CNH` into `Identificacao`. The implementation plan was updated to include fixing these test fixtures as a prerequisite step.

### Test Failures Investigation
- **Problem/Goal:** Identify the most critical errors breaking the test suite.
- **Decision:** The main blocker is the `doc_type` validation for the deprecated `RG` artifact.
- **Changes:** Executed tests, parsed the error logs, and documented the required fix in the RG Extraction implementation plan, deferring the actual code change to the subsequent implementation phase.

Key outputs:
- `rg-document-extraction-implementation.md` — Updated with a prerequisite step to fix broken test fixtures.

## Key Decisions

- **Test Fixes Deferred:** The test fixes for the `kit_consignado` fixture will be bundled with the overall Identificacao extraction feature commit rather than done in isolation.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Added a step to fix the `doc_type="RG"` test fixtures (like `kit_consignado`) to use `Identificacao`. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix `kit_consignado` fixture and related tests | `pytest` | ⚠️ HIGH | Pending |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Added test fixing step to the implementation plan |
