---
tags: [infrastructure]
node_type: spec
is_session: true
layer: architecture
nature: technical, procedural
status: active
created: 2026-03-27
timestamp: 2026-03-27T09:38:45-03:00
expires: 2026-05-26
conversation_id: gcp-terraform-initial-setup-2026-03-27
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "First Terraform apply attempt for GCP infrastructure established billing, GCS state backend, and downgraded Cloud SQL tier to db-g1-small for cost efficiency at launch."
---

# GCP Terraform Initial Setup

**Date:** 2026-03-27 09:38 (UTC-3)
**Tags:** #infrastructure

## Summary

This session covered the first attempt to provision GCP infrastructure via Terraform for the `zefra-491412` project. The work began with attempting to run `terraform apply` from the wrong directory (project root instead of `refactors/infrastructure/`), which required correcting. The GCS backend bucket (`zefra-491412-terraform-state`) did not yet exist and the project had billing disabled, both of which blocked initialization. After the user resolved billing and created the bucket, Terraform initialized successfully.

A stale state lock left by an interrupted `terraform apply` (Ctrl+C) required a `terraform force-unlock` before the next apply could proceed. The session also surfaced a discussion about Cloud SQL tier costs: the default `db-custom-2-7680` (2 vCPU, 7.5 GB RAM, ~$150–200+/month) was deemed excessive for initial launch, and was downgraded to `db-g1-small` (1.7 GB RAM, shared-core) for cost efficiency, with the understanding it can be upgraded in-place with minimal downtime later.

The session ended with Terraform showing a valid plan and the user being instructed to run `terraform apply` interactively to supply required sensitive variables.

### Terraform Initialization Blockers

- **Problem/Goal:** Run `terraform apply` for the first time on GCP infrastructure.
- **Decision:** Fix blockers sequentially: correct working directory → enable billing → create GCS state bucket → unlock stale state lock.
- **Changes:** No code changes; operational steps resolved.

### Cloud SQL Tier Decision

- **Problem/Goal:** `db-custom-2-7680` is production-grade but expensive (~$150–200+/month) for an initial deployment.
- **Decision:** Downgrade to `db-g1-small` for launch; upgrade later when actual load warrants it. Cloud SQL tier changes are in-place with ~1-2 min downtime.
- **Changes:** `refactors/infrastructure/gcp-infrastructure-migration.tf` — `tier` changed from `db-custom-2-7680` to `db-g1-small`.

### Variable Supply Strategy

- **Problem/Goal:** `terraform apply` requires sensitive variables (`db_password`, `django_secret_key`, `redis_auth_string`, `gemini_api_key`, `django_image`) that cannot be passed non-interactively without a `.tfvars` file.
- **Decision:** User should create a `terraform.tfvars` file locally (not committed) to avoid typing variables on each apply.
- **Changes:** None; instructional only.

Key outputs:
- `refactors/infrastructure/gcp-infrastructure-migration.tf` — Cloud SQL tier downgraded to `db-g1-small`

## Key Decisions

- **Cloud SQL tier:** Use `db-g1-small` at launch instead of `db-custom-2-7680`; upgrade when load requires it.
- **State backend:** GCS bucket `zefra-491412-terraform-state` in `southamerica-east1` confirmed as Terraform state backend.
- **tfvars:** Sensitive variables should be supplied via a local `terraform.tfvars` file (not committed to git).

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Cloud SQL tier changed from `db-custom-2-7680` to `db-g1-small` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Create `terraform.tfvars` with all required variables | Session | MEDIUM | open |
| Run `terraform apply` interactively to complete provisioning | Session | HIGH | open |
| Push Docker image to Artifact Registry before Cloud Run can deploy | Session | HIGH | open |

## Open Questions

- What machine type is used for the Celery worker VM (MIG)? Not reviewed in this session.
- Should `db-g1-small` be the permanent launch tier or is there a planned upgrade timeline?
