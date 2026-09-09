---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: reference
status: active
created: 2026-03-19
timestamp: 2026-03-19T19:40:35-03:00
expires: 2026-05-18
conversation_id: 8bb9d6ac-f928-4047-b43e-32afff3add41
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Gap analysis and execution guide for GCP migration — corrected Phase 4 coverage from 2 to 6 files, added missing MinIO data migration procedure, and created the pre-flight checklist and phase verification guide that will drive all subsequent migration work."
user_satisfaction:
  score: 8
  min: 7
  max: 9
  std: 0.5
---

# GCP Infrastructure Migration Gap Analysis & Execution Docs

**Date:** 2026-03-19 19:40 (UTC-3)
**Tags:** #infrastructure

## Summary

This session audited the `refactors/infrastructure/` directory — cross-referencing all 5 existing migration documents against the actual codebase to identify missing pieces for a smooth GCP migration. The audit found that while the documentation is thorough and well-structured, zero code changes had been implemented, 4 critical decisions remain unresolved, and the plan had blind spots (undocumented download files, missing MinIO migration procedure, incorrect dependency notes). The session produced corrections to the main plan and two new companion documents.

### Gap Analysis

- **Problem/Goal:** Determine what's missing so the GCP migration can occur without surprises.
- **Decision:** No architectural decisions — this was an assessment, not a design session.
- **Changes:** Cross-referenced all migration docs against actual codebase. Found: `shared_services/gcs.py` still only exports 4 of 7 functions, all 4 leaky `minio_client` imports remain, all `default_storage.path()` calls present, no `/health/` endpoint exists, CORS hardcoded, logging FileHandler present, no security headers. Most critically: `BASE_DIR/downloads` pattern used in 6 production files across 3 domains — the plan only documented 2.

### Migration Plan Corrections

- **Problem/Goal:** The main migration plan had inaccurate or incomplete information.
- **Changes:**
  - Corrected Missing Dependencies section — `django-storages` was already installed (needs `[google]` extra), added `google-cloud-vision`
  - Expanded Section 3 and Phase 4 from 2 download files to the actual 6 across aquisição, liquidação, and estoque domains
  - Added complete MinIO → GCS data migration procedure in Phase 6 (was entirely absent)
  - Added 2 companion file references

### Pre-Flight Checklist Creation

- **Problem/Goal:** No single document tracked all decisions, code changes, and infrastructure steps in execution order.
- **Changes:** Created `migration-preflight-checklist.md` with 8 ordered groups (decisions → pre-migration code → dependencies → infra provisioning → storage migration → downloads → Cloud Run packaging → cutover).

### Phase Execution Guide Creation

- **Problem/Goal:** The main plan describes what to do but lacks concrete success criteria and verification commands.
- **Changes:** Created `migration-phase-guide.md` with decision templates (blank fields to record answers), exact bash verification commands for each phase's Done Gate, a 19-item validation table for Phase 6, and rollback triggers.

Key outputs:
- `refactors/infrastructure/gcp-infrastructure-migration.md` — corrected and expanded
- `refactors/infrastructure/migration-preflight-checklist.md` — ordered execution checklist
- `refactors/infrastructure/migration-phase-guide.md` — phase guide with success criteria

## Key Decisions

- **No architectural decisions made** — this was purely an audit/assessment session. The 3 open decisions (region, large file uploads, backend-ts routing) were identified but intentionally left for the team to resolve.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Corrected missing deps, expanded Phase 4 to 6 files, added MinIO data migration procedure, added companion file references |
| `refactors/infrastructure/migration-preflight-checklist.md` | `created` | Ordered checklist with 8 groups covering all decisions, code, and infra items |
| `refactors/infrastructure/migration-phase-guide.md` | `created` | Phase execution guide with success criteria and verification commands |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Region decision (us-central1 vs southamerica-east1) | Gap analysis | ⚠️ HIGH | Open — blocks Phase 1 |
| `backend-ts` routing decision | Gap analysis | ⚠️ HIGH | Open — blocks Phase 4.5/5 |
| Large file upload strategy | Gap analysis | MEDIUM | Open — blocks Phase 5 |
| MinIO data inventory (size, object count) | Gap analysis | MEDIUM | Open — needed before Phase 6 |
| 6 pre-migration code components | Pre-migration plan | ⚠️ HIGH | Not started |

## Open Questions

- Does the frontend actively use `/v2/` routes served by `backend-ts`?
- Does `backend-ts` have its own auth mechanism or delegate to Django?
- What is the total size of MinIO data (remessas + documents buckets)?
- Do any current production uploads exceed 32MB?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Corrected Phase 4 coverage, added MinIO migration procedure, fixed dependency notes |
| [[infrastructure/pre-migration-code-changes.md]] | `validates` | Verified all 6 components are still pending — codebase matches the plan's assumptions |
| [[infrastructure/terraform-decisions.md]] | `validates` | Confirmed Terraform decisions are sound and internally consistent |
