---
tags: [infrastructure, pipeline, acquisition, architecture]
node_type: implementation-plan
is_session: true
layer: application, infrastructure
nature: procedural, technical
status: active
created: 2026-03-31
timestamp: 2026-03-31T11:30:00-03:00
expires: 2026-05-30
conversation_id: 7f3a9c12-4e81-4b2d-b96f-2d0e5c8a1f44
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "Rule: no simultaneous clean_df + clean_bytes in the upload pipeline — candidate for constitution"
  - "Rule: all __in dedup queries must be chunked at ≤5000 keys — candidate for constitution"
expected_importance: 8
importance_rationale: "This session identified and planned the fix for a production OOM failure that caused a 1.2 GB upload to crash a live Celery worker, and the root causes are structural patterns affecting every large remessa upload going forward."
---

# Remessa Upload OOM Diagnosis and Fix Plan

**Date:** 2026-03-31 11:30 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition #architecture

## Summary

This session began as a worker monitoring request. The user had uploaded a 1.2 GB CSV for Aquisicao processing and wanted to check on the Celery worker. Initial investigation via GCP logs (`zefra-491412`, instance `zefra-hub-worker-wlbt`) confirmed the task was actively running: `process_aquisicao_upload`, task ID `709fe54e-8255-45dd-842c-af8bbd05a74a`, file `tmp_upload/6ba52d7f15f141beb0bb66ea8350ec23.csv`, started by user `zefrahub-admin`. About 10 minutes later the user reported the file had failed.

### Diagnosis: OOM Kill

A second investigation revealed `ForkPoolWorker-8` (PID 25) had been killed by the Linux OOM killer at 11:44 UTC, consuming ~7 GB RSS (`anon-rss:7001092kB`). The kill was triggered by the `push-celery-metrics.sh` cron job requesting memory, which caused the kernel to select the largest process — the Celery worker — as the victim. The full pipeline was traced from `upload_rules_base.py` through `upload_service.py`, `stage_remessa_service.py`, and the domain use cases to identify root causes.

### Root Cause 1: `clean_bytes` — duplicate in-memory copy (highest impact)

`upload_service.py` writes the cleaned CSV to a temp file, then immediately reads it back into RAM with `f.read()` and stores the bytes in the result dict alongside `clean_df`. At peak, both objects coexist: the Polars DataFrame (~2–3 GB) and its byte-for-byte copy (~1–2 GB). The bytes are consumed only at the very end of `stage_remessa_service.py` to upload to GCS/MinIO. The fix: keep the temp file alive, pass its path (`clean_path`) through the pipeline, and let `stage_remessa_service` stream-upload it using a new `upload_csv_from_path(storage_key, path)` function.

### Root Cause 2: `to_dicts()` materialisation (medium impact)

`stage_remessa_service.py` calls `clean_df.to_dicts()` which converts the entire Polars DataFrame into a Python list of dicts at once. As the `staging_instances` list grows, both the full dict list and the growing ORM object list are live simultaneously. The fix: replace with `df.slice(offset, 5000)` + `iter_rows(named=True)` in a chunked loop, followed by `bulk_create` per chunk, ensuring at most 5,000 Python objects are in memory at once.

### Root Cause 3: Aquisicao dedup query not chunked (variable impact)

`_aquisicao_dedup_query` in `domains/aquisicao/use_cases/upload.py` passes all `campo_chave`, `sacado_cnpj_cpf`, and `data_aquisicao` values in a single `__in` DB query — potentially millions of values for a 1.2 GB file, creating a massive SQL IN clause and materialising the full result in Python. The Liquidacao equivalent (`_liquidacao_dedup_query`) already uses chunked batches of 5,000 keys. The fix: apply the identical pattern to Aquisicao, querying by `campo_chave` only in 5,000-key chunks.

### Considered but deferred: `infer_schema_length=0`

`upload_rules_base.py` reads all columns as strings (`infer_schema_length=0`) to avoid Polars type inference conflicting with the custom date/decimal pipeline. Changing this could reduce the DataFrame size by 60–70% (typed Float64 vs Utf8 for numeric columns), but it was deliberately excluded from the plan — it requires a separate audit of all column-type assumptions across both domains.

### Secondary Issue: `push-celery-metrics.sh` NOAUTH failure

During investigation, `push-celery-metrics.sh` was found failing every minute with `NOAUTH Authentication required`. The Redis password is correctly present in `/etc/zefra-hub.env`, Redis connectivity was confirmed (`PONG`), and manual execution of the script succeeds. The root cause of the failure in the cron execution context was not determined and left open.

### Output

Implementation plan created: `refactors/infrastructure/2026-03-31-003-remessa-upload-oom-fix.md`. Four TDD tasks targeting an estimated peak reduction from ~7 GB to ~3 GB.

## Epistemic Impact

No vault axioms or premises were directly challenged. Two promoted candidates were identified (see frontmatter): the "no simultaneous clean_df + clean_bytes" pattern and the "chunk all `__in` dedup queries" rule are both structural constraints that should be promoted to constitutions to prevent recurrence across domains.

A spec drift was discovered: the chunked dedup pattern applied to Liquidacao was never propagated to Aquisicao. This is evidence that cross-domain patterns need a shared enforcement mechanism.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `refactors/infrastructure/2026-03-31-003-remessa-upload-oom-fix.md` | created | 4-task TDD implementation plan for the OOM fix: streaming CSV upload (`upload_csv_from_path`), eliminating `clean_bytes`, chunking the staging loop, and chunking the Aquisicao dedup query |

## Connections

- `contextualizes` → `refactors/infrastructure/2026-03-31-003-remessa-upload-oom-fix.md` — this session is the provenance of that plan

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `push-celery-metrics.sh` fails every minute with "NOAUTH Authentication required" — Redis auth not being applied in cron context | Observed in GCP logs during worker investigation | HIGH | Open — root cause not diagnosed |
| `infer_schema_length=0` memory impact audit — setting intentionally chosen to avoid type inference conflicts but increases peak memory; requires separate analysis | Explicitly excluded from plan during session | MEDIUM | Open — deferred |
| Propagate chunked dedup pattern audit to all other domains using `__in` queries — no full inventory produced | Inferred from fix scope | MEDIUM | Open |
| Promote "no simultaneous clean_df + clean_bytes" and "chunk all `__in` dedup queries" to enforceable constitution rules | Session promoted_candidates | MEDIUM | Open |
| Validate 7 GB → 3 GB memory reduction after implementation with a real load test | Implementation plan success criteria | LOW | Pending plan execution |

## Open Questions

- Why does `push-celery-metrics.sh` fail in the cron context when direct execution succeeds? The cron environment may differ from the interactive shell (PATH, user environment, IFS), but the exact mechanism was not confirmed.
- Is `infer_schema_length=0` still the right tradeoff given the memory cost at 1 GB+ file sizes, or can an explicit schema override be used for known columns while keeping fallback-to-string for unknown ones?
