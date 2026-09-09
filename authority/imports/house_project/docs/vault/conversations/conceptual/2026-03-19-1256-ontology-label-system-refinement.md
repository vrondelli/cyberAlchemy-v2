---
tags: [ontology, vault, agents]
node_type: conceptual
is_session: true
layer: ontology
nature: [explanatory, reference]
status: consolidated
created: 2026-03-19
timestamp: 2026-03-19T12:56:50-03:00
conversation_id: 4ba9aed0-e776-402a-9021-45be4510e8bf
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: [OQ-1 — formal domain field for spec nodes]
version: 0.1.0
last_updated: 2026-03-19
expected_importance: 8
importance_rationale: "Refined ontology label system (node_type, layer, nature) resolving orthogonality issues, constitutional-scope change."
---

# Ontology Label System Refinement

**Date:** 2026-03-19 12:56 (UTC-3)
**Tags:** #ontology #vault #agents

## Summary

This session audited and significantly refined the vault's classification label system across three labels — `node_type`, `layer`, and `nature`. The starting point was a user observation that several documents had identical values across all three fields (e.g., `node_type: business`, `layer: business`, `nature: business`), which appeared to violate the orthogonality principle central to the vault's design. The session confirmed this was a genuine design flaw: `node_type: business` and `layer: business` were highly correlated, and `nature: business` and `nature: conceptual` shared names with `node_type` values, causing lexical confusion without adding independent information.

The session resolved these issues by eliminating `node_type: business` (absorbed into `conceptual` + `layer: market`), renaming `layer: business` to `layer: market` (more precise about external scope), removing `layer: cross` (replaced by multi-value), and renaming `nature` values to avoid lexical collision (`conceptual` → `explanatory`, `business` → removed). The `veracidade`/`convicção` confidence labels were scoped to `axiom` and `premise` only. The `node_type` framing was also clarified from "epistemic role" (jargon) to "document role" defined by a concrete challenge-response test.

All changes were applied to `ontology-conventions.md` (bumped to v1.1.0), the `docs/vault/business/` folder was renamed to `docs/vault/market/`, and all wikilinks and frontmatter values were updated across the vault in a batch operation. The `close-session.md` workflow was updated with the new label values and made canonical at `.agent/workflows/`, with symlinks from `agent-workflows/` and `~/.gemini/antigravity/global_workflows/` ensuring a single source of truth.

### Why `node_type: business` was removed

A document about the market plays the same **role** in the knowledge graph as any `conceptual` document — background context with no enforcement power, not a bet. The scope (external market vs. internal system) is already captured by `layer: market`. Keeping `node_type: business` would mean it correlates perfectly with `layer: market`, violating AX-ONT-2 (orthogonality). The value was eliminated and absorbed: `mission.md`, `fidc-and-credit-rights.md` etc. become `node_type: conceptual` + `layer: market`.

### Why `layer: business` became `layer: market`

"Business" is ambiguous in this context — everything the system does is business-related. "Market" is precise: it scopes to external reality (FIDC regulations, company mission, competitive context). The folder `docs/vault/business/` was renamed to `docs/vault/market/` to keep folder structure aligned with label values.

### Why `nature` was renamed

`nature: conceptual` and `nature: business` shared names with `node_type` values, creating lexical confusion. More importantly, `nature` isn't a classification label with high independent entropy — it's a **reading instruction for agents**: how should this document be consumed? The new values (`explanatory`, `procedural`, `reference`, `technical`) describe document shape and reader behavior, eliminating the vocabulary collision. `dictionary-business.md` was corrected from `nature: business` to `nature: reference` (it is literally a lookup table).

### Why `node_type` framing changed from "epistemic role" to "role"

"Epistemic role" is philosophy jargon that doesn't help practitioners. "Authority" (an intermediate proposal) was rejected because it bleeds into `veracidade`/`convicção`/`status` territory. The final framing: **role** = what the document does in the graph. The challenge-response test was added as an operational decision aid:
- Axiom → "That's foundational — revisiting it breaks everything"
- Premise → "Show me evidence and we'll update it"
- Constitution → "Change it through governance, not informally"
- Spec → "Update it if the code changed"
- Conceptual → "It's context — enrich or correct it"

### Why `veracidade`/`convicção` were scoped to `axiom` and `premise` only

The empirical usage confirmed these labels are underused: only 8 of 128 documents had them set, and `convicção: low` and `convicção: medium` were never used. More importantly, these labels only make semantic sense for documents that make an explicit claim or bet. `constitution`, `spec`, and `conceptual` don't need them — their lifecycle trust is captured by `status`. The conventions now say: omit these fields for `constitution`, `spec`, and `conceptual`.

## Key Decisions

- **Eliminate `node_type: business`** — absorbed into `node_type: conceptual` + `layer: market`. Removing correlation between node_type and layer.
- **Rename `layer: business` → `layer: market`** — more semantically precise. Folder renamed accordingly.
- **Remove `layer: cross`** — replaced by multi-value syntax (`layer: architecture, domain`). `cross` was redundant with multi-value.
- **Rename `nature` values** — `conceptual` → `explanatory`, `business` → removed. Framed as "reading instruction for agents."
- **`veracidade`/`convicção` scope** — only meaningful for `axiom` and `premise`. Should be omitted from all other node types.
- **`node_type` framing** — "document role" with challenge-response mental test, replacing "epistemic role" jargon.
- **`close-session.md` symlink** — single source of truth at `.agent/workflows/`; `agent-workflows/` and `~/.gemini/antigravity/global_workflows/` are symlinks.

## Files Changed

### Code

*(none)*

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-conventions.md` | `modified` | Major revision (v1.0.0 → v1.1.0): node_type framing, layer values, nature values, veracidade/convicção scope |
| `docs/vault/business/` → `docs/vault/market/` | `renamed` | Folder renamed to match label value |
| `docs/vault/market/mission.md` | `modified` | node_type: business→conceptual, layer: business→market, nature: business→explanatory |
| `docs/vault/market/fidc-and-credit-rights.md` | `modified` | layer: business→market, nature: conceptual, business→explanatory |
| `docs/vault/premises/business-axioms.md` | `modified` | layer: business→market, nature: business→explanatory |
| `docs/vault/premises/business-premises.md` | `modified` | layer: business→market, nature: business→explanatory |
| `docs/vault/ontology-constitution.md` | `modified` | nature: conceptual→explanatory |
| `docs/vault/ontology-axioms.md` | `modified` | nature: conceptual, technical→explanatory, technical |
| `docs/vault/ontology-premises.md` | `modified` | nature: conceptual, technical→explanatory, technical |
| `docs/vault/dictionary-business.md` | `modified` | layer: business→market, nature: business→reference |
| `docs/vault/conversations/*.md` (~8 files) | `modified` | nature: conceptual→explanatory (batch) |
| `docs/vault/**/*.md` (wikilinks) | `modified` | [[...]] → [[...]] (batch) |
| `.agent/workflows/close-session.md` | `modified` | Updated label values to match new schema |
| `agent-workflows/close-session.md` | `modified` | Replaced with symlink to .agent/workflows/ |
| `~/.gemini/antigravity/global_workflows/close-session.md` | `modified` | Replaced with symlink to .agent/workflows/ |

## Open Questions

- **OQ-1 (domain field for specs):** With 97 spec conversation documents, the specific business domain (aquisição, CCB, guarda/estoque) is currently captured only via free-text tags. A formal `domain: aquisicao | liquidacao | estoque | cross` field would be validated and filterable. Tagged as `promoted_candidates` for next ontology review.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology-conventions]] | `updates` | This session produced the v1.1.0 revision of the classification schema |
| [[ontology-axioms]] | `validates` | The label eliminations validate AX-ONT-2 (orthogonality) and AX-ONT-1 (minimize retrieval entropy) |
| [[ontology-premises]] | `updates` | PM-ONT-2 (adaptive labels) was exercised — the system corrected correlated labels as predicted |
