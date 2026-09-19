# Why compare the TypeScript Enum with Python and Rust?

We are reusing the existing TypeScript Enum implementation unchanged. The generic factory pipeline and the owned TypeScript `as const` provider already exist; this work does not replace either one.

All three languages are compared against one shared promise:

> The exact owner-authored members exist, every member has one explicit wire value, unknown wire values fail, and the finite set cannot be widened by implementation code.

Python and Rust provide independent ways to challenge that promise:

- Python exposes aliasing, `str`-mixin equality, and runtime-extension risks. A conforming Python form therefore uses nominal `enum.Enum`, forbids aliases and string equality collapse, and parses unknown wires fallibly.
- Rust exposes exhaustiveness and closed-set behavior directly. A conforming Rust form therefore uses a unit-variant native enum with `Eq` and `Hash`, an explicit total emitter, a fallible parser, and exhaustive matching.
- TypeScript keeps the already selected owned const-object protocol. Its provider, profile selection, and status are not changed by this admission.

The comparison may reveal a portability gap. When it does, the first thing to strengthen is the shared ontology or proof obligation. The TypeScript implementation changes only if evidence shows that it violates the strengthened shared contract; Rust is not being copied into TypeScript.

The flow is:

```text
owner-authored Enum catalogue
  -> shared portable Enum properties
  -> TypeScript, Python, and Rust native protocols
  -> independent evidence compared by the factory
  -> stronger shared contract when a real gap is found
```

For this candidate-local admission, `shipment-priority-v1` is the bounded comparison fixture: `Deferred/deferred`, `Expedited/expedited`, and `Normal/normal`. The catalogue is authored as an admission input. Runtime or generated members may be checked against it, but may never define it.

This file explains the design only. It does not implement Python or Rust providers, prove three-language parity, promote an ontology, or grant production readiness.
