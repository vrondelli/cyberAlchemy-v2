---
tags: [documents-validation, extraction-pipeline, mermaid, refactoring, architecture]
node_type: discovery
is_session: true
layer: domain, architecture
nature: technical, explanatory
status: active
created: 2026-04-12
timestamp: 2026-04-12T16:00:00-03:00
expires: 2026-06-11
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Contradicts implicit architectural assumptions about extraction pipeline symmetry and produces a tiered refactor proposal that unblocks structural simplification."
---

# documents_validation Pipeline Mermaid Verification + Refactor Discovery

**Date:** 2026-04-12 16:00 (UTC-3)
**Tags:** #documents-validation #extraction-pipeline #mermaid #refactoring #architecture

## Summary

This session verified whether a Fase 1/2/3 Mermaid flowchart still described the current `documents_validation` pipeline behavior. It found 5 material mismatches with code: (1) empresa inference shown BEFORE template match (actually runs after), (2) CCB-unmatched Gemini-as-last-resort omitted, (3) Fallback Gemini tier for Averbacao/Antifraude/ComprovanteEmprestimo omitted in both branches, (4) `REASON_EXTRACTED_NOT_CROSS_CHECKED` intermediate state missing, (5) match field labeled `numero_ccb` when actual field is `numero_titulo`. A corrected flowchart was produced.

More importantly, drawing the diagram exposed 4 structural asymmetries not justified by business logic: (1) matched and unmatched branches encode the same 3-tier shape with different cheap-extractor steps — two ~250-line functions for one parameterized pipeline; (2) CCB uses Gemini inconsistently across branches (never matched, last-resort unmatched) with no documented rationale; (3) `_try_gemini_extraction("CCB")` is a structural no-op — the Primary helper only handles Identificacao/Holerite; (4) `check_critical_fields` is invoked 5 times (lines 539, 577, 612, 728, 857) with the same boilerplate.

A refactor discovery was written with three tiers: Tier 1 (1-2 days, low risk — kill the no-op, extract critical-field helper), Tier 2 (~1 week, moderate — unify matched/unmatched into single parameterized function + introduce ExtractionOutcome dataclass), Tier 3 (2-3 weeks, high — data-driven strategy registry). Recommendation: do Tier 1 now, defer Tier 2 until 2+ new doc_types or a concrete CCB Gemini incident.

A follow-up review caught an internal contradiction: Asymmetry 2 originally said matched CCB "never calls Gemini" but Asymmetry 3 said it calls a no-op. Reconciled: matched CCB reaches a Gemini call site, but it's a structural no-op. The primary-Gemini no-op is not unique to CCB — non-CCB matched paths also hit dead branches for Averbacao/Antifraude/ComprovanteEmprestimo. Tier 1 scope was widened to fix both call sites.

## Epistemic Impact

Five implicit assumptions about the extraction pipeline were contradicted: flowchart accuracy, branch symmetry, Gemini call effectiveness, and critical-gate uniqueness. The `_transient_attrs` pattern (`_critical_evaluated`, `_critical_passed`) was identified as an `ExtractionOutcome` dataclass trying to emerge.

Decision D2 (CCB Gemini product policy) is load-bearing: Tier 1 silently pre-answers it by deleting the call-site breadcrumb. Must land D2 first or leave an explicit comment.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-refactor-discovery.md` | Created (v0.1.1) | Structural refactor discovery — complements existing efficiency-focused extraction-steps-refactor |

## Connections

- contextualizes: `domains/documents_validation/use_cases/extraction_steps.py`
- contextualizes: `specs/002-ccb-validation-workflow/docs/extraction-steps-refactor/`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Schedule Tier 1 refactor (kill no-op + extract helper) | Decision D1 | Medium | open |
| Product decision: should CCB use Gemini consistently or skip it consistently? | Decision D2 | Medium | open |
| Tier 2 trigger: revisit when 2+ new doc_types proposed, cross-path Gemini change needed, or divergence bug found | Decision D3 | Low | deferred |
| ExtractionOutcome interface contract unspecified | Tier 2 prerequisite | Low | deferred |
