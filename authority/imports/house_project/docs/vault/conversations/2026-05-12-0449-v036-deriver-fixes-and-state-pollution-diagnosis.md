---
tags: [ccb, pipeline, application, architecture, deriver, validation-experiment]
node_type: discovery
is_session: true
layer: application
nature: technical
status: active
created: 2026-05-12
timestamp: 2026-05-12T04:49:40-03:00
expires: 2026-07-11
conversation_id: 4c5e0855-015d-464f-bfd7-36f8d18afc45
decisions_made: true
contradictions_found: false
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/domain.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/states.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "First non-vacuous derived-template signal (7/63 through real gates) plus a state-pollution regression diagnosis that unblocks the entire recursive pipeline iteration loop."
---

# v0.3.6 deriver fixes and state-pollution diagnosis

## Summary

Continued the Wave 9 recursive pipeline from v0.3.5 (0–31/63 vs script's 40/63 reference) through v0.3.5.1 (per-template legal_text re-slicing), v0.3.5.2 (Levenshtein swap for 200× speedup), and landed v0.3.6 with three deriver fixes: real-gate probing via `resolve_labels_via_prod_engine`, per-template canonical_text via `blind_split_from_pages(pages, candidate_section_config)`, and matcher-strict scoring through `apply_data_table_gate` + `apply_legal_text_gate`. Evaluator diagnosed an iter-0 regression (31→0) as state pollution — `test_match.py:57` and `test_promote_dry_run.py:56` TRUNCATE the live `harness.*` schema; clean baseline re-sync produced iter-0 = 34/63 and a direct deriver probe matched 7/63 (first non-vacuous derived-template signal). Three backlog items emerged (P0 test isolation, P1 iter-1 grid-scoring perf cache, P2 pipeline state-hygiene pre-flight); commit decision on the v0.3.6 stack deferred to user.

## Files touched

- internal_tools/ccb-registration-demo/docs/validation-experiment/features/{operations,domain,governance,states,interfaces,validation-experiment-plan}.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
- docs/vault/conventions/ccb-projection-patterns.md
- internal_tools/ccb-registration-demo/matching-test/agents/{deriver/_common,gates,clusterer,match,evaluator}.py
- internal_tools/ccb-registration-demo/matching-test/core/{iteration_runner,projection,label_resolver,extraction_config,harness}.py
- internal_tools/ccb-registration-demo/matching-test/cli/{run_recursive_pipeline,init_harness_schema,promote_rule}.py
- internal_tools/ccb-registration-demo/matching-test/dashboard/tabs/live.py
- internal_tools/ccb-registration-demo/matching-test/rules/baseline/tpl{11,16,19,20}.json
- internal_tools/ccb-registration-demo/matching-test/tests/test_{deriver_common,evaluator,gates,match,promote_dry_run,projection,recursive_pipeline,recursive_pipeline_integration,resolver_wiring_integration}.py
