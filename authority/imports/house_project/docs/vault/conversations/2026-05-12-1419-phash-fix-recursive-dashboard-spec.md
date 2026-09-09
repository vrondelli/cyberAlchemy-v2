---
tags: [ccb, matching-test, recursive-pipeline, phash-clustering, dashboard, results-tab, wave-10, harness, spec-sealing]
node_type: spec
is_session: true
layer: application
nature: technical, procedural
status: active
created: 2026-05-12
timestamp: 2026-05-12T14:19:08-03:00
expires: 2026-07-11
conversation_id: b8db1eed-886b-47ad-af74-68a351411b3e
decisions_made: true
contradictions_found: true
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/dashboard-results-v2.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Seals Wave 10 / v0.4.0 dashboard redesign across four coordinated specs and resolves a v0.3.0-era code/spec divergence that was blocking the recursive pipeline."
---

# pHash fix + Wave 10 dashboard Results v2 sealed

## Objective

Capture how the deferred deriver probe re-run surfaced a v0.3.0-era code/spec divergence in the iteration_runner clusterer (sealed at v0.3.7), and how the dashboard's inability to render recursive-pipeline runs was sealed as Wave 10 / v0.4.0 across four coordinated specs.

## Summary

After confirming the P0 test-isolation fix (34/63 baseline), the deferred deriver probe was re-run and hung in iteration 1 because `core/iteration_runner.py:_cluster_orphans_from_corpus` was using Levenshtein clustering on ~30K-char legal texts instead of the v0.3.0-mandated pHash hamming path. The code was patched to call `cluster_orphans_phash` and the divergence was sealed at v0.3.7. The probe also surfaced that the dashboard's Results tab cannot render recursive-pipeline runs (built only for W7 strategy-comparison groups); Victor approved a context-aware Results tab (same tab, branches at render time on `progress.json.iterations_history` presence), sealed as Wave 10 / v0.4.0 across four coordinated specs — new `dashboard-results-v2.md` (wireframe + acceptance), `operations.md` (new `RenderRecursiveReport`), `interfaces.md` (new `DashboardRecursiveRunView` + IF-27/IF-28), and `validation-experiment-plan.md` (Wave 10 task list T10.1–T10.5). Spec-only at v0.4.0 — no Wave 10 implementation code yet.

## Contradictions

- contradicts `operations.md §ClusterOrphans` (v0.3.0+) — `core/iteration_runner.py:_cluster_orphans_from_corpus` was using legacy Levenshtein text-diff clustering; resolved by fixing the code and pinning the correct function name (`agents.clusterer.cluster_orphans_phash`) in the spec's failure-mode block.

## Files touched

- internal_tools/ccb-registration-demo/matching-test/core/iteration_runner.py
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/validation-experiment-plan.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/dashboard-results-v2.md
