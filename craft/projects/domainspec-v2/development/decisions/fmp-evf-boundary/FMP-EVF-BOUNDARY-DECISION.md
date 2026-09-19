# FMP-EVF Boundary Decision Record

- Decision set: `DEC-DSV2-FMP-EVF-BOUNDARY-001`
- Related decision: `DEC-DSV2-FMP-PLAN-SUPERSESSION-001`
- Status: `PASS`
- Opened: `2026-08-24`
- Completed: `2026-08-24T02:52:59Z`
- Source: two direct user responses `A`, one per blocker
- Source evidence root: `projects/domainspec-v2/development/refinement-runs/20260824T020140Z-fmp-evf-overlap-audit/`
- Authority effect: records owner direction only; no SWU selection, execution, promotion, or release

## Decision 1 — Architecture boundary

Question: Which FMP-EVF topology should become the target architecture?

Selected: `FMP-EVF-B` — factory below EVF plus a thin, versioned adapter.

Meaning:

- EVF owns obligation meaning and its consumer-facing evidence handle.
- The architecture-conformance factory owns the generic evidence lifecycle.
- FMP remains a thin TLA/TLC provider with solver-specific semantics and corpora.
- A separately owned adapter binds the EVF obligation to verified factory evidence.

Rationale: this retains the unique TLA/TLC capability, reuses the implemented
factory lifecycle, preserves replay integrity and claim ceilings, and avoids
collapsing owners.

Rejected before presentation:

- `FMP-EVF-A`: duplicates/bypasses the factory lifecycle and collapses EVF with TLC semantics.
- `FMP-EVF-C`: independent receipts lack an evidenced currentness/join contract.

Admissibility receipt: `OPTION-ADMISSIBILITY-RECEIPT.json`.

## Decision 2 — Plan supersession route

Question: Should the reduced six-unit proposal be routed as a fresh candidate
that may supersede `WP-FMP-001` after its own validation and acceptance?

Selected: `FMP-PLAN-6` — route a fresh six-unit superseding Plan candidate.

Meaning:

- author a fresh Invoke Plan candidate from `R-FMP-001` through `R-FMP-006`;
- preserve `WP-FMP-001` unchanged and operative until the new exact candidate is
  validated and accepted;
- route the EVF-to-factory adapter through a separate Invoke Design owner track;
- require fresh Implementation Readiness and an explicit SWU selection before
  any mutation.

Rationale: the six-unit frontier preserves every TLA/TLC-specific capability and
both corpora while removing duplicate lifecycle ownership.

Admissibility receipt: `PLAN-OPTION-ADMISSIBILITY-RECEIPT.json`.

## Downstream owner gates

- exact generic JAR/material-lock representation, owned by the factory route;
- exact EVF-to-factory adapter schema and negative fixtures, owned by the EVF route;
- fresh Implementation Readiness and SWU selection after any accepted Plan.

## Gate result

- Decisions resolved: `2`.
- Blockers remaining in this decision scope: `0`.
- Result: `PASS`.
- Next routes: fresh `invoke:plan` for the six-unit provider candidate and a
  separate `invoke:design` for the EVF-to-factory adapter.
- Execution remains unauthorized.
