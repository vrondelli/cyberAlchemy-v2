---
tags: [infrastructure]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:17:41-03:00
expires: 2026-05-18
conversation_id: 9993266f-2b5c-491d-92f9-1f5834b92353
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.md, refactors/infrastructure/gcp-infrastructure-migration.tf, refactors/infrastructure/terraform-decisions.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Hardened the GCP migration Terraform and plan with 13 fixes including a SSL redirect infinite-loop bug, worker VM observability gaps, and Phase 0 state bucket prerequisite."
version: 0.1.0
last_updated: 2026-03-19
---

# Hardening GCP Infrastructure Migration Plan

**Date:** 2026-03-19 17:17 (UTC-3)
**Tags:** #infrastructure

## Summary

Reviewed the three files in `/refactors/infrastructure/` (`gcp-infrastructure-migration.md`, `gcp-infrastructure-migration.tf`, `terraform-decisions.md`) for conceptual soundness as a v1 cloud infrastructure baseline. Found the overall architecture (Cloud Run + Compute Engine + Cloud SQL + Memorystore + GCS) to be sound, with correct phase ordering and proper least-privilege IAM. Identified 13 gaps and applied all fixes across the three files. The most critical fix was adding `SECURE_PROXY_SSL_HEADER` to prevent an infinite redirect loop when `SECURE_SSL_REDIRECT` is enabled on Cloud Run (which terminates TLS at the ingress layer, not at Django).

### Terraform Hardening
- **Problem:** Missing resource limits, worker VM had no observability, no SSH access path, fragile uptime check.
- **Decision:** Add explicit Cloud Run CPU/memory, Ops Agent, Docker `gcplogs` driver, IAP SSH firewall, URL-based uptime check.
- **Changes:** All applied to `gcp-infrastructure-migration.tf`.

### Migration Plan Fixes
- **Problem:** SSL redirect bug, missing Terraform state prerequisite, shallow health check, no concrete worker VM redeploy strategy, region defaulted without forcing a decision.
- **Decision:** Fix SSL redirect, add Phase 0, specify health check with DB+Redis verification, SSH-via-IAP redeploy strategy, add region decision section.
- **Changes:** All applied to `gcp-infrastructure-migration.md`.

### Decisions Doc Updates
- **Problem:** Missing rationale for Direct VPC Egress and resource limits, premature cost optimization bullets.
- **Decision:** Add rationale entries, defer cost optimization section.
- **Changes:** Applied to `terraform-decisions.md`.

Key outputs:
- `infrastructure-review.md` — Full conceptual review artifact with severity-ranked findings
- All 13 changes applied directly to the infrastructure files

## Key Decisions

- **SSL Redirect:** Must pair `SECURE_SSL_REDIRECT = True` with `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` on Cloud Run.
- **Worker VM Observability:** Ops Agent + Docker `gcplogs` driver — without this, zero production visibility into Celery.
- **Phase 0 (Terraform State):** State bucket is a blocking prerequisite — without it, first `terraform apply` creates untracked local state.
- **Health Check Depth:** `/health/` should verify DB + Redis connectivity, not just return 200.
- **Worker VM Redeploy:** SSH via IAP → pull and restart as the v1 mechanism.
- **Region:** `us-central1` vs `southamerica-east1` flagged as must-decide-before-Phase-1.
- **IAP SSH Firewall:** Added to Phase 1 — needed for validation and debugging.
- **Cloud Run Resources:** Explicit `cpu=1, memory=1Gi` (default 512MB too low for Django + Gunicorn).
- **Uptime Check:** Switched from fragile `cloud_run_revision` to URL-based on `*.run.app`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Resource limits, ALLOWED_HOSTS on VM, Ops Agent, gcplogs, temp cleanup cron, IAP SSH firewall, URL-based uptime check |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Region decision section, Phase 0, SSL redirect fix, health check depth, worker VM redeploy, expanded Phase 1 |
| `refactors/infrastructure/terraform-decisions.md` | `modified` | Direct VPC Egress rationale, resource limits rationale, cost optimization deferred |

## Open Questions

- **Region decision:** `us-central1` (cheaper, ~150ms latency) vs `southamerica-east1` (30ms, ~30% premium). Must be resolved before Phase 1.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [2026-03-19-1716-gcp-migration-plan-update.md](file:///Users/victorboscaro/house_project/docs/vault/conversations/2026-03-19-1716-gcp-migration-plan-update.md) | `updates` | Direct continuation — hardening the plan that was updated in the previous session |
| [2026-03-19-1940-gcp-migration-gap-analysis.md](file:///Users/victorboscaro/house_project/docs/vault/conversations/2026-03-19-1940-gcp-migration-gap-analysis.md) | `validates` | Gap analysis that followed up on this hardening session |
| [gcp-infrastructure-migration.md](file:///Users/victorboscaro/house_project/refactors/infrastructure/gcp-infrastructure-migration.md) | `refines` | Directly modified this migration plan with 13 fixes |
| [gcp-infrastructure-migration.tf](file:///Users/victorboscaro/house_project/refactors/infrastructure/gcp-infrastructure-migration.tf) | `refines` | Applied Terraform hardening (resource limits, Ops Agent, IAP SSH, uptime check) |
| [terraform-decisions.md](file:///Users/victorboscaro/house_project/refactors/infrastructure/terraform-decisions.md) | `refines` | Added rationale entries for Direct VPC Egress and resource limits |
