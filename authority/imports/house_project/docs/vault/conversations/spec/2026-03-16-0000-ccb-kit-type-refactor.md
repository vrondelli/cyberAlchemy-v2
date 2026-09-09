---
tags: [ccb, kit_type, validation]
layer: architecture
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T00:00:00-03:00
expires: 2026-05-15
conversation_id: 6fd93c98-8b51-40da-bb06-3386cebed47b
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 6
importance_rationale: "Refactored KitType system changing how document requirements are configured, domain architecture change."
---

# CCB Validations and KitType Phase 5 Planning

**Date:** 2026-03-16
**Tags:** #ccb #validation #kit_type #implementation_plan

## Summary

Reviewed the implementation status of the CCB validation workflow (Phase 5: Critical Field Check) and drafted an implementation plan. Additionally, researched and planned a new requirement to associate `KitType` required documents with specific `DocumentTemplate`s, ensuring documents not only match the type but also the exact template layout. The plans were saved as specifications.

Key outputs:
- `implementation_plan.md` — Phase 5: Critical Field Check
- `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` — KitType Template selection implementation plan

## Conversation Arc

**Started:** The conversation began with checking the implementation status of the `/specs/002-ccb-validation-workflow/` folder to understand what was already built and what was missing.

**Ended:** The session concluded after drafting and saving the implementation plan for the new KitType template association requirement.

## Key Decisions

- **Topic: Document Matching Check:** Enforce that a `KitType` verifies the incoming documents match the exact allowed layouts by extending the `required_docs` list with `template_id`s, rather than just the generic document names `doc_type`.
- **Topic: Schema Evolution:** We selected the approach of maintaining `required_docs` as a `JSONField` but shifting the internal structure from `list[str]` to `list[dict]` rather than building new relational mappings, aiming to retain existing usecase orchestration flow logic.

## Code Changes Made

| File | Change |
|------|--------|
| `/Users/victorboscaro/.gemini/antigravity/brain/6fd93c98-8b51-40da-bb06-3386cebed47b/implementation_plan.md` | Created artifact with plan to implement critical field checks across models and pipelines. |
| `/Users/victorboscaro/.gemini/antigravity/brain/6fd93c98-8b51-40da-bb06-3386cebed47b/kit_type_template_plan.md` | Created artifact describing the specific changes to support template identification within `KitType`. |
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | Finalized KitType requirement documentation into the main spec repository. |

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Phase 5: Critical Field Check implementation | `ccb-critical-field-check-implementation.md` | NOT IMPLEMENTED |
| KitType template ID selection constraint | User request | NOT IMPLEMENTED |

## Backlog Items Added

- ⚠️ HIGH: Implement Phase 5 Critical Field Checklist Check.
- ⚠️ HIGH: Implement KitType template database migration and validation logic.

## Connections

| Document | Type | Description |
|----------|------|-------------|
|`[[002-ccb-validation-workflow/ccb-critical-field-check-implementation.md]]`| `contextualizes` |Verified missing implementation state for Phase 5|
|`[[002-ccb-validation-workflow/kittype-with-template-implementation.md]]`| `implements` |Documented KitType layout constraints.|
|`[[aquisicao/repositories/models.py]]`| `contextualizes` |Extracted schemas for KitType and templates|
