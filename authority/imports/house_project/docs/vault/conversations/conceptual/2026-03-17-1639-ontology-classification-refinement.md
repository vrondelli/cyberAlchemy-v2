---
tags: [ontology, vault]
node_type: conceptual
is_session: true
layer: ontology
nature: explanatory
status: consolidated
created: 2026-03-17
timestamp: 2026-03-17T16:39:27-03:00
conversation_id: 925ecbae-77be-4794-a9ae-7681ba212198
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/data-foundations/discovery-data-foundations.md]
promoted_candidates: [docs/vault/ontology-conventions.md]
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 8
importance_rationale: "Refined ontology classification system (node_type, layer, nature), shaping the entire vault taxonomy."
---

# Refining the Ontology Classification System

**Date:** 2026-03-17 16:39 (UTC-3)
**Tags:** #ontology #vault

## Summary

This session focused entirely on refining and formalizing the ontology classification system — the labeling rules that every vault document must follow. It started with an audit of all existing classification labels, progressed through several rounds of user feedback, and culminated in a major rewrite of `ontology-conventions.md` that now precisely defines all 7 labels, their relationships, and their operational criteria.

The session also restructured `discovery-data-foundations.md` to separate contextual motivation from implementation details (SQL schemas and Python code moved to appendices), created a dedicated ontology backlog at `specs/ontology/backlog.md` with 9 tracked items, and updated the `/close-session` workflow to align with the new classification rules.

The most important outcome is the clarity achieved around the orthogonality of the 7 labels — specifically, how `node_type`, `status`, and `convicção` differ (all three relate to "trust" but measure different things), and how `nature` is about structural format not epistemic weight.

### Ontology Labels Audit

- **Problem/Goal:** Vault documents had inconsistent classification — `node_type` was rarely declared, tags duplicated node types, `layer: session` violated orthogonality, and `audience` was used but undefined.
- **Decision:** Formalized the classification into 7 independent labels. Removed `session` from `layer` values, renamed `meta` to `ontology`, dropped `audience` in favor of a proposed `objective` field (open question). Tags should be purely topical — epistemic-role tags like `#axiom` belong in `node_type`.
- **Changes:** Created `ontology-labels-audit.md` artifact documenting all findings and proposals. Addressed 14+ user comments across 2 review rounds.

### Conventions Document Rewrite

- **Problem/Goal:** `ontology-conventions.md` listed label values in tables but didn't explain why each label exists, what unique information it adds, or how it differs from similar labels.
- **Decision:** Each label section now has three parts: "What it is", "Why it matters", "How it differs from others." The 7-label quick reference table was moved to the top of the document so readers get answers before nuances.
- **Changes:** Rewrote `ontology-conventions.md` across 3 iterations (183 → 398 lines). Added: node_type vs status vs convicção comparison table, nature correlation analysis, draft axiom callout, precise veracidade/convicção operational criteria with examples, veracidade criteria per node_type, Open Questions section with 4 tracked items.

### Data Foundations Restructure

- **Problem/Goal:** `discovery-data-foundations.md` mixed introductory context with SQL schemas and Python function signatures, making it hard for a non-technical reader to understand the architecture.
- **Decision:** Separate context from implementation. The main body explains the "what and why"; appendices hold the "how" (SQL, Python, queries).
- **Changes:** Restructured into 4 phases + 3 appendices (A: Schema Definitions, B: Sync Pipeline, C: Query Examples). Added Origin section linking to the source session. Each section references its appendix.

### Ontology Backlog Creation

- **Problem/Goal:** Multiple action items from the labels audit needed tracking — code enforcement of status hierarchy, `/close-session` workflow updates, tag cleanup, spec migration, etc.
- **Decision:** Create a dedicated backlog following the same format as the existing CCB spec backlog.
- **Changes:** Created `specs/ontology/backlog.md` with 9 items: status hierarchy enforcement, close-session update, node_type declarations, tag cleanup, veracidade criteria, spec migration, "has been discussed" tracking, dictionary status fix, outdated status removal.

### Close-Session Workflow Update

- **Problem/Goal:** The workflow used `layer: session` (removed), `nature: reference` (incorrect default), and `tags: [session, ...]` (duplicating node_type). It also skipped test-only sessions, losing business context.
- **Decision:** Test-only sessions now create nodes with business context. Classification follows `ontology-conventions.md`. Skip linking to other session nodes (too noisy). Added a "Tests Added/Modified" section requiring business rule justification.
- **Changes:** Rewrote `.agent/workflows/close-session.md`. Added Step 3 (classify session), updated template to dynamic layer/nature, removed session from tags, added test section in template.

### Objective and Index Sections

- **Problem/Goal:** Vault documents lacked a clear statement of purpose and were hard to navigate.
- **Decision:** Every vault document should have an `## Objective` section explaining why it exists and an `## Index` for navigation.
- **Changes:** Added Objective and Index sections to all 15 non-conversation vault documents.

Key outputs:
- `ontology-conventions.md` — fully rewritten classification system
- `specs/ontology/backlog.md` — 9 tracked items
- `discovery-data-foundations.md` — restructured with appendices
- `.agent/workflows/close-session.md` — aligned with conventions

## Key Decisions

- **`session` removed from `layer`:** A session about architecture should be `layer: architecture`, not `layer: session`. The node_type already says it's a session.
- **`meta` renamed to `ontology`:** Documents about the vault itself get `layer: ontology`.
- **Multi-value `layer` allowed:** Sessions spanning multiple topics use comma-separated layers.
- **`audience` dropped, `objective` proposed:** `product` isn't an audience. A one-line `objective` frontmatter field is more useful for agents than role-based filtering.
- **Draft axioms are valid and important:** A `node_type: axiom` with `status: draft` represents a proposed paradigm shift.
- **Tags are purely topical:** Epistemic tags like `#axiom` belong in `node_type`, not tags.
- **`nature` means structural format:** "If you printed it, what would it look like?"
- **Veracidade ≠ usefulness:** Veracidade is "how tested against reality." Usefulness is closer to convicção.
- **Test-only sessions create nodes:** Tests validate business rules — they deserve context.
- **Skip session-to-session links:** Existing sessions are noisy. Link only to non-session vault nodes.

## Files Changed

### Code

No code files were changed in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-conventions.md` | `modified` | Major rewrite: 7-label quick reference, precise value definitions, open questions section |
| `specs/ontology/data-foundations/discovery-data-foundations.md` | `modified` | Restructured: context separated from implementation, appendices added |
| `specs/ontology/backlog.md` | `created` | 9 backlog items from labels audit |
| `.agent/workflows/close-session.md` | `modified` | Aligned with conventions, added test node support |
| `docs/vault/premises/system-axioms.md` | `modified` | Added Objective and Index |
| `docs/vault/premises/business-axioms.md` | `modified` | Added Objective and Index |
| `docs/vault/premises/system-premises.md` | `modified` | Added Objective and Index |
| `docs/vault/premises/business-premises.md` | `modified` | Added Objective and Index |
| `docs/vault/architecture/event-system-constitution.md` | `modified` | Added Objective and Index |
| `docs/vault/architecture/development-practices-constitution.md` | `modified` | Added Objective and Index |
| `docs/vault/architecture/folder-structure-constitution.md` | `modified` | Added Objective and Index |
| `docs/vault/market/mission.md` | `modified` | Added Objective and Index |
| `docs/vault/market/fidc-and-credit-rights.md` | `modified` | Added Objective and Index |
| `docs/vault/concepts/event-system-foundations.md` | `modified` | Added Objective and Index |
| `docs/vault/dictionary-business.md` | `modified` | Added Objective and Index |
| `docs/vault/ontology-architecture-draft.md` | `modified` | Added Objective and Index |
| `docs/vault/confidence-levels.md` | `modified` | Added Objective and Index |
| `docs/vault/human-navigation.md` | `modified` | Added Objective and Index |
| `docs/vault/agent-navigation.md` | `modified` | Added Objective and Index |
| `docs/vault/ontology-constitution.md` | `modified` | Removed outdated content that duplicated conventions |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Enforce status hierarchy rule in code | Labels audit | ⚠️ HIGH | Open |
| Update `/close-session` backfill for existing sessions | Labels audit | MEDIUM | Open |
| Add `node_type` to all vault documents | Labels audit | ⚠️ HIGH | Open |
| Clean up tags that duplicate `node_type` | Labels audit | MEDIUM | Open |
| Define veracidade criteria for constitutions | Labels audit | MEDIUM | Open |
| Migrate specs into vault | Labels audit | LOW | Deferred |
| Define "has been discussed" tracking | Labels audit | MEDIUM | Open |
| Decide `audience` vs `objective` field | Labels audit | MEDIUM | Open |
| Add `domain` field for spec nodes? | Labels audit | LOW | Open question |

## Open Questions

- Should `objective` replace `audience` entirely, or do we want both?
- Should we add a `domain` frontmatter field for spec nodes, or are tags sufficient?
- How should "has been discussed" be tracked for `exploratory` status? (Manual vs event-based)
- What is the precise operational definition of `veracidade` for constitutions?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `updates` | Major rewrite of entire classification system |
| [[vault/ontology-constitution.md]] | `refines` | Removed outdated content, clarified boundary with conventions |
| [[vault/confidence-levels.md]] | `contextualizes` | Added status entry/exit criteria in conventions that extend this doc |
| [[ontology/data-foundations/discovery-data-foundations.md]] | `refines` | Restructured document, separated context from implementation |
| [[vault/ontology-architecture-draft.md]] | `contextualizes` | Referenced as source architecture for data foundations |
