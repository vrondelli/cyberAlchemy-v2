---
tags: [ccb, pipeline, architecture, domain, validation]
node_type: spec
is_session: true
layer: domain, application
nature: technical, procedural
status: active
created: 2026-05-07
timestamp: 2026-05-07T10:22:36-03:00
expires: 2026-07-06
conversation_id: validation-experiment-spec-multiround
decisions_made: true
contradictions_found: true
specs_updated: [docs/features/validation-experiment/SPEC.md, docs/features/validation-experiment/domain.md, docs/features/validation-experiment/operations.md, docs/features/validation-experiment/workflows.md, docs/features/validation-experiment/interfaces.md, docs/features/validation-experiment/states.md, docs/features/validation-experiment/governance.md, docs/features/validation-experiment/STORIES.md, docs/features/validation-experiment/WORK-PACK.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "First hardened, adversarially-reviewed behavioral spec for the validation experiment — locks in bootstrap sampling semantics, Bonferroni family scope, and the verdict cascade that directly governs the CCB template promotion decision process."
---

# Validation Experiment SPEC + Multi-Round Adversarial Review

## Summary

Promoted validation-experiment from internal-tool-only (D1.b in plan v0.2.0) to a full DomainSpec feature spec via `domainspec-pipeline --spec-only`; authored SPEC + 6 aspect files + STORIES from the existing discovery and implementation plan. The spec was then subjected to 5 rounds of adversarial multi-agent review (3 critics per round across architectural/completeness/statistical lenses, plus evaluators and suggesters); 26 edits across rounds 1–3, with rounds 4–5 returning unanimous approval under the user's "2x in a row, no modifications" stopping rule. Key hardenings: bootstrap sampling unit declared per metric (cluster-resample by `dv_id`), two-sided 95% percentile CI with SC1/SC2 tail-selection rule, Bonferroni family per-metric with coverage/orphan_rate dependence caveat, verdict cascade made mutually exclusive, per-run `metrics.json` vs group-level `summary.json` artifact split, and SC1 calibration question flagged without violating pre-registration discipline.

## Contradictions

- supersedes [2026-05-07-1600-ccb-validation-experiment-design](2026-05-07-1600-ccb-validation-experiment-design.md) — overrides D1.b ("internal tool only, no SPEC.md") by promoting validation-experiment to a full feature spec after the Pipeline A/B insight made the harness architecturally load-bearing.

## Files touched

- docs/features/validation-experiment/SPEC.md
- docs/features/validation-experiment/domain.md
- docs/features/validation-experiment/operations.md
- docs/features/validation-experiment/workflows.md
- docs/features/validation-experiment/interfaces.md
- docs/features/validation-experiment/states.md
- docs/features/validation-experiment/governance.md
- docs/features/validation-experiment/STORIES.md
- docs/features/validation-experiment/WORK-PACK.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/discovery/validation-experiment.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/validation-experiment-plan.md
- docs/vault/conversations/2026-05-07-1600-ccb-validation-experiment-design.md
