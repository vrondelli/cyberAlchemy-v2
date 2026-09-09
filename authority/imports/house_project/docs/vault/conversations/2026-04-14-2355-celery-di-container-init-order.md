---
tags: [infrastructure, architecture, application]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-14
timestamp: 2026-04-14T23:55:41-03:00
expires: 2026-06-13
conversation_id: 8677f5e0-dca6-44d1-b28f-720a38ffc949
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "The fix encodes a non-obvious invariant — DI container wiring must happen inside on_after_finalize.connect, not at module import time — which, if forgotten, silently re-breaks CI and the django-migrate Cloud Run Job."
---

# Celery DI Container Wiring: on_after_finalize, not module level

## Summary

Investigated CI/CD failures since 2026-04-11. A prior commit fixed a syntax error (import inside class body). A follow-up commit wired the DI container before `autodiscover_tasks()` by importing `Container` at module level in `celery.py` — which pulled `EstoqueRepository` → `django.contrib.auth.models` before Django's app registry was ready, crashing pytest and the `django-migrate` Cloud Run Job. Fixed by moving wiring into `@app.on_after_finalize.connect`, a Celery signal that fires only inside a running worker after Django is fully initialized — a no-op in all other contexts.

## Files touched

- house_project/celery.py
