# Source-owned Build Migration Contract

## Pinned baseline

- Upstream commit: `2cda14e89535049e49120198886bc0b82e9e630f`.
- Upstream root lock: `pnpm-lock.yaml` SHA-256 `20342fbb10c311a3259a4f7acb367cc79b2b2ad565ede2c3e1704a797d32ed96`.
- Dashboard manifest digest: `e0d64356b36013371d98f97d8b9ad389405c6995ce0a814b17cb51f1e5299bf6`.
- Resolved primary dependencies in that lock: `@xyflow/react@12.10.1`, `elkjs@0.9.3`.
- Toolchain: Node `v22.12.0`, pnpm `10.6.2`, pinned by `upstream/L1-BUILD.lock.json`.

## Owned source boundary

OEW TypeScript/React source lives in the overlay dashboard package. Source-owned scene, state, query, UI API profile/contracts/mappings, adapter, components, CSS, fixtures, and tests are listed with destination and digest in an updated overlay/build manifest. The terminal `/` workbench Page is owned by the OEW dashboard overlay host, not by the Body War standalone frontend. Body War owns only its source adapter, View Packs/cluster registry, encoding registry, fixture data, and generator entrypoint.

## Inputs and outputs

Inputs: upstream source archive + lock; overlay source manifest; exact DomainSpec development profile at `projects/domainspec-v2/impl/spec/ui-profile/profile.yml`, profile schema at `projects/domainspec-v2/impl/spec/ui-profile/profile.schema.json`, nine formation-schema paths/digests, and the OEW UI API inventory; Body War business/system/bridge source packages and digests; view/cluster and encoding registries. Outputs: OEW-owned `src/oew/ui-api/profile.snapshot.json`, `src/oew/ui-api/inventory.ts`, compiled dashboard assets, exact `presentation-graph.json`, evidence sidecar, view packs, UI-profile compiler/conformance receipt, adapter receipt, geometry/browser receipts, and a tree digest.

The generator may copy data and run source compilation. It may not search/replace strings in compiled assets, patch minified JavaScript, or make a retained distribution the source of product behavior.

## Cutover and rollback

1. Build old retained baseline and new source-owned candidate from the same admitted source graph.
2. Compare source identities, evidence mapping, complete index, accepted deep links, and static projection.
3. Run every deterministic, negative, typed, build, and browser gate on candidate.
4. Cut over the local prototype entrypoint only after all gates pass.
5. Roll back by restoring the entrypoint to the untouched retained baseline; do not mutate source ontology or reuse failed generated artifacts.

## Proof of zero surgery

- Static scan of the generator forbids `patchOnce`, minified anchor strings, compiled asset `replace`/`replaceAll`, and write operations targeting hashed JavaScript bundles.
- Build manifest enumerates every owned source module and emitted artifact.
- Rebuild from an empty temporary workroot produces the same canonical tree digest for pinned inputs.
- Candidate behavior disappears when its source module is removed, proving it is not injected after compilation.
- Static import/asset scans prove the shipped runtime does not read `projects/domainspec-v2/`; the build-owned profile snapshot remains digest-bound and development-only.
