---
tags: [extraction-tier2, repository-pattern, folder-state, refactoring, domain-purity]
node_type: discovery
is_session: true
layer: [domain, infrastructure]
nature: [technical]
status: active
veracidade: high
convicção: high
created: 2026-04-13
timestamp: 2026-04-13T20:00:00-03:00
expires: 2026-06-12
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Fixes two concrete domain purity violations in the shipped Tier 2 code (SSOT on FolderState, ORM in pipeline steps) and documents 5 structural patterns the codebase now follows."
---

# Tier 2 Refinement — Review + N2/N3 Repository Fix

## Objective

Record the live code review of the Tier 2 refinement discovery, the new problems found, and the two fixes implemented in this session.

## Summary

Reviewed the Tier 2 refinement discovery against live code, confirmed all 7 documented problems real. Found 3 new problems: N1 (`tenant_id=None`, deferred), N2 (`FolderState` SSOT violation — 3 redundant CCB fields duplicating `state.ccb_dv`, removed), N3 (direct ORM calls in 3 pipeline steps bypassing repository layer — 9 methods added to `BulkImportRepository`, DI via `repository_factory` injected). All 5 tests passing after fixes. P4 (single-writer violation on `outcome.critical_check`) deferred to Tier 2 refinement work.

## Files touched

- `domains/documents_validation/domain/extraction/folder_state.py`
- `domains/documents_validation/domain/extraction/steps/extract.py`
- `domains/documents_validation/domain/extraction/steps/contrato_lookup.py`
- `domains/documents_validation/domain/extraction/steps/cross_check.py`
- `domains/documents_validation/domain/extraction/steps/kit_evaluation.py`
- `infrastructure/repositories/bulk_import_repository.py`
