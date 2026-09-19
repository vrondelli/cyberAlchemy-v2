# SIC-FAC-000-R1 Task Contract

## Objective

Prepare, apply, and validate one separately staged generic-factory candidate that repairs both blockers recorded by `SIC-FAC-000` without expanding into provider, target/profile, reviewer, publication, or deployment work.

## Selected unit

- Task: `SIC-FAC-000-R1`
- SWU: `SIC-FAC-000-R1-SWU-001`
- Lifecycle owner: `generic-factory-owner`
- Authority class: private
- Publication class: private
- Execution mode: routed mutation

## Exact material writes

1. `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts`
2. `projects/domainspec-v2/impl/architecture-conformance/factory/evidence/normalize-semantic-receipt.ts`
3. `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/reproduce-reference-suite.ts`
4. `projects/domainspec-v2/impl/architecture-conformance/factory/tests/proof-accounting.test.ts`
5. `projects/domainspec-v2/impl/architecture-conformance/factory/tests/reproduction.test.ts`

No other product bytes may change.

## Required behavior

- The executor rejects a direct/replay-equal provider result before node assignment or persistence when its `claim_ceiling` differs from the locked node value.
- The normalizer independently rejects that mismatch and never masks it by substituting the locked value.
- Both boundaries emit `FACTORY_CLAIM_CEILING_MISMATCH:<node_id>`.
- Exact equality preserves the provider result and canonical semantic hashing.
- Reference reproduction executes its two isolated roots sequentially while retaining two roots, two process observations, equal semantic digests, and an unchanged product inventory.
- The locked per-child timeout remains `70_000` milliseconds.
- The reproduction regression exercises `reference-suite.request.json`, not the one-node rule-only fixture.

## Acceptance checks

- `npm --prefix projects/domainspec-v2/impl run factory:typecheck`
- `npm --prefix projects/domainspec-v2/impl run factory:test`
- exact nine-node reference `plan -> run -> replay -> verify -> reproduce`
- W3 `plan -> run -> replay -> verify -> reproduce`
- hostile claim-ceiling probe rejects before a published run exists
- semantic-hash audit remains canonical
- pre/post product-byte inventory differs at exactly the five admitted targets and nowhere else

## Stop conditions

- Any of the five baseline hashes changes before apply.
- Sequential exact reference reproduction still times out.
- Any acceptance-critical command returns nonzero.
- The repair requires a timeout increase, provider change, target/profile choice, or a sixth product write.
- An existing failure would be masked by cleanup or a later passing command.

## Claim ceiling

Passing evidence proves only that this bounded generic-factory repair candidate satisfies its declared validation surfaces. It does not select or implement an integration target/profile, approve Revision 2, promote, publish, deploy, or establish production readiness.
