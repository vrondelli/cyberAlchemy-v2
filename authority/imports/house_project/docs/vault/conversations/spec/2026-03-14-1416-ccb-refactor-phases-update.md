---
tags: [#ccb, #spec, #refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T14:16:50-03:00
expires: 2026-05-13
conversation_id: 9850b57c-e99b-4373-9e92-59cbcd4136d7
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 4
importance_rationale: "Updated CCB refactor phase tracking, project management without new technical decisions."
---

# CCB Refactor Phases Update + Phase 5 Plan

**Date:** 2026-03-14 14:16 (UTC-3)  
**Tags:** #ccb #spec #refactor

## Summary

Reviewed and updated `ccb-refactor-phases.md` to reflect the current state of the CCB refactoring after the parallel upload implementation. Marked phases 1–4 as done, noted Phase 8 absorbed by Phase 4, and added 5 new phases (10–14) covering OCR rerun (batch/folder/document), upload new document version, and batch override with justification. Created a detailed implementation plan for Phase 5 (Critical Field Check) as the next phase to implement.

## Key Decisions

- **Phase 5 (Critical Field Check) is the next phase** — low risk, isolated, all dependencies met.
- **Phase 6 scope narrowed** to post-finalization counter mutations only (the initial batch counters are handled by the parallel upload's `_update_batch_counters()`).
- **5 new phases added**: OCR rerun at batch/folder/document granularity, document version replacement, and batch-wide override with justification (requires new `justification` column on `DocumentVersion`).
- **Phase 8 (Per-Folder Error Handling) fully absorbed** by Phase 4 — `process_folder_task` already catches exceptions and marks `failed/processing_error`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-refactor-phases.md]] | `updates` | Added new phases 10–14, marked phases 1–4 as done, absorbed Phase 8 |
|[[002-ccb-validation-workflow/ccb-critical-field-check-implementation.md]]| `implements` |Detailed implementation plan for Phase 5|
|[[002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md]]| `contextualizes` |Reviewed to determine what was absorbed from original phases|
