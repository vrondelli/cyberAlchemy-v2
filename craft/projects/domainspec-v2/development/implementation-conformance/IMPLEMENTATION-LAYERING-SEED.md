# Implementation Layering Seed

This is a design seed, not an implementation plan. It separates the proposed
package by responsibility so later implementation cannot collapse semantic
authority, evidence collection, normalization, and adoption into one service.

| Level | Name | Owns | Must not own |
| --- | --- | --- | --- |
| L0 | Contract kernel | profile, binding, finding, native-bundle, runtime-contract, and receipt value contracts; exact reconciliation; deterministic normalization | filesystem access, native tool execution, persistence, scheduling, authority decisions |
| L1 | Language realization | TypeScript, Python, and Rust adapter contracts; source-classification projection; unsupported-case classification | portable DomainSpec meaning, a second symbol registry, compiler/type-system reimplementation |
| L2 | Project integration | reads admitted owner inputs, invokes project-owned evidence providers, assembles one evaluation request, returns a receipt | CI ownership, durable exception acceptance, release/promotion decisions |
| L3 | Adoption and authority boundary | profile admission, migration decision, exception ownership, evidence acceptance, promotion and release routes outside this package | implementation-conformance evaluation internals |

## Dependency Direction

```text
L3 owner decisions --> consume L2 evidence
L2 project integration --> depends on L1 adapters and L0 contracts
L1 language realization --> depends on L0 contracts
L0 contract kernel --> depends only on admitted immutable inputs
```

L0 never calls outward. L1 may translate language-native evidence but may not
reinterpret DomainSpec meaning. L2 may coordinate supplied providers but may not
become a scheduler or runner. L3 is outside this package's authority.

## Composability Rule

The package composes through explicit provider contracts. Architecture-Pattern
Enforcement supplies architecture findings, Code-Tag Conformance supplies the
canonical symbol mapping projection, the supported-profile/compiler owner
supplies admission and digests, language-owned runners supply native bundles,
and the derivation owner supplies existing obligations. The package reconciles
those inputs; it does not fork their registries or validators.

## Initial Language Boundary

- TypeScript may use custom ESLint/typescript-eslint and dependency-cruiser
  adapters because their extension surfaces are part of that realization.
- Python uses Ruff as native style evidence, a bounded CPython `ast` reader for
  explicit source shape, Import Linter for topology, and mypy for type evidence.
- Rust uses rustfmt/Clippy/rustc, Cargo package evidence, and only a bounded
  macro-free explicit `mod`/`use` reader for intra-crate topology.
- Dynamic or semantically ambiguous source constructs are `unsupported`; no
  fallback textual parser is implied.

