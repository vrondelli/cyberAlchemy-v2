# Rule collection-value generation

Date: 2026-09-09. PCR-06 opt-in Rule v3 candidate, authorized by user “next”.
Authority effect: none. No collection predicate, default cutover, admission,
publication, release, AlchLang or canonical contract change.

## Implemented scope

The [candidate contract](rule-collection-value-contract.json) selects
`domainspec.configured-rules-selection/v3-candidate`. Generated TypeScript Rules
now accept direct `list<String>`, `list<Bool>`, `set<String>` and
`set<Bool>` parameters. Collection values may be passed through exact declared
`rule_ref` arguments. Existing v1 Boolean expressions and v2 String ordering
remain available.

This is the value-representation prerequisite for later collection predicates.
It deliberately does not implement `contains`, `set_equal`, `exists`,
`exactly_one` or `unique`, and does not give collection `eq` JavaScript
reference-identity semantics.

## Representation

Both list and set values enter generated Rules as readonly dense plain arrays.

- Lists are copied, frozen, and retain order and duplicates.
- Sets reject duplicate typed scalar values, then sort and freeze the copy.
  String order is exact ECMAScript code-unit order; Bool order is false then true.
- The caller's array is never retained. Mutation after the call cannot change the
  normalized value transported to a referenced Rule.
- Each array must have the ordinary Array prototype, an own data `length`,
  contiguous own enumerable data elements and no extra string or symbol keys.
  Holes, element accessors, extra properties, derived arrays and wrong element
  types reject with `RULE_INPUT`.
- Collection-valued top-level parameters must themselves be own enumerable data
  properties. Their accessors are rejected without invocation.

The generated signature uses `readonly string[]` or `readonly boolean[]`.
The private normalizer is emitted only for v3 modules. It is static generated
TypeScript, not a runtime type-description interpreter or shared mutable service.

Set normalization is representation behavior, not a database uniqueness
constraint. List/set distinction remains in the checked parameter type even
though both use arrays at the TypeScript boundary.

## Composition and boundaries

A v3 Rule reference must already be resolved in the checked closure. Its argument
set remains complete, unique and type-equal to the target parameters. The caller
normalizes collection arguments before the direct imported call; the generated
target independently applies its declared boundary.

Only one-level scalar collections are supported. Nested collections, UInt64,
named, Entity, Value Object, Enum and sum elements remain rejected. Property
projection and `to_set` are not realized. No equality, membership, quantifier,
iteration, implicit coercion or lookup is inferred.

v1 and v2 selection contracts and output remain unchanged. Factory generation
continues to request v1 Rules. v3 requires both the v2 String-order contract and
the new collection-value contract as exact raw sources, making the additive
inheritance explicit.

## Verification

Focused validation: **5/5 PASS**, no skips, in 8.95 seconds. Full CLI typecheck
PASS, including 39 catalog rows, 31 relationship signatures and five integration
definitions across three languages. This does not establish v3 language parity.

Full selected regression: **127/127 PASS**, no skips, in 255.15 seconds
(five added tests plus the preceding 122). Report source digests and scoped
whitespace checks PASS. Task-session result: **PASS for this bounded slice**.

The focused tests cover double contract binding, deterministic roots and v1/v2
preservation; native list copying and set canonicalization across exact
`rule_ref` transport; dense-array and hostile descriptor failures without
getter invocation; rejection of nested/named/numeric types and premature
collection operators; and independent normalization mutants.

The three native-compiling mutants remove duplicate rejection, set ordering, or
copy ownership. A hand-authored capture dependency observes the collection passed
by the generated root and exposes each wrong result. It is test instrumentation,
not generated product code. Generated TypeScript compiles with the existing
locked TypeScript 7.0.2 network-disabled, read-only-root container. No compiler
was installed.

The unchanged v1 native AST observer still verifies existing scalar Rule modules.
It is not claimed as a v3 structural oracle because its original closed top-level
allowlist intentionally rejects private collection helpers.

## Exact sources and preservation

| Source | SHA-256 |
| --- | --- |
| configured-rules.ts | 3bd67f8c1102f70e9405bd71e2e2afd1882869ee604389aea993aacc51f449aa |
| configured-rules.test.ts | 0a30cfa4c21e07fe9e287aa9fb575bad861400584abda671c29ef475aaae6c2b |
| rule-collection-value-contract.json | 02e15e5c84a5ee60895ec4891aa328b8a2960b1d69d7bc45fcdeccbdb4c6b4ba |

The checked Rule contract and closure validator, configured factories and their
v1–v9 output, project builder, profiles, configuration and original Rule observer
retain their entry bytes. The observer remains
fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c.
Unrelated dirty sources remain untouched.

The five-file write envelope contains the Rule generator, its tests, the new
contract, this report and STATUS.md. No staging, branch operation or external
publication occurred.

## Task-session result and context pack

Task: establish checked TypeScript Rule collection values before selecting an
operator. Runtime: native local. Delegation, handoff and experiment harness:
not applicable.

Context-builder selected the current PCR status and String-order report for the
frontier; the unchanged typed Rule contract and closure for list/set meaning and
argument type checks; Rust realization only as evidence of existing operator
separation; the generated factory collection helper for established TypeScript
array representation; and configured Rule source/tests for the actual boundary.

Decision: represent both list and set as readonly arrays, with list order retained
and set order canonicalized, matching current generated TypeScript data shapes.
Permit only transport through declared Rule references so this slice can prove
input ownership and representation without silently choosing predicate semantics.
No blocker-level choice remains within this bounded candidate.

Gate: current user authorization and ARE route/context/effect assessment delimit
the D65 construction boundary. The assessment grants no authority. Tests establish
candidate behavior only, not admission, parity, activation or release. STATUS.md
is synchronized at the completion boundary.

## Open Questions

No unresolved semantic choice remains inside scalar collection-value realization.
The next smallest useful operator is `contains`: it needs one collection plus one
element and does not require cross-collection equality or scoped predicate
bindings. Its bounded review must decide whether checked list containment and set
containment deliberately share element-equality behavior while retaining their
different representation invariants. `set_equal`, `exists`, `exactly_one`
and `unique` remain later slices. Other element types, projections, `to_set`,
numeric Rules, metatype generators, language parity, public integration and
packaging remain separate. Admission/release stays with
[the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
