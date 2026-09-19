# PCR-06: configured TypeScript plain-Enum generation

Date: 2026-09-08. Internal candidate implementation and evidence report.
Authorization: user `next`; bounded native implementation under the existing
D65 construction boundary. Authority effect: none. No default compiler cutover.

## Outcome and scope

The [Enum planner](../../../impl/cli/src/generation/configured-enums.ts) consumes
the [checked field model](../contracts/COMPILED-FIELD-REPORT.md) and produces
actual TypeScript source modules, not sample data or database tables. It uses
the existing `typescript.owned-const-object-enum/v1` protocol. Primary concept
modules contain an owned constant and its `EnumValue` type alias, not classes.

This is a completed **plain, payloadless Enum candidate slice**, not full Enum
profile admission, all-data generation, or all of PCR-06. Payload-bearing sums
reject explicitly; they are not flattened into strings. A selection containing
an Entity or Value Object rejects instead of silently filtering those nodes.

## How to use the internal API

Call `planConfiguredEnums(checkedFields, selection, sources)` with a snapshot
returned by `compileSelectedProjectFields`. Select only the desired plain Enum
roots in that preceding checked-field compilation. The generator consumes every
declaration in that selected closure. Its selection is closed:

```ts
const selection = {
  schema_version: 'domainspec.configured-enums-selection/v1-candidate',
  language: 'typescript',
  module_root: 'application',
  field_compilation_sha256: checkedFields.compilation_sha256,
} as const;
```

The source bundle consists of raw `configuration`, `base`, `typescript` and
`provider` source strings. Exact hashes are checked before generation. The
result is an immutable, digest-bound plan containing source artifacts and a
distinct runtime-support entry; the API performs no filesystem writes.

For `commerce:status` with `Draft` and `Submitted`, the leaf at
`application/features/commerce/src/domain/enums/status.ts` is:

```ts
import {defineEnum} from "../../../../../runtime/enum.js";
import type {EnumValue} from "../../../../../runtime/enum.js";
export const Status = defineEnum({"Draft":"Draft","Submitted":"Submitted"} as const);
export type Status = EnumValue<typeof Status>;
```

One shared `application/runtime/enum.ts` is copied **byte-for-byte** from the
[owned runtime provider](../../../impl/architecture-conformance/typescript/runtime/enum/index.ts).
Its original error class is retained; this report does not claim that the
support provider contains no classes. Each primary Enum imports that same
provider, retaining its runtime ownership identity and frozen member behavior.
No generated composition relationship is invented. A consumer can use the
provider's existing `composeEnum({Status, AuditStatus})` contract explicitly.

## Contract and authority boundaries

- The checked-field adapter now exports its existing WeakSet-based snapshot
  assertion. Cloned or fabricated snapshots reject. Generation performs no
  source reread and does not execute invariants.
- Configuration, both profiles and provider bytes are exact-bound. The Enum
  role is read from PCR-05 and protocol selection from the TypeScript overlay.
  The source path and provider digest are included in the support manifest.
  This does not replay the full configuration reference audit or historical
  admission receipts, or clear the frozen configuration's DSR-009 blocker.
- The selected field-compilation digest, graph certificate, model identity,
  module members and ontology-variant references, source digests and artifacts
  are included in the plan identity. DEC-05 remains unadmitted.
- The wire-value rule is explicit: each declared variant name is its string
  value. Members are sorted and no extra values or overrides are accepted.
  The field model represents the same plain Enum as `{variant: "Draft"}`;
  generated `Status.Draft` is the string `"Draft"`. Tests check that explicit
  correspondence. There is no automatic codec or representation equivalence
  between the raw string and the tagged object.
- Runtime ownership brands the Enum object, **not individual string values**.
  Equal wire strings from different Enums are equal and may be structurally
  assignable. No claim of per-value nominal separation or satisfaction of a
  stronger interpretation of `nominal-type-identity` is made.
- Portable naming follows PCR-05 and is compared with its location preview.
  Unsafe/reserved names and an `EnumValue` helper-name collision reject. Same
  node names in different features remain separate modules. Root relocation
  changes paths but preserves source content.
- Entity and Value Object target implementations and factory proof providers
  exist. The inspected Settlement targets are fixture-specific, not generic
  generators. Their validator and component-protocol obligations must be
  implemented before extending this generator family. Stale `provider-absent`
  wording in profiles is not evidence that those implementations are missing.

## Validation and reproducibility

The [six-test Enum suite](../../../impl/cli/test/generation/configured-enums.test.ts)
starts from real temporary DomainSpec project sources, compiles checked graph
and field snapshots, and independently declares expected paths, imports and
members. It uses the existing pinned TypeScript 7.0.2 / Node 26.8.1 toolchain.
Native Docker runs have no network access; no dependencies were installed.

An [independent native AST checker](../../../impl/cli/tools/observe-configured-enums.mjs)
checks the declared artifact set, Enum leaf path, exact provider bytes, owned
factory call, static literal members, export/type-alias forms and imports.
It does not consume the generator's own expected-member manifest as its oracle.
Runtime checks independently verify values, freezing, owned composition and
rejection of forged/repeated contributions. Native type checking accepts a
valid `Status` assignment and rejects `"Unknown"`.

Negative controls cover changed/missing members, bypassing `defineEnum`, changed
imports, mutable declarations, extra exports, erased types, computed members
and provider drift. A changed-wire mutant still compiles but fails independent
expected values, checked-field correspondence and AST member observation.
Scope tests reject payload sums and mixed Entity input. Source-root orthogonality,
repeatability, immutable plans, source drift, accessor options, forged snapshots
and name/path rejection are tested separately.

Run from the DomainSpec root, using the existing locked local dependency setup:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 \
  impl/cli/test/generation/configured-enums.test.ts \
  impl/cli/test/input/compiled-field-model.test.ts \
  impl/cli/test/input/field-reference-model.test.ts \
  development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
  impl/cli/test/generation/configured-rules.test.ts \
  impl/cli/test/generation/profiled-project.test.ts \
  impl/cli/test/input/project-model.test.ts
```

Final counts and full CLI source typecheck results are in [STATUS.md](STATUS.md).
The entire CLI `test:parallel` suite is not claimed as rerun. Source generation,
CommonJS compilation/runtime and native NodeNext AST inspection are checked;
declaration-file packaging and public CLI/application integration are not.

## Exact implementation identity and preservation

| Artifact | SHA-256 |
| --- | --- |
| `configured-enums.ts` | `1faa0240e26eb27e3b51c13d2d8d9f30c060d817421f233e60569c488ace0264` |
| `observe-configured-enums.mjs` | `25d84111f58e72fc7870434f8fbc7fdbadfbfde5e14a6140be04b7d5cbbc1ac1` |
| `configured-enums.test.ts` | `443c7b26adeef497e5447ccfc5e402a5fbb87de5d3da31413c9b4a52d5790b03` |
| `compiled-field-model.ts` with exported assertion | `cd48b4be11a7a042283767e6812ae3b86dde0267fecb943f772bff2252d5f660` |

The write envelope is these four files, package test discovery, this report and
successor status. Removing only this turn's test entry reconstructs the package
preimage `480524d429df1e15e0ef61736563d164a7962c105bb6e7f73c61249e7c8cb6d5`.
Reversing only the exported assertion refactor reconstructs the field-adapter
preimage `9b6139267dc7a09b77e3c9c5c6a65d08a09bad8ade98a0778a4b6a87ec12e684`.
Both comparisons pass. Earlier reports' hashes remain historical evidence.
Existing Rule/L0 generators, configuration and Enum provider retain their exact
entry hashes. No existing dirty changes were overwritten or committed.

## Remaining frontier and open questions

Next bounded work is generic Entity/Value Object generation with bound invariant
execution and owned component equality/identity protocols. Payload-bearing sums,
full Rule coverage, three-language parity and the stronger Enum value-nominality
question remain separate. The owning plan is
[PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions). PCR-06 stays partial;
default integration, release packaging, AlchLang reconciliation, authority
admission and external publication remain outside this slice.

Task-session/context-builder kept the work to a candidate implementation,
independent verification and synchronized successor evidence. No new task,
subagent, adapter handoff or historical receipt rewrite was used.
