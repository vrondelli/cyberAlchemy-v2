# Plan Context

## Objective

Convert the passing OEW thin-prototype Design into one navigable,
	medium-complexity work pack that can deliver an evidenced local Poker-Team
browser journey without modifying the old OEW development package or adding a
package manifest.

## Approved Design handles

- [Architecture](../design/ARCHITECTURE.md)
- [UX Plan](../design/UX-PLAN.md)
- [Glossary consistency](../design/GLOSSARY-CONSISTENCY.md)
- [Design scope](../design/DESIGN-SCOPE-MANIFEST.json)
- [Design denominator](../design/DESIGN-DENOMINATOR-RECEIPT.json)
- [Design selection](../design/DESIGN-SELECTION-RESULT.json)
- [Planned witnesses](../design/PLANNED-WITNESSES.json)

Design selection result:

- verdict: pass
- evidence state: `design-validator-pass`
- fixed point: true
- result digest:
  `5faeabb533472d8861e73f6d54342fa79b056c183b9c5f0a505d162efba851ac`

## Delivery boundary

Included:

- strict typing repair and exact admission of three measured overlay modules;
- one build-from-owned producer using the existing pinned workspace;
- one token-protected loopback dashboard/evidence gateway;
- one exact global Playwright/Chromium Poker-Team journey;
- one read-only Task Session receipt/claim-ceiling audit;
- Task Session closeout only into this new development package.

Excluded:

- changes to `cyberAlchemy-v2/development/ontology-evidence-workbench/`;
- new `package.json`, copied dependency graph, or generalized runtime;
- independent immutable L1 verification ceremony in the fast lane;
- ontology/authority mutation, editing, promotion, release, deployment,
  production, Firefox, or full accessibility/responsive certification.

## Current browser tool observation

Advisory evidence observed on 2026-07-29:

- Playwright CLI: `1.59.1`
- Chromium selected by that CLI: build `1217`, Chrome for Testing
  `147.0.7727.15`
- current executable:
  `/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`
- current executable SHA-256:
  `696170a79640ec5b50c7518140ace06c69a49cfb295bf527d4a85e26a12b89a7`
- current CLI realpath:
  `/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright/cli.js`
- current CLI entry SHA-256:
  `5e79302a6aad7d835d92d5ae6b4244c91cf61b28e94d7917279090e6c231f7a1`
- current package manifest SHA-256:
  `f5c873af32da3a56849a77a73eb4e6acf9629d58564ba420077feea88800225c`
- current API entry:
  `/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright/index.mjs`
- current API entry SHA-256:
  `a0f5715ea22354f922791a9c53dc012d5d5c067ff9cc4cd35ffb7cd272071a9f`

This observation is not a permanent hard-coded admission SHA. The browser SWU
must import the API adjacent to the active Playwright CLI, call that API's
`chromium.executablePath()`, hash the returned executable, launch it through the
same API, and bind all identities into the current receipt. CLI
`install --dry-run` may cross-check the observation but is not the resolver. A missing,
incompatible, or changing executable blocks that run without causing a package
manifest edit.

The Node acceptance test must not rely on normal local `import "playwright"`
resolution. It derives the global package root from the CLI realpath, validates
that package's name/version/export, and imports its exact `index.mjs` by file
URL. A preflight API smoke import must pass before any gateway/browser launch.

## Planning assumptions

- the research-measured 48-error distribution is current until SWU preflight
  proves otherwise;
- source manifests that bind the three repaired overlay files are part of the
  same atomic typed-admission behavior;
- each later SWU consumes an immutable predecessor receipt rather than
  reopening old work-pack selection;
- each Task Session binds one concrete collision-resistant attempt ID and exact
  source/generated/session/closeout paths before source mutation;
- Task Session generates a fresh strict Context Builder handoff pack at runtime.

## Distill-discovered runtime defect

During Plan validation, the exact current composition
`new URL("presentation-graph.json", "/oew-data/")` was executed and raised
`TypeError: Invalid URL`. The isolated token logic was therefore insufficient:
the relative base supplied by OewApp must first resolve against the current page
origin. This is an unexecuted repair contract assigned to SWU-OEWTP-001, not a
working-runtime claim or a reason to add a package.

## Historical lock compatibility

SWU-OEWTP-001 repairs shared overlay bytes. Therefore the historical
`upstream/L1-BUILD.lock.json` will become stale by design even though it is not
edited. The thin lane does not consume that lock or its protected-set snapshot.
Re-binding the preserved independent L1 lane is an L2 follow-up after a browser
witness, not a fast-lane prerequisite. This predictable staleness must appear
as residue in SWU-OEWTP-001 and may not trigger an implicit old-package Refresh.
