# TASK TDE-EPOCH-008 — Lean/EVF theorem handoff

## Outcome

Implement only the exact TDE-to-EVF handle/residue boundary for @3 Lean/DTT claims, with theorem execution excluded.

## Preconditions and dependencies

Passing TDE-EPOCH-002 receipt plus separately admitted EVF and Lean provider interface contracts.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/evf/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/evf/**

Any EVF-owned product changes require a separate owner Task Session and are not implicit in this task.

## Forbidden

No Lean parsing, elaboration, build, theorem execution, proof evaluation, provider registration, or runtime-conformance claim.

## Steps

Carry exact FormalClaim/Lean binding/request handles; preserve proof-provider-required residue; reject Lean renderer registration; verify EVF port identity/currentness/ceiling contract; keep theorem and runtime evidence distinct.

## Acceptance and planned validation

The exact handle transports without semantic rewriting. Lean cannot resolve as a code renderer. Missing/stale/malformed theorem handles block. No proof outcome is produced.

## Closeout

Return the boundary receipt and separately owned EVF/provider next route. Next local route: TDE-EPOCH-010 after other prerequisites.
