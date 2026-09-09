---
tags:
  - pending-overview
  - check-status
  - document-checklist
  - infinite-scroll
  - seed-data
  - frontend-pattern
  - data-integrity
  - produto-kit-config
node_type: discovery
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-10
timestamp: 2026-04-10T17:43:00-03:00
expires: 2026-06-09
conversation_id: null
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - specs/ontology/possible_constitutions/frontend-constitution.md
expected_importance: 7
importance_rationale: "Resolved a silent data-integrity failure that made Check Status appear broken, delivered infinite scroll on PendingDocuments, and codified the pattern as a constitution candidate — three concrete outputs with no spec debt added."
---

# Check Status Debug + Infinite Scroll (2026-04-10)

**Date:** 2026-04-10 17:43 (UTC-3)
**Tags:** #pending-overview #check-status #document-checklist #infinite-scroll #data-integrity #produto-kit-config

## Summary

This session had three distinct threads.

### Thread 1 — Root cause of Check Status showing zero contracts

The Check Status page (`/lastros/check-status`) displayed all zeros despite 422,914 contracts in the local DB. The investigation confirmed the frontend (`PendingDocuments.jsx`) and the backend endpoint (`GET /api/aquisicao/contratos/pending-overview/`) were both correct. The API queries `ContratoCCB` rows that have at least one non-deleted `DocumentChecklist` entry — and `DocumentChecklist` was completely empty (0 rows).

The cause was traced to `generate_checklist_for_contrato()`: it immediately raises `ValueError` if `contrato.tipo_produto` is NULL, aborting without creating any checklist rows. All 422,914 contracts had `tipo_produto = NULL` — a field added later as a Phase 1 document management column that was never backfilled for existing imported contracts. A secondary gap was also found: the existing `ProdutoKitConfig` table (which maps product type + emissor → KitType) was only populated for emissor id=1 (Metalúrgica Monte Carlo Ltda.), leaving the other 8 emissors unconfigured.

**Key reframe:** when aggregate counts return zero on this page, look at data state (`tipo_produto`, `ProdutoKitConfig` coverage, `DocumentChecklist` rows) — not rendering or API logic.

### Thread 2 — Local data remediation

A seed command (`seed_documents_pendentes`) was run and then immediately reversed at Victor's request (he wanted to patch real existing data, not add synthetic rows). The actual fix applied:

1. Raw SQL: `UPDATE contrato_ccb SET tipo_produto = CASE WHEN id % 2 = 0 THEN 'CB' ELSE 'CC' END WHERE tipo_produto IS NULL` — 422,914 rows updated
2. `ProdutoKitConfig` entries created for all 9 emissors × 2 product types (CB, CC) — 16 new rows
3. `DocumentChecklist` rows bulk-created in 5k-row chunks — 2,114,570 rows total

All changes are local-only. No migration or durable seed was produced.

### Thread 3 — Infinite scroll on PendingDocuments

Victor requested dynamic loading on Check Status instead of the existing prev/next pagination. Infinite scroll was implemented using `IntersectionObserver` on a sentinel `<div>` at the bottom of the table:

- Two loading states: `loading` (first page, replaces content area) and `loadingMore` (bottom spinner for subsequent pages)
- Filter changes reset `rows` to `[]` and `page` to `1` via a dedicated `useEffect`
- Observer fires only when `hasMore && !loadingMore && !loading` — no concurrent fetches
- Removed unused `ChevronLeft` / `ChevronRight` imports

The pattern was codified in a new draft frontend constitution at `specs/ontology/possible_constitutions/frontend-constitution.md`, covering component structure, API client conventions, dynamic loading, state ownership, UI conventions, and file layout.

## Epistemic Impact

- **Reframe:** Zero-count on pending-overview is a data-state failure, not a UI/API failure. The silent abort in `generate_checklist_for_contrato()` is the correct failure point — it's designed to raise on missing `tipo_produto`, but there is no visibility into how often this fires in production.
- **Spec drift:** `ProdutoKitConfig` coverage is not enforced anywhere. The gap (only emissor 1 covered) drifted silently and would recur in any fresh environment.
- **Promoted candidate:** `specs/ontology/possible_constitutions/frontend-constitution.md` — the infinite scroll pattern is stable and ready for ratification review.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `frontend/src/pages/PendingDocuments.jsx` | Modified | Replaced prev/next pagination with IntersectionObserver infinite scroll. Dual loading states, sentinel div, filter-reset contract. |
| `specs/ontology/possible_constitutions/frontend-constitution.md` | Created | Draft frontend constitution codifying component structure, API conventions, infinite scroll pattern, state ownership, UI conventions, file layout. |
| Local DB `contrato_ccb.tipo_produto` | Data patched | Raw SQL: 50/50 CB/CC assignment across 422,914 rows. Local only. |
| Local DB `ProdutoKitConfig` | Data patched | 16 entries created for all 9 emissors × CB + CC. Local only. |
| Local DB `DocumentChecklist` | Data patched | 2,114,570 rows bulk-created. Local only. |

## Connections

- `contextualizes` → `docs/vault/dictionary-business.md` (DocumentChecklist, KitType, ProdutoKitConfig definitions referenced throughout)
- `continues` → `claude/current_conversations/2026-04-09-1000-p3x7w-pending-overview-discovery.md` (prior session that established the feature was working on main — this session explains why it appeared empty locally)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| No durable backfill for `tipo_produto` — any fresh env reproduces the zero-count bug | Debug investigation | HIGH | Open |
| `ProdutoKitConfig` coverage not validated — no test or CI gate asserts all emissors have kit configs | Debug investigation | MEDIUM | Open |
| `seed_documents_pendentes` was run then reversed — its correctness for `tipo_produto` + multi-emissor coverage is unknown | Data remediation | LOW | Open |
| Frontend constitution not ratified — infinite scroll pattern not enforceable until promoted | Thread 3 | LOW | Pending review |

## Open Questions

- Should a migration or management command be produced to backfill `tipo_produto` from complementary table data (if available), or is manual seeding per environment acceptable?
- Is there a production monitoring gap where `generate_checklist_for_contrato()` ValueError failures are silently swallowed? If so, these contracts would appear missing from Check Status in production too.
