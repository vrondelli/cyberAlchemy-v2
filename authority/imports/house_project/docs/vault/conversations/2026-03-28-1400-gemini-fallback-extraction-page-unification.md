---
tags: [pipeline, ccb, architecture, application]
node_type: spec
is_session: true
layer: domain, application
nature: technical
status: active
created: 2026-03-28
timestamp: 2026-03-28T14:00:00-03:00
expires: 2026-05-27
conversation_id: 3fb790e7-e80f-4b3b-abe2-ecbe3681827c
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - specs/002-ccb-validation-workflow/ccb-documents-check-logic-implementation.md
  - specs/002-ccb-validation-workflow/ccb-tiered-identification-implementation.md
promoted_candidates:
  - extraction_config schema contract (mechanics only, no validation thresholds) → candidate for domain constitution/premise
  - two-tier Gemini extraction design (primary vs. fallback) → candidate for standalone spec
  - pages-only key rule → candidate for extraction config reference spec
expected_importance: 8
importance_rationale: "Fixed a silent data-correctness bug where stale DB content overwrote fallback critical fields, established a governing schema contract for extraction_config, and expanded Gemini coverage to four previously unserved document types while halving the complexity of the pipeline's largest file."
---

# Gemini Fallback Extraction, Critical Fields Bug Fix, and page → pages Unification

**Date:** 2026-03-28 14:00 (UTC-3)
**Tags:** #pipeline #ccb #architecture #application

## Summary

This session had five distinct threads, all converging around the bulk import extraction pipeline. The entry point was a batch investigation that surfaced a coverage gap; the investigation then revealed a data-correctness bug hiding in the extraction config system; the refactoring uncovered an architectural confusion between extraction mechanics and validation thresholds; and the session closed with a key unification eliminating a legacy ambiguity.

### Thread 1 — Batch investigation: missing templates (Kit_Lastros-20260328)

The batch had 15 Averbação documents all reporting `no_template`. Investigation confirmed no ConsigWel MG Averbação template was registered. This raised the more important question: what extraction happens when no template is found? The answer was: universal regex only — Gemini was never called for Averbação, CCB, Antifraude, or ComprovanteEmprestimo unmatched documents. The gap was total: these documents would either extract via weak fallback regex or fail silently.

### Thread 2 — Gemini fallback for four new doc_types

The user requested new Gemini prompts to serve as last-resort fallback for the four types not previously covered. Four system prompts were added to `gemini_config.py` targeting only critical fields, written in Portuguese (no field key mapping needed since the extraction schema already uses Portuguese keys). Four thin wrapper functions were added to `gemini_extraction.py` delegating to a new generic `extract_doc_with_gemini`. Four feature flags were added to `bulk_import_config.py`.

**Mistake and correction**: The first implementation wired all four new types into `_try_gemini_extraction`, making Gemini run first — before regex — for all doc types. The user corrected this: "Gemini should never be the first, just for holerite and identificacao." The final design splits the routing into two distinct functions:

- `_try_gemini_extraction`: primary pass — only Identificacao and Holerite
- `_try_gemini_extraction_fallback`: last resort — CCB, Averbação, Antifraude, ComprovanteEmprestimo, runs only after cheaper methods fail

The extraction waterfall for all doc_types is now explicit:
1. Primary Gemini (Identificacao/Holerite only)
2. Template regex (matched path) or Universal regex (unmatched path)
3. Fallback Gemini (CCB/Averbação/Antifraude/ComprovanteEmprestimo)
4. Total failure

### Thread 3 — Refactoring process_bulk_import.py

`process_bulk_import.py` was 2394 lines with all orchestration and extraction logic co-located. All `_step_*` functions and their helpers were extracted into a new `extraction_steps.py` module (~1410 lines), reducing `process_bulk_import.py` to ~1052 lines of pure orchestration (batch/folder management, zip upload infra, public API). The separation makes each layer independently readable and testable.

### Thread 4 — Critical fields resolution bug

Two documents showed "Campos críticos ausentes" despite having the required fields present:
- An RG with CPF, nome, and id_documento present, but flagged for missing `data_nascimento`
- An Averbação with CPF present, but flagged for missing fields that are not critical for Averbação

**Root cause**: `_resolve_critical_fields` was calling `_get_default_extraction_configs()`, which merged all registered templates' `extraction_config` blobs into the fallback. Several templates had stale `critical_fields` inside their `extraction_config` JSON column (e.g. template 10 had `critical_fields: ["cpf", "nome_trabalhador", "numero_contrato", "valor_liberado", "valor_parcela"]`). When an unmatched document was evaluated, it was checked against these template-specific requirements rather than the lean fallback JSON.

**Two coordinated fixes applied**:
1. `_resolve_critical_fields` changed to call `_load_json_fallback_configs()` directly when no template is matched — this reads only the `*_fallback.json` files, never the DB templates
2. SQL stripped `critical_fields` and `non_critical_fields` from all `extraction_config` DB columns on 6 rows (IDs 9, 10, 11, 13, 15, 18):
   ```sql
   UPDATE document_template
   SET extraction_config = extraction_config - 'critical_fields' - 'non_critical_fields'
   WHERE extraction_config ?| ARRAY['critical_fields', 'non_critical_fields'];
   ```

**Rule now enforced by design**: `extraction_config` stores only extraction mechanics — `fields` (regex patterns), `pages` (PDF pages to read), `field_types` (number/date post-processing), `table_columns` (structured table parsing). Critical and non-critical field lists live exclusively in the `critical_fields` and `non_critical_fields` model columns (for matched templates) or in `*_fallback.json` files (for unmatched documents).

### Thread 5 — page → pages unification

The `extraction_config` schema had two keys for page selection: `pages` (list, standard) and `page` (int, legacy). Every consumer — `ocr_service.run_ocr`, `extraction_steps._step_extract_matched_non_ccb`, `extraction_steps._step_extract_matched_ccb`, `run_ocr.py` — had a backwards-compat block checking `page` when `pages` was absent. `holerite_fallback.json` was the only fallback JSON still using the singular form.

The decision was to drop `page` entirely. All consumers now use `pages = extraction_config.get('pages', [0])`. The spec files referencing the old transition pattern were updated. DB migration SQL provided:
```sql
UPDATE document_template
SET extraction_config = jsonb_set(
    extraction_config - 'page',
    '{pages}',
    jsonb_build_array(extraction_config->'page')
)
WHERE extraction_config ? 'page'
  AND NOT extraction_config ? 'pages';
```

## Epistemic Impact

**Belief corrected**: `extraction_config` was implicitly treated as a general-purpose blob. The critical-fields bug exposed that mixing validation thresholds into the mechanics blob creates silent cross-contamination between templates and unmatched-document paths. The corrected rule is now active in code and DB.

**Spec drift fixed**: `ccb-documents-check-logic-implementation.md` and `ccb-tiered-identification-implementation.md` both still showed the `page`/`pages` transition pattern with the backwards-compat fallback. Both corrected to the unified form.

**Promoted candidates**:
- The `extraction_config` schema contract (mechanics only) should become a domain-level constitution or premise — it is a governing rule for all future template registration.
- The two-tier Gemini extraction design should be captured as a standalone spec for the Gemini subsystem.
- The `pages`-only key should be added to the extraction config reference spec.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `domains/documents_validation/use_cases/extraction_steps.py` | Created | New module (~1410 lines) extracted from `process_bulk_import.py`; contains all `_step_*` functions, supporting helpers, `_resolve_critical_fields` bug fix, and `page` key removal. |
| `domains/documents_validation/repositories/management/commands/register_siapenet_template.py` | Created | New Django management command to register Siapenet templates. |
| `domains/documents_validation/repositories/management/commands/sanitize_template_payload.py` | Created | New management command to strip disallowed fields from `extraction_config` DB columns. |
| `domains/documents_validation/services/gemini_config.py` | Modified | Added 4 system prompts + user messages (CCB, Averbação, Antifraude, ComprovanteEmprestimo) targeting critical fields only in Portuguese. |
| `domains/documents_validation/services/gemini_extraction.py` | Modified | Added `extract_doc_with_gemini` generic extractor + 4 thin wrappers. Wires the new fallback extraction path. |
| `domains/documents_validation/domain/bulk_import_config.py` | Modified | Added 4 feature flags for Gemini fallback activation per doc type. |
| `domains/documents_validation/use_cases/process_bulk_import.py` | Modified | Reduced from 2394 to ~1052 lines; step functions moved to `extraction_steps.py`. Now pure orchestration. |
| `domains/documents_validation/services/ocr_service.py` | Modified | `run_ocr` updated to use `pages` only via `extract_text_pymupdf_pages`; `page` fallback removed. |
| `domains/documents_validation/use_cases/run_ocr.py` | Modified | `page` fallback removed; `pages = extraction_config.get('pages', [0])`. |
| `domains/documents_validation/domain/extraction_configs/holerite_fallback.json` | Modified | `"page": 0` → `"pages": [0]`. |
| `domains/documents_validation/tests/conftest.py` | Modified | Import paths updated after extraction_steps.py refactor. |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | Modified | Imports updated to pull step functions from `extraction_steps` module. |
| `specs/002-ccb-validation-workflow/ccb-documents-check-logic-implementation.md` | Modified | Diffs updated to unified `pages` pattern; stale backward-compat test reference removed. |
| `specs/002-ccb-validation-workflow/ccb-tiered-identification-implementation.md` | Modified | `page` → `pages` correction in all code examples and diffs. |
| `document_template` table (DB) | Modified | Stripped `critical_fields` and `non_critical_fields` from `extraction_config` on 6 rows (IDs 9, 10, 11, 13, 15, 18) via direct SQL. |

## Connections

- derives-from: `specs/002-ccb-validation-workflow/ccb-documents-check-logic-implementation.md` — the multi-doc extraction pipeline spec this session extended
- contextualizes: `docs/vault/conversations/2026-03-24-1502-ccb-validation-migration-phase1-plan.md` — prior phase that established the extraction config schema before the schema contract was enforced

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Register ConsigWel MG Averbação template (trigger for Thread 1) | Thread 1 investigation | HIGH | Open |
| Promote `extraction_config` schema contract to a domain constitution/premise | Thread 4 root cause | HIGH | Open |
| Document two-tier Gemini extraction design as standalone spec | Thread 2 design | HIGH | Open |
| Validate fallback Gemini prompts against real production documents for all 4 new doc_types | Thread 2 prompts | MEDIUM | Open |
| Run `page → pages` DB migration SQL on production | Thread 5 | MEDIUM | Open |
| Add `pages`-only key rule to extraction config reference spec | Thread 5 | MEDIUM | Open |

## Open Questions

- Are there any other templates beyond the 6 identified that have stale `critical_fields` in `extraction_config`? (The SQL cleanup was targeted — a broader audit may be warranted.)
- Should `extract_doc_with_gemini` be versioned with the Gemini model (`gemini-2.5-flash`) hardcoded, or should the model be configurable per doc_type via `gemini_config.py`?
