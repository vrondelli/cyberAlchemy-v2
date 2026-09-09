---
tags: [event-system, filters]
layer: architecture
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: 9e92a614-4a1c-4886-939e-2e26440081f9
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 3
importance_rationale: "Investigated event logging behavior without producing architectural changes or new specs."
---

# Investigating Event Logging

**Date:** 2026-03-08  
**Tags:** #event-system #filters

## Summary

Investigated how `entity_id` is populated in the `EventLog` service for remessa-related events. Examined `approve_remessa.py` and `run_filters_service.py` to determine if the primary key or a hash is used.

## Key Decisions

- `entity_id` uses the remessa primary key (not a hash) for filter and approval events
- Confirmed the pattern is consistent across `approve_remessa.py` and `run_filters_service.py`

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `validates` | Entity ID convention verified against Rule 6 of the event system |
