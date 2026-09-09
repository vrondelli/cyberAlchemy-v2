---
tags: [ccb, domain, application]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-05-05
timestamp: 2026-05-05T14:00:00-03:00
expires: 2026-07-04
conversation_id: 234bd174-77ef-4c38-9b0e-0e442ad9e7e3
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Closes a concrete coverage gap for CCB template 3 and documents a non-trivial OCR layout discovery (next-line values) that must be preserved to avoid repeating the same debugging cycle for future templates."
---

# CCB Template 3 — Extractor and Extraction Config

## Summary

The session identified two gaps for `ccb-consig-template3` (CCBTemplate id=3, DocumentTemplate id=19): missing `sections_extractor_ref` and missing `extraction_config`. A thin extractor module was created following the same pattern as templates 1 and 2, and a data migration (0053) was written to populate both DB fields. The key discovery was that template 3's OCR text uses a next-line layout (`Label:\nValue`) rather than same-line; monetary fields carry an `R$\n` prefix and some section labels (3.9, 3.13, 3.14, 3.15) have no colon at all. Initial patterns failed (22 hits, 34 misses); after correction, validation showed 51 hits, 0 false positives, and 5 legitimate misses (fields genuinely absent in the test document).

## Files touched

- `domains/documents_validation/extractors/ccb/ccb_consig_template3.py`
- `migrations/aquisicao/0053_ccb_template3_extractor_and_extraction_config.py`
