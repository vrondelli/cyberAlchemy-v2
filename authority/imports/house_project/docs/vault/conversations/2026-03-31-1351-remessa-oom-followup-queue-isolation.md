---
tags: [infrastructure, pipeline, acquisition, architecture]
node_type: implementation-plan
is_session: true
layer: application, infrastructure
nature: procedural, technical
status: active
created: 2026-03-31
timestamp: 2026-03-31T13:51:42-03:00
expires: 2026-05-30
conversation_id: fddfdbd9-3293-4777-9870-8515d56b6bbf
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md
promoted_candidates:
  - "Rule: heavy pipelines must run on dedicated Celery queues; avoid sharing with background retries"
expected_importance: 7
importance_rationale: "This session updated the production OOM plan with the next concrete fixes after runtime evidence showed post-staging contract-memory spikes and queue contention with unrelated BulkImport retries."
---

# Remessa OOM Follow-up and Queue Isolation Plan Update

**Date:** 2026-03-31 13:51 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition #architecture

## Summary

This session focused on clarifying whether `BulkImportBatch` errors were the root cause of the upload failures and then converting that diagnosis into concrete plan updates. The investigation confirmed two concurrent issues: the upload worker was being killed by memory pressure (`SIGKILL`) and unrelated `BulkImportBatch.DoesNotExist` retries were polluting the same worker pool. The user asked where to optimize next, and the analysis identified the post-staging contract generation block as the highest remaining memory hotspot. The user then requested an update to the existing OOM fix plan, and the plan was extended with a runtime addendum and new actionable task blocks. The final output was a refinement of the implementation plan rather than code changes to runtime behavior.

### Problem Clarification: Root Cause vs. Noise

The immediate question was whether `BulkImportBatch` was the main failure. The diagnosis was that it is a real issue, but secondary for the upload crash path: the worker kill pattern tracks memory growth during remessa processing, while `BulkImportBatch` stack traces come from a different Celery pipeline running in parallel. This distinction was necessary to avoid optimizing the wrong subsystem first.

### Optimization Priority: Post-Staging Contracts

Runtime evidence showed staging reached completion and the worker died right after, shifting the optimization target to contract generation. The plan now explicitly prioritizes reducing contract-phase memory by chunked flushes, avoiding repeated full-frame scans per remessa, and adding progress/memory logs around contract creation. The intended outcome is to eliminate the post-staging peak that remains after earlier CSV/read-path fixes.

### Operational Contention: Shared Queue Routing

A second decision was to treat shared queue routing as an operational risk factor. The current `default` queue mixes heavy remessa uploads with documents-validation retries and startup background tasks, which can reduce throughput and amplify instability under pressure. The updated plan now includes dedicated queue separation and worker partitioning as first-class remediation tasks.

### Plan Update Executed

The spec file was updated with:
- a runtime addendum documenting observed behavior after initial fixes,
- an updated root-cause ranking,
- Task 5 (contract-phase memory controls),
- Task 6 (queue isolation and missing-`BulkImportBatch` retry hardening),
- addendum success criteria tied to benchmark outcomes.

## Epistemic Impact

This session did not change constitutions or premises, but it refined the practical operating model for high-volume pipelines by distinguishing memory root causes from queue-level noise. It also surfaced a likely policy candidate: heavy pipelines should be isolated by queue and worker class rather than co-located on `default`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` | modified | Added post-runtime addendum and new remediation tasks for contract-phase memory spikes and Celery queue contention (`BulkImportBatch` retry noise) |

## Connections

- `contextualizes` → `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` — this session extends the existing OOM implementation plan with runtime-driven follow-up actions.

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Task 5 contract-phase chunking/grouping/logging in `StageRemessaService` | Runtime addendum in updated OOM plan | HIGH | Open |
| Implement Task 6 queue separation and missing-`BulkImportBatch` terminal handling | Runtime addendum in updated OOM plan | HIGH | Open |
| Validate benchmark success criteria on 1.2 GB CSV after Task 5/6 execution | Updated success criteria | HIGH | Open |

## Open Questions

- Should remessa uploads be routed to a dedicated queue name (`remessa-upload`) immediately, or introduced via staged rollout with dual workers first?
