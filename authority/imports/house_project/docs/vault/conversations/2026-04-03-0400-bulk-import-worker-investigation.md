---
tags: [infrastructure, pipeline, architecture]
node_type: discovery
is_session: true
layer: infrastructure, application
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T04:00:00-03:00
expires: 2026-06-02
conversation_id: w7p3k
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Uncovered and fixed three compounding infrastructure failures (OOM, missing env var, secret corruption) that together made the bulk import worker completely non-functional without any visible error."
---

# Bulk Import Worker Investigation

**Date:** 2026-04-03 04:00 (UTC-3)
**Tags:** #infrastructure #pipeline #architecture

## Summary

Investigation into why the bulk import Cloud Run Job was failing in production. Three independent root causes were found compounding each other. First, Cloud Run Job task2 was OOM-killed at the 512Mi default memory because folder processing via `_step_classify_dvs` loads all file bytes plus OCR results into memory simultaneously — the fix bumped the Cloud Run Job to 2Gi memory and 1 CPU in `deploy-gcp.yml`. Second, `USE_CLOUD_RUN_JOBS` was missing from the Cloud Run API service's env vars, causing all bulk import batches to silently fall back to the Celery chord path on the worker VM instead of dispatching Cloud Run Jobs — this was added to the deploy workflow. Third, and most concerning, the `deploy-worker.sh` `update_env` function was found to have corrupted `SECRET_KEY` by duplicating the value 18+ times in the env file. The corruption mechanism: a fragile grep-and-append pattern that doesn't handle special characters in values (SECRET_KEY contains `+`, `=`, etc.), causing the grep match to fail and the value to be appended on every deploy run. Additionally, the worker VM container was discovered to be 8 hours stale because `deploy-worker.sh` never actually restarts the container after updating the env file. A discovery document was written at `specs/cloud_services/docs/secret-management/worker-env-file-corruption-and-stale-deploy.md`.

## Epistemic Impact

- **Belief falsified:** The belief that `deploy-worker.sh` reliably propagates environment variables was disproven — the `update_env` function corrupts values containing special characters.
- **Spec drift fixed:** `deploy-gcp.yml` was updated with correct memory allocation (2Gi) and `USE_CLOUD_RUN_JOBS` env var.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.github/workflows/deploy-gcp.yml` | modified | Bumped Cloud Run Job memory to 2Gi; added `USE_CLOUD_RUN_JOBS` env var |
| `.github/scripts/deploy-worker.sh` | modified | Fixed `update_env` grep-and-append pattern that corrupted SECRET_KEY |
| `specs/cloud_services/docs/secret-management/worker-env-file-corruption-and-stale-deploy.md` | created | Documents env file corruption mechanism, missing env var, stale container |

## Connections

- contextualizes: `specs/cloud_services/docs/secret-management/cloud-run-secret-drift.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Audit all grep-and-append patterns in deploy scripts for similar corruption risk | Session discovery | HIGH | Open |
| Add automated check validating env file integrity after deploy | Session discovery | HIGH | Open |

## Open Questions

- Are there other env var values with special characters that could trigger the same corruption pattern?
