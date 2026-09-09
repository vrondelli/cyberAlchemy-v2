---
tags: [pipeline, acquisition, application]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-06
timestamp: 2026-04-06T14:10:57-03:00
expires: 2026-06-05
conversation_id: 2026-04-06-1410-identificacao-filename
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed Tier 0 filename regex anchoring bug that caused RGF/RGV/CNHF/CNHV and CPF-prefixed Identificacao files to slip through classification."
---

# Identificacao Filename Classification Fix

**Date:** 2026-04-06 14:10 (UTC-3)
**Tags:** #pipeline #acquisition #application

## Summary

The session addressed a gap in Tier 0 filename-based classification of Identificacao documents in the bulk import pipeline. The user asked how the system identifies Identificacao documents today, specifically wondering about filenames containing `RGF`, `RGV`, `CNHF`, `CNHV` suffixes (frente/verso convention). Investigation revealed that the existing regex patterns in `FILENAME_KEYWORDS` used start-of-string anchors (`^RG\d*[_\-]`, `^CNH\d*[_\-]`) which missed both the F/V suffix variants and filenames where a CPF number or other prefix precedes the keyword (e.g., `021.580.077-02_RGF.jpeg`).

The initial fix added `^RG[FV]` and `^CNH[FV]` patterns, but real production data (screenshot of a bulk import batch) showed documents like `021.580.077-02_RGF.jpeg` still unclassified because the `^` anchor required the keyword at the start. The user then clarified the rule should be broader: any filename containing `RG`, `CNH`, or `CPF` (with or without F/V suffix), bounded by separators or string boundaries, should classify as Identificacao.

The final patterns use `(?:^|[_\-\.])` as a left boundary and `(?:[_\-\.]|$)` as a right boundary, with the keyword optionally followed by `[FV]` and `\d*`. The existing merge logic (`_step_merge_identificacao`) already handles grouping all Identificacao documents and merging them into a single PDF, so no changes were needed there. CPF was also added as a keyword mapping to Identificacao for filename classification purposes.

## Epistemic Impact

The prior assumption that Tier 0 filename classification had adequate coverage for Identificacao was disproved by production data. The `^` start-of-string anchor was incorrect for real filenames where a CPF number precedes the document type keyword. The merge logic in `_step_merge_identificacao` was confirmed correct as-is — no change required.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/documents_validation/domain/template_matching_config.py` | modified | `FILENAME_KEYWORDS` Identificacao regex patterns rewritten: removed `^` anchor, added separator boundaries, added `[FV]` optional suffix, added CPF keyword |
| `domains/documents_validation/tests/test_ocr.py` | modified | Added `test_identificacao_front_back_variants` covering RGF, RGV, CNHF, CNHV suffixes and prefix-bearing filenames |

## Connections

- contextualizes: `docs/vault/dictionary-business.md` (Identificacao document type)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| F/V suffix convention (RGF/RGV/CNHF/CNHV) not in dictionary | session observation | LOW | open |
