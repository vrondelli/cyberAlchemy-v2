# TASK TDE-EPOCH-006 — Independent Rust lane

## Outcome

Implement the Rust TDE profile, renderer, Cargo/rustc runtime binding, and normalization against the frozen neutral/shared contract.

## Preconditions and dependencies

Passing TDE-EPOCH-004 trust receipt and exact Rust-specific profile/provider admission/currentness.

## Planned write scope

- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/profiles/rust/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/renderers/rust/**
- projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/rust/**

## Forbidden

No TypeScript/Python/Lean mutation, inherited admission, or shared-contract repair inside this SWU.

## Steps

Render neutral cases to native Rust; bind exact Cargo/rustc/test provider; normalize evidence; test compile-negative and runtime fixtures; block unresolved macros, features, generated code, or conditional compilation outside the exact profile.

## Acceptance and planned validation

All required cases and ceilings match neutral IR; native positive and exact-cause negative fixtures pass; raw evidence remains reachable; unsupported constructs block.

## Closeout

Return an independent Rust lane receipt. A shared-contract defect blocks and routes back to Refresh/003-004; otherwise next route is 009.
