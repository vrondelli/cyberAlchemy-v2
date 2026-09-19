# Configured Event data generation

Date: 2026-09-09. PCR-06 construction, selected as a prerequisite while examining
configured Operation generation. Authority effect: none.

## Product frontier

The checked Event source now compiles to a native TypeScript readonly occurrence
type, an explicit constructor and a frozen source/provider descriptor. This is
an opt-in planner, not public CLI integration or full PCR-06 completion.

Operation investigation found that typed Operation v1's closure recursively
requires typed contracts for effects, while current Event nodes use their own
FieldSpec source and have no typed Operation closure contract. The old TypeScript
Event renderer emits interfaces and a compatibility predicate, not construction.
The existing bound-action provider uses explicitly supplied Event values and
an atomic state/outbox boundary. Generating a no-effect Operation would not close
that gap. Event data construction is therefore the concrete prerequisite built
here; Operation contract/binding and atomic execution still remain.

## Meaning and representation

`planConfiguredEvents` consumes one registered checked graph, its checked
composition boundary, an explicit `configured-events-selection/v1-candidate`
selection and exact configuration/profile/contract source bytes. Each selected
Event generates two files under `features/<feature>/src/domain/events`:

- `<event>.provider.ts`: `EventInput`, `EventValue` and the `make` arrow.
- `<event>.ts`: exported value/input types and one frozen descriptor-bound callable.

The returned value has separate `type`, `version`, `occurrence`, `occurredAt`
and `payload` fields. Authored field IDs remain exact quoted keys inside their
respective objects. Payload fields called `type`, `version` or `payload` cannot
overwrite metadata; an occurrence field called `payload` remains an occurrence
field. No Event is represented as an Entity or registered as a data factory.

```ts
const fact = eventSettled({
  occurrence: { "occurrence-id": "submission-42" },
  occurredAt: "2026-09-09T11:00:00Z",
  payload: { /* exactly the Event's authored payload fields */ }
});
```

This is construction of data, not proof that a business fact occurred or reached
its durable checkpoint. Same payload with different occurrence IDs stays
distinct; repeated construction with the same ID is allowed and performs no
deduplication. The eventual Operation/transaction integration owns durable
state and outbox behavior. No Event publication or occurrence registry is added.

## Value profile

The explicitly selected `domainspec.event-values/v1-candidate` supports every
current Event FieldSpec carrier, both required and optional fields:

| Source field | Native result | Input boundary |
| --- | --- | --- |
| string | string | No coercion; empty strings remain data |
| boolean | boolean | No numeric/string coercion |
| integer | bigint | Exact signed 64-bit; bigint, canonical decimal string or safe integral number |
| decimal | number | Finite binary64; negative zero canonicalizes to zero, no decimal-exact arithmetic claim |
| timestamp / uuid | string | Nonempty text carrier; no format, chronology or uniqueness proof |
| reference | selector-indexed string | Nonempty carrier, source-bound target identity; no lookup or embedded value |

An absent optional field remains absent. Present `undefined` or `null` rejects.
Occurrence identity is required, with its declared field type preserved. It is
not silently replaced with an Entity ID or a synthesized UUID.

Reference targets may be Entity, Value Object, Enum or Event as permitted by the
existing parser. Self and cyclic reference identities do not recursively embed
data or create runtime imports. Target source and body digests are bound into
the descriptor. A target-body change updates evidence without changing the Event
provider's value semantics. Plain strings remain accepted reference inputs; the
native selector annotation distinguishes typed carriers, not runtime existence.

The current Event grammar is FieldSpec-based. It does not author arbitrary
nested type-algebra payloads. This unit covers that complete current grammar;
it does not claim a new typed Event source schema or silently reinterpret
references as nested Entity/Value Object values.

## Time and effect boundary

- `required`: time is an explicit `occurredAt` input; the callable has no clock
  parameter and does not read an ambient clock.
- `generated`: the callable requires a synchronous `clock: () => string`.
  It validates and copies the complete input before calling that dependency
  exactly once. Supplied time is rejected in this form. Clock exceptions remain
  exceptions; invalid/async clock results reject without returning an Event.

The outer value, occurrence and payload objects are fresh and frozen. Input
objects are not frozen or mutated. Accessor-backed, inherited, symbol-bearing,
hidden, extra or missing fields reject before value access; scalar coercion
hooks are never called. Claims cover inert data and standard intrinsics, not
arbitrary Proxy or modified-realm isolation. The explicit clock itself is a
caller-bound dependency, not code this generator proves pure.

## Provenance and compatibility

Descriptors bind source Event bytes, type/version, occurrence schema, time
policy, payload, referenced target identities/bytes, value profile and generated
provider hash. They explicitly deny publication, occurrence registration and
distributed exactly-once delivery. Plans are immutable, deterministic and
non-writing; unsafe paths, forged checked objects, cross-graph selections,
unknown versions/roots and changed profile bytes reject.

No parser, source-selection ancestor, canonical relationship, frozen profile,
default generator or prior test assertion changes. Only the new Event suite is
added to the package's normal test list. Old generated forms remain available
through their unchanged defaults. Public selection is still a later PCR unit.

## Validation

Final focused run: **9/9 PASS**, zero failures/skips, **27.50 seconds**.
The earlier eight-test run passed in 25.45 seconds. Source typecheck initially
passed, including frozen catalog/relationship/integration-profile checks.
The final 27-suite regression passes **322/322**, zero failures/skips, in
**306.34 seconds**, with two test workers. A concurrent container typecheck
could not resolve its compiler through the temporary host dependency symlink;
the normal typecheck passed after that host-only link was removed. No compiler
source or dependency resolution changed for that environment-path failure.
The exact temporary link was checked before removal; the retained dependency
mirror and pre-existing CLI dependency link were not removed or modified.

Tests compile emitted JavaScript and declarations with pinned TypeScript 7.0.2
and execute fresh processes. The independent native AST observer reads authored
node files, not the generator's semantic claims; it checks the input/output type
forms, normalization order, exact fields, clock policy, returned identity/type/
version, support perimeter, binding shape and reference/source/provider hashes.
Six compiling provider mutations, three binding mutations and two clock mutations
are rejected. Native declaration consumers check readonly fields, exact integer
results, type discriminators, reference distinctions and clock signatures.

Hostile tests cover full signed integer boundaries, overflow, unsafe numbers,
noncanonical strings, getters, coercion hooks, missing/extra/hidden/symbol fields,
optional absence, invalid primitive values, invalid clocks and caller immutability.
All occurrence-ID carrier kinds and metadata-like payload names have native cases.

## Task-session and continuation

Arcanum orchestration selected task-session with context-builder, local execution
and no subagents or runtime handoff. The original Operation target was retained;
source investigation identified this Event construction dependency rather than
substituting a no-effect Operation. No blocker-level product decision was needed.

Selected context: PCR configuration Event/Operation rows and PLAN native forms;
BODY_CONTRACTS.Event / Operation and FieldSpec validation; typed Operation v1
closure dependencies; existing default Operation/Event renderers; the exact
TypeScript Event/Operation profile overlays; state-changing and financial-
settlement provider contracts; checked composition boundary; Policy/Calculation
planner and native observation conventions. Each closes a source, representation,
effect, compatibility, integration or verification obligation. Other historical
admission work remains evidence only and was not replayed.

ARE request 041 selected IMPLEMENT; direct context digest
`fc9939a375c4e60f7566e6586f549d6357ad5a959784a965c78739b920938f51`.
The exact ten-file effect envelope was admissible, with no additional owner gate:
`ee0b36439ac5b2789e141cf203364fd324f0fcda875c93f62b11503e6b172a9e`.
Existing user construction authorization applies. Experiment harness is not
applicable. No admission, activation, default cutover or publication is implied.

ARE continuation selects the return to Operation generation, decision
`10b3ba7d57f35953bc394fea54bf06dd1129dcead25f53f6bb823555b0050562`.
The next option is structurally admissible with no additional owner gate;
repository writes still require their next exact bounded envelope. This Event
unit is complete; the full CLI goal remains active.

Next: return to Operation source/binding design using this Event construction
boundary, then implement actual bound-action generation and atomic state/outbox
behavior with explicit failure outcomes. Workflow, State Machine, Interface,
shared CLI planning, Python/Rust parity and installed-package verification remain
on the full completion ledger. Future operational authority tasks do not block
this local construction and are not authorized by it.

## Exact implementation identities

The package delta is exactly the new Event test entry. All 18 previously recorded
Policy implementation/test/source identities other than that package manifest
remain unchanged. The current ten-file envelope has no trailing whitespace.

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/configured-events.ts` | `4b18890fabaa1c56bf35560d3436d07f30190f202b6a59bf526376a8321257c8` |
| `impl/cli/src/generation/configured-event-source.ts` | `f5481fc3e97e65cd7268ab09f57a5bb20d43fbd8b3b6e8cc21cc65d18caa97ad` |
| `impl/cli/test/generation/configured-events.test.ts` | `48651365be4cce45c6f34d8d53b7ead7f008ce8cf10f89f8584ec3b0dd9d6a03` |
| `impl/cli/tools/observe-configured-events.mjs` | `f727f88accae40c7a38f5da7df3c926064bf7bfd752580a247b0a33356f620b5` |
| `impl/cli/package.json` | `bc503827c3a6d8e9db41fb822e5db29b563274a7c72be64128749106a0a395fc` |
| `development/reconciliation-v1/profile-compiler-reconciliation/event-generation-contract.json` | `fd9e1a0af836f99e066e340eb0d3fdc184dfa8c832abf23d22fd05fc6394eb1b` |
| `development/reconciliation-v1/ontology/event-generation-candidate.json` | `8d81d486114284fce1e3f6d623e6ce4c17c2e13abff16d0e156b4002b579c7aa` |
