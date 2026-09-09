---
tags: [spec, event-system, filters]
layer: architecture
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: f8196539-7308-49e8-bfb1-307aae00f017
node_type: implementation-plan
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 4
importance_rationale: "Corrected inconsistencies in filter/event-system spec without changing architecture direction."
---

# Fixing Implementation Plan Inconsistencies — Phase 6 Constitution Rewrite

**Date:** 2026-03-08  
**Tags:** #spec #event-system #filters

## Context

The Phase 6 plan had 9 constitution violations identified in the prior session. This session rewrote the plan to be fully compliant. All violations resolved, each with a specific fix.

## Violations Fixed

### 1. Use Case in Wrong Layer (`infrastructure/` → `shared_services/`)
The plan placed `JustifyFilterOverrideUseCase` in `infrastructure/remessa/justify_filter_override.py`. The constitution prohibits use cases in `/infrastructure` (it must contain only pure abstractions and tool wrappers). **Fix:** moved to `shared_services/use_cases/justify_filter_override.py`, which is the correct cross-domain use case layer.

### 2. Illegal Import Direction
The original plan had `from domains.aquisicao.models import ...` inside the infrastructure use case. `infrastructure` cannot import from `domains` (Rule 6). **Fix:** resolved by moving the use case to `shared_services`, where that import is permitted.

### 3. `log_event_safe()` call signature
The plan called `log_event_safe(event_type=...)` instead of `event_name=...`. The constitution mandates that event catalog lookups go through `event_name` so that `tier` and `entity_domain` are resolved from the catalog — not bypassed. **Fix:** corrected to `log_event_safe(event_name=EventLog.EventType.FILTER_OVERRIDE_JUSTIFIED, ...)`.

### 4. `stream_id` Generated but not Saved
`stream_id = uuid.uuid4()` was generated correctly at entry point but only passed to `log_event_safe()`. The constitution requires it to be saved onto the principal entity's field. **Fix:** the override action is scoped to the parent batch's stream — the use case now inherits the batch's `stream_id` using `remessa_obj.stream_id` rather than generating a new UUID.

### 5. `entity_type='remessa_filter_result'` — not in Entity Registry
The correct registered value is `'filter_result'`, not `'remessa_filter_result'`. **Fix:** corrected.

### 6. `entity_id` Uses PK, not Hash
The plan set `entity_id=str(fr.pk)`. The constitution requires the deterministic hash from `entity_identity.py`. **Fix:** replaced with `entity_id=remessa_hash`, which was already resolved in the local scope.

### 7. Frontend Component Placement
`FilterOverrideDialog.jsx` was proposed inside `frontend/src/pages/Status/`. **Fix:** relocated to `frontend/src/pages/Status/components/FilterOverrideDialog.jsx`.

### 8. API Endpoint Location Unclear
The plan used "likely `shared_services/interfaces/`" — a hypothesis, not a decision. **Fix:** confirmed: `BatchFilterResultsAPI` and `FilterOverrideAPI` go in `shared_services/interfaces/filter_views.py`, registered in `shared_services/interfaces/urls.py`.

### 9. Tests for Domain Use Case in `infrastructure/tests/`
The plan put tests in `infrastructure/tests/`. **Fix:** moved to `shared_services/tests/test_justify_filter_override.py` and `shared_services/tests/test_filter_override_api.py`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `validates` | Rewritten plan verified against entity_id, stream_id, event_name, and entity registry rules |
| [[folder-structure-constitution]] | `validates` | File placements corrected for all 3 affected components |
| [[development-practices-constitution]] | `validates` | Use-case layer and test placement corrected |
