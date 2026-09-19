# PCR-06 optional, list and set factory components

Updated: 2026-09-09. Authorized by user `next`, following
[owned composition](COMPOSED-FACTORY-GENERATION.md). This is an opt-in TypeScript
candidate, not profile admission, a default compiler change or a release.
Authority effect: none. No AlchLang or business-ontology rewrite.

## Product and contract

`planConfiguredFactories` accepts
`domainspec.configured-factories-selection/v3-candidate` with the exact
[collection factory contract](collection-factory-contract.json).
The scalar v1 and composed v2 versions keep their own contracts and output shapes.
The shared planner uses the checked project's original metatypes and field
constructors; it does not flatten values into a different graph or add semantic
relationships. Every transitive named Value Object still has its own factory.

| Field constructor | Input and normalization | Equality behavior |
| --- | --- | --- |
| `optional<T>` | Omitted field or explicit `null` becomes `null`; explicit `undefined` rejects. Present values use T's normalizer. | Absence differs from empty String, false, and empty collection. |
| `list<T>` | Dense own-data arrays, copied and recursively frozen; empty and repeated values accepted. | Position and repeated occurrences matter. |
| `set<T>` | Dense own-data arrays, duplicate semantic values rejected; copied into deterministic key order and frozen. Native JS Set input rejects. | Input ordering does not matter; each semantic element occurs once. |

T may be String, Bool, an owned Value Object, or another permitted wrapper.
The unchanged decoder forbids optional as an immediate wrapper element, including
`list<optional<T>>`, `set<optional<T>>`, and `optional<optional<T>>`.
It allows compositions such as `optional<list<T>>`, `list<set<T>>`, `set<list<T>>`
and `set<set<T>>`. Existing nesting/cardinality and embedding-cycle checks remain
in force. Collection elements that are Value Objects must come from the exact
imported provider; raw objects, copied branding and wrong concepts reject.

Example normalized generated field types (excerpt from the exercised Contact
fixture, not Alch syntax or a proposed business ontology):

```typescript
readonly "memo": (string) | null;
readonly "messages": ReadonlyArray<string>;
readonly "flags": ReadonlyArray<boolean>;
readonly "matrix": ReadonlyArray<ReadonlyArray<boolean>>;
readonly "optional_list": (ReadonlyArray<string>) | null;
```

The list/set distinction is retained in the checked field model, generated
component metadata and field-specific normalization/equality protocol. Both
use readonly arrays as their native representation; there is no claim of distinct
TypeScript container brands or a semantic membership-method API. Snapshot field
types describe the normalized output; factory input remains `unknown`, with
closed runtime validation before formation.

## Owned implementation

The new [collection support emitter](../../../impl/cli/src/generation/configured-collection-source.ts)
generates private typed component combinators inside each v3 factory module.
For example, a `list<set<String>>` field statically composes
`listValue(setValue(stringValue))`. No runtime type-description interpreter,
new class-based domain representation, external dependency or public injection
API is introduced. Existing configured factory paths remain unchanged.

The separate candidate protocol is
`typescript.owned-collection-components/v1-candidate`. The contract binds the
exact emitted support SHA-256, and the plan repeats it with `inline-private`
placement. A changed support body with the old contract fails planning. The
factory contract digest also binds each generated component's protocol metadata.
Inlining keeps each generated leaf self-contained with its owned dependencies;
the trade-off is duplicated helper source, not a new shared package ABI.

Normalization reads own data descriptors, never caller array iterators, `map`,
comparators or element equality/hash methods. It copies caller arrays without
sorting/freezing them. Nested arrays are recursively normalized and frozen.
Each sequence protocol tracks the normalized arrays it owns in a private WeakMap
and caches a tagged, length-prefixed equality key. Set ordering uses those keys,
not locale collation; it need not match the checked model's JSON key serialization
order, but preserves its equality relation. `hash()` remains an equality key,
not a cryptographic digest or cross-language persistence format.

Every construction route normalizes all fields before executing its exact bound
Rules. Invalid input returns structured `INVALID_FIELDS` failure with no snapshot
and no validator execution. Successful Value Objects compare the complete
normalized tuple. Entities still compare only their declared identity while
validating all nonidentity fields. Their identity cannot become optional or a
collection, including indirectly through an identity Value Object.

Extensions remain named and additive. They cannot change normalization, tuple,
ownership or equality. Child extension requirements are not inferred. Reconstruction
accepts raw arrays but still requires already-owned nested Value Object snapshots;
it is not a persistence/JSON reconstruction codec.

## Rule boundary

This slice adds collection component semantics, not a new Rule language.
Existing declared scalar Rules still run on every exposed route. A Rule binding
must end at a required String/Bool field and can traverse only required owned
Value Objects. Binding a scalar Rule to an optional/collection field, indexing
into a collection, or traversing through an optional object rejects at planning.
There is no implicit default, skip-on-absence, element-wise quantification or
empty-collection truth convention. Collection-valued business Rule parameters
need their own later checked contract and native evidence.

## Context pack and decisions

Context-builder used a standard selector-scoped pack for this bounded PCR-06 continuation:

- [Plan](PLAN.md), PCR-06 and V11/V12 obligations: preserve metatype distinctions
  and prove native behavior before broader integration.
- [Field contract](../contracts/field-and-reference-model.json), optional,
  collections, identity and nesting: controlling candidate value semantics.
- [Checked comparison](../../../impl/cli/src/input/field-reference-model.ts),
  `fieldValueKey`: independent equality reference, not runtime invariant execution.
- [Typed decoder](../../../impl/cli/src/typed-operation/contracts.ts),
  `decodeTypedType`/`decodeTypedProperty`: allowed wrappers and cardinality.
- [TypeScript profile](../../implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json),
  Value Object `component_domain.collections`: requires a separate owned protocol
  fixing immutability, ordering, equality and hashing before collection use.
- Existing factory planner/emitter, registered tests and native observer:
  source-bound Rule imports, ownership, validation order and v1/v2 preservation.

No missing blocker decision was substituted with an inferred domain relationship.
Non-blocking implementation selections are explicit: v3 opt-in, frozen array
representation, inline private combinators and scalar-only Rule bindings.
No profile status, activation binding or historical receipt was rewritten.

## Verification

Eight added tests cover v2 emitter byte-goldens, deterministic v3 plans and exact
provider/support binding, native equality against all pairs in a varied checked
field-model corpus, caller isolation, recursive immutability, readonly/nullable
compile-negative inputs, hostile arrays and duplicate values, all construction
routes, extension preservation, unsupported bindings and compiling semantic mutants.
The existing v1 goldens and all v1/v2 tests remain registered and exercised.

The corpus varies omitted/null/present optional values, false/empty values,
independently equal nested Value Objects, Unicode representations, list order and
multiplicity, set permutations, nested list/set combinations and optional collections.
Input and normalized-output checked keys must agree. Generated equality and key
equivalence must agree with the independently computed model relation for every pair.

The native AST observer uses hand-authored imports and field-protocol composition
expectations, plus the exact collection-support digest. Compiling mutants change
list behavior to set behavior, remove set canonical ordering and remove array
freezing. Native runtime checks expose each semantic failure independently of
successful TypeScript compilation and structural/digest checks.

Full CLI source typecheck passed, including catalog 39, relationship signatures
31 and integration-profile 5-definition/3-language checks. Generated source and
declarations compile using the existing TypeScript 7.0.2 image
`sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef`.
Native containers run offline with read-only rootfs and dropped capabilities.
Final combined regression: **75/75 PASS**, no skips, in 157.34 seconds, also
recorded in [STATUS.md](STATUS.md). This is the same eight-suite command recorded
in the predecessor [verification section](COMPOSED-FACTORY-GENERATION.md#validation-and-independent-controls),
now including the eight additional factory tests. It covers factories, Enum,
Rule, configuration, checked-field, field-model, L0 and project-model suites, not
the entire CLI test inventory. Disk-backed temporary storage and concurrency one
were retained. The pre-existing tsx loader DEP0205 warning remains; emitted code
executes through native Node, not tsx.

From the umbrella root, full source typecheck:
`toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck`.
The observer also passes `node --check impl/cli/tools/observe-configured-factories.mjs`
from the DomainSpec root.

The initial native run exposed TypeScript's array-mapped descriptor typing for
`length`. The emitter now requests an object descriptor map; support and candidate
contract digests were re-bound before rerunning. A test expectation that retained
input set order was corrected to compare the normalized snapshot before/after
caller mutation. Neither correction weakens the field or immutability contract.

## Exact source evidence

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/configured-factories.ts` | `65be6a6eb8d88578cb8700b495db390d3d1986993bbe615b2afdd66687e3c698` |
| `impl/cli/src/generation/configured-factory-source.ts` | `5e8f9b0f162ff243e92b5d0be7ebe2482c73406bd3bd83b6218e18562be63762` |
| `impl/cli/src/generation/configured-collection-source.ts` | `02fb1a682fec748f8858755457e2982d63ce8b8ab628402bdee54834c6ab3ee3` |
| `impl/cli/test/generation/configured-factories.test.ts` | `9ac1beb34989caf7de91642450746bfd1420ba76ae90d589f2bd31203b59e2d2` |
| `impl/cli/tools/observe-configured-factories.mjs` | `3cc2b907fb0728e71b90d1d923b4d8dd6b13169f3c657fb827a2cb29af588969` |
| `collection-factory-contract.json` | `d29ea59124cab26b8b416f67dd08cf894be28f4bc006e3b5cc416228e42e79b9` |

Emitted support SHA-256 (distinct from its emitter source file):
`1ea6b79deeab706c017a45f31cbeb96b743a5bcce09215cbfe73160c5cb1c30a`.

The four extended source files began at the exact digests in the predecessor
[composed factory report](COMPOSED-FACTORY-GENERATION.md#source-identities-and-preservation).
Their existing dirty work was extended, not reset. Rehash confirmed unchanged
Rule/Enum/L0 generators, field model/adapter, base/TypeScript profiles,
configuration and package manifest. Historical reports and v1/v2 contracts stay
unchanged; the existing test registration required no package edit.

## Task Session Result

- Task: PCR-06 optional/list/set candidate components; local native execution.
- Result: PASS for this bounded candidate, not PCR-06 as a whole.
- Context: selector-scoped pack above; existing field meanings control the new
  protocol; no runtime handoff or fallback route.
- Decisions: four bounded implementation selections above; no blocker decision.
- Gate: D65 owner-directed candidate construction only; no authority effect.
- Files: five implementation/test/observer files, candidate contract, this report
  and STATUS. No operational/toolchain/dependency/publication changes.
- Validation: source typecheck, native compilation/declarations, AST/protocol
  controls, hostile input and semantic regression; final counts in STATUS.
- Experiment harness: not applicable; no sigil lifecycle or delegation.
- Product frontier: optional/list/set generation implemented; PCR-06 as a whole
  remains in progress. Next bounded data-composition candidate is Enum-valued fields.
- Operational residue: public CLI integration, shared packaging and release remain
  separately scoped owner work; none blocks this local candidate construction.

## Open questions

Later decisions remain owned by [PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
Collection/optional Rule expressions, numeric representation, Enum/sum embedding,
references, persistence codecs, semantic collection membership APIs, cross-language
parity and full profile admission are not claimed by this slice.
