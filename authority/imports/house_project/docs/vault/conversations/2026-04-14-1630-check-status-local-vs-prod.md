---
tags: [check-status, document-checklist, pending-overview, ccb-validation, data-discrepancy, deprecation]
node_type: discovery
is_session: true
layer: application
nature: insight
status: active
created: 2026-04-14
timestamp: 2026-04-14T16:30:00-03:00
expires: 2026-06-13
conversation_id: c7h4s
decisions_made: true
contradictions_found: false
specs_updated:
  - specs/002-ccb-validation-workflow/docs/check-status/discovery-check-status.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Reveals a silent production gap — a checklist generator with no standing caller — which directly affects the reliability of Check Status and must inform the deprecation-vs-backfill decision."
---

# Check Status: Local vs Prod Data Divergence

## Summary

Investigated why Check Status shows 422,914 contracts locally vs 2 on Vercel main. Root cause: `pending-overview` filters on `checklist__isnull=False`, and only 2 prod contracts have `DocumentChecklist` rows. The sole creator (`generate_checklist_for_contrato`) has no standing production caller — the referenced "Phase 4b CCB Identification Worker" does not appear anywhere in the indexed codebase. Decision: write discovery doc rather than backfill, since `DocumentChecklist` is already scheduled for deprecation per `ccb-business-rules-refactor-implementation.md`. Open questions: whether the worker exists outside the repo, and which path to take (backfill vs finish the deprecation).

## Files touched

- specs/002-ccb-validation-workflow/docs/check-status/discovery-check-status.md
