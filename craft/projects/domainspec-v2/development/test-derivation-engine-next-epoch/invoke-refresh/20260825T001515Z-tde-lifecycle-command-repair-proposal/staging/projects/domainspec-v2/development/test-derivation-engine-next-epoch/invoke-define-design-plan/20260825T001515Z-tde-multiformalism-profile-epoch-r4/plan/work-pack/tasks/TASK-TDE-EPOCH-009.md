# TASK-TDE-EPOCH-009 — TDE-EPOCH-009

## One owned outcome

Require semantic obligation, case, outcome, evidence, and ceiling parity across all three independent implementation lanes.

## Dependencies and owner

- Dependencies: TDE-EPOCH-004, TDE-EPOCH-005, TDE-EPOCH-006
- Lifecycle owner: Task Session
- Domain owner: TDE-parity-validator-owner
- Canonical successor: `TDE-EPOCH-010`

## Exact material writes

- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/parity/parity.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/parity/parity.test.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/__fixtures__/parity/cases.json`

## Exact execution outputs

- `projects/domainspec-v2/development/test-derivation-engine-next-epoch/evidence/tde-multiformalism-profile-epoch/TDE-EPOCH-009/RECEIPT.json`

The disjoint union of those two lists is the complete allowed-write set. All other paths are immutable for this unit. Existing unrelated and pre-existing dirty bytes must remain unchanged.

## Inputs and outputs

Inputs are the exact accepted @4 Plan epoch, this unit contract, dependency receipts, current source/profile/provider identities required by the behavior, and freshly captured live target baselines. Outputs are only the listed material postimages and exact terminal evidence.

## Ordered algorithm

1. Task Session verifies renewed exact @4 acceptance, dependency receipts, current unit contract digest, and present/absent live baselines.
2. Materialize only the declared TDE-EPOCH-009 behavior: Require semantic obligation, case, outcome, evidence, and ceiling parity across all three independent implementation lanes.
3. Run the structured validation commands in order with the exact environment, timeout, output budget, risk, and expected-exit contract.
4. Stop at the first nonzero result; retain that result and perform only the declared failure teardown.
5. Emit the exact terminal receipt and close through Invoke Refresh to the sole canonical successor `TDE-EPOCH-010`.

## Edge cases and failure modes

Unknown, latest, duplicate, stale, malformed, missing-provider, unsupported, timeout, indeterminate, ceiling-widened, source-drifted, dependency-mismatched, or undeclared-target states block. Product or semantic choice, scope expansion, destructive or irreversible effect, secrets, external/network effect, cost/risk acceptance, authority/promotion/publication/deployment, or failed acceptance-critical validation stop before the next write or route.

## Acceptance

- TypeScript, Python, and Rust lane receipts match semantically under exact ceilings
- missing lane, case loss, mismatch, stale evidence, and two-of-three majority reject
- native syntax is not compared as semantics

Validation contract: `../shared/validation-contracts/TDE-EPOCH-009-VALIDATION.json`. Its richer environment/risk/expected-exit form and the lossless WPRA projection must both remain current.

## Claim ceiling

This unit may prove only its bounded repository-local fixture and contract result. It does not admit a profile/provider globally, discharge a FormalClaim, prove a Lean theorem, establish production conformance, promote ontology, publish, release, deploy, merge, or create production effect.
