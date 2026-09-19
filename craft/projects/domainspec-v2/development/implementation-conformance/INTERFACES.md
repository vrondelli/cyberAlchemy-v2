# Interfaces: DomainSpec Implementation Conformance

All interfaces are internal package contracts. No network service is selected.

## Internal: ImplementationConformanceAPI

| Method | Maps to | Contract |
| --- | --- | --- |
| `authorProfile(input)` | `AuthorImplementationConformanceProfile` | validates and closes authored candidate configuration |
| `reconcileBinding(input)` | `ReconcileImplementationBinding` | returns exact binding or typed finding |
| `evaluate(input)` | `EvaluateImplementationConformance` | pure orchestration over supplied evidence; runs no native tools |
| `explain(receiptRef, findingId)` | `ExplainImplementationFinding` | returns evidence and owner route |
| `inspectCoverage(profileRef, scope)` | `InspectBindingCoverage` | returns coverage classes without promotion |

## Internal: LanguageEvaluatorAdapter

```text
collectEvidence(EvaluationRequest) -> NativeEvaluationBundle
```

The adapter is owned by the language/project integration. It may invoke native
tools under its own runner and receipt contract. The shared conformance package
only validates and normalizes the returned bundle.

Required adapter fields:

- adapter and language id/version;
- selected profile and source/config/tool digests;
- binding/source-graph findings;
- native diagnostics and exit/result semantics;
- raw-artifact references;
- skips and unsupported constructs;
- claim limits.

### TypeScript realization

- style/source shape: formatter, ESLint, typescript-eslint custom-rule surface;
- topology: dependency-cruiser direct/forbidden/circular/dynamic evidence;
- type/exhaustiveness: `tsc` and `never`;
- runtime: project-owned TypeScript harness.

### Python realization

- style: formatter/Ruff native findings only;
- source shape: narrow CPython `ast` reader using explicit import nodes;
- topology: Import Linter contracts;
- type/exhaustiveness: mypy and `assert_never`;
- runtime: project-owned Python harness.

Ruff is not a DomainSpec plugin host and mypy is not the topology owner.

### Rust realization

- style: rustfmt/Clippy native findings;
- topology: Cargo package graph plus a bounded explicit macro-free `mod`/`use`
  source reader;
- type/exhaustiveness: rustc exhaustive `match`;
- runtime: project-owned Rust harness.

`cargo metadata` is not an intra-crate source graph. `cfg`, `#[path]`, macros,
ambiguous re-exports, build-generated modules, and dynamic loading are initially
blocking `unsupported` cases.

## Read-Only Owner Inputs

| Interface | Owner | Consumed value |
| --- | --- | --- |
| semantic-profile resolver | supported-profile/compiler owner | admission and bound digest |
| code-tag mapping provider | Code-Tag Conformance | canonical symbol/edge tuple and extraction digest |
| architecture finding provider | Architecture-Pattern Enforcement | layer/edge/pattern findings |
| derivation provider | test-derivation engine | existing Obligation/RuleSet and transition obligations |
| authority resolver | DomainSpec/external implementation owners | owner route only; no automatic decision |

