---
tags: [ccb, document-extraction, template-matching, architecture, registration]
node_type: discovery
is_session: true
layer: domain, application
nature: explanatory, technical
status: active
created: 2026-05-01
timestamp: 2026-05-01T11:00:00-03:00
expires: 2026-06-30
conversation_id: 0508c6d9-919e-43e8-aa15-d83a4a6fa138
decisions_made: true
contradictions_found: false
specs_updated: [specs/ccb-template-matching/ccb-template-registration-extractors.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Establishes the architectural pattern for per-template extractors, shaping how all future CCB templates will be onboarded and matched."
---

# CCB Template-Specific Extractors Architecture

## Summary

Explored the `internal_tools/ccb-registration-demo` to verify current CCB extraction state — confirmed working blind splitter, comparison script, Streamlit UI, and persistence layer (`register_ccb_template()`), with one CCBTemplate already in the DB. The user proposed an architecture where each `CCBTemplate` row links to a template-specific Python extractor file (one per template, in `domains/documents_validation/use_cases/ccb_extractions/`) instead of relying on a single generic `blind_split()` for all templates. A discovery doc was written outlining the module structure, pure-function extractor interface (`extract(pdf_bytes) → SplitComponents`), dynamic loading via `extractor_ref`, handwritten-vs-generated tradeoffs (handwritten for v1), and the migration path from generic to specialized extractors.

## Files touched

- specs/ccb-template-matching/ccb-template-registration-extractors.md
