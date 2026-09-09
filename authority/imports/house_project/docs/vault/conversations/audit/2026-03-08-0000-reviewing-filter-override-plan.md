---
tags: [spec, filters, event-system]
layer: architecture
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: b92b8a00-5535-4d32-be7b-3b81160b6aa1
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 5
importance_rationale: "Reviewed filter override spec establishing the accepted approach for event-system integration."
---

# Reviewing Filter Override Plan — Phase 6 Constitution Audit

**Date:** 2026-03-08  
**Tags:** #spec #filters #event-system

## Context

The Phase 6 implementation plan for the filter override feature was written and submitted for review. This session was a systematic audit of that plan against three constitutions: `constitution_folders_structure.md`, `constitution_event_system.md`, and `constitution_developement_practices.md`.

## Issues Found

| # | Issue | Rule Violated | Severity |
|---|---|---|---|
| 1 | `remessa_aquisicao` / `remessa_liquidacao` not in Entity Registry | Event System — Rule 6 | **High** — breaks test invariant |
| 2 | `entity_id` uses `remessa_obj.pk` (PK), but step 10 of the same plan expects `remessa_hash` | Event System — Rule 6 + Checklist | **High** — internal contradiction + audit log data quality |
| 3 | `FILTER_OVERRIDE_JUSTIFIED` catalog has `entity_domain='aquisicao'` but it fires for both aquisicao and liquidacao | Event System — Rule 7 | **Medium** — misleading ontology |
| 4 | `stream_id` is generated but not saved on any entity field | Event System — Rule 4 | **Medium** — stream hierarchy not queryable |
| — | `detail` field population | n/a | ✅ Correctly implemented all the way through |

## Key Technical Findings

**Issue 2 in detail — the self-contradiction:**
The use case code does `entity_id=str(remessa_obj.pk)`, but `remessa_hash` is already resolved and available in the local scope. The payload stores the hash (`'remessa_hash': remessa_hash`) but `entity_id` gets the PK. The manual verification step 10 in the same plan then says "check for `entity_id=remessa_hash`" — so the plan is internally inconsistent and would have failed its own verification.

**Issue 4 in detail — stream_id scope:**
The constitution requires: *"the generated `stream_id` must be saved onto the principal entity's `stream_id` field."* The override use case generates a fresh UUID but only passes it to `log_event_safe()`. No model field receives it. This means the override event stream cannot be queried independently by `stream_id`, violating the stream hierarchy contract. The open question was whether the override belongs to the parent batch's stream (and should inherit its `stream_id`) or starts a new lifecycle.

**`detail` field — confirmed correct:**
`run_filters_service.py` creates `RemessaFilterResult` with `detail=outcome.detail` → evaluated by `_evaluate_one()` → surfaced via `BatchFilterResultsAPI`. The override event payload schema does not include `detail` (as designed per the catalog's `payload_schema`).

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `validates` | Plan audited against entity_id, stream_id, entity_domain, and entity registry rules |
| [[folder-structure-constitution]] | `validates` | Plan audited against layer placement and import direction rules |
