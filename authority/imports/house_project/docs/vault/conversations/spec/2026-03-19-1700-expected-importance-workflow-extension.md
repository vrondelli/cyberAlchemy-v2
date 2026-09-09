---
tags: [vault, ontology, agents]
node_type: spec
is_session: true
layer: ontology
nature: [procedural, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:00:36-03:00
expires: 2026-05-18
conversation_id: ffced12c-c9fd-4232-b3e3-143d62a48dfa
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Extended close-session workflow with expected_importance scoring heuristic and backfilled all 122 session documents, adding a Bayesian prior for TTL triage but not changing constitutional rules."
satisfaction:
  mean: 8
  min: 7
  max: 9
  std: 0.8
---

# Expected Importance — Workflow Extension & Backfill

**Date:** 2026-03-19 17:00 (UTC-3)
**Tags:** #vault #ontology #agents

## Summary

This session added a new prospective classification dimension — `expected_importance` — to the vault's session node system. The user identified the need for a forward-looking metric to complement the existing retrospective `user_satisfaction` field. The session covered three phases: designing the scoring heuristic, updating the `close-session.md` workflow, and backfilling all 122 existing session documents with assessed importance scores and max-information-density rationale sentences.

The discussion started with checking the close-session workflow for duplicates (only one file exists at `.agent/workflows/close-session.md`). The user then proposed adding expected importance, which was validated as orthogonal to satisfaction (high satisfaction ≠ high importance). A scoring heuristic table was designed with 4 tiers (0–1, 2–4, 5–7, 8–10) mapped to signal types and examples. During review, the user identified that big test refactors/implementations were incorrectly classified in the 2–4 tier and should be 5–7 — the table was corrected.

The `importance_rationale` field was defined with one objective function: maximize information density in exactly one sentence. A Python script was created to batch-add both fields to all 122 session documents, with individually assessed scores for each file. The resulting distribution has a mean of 5.2, skewing toward spec/plan work consistent with the project's current phase.

### Close-Session File Check
- **Problem/Goal:** User wanted to know how many close-session files exist and if they differ.
- **Decision:** Only one exists at `.agent/workflows/close-session.md`. No duplicates.
- **Changes:** None.

### Expected Importance Design
- **Problem/Goal:** Need a prospective metric for future session relevance, complementing the retrospective satisfaction score.
- **Decision:** Add `expected_importance` (0–10 integer) and `importance_rationale` (single max-density sentence) to the close-session workflow and frontmatter template.
- **Changes:** Added Step 5.5 to `close-session.md` with heuristic table. Added both fields to the frontmatter template in Step 6.

### Test Classification Fix
- **Problem/Goal:** The heuristic table incorrectly placed all test additions in the 2–4 tier, including large-scale test refactors.
- **Decision:** Big test refactors/implementations that validate or challenge business rules belong in 5–7. Only localized test additions stay in 2–4.
- **Changes:** Updated the 5–7 and 2–4 rows of the heuristic table in `close-session.md`.

### Backfilling All Session Documents
- **Problem/Goal:** 122 existing session documents had no `expected_importance` or `importance_rationale` fields.
- **Decision:** Assess each document individually based on its title, node_type, tags, and content.
- **Changes:** Created a Python batch script (`/tmp/add_importance.py`) that added both fields to all 122 files. Distribution: 2×score2, 10×score3, 21×score4, 45×score5, 23×score6, 14×score7, 6×score8, 1×score9. Only ontology/vault architecture sessions scored 8+.

Key outputs:
- `.agent/workflows/close-session.md` — Step 5.5 added, heuristic table updated, frontmatter template extended
- 122 files in `docs/vault/conversations/` — all now have `expected_importance` and `importance_rationale`

## Key Decisions

- **Expected importance is orthogonal to satisfaction:** A session can have high satisfaction but low importance (fun trivial fix) or low satisfaction but high importance (frustrating critical discovery).
- **Importance rationale has one objective function:** Maximize information density in one sentence — compress *what* changed, *where*, and *why* it has lasting relevance.
- **Big test efforts are 5–7, not 2–4:** Large-scale test implementations validate specs and surface gaps, unlike localized test additions alongside bug fixes.
- **No 0, 1, or 10 scores assigned:** No session was purely trivial Q&A (minimum 2) and none made a truly irreversible system-wide decision (maximum 9 for ontology axioms formalization).
- **Mean 5.2 is expected:** Project is in heavy spec writing + implementation phase, so most sessions are spec-level work.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `.agent/workflows/close-session.md` | `modified` | Added Step 5.5 (expected importance), fixed test classification in heuristic table, added `expected_importance` and `importance_rationale` to frontmatter template |
| 122 files in `docs/vault/conversations/` | `modified` | Added `expected_importance` and `importance_rationale` to frontmatter of every session document |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `contextualizes` | Classification system that governs the label values used in expected_importance scoring |
| [[vault/ontology-constitution.md]] | `contextualizes` | Constitutional principles that inform what makes a session "important" in the vault |
