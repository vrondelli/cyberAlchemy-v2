# Operations: OEW Thin Prototype

## VerifyExactInputs

**Type:** Operation  
**Actor:** local Task Session runner

Input: pinned upstream lock/archive, current overlay and patch allowlists,
Poker fixture, adapter graph/sidecar/receipt, and predecessor receipts.

Rules:

| ID | Rule |
| --- | --- |
| R1 | Every admitted path exists, is contained, and matches its declared digest |
| R2 | OEW-owned manifest count stays one and no new package manifest appears |
| R3 | Input failure stops before install, server, or browser |
| R4 | Inventory, ontology, authority, and the old OEW package remain read-only |

Postcondition: emit an exact input inventory into the current run receipt.

## CloseTypedOverlay

**Type:** Operation  
**Actor:** Task Session for `SWU-OEWTP-001`

Repair strict-TypeScript errors in `types.ts`, `loadOewBundle.ts`, and
`store.ts`. In `loadOewBundle.ts`, also repair the measured composed-URL defect:
resolve the relative `/oew-data/` base against the current page origin, reject a
cross-origin/malformed base before fetch, then append the token. Synchronize
only the existing overlay source manifests that must bind those bytes. Do not
add `@ts-nocheck`, weaken strictness, change the bundle schema, edit
`OewApp.tsx`, or edit any package manifest.

Postcondition: focused typed tests, the exact OewApp-to-loader composed request
probe, and the dashboard TypeScript build pass against the materialized pinned
workspace.

## BuildThinDashboard

**Type:** Operation  
**Actor:** build-from-owned runner

1. Create a fresh temporary workroot.
2. Verify and extract the pinned archive.
3. copy the exact admitted overlay and apply the entry patch once.
4. Run frozen install with isolated store and ignored scripts.
5. Build core explicitly.
6. Run the explicitly named typed OEW tests.
7. Run dashboard `tsc -b && vite build`.
8. Copy the completed dist into the pre-bound immutable generated-run path and
   record its tree digest in a retained build handle.
9. Clean only the scratch workroot and isolated store in `finally`.

Any failure produces a blocked receipt and no serve/browser handoff.

## ServeEvidenceGateway

**Type:** Operation  
**Actor:** local gateway runner

Serve one immutable retained dashboard dist tree and exactly three
`/oew-data/*` documents on `127.0.0.1`. Authenticate the initial HTML request
with a query token, then set a run-scoped `HttpOnly; SameSite=Strict; Path=/`
cookie for static assets. Require the explicit query token on every data
request because the dashboard loader uses `credentials: "omit"`. Reject
traversal and unknown routes, prohibit proxying, persist only the token digest,
and record closure.

## RunPokerBrowserWitness

**Type:** Operation  
**Actor:** exact global Playwright Chromium runner

Open `/?oew=1&token=<token>`, complete the Poker-Team journey, capture exact
assertions, fail on console errors or outbound requests, then close browser,
gateway, port, and temporary roots in `finally`.

Postcondition: emit `browser-acceptance.json` plus request, console, screenshot,
and teardown evidence. A read-only Task Session closure audit may accept that
evidence only for the bounded local-prototype claim; independent immutable
verification is deferred to L2.
