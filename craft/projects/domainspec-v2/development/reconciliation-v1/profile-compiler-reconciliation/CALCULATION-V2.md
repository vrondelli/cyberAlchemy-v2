# Exact standalone Calculation successor — R06

Date: 2026-09-09. Product-construction candidate; authority effect: none.
Status: implemented and verified; R06 input accounting is complete in
[the all-type closure report](TYPESCRIPT-INPUT-CLOSURE.md).

## Selected behavior

The owner selected option A in [the decision record](CALCULATION-ADMISSION-DECISION.md)
with an explicit subsequent “yes”. This version-specific choice permits a pure
Calculation to exist without an Operation consumer. It neither fabricates a
supporting Operation nor adds a Calculation-to-Mapping edge. Real `calculates`
edges still undergo canonical endpoint, scope and multiplicity validation.

[The definition](calculation-v2-contract.json) precedes the
[ontology scaffold](../ontology/calculation-v2-candidate.json), direct source
fixture, checked implementation and native controls. No old source selection,
definition, relationship signature or provider was refreshed to hide drift.

## Source and generated code

`domainspec.typed-calculation/v2` uses canonical unsigned decimal strings for
every authored UInt64 literal, including small integers. This is the same
representation discipline as typed Rule v2, without changing Rule semantics.
For example:

```json
{
  "schema_version": "domainspec.typed-calculation/v2",
  "ontology_calculation": "COMMERCE-MAXIMUM-AMOUNT",
  "inputs": [],
  "result": {"kind": "scalar", "name": "UInt64"},
  "division_rounding": "reject",
  "expression": {"op": "literal", "value": "18446744073709551615"}
}
```

The node retains `description`, `inputs` and `typed_contract`; body input names
must exactly match the typed inputs, including order. Empty inputs allow a true
constant without dummy parameters. V2 rejects legacy `semantics` beside the typed
expression so there is exactly one computation authority.

`planConfiguredCalculationsV2` consumes the checked composition boundary,
`domainspec.configured-calculations-selection/v2-candidate`, exact UInt64
realization and pinned definition/profile sources. It emits an arrow function
with primitive bigint result and a separate immutable descriptor-bound facade.
No runtime AST interpreter, database lookup or implicit Mapping evaluation exists.
The existing bound-calculation native form remains valid: source/plan/descriptor
versions change, while purity and explicit dependency protocol remain unchanged.

Every declared argument is normalized, even when unused. Literal bytes become
native bigint literals without a Number roundtrip. Arithmetic checks intermediate
results, and division preserves explicit floor/ceil/reject semantics. Input,
overflow, underflow, zero-divisor and inexact-division failures remain distinct.
The descriptor pins definition, source contract, provider bytes and boundaries.

## Compatibility

- V1 decoder, required Operation consumer, safe JSON-number literals and generator
  remain untouched. The old configured generator rejects v2, not reinterpretation.
- Legacy instantiate, project build, in-memory execution and formalization reject
  v2 explicitly. Successor public integration remains R07 onward.
- Source-selection v8 binds the unchanged v7 predecessor and the new parser,
  exact Calculation decoder and definition. Historical selections retain their
  original bytes and correctly detect parser drift.
- No profile admission, default migration, AlchLang reconciliation, publication,
  provider installation or transaction effect is performed.

## Context and verification

Task Session selected the Calculation residual within dependency-ready R06.
Context Builder covered the task contract, admission decision, old source decoder,
edge validator, generation and independent observation, source-selection chain,
and legacy execution/proof entry points. No delegation or runtime handoff; strict
handoff coverage is not applicable. Experiment harness is not applicable to this
compiler task. Other completed R01–R05 work was not reopened.

Fresh route receipt: `e35ba10d159abc67773f758a8835628064af86f767fbcd266265343e3657b61f`.
Context result: `609a431bc7961ca31e1785ad654be888f78d83a8723554a29a71739a1a225e70`.
Effect result: `71ec6f93de009f294f60406b217b09da94a3f4c3d009d50cf7fc0d56df453cfe`.
The effect is consequential, structurally admissible, and bound to the exact
implementation owner; the user's approval and preceding implementation request
supply that bounded instruction. ARE results themselves confer no authority.

Initial seven-test suite passed, with two additional focused native/proof controls
passing afterward. Tests cover standalone and lawful-consumer graphs, exact source
identity, missing/mismatched/hostile inputs, constants, every arithmetic operator,
rounding, intermediate overflow, relocation, immutable plans, source removal,
old-version rejection, typed native compilation and executable failures.
The independent closed-source observer reconstructs arithmetic meaning and
instruction order without importing the generator, including a compiling mutation
that rounds 9007199254740993 down to 9007199254740992. Its limits remain explicit:
closed emitted grammar and pinned support, not arbitrary-code safety proof.

Source typecheck passed, including the frozen catalog, relationship and integration
profile checks. Shared regression passed 201/201 and 63/63 in separate groups.
The final residual group passed 27/27, including all ten Calculation v2 tests,
the standalone Enum tests and all twelve configuration tests with final v8
negative controls. No failures or skips occurred in these groups.
Initial implementation test/typecheck found a mechanically renamed decoder call;
it was corrected before the passing runs. No product behavior was changed to
silence that failure.

## Remaining work

The all-13 TypeScript supported-input obligations table is verified; R06 is
complete as a bounded candidate. R07–R18, public entry points, Python/Rust
parity, native 39-cell qualification, package and user documentation remain.
Operational support has no new current prerequisite; publication and release
remain separately owned deferred effects, not blockers to construction.
