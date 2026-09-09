# TASK-OEWTP-01: Typed Executable-Loader Admission

## Objective

Close the measured 48 strict-TypeScript errors in exactly three OEW overlay
modules, repair the owned relative-base URL composition in `loadOewBundle.ts`,
and synchronize the two existing source manifests that admit those bytes.
Preserve schemas, strictness, package topology, and all runtime behavior except
that bounded repair.

- Layer/slice: L0 / S-001
- Wave: W1
- SWU: `SWU-OEWTP-001`
- Status: selected for immediate Task Session preflight
- Mutation authorized now: yes, subject to the exact per-attempt admission gate

## Source contracts

- [Plan context](../../PLAN-CONTEXT.md)
- [Architecture low-level component and D-03](../../../design/ARCHITECTURE.md)
- [Approved research direct blocker](../../../../ontology-evidence-workbench/research/2026-07-29-runtime-rebuild-lessons/findings.md)
- implementation:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/{types.ts,loadOewBundle.ts,store.ts}`
- admission:
  `upstream/overlay/{overlay-manifest.json,first-working-version-manifest.json}`
- read-only token source:
  `upstream/overlay/packages/dashboard/src/oew/OewApp.tsx`, current admitted
  SHA-256
  `624f07050fdaf19019eb1aba585d223b17fceca12d6bf9324b3b942359d58f69`

## Dependencies and blockers

- Dependencies: none
- Preflight blocker: the current errors are materially different from the
  approved three-file distribution
- Preflight blocker: any declared write target is missing, symlinked outside
  scope, or overlaps another active worker
- Non-blocker: `OewApp.tsx` still has `@ts-nocheck`; removing it is outside this
  SWU and cannot be claimed
- Expected residue: the read-only historical `L1-BUILD.lock.json` binds the
  predecessor overlay bytes and becomes stale after this repair. This SWU must
  record that fact but must not edit the lock or the old development package.

## Smallest Working Unit: SWU-OEWTP-001

### Primary behavior

The existing overlay becomes strict-TypeScript clean, same-origin loader
composition becomes executable, and both are exactly admitted without
weakening validation or changing dependency/runtime topology.

### Split analysis

Plausible children are type repair, relative-base URL repair, and manifest
synchronization. They do not pass independently: the URL defect lives in the
same typed loader, repaired files with stale manifests are rejected inputs, and
updated manifests over failing or non-fetching bytes are unusable. The retained
boundary has one independently reviewable acceptance: current admitted bytes
compile and turn the exact OewApp call into three fail-closed same-origin
requests.

### Write scope

Only:

1. `.../src/oew/types.ts`
2. `.../src/oew/loadOewBundle.ts`
3. `.../src/oew/store.ts`
4. `.../upstream/overlay/overlay-manifest.json`
5. `.../upstream/overlay/first-working-version-manifest.json`
6. `.../generated/runs/SWU-OEWTP-001/<attempt-id>/typed-admission.json`
7. `.../planning/work-pack/session-evidence/SWU-OEWTP-001/<attempt-id>/receipt.json`

No `package.json`, lockfile, old development package, test, CSS, UI component,
schema, unrelated generated run, or `@ts-nocheck` target is admitted. W0 must
replace `<attempt-id>` with one concrete collision-free value before mutation.

### Runtime admission

Use `../../MUTATION-ADMISSION-CONTRACT.json#SWU-OEWTP-001`.
The first five paths are `materialWrites`; the typed-admission handle and
terminal receipt are `executionOutputs`. They are disjoint and exactly
recompose this SWU write scope. Stage exact controls and dependencies at
identical repository-relative paths, require exact-scope Invoke material
validation and Task Session `admissionVerdict=admit`, then apply material,
produce and verify the typed-admission handle during validation, and write the
terminal receipt last.

### Implementation detail

1. Bind the concrete attempt ID, capture SHA-256 and size for all five source
   targets, declare both execution outputs absent, and capture a repository
   package-manifest inventory.
2. Materialize the pinned Understand-Anything archive into a fresh temporary
   workroot using the existing upstream verification and exact entry patch
   rules.
3. Copy the current overlay and reproduce the baseline strict-TypeScript
   diagnostics. Record code, file, line, and count; stop if the load-bearing
   distribution differs.
4. Add explicit TypeScript types at semantic boundaries:
   - type the error class fields and constructor inputs;
   - express JSON documents as `unknown` until record/array checks narrow them;
   - type graph, sidecar, receipt, artifact, source-index, hash, filter, state,
     listener, and loader option shapes;
   - narrow `Object.entries` values before property access;
   - type generic record keys and callbacks instead of using implicit `any`;
   - keep `validateOewBundle` as the only constructor of a verified bundle
     shape consumed by `createOewStore`.
5. Repair `tokenizedUrl` so the relative `baseUrl: "/oew-data/"` supplied by
   the read-only OewApp is first resolved against the current page origin.
   Reject a missing/malformed page origin and any resolved cross-origin base
   before fetch; then resolve the file and append the token. Do not hard-code a
   port or widen to arbitrary remote bases.
6. Do not add broad casts that bypass validation. A narrow cast is permitted
   only after a runtime predicate and must be local to that proof.
7. Run the existing Node focused runners to guard behavior.
8. In the materialized dashboard, invoke the exact typed OEW Vitest files
   directly and record discovered file/test counts and names.
9. Verify the read-only `OewApp.tsx` digest and its exact call boundary: it
   reads `token` from `window.location.search` and supplies that value to
   `loadOewBundle`.
10. Add a receipt-bound test only in the temporary workroot that invokes
   materialized `loadOewBundle.ts` with the exact `baseUrl: "/oew-data/"`,
   page origin, and token used by OewApp. Inject a fake fetch and prove all three
   resulting URLs are same-origin, absolute, tokenized, and preserve
   `credentials: "omit"`. Prove malformed and cross-origin bases make zero
   fetch calls. Do not add this temporary probe to the repository overlay.
11. Run dashboard `tsc -b --pretty false` with the current strict config. This
   SWU need not run Vite; SWU-OEWTP-002 owns the repeatable full producer.
12. Update only the three corresponding file digest/size rows in both existing
   source manifests. Preserve their keys, target lists, counts, authority
   effect, predecessor refs, and every unrelated byte.
13. Write `typed-admission.json` and the Task Session receipt to their pre-bound
    unique paths without overwrite.
14. Re-run typed tests, the composed token-handoff probe, strict compilation, manifest exactness, package
    inventory, and diff-scope checks.
15. Remove the temporary workroot in `finally` and record absence.

### Edge cases and failures

- Missing Web Crypto types: use the dashboard's active DOM lib types; do not add
  a dependency.
- JSON array or record mismatch: keep runtime rejection; do not type-cast it
  away.
- Duplicate source refs or non-total mappings: preserve existing exceptions.
- Listener mutation/reentrancy: type the listener contract without changing
  synchronous emission semantics.
- Test command reports zero discovered tests: block even if exit code is zero.
- A new diagnostic outside the three files: block and return evidence for Plan
  review; do not silently broaden write scope.
- Manifest formatter rewrites unrelated rows: restore/rebuild a minimal patch
  before closeout.

### Done criteria and evidence

- zero strict-TypeScript diagnostics in the admitted materialized dashboard;
- exact typed OEW test paths/names are discovered and pass;
- current Node focused runners pass;
- both source manifests exactly bind repaired SHA-256 and size;
- no package manifest count or bytes changed;
- no `@ts-nocheck` was added and strictness/config bytes are unchanged;
- the admitted post-repair loader converts OewApp's exact relative base into
  three same-origin absolute URLs, appends the query token, and keeps
  `credentials: "omit"`;
- malformed/cross-origin bases make zero fetch calls;
- `OewApp.tsx` remains read-only at its admitted SHA-256;
- exact five-source-file diff, typed-admission handle, and Task Session receipt;
- named residue records that the preserved historical L1 lane needs a separate
  L2 rebind before reuse.

### Validation command shape

```text
node --test test/ui-store.test.mjs test/trust-rail.test.mjs \
  test/evidence-inspector.test.mjs test/view-parity.test.mjs \
  test/navigation.test.mjs test/poker-tour.test.mjs test/responsive.test.mjs

pnpm --dir <fresh-root> --filter @understand-anything/dashboard exec vitest run \
  src/oew/EvidenceInspector.test.tsx src/oew/PokerTour.test.tsx \
  src/oew/TrustRail.test.tsx src/oew/navigation.test.tsx \
  src/oew/responsive.test.tsx src/oew/viewParity.test.ts

pnpm --dir <fresh-root> --filter @understand-anything/dashboard exec \
  tsc -b --pretty false
```

The Task Session must expand `<fresh-root>` to its receipt-bound temporary path.

### Execution handoff

- Owner recommendation: one bounded subagent governed by Task Session
- Runtime Context Builder: strict, `--emit both --handoff runtime`
- Required return: standard SWU result shape with exact files, validation,
  diagnostics before/after, test discovery, package inventory, blockers, and
  residue
- Closeout: exact row `SWU-OEWTP-001` in
  [CLOSEOUT-SYNC-INVENTORY.json](../../CLOSEOUT-SYNC-INVENTORY.json)
- Successor: only SWU-OEWTP-002 after source and owner receipts pass

## Completion evidence

Future result:
`../results/SWU-OEWTP-001-RESULT.md`. Absence currently means not started.
