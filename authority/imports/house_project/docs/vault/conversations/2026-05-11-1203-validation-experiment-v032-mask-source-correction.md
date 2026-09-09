---
tags: [ccb, validation-experiment, matching, legal-text, mask, harness]
node_type: spec
is_session: true
layer: domain, application
nature: technical, procedural
status: active
created: 2026-05-11
timestamp: 2026-05-11T12:03:33-03:00
expires: 2026-07-10
conversation_id: ce607925-7b25-40d3-b41b-b4897edf6706
decisions_made: true
contradictions_found: true
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Canonical provenance for why the harness legal_text matching mask uses section_config.legal_text.variable_zones and not extraction_config; bumps spec + schema + introduces a promotion-time gate."
---

# v0.3.2 — Mask-source correction for ApplyLegalTextGate

## Summary

Wave 9 Slice A landed v0.3.1's `ApplyLegalTextGate` masking via `extraction_config.fields` (ported from prod's `_sanitize_template_text`). The user flagged this as wrong; prod-code audit confirmed `_sanitize_template_text` runs only at template-registration time, not validation time — the harness's legal_text matching gate is a new capability and v0.3.1 had misattributed prod parity. Switched to Option B: mask via `section_config.legal_text.variable_zones` (anchor-pair zones), bumped operations/governance/data-model to v0.3.2, added a separate promotion-time `extraction_config`-equivalence gate in `cli/promote_rule.py` (exit 25), extended `harness.document_template` with an `extraction_config` JSONB column. 238 pytest green.

## Decisions

- **Option B** for mask source: `section_config.legal_text.variable_zones`. Anchors are present in every section_config the deriver produces; extraction_config isn't yet available in early iterations.
- **Promotion-time `_sanitize_template_text` check** (governance.md → Promotion gates v0.3.2): refuses derived rules whose extraction_config is NULL or whose mask is non-idempotent. Composes with SC5; does not replace it.
- **Memory reset**: collapsed to a single `MEMORY.md` of fundamentals (user request mid-session).
- **Slice B shrunk**: extraction_config plumbing (sync round-trip, dump-from-prod, extraction_deriver writes) deferred to Slice C; B keeps orchestrator + recursive.py + harness.py thin wrapper + evaluator metrics.

## Open questions

- Convergence formality — re-matching only orphans guarantees monotone-decreasing orphan set, but is there any iteration shape where a previously-matched DV gets re-orphaned? Pin before B's convergence test.
- Pre-flight IF-23 probe shape — exercise `normalize_session` end-to-end, or just import-check `core.normalize`?
- Real-world non-idempotent extraction_config regexes — does prod actually contain any, or is the promotion-gate idempotency check purely defensive?
- Round-trip ownership — should `sync_rules_{to,from}_db` carry extraction_config, or is `harness.document_template.extraction_config` write-only from the deriver?

## Next work (Slice B, then Slice C)

- **B**: `agents/recursive.py`, `core/harness.py` thin wrapper, `cli/run_recursive_pipeline.py` (state machine + iteration counter + IF-22 cap), `agents/evaluator.py` (read from `harness.experiment_evaluation`, add `within_cluster_recall`, `cross_cluster_fp_rate`, winner-score), determinism tests.
- **C**: dashboard iteration-timeline + per-cluster strategy comparison + orphan history per DV; 63-DV end-to-end run with determinism check; extraction_config plumbing across sync/dump/extraction_deriver.

## Contradictions

- contradicts `internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md` v0.3.1 §ApplyLegalTextGate — the `mask_template_text(extraction_config)` mask source was misattributed to prod parity; prod's `_sanitize_template_text` is registration-time only. Fixed in v0.3.2.

## Files touched

- internal_tools/ccb-registration-demo/matching-test/core/mask.py
- internal_tools/ccb-registration-demo/matching-test/agents/gates.py
- internal_tools/ccb-registration-demo/matching-test/agents/match.py
- internal_tools/ccb-registration-demo/matching-test/cli/init_harness_schema.py
- internal_tools/ccb-registration-demo/matching-test/cli/promote_rule.py
- internal_tools/ccb-registration-demo/matching-test/tests/test_gates.py
- internal_tools/ccb-registration-demo/matching-test/tests/test_promote_dry_run.py
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/operations.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/governance.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
- .claude/projects/-Users-victorboscaro-house-project/memory/MEMORY.md
