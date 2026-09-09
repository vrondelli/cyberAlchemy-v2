---
tags:
  - dictionary
  - ontology
  - taxonomy
  - domain-model
node_type: spec
is_session: true
layer: market
nature: reference
status: active
created: 2026-04-06
timestamp: 2026-04-06T15:30:00-03:00
expires: 2026-06-05
conversation_id: w7m4a
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - docs/vault/dictionary-business.md
  - docs/vault/dictionary-sys.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Restructured business dictionary by domain (Core/Aquisição/Documents), established taxonomy types and ontology edges for all 24 terms, and resolved contradictions in event infrastructure (log_event vs log_event_safe, stream_id vs parent_event), making the domain vocabulary complete and machine-queryable."
---

# Business Dictionary Restructure & System Dictionary Cleanup

**Date:** 2026-04-06 15:30 (UTC-03:00)  
**Tags:** #dictionary #ontology #taxonomy #domain-model

---

## Summary

This session restructured the business dictionary from concept-type organization into domain-aligned sections (Core/Shared, Aquisição, Documents & OCR) and completed the system dictionary with resolved contradictions and new entries.

### Part 1: Dictionary-Business Domain Restructuring (First Exchange)

The goal was to reorganize `dictionary-business.md` from logical concept groupings into domain-aligned sections that mirror the codebase's architecture. The session moved through three iterations:

**Iteration 1: Initial Domain Alignment**
- Identified three target domains: Core/Shared (abstract concepts shared across domains), Aquisição (acquisition lifecycle), and Documents & OCR (document management and validation).
- Organized 24 business terms into these sections with version bump to 0.7.0.
- Core/Shared: 7 terms (Direitos Creditórios, CCB, Parcela, FIDC, Emissor, Sacado, Cedente)
- Aquisição: 11 terms (Remessa, UploadFile, RemessaStatus, Approve/Reject/DeleteRemessa, EligibilityFilter, FilterResult, TipoProduto, TipoInstrumento, ProdutoKitConfig)
- Documents & OCR: 6 terms (KitType, DocumentTemplate, DocumentVersion, BulkImportBatch, CrossCheck, Dígito Verificador)
- Added initial taxonomy types and edges to all Aquisição terms (entity type for Remessa and UploadFile with edge definitions: Remessa contains→Parcela, produced-by←UploadFile, governed-by→RemessaStatus, enforced-by←EligibilityFilter; UploadFile produces→Remessa, produces→EventLog)

**Iteration 2: Refactoring Categories & Bumping Version**
- All 11 Aquisição terms were completed with taxonomy types and edges.
- Identified misplacement: TipoProduto, TipoInstrumento, and ProdutoKitConfig were originally in Aquisição but belong to Documents & OCR because they are document kit/checklist registries, not part of the acquisition lifecycle.
- Moved these three terms to Documents & OCR section (version 0.8.0).
- Removed stream_id EventLog edge from UploadFile (stream_id belongs to the event system, not UploadFile's business identity).
- Result: Aquisição cleanly became 8 pure-lifecycle terms; Documents & OCR expanded to 9 registry/validation terms.

**Iteration 3: Adding Concrete Acquisition Domain Records**
- Added AquisicaoManual (entity) — the concrete database realization of the abstract Parcela concept, with staging/production table lifecycle.
- Added ContratoCCB (entity) — the contract-level grouping of installments by numero_titulo within a remessa, representing the CCB legal instrument in code.
- Updated Remessa edges to reference AquisicaoManual and ContratoCCB instead of abstract Parcela.
- Established clean separation: Core keeps abstract concepts (Parcela, CCB), Aquisição holds concrete domain records (AquisicaoManual, ContratoCCB).

### Part 2: HIGH-Severity Audit Fixes & System Dictionary Cleanup (Continued Session)

The goal was to apply all HIGH-severity fixes from an earlier audit to `dictionary-business.md` and complete `dictionary-sys.md` with missing entries and resolved contradictions.

**Dictionary-Business Fixes:**
- Fixed AquisicaoManual "Distinct from: Parcela" — removed incorrect "(Core)" label. Parcela is an aquisição-domain concept, not Core/Shared. Updated reference to: "the abstract financial installment concept within the aquisição domain."
- Added Remessa code equivalents: `RemessaAquisicaoId` (aquisição domain) and `RemessaLiquidacaoId` (liquidação domain). Documented aliases in codebase: remessa_aquisicao, remessa_liquidacao, remessa.
- Fixed Remessa edge direction: was `governed-by`→RemessaStatus (wrong), corrected to `governed-by`←RemessaStatus (RemessaStatus governs Remessa).
- Fixed RemessaStatus edge direction: was `transitions`←Remessa (wrong verb and direction), corrected to `governs`→Remessa.
- Added CancelRemessa (operation) — pure status flip Pendente→Rejeitado with no staging data deletion. Distinct from RejectRemessa (deletes staging) and DeleteRemessa (applies to Aprovado). Code equivalent: CancelRemessaAquisicaoUseCase.
- Added DocumentChecklist (entity) — per-contract instantiation of KitType requirements. One row per (contract, kit_type, doc_type). Distinct from KitType (the template). Code equivalent: DocumentChecklist model, table document_checklist.
- Updated index to include CancelRemessa and DocumentChecklist.
- Updated RemessaStatus `enforces` edge to include CancelRemessa alongside ApproveRemessa/RejectRemessa/DeleteRemessa.
- **Insight:** Both CancelRemessa and DocumentChecklist were blocked in aquisicao-tag-plan.md pending dictionary entries. Both now exist — blockers removed.

**Dictionary-Sys Improvements:**
- Bumped version to v0.3.0.
- Added "Aliases in conversation" field to all 17 existing entries for user-facing vocabulary consistency.
- Fixed major contradiction: `log_event` and `log_event_safe` were incorrectly listed as aliases. They are distinct functions. `log_event` (strict, raises on failure) now has its own entry with clear distinction: production code must use `log_event_safe`; `log_event` is reserved for tests or explicitly critical paths.
- Added parent_event — self-FK on EventLog linking sub-events to parent. Distinguishes from stream_id (lifecycle grouping) vs direct hierarchy.
- Added filter_key — SCREAMING_SNAKE_CASE string identifier in FILTER_REGISTRY, FundFilterConfig, FilterDefinition. Value-object.
- Added is_stub — boolean flag on RemessaFilterResult. Marks results from unimplemented (vacuous pass) filters. Rule: stub results must never be treated as genuine eligibility signals.

**Identified But Unresolved:**
- Medium-severity Aquisição fixes still pending: edge verb consistency (enforces / gated-by / enforced-by), FilterResult dual taxonomy type, AquisicaoManual `maps`→FilterResult verb, ContratoCCB `maps`→DocumentVersion verb.
- Parcela still has no formal dictionary entry in the Aquisição section — referenced in AquisicaoManual "Distinct from" but undefined at the time of this session.

---

## Epistemic Impact

### Validates
- **ontology-conventions.md** — The session validated that domain-aligned sections + taxonomy types + edges provide a queryable ontology. The three-domain structure (Core/Aquisição/Documents) mirrors the codebase architecture and makes terms discoverable by context.
- **dictionary-business.md prior state** — The session confirmed that the dictionary needed restructuring: concept-type groupings (financial assets, actors, rules) were harder to navigate than domain groupings.

### Contradicts
- **dictionary-sys.md (pre-session state)** — Contradicted the claim that `log_event` and `log_event_safe` were aliases. The session corrected this: they are distinct functions with opposite error-handling strategies.

### Questions
- Whether **Parcela** should remain "unanchorable" (a pure conceptual term with no dedicated model) or whether a formal dictionary entry in Aquisição is required. The session documented its current usage but left scope of future clarification.
- Whether **FilterResult** should have a single taxonomy type or dual types (both enum and persisted record). Session documented both uses but did not resolve unified typing.

---

## Modified Artifacts

| Artifact | Action | What Changed and Why |
|----------|--------|----------------------|
| `docs/vault/dictionary-business.md` | modified | Restructured from 6 concept-type sections into 3 domain sections (Core/Shared, Aquisição, Documents & OCR). Bumped version 0.7.0 → 0.8.0 → final. Added 4 new entries (AquisicaoManual, ContratoCCB, CancelRemessa, DocumentChecklist). Fixed Remessa/RemessaStatus edge directions. Fixed AquisicaoManual "Distinct from" label. Added Remessa code equivalents (RemessaAquisicaoId, RemessaLiquidacaoId). Updated RemessaStatus edges. Established taxonomy types and edges for all 24 terms. Indexed CancelRemessa and DocumentChecklist. |
| `docs/vault/dictionary-sys.md` | modified | Bumped version 0.2.0 → 0.3.0. Added "Aliases in conversation" to all 17 existing entries. Resolved log_event vs log_event_safe contradiction — separated into distinct entries with clear error-handling distinctions. Added 3 new entries: parent_event (EventLog self-FK), filter_key (SCREAMING_SNAKE_CASE identifier), is_stub (vacuous-pass marker). Updated index, edges, and EventLog entry description. |

---

## Connections

### Derives From
- **aquisicao-tag-plan.md** — Session unblocked CancelRemessa and DocumentChecklist, which were pending dictionary entries in that plan.
- **Earlier audit of dictionary-business.md** — Session applied all HIGH-severity fixes flagged.

### Validates
- **ontology-conventions.md** — Domain-aligned + taxonomy type + edges approach proved effective for term organization and queryability.

### Contradicts (Resolved)
- **dictionary-sys.md (pre-session)** — Fixed: log_event and log_event_safe are not aliases; they are distinct with opposite error semantics.

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Resolve FilterResult dual taxonomy type (enum vs persisted record) | Session observation | MEDIUM | pending — requires decision on unified typing strategy |
| Add formal Parcela dictionary entry in Aquisição section | Iteration 3 & Part 2 observation | MEDIUM | pending — clarify whether Parcela remains "unanchorable" or needs model binding |
| Apply MEDIUM-severity Aquisição fixes: edge verb consistency (enforces/gated-by/enforced-by), AquisicaoManual/ContratoCCB `maps` verbs | Part 2 discovery | MEDIUM | pending — identified but not resolved in this session |

---

## Open Questions

1. **Parcela model scope:** Should Parcela have a dedicated code equivalent model (e.g., `ParcelaAbstract`), or remain a pure conceptual term with implementation responsibility on `AquisicaoManual`? The session documented current practice but left scope for future decision.

2. **FilterResult taxonomy unification:** The term currently describes both an enum (`FilterResult` in `choices.py`) and a persisted record (`RemessaFilterResult` in models). Should these be unified under one taxonomy type or documented as dual representations?

3. **Medium-severity edge verb consistency:** Which verbs should apply across Aquisição edges? Examples: should AquisicaoManual use `maps`→FilterResult or `enforced-by`←EligibilityFilter? Should ContratoCCB use `maps`→DocumentVersion or a different verb? Requires systematic review of verb semantics.

