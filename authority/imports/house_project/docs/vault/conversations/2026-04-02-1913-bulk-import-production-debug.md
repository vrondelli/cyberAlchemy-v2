---
tags: [infrastructure, pipeline, application]
node_type: spec
is_session: true
layer: application, architecture
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T19:13:00-03:00
expires: 2026-06-01
conversation_id: bulk-import-production-debug
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Surfaced a silent misconfiguration where every bulk import batch bypassed Cloud Run Jobs entirely, with an outstanding deploy script gap that will recur on fresh deploys."
---

# Bulk Import Production Debug — Batch 11c12b01

**Date:** 2026-04-02 19:13 (UTC-3)
**Tags:** #infrastructure #pipeline #application

## Summary

A production debugging session for batch `11c12b01` (batch 30) where bulk import was not using Cloud Run Jobs as expected. Investigation revealed that `USE_CLOUD_RUN_JOBS` was NOT set on the VM environment — only `USE_CLOUD_RUN_JOBS_REMESSA=true` existed, meaning the remessa upload path was correctly configured but the bulk import path was silently falling back to the slow 8-thread Celery chord on the worker VM. The Cloud Run Job execution list confirmed zero executions ever ran. The worker had been downloading the ZIP and uploading files to GCS for 15 minutes before the Celery chord even started processing folders. The fix involved killing the stale celery-worker container, flushing Redis (`FLUSHALL`) to purge all pending `process_folder_task` tasks, adding `USE_CLOUD_RUN_JOBS=true` to `/etc/zefra-hub.env`, and restarting the worker. Batch 30 was marked for re-upload. An outstanding TODO was flagged: the deploy script (`deploy-gcp.yml`) does not set this env var, so it will be lost on any fresh deploy.

## Epistemic Impact

- **Belief challenged:** The team assumed `USE_CLOUD_RUN_JOBS` was active on the VM after prior configuration work. This session revealed it was never set — only the remessa-specific variant existed. This is a direct contradiction of the operational assumption.
- **Spec drift discovered:** The deploy script does not propagate `USE_CLOUD_RUN_JOBS=true`. Any runbook describing the deploy pipeline is stale on this point.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| VM `/etc/zefra-hub.env` | modified | Added `USE_CLOUD_RUN_JOBS=true` — the missing env var caused all bulk import batches to fall back to Celery |

## Connections

- contextualizes: `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add `USE_CLOUD_RUN_JOBS=true` to deploy script so it survives fresh deploys | Session TODO | HIGH | Open |
| Batch 30 required manual re-upload | Session observation | MEDIUM | Resolved |

## Open Questions

- Should a pre-deploy audit step verify all required env vars are present on the VM?
