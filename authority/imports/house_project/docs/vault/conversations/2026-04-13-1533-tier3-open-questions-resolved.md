---
tags: [extraction-tier3, open-questions, pipeline-refactor, cascading-step, discovery]
node_type: discovery
is_session: true
layer: [architecture, domain]
nature: [technical]
status: active
veracidade: high
convicção: medium
created: 2026-04-13
timestamp: 2026-04-13T15:33:00-03:00
expires: 2026-06-12
decisions_made: true
contradictions_found: false
specs_updated: [specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-discovery.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Resolves all 5 load-bearing open questions from the Tier 3 discovery and widens scope to a reusable CascadingStep base class, unblocking the implementation plan."
---

# Tier 3 Extraction Discovery — Open Questions Resolved

## Objective

Record resolution of the open questions blocking Tier 3 implementation plan writing, and document the scope widening that emerged during the session.

## Summary

Resolved all 5 load-bearing open questions: template matching stays inside `TemplateRegex` (single consumer, no `TemplateMatchStep`); one `Gemini` class with positional strategies in `ExtractStep.strategies` (no Strict/Loose split); `ExtractionPolicy` uses template-specific critical fields when a template matched, doc_type global otherwise; full-folder re-execution on any rerun (single-DV or full-folder); GCS rename via `transaction.on_commit` with acceptable drift on failure. Scope widened mid-session: cascade promoted to a reusable `CascadingStep` base class; `_step_classify_dvs` split into `DocTypeIdentificationStep` + `EmpresaIdentificationStep`. Three minor questions (rerun_generation storage, event ordering, pass-predicate library) deferred to plan with leans confirmed. Implementation plan cleared to write.

## Files touched

- `specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-discovery.md`
