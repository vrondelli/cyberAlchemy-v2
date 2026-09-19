# R11 Rust qualification

2026-09-15. Product construction; authority effect none. R11 is qualified and
complete. R12–R18 and the complete CLI goal remain required.

## Controlling scope

The [R11 exit](REMAINING-WORK-PLAN.md#l2-python-rust-and-the-complete-realization-matrix)
requires native Rust realization of all 13 backend metatypes, independent native
surface observation, Cargo compilation, executed behavior and Rust-specific
ownership, visibility, type and failure controls. The opt-in
`domainspec.reconciled-rust/v1-candidate` profile leaves legacy CLI generation,
source schemas, relationships and defaults unchanged.

The [Rust project contract](rust-project-contract.json) owns one deterministic,
dependency-free Cargo library crate. Its field algebra preserves String, Bool,
UInt64, optional, list, set, named concept and sum distinctions. Planning is pure;
publication and verification remain separate explicit effects.

## Exact 13-metatype accounting

| Metatype | Native realization and checked distinction | Focused evidence |
| --- | --- | --- |
| Entity | Private immutable snapshot and validated factory; manual equality/hash use declared identity only. | `configured-rust-factories.test.ts` |
| Value Object | Private immutable value and validated factory; equality/hash use the complete value tuple. | `configured-rust-factories.test.ts` |
| Enum | Unit enum or owned payload-bearing native sum; exact wire variants and payload types. | `configured-rust-enums.test.ts` |
| Rule | Pure Boolean function over borrowed declared inputs. | `configured-rust-rules.test.ts` |
| Calculation | Pure checked UInt64 function with explicit arithmetic failures and no narrowing. | `configured-rust-calculations.test.ts` |
| Query | Async read-only provider trait plus filter/order/limit/projection over owned results. | `configured-rust-queries.test.ts` |
| Mapping | Pure internal or named public-contract projection from explicit inputs; no hidden Calculation or Entity construction. | `configured-rust-mappings.test.ts` |
| Policy | Declared Rule calls select an inert declared target identity without importing or executing the target. | `configured-rust-policies.test.ts` |
| Event | Owned immutable occurrence data from explicit inputs and explicit clock policy; no publication. | `configured-rust-events.test.ts` |
| Operation | Awaited explicit atomic state-and-outbox port with declared guards, factories, Events and distinct commit outcomes. | `configured-rust-operations.test.ts` |
| State Machine | Closed state/trigger enums and pure exhaustive reducer returning ordered, unexecuted output intents. | `configured-rust-state-machines.test.ts` |
| Workflow | Occurrence-aware composition over explicit Operation providers; committed, rejected and indeterminate results remain distinct, and recovery stays data. | `configured-rust-workflows.test.ts` |
| Interface | Named public structs and async provider trait with exact/backward version eligibility; no transport server or Entity snapshot leak. | `configured-rust-interfaces.test.ts` |

The whole-project planner rejects missing authored factory, Operation or Workflow
bindings, unsupported node kinds, source drift, module collisions and multiple
native realizations. Generated `mod.rs`, `lib.rs`, `Cargo.toml` and `Cargo.lock`
files close module visibility without redefining concepts. A Rust node view
retains the entire checked crate because Cargo's checking boundary is the crate;
the receipt records the selected root and the `whole-project` checking scope.

## Verification and CLI behavior

The source-bound verifier independently checks artifact hashes, selector binding,
module indexes, forbidden placeholders/effects, exact 13-row accounting and the
dependency-free manifest. It then runs `cargo metadata` and `cargo check` with
`--offline --locked` in a newly created private workspace. When a target is
provided, it first verifies the exact published receipt, bytes and path inventory.
Pass and failure paths remove only the verifier-owned workspace.

The selected CLI and public API now dispatch Rust explicitly. `build`,
`instantiate-project`, node `instantiate`, artifact-currentness `verify`, and
stronger `verify-project` share the same registered project plan. The stronger
command requires `--cargo-executable`, `--temporary-parent` and `--target-root`;
unknown, duplicate, missing or TypeScript/Python tool options reject before output.
Plain and `domainspec.application-layout/v1` targets both pass. An actual child
CLI process, rather than only an imported handler, builds and verifies the crate.

This R11 verifier establishes native structure and compilation plus the focused
executed behaviors above. It does not claim provider durability, deployment,
publication, admission, release, or the three-language semantic join. R12 owns
the fresh 39-cell TypeScript/Python/Rust comparison.

## Fresh cumulative evidence

The exact registered `test:rust` file list ran with Node 26.8.1 and Cargo 1.98.1.
The final combined run passed **62/62**, exit 0, with no failures, cancellations,
skips or todos in 14,520.139281ms. It includes 47 cell tests, four full-project
tests, four source-capsule tests, three native-verifier tests and four CLI tests.
Generated native programs execute positive and hostile cases; compile-fail cases
reject private construction bypasses, wrong scalar/payload types, missing provider
traits, undeclared states and missing Operation stores.

Strict TypeScript source checking passed. All six materializer checks passed:
39 catalogue rows, 31 relationship signatures, five definitions/three languages,
130 compiler sources, 18 cross-generator sources and 14,408 native publication
bytes. The new capsule is
`5d5b31d9e62a5bf789272bf6af05045dac915e3d7747484336e513c0ff19f1b1`;
removing only `rust_native_verification` reconstructs the exact prior 129-source
capsule `ca8796a829496d19fe6608a7c58939494a2924d8f3b5fa9d5ea01b5e056d9a04`.

Exact closure identities (SHA-256):

| Artifact | Digest |
| --- | --- |
| `impl/cli/package.json` | `ce0261450b40c466765f0d17e88f1cad5deff2c477c69871fb0f4394f3849cdb` |
| `src/generation/reconciled-rust-project.ts` | `63ef2d7c6ec7512c0554cd63c579af764a1f9126025c06f0f854698e0f1d6dcd` |
| `src/verification/reconciled-rust-native.ts` | `6d5a55df5fd3ba30a58f888ba8e9ff24a30f48698222e5153506699bd58bd2c9` |
| `src/verification/reconciled-rust-projection.ts` | `1f4f2196a1ea2b9e5ddc3a7fbfdf24dca63e3306607bd46668b4ea8f8e611e55` |
| `rust-project-contract.json` | `376246591954a4bf79b4f314355096006f31cc158a393c80cea9787d0c511864` |
| `rust-native-verification-contract.json` | `de2cbae502d34b857d2389614deb8cd0654473ab6ac089ae75ada5467e77d280` |

No unrelated temporary repository or user file was deleted. Workspace cleanup
checks concern verifier-owned virtual filesystem allocations; they are not a
claim about physical Windows disk consumption.

R11's exit is satisfied. R12, the explicit 39-cell cross-language qualification,
is next. This qualification is candidate evidence with `authority_effect: none`,
not release or admission.
