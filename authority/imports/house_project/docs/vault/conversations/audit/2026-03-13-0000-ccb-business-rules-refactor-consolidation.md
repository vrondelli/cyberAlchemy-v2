---
tags: [ccb, business-rules, refactor, implementation-plan]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: 33b42e8b-e68d-4a0e-b4a3-b2c4e3d2fe28
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 6
importance_rationale: "Consolidated CCB business rules refactor plan, merging multiple spec revisions into coherent implementation path."
---

# CCB Business Rules Refactor — Implementation Plan Consolidation

**Date:** 2026-03-13
**Tags:** #ccb #business-rules #refactor #implementation-plan #pipeline

## Summary

Reviewed and consolidated two competing implementation plan documents (`ccb-rules-alignment-refactor-implementation.md` and `ccb-code-alignement-refactor-implementation.md`) into a single authoritative plan: `ccb-business-rules-refactor-implementation.md`. The session identified 10 issues/ambiguities in the original documents, resolved them through iterative inline-comment review, and produced a final plan covering 4 gaps, 3 cleanups, and a new backlog item for bottom-up kit type selection.

Key outputs:
- `ccb-business-rules-refactor-implementation.md` — consolidated implementation plan (4 gaps, 3 cleanups)
- Bottom-up kit type selection backlog item added to `backlog.md`
- Deleted `ccb-rules-alignment-refactor-implementation.md` and `ccb-code-alignement-refactor-implementation.md`

## Conversation Arc

**Started:** User asked me to review `ccb-rules-alignment-refactor-implementation.md`, explain why it exists, what it aims to do, and identify issues or ambiguities.

**Ended:** Produced the consolidated `ccb-business-rules-refactor-implementation.md` with all decisions finalized. The plan is ready for implementation but Gap 1 (misplaced files) depends on model changes (nullable `checklist_item`, `reason` column) being handled by another agent.

## Key Decisions

- **D1 — Misplaced files:** Save as `DocumentVersion` rows with `status=pendente, reason=invalid_structure` (not events). All grouped into one folder result.
- **D2 — No `DOCUMENT_MISPLACED_FILE_DETECTED` event:** Table rows are the record, not events.
- **D3 — Rename `ocr_pending` → `no_text_found`:** Same name at both folder and document level. Consolidates `no_text_layer` + `low_char_count`.
- **D4 — Gap 4 already fixed:** `entity_id = contract_hash` was already applied in code. Removed from plan.
- **D5 — Remove `DOCUMENT_VERSION_CREATED` event:** Table is the record. Remove enum + catalog + emission code.
- **D6 — `DocumentVersion` adopts status+reason pattern:** Only 3 statuses (`aprovado`, `pendente`, `deletado`) with N reasons each. Model change handled by other agent.
- **D7 — `invalid_structure` folders are `pendente`, not `deletado`:** Operator can confirm/resolve.
- **D8 — `duplicate_contrato` tags BOTH occurrences:** Both set to `pendente/duplicate_contrato`. Operator chooses which to keep.
- **D9 — Split `no_template` into two reasons:** `no_template` (no templates registered) vs `no_ccb_found` (templates exist but nothing matched).
- **D10 — `checklist_item` must be nullable:** Misplaced files may not have an identified contract.
- **D11 — Kit type selection deferred:** Bottom-up approach (identify all docs first, then match to kit). Added to backlog.
- **D12 — Include `select_related` optimization:** Add `checklist_item__contrato` to `run_ocr.py` query.
- **D13 — `aprovado` can have `override` reason:** Consider in design, don't build yet.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Misplaced files → `DocumentVersion` rows | B3 | Planned (depends on other agent) |
| Rename `ocr_pending` → `no_text_found` | C3 / E2 | Planned |
| Critical field check after OCR | E4 | Planned |
| Split `no_template` → `no_template` + `no_ccb_found` | Pipeline clarity | Planned |
| Remove `DOCUMENT_VERSION_CREATED` event | Session decision | Planned |
| `select_related` optimization | Performance | Planned |
| `duplicate_contrato` tags both occurrences | Session decision | Planned |

## Backlog Items Added

- ⚠️ HIGH — Bottom-up kit type selection: identify all documents first, then match to kit (added to `backlog.md`)

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]]| `implements` |Consolidated implementation plan|
|[[002-ccb-validation-workflow/ccb-business-rules.md]]| `contextualizes` |Source business rules v2|
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Added bottom-up kit type selection item |
|[[002-ccb-validation-workflow/ccb-rules-alignment-refactor-implementation.md]]| `supersedes` |Superseded by consolidated plan|
|[[002-ccb-validation-workflow/ccb-code-alignement-refactor-implementation.md]]| `supersedes` |Superseded by consolidated plan|
