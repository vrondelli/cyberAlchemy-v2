# TASK-TDE-EPOCH-006 — TDE-EPOCH-006

## One owned outcome

Implement the independent Rust renderer and runtime lane against the frozen neutral and shared contracts.

## Dependencies and owner

- Dependencies: TDE-EPOCH-004
- Lifecycle owner: Task Session
- Domain owner: Rust-TDE-profile-owner
- Canonical successor: `TDE-EPOCH-007`

## Exact material writes

- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/profiles/rust/profile.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/renderers/rust/renderer.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/renderers/rust/renderer.test.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/rust/cases.json`

## Exact execution outputs

- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/evidence/tde-multiformalism-profile-epoch/TDE-EPOCH-006/RECEIPT.json`

The disjoint union of those two lists is the complete allowed-write set. All other paths are immutable for this unit. Existing unrelated and pre-existing dirty bytes must remain unchanged.

## Inputs and outputs

Inputs are the exact accepted @2 Plan epoch, this unit contract, dependency receipts, current source/profile/provider identities required by the behavior, and freshly captured live target baselines. Outputs are only the listed material postimages and exact terminal evidence.

## Ordered algorithm

1. Task Session verifies renewed exact @2 acceptance, dependency receipts, current unit contract digest, and present/absent live baselines.
2. Materialize only the declared TDE-EPOCH-006 behavior: Implement the independent Rust renderer and runtime lane against the frozen neutral and shared contracts.
3. Run the structured validation commands in order with the exact environment, timeout, output budget, risk, and expected-exit contract.
4. Stop at the first nonzero result; retain that result and perform only the declared failure teardown.
5. Emit the exact terminal receipt and close through Invoke Refresh to the sole canonical successor `TDE-EPOCH-007`.

## Edge cases and failure modes

Unknown, latest, duplicate, stale, malformed, missing-provider, unsupported, timeout, indeterminate, ceiling-widened, source-drifted, dependency-mismatched, or undeclared-target states block. Product or semantic choice, scope expansion, destructive or irreversible effect, secrets, external/network effect, cost/risk acceptance, authority/promotion/publication/deployment, or failed acceptance-critical validation stop before the next write or route.

## Acceptance

- all required cases preserve neutral IDs and ceilings
- native positive and exact-cause compile/runtime negatives pass
- unsupported macros/features/generated code/conditional compilation block

Validation contract: `../shared/validation-contracts/TDE-EPOCH-006-VALIDATION.json`. Its richer environment/risk/expected-exit form and the lossless WPRA projection must both remain current.

## Claim ceiling

This unit may prove only its bounded repository-local fixture and contract result. It does not admit a profile/provider globally, discharge a FormalClaim, prove a Lean theorem, establish production conformance, promote ontology, publish, release, deploy, merge, or create production effect.
