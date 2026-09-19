# JSON-safe UInt64 field factory generation

Date: 2026-09-09. PCR-06 opt-in v6 candidate, authorized by user “ok, so next”.
Authority effect: none. No default integration, profile admission, publication,
release or AlchLang change.

## Implemented scope

The [candidate contract](uint64-field-factory-contract.json) selects
domainspec.configured-factories-selection/v6-candidate. It consumes the existing
[checked field contract](../contracts/field-and-reference-model.json) without
changing its definitions, relationships or numeric envelope.

The selected json-safe-uint64/v1-candidate profile supports integers from zero
through 9,007,199,254,740,991 inclusive. This is the JSON-safe subset, **not the
full unsigned 64-bit range**. Its generated TypeScript representation is number;
the range is enforced at runtime, not by a range-branded static type.

Supported compositions include required numeric fields, existing optional/list/set
combinations, nested owned Value Objects, named and inline sum payloads, direct
numeric Entity identities and finite String/UInt64 Value Object identities.
Existing checked-model restrictions on identities and collection elements remain
unchanged. References and numeric Rule expressions are not added.

## Runtime behavior

Normalization accepts only actual numbers for which Number.isSafeInteger is
true and the value is nonnegative. Negative zero is accepted and canonicalized
to positive zero, matching checked-model equality and set duplicate detection.
No string parsing, bigint conversion or object coercion occurs.

Rejected inputs include negative numbers, fractions, unsafe integers, NaN,
infinities, decimal strings, bigint, boxed numbers, booleans and coercible objects.
All factory construction routes validate numeric fields before running declared
Rules or forming snapshots. Named sum providers validate numeric payloads before
branding a case; invalid inputs follow their existing throwing constructor API.

Lists preserve order and duplicates. Sets reject semantically duplicate numbers
(including zero versus negative zero) and use the existing canonical ordering.
Optional numeric absence follows the existing omitted/null rule; explicitly
undefined is not silently accepted. Normalization copies and freezes owned
outputs without mutating or freezing caller collections.

Entity equality and keys use identity only: changing a nonidentity count does
not change identity. A changed numeric identity, including a changed numeric
component of a composite identity, rejects on transition. Value Objects retain
full typed-value equality. Numeric keys preserve distinct accepted integers.

TypeScript rejects string/bigint fields and readonly property assignment, but a
negative number still typechecks as number. Runtime validation is mandatory.
Numeric normalization does not replace business invariants: existing bound Rules
continue to run, and selecting a numeric Rule argument/path remains unsupported.

## Implementation and compatibility

The planner opts into v6 explicitly and binds the new contract, checked-field
digest and complete helper bytes. Numeric support composes with the unchanged
private collection, Enum and sum protocols. Static value shapes carry UInt64
through wrappers, dependencies and sum payloads into number fields and numeric
validators. No runtime ontology parser, classes or new graph edges are generated.

Versions 1–5 keep their existing selections, contracts and emitted output.
The tests include exact entry-byte v5 factory/sum goldens alongside the existing
v1–v4 regressions. Selecting v5 does not silently enable numeric fields.

Support digest (collection + Enum + sum + numeric helper):
04125d6abc0e3bb18a624aa0b7390ac4958b0957ea634fdc800ab7135c91c3f9.

Contract digest:
9b77a5827bef588b8f28cdac0efd65b4f1f39b837d8791b4b5d1cb4c7b990665.

## Verification

Focused numeric suite: **6/6 PASS**, no skips, in 21.49 seconds.
Full selected regression: **95/95 PASS**, no skips, in 174.21 seconds
(six added tests plus the preceding 89).
Full CLI source typecheck PASS, including 39 catalog rows, 31 relationship
signatures and integration-profile validation. Native observer syntax check PASS.
Native tests compile both JavaScript and declarations with the existing locked
TypeScript 7.0.2 environment; no compiler installation was needed.

Six added tests cover:

- v5 byte-identical output, closed source/contract selection, dependency hashes,
  source drift, root relocation, ordering and nominal checked-input rejection.
- Differential equality/key checks against the independent checked field model
  for numeric boundaries, optional/list/set/nested collections, sum payloads and
  composite identities; negative-zero normalization and caller isolation.
- Direct numeric identities across create/reconstruct/transition, all invalid
  categories, no coercion, validation before Rules and additive extensions.
- Number versus string/bigint static types, readonly fields, and the explicit
  limit that TypeScript number alone does not encode the accepted range.
- Independent native AST checks and three compiling mutants: permitting unsafe
  integers, permitting negatives, and collapsing different numeric identity keys.
  The mutants compile but fail support observation and checked-model behavior.
- Numeric Rule arguments and numeric field-path bindings remain rejected rather
  than acquiring implicit coercion or new business-rule semantics.

The selected regression command is the same eight-suite invocation recorded in
[the v5 report](SUM-FIELD-FACTORY-GENERATION.md#verification); the registered
factory test file now includes these six tests. Source typecheck uses the
umbrella node-env launcher with projects/domainspec-v2/impl/cli and npm run
typecheck. Native tests use the locked network-disabled, read-only-root container.

## Exact sources and preservation

| Changed implementation/test source | SHA-256 |
| --- | --- |
| configured-factories.ts | 0f5edbb9d343ffac6938ff2300fcfee4afec49fd1c78d581ba90293acf6e50e2 |
| configured-factory-source.ts | d11e1b88a72a50b1419b5375e5337cb321afbd471c98e764a5f3284aa6751e2c |
| configured-sum-source.ts | a54e323ca7e2311ee92db46d4babf5900f63b267dfc41c0c4da4b1946dc3ac84 |
| configured-uint64-source.ts | ad15b42408f33c07cfda4279fa409581edcac4114ccc8f15260d23367992315f |
| configured-factories.test.ts | ec90f1a4f29fafaeb75b3c5ef164578e44f7272f832918d09bc7ca002de54cd2 |

The native observer, checked field model/adapter, Enum adapter and collection
helper, Rule/Enum/L0 planners, base/TypeScript profiles, configuration and package manifest retain their
entry hashes. Older contracts and historical reports remain unchanged. Existing
untracked work and unrelated dirty bytes are preserved. The eight-file write
envelope is the five implementation/test files above, the v6 contract, this
report and STATUS.md.

## Task-session result and context pack

Native local execution, no delegation or runtime handoff. Task-session and
context-builder kept this continuation at the existing PCR-06 frontier. Its
bounded context comprises STATUS.md, CONTRACT.md, the v5 report, the checked
field contract and numeric equality/identity selectors, factory/sum emitters,
planner, tests and observer. No definition restart was needed.

Decisions: consume the selected JSON-safe profile exactly; normalize negative
zero consistently with the checked model; use runtime validation of number;
leave numeric Rules and older versions unchanged. These are candidate realization
choices, not definition promotion or profile admission.

Gate: existing user authorization and CA2 implementation route/context/effect
checks delimit the D65 construction scope. Handoff and experiment harness are
not applicable. STATUS.md owns the synchronized execution frontier. Context
coverage is complete for this slice only; PCR-06 as a whole remains in progress.

## Open Questions

No unresolved semantic choice remains inside this bounded numeric realization.
Full-width UInt64 needs a separately selected representation and contract; it
must not silently expand this candidate. Reference generation is the next
bounded field slice. Numeric/richer Rule expressions, codecs, other metatype
generators, language parity, default integration and packaging remain separate.
Admission and release decisions remain with
[the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
