---
tags: [ontology, domain-tagging, governance, skills]
node_type: discovery
is_session: true
layer: governance
nature: procedural, reference
status: active
created: 2026-04-07
timestamp: 2026-04-07T11:30:00Z
expires: 2026-06-06
conversation_id: a7k2p-domain-tagging-skill-routing
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: ["domain-tagging-workflow-separation-premise"]
expected_importance: 9
importance_rationale: Updated CLAUDE.md routing to embed domain vocabulary practices into core workflows—Route 3 (planning) and Route 4 (code editing)—establishing enforceable agent behavior for business-aware tagging and vocabulary governance.
---

# Domain Tagging: Skill Split and Routing Resolution

**Date:** 2026-04-07 11:30 (UTC)  
**Tags:** #ontology #domain-tagging #governance #skills

---

## Summary

A previous session created `domain-tagging-constitution.md` to formalize rules for linking business vocabulary to code via `@biz`/`@sys` docstring tags. However, the constitution was not paired with a corresponding skill file for agent execution. This session identified that the constitution addresses two distinct concerns—code tagging during editing (Route 4) and dictionary maintenance during planning (Route 3)—that required different activation contexts and audiences.

The work involved: (1) reading both `domain-tagging-constitution.md` and the paired `commit-message.md` skill to understand the constitution-to-skill pattern; (2) recognizing that the constitution's dual concerns required splitting rather than a single monolithic skill; (3) creating two focused skills that activate in different routes: `domain-tagging-code.md` for Route 4 (Refactoring/Writing Code) and `domain-dictionary.md` for Route 3 (Specs/Planning/Discovery); (4) updating CLAUDE.md Routes 3 and 4 to explicitly reference both skills and the domain-tagging constitution, embedding these practices into core agent workflows rather than treating them as standalone activities.

The session also discovered that `commit-message-constitution` is similarly unrouted in CLAUDE.md—a pattern that suggests constitutions-to-skills mapping and routing need to be kept in sync as more procedural rules are added.

---

## Epistemic Impact

### Foundational Beliefs Validated & Questioned

**Validates:** `docs/vault/constitution/development-practices-constitution.md` — The session confirmed that procedural rules (like tagging conventions) belong in constitutions, not skills, but that **routing in CLAUDE.md must direct agents to the right constitution at the right time**. Agents need to encounter domain tagging at edit time (Route 4), not as a standalone activity. This reinforces the separation of concerns: constitutions define rules; routing determines when agents apply them.

**Questions:** `docs/vault/ontology-conventions.md` — The session surfaced an implicit routing assumption: that a constitution maps to exactly one route. The domain-tagging case reveals that one constitution can serve multiple routes depending on context (code editing vs. planning). This is not a contradiction but an unexamined assumption worth documenting in future routing discussions.

### Spec Drift Discovered

**`docs/vault/CLAUDE.md`** — Route 4 (Refactoring/Writing Code) currently directs agents to only technical constitutions (development-practices, folder-structure, event-system) but omits domain and vocabulary governance rules (domain-tagging). The session proposed adding `domain-tagging-code.md` skill to Route 4 as a mandatory check, but this requires explicit routing addition. The spec is incomplete for agents practicing domain-aware editing.

Similarly, Route 3 (Specs/Planning/Discovery) mentions the `spec-writing.md` skill but does not explicitly reference dictionary structure or vocabulary governance, making it unclear when agents should apply domain-dictionary patterns.

### Promoted Candidates

**Future premise:** "Business vocabulary tagging is most effective when separated by workflow: vocabulary discovery and planning (vocabulary engineering), enforcement during code authorship (embedded in coding practices)."

This premise should be formally documented once CLAUDE.md routing is updated and the skills are in active use. It will explain why the split occurred and prevent future consolidation attempts.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.claude/skills/custom/domain-tagging-code.md` | created | New skill extracted from dual-concern `domain-tagging.md`. Guides code authors in applying `@biz` tags to symbols during editing (Route 4 binding). Focuses on tag placement, schema compliance, dictionary dependency, anti-patterns, and multi-term problem handling. ~220 lines. |
| `.claude/skills/custom/domain-dictionary.md` | created | New skill extracted from dual-concern `domain-tagging.md`. Guides discovery and planning workflows in maintaining business vocabulary, dictionary structure, and taxonomy alignment (Route 3 binding). Full taxonomy definitions, edge vocabulary (12 forward + 12 inverse + 6 additional), unanchorable concept explanation, and review checklist. ~380 lines. |
| `.claude/skills/custom/domain-tagging.md` | deleted | Replaced by split into two focused skills. Original document conflated code practice (Route 4) with vocabulary planning (Route 3), causing routing ambiguity. Deletion is clean because both successors preserve all content, now in appropriate activation contexts. |
| `CLAUDE.md` | modified | Updated Route 3 (Specs/Planning/Discovery) to reference `domain-dictionary.md` skill. Updated Route 4 (Refactoring/Writing Code) to list `domain-tagging-constitution.md` and reference `domain-tagging-code.md` skill. Routes now activate these practices at the correct workflow boundaries. |

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `docs/vault/constitution/domain-tagging-constitution.md` | derives-from | This session's discovery drove the creation of two paired skills from one constitution |
| `docs/vault/CLAUDE.md` | contextualizes | The routing framework that these skills must integrate with |
| `docs/vault/constitution/development-practices-constitution.md` | aligns-with | Reinforces the pattern: constitutions define rules; routing + skills enable execution |
| `.claude/skills/custom/domain-tagging-code.md` | produces | Directly produced by this session |
| `.claude/skills/custom/domain-dictionary.md` | produces | Directly produced by this session |
| `.claude/skills/custom/commit-message.md` | contextualizes | Existing constitution-to-skill pair that served as the pattern model |

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add routing for `commit-message-constitution` in CLAUDE.md (currently unrouted like domain-tagging was) | This session discovery | MEDIUM | Pending — pattern suggests all constitutions need explicit routing |
| Audit all constitutions in `docs/vault/constitution/` to verify each has corresponding skill(s) and explicit routing | This session discovery | MEDIUM | Pending — prevents future routing gaps |
| Document the premise: "Business vocabulary tagging is most effective when separated by workflow" as a vault node | Session synthesis | MEDIUM | Pending — promote after CLAUDE.md routing is live and skills are in active use |

---

## Open Questions

- Should routing updates to CLAUDE.md include a new Standing Rule about constitution activation, or should each route explicitly list applicable constitutions? (The current mix is unclear.)
- Does `commit-message-constitution` need a skill at all, or is reading the constitution directly sufficient at commit time? (Unlike domain tagging, which fires mid-edit, commit messages are a discrete, bounded action.)
- What is the governance process for keeping constitution-to-skill mappings in sync with routing changes? (Prevent drift as more constitutions are added.)
