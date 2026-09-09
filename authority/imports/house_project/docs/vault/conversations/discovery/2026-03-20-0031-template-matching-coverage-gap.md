---
tags: [ccb, pipeline]
node_type: discovery
is_session: true
layer: [domain, application]
nature: [technical, explanatory]
status: active
created: 2026-03-20
timestamp: 2026-03-20T00:31:00-03:00
expires: 2026-05-19
conversation_id: 7a73a9a1-06da-4852-b472-64246c280598
decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/template-matching-coverage-discovery.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Identified a systematic template matching coverage gap — cross-emitter Jaccard scores fall to 0.00–0.33 vs 0.85 threshold — blocking all new-emitter bulk imports from progressing through the pipeline."
satisfaction: { mean: 7, min: 6, max: 8, std: 0.7 }
version: 0.1.0
last_updated: 2026-03-20
---

# Template Matching Coverage Gap Investigation

**Date:** 2026-03-20 00:31 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session investigated why bulk import batch 110 (`KITs Compartilhados-20260320`) had CCBs and Averbações correctly classified by doc_type but failing to match any registered template. The investigation started with infrastructure questions (MinIO init container purpose, remessa upload behavior with non-CSV files), progressed to debugging batch 109's failure (exceeded the 200 leaf folder limit), and culminated in a deep analysis of the template matching gap in batch 110.

The root cause was identified: the Jaccard text similarity between documents from new emitters/portals and existing templates falls far below the 0.85 threshold (0.33 for CCBs, 0.00–0.09 for Averbações). This is by design — different emitter layouts legitimately produce different text — but the system has no mechanism to signal "new emitter detected" vs generic "no template found." A discovery document was created with five possible solutions ranging from immediate (register more templates) to ambitious (LLM-assisted extraction).

### MinIO Init Container Investigation
- **Problem/Goal:** User asked what `minio_init` does and why it's not running
- **Decision:** No issue — it's a one-shot init container that creates the `remessas` and `documents` buckets, exits with code 0, and stays stopped
- **Changes:** None — informational only

### Non-CSV Files in Document Upload
- **Problem/Goal:** User asked what happens if Excel/CSV files are included in a document folder upload
- **Decision:** Current behavior is correct — `BULK_IMPORT_SUPPORTED_EXTENSIONS` only includes PDFs and images; non-matching files are silently ignored
- **Changes:** None — noted that there's no operator warning for skipped files

### Batch 109 Failure Analysis
- **Problem/Goal:** Batch 109 (`KITs Compartilhados`) failed — needed to diagnose why
- **Decision:** The zip exceeded `BULK_IMPORT_MAX_LEAF_FOLDERS = 200`. User chose to trim the zip rather than increase the limit
- **Changes:** None — user re-uploaded a smaller zip as batch 110

### Template Matching Coverage Gap (Core Finding)
- **Problem/Goal:** In batch 110, 21 CCBs and 24 Averbações were classified by doc_type keywords but matched no template (`reason = no_template`)
- **Decision:** The gap is structural — templates are emitter-specific, and this batch contains documents from emitters not yet registered. Jaccard similarity: CCB→template = 0.33 (threshold 0.85), Averbação→Dataprev = 0.004, Averbação→SAPE = 0.09
- **Changes:** Created `specs/002-ccb-validation-workflow/template-matching-coverage-discovery.md` with root cause analysis and 5 solution proposals

Key outputs:
- `specs/002-ccb-validation-workflow/template-matching-coverage-discovery.md` — discovery document with root cause, impact, and 5 ranked solutions

## Key Decisions

- **Keep the 200-folder limit:** Increasing `BULK_IMPORT_MAX_LEAF_FOLDERS` was rejected due to performance concerns (more Celery tasks, more OCR load)
- **No code changes for now:** The template matching gap needs new templates registered first (immediate fix), with `unknown_emitter` signaling as a short-term code improvement

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/template-matching-coverage-discovery.md` | `created` | Discovery artifact documenting the template matching coverage gap, root cause analysis with real Jaccard scores, and 5 solution proposals |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Register CCB templates for new emitters in batch 110 | This session | ⚠️ HIGH | Open |
| Register Averbação template for "Portal de Operações" portal | This session | ⚠️ HIGH | Open |
| Add `unknown_emitter` distinct reason to pipeline | Discovery doc, Solution 2 | MEDIUM | Open |
| Add operator warning for skipped non-PDF/image files in bulk import | Session observation | LOW | Open |

## Open Questions

- How many distinct CCB emitter layouts exist across all clients? This determines whether Solution 1 (manual registration) is sustainable or if an automated clustering approach (Solution 3) is needed.
- Should the pipeline store Jaccard scores for near-misses to help operators identify which existing template was "closest" to an unmatched document?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/template-matching-coverage-discovery.md]] | `implements` | Discovery artifact created during this session |
| [[002-ccb-validation-workflow/ccb-spec-v1.md]] | `questions` | The spec does not address cross-emitter template coverage — this session surfaced the gap |
| [[002-ccb-validation-workflow/system-fragilities.md]] | `contextualizes` | Template matching gap is a new fragility not yet listed |
