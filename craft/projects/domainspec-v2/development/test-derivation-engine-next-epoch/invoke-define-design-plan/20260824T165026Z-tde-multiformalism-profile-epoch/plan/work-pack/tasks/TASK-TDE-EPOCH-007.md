# TASK TDE-EPOCH-007 — Extensibility rejection and registration

## Outcome

Prove a future implementation profile can be added through contracts without modifying core classification/derivation logic, while unregistered profiles fail closed.

## Preconditions and dependencies

Passing TDE-EPOCH-001 and TDE-EPOCH-004 receipts.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/profiles/extension/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/extension/**

## Forbidden

No Kotlin renderer/provider implementation or admission; no ambient plugin discovery; no neutral-core modification.

## Steps

Add unregistered Kotlin negative fixture; test missing descriptor/adapter/runtime/provider/admission/currentness; add a synthetic fully bound registration fixture; assert core derivation hashes unchanged.

## Acceptance and planned validation

Unregistered Kotlin blocks. Only a fully exact synthetic fixture resolves. Unknown/latest/duplicate/stale remain non-pass. No Kotlin execution occurs.

## Closeout

Return extension contract and unchanged-core evidence. Next route: TDE-EPOCH-010 after parity and Lean boundary close.
