---
tags: [bulk-import, celery, cloud-run-jobs, monitoring, ops, gcp, deploy, production]
node_type: discovery
is_session: true
layer: architecture, application
nature: technical, procedural
status: active
created: 2026-04-02
timestamp: 2026-04-02T19:13:00-03:00
expires: 2026-06-01
conversation_id: bulk-import-production-debug-2026-04-02
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "A spec capturing the current authoritative production execution mode for bulk import (Celery-direct on MIG, not Cloud Run Jobs)"
  - "A premise for the canonical image SHA comparison method to verify deploy took effect on the MIG worker"
expected_importance: 7
importance_rationale: "This session exposed that the bulk import pipeline's Cloud Run Job delegation — a core architectural assumption — is entirely inactive in production due to a missing env flag, a contradiction that will directly affect any future capacity, parallelization, or performance work on that pipeline."
---

# Bulk Import Production Debug & Monitoring Discovery

**Date:** 2026-04-02 19:13 (UTC-3)
**Tags:** #bulk-import #celery #cloud-run-jobs #monitoring #ops #gcp #deploy #production

## Summary

This session focused on diagnosing and managing a production bulk import pipeline failure, then surfacing a systemic monitoring gap.

### Topic 1 — Batch 26 failure: hard folder limit

The user uploaded a documents folder to production and it failed silently. Through `gcloud logging read`, we found that batch 26 had started at `16:09:15 UTC` and failed at `16:09:41 UTC` with:

```
traverse_and_identify failed for batch 26: Zip contains more than 200 leaf folders
```

The hard limit lived in `process_bulk_import.py` as `BULK_IMPORT_MAX_LEAF_FOLDERS`. The zip contained a legitimate audit batch (`AUDITORIA SOLIS LOTE 1`) that simply exceeded the limit. The user raised the constant and merged to main. No alternatives were considered — the limit was a guard meant for abuse prevention, not a business constraint, so raising it was straightforward.

### Topic 2 — Deploy execution and findings

The GCP deploy triggered on push to main. All jobs succeeded: build (2m7s), migrate (1m38s), deploy-api, deploy-bulk-import-job, all three remessa upload tiers, and deploy-worker. Two secondary issues were observed:

1. **`Permission denied` on env file grep**: The deploy script reads `CELERY_QUEUES` and `CELERY_CONCURRENCY` from `/etc/zefra-hub.env` via `grep`, but the file is root-owned and the deploy SSH user lacks read permission. The worker fell back to hardcoded defaults: `default,remessa-validation,remessa-recovery,bulk-import` — correct by coincidence, not by configuration.

2. **CI test flake**: All 106 test errors in `test_upload_tasks.py` were `OperationalError: connection refused on port 5433`. The PostgreSQL container in CI did not come up before pytest ran. Pre-existing issue, unrelated to the change.

### Topic 3 — Batch 27 and 28 killed on request

After the deploy, the user re-uploaded. Batch 27 started at `16:20 UTC` and was actively uploading PDFs (`AVERB`, `COMPROVANTE`, `RG`, `HOL`, `ANTIFRAUDE` per folder). The user requested it be killed.

The Celery CLI `control terminate` command had a bug (`TypeError: signal name must be uppercase string`) regardless of how the signal was passed. The working method was via Python API inside the container:

```python
app.control.revoke('1c9c47a8-...', terminate=True, signal='SIGTERM')
```

Batch 28 started subsequently and was killed the same way (`4cdc72dd-...`).

### Topic 4 — Architectural discovery: Cloud Run Job delegation is inactive

The user asked whether the Celery worker delegates to Cloud Run Jobs in production. Investigation revealed two execution modes in `process_bulk_import.py`:

- **`USE_CLOUD_RUN_JOBS=True`**: Celery worker runs `traverse_and_identify` (unzip, validate, identify folders), then calls `trigger_bulk_import_job()` to spawn a Cloud Run Job execution with one task per folder in parallel. Each Cloud Run task processes its folder, increments a Redis counter, and the last one enqueues `finalize_batch_task` back to Celery.
- **`USE_CLOUD_RUN_JOBS=False` (default)**: A Celery chord runs `process_folder_task` per folder, then `finalize_batch_task`.

Checking `/etc/zefra-hub.env` on the MIG worker: `USE_CLOUD_RUN_JOBS` is **not set**. Only `USE_CLOUD_RUN_JOBS_REMESSA=true` exists. Zero Cloud Run Job executions were confirmed. Bulk import runs entirely in-process on the Celery worker, never parallelizing across Cloud Run tasks. This contradicts the intended architecture.

The `USE_CLOUD_RUN_JOBS=true` flag is present in the Cloud Run Job definition `zefra-bulk-import-worker`, but that job is never triggered because the MIG worker doesn't know to trigger it.

### Topic 5 — Monitoring gap discovery

The full session required: `gcloud logging read` with crafted filters, SSH via IAP tunnel, Docker exec inside the container, and knowledge of internal task UUIDs. This is the wrong operational model for a financial system where document batches feed into CCB validation and fund-level asset decisions.

Three options were explored and documented in `specs/refactor/ops-monitoring-dashboard.md`:

1. **GCP Cloud Monitoring dashboard** (~1h, no code): uses the existing `custom.googleapis.com/celery/queue_depth` metric already flowing every minute. Gives queue-depth visibility only.
2. **Flower** (~2h): Celery's native monitoring UI, shows active tasks, worker state, allows revoke/terminate from a UI. Protected via IAP. Does not speak business vocabulary (shows task IDs, not batch IDs).
3. **Custom Django ops page** (1–2 days): integrated with `BulkImportBatch` model, fund vocabulary, operator-friendly. Highest effort, highest value long-term.

Recommendation: Phase 1 = GCP dashboard now, Phase 2 = Flower next sprint, Phase 3 = Django ops page when ops load justifies it.

### Topic 6 — Deploy verification method

To confirm the next run uses updated code: compare the running container image tag against `git rev-parse HEAD`. Both resolved to `f12f2f94` after the deploy, confirming the fix is live.

---

## Epistemic Impact

- **questions** `docs/vault/infrastructure/bulk-import-production-architecture.md` (if it exists): the bulk import pipeline's Cloud Run Job delegation is described as the production model but is not active. Any spec assuming parallel Cloud Run execution is stale.
- **questions** the deploy script's env configuration reliability: the `grep /etc/zefra-hub.env` step silently fails, meaning any configuration set in the env file beyond the four secrets is invisible to the deploy.
- **promoted_candidates**: A spec should capture the current production execution mode for bulk import (Celery-direct, Mode B) so future agents don't design against the intended-but-inactive Cloud Run model.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/documents_validation/use_cases/process_bulk_import.py` | modified | `BULK_IMPORT_MAX_LEAF_FOLDERS` raised — previous hard limit of 200 caused batch 26 to fail on a legitimate audit upload |
| `specs/refactor/ops-monitoring-dashboard.md` | created | Discovery document with three monitoring options and phased recommendation, written after diagnosing that production task management required manual SSH round-trips |

---

## Connections

- `contextualizes` → `specs/003-remessa-upload-with-events/remessa-backlog.md` — the `bulk-import` queue fix from 2026-04-02 is the context for why batches started flowing again and why this debugging session happened
- `questions` → any spec describing the bulk import architecture as Cloud Run Job-delegating

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `USE_CLOUD_RUN_JOBS` not set in `/etc/zefra-hub.env` on MIG worker — bulk import runs Celery-direct, Cloud Run Job delegation never executes in production | Architectural discovery | HIGH | Open |
| Deploy script `grep /etc/zefra-hub.env` fails with `Permission denied` — custom `CELERY_QUEUES`/`CELERY_CONCURRENCY` silently ignored | Observed during deploy | MEDIUM | Open |
| Celery CLI `terminate` subcommand has a TypeError — task revocation requires Python API workaround | Discovered during batch kill | MEDIUM | Open |
| Production monitoring requires manual SSH — no dashboard, no Flower, no ops page | Architectural gap | MEDIUM | Open — discovery written, implementation not started |
| CI PostgreSQL flake — tests fail intermittently with port 5433 not reachable | Observed in CI run | LOW | Pre-existing / Open |

---

## Open Questions

- Should `BulkImportBatch` expose a `/api/ops/batches/` endpoint now, before a UI exists? Would allow Flower to map task IDs to business batch IDs.
- Is `USE_CLOUD_RUN_JOBS` for bulk import intentionally disabled in production, or was it simply forgotten when setting up the MIG worker env file?
- Should the deploy script be updated to write critical env vars (not just secrets) to `/etc/zefra-hub.env` on each deploy, eliminating drift?
