# Precedent And Ownership Skeptic

Action: `spawn-0005`  
Role: `skeptic-precedent`  
Status: `pass-with-ownership-corrections`

## Verdict

The thin-adapter direction passes the precedent gate only when described as
build-from-owned mechanics plus missing OEW behavior. Upstream already owns
package/workspace/dependency/build/test/Vite mechanics. OEW already owns the
deterministic fixture, graph, sidecar, adapter receipt, UI contract, and a
deployed local gateway safety pattern. Global Playwright owns browser
installation and runtime discovery. No generalized runtime has an evidenced
missing behavior. Precedent does not KILL a candidate.

## Exact Ownership Evidence

- Pinned archive `generated/upstream/2cda14e.../source.tar.gz`: root
  `package.json#scripts`, `pnpm-workspace.yaml#packages`, core
  `package.json#scripts.build`, and dashboard
  `package.json#scripts.{dev,build,test}` already deploy pnpm 10.6.2,
  recursive workspace build, core `tsc`, dashboard `tsc -b && vite build`,
  `vitest run`, Vite dev, and `workspace:*` core consumption.
- `upstream/L1-BUILD.lock.json#/upstream/effective_workspace`,
  `#/execution_contract/commands`, `#/feature_inputs`, and `#/claims` already
  own exact archive/workspace hashes, build order, overlay/patch/manifest
  inputs, and the no-final-build/no-browser claim ceiling.
- `overlay-manifest.json#/files` and
  `first-working-version-manifest.json#/files` own the UI sources, typed tests,
  and focused Node runners, while explicitly leaving final build and browser
  acceptance false.
- Existing OEW `package.json#scripts` is one dependency-free command registry,
  not a second dependency graph. Its declarations do not prove deployment:
  `materialize-l1-build.mjs`, `verify-l1-build.mjs`,
  `test/browser-acceptance.test.mjs`, and
  `verify-browser-acceptance.mjs` are absent from live `scripts/`/`test/`.
- `serve-native-viewer.mjs` owns loopback binding, GET/HEAD restriction, token
  auth, containment, verified adapter input, temp-root lifecycle, teardown,
  and receipt validation. `native-viewer-poker.test.mjs` proves that narrower
  L0 path. `/oew-data/{graph,sidecar,receipt}` is absent and therefore
  BUILD-FROM-OWNED.
- The Poker subset plus generated `SWU-OEW-004` graph, sidecar, and receipt
  already own deterministic data and authority-none evidence mechanics.
- `OewApp.tsx` and the three loader/type/store modules own the three-document
  client contract, but those modules currently fail strict TS.
- `AGENTS.md#Shared Browser Runtime` owns Playwright availability and forbids a
  package root solely for browser tooling; exact executable/receipt binding
  remains task-owned work.

## Candidate Ownership

| Candidate | Ownership verdict |
|---|---|
| Current L1 chain | KEEP; already-owned governance lane, not deployed end to end |
| Thin upstream adapter | RECOMMEND; BUILD-FROM-OWNED strict repair, `/oew-data/*`, and browser receipt |
| Static/Node-native | KEEP; already-deployed L0 diagnostic only |
| Generalized runtime | EXCLUDE/DEFER; duplicates owned mechanics |

## Required Corrections

- Rename the three-module `REBUILD` as strict typing REPAIR/BUILD-FROM-OWNED.
- Classify `/oew-data/*` as missing routing built from the owned gateway safety
  pattern.
- Classify the browser runner/receipt as missing behavior despite dead command
  declarations.
- Reject only turning the OEW command registry into a second topology; do not
  imply it already is one.
- Keep critical-path deletion/defer language as scope disposition, not
  repository deletion.
- Do not inflate the three-module repair into a fully typed UI claim:
  `OewApp.tsx` itself uses `// @ts-nocheck`.

No repository writes or browser/runtime execution occurred.
