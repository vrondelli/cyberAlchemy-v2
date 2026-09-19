# SIC-FAC-000-R2 Fresh Revalidation Contract — Attempt B

## Objective

Apply one fresh acceptance-runner repair and execute the complete `SIC-FAC-000-R2` validation against the already-applied 14-file generic-factory candidate.

## Selected unit

- Task: `SIC-FAC-000-R2`
- SWU: `SIC-FAC-000-R2-SWU-001-REVALIDATION-B`
- Attempt: `SIC-FAC-000-R2-ATTEMPT-B`
- Lifecycle owner: `generic-factory-owner`
- Execution mode: routed mutation
- Authority/publication class: private/private

## Exact material write

Only this acceptance-bound control may be created:

`projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-B/tools/run-post-repair-validation.mjs`

It must be byte-identical to `producer/material/run-post-repair-validation.mjs`, SHA-256 `5f2dae2d3bb84cdc386df5b85eff97aecc097535b0ae450f03d98570446905d7`, 28,093 bytes.

The 14 product targets named in `producer/EXPECTED-POST-APPLY.json` are read-only inputs. No product file may change during this attempt.

## Runner provenance

The runner is derived from the immutable Attempt A runner by exactly:

1. replacing its evidence root with `SIC-FAC-000-REPAIR-B`; and
2. applying the sidecar-approved error-envelope predicate that expects `FACTORY_CLAIM_CEILING_MISMATCH:typescript-w3-effects-connections`, records envelope conformance separately from fail-closed publication evidence, and requires both.

No timeout, product target, fixture, lifecycle order, inventory rule, or claim ceiling changes.

## Acceptance-critical validation

Run exactly once:

`node projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-B/tools/run-post-repair-validation.mjs`

It must prove:

- 14/14 exact product hashes and 2/2 unchanged timeout/reaper guards;
- 31/31 exact lock/provider claim equalities;
- factory typecheck;
- the real hostile W3 mismatch fails closed before publication with the complete CLI envelope;
- the full factory test suite;
- fresh reference and W3 `plan -> run -> replay -> verify -> reproduce` lifecycles;
- 10/10 semantic hashes and locked/provider claim equalities;
- exactly the admitted 14-path product delta from the immutable baseline and zero validation-time product drift.

## Stop conditions

- Any runner, product, guard, source, package, review, or admission binding drifts.
- Any acceptance-critical command returns an unexpected status or times out.
- Any output escapes the declared execution-output roots.
- Any additional product change, timeout increase, provider rewrite, narrower fixture, partial rerun, or cleanup would be required.

On first failure, preserve evidence and close `BLOCK`; do not rerun in place.

## Closeout boundary

Terminal artifacts and the continuity cursor are written from the same attempt evidence, so synchronization is a receipt-backed no-op. A passing result may return the factory-adapted Revision 2 Refresh route, but must not execute it.

## Claim ceiling

A pass establishes only that the exact 14-file generic-factory candidate satisfies this declared validation surface. It does not select or implement a system-integration target/profile, accept or mutate Revision 2, promote, publish, release, deploy, or establish production readiness.
