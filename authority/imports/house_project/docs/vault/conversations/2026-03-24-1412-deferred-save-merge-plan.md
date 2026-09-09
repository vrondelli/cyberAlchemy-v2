---
tags: [acquisition, pipeline]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T14:12:10-03:00
expires: 2026-05-23
conversation_id: 83b1acc4-c4c1-40a2-86cd-3238639f5344
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/document-merge-implementation.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identified a DB constraint loop crash in the bulk import merge pipeline and formally drafted the deferred-save architectural workaround in the main implementation plan."
---

# Deferring Database Saves for Identificacao Merge

**Date:** 2026-03-24 14:12 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

Following the initial rollout of the `Identificacao` document merge feature, the user reported that documents were not actually merging in production (e.g., in batch `DOCS-20260324`). By reproducing the environment locally, it was discovered that the Celery task was crashing with a `UniqueViolation` on `dv.save()` *before* it ever reached the merge logic. The sequential saving during the classification step triggered the database constraint whenever multiple `Identificacao` documents were encountered.

To resolve this without altering the database schemas, the architectural plan was revised. The new strategy is to defer database saves inside `_step_classify_dvs` for successfully classified documents until *after* they are grouped and merged in memory. The victims are then deleted from the database securely, and only the final merged survivor is persisted, completely bypassing the integrity constraint. The formal `document-merge-implementation.md` spec was updated to reflect this explicit approach.

### Investigating the Merge Failure
- **Problem/Goal:** The user reported `Identificacao` docs (like RG-F and RG-V) were not merging in the latest batch.
- **Decision:** Run a manual database query and a local execution of `_process_folder` to catch the exact state and stack trace.
- **Changes:** Discovered the process crashed at `dv.save()` inside `_step_classify_dvs` due to `UniqueViolation`, meaning the transaction aborted before hitting `_step_merge_identificacao`.

### Drafting the Deferred-Save Strategy
- **Problem/Goal:** Prevent the `UniqueViolation` while retaining the document-merging logic.
- **Decision:** Use an in-memory dictionary `dv_dirty_fields` to accumulate updates instead of persisting documents individually in the loop. Pass this dictionary to the merge function, update the survivor, clean up the victims, and do a bulk save at the end.
- **Changes:** Updated the `document-merge-implementation.md` specification explicitly detailing this deferred execution flow to guide future implementation.

## Key Decisions

- **Architecture implementation:** Confirmed that `_step_classify_dvs` must decouple state changes in-memory from database persistence to allow batch-level grouping transformations without triggering row-level unique constraints.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `modified` | Overwrote the implementation plan to replace the generic merge strategy with the deferred-save strategy necessary to bypass the DB constraint. |

## Connections

- `validates` -> [document-merge-implementation.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/document-merge-implementation.md)
