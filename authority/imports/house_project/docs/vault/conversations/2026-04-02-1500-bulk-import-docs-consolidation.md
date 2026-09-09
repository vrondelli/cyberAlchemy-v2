---
tags: [architecture, infrastructure, pipeline]
node_type: spec
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T15:00:00-03:00
expires: 2026-06-01
conversation_id: k8m3t
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/cloud_services/docs/bulk-import/cloud-run-jobs.md]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Resolved documentation entropy by collapsing three overlapping bulk-import spec files into one, but introduced no architectural decisions or code changes."
---

# Bulk Import Docs Consolidation

**Date:** 2026-04-02 15:00 (UTC-3)
**Tags:** #architecture #infrastructure #pipeline

## Summary

The session consolidated three overlapping bulk-import documentation files (migration, production-architecture, cloud-run-jobs) into a single document. The team decided to keep `cloud-run-jobs.md` as the surviving file and delete the other two. The "full Cloud Run orchestrator migration" sections were removed since Celery handles `traverse_and_identify` for now — the aspirational migration path documented in those sections had not been implemented and was creating confusion about the actual system state. The tactical fix (setting `USE_CLOUD_RUN_JOBS=true` on the VM) was promoted as the current active approach rather than a full migration path. This decision reflects the pragmatic stance that documentation should describe reality, not intent, and that the Celery-based path for `traverse_and_identify` is acceptable for current throughput needs.

## Epistemic Impact

- The session confirmed that documentation across the three files had drifted toward aspirational states — describing a full Cloud Run migration that had not happened. Consolidation corrects this drift.
- No specific vault nodes were contradicted or validated. The correction is internal to the spec surface.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md` | modified | Designated as the single surviving file; consolidated content from the two deleted files; removed aspirational migration sections |
| `specs/cloud_services/docs/bulk-import/bulk-import-cloud-run-jobs-migration.md` | deleted | Merged into `cloud-run-jobs.md` to eliminate overlap |
| `specs/cloud_services/docs/bulk-import/bulk-import-production-architecture.md` | deleted | Merged into `cloud-run-jobs.md` to eliminate overlap |

## Connections

- contextualizes: `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Capture why Celery was kept for `traverse_and_identify` as a formal architectural decision | Consolidation decision | MEDIUM | Open |
