---
tags: [architecture, infrastructure, pipeline]
node_type: implementation-plan
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T22:00:00-03:00
expires: 2026-06-02
conversation_id: k7m2p
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Corrected a false assumption (throttling flags already exist) that would have made Phase 0 seem optional, and validated the connection budget math justifying the entire phased rollout."
---

# DB Exhaustion Plan Review — Phase Ordering & Connection Budget

**Date:** 2026-04-03 22:00 (UTC-3)
**Tags:** #architecture #infrastructure #pipeline

## Summary

Second review session for the DB connection exhaustion implementation plan. The user confirmed the maximum batch size is 3,000 folders. A critical discovery was made: no `--parallelism` or `--tasks` flags exist in the current deploy workflow, meaning all Cloud Run tasks in an execution run concurrently with no throttling. This makes Phase 0 (adding parallelism constraints) not just an improvement but a hard prerequisite for safety — without it, a 3k-folder batch would open 3,000 simultaneous database connections. The `CONN_MAX_AGE=600` setting was confirmed in Django settings, closing discovery open question #4 — each task holds one connection for up to 10 minutes, confirming the 1-connection-per-task model. Phase 0 was updated with a new "drain active executions" step that must run before the DB upgrade to avoid killing in-flight tasks. The rollout order was reversed: Phase 3 (eliminate `count_folders()` thundering herd) must now run before Phase 4 (multi-execution dispatch), because enabling multi-execution dispatch while the thundering herd still exists would amplify the problem. Connection budget math was validated and added to the plan: 3k batch → 3 executions × parallelism 20 = 60 concurrent tasks, fitting within the estimated 70-80 available connections post-upgrade — tight but acceptable with Phase 3 deployed first. Cost figures were reconciled (total vs delta inconsistencies corrected).

## Epistemic Impact

- **False premise corrected:** Prior plan reasoning assumed throttling was already in place via `--parallelism`/`--tasks` flags. The discovery that these flags don't exist means Phase 0 is a safety prerequisite, not an optimization.
- **Open question closed:** `CONN_MAX_AGE=600` confirmed, closing discovery open question #4 — the discovery document is now up to date on connection lifecycle.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| Implementation plan (DB exhaustion) | modified | Phase ordering reversed (3→4), drain step added to Phase 0, connection budget math, max batch 3k confirmed |
| Discovery document (bulk import bottleneck) | modified | Open question #4 closed with CONN_MAX_AGE=600 |

## Connections

- derives-from: bulk import DB connection exhaustion discovery
- validates: connection budget formula (60 concurrent ≤ 70-80 available)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Phase 0 drain step is a hard prerequisite before DB upgrade | Correction | HIGH | Open |
| Connection budget formula should be promoted to premise once production-validated | Session insight | LOW | Open |
