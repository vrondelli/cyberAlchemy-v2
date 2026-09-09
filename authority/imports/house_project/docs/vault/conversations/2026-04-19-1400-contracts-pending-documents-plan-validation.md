---
tags: [contracts-pending-documents, validation, layer-law, repository-pattern, di-rejection]
node_type: implementation-plan
is_session: true
layer: application
nature: procedural
status: active
created: 2026-04-19
timestamp: 2026-04-19T14:03:11-03:00
expires: 2026-06-18
decisions_made: true
contradictions_found: false
specs_updated: [specs/003-remessa-upload-with-events/docs/contracts-pending-documents/contracts-pending-documents-plan.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Records a validated, corrected implementation plan with concrete architectural decisions (repository extraction, DI rejection) that future implementors must not re-litigate."
---

# Contracts Pending Documents — Plan Validation

## Objective

Document the validation of the contracts-pending-documents implementation plan and the architectural decisions that corrected it.

## Summary

Validated the contracts-pending-documents plan (v0.1.0) with three parallel subagents covering domain-tagging, testing, and folder-structure. Domain tagging and testing passed clean. Folder-structure found 3 violations — all fixed in the plan: (1) `_fetch_completion_data` moved from `use_cases/` to a new `repositories/checklist_repo.py` with `fetch_completion_data` and `checklist_exists`; (2) lazy materialization guard updated to call `checklist_exists()` from the repo instead of raw `.objects.filter().exists()` in the use case; (3) `derive_status` re-export deleted from `pending_overview_repo.py` — all callers now import from `domain.checklist_status` directly. DI was considered and rejected: intra-domain use_cases → repositories doesn't warrant it. Plan bumped to v0.2.1.

## Files touched

- specs/003-remessa-upload-with-events/docs/contracts-pending-documents/contracts-pending-documents-plan.md
- claude/current_conversations/2026-04-19-1500-r3k7m-contracts-pending-documents-plan-validation.md
