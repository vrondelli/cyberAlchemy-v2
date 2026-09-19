---
artifact_id: UIR-IMPLEMENTATION-PLAN-v0.2
status: approved-plan
complexity: high
delivery_boundary: successor evidence machinery only
---

# UI Repair Successor Implementation Plan

## Objective

Convert the resolved DEC-UIR-007 through DEC-UIR-010 policies into immutable,
typed successor evidence and recompose it into a dossier/index generation that
SWU-UIR-010 can audit.

## Approved Design References

- `SPEC.md`, `ARCHITECTURE.md`, and `EVIDENCE-CONTRACTS.md` for the original
  S1-S7 baseline.
- `refresh/2026-07-12-decision-closure/REFRESH-REPORT.md` for the approved
  successor design delta.
- `DECISION-LEDGER.md`, `GAP-LEDGER.md`, and
  `runs/SWU-UIR-010/DECISION-GATE.md` for selected policy authority.

When the original prose says an owner decision is pending, the dated refresh
report and final decision gate take precedence for successor planning. This
precedence does not mutate the original artifact or generation.

## Delivery Slices

1. **Finite absence contract:** make `observed-absent` constructible only from
   a complete bounded-search receipt.
2. **Successor producers:** append corpus, dossier-policy, and relationship
   decision generations with honest non-pass states.
3. **Successor composition:** append dossier/index v2 with predecessor handles.
4. **Integrated audit:** run the existing closure task over both generations.

## Interface Decisions

- Corpus v1 remains valid; absence support is versioned rather than added by
  reinterpretation.
- Relationship packet generation 001 remains transport-only; owner decisions
  use a separate record family.
- Dossier-policy evaluation records the selected threshold and classification,
  not new empirical evidence.
- Dossier/index v2 consumes handles and states; it never copies authority
  records or evaluates semantic identity.

## Failure Model

- Incomplete universe, stale digest, parse error, extraction error, or
  unenumerated selector cannot yield `observed-absent`.
- Below-threshold portability is a valid non-pass evaluation, not a failed run.
- Independent-positive `missing` cannot be normalized to `fail`.
- Authority digest mismatch invalidates relationship decision construction.
- Missing predecessor or producer handle blocks successor composition.
- Any in-place mutation attempt fails before publication.

## Validation And Handoff

Task-local contracts define focused tests. SWU-015 adds cross-record replay and
lineage tests. SWU-010 runs package-wide and DomainSpec-wide validation. Every
handoff targets one SWU and returns the shared result shape from
`EXECUTION-PACK.md`.

## Non-Goals

No new real-corpus collection, candidate repair, candidate promotion,
Action-source signature proposal, DS-D1/DS-D8 change, or rewrite of accepted
UIF evidence is included.
