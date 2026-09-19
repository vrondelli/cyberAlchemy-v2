# Payload-bearing sum factory generation

Date: 2026-09-09. PCR-06 opt-in v5 candidate, authorized by user “next”.
Authority effect: none. No default integration, profile admission, publication,
release or AlchLang change.

## Implemented scope

The existing checked model already represents named sums through Enum
declarations with typed-sum/v1 contracts and inline sums through typed field
expressions. This implementation consumes those definitions unchanged. It adds
no metatype, database record, semantic relationship or first-order-logic syntax.

The [candidate contract](sum-field-factory-contract.json) selects
domainspec.configured-factories-selection/v5-candidate. It uses the same closed
source inputs as v4 and binds the complete collection/Enum/sum support bytes.
Factory selections still cover every Entity and Value Object in the checked
closure. Plain Enums and payload-bearing named sums are separate partitions.
Missing child factories and unsupported payload leaves reject before artifacts
are returned.

Supported payloads: String, Bool, owned Value Objects, owned plain Enum cases,
owned named sum cases, inline sums, and existing optional/list/set combinations.
The checked field model's finite embedding restriction remains in force.

## Generated product

A named payload-bearing declaration such as commerce:authorization produces
an authorization.sum.ts module in the configured domain/enums role. Its
sum-specific leaf suffix is a candidate implementation selection, not a
change to the default compiler's layout or proof of full profile parity.
Plain Enum definitions and adapters keep the v4 generation path.

The sum module exports:

- AuthorizationInput: a readonly discriminated union of valid tagged inputs.
- AuthorizationCase: that union plus a private nominal brand.
- AuthorizationValueComponent: a frozen provider with create, isOwned, key
  and equals, plus concept, contract identity and protocol metadata.

Example against the native test fixture:

~~~ts
import {AuthorizationValueComponent as Authorization}
  from "./application/features/commerce/src/domain/enums/authorization.sum.js";
import {TenantValueComponent, createTenantFactory}
  from "./application/features/audit/src/domain/value-objects/tenant.js";

const cancelled = Authorization.create({variant: "Cancelled"});
const text = Authorization.create({variant: "Text", payload: "approved"});
const maybe = Authorization.create({variant: "Maybe", payload: null});

const tenantResult = createTenantFactory().create({key: "customer-a"});
if (tenantResult.ok) {
  const detailed = Authorization.create({
    variant: "Details",
    payload: tenantResult.value,
  });
  if (detailed.variant === "Details") {
    TenantValueComponent.isOwned(detailed.payload); // true
  }
}
~~~

Consumers pass constructed cases into named-sum factory fields. Inline-sum
fields instead accept a closed tagged object and normalize it structurally.
They do not invent a globally named concept or standalone module. A project
using only inline sums needs no generated Enum provider or named-sum module.

## Preserved distinctions

| Authored meaning | Runtime and type behavior |
| --- | --- |
| Payload-free variant | Only variant is allowed; even a null payload rejects. |
| Payload-bearing variant | Payload must be present and valid for that branch. |
| Optional payload | Explicit null is valid; missing payload and undefined reject. |
| Different variants, equal payloads | Unequal; the tag is part of the semantic key. |
| Equal variant, different payloads | Unequal; normalized payload meaning is part of the key. |
| Named sum versus inline sum | Named cases require exact provider ownership; inline sums are structural. |
| Different named concepts | Matching tags/payloads cannot impersonate each other's owned cases. |
| List versus set | List preserves order and duplicates; set canonicalizes order and rejects semantic duplicates. |

Named create checks the input and normalizes the selected payload before
branding a case. Private membership rejects forged, raw, spread, proxy and
duplicate-module cases at named-value boundaries. It is not a JSON deserializer:
nested named values still require their respective owned providers.

Inline normalization checks enumerable own data descriptors, rejects unknown
keys and accessors without invoking their getters, copies input, and recursively
freezes the constructed value. It does not promise detection of arbitrary
Proxy traps or hostile replacement JavaScript built-ins.

Entity identity stays independent of nonidentity sum fields. Value Object
equality/hash uses its complete typed tuple. Rule bindings still traverse only
owned Value Objects and end at explicit String/Bool fields. No sum matching,
implicit payload path, conditional Rule, skipped validator or replacement
extension is inferred. Existing construction routes validate before formation.

## Implementation and provenance

The planner works from the original nominal checked graph/field closure.
Each v5 field receives a recursive static value shape retaining variant names,
ontology-variant references and owned component imports. The emitter composes
existing collection/Enum helpers with the new sum helper; generated consumers
do not parse an ontology or interpret the original typed model.

Dependency evidence includes each owner, field (or the provider's $case root),
path through wrappers/variant payloads, provider selector, target path and
actual artifact hash. Named-sum modules, field shapes and the bound checked
field digest remain in the immutable plan. This records implementation
dependencies, not new DomainSpec semantic edges.

Generated factories and sum modules use closures and readonly union types,
not classes. The unchanged plain-Enum runtime retains its pre-existing private
error class. Protocol keys are unambiguous semantic encodings, not cryptographic
hashes, serialization formats or ownership-transfer credentials.

## Verification

Final selected regression: **89/89 PASS**, no skips, in 135.27 seconds
(eight new tests plus the prior 81). Focused sum suite: 8/8 PASS.
Full CLI source typecheck PASS, including 39 catalog rows, 31 relationship
signatures and the integration-profile check. Native observer syntax check PASS.
The selected TypeScript 7.0.2 toolchain emits JavaScript and declarations.

Eight added tests cover:

- Entry-byte v4 emitter goldens and preservation of all older regression tests.
- Checked provenance, full dependency hashes, exact contract/source binding,
  selection ordering, root relocation, source removal and nominal input rejection.
- Differential equality/key tests against the checked field model for variant,
  scalar, optional, nested-sum, named-sum, Value Object and Enum/set payloads.
- Unsupported payloads, recursive embedding, missing factories and implicit
  sum Rule projections.
- Wrong-concept and duplicate-module ownership, exact payload shape,
  accessor rejection, caller mutation isolation and semantic duplicate sets.
- Exhaustive TypeScript narrowing, wrong-payload/brand rejection and a specific
  readonly-property TS2540 negative control.
- Independent AST checks plus native-compiling tag-collapse and payload-collapse
  mutants whose behavior disagrees with the checked model.
- Inline-only list/set sums without generated named providers, preserving
  ordering, uniqueness and checked-field meaning.

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

Source typecheck uses the umbrella's node-env launcher with project
projects/domainspec-v2/impl/cli and npm run typecheck. Native runs use the locked
network-disabled, read-only-root Docker environment; no compiler was installed.

## Exact sources and preservation

| Changed candidate source | SHA-256 |
| --- | --- |
| Factory planner | 62cdbf8f1935f91242c2da89a6d72d5224dd6add2ec763fa80e59333ed7cd703 |
| Factory emitter | 2ee3ac36ccaa6c158ce518400b5b403a234ca40ffadfcc8692f47caa171714a3 |
| Sum emitter | d9dc05d3bbd43069d48da2bc4aa77e0e0a8e26d744532ae0cd253a0d982d09c0 |
| Factory tests | 1e9891b4ee8571114b6eaef7044a95aae89332005100a145ab6e5ae0c20181dd |
| Factory observer | 7d62425306b9078e3ff38d2c49abe6cde63b35d2738b7fd11b7da36814d67841 |
| Sum contract | f64f0b8bfb57a56cc676737e32e7a727e9c50caf9822f720d0585df7fdc10da2 |

Entry-byte checks preserve the collection helper, Enum adapter and planner,
Enum runtime, Rule and L0 planners, field model and checked adapter,
configuration, base/TypeScript profiles and package manifest. No older contract
or historical report was rewritten. Existing untracked work and unrelated
dirty source/tests remain untouched. The write envelope contains exactly the
five implementation/test files above, the contract, this report and STATUS.md.

## Task-session result and context pack

Native local execution; no delegation or runtime handoff. Task-session and
context-builder select the existing PCR-06 frontier and map its obligations to
the current [status](STATUS.md), [base contract](CONTRACT.md),
[v4 report](ENUM-FIELD-FACTORY-GENERATION.md), checked-field sum/key and identity
selectors, typed sum decoder, planner/emitter/helpers, tests and observer.
No unrelated discovery or definition restart was required.

Decisions: use the existing named/inline distinction; explicit construction
for named sums; structural normalization for inline sums; keep older versions
and scalar Rule bindings unchanged. These are bounded candidate implementation
choices, not canonical definition or profile promotions.

Gate: existing user authorization, CA2 implementation selection and ARE
route/context/effect checks carry the scoped D65 construction authorization.
Completion is supported by the final regression evidence. No owner decision is
invented. Handoff/experiment harness: not applicable. Synchronized record:
STATUS.md. Strict context coverage: complete for this slice, not all PCR-06.

Product frontier: sum composition is runnable and tested locally. Operational
support: no new prerequisite; packaging, default integration and publication
remain owner-scoped later work. None blocks this candidate construction.

## Open Questions

No open semantic decision remains within this candidate slice. UInt64,
references, sum/collection Rule expressions, automatic codecs, recursive data,
cross-module ownership transfer, full profile/language parity and public
integration remain outside it. The legacy v1 Enum declaration-file issue is
unchanged. Admission/release decisions remain with
[PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
The next bounded field candidate is UInt64 under the existing checked numeric
contract; reference generation remains a separate step.
