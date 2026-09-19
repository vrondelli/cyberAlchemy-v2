# Exact UInt64 Rule inputs

Date: 2026-09-09. PCR-06 continuation under the working-CLI goal.
Authority effect: none. This closes full-width runtime Rule inputs in the
candidate planner, not every numeric authoring or factory requirement.

## Explicit selection

Rule selection `domainspec.configured-rules-selection/v6-candidate` requires
`value_profile: "domainspec.typescript-exact-uint64/v1"` and the exact
[v6 contract](rule-exact-contract.json), together with all inherited Rule
contract sources. The existing exact profile's numeric representation is reused:

- accept bigint, a nonnegative safe integer number, or a canonical unsigned
  decimal string;
- normalize to bigint in the inclusive range **0–18446744073709551615**;
- reject unsafe numbers even if a decimal rendering appears plausible;
- reject negative/fractional/nonfinite values, leading zeros, signs, whitespace,
  exponent/hex notation, boxed values and booleans;
- preserve String and Bool argument meaning; only a declared UInt64 value is
  converted, never a String that happens to look numeric.

Generated public parameters use `bigint | number | string` for UInt64 inputs and
readonly arrays of that input union for numeric lists/sets. Runtime validation
still owns the range and canonical spelling; the broad native union does not
prove those conditions statically. All private numeric locals are bigint.

For example, a generated comparison accepts
`{left: 18446744073709551614n, right: "18446744073709551615"}` and returns true.
The two values remain distinct; neither is converted through Number.

## Semantics and boundary

The existing scalar/list/set operator group generates direct source over
normalized values: exact equality, numeric ordering, membership, ordered list
equality, canonical set equality, explicit list-to-set conversion, occurrence
quantifiers, scalar-key uniqueness, lexical scopes and declared Rule calls.

Lists retain occurrences: `[2, 2n, "2"]` normalizes to three occurrences of 2n.
A set containing those entries rejects duplicates. `to_set` deduplicates a list
explicitly. Numeric sets sort by bigint comparison, not lexical order or Number
subtraction. Arrays are copied and frozen; caller inputs remain unchanged.

Numeric parameter properties must be own enumerable data values. Collections
keep the dense plain-array boundary: no accessors, holes, extra keys or derived
array prototypes. Decimal matching checks the entire string, including rejecting
terminal line separators; JavaScript's end anchor alone is insufficient for
that boundary. This is input validation, not a general proxy/security sandbox.

The exact Rule observer independently binds the selected profile, four fixed
private-support statement hashes, input signatures, normalization, leaf imports
and scoped expression shape. It imports no generator and does not infer a
missing profile from the observed source. Structure remains distinct from
behavior: `semantic_verdict: requires-independent-execution`.

## Preserved and incomplete coverage

Rule v1–v5 and their supported output remain unchanged. Factory v10 still
selects JSON-safe Rule v5 and cannot silently opt into this representation.
The existing exact renderer and default CLI behavior are unchanged.

The checked typed Rule v1 schema accepts UInt64 **source literals** only as safe
JSON integer numbers. V6 emits these as exact bigint literals, but does not
broaden the source schema. Full-width runtime parameters can be compared with
one another now; authoring a full-width literal remains a separate required
schema/compiler reconciliation. It is not waived or presented as complete.

Full-width factory fields, their checked value model and explicit validator
composition also remain required. Named/optional/nested Rule inputs and the
remaining metatypes/CLI integration are still tracked in the full completion
ledger. No all-39-cell, package, release or public-command completion is claimed.

## Verification

Focused native tests: **7/7 PASS**, no skips, in **26.79 seconds**. CLI source
typecheck PASS. Final nine-suite selected regression: **159/159 PASS**, no
failures, cancellations or skips, in **312.64 seconds** on final source bytes.

The tests cover:

- exact selection and every inherited source digest, relocation, reordered
  roots, snapshot-only generation and prior-version preservation;
- all pairwise comparisons among 0, 2, 10, safe maximum, safe maximum + 1,
  UInt64 maximum − 1 and UInt64 maximum across accepted representations;
- invalid values and spellings, including newline/carriage-return/Unicode line
  separators, without getter reads or acceptance of hidden numeric fields;
- every list of length 0–3 over five bigint values including the two adjacent
  maximum values, with independently counted occurrence/uniqueness outcomes;
- normalization across representations, exact list/set equality, conversion,
  Rule transport, frozen copied values, nested lexical scopes and emitted bigint
  literals;
- native consumers accepting bigint/number/string arguments and rejecting Bool;
  unchanged source-literal limits reject rather than reinterpret invalid input;
- four native-compiling helper mutations: precision loss through Number,
  widened overflow range, permissive decimal coercion and mutable arrays. Fixed
  support observation rejects all four. Independent execution detects precision
  collapse and overflow acceptance. A reversed-comparison mutation compiles and
  structurally passes, but fails the independent expected outcome.

The selected regression includes the previous eight suites and the existing
`exact-uint64.test.ts` compatibility test. That legacy test exercises the
existing CLI/profile path; it is not evidence that candidate Rule v6 has already
been integrated into the public CLI.

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
impl/cli/test/input/project-model.test.ts \
impl/cli/test/generation/exact-uint64.test.ts
```

For the focused run, select only `configured-rules.test.ts` and add
`--test-name-pattern='PCR-06 exact Rule inputs'`. Typecheck from domainspec-core:
`toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck`.
Native tests use the existing pinned TypeScript 7.0.2 image. No dependency or
compiler was installed.

## Source identity

| Changed source | SHA-256 |
| --- | --- |
| configured-rules.ts | 8e26baa45be9781c9944cfd55d23527261efebf08e5489dbc124f84f2be9962e |
| configured-rule-predicates.ts | dc6818ab634ae9a9158dad519a7ca5682a6e2ad7a2c25ccb6c8e32df4adb23fd |
| configured-rule-exact.ts | a1918e8f4e968940185801a6f9a733af32495b2bc55774b0c313fb6d5bc7d92a |
| observe-configured-rule-collections.mjs | ab463c9cb714f62d88e15bd4eb4c99510d9ab7b43c185c271dac2de7c4573e51 |
| configured-rules.test.ts | 99bcab0fbf9fccbdf2d6b38be577f32ba4852734acaafa454038ee0ef6c67b88 |
| rule-exact-contract.json | b9637fbec3f540a549c5cc5f393b55275896d1026c57cd239396bdad13807f06 |

Preserved: exact-uint64.ts
`bd110aa4dba95cf5726a7e20d40d26021c8b4d1c91e94ebe66ed9248658221c6`;
JSON-safe Rule support
`076675556a95df502db8bf59170643a1a9900819b9b9192369ff1726efca18d4`;
factory planner
`d121c895ee486bc18f2577da1eeec7e9dd1e5facdb673ae787db669e875e8a11`;
project-build.ts
`3e6e576c5c584185a8acc980a0294a23e4ce5213211e80d9d1add65147bd1250`;
typed-operation/contracts.ts
`ff9c3f901a18703d8de41a5d5bedeee3005b506f1b6b2701f340285802a60cc9`;
typed-operation/closure.ts
`4199960e4cdb7352269b94b6f249850522fb5644754c751cfa776167c3828cd9`.
Earlier reports retain their historical tested identities.

## Context pack and task-session result

Product frontier: PCR-06. Previous goal turn was progress: explicit factory/Rule
composition with 151 passing selected tests. Operational support remains separate
in the existing ledger, with no new blocking prerequisite.

Context mode: standard. Controlling selectors: PCR outcome/sequence; current
completion ledger; exact-uint64.ts representation boundary and its existing CLI
test; typed Rule literal decoder; v5 numeric contract/support; Rule planner and
predicate emitter; native observer and numeric test helpers. Each closes a scope,
representation, preservation or verification obligation. No delegation, runtime
handoff, wider source scan or experiment harness was used.

Decision: select an explicit exact Rule version and emit bigint expressions;
preserve the existing source schema and prior defaults. Source literal and
factory coverage remain visible work, not a smaller replacement goal. ARE
route/context and exact effect assessment reuse the user's construction
authorization without admission or external authority.

The nine-file envelope is the Rule planner, predicate emitter, new exact helper,
collection observer, Rule tests, new contract, this report, STATUS.md and
CLI-COMPLETION.md. Final regression, source-identity verification and ledger
synchronization close this bounded input-realization unit. The full working-CLI
goal remains active. Experiment harness: not applicable to this product task.

## Open questions

No new numeric representation decision is needed for the existing exact profile.
Next required reconciliation is authored full-width UInt64 literals through an
explicit checked source contract, preserving v1 behavior and preventing older
emitters from accepting a representation they cannot realize. Then propagate
exact values through the checked field model and factory composition. The wider
remaining work is in [CLI-COMPLETION.md](CLI-COMPLETION.md).
