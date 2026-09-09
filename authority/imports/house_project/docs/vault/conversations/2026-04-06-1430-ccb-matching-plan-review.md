---
tags: [ccb, matching, normalization, check-digit, contrato-lookup]
node_type: discovery
is_session: true
layer: domain, application
nature: technical
status: active
created: 2026-04-06
timestamp: 2026-04-06T14:30:00-03:00
expires: 2026-06-05
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identifies a systematic failure class (every CCB with check digit silently fails lookup) and locks the implementation plan to v2.0 with complete test coverage — ready to execute."
---

# CCB Matching — Discovery & Plan Review

**Date:** 2026-04-06 14:30 (UTC-3)
**Tags:** #ccb #matching #normalization #check-digit #contrato-lookup

## Summary

This session reviewed the CCB matching discovery and implementation plan across two passes. The discovery identifies a systematic failure: every CCB with a check digit silently fails contrato lookup and lands in `STATUS_PENDENTE` with reason `no_id_match`. This is a verifiable-reproducibility violation — same input (PDF with check digit) always produces a wrong output.

The first pass validated the discovery's correctness — single normalization point, correct algorithm — and resolved 8 design decisions: no suffix length cap (permissive), keep compact fallback as defensive safety, instantiate `BulkImportRepository()` locally at call site (not the line 619 instance from a different function), multi-match `order_by('id').first()` kept as-is, `numero_ccb_normalized` confirmed in `extracted_data` on all paths, miss-handling via `if contrato is None` instead of `try/except DoesNotExist` (cleaner API, repository returns None). Plan was bumped through v1.7 to v1.9.

The second pass identified 4 test coverage gaps: no standalone `sanitize_ccb_id` tests, no repository method tests for `find_contrato_by_candidates`, no multi-match deterministic test for the locked decision, and existing `TestStepContratoLookup` tests not flagged for signature update. Added Steps 3a/3c/3d/4a, bumping to v2.0.0.

The implementation itself was never executed — the plan lives in specs for future work.

## Epistemic Impact

The discovery moves from "anomaly" to "class of failures" — every CCB with a check digit systematically fails contrato lookup. This is not a one-off bug. The implementation plan is now specificationally complete (v2.0) but empirically unverified.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| CCB matching discovery doc | Modified | Version bumped, locked decisions reflected |
| CCB matching implementation plan | Modified | 8 decisions locked, 4 test steps added (3a, 3c, 3d, 4a), bumped v1.7 → v2.0 |

## Connections

- contextualizes: `specs/002-ccb-validation-workflow/docs/ccb-id-matching/`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implementation not executed — systematic failure remains active in production | Session outcome | High | open |
| No vault premise for check-digit normalization rule | Session finding | Medium | Create if pattern recurs |

## Open Questions

- No regression test specifically covers Gemini extraction → normalization path end-to-end.
- Step 4a test list acknowledged as non-exhaustive — reviewer must audit full test file.
