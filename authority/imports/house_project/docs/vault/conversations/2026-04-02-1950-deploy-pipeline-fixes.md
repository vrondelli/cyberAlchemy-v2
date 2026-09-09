---
tags: [infrastructure, pipeline, architecture]
node_type: spec
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T19:50:00-03:00
expires: 2026-06-01
conversation_id: dp3x9
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Hardened the production deploy pipeline with smoke testing and rollback capability, directly reducing the risk of silent deploy failures."
---

# Deploy Pipeline Fixes

**Date:** 2026-04-02 19:50 (UTC-3)
**Tags:** #infrastructure #pipeline #architecture

## Summary

Implemented the highest-leverage fixes from `deploy-pipeline-discovery.md` in the GitHub Actions deploy workflow (`deploy-gcp.yml`). Three issues were addressed: G1 — no smoke test after deploy, fixed by adding a post-deploy check against the existing `/health/` endpoint with a dynamically fetched Cloud Run URL via `gcloud run services describe`; G3 — env file permissions on the VM, fixed with proper chmod/chown; and G6 — no rollback mechanism, fixed with a rollback step that redeploys the previous image on smoke test failure. Three other issues were intentionally deferred: G2 (SSH heredoc architecture) requires restructuring the entire deploy-worker approach, G5 (Redis beat lock) requires Python code changes to the scheduler, and full G3 (eliminating `/etc/zefra-hub.env` entirely) requires migrating all config to a secrets manager or Terraform-managed env vars. These deferred items were scoped out because they cross the boundary from pipeline-only changes into application or infrastructure code changes.

## Epistemic Impact

- Confirmed that the existing `/health/` endpoint (checks DB connectivity, returns 200/503) is sufficient for smoke testing — no new test infrastructure needed.
- `deploy-gcp.yml` was missing smoke test, env file permissions, and rollback logic. These gaps from `deploy-pipeline-discovery.md` are now resolved.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.github/workflows/deploy-gcp.yml` | modified | Added smoke test (G1), env file permissions (G3), rollback mechanism (G6) |

## Connections

- derives-from: `specs/cloud_services/docs/deploy-pipeline-discovery.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| G2 — Refactor SSH heredoc architecture in deploy pipeline | `deploy-pipeline-discovery.md` | MEDIUM | Deferred |
| G5 — Add Redis beat lock protection | `deploy-pipeline-discovery.md` | MEDIUM | Deferred |
| G3 (full) — Eliminate `/etc/zefra-hub.env` as persistent config | `deploy-pipeline-discovery.md` | HIGH | Deferred |
