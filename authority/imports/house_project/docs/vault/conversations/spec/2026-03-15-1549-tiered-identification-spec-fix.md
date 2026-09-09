---
tags: [spec, ccb]
layer: domain
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T15:49:01-03:00
expires: 2026-05-14
conversation_id: 2df339f6-cb69-418c-8a51-2db53469e459
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 5
importance_rationale: "Fixed tiered identification spec, aligning document classification with domain reality."
---

# Fixing Tiered Identification Spec Inconsistencies

**Date:** 2026-03-15 15:30 (UTC-3)  
**Tags:** #spec #ccb

## Summary

Cross-referenced all 7 sections of the Tiered Document Identification implementation plan (`tiered-identification-implementation.md`) against the current codebase. Found and fixed 4 minor inconsistencies — all stale line references that drifted after small edits. Also added a clarifying note about per-template `similarity_threshold` vs the global `TEMPLATE_SIMILARITY_THRESHOLD` constant.

## Key Decisions

- Line references in specs should be treated as approximate and verified before implementation
- `find_matching_template` uses per-template `similarity_threshold` (not the global constant) — documented in the spec now

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/tiered-identification-implementation.md]] | `updates` | Fixed 4 stale line references (run_ocr.py 78→79, register_template 130→133, find_matching_template 317→318) and added note about per-template threshold |
