# Operations

## `verifyBundle(path)`

Calls the existing independent terminal-receipt verifier. Returns a
`VerifiedRunHandle` only on a current pass. No adapter output is created on
failure.

## `projectForViewer(handle)`

Reads the verified result/projection/receipt bytes, emits deterministic
`presentation-graph.json` and lossless `evidence-sidecar.json`, then verifies:

1. source IDs are total and unique;
2. every presentation object resolves to source evidence;
3. generalized mappings are allowlisted and labeled as projections;
4. exact relations/dispositions remain available in the sidecar;
5. output is written only to a new run-scoped OEW directory.

## `serveWorkbench(adapterRun)`

Starts a loopback-only, token-gated, read-only server. It serves static assets
and admitted adapter artifacts. It exposes no mutation endpoint and makes no
outbound runtime request.

## `selectEvidence(ref)`

Updates ephemeral shared selection state across graph, outline, table, and
inspector. It never writes the source bundle.

## `runGuidedTour(tourId)`

Advances through a deterministic ordered list of source object IDs. The Poker
tour uses `F1`, `R1`, and `D1`; it calls out `D2` without adding it to the
grounding path.

## `attachCodeContext(codeGraph, mapping)`

Optional later-layer operation. Validates namespaces and explicit mappings,
then adds a separately styled code lane. It cannot create or change evidence
relations.

## Failure Order

1. source path and containment;
2. terminal receipt verification;
3. supported schema/version;
4. authority-effect guard;
5. total mapping and referential integrity;
6. deterministic output comparison;
7. local serving boundary.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
