---
tags: [cloud-run, celery, redis, ci-cd, deploy-worker, ssh, poller, timeout]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-15
timestamp: 2026-04-15T04:40:00-03:00
expires: 2026-06-14
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Restores two broken feedback loops (Redis terminal signal, CI deploy surface) that were silently degrading production reliability."
---

# Deploy-Worker SSH Failures & Cloud Run Poller Fix

**Date:** 2026-04-15 04:40 (UTC-3)
**Tags:** #cloud-run #celery #redis #ci-cd #deploy-worker #ssh #poller #timeout

## Summary

This session diagnosed and fixed two simultaneous production failures that shared a common pattern: missing feedback loops.

**Root Cause 1 — Cloud Run Job crash without signaling Redis.** CSV upload in import-export returned a 3600s timeout instead of the real error. The Cloud Run Job entrypoint (`shared_services/tasks/remessa_upload_job_entrypoint.py`) called `sys.exit(1)` without first writing `stage=done` to Redis, leaving the Celery poller stranded polling every 5s until timeout. Fixed by adding Redis signal before exit. A secondary fragility was found: the poller's success/error discriminator split on `:` presence — any `:` in an error message caused false-success. Changed to check for `"inserted"` as the unambiguous success token. Both `aquisicao` and `liquidacao` pollers were fixed.

**Root Cause 2 — 81 stale SSH keys in GCP metadata.** `deploy-worker` had failed silently for 7 consecutive commits. `gcloud compute ssh` injects an ephemeral SSH key into project-level metadata on every run, with no TTL. After accumulating 81 `runner:ssh-rsa` entries, the metadata API write timed out. The `set -euo pipefail` + variable assignment pattern (`VAR=$(gcloud ...)`) swallowed the error — in bash with `set -e`, the script exits at the assignment before any `echo "$VAR"` can run, producing zero output. Fixed by: cleaning the 81 keys (one-time), adding `--ssh-key-expire-after=10m` for automatic TTL, adding `ConnectTimeout=30`, and capturing exit code without silencing errors.

One wrong turn: initially used `--ssh-key-expiration=600` which expects an RFC 3339 datetime, not duration. Corrected to `--ssh-key-expire-after` in a follow-up commit.

## Epistemic Impact

Two failure modes were made legible that were previously invisible. Both share a pattern: missing feedback loops. The fixes restore observability at the point of failure rather than relying on upstream timeouts or manual cleanup. The signal-before-exit pattern for Cloud Run Jobs is now established as a convention.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `shared_services/tasks/remessa_upload_job_entrypoint.py` | Modified | Added Redis signal before `sys.exit(1)` so poller receives terminal event |
| `domains/aquisicao/tasks/celery_tasks.py` | Modified | Changed poller discriminator from `:` check to `"inserted"` token |
| `domains/liquidacao/tasks/celery_tasks.py` | Modified | Same discriminator fix as aquisicao |
| `.github/workflows/deploy-gcp.yml` | Modified | SSH key TTL, ConnectTimeout, exit code capture |

## Connections

- contextualizes: `shared_services/tasks/remessa_upload_job_entrypoint.py`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Audit other Cloud Run Job entrypoints for missing Redis terminal-signal | Session pattern | High | open |
| Integration test: Cloud Run crash writes error state to Redis | Session finding | High | open |
| Document `set -euo pipefail` + command-substitution footgun as CI convention | Session finding | Medium | open |

## Open Questions

- Are there other Cloud Run Job entrypoints that could leave pollers stranded on crash?
- Pre-existing Django CI failure (`test_create_template_400_invalid_doc_type` → MinIO absent) identified but not resolved.
