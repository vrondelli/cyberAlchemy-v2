---
tags: [ccb, pipeline, architecture, domain]
node_type: discovery
is_session: true
layer: domain, architecture
nature: technical, explanatory
status: active
created: 2026-05-07
timestamp: 2026-05-07T16:00:00-03:00
expires: 2026-07-06
conversation_id: 7c8a-validation-experiment-design
decisions_made: true
contradictions_found: false
specs_updated: [internal_tools/ccb-registration-demo/docs/validation-experiment/discovery/validation-experiment.md, internal_tools/ccb-registration-demo/docs/validation-experiment/validation-experiment-plan.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "First articulation of Pipeline A vs Pipeline B distinction and the promotion-readiness gap that caused tpl3's 0/42 outcome — closes a blind spot in the two-stage matching architecture."
---

# CCB Validation Experiment — Design Session

## Summary

Designed a validation experiment for CCB extraction-rule (`section_config`) discovery — internal tool with Streamlit minimalist dashboard, hybrid scripted-biased agents (Orphan Grouper + Rule Finder with 3 strategy modes), CSV+JSON telemetry, and statistical rigor (bootstrap CIs, p-values, distributions). Resolved 9 architectural decisions and articulated for the first time the **Pipeline A vs Pipeline B distinction**: request-path is deterministic (no agents), evolution-loop is where agents live offline. A 3-agent investigation chain surfaced that the experiment optimized `section_config` while production today routes through hand-authored per-template wrappers — `sections_extractor_ref` is stored but unused, exactly the failure mode that produced tpl3's 0/42. Applied 5+5 surgical edits across discovery and plan to add SC5 (deferred-to-promotion criterion), document the manual promotion checklist, and rewrite the tpl3 post-mortem to acknowledge both compounding causes.

## Files touched

- internal_tools/ccb-registration-demo/docs/validation-experiment/discovery/validation-experiment.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/validation-experiment-plan.md
