---
tags: [vault, ontology, agents]
node_type: conceptual
is_session: true
layer: ontology
nature: [procedural, explanatory]
status: active
created: 2026-03-27
timestamp: 2026-03-27T21:00:00-03:00
expires: 2026-05-26
conversation_id:
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - .agent/workflows/close-session.md
  - docs/vault/agent-navigation.md
  - docs/vault/ontology-conventions.md
promoted_candidates:
  - "Sessions are provenance not reference — candidate for standalone premise node"
expected_importance: 8
importance_rationale: "Rewrote close-session workflow to anchor session creation in provenance preservation (P-ONT-8) and introduced Heuristic 3 governing when agents should and should not read sessions."
---

# Close-Session Rewrite and Sessions-As-Provenance Principle

**Date:** 2026-03-27 21:00 (UTC-3)
**Tags:** #vault #ontology #agents

## Summary

This session had a single unifying theme: clarifying what session nodes are *for* and making every workflow and navigation guide reflect that purpose unambiguously. The work touched three files and zero lines of application code, but produced changes with lasting impact on how future agents will read and write the vault.

The session began with the user asking why sessions exist in the vault. Research into P-ONT-8 and ontology-conventions.md revealed that sessions are **provenance** — they preserve the reasoning chain behind decisions so the "why" survives alongside the "what". The `is_session: true` flag is orthogonal to `node_type` and `layer`, capturing format (conversation) without losing the epistemic role.

This understanding exposed a gap: the close-session workflow told agents *how* to create sessions but never *why*. The template was heavy with redundant sections, and the Summary — where the actual provenance lives — was buried alongside boilerplate. A second gap was that nothing in the vault told agents when to read sessions or, more importantly, when *not* to.

### Rewriting close-session.md
- **Problem/Goal:** The workflow lacked a stated purpose, was too heavy (~15 frontmatter fields, 8+ sections), and gave equal weight to mechanical metadata and the narrative Summary.
- **Alternatives considered:** Patching the existing file with a Purpose paragraph vs. full restructure. Patch was rejected because the weight problem was structural.
- **Decision:** Complete rewrite around the flow: what happened → what it means for the knowledge graph → what it touched → what links to what. Summary becomes Step 1 (the centerpiece). Classification and structural sections are delegated to a lighter subagent. A self-check quality gate ("Could someone reading only this node understand why the decisions were made?") replaces the old structural checklist.
- **Changes:** Dropped files-changed tables (git is authoritative), dropped satisfaction score (telemetry, not provenance), dropped Key Decisions section (redundant with good Summary). Added Purpose section anchored to P-ONT-8. Made model references agnostic ("lighter model" instead of "Opus"/"Sonnet").

### Establishing that sessions are provenance, not reference
- **Problem/Goal:** Nothing in the vault told agents when to read sessions. Agents could waste tokens reading session nodes to understand how the system works, when specs and constitutions are the correct source.
- **Decision:** Add explicit guidance: "Do NOT read session nodes to understand how the system works. Only read sessions when tracing why a specific decision was made."
- **Changes:** Added Heuristic 3 ("Sessions Are Provenance, Not Reference") to `agent-navigation.md` with `Confidence: High | Veracidade: High`. Added "When to read sessions" callout to `ontology-conventions.md` after the `is_session` explanation. Added cross-reference in close-session Purpose section.

### Session token cost and future pruning
- **Problem/Goal:** User asked about the token cost of creating sessions. Analysis showed ~1,400 output tokens per session, ~85k tokens across 62 sessions from one week.
- **Decision:** Split work: primary model writes Summary (the irreplaceable part), lighter subagent handles mechanical sections. Also discussed a future retention policy driven by `expected_importance` — high-importance sessions kept forever, low-importance ones expire or merge into digest nodes.
- **Changes:** close-session.md now instructs delegation to a lighter model in Step 2.

## Epistemic Impact

- **Validates [P-ONT-8](../premise/ontology-premises.md):** The rewrite explicitly anchors close-session's purpose to P-ONT-8 (sessions as provenance). This session is itself an instance of P-ONT-8 — it produced changes to governance documents.
- **Validates `is_session` orthogonality design** in [ontology-conventions.md](../ontology-conventions.md): Confirmed that treating `is_session` as an orthogonal boolean (rather than a `node_type`) is the correct design.
- **Creates new navigational principle** in [agent-navigation.md](../agent-navigation.md): Heuristic 3 is new knowledge not previously encoded in the vault. Candidate for promotion to a premise node.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.agent/workflows/close-session.md` | modified | Complete rewrite: Purpose section, Summary as centerpiece, subagent delegation, self-check gate, removed redundant sections |
| `docs/vault/agent-navigation.md` | modified | Added Heuristic 3 ("Sessions Are Provenance, Not Reference"); renumbered 4–9 |
| `docs/vault/ontology-conventions.md` | modified | Added "When to read sessions" callout after `is_session` explanation |

## Connections

- `validates` → [P-ONT-8](../premise/ontology-premises.md) (sessions kept forever as provenance)
- `validates` → [ontology-conventions.md](../ontology-conventions.md) (`is_session` orthogonality design)
- `contextualizes` → [agent-navigation.md](../agent-navigation.md) (Heuristic 3 introduced here)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Elevate "sessions are provenance, not reference" to a standalone premise node | This session | MEDIUM | open |
| Define session retention policy based on `expected_importance` (expire/merge low-importance sessions) | This session | MEDIUM | open |

## Open Questions

- Should the retention policy be a constitution (enforceable) or a premise (working bet to test)?
- What is the right threshold for auto-expiring sessions — importance 0-2? 0-4?
