# Explicit JSON-safe numeric Rules

Date: 2026-09-09. PCR-06 continuation under the working-CLI goal.
Authority effect: none. Candidate artifact planner only; no public CLI selection,
factory default change, profile admission or release.

## Product boundary

Rule selection `domainspec.configured-rules-selection/v5-candidate` adds direct
`UInt64`, `list<UInt64>` and `set<UInt64>` inputs to the existing String/Bool
predicate group. Selection must additionally include
`value_profile: "json-safe-uint64/v1-candidate"`. The planner verifies the exact
[numeric contract](rule-numeric-contract.json) and all inherited v2–v4 contract
digests before producing source from the checked graph.

This reuses the existing field-model numeric representation, not a new meaning
for full-width UInt64. Its native TypeScript representation is `number`, limited
to nonnegative safe integers from **0 through 9007199254740991**. Negative zero
normalizes to positive zero. Strings, bigint, fractions, negatives, nonfinite
numbers, unsafe integers and boxed numbers reject without coercion.

Numeric fields must be own enumerable data properties. Collections retain the
existing dense plain-array boundary: no holes, accessors, hidden elements,
extra keys or derived array prototypes. The boundary copies and freezes arrays;
it neither sorts nor rewrites the caller's original input.

| Construct | Selected behavior |
| --- | --- |
| Numeric `lt` | Numeric comparison: 2 is less than 10; no lexical conversion. |
| Scalar `eq` | Exact same-type equality after zero normalization. |
| List | Ordered occurrence sequence; duplicates retained. |
| Set | Duplicate values reject after zero normalization; numeric sort. |
| Collection `eq` | Lists compare in order; normalized sets compare by members. |
| `contains`, `set_equal`, `to_set` | Exact typed membership, set equality and explicit list deduplication. |
| `exists`, `exactly_one` | Count matching occurrences, including duplicate list members. |
| `unique` | Existing scalar path-key uniqueness; no new projection syntax. |
| Rule composition | Declared typed arguments and lexical scopes; no coercion, undeclared calculation or graph edge. |

String ordering, Bool semantics and earlier supported Rule v1–v4 output remain
unchanged. Old versions reject numeric inputs and reject v5-only options.
Factory selection still uses Rule v1 and has **not** acquired numeric validators
merely because this planner now supports them.

## Independent verification

Focused native tests: **7/7 PASS**, no skips, **27.04 seconds**. CLI typecheck:
**PASS**, including catalog, relationship and integration-profile checks.
Final eight-file selected regression: **144/144 PASS**, no skips, in **267.41
seconds**. Observer syntax and scoped whitespace checks also pass.

The native collection observer accepts a separately bound numeric `value_profile`.
It has three fixed observer-owned support pins and verifies the declared numeric
signature, own-data boundary, scalar normalization, list/set element type,
exact leaf imports and closed scoped expression grammar. It does not import
the generator or infer a missing value profile from generated text. Previous
v3/v4 expectations and helper pins remain supported.

Behavioral tests cover numeric versus lexical ordering, safe maximum/overflow,
zero normalization, wrong scalar types, getters without reads, hidden inputs,
ordered lists, normalized sets, conversion and exact Rule arguments. An
independent loop checks occurrence counts and uniqueness for every numeric list
of length 0–3 over `{0, 2, 10, 9007199254740991}`. Nested scopes test shadowing,
outer-variable references and sibling String/Bool conditions. A test-only
declared dependency captures copied/frozen normalized values for direct checks.

Five native-compiling structural mutations are rejected: weakened range checks,
lexical set ordering, missing zero normalization, scalar normalization bypass and
changed list/set selection. Separate controls alter expected numeric types and
omit the selected numeric profile. A reversed-comparison mutant compiles and
passes structural observation but fails the independent expected result. A
weakened-range mutant accepts an unsafe number that the correct code rejects.
Structural PASS is therefore never a behavioral verdict; the observer continues
to report `semantic_verdict: requires-independent-execution`.

This is not a general JavaScript security sandbox or authentication of caller-
supplied observation bindings. Later CLI integration must bind those declarations
to the selected checked graph and plan.

## Reproduction and source identity

Run from the DomainSpec-v2 project root with the existing locked dependencies and
pinned native toolchain. No new compiler or package was installed.

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
--import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
--test --test-concurrency=1 \
impl/cli/test/generation/configured-factories.test.ts \
impl/cli/test/generation/configured-enums.test.ts \
impl/cli/test/input/compiled-field-model.test.ts \
impl/cli/test/input/field-reference-model.test.ts \
development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
impl/cli/test/generation/configured-rules.test.ts \
impl/cli/test/generation/profiled-project.test.ts \
impl/cli/test/input/project-model.test.ts
```

For the focused run, select only `configured-rules.test.ts` and add
`--test-name-pattern='PCR-06 numeric'`. Typecheck from the domainspec-core root:
`toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck`.

| Tested source | SHA-256 |
| --- | --- |
| configured-rules.ts | 032d0186408b1e6e9ef7b345e97f32db1cc7f458c0ea8a76710326bf60c6b477 |
| configured-rule-predicates.ts | 0a42395fa1b7ddb83106af5f85d5c22382ea6418c0400750f85ba42d217e114b |
| configured-rule-numeric.ts | 076675556a95df502db8bf59170643a1a9900819b9b9192369ff1726efca18d4 |
| observe-configured-rule-collections.mjs | 1419128464757a430d8382406a670ace334cbb225a55680f5e085df823d9b61b |
| configured-rules.test.ts | d29a7258d96f86ae2436b109d6ab02af732f8960b1db8566ef1c0f12ec3c2745 |
| rule-numeric-contract.json | 4612175e85b443bf8b7e1f920b4a3225220f54bb2a6114b8f41a52bbb2e97d1e |

Preserved entry digests: configured-factories.ts
`18d5b74ac6d18d12995d2f79f0101c02fcce6f346fd4265ed973d6d6fe376555`;
project-build.ts
`3e6e576c5c584185a8acc980a0294a23e4ce5213211e80d9d1add65147bd1250`;
typed-operation/contracts.ts
`ff9c3f901a18703d8de41a5d5bedeee3005b506f1b6b2701f340285802a60cc9`;
typed-operation/closure.ts
`4199960e4cdb7352269b94b6f249850522fb5644754c751cfa776167c3828cd9`;
original scalar observer
`fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c`.
Earlier reports retain their historical tested digests, not current-source claims.

## Context pack and task-session result

Context mode: lean. Controlling sources are the PCR plan and completion ledger;
checked typed Rule contracts/closures for operand and scope legality; field-model
and factory UInt64 support for the already selected numeric representation;
the separate exact-UInt64 renderer for the full-width distinction; v4 predicate
contracts, generator, native observer and tests for compatibility and proof.
No delegation, runtime handoff or experiment harness was used.

ARE route/context and the exact effect assessment preserve the user's existing
implementation authorization. The nine-file envelope is the Rule planner,
predicate emitter, new numeric support, collection observer, Rule tests, new
numeric contract, this report, STATUS.md and CLI-COMPLETION.md. No factory,
checked-type parser, shared builder, default, AlchLang file or unrelated dirty
work was edited. The skills keep this bounded evidence distinct from completion
of the full CLI goal. Final regression and both ledgers are synchronized.
Task-session result: **PASS for the explicit JSON-safe numeric Rule group**;
PCR-06 and the full working-CLI goal remain active and incomplete.

## Open questions

No owner-level decision blocks the selected JSON-safe representation. Named,
optional and nested Rule inputs, full-width Rule realization and explicit
factory validator composition remain implementation work, not waived coverage.
The existing factory planner still restricts validator endpoints to String/Bool
and chooses Rule v1. A versioned composition successor is the next ready step;
it must bind the selected Rule/value contracts explicitly and preserve all old
factory outputs. Full PCR-06 coverage, shared entry points, Python/Rust parity,
all 39 cells and clean installation remain in [CLI-COMPLETION.md](CLI-COMPLETION.md).
