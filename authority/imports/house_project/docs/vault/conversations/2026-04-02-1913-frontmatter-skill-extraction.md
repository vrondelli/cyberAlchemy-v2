---
tags: [vault, agents, ontology]
node_type: spec
is_session: true
layer: ontology
nature: reference, procedural
status: active
created: 2026-04-02
timestamp: 2026-04-02T19:13:00-03:00
expires: 2026-06-01
conversation_id: q5vt2
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "Improved agent context efficiency for Route 7 by extracting the frontmatter schema into a dedicated skill file, but no architectural decisions or system-wide changes."
---

# Frontmatter Skill Extraction

**Date:** 2026-04-02 19:13 (UTC-3)
**Tags:** #vault #agents #ontology

## Summary

The session extracted the frontmatter schema from `ontology-conventions.md` (544 lines / ~10k tokens) into a minimal skill file at `.claude/skills/custom/frontmatter.md` (~45 lines). The motivation was that Route 7 in CLAUDE.md — triggered every time a new markdown file is created — was loading the entire ontology document just to look up the frontmatter schema and allowed field values. This was wasteful: ~95% of the loaded content (rationale, mathematical foundations, edge catalogs) was irrelevant to the mechanical task of prepending frontmatter. The extracted skill file contains only the schema block and allowed values per field, which is all Route 7 needs. The full `ontology-conventions.md` remains the authoritative source and is still loaded for close-session classification (Step 2a) and deep ontology work.

## Epistemic Impact

- The session validates the principle that agent context should be minimized to what's operationally needed — loading 10k tokens for a 45-line lookup is a measurable inefficiency.
- Route 7 in CLAUDE.md was updated to point to the skill file. No existing vault nodes were contradicted.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.claude/skills/custom/frontmatter.md` | created | Extracted frontmatter schema from `ontology-conventions.md` (~45 lines) for Route 7 |
| `CLAUDE.md` | modified | Route 7 now points to `frontmatter.md` skill instead of full `ontology-conventions.md` |

## Connections

- derives-from: `docs/vault/ontology-conventions.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `frontmatter.md` must stay in sync with `ontology-conventions.md` when the schema changes — two-source-of-truth risk | Design decision | MEDIUM | Open |
