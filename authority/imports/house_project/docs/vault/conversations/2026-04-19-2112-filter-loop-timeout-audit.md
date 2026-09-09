---
tags: [acquisition, liquidation, pipeline, infrastructure]
node_type: audit
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-19
timestamp: 2026-04-19T21:12:40-03:00
expires: 2026-06-18
conversation_id: ca439241-dd55-4070-894b-324d89ec8b65
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identified a silent failure mode where SoftTimeLimitExceeded killed the filter loop mid-execution, leaving remessas in pending state on any large upload."
---

# Filter Loop Timeout Audit & Fix

## Summary

Investigated why upload file_id=130 (6,452 remessas) had 2,721 remessas stuck as "pending" — initially hypothesized OOM, but memory monitoring proved flat at ~3.8 GiB. Root cause was Celery's global `CELERY_TASK_SOFT_TIME_LIMIT = 50min` killing the task mid-filter-loop. Applied three fixes: bulk upsert optimization (107 min → 33 min filter phase), overrode `soft_time_limit=6h` on both upload tasks, and added filter progress reporting to the frontend via `self.update_state` so users see "Aplicando critérios… X de N remessas validadas".

## Files touched

- domains/aquisicao/tasks/celery_tasks.py
- domains/liquidacao/tasks/celery_tasks.py
- domains/aquisicao/use_cases/run_filters_service.py
- infrastructure/repositories/filter_evaluation_repository.py
- infrastructure/remessa/ports.py
