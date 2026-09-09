---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T15:30:00-03:00
expires: 2026-05-22
conversation_id: 48017d0e-6322-4252-93fe-27cf470ca1df
decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated:
  - specs/002-ccb-validation-workflow/ccb-flow-refactor.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established config-driven critical field validation architecture (no hardcoding) for `_process_folder` refactor — pattern all future doc types must follow."
satisfaction_score: 8
satisfaction_min: 6
satisfaction_max: 9
satisfaction_std: 1.0
version: 0.1.0
last_updated: 2026-03-23
---

# CCB Flow Refactor Spec Review & Critical Fields Alignment

**Date:** 2026-03-23 15:30 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session reviewed the `ccb-flow-refactor.md` spec (v0.1.0) for problems and inconsistencies, then applied a series of corrections based on user feedback to produce v0.2.0. The main themes were: eliminating hardcoded critical field fallbacks, aligning Holerite and Identificacao critical field schemas, and clarifying structural concerns like the B1+B3 dirty-save interaction.

The review identified 6 inconsistencies, 4 concerns/questions, and 3 minor observations in the original spec. The most impactful finding was that `_resolve_critical_fields()` had hardcoded Gemini fallbacks that contradicted the user's principle that critical fields should always come from config JSONs.

### Spec Review & Inconsistency Analysis

- **Problem/Goal:** Validate `ccb-flow-refactor.md` for correctness against the actual codebase.
- **Decision:** Several inconsistencies and a schema mismatch between Gemini and regex extraction paths were identified and flagged for resolution.
- **Changes:** Detailed analysis report delivered comparing spec claims vs actual code (line numbers, import counts, `dv.save` counts, dead variable claims).

### Removal of Hardcoded Critical Field Fallbacks

- **Problem/Goal:** `_resolve_critical_fields()` had a priority-3 fallback with hardcoded field lists per doc_type for Gemini paths, violating the principle that config JSONs are source of truth.
- **Decision:** Remove all hardcoded fallbacks. Introduce `DEFAULT_EXTRACTION_CONFIGS` — a dict loaded once at import from the JSON files — as the new priority-3 fallback. This ensures even unmatched documents get critical field validation from config.
- **Changes:** Rewrote `_resolve_critical_fields()` in the spec with 2 priorities (extraction_config, template model) + config-file fallback. Removed `gemini_succeeded` parameter.

### Holerite Critical Fields Alignment

- **Problem/Goal:** Holerite had two different critical field sets — regex (`nome, cpf, bruto, liquido`) vs Gemini (`nome_servidor, cpf, mes_ano_pagamento`) — creating confusion.
- **Decision:** Canonical critical fields for Holerite are `nome_servidor, cpf, mes_ano_pagamento`. The JSON config must be updated (Passo 0 in execution order).
- **Changes:** Updated `holerite_config.json` critical_fields in the spec table. Added execution step 0 for JSON alignment (rename `nome` → `nome_servidor`, move `bruto`/`liquido` to non-critical).

### Identificacao Critical Fields Decision

- **Problem/Goal:** Removing Gemini hardcoded fallback exposed a schema mismatch: `identificacao_generic.json` had `critical_fields: ["id_documento", "data_nascimento"]`, but Gemini doesn't extract `data_nascimento`.
- **Decision:** Set Identificacao critical fields to `["nome", "id_documento", "cpf"]` — flat list, all required. Moved `data_nascimento` to `non_critical_fields`.
- **Changes:** Updated both `identificacao_generic.json` (actual file) and the spec. Removed the WARNING about schema mismatch since it was resolved.

### B1 + B3 Dirty-Save Interaction

- **Problem/Goal:** B1 proposes consolidating saves via `dirty` set, but B3's download failure handler does a direct `dv.save()` + `continue`, bypassing the consolidated save.
- **Decision:** This is intentional — early-exit paths (`continue`) do direct saves since they never reach the consolidated save at the end of the loop.
- **Changes:** Added a NOTE to B1 section explicitly documenting this as intentional behavior.

Key outputs:
- `ccb-flow-refactor.md` — Updated to v0.2.0 with all corrections
- `identificacao_generic.json` — Critical fields changed to `["nome", "id_documento", "cpf"]`

## Key Decisions

- **No hardcoded critical fields:** `_resolve_critical_fields()` must never contain `if doc_type == "X": return [...]` blocks. Source of truth is always the extraction config JSON files.
- **`DEFAULT_EXTRACTION_CONFIGS` fallback:** When no template matches, critical fields are loaded from the default JSON config for the doc_type. This is a new mechanism added to the spec.
- **Holerite canonical fields:** `nome_servidor, cpf, mes_ano_pagamento` — used by both Gemini and regex paths.
- **Identificacao canonical fields:** `nome, id_documento, cpf` — all three required. `data_nascimento` demoted to non-critical.
- **Early-exit saves are OK:** Download failure and unclassifiable document paths do direct `dv.save()` before `continue`, intentionally bypassing the consolidated save pattern.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/identificacao_generic.json` | `modified` | Critical fields changed from `["id_documento", "data_nascimento"]` to `["nome", "id_documento", "cpf"]`. `data_nascimento` moved to non-critical. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `modified` | Updated to v0.2.0: removed hardcoded Gemini fallbacks, added `DEFAULT_EXTRACTION_CONFIGS`, aligned Holerite/Identificacao critical fields, added B1 early-exit note, added execution step 0 for JSON config alignment. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) | `updates` | Reviewed and updated the spec from v0.1.0 to v0.2.0 |
| [business-rules.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/business-rules.md) | `contextualizes` | Pipeline diagram and classification rules that the refactor spec builds upon |
