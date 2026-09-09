---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: application
nature: [technical, reference]
status: active
created: 2026-03-23
timestamp: 2026-03-23T20:54:00-03:00
expires: 2026-05-22
conversation_id: d0f46d46-c2ea-4078-841a-d1b562a8d4eb
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/upload-flow-diagram.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Corrected 8 divergences between the canonical pipeline flowchart and the actual code, ensuring future agents and humans reason from an accurate diagram of the 3-phase bulk import pipeline."
---

# Upload Flow Diagram Review & Correction

**Date:** 2026-03-23 20:54 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session audited the Mermaid flowchart in `upload-flow-diagram.md` against the actual implementation in `process_bulk_import.py`, `run_ocr.py`, and `universal_extraction.py`. The diagram's macro structure (3 phases: Folder Verification, Identification & Extraction, Deduplication & Cross-Check) was confirmed correct. However, 8 divergences were identified and corrected, the most critical being that Gemini extraction was shown only in one path when it actually runs in both template-matched and unmatched paths. All corrections were applied to the diagram and its accompanying prose.

### Diagram Audit Against Codebase
- **Problem/Goal:** Verify whether the user-provided Mermaid flowchart accurately represents the current implementation of the 3-phase bulk import pipeline.
- **Decision:** The diagram needed 8 corrections across all 3 phases, ranging from low to high severity.
- **Changes:** Created a detailed review artifact (`diagram_review.md`) cataloging all divergences with line references to `process_bulk_import.py`.

### Diagram & Prose Update
- **Problem/Goal:** Apply all identified corrections to `upload-flow-diagram.md`.
- **Decision:** Rewrote the entire Mermaid diagram and updated the explanatory prose to reflect the actual code flow.
- **Changes:** Updated `upload-flow-diagram.md` with:
  1. Pastas "only subdirs" shown as ignored (not `INVALID_STRUCTURE`)
  2. Added `REASON_NO_TEXT_FOUND` node separate from `REASON_NO_TEMPLATE`
  3. Gemini shown in both template and no-template paths
  4. Added CCB Fallback Cascade node (merge template + universal)
  5. Quality Gate IA reads "Campos Críticos (da Config JSON)" instead of hardcoded "Nome/CPF"
  6. Added intra-batch dedup in finalize
  7. Renaming moved to after cross-check (correct position)
  8. Added re-evaluation of Kit after contrato confirmation

Key outputs:
- `specs/002-ccb-validation-workflow/upload-flow-diagram.md` — corrected Mermaid diagram + updated prose

## Key Decisions

- **Gemini path restructure:** Gemini extraction is attempted first for Identificacao/Holerite docs regardless of template match status, falling back to regex on failure. The diagram now reflects this dual-path behavior.
- **CCB Fallback Cascade visibility:** The merge logic (universal base + template overlay) for CCBs with incomplete critical fields is now explicitly shown as a diagram node.
- **Quality Gates are config-driven:** All quality gate labels now reference config JSON sources instead of hardcoded field names.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Rewrote Mermaid diagram and prose to fix 8 divergences from actual code |

## Connections

- **validates:** `specs/002-ccb-validation-workflow/upload-flow-diagram.md` — this session verified and corrected the canonical pipeline diagram
- **references:** `domains/aquisicao/use_cases/process_bulk_import.py` — primary source of truth for the pipeline flow
