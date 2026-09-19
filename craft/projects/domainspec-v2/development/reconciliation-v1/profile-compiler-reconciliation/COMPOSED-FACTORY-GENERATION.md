# PCR-06 owned Value Object composition and composite identity

Updated: 2026-09-09. Bounded successor to [scalar factories](FACTORY-GENERATION.md),
authorized by the user's `next`. Candidate TypeScript generation only; authority
effect none. No profile admission, frozen-blocker clearing, default cutover,
AlchLang change, publication or release.

## Implemented boundary

`planConfiguredFactories` now accepts the explicitly selected
`domainspec.configured-factories-selection/v2-candidate` together with the exact
[composed contract](composed-factory-contract.json). Scalar v1 retains its own
contract, input envelope, emitted API and plan shape. The two contract digests
are not interchangeable. No default compiler selects v2 automatically.

The shared planner/emitter consumes the same nominal checked project and field
snapshots used by v1. It does not flatten or forge another graph, reread mutable
source files, invent semantic edges, or reinterpret all declarations as records.
Entity and Value Object remain separate metatypes with distinct semantics.

- Required `String`, `Bool`, and named Value Object fields are supported.
  Every selected transitive Value Object needs its own explicit factory binding.
  The checked field model already resolves the acyclic closure and limits depth.
- An Entity still has exactly **one identity field**. That field can now be a
  Value Object containing multiple String components, recursively. This follows
  the existing checked identity rule; it does not introduce multiple top-level
  identity flags or allow Bool identity. UInt64 remains outside this generator.
- Parent input contains already-validated child snapshots from the exact imported
  provider. `create`, `reconstruct` and Entity `transition` use this same contract.
  Reconstruction is **not** an implicit JSON codec or recursive raw-object loader.
- Every Value Object factory executes its authored invariant Rule set. Parent
  factories execute their own exact bound Rules before formation/identity change.
  Named extensions remain additive, immutable, ordered and fail-fast.
- Rule parameters can bind to a direct `field` or an explicit nonempty `path`
  array (at most 32 segments). Traversal must cross declared owned Value Objects
  and finish at a correctly typed String/Bool leaf. Both keys together reject.
  Paths are implementation parameter bindings, not new domain relationships.

Example v2 parameter binding:

```json
{
  "rule": "commerce:valid-id",
  "arguments": [{"parameter": "value", "path": ["id", "tenant", "key"]}]
}
```

## Generated product

The synthetic regression fixture emits five factory modules and four generated
Rule modules. Its recursive identity is `Customer.id -> OrderId.tenant -> Tenant`;
its nonidentity `Customer.contact` embeds Contact. These names exercise compiler
composition; the fixture is not a promoted commerce business ontology.

The generated TypeScript provides actual callable factories, readonly branded
snapshot types and declaration files. For example, after importing the generated
Tenant and OrderId factory functions:

```typescript
const tenant = createTenantFactory().create({ key: "tenant-a" });
if (!tenant.ok) throw new Error(tenant.failure_codes.join(","));

const orderId = createOrderIdFactory().create({
  tenant: tenant.value,
  key: "order-a",
});
if (!orderId.ok) throw new Error(orderId.failure_codes.join(","));

// This owned value can now be passed to its parent's identity field.
const id = orderId.value;
```

Nested fields are typed as the imported child's branded Snapshot, not as an
unconstrained object. Raw nested field bags fail runtime construction and cannot
be assigned to the generated nested field type in TypeScript.

Each v2 Value Object module also exports a frozen `NameValueComponent` provider
containing the protocol/concept/contract identity, `isOwned`, `key` and `equals`.
Membership comes from its module-private WeakMap, never copied brands, methods,
metadata or caller callbacks. It exposes no unchecked formation entry point.
Snapshots from another copy of the same generated module also reject: matching
source bytes do not merge live provider ownership domains.

Value Object equality covers its complete recursive typed tuple. Parent equality
delegates nested comparison to the imported child provider; canonical keys use
tagged, length-prefixed component boundaries. Entity equality/key uses only its
identity, so independently constructed equal identity values survive a validated
transition while a changed tenant or order component rejects. `hash()` returns a
canonical equality key, **not a cryptographic digest**. Exact String values are
preserved; Unicode normalization is not silently added.

The v2 plan records each owner field's provider selector, module path and emitted
artifact SHA-256 in `component_bindings`. These are compiler dependency evidence,
not additions to DomainSpec's canonical semantic relationship graph. The whole
plan remains digest-bound to the checked graph, fields, contracts and Rule plan.

## Validation and independent controls

The existing registered factory suite was extended in place; `package.json`
remains byte-identical. Eight added tests cover:

1. Entry-byte golden emitter outputs for both scalar-v1 factory kinds.
2. Deterministic nested plans, exact provider artifact binding, module relocation,
   closure coverage, immutable result and caller-owned path preservation.
3. Checked snapshot/source tampering, contract/version mixing, invariant coverage,
   missing/wrong/ambiguous/accessor-backed parameter paths.
4. Native recursive equality, composite identity, transitions, frozen values,
   field-model key agreement, tuple boundaries and distinct Unicode strings.
5. Rejection of optional/list/set/UInt64 fields, embedded Entities, ownership cycles
   and Bool-bearing composite identity at their respective checked boundaries.
6. Raw, spread, prototype-derived, proxied, forged, wrong-concept and duplicate-module
   children; no ambient child method/accessor execution; compile-negative raw input.
7. Child invariant enforcement and direct/nested parent extension Rules on all
   construction routes. A parent does not infer a child extension requirement.
8. Hand-authored native AST expectations and compiling behavior mutants for
   changed Rule paths/provider imports, reference equality, dropped key components
   and child validation bypass. Structural observation alone is not the oracle.

The native observer checks generated imports/exports, provider ownership binding,
Rule call paths, extension lists and forbidden class/runtime-injection forms.
Its expectations are authored independently of planner module metadata. Mutants
that remain structurally valid are distinguished by actual runtime behavior.

Full CLI source typecheck passed, including catalog 39, relationship signatures
31, and integration-profile 5-definition/3-language checks. Native emitted-source
compilation and declaration-file emission use the existing TypeScript 7.0.2 image
`sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef`.
Containers run without network, with read-only rootfs and dropped capabilities.
No dependencies, compiler installations or toolchain pins changed.

Final combined regression: **67/67 PASS**, no skips, in 95.42 seconds, also
recorded in [STATUS.md](STATUS.md). It runs the
factory, Enum, Rule, checked-field, field-model, configuration, L0 and project-model
suites with disk-backed temporary storage and concurrency one. This is a selected
regression boundary, not the entire CLI test inventory.

Exact command from the DomainSpec root:

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

From the umbrella root, source typecheck was
`toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck`.
The observer also passes `node --check`. The source-test loader emits its existing
DEP0205 deprecation warning; generated targets execute natively, not through tsx.

During fixture development, invalid/duplicate ontology selectors, shared extension
fixture aliases and set cardinality were corrected. No domain contract was relaxed
to accommodate those fixture errors. The final run uses the corrected fixtures.

## Source identities and preservation

| Changed source | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/configured-factories.ts` | `ad76aa0e6149ba37d2da0c1829c073268ea89c077177b6ec8adb2936fe5c0f52` |
| `impl/cli/src/generation/configured-factory-source.ts` | `f6318ca3496309dbd96e6e763b9e73bfa7c896a64496d89996ffaa5d588cbf15` |
| `impl/cli/tools/observe-configured-factories.mjs` | `c40a28388effaf725f49244743b1d766628ce825228fdddfd774a03184e1b587` |
| `impl/cli/test/generation/configured-factories.test.ts` | `48bc6cc317251d81fabdaae77fc07429f9592623ff0f15b4fba3f6f285ead7b9` |
| `composed-factory-contract.json` | `73153298625de85a7b25b5cd66d89e94481bf2fd593c8a4c9b703e586a53c069` |

Entry preimages of the four extended files were respectively
`bbc5d52eaf2e596fc9846a3593f07898ab1bf9c9451254217c7f752b8c19504c`,
`c77b8fd005c5d400ec31245019262250e5c8328474f98f358cba888b52f00c21`,
`bcedebc7e060f507e71d7c7029702f60d5c2023f376fcd573c15a200339c9bc4`,
and `18ce0c52b96564466ec38fa9f2f40e4b1ac652aff92c37e966651853d7927273`.
These were existing uncommitted candidate work and were extended, not reset.

Live rehash confirmed exact prior bytes for the Rule/Enum/L0 generators, checked
field adapter, field model, configuration, base/TypeScript profiles and package
manifest. Package SHA-256 remains
`b1dad1f9f891ec741757673d2f2036991de4a9096d78b3f0dfddf98027e85419`.
Historical reports and the scalar contract were not rewritten. Two new candidate
documents and this report's corresponding status update accompany the code changes.

## Task-session and next boundary

Task-session/context-builder kept this continuation on the evidence-backed PCR-06
frontier and bounded the work to the existing checked field contracts and exact
TypeScript owned-component/Entity profile requirements. Native D65 owner-directed
construction only; no delegated work, runtime activation or authority promotion.
The explicit trade-off is owned child input instead of an implicit persistence
codec. Shared generation preserves v1 while an opt-in v2 adds composition.

Next is optional and collection component semantics/generation. UInt64, Enum
embedding and payload sums, identity references, persistence codecs, full language
parity, other metatypes, public CLI integration and packaging remain separate.

## Open questions

Later scope/decision ownership stays in [PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
Child-extension requirements, cross-provider value transfer and persistence codecs
need separately selected contracts before expansion. None is inferred here, and
this local technical result is not complete profile or product admission.
