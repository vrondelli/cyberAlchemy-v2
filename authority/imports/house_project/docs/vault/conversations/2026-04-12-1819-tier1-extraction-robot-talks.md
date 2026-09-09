---
tags: [bulk-import, pipeline, extraction-steps, refactor, tier1, implementation-plan, ccb, gemini, test-coverage]
node_type: implementation-plan
is_session: true
layer: application
nature: technical, procedural
status: active
created: 2026-04-12
timestamp: 2026-04-12T18:19:00-0300
expires: 2026-06-11
conversation_id: 2026-04-12-1819-tier1-robot-talks
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-refactor-discovery.md
  - specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier1-implementation-plan.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Authoritative execution contract for the Tier 1 extraction pipeline refactor, incorporating a robot-talks audit that resolved six cross-layer tensions."
---

# Tier 1 Extraction Pipeline Refactor — Robot-Talks Audit & Implementation Plan

## Summary

The session reviewed `extraction-refactor-discovery.md` for code-verified inconsistencies and fixed four: Asymmetry 4 restated as three call-site shapes (7 total, not 5), Tier 1 plan updated with per-shape helper application rules, Connections link resolved, and D2 ordering note sharpened. A robot-talks audit ran 4 parallel agents (call-graph, event contract, test coverage, CCB cascade) surfacing six cross-layer tensions before implementation. Tensions included Shape B (CCB matched) being structurally incompatible with a naive single-helper approach, and `TestStepExtractMatchedCcb` having zero assertions on the attrs Change 3 extracts. All six tensions were resolved in `extraction-tier1-implementation-plan.md`, specifying pre-flight tests, exact per-call-site change patterns, and a strict helper interface contract.

## Contradictions

- validates `extraction-refactor-discovery.md` v0.1.2 — implements all three changes and resolves the third call-site gap left open by the discovery
- questions `extraction-refactor-discovery.md` v0.1.2 — discovery named two `_try_gemini_extraction` sites; plan identifies a third at line 530, correcting completeness without contradicting behavioral conclusions

## Files touched

- `specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-refactor-discovery.md`
- `specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier1-implementation-plan.md`
