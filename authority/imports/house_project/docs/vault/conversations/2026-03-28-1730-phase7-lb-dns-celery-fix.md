---
tags: [infrastructure, architecture, application]
node_type: spec
is_session: true
layer: infrastructure
nature: technical
status: active
created: 2026-03-28
timestamp: 2026-03-28T17:30:00-03:00
expires: 2026-05-27
conversation_id: e4b5dfba-ebf3-434a-a5ad-181ff8568f14
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/migration-preflight-checklist.md
  - refactors/infrastructure/migration-phase-guide.md
  - refactors/infrastructure/gcp-architecture-reference.md
  - refactors/infrastructure/terraform-decisions.md
promoted_candidates:
  - Conditional DNS zone management pattern (manage_dns variable)
  - Celery beat leader election via --format="value(NAME)" operational fact
expected_importance: 6
importance_rationale: "This session executed Phase 7 of the GCP migration and resolved a production-blocking Terraform heredoc bug, making the production domain (www.zefra.com.br) and load balancer configuration the authoritative reference for how the infrastructure is wired together — future debugging, DNS changes, and SSL cert rotations will trace back to decisions made here."
---

# Phase 7: Load Balancer, DNS, Celery Worker Fix & CORS

**Date:** 2026-03-28 17:30 (UTC-3)
**Tags:** #infrastructure #architecture #application

## Summary

This session completed Phase 7 of the GCP infrastructure migration for the Zefra Hub project. The primary outcomes were: fixing the Celery worker VM startup script (broken by Terraform heredoc escaping), deploying the GCP External Load Balancer with SSL and Cloud DNS, switching the production domain from `zefrahub.com` to `www.zefra.com.br`, fixing CORS errors blocking frontend login from Vercel preview URLs, updating the Vercel deploy workflow to the correct branch, and helping the user connect to Cloud SQL via DBeaver.

### Topic 1: Celery Worker Startup Script Fixes

**Problem:** Worker VM failed to start Celery containers with a bash syntax error: `syntax error near unexpected token '('`. Beat leader election was also broken, returning `FIRST_INSTANCE=southamerica-east1-a` instead of an instance name.

**Root cause:** Terraform's `<<-EOT` heredoc only escapes `${...}` interpolation blocks. Bare `$VAR` and `$(cmd)` inside the heredoc are rendered as two literal backtick characters in the output — bash reads those as command substitution with no command, producing the syntax error. For beat election, `--format="value(instance)"` returns a full resource URL; `xargs basename` was extracting the zone component instead of the instance name.

**Fix:** Changed all `$VAR` → `$VAR` and `$(cmd)` → `$(cmd)` throughout the heredoc section. Changed beat election format to `--format="value(NAME)"` which returns the short instance name directly, removing the need for `xargs basename`. Added `roles/compute.viewer` project-level binding to the worker service account to satisfy the `compute.instanceGroupManagers.get` permission required for the election query.

### Topic 2: Phase 7 Load Balancer and DNS — Domain Switch

**Problem:** The original production domain `zefrahub.com` was registered on AWS Route 53, and the user had lost access to that account. The Phase 7 plan depended on a domain with accessible DNS management.

**Decision:** Switch to `www.zefra.com.br` managed at registro.br (user has active access). Two Terraform variables were added: `manage_dns` (bool, enables Cloud DNS zone creation) and `dns_apex_domain` (string, the apex zone domain). A Cloud DNS managed zone `zefra-zone` was created for `zefra.com.br.` with A records for `www.zefra.com.br` and the apex pointing to LB IP `35.244.171.4`. SSL cert `zefra-hub-ssl-cert-v2` uses `lifecycle { create_before_destroy = true }` to avoid the "already in use" deletion error when renaming.

**Pending:** The user must log into registro.br and update the nameservers to `ns-cloud-c1.googledomains.com` through `ns-cloud-c4.googledomains.com`. Until this is done, DNS does not resolve and the SSL cert cannot provision.

### Topic 3: Vercel Frontend and CORS

**Problem:** (a) Vercel deploys were not triggering on pushes to `main` — the GitHub Actions workflow was listening on the branch `conectar-backend`. (b) Frontend login failed with a CORS error because the Vercel preview URL `https://house-project-git-main-victors-projects-c8a4b6aa.vercel.app` was not in `CORS_ALLOWED_ORIGINS`.

**Fix:** Updated `.github/workflows/vercel-deploy.yml` to trigger on `main`. Added the Vercel preview URL to `cors_allowed_origins` in `terraform.tfvars` and redeployed Cloud Run. The frontend `VITE_API_BASE_URL` temporarily points to the Cloud Run URL; it will be switched to `https://www.zefra.com.br` after DNS propagates.

### Topic 4: Cloud SQL Database Access via DBeaver

**Problem:** User wanted to connect to the production Cloud SQL database from DBeaver on their Mac. The instance has no public IP (private-only), so the Cloud SQL Auth Proxy cannot route from outside the GCP VPC.

**Options explored:** (1) `--private-ip` flag — fails because `192.168.0.3` is not routable from the internet. (2) No flag — fails because the instance has no public IP. (3) Enable public IP on the instance — allows proxy without `--private-ip`.

**Resolution:** Directed user to enable public IP on the Cloud SQL instance in GCP Console and add their IP `201.26.89.71/32` as an authorized network. Once connected, created a Django superuser via SQL INSERT into `auth_user` with login `zefrahub-admin`.

## Epistemic Impact

No constitutions, axioms, or premises were challenged. The work was execution-level within established architectural choices.

**Spec drift fixed:**
- `migration-preflight-checklist.md` — checklist was behind deployed state; Groups 3 and 8 updated.
- `migration-phase-guide.md` — Phase 7 done gate referenced `zefrahub.com`; updated to `www.zefra.com.br`.
- `gcp-architecture-reference.md` — LB/DNS section and worker SA IAM binding were outdated.

**promoted_candidates:**
- The `manage_dns` / `dns_apex_domain` Terraform variable pattern (conditional DNS zone management when the registrar is external) deserves a spec node.
- The Celery beat leader election mechanism (`--format="value(NAME)"` to get short instance name, `compute.viewer` role requirement) is a hard-won operational fact worth preserving in the architecture reference.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | modified | Heredoc escaping fix; beat election fix; Phase 7 LB/SSL/DNS resources; `roles/compute.viewer` for worker SA |
| `refactors/infrastructure/terraform.tfvars` | modified | Added `manage_dns`, `backend_domain`, `dns_apex_domain`; Vercel preview URL in `cors_allowed_origins` |
| `.github/workflows/vercel-deploy.yml` | modified | Trigger branch changed from `conectar-backend` to `main` |
| `frontend/.env.production` | modified | `VITE_API_BASE_URL` temporarily set to Cloud Run URL pending DNS |
| `refactors/infrastructure/migration-preflight-checklist.md` | modified | Groups 3 and 8 updated to reflect deployed state |
| `refactors/infrastructure/migration-phase-guide.md` | modified | Phase 7 done gate updated with `www.zefra.com.br` and pending items |
| `refactors/infrastructure/gcp-architecture-reference.md` | modified | LB/DNS section and worker SA IAM updated |
| `refactors/infrastructure/terraform-decisions.md` | modified | Phase 7 resources marked as added |

## Connections

- `derives-from`: `refactors/infrastructure/gcp-infrastructure-migration.md` — this session executes Phase 7 of the plan defined there.
- `contextualizes`: `refactors/infrastructure/terraform-decisions.md` — adds operational context (heredoc escaping, beat election) not present in the decisions doc.

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Update nameservers at registro.br to `ns-cloud-c1..c4.googledomains.com` | DNS cutover | HIGH | Pending — user action required |
| Update `VITE_API_BASE_URL` to `https://www.zefra.com.br` after DNS propagates | Frontend config | HIGH | Pending — blocked by DNS |
| Enable public IP on Cloud SQL for DBeaver access from local machine | DB access | MEDIUM | Pending — user must enable in GCP Console |
| Document beat leader election pattern (`--format="value(NAME)"`, `compute.viewer` role) as architecture reference entry | Operational knowledge | MEDIUM | Not started |

## Open Questions

- After nameservers are updated at registro.br, how long will DNS propagation take? (Typically 24–48h for registro.br.)
- Should the Cloud SQL public IP be left enabled permanently (for admin access) or disabled after each use?
