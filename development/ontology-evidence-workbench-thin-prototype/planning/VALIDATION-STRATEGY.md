# Validation Strategy

## Evidence ladder

| Stage | Positive proof | Negative proof | Receipt |
| --- | --- | --- | --- |
| typed executable-loader admission | strict TypeScript, exact focused tests, and exact OewApp `/oew-data/` same-origin composition pass | `@ts-nocheck`, weakened strictness, stale manifest, undiscovered tests, relative-base throw, cross-origin/malformed base, or missing token blocks | SWU-OEWTP-001 |
| Vite build | fresh pinned workroot produces retained immutable dist | source/tool/overlay/patch drift, ambient fallback, output collision/overwrite, or build failure blocks | SWU-OEWTP-002 |
| gateway | exact retained dist, authenticated assets, and three explicit-token evidence documents served on loopback | missing/bad bootstrap token, forged/missing cookie, cookie-only data request, traversal, fourth data route, non-loopback, proxy/outbound, or digest mismatch blocks | SWU-OEWTP-003 |
| browser | all named Poker-Team assertions pass in the resolved Chromium | console error, outbound request, missing trust/trace/residue/parity/source/authority evidence blocks | SWU-OEWTP-004 |
| closure audit | four source/owner receipts and all source/build/browser/teardown bindings recompose at the bounded claim ceiling | stale, missing, mismatched, leaked child, occupied port, residual root, or inflated claim blocks | TASK-OEWTP-VERIFY |

## Mandatory exact browser assertions

1. URL is `/?oew=1&token=<run-token>` on `127.0.0.1`.
2. Trust rail is visible and exposes the source run and
   `authority_effect: none`.
3. F1 is the opening evidence.
4. Grounding trace reaches R1 then D1.
5. D2 is visible as conflict residue.
6. Outline and table preserve the selected source reference.
7. Inspector source path/digest matches the admitted Poker-Team source.
8. Receipt drawer exposes the pinned commit and terminal receipt.
9. No edit, accept, promote, publish, or deploy action exists.
10. No unexpected console error or outbound request occurs.
11. Browser and gateway close, port releases, and temporary roots are absent.
12. An unknown deep link visibly recovers to F1.
13. Keyboard-only operation opens search, switches view, opens inspector and
    receipt drawer, and dismisses/recovery states without a pointer.

Authentication negatives distinguish layers: an invalid/missing bootstrap token
must return HTTP 401/403 before the app renders; a valid bootstrap followed by
bundle identity/digest/schema failure must render the in-app fail-closed alert
and no graph.

## Command shape

Commands are exact per SWU task contract. Runtime paths and ephemeral values are
resolved at Task Session preflight and written into the receipt; no package
manifest edit is used to pin them.

Browser preflight also validates the global CLI realpath, adjacent package
identity/version, absolute `index.mjs` API import, `chromium.launch` presence,
and `chromium.executablePath()` from that imported API. The returned executable
is launched, versioned, and hashed through the same API. CLI dry-run output is
diagnostic only. Bare local module resolution is neither assumed nor repaired
with a dependency.

## Claim ceiling

A complete passing ladder proves one local automated Poker-Team OEW journey. It
does not prove ontology correctness, human product acceptance, release,
deployment, production, or general runtime capability.
