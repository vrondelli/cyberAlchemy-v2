---
tags: [ontology, dictionary, domain-mapping]
node_type: audit
is_session: true
layer: ontology, domain, architecture
nature: reference, technical
status: active
created: 2026-04-07
timestamp: 2026-04-07T00:02:00-03:00
expires: 2026-06-06
conversation_id: n4r8k
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [docs/vault/dictionary-business.md, docs/vault/dictionary-sys.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Upgraded both dictionaries to post-release quality by resolving edge verb ambiguities in the aquisição domain, completing bidirectional relationship mappings in the event system, and adding missing system concepts (parent_event, filter_key, is_stub, Parcela), unblocking the tag plan adoption strategy."
---

# Ontology Dictionary Cleanup (Session 0002)

**Date:** 2026-04-07 00:02 (UTC-3)  
**Tags:** #ontology #dictionary #audit

## Summary

This session continued the audit and cleanup of the business and system dictionaries, with the primary objective of unblocking the aquisição tag plan and resolving medium-severity ontological issues discovered in prior discovery sessions.

### Dictionary-Sys Completion (v0.3.0 → v0.5.0)

The system dictionary had two critical gaps: (1) missing "Aliases in conversation" entries for 17 existing terms, and (2) contradictory interpretation of `log_event` vs. `log_event_safe`. The first was a simple documentation gap—every system concept now has recorded conversation aliases, making it immediately searchable and avoidable of ambiguity. The second was a deeper issue: prior sessions had treated `log_event` and `log_event_safe` as aliases of each other, but investigation revealed they are actually **distinct entry points with opposite failure semantics**. `log_event_safe` is the production interface (fail-open), while `log_event` is the strict variant reserved for tests and critical paths. This contradiction was resolved by splitting them into two separate dictionary entries with clear "Distinct from" statements and updated edges.

Beyond these core fixes, three new system concepts were added to address prior audit findings and prepare for tag scanner implementation (phase 1 of the ontology adoption strategy):
- **`parent_event`**: The FK link between related sub-events and their parent in the EventLog, recording the direct caller/child hierarchy within a stream.
- **`filter_key`**: The SCREAMING_SNAKE_CASE identifier used as the lookup key in the FILTER_REGISTRY, bridging configuration models to runtime filter implementations.
- **`is_stub`**: A boolean flag on RemessaFilterResult indicating whether a filter result comes from a stub (unimplemented) filter and must not be treated as a genuine eligibility signal.

All bidirectional edges were completed for the event system (EventLog, EventLogEntities, EventCatalog) and filter system (RunFiltersService, FILTER_REGISTRY, FundFilterConfig, FilterDefinition), ensuring that the relationship graph now accurately reflects the architecture without gaps or one-directional links.

### Dictionary-Business Refinement (v0.8.0 → v1.0.0)

The business dictionary had three categories of issues:

**1. Edge verb corrections in the aquisição domain (medium-severity):**
- `ApproveRemessa` was recorded as `enforces` → EligibilityFilter, but the actual pattern is that EligibilityFilter gates the approval; the edge direction was flipped to `enforced-by` ← EligibilityFilter.
- `AquisicaoManual` was recorded as `maps` → FilterResult, but the relationship is a composition (installments contain their filter results), so the verb was corrected to `contains`.
- `ContratoCCB` was recorded as `maps` → DocumentVersion, but the semantic is that documents are matched against contracts during CCB identification; the direction was flipped to `matched-by` ← DocumentVersion, with the inverse edge `matches` → ContratoCCB added to DocumentVersion.

**2. Clarification of the FilterResult dual taxonomy (low-severity, but foundational):**
FilterResult had been recorded as both an `enum` and a `value-object` with no resolution. Investigation revealed both are correct: `FilterResult` is the enum of possible eligibility outcomes (primary taxonomy), while `FilterOutcome` is a dataclass value-object in the infrastructure layer (secondary taxonomy). Both map to the same conceptual term in the dictionary. Rather than choosing one, the entry now documents both with clear separation, allowing the dictionary to serve both the business domain and infrastructure layers without ambiguity.

**3. Addition of the Parcela abstraction (high-impact, unblocks multiple decisions):**
The aquisição domain uses the term "parcela" informally to mean "an installment being purchased," but the concrete database entity is `AquisicaoManual`. Prior dictionaries conflated these. The issue: shared system services (like `StageRemessaService`) need to refer to installments independently of domain-specific implementation details—they should work with "an installment" without knowing about the aquisição domain's tables. This session added `Parcela` as a new dictionary entry of `taxonomy_type: concept`, marked `unanchorable: true` (no dedicated model class—it's a conceptual alias), and established the relationship: `AquisicaoManual implements Parcela`, while `Parcela` is orchestrated by `StageRemessaService` and referenced by `TipoInstrumento`. This clarification unblocks decisions about service boundaries and allows the tag plan to correctly label cross-domain orchestrators.

## Epistemic Impact

### Contradictions Resolved

- **`log_event` vs. `log_event_safe` (dictionary-sys.md):** These were previously conflated as aliases. Resolved by treating them as separate entries with explicitly different failure modes and documented "Distinct from" language. This affects how production code should be annotated and tested.

### Specs Updated

- **`docs/vault/dictionary-business.md`:** Bumped to v1.0.0; added Parcela entry; corrected edge verbs for ApproveRemessa, AquisicaoManual, ContratoCCB; clarified FilterResult dual taxonomy.
- **`docs/vault/dictionary-sys.md`:** Bumped to v0.5.0; added parent_event, filter_key, is_stub entries; completed bidirectional edges for event system and filter system; resolved log_event/log_event_safe contradiction.

### Epistemic Confirmations

- **The aquisição domain requires domain-independent abstractions (Parcela) for cross-domain coordination.** This was implicit in the `StageRemessaService` architecture but is now explicit in the ontology.
- **The event system and filter system are architecturally complete at the ontological level.** All relationships are now bidirectional and fully documented.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `docs/vault/dictionary-business.md` | Modified | v0.8.0 → v1.0.0: Added Parcela entry (concept, unanchorable). Corrected edge verbs for ApproveRemessa (enforced-by), AquisicaoManual (contains, implements), ContratoCCB (matched-by). Clarified FilterResult dual taxonomy (enum + value-object). Updated AquisicaoManual description to distinguish from Parcela and clarify staging/production model lifecycle. |
| `docs/vault/dictionary-sys.md` | Modified | v0.3.0 → v0.5.0: Added parent_event, filter_key, is_stub entries. Completed bidirectional edges for EventLog (enforced-by, complemented-by, hashed-by), EventLogEntities (hashed-by), FILTER_REGISTRY (mapped-by), RunFiltersService (queries), FundFilterConfig (references, contains), FilterDefinition (contains, informs). Removed redundant `taxonomy_type` field from entries. Resolved log_event/log_event_safe contradiction (now separate entries). |
| `specs/ontology/dictionary-business.md` | Modified | Synced with vault version (v1.0.0). |
| `specs/ontology/dictionary-sys.md` | Modified | Synced with vault version (v0.5.0). |
| `domains/aquisicao/domain/filters_criteria.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `domains/aquisicao/domain/upload_rules.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `domains/aquisicao/repositories/models.py` | Modified | Added AquisicaoManualStaging model; clarified code equivalent documentation for AquisicaoManual. |
| `domains/aquisicao/use_cases/approve_remessa.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `domains/aquisicao/use_cases/cancel_remessa.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `domains/aquisicao/use_cases/delete_remessa.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `domains/aquisicao/use_cases/reject_remessa.py` | Modified | Tagged with @biz domain tags per tag plan. |
| `infrastructure/remessa/cancel_remessa_service.py` | Modified | Tagged with @sys infrastructure tags per tag plan. |
| `infrastructure/remessa/delete_remessa_service.py` | Modified | Tagged with @sys infrastructure tags per tag plan. |
| `infrastructure/remessa/run_filters_service.py` | Modified | Tagged with @sys infrastructure tags per tag plan. |
| `infrastructure/remessa/stage_remessa_service.py` | Modified | Tagged with @sys infrastructure tags per tag plan. |
| `infrastructure/remessa/upload_service.py` | Modified | Tagged with @sys infrastructure tags per tag plan. |

## Connections

### Validates

- **`docs/vault/ontology-conventions.md`:** The orthogonality principle for classification labels. The separation of `log_event` and `log_event_safe` confirms that distinct entry points with different failure modes must be documented separately, not collapsed into a single label.

### Questions

- **`docs/vault/specs/ontology/aquisicao-tag-plan.md`:** 12 symbols (items 1–12) in the tag plan still need @biz tags applied to the codebase. This session prepared the ontological ground (Parcela, corrected relationships) but did not apply all tags. Phase 1 (tag scanner tool) must be built before systematic application.
- **Cross-domain service orchestration:** How should `StageRemessaService` (which is marked @sys but orchestrates `Parcela`) be annotated when Parcela is a business concept? Recommend capturing this as a `@cross-domain-orchestration` tag or explicit note in the tag plan.

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Build tag scanner (`tools/domain_tagging/tag_scanner.py`) for phase 1 adoption | Ontology adoption strategy | HIGH | Pending |
| Apply remaining 12 @biz tags to aquisicao-tag-plan.md items 1–12 | Session findings | HIGH | Pending |
| Define tag annotation pattern for cross-domain orchestrators (@sys + @biz) | Emerging from Parcela definition | MEDIUM | Open discussion |
| Audit ProcessUploadService and related services against finalized tag schema | Related to upload service tagging | MEDIUM | Pending |

## Open Questions

1. Should cross-domain orchestrators (like `StageRemessaService` orchestrating `Parcela`) carry dual tags (@sys + @biz), or does the ontology recommend a different approach?
2. Is `FilterResult` dual taxonomy (enum + value-object) stable, or should a future decision split this into two separate dictionary terms?
3. The tag scanner must support the following: scanning Python function/class definitions, extracting docstring tags, validation against the tag schema (aquisicao-tag-plan.md). What is the expected scope for phase 1 (MVP)?
