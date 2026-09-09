---
module: ontology-evidence-workbench-config-side-dom-repair
version: candidate-1
status: candidate-local-implementation-complete
updatedAt: 2026-08-04
docType: work-pack
---

# WORK-PACK: OEW Config-Side DOM Repair

## Selection and scope

- Decision: `D-OEWFR-01-DOM-COMPATIBILITY-REPAIR`
- Selected option: `B-CONFIG-SIDE`
- Selection evidence:
  [DOM-COMPATIBILITY-REPAIR-selection.json](decisions/admissibility/DOM-COMPATIBILITY-REPAIR-selection.json)
- Execution mode: bounded candidate-local prototype fast lane
- Objective: keep the default typed-test environment on Node, run only
  `src/oew/navigation.test.tsx` under a pinned DOM environment, and prove the
  resulting candidate through the generalized build and local Chromium.

This package does not rewrite historical binding006 or patch0004. It extends
their immutable chain with one private builder capability unit and one exact
semantic-navigation successor unit.

## Ordered units

| Unit | Primary behavior | Material writes | Acceptance boundary |
| --- | --- | --- | --- |
| `SWU-OEWFR-008` | generalized builder admits one root lockfile target and emits per-file Vitest environment overrides | private builder and its contract test only | 27/27 or greater focused builder tests; root scope remains exactly `pnpm-lock.yaml`; default environment remains Node |
| `SWU-OEWSN-023` | immutable successor adds `jsdom@28.1.0`, isolates navigation tests, and produces a retained build | patch0005 and binding023 only | frozen install, 7 files/15 typed tests, dashboard build, keyboard Chromium acceptance, predecessor identity equality |

The units cannot safely merge: binding023 must bind the validated postimages of
the reusable builder evolution before the successor material is admitted.

## Exact write contract

### SWU-OEWFR-008 material

1. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
2. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`

### SWU-OEWSN-023 material

1. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/patches/0005-oew-navigation-jsdom.patch`
2. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/OEWSN-BUILD.SWU-OEWSN-023.binding.json`

### Execution outputs

1. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/20260804T035543Z/semantic-navigation-build-handle.json`
2. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/20260804T035543Z/dashboard-dist/`
3. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/20260804T035543Z/semantic-patch-snapshot/`
4. `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/20260804T035543Z/browser-evidence/`
5. `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/20260804T035543Z/receipt.json`

No other product, package, lockfile, generated-run, browser-evidence, planning,
public Arcanum, Git, publication, deployment, or release path is admitted.

## Implementation contract

1. Preserve `test.environment: "node"` as the generated default.
2. Extend the binding typed-test contract with an optional, validated
   `environment_match_globs` list.
3. Admit only `node`, `jsdom`, or `happy-dom` override values and require every
   override glob to identify one already selected typed-test file exactly.
4. Extend semantic patch targets only for the exact root path
   `pnpm-lock.yaml`; do not admit another root target.
5. Patch0005 adds exact `jsdom: 28.1.0` to the dashboard dev dependencies and
   the matching frozen root lockfile resolution. It does not change product
   source or historical patch bytes.
6. Binding023 preserves binding006 as its exact predecessor, appends patch0005,
   binds the current private builder/test postimages, and assigns only
   `src/oew/navigation.test.tsx` to `jsdom`.
7. The generalized builder installs with `--frozen-lockfile --ignore-scripts`
   into a fresh isolated store, runs the selected typed tests, builds the
   dashboard, retains only declared outputs, and removes its workroot/store.
8. Browser acceptance uses the shared Playwright Chromium runtime, rejects all
   external requests, and checks Enter, Space, non-activation keys, inspector
   dismissal focus return, inert geometry, and scene-heading fallback.

## Dependency and runtime pin

- Node: `v22.12.0`, locked by `L1-TOOLCHAIN.lock.json`
- pnpm: `10.6.2`, locked by `L1-TOOLCHAIN.lock.json`
- Vitest: resolved `3.2.4` from the frozen upstream lock
- DOM runtime: exact `jsdom@28.1.0`
- jsdom engine evidence: `^20.19.0 || ^22.12.0 || >=24.0.0`

The exact dependency fetch is authorized only for packages named by the
successor frozen lockfile, without tokens, credential persistence, install
scripts, or unrelated network access.

## Validation

All obligations are acceptance-critical:

1. focused private builder tests;
2. staged patch dry-run and required reapply failure;
3. binding predecessor, postimage, environment, patch-target, and output checks;
4. one generalized frozen-lockfile build;
5. exact 7-file/15-test typed receipt;
6. retained dashboard-dist and semantic patch snapshot identity;
7. local Chromium keyboard/focus acceptance with external requests blocked;
8. protected binding006 and patch0004 digest equality;
9. scoped `git diff --check`.

Any failed obligation leaves the package `BLOCK`; it cannot be downgraded to a
flag. Passing evidence proves a private candidate-local prototype only.

## Deferred reconciliation

Per-unit Invoke Refresh, parent OEWSN status projection, SWU007 selection, and
reusable lifecycle bookkeeping are deferred to the Handoff Notice published
before product mutation. Validation and the terminal prototype receipt are not
deferred.

## Candidate-local completion

Both ordered units are complete within the bounded prototype fast lane:

| Unit | Result | Evidence |
| --- | --- | --- |
| `SWU-OEWFR-008` | `PASS` | 27/27 focused private-builder tests; per-file DOM environment validation and the exact root-lock patch boundary exercised |
| `SWU-OEWSN-023` | `PASS` | frozen install, 7 files/15 typed tests, core and dashboard builds, retained immutable outputs, and local Chromium keyboard/focus acceptance |

Consolidated evidence:

- [Prototype validation report](config-side-repair/20260804T035543Z/PROTOTYPE-VALIDATION-REPORT.md)
- [Terminal candidate-local receipt](config-side-repair/20260804T035543Z/receipt.json)
- [Materialized provenance package](config-side-repair/20260804T035543Z/material-package.json)
- Handoff Notice `HN-7FD18359D48D` owns the deferred lifecycle synchronization.

The first browser-harness attempt used a query filter that hid the node needed
for the focus-return assertion. It wrote no acceptance evidence and changed no
product material. The bounded harness recovery removed that filter; the second
attempt passed against the same retained build.

Completion here does not synchronize the parent OEWSN work pack, select
`SWU-OEWSN-007`, publish, deploy, or release the prototype.
