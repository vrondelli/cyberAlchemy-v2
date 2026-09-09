---
tags: [upload, filters, performance, aquisicao, celery, ux, concentracao-max-filter, sequential-scan, indexing]
node_type: discovery
is_session: true
layer: domain
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T12:06:30-03:00
expires: 2026-06-01
conversation_id: upload-stuck-aplicando-criterios-2026-04-02
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "premise: domain filter aggregates must not re-scan the full production table per upload remessa"
  - "spec: Celery upload task lifecycle — DB commit phase vs filter loop phase are distinct, task is not complete until filter loop returns"
expected_importance: 8
importance_rationale: "Identified the precise root cause of a silent UX failure mode (upload stuck at 'Aplicando critérios...' indefinitely for large files) down to the missing index and the unbounded filter loop, with two concrete fixes ready to implement."
---

# Upload Stuck at "Aplicando critérios..." — Root Cause Discovery

**Date:** 2026-04-02 12:06 (UTC-3)
**Tags:** #upload #filters #performance #aquisicao #celery #ux #concentracao-max-filter #sequential-scan #indexing

## Summary

This session investigated a recurring UX bug where the upload UI stays permanently stuck at "Processando... Aplicando critérios..." even after the CSV installments appear in the database. The symptom was consistent: small files succeed quickly, large files appear frozen at that stage indefinitely. The investigation followed a systematic debugging path — frontend polling logic → `check_upload_status` endpoint → Celery task structure → filter evaluation pipeline — before arriving at the root cause.

### Problem Framing

The user observed that installments were already in the DB, yet the UI showed no progress beyond "Aplicando critérios...". The initial hypothesis was a Celery result backend issue (task state stuck at `PROGRESS` in Redis). Celery worker logs confirmed the task DID reach `Finished Aquisicao upload: upload_file_id=122` — meaning staging committed successfully.

### Key Insight: Two-Phase Task Structure

Data being in the DB does NOT mean the Celery task has completed. `StageRemessaService.stage()` commits all records inside `transaction.atomic()` before the filter loop begins. After the commit, the task sets `PROGRESS "Aplicando critérios..."` in the Celery result backend and enters the filter loop. Only after the filter loop finishes and the task function returns does Celery write `SUCCESS` to Redis. The frontend polls for `SUCCESS` and is stuck waiting for that write.

This is not a bug in the polling logic or the result backend — the architecture is correct. The bug is that the filter loop takes too long for large files.

### Root Cause: `ConcentracaoMaxFilter` Full Table Scan per Remessa

`ConcentracaoMaxFilter.run()` (`domains/aquisicao/domain/filters_criteria.py:56`) executes:

```python
agg = AquisicaoManual.objects.filter(cnpj_fundo=cnpj_fundo).aggregate(total=Sum('valor_aquisicao'))
```

`AquisicaoManual.cnpj_fundo` has no `db_index=True` on the model (`domains/aquisicao/repositories/models.py:119`). PostgreSQL performs a full sequential scan of the `aquisicao_manual` table on every invocation. This filter is called **once per remessa** created in the upload. For large files with many unique `(cnpj_fundo, data_aquisicao, id_cessao)` groups, the loop multiplies this scan N times, producing runtimes of minutes or tens of minutes depending on the size of the production table.

### Why Small Files Work

Small files create few remessas — sometimes just one. The full table scan runs once, which is fast enough to be imperceptible. Large files (e.g., BigQuery exports with many distinct cessão groups) create many remessas, making the O(N × full_scan) behavior visible.

### Alternatives Considered

- **Celery result backend failure**: ruled out — task does complete, Redis is not the issue.
- **OOM kill during filter loop**: considered but ruled out — the task logs `Finished Aquisicao upload` which runs before the PROGRESS marker. An OOM kill would set state to `FAILURE`, not keep it at `PROGRESS`.
- **`_make_serializable` serialization failure**: investigated — `Decimal` IS imported at line 4 of `celery_tasks.py`, the function works correctly. Ruled out.
- **Cloud Run path**: ruled out — `USE_CLOUD_RUN_JOBS_REMESSA = false` locally.

### Planned Fixes (not yet implemented)

1. Add `db_index=True` to `AquisicaoManual.cnpj_fundo` — eliminates the sequential scan.
2. Cache the `cnpj_fundo` aggregate result within the upload's filter loop — the same fund is queried N times for the same result within a single upload batch; a simple `dict` keyed on `cnpj_fundo` reduces total DB round-trips to the number of unique funds.

No code was changed this session at the user's request — diagnosis only.

## Epistemic Impact

- **Belief challenged**: "data in DB = upload task complete" — disproven. The DB commit and the task return are separated by the filter loop. Any future reasoning that treats DB visibility as a proxy for task completion is incorrect.
- **Scalability gap confirmed**: `ConcentracaoMaxFilter` was never validated for large-scale production files. Its correctness is fine; its performance was unexamined.
- **No spec drift**: no existing spec was found to contradict the findings. The missing index and absent caching are implementation gaps, not violations of written rules.

## Modified Artifacts

No files were created, modified, or deleted during this session.

## Connections

- `contextualizes` → `domains/aquisicao/domain/filters_criteria.py` (performance root cause lives here)
- `contextualizes` → `domains/aquisicao/tasks/celery_tasks.py` (two-phase task structure: staging commit then filter loop)
- `contextualizes` → `domains/aquisicao/repositories/models.py` (missing `db_index=True` on `AquisicaoManual.cnpj_fundo`)

## Gaps & Backlog

| Item | Description | Priority |
|------|-------------|----------|
| Missing DB index on `AquisicaoManual.cnpj_fundo` | `ConcentracaoMaxFilter.run()` aggregate query does full sequential scan per remessa; `db_index=True` + migration needed. | HIGH |
| No per-upload caching of `cnpj_fundo` aggregates | `ConcentracaoMaxFilter.run()` called N times per upload (once per remessa), re-querying same fund. A dict cache in the task's filter loop reduces round-trips to unique funds. | HIGH |
| Upload progress too coarse for large files | UI shows a single opaque "Aplicando critérios..." state for the entire filter loop; no per-remessa progress signal available. | MEDIUM |
| Task lifecycle undocumented | Two-phase structure (DB commit then filter loop) has no spec; future developers may incorrectly equate DB visibility with task completion. | MEDIUM |

## Open Questions

- Should the filter loop be moved to a separate async Celery task dispatched post-upload, so the upload task returns immediately after staging? This would decouple upload latency from filter evaluation time but requires frontend changes to track filter status separately.
