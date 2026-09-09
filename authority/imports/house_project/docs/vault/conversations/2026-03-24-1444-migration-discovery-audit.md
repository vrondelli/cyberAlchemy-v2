---
tags: [ccb, pipeline]
node_type: audit
is_session: true
layer: [architecture, domain]
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T14:44:07-03:00
expires: 2026-05-23
conversation_id: cd07138e-e657-4a94-89cc-9fc7902e39ee
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: [
  "specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md",
  "specs/002-ccb-validation-workflow/backlog-ccb.md"
]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Audited CCB migration discovery document, identified a severe domain coupling violation with the Aquisicao module, and recorded it as high-priority technical debt."
---

# Auditing CCB Migration Discovery

**Date:** 2026-03-24 14:44 (UTC-03)
**Tags:** #ccb #pipeline

## Summary

This session focused on auditing the `documents-validation-migration-discovery.md` spec to align it with the project's ontology constitution and reality. We identified that the proposed "Lift and Shift" phase would introduce a severe domain isolation violation by moving `process_bulk_import.py` to a generic `documents_validation` domain while retaining its hard dependencies on `aquisicao` models. A decision was made to proceed with the physical move but officially track the domain coupling as critical technical debt in the backlog to be resolved in Phase 2. We also corrected numerous file names and function references within the discovery document.

### Domain Coupling in Lift and Shift
- **Problem/Goal:** Phase 1 of the document proposed moving `process_bulk_import.py` to `documents_validation` "exactly as it is" to isolate brittle document logic.
- **Decision:** Moving the file as-is couples the generic domain to `aquisicao` specific models like `BulkImportBatch` and `ContratoCCB`. We agreed to accept this temporary violation of the constitution to unblock Phase 1 but explicitly track it as critical tech debt.
- **Changes:** Updated `documents-validation-migration-discovery.md` with a note explicitly calling out the constitution violation. Added a critical item to `backlog-ccb.md`'s Technical Debt & Refactoring section detailing the required Phase 2 fix.

### Correcting File and Function References
- **Problem/Goal:** The discovery document had outdated or incorrect file pathways and function references (e.g., `cross_check_service.py` instead of `cross_check_extracted_fields.py`).
- **Decision:** Update the document to reflect the current physical file structure and accurate function namespaces.
- **Changes:** Renamed files and functions in the markdown (`_try_gemini_extraction` -> `extract_id_with_gemini`, `evaluate_kit_completion` scoping, `run_ocr.py` clarifications, removing `generate_checklist.py` from validation mapping).

Key outputs:
- `backlog-ccb.md` — Added critical technical debt regarding domain coupling.
- `documents-validation-migration-discovery.md` — Updated with fixes and constitution violation warning.

## Key Decisions
- **Domain Coupling Accepted Temporarily:** The lift and shift phase will proceed despite creating a hard cross-domain dependency, treated strictly as technical debt for Phase 2.
- **Backlog Tracking:** The domain violation has been properly logged in the CCB Backlog to ensure it isn't orphaned.

## Files Changed

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `modified` | Fixed file and function names, and added a blockquote regarding the constitution violation during Phase 1. |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `modified` | Added a critical backlog item under Technical Debt to decouple `aquisicao` dependencies from the `documents_validation` use case in Phase 2. |

## Gaps & Backlog
| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix Domain Isolation Violation in CCB Validation Migration | Lift and Shift | ⚠️ CRITICAL | Pendente |
