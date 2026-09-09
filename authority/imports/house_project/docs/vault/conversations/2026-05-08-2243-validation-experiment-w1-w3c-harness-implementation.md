---
tags: [validation-experiment, ccb, harness, implementation, spec-correction, llm-bounding, field-extraction]
node_type: spec
is_session: true
layer: domain, application
nature: technical, explanatory
status: active
created: 2026-05-08
timestamp: 2026-05-08T22:43:44-03:00
expires: 2026-07-07
conversation_id: 2026-05-08-2243-validation-experiment-w1-w3c-harness
decisions_made: true
contradictions_found: true
specs_updated: [internal_tools/ccb-registration-demo/docs/validation-experiment/features/SPEC.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/workflows.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md, internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Full Wave 1–3c harness build (164 tests passing) plus corrective loop catching real spec/implementation mismatches and a column-count drift — high-signal provenance for the validation-experiment feature."
---

# Validation-Experiment Harness W1–W3c + Spec Corrections

## Summary

Implemented Wave 1 → Wave 3c of the validation-experiment harness via dispatched subagents (164 tests passing): telemetry, stats, clusterer, evaluator, three deriver strategies (LLM-bounded via in-process Protocol), and the field-extraction track end-to-end (ExtractionConfig + LabelSet + harness field-validation pass + evaluator field-accuracy diagnostic). Patched validation-experiment-plan.md to v0.2.1 sweeping stale `sections_extractor_ref` wrapper references; corrected SPEC LLM-transport mismatch (docs claimed `.agent.md`/`claude -p` subprocess; implementation uses in-process `LLMClient` Protocol — all 7 feature spec files bumped to v0.2.1); fixed PairsRow column-count drift (14→15) in SPEC.md and domain.md. Investigated production field-name convention via parallel Sonnet agents + Opus validator — confirmed harness `_scripted_snake_case` heuristic matches prod (drop PT prepositions, keep content words, snake_case, accents stripped) and caught a false "orphan table" claim from one investigation. Saved memories for term-definition discipline and prod-monitoring scope. Open gap: LLM-transport-correction vault note from spec-fix subagent never landed.

## Contradictions

- validates `internal_tools/ccb-registration-demo/docs/validation-experiment/features/SPEC.md` (v0.2.0) — 164 tests confirm harness behavior; PairsRow column count corrected 14→15 in SPEC.md and domain.md.
- contradicts pre-v0.2.1 LLM-transport claim in operations.md / SPEC.md / workflows.md / interfaces.md — docs said `.agent.md` + `claude -p` subprocess; implementation uses in-process `LLMClient` Protocol; all 7 feature spec files bumped to v0.2.1 to match.

## Files touched

- internal_tools/ccb-registration-demo/docs/validation-experiment/features/{SPEC,domain,operations,governance,workflows,interfaces,validation-experiment-plan}.md
- internal_tools/ccb-registration-demo/matching-test/core/{extraction_config,labels,harness}.py
- internal_tools/ccb-registration-demo/matching-test/cli/run_experiment.py
- internal_tools/ccb-registration-demo/matching-test/agents/{clusterer,evaluator}.py
- internal_tools/ccb-registration-demo/matching-test/agents/deriver/{__init__,_common,minimalist,anchor_heavy,layout_tight}.py
- internal_tools/ccb-registration-demo/matching-test/agents/extraction_deriver/{__init__,deriver}.py
- internal_tools/ccb-registration-demo/matching-test/tests/test_{clusterer,evaluator,stats,deriver_common,deriver_strategies,extraction_config,labels,extraction_deriver,harness_field_validation,harness_smoke}.py
- ~/.claude/projects/-Users-victorboscaro-house-project/memory/{feedback_define_terms_inline,project_prod_ccb_monitoring_scope,MEMORY}.md
