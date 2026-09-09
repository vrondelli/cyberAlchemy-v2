---
tags: [audit, routing, claude-md]
node_type: audit
is_session: false
layer: ontology
nature: reference
status: draft
veracidade: high
convicção: high
version: 0.1.0
last_updated: 2026-05-08
---

# Routing System State Report — 2026-05-08

## Objective

Audit the agent routing setup in `CLAUDE.md` after today's renumber and the addition of Route 14 ("Executing a Command"). Confirm route table integrity, skill-file existence, cross-reference correctness post-shift, and Route-14 dispatch-target health. Each finding is paired with a backlog item in `docs/vault/backlog/backlog-routing-system.md`.

## Method

- Read `CLAUDE.md` end-to-end and matched every route reference against the new numbering.
- For every skill-file path cited in CLAUDE.md, ran `ls` to confirm existence.
- For every README dispatch target implied by Route 14, ran `ls` to confirm existence vs in-flight status.
- Verified frontmatter against `.claude/skills/custom/frontmatter.md`.

## Healthy

- Route table is structurally sequential: routes 1–14, no gaps, no duplicates. (Verified by reading lines 31–86 of `CLAUDE.md`.)
- Skill files referenced by routes 1, 3, 4, 5, 6, 8, 9, 10, 13 all exist:
  - `.claude/skills/custom/semantic-index.md` (routes 1, 3)
  - `.claude/skills/custom/debugging.md` (route 3)
  - `.claude/skills/custom/discovery-writing.md` (route 4)
  - `.claude/skills/custom/code.md` (routes 4, 5)
  - `.claude/skills/custom/domain-dictionary.md` (route 4)
  - `.claude/skills/custom/testing.md` (route 6)
  - `.claude/skills/custom/frontmatter.md` (route 8)
  - `.claude/skills/custom/backlog-pattern.md` (route 9)
  - `.claude/skills/custom/readme-pattern.md` (route 10)
  - `.claude/skills/custom/infrastructure-guide.md` (route 13)
- `docs/vault/agent-navigation.md` (route 2) exists.
- `.claude/README.md` exists (cited at line 61).
- Root `/README.md` exists with backend setup content — adequate Route 14 dispatch target for the Django/backend branch.
- Line 78 of `CLAUDE.md` reads `### 13. Understanding Infrastructure (Local or Prod)` — numbering is clean post-renumber. (An earlier draft of this report claimed a stale duplicate at line 78; that claim was based on an out-of-date snapshot and is retracted.)

## Broken or stale

- **`CLAUDE.md:85`** — Route 14 says `(Route 2 for debugging, Route 3 for new work)`. After renumber, debugging is Route 3 and new-work splits across Route 4 (specs) / Route 5 (code). The reference is doubly wrong: wrong number AND ambiguous about specs-vs-code. → backlog item P0-1.
- **`CLAUDE.md:35`** — Heading reads `### 2. Exploring or Understand the Vault`. Verb agreement broken; should be `Understanding`. → backlog item P0-2.
- **`CLAUDE.md:49`** — Route 5 says "confirm Step 3 (Specs/Planning) is done first." Specs/Planning is now Route 4. → backlog item P0-3.

## Missing

- `.claude/skills/custom/execute.md` — implied by Route 14 line 86 ("Specialized sub-skills will be added over time"); not yet authored. → backlog item P1-1.
- `frontend/README.md` — Route 14's frontend-app branch has no runtime "how to run the app" target. (Note: `specs/frontend/README.md` exists but is the ontology/spec layer doc, not a runtime dispatch target.) → backlog item P1-3.
- `internal_tools/ccb-registration-demo/README.md` — missing; not blocking. → backlog item P3-1.
- `internal_tools/vault_routing/README.md` — missing; not blocking. → backlog item P3-2.
- `docs/vault/audits/` — directory does not exist. This report needs a home. → backlog item P1-2 (and see save-path rationale below).
- "executing-actions-with-care guidance" cited at `CLAUDE.md:86` — no document by that name exists in `.claude/skills/custom/` or `docs/vault/`. Phantom citation. → backlog item P1-4.

## Pending (in-flight)

- `frontend/README.md` — being drafted today.
- `.claude/skills/custom/execute.md` — proposed but not committed.
- Recommended follow-up edits to CLAUDE.md (lines 35, 49, 85) — covered by P0 backlog items.

## Orphan skills (no route citation)

The following skill files exist under `.claude/skills/custom/` but no route in `CLAUDE.md` references them:

- `domain-tagging-code.md`
- `event-system.md`
- `folder-structure.md`
- `frontend.md`
- `frontmatter-semantics.md` (referenced indirectly from `frontmatter.md` as "thin reference"; arguably not orphan)
- `newspaper-orchestration.md`

Triage covered by backlog item P2-1.
