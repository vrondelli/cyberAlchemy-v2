---
tags: [frontend, merge, branch-management, presigned-url, current-phase]
node_type: implementation-plan
is_session: true
layer: application
nature: procedural
status: active
created: 2026-04-06
timestamp: 2026-04-06T15:30:00-03:00
expires: 2026-06-05
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Routine merge coordination with a discovery error caught; no architectural decisions, but Dockerfile gap prevents a latent build failure."
---

# Frontend Merge Discovery Review

**Date:** 2026-04-06 15:30 (UTC-3)
**Tags:** #frontend #merge #branch-management #presigned-url #current-phase

## Summary

This session reviewed a discovery document for merging the `minor-fixes-fe` branch into `main`. The key finding was that the discovery was largely accurate — all 11 files needing `current_phase` revert were correctly identified, and the signed URL semantic conflict between FormData upload (minor-fixes-fe) and 3-step presigned URL (main) was real.

A blocker was found: the Dockerfile on the branch referenced `entrypoint.sh` and `gunicorn.conf.py` but neither file existed, meaning Docker build would fail. The discovery incorrectly claimed these were "new files on minor-fixes-fe." This was deprioritized since prod uses Terraform, not Docker directly.

The decision was that backend baseline is main, only additive changes accepted. All backend modifications reviewed — auth hardening (additive), BulkImportListView computed fields (additive, query-time only), ChecklistView current_version_id (additive) — were approved as having no business logic changes. BulkImportBatch computed fields (duplicates, pct_found, not_identified, processing_complete) are query-time annotations only, no new model fields.

An implementation plan was written at `specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md`. Backlog lote performance fixes were kept separate from the merge.

## Epistemic Impact

One spec drift from reality confirmed: the discovery document incorrectly claimed `entrypoint.sh` and `gunicorn.conf.py` were new files on `minor-fixes-fe` — neither exists. Claims about file existence must be verified, not inferred.

The decision to treat `main` as backend baseline and accept only additive changes reaffirms the existing directional merge principle.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/refactor/docs/frontend/merge-minor-fixes-fe-implementation-plan.md` | Created | Actionable merge plan with approved additive backend changes, signed-URL conflict resolution, Dockerfile issue documented and deprioritized |

## Connections

- contextualizes: `specs/refactor/docs/frontend/merge-minor-fixes-fe-discovery.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Dockerfile references non-existent entrypoint.sh and gunicorn.conf.py | Session finding | Low | Deprioritized (prod uses Terraform) |
| Lote performance fixes | Session scoping | Medium | Kept separate from merge |
