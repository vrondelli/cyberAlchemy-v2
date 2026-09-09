---
tags: [audit, dictionary, extraction-pipeline, aquisicao]
node_type: audit
is_session: true
layer: domain
nature: technical
status: active
created: 2026-04-07
timestamp: 2026-04-07T17:00:00-03:00
expires: 2026-06-06
conversation_id: w9d3h
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [docs/vault/dictionary-business.md, docs/vault/dictionary-sys.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Validated extraction pipeline as dictionary audit methodology, fixed 21 dictionary entries and added 16 production code tags, confirming dictionary-as-source-of-truth for aquisição domain."
---

# Aquisição Dictionary Audit — First Extraction Pipeline Test

**Date:** 2026-04-07 17:00 (UTC-03:00)  
**Tags:** #audit #dictionary #extraction-pipeline #aquisicao

## Summary

This session completed the first systematic audit of all aquisição-related terms in both the business and system dictionaries, verifying their accuracy against actual code and fixing discovered discrepancies. The work was driven by seven identified issues from Phase 7 of the extraction pipeline review (session r3k8m).

**Problem:** The dictionary system had never been validated end-to-end against the codebase. Terms existed with descriptions, but without confirmation that they matched reality — tables existed or didn't, models were named differently, relationships were missing, type classifications were incomplete. The session set out to test whether the dictionary could serve as a reliable source of truth for aquisição domain vocabulary.

**Approach:** Three parallel code verification agents validated 25 dictionary terms (13 business, 12 system) against their actual implementations. For each term, agents confirmed or corrected: exact model/class names, file paths, database table names, relationships to other concepts, and metadata (abstract vs. concrete, persisted vs. runtime). The session also implemented a code tagging audit, adding `@biz` and `@sys` semantic markers to 16 previously untagged production classes and services.

**Key Decisions:**

1. **Table naming fixes:** AquisicaoManual model uses production table `aquisicao_manual`, staging table `aquisicao_manual_staging` (not the previously described `aquisicao_manual_production`). Documentation corrected.

2. **FilterResult enum:** Added missing `VACUOUS_PASS` enum value and detailed the field breakdown for FilterOutcome (status, detail, metadata) to distinguish between the persisted enum and the runtime dataclass.

3. **Removed type taxonomy bullets:** All 21 dictionary entries had type classification bullets (e.g., "Type: Entity"). Per Phase 6 decision, type lives in code tags only (`@biz: Term | type: rule`), not in dictionary entries. Cleaned up completely.

4. **Unanchorable markers:** Parcela marked as an abstract concept with no dedicated model class, enabling agents to understand it's a logical entity, not a codable target.

5. **Edge completion:** Added missing relationships from UploadFile to ProcessUploadService and StageRemessaService; EligibilityFilter to RunFiltersService; FilterResult to RemessaFilterResult (persisted record).

6. **Code tagging:** 16 new semantic tags added across aquisição domain (increasing from 4 → 20 production tags):
   - Domain models tagged `@biz`: RemessaAquisicaoId, ContratoCCB, AquisicaoManual, AquisicaoManualStaging
   - Use cases tagged `@biz`: ApproveRemessa, RejectRemessa, DeleteRemessa, CancelRemessa (all verified 100% accurate)
   - Concrete filters: CcbFreshnessFilter, MaxContratosFilter
   - Infrastructure services tagged `@sys`: RunFiltersService, ProcessUploadService, StageRemessaService, CancelRemessaService, DeleteRemessaService, AquisicaoUploadRules

7. **Dictionary versioning:** Business dictionary bumped to v1.0.0 (first full validation), system dictionary to v0.5.0 (incremental progress toward full aquisição coverage).

8. **No manual tag registry needed:** Confirmed that `tag_scanner.py` (AST walker) produces the semantic tag registry as a generated artifact. The dictionary remains the source of truth for "what should exist"; the scanner is the source of truth for "what's tagged."

**Outcome:** All 25 aquisição terms verified for correctness and completeness. Dictionary entries now reliable. Established extraction pipeline as replicable methodology for future domain audits.

## Epistemic Impact

- **Validates:** `docs/vault/dictionary-business.md` and `docs/vault/dictionary-sys.md` — confirmed as accurate sources of truth for aquisição domain after end-to-end verification.
- **Confirms:** Phase 7 assumption that systematic code verification could surface dictionary gaps — 7 of 7 predicted issues were genuine (missing edges, incomplete enums, metadata gaps).
- **Establishes:** Extraction pipeline methodology as repeatable audit pattern for other domains (liquidação, cessão, etc.).
- **Challenges:** Manual type classification in dictionary entries — decision made to remove them completely and rely on code tags instead (already resolved in this session).

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `docs/vault/dictionary-business.md` | modified | Fixed AquisicaoManual table description; added Unanchorable markers (Parcela); added missing @sys edges (UploadFile→ProcessUploadService/StageRemessaService, EligibilityFilter→RunFiltersService, FilterResult→RemessaFilterResult); removed 21 type taxonomy bullets; bumped version to v1.0.0 |
| `docs/vault/dictionary-sys.md` | modified | Added VACUOUS_PASS to FilterResult enum; detailed FilterOutcome field breakdown; corrected RemessaAquisicaoId table name confirmation; removed 10 type taxonomy bullets; bumped version to v0.5.0 |
| Aquisição domain code (multiple files) | modified | Added 16 semantic tags (`@biz` and `@sys`) across RemessaAquisicaoId, ContratoCCB, AquisicaoManual, AquisicaoManualStaging, ApproveRemessa, RejectRemessa, DeleteRemessa, CancelRemessa, CcbFreshnessFilter, MaxContratosFilter, RunFiltersService, ProcessUploadService, StageRemessaService, CancelRemessaService, DeleteRemessaService, AquisicaoUploadRules |

## Connections

- **Derives from:** `2026-04-07-1200-r3k8m-extraction-pipeline-review.md` (Phase 7 identified 7 dictionary issues)
- **Derives from:** `2026-04-07-0002-n4r8k-ontology-dict-cleanup.md` (established dictionary cleanup criteria)
- **Relates to:** `docs/vault/dictionary-business.md` (modified)
- **Relates to:** `docs/vault/dictionary-sys.md` (modified)
- **Contextualizes:** Future domain audits for liquidação, cessão, and other domains

## Open Questions

1. **Structural reorganization needed:** Remessa, UploadFile, RemessaStatus, EligibilityFilter serve both aquisição and liquidação domains but live under H2 "Aquisição" in the dictionary. Should there be a shared section above domain breakdowns? Deferred — requires structural reorganization.

2. **Missing business concept:** `id_cessao` has no dictionary definition but is a genuine business concept (cessão de crédito / credit assignment). Should it be added? Requires user input.

3. **Minimal coverage:** Sacado and Cedente have minimal entries in Core/Shared sections. Should they be expanded with Unanchorable markers and edges? Deferred to liquidação audit.
