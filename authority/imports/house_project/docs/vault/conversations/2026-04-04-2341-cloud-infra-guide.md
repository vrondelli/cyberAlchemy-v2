---
tags: [infrastructure, architecture]
node_type: spec
is_session: true
layer: architecture
nature: reference, technical
status: active
created: 2026-04-04
timestamp: 2026-04-04T23:41:00-03:00
expires: 2026-06-03
conversation_id: g642c
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Created the canonical cloud infrastructure reference spec at /specs/cloud_services/cloud-infrastructure-guide.md, anchoring GCP service inventory, networking, IAM, and operational runbook to actual Terraform code, while surfacing a stale VPC name in gcp-architecture-reference.md that remains unresolved."
---

# Cloud Infrastructure Guide — Session Record

**Date:** 2026-04-04 23:41 (UTC-3)
**Tags:** #infrastructure #architecture

## Summary

The session produced a comprehensive cloud infrastructure reference document at `/specs/cloud_services/cloud-infrastructure-guide.md`. The primary goal was to establish a single authoritative reference for the GCP infrastructure supporting the project, bridging the gap between Terraform code and human-readable documentation.

The document was classified as `node_type: spec` rather than `conceptual` because it is directly tied to actual infrastructure code — specifically the Terraform configuration — and must be updated whenever that code changes. This classification was deliberate: a `conceptual` document is context that can drift silently, while a `spec` signals that drift is a bug.

The placement decision was also explicit: the file lives at the root of `specs/cloud_services/` rather than nested under `docs/architecture/`. This keeps infrastructure specs co-located with the cloud services domain they describe and separates them from higher-level architectural concepts.

The guide covers 10 sections: overview of the GCP project and VPC topology, service inventory (Cloud Run, Cloud SQL, Secret Manager, GCS, Artifact Registry), networking configuration (zefra-hub-vpc, zefra-hub-subnet), deploy pipeline (Cloud Build triggers, GitHub integration), IAM roles and service accounts, architectural patterns (stateless services, managed secrets), operational runbook (deploy steps, rollback procedures), common gotchas, cost estimate, and deep-dive links to Terraform source.

During the creation process, a stale reference was discovered in `gcp-architecture-reference.md`, which still cites `house-project-vpc` as the VPC name. Terraform confirms the actual names are `zefra-hub-vpc` and `zefra-hub-subnet`. This contradiction was noted but not resolved during the session and remains an open gap.

## Epistemic Impact

- **Spec drift discovered (unresolved):** `gcp-architecture-reference.md` references `house-project-vpc`, which contradicts Terraform source. Actual VPC names are `zefra-hub-vpc` / `zefra-hub-subnet`. This file is now known-stale and should be updated before it misleads future agents.
- **Confirmed:** Terraform is the source of truth for infrastructure naming. The new guide derives its naming directly from Terraform, establishing a precedent for future infra specs.
- **No foundational beliefs challenged.** The session was execution-oriented — the infra design was already in place; this session documented it.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `/specs/cloud_services/cloud-infrastructure-guide.md` | created | New 10-section cloud infrastructure reference spec tied to actual Terraform and GCP configuration |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/cloud_services/gcp-architecture-reference.md` | `contradicts` | References stale VPC name (house-project-vpc); actual names confirmed as zefra-hub-vpc/zefra-hub-subnet via Terraform |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix stale VPC reference in `gcp-architecture-reference.md` — replace `house-project-vpc` with `zefra-hub-vpc` / `zefra-hub-subnet` | Session insight | MEDIUM | open |
