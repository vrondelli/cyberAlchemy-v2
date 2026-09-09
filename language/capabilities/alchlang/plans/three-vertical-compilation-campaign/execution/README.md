# AlchLang Compilation Campaign Execution

Status: authorized owner-local candidate execution. No publication, deployment,
or real external-effect authority.

This package realizes the three campaign verticals through the existing
DomainSpec v2 stable-foundation source compiler and a dependency-free
TypeScript reference generator.

See [RESULTS.md](RESULTS.md) for the generated bundles, counts, validation
results, and the exact-byte independent-review decision.

The current integrated reference set is replayed from this directory with:

```bash
npm test
```

This uses [CURRENT-INTEGRATION-REPLAY.v1.json](CURRENT-INTEGRATION-REPLAY.v1.json),
which binds the current AlchLang integration bytes while preserving the original
campaign authorization and independent acceptance unchanged. Its receipt is
`evidence/current-integration-replay.json`.

The immutable historical authorization remains explicitly checkable with:

```bash
npm run validate:historical-currentness
```

That diagnostic passes only when it observes the one expected historical drift
in `product-capability.json`; it does not reinterpret the old authorization as
current.

`build/` is deterministic generated material. The build command replaces only
that directory, compiles each lowered DomainSpec source with
`loadCompiledProjectGraph`, emits the planned TypeScript and ontology artifacts,
and proves two-run equality in temporary directories. The test command then
runs strict static TypeScript checking before validation executes the generated
tests, hostile compiler cases, current digest closure, traceability checks, and
writes the current and historical-currentness receipts.

The production-rollback vertical uses a sandbox adapter with no network or
process surface. Nothing here can address a real deployment endpoint.

The final validation replay uses the DomainSpec-declared Node 26.8.1 runtime.
The accepted bindings remain candidates for governed reference integration;
acceptance does not grant admission, publication, release, or deployment.
