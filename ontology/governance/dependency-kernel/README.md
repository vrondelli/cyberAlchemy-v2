# Governance Dependency Kernel

This package is the non-activated Rust candidate that replaces the suspended
whole-epoch ontology preflight model. It evaluates a declared governance
program, not an ontology package timestamp or ambient epoch.

The kernel closes only the dependency IDs selected by a request and their
explicit transitive dependencies. Drift inside that closure blocks admitted
use. Drift outside it is reported as diagnostic evidence and does not change
the decision. Candidate construction may name exact observed input digests,
but returns `CANDIDATE` and never grants authority or an effect.

## D65 construction order

The package keeps these layers distinct:

1. canonical definitions;
2. Governance Product Capability and capability-local business ontology;
3. DomainSpec v2 authored source;
4. deterministic compiled graph and system ontology;
5. exact Rust implementation binding;
6. conformance evidence.

The Product Capability, DomainSpec profile, system ontology, program, and Rust
runtime are candidates. They are not adopted, admitted, accepted, or active.
Activation requires a separate owner decision that binds the final immutable
program and runtime evidence.

## Runtime

From `runtime/`:

```text
cargo run --locked -- validate-program --program ../programs/dependency-kernel-construction.program.json --repository-root ../../../../..
cargo run --locked -- evaluate --program ../programs/dependency-kernel-construction.program.json --request ../requests/dependency-kernel-construction.request.json --repository-root ../../../../..
```

`enforce` additionally requires a separate activation binding. Even then, the
kernel only returns a decision to an external separately authorized adapter; it
does not perform repository, routing, publication, or deployment effects.
