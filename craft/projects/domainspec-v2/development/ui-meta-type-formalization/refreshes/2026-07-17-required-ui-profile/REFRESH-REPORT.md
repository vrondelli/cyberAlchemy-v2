---
mode: refresh
phase_status: pass
mutation_mode: apply-approved
evidence_date: 2026-07-17
target: DomainSpec v2 UI design and plan
---

# Invoke Refresh Report — Required UI Profile

## Source Signals

| Signal | Type | Claim | Confidence |
| --- | --- | --- | --- |
| SIG-UIP-001 | route_changed | Operator approved UI concepts as required-by-design; evidence validates placement and implementation rather than concept existence. | high |
| SIG-UIP-002 | evidence_added | UI repair machinery and integrated audit are complete; mechanical repair is no longer pending. | high |
| SIG-UIP-003 | blocker_reclassified | Missing corpus B/reviewers blocks empirical `distinct-supported`, not UI implementation. | high |
| SIG-UIP-004 | artifact_drift | Historical UIF and UCFE work-packs still described real-corpus evidence as the active implementation gate. | high |
| SIG-UIP-005 | route_changed | FPR-02 UI admission remains a separate first-release profile choice. | high |

## Applied Deltas

1. Created `development/ui-profile-implementation/` as the active successor
   design/plan package.
2. Separated concept availability, graph representation, empirical confidence,
   and authority status in human and machine design views.
3. Added a seven-SWU sequential work-pack using the existing DomainSpec compiler,
   minter, graph, and view contracts.
4. Made synthetic Create Player calibration the mechanical validation surface.
5. Routed real corpora to a non-blocking append-only confidence lane.
6. Preserved Adapter as required vocabulary proposed as a Mapping alias and
   State Indicator as a required split concept.
7. Marked the former UIF plan historical/superseded and the Form pilot as a
   deferred confidence lane.
8. Updated the active FPR-02 decision evidence/options without selecting an
   admission option.

## Preserved Boundaries

- No DS-D1, DS-D8, supported-profile, or release authority was changed.
- No old UIF result, receipt, candidate schema, or repair generation was
  rewritten.
- FPR-02 remains `BLOCK` until its owner resolves the pending release-profile
  choices.
- Real evidence may challenge or refine the development profile but cannot
  mutate it automatically.

## Validation

- JSON parse for machine design, refresh report, and dispatch: PASS.
- Dispatch Spec deterministic validator: PASS.
- Plan navigation and task/SWU census checks: PASS, 7/7 SWUs.
- `git diff --check` over refreshed UI planning paths: PASS.

## Next Route

Task Session: `SWU-UIP-001`, then continue sequentially through
`SWU-UIP-007` until a real stop condition.
