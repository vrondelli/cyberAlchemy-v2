# Independent Auth VPS staging replay

## Verdict

`DISAGREE`

The live Auth release is reproducible as a **remote-isolated staging
rehearsal** at the review time. The package as a whole is not a closed DAG
execution and cannot support a remote-staging verdict. The disagreement is
about execution-state integrity and gate order, not the observed health of the
Auth release.

## Reproduced evidence

- The local archive SHA-256 and external manifest SHA-256 match
  `vps/out/RESULT.json`.
- Every one of the 452 manifest entries matches its archive member by size and
  SHA-256. The archive has 453 file members including `MANIFEST.json`, and the
  embedded manifest is byte-identical to the external manifest.
- `compose.yaml`, `scripts/setup.mjs`, and `src/server.mjs` match the manifest,
  archive, and P1 successor hashes.
- The remote current release is `be1836ec99109120`; its manifest SHA-256 is
  `4b8d94b117b76471868355d92423f68963ee7bb5d1c6ec0e73a6e475196fd5da`.
  All 299 immutable non-runtime-seed release files match that manifest.
- `auth-foundation-staging.service` is active and enabled, runs as
  `auth-stage`, and retains `NoNewPrivileges`, `PrivateTmp`, `ProtectHome`,
  `ProtectSystem=strict`, and the single declared writable state path.
- The three Auth containers are running; PostgreSQL reports healthy. The
  declared ports listen only on `127.0.0.1`, with no wildcard listener on
  13443, 18443, or 19443.
- Runtime metadata shows 0700 for the private state root, 0600 for config and
  compose environment files, 0640 for mounted private material, 0770 for the
  socket directory, and 0660 for the application socket. No secret value was
  read or recorded.
- TLS verification succeeds against the bound private CA. The observed leaf is
  `CN=frontend`, issued by `CN=Auth Foundation disposable HTTPS CA`, valid from
  2026-09-13 00:21:33 UTC to 2026-09-27 00:21:33 UTC.
- Live probes at 2026-09-13 00:30:10 UTC returned issuer 200, health 200,
  invalid-host 421, and an authenticated service decision of 200/`ALLOW` for a
  service principal. The probe consumed private configuration internally and
  emitted no credential or token.
- The package validator passes, all seven ORODI evaluator tests pass, and all
  fifteen Auth unit tests pass.

## Counterevidence

1. `execution/b1/PREFLIGHT.json` is blocked with two missing bindings:
   `$.environment.region` and `$.subject.stable_digest`. The full exact
   evaluation binding therefore remains open.
2. `execution/p1/RESULT.json` classifies P1 as `inconclusive`; the affected V3
   formal replay is `not-run`. Deployment cannot promote this into a passed
   product-construction gate.
3. `EXECUTION-STATUS.json` conflicts with later evidence. It still records B0
   and O0 as missing, O1 as not run, `deployment_effect: false`, and G0 as not
   run, while B0/O0/O1 evidence and an actual deployment now exist.
4. The declared DAG requires G0 before O1, B1 before G1, and G0/G1/O1/B1 before
   materializing staging. No G0 or G1 evidence exists, B1 is blocked, and the
   running deployment is recorded as O1. This is execution-state and node-
   meaning drift from the declared plan.
5. Preservation of other VPS services is not independently reproducible at
   the review time. Author observation at 00:25 UTC recorded
   `cyberalchemy-are-gateway` and `cyberalchemy-orchestrator` healthy. At
   00:30 UTC the gateway was newly `created` and the orchestrator was
   exited/unhealthy; at 00:31 UTC the gateway was running/healthy while the
   orchestrator remained exited/unhealthy. Both were recreated after the Auth
   containers. This establishes post-author-observation change, but it does
   not establish that the Auth deployment caused it. The two older services
   `alch-host-alch-1` and `body-war-v2-staging-app-1` remain running/healthy.
6. Only 299 immutable release files can be checked remotely after installation;
   runtime-seed members were moved into mutable state and consumed by setup.
   The complete 452-member artifact is verified locally, while exact remote
   post-install equivalence for the moved seed is not available.

## Claim ceiling

The passing observations support only the exact Auth release's behavior on one
single VPS during this short replay. They do not establish production-shaped
remote staging, independent availability, publicly trusted TLS, sustained
availability, load/soak/capacity behavior, monitoring retention, alerting,
backup restoration, rollback restoration, formal V3 successor closure,
product approval, admission, certification, release authority, or production
readiness.

`authority_effect: none`

## Open Questions

- Which owner binds the missing region and stable digest and reruns B1?
- Which exact affected V3 routes must close P1 for these portability changes?
- What concurrent operation recreated the ARE gateway and orchestrator around
  00:30 UTC, and can preservation be replayed in a quiet observation window?
- Will actual deployment be assigned to O2, or will the DAG and evidence model
  be revised so O1 consistently means deployment?
