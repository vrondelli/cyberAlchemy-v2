# TASK TDE-EPOCH-009 — Semantic parity

## Outcome

Compare all required TypeScript, Python, and Rust lane receipts for semantic obligation/case/evidence parity under exact ceilings.

## Preconditions and dependencies

Passing immutable TDE-EPOCH-004, 005, and 006 receipts against the same frozen neutral IR.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/parity/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/parity/**

## Forbidden

No renderer/provider mutation, majority vote, syntax comparison as semantics, or ceiling widening.

## Steps

Join exact identities; compare obligation IDs, case IDs, normalized outcome/evidence classes, and ceilings; preserve native raw refs; add missing-lane, case-loss, outcome mismatch, stale, and two-of-three negatives.

## Acceptance and planned validation

All required lanes match semantically under the exact profile ceilings. Native sources may differ. Any required-lane absence or mismatch blocks.

## Closeout

Return parity receipt with total accounting and no admission effect. Next route: TDE-EPOCH-010.
