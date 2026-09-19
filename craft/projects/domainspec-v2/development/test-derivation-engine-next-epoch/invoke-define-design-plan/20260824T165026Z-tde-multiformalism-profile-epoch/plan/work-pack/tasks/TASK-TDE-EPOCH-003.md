# TASK TDE-EPOCH-003 — Neutral obligation/case IR

## Outcome

Implement deterministic neutral obligation/case projection for admitted TDE inputs while preserving the current evaluator and honesty guard.

## Preconditions and dependencies

Passing TDE-EPOCH-002 receipt.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/neutral/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/neutral/**

Current formal evaluator, rule classifier, obligation keys, and emitter honesty tests are read-only predecessor evidence unless a refreshed task explicitly admits a regression-only modification.

## Forbidden

No language syntax, provider call, theorem/solver execution, expected-value invention, or widened projection.

## Steps

Define IR schema; map admitted bounded cases; retain exact source/projection provenance and ceilings; emit typed oracle-required residue; prove stable IDs/order/bytes; run predecessor closed-form/fold and honesty regressions.

## Acceptance and planned validation

Identical inputs yield identical IR. Every source case is accounted. Non-derivable values remain residue. Existing exact-rational/fold and co-emitted-gap behavior remains intact.

## Closeout

Freeze the neutral contract digest and corpus receipt. Next route: TDE-EPOCH-004.
