# R07 — Shared resolved artifact plan

Date: 2026-09-09. Product-construction candidate. Authority effect: none.
Status: R07 complete as bounded candidate construction. Public CLI/API integration
and output qualification remain R08/R09; this is not CLI or release completion.

## Implemented candidate

The internal `planResolvedArtifacts(graph, boundary, selection, definition)`
entry point in `impl/cli/src/generation/resolved-artifact-plan.ts` composes the
existing configured generators. It accepts no caller-authored artifacts, provider
callbacks or revived JSON snapshots. No public command or default was changed.

Its closed selection names TypeScript, the existing profile layout, one module
root, exact graph/boundary hashes and explicit versioned generator requests.
Registered field/action/Workflow objects retain their checked identities. Each
generator still validates its own selected source bytes, value profile, input
contracts, qualified roots and bindings. Factory/v12, Rule/v8, Enum/v2,
algebraic Enum/v1, Calculation/v1 and /v2, Query, Mapping, Policy, Event,
Operation, Workflow, State Machine and public-boundary adapters are joined.

The immutable result records:

- The checked graph certificate and semantic source manifest.
- Exact child selection and plan hashes, field-compilation identities and
  source-key bindings.
- Content-addressed source blobs for the selected generation definitions and
  profiles, including their exact bytes.
- Existing generator-selected artifact paths and unchanged bytes.
- Qualified owning selectors, metatypes, shared support files, native named
  exports, leaf imports and target-content hashes.
- Separate native-compilation, independent-observation, semantic and safe-output
  verification obligations.

Repeated identical paths deduplicate only when content and digest both agree.
Conflicting definitions reject before writing. Case-fold aliases, file/directory
overlap, out-of-layout paths, unresolved native leaves and missing exported names
also reject. The planner performs no writes.

Native imports come from actual generated modules, not from traversing every
canonical graph relationship. Policy targets are identifiers without target
imports or execution. State Machine Event references remain intents. Query
projections do not construct Entity factories. Workflow's explicit `node:crypto`
`createHash` dependency is recorded as a standard-library dependency rather
than a generated file or arbitrary installed package.

## Shared-core verification checkpoint

The initial shared-core four-suite run passed **27/27**, zero failures/skips, in
39429.381321 ms:

- `test/generation/generated-module-surface.test.ts` — 2 tests.
- `test/generation/resolved-artifact-plan.test.ts` — 9 tests.
- `test/generation/configured-calculations-v2.test.ts` — 10 tests.
- `test/generation/configured-algebraic-enums.test.ts` — 6 tests.

The shared fixture contains all thirteen metatypes, both Calculation versions,
an independent payload-bearing Enum, owned Entity/VO/Enum dependencies, both
domain and public Mapping, a Rule-based Policy, actual Event/Operation/Workflow,
a guarded State Machine and a named Interface. The joined project compiles and
executes in two independent output directories using pinned native TypeScript
7.0.2. Full-width Calculation values flow explicitly into Mapping. Factory
validation, Rule selection, repeated Query rows, state transitions and awaited
Workflow/Operation behavior are tested.

A separate native TypeScript AST observer reconstructs every static import and
export and agrees with the planner's lexical inventory. Compiling extra-export
and same-type cross-feature import substitutions are detected independently.
The lexical inventory is not advertised as a TypeScript parser or type proof.

Further controls cover request-order determinism, source relocation/removal
after compilation, cloned graph/boundary/field/action rejection, registered
cross-graph inputs, source drift, unexpected versions/keys, getter avoidance,
caller ownership, digest reconstruction and real incompatible Enum definition
collisions. Two same-spelled Calculation exports in separate features preserve
distinct full-width values.

The initial fixture used the wrong Enum body key; it was corrected to the
existing `values`/`ontology_node` contract. The generated Enum provider exposed
template interpolation in the lexical inventory; the inventory now handles
balanced interpolation and rejects module expressions there. Initial source
type errors and an assertion's diagnostic-case mismatch were corrected.
All final checks above include those corrections.

Source typecheck passes, including catalog (39 rows), relationship authority
(31 signatures) and integration-profile checks. The 24 selected protected
source files match the prior verified checkpoint, including the R06 parser.
No old generator output, source admission, dependency lockfile, Git history,
public API or default selection was changed. Both new suites are registered in
the existing test command; the entire default test command was not rerun.

Native checks used the locally pinned Docker image, no network, a read-only
container, dropped capabilities, the host UID/GID and cached Node typings.
No dependencies were installed and no development `node_modules` link was made.

## Minimal-context and source-capsule closure

The additive [minimal context definition](minimal-value-context-contract.json)
and its ontology scaffold make absent domain declarations explicit. Null fields
are not a synthetic record, field snapshot or factory. Present fields still
require registered exact graph-bound identity; undefined, cloned and cross-graph
fields reject. Existing type checkers receive an empty declaration environment
when fields are absent, so unresolved named values and Entity reads/writes cannot
silently acquire types. Source grammar and value restrictions stay unchanged.

Action binding, Workflow binding/materialization, Operation generation and
public Interface/Mapping generation now carry the same nullable field identity.
Scalar/inline values generate no domain factory. An Enum-only closure reuses the
existing standalone algebraic Enum planner and owned case/sum providers. A plain
Enum closure generates no unrelated sum. Empty factory bindings remain explicit;
selected factory definition/provider bytes still reject drift when unused.
Guard-only Operations generate no synthetic Event or state write. Null/Enum-only
descriptors pin the additive definition; nonempty existing native bytes remain
exactly unchanged.

The [source-capsule definition](reconciled-source-capsule-contract.json) and
ontology scaffold precede a closed 37-source selection in
`impl/cli/contracts/reconciled-source-selection.json`. A deterministic build-time
materializer verifies each pinned source path/hash and emits an immutable runtime
module; it never refreshes pins. Runtime access uses closed logical IDs, verifies
the compiler-selected capsule digest and exact content sizes/hashes, and performs
no development-filesystem lookup. Build/typecheck now run
`reconciled-sources:check`. The shared plan captures upstream checked action,
Workflow, recovery, materialization and outcome definitions as well as generation
sources; implicit Enum/minimal-context dependencies enter the same source blobs.

Pinned identities:

| Artifact | SHA-256 |
| --- | --- |
| Minimal context definition | `187e86508003eab90669ebe31a7f6268d394cd4ba5182fb8a6687ca11e4213dc` |
| Source capsule definition | `854845c11c83d7a82f911bfb95db2f1ad8e8a1c0edbef975bdbb40fb3063c566` |
| Canonical source selection | `b71f2bd75663d83c5105950b45e96b3da30a05272a075fe3bdd6ab9f0f6ff07a` |
| Selected capsule body | `3ebccb78ef02e7c16e6cf68526b0a379d3830a40fa85aa4f387a8936470789df` |
| Pre-change all-13 canonical native artifacts, rechecked after this change | `22a3931472b5663916e76ed0822c67dd1dfd9c9a8738f99a9fdce668d6faad7f` |

### Closure verification

The affected 13-suite regression passed **113/113**, zero failures/skips, in
122119.337209 ms. It covers the module inventory/shared plan, minimal contexts,
source capsule, Operation, Workflow, materialization, public boundaries/Mapping,
action/Workflow/recovery bindings and algebraic Enums. After adding plain-Enum
and guard-only minimal cases, the final three-suite run passed **19/19**, zero
failures/skips, in 25623.868462 ms:

- `test/generation/minimal-value-context.test.ts`: 6.
- `test/generation/reconciled-sources.test.ts`: 4.
- `test/generation/resolved-artifact-plan.test.ts`: 9.

Minimal projects construct checked bindings using bundled definitions while
development-file reads are denied, compile native TypeScript and execute actual
Operation/Workflow/public Mapping code. Full-width UInt64, inline and named sums,
optional absence, repeated lists and unique sets preserve their distinct meaning.
Equivalent duplicate set elements reject before provider effects. Guard rejection
rolls back; uncertain settlement does not become success. Source-directory removal
after checking preserves the plan.

The runtime capsule and its actual TypeScript dependency closure were separately
compiled and relocated, then loaded by Node with filesystem permission restricted
to the emitted directory. A deliberate development-source read fails with
`ERR_ACCESS_DENIED`, while all 37 bundled sources remain available. This proves
the internal loader, not an installed public command or a release package.
Mutated bytes, caller-recomputed capsule hashes, wrong paths/IDs, duplicate source
identities and accessor payloads reject; getters are not called.

The source-bound configuration suite passes **12/12**, zero failures/skips,
in 946.17179 ms. Source typecheck passes with all four materialization checks.
The 18 prior protected files outside this turn's intentional adapter edits match
their verified hashes, including the R06 parser. The all-13 native-byte baseline
also passes exactly. No source-selection pins, dependency lockfile, public API,
default, published package or provider implementation was changed. The two new
suites are registered in the normal test command; the full default suite was not
rerun.

Initial tests exposed an unsupported `list<optional<T>>` public shape and a
pre-entry invalid-value exception that a test incorrectly expected as a returned
outcome. The tests were corrected to the existing supported wrapper shapes and
exception contract; neither product behavior was widened. All final runs above
include those corrections. An intermediate source typecheck occurred before the
Operation null-field adapter was complete; the final typecheck is passing.

No R07 construction remains. R08 public CLI/API integration is dependency-ready;
R09–R18 retain their existing boundaries. No new product decision is required.
Operational publication/release/default cutover remain deferred and unauthorized.

## Task Session and context evidence

Task: R07. Runtime: local native; no adapter or delegated handoff. Context mode:
standard selector-level dependency recovery, expanded only for concrete
generator signatures and tests. Strict handoff coverage: not applicable.

Controlling sources: REMAINING-WORK-PLAN R07/R08, TYPESCRIPT-INPUT-CLOSURE,
checked graph/boundary/field contracts, existing configured planner signatures,
native Workflow/public-boundary test harnesses and source-bound generator
definitions. Construction sequence: definition, ontology scaffold, direct
DomainSpec fixture, shared implementation, native/independent tests.

Implementation choice: reuse existing generator path and semantic authorities;
explicitly reject conflicting definitions rather than rewriting their bytes.
No unresolved blocker-level product decision. Candidate gate only; exact user
instruction supplies implementation scope, not operational authority.

ARE route receipt:
`4adfb5f093ccfdfc12c254db04cf069e319e7fe2bc9bc1c981516cb3bd3caa13`.
Context result:
`221e6275e68fc9fe571d9152995414e516597404656635d16bab67b8b1c7063b`.
Implementation effect result:
`78c57b7c4b3b81550fde222fb17dd8c75389fb5a56c2c3271bbe5d883d1e6441`.
Evidence/test-registration effect result:
`3aa78a844265a6525ebe4b74e2ccf52f4d4df326c31c12a70f3abf251f839dfb`.

Closure continuation route receipt:
`0464965325879735bcb0b1ceeff4a34aaacc35aad5554478e52bcb92cda34fbf`.
Context result:
`c0daa9099939bb5dd85b27c6ac5c9486dc0bed5b5ba6cfecab7d93560c3e704d`.
Exact minimal-context/capsule implementation and evidence effect result:
`d402bfb0beb338623d65d4e455fc63ffe19ca7e014ade55714d72a17187ef386`.
Task Session and Context Builder kept this a bounded definition/scaffold/fixture/
implementation/verification/evidence unit. The integration fix reuses existing
value meaning and providers; no new metatype, relationship or runtime authority
was selected. Fallback search was limited to concrete adapter gaps. No handoff.

Task result: PASS for R07. Decision Gate: not applicable; zero blockers.
Experiment harness: not applicable (product compiler work, not sigil development).
Synchronized records: this report, STATUS, CLI-COMPLETION and remaining-work JSON.
