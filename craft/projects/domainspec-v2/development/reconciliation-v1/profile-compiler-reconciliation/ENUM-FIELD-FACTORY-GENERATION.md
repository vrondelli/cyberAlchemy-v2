# Enum-valued TypeScript factory fields

Date: 2026-09-09. PCR-06 bounded candidate continuation, authorized by user
“next”. Authority effect: none. No default cutover, profile admission, release,
publication or AlchLang change.

## Result and scope

Opt-in domainspec.configured-factories-selection/v4-candidate composes plain
Enum fields into the existing validated Entity/Value Object factories, including
optional/list/set wrappers and nested combinations with owned Value Objects.
The checked field model still defines shape, cardinality and identity.
Enum cases are not Value Objects, strings, database records or graph edges.

The exact [candidate contract](enum-field-factory-contract.json) binds support,
field-descriptor and Enum-provider bytes. The sources argument adds enum_provider
and field_contract to the existing configuration/base/typescript/factory_contract
inputs. The older versions retain their closed inputs and meanings.

## Construction and evidence

1. Verify the original nominal graph, checked field projection, certificate and
   exact input digests. Factory bindings cover only Entity/Value Object
   declarations; plain Enum declarations form the complementary partition.
2. Compile an Enum-only checked projection from that same original graph and
   field descriptor. No unchecked graph, source reread, flattened replacement
   snapshot or fabricated semantic relationship is used.
3. Run the unchanged [Enum planner](../../../impl/cli/src/generation/configured-enums.ts).
   Copy its exact runtime provider. For v4 definition leaves only, add a public
   ReturnType annotation to the existing runtime expression so TypeScript can
   emit declarations.
4. Emit a sibling .component.ts adapter for each Enum. Factories import its
   branded Case type and private-membership provider. Bind every component
   dependency to its actual artifact hash.
5. Record the original Enum plan/projection hashes and, per adapter, the original
   definition hash, annotated definition hash, member list and contract hash.
   Deterministic ordering and root relocation retain existing behavior.

The annotation fixes a real integration gap: unchanged v1 Enum leaves compile
to JavaScript, but declaration emission reports TS4023 because their inferred
exported type names the provider's private enumMembers symbol. v4 names that
type through the existing public function without widening values, modifying
the provider, suppressing checks or changing v1 output bytes:

~~~ts
export const Status: ReturnType<typeof defineEnum<{
  readonly Draft: "Draft"; readonly Submitted: "Submitted";
}>> = defineEnum({"Draft": "Draft", "Submitted": "Submitted"} as const);
~~~

## Generated API

For an authored plain Enum commerce:status with Draft and Submitted,
the generated modules are:

~~~text
application/features/commerce/src/domain/enums/status.ts
application/features/commerce/src/domain/enums/status.component.ts
application/runtime/enum.ts
~~~

Example consumer of the generated factory fixture:

~~~ts
import {StatusValueComponent as Status}
  from "./application/features/commerce/src/domain/enums/status.component.js";
import {createContactFactory}
  from "./application/features/commerce/src/domain/value-objects/contact.js";

const result = createContactFactory().create({
  locale: "en",
  label: "Alex",
  enabled: true,
  status: Status.values.Draft,
  status_history: [Status.values.Draft, Status.values.Submitted],
  status_set: [Status.values.Draft, Status.values.Submitted],
  // status_maybe can be omitted or null.
});

const decoded = Status.fromVariant("Draft"); // Explicitly selects this Enum.
const wire = {variant: decoded.variant};     // Checked-field wire representation.
~~~

The plain definition still exposes string members. The fromVariant function
interprets a string in the chosen Enum context; it cannot recover provenance
from a string that came from another Enum. Direct field inputs require owned
cases, not raw strings or tagged JSON objects. No implicit JSON decoder is added.

## Semantic and ownership boundaries

- Each adapter's immutable cases belong to its private membership registry.
  Equal member names in different Enums remain distinct. Spread copies, raw
  objects, proxies and a second evaluation of identical adapter bytes reject.
- Optional absence normalizes to null; explicit undefined rejects. Lists retain
  order/duplicates. Sets reject semantic duplicate cases and canonicalize order.
  Nested wrappers retain those meanings and do not freeze caller-owned arrays.
- Entity identity is unchanged by nonidentity Enum fields. Value Object equality
  uses the complete typed tuple. Hash equality and equality agree with the
  checked-field oracle on the tested corpus; keys are semantic encodings, not
  cryptographic fingerprints or cross-module ownership credentials.
- Create, reconstruct and Entity transition still validate before formation.
  Named extensions remain additive. Rule arguments still end at explicitly
  selected String/Bool fields: no implicit variant projection or Enum Rule
  parameter coercion.
- Factories and adapters introduce no classes. The unchanged shared Enum
  provider retains its existing private error class.

## Verification

Full selected regression: **81/81 PASS**, no skips, in 124.67 seconds (six
new tests plus the prior 75). Full CLI source typecheck and native observer
syntax check PASS. Native TypeScript 7.0.2 emits JavaScript
and declarations for v4; source tests use the existing locked loader and native
tests use the selected network-disabled Docker toolchain.

Development failures were corrected before this final run: a planner metadata
property used the wrong name; native integration exposed TS4023 and prompted the
v4 annotation above; the negative type test was tightened to accept the actual
missing-brand TS2741 diagnostic as well as TS2322. Neither compiler errors nor
test skips were converted into success.

Six added tests cover v3 emitter byte goldens; nominal checked provenance and
exact-source rejection; determinism and relocation; payload/identity/Rule
rejection; native ownership, equality, reconstruction, transition, extension
validation and wrong-Enum type rejection; mixed nested collections/Value Objects;
and independent AST mutants for case substitution and ownership removal.
The raw scalar/Enum distinction and null/order/uniqueness distinctions are
explicit negative controls, not an inference from schema checks.

Run the selected regression from the DomainSpec root:

~~~sh
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
~~~

Run source typecheck from the umbrella root:

~~~sh
toolchains/node-typescript/bin/node-env run \
  --project projects/domainspec-v2/impl/cli -- npm run typecheck
~~~

## Source identities and preservation

| Changed candidate source | SHA-256 |
| --- | --- |
| Factory planner | ecdce48d861940d4d8e8d41a154e14a27f6c9c4df4f016e675a287128d187ef5 |
| Factory emitter | 0c16b8451d69baf1d25909c5e86a7e6e489c7ab7088533072aa017e24b92467d |
| Enum adapter/annotation emitter | 687de1a85337cb7102a52bcc7372bc1a504f7c30ac37787bcc00ce42e2582096 |
| Factory tests | 0c0db3fbcd238081e5ec1f8fd1f56ab613a6aee61858c92bec97bb57d8cfe43d |
| Factory observer | 9fee0962d9e92479661516ea5f2c827d76f18a8aa601ca5c7c4c1622de6874d1 |
| v4 contract | a7eedabc1db6145afc50060d5fba762110bee91bd7f3bb7d8f23bf99b7f8d5ab |

Rehash checks preserve entry bytes of the collection helper, Enum/Rule/L0
planners, field model and checked adapter, configuration, base/TypeScript
profiles, package manifest and Enum provider. In particular, Enum provider
378e09358713b431e4a24e664e484feae0122462e47aabfa653ae21a17315fcc
and Enum planner
1faa0240e26eb27e3b51c13d2d8d9f30c060d817421f233e60569c488ace0264
are unchanged. Existing untracked work and unrelated dirty project-build source
are retained. Only the announced eight candidate source/test/report/status files
are in this continuation's write envelope.

## Task-session and context

Native bounded execution, no delegation or legacy adapter. Task-session and
context-builder kept the lean context at the PCR-06 frontier:
[STATUS.md](STATUS.md), [CONTRACT.md](CONTRACT.md),
[collection contract](collection-factory-contract.json),
[Enum report](ENUM-GENERATION.md), checked-field source, planner/emitter/provider
source, tests and observer. CA2 implementation route and ARE route/context/effect
checks carry existing user authorization through the D65 construction boundary;
none grant authority promotion. Define/Plan restarts and ontology runtime
activation were not prerequisites. No new canonical definition was promoted.

## Open Questions

No unresolved choice remains within the plain-Enum field slice. Payload-bearing
named/anonymous sums, Enum composition relationships, UInt64, references,
collection/Enum Rule expressions, automatic codecs, cross-module transport,
language parity and public CLI integration remain outside it. v1 Enum
declaration-file support is a separate compatibility repair; v4 does not silently
rewrite that earlier generator. Admission/release decisions remain with
[PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
The next bounded data-composition candidate is payload-bearing sums.
