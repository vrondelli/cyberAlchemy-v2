---
tags: [backlog, routing, claude-md]
node_type: backlog
is_session: false
layer: ontology
nature: procedural
status: draft
version: 0.1.0
last_updated: 2026-05-08
---

# Routing System Backlog — 2026-05-08

## Objective

Track gaps and breakage in the agent routing system after today's renumbering and Route 14 addition. Every item below is justified by a finding in `docs/vault/audits/routing-system-2026-05-08.md` (cross-referenced inline).

## P0 — fix now (cheap edits, immediate harm if left)

### [P0-1] Fix stale route reference inside Route 14

**Source finding:** State report → "Broken or stale" → `CLAUDE.md:85`.
**Why:** The parenthetical inside Route 14 says "Route 2 for debugging, Route 3 for new work". Post-renumber, debugging is Route 3 and new work is Route 4 (specs) or Route 5 (code). An agent that drifts from Route 14 to debugging will follow the wrong pointer.
**Where:** `CLAUDE.md:85`.
**Acceptance:** Line 85 reads `(Route 3 for debugging, Route 4 for new specs/features, Route 5 for code changes)`. Verified by `grep -n "Route 3 for debugging" CLAUDE.md` returning exactly that line.

### [P0-2] Fix verb agreement in Route 2 heading

**Source finding:** State report → "Broken or stale" → `CLAUDE.md:35`.
**Why:** `### 2. Exploring or Understand the Vault` is grammatically inconsistent (`Exploring` vs `Understand`). Visible in every route load; signals sloppiness.
**Where:** `CLAUDE.md:35`.
**Acceptance:** Heading reads `### 2. Exploring or Understanding the Vault`.

### [P0-3] Fix Route 5's "Step 3" reference

**Source finding:** State report → "Broken or stale" → `CLAUDE.md:49`.
**Why:** Route 5 says "confirm Step 3 (Specs/Planning) is done first." Specs/Planning is now Route 4.
**Where:** `CLAUDE.md:49`.
**Acceptance:** Line 49 reads `⚠️ If this is a NEW feature, confirm Route 4 (Specs/Planning) is done first.`

### [P0-4] Sweep CLAUDE.md and `.claude/skills/custom/*.md` for any remaining stale `Route N` refs

**Source finding:** State report → method (renumber affected routes 3–13).
**Why:** Routes 3–13 all shifted today; P0-1/2/3 fix the known cases but a sweep is needed to catch the rest.
**Where:** `CLAUDE.md` and every file under `.claude/skills/custom/`.
**Acceptance:** `grep -nE "Route [0-9]+|Step [0-9]+" CLAUDE.md .claude/skills/custom/*.md` returns zero references that are inconsistent with the current numbering. Reviewer signs off in commit message.

## P1 — soon (blocks Route 14 from working as designed)

### [P1-1] Author the Route 14 execute skill

**Source finding:** State report → "Missing" → `.claude/skills/custom/execute.md`.
**Why:** Route 14 promises "specialized sub-skills" but none exist. Until the skill lands, every agent hits Route 14 with no dispatch logic.
**Where:** new file `.claude/skills/custom/execute.md`.
**Acceptance:** File exists with frontmatter (per `.claude/skills/custom/frontmatter.md`) and documents at minimum a 4-way dispatch: (a) cloud invocation, (b) Django/backend run, (c) frontend run, (d) internal_tools / local docker-db. Route 14 in CLAUDE.md gains `📖 READ:` line pointing to it.

### [P1-2] Land this audit in `docs/vault/audits/` and surface the directory

**Source finding:** State report → "Missing" → `docs/vault/audits/`.
**Why:** Audit nodes (`node_type: audit` per frontmatter schema) had no canonical home in the vault before today. The directory is now created and this report lives in it; the remaining work is making the directory discoverable.
**Where:** `docs/vault/agent-navigation.md`.
**Acceptance:** `docs/vault/agent-navigation.md` mentions `audits/` as a node category (one line is enough) so future agents know where to look.

### [P1-3] Author `frontend/README.md` (runtime, not ontology)

**Source finding:** State report → "Missing" → `frontend/README.md`.
**Why:** Route 14's frontend dispatch needs a "how to run the app" target. `specs/frontend/README.md` exists but is the spec/ontology layer — wrong artifact for runtime dispatch.
**Where:** `frontend/README.md` (new file at the app directory). NOT `specs/frontend/README.md`.
**Acceptance:** File exists with frontmatter `node_type: readme`, contains: install command, dev-server command, build command, and the env vars required to run. `ls frontend/README.md` succeeds.

### [P1-4] Resolve "executing-actions-with-care guidance" phantom citation

**Source finding:** State report → "Missing" → phantom citation at `CLAUDE.md:86`.
**Why:** `CLAUDE.md:86` references guidance that doesn't exist as a doc. Either author it or rewrite the parenthetical.
**Where:** `CLAUDE.md:86`.
**Acceptance:** Either (a) `.claude/skills/custom/executing-actions-with-care.md` exists and line 86 cites it as `📖 READ:`, OR (b) line 86 is rewritten to inline the rule (e.g., "confirm with the user before any destructive command — modifications, deletes, deploys, or anything irreversible") and no phantom doc reference remains.

## P2 — when convenient

### [P2-1] Triage 6 orphan skills

**Source finding:** State report → "Orphan skills".
**Files:** `.claude/skills/custom/{domain-tagging-code,event-system,folder-structure,frontend,frontmatter-semantics,newspaper-orchestration}.md`.
**Acceptance:** Each file is either (a) cited from at least one route in `CLAUDE.md` or from another cited skill, or (b) moved to `.claude/skills/custom/_archive/`. Tracked by a checklist in this backlog item — one box per file.

### [P2-2] Add Route 14 entry-cue from Routes 3 and 5

**Source finding:** State report → "Broken or stale" → cross-route signposting gap.
**Why:** No signpost tells an agent already in Route 3 (debugging) or Route 5 (code) to switch to Route 14 when the user says "just run this". Sessions drift instead of switching.
**Where:** `CLAUDE.md` Routes 3 and 5.
**Acceptance:** Each of Routes 3 and 5 contains a one-line "If the user only wants to run something, switch to Route 14" cue.

### [P2-3] Inline Route 14 dispatch table in CLAUDE.md until P1-1 lands

**Source finding:** State report → "Pending" → execute skill not committed.
**Why:** P1-1 may take longer than P0/P1-2/P1-3; an inline 4-line dispatch table inside Route 14 gives agents something to follow today.
**Where:** `CLAUDE.md` Route 14.
**Acceptance:** Route 14 contains a bulleted dispatch list mapping {cloud, backend, frontend, internal_tools} → command pattern. Removed when P1-1 ships.

## P3 — deferred

### [P3-1] README for `internal_tools/ccb-registration-demo/`

**Source finding:** State report → "Missing".
**Recommendation:** Defer. Existing SPEC docs cover orientation. Promote to P2 if a session loses time looking for it.
**Acceptance (when picked up):** `internal_tools/ccb-registration-demo/README.md` exists with `node_type: readme` frontmatter and ≥ one entry under "Run / Inspect" pointing at the SPEC.

### [P3-2] README for `internal_tools/vault_routing/`

**Source finding:** State report → "Missing".
**Recommendation:** Defer. Promote to P2 if a session loses time looking for it.
**Acceptance (when picked up):** `internal_tools/vault_routing/README.md` exists with `node_type: readme` frontmatter and a one-paragraph orientation plus a list of MCP tools the package exposes.
