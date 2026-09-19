# Exact UInt64 generated factories

Date: 2026-09-09. PCR-06 continuation under the working-CLI objective.
Authority effect: none. Tested candidate construction does not imply profile
admission, public command integration, default cutover, publication or release.

## Explicit selection

`domainspec.configured-factories-selection/v11-candidate` consumes the exact
[checked field model](EXACT-FIELD-VALUES.md), selected as
`domainspec.project-field-selection/v2-candidate`. Its required `rule_selection`
chooses either configured Rule v6 or v7 with
`domainspec.typescript-exact-uint64/v1`. V7 is required when the selected Rule
closure contains typed Rule v2 decimal literals. V6 remains usable for v1 Rule
source, and v6/v7 produce identical artifacts for the same supported v1 inputs.

[The new factory contract](exact-factory-contract.json) binds this combination,
the exact field contract, unchanged Enum provider and new inline support bytes.
The complete source set includes the previous Rule contracts, exact Rule
contract, and v7 literal contract when selected. Missing, extra, stale or
mismatched selections reject before returning an artifact plan.

The compiler retains the existing checked graph and factory binding mechanism.
It does not add a parser, reinterpret semantic relationships, inline a Rule into
a Policy, or synthesize calculations. Every validator still points to a declared
Rule with exactly matching arguments and checked dependency/artifact digests.

## Generated values and code

The new private `ValueProtocol<bigint>` accepts in-range bigint values,
nonnegative safe integer numbers, and canonical unsigned decimal strings.
It stores bigint without a Number roundtrip. Zero through
`18446744073709551615` is supported; unsafe numbers, overflow, signs, leading
zeros, exponent/hex notation, fractions, whitespace and terminal line separators
reject. Numeric input normalization does not change String or Bool fields.

Generated immutable fields expose native bigint types:

```typescript
export interface ContactFields {
  readonly "zz_count": bigint;
  readonly "zz_list": ReadonlyArray<bigint>;
  readonly "zz_matrix": ReadonlyArray<ReadonlyArray<bigint>>;
  readonly "zz_maybe": (bigint) | null;
  readonly "zz_set": ReadonlyArray<bigint>;
  // Other declared fields retain their respective types.
}
```

A named sum's input type accepts all numeric input representations, while its
owned case type contains only the normalized bigint payload. Thus callers can
construct a numeric case using `"18446744073709551615"` and narrow its stored
payload to `bigint`; they cannot accidentally treat that stored value as text.
Named child inputs continue to require their selected provider's owned values.
Factories retain the existing `unknown` construction boundary and typed result;
this unit does not invent a second factory input API.

All previous field constructors compose: scalar, named, optional, list, set,
inline sum, named Enum/sum, embedded Entity and Value Object. Lists preserve
occurrences and order; sets reject normalized duplicates and return owned,
canonical copies. Missing optional fields normalize to null. Named/inline sum
tags do not collapse when their payloads match. Child state and nested arrays
remain owned/immutable without freezing caller-owned inputs.

Entity equality remains identity-based, including full-width or composite
Value Object identities. Value Object equality considers all fields. Every
Entity field is still validated even when it does not participate in identity.
Reference descriptors preserve targets and type-only indexed imports; their
full-width values do not trigger target lookup or existence checking.

## Rule composition and construction routes

Normalization and child ownership checks happen before declared validators on
`create`, `reconstruct`, and Entity `transition`. Base validators and additive
extensions retain their order and local scope. A Value Object's authored
invariants require exact base-validator coverage. An extension cannot remove a
base check, mutate another factory, or change an Entity's identity.

V11 supplies normalized bigint scalars and scalar lists/sets to exact Rules.
Required owned Entity/Value Object paths can lead to these endpoints, with exact
declared argument types. Full-width literal thresholds and mixed-version Rule
dependencies use the existing v7 generator. There is no expression interpreter
inside the generated factory.

Named Rule arguments, optional Rule endpoints/traversal, nested collection Rule
endpoints and sum payload traversal remain subsequent Rule work. These limits
do not restrict nested *data fields* already implemented above, and they do not
remove that promised Rule coverage from the full completion plan.

## Plain Enum compatibility

The explicit `domainspec.configured-enums-selection/v2-candidate` consumes exact
checked fields without relabeling them as v1. It still accepts only plain Enum
cases and emits the same owned constant-object definition/provider artifacts as
v1. Payload-bearing sums remain the separate sum generator. Its new plan binds
the exact model/certificate and selection; identical artifacts do not mean
identical compilation provenance.

V11 projects its plain Enum closure using the exact field selection and the new
Enum selection. The standalone planner verifies both pairings. Previous Enum
v1/factory v1–v10 reject exact snapshots, and new selections reject JSON-safe
snapshots. Earlier generated output, JSON-safe support, Rule helper/emitter,
Enum provider and original configuration are preserved. Historical reports retain
their tested byte identities instead of being rewritten as successor evidence.

## Verification

- Focused exact-factory suite: **8/8 PASS**, no skips, **22.83 seconds**.
- Full CLI source typecheck, frozen catalog, relationship and integration-profile
  checks: **PASS**.
- Final twelve-suite regression: **206/206 PASS**, no failures, cancellations or
  skips, in **336.97 seconds** on final source bytes.
- Observer syntax and whitespace checks across the exact eleven-file envelope:
  **PASS**. Files are untracked development candidates; direct content checks
  cover them in addition to scoped git checks.

The focused suite runs `impl/cli/test/generation/configured-factories.test.ts`
with `--test-name-pattern='PCR-06 exact factories'` under the pinned Node/tsx
setup. The broad command is the unchanged twelve-suite command in
[the Rule-literal verification report](EXACT-RULE-LITERALS.md#verification).
Native generated-code compilation uses the existing pinned TypeScript 7.0.2
container with networking disabled; no replacement toolchain was installed.

Evidence includes:

- Explicit v11/v6/v7 and Enum v2 selection, source/field digest mismatch rejection,
  deterministic source relocation/reordering, snapshot-only planning and closed
  option/argument boundaries.
- Full-width values, adjacent maxima and cross-representation equality compared
  pairwise against the independent checked-field semantics, through nested
  lists/sets/optionals and tagged/owned sums.
- Native bigint field/result types, readonly containers, exact sum input/output
  types and negative consumer compilations for wrong numeric forms/mutations.
- Embedded Entity identity, composite identity transitions, foreign snapshot
  rejection, normalized duplicate detection and type-only references without
  lookup.
- Both independent factory and Rule native AST observers, with test-authored
  imports, bindings, support hashes, field types and selected Rule profile.
- Every construction route, full-width Rule thresholds, local additive extensions,
  malformed numeric forms, coercion/accessor traps, hidden/symbol properties and
  normalization-before-validator failures.
- Three deliberately faulty generated helpers compile natively but disagree with
  independent outcomes: Number-roundtrip normalization, overflow acceptance, and
  precision-losing equality keys. The unchanged expected support identity rejects
  all three in structural observation as well.

Structural observation is not a semantic proof; runtime comparisons and negative
native consumer tests supply separate evidence. Arbitrary executable Proxy traps
are not an isolation/security guarantee of this input boundary.

## Source identity

Paths below are relative to `impl/cli` unless stated otherwise.

| Source | SHA-256 |
| --- | --- |
| src/generation/configured-factories.ts | af414c493ffc9119a233c432c87667b52bebdf086f7554ae8a79d7a173a7ea4e |
| src/generation/configured-enums.ts | d44c301f2b54b5f754248d25e05d51672a6789fa610e9c273c7ad068e2a05976 |
| src/generation/configured-factory-source.ts | fc26b5514d4df5426648e7c38dffbc9fd434b02440975cb5822869184dd1581b |
| src/generation/configured-sum-source.ts | 89c33b63135586228fcdd47ae63be442cd11d941d0a0ba60e44e3d672f5d4457 |
| src/generation/configured-exact-uint64-source.ts | 442bd9981d7235b556f28c2a46815c874fcf1a3d3584018948d9b232e883fce1 |
| tools/observe-configured-factories.mjs | 4ce706b0a6058a055620cc28feeae0997b75b62d4ab585034a6cd0edacd62cc1 |
| test/generation/configured-factories.test.ts | 2314cfacf3eeb5318dbca3e55bd6e810a94fc13fb2b25d84f8bf9d9a0e59c069 |
| exact-factory-contract.json (this package) | 9fe79d423a6aaada5a62089953354c79d709f298ded49688983195a96b26fde9 |

Preserved: exact field model
`7743dbaf6d8c3d5286366484fa835bcc18da481a666a5d7aeeae5807f995d484`;
checked adapter `95ded160d86a88a05f19c13d9893ec6110be59fe9c8a68653cdde50fe9537e26`;
exact Rule helper `a1918e8f4e968940185801a6f9a733af32495b2bc55774b0c313fb6d5bc7d92a`;
Rule planner `e5b6dfa0a0f5ac49a26a228c23b37471aea46fac80989754cafc4e1c65b84352`;
Rule observer `ab463c9cb714f62d88e15bd4eb4c99510d9ab7b43c185c271dac2de7c4573e51`;
JSON-safe helper `ad15b42408f33c07cfda4279fa409581edcac4114ccc8f15260d23367992315f`;
original configuration `77a7ec204fa575c52a1f3c126ce839206c81154e9bbd3541eb2ad992143631eb`.

## Context pack and task-session result

Previous goal turn: verified progress, with exact checked fields and 198 passing
regressions. Current unit: PCR-06 exact factory realization and Rule composition.
Full goal remains all 13 backend metatypes across TypeScript, Python and Rust,
shared public entry points, composition, compatibility and clean installation.

Context-builder mode: standard, expanded for the named-sum and plain-Enum
dependencies. Selected sources: PCR outcome/ledger; exact field contract/adapter;
v10 factory composition contract/planner; factory/sum/number emitters; exact Rule
contracts/helper/selection; Enum planner/provider; factory and Rule observers;
relevant fixtures and native test harness. These cover selection integrity,
no-loss representation, composition, ownership, references, compatibility,
independent observation and executable checks. Strict obligation coverage: pass.
No broad history recovery, external research, delegation or runtime handoff.

Decision: reuse existing exact semantics through an explicit v11 selection rather
than silently widening old helpers. New Enum selection keeps exact provenance
while preserving unchanged plain-case meaning. Cost: explicit version checks and
a separate numeric helper; benefit: previous output and input contracts remain
stable. No owner-level semantic or operational decision is outstanding.

Task-session result: **PASS for this bounded unit**, not completion of the CLI.
ARE route/context/effect assessment used the existing construction authorization;
it does not confer authority. Native execution only. Exact eleven-file envelope:
factory/Enum planners, factory/sum emitters, new exact helper, factory observer,
factory test suite, new contract, this report and the two progress ledgers.
All other source/profile/provider bytes remain outside this write scope.
Experiment harness: not applicable; native semantic/mutation evidence is above.
Synchronized records: this report, CLI-COMPLETION.md and STATUS.md.

## Open questions

No new blocker for this unit. Wider Rule argument/value normalization is next;
its typed closure already retains named declarations and ontology property
selectors, while current configured emission explicitly limits inputs to scalars
and scalar lists/sets. Preserve those contracts when adding the successor.
PCR-06 remains in progress, and PCR-07..14 remain required. Public integration,
three-language parity and installation are not proven by the candidate tests.
