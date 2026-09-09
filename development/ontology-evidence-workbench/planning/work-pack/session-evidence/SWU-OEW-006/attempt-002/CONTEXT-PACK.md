# SWU-OEW-006 Attempt 002 Context Pack

Mode: standard runtime handoff  
Coverage: strict  
Authority effect: none

## Objective

Serve the verified Poker adapter run through the exact pinned, unmodified
Understand-Anything viewer while enforcing the OEW local/read-only HTTP
boundary in an outer loopback proxy.

## Admitted Architecture

1. Independently verify the SWU-OEW-004 adapter receipt and the SWU-OEW-005
   upstream build receipt.
2. Extract the verified viewer archive into a contained temporary root and
   copy only the admitted `presentation-graph.json` into the viewer's expected
   `.ua/knowledge-graph.json` location.
3. Launch the unmodified viewer on an ephemeral private loopback port.
4. Expose a separate loopback-only proxy that requires the one-time token on
   every endpoint, permits only GET and HEAD, rejects traversal, and can proxy
   only to the verified child process at `127.0.0.1`.
5. Probe the Poker graph and all boundary negatives, stop both servers, remove
   the temporary root, and write the native-viewer receipt last.

This wrapper does not patch, fork, or repackage upstream viewer bytes.

## Covered Obligations

- `V1`: exact SWU scope and five-target inventory.
- `V2`: predecessor adapter and upstream evidence.
- `V3`: exact unmodified viewer artifact.
- `V4`: loopback, token, method, traversal, symlink, and outbound boundaries.
- `V5`: Poker feature/relation/decision load proof.
- `V6`: cleanup and receipt-last behavior.
- `V7`: package validation entrypoint selected by Decision Gate option A.
- `V8`: stop at G-OEW-L0; do not select L1.

## Write Scope

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/serve-native-viewer.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/native-viewer-boundary.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/native-viewer-poker.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-006/native-viewer-receipt.json`

## Validation

`npm run test:native-viewer`

