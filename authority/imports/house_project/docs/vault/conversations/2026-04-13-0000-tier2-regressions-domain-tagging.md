---
tags: [extraction-tier2, regression, domain-tagging, dictionary, behavior-preservation]
node_type: audit
is_session: true
layer: [use_cases, domain]
nature: [technical]
status: active
veracidade: high
convicção: high
created: 2026-04-13
timestamp: 2026-04-13T00:00:00-03:00
expires: 2026-06-12
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Finds and fixes 6 live behavioral regressions in the shipped Tier 2 refactor, plus adds domain tags and dictionary entries for all 5 new abstractions — both are critical stabilization work on production code."
---

# Tier 2 Post-Implementation — Regressions Fixed & Domain Tags Added

## Objective

Record the behavioral regression audit of the shipped Tier 2 extraction refactor, the 6 fixes applied, and the domain tagging session that followed.

## Summary

Found and fixed 6 live regressions: `TemplateRegexExtractor` returning empty outcome instead of `None` (short-circuiting fallback), `UniversalRegexExtractor` missing from CCB strategy, non-critical gate triggering for matched CCB, garbled-text gate lost for matched non-CCB, DV reason overwritten to `REASON_NO_TEXT_FOUND` on CCB match, and `fields=None` misrouting folder to wrong outcome. Fixed 3 secondary issues (test-patch bypass via re-routed extractor imports, missing `process_bulk_import` re-exports, unconditional `dv.extracted_data` overwrite). Added domain tags and dictionary entries to all 5 new Tier 2 abstractions. 806 tests passed. A follow-up sub-session wrote 22 missing unit tests across 3 new test files (`test_outcome.py`, `test_dispatcher.py`, `test_apply_outcome.py`).

## Files touched

- `domains/documents_validation/domain/extraction/outcome.py`
- `domains/documents_validation/domain/extraction/extractor.py`
- `domains/documents_validation/domain/extraction/policy.py`
- `domains/documents_validation/domain/extraction/registry.py`
- `domains/documents_validation/domain/extraction/extractors/cascade.py`
- `domains/documents_validation/domain/extraction/extractors/template_regex.py`
- `domains/documents_validation/domain/extraction/extractors/universal_regex.py`
- `domains/documents_validation/use_cases/extraction_steps.py`
- `domains/documents_validation/use_cases/process_bulk_import.py`
- `docs/vault/dictionary-business.md`
- `docs/vault/dictionary-sys.md`
- `tests/domain/extraction/test_outcome.py`
- `tests/domain/extraction/test_dispatcher.py`
- `tests/domain/extraction/test_apply_outcome.py`
