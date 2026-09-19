# TASK TDE-EPOCH-005 — Independent Python lane

## Outcome

Implement the Python TDE profile, renderer, native runtime binding, and normalization against the frozen neutral/shared contract.

## Preconditions and dependencies

Passing TDE-EPOCH-004 trust receipt and exact Python-specific profile/provider admission/currentness.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/profiles/python/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/renderers/python/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/python/**

## Forbidden

No TypeScript/Rust/Lean mutation, inherited admission, or shared-contract repair inside this SWU.

## Steps

Render neutral cases to native Python; bind exact interpreter/test runner/provider; preserve fixture semantics; normalize raw output; test dynamic/import ambiguity, syntax/type/runtime failure, timeout, malformed receipt, and provider absence.

## Acceptance and planned validation

All required cases and ceilings match neutral IR; native positive and exact-cause negative fixtures pass; raw and normalized evidence join; unresolved dynamic behavior blocks.

## Closeout

Return an independent Python lane receipt. A shared-contract defect blocks and routes back to Refresh/003-004; otherwise next route is 009.
