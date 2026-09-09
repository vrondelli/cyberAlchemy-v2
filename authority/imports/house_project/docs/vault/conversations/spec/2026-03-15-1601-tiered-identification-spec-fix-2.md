---
tags: [spec, ccb]
layer: domain
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T16:01:48-03:00
expires: 2026-05-14
conversation_id: a0c3fb4a-e657-4682-b3eb-7e48989c1e62
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 4
importance_rationale: "Follow-up fix to tiered identification spec, incremental correction."
---

# Fixing Tiered Identification Spec Inconsistencies (Round 2)

**Date:** 2026-03-15 16:01 (UTC-3)  
**Tags:** #spec #ccb

## Summary

Cross-referenced all 7 sections of the Tiered Document Identification implementation plan (`ccb-tiered-identification-implementation.md`) against the current codebase. Found and fixed 4 issues: (1) architecture diagram incorrectly stated `doc_type = None` when files are actually skipped, (2) `FILENAME_KEYWORDS` placement instruction lacked section context, (3) `run_ocr.py` proposed code discarded the `used_ocr` flag instead of preserving it, (4) Section 6 auto-match shortcut duplicated an existing `if not templates` guard.

## Key Decisions

- Architecture diagram should reflect actual code behavior — unclassified files are skipped (`continue`), not assigned `doc_type = None`
- `used_ocr` flag should be preserved in `run_ocr.py` for future scanned-PDF tracking, unlike in `_process_folder` where it's not needed
- Proposed code insertions must not duplicate existing guards already in the codebase

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-tiered-identification-implementation.md]] | `updates` | Fixed 4 issues: diagram wording, FILENAME_KEYWORDS placement, used_ocr flag in run_ocr, duplicate guard in auto-match shortcut |
|[[vault/conversations/2026-03-15-1549-tiered-identification-spec-fix.md]]| `refines` |Second round of spec fixes, following the initial 4 stale line-reference fixes|
