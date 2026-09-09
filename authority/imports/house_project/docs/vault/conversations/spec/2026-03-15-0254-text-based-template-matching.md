---
tags: [#ccb, #refactor, #spec]
layer: architecture
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T02:54:12-03:00
expires: 2026-05-14
conversation_id: e9761adf-5707-4aab-8a8c-095ed5a9943f
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 6
importance_rationale: "Designed text-based template matching as alternative to perceptual hashing, pivotal technical decision."
---

# Text-Based Template Matching for Document Identification

**Date:** 2026-03-15 02:54 (UTC-3)  
**Tags:** #ccb #refactor #spec

## Summary

Analyzed the fragility of perceptual hash (pHash) for document identification. Empirically proved pHash cannot discriminate between text-heavy legal documents (Antifraude, Averbação) — Hamming distances 22–26 all exceed threshold 10. Implemented Jaccard text similarity as the primary matching strategy (Tier 1) in `find_matching_template`, with pHash demoted to Tier 2 fallback for image-only documents. Empirical Jaccard scores: correct match = 0.98–1.00, wrong type = 0.00–0.03. Created `business-rules.md` documenting the full identification flow.

## Key Decisions

- **Jaccard text similarity replaces pHash as primary matching** for text-extractable documents. pHash remains as fallback for scanned PDFs and images only.
- **`document_payload` field** in `DocumentTemplate` is now populated with extracted template text at registration time via `register_template`.
- **Threshold of 0.15** for `TEXT_SIMILARITY_THRESHOLD` — conservative given the wide decision boundary (1.0 vs 0.03).
- **Two-step identification preserved**: Step 1 (keyword regex) classifies `doc_type`, Step 2 (`find_matching_template`) selects the specific template variant within that type.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Updated tiered identification backlog item with partial implementation status and remaining items |
|[[002-ccb-validation-workflow/business-rules.md]]| `implements` |New document explaining the full identification flow (keyword classification → Jaccard/pHash template selection)|
| [[aquisicao/use_cases/manage_document_template.py]] | `updates` | Added `_text_similarity`, modified `register_template` (payload), refactored `find_matching_template` (Tier 1 text, Tier 2 pHash) |
| [[aquisicao/domain/template_matching_config.py]] | `updates` | Added `TEXT_SIMILARITY_THRESHOLD` constant |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | Passes `file_text` to `find_matching_template` |
