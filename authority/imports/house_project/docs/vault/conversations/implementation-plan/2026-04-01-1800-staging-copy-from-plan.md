---
tags: [remessa, staging, postgres, copy-from, polars, bulk-insert, pipeline, performance]
node_type: implementation-plan
is_session: true
layer: application, domain
nature: procedural, technical
status: active
created: 2026-04-01
timestamp: 2026-04-01T18:00:00-03:00
expires: 2026-05-31
conversation_id: staging-copy-from-plan
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [feedback_no_map_elements → formal premise P-POLARS-1]
expected_importance: 8
importance_rationale: "Validated discovery and produced a 7-step implementation plan to replace the 45-minute ORM bottleneck in the 3.3M-row remessa staging pipeline with PostgreSQL COPY FROM, respecting Repository Isolation."
---

# Staging COPY FROM Implementation Plan

**Date:** 2026-04-01 18:00 (UTC-3)
**Tags:** #remessa #staging #postgres #copy-from #polars #bulk-insert #pipeline #performance

## Summary

This session reviewed and validated the discovery document `2026-04-01-staging-copy-from-discovery.md`, which analyzes replacing Django ORM `bulk_create` with PostgreSQL `COPY FROM STDIN` for staging installment inserts in the remessa upload pipeline. The current implementation takes ~45 minutes for 3.3M rows due to three materializations through Python: Polars rows → Python dicts → ORM objects → SQL strings. The proposed COPY path eliminates all Python iteration by having Polars write CSV in Rust and PostgreSQL ingest it in C.

### Discovery Validation

Every claim in the discovery was verified against the actual source code. The chunk loop at `stage_remessa_service.py:170-188` matches the documented architecture. The SHA-256 hash algorithm in `entity_identity.py:29-32` — including its `_normalize` function handling None, datetime, date, Decimal, and string values — was confirmed byte-for-byte. Both domain builder functions (`_build_aquisicao_staging_installment` and `_build_liquidacao_staging_installment`) match the column mapping tables field-by-field, including FK `db_column` names (`upload_file_id`, `remessa_id`, `tipo_instrumento_id`). The staging models' actual field definitions (28 fields for Aquisicao, 21 for Liquidacao) were verified against the discovery's mapping tables. No discrepancies were found.

### Architectural Decision: Repository Isolation

The central architectural question was where the `COPY FROM STDIN` call should live. The Development Practices Constitution mandates that "all persistence must occur exclusively via repositories", and the Folder Structure Constitution reinforces that `/repositories` is the sole persistence boundary. The decision: each domain gets a `bulk_copy_staging()` method in its `repositories/repositories.py`, and `StageRemessaService` orchestrates (prepares the DataFrame, opens the cursor) but delegates the write. This preserves testability (repository can be mocked independently) and layer purity.

### Implementation Plan

A 7-step plan was written at `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md`:

1. **Feature flag** (`USE_COPY_STAGING` env var) — instant rollback without code revert
2. **Vectorized hash helper** (`vectorized_entity_hash` in `entity_identity.py`) — uses `map_batches` to process entire Series in one Python call, reproducing identical SHA-256 output
3. **Per-domain DataFrame builders** — remessa FK via Polars join, hash via vectorized expression, `complementary_data` via `map_batches` on struct, constants via `pl.lit()`
4. **Repository COPY methods** — `bulk_copy_staging(df, cursor)` in each domain's `repositories.py`
5. **Service update** — conditional path in `stage()` between COPY and ORM fallback
6. **Stager wiring** — new `__init__` parameters on `StageRemessaService`
7. **Layered tests** — unit (hash compatibility), builder (DataFrame correctness), integration (end-to-end COPY)

The ContratoCCB loop was explicitly kept as ORM `bulk_create` since its cardinality is low (hundreds, not millions).

### map_batches vs map_elements

The plan uses `map_batches` (not `map_elements`) for the vectorized hash and JSON construction. `map_batches` passes the entire Series to a single Python call, processing the batch at once. This is acceptable per project guidelines — only `map_elements` with per-row Python callables is prohibited in hot paths.

## Epistemic Impact

- **Confirmed:** Development Practices Constitution's Repository Isolation principle directly constrained the plan's architecture. The principle was stress-tested (COPY FROM is raw SQL that could tempt placement in the service) and held.
- **No drift found:** Discovery document matched production code exactly — zero discrepancies in code references, field counts, or hash algorithms.
- **Promotion candidate:** The `map_elements` prohibition currently lives only as informal agent memory (`feedback_no_map_elements.md`). It should be promoted to a formal premise so it's discoverable via GitNexus queries on Polars-related work.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md` | created | 7-step implementation plan converting the validated COPY FROM discovery into an actionable execution sequence |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[2026-04-01-staging-copy-from-discovery]] | `derives-from` | Discovery that this plan was built upon and validated |
| [[2026-04-01-staging-bulk-insert-optimization]] | `contextualizes` | Original spec with option analysis (A/B/C) — this plan implements Option A |
| [[development-practices-constitution]] | `validates` | Repository Isolation principle confirmed as binding constraint for COPY placement |
| [[folder-structure-constitution]] | `validates` | Layer purity rule confirmed — persistence via repositories only |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Promote `map_elements` prohibition to formal premise (P-POLARS-1) | Session observation | MEDIUM | Open |
| Performance baseline recording | Discovery references "~45 min" but no formal benchmark artifact exists | LOW | Open |

## Open Questions

- None — the discovery was fully validated and the plan is ready for execution.
