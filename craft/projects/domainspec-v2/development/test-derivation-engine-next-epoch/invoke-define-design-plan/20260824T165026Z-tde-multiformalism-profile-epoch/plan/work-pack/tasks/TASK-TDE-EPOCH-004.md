# TASK TDE-EPOCH-004 — TypeScript trust lane

## Outcome

Implement and independently validate the first exact TypeScript TDE profile, renderer, runtime binding, and evidence normalization lane.

## Preconditions and dependencies

Passing frozen TDE-EPOCH-003 receipt and exact TDE-specific TypeScript profile/provider admission.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/profiles/typescript/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/renderers/typescript/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/typescript/**

## Forbidden

No Python/Rust/Lean code, global architecture-profile admission, neutral-IR semantic change, or snapshot-based expected-value invention.

## Steps

Bind exact candidate substrate only where separately admitted; render every neutral case; validate native TypeScript/Vitest artifact; normalize raw receipts; test timeout/malformed/provider-error; freeze shared renderer/normalizer contracts.

## Acceptance and planned validation

All required cases render exactly once; native checks and bounded runtime fixtures pass; raw evidence remains reachable; candidate-protocol-only/provider-absent constructs block; shared contract digest freezes.

## Closeout

Return TypeScript profile, renderer, runtime, raw evidence, normalized receipt, and trust-gate digests. Next routes: 005, 006, and 007.
