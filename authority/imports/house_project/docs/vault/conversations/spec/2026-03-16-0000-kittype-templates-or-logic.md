---
tags: [kit-type, template, implementation-plan]
layer: domain
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T00:00:00-03:00
expires: 2026-05-15
conversation_id: 131c1136-e018-4e4e-a16d-2abdbbbe8a2b
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 6
importance_rationale: "Designed OR-logic for KitType templates, changing how document requirements are evaluated."
---

# KitType Templates OR Logic Implementation Plan Update

**Date:** 2026-03-16
**Tags:** #kit-type #template #implementation-plan

## Summary

In this session, we reviewed the business logic for `KitType` template enforcement. We determined that evolving `required_docs` from `list[str]` to `list[dict]` was suboptimal, and instead designed a new `required_templates` column. We also clarified a major business rule shift: multiple KitTypes for the same product now use OR logic (must satisfy at least one), rather than AND-merging all active kits. The `kittype-with-template-implementation.md` spec was entirely overhauled to reflect this design.

Key outputs:
- `kittype-with-template-implementation.md` — Overhauled specification documenting the `required_templates` column and the new OR-based multi-kit validation logic for `get_checklist.py` and `process_bulk_import.py`.

## Conversation Arc

**Started:** The user requested an explanation of the business logic behind `KitType` to better understand the template requirement implementation.

**Ended:** The user approved the new OR logic and `required_templates` column design, and we fully updated the MD implementation spec. The session is now closing before we begin actual code execution.

## Key Decisions

- **Topic: `required_templates` column:** Instead of migrating `required_docs` to a list of dicts, we decided to add a new `required_templates` `JSONField` (list of template integers) to `KitType`, keeping `required_docs` backwards compatible for generic document types.
- **Topic: Multi-Kit OR Logic:** We shifted the completeness evaluation rule. When multiple KitTypes are active for a `(tipo_produto, bancarizador)`, a folder now only needs to completely fulfill **at least one** kit to be marked complete (OR logic), rather than merging requirements from all kits (AND logic).
- **Topic: Checklist Closest Match:** For incomplete folders evaluated against multiple kits, the checklist UI and metrics (`missing_docs`, `pct`) will be calculated based on the single active kit that has the fewest missing requirements relative to the folder's currently uploaded documents.

## Code Changes Made

| File | Change |
|------|--------|
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | Complete rewrite of the plan. Swapped `list[dict]` approach for `required_templates` column. Replaced AND-merge folder completeness logic with the new independent OR evaluation logic, updating validation steps in `process_bulk_import.py` and `get_checklist.py`. |

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| None | | |

## Backlog Items Added

- None

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `[[002-ccb-validation-workflow/kittype-with-template-implementation.md]]` | `updates` | Fully overhauled the implementation plan. |
