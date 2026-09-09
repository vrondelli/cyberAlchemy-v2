# Context Pack — SWU-OEW-013B Attempt 002

Mode: standard, strict runtime handoff  
Status: PASS  
Authority: private session evidence; no lifecycle or publication effect

## Execution Boundary

Materialize and independently verify exactly one immutable final L1 dashboard
build from the retained upstream archive, verified 006P toolchain, completed
007 store overlay, completed 008F first-working-version source, and the
immutable `L1-BUILD.lock.json`.

The live implementation write scope is limited to seven absent outputs:

1. `contracts/l1-build-handle.schema.json`
2. `contracts/l1-build-verification.schema.json`
3. `scripts/materialize-l1-build.mjs`
4. `scripts/verify-l1-build.mjs`
5. `test/l1-final-build.test.mjs`
6. `generated/runs/SWU-OEW-013B/l1-build-handle.json`
7. `generated/runs/SWU-OEW-013B/l1-build-verification.json`

`upstream/L1-BUILD.lock.json` is target eight but is an immutable controlling
input during this attempt.

## Covered Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O13B-01 | live 013B selection and series authority | work pack, manifest, chain, wave | covered |
| O13B-02 | verified 006P/007/008F dependencies | toolchain verification and predecessor receipts | covered |
| O13B-03 | exact eight-target inventory with immutable lock | task contract, manifest, build lock | covered |
| O13B-04 | exact upstream, tool, workspace, overlay and patch bindings | build lock, upstream baseline | covered |
| O13B-05 | fresh external digest-named workroot and isolated frozen install | build lock, architecture and upstream baseline | covered |
| O13B-06 | patch-once, dashboard Vitest, `tsc -b && vite build` | build lock and validation contracts | covered |
| O13B-07 | immutable retained output and independent verifier | architecture and validation contracts | covered |
| O13B-08 | cleanup, residue, protected equality and no port residue | build lock and closeout contract | covered |
| O13B-09 | package root and package registry remain unchanged | package registry and manifest | covered |
| O13B-10 | negative witnesses fail closed | task contract, build lock and validation contracts | covered |
| O13B-11 | receipt-bound owner closeout and unique successor policy | closeout contract, manifest and chain | covered |
| O13B-12 | no browser, L2, authority, publication, release or production claim | work pack, task contract and architecture | covered |

## Implementation Rules

- Verify every lock-bound path, digest, size, tool version and receipt before
  dependency installation.
- Use the lock-declared Node and pnpm bytes.
- Extract the retained source archive into a fresh digest-named workroot
  outside the repository.
- Use `--frozen-lockfile`, `--ignore-scripts`, and a workroot-owned pnpm store.
- Copy every 007 and 008F overlay source only after verifying its declared
  digest and size; focused Node runners are validation inputs, not upstream
  copies.
- Verify the entrypoint preimage, apply the patch exactly once, verify the
  postimage, and require negative reapplication.
- Run dashboard Vitest and the dashboard build declared by the upstream
  package.
- Retain the built `dist` as a digest-named immutable archive outside the
  repository and bind its tree/archive digest in the producer handle.
- Remove the disposable source workroot and dependency store in `finally`.
- The independent verifier must recompute inputs, patch images, retained build
  bytes, protected equality, cleanup and negative witnesses without trusting
  the producer verdict.

## Validation and Done Criteria

Acceptance-critical:

- `node --test test/l1-final-build.test.mjs`
- `npm run build:l1`
- `npm run verify:l1-build`
- both generated documents conform to their closed schemas
- live package registry equals SHA-256
  `a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004`
- protected before/after snapshots compare exactly equal
- only the seven absent implementation outputs plus attempt-002 evidence
  change before closeout
- Invoke Refresh owner closeout is joined before this Task Session returns

## Non-goals

No browser execution, browser lock, axe evidence, manual UX evidence, L2 code
context, ontology admission, authority mutation, publication, deployment,
release, production claim, package-root mutation, package-lock mutation, or
public Arcanum change is authorized.

## Context Builder Result

- Files selected: 14
- Strict obligation coverage: 12/12
- Fallback search: none
- Contradictions: none
- Runtime handoff: ready
- Evidence ceiling: execution context only; no final build has run yet
