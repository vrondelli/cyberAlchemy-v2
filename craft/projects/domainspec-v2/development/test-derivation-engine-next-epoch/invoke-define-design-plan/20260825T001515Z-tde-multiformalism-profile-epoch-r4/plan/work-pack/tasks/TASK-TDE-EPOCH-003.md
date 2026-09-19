# TASK-TDE-EPOCH-003 — TDE-EPOCH-003

## One owned outcome

Derive deterministic language-neutral obligation and case IR while preserving the predecessor evaluator and honesty guard.

## Dependencies and owner

- Dependencies: TDE-EPOCH-002
- Lifecycle owner: Task Session
- Domain owner: TDE-derivation-owner
- Canonical successor: `TDE-EPOCH-004`

## Exact material writes

- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/neutral/obligation-test-ir.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/neutral/derive-neutral-ir.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/neutral/derive-neutral-ir.test.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/neutral/cases.json`

## Exact execution outputs

- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/evidence/tde-multiformalism-profile-epoch/TDE-EPOCH-003/RECEIPT.json`

The disjoint union of those two lists is the complete allowed-write set. All other paths are immutable for this unit. Existing unrelated and pre-existing dirty bytes must remain unchanged.

## Inputs and outputs

Inputs are the exact accepted @4 Plan epoch, this unit contract, dependency receipts, current source/profile/provider identities required by the behavior, and freshly captured live target baselines. Outputs are only the listed material postimages and exact terminal evidence.

## Ordered algorithm

1. Task Session verifies renewed exact @4 acceptance, dependency receipts, current unit contract digest, and present/absent live baselines.
2. Materialize only the declared TDE-EPOCH-003 behavior: Derive deterministic language-neutral obligation and case IR while preserving the predecessor evaluator and honesty guard.
3. Run the structured validation commands in order with the exact environment, timeout, output budget, risk, and expected-exit contract.
4. Stop at the first nonzero result; retain that result and perform only the declared failure teardown.
5. Emit the exact terminal receipt and close through Invoke Refresh to the sole canonical successor `TDE-EPOCH-004`.

## Edge cases and failure modes

Unknown, latest, duplicate, stale, malformed, missing-provider, unsupported, timeout, indeterminate, ceiling-widened, source-drifted, dependency-mismatched, or undeclared-target states block. Product or semantic choice, scope expansion, destructive or irreversible effect, secrets, external/network effect, cost/risk acceptance, authority/promotion/publication/deployment, or failed acceptance-critical validation stop before the next write or route.

## Acceptance

- identical admitted inputs produce byte-stable total case accounting
- non-derivable values remain typed residue
- closed-form arithmetic, folds, and honesty regressions remain passing

Validation contract: `../shared/validation-contracts/TDE-EPOCH-003-VALIDATION.json`. Its richer environment/risk/expected-exit form and the lossless WPRA projection must both remain current.

## Claim ceiling

This unit may prove only its bounded repository-local fixture and contract result. It does not admit a profile/provider globally, discharge a FormalClaim, prove a Lean theorem, establish production conformance, promote ontology, publish, release, deploy, merge, or create production effect.
