# TASK-OEWSN-02: Relation Rendering and Keyboard Operation

Status: SWU-OEWSN-005 complete-terminal-pass; SWU-OEWSN-006 blocked before product mutation on `BLK-OEWSN-006-DEPENDENCY-FETCH-AUTHORIZATION`. Attempt `20260803T161544Z` remains immutable BLOCK history for the now-resolved material-ownership contradiction. The repaired `binding006+0004` shape passes 21 builder contracts plus cumulative-binding and exact-diff validation in attempt `20260803T165509Z`, but the mandatory fresh-store generalized build has no unconsumed SWU006 dependency-fetch authorization. Both candidate material files remain session-staged and absent from live product paths. Do not select or execute SWU-OEWSN-007.

## Objective

Use only the versioned relation record to make relation identity visible,
non-color-recoverable and role-sensitive for keyboard users.

## Implementation detail

Render exact predicate text, arrow/direction, source/target, provenance and
authority from the record. CSS tokens are generated from profile mapping keys,
not edge IDs. Inert geometry has no tab stop or activation role. Actionable
instances use one documented focus model and open the exact relation inspector
with Enter/Space.

## Smallest Working Units

### SWU-OEWSN-005 — Render redundant relation semantics

- Latest terminal result: PASS in attempt `20260803T154613Z`; the earlier `BLK-OEWSN-005-OFFLINE-INSTALL` receipt remains immutable history.
- Current material: immutable binding
  `d66c0262994fd3ace8335b67da260663f307bd6708d4bc5089c6a8c07f738275`
  and patch 0003
  `f862611f93e718997aedf2eb987fc5f6d018facad8096b357095caafaf4c5f58`
  are retained candidate-local bytes. The exact generalized build handle is
  `72bea508fbd707eb19eb06ae42325c059a742928ce632b6aa293eec48976be09`;
  immutable dashboard tree
  `65030bca3aedf2510785f589c184503dfe70a72119bcf332b1192171516ce819`,
  semantic patch snapshot tree
  `335fe230580bfc8e446cb75fd82b8463d54e03c3cd45445d2a8ddbd9832963e1`
  and browser receipt
  `86eb41c159942bdb94a1983315210d8f1639ef3ba4f0f54d244f3ef233c48aff`
  are retained and PASS.
- Authorization completion: the 2026-08-03 immutable-lockfile fetch
  authorization was consumed exactly once by attempt `20260803T154613Z`.
  Node 22.12.0 and pnpm 10.6.2 completed the frozen build without supplied
  tokens, persisted credentials or unrelated network access. SWU-OEWSN-005 is
  complete; SWU-OEWSN-006 is selected but remains unexecuted and
  mutation-unauthorized.
- Prior terminal preflight: BLOCK under
  `BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION`; retained as immutable source
  evidence.
- Planning repair: complete. SWU-OEWSN-022 owns the reusable builder evolution;
  terminal receipt
  `planning/work-pack/session-evidence/SWU-OEWSN-022/20260802T135709Z/receipt.json`
  and owner closeout
  `planning/refresh-runs/20260802T135709Z-SWU-OEWSN-022-closeout/refresh-report.json`
  PASS. They bind builder postimage
  `6a762811808932c698ebebb7eb176b27bf7f65c5153ef03edc9010a26c9aee24`
  (64405 bytes) and test postimage
  `bdb5d6440533134c23fd6504f45ae4214ec59f12b751e68574b2ba327134de18`
  (24823 bytes), satisfying the predecessor condition for selected
  SWU-OEWSN-005.
- Historical overlay product files changed: zero; two candidate-local material
  files were added under the dedicated semantic-navigation binding/patch seam.
- Preserved residue: `OEWSN-RELATION-DUPLICATE-TUPLES`; ambiguous source tuples
  must continue to fail `GRAPH_EDGE_AMBIGUOUS`.

- Primary behavior: the selected relation shows exact fields and stable
  predicate color/presentation pattern with non-color redundancy
- Independent acceptance: selected-edge default/grayscale/forced-color witness
- Split analysis: visual structure, token mapping and exact label are one
  semantic rendering boundary; keyboard activation is independently SWU-006
- Dependencies: SWU-004
- Source anchors: CR-01, Design Relation Visual Language and quality extension
- Dependencies: SWU-OEWSN-004 and SWU-OEWSN-022.
- Material write scope: new immutable per-unit binding
  `OEWSN-BUILD.SWU-OEWSN-005.binding.json` and cumulative patch
  `0003-oew-semantic-navigation.patch` only.
- Logical patch targets: `OewApp.tsx`, `EvidenceWorkspace.tsx`,
  `EvidenceInspector.tsx`, `oew.css` and new `relationRendering.test.tsx` in the
  isolated source tree. The four historical overlay files are read-only and
  must not be edited in place.
- Cumulative build contract: the per-unit binding references the exact v1
  predecessor binding digest, preserves its historical base, binds the
  generalized builder/test postimages from SWU-OEWSN-022, binds patch 0003 and
  typed-test identities, and derives owner/output identity from SWU-OEWSN-005.
  Patch 0003 applies exactly once after byte-verifying and applying patches
  0001–0002; path escape, reapplication, collision, apply failure and
  owner/output mismatch fail closed.
- Exact execution outputs: build handle, immutable `dashboard-dist/`, retained
  `semantic-patch-snapshot/`, tree-bound `browser-evidence/` and terminal Task
  Session receipt under the selected SWU and fresh attempt identity.
- Done: renderers consume no raw edge semantics; named graphics meet 3:1;
  exact text/direction survives color removal
- Acceptance evidence: component tests, screenshot/DOM/contrast artifacts
- Validation: focused typed tests and selected-edge Chromium matrix
- Execution owner: subagent or local fallback
- Handoff: complete-terminal-pass. Exact build, typed, immutable dashboard, patch-snapshot and three-mode browser evidence are bound by the terminal receipt.

### SWU-OEWSN-006 — Enforce role-sensitive edge keyboard behavior

- Primary behavior: only actionable relation instances enter focus and activate
- Independent acceptance: inert edge tab count zero; actionable edge has
  visible focus, exact accessible name, Enter/Space result and restoration
- Split analysis: focus membership and activation must close together to avoid
  a focusable no-op; rendering semantics already pass in SWU-005
- Dependencies: SWU-005
- Source anchors: CR-02, activation/result/dismissal/restoration matrix
- Material write scope: new immutable per-unit binding
  `OEWSN-BUILD.SWU-OEWSN-006.binding.json` and cumulative successor patch
  `0004-oew-semantic-navigation-keyboard.patch` only.
- Logical patch targets: `keyboard.ts`, `store.ts`, `OewApp.tsx` and
  `navigation.test.tsx` in the isolated source tree. Historical overlay files
  are read-only and patch 0003 remains byte-identical.
- Cumulative build contract: binding 006 references the exact binding 005
  digest, preserves its historical base and additive overlay, repeats patch
  0003 exactly as predecessor-owned material, appends patch 0004 exactly once,
  binds the post-patch typed-test inventory, and derives only SWU-006 build,
  dashboard, semantic-patch-snapshot and browser outputs.
- Exact execution outputs: build handle, immutable `dashboard-dist/`, retained
  `semantic-patch-snapshot/`, keyboard-only `browser-evidence/` and terminal
  Task Session receipt under the fresh SWU-006 attempt identity.
- Done: documented direct/roving model and complete exact-instance round trip
- Acceptance evidence: keyboard trace, accessibility snapshot and focus ledger
- Validation: focused typed tests plus keyboard-only Chromium assertion
- Execution owner: subagent or local fallback
- Handoff: blocked-terminal-dependency-fetch-authorization. Attempt
  `20260803T165509Z` preserves a coherent staged binding006 and patch0004, but
  stops before producer validation and fresh consumer admission because the
  acceptance-critical full build requires an unapproved dependency fetch.

## Failure modes

Color-only identity, arbitrary per-edge color, focus on inert geometry,
Enter no-op, inspector mismatch, hidden exact predicate, missing marker or
restoration failure blocks the task. Editing historical overlay files in place,
stale mutation admission, an unowned cumulative build evolution, mutation of
binding 005 or patch 0003, a patch that does not apply exactly once after
patches 0001–0003, or unreachable mandatory
build/browser evidence also blocks before product mutation. The prior blocker
receipt remains history; any recurrence must return a new fingerprint rather
than silently reopening the resolved planning receipt.

Current blocker `BLK-OEWSN-006-DEPENDENCY-FETCH-AUTHORIZATION` is owned by the
user: authorize one exact SWU006 generalized-build fetch of only dependencies
named by the immutable upstream pnpm lockfile, with no tokens, credential
persistence or unrelated network. Then rerun a fresh producer package and
consumer admission before copying either staged material file live.

The prior `INSTALL_FAILED` remains acceptance-critical historical evidence. The
2026-08-03 authorization resolves only the narrow dependency-fetch gate; Invoke
Refresh did not fetch, install, build, test or produce browser witnesses.
