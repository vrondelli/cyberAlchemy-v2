---
tags: [ontology, vault]
node_type: conceptual
is_session: true
layer: ontology
nature: explanatory
status: consolidated
created: 2026-03-17
timestamp: 2026-03-17T20:09:24-03:00
conversation_id: e1a21f7b-01b8-4de1-a391-8d02453bda45
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [docs/vault/premises/ontology-axioms.md, docs/vault/premises/ontology-premises.md]
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 9
importance_rationale: "Formalized ontology axioms and restructured conventions, constitutional-level changes to the vault."
---

# Formalizing Ontology Axioms and Restructuring Conventions

**Date:** 2026-03-17 17:01 (UTC-3)
**Tags:** #ontology #vault

## Summary

This session formalized the mathematical and philosophical foundations of the ontology system. It started with a review of `ontology-conventions.md`, progressed through a major restructure of that document, and culminated in the creation of `ontology-axioms.md` — the first formal axiom document for the ontology layer. 7 axioms and 8 premises were proposed, each grounded in information theory with Lindy-effect references. The session also produced an open questions catalog and a backlog item for formalizing those questions.

The most important outcome is the explicit framing of the ontology as an **adaptive, entropy-minimizing system** — not a static schema. This is now stated in the Objective of `ontology-conventions.md` and formalized as AX-ONT-1.

### Conventions Document Restructure

- **Problem/Goal:** The document mixed label schema with design principles, had the detailed reference table at the top drowning the context, and lacked a clear mathematical objective.
- **Decision:** Rewrite as context-first sections with tables in appendices. Reframe the Objective as adaptive/entropy-minimizing. Add mathematical appendix.
- **Changes:** Rewrote `ontology-conventions.md`: new Objective (adaptive, entropy-minimizing), tables moved to 4 appendices (A: Math, B: Label Values, C: Edge Types, D: Quick Reference), `node_type` definition fixed (removed "record of a conversation"), Orthogonality Principle split into Level 1 (Labels) and Level 2 (Nodes).

### Ontology Axioms Formalization

- **Problem/Goal:** The ontology system had no formalized axioms or premises. Principles like orthogonality and entropy minimization were scattered across documents.
- **Decision:** Create dedicated axiom and premise documents following the existing format (`system-axioms.md` pattern). Each axiom has a Contexto (concise, direct) and a Fundamentação Técnica (math + 2-3 Lindy references).
- **Changes:** Created `docs/vault/premises/ontology-axioms.md` with 7 axioms (AX-ONT-1..7). Produced artifact proposals for 8 premises (P-ONT-1..8) and 11 open questions (5 conceptual, 6 engineering).

### Document Split Proposal

- **Problem/Goal:** `ontology-conventions.md` mixes schema (what labels exist) with principles (why they exist) — these have different `node_type`s.
- **Decision:** Proposed splitting into 4 documents: `ontology-labels.md` (spec/reference), `ontology-conventions.md` (constitution), `ontology-axioms.md` (axiom), `ontology-premises.md` (premise). Axioms document was created this session.
- **Changes:** No split executed yet — only the axioms document was created. The split is a future task.

Key outputs:
- `docs/vault/premises/ontology-axioms.md` — 7 axioms with math foundations
- `docs/vault/ontology-conventions.md` — restructured with appendices
- `specs/ontology/backlog.md` — new item for formalizing open questions
- Artifact proposals for premises and open questions (in conversation brain)

## Key Decisions

- **Ontology framed as adaptive entropy-minimizing system:** The Objective of `ontology-conventions.md` now states the system's mathematical goal explicitly.
- **Tables moved to appendices:** All detailed value tables (7 of them) moved to appendices; main body is context-first with references.
- **AX-ONT-3 demoted to premise (P-ONT-6):** "Frontmatter is the single source of truth" is an engineering decision, not a foundational truth. It derives from a more fundamental single-source principle.
- **P prefix for premises:** Premises use P-ONT-N (not B-ONT-N) for clarity.
- **New axiom AX-ONT-5 (explicit questions):** Mapping unknowns increases system information — formalized via maximum entropy principle (Jaynes 1957).
- **New axiom AX-ONT-7 (navigable density):** The vault is a graph where proximity is relevance and random walks converge to understanding — formalized via Markov chains and PageRank.
- **References selected by Lindy effect:** All references are 33–120 years old (Markov 1906, Wittgenstein 1921, Shannon 1948, etc.).
- **`node_type` fixed:** Removed "record of a conversation" from the definition — sessions are classified by their epistemic output, not their format.

## Files Changed

### Code

No code files were changed in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-conventions.md` | `modified` | Major restructure: adaptive objective, tables to appendices, math appendix, node_type fix |
| `docs/vault/premises/ontology-axioms.md` | `created` | 7 ontology axioms with mathematical foundations and Lindy references |
| `specs/ontology/backlog.md` | `modified` | Added item: formalize open questions about the ontology system |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Create `ontology-premises.md` vault doc | This session | ⚠️ HIGH | Open — artifact exists, needs to become vault doc |
| Split `ontology-conventions.md` into labels + conventions | This session | MEDIUM | Open — proposal discussed, not yet executed |
| Formalize 11 open questions as vault nodes | This session | MEDIUM | Open — backlog item added |
| Create label catalog document | This session | LOW | Open — needed for AX-ONT-6 (adaptive system) |

## Open Questions

- How to measure orthogonality between labels with small sample sizes? (OQ-ONT-1)
- How to keep labels updated as the vault grows? (OQ-ONT-6)
- Where should open questions live — as nodes, frontmatter fields, or document sections? (OQ-ONT-2)
- Should the conventions document split happen now or after premises are formalized?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `updates` | Major restructure: adaptive objective, appendices, math foundations |
| [[vault/premises/ontology-axioms.md]] | `derives-from` | This session produced the axioms document |
| [[vault/ontology-constitution.md]] | `contextualizes` | Constitution provides intellectual foundations; axioms formalize the mathematical commitments |
| [[vault/confidence-levels.md]] | `contextualizes` | Maturity lifecycle implements AX-ONT-6 (adaptivity) |
| [[ontology/backlog.md]] | `updates` | Added item for formalizing open questions |
