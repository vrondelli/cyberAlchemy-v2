# Descriptor-bound typed Mapping generation

Date: 2026-09-09. PCR-06 / bounded DSR-014 product construction.
Authority effect: none. Not public CLI integration, profile admission or full
13-type / 39-realization completion.

## What is implemented

A Mapping projects explicitly supplied, typed values into declared target fields.
It does not calculate a missing value, query storage, construct an Entity, execute
an invariant or create an implicit relationship.

The new closed source contract, `domainspec.typed-mapping/v2`, adds ordered
typed inputs and field value expressions to the core project graph. It is
separate from the preceding [declarative composition v2](MAPPING-INPUTS.md).
The new configured TypeScript generator supports this source and existing
typed Mapping v1, using an explicitly selected exact field compilation and the
same graph's registered composition boundary.

A computed total can be supplied directly:

```json
{
  "schema_version": "domainspec.typed-mapping/v2",
  "ontology_mapping": "COMMERCE-SUMMARY-MAPPING",
  "inputs": [
    {"name": "order", "type": {"kind": "named", "selector": "commerce:order"}},
    {"name": "order_total", "type": {"kind": "scalar", "name": "UInt64"}}
  ],
  "target": "commerce:summary",
  "fields": [
    {
      "target": "id",
      "value": {"op": "path", "root": "order", "properties": ["COMMERCE-ORDER#id"]},
      "default": null
    },
    {
      "target": "total",
      "value": {"op": "path", "root": "order_total", "properties": []},
      "default": null
    }
  ],
  "total": true
}
```

This fragment requires matching checked declarations: Order has the referenced
String identity property, Summary has exactly String `id` and UInt64 `total`,
and the Mapping has its canonical `maps` edge to Summary. The closed v2 node body
contains description, target and typed_contract. It has no legacy source or
direction field. Inputs may also be empty for an explicitly constant projection.
Inputs are limited to 128 and target bindings to 256, with unique names.

Generated artifacts use the selected profile's application role:

```text
commerce/features/commerce/src/application/mappings/
  order-summary.provider.ts   typed projection arrow and static value normalization
  order-summary.ts            callable bound to an immutable source/provider descriptor
```

The provider exports a typed `map(parameters)` arrow. The binding exports the
source-derived callable with its frozen descriptor; native compilation emits
JavaScript and declarations. The descriptor binds source schema, ontology,
explicit inputs, target fields and types, totality, fallback meaning, exact
numeric profile, field model, provider bytes and source evidence. Planning
returns immutable artifacts and does not write files.

## Semantic boundaries

- Scalar, named, optional, list, set and sum inputs preserve their checked
  types, including nested Entity, Value Object and Enum values.
- Exact UInt64 input accepts canonical decimal strings, bigint, or safe
  nonnegative integer numbers; generated values and literals remain bigint.
- Ontology property identities select fields; local field names do not replace
  those identities. Paths can project through lists/sets of named values.
  There is no implicit optional unwrapping or sum-payload traversal.
- Lists retain order and duplicate occurrences. Explicit `to_set` removes
  duplicates under the declared value equality. Supplied set data must already
  be unique; normalization rejects duplicate input members.
- A payload-free Enum variant expression is supported. Arbitrary calls, inline
  calculations and payload-constructor expressions are not introduced.
- V2 default is an explicit, lazy nullish fallback on a nullable value expression.
  Its result must match the target field type. All declared formal inputs,
  including an unused fallback input, still validate before projection.
- V1 fallback applies to an absent source property only, never an explicit null
  or empty String. Partial v1 projections can omit absent optional fields;
  total v1 projections reject a missing bound field without fallback.
- Totality requires every target field exactly once. Partial results expose only
  declared fields and are not complete instances of the target Entity.
- Output objects and nested values are frozen copies. Caller data is neither
  mutated nor frozen. Structural normalization does not run Value Object
  invariants or Entity construction/ownership rules.
- The existing `maps` authority permits Entity or Interface targets, not Value
  Object targets. This typed field generator currently realizes Entity targets;
  Interface is not a checked record declaration in this field model. Nested
  Value Objects are supported without inventing a new canonical edge.
- The configured v1 path checks the complete declared source shape. It is
  deliberately stricter than historical untyped projection helpers; optional
  source-to-required-target conversion is not inferred from a missing-only
  default. This does not change the old default renderer.

Changing the supplied total changes the output without adding a Calculation
call. A Mapping remains a projection, a Calculation remains a computation,
and domain edges remain separate from value argument bindings.

## Source selection and compatibility

`configuration-mapping-v2-sources.json` is a new predecessor-bound source
selection. It names the exact prior Rule-v2 selection and its digest, preserves
its predecessor hashes, binds the updated project decoder and exported value
decoder, and separately binds the new Mapping decoder. The configuration loader
validates the full chain and support path/bytes.

The old configuration and Rule-v2 selection files are not refreshed to conceal
source drift. They now reject against the changed parser sources. Existing
profile roles, 39-cell catalog and planned/blocker status fields are unchanged.
New source v2 requires the configured Mapping path. Unsupported default
TypeScript/Python/Rust entry points reject it before returning artifacts.

Shared value-expression lowering was extracted from the structured Rule
renderer, preserving its established output. The historical complex Rule
fixture remains 7,931 bytes, SHA-256
`f3b6c9a9a4394b95705644458819c05dbb6bdc4557d477ad75eb03809c3cffb9`.

## Validation and evidence limits

Final focused tests: **9/9 PASS**, zero failures or skips, **26.79 seconds**.
Source typecheck and frozen catalog/relationship/integration-profile checks pass.
Final 23-suite shared regression: **282/282 PASS**, zero failures or skips,
**296.04 seconds**, with two independent test-file lanes. It covers configured
Mapping/Query/Calculation, composition boundaries, factories, Enums, field and
reference models, configuration, Rules and structured Rules, profiled projects,
project decoding, exact UInt64, typed operations/hardening/native Rust,
declarative Mapping inputs, guarded/portable functions and project/outbound
composition. The new Mapping suite is included in normal package discovery.

The native fixture compiles five selected Mapping providers and bindings with
pinned TypeScript 7.0.2, emits declarations and executes JavaScript. It covers
full-width totals, nested values, explicit defaults, partial and zero-input
projections, complete source validation, source relocation, deterministic
selection/layout, frozen descriptors and caller preservation.

An independent native AST observer checks input bindings, value expressions,
target projections, source-presence guards, the pinned normalizer support and
the allowed source call/write perimeter. Ten deliberately changed providers
still compile but fail observation: same-type input substitution, changed
fallback, removed set conversion, changed output arithmetic, clock/global/
deferred effects, prototype mutation, alias freezing and a normalizer write.
Three semantic mutations are also distinguished by execution in fresh processes.

Hostile controls reject getters without calling them, coercible values, unsafe
numbers, overflow, sparse arrays, invalid sums, duplicate sets, missing identity,
extra fields, forged snapshots and stale/cross-graph selections. Canonical
Mapping-to-Value-Object rejection is retained explicitly.

This is bounded source/behavior evidence for inert data in the pinned native
environment, not a proof for arbitrary Proxies, modified JavaScript realms,
arbitrary TypeScript, resource exhaustion or OS-wide effects.

## Task-session record

Task-session and context-builder retain the exact 22-file envelope (19 original
files plus three configuration integration tests). Context
covers the CLI ledger, PCR configuration/profile role, DSR-014 and its explicit
input precursor, core decoder/default semantics, canonical maps endpoints,
checked fields and composition boundary, shared Rule renderer and native
observer controls. Native local execution; no handoff or subagents. Current
user authorization covers the implementation; no material decision was needed.

ARE request 039 selected IMPLEMENT and direct context. The first effect assessments
(the 16 implementation/evidence files and three parser-source configuration
files) were admissible without a new owner gate. No old profile interpretation,
canonical edge, public default, admission or publication was selected.
The shared renderer avoids duplicating the existing typed-value semantics.
A third exact effect assessment added only the three Enum/Rule/factory
configuration integration tests, with admissible posture and no new owner gate.

Initial test fixture path/schema mistakes were repaired. The attempted
Value Object target fixture exposed the existing canonical edge restriction;
the test now confirms rejection, without changing the relationship authority.
The first 23-suite regression completed 282 tests: 280 passed and two
configuration integration cases failed against the historical Rule-v2 parser
snapshot. All three current consumers (Enum, factory and Rule) now select the
explicit successor; focused rechecks pass, while the negative test still
requires the historical selection to reject. The fresh full run passes all
282 tests against the final bytes recorded below.
Experiment harness is not applicable. Historical work-item/admission records
and unrelated dirty files are not synchronized or rewritten.

## Exact source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-backend/mapping-inputs.ts` | `836d4999fe4a40299c55daa2774318b6bccef9fb773668269b9c285758275e47` |
| `impl/cli/src/typed-operation/contracts.ts` | `dca97992f5624c2f039227ad9d198b91e357d7c2898532407566759c641e28fd` |
| `impl/cli/src/input/project-model.ts` | `8352a74c41cded7d9a18a79344a00b684d25c90fd6bb9ba3d34b90f78a210121` |
| `impl/cli/src/generation/generators.ts` | `f0ffe705e3a96d9e4e957d58d7349495c524338f8ccb212722092b096495698a` |
| `impl/cli/src/generation/configured-value-expressions.ts` | `4855926547a452396d7ffd8eae79d7bc57943a7f1a0d26984b7eb31ef3c747c3` |
| `impl/cli/src/generation/configured-rule-values.ts` | `efc8b5fe7a34ee3d50da0502f9742225b952a30caf42fa1cfa07f77c0dd5fca9` |
| `impl/cli/src/generation/configured-mapping-source.ts` | `d6ebf78b82af82aaec9c5b2f0a7e84d0d15ac097fead1f9376a69c728fd3e727` |
| `impl/cli/src/generation/configured-mappings.ts` | `1966dab7aa2d7b161b37f69408e820c55f1aea758fcf3365615d9f8e9be470e0` |
| `impl/cli/test/generation/configured-mappings.test.ts` | `4e3138bd0b473fde84e250cf1faf83fa595a770ead7395f4e809208a39ad7070` |
| `impl/cli/tools/observe-configured-mappings.mjs` | `c23569a5e21c86370259575492bd58fb713529da9e0524f3de73166aad5adf25` |
| `impl/cli/package.json` | `6f17c6ad04f3a4e2c69fa68efdcd24d6109083c6c8171a4679d365ccf9d64e34` |
| `development/reconciliation-v1/profile-compiler-reconciliation/mapping-generation-contract.json` | `626f05cb4fe01ec0552e1c2c939abf712235ed84fee319ac38a81148e6449c73` |
| `development/reconciliation-v1/ontology/mapping-generation-candidate.json` | `e6d64eb075f131b0e880ef770b4dd0326a9f8595183716f0513f9e3d7e361a83` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs` | `769583547ea78b3f9e9dbe873352685eb5d80b809b32b18171a34d1f075e8522` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs` | `61bab54de911738591362430d5a130bc5a0d92d8d2bf911b1ce74942c9ff7f80` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration-mapping-v2-sources.json` | `b4a3bc2ff6a4665354d32187dddd9c49d04f6693f4e5880786e8d425d75a3cce` |
| `impl/cli/test/generation/configured-enums.test.ts` | `2464d3d811ef8e917576c42a991f3998d1674c507385e6f90f351b40f93b119f` |
| `impl/cli/test/generation/configured-rules.test.ts` | `28aa57fe6b957d3a2194a7b1c4f438de6879f0e7e8f0608c3ad2f009a5bc432c` |
| `impl/cli/test/generation/configured-factories.test.ts` | `7bd62eef862353374d3a6c030c8f884979ef1e1b6f9a591abcc8f5880f2c624d` |

## Remaining construction

Policy must reuse declared Rules and keep selection separate from execution.
The remaining orchestration types, reconciled Python/Rust realization, shared
public CLI selection, all 39 cells, compound commerce, compatibility and clean
installation still require implementation and verification. This candidate
does not complete DSR-014's broader composition reconciliation or PCR-06.
AlchLang authoring reconciliation remains deferred.
