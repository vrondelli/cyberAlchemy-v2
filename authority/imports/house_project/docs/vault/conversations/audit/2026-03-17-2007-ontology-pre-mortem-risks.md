---
tags: [ontology, vault]
node_type: audit
is_session: true
layer: ontology
nature: explanatory
status: active
created: 2026-03-17
timestamp: 2026-03-17T20:07:56-03:00
expires: 2026-05-16
conversation_id: 31a27c5f-c4ff-44b0-8f68-b0790ea1d452
#
expected_importance: 7
importance_rationale: "Pre-mortem risk analysis for ontology design, identifying failure modes before they manifest."
version: 0.1.0
last_updated: 2026-03-17
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-17
---

# Ontology Pre-Mortem Risk Analysis

**Date:** 2026-03-17 20:07 (UTC-3)
**Tags:** #ontology #vault

## Summary

This session produced a comprehensive pre-mortem risk analysis for the ontology system. The document (`specs/ontology/risks.md`) assumes the system has failed at three time horizons — 6 months, 1 year, and 2 years — and names 18 specific failure modes, their root causes, early warning signals, and mitigations.

The session also attempted to produce an overview/explainer document (`specs/ontology/overview.md`) describing what the ontology system is, why it matters, and how it will be built. The user rejected this document and deleted it before requesting session closure.

The pre-mortem document was initially created with a context section consisting only of summary tables. The user requested a richer high-level narrative layer, and the document was rewritten to include full contextual paragraphs for each risk under each time horizon, with each risk linking to its detailed analysis section below.

### Pre-Mortem Structure and Approach
- **Problem/Goal:** Identify failure modes before they happen, using a pre-mortem technique (assume failure, name what went wrong).
- **Decision:** Organize risks by three time horizons reflecting fundamentally different failure categories: 6 months (execution/adoption), 1 year (value delivery), 2 years (organizational sustainability). Add early warning signals to each risk to make the document operationally useful, not just a worry list.
- **Changes:** Created `specs/ontology/risks.md` with 18 risks, each containing a narrative failure scenario, root cause analysis, early warning signals, and concrete mitigations.

### Context Section Rewrite
- **Problem/Goal:** The initial context section was a set of summary tables — compact but lacking the narrative needed for someone to understand *why* each risk matters at its horizon.
- **Decision:** Rewrite the context section as a rich two-layer document: narrative paragraphs (context) linking to technical deep-dives (detail). Each horizon gets a thematic introduction explaining the systemic pattern, followed by individual risk narratives.
- **Changes:** Expanded the context section from ~45 lines to ~180 lines of narrative. Summary tables moved to end of each horizon as reference.

### Failed Overview Document
- **Problem/Goal:** Create a concise explainer of the ontology system for newcomers.
- **Decision:** User rejected the produced document as not meeting quality expectations and deleted it.
- **Changes:** `specs/ontology/overview.md` was created and immediately deleted. No content survives.

Key outputs:
- `specs/ontology/risks.md` — 18-risk pre-mortem analysis across 3 time horizons

## Key Decisions

- **Pre-mortem structure:** 3 time horizons (6mo/1yr/2yr), each representing a different failure category (inertia → premature sophistication → organizational unsustainability).
- **Early warning signals included:** Each risk has observable indicators that appear before the full failure, making the document an operational monitoring plan.
- **Two-layer document format:** Context section (narrative, high-level, readable by humans and agents) links to detailed analysis (failure scenarios, early warning signals, mitigations). Both layers cover the same 18 risks.
- **Risk severity/likelihood ratings:** 🔴 Critical / 🟡 High / 🟢 Medium for severity; ⚠️ High / 🟡 Medium / 🟢 Low for likelihood.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/risks.md` | `created` | Pre-mortem risk analysis: 18 risks across 3 time horizons with failure scenarios, early warning signals, and mitigations |
| `specs/ontology/overview.md` | `created → deleted` | Ontology explainer document rejected by user |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-constitution.md]] | `contextualizes` | Risks reference the ontology's intellectual foundations (Zettelkasten, Bayesian epistemology) as potential sources of adoption friction (R-03, R-14) |
| [[vault/ontology-conventions.md]] | `contextualizes` | Risks reference the 7-label classification system, open questions OQ-1 through OQ-4, and edge type catalog as risk surfaces (R-02, R-03, R-05, R-09) |
| [[vault/ontology-architecture-draft.md]] | `contextualizes` | Risks reference the agent architecture, trust gates, and build sequence (R-06, R-07, R-08) |
| [[ontology/data-foundations/discovery-data-foundations.md]] | `contextualizes` | Risks reference the data substrate, `sync_vault_node()`, and phased build sequence (R-01, R-10, R-12, R-18) |
| [[ontology/trust-gates/discovery-trust-gates.md]] | `contextualizes` | Risks reference the trust gate architecture and calibration challenges (R-07, R-08) |
| [[ontology/roles/discovery-agency-system.md]] | `contextualizes` | Risks reference the 4-agent architecture and premature construction danger (R-06, R-12, R-13) |
| [[ontology/backlog.md]] | `contextualizes` | Risks reference the 9 unresolved backlog items as classification debt (R-02) |
