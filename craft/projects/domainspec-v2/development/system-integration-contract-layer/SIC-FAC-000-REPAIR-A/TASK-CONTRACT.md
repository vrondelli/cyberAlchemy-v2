# SIC-FAC-000-R2 Task Contract

## Objective

Apply and validate one fresh, acceptance-bound generic-factory candidate that resolves both original `SIC-FAC-000` blockers and the subsequent claim-alignment owner gate by combining the five already staged factory/test repairs with Option A's exact 31 claim-lock alignments.

## Selected unit

- Task: `SIC-FAC-000-R2`
- SWU: `SIC-FAC-000-R2-SWU-001`
- Lifecycle owner: `generic-factory-owner`
- Authority class: private
- Publication class: private
- Execution mode: routed mutation
- Human decision: `A-align-locks-to-current-evidence`

## Exact material writes

1. `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts`
2. `projects/domainspec-v2/impl/architecture-conformance/factory/evidence/normalize-semantic-receipt.ts`
3. `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/reproduce-reference-suite.ts`
4. `projects/domainspec-v2/impl/architecture-conformance/factory/tests/proof-accounting.test.ts`
5. `projects/domainspec-v2/impl/architecture-conformance/factory/tests/reproduction.test.ts`
6. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/reference-suite.request.json`
7. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-calculation.request.json`
8. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-entity.request.json`
9. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum-semantic-slice.request.json`
10. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-policy.request.json`
11. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-query.request.json`
12. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-value-object.request.json`
13. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/w3-effects-connections.request.json`
14. `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/w4-orchestration-lifecycle.request.json`

No fifteenth product path may change. The unreferenced legacy `rmt-enum.request.json`, all provider files, `plan-factory-run.ts`, and `run-locked-child.ts` are explicitly outside the material frontier.

## Required behavior

- The executor rejects a direct/replay-equal provider result before node assignment or publication when `claim_ceiling` differs from the locked node value.
- The normalizer independently rejects that mismatch and never masks it by substituting the locked value.
- Both boundaries emit `FACTORY_CLAIM_CEILING_MISMATCH:<node_id>`.
- Exact equality preserves the provider result and canonical semantic hashing.
- The 31 approved live provider-evidence strings become the exact nested node locks in only the nine approved fixtures; top-level request claims remain unchanged.
- Reference reproduction executes its two isolated roots sequentially while retaining two run roots, distinct process observations, equal semantic digests, and an unchanged product inventory during reproduction.
- The locked per-child timeout remains `70_000` milliseconds.
- The reproduction regression exercises `reference-suite.request.json`, not the one-node rule-only fixture.

## Acceptance-critical validation

The exact declared validation command is:

`node projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-A/tools/run-post-repair-validation.mjs`

That command must preserve each child command's exit status and prove all of:

- exact post-apply hashes for 14/14 targets and unchanged hashes for the timeout planner and child reaper;
- exact lock/provider claim equality for 31/31 approved nodes;
- `npm --prefix projects/domainspec-v2/impl run factory:typecheck` passes;
- a full-pipeline hostile W3 claim mismatch fails with the exact error before a run is published;
- `npm --prefix projects/domainspec-v2/impl run factory:test` passes;
- fresh reference and W3 `plan -> run -> replay -> verify -> reproduce` lifecycles pass from newly derived locks and run IDs;
- 10/10 execution-run semantic hashes and locked/provider claims are equal;
- the product inventory differs from the immutable 549-entry baseline at exactly the 14 admitted paths and does not drift during validation.

## Stop conditions

- Any live target or dependency digest differs before apply.
- Any required product target falls outside the exact 14 approved paths.
- The material-package receipt or Task Session admission does not pass.
- Sequential exact reference reproduction still times out.
- Any acceptance-critical command returns an unexpected status.
- The repair requires a timeout increase, provider rewrite, target/profile choice, or Revision 2 mutation.
- Cleanup or a later pass would mask an earlier failure.

## Closeout boundary

The fresh candidate's terminal artifacts and continuity cursor are generated from the same terminal evidence, so closeout synchronization is a receipt-backed no-op. The next route may be returned as `invoke:refresh` for factory-adapted Revision 2, but it is not executed or authorized here.

## Claim ceiling

Passing evidence proves only that this bounded 14-file generic-factory candidate satisfies its declared validation surfaces. It does not select or implement an integration target/profile, accept or mutate Revision 2, promote, publish, release, deploy, or establish production readiness.
