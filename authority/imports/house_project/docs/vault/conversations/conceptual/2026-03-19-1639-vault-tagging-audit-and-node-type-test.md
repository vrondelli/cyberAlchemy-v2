---
tags: [vault, ontology, agents]
node_type: conceptual
is_session: true
layer: ontology
nature: [explanatory, reference]
status: consolidated
created: 2026-03-19
timestamp: 2026-03-19T16:39:30-03:00
conversation_id: d07daa82-11cb-4278-a868-b9bb208281cd
#
expected_importance: 8
importance_rationale: "Audited all vault tags and added node_type:test to ontology, expanding the classification system."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-19
---

# Vault Tagging Audit & `node_type: test` Addition

**Date:** 2026-03-19 16:39 (UTC-3)
**Tags:** #vault #ontology #agents

## Summary

This session performed a comprehensive audit of all 120 session nodes in `/docs/vault/conversations/`, evaluating frontmatter tagging quality, value correctness, and connection integrity against the standards defined in `ontology-conventions.md`. The audit revealed systemic issues: 87.5% of sessions were classified as `node_type: spec` (over-defaulting), 70% had `nature: reference` (over-defaulting), 37 connections used the non-existent edge type `references`, and tags like `spec`, `refactor`, `testing` violated the "domain/topic labels only" rule.

The analysis led to a deep investigation of whether a new `node_type: test` should be added to the ontology. The case was evaluated through the lens of the orthogonality principle, the challenge-response test (which yielded a genuinely unique response: *"Run the tests and see if they pass"*), and practical data from 14+ test-focused sessions. After presenting a comprehensive artifact with arguments for and against, the user approved adding `test` as the sixth `node_type` value.

The session then implemented all changes: `ontology-conventions.md` was updated to v1.2.0 with `node_type: test` across 8 sections, the `/close-session` workflow received 4 improvements (cleaned tag catalog, `node_type` decision tree, `nature` heuristic, valid edge types list), and 16 session files were reclassified from `spec` to `test`.

### Full Vault Tagging Audit
- **Problem/Goal:** Verify whether session nodes follow the tagging standards defined in `ontology-conventions.md`.
- **Decision:** Produced a comprehensive audit artifact identifying 10 categories of issues across 120 files.
- **Changes:** No immediate changes — the audit served as the foundation for the subsequent improvements.

Key findings:
- `node_type: spec` in 87.5% of sessions (should vary based on session content)
- `nature: reference` in 70% (most sessions should be `explanatory` or `technical`)
- `nature: conceptual` used in 1 file (invalid value, was explicitly removed)
- Tags `spec`, `refactor`, `testing`, `models` describe activities, not domains
- `references` used 37 times in Connections (not in the edge type catalog)
- Layer format inconsistency: 2 files use YAML arrays instead of CSV

### Analysis of `node_type: test`
- **Problem/Goal:** Determine whether test-focused sessions need their own `node_type` value, following the orthogonality principle.
- **Decision:** Add `node_type: test`. The challenge-response is genuinely unique (*"Run the tests and see if they pass"*), and tests play a distinct epistemic role as generators of evidence that increase `veracidade` of specs and constitutions.
- **Changes:** Created artifact `node-type-test-analysis.md` with full analysis covering orthogonality, counterarguments, and scenarios.

### Close-Session Workflow Improvements
- **Problem/Goal:** The workflow's defaults were causing systematic mistagging.
- **Decision:** Four improvements: clean tag catalog, add decision tree for `node_type`, add `nature` heuristic, add valid edge types list.
- **Changes:**
  - Step 1: Removed `#spec`, `#refactor`, `#testing`, `#models` from tag catalog; organized by domain/technical/vault
  - Step 3: Added top-down decision tree for `node_type` (with `spec` as fallback, not default); added `nature` heuristic (with `reference` as rare)
  - Step 6 Connections: Added inline list of 14 valid edge types with common-mistake warnings

### Implementation of `node_type: test`
- **Problem/Goal:** Add `test` to the ontology and reclassify existing sessions.
- **Decision:** Update `ontology-conventions.md` (v1.2.0) and reclassify 16 sessions.
- **Changes:**
  - `ontology-conventions.md`: 8 sections updated (schema, challenge-response, count, applicability, Appendix B×2, Appendix D)
  - 16 session files: `node_type: spec` → `node_type: test`

## Key Decisions

- **Add `node_type: test`:** A new value for documents whose primary role is executable validation. Challenge response: *"Run the tests and see if they pass."* Tests are evidence generators, not behavioral descriptions.
- **`spec` is fallback, not default:** The decision tree in close-session evaluates top-down: constitution → premise → conceptual → test → spec. This prevents the current over-defaulting to `spec`.
- **`reference` is rare for nature:** Most coding sessions should be `technical`, most exploration sessions should be `explanatory`. `reference` is only for sessions that produced a literal lookup table.
- **Remove activity-based tags:** `#spec`, `#refactor`, `#testing`, `#models` describe activities or layers, not business/technical domains. They were removed from the tag catalog.
- **Session is permanent:** This session fundamentally changed the classification system by adding a new `node_type` value. The reasoning behind this decision must remain accessible.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-conventions.md` | `modified` | v1.2.0: Added `node_type: test` across 8 sections |
| `.agent/workflows/close-session.md` | `modified` | Cleaned tag catalog, added decision tree + nature heuristic + edge types list |
| `docs/vault/conversations/*.md` (16 files) | `modified` | Reclassified `node_type: spec` → `node_type: test` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Reclassify ~15 `spec` → `conceptual` sessions (audits, reviews, explorations) | Audit | MEDIUM | Not started |
| Fix `nature: conceptual` in 1 file (invalid value) | Audit | ⚠️ HIGH | Not started |
| Fix `#` prefix in 2 files' tags | Audit | ⚠️ HIGH | Not started |
| Fix YAML array format in 2 files' `layer`/`nature` | Audit | MEDIUM | Not started |
| Standardize `acquisition` vs `aquisicao` in tags | Audit | LOW | Not started |
| Replace 37 `references` edges with `contextualizes`/`derives-from` | Audit | MEDIUM | Not started |
| Formalize extra fields (`decisions_made`, etc.) in ontology | Audit | LOW | Not started |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `updates` | Added `node_type: test` as the sixth value — v1.2.0 |
| [[vault/ontology-constitution.md]] | `derives-from` | The orthogonality analysis used the constitutional principles to justify the new value |
