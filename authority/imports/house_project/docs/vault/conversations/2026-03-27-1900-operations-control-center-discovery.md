---
tags: [dashboard, operations, metrics, observability, aquisicao, liquidacao, documents, event-system, cache, architecture]
node_type: discovery
is_session: true
layer: architecture, application
nature: explanatory, technical, reference
status: active
created: 2026-03-27
timestamp: 2026-03-27T19:00:00-03:00
expires: 2026-05-26
conversation_id: ~
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "Today's metrics served from source tables + Redis cache busted on page open; historical from DailyOperationsSnapshot (working bet — promote once backend is built and validated)"
  - "Cross-check metrics from EventLog must be materialized into snapshot before 15-day TECH-tier TTL (candidate for event-system constitution or operations spec)"
expected_importance: 6
importance_rationale: "Produced a complete discovery document for a new operational screen, including non-trivial data serving architecture (Redis cache + DailyOperationsSnapshot) and EventLog materialization decisions that will constrain downstream implementation."
---

# Operations Control Center — Discovery Session

**Date:** 2026-03-27 19:00 (UTC-3)
**Tags:** #dashboard #operations #metrics #observability #architecture #cache #event-system

## Summary

This session designed the **Operations Control Center** — a unified read-only
dashboard for operators and fund managers to monitor fund operations at a glance.
The conversation started from the user's open-ended idea ("a screen to serve as
the control room") and progressed through full codebase context exploration,
metric definition, design decisions, and a non-trivial data architecture discussion
— producing a complete discovery document at `specs/004-operations-control-center/operations-control-center-discovery.md`.

The session had two main outputs: (1) a clear set of metric groups with justified
rationale, and (2) an architectural decision about how to serve live vs historical
data without duplicating query logic.

---

### Metric Groups

We started with 5 candidate groups. The user removed Portfolio Position (Estoque)
as unnecessary for this screen, leaving 4:

1. **Acquisition Volume** — remessas imported, parcelas processed, total BRL
   acquired, contracts. Status breakdown bar (Pendente/Aprovado/Rejeitado/Rollback)
   to make pipeline health visible at a glance.
2. **Liquidation Volume** — payment remessas, payments processed, total payment
   value, and a dedicated card for unmatched payments (`LiquidacaoManualSemParcela`)
   as an attention indicator.
3. **Document Pipeline** — batch counts, document counts, OCR completion, acceptance
   rates, CCB match rate, cross-check pass rate. Derived rates (not raw counts)
   are the primary signal — a 10/500 acceptance rate is a fire; a 490/500 is healthy.
4. **Filter Pipeline** — pass/fail/skipped counts from `RemessaFilterResult`, plus
   manual overrides (non-empty `override_justification`) as a leading indicator of
   filter misconfiguration.

Every metric was mapped to a specific model field or EventLog event type (see
Appendix A of the discovery doc). No metric was proposed without confirmed data
backing.

---

### Design Principles

- **Minimalistic** — few metrics shown well, each card must earn its place.
- **Cards + charts** — big headline numbers with small trend charts (sparklines,
  bars) for context. One chart per metric group maximum.
- **Meta Ads-style date picker** — start date + end date, always defaults to
  today. Not a preset-only picker (not Looker-style).
- **Three global filters** — fund (`cnpj_fundo`), date range, operator. All
  metrics respect all three filters simultaneously.
- **Auto-refresh** — dashboard updates in real time without manual reload.
- **Progressive disclosure** — 1 click on a metric card opens an inline detail
  table; 2 clicks (or "Go to" link) navigates to the domain screen with filters
  pre-applied via URL params. The existing domain screens already accept URL
  filter params, so this is mostly wiring.

---

### Data Architecture — The Main Decision Thread

This was the most substantive part of the session. The core tension: the dashboard
needs to feel live (auto-refreshing), support historical date ranges for charts and
comparison, and not require duplicated query logic or expensive aggregations on
every poll.

**Options considered:**

1. **Event-driven incremental snapshot updates** — Listen to EventLog insertions,
   increment snapshot counters with `F()` expressions on every relevant event.
   Rejected: complex application code, requires a handler per event type, failure
   handling is tricky, and the snapshot schema must stay in sync with event types.

2. **Daily Celery batch job** — Recompute everything once per day. Rejected: too
   infrequent for a live dashboard.

3. **Two query paths (today live, history from snapshot)** — Query source tables
   for today, snapshot for history. Rejected in first form because it implies
   duplicated query logic (two implementations of the same aggregation).

4. **Two-table approach (live + historical)** — User proposed a `DailyOperationsLive`
   table that receives real-time writes and gets consolidated into
   `DailyOperationsSnapshot` at end of day. Led to the question: who writes to the
   live table? Back to event-driven or periodic task complexity.

5. **Periodic Celery task (every 5 min) recomputes today** — Simpler than event-driven,
   reasonably fresh. Near-accepted but the user noted it still requires application
   machinery that needs managing.

**Final decision:**

- **Today** → query source tables directly on page open, cache result in Redis.
  Cache key scoped by `cnpj_fundo + date + operator_id`. Cache busted on page
  open: frontend sends `?refresh=true` on initial load, which bypasses cache read
  and triggers a fresh query. Auto-refresh polls (every 30s) serve from cache —
  no DB hit. No live table, no background job, no event wiring needed.
- **History** → read from `DailyOperationsSnapshot` — one row per fund per day,
  materialized by an end-of-day Celery task. Same output shape as the live query,
  just different data source.
- **Query logic lives once** — the query service layer is the same for both paths.
  The API routes based on date (today vs past). No duplication.

**EventLog for historical data:** Cross-check metrics (`cross_check_passed`,
`cross_check_failed`, `cross_check_overridden`) only exist in EventLog — there
are no model-level counters for them. The end-of-day snapshot job reads yesterday's
EventLog slice and materializes these counts into the snapshot alongside the
model-based counts. Once written to the snapshot, historical event-based metrics
no longer depend on EventLog retention. Critical constraint: TECH-tier EventLog
rows expire after 15 days, so the snapshot job must succeed within that window.
Job failure monitoring and alerting are required.

---

### Implementation Phases

Five phases defined in the discovery doc:

1. Backend foundation — query services, `DailyOperationsSnapshot` model, Redis
   cache, unified `GET /api/control-center/metrics/` endpoint, permissions.
2. Frontend — cards, global filters, auto-refresh.
3. Charts — time-series endpoint from snapshot, one chart per group.
4. Progressive disclosure — 1-click inline table, 2-click domain navigation.
5. Anomaly alerts — z-score on 30-day rolling window from snapshot, visual
   highlighting on cards (>2σ), no configuration needed.

---

## Epistemic Impact

- **Validates** `docs/vault/constitution/event-system-constitution.md` — the TTL
  model for TECH-tier EventLog rows was a direct constraint on the architecture.
  The decision to materialize event counts before expiry confirms the retention
  design is coherent and that consumers need to plan for it.

- **No contradictions found** with existing vault nodes.

- **Promoted candidates** (not yet formalized):
  - The Redis cache + snapshot serving strategy is a working bet — should be
    promoted to a premise once Phase 1 is built and the approach is validated
    under real load.
  - "Cross-check and other EventLog-only metrics must be materialized into
    DailyOperationsSnapshot before TECH-tier TTL" should be added as a rule in
    the event-system constitution or a new operations spec.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/004-operations-control-center/operations-control-center-discovery.md` | created | Full discovery document for the Operations Control Center — context, 4 metric groups with rationale, design decisions (progressive disclosure, data architecture), implementation phases, and data source appendix |

---

## Connections

- `contextualizes` → `docs/vault/constitution/event-system-constitution.md` — architecture decisions are directly shaped by the TTL retention model
- `derives-from` → `docs/vault/agent-navigation.md` — session follows the spec-writing route (objective 3)

---

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Define exact schema for `DailyOperationsSnapshot` (columns, partitioning) | HIGH | Open — blocks Phase 1 |
| Specify end-of-day Celery snapshot task — trigger time, retry policy, idempotency | HIGH | Open — must resolve before Phase 1 implementation |
| Decide Redis cache key structure (per fund? per metric group? per user?) | HIGH | Open — partially defined (cnpj_fundo + date + operator_id), needs finalization |
| Define unified metrics endpoint contract (request params, response shape) | MEDIUM | Open — needed to align frontend Phase 2 with backend Phase 1 |
| Specify z-score anomaly alert thresholds and 30-day window validation | MEDIUM | Deferred to Phase 5 |
| Clarify what "operator" filter maps to in the data model (user FK?) | MEDIUM | Open — filter was agreed on but underlying field not specified |
| Audit existing domain screens for URL param filter support (2-click navigation) | LOW | Open — assumption is they support it, needs confirmation |
| Confirm Portfolio Position (Estoque) is out of scope with stakeholders | LOW | Open — removed in this session, should be validated before Phase 1 starts |

## Open Questions

- Should `DailyOperationsSnapshot` be a wide table (one row per fund per day, many columns) or narrow (one row per fund per day per metric)? Wide is simpler to query; narrow is easier to extend.
- Is polling (every 30s) the right auto-refresh mechanism, or WebSocket for true real-time? Polling is sufficient for v1.
