---
tags: [agents, ontology, token-efficiency, context-management, domain-vocabulary]
node_type: audit
is_session: true
layer: [ontology, architecture]
nature: [technical, reference]
status: active
created: 2026-03-27
timestamp: 2026-03-27T19:01:00-03:00
expires: 2026-05-26
conversation_id: unknown
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [docs/vault/conceptual/mission.md, docs/vault/dictionary-business.md]
promoted_candidates: [system-premises.md]
expected_importance: 7
importance_rationale: "Audited and corrected the agent infrastructure for token efficiency, fixed mission drift, anchored a missing domain term, and produced a discovery document for multi-agent context delegation."
---

# Agent Infrastructure Audit — Token Efficiency & Vocabulary

**Date:** 2026-03-27 19:01 (UTC-3)
**Tags:** #agents #ontology #token-efficiency #context-management #domain-vocabulary

## Summary

This session had two interlocking threads: auditing and improving the agent infrastructure for token efficiency, and then using that improved infrastructure to demonstrate the system's navigability through live questions.

### Token Efficiency Audit of CLAUDE.md and Agent Infrastructure

**Problem:** CLAUDE.md and related files had accumulated redundant content that was being loaded every session regardless of task type. The `<!-- gitnexus:start/end -->` block (~100 lines) was the biggest offender — loaded unconditionally, duplicating content already present in the skills system and in `.agent/workflows/gitnexus.md`.

**What was considered:** Whether to trim the block vs. delete it entirely. The workflow file already pointed to skills for all detailed GitNexus guidance — there was no unique value left in the inline block.

**Decision:** Remove the block from CLAUDE.md entirely, delete `.agent/workflows/gitnexus.md`, and have CLAUDE.md routes point directly to skills. One authoritative source per topic.

**Done:** Removed gitnexus block from CLAUDE.md, deleted `.agent/workflows/gitnexus.md`, updated routes 2 and 4 to point to skills directly.

---

### AGENTS.md

**Problem:** AGENTS.md was a stale copy of the old CLAUDE.md — still carrying section 0 and the injected block that CLAUDE.md had already dropped. It was cleaned up, then the question arose: should it exist at all?

**Decision:** No. AGENTS.md is a convention for non-Claude agents (Gemini CLI, Codex). In a Claude Code-only project it is pure maintenance burden — two files to keep in sync, both needing updates when one changes. The drift observed this session was the proof.

**Done:** Cleaned up redundancies. AGENTS.md still exists but should be formally deleted (see Gaps).

---

### close-session.md Trim

**Problem:** The `2a — Classify` section in close-session.md duplicated the full tags/layer/nature definitions from `ontology-conventions.md` — about 20 lines loaded every time a session is closed.

**Decision:** Replace the duplicate content with a single pointer to ontology-conventions.md. Keep only the node_type decision tree (session-specific guidance not in conventions).

**Done:** Edited close-session.md accordingly.

---

### Standing Rule — Domain Vocabulary

**Problem:** An agent encountering an unknown business term had no standing instruction to check the dictionary. Route 8 existed but was reactive ("when you encounter an unfamiliar term"). The desired behavior is proactive — check the dictionary before using or explaining any business/system term.

**Decision:** Add a standing rule above the routes in CLAUDE.md. Standing rules fire always, not just when the agent is already lost. A route is reactive; a standing rule is proactive.

**Done:** Added `## Standing Rule — Domain Vocabulary` to CLAUDE.md with the check-flag-add protocol.

---

### Dictionary — EligibilityFilter and FilterResult

**Problem:** `EligibilityFilter` had no vault anchor despite being a central domain concept referred to by at least 4 names across the codebase (`eligibility_criteria`, `filter_criteria`, `eligibility filter gates`, `filter gates`). This was discovered via a live navigability test — answering "what is EligibilityFilter and how many exist?" required 4 tools and 5 files. The existing `Filtros` entry described outcomes (`FilterResult`) not rules, and the heading was imprecise.

**Decision:** Add `EligibilityFilter` as a first-class dictionary entry with all aliases documented. Rename `Filtros` → `FilterResult` to match the actual code name.

**Done:** Both changes made, dictionary version bumped to 0.4.0.

---

### Mission Phase 2 Correction

**Problem:** mission.md described Phase 2 as "proximity to origin of credit" — which is actually a Phase 4-5 ambition. The real Phase 2 is linking bank extracts to contratos for reconciliation.

**Decision:** Correct it. Spec drift in a foundational document compounds.

**Done:** Phase 2 rewritten. Long-term vision section unchanged.

---

### Multi-Agent Context Delegation Discovery

**Problem:** The live navigability test surfaced a pattern: dense, bounded context domains are better served by specialized subagents than by a single agent loading everything. The observation that different tasks need different "context levels" (building software vs. approving a batch) had no formal home in the system.

**Alternatives considered:** Whether this was a conceptual note (premise candidate) or a full discovery. Given the operational specificity of the 6 context level design, a discovery document was more appropriate.

**Done:** Created `specs/ontology/discovery-context-delegation.md` — covers the pattern conceptually (MoE, Agentic RAG, Society of Mind, Orchestrator/Subagent references), maps the 6 pre-existing context domains in this repo, and drafts a delegation protocol.

---

## Epistemic Impact

**P-SYS-6 validated cross-domain:** "Implied knowledge is lost knowledge" was shown to apply to the agent infrastructure itself, not just domain code. The EligibilityFilter gap — a term used in 4+ forms without a dictionary anchor — was the exact failure mode P-SYS-6 describes. This generalization is not yet recorded on the P-SYS-6 node (see Gaps).

**Mission spec drift fixed:** `docs/vault/conceptual/mission.md` Phase 2 was corrected. Prior description was a Phase 4-5 ambition masquerading as the next deliverable.

**Promoted candidates:**
- "Dense context domains require specialized subagents" → candidate for a new P-SYS premise once the pattern is validated operationally.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `CLAUDE.md` | Modified | Removed gitnexus block reference in routes 2 and 4; added standing rule for domain vocabulary; removed section 0 |
| `AGENTS.md` | Modified | Removed section 0, injected gitnexus block, and gitnexus.md references |
| `.agent/workflows/gitnexus.md` | Deleted | Content fully duplicated by skills; deleted to eliminate ~100 lines loaded per applicable session |
| `.agent/workflows/close-session.md` | Modified | Removed duplicate tag/layer/nature definitions; replaced with pointer to ontology-conventions.md |
| `docs/vault/dictionary-business.md` | Modified | Added EligibilityFilter entry with all aliases; renamed Filtros → FilterResult; version 0.4.0 |
| `docs/vault/conceptual/mission.md` | Modified | Phase 2 corrected from "proximity to origin" to "bank extract → contrato reconciliation" |
| `specs/ontology/discovery-context-delegation.md` | Created | New discovery: multi-agent context delegation pattern for dense context domains |

---

## Connections

| Document | Type | Description |
|---|---|---|
| `docs/vault/premise/system-premises.md` (P-SYS-6) | `validates` | Session confirmed P-SYS-6 applies to agent infrastructure, not just domain knowledge |
| `docs/vault/conceptual/mission.md` | `contextualizes` | Phase 2 correction made this session |
| `specs/ontology/discovery-context-delegation.md` | `contextualizes` | Discovery produced this session |
| `docs/vault/dictionary-business.md` | `contextualizes` | EligibilityFilter and FilterResult entries added this session |

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Dictionary coverage sweep — if EligibilityFilter was missing, other high-frequency terms likely are too. One-pass audit of all spec files against dictionary-business.md | This session | HIGH | Open |
| Delete AGENTS.md — confirmed no value in Claude Code-only project | This session | MEDIUM | Open |
| Annotate P-SYS-6 to note the principle applies to agent infrastructure, not just domain knowledge | This session | LOW | Open |
| Context delegation discovery needs a next step — if the pattern is to be tested operationally, assign an owner and trigger condition | This session | MEDIUM | Open |
