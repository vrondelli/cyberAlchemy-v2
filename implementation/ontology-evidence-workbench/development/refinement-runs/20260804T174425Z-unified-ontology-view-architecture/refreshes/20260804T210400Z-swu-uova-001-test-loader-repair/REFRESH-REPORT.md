# Invoke Refresh — SWU-UOVA-001 test-loader repair

- Mode: `refresh`
- Activation: `direct-user`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `ready`
- Target owner: `ontology-evidence-workbench-owner`
- Target artifact: `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
- Mutation ready: `true`

## Evidence synthesis

SWU-UOVA-001's new source-graph behavior passes all 10 focused tests. Its terminal receipt blocked only because the root `node --test` process cannot directly import the typed `knowledgeFocusScene.ts` module.

The no-write repair probes establish three boundaries:

1. `--experimental-strip-types` makes the unchanged focus-scene tests pass 4/4.
2. Unbounded type-stripping discovery is invalid because it also discovers upstream Vitest `.test.ts` files.
3. Bounded discovery with the quoted `**/*.test.mjs` inventory passes 126 runnable tests with 0 failures and preserves the one intentional skip.

## Exact proposal

Modify only `package.json`:

- change `engines.node` from `>=22` to `>=22.6`;
- change `scripts.test` from `node --test` to `node --experimental-strip-types --test "**/*.test.mjs"`.

See [REFRESH-PATCH-PROPOSAL.md](REFRESH-PATCH-PROPOSAL.md).

## Material handoff

The exact confirmation `confirmed apply-approved package.json loader repair` is recorded under `source-evidence/direct-user-apply-approval.json`. The material package contains one staged postimage with SHA-256 `4359890ef94739124c7be5cd4c8317db291e21dce958735196144098d5dc877a`.

The independent producer receipt returned `patchVerdict: pass`, and the Refresh handoff resolver returned `mutationReady: true` with no blockers. The package is ready for Task Session; Invoke still does not mutate the product target.

## Boundaries and residue

The proposal does not alter product logic, assertions, dependencies, ontology, generated output, public Arcanum, Git, deployment, or promotion. Invoke owns this proposal only; Task Session owns the mutation and terminal rerun.

The apply-authorization blocker is resolved. Target execution and SWU-UOVA-001 closeout remain owned by Task Session and the closeout owner respectively.

## Next route

`task-session` to admit and apply the one-file material package, rerun the declared checks, and retry SWU-UOVA-001 closeout.

Distill was skipped because the repair is already a one-file, one-behavior unit. The background helper completed read-only with `pass-with-flags`; its negative-control finding is preserved in `HELPER-RECEIPT.json`.
