---
tags: [infrastructure, gcp, cloud-run, dns, vercel, https, cors, allowed-hosts, terraform, ci-cd, drift]
node_type: discovery
is_session: true
layer: [architecture, application]
nature: [procedural, technical]
status: active
created: 2026-04-16
timestamp: 2026-04-16T12:33:33-03:00
expires: 2026-06-15
conversation_id: ~
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/cloud_services/cloud-backlog.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Production incident fix + architectural DNS routing change (frontend now served from Vercel) + captured Terraform drift as formal backlog — three compounding outcomes with lasting infra consequences."
---

# Zefra HTTPS End-to-End — DNS Cutover to Vercel + Terraform Drift Captured

## Summary

Fixed HTTPS end-to-end for zefra.app after discovering the prior manual ALLOWED_HOSTS/CORS patch had been reverted by the Django CVE deploy — confirming the CI/CD drift risk flagged the session before. Committed `deploy-gcp.yml` (`c2abadd`) to make the env-var fix permanent. Then discovered the real "old frontend" symptom was architectural: `zefra.app` and `www.zefra.app` DNS-pointed to the GCP load balancer serving Django, not Vercel — cut DNS over to Vercel (apex → `76.76.21.21`, www → `cname.vercel-dns.com`) while keeping `api.zefra.app` on the backend. Captured resulting Terraform drift (SSL cert `v3→v5` rename, DNS records now Vercel-bound, `local.allowed_hosts` cosmetic edit) as a MEDIUM backlog item in `cloud-backlog.md` because running `terraform apply` today would fail on the cert or revert prod DNS.

## Contradictions

- Contradicts `specs/cloud_services/iac/gcp-infrastructure-migration.tf` — TF and the original DNS config treated `zefra.app` + `www.zefra.app` as backend domains on the GCP LB; session rerouted them to Vercel, exposing that the infra-as-code model was misaligned with product intent (frontend on apex, API on `api.` subdomain). Reconciliation deferred to backlog.

## Files touched

- `.github/workflows/deploy-gcp.yml`
- `specs/cloud_services/cloud-backlog.md`
- `specs/cloud_services/iac/gcp-infrastructure-migration.tf` (uncommitted, drift captured in backlog)
