---
tags: [spec, ccb, models]
layer: domain
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T16:32:20-03:00
expires: 2026-05-11
conversation_id: ac27fa9a-643b-4c5b-8998-edb1f86027c2
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 6
importance_rationale: "Designed perceptual hashing approach for document template matching, novel technical decision."
---

# Perceptual Hashing — Algorithm Review & Backlog

**Date:** 2026-03-12 16:32 (UTC-3)  
**Tags:** #spec #ccb #models

## Summary

Reviewed the perceptual hashing implementation for CCB template matching against the spec. Found that the code used `pHash` (DCT-based) in two independent call sites while the spec mandated `dhash` (gradient-based). Identified three additional gaps: the Hamming distance threshold is a global constant (not per-template), `DocumentVersion` is missing a `perceptual_hash` field, and the threshold value (`10`) differs from the spec default (`12`) with no documented rationale. All findings were added to the backlog as HIGH priority items.

## Key Decisions

- **`dhash` is the correct algorithm**, not `pHash`. For layout-heavy legal documents, `dhash` is faster and equally precise. All file types (PDFs and images) must use the same algorithm — only the image acquisition step differs (render vs. open).
- **Both call sites must be fixed**: `manage_document_template._compute_fingerprint` (registration) and `process_bulk_import._process_folder` (matching). Using different algorithms between them makes Hamming distances meaningless.
- **`BinaryField` (8 bytes) is the correct storage type** — already implemented. The spec's `CharField(max_length=64)` suggestion was discarded in favour of binary.
- **Threshold must be per-template** (`similarity_threshold` column on `DocumentTemplate`), not a global constant — different bancarizadores may need different tolerances.
- **`DocumentVersion` needs a `perceptual_hash = BinaryField(null=True)`** field, set at identification time in `_process_folder` and during single-file OCR in `run_ocr.py`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Added 3 HIGH priority items: dhash switch, similarity_threshold column, perceptual_hash on DocumentVersion |
