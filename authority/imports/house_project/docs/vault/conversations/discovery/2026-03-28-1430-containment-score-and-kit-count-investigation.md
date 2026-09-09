---
tags: [ccb, pipeline, application, architecture]
node_type: discovery
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-28
timestamp: 2026-03-28T14:30:00-03:00
expires: 2026-05-27
conversation_id: 68dedc1d-9adb-4862-9213-c7e1c5ede0a8
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - containment score as a premise (pending production validation)
  - _step_extract_matched_ccb reason gap as a dedicated discovery node
expected_importance: 7
importance_rationale: "The containment score change fixes a silent production failure causing real documents to fail template matching, and the session surfaces a latent bug in _step_extract_matched_ccb that will block any future CCB kit-count feature."
---

# Containment Score Metric Change + Kit Count Investigation

**Date:** 2026-03-28 14:30 (UTC-3)
**Tags:** #ccb #pipeline #application #architecture

## Summary

This session covered two distinct threads. The first was a diagnostic investigation into why `800786891_AVERB.pdf` failed to match `averbacao-siape-template`, which led to replacing the Jaccard similarity metric with a containment score — a concrete production fix that shipped. The second thread was a business rule proposal ("CCB should count in the kit even if no contrato is found, as long as critical fields were extracted") that was implemented, hit a debugging wall, and was fully reverted at the user's request.

### Thread 1 — Template Matching: Jaccard → Containment Score

**Problem:** `800786891_AVERB.pdf` wasn't matching `averbacao-siape-template`. The ask was to provide the Jaccard similarity and pHash distance between them. Investigation showed the Jaccard score was very low despite the document containing the template's vocabulary. Root cause: Jaccard is symmetric — it divides the intersection by the union, so a 4000-word document matched against a 200-word template produces a denominator of ~4000, collapsing the score to ~5% even when all 200 template words are present.

**Alternatives considered:**
- Keep Jaccard (existing, symmetric) — produces false negatives for long documents
- TF-IDF cosine similarity — heavyweight, not worth the overhead for this use case
- Containment score (`|template ∩ doc| / |template|`) — asymmetric, asks "does this document contain the template vocabulary?" rather than "are these texts of similar length?"

**Decision:** Containment score with the same threshold (0.90). Correct matches score ≥ 0.90 (all structural labels present); wrong-type matches score ≈ 0.00–0.10 (labels from a different template). The asymmetry is desirable: we don't care if the document has extra content beyond the template.

**Changes made:**
- `manage_document_template.py`: `_text_similarity` rewritten — from Jaccard to containment (`len(words_doc & words_tpl) / len(words_tpl)`)
- `template_matching_config.py`: `TEXT_SIMILARITY_THRESHOLD` comment updated to reflect containment semantics; numeric value unchanged at 0.90
- `test_document_template.py`: `test_partial_overlap` assertion updated; one test renamed from `..._jaccard` to `..._containment`; new test `test_rich_doc_sparse_template` added to assert the length-asymmetry property (long doc + short template → score = 1.0)

### Thread 2 — Kit Count Business Rule (proposed, reverted)

**Problem:** User observed a folder showing "3/5 docs" in the kit count and asked how it was computed. Investigation traced it to `evaluate_kit_completion` in `kit_matching.py`, which uses a greedy matching algorithm against `KitType.required_docs`. CCB is intentionally excluded from the step 2c pool and only added after contrato confirmation in step 4.

**Proposed rule:** "The document must count if the critical fields were extracted" — CCB should count toward the kit even when `ContratoCCB.DoesNotExist`, as long as the extraction reason is qualifying (in `_KIT_QUALIFYING_REASONS`).

**Implementation attempt:** Added kit re-eval in the `ContratoCCB.DoesNotExist` path of `_step_contrato_lookup`, capturing `original_ccb_reason` before overwriting it with `REASON_NO_ID_MATCH`. Also added a test `test_ccb_counts_in_kit_when_fields_extracted_even_without_contrato` asserting `documents_matched == 2`.

**Bug discovered:** The test was failing with `documents_matched=1`. Root cause identified: `_step_extract_matched_ccb` never sets `dv.reason` — it only saves `extraction_confidence`. So `original_ccb_reason = REASON_PENDING_OCR` (the creation default from `_setup_folder_with_dvs`), which is NOT in `_KIT_QUALIFYING_REASONS`. The conditional `if original_ccb_reason in _KIT_QUALIFYING_REASONS:` was therefore always False, and the kit re-eval was never triggered.

The fix was identified (set `dv.reason = REASON_EXTRACTED_NOT_CROSS_CHECKED` at the end of `_step_extract_matched_ccb`), but the user requested a full rollback before it was applied.

**Outcome:** All changes from this thread were reverted — `extraction_steps.py` and `test_parallel_bulk_import.py` restored to their pre-thread state.

## Epistemic Impact

**Belief falsified:** Jaccard is not a valid general-purpose metric for template matching in this pipeline. The semantic contract for matching is "does this document contain this template?" (containment), not "are these documents of similar vocabulary size?" (Jaccard). This was an implicit assumption held since template matching was introduced.

**Latent bug confirmed:** `_step_extract_matched_ccb` does not set `dv.reason`. Any CCB that goes through the template-matched path exits with `REASON_PENDING_OCR` as its interim reason. This is a silent gap: the field is technically saved correctly later by `_step_contrato_lookup`, but any logic that reads the reason *between* extraction and contrato lookup (such as the kit re-eval guard) will see a non-qualifying value. This bug was discovered during the rollback investigation, not proactively.

**Spec drift discovered:** The business rule "CCB counts in kit if fields extracted" has no implementation counterpart. The code currently requires contrato confirmation for CCB to count. This drift between user intent and system behavior is now documented here but remains unresolved.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `domains/documents_validation/use_cases/manage_document_template.py` | Modified | `_text_similarity` rewritten from Jaccard to containment score. Jaccard collapsed to ~5% for long documents against short templates, producing false negatives. Containment score asks only whether the template vocabulary is present in the document. |
| `domains/documents_validation/domain/template_matching_config.py` | Modified | Comment for `TEXT_SIMILARITY_THRESHOLD` updated to reflect containment semantics. No numeric change. |
| `domains/documents_validation/tests/test_document_template.py` | Modified | `test_partial_overlap` assertion updated for containment math; one test renamed; new `test_rich_doc_sparse_template` added asserting the length-asymmetry property. |
| `domains/documents_validation/use_cases/extraction_steps.py` | Modified then reverted | Business rule attempt: CCB to count in kit when fields extracted without contrato. Reverted before the `dv.reason` bug was fixed. Net change: zero. |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | Modified then reverted | Test scaffolding for the CCB kit-count business rule. Reverted alongside the implementation. Net change: zero. |

## Connections

- Relates to: `docs/vault/specs/002-ccb-validation-workflow/` — the kit count logic is part of the CCB pipeline
- Contextualizes: `domains/documents_validation/use_cases/extraction_steps.py::_step_extract_matched_ccb` — the reason-not-set gap is undocumented elsewhere

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| `_step_extract_matched_ccb` never sets `dv.reason` — matched CCBs remain at `REASON_PENDING_OCR` and cannot qualify for kit count without contrato | Latent bug discovered during rollback investigation | HIGH | Open |
| Implement CCB kit-count business rule: CCB should count in kit when critical fields extracted, even without ContratoCCB | User request, deferred at rollback | MEDIUM | Open |
| Validate containment score threshold (0.90) in production — confirm no false positives for short-template documents | Follow-up from metric change | MEDIUM | Open |

## Open Questions

- Should `_step_extract_matched_ccb` always set an interim reason (e.g., `REASON_EXTRACTED_NOT_CROSS_CHECKED` or `REASON_MISSING_CRITICAL`) so the state is meaningful between extraction and contrato lookup? Or is the current "overwritten later by `_step_contrato_lookup`" design intentional?
- What is the exact business definition of "critical fields extracted" for the CCB kit-count rule — is it all 6 critical fields, or any non-empty extraction?
