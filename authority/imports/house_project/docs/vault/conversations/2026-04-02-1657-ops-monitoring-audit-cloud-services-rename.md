---
tags: [monitoring, observability, bulk-import, celery, cloud-run, gcp, architecture]
node_type: audit
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T16:57:22-03:00
expires: 2026-06-01
conversation_id: ~
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "premise: active task count is a required complement to queue depth in Celery monitoring"
  - "premise: async 202 contract at upload endpoint must be preserved"
expected_importance: 7
importance_rationale: "This session prevented a monitoring spec from being shipped with a known blind spot that would have missed the exact failure mode (silent worker death) motivating the spec, and established that USE_CLOUD_RUN_JOBS is blocking—not optional—at the 2k-folder production scale."
---

# Ops Monitoring Audit + Cloud Services Rename

**Date:** 2026-04-02 16:57 (UTC-3)
**Tags:** #monitoring #observability #bulk-import #celery #cloud-run #gcp #architecture

## Summary

This session audited `specs/refactor/ops-monitoring-dashboard.md`, renamed the `docs/vault/infrastructure/` folder to `specs/cloud_services/`, and resolved an architectural question about where the ZIP download step should execute in the bulk import pipeline.

### Topic 1 — Ops Monitoring Spec Audit

The spec was reviewed for MVP completeness. Two critical gaps were found.

**Problem:** The spec proposes a three-phase rollout. Phase 1 builds a GCP Cloud Monitoring dashboard using the existing `celery/queue_depth` custom metric. Phase 2 deploys Flower. Phase 3 builds an internal ops page.

**Gap 1 — Phase 1 doesn't solve the core problem.** The `celery/queue_depth` metric only measures tasks waiting in the queue. A worker that dies with zero tasks in queue looks identical to a healthy idle system. The 2026-04-02 incident involved a worker that was processing (not queued) — this metric would have shown nothing. Phase 1 alone cannot distinguish "still running" from "silently dead."

**Gap 2 — Duplicate batch prevention is missing.** The incident produced three simultaneous batches (26, 27, 28) because the operator could not tell whether the previous upload was still alive. None of the three options in the spec prevent this. A submission guard in the upload endpoint (block if any `BulkImportBatch` is already in `PROCESSING` state) would have prevented the incident and costs ~1h to implement.

**Decision:** Flower (Phase 2) is the real MVP, not a "next sprint" item. The revised MVP is ~3.5h total: (a) extend `push-celery-metrics.sh` to also emit active task count, (b) deploy Flower behind IAP, (c) add submission guard to the upload endpoint.

### Topic 2 — Rename infrastructure → cloud_services

**Problem:** `docs/vault/infrastructure/` contains GCP service topology documentation (Cloud Run, VM MIG, Redis). But `infrastructure` is already the name of an application layer in the Python codebase (`infrastructure/remessa/filter_registry.py`). Using the same term for two different things creates ambiguity.

**Decision:** Rename to `specs/cloud_services/`. The content is specifically about GCP-managed service topology, not IaC or networking. The folder was copied to `specs/cloud_services/bulk-import-production-architecture.md`. The original `docs/vault/infrastructure/` was not yet deleted.

### Topic 3 — ZIP Download: Celery Worker vs. Cloud Run

**Problem:** The user asked whether the ZIP download step (currently on the Celery worker) should move to Cloud Run.

**Analysis:** There are two Cloud Run surfaces. Moving the download to the Cloud Run Service (the API) breaks the 202 async contract — the whole point is to return immediately and process in the background. Moving to a Cloud Run Job adds cold start latency (~30–60s) and orchestration complexity (DB writes from the Job, credential plumbing) without addressing the actual bottleneck.

**The actual bottleneck is folder processing**, not the download. The current Celery chord dispatches all folder processing through 8 concurrent threads. At the stated production scale — 2000 folders and ~10000 documents per upload — this becomes a severe constraint: 2000 ÷ 8 = 250 sequential rounds, each waiting for the slowest folder in that batch. A single upload could take hours and saturate the worker.

**Decision:** The download stays on the Celery worker (it's a single sequential operation — parallelism doesn't help). `USE_CLOUD_RUN_JOBS` must be enabled on the VM. This is not a "higher leverage" improvement — it is blocking for production use at this scale. Cloud Run Jobs dispatch one independent container per folder, removing the concurrency ceiling entirely.

**Additional note at scale:** A Celery chord of 2000 tasks also stresses the Redis result backend. Every task writes its result and `finalize_batch_task` polls until all 2000 complete. Cloud Run Jobs sidestep this since GCP manages job state natively. Also, a ZIP containing 10k documents across 2k folders could be several GBs — the VM needs sufficient disk headroom before extraction.

---

## Epistemic Impact

**Contradiction found (unresolved):** `specs/refactor/ops-monitoring-dashboard.md` implicitly assumes that `celery/queue_depth` is a sufficient proxy for worker health in Phase 1. This session contradicts that assumption with direct evidence from the 2026-04-02 incident. The spec was not updated — the contradiction is discovered, not yet resolved.

**Promoted candidates:**
- `premise`: "Active task count must complement queue depth — `celery/queue_depth` alone cannot detect silent worker death."
- `premise`: "The async 202 contract at the upload endpoint must be preserved — any synchronous processing in the Cloud Run Service violates it."

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/refactor/ops-monitoring-dashboard.md` | audited (not modified) | Gaps found: Phase 1 blind spot on active tasks, Phase 2 misclassified as next-sprint, submission guard absent |
| `docs/vault/infrastructure/bulk-import-production-architecture.md` | read | Source of the architecture doc before rename |
| `specs/cloud_services/bulk-import-production-architecture.md` | created | Copy after folder rename to resolve naming collision with Python `infrastructure` layer |

---

## Connections

- `contradicts` → `specs/refactor/ops-monitoring-dashboard.md` (Phase 1 monitoring assumption is incorrect for the failure mode it targets)
- `contextualizes` → `docs/vault/infrastructure/bulk-import-production-architecture.md` (the Cloud Run Job architecture is the resolution to the Celery chord scale problem)

---

## Gaps & Backlog

| Item | Priority | Status |
|---|---|---|
| Update `specs/refactor/ops-monitoring-dashboard.md`: reclassify Flower as MVP Phase 1, add submission guard option | HIGH | open |
| Enable `USE_CLOUD_RUN_JOBS=true` in VM `/etc/zefra-hub.env` and sync via deploy script | HIGH | open |
| Add submission guard to upload endpoint: block if `BulkImportBatch` already `PROCESSING` | HIGH | open |
| Extend `push-celery-metrics.sh` to emit `active_task_count` alongside queue depth | HIGH | open |
| Delete `docs/vault/infrastructure/` original folder (rename was done by copy) | MEDIUM | open |
| Create premise node: "active task count required alongside queue depth for Celery monitoring" | MEDIUM | open |
| Validate `specs/cloud_services/` frontmatter matches ontology conventions | LOW | open |
| Add `cloud_services` term to `docs/vault/dictionary-business.md` | LOW | open |

---

## Open Questions

- At 2k folders / 10k documents, what is the estimated ZIP size in GBs? Is the VM disk sufficient for extraction?
- Should `BulkImportBatch` expose a `/api/ops/batches/` endpoint now to give Flower a richer batch-to-task mapping?
- Who should have access to Flower — engineering only, or also fund operators?
