---
tags: [ccb, pipeline]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T21:14:52-03:00
expires: 2026-05-22
conversation_id: fe9f6d6e-59b3-4f55-b186-c7c8c74184f7
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Establishes Context Object pattern for decomposing `_process_folder` (617 LOC) into testable step functions across 2 dataclasses and 17 steps, defining the architecture for the upcoming Part C implementation."
---

# CCB Flow Refactor — Spec Review & God Function Decomposition Plan

**Date:** 2026-03-23 21:14 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session audited the `ccb-flow-refactor.md` spec for accuracy, corrected several issues found by cross-referencing against the actual codebase, and then designed and formalized a God Function decomposition strategy using the Context Object pattern. The session produced a complete Part C plan with two dataclasses, 17 step functions, orchestrators, an execution order, and a verification plan with 15 new test scenarios.

The work started with the user asking for a review of `ccb-flow-refactor.md`. Eight potential issues were identified, then verified against `process_bulk_import.py`. Three were confirmed as real problems (import duplicate count, missing Part A tests, incomplete Part B test scenarios), five were not problems (line numbers, save counts, LOC range were all accurate). The user then asked to map the pipeline's services against a handwritten 12-item decomposition list, which revealed 4 missing services (OCR, Contrato Lookup, Dedup, Rename) and 1 questionable one (Definir motivo). Finally, the Context Object approach was discussed, approved, and formalized in the spec.

### Spec Accuracy Audit

- **Problem/Goal:** Verify if the `ccb-flow-refactor.md` accurately reflects the current state of `process_bulk_import.py`
- **Decision:** 3 of 8 concerns were real; 5 were false positives
- **Changes:**
  - Fixed inline import duplicate count (3→4, `ProdutoKitConfig` was already top-level)
  - Reorganized test table separating Part A vs Part B with `[!WARNING]` about 4 missing Part A integration tests
  - Added 3 new B2 test scenarios for `_try_gemini_extraction`
  - Added `[!NOTE]` about B2→B4 import ordering dependency

### Service Decomposition Analysis

- **Problem/Goal:** The user had a handwritten 12-service list and wanted to verify completeness
- **Decision:** The list was missing OCR extraction, Contrato lookup, cross-batch dedup, and document rename. "Definir motivo" (status/reason) is not a standalone service — it's an accumulated side-effect of other services.
- **Changes:** Proposed a revised 15-service list as the basis for decomposition

### Context Object Pattern (Part C)

- **Problem/Goal:** Decomposing `_process_folder` (617 LOC) without creating functions with 10+ parameters
- **Decision:** Use `@dataclass` context objects (`DVProcessingContext` for per-DV pipeline, `FolderProcessingContext` for post-loop). Each step function mutates the context and can set `terminal=True` to short-circuit. The `dirty` set from B1 lives naturally in the context.
- **Changes:** Added full Part C to `ccb-flow-refactor.md` (v0.6.0) with C1–C7 sections, updated execution order (steps 8–13), and 15 new test scenarios

Key outputs:
- `ccb-flow-refactor.md` — Updated to v0.6.0 with Part C decomposition plan

## Key Decisions

- **Context Object over parameter-passing:** Avoids 10+ argument signatures; adding a new field requires changing only the dataclass, not N function signatures.
- **Two separate contexts:** `DVProcessingContext` (per-document) and `FolderProcessingContext` (post-loop/folder-level) because the per-DV loop and post-loop have fundamentally different state needs.
- **Terminal flag pattern:** Each step can mark `ctx.terminal = True` to short-circuit, with a guaranteed `_step_persist_dv` call before exit to prevent inconsistent DB state.
- **Part B is prerequisite for Part C:** Part B cleans the terrain (imports, saves, dead vars) so step functions are born clean.
- **Status/reason is NOT a standalone service:** It's an accumulated output of validation/extraction steps — extracting it as a separate function would create artificial coupling.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `modified` | Fixed import duplicate count, reorganized test tables, added Part C (God Function Decomposition via Context Object), updated execution order and verification plan. Version 0.4.0 → 0.6.0. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| 4 Part A integration tests never implemented (antifraude, averbação, comprovante) | Spec audit | ⚠️ MEDIUM | Documented in spec as "Part A gap" |
| Part B implementation (steps 3–7) | Spec | ⚠️ HIGH | Pendente — prerequisite for Part C |
| Part C implementation (steps 8–13) | Spec | MEDIUM | Pendente — depends on Part B completion |

## Open Questions

- Should Part C step functions live in the same file (`process_bulk_import.py`) or be extracted to a separate module (e.g., `process_folder_steps.py`)?
- Should the `_step_extract_fields` be further decomposed? It currently handles Gemini, regex, universal, and CCB fallback cascade — potentially the most complex single step.
