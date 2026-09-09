---
tags: [refactor, filters, aquisicao]
layer: architecture
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: c57ebe11-8b7d-4da7-bb40-10c7061307bf
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 6
importance_rationale: "Architectural refactor moving filter logic from application to domain layer, affects dependency structure."
---

# Moving Filters to Aquisição Domain

**Date:** 2026-03-08  
**Tags:** #refactor #filters #aquisicao

## Summary

Moved concrete filter implementations from `/infrastructure/remessa/filters/` to `/domains/aquisicao/domain/`. Updated all imports and references. Ran full test suite to verify no regressions.

## Key Decisions

- Filters are domain logic — they belong in `/domains/aquisicao/domain/`, not infrastructure
- All imports updated across the codebase after the move
- Full test suite passed after refactor confirming no regressions

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[folder-structure-constitution]] | `validates` | Filter placement now complies with domain layer rules |
| [[development-practices-constitution]] | `validates` | Domain code now framework-agnostic and in the correct layer |
