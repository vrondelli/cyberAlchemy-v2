---
tags: [ontology, architecture]
node_type: audit
is_session: true
layer: [ontology, architecture]
nature: technical
status: active
created: 2026-04-10
timestamp: 2026-04-10T22:00:00-03:00
expires: 2026-06-09
conversation_id: r4t8w
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/ontology/docs/domainspec/README.md, specs/ontology/docs/domainspec/FRAMEWORK.md, specs/ontology/docs/domainspec/ALIGNMENT.md, specs/ontology/docs/domainspec/TIER-1-IMPLEMENTATION-PLAN.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Prevented a fabricated specification framework from being treated as authoritative ground truth, correcting structural risk before downstream damage."
---

# DomainSpec Folder Cleanup Audit

**Date:** 2026-04-10 22:00 (UTC-3)
**Tags:** #ontology #architecture

## Summary

This session reviewed and cleaned up the `specs/ontology/docs/domainspec/` folder, which had been created in a prior session (k7m2x) as a specification-driven development framework for house_project. The folder contained 7 files of pure theory and planning with zero actual domain specs written — and several structural problems.

### Redundancy: INDEX.md and README.md merged

INDEX.md and README.md had heavy overlap — both served as entry points with redundant reading guides and structure descriptions. They were merged into a single README.md to eliminate the duplication.

### Taxonomy duplication: FRAMEWORK.md rewritten

FRAMEWORK.md was redefining all 13 meta-types and 12 edge types inline (~200 lines of taxonomy definitions), when these are already the canonical source of truth in `internal_tools/semantic_index/taxonomy.py`. The rewritten version points to taxonomy.py and focuses on templates and stage descriptions instead.

### Premature roadmaps deleted

TIER-2-ROADMAP.md and TIER-3-ROADMAP.md were deleted. They planned months ahead (weeks 3-4 and months 5+) when Tier 1 hasn't started. Planning that far ahead with no execution data is noise.

### Execution order restructured for value-first delivery

The execution order in TIER-1-IMPLEMENTATION-PLAN.md was restructured. Previously it started with SPEC.md (concept table — bureaucratic ceremony), now it starts with states.md (state machines — the single highest-value deliverable) followed by operations.md. SPEC.md and TEST-SPEC.md come after, when the hard work is done.

### Fabricated examples replaced with real code

All code examples in ALIGNMENT.md and the implementation plan were fabricated in session k7m2x — plausible-looking class names and methods that didn't exist in the actual codebase. These were replaced with real references: actual class names (RemessaAquisicaoId, ConcentracaoMaxFilter, ApproveRemessaAquisicaoUseCase), real status enums (PENDENTE/APROVADO/REJEITADO/ROLLBACK/FINALIZADO), real file paths, and real domain structure (13+ Django models, 3 state machines, 8+ use cases, 3 eligibility filters).

## Epistemic Impact

- **Spec drift corrected:** Session k7m2x produced fabricated code examples that didn't match the actual codebase. This audit caught and corrected the drift before any downstream work depended on it.
- **Single source of truth confirmed:** `internal_tools/semantic_index/taxonomy.py` is the canonical definition for meta-types and edges. No spec document should redefine them inline.
- **Premature planning validated as noise:** Roadmaps for work months away, with no Tier 1 execution data, add no value and create false confidence.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/ontology/docs/domainspec/README.md` | Rewritten | Merged with INDEX.md; single concise entry point |
| `specs/ontology/docs/domainspec/INDEX.md` | Deleted | Absorbed into README.md |
| `specs/ontology/docs/domainspec/FRAMEWORK.md` | Rewritten | Points to taxonomy.py instead of redefining types/edges |
| `specs/ontology/docs/domainspec/ALIGNMENT.md` | Rewritten | Real code references instead of fabricated examples |
| `specs/ontology/docs/domainspec/TIER-1-IMPLEMENTATION-PLAN.md` | Rewritten | Value-first order (states.md first), real code references |
| `specs/ontology/docs/domainspec/TIER-2-ROADMAP.md` | Deleted | Premature |
| `specs/ontology/docs/domainspec/TIER-3-ROADMAP.md` | Deleted | Premature |

## Connections

- **audits** → `specs/ontology/docs/domainspec/` (all files)
- **validates** → `internal_tools/semantic_index/taxonomy.py` (confirmed as single source of truth for types/edges)
- **contradicts** → session k7m2x (fabricated code examples corrected)

## Gaps & Backlog

| Item | Priority | Notes |
|------|----------|-------|
| Execute TIER-1: write actual `aquisicao/states.md` | HIGH | Entire domainspec folder is still scaffolding — no domain specs written |
| Create backlog node for domainspec work | MEDIUM | Pending work tracked only in TIER-1 plan, not in `docs/vault/backlog/` |

## Open Questions

- When should Tier 1 execution begin? Victor deferred the decision in session k7m2x.
