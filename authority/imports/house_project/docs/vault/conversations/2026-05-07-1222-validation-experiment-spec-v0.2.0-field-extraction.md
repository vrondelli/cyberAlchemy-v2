---
tags: [validation-experiment, ccb, field-extraction, governance, label-seal, spec-evolution, architectural-decision]
node_type: spec
is_session: true
layer: domain, application
nature: technical, reference
status: active
created: 2026-05-07
timestamp: 2026-05-07T12:22:55-03:00
expires: 2026-07-06
conversation_id: 2026-05-07-1222-validation-experiment-spec-v0.2.0
decisions_made: true
contradictions_found: true
specs_updated: [internal_tools/ccb-registration-demo/docs/validation-experiment/features/SPEC.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/workflows.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/STORIES.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/TEST-SPEC.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/WORK-PACK.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Architectural simplification (sections_extractor_ref vestigial, promotion → data-only migration) plus two new capabilities (regex field-map derivation, LabelSeal governance) that propagate across the spec suite and constrain all future implementation in this feature."
---

# Validation-Experiment SPEC v0.2.0 — Field Extraction + LabelSeal

## Summary

Session began as a TEST-SPEC authoring step but expanded into a major architectural revision. Empirical audit of production found `CCBTemplate.sections_extractor_ref` is vestigial — `extract_via_registry` reads `DocumentTemplate.extraction_config` via `template_regex.py:28`, never dispatching to the four `ccb_consig_template*.py` wrappers. Promotion track simplified to data-only migration (no wrapper authoring). Pipeline B scope expanded to derive regex `extraction_config` per (strategy, cluster) scoped to `data_table` + `signature` only, validated against optional ground-truth `LabelSet` (sealed independently from corpus). Field accuracy stays diagnostic-only in v0.2.0; SC6/SC7 deferred. Test obligations grew 82 → 118.

## Contradictions

- contradicts `internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md` (v0.1.0) — original Promotion gate required authoring `ccb_consig_templateN:extract` wrapper Python module; empirical audit proved the production cascade never dispatches to those modules.
- contradicts `internal_tools/ccb-registration-demo/docs/validation-experiment/features/SPEC.md` (v0.1.0) — v0.1.0 scope implicitly assumed wrapper modules were the promotion mechanism; v0.2.0 supersedes with data-only migration.
- questions any vault or spec node that treats `CCBTemplate.sections_extractor_ref` as an active runtime field — production reads `DocumentTemplate.extraction_config` via `template_regex.py:28` instead.

## Files touched

- internal_tools/ccb-registration-demo/docs/validation-experiment/features/SPEC.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/workflows.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/STORIES.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/TEST-SPEC.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/WORK-PACK.md
