---
tags: [filter-system, eligibility, refactor, polymorphic, plan-validation, spec-003]
node_type: implementation-plan
is_session: true
layer: [architecture, domain]
nature: [procedural, technical]
status: active
created: 2026-04-19
timestamp: 2026-04-19T16:00:00-03:00
expires: 2026-06-18
decisions_made: true
contradictions_found: true
specs_updated: [specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md, specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Resolves 4 design contradictions in the polymorphic filter plan: drops object_type from filter classes, closes entity_type enum, eliminates cutover complexity, removes historical data migration. These decisions are load-bearing — reversing them would require rewriting multiple plan phases."
---

# Polymorphic Filters — Plan Validation & Correction

## Objective

Document the validation of the polymorphic eligibility filter plan (v0.6.0 → v0.7.0) and discovery (v0.5.0 → v0.6.0), recording the 4 design contradictions found and the decisions that corrected them.

## Summary

Validated the polymorphic filter implementation plan against the current codebase. All file paths, line numbers, model structures, and import paths confirmed accurate. Found 4 design issues, all resolved:

1. **`object_type` on filter classes was speculative coupling.** Both `object_type` and `entity_type` are now `FilterDefinition` DB properties only. Filter classes are pure `run(obj, params) -> FilterOutcome` — no hierarchy awareness. Service reads dispatch info from `FilterConfigBinding`.

2. **`entity_type` as open CharField was under-specified.** Changed to closed `EntityType` enum with 7 values (remessa, contrato, parcela, cnpj_fundo, cedente, sacado, cnpj_ente). Adding a business concept is a vocabulary expansion — it should require a migration, not a string.

3. **Historical data migration was unnecessary complexity.** No backfill from `remessa_filter_results` → `filter_evaluations`. Table starts empty. Pending-approval remessas get filters re-run post-deploy. This eliminated §2.5 steps 6-7, §6.8 (dual-read/reconciliation), §7.14 (10 tests), §7.15 (7 tests), §8.7 (legacy_result_id cleanup).

4. **Cutover safety window was overengineered.** Deploy model is Cloud Run (API) + MIG workers with `acks_late=True`. Rolling deploy gap is ~60s per VM. Dual-read, signed-ID semantics, timestamp merge, and reconciliation sync all dropped. The migration backfill + post-deploy filter re-run covers all cases.

Additionally: startup validation (boot-time class introspection) replaced by `FilterDefinition.clean()` (config-time check). Table name chosen: `filter_evaluations`.

## Cascade retained

Initial review flagged cascade as YAGNI (all 3 current filters are remessa-level). User confirmed contrato/parcela filters are on the near-term roadmap. Cascade stays.

## Decisions

| Decision | Was | Now | Why |
|---|---|---|---|
| `object_type` location | Filter class attribute | `FilterDefinition` DB field | Filter classes should be pure domain functions; dispatch is a configuration concern |
| `entity_type` type | Open CharField | Closed `EntityType` enum (7 values) | Vocabulary expansion is deliberate, not casual |
| Historical data | Migration backfill + dual-read + reconciliation | No migration, table starts empty | Filter results are recomputed on every run; not historical records |
| Cutover strategy | Dual-read, signed IDs, timestamp merge, reconciliation sync | No cutover machinery; post-deploy filter re-run | Deploy gap is ~60s with `acks_late=True`; complexity not justified |
| Validation timing | Boot-time startup hook | `FilterDefinition.clean()` at save time | No `object_type` on filter class to introspect; config-time is more targeted |

## Files touched

- `specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md` (v0.6.0 → v0.7.0)
- `specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md` (v0.5.0 → v0.6.0)
- `claude/current_conversations/2026-04-18-1430-k8m2p-polymorphic-filter-plan.md` (added validation log)
- `claude/current_conversations/2026-04-18-polymorphic-filter-discovery.md` (updated open question 2)
