# TASK-OEWTP-03: Fail-Closed Evidence Gateway

## Objective

Implement one owned loopback gateway that serves the immutable dashboard dist
and exactly the verified Poker adapter graph, sidecar, and receipt.

- Layer/slice: L1 / S-003
- Wave: W3
- SWU: `SWU-OEWTP-003`
- Dependency: SWU-OEWTP-002 pass and owner closeout

## Source contracts

- [Architecture security/interface views](../../../design/ARCHITECTURE.md)
- [Define interface](../../../define/interfaces.md)
- admitted post-SWU-001 loader contract:
  `upstream/overlay/packages/dashboard/src/oew/{OewApp.tsx,loadOewBundle.ts}`
  plus the predecessor token-handoff probe
- existing `scripts/serve-native-viewer.mjs` safety functions and tests
- exact adapter run:
  `generated/runs/SWU-OEW-004/{presentation-graph.json,evidence-sidecar.json,adapter-receipt.json}`
- expected adapter receipt SHA-256:
  `d60fe2048800a1c376dc9d7f04afbfed314f619783d0cb0059059597704ebb01`

## Smallest Working Unit: SWU-OEWTP-003

### Primary behavior

One tokenized loopback boundary maps an admitted dist and exactly three
identity/digest-bound evidence documents while rejecting every other access.

### Split analysis

Static serving, data mapping, token authorization, request validation, and
teardown are candidate children. They are not independently safe acceptance
boundaries: a server missing any one is an insecure or semantically incorrect
gateway. The combined route contract is the unit.

### Write scope

- `scripts/serve-oew-prototype.mjs`
- `contracts/oew-prototype-gateway-handle.schema.json`
- `test/oew-prototype-gateway.test.mjs`
- `generated/runs/SWU-OEWTP-003/<attempt-id>/gateway-handle.json`
- `../../development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-003/<attempt-id>/receipt.json`

No modification to the native-viewer script is required. Reuse helpers only
when their ownership and semantics remain clear; do not turn it into a generic
server framework.

### Runtime admission

Use `../../MUTATION-ADMISSION-CONTRACT.json#SWU-OEWTP-003`.
The gateway script, schema, and test are `materialWrites`; the gateway handle
and terminal receipt are `executionOutputs`. The gateway test produces and
verifies the handle, closes the owned server, and only then permits the
terminal receipt as the final write.

### Algorithm

1. Parse exact inputs:
   `serve --build-handle <path> --adapter-run <path> --output <path>`.
2. Verify the build handle schema/result/current source bindings and dist tree.
3. Resolve the adapter run inside `generated/runs`, invoke the existing adapter
   receipt verifier, and bind graph, sidecar, receipt bytes/digests.
4. Confirm bundle schemas, upstream commit, total source mappings,
   `authority_effect: none`, the expected receipt digest used by `OewApp`, and
   the SWU-OEWTP-001 proof that the admitted post-repair `OewApp` passes the
   page token to `loadOewBundle` and that `tokenizedUrl` resolves the relative
   base same-origin and adds the token to all three credentials-omit requests.
   These loader files are read-only in this SWU.
5. Generate a 256-bit token in memory and bind an ephemeral port on
   `127.0.0.1`.
6. Require the query token on the initial HTML request. On success set one
   run-scoped `HttpOnly; SameSite=Strict; Path=/` cookie for static assets and
   set `Referrer-Policy: no-referrer`. Missing/invalid bootstrap authentication
   returns HTTP 401/403 without protected bytes.
7. Serve immutable dashboard assets with cookie-or-explicit-token
   authentication, containment, symlink, MIME, and no-cache rules appropriate
   to the local run.
8. Serve only:
   `/oew-data/presentation-graph.json`,
   `/oew-data/evidence-sidecar.json`, and
   `/oew-data/adapter-receipt.json`.
9. Serve the unchanged admitted loader contract: `OewApp` reads the bootstrap
   query token, passes it to `loadOewBundle`, and `tokenizedUrl` constructs all
   three same-origin absolute explicit-token URLs while fetch keeps
   `credentials: "omit"`. Require
   that explicit token for every `/oew-data/*` request; the bootstrap cookie is
   insufficient for these data routes. Persist only the token digest. If the
   predecessor probe or current admitted bytes do not prove this behavior,
   block and return to SWU-OEWTP-001 rather than rewriting the loader here.
10. Reject unsupported methods, malformed/oversized/encoded/traversal targets,
   unknown data routes, path escape, non-loopback bind/target, upgrade/proxy,
   and outbound behavior.
11. Emit the gateway handle at its pre-bound unique path containing PID
    ownership, port, redacted URL shape,
    build/adapter digests, route inventory, token digest, and readiness.
12. Write the Task Session receipt at its pre-bound session-evidence path.
13. Export a parent-owned close function or child protocol suitable for the
    browser runner. In `finally`, close server and verify port release.

### Negative fixture bank

- missing and bad token;
- bootstrap-cookie omission, forged cookie, and cookie-only `/oew-data/*`;
- `/oew-data/fourth.json`;
- dot, encoded-dot, encoded-slash, backslash, NUL, and symlink traversal;
- POST/PUT/upgrade;
- non-loopback bind and proxy target;
- tampered dist, graph, sidecar, or receipt;
- mismatched receipt expected digest;
- valid bootstrap followed by invalid bundle identity/digest/schema must render
  an in-app fail-closed alert and no graph; invalid bootstrap remains HTTP-only;
- double start/output overwrite;
- close failure or port still accepting connections.

### Done criteria

- positive handle validates and is bound to the exact build/adapter inputs;
- every negative fixture fails without leaking protected bytes;
- outbound request count is zero;
- bootstrap, asset-cookie, explicit data-token, and in-app bundle-failure
  behavior are independently covered;
- server closure and port release pass on success and failure;
- `node --test test/oew-prototype-gateway.test.mjs` passes.

### Execution handoff

- Owner: one bounded subagent under Task Session
- Handoff must include the verified SWU-002 build handle and the exact adapter
  run
- Expected result: standard SWU receipt plus gateway handle, request-bank
  results, closure, and residue
- Closeout: exact `SWU-OEWTP-003` row in
  [CLOSEOUT-SYNC-INVENTORY.json](../../CLOSEOUT-SYNC-INVENTORY.json)
- Successor: SWU-OEWTP-004 only after both receipts pass

## Completion evidence

- [Result](../results/SWU-OEWTP-003-RESULT.md)
- [Terminal Task Session receipt](../session-evidence/SWU-OEWTP-003/20260729T184807Z/receipt.json)
- Gateway handle:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-003/20260729T184807Z/gateway-handle.json`
