# Exact UInt64 field and reference values

Date: 2026-09-09. PCR-06 continuation under the working-CLI objective.
Authority effect: none. This is candidate construction, not admission, a default
cutover, public CLI integration, or completion of the full compiler plan.

## Selected value model

The new `domainspec.field-reference-model/v2-candidate` selects the language-neutral
`exact-uint64/v1-candidate` value profile. The checked-project adapter selects it
through `domainspec.project-field-selection/v2-candidate` and the exact bytes of
[its contract](../contracts/exact-field-and-reference-model.json). Declarations
remain checked `typed-record/v1` and `typed-sum/v1`; there is no new metatype, no
database schema, and no reinterpretation of Entity as a generic record.

UInt64 positions accept bigint values, nonnegative safe integer numbers, or
canonical unsigned decimal strings from zero through `18446744073709551615`.
An unsafe JavaScript number is rejected even if it happens to represent a valid
integer: precision may already have been lost before the function receives it.
Signs, whitespace, leading zeros, fractions, nonfinite values, overflow, boxed
values, hex and exponent spellings reject. Negative numeric zero normalizes to
zero. String and Bool positions do not acquire numeric coercion.

The typed equality key stores the exact numeric value as a canonical decimal
string, tagged as UInt64. For example, a declared Money Value Object produces:

```json
["Value Object","commerce:money",[["amount",["UInt64","18446744073709551615"]],["currency",["String","GBP"]]]]
```

This is an equality key, not a persistence format or generated application value.
The source model remains closed JSON data; accepting bigint runtime values does
not permit bigint in source declarations. The input layer reuses the existing
typed decimal predicate, not a TypeScript-generation helper. Other language
realizations must preserve these semantics using their own native values.

## Composition and distinctions

All existing scalar, named, optional, list, set and sum constructors compose
with exact UInt64 values, including nested containers and named sum payloads.

- Entity equality uses its declared selector and identity, while validating all
  supplied state. Changes to nonidentity state do not redefine its identity.
- Value Object equality uses its selector and all declared fields.
- Lists preserve order and repeated occurrences. Sets reject duplicate typed
  values after normalization, including `1`, `1n` and `"1"` at UInt64 positions.
- Optional absence remains distinct from present zero. Sum tags remain distinct
  even when two variants carry the same numeric payload.
- Identity references and field projections keep their explicit targets and
  exact projected types. They do not add semantic graph edges, look up another
  Entity, check target existence, or execute invariants.

Value inputs must be data-only plain/null-prototype objects and dense plain
arrays. Accessors, hidden properties, symbols, holes, extra array keys, derived
arrays and cycles reject. Validating or computing a key does not mutate or
freeze caller-owned values. This boundary is not an isolation mechanism for
arbitrary executable Proxy traps.

The checked-project result retains the graph certificate, exact selected source
closure, invariant references, unselected selectors and its deterministic digest.
Reordered selection input and relocated identical source produce the same result.
Once checked, planning uses the immutable snapshot without rereading source files.
Stale graphs/contracts and structurally similar unbranded objects reject.

## Compatibility and remaining generation

Model/selection v1 still selects `json-safe-uint64/v1-candidate`; its values,
declarations, bindings and equality-key encoding are unchanged. V1 cannot accept
v2 merely because their declaration shapes look alike. Version/profile/contract
pairings are explicit and included in the resulting digest.

Existing configured factory and Enum planners now reject exact checked fields
before inspecting generation options or producing an artifact plan. Factory v10
still selects JSON-safe Rule v5. This unit does **not** implement exact generated
factories, a new Enum provider, public command flags, or Python/Rust parity.

Next: introduce explicitly selected exact factory realization and composition
with exact Rule v6/v7. Preserve ownership, all field constructors, Entity identity,
Value Object validation, references, and independent observation in generated
native code. Shared public entry-point integration remains PCR-07; all 13 backend
metatypes across all three languages remain part of the completion ledger.

## Verification

- Both field suites: **28/28 PASS**, no skips, **0.82 seconds**.
- New exact-value cases alone: **12/12 PASS**, no skips, **0.80 seconds**.
- Full CLI source typecheck, frozen catalog, relationship and integration-profile
  checks: **PASS**.
- Final twelve-suite regression: **198/198 PASS**, no failures, cancellations or
  skips, in **323.62 seconds** on final source bytes.
- Scoped whitespace check: **PASS**.

The focused run uses the same pinned Node/tsx setup as
[the preceding Rule-literal report](EXACT-RULE-LITERALS.md#verification), selecting
`impl/cli/test/input/field-reference-model.test.ts` and
`impl/cli/test/input/compiled-field-model.test.ts` with
`--test-name-pattern='PCR-06 exact (field values|checked fields)'`.
The broad run uses that report's unchanged twelve-suite command.

Numeric tests compare every supported representation pair against independent
expected decimal keys at zero, safe boundaries and adjacent full-width maxima.
Generated short collection cases check occurrence/order versus uniqueness.
Three executable source mutants demonstrate detectable precision collapse,
whole-record Entity equality and missing set-duplicate rejection. These core
mutants run with the TypeScript loader; they are not claimed as native compiler
mutation evidence. Native generated-code evidence in the wider suites is for
previously implemented realizations, not exact factories.

An initial test expected identity-binding rejection from a self-referencing
metadata cycle; the compiler correctly rejected the cycle first. The fixture was
changed to a noncyclic, correctly typed projection onto an identity field, so it
now isolates the intended identity-binding check. No implementation relaxation
was made to satisfy that test.

## Source identity

Paths below are relative to `impl/cli` unless stated otherwise.

| Source | SHA-256 |
| --- | --- |
| src/input/field-reference-model.ts | 7743dbaf6d8c3d5286366484fa835bcc18da481a666a5d7aeeae5807f995d484 |
| src/input/compiled-field-model.ts | 95ded160d86a88a05f19c13d9893ec6110be59fe9c8a68653cdde50fe9537e26 |
| src/generation/configured-factories.ts | 8f0e584ef3223acad2915af76a3b7f2b0f5b5caa96cbc0ba52e7cda6c897e34b |
| src/generation/configured-enums.ts | 8a2c7931cf2910e29e95a0dae31b25705589f944032e0a4a37d00900d65f8b0e |
| test/input/field-reference-model.test.ts | 4df7248d2cf039a4f4e0f419b83ae22088076b1b47af83e93ff03784e9be5b38 |
| test/input/compiled-field-model.test.ts | 4221bdd5f0b1833a3e2baf9b76f44f1ce5da82d228e4d8804cf593c059dd5c68 |
| development/reconciliation-v1/contracts/exact-field-and-reference-model.json (project-relative) | 42b57f2517f6c7dcf24492acb76099def9f75926976df47a7b78d559640ea227 |

Checked Rule decoder/closure, project loader, configured Rule planner/predicates,
original configuration and explicit parser-source selection retain the tested
hashes recorded by the preceding Rule-literal report. No historical report or
contract was rewritten to claim the new bytes were previously verified.

## Context pack and task-session result

Task: PCR-06 exact checked field values, under the existing working-CLI goal.
Context-builder mode: standard. Controlling selectors: PCR plan outcome and
CLI-COMPLETION frontier; field model version, validation and equality functions;
checked-project selection/closure/certificate; configured factory and Enum entry
guards; exact Rule value/literal contracts; the two field suites. These cover
versioning, no-loss normalization, composition, identities/references, snapshot
integrity, backward compatibility and available validation. Strict obligation
coverage: pass. No fallback history scan, delegation or runtime handoff.

Decision: explicitly version the neutral field profile and checked selection,
reusing existing declaration semantics. Cost: one opt-in contract and a generator
boundary until the next unit. Benefit: old callers retain their value protocol;
exact generation cannot silently pass through the safe-number path. No material
owner decision is outstanding. ARE route/context/effect assessment remains
advisory; the existing user-authorized construction scope supplies permission.

Result: **PASS for this bounded unit**. Exact ten-file write envelope: two input modules, two generator guards, two field
test files, the new contract, this report, CLI-COMPLETION.md and STATUS.md.
Runtime: local native toolchain; adapter: none. Gate: no unresolved blocker.
Experiment harness: not applicable; focused semantic/mutation and regression
checks are recorded above. Synchronized records: report and two progress ledgers.
The bounded unit is not the full goal; exact factory composition is next.

## Open questions

No new blocking decision for this unit. Generated exact factories, wider Rule
inputs, public entry points, other native languages, whole-commerce composition
and clean installation are remaining implementation/verification obligations,
not unsupported-input waivers or evidence of completion.
