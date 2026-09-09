---
tags: [infrastructure, frontend, pipeline]
node_type: discovery
is_session: true
layer: architecture
nature: explanatory, technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T17:00:00-03:00
expires: 2026-05-26
conversation_id: signed-url-upload-discovery
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Identified a hard Cloud Run 32MB request limit blocking both large-file upload paths (CSV up to 500MB, ZIP >1GB), confirmed neither uses signed URLs, and produced a scoped discovery document mapping the full migration to direct GCS uploads."
---

# Signed URL Upload Discovery

**Date:** 2026-03-27 17:00 (UTC-3)
**Tags:** #infrastructure #frontend #pipeline

## Summary

This session reviewed the GCP Terraform configuration for the project and assessed its adequacy against two concrete processing requirements: CSV files up to 500MB and ZIP files larger than 1GB (to be processed within one hour). The infrastructure review uncovered a hard architectural blocker: Cloud Run enforces a 32MB HTTP request body limit, which means both upload entry points — CSV remessa and document ZIP — will fail with HTTP 413 before reaching any application code.

The session then traced both upload paths through the actual codebase to confirm the problem. Both use direct `multipart/form-data` uploads routed through Django with no signed URL bypass in place. The ZIP upload additionally loads the entire file into memory via `uploaded_file.read()`, which would cause an immediate OOM inside a container limited to 1Gi RAM even if the request size limit did not apply.

The solution space was mapped: the frontend should request a short-lived signed URL from Django, upload the binary directly to GCS, and notify the backend on completion. Django never handles the binary. The Celery processing pipeline requires no changes — it already consumes storage paths.

A discovery document was authored capturing context, both broken code paths, the proposed flow, component-by-component change scope, and an implementation order. The document was written first in Portuguese and then translated to English per user instruction.

Separately, the question of implementation order was discussed: code changes should be made and validated locally first, using MinIO's presigned URL support, before provisioning cloud infrastructure. Local development remains fully functional with a CORS adjustment on MinIO.

### Cloud Run 32MB Request Limit

- **Problem:** Both upload endpoints send the file binary through Django. Cloud Run rejects bodies over 32MB with HTTP 413.
- **Decision:** Migrate both upload paths to signed URLs (GCS direct upload).
- **Changes:** No code changed yet. Discovery document created at `refactors/infrastructure/signed-url-upload-discovery.md`.

### ZIP Upload Memory Problem

- **Problem:** `BulkImportUploadView` calls `uploaded_file.read()` on the full ZIP, loading it entirely into memory. A 1GB+ file in a 1Gi container causes OOM regardless of the request size limit.
- **Decision:** The confirmation endpoint will receive only the `object_key` after the file is already in GCS, eliminating the in-memory read.
- **Changes:** None yet — captured in discovery document.

### Infrastructure Review Findings

- **Problem:** Assess whether the Terraform file is appropriately sized for the project's requirements.
- **Decision:** The overall infrastructure is well-designed. Three items flagged: (1) the upload blocker above, (2) worker disk of 50GB may be tight with 8 concurrent workers each extracting 1GB+ ZIPs, (3) `db-g1-small` may bottleneck under heavy bulk imports.
- **Changes:** None — informational findings documented in conversation.

### Implementation Order Decision

- **Problem:** Whether to provision cloud infrastructure first or implement signed URL changes first.
- **Decision:** Code first, cloud second. MinIO supports presigned URLs locally; the flow can be validated end-to-end before any GCP provisioning.
- **Changes:** None — guidance captured in discovery document.

Key outputs:
- `refactors/infrastructure/signed-url-upload-discovery.md` — discovery document mapping the signed URL migration

## Key Decisions

- **Upload migration required before deploy:** Both CSV and ZIP upload endpoints must be migrated to signed URLs before the application is deployed to Cloud Run. Direct multipart upload is a hard blocker.
- **Code before cloud:** Implement and test locally using MinIO presigned URLs. Only then provision GCP infrastructure.
- **Celery tasks unchanged:** The processing pipeline already consumes storage paths and requires no modifications.
- **MinIO CORS needed for local dev:** The browser PUT to MinIO requires explicit CORS configuration on `localhost:9000`.

## Files Changed

### Code

None — this session was discovery only.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/signed-url-upload-discovery.md` | `created` | Discovery document mapping the Cloud Run upload blocker, both affected code paths, the signed URL solution, change scope, and implementation order |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Migrate CSV upload to signed URL | This session | ⚠️ HIGH | Open |
| Migrate ZIP upload to signed URL | This session | ⚠️ HIGH | Open |
| Add `cors` block to GCS buckets in Terraform | This session | ⚠️ HIGH | Open |
| Configure MinIO CORS for local dev | This session | MEDIUM | Open |
| Review worker disk size (50GB) for concurrent ZIP jobs | This session | MEDIUM | Open |
| Monitor `db-g1-small` under bulk import load | This session | LOW | Open |

## Connections

- `refactors/infrastructure/gcp-infrastructure-migration.tf` — source of the infrastructure review that surfaced the upload blocker
