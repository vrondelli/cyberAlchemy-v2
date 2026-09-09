---
tags: [ccb, spec, templates]
layer: domain
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T13:58:00-03:00
expires: 2026-05-15
conversation_id: c54bc1fc-b2df-4531-a3e2-2b5060147d7f
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 5
importance_rationale: "Validated KitType template system end-to-end, confirming spec-to-implementation alignment."
---

# Assessing KitType with Template Implementation Plan

**Date:** 2026-03-16 13:58 (UTC-3)  
**Tags:** #ccb #spec #templates

## Summary

Assessed the implementation plan for `KitType.required_docs` template validation in the CCB workflow. Discovered critical gaps where `required_docs` transition from a list of strings to a list of dicts breaks existing set operations in the pipeline. Also identified that the plan lacked the actual runtime enforcement logic to verify the template ID during folder compilation. Updated the spec with a new Phase to address these issues.

## Key Decisions

- **Runtime Template Validation:** Added explicit logic to `process_bulk_import.py` to enforce that uploaded documents match the strict `template_id` requested by the kit configurations.
- **Backwards Compatibility:** Fixed the `required_docs_count` generation logic by extracting `"doc_type"` from the new dictionary structure before performing set operations.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/kittype-with-template-implementation.md]] | `updates` | Added Phase 3: Runtime Completeness & Validation (Fixes) and new test requirements. |
