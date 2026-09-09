---
tags: [infrastructure, architecture]
node_type: audit
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-04-21
timestamp: 2026-04-21T16:00:00-03:00
expires: 2026-06-20
conversation_id: b00fc7e3-9ea2-43b1-9ad9-4aeb468e6821
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Documents a scope violation in an AI-generated Terraform commit that caused a production outage and captures the per-resource review discipline needed for AI-authored infra diffs."
---

# Zefra.app Routing Fix — TF Scope Creep Audit

## Summary

Diagnosed `zefra.app` serving the Django Pegasus login template instead of the Vercel frontend. Root cause: Terraform commit `03605ed3` (AI co-authored by Claude Sonnet 4.6) exceeded its stated scope — the message said "add api.zefra.app domain" but the diff also created apex + www DNS A records and SSL cert SANs pointing to the GCP LB. A `terraform apply` on Sunday/Monday instantiated those records, hijacking `zefra.app` traffic from Vercel to the Django API. Remediated via manual `gcloud dns` patch to restore `zefra.app → 216.198.79.1` (Vercel apex IP), then Terraform refactor using `terraform state rm` on the orphaned apex record plus a dual-cert zero-outage swap (v5 → v6) to narrow the managed SSL cert to `api.zefra.app` only. Apex and www now explicitly documented in TF as out-of-scope for this LB.

## Files touched

- specs/cloud_services/iac/gcp-infrastructure-migration.tf
