# Reference-field factory generation

Date: 2026-09-09. PCR-06 opt-in v7 candidate, authorized by user “next”.
Authority effect: none. No default integration, profile admission, publication,
release or AlchLang change.

## Implemented scope

The [candidate contract](reference-field-factory-contract.json) selects
domainspec.configured-factories-selection/v7-candidate. It consumes the unchanged
[checked field/reference contract](../contracts/field-and-reference-model.json)
and nominal checked-project field snapshot. No new reference constructor,
database type, semantic edge or canonical definition is introduced.

The two existing binding kinds remain distinct:

- Identity reference: the source holds the target Entity's identity type, with
  the source's declared optional/list/set wrappers.
- Field projection: the source holds the exact type of the target's declared
  property path. The generated type retains wrappers at the projected endpoint;
  it does not add another layer of wrappers or execute a lookup.

Values retain their declared String, JSON-safe UInt64, owned Value Object,
Enum/sum or collection representation. Reference metadata does not introduce
nominal scalar reference brands. Equal raw scalar values from different target
contexts remain the same scalar values; their bindings retain different targets.

## Generated product

Each v7 Entity/Value Object module exports its usual fields, snapshot and factory,
plus a deeply frozen literal tuple named, for example, ContactFieldBindings.
Modules without bindings export an empty tuple. Each entry retains exactly owner,
field, kind, target and projection. Descriptors are available at runtime without
consulting the original graph.

Reference fields are annotated through the generated target's exported Fields
type. Target imports are type-only and are erased from JavaScript. A self-target
uses the local Fields interface. Nested paths through owned Value Objects use
their existing snapshot.fields representation.

Selected lines from the native numeric-reference fixture:

~~~ts
import type {CustomerFields as referenceTarget0Fields}
  from "../entities/customer.js";

// Inside ContactFields:
// readonly "a_customer": referenceTarget0Fields["id"];

// The corresponding ContactFieldBindings entry:
Object.freeze({
  owner: "commerce:contact",
  field: "a_customer",
  kind: "identity-reference",
  target: "commerce:customer",
  projection: Object.freeze(["id"] as const),
} as const);
~~~

Optional/list/set references wrap that target identity type explicitly. A deep
numeric field projection in the composite fixture becomes
referenceTarget3Fields["id"]["fields"]["serial"]. Its ordinary numeric validator
still enforces the selected JSON-safe range at runtime.

## Preserved meaning and limits

Reference fields validate on create/reconstruct/transition before the owner's
declared Rules execute. Composite references still require owned Value Object
snapshots; arbitrary raw objects and wrong providers reject. Named sum projections
retain exact provider ownership. List ordering, set uniqueness, absent optionals,
Entity identity and Value Object equality retain their existing meanings.

Changing a nonidentity reference does not change an Entity's identity. Binding
metadata itself does not enter the value-equality tuple. The independent checked
model remains the equality oracle; no reference-aware comparison is invented.

Circular identity references are supported without embedding target entities or
creating runtime target import cycles. Projection cycles, missing paths, invalid
identity targets and type mismatches remain rejected by the unchanged checked
model. Embedded Entity fields are still outside this factory generator's scope.

The generated code does not prove target existence, enforce referential integrity,
populate a projected value, compare it with a live target field, or execute the
target Entity's Rules. A String reference can therefore contain an empty or
nonexistent target ID if its own field type and owner-bound Rules permit it.
No implicit reference resolution, repository access or database ownership is added.

## Plan and source binding

The immutable v7 plan carries each exact reference and its generated type-import
binding, target path and target artifact SHA-256. Target artifact hashes are
recorded after generation; they are not embedded recursively into mutually
referencing module content. The checked-field digest binds all authored metadata.
Changing kind or target changes emitted descriptors and plan identity even when
both targets happen to expose the same scalar type.

Existing component dependency bindings and Rule artifact bindings remain separate
from reference metadata. Every target factory in the selected checked closure
must be covered by the factory selection. Unsupported target declarations reject
before an artifact set is returned; they are not silently omitted.

Versions 1–6 retain their contracts and emitted output. They still reject reference
bindings. The new version is not a default compiler cutover.

## Verification

Final focused reference suite: **8/8 PASS**, no skips, in 25.45 seconds.
Final selected regression: **103/103 PASS**, no skips, in 185.81 seconds
(eight added tests plus the preceding 95). Native observer syntax check PASS.
Full CLI source typecheck PASS, including 39 frozen catalog rows, 31 relationship
signatures and five integration definitions across three language selections.
Native tests use the existing locked TypeScript 7.0.2 toolchain to emit JavaScript
and declarations; no compiler was installed.

Eight new tests cover:

- Entry-byte v6 factory goldens, prior-version rejection, closed source/contract
  bindings, target artifact digests, checked provenance and missing coverage.
- Source-root/output-root orthogonality, order independence and deterministic
  cyclic references; changed kind/target remains observable without type collapse.
- Independent native AST expectations for exact type-only imports, target-indexed
  field types, deeply frozen descriptors and generated export sets.
- UInt64 identities, String identities, self references, cross-feature cycles,
  optional/list/set references, and unchanged value-key/equality semantics.
- Invalid numeric/reference inputs on every construction route, readonly types,
  frozen caller-independent output and preserved additive owner validation.
- Wrapper-preserving field projections, deep composite-ID projections, owned
  composite references and sum projections checked against the independent model.
- Explicit absence of target existence checks and target-Rule execution for
  scalar references; JavaScript contains no reference-only target requires.
- Four compiling mutants: wrong target, wrong kind, wrong projection path and
  erasure of target-indexed typing. The observer rejects all four; descriptor
  mutants also produce independently observed incorrect runtime metadata.

Initial fixture failures were corrected: a copied Entity needed distinct ontology
property IDs, and a composite equality comparison needed per-field removal of
generated ownership brands before passing JSON values to the checked oracle.
No production validator or checked definition was relaxed to fix these tests.

Run the same eight-suite regression command documented in
[the v5 report](SUM-FIELD-FACTORY-GENERATION.md#verification); this slice extends
the already registered factory test file. Source typecheck uses the umbrella
node-env launcher with projects/domainspec-v2/impl/cli and npm run typecheck.
Native tests run in the locked network-disabled, read-only-root container.

## Exact sources and preservation

| Changed implementation/test source | SHA-256 |
| --- | --- |
| configured-factories.ts | 3f3de3a8848f0b147137cbb2e909c746f6baed260faeaa41ac5dbf16178caef9 |
| configured-factory-source.ts | d7ec86dcf1770310b75dd25cc931eab92304d59c5eacafea1809c24b7345f100 |
| configured-reference-source.ts | c7b0d87f8319fb0a2921eb3ddb4620af8ea5e9ad64891a1d8a27f81197f6e9e3 |
| configured-factories.test.ts | 7d2589f6ce015a0e537ae6fc1bdda7f37db6ce587b4210d2e2a0c4b9292620f4 |
| observe-configured-factories.mjs | 30f046790352d3abf841a6e4fde79d70d9bdced00000a111f4e163146e8259ae |

Contract SHA-256:
063b6d3228abfdedff01b0f743393ac8138d41af0b592071985a4686e083036f.
Private value support remains the v6 bytes:
04125d6abc0e3bb18a624aa0b7390ac4958b0957ea634fdc800ab7135c91c3f9.

Checked field model/adapter, collection/Enum/sum/numeric helpers, Enum provider,
Rule/Enum/L0 planners, base/TypeScript profiles, configuration and package manifest
retain their entry hashes. Older contracts and historical reports are unchanged.
The write envelope is exactly the five implementation/test files above, the
candidate contract, this report and STATUS.md. Existing untracked work and the
unrelated dirty project-build.ts remain untouched.

## Task-session result and context pack

Native local execution; no delegation, runtime handoff or fallback route.
Task-session and context-builder selected the PCR-06 continuation from STATUS.md,
CONTRACT.md, the existing field/reference contract, checked model/adapter,
factory planner/emitter, native tests and observer. New reference emitter/contract
bytes are the candidate output. Selectors cover binding validation, projection
resolution, identity/value comparison, module generation and native observation.

Decisions: realize reference types through type-only indexed access; expose inert
literal descriptors; preserve value semantics and avoid runtime target resolution.
These keep the checked contract intact and avoid new ownership or storage policy.
No unresolved blocker-level decision remains within this bounded candidate.

Gate: current user authorization and ARE route/context/effect checks delimit the
D65 construction scope. Product evidence does not grant admission or activation.
Context coverage is complete for this slice; no whole-PCR-06 closure is claimed.
Handoff and experiment harness: not applicable. STATUS.md is synchronized at
completion. No operational prerequisite blocks this construction; publication,
default integration and release remain separate owner-scoped work.

## Open Questions

No open semantic decision remains inside this selected reference realization.
Embedded Entity values are the next bounded field-generation gap. Reference
resolution, persistence, referential integrity, richer Rules, full-width UInt64,
codecs, other metatypes, language parity and default integration remain separate.
Admission, packaging and release decisions remain with
[the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
