# PCR-06: configured scalar Entity and Value Object factories

Date: 2026-09-08. Internal candidate implementation and evidence report.
Authorization: successor user `next`; bounded native construction under D65.
Authority effect: none. No default compiler cutover, admission or publication.

## Outcome and boundary

The [planner](../../../impl/cli/src/generation/configured-factories.ts) now
generates Entity and Value Object factories from checked DomainSpec field
declarations and declared Rules. The [source emitter](../../../impl/cli/src/generation/configured-factory-source.ts)
produces TypeScript modules with branded, immutable snapshots, factory-bound
validation and named additive extensions. These are executable factories, not
record-only declarations, database schemas or injected callback wrappers.

This completes the **required String/Bool field subset** of the factory group,
not full Entity/Value Object protocol coverage or all of PCR-06. Fields must be
required scalars, with String-only Entity identity. Nested values, Entity embedding, Enum fields, collections,
optional fields, UInt64, reference bindings and composite identity reject before
an artifact plan is returned. The existing compiler's support is not removed.

## Context pack and decisions

Task-session/context-builder selected this bounded successor of PCR-06. The
controlling evidence is:

| Obligation | Evidence and interpretation |
| --- | --- |
| Continue the current product frontier | [STATUS.md](STATUS.md), prior Rule, checked-field and Enum slices; [PLAN.md](PLAN.md), PCR-06 factory group and separate PCR-07 public integration. |
| Preserve meaning | [Checked fields](../contracts/COMPILED-FIELD-REPORT.md): Entity identity versus full Value Object tuple; authored VO invariant references; typed fields and explicit reference metadata. |
| Follow factory representation | [TypeScript profile](../../implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json), `entity.profile-representation` and `value-object.profile-representation`: validation before formation, stable identity/full tuple, immutable output and additive extensions. |
| Reuse existing behavior without treating fixtures as generators | [Entity target](../../../impl/architecture-conformance/targets/typescript/entity-v1.ts), `executeRoute` and `createSettlementEntityFactory`; [VO target](../../../impl/architecture-conformance/targets/typescript/value-object-v1.ts), `createSettlementValueFactory`: exact validator traces, structured failure, immutable formation. Existing targets remain unchanged. |
| Bind real declared Rules | [Rule generator](../../../impl/cli/src/generation/configured-rules.ts), checked Rule closures, source digests and direct leaf modules. No new parser or Rule interpreter. |
| Respect locations and candidate selection | [Configuration](configuration.json), Entity/VO roles and frozen DSR-009 blockers; [L0 contract](CONTRACT.md), explicit implementation bindings do not create graph edges. |

Context pack: standard, selector-scoped, in-session; no runtime handoff or
delegation. Coverage is for the scalar subset only. Broader component protocols,
historical fixture replay and admission are explicitly outside that coverage.

Non-blocking candidate selections are made explicit in the new
[scalar-factory contract](scalar-factory-contract.json): identity normalization,
exact String/Bool tags, length-prefixed keys, ordered fail-fast validation and
generation-time parameter-to-field bindings. These choices do not alter public
DomainSpec syntax, upstream profiles or accepted default behavior.

## Internal API and generated use

Call `planConfiguredFactories(checkedGraph, checkedFields, selection, sources)`.
Both snapshots must be genuine local checked objects; their graph certificates
must agree. Selection includes the exact field-compilation digest. The source
bundle consists of `configuration`, `base`, `typescript`, and `factory_contract`
as raw strings. All four are exact-byte-bound before a plan is returned.

Example selection for an Entity whose fields include `id`, `label`, `enabled`:

```ts
const selection = {
  schema_version: 'domainspec.configured-factories-selection/v1-candidate',
  language: 'typescript',
  module_root: 'application',
  field_compilation_sha256: checkedFields.compilation_sha256,
  factories: [{
    selector: 'commerce:customer',
    base_validators: [{
      rule: 'commerce:valid-id',
      arguments: [{parameter: 'value', field: 'id'}],
    }, {
      rule: 'audit:has-label',
      arguments: [{parameter: 'label', field: 'label'}],
    }],
    extensions: [{
      id: 'enabled',
      validators: [{
        rule: 'audit:is-enabled',
        arguments: [{parameter: 'enabled', field: 'enabled'}],
      }],
    }],
  }],
} as const;
```

The checked field selection must cover exactly these factories, not unrelated
declarations. Every base and extension Rule must exist in the same checked
graph. All Rule parameters must be explicitly mapped to fields of the same
scalar type. Missing, repeated, extra, stale or mismatched bindings reject.
For a Value Object, base bindings must cover exactly its authored `invariant_refs`.
For an Entity, one or more base bindings are required. These are compilation
bindings, not inferred domain relationships.

Generated paths follow PCR-05:

- Entity: `{module_root}/features/{feature}/src/domain/entities/{node}.ts`.
- Value Object: `{module_root}/features/{feature}/src/domain/value-objects/{node}.ts`.
- Rules retain their own configured `domain/rules` leaf modules, including
  cross-feature imports; shared Rule dependencies are emitted once per plan.

Generated application code can use the factory as follows:

```ts
const factory = createCustomerFactory();
const first = factory.create({id: 'c1', label: 'Alex', enabled: true});
const activeOnly = factory.extend('enabled');
const invalid = activeOnly.create({id: 'c1', label: 'Alex', enabled: false});
// invalid.ok === false; invalid.value === null; bound Rule failure is traced.
if (first.ok) {
  const next = factory.transition(first.value, {
    id: 'c1', label: 'New label', enabled: true,
  });
  // first.value remains unchanged; next preserves the identity if successful.
}
```

`extend` accepts only generation-time declared extension names. It accepts no
Rule callback, constructor or normalization override. Applying an extension
twice fails, and immutable extension chains cannot form cycles. Base validators
remain first; extensions run in their application order, stopping at the first
failure. The original factory remains unchanged.

## Runtime semantics

Every valid construction path copies checked own-data fields, runs its bound
validators, and only then forms the snapshot. Bad shapes, extra fields,
accessors and wrong primitive types produce structured failure without a value.
Returned traces carry the route, ordered phases and each executed Rule's selector,
checked closure digest, generated artifact digest and outcome. Exceptions from a
validator become structured failures rather than forming a snapshot.

Entity `create`, `reconstruct`, and `transition` converge on one private pipeline.
The checked field contract rejects Bool identity; this generator preserves that
boundary rather than expanding it.
Transitions require an owned prior snapshot and full next fields; they validate
before resolving identity and reject a changed identity. There is no exported
raw constructor. `sameIdentity` and `hash` use the concept and typed identity
only, ignoring nonidentity field differences.

Value Objects expose `create` and `reconstruct`, not transitions or identity.
`equals` directly compares every name-sorted normalized field of an owned
snapshot. It is not serialization or reference equality. `hash` uses that same
complete typed tuple. Changing any field changes equality in the tested subset.
Entity and VO APIs deliberately retain those different meanings.

The candidate primitive-component realization is selected by the complete
scalar-factory contract file's digest. Each component has a String/Bool tag,
field name, value and protocol binding; components are formed privately after
validation and frozen. Snapshot ownership is tracked by a module-private
WeakMap, so spreading fields or copying brand properties cannot forge a snapshot.
This is not admission of a general reusable component provider. Imported/nested
components are not accepted in this slice.

Normalization is identity: no coercion, defaulting, trimming, case folding or
Unicode normalization. Hash methods return deterministic length-prefixed keys,
not cryptographic digests. The encoding distinguishes field names, type tags and
value boundaries, including Boolean false and arbitrary String contents.
Different copies of the generated module have separate ownership registries;
cross-provider equality is not inferred from matching metadata alone.

This is an ordinary trusted-JavaScript runtime, not a sandbox against hostile
Proxies, modified global intrinsics or post-generation source tampering. Binding
digests identify planned Rule bytes; they are not runtime signature enforcement.

## Validation

The [eight-test suite](../../../impl/cli/test/generation/configured-factories.test.ts)
starts from real temporary DomainSpec projects. It exercises deterministic plans,
source-root orthogonality, caller-input isolation, exact Rule bindings, authored
invariant coverage, unsupported-form rejection, source/snapshot drift, native
factory behavior, no-formation failures, extension ordering, identity stability,
complete tuple equality, Boolean identity rejection and exact String representations.

Generated TypeScript and its declaration files compile with the existing pinned
TypeScript 7.0.2 / Node 26.8.1 toolchain. Native Docker runs have networking
disabled. JavaScript behavior is checked independently; forged snapshot type
assignments also fail native compilation.

The [independent native AST checker](../../../impl/cli/tools/observe-configured-factories.mjs)
checks exports, factory entry form, exact import/argument bindings, base and
extension lists, ownership checks, and class/serialization rejection. Tests
author its expectations independently. Validation-removal, partial-tuple and
identity-replacement mutants still compile and pass the bounded structural
observer but fail independent behavioral expectations. Structural PASS is not
treated as semantic closure.

Final regression and source-typecheck outcomes are in [STATUS.md](STATUS.md).
Run the selected regression from the DomainSpec root:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
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

The new suite is registered in normal test discovery. The entire CLI suite,
public application integration and release packaging are not claimed as tested.

## Exact source identities and preservation

| Artifact | SHA-256 |
| --- | --- |
| `configured-factories.ts` | `bbc5d52eaf2e596fc9846a3593f07898ab1bf9c9451254217c7f752b8c19504c` |
| `configured-factory-source.ts` | `c77b8fd005c5d400ec31245019262250e5c8328474f98f358cba888b52f00c21` |
| `observe-configured-factories.mjs` | `bcedebc7e060f507e71d7c7029702f60d5c2023f376fcd573c15a200339c9bc4` |
| `configured-factories.test.ts` | `18ce0c52b96564466ec38fa9f2f40e4b1ac652aff92c37e966651853d7927273` |
| `scalar-factory-contract.json` | `363017b9bc55ea5948a98d64a232abdc1afb452e8a704bb87e7571ae27bfe70c` |

The write envelope is these five new files, CLI test discovery, this report and
successor status. Removing only the new test entry restores the exact package
preimage `f28a86f68bf3a271bf1acdd32764ddd1591bbe977c90b42e9b3aff3dce6e548e`.
Existing Rule/Enum/L0 generators, checked-field adapter, profiles, factory targets
and PCR configuration were not changed. No dependency installation, historical
receipt/hash refresh, commit, admission or publication occurred.

## Remaining frontier and open questions

Product construction: nested owned Value Objects and composite Entity identity
are the next component-composition slice. Embedded Entities, references,
collections, optional fields, UInt64 and payload sums remain explicit separate
obligations. Full Rule support and the other metatype generators remain pending.
PCR-06 is partial; the 39-cell language/metatype denominator is unchanged.

Operational support: public CLI/application integration, release packaging and
publication remain separately owned future work, with no causal blocker for
this internal candidate. No toolchain repair was needed. DEC-05 and frozen
configuration blockers remain unchanged; product evidence grants no admission.
Decision ownership remains in [PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).

Task-session result: bounded native implementation and independent verification;
no subagents or adapter handoff. Successor evidence is synchronized here and in
STATUS. Reusable-sigil experiment harness is not applicable to this product slice.
