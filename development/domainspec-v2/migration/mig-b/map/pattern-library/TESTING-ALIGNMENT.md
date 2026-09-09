# Testing Alignment

## Test by claim

| Claim | Required evidence |
| --- | --- |
| Canonical language is coherent | Definition and ontology schemas, source bindings, graph integrity, and residue validation |
| Baseline is exact | Inventory/digest validation, supported-profile membership, realization identity, and missing/extra target rejection |
| Instantiation is deterministic | Same input and baseline produce the same plan, bytes, manifest, and semantic digest twice |
| Target materialization is safe | Collision, traversal, partial-write, rollback, undeclared-file, and package-boundary negatives |
| Realization is correct | Focused TypeScript, Python, and Rust profile tests over shared language-neutral cases |
| Relationships conform | Source/target, multiplicity, direction, cycle/closure, and relationship-specific obligation checks |
| Operation conforms | Declared reads/writes/effects, pre-mutation guard, atomic state/outbox, failure continuation, no undeclared effects |
| Workflow conforms | Step graph, emitted/consumed events, recovery intent, claim/lease, replay protection, compensation, terminal outcomes |
| Evidence is reproducible | Locked runtime, direct/replay parity, tamper rejection, independent reproduction, exact receipt verification |
| Migration preserved the product | Source-to-successor exact-byte inventory, runtime aggregate, ontology validation, CLI generation, target conformance, and link closure |

## Current alignment

The working implementation already contains focused and aggregate conformance suites, provider registries,
replay/reproduction tests, ontology validators, and multi-language fixtures. The open testing slice is not
“add tests for every meta type”; it is a consuming-project acceptance chain that proves exact selection,
materialization, manifest identity, and independent target observation in one bounded run.

## Node runtime

Migration and aggregate validation use the repository's stable Node 26 container. This map does not add a
new package root or depend on host Node. Python and Rust profile checks remain independently executable and
must not be hidden behind a TypeScript-only aggregate PASS.
