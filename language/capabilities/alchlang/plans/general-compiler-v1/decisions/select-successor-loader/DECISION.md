# AlchLang Successor Loader Binding

Status: selected; DomainSpec loader candidate closed and AlchLang candidate binding refreshed

Decision ID: `CA2-DECISION-ALCHLANG-SUCCESSOR-LOADER-001`

## Question

Which immutable DomainSpec graph-loader boundary should control the AlchLang
typed-backend successor DAG?

## Options

### CLOSE-DOMAINSPEC-LOADER-THEN-BIND

Finish and validate the in-progress DomainSpec-v2 loader work first. Then bind
the AlchLang successor to its exact reviewed bytes. This minimizes rework and is
the recommended option, but pauses AlchLang implementation at DAG node A0.

### BIND-LIVE-DIRTY-LOADER-CANDIDATE

Bind the successor candidate to the current dirty loader SHA-256 and continue
immediately. The result remains candidate-only and aggregate conformance stays
`not_evaluable`; any concurrent loader change invalidates the run.

### DECOUPLE-ALCHLANG-LOADER-CONTRACT

Introduce an AlchLang-owned loader interface and a byte-bound DomainSpec
adapter. This gives AlchLang a stable construction boundary but creates a new
compatibility surface that must be designed, tested, and governed.

### DEFER-ALCHLANG-SUCCESSOR

Preserve the current implementation and stop the successor effort for now.

"Explain / more context" is available and does not resolve the gate.

## Selection

Selected: `CLOSE-DOMAINSPEC-LOADER-THEN-BIND`

Selected by: user in the active repository session on 2026-09-03

Rationale: finish and validate the in-progress DomainSpec-v2 loader first, then
bind the AlchLang successor to one exact reviewed candidate snapshot. This
avoids constructing new AlchLang evidence against a moving dirty dependency.

## Blocked Work

Independent conformance, owner acceptance, Work-Pack currency, admission,
promotion, publication, release, and deployment remain downstream. The
accepted Work-Pack continues to bind its historical loader digest and was not
silently rewritten.

## Candidate Snapshot

- DomainSpec graph loader SHA-256:
  `22f0250d606001f78a6f6f2a34db71c7dcfa1c066b03e0a87be6d9014bffd4fd`
- Immutable `domainspec-meta-types-current-implemented@10` file SHA-256:
  `4e8c72e3c59308bf7f476a2365d0ba66e149534b8dfddb4ad8b555e454edbf59`
- AlchLang generated projection tree SHA-256:
  `323cdf15d4c592eb1bf6a68ffb8698953234adf7d6b9958548d2c0d2667b6c1f`
- AlchLang generation receipt SHA-256:
  `137f1f57eb518dd13e3ebaa6f477a5bc9968a1b6eab706e37ead2acc7d096726`
- AlchLang construction-binding candidate SHA-256:
  `65ae0c64831a0757676bb1f5c23c2b930f570fc8b0f48bd57b4ad0c396421926`

Local validation: DomainSpec loader/corpus tests, pinned Lean assurance,
TypeScript typecheck/build, 23 contract tests, clean-package replay, all 13
generated Rust meta-types, AlchLang 38-node/32-relationship source validation,
deterministic projection replay, and candidate binding self-validation passed.
The package-wide DomainSpec run first passed 131/132 and identified one stale
generated Lean projection; after deterministic refresh its complete 12-test
formalization suite passed.

The next construction frontier is recorded in `SUCCESSOR-DAG.json`.

## Authority Ceiling

This record grants no implementation, acceptance, admission, stable promotion,
publication, deployment, credential use, network action, or external effect.
