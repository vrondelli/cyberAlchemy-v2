# Work Pack — OEW Native Focus Scene

Work Pack ID: `WP-OEW-FOCUS-001`  
Layer: L1 prototype  
Authority effect: none

## Outcome

Replace the Body War viewer's whole-graph tour/focus behavior with one
deterministic native scene: exact tour nodes, internal relations, and labeled
crossing portals. Activating a portal pivots to a one-hop scene with a local
breadcrumb and Back path.

## Evidence baseline

- browser target: default knowledge dashboard `/?token=...`, not `?oew=1`;
- frozen baseline: 237 nodes, 231 edges;
- first tour scene: four exact context nodes, zero internal relations, six
  crossing portals;
- literal boundary:
  `Identity and Consent —related to→ Authentication and Consent`;
- evidence sidecar retains `source_relation=owns`,
  `presentation_relation=related`, evidence refs, and
  `authority_effect=none`.

## Selected design

Add a pure projection model and a small portal control, then apply one
preimage-bound upstream patch to `KnowledgeGraphView.tsx`. The default viewer
continues to own loading and graph selection. The focus model consumes the
existing graph and optional same-origin sidecar; it creates no editorial
dataset.

Rejected:

- custom `OewApp` implementation — wrong observed surface and Poker-specific;
- static atlas embedding — duplicates presentation state;
- launcher-only route — does not repair the 237/231 defect.

## Ordered SWU

```text
completed 007T → completed FOCUS-001 → completed FOCUS-002 preview
                                      ↘ unsynchronized 013B → 014 → 014V
                                      ↘ completed FOCUS-TEST-001
                                         (automated; human comparison pending)
```

### SWU-OEW-FOCUS-001 — Native scene source and build binding

Dependencies: passing `SWU-OEW-007T` receipt.

Exact implementation inventory:

- `upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts` — create;
- `upstream/overlay/packages/dashboard/src/components/KnowledgeFocusPortals.tsx` — create;
- `upstream/patches/0002-knowledge-focus-scene.patch` — create;
- `test/focus-scene.test.mjs` — create;
- `upstream/overlay/overlay-manifest.json` — update;
- `upstream/overlay/first-working-version-manifest.json` — update;
- `upstream/L1-BUILD.lock.json` — update.

Acceptance:

1. Reproduce 237 nodes/231 edges from the frozen Body War graph.
2. First tour scene derives the exact four node IDs, zero internal edges, and
   six deterministically sorted crossing portals.
3. The literal identity-to-authentication portal exposes display predicate
   `related`, original predicate `owns`, direction, evidence refs, and
   `authority:none`.
4. The unrelated Suggested Track entity is absent.
5. Pointer, Enter, and Space portal activation produce byte-equivalent focus
   and history state; Back restores the source focus.
6. Focus on a non-tour node derives the deterministic one-hop scene.
7. The patch applies exactly once to the frozen upstream preimage and fails on
   reapplication.
8. The new focused runner (under pinned Node type stripping), all seven existing focused runners, full dashboard
   tests, and fresh `tsc -b && vite build` pass in a disposable locked
   workroot.
9. Package manifests and protected paths are unchanged; the workroot is
   absent after cleanup.

Closeout:

- terminal source receipt under
  `planning/work-pack/session-evidence/SWU-OEW-FOCUS-001/`;
- synchronize the legacy OEW frontier so 013B depends on the focus receipt;
- stop with 013B eligible but unselected.

### SWU-OEW-FOCUS-002 — Thin preview and authenticated browser witness

Dependency: passing `SWU-OEW-FOCUS-001` receipt.

This is a compatibility preview, not a reopening or completion of legacy
`SWU-OEW-013B`.

Exact implementation inventory:

- `scripts/build-thin-prototype.mjs` — apply and bind every ordered overlay
  patch, retaining the first-patch compatibility field;
- `test/thin-prototype-build.test.mjs` — prove multi-patch admission and
  rejection behavior;
- `scripts/validate-body-war-browser.mjs` — accept one explicit retained build
  handle and assert the native scene;
- `upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts` — retain
  sidecar authentication after the upstream loader moves its token from the
  address bar into session storage;
- focus patch and binding documents — correct outward portal pivot semantics
  and rebind exact bytes;
- one new immutable `SWU-OEWTP-002` build attempt;
- one new `BODY-WAR-ONTOLOGY-BROWSER-001` browser attempt;
- one terminal focus-preview receipt.

Acceptance:

1. The builder verifies and applies both bound patches in declared order,
   verifies each preimage/postimage, and rejects reapplication.
2. A fresh retained dashboard build passes the existing six upstream typed
   tests and its immutable tree identity matches the build handle.
3. An authenticated loopback Chromium context loads the 237-node/231-edge
   graph, then the first tour shows exactly four React Flow nodes, zero
   internal edges, and six portal controls.
4. `Identity and Consent —related→ Authentication and Consent` exposes
   original relation `owns` and `authority_effect=none`.
5. Pointer activation pivots to a focus scene, exposes a local Back path, and
   Back restores the source focus.
6. The browser records one loopback origin, no failed responses, no
   console/page errors, a screenshot, and exact cleanup with the port released.
7. Package manifests remain byte-identical and all temporary workroots are
   removed.

Closeout:

- publish a terminal preview receipt under
  `planning/work-pack/session-evidence/SWU-OEW-FOCUS-002/`;
- leave the legacy `013B/014/014V` chain unsynchronized and unclaimed.

### SWU-OEW-FOCUS-TEST-001 — Automated A/B focus-scene evidence

Dependency: passing `SWU-OEW-FOCUS-002` receipt.

Outcome: run one repeatable, isolated comparison between the default 237-node
graph and the first four-node focus scene, then leave a separate novice-test
protocol for real participants.

Material inventory:

- `scripts/validate-body-war-focus-ab.mjs` — create one bounded runner without
  changing the accepted browser validator or focus implementation.

Execution outputs for attempt `20260730T203656Z`:

- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/baseline.png`;
- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/focus-scene.png`;
- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/portal-pivot.png`;
- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/result.json`;
- Task Session evidence under
  `planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/`.

Acceptance:

1. Consume the exact accepted immutable build handle and create a fresh
   headless Chromium context at 1440×1000 with service workers blocked.
2. Before Start Tour, prove and capture 237 nodes and 231 relations, with the
   tour entry visible.
3. After Start Tour, prove and capture the exact four context node IDs, zero
   internal edges, six sorted portal tuples, and absence of `SuggestedTrack`.
4. Preserve the literal portal's presentation relation `related`, source
   relation `owns`, direction, evidence refs, and `authority_effect=none`.
5. Capture the pointer pivot with a Back path, prove pointer, Enter, and Space
   produce equivalent target scenes, and prove Back restores the source scene
   after each activation.
6. Record one loopback origin, zero outbound requests, failed responses,
   console errors, and page errors.
7. Close page, context, browser, gateway, release the port, hash the three PNGs,
   and write one create-only `result.json`.
8. Preserve the accepted validator, focus source, package manifests, accepted
   run directories, Body War ontology, and CyberAlchemy ontology.
9. Publish a novice protocol for three anonymized participants with gates of
   at least 7/9 correct answers, at least 30% faster median answers in the
   focus condition, and 3/3 participants finding focus within 10 seconds.
   Keep its result `pending` until real observations exist.

Closeout:

- publish the terminal Task Session receipt beside the novice protocol;
- mark only this SWU completed when automated acceptance passes;
- select no successor and leave the human comparison pending.

Accepted automated evidence:

- attempt: `20260730T203656Z`;
- result:
  `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/result.json`
  (`sha256:a163a7ed0f5a503367faaf5304f520a3fe10e69266329971f6871bab82634043`);
- terminal Task Session receipt:
  `planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/receipt.json`
  (`sha256:c2774dc15cfe90843b3efa2c50fbc4a0b21410f473d29be595c4ddf8074f7e74`);
- automated acceptance: pass;
- human comparison: pending;
- successor: none.

## Claim ceiling

Passing FOCUS-001 proves deterministic structural focus behavior and one fresh
typed build. Passing FOCUS-002 additionally proves one immutable compatibility
preview and one authenticated local browser witness. Passing FOCUS-TEST-001
proves one repeatable automated A/B browser evidence run with named captures
and interaction equivalence. None proves the legacy 013B build, improved human
comprehension, accessibility conformance, ontology promotion, release,
deployment, or production readiness.
