---
module: ontology-evidence-workbench-config-side-dom-repair
status: candidate-local-pass
updatedAt: 2026-08-04
docType: prototype-validation-report
---

# OEW Config-Side DOM Repair: Prototype Validation

## Result

`PASS` — the selected config-side repair is implemented and tested as a
private candidate-local prototype.

The default Vitest environment remains Node. Only
`src/oew/navigation.test.tsx` runs under exact `jsdom@28.1.0`. The successor
binding and patch add the dependency through the frozen upstream root lockfile
without rewriting binding006 or patch0004.

## Material completed

| Unit | Result | Material |
| --- | --- | --- |
| `SWU-OEWFR-008` | `PASS` | private builder accepts one exact root lock target and one per-file DOM environment; focused contract suite passes 27/27 |
| `SWU-OEWSN-023` | `PASS` | immutable binding023 plus patch0005; generalized build and browser witness retained |

The materialized provenance package passed the Invoke material validator:
schema, owner boundary, dependency identity, publication boundary, and patch
verdict are all `pass`.

## Build and test proof

- patch0003, patch0004, and patch0005 each apply once; required reapply checks
  reject a second application;
- frozen `pnpm` install: exit 0, isolated store, install scripts disabled;
- core build: exit 0;
- selected typed tests: 7 files, 15 tests, 15 passed, 0 failed;
- dashboard build: exit 0;
- dashboard output: 19 files, 2,790,770 bytes, tree
  `38ed5045b9972b1e3dec26074027d04b9ed917adf18804ea39661b315aa6bc93`;
- semantic patch snapshot: 4 files, 75,319 bytes, tree
  `60ca3521f50b8fe5607279018361d0cb7479292aba428719a6b7aa41d8e938a9`;
- workroot and isolated dependency store were removed; declared output remained.

Build evidence:
[semantic-navigation-build-handle.json](../../../../../implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/20260804T035543Z/semantic-navigation-build-handle.json).

## Browser proof

Local Chromium acceptance passed against the retained Body War build:

- inert geometry is excluded from relation activation;
- ArrowRight does not activate the relation;
- Enter and Space open the exact selected relation;
- inspector dismissal restores relation focus;
- changing to a node while return focus is armed falls back to the scene heading;
- the fail-closed surface is absent;
- page errors: 0;
- completed external requests: 0.

Evidence:
[acceptance receipt](../../../../ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/20260804T035543Z/browser-evidence/acceptance-receipt.json),
[keyboard/focus receipt](../../../../ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/20260804T035543Z/browser-evidence/browser-evidence-receipt.json), and
[screenshot](../../../../ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/20260804T035543Z/browser-evidence/keyboard-focus.png).

## Bounded recoveries

The first browser-harness attempt included a URL query filter that hid the node
needed for the scene-heading fallback assertion. It produced no acceptance
receipt or screenshot and changed no product material. Removing that
harness-only filter produced the passing witness against the same retained
build.

The first consolidated material-package validation also rejected a package
owner-label mismatch. Normalizing the package-level lifecycle label fixed the
evidence package; no product material changed.

## Boundary and handoff

Protected predecessor identities remain unchanged:

- binding006:
  `1cf2f37ca9e675b15e39a5734beab0e56c11ec9155594328e145810bbb14c756`;
- patch0004:
  `3115eecc439dd0288977883941a15bcb27ca5d2d544abeeeeb97b2113714749a`.

Handoff Notice `HN-7FD18359D48D` owns the deferred per-unit Invoke Refresh,
parent OEWSN projection, SWU-OEWSN-007 selection, and lifecycle synchronization.

This proof does not establish full-graph usability, synchronized governance,
ontology authority, promotion, publication, release, deployment, production,
or human outcomes. No commit or push was performed.

Terminal evidence:
[candidate-local receipt](receipt.json) and
[materialized provenance package](material-package.json).
