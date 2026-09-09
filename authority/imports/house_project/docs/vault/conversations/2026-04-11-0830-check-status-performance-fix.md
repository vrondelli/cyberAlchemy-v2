---
tags: [acquisition, application, infrastructure]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-11
timestamp: 2026-04-11T08:30:00-03:00
expires: 2026-06-10
conversation_id: check-status-perf-fix
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed a performance bottleneck (275s→3s) that made the Check Status page completely unusable, but the fix is localized to one query and one compose config."
---

# Check Status Page — Performance Fix (Gunicorn + Query Optimization)

**Date:** 2026-04-11 08:30 (UTC-3)
**Tags:** #acquisition #application #infrastructure

## Summary

### Problem

The Check Status page (`/lastros/check-status`) displayed "Erro ao carregar contratos" and was completely non-functional. The previous session (kx9p2) had diagnosed this as a token/CORS issue, but that diagnosis was incorrect — the token was valid and CORS headers were present.

### Investigation

Curl testing confirmed the backend returned 200 with the stored token and CORS headers were correctly applied. The breakthrough came from the network tab screenshots: `pending-overview/?page=1` requests showed `(canceled)` status after exactly 29.92 seconds — the client-side 30s timeout in `remessaApiClient`. The backend logs confirmed: OPTIONS preflight at 08:25:42, but the actual GET didn't complete until 08:27:22 — 100 seconds later.

### Root Causes

Three compounding factors were identified:

1. **Single gunicorn worker** — `docker-compose.dev.yml` started gunicorn without `--workers`, defaulting to 1 sync worker. All concurrent requests (bulk-import polling every 15s, me/, pending-overview) serialized behind each other.

2. **`get_global_summary_counts()` materialized all data into Python** — the function loaded all 422,914 contracts and 2,114,570 checklist items, then ran `batch_compute_completions` on all of them. The code comment said "for current scale (~hundreds of contracts) this is acceptable" but the DB had grown 1000x beyond that assumption. This ran on every request, including the "fast path" with no status filter.

3. **Missing `ChevronRight` import** — `PendingDocuments.jsx` used `ChevronRight` from lucide-react but only imported `ChevronDown`, which would crash the component on render even if data loaded.

### Solution

- Rewrote `get_global_summary_counts()` to work backwards: count total via DB (fast), then only classify the ~251 contracts that actually have document versions. Contracts without versions are `pending` by definition. Time: 275s → 3.1s.
- Added `--workers 4` to gunicorn in `docker-compose.dev.yml` to prevent request serialization.
- Added missing `ChevronRight` import.
- Bumped client timeout for this specific fetch to 120s as a safety net.
- Full endpoint response: 41s+ (timeout) → ~7s.

## Epistemic Impact

No vault documents were created or modified. The previous session's diagnosis (kx9p2) of token/CORS as root cause was proven incorrect — the actual root cause was a performance bottleneck. The kx9p2 scratchpad should be considered superseded by this session's findings.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/repositories/pending_overview_repo.py` | modified | Rewrote `get_global_summary_counts()` from O(N) Python materialization to targeted query over small document-versions set (275s → 3.1s) |
| `frontend/src/pages/PendingDocuments.jsx` | modified | Added missing `ChevronRight` import; bumped timeout from 30s to 120s for this endpoint |
| `docker-compose.dev.yml` | modified | Added `--workers 4` to gunicorn command to eliminate request serialization |

## Connections

- Supersedes `claude/current_conversations/2026-04-10-1830-kx9p2-check-status-cors-token-bug.md` — that session's diagnosis was incorrect

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| No test coverage for rewritten `get_global_summary_counts()` — performance regression unguarded | session observation | MEDIUM | open |
| Client timeout of 120s is a workaround — remove once query performance is confirmed stable | session observation | LOW | open |
| DB indexes on query path not verified — confirm indexes on `document_version` filter columns | session observation | MEDIUM | open |

## Open Questions

- Should `get_global_summary_counts()` results be cached (e.g., 5-minute TTL) to avoid recomputation on every page load?
- The `_base_contracts_qs()` count query on 422K rows with DISTINCT + JOINs still takes ~3s — is there a faster path?
