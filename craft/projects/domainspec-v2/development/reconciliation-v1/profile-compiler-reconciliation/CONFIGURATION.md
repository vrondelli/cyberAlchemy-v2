# PCR-05: complete candidate compilation configuration

Date: 2026-09-08. Status: candidate configuration; authority effect: none.
User authorization: `next`, continuing the approved PCR plan after L0 validation.
This is internal construction evidence, not a public language or release contract.

Successor source binding, 2026-09-09: [exact Rule literal support](EXACT-RULE-LITERALS.md)
changes the project loader and typed Rule decoder. The original configuration
and its source hashes below remain unchanged. Against the current checkout,
select [configuration-rule-v2-sources.json](configuration-rule-v2-sources.json)
explicitly with `--source-selection`; an unselected check correctly reports
source drift. This is not a profile/default cutover or a 39-cell code-generation
completion claim. Historical validation below describes its original bytes.

## Outcome and boundary

[configuration.json](configuration.json) adds a closed configuration mapping for
the existing 13 backend metatypes. [configuration.mjs](configuration.mjs) joins
that mapping to baseline @10 and the base/TypeScript/Python/Rust profiles. It
resolves **39 configuration cells**, each with its exact identity, source role,
native naming/import requirements, selected representation, inherited constraints,
input decoder, semantic obligations, supporting-module policy and blockers.

There is no second metatype registry: labels and IDs must match the existing
baseline exactly. The 117 baseline source/provider/binding references are checked
against current bytes. Twelve additional source files are digest-bound by this
candidate, including the parser, type contracts, graph relationship authority,
composition format, existing layout and parent work-item ledger.

Configuration resolution does not emit code, execute effects, verify authored
graph semantics, or prove a reference protocol generalized. Every resolved plan
returns `compile_ready: false`. L0's separately tested Entity/Rule/Query path is
unchanged. PCR-06/07 must connect the new contract to real generation; PCR-08/09
must realize Python/Rust. Reference provider status and profile-document status
remain distinct from generated-code conformance and from owner admission.

## Selected source roles

These are prototype choices within PCR-05, not edits to accepted layout v1.
Paths below are relative to one feature's module root and start with `src/`.
Python and Rust spell multiword folders and filenames with underscores.

| Metatype | Source role | TypeScript representation | Input contract |
| --- | --- | --- | --- |
| Entity | domain/entities | Validated extensible factory | typed-record/v1 + Entity body |
| Value Object | domain/value-objects | Validated value factory | typed-record/v1 + VO body |
| Enum | domain/enums | Owned constant-object protocol | typed-sum/v1 + Enum body |
| Rule | domain/rules | Boolean arrow function | typed-rule/v1 + Rule body |
| Calculation | domain/calculations | Pure calculation arrow | typed-calculation/v1 + Calculation body |
| Policy | domain/policies | Selector arrow | typed-policy/v1 + Policy body |
| Query | application/queries | Read-only arrow | typed-query/v1 + Query body |
| Operation | application/operations | Bound action function | typed-operation/v1 + Operation body |
| Workflow | application/workflows | Bound step orchestrator | Workflow body / decodeBody |
| State Machine | domain/state-machines | Discriminated-union reducer | State Machine body / decodeBody |
| Mapping | application/mappings | Bound mapping function | typed-mapping/v1 + Mapping body |
| Event | domain/events | Bound readonly occurrence record | Event body / decodeBody |
| Interface | application/interfaces | Bound structural contract | Interface body / decodeBody |

The actual language forms and descriptor contracts are selected from the exact
profiles, not reconstructed from this table. Python retains dataclass, Enum and
Protocol forms; Rust retains struct, enum and trait forms. A TypeScript
no-class factory rule is not generalized into a ban on native Python classes.
Rule has no representation overlay in these sources: its Boolean obligation
comes from the base constraints and its callable form from the language profile.
The resolver records a null protocol ID rather than inventing a Rule protocol.

## Input bounds and semantic distinctions

Existing decoder functions remain the input authority. PCR-05 records their
source identity and discriminator; it does not introduce a second body parser.

- Legacy `FieldSpec`: primitive or declared-node reference, plus `required`.
  Primitives are string, boolean, integer, decimal, timestamp and uuid. Reference
  closure is checked by the existing project compiler, not by naming previews.
- Typed contracts: scalar, named, optional, list, set and sum vocabulary;
  scalar names String/Bool/UInt64; property cardinalities one/optional/many/
  many-unique. Position-specific decoder restrictions still apply. This is not
  a promise that every type constructor is accepted everywhere or newly emitted.
- Entity and Value Object share a record-shaped wire contract but not meaning:
  identity equality versus complete normalized-value equality, different
  validation obligations and different lifecycle/immutability contracts.
- L0 remains required String/Bool fields, one Entity identity component, one
  feature, and an explicitly bound Rule. Its supported envelope is not enlarged
  merely by listing the broader parser vocabulary in this matrix.
- DSR-009 still owns composite identity, nested/reference realization and
  distinguishing an embedded value, Entity identity projection and storage key.
  Neither Entity nor record means database table or automatic DDL.
- DSR-011 still owns reconciliation of canonical domain edges, scoped composition
  references and typed value bindings. This configuration adds no graph verbs.
  A `maps-to` reference does not widen the canonical `maps` relation.
- Policy selects declared targets without executing them. Declared-Rule reuse
  remains an obligation, not a claim that existing inline typed predicates have
  already migrated (DSR-015). Domain policies carry target identifiers as data;
  their location must not cause imports into the application layer.
- Mapping receives computed values explicitly; it does not gain a hidden
  calculation dependency. Workflow step occurrence is not Operation identity.
  State Machine trigger, guard and output intent remain distinct obligations.
  DSR-014/016/017 are listed on the affected cells, not silently marked complete.

## Selection, layout, symbols and imports

The only request fields are `schema_version`, `language`, and `module_root`:

```json
{
  "schema_version": "domainspec.compilation-selection/v1-candidate",
  "language": "typescript",
  "module_root": "commerce"
}
```

The result uses separate feature module roots. Example naming preview:

```text
commerce/features/orders/src/domain/entities/order.ts
commerce/features/orders/src/domain/rules/order-is-valid.ts
commerce/features/orders/src/application/queries/find-order.ts
commerce/features/billing/src/domain/entities/order.ts
```

Each feature root is the origin for profile `source.path` checks, preserving the
existing anchored Rule/Operation constraints. Cross-feature duplicate names
stay distinct; duplicate qualified node identity rejects even across kinds.
This v1-candidate selection differs from the single-module L0 layout and does
not reinterpret `realizationProfile`, `outputLayout`, or application-layout/v1.

Names are a closed lower-case ASCII, hyphen-separated identifier subset. Native
Python/Rust file spelling replaces hyphens with underscores; underscore-authored
IDs, mixed-case/Unicode aliases, traversal, reserved words and portable reserved
device names reject. Types use PascalCase; callables use camelCase in TypeScript
and snake_case in Python/Rust. Supporting exports must be explicit. Actual
export collision and module-wiring proof belongs to PCR-07, not this preview.

Imports must target planned leaves with graph identity retained. TypeScript uses
relative `.js` leaf specifiers; Python needs explicit packages and relative leaf
imports; Rust needs explicit crate modules and `use` leaves. Shared helpers must
be explicit and digest-bound. A fixture provider is a proof reference, never an
automatically copied runtime module. Candidate protocol descriptors and overlay
activation references are retained as source evidence, not newly admitted.

Only the module root is a layout override. Callers cannot override source roles,
disable constraints, change protocols or assert compilation readiness. Profile
inheritance is parent-first; missing parents, cycles and repeated constraint IDs
reject. Unknown schemas, extra fields, missing/duplicate axes, language mismatch,
wrong input decoders, stale references and symlinked sources reject. Configuration
snapshots and resolved plans are immutable, process-local checked objects; copied
or fabricated objects cannot bypass the resolver through its helper APIs.

## Run and inspect

From the DomainSpec root, no dependency installation or compiler is required for
the configuration checks themselves:

```sh
node development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs \
  --source-selection development/reconciliation-v1/profile-compiler-reconciliation/configuration-rule-v2-sources.json
node --test development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs
```

The check writes nothing and reports 13 types / three languages / 39 cells.
For inspection, import `loadConfiguration`, `resolveConfiguration` and
`previewLocations` from the module. `previewLocations(plan, nodes)` accepts
`{feature_id, node_id, kind}` descriptors; it is a pure naming preview, not a
graph compiler or a write-path authorization. A future materializer must perform
its own destination containment, symlink and no-overwrite checks.

## Task-session evidence and continuation

Context-builder standard selection: PCR plan/STATUS; baseline @10; four
architecture profiles; project-model/typed-operation/typed-backend contracts;
composition ontology; relationship authority; layout; parent work-item ledger.
The matrix binds 12 source files; plan/status supply execution scope separately.
Selectors are the PCR-05 row, profile constraints/representation overlays,
BODY_CONTRACTS and decoders, type discriminators, and DSR-009/011/014..017 rows.
No runtime handoff or subagents. Experiment harness: not applicable.

Non-blocking prototype choices PCR-D02/03/04/05: per-feature module roots,
explicit source-role table, closed selection without semantic overrides, and
domain Policy versus application Mapping/Interface/Workflow. Benefit: bounded
configuration that preserves source roles and same-named concepts. Cost: the new
feature-root layout still needs PCR-07 integration and compatibility tests; it
cannot replace existing outputs. No new public syntax or domain meaning selected.

Validation: 11 configuration tests cover all 39 cells, native form distinctions,
inherited and overlay constraints, exact input bindings, deterministic resolution,
naming/root orthogonality and hostile controls. These are configuration tests,
not all-type runtime semantic proofs. L0 and source validation results are in
[STATUS.md](STATUS.md). Compiler sources and historical receipts remain unchanged.

Product frontier: PCR-05 candidate mapping exists; the next construction unit is
PCR-06, with each affected input contract gated by its listed DSR dependencies.
Runnable work includes source-stable, dependency-resolved cells; full L1 exit
requires all 13 TypeScript generation cells and PCR-07 integration. Operational
residue: historical Rule/Enum observer reconciliation and host tmpfs pressure,
owned by evidence/toolchain maintainers; neither blocks this read-only resolver.

## Open questions

Broader input meaning and source-role acceptance stay with the
[PCR decision register](PLAN.md#9-open-questions-and-proposed-decisions) and
[parent work-item ledger](../WORK-ITEMS.json). The candidate matrix keeps affected
cells' blocker IDs and current statuses. PCR-05 does not close those parent tasks,
award L1 exit, or authorize admission, default cutover, packaging or publication.
