# R05 — Configured Interface and public Mapping generation

Status: completed bounded R05 candidate; R06 is next.
Updated: 2026-09-09. Authority effect: none.

## Outcome

`planConfiguredPublicBoundaries` emits TypeScript named Interface leaves and
one facade/provider pair per selected public Mapping. Roots explicitly select
named Interfaces or Mapping v3 nodes; referenced Interfaces become declared
artifact dependencies, not new canonical relationships. No public CLI option,
transport server, member implementation, persistence or hidden Calculation is added.

The planner consumes registered same-graph composition/exact-field snapshots and
pins configuration, selected base/TypeScript profiles, R04, named Interface and
this generation definition. It preserves configured roles and selected
`typescript.bound-interface-structural` / `typescript.bound-mapping-function`
forms. No historical provider is copied and no candidate profile is admitted.

The existing Interface renderer, structured domain value helpers and domain
expression lowering are unchanged. The additive public-value adapter handles
Interface-qualified contracts, wrappers and ontology-field paths. Direct leaf
imports preserve qualified identities; module initialization checks selected
Interface descriptor identities before exposing the Mapping. Plan descriptors
also retain imported artifact hashes; these are provenance, not protection
against maliciously edited executable modules.

## Value and type behavior

- Every explicit input is normalized into owned immutable values before fields
  are evaluated; no getters, coercion hooks, hidden dependencies or domain
  factory/invariant execution.
- Public parameters reference imported normalized `PublicContracts` types.
  Raw public data enters through the existing explicit contract normalizer.
  Domain parameter types retain the established exact-value input protocol.
- UInt64 outputs are bigint; full-width amounts, nested public contracts,
  shared Value Objects/Enums, tagged sums, nullability and list/set distinctions
  retain their declared semantics.
- Total public output uses its imported named target type; partial output is a
  `Pick` of selected fields. Domain output is a field projection, not a
  constructed Entity. Empty public output is a legitimate empty projection.
- Public types remain native structural TypeScript types. Equal-shaped values
  are not claimed to be nominally distinct. Qualified source descriptors and
  normalizer keys distinguish Interface/contract identity.
- All artifacts and the plan are frozen, source-bound and deterministic after
  the source directory is removed. Relocating the module root changes paths
  without changing generated content in the tested same-feature case.

## Bounded context and execution

Task Session with a standard local Context Builder pass; no handoff or delegation.
Controlling selectors: remaining plan R05; R04 public Mapping definition/checker;
named Interface definition/renderer; exact field compilation; configured Mapping
planner and value/expression emitters; configuration Interface/Mapping roles;
TypeScript representation overlays; native Interface/Mapping tests and Workflow
observer API usage. These cover source identity, native forms, exact values,
artifact scope, verification and retained non-effects. No product blocker found.

Internal implementation choice: additive public adapters and one configured
boundary planner rather than rewriting the established domain/Interface emitters.
This preserves predecessor bytes at the cost of a small public-wrapper adapter.
No experiment harness applies to this compiler task.

Definition: [public-boundary-generation-contract.json](public-boundary-generation-contract.json).
Ontology scaffold: [public-boundary-generation-candidate.json](../ontology/public-boundary-generation-candidate.json).
Direct DomainSpec native fixture: `impl/cli/test/generation/configured-public-boundaries.test.ts`.

## Verification

- Source typecheck and catalog/relationship/integration-profile checks pass.
- Initial generated compilation passed but three load checks failed because
  TypeScript inferred a shorter source root. The test harness now passes its
  explicit temporary `--rootDir`; generated code was not changed for this issue.
  The corrected six-test native suite passed 6/6.
- Rich native values and wrapper/default cases passed. Observer setup initially
  failed file access with Docker capabilities dropped; using the host UID/GID
  fixed the test harness, without permission broadening.
- The first two-Interface fixture violated the existing one-to-many exposes
  multiplicity by reusing its Queries. Each Interface now exposes separately
  declared Queries; canonical validation was not weakened.
- One initial ownership mutant altered a shared helper instead of the Mapping's
  return. Narrowing it to the declared return boundary made it an exact observer
  control. Final observer-only run passes with eight deliberately broken native
  sources (imports, normalization, values, ownership, identity, effects and
  Interface request signature). These AST controls do not all claim compilation.
- Three additional semantic mutants compile with the native toolchain and are
  caught by output/ownership assertions.
- Full eight-suite native regression: **82/82 passed**, zero failures/skips in
  100784.13066 ms with test concurrency 2. Suites: configured public boundaries,
  public Mapping input, named Interfaces, configured Mappings, Interface version
  policy, compiled fields, Workflow materialization and configured Workflows.
  The final additional Interface-signature observer control passed separately
  (one focused test, eight structural mutants) after this shared run started.
- 24 protected source files match entry hashes. Package preimage after removing
  only the new registration is
  `aefc4fbe26c2f6ae3ad380ca684971835bab56b0252ad187ec03203251aa3dc2`.

Generated code is compiled with TypeScript 7.0.2 in the pinned local toolchain
image and emitted JavaScript is executed, not evaluated directly as TypeScript.
Readonly consumer tests include actual expected compile failures. Native checks
cover repeated contract IDs across Interfaces and runtime rejection of swapped
Interface descriptors. No dependency installation or workspace symlink needed.

## Exact mutation scope

- `impl/cli/src/generation/public-mapping-values.ts`
- `impl/cli/src/generation/public-mapping-source.ts`
- `impl/cli/src/generation/configured-public-boundaries.ts`
- `impl/cli/test/generation/configured-public-boundaries.test.ts`
- `impl/cli/tools/observe-configured-public-boundaries.mjs`
- `impl/cli/package.json`
- `development/reconciliation-v1/profile-compiler-reconciliation/public-boundary-generation-contract.json`
- `development/reconciliation-v1/ontology/public-boundary-generation-candidate.json`
- `development/reconciliation-v1/profile-compiler-reconciliation/PUBLIC-BOUNDARY-GENERATION.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/CLI-COMPLETION.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/STATUS.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/remaining-work-plan.json`

| Implementation/definition | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/public-mapping-values.ts` | `a3e7f88ac4ceb37cf6548cb47165067d1d749e5fa68627907931cda88afd8c84` |
| `impl/cli/src/generation/public-mapping-source.ts` | `dbb7463a574eda853c8e333da2e8da31683468c4845c15ab8ca455dab9ef6642` |
| `impl/cli/src/generation/configured-public-boundaries.ts` | `8bbf5f045591b3f68d94dc0bd76a3a1515d46eaa9e0bdabbe8632c70e34acf6e` |
| `impl/cli/test/generation/configured-public-boundaries.test.ts` | `34a1140fe89aef6001edab24ddffbe86bb57d385354948cddf3d77c82b3bd5fc` |
| `impl/cli/tools/observe-configured-public-boundaries.mjs` | `7819b277475aa467ed74c3e1d53429050b954d4a7498b69836e83a3be5f592c4` |
| `impl/cli/package.json` | `3a476e81abda8e0243e8b42ac6adabebd1924a98653dc1614761c1d2fc0732e4` |
| `development/reconciliation-v1/profile-compiler-reconciliation/public-boundary-generation-contract.json` | `686852a3615345f8ae2f66957d0b6c0ce825007b0e7c5d41492644b880aac0b9` |
| `development/reconciliation-v1/ontology/public-boundary-generation-candidate.json` | `13e3a44bf3c35da1090aa1408db42f97610ceecb0a740c06e18c6e5e5ccbcb44` |

ARE request `ds-cli-continuation-20260909-067`:
route receipt `dd90c69d6f56ee18a0cef693c26a97ea6dd83cc6cecf6900aaeaa475903ccc78`;
context `5239c6784307d957042fcc7dbaa45ec249fc016ca86393add5bc23796723a3d6`;
effect `65390e5c47d9fdf6a6a760211987ec3a2a38450d1d096360df81ef7abdac7a3d`.
The consequential gate records the exact scope owner and no unknown/rejected
effects. Execution follows the explicit user plan authorization; receipts
carry no authority. No profile admission, release, publication or default cutover.

## Remaining work

R05 validation is complete. Execute R06 supported-input closure next.
In particular, full-width authored Calculation literals
and standalone admission still need their promised successor work. R07–R18
(shared/public planning, Python/Rust parity, native39, commerce controls,
migration, packaging and installed documentation) remain. The CLI goal is active.

ARE continuation to R06 under the same owner authorization:
`a740af286379af82392aa0cbd32b45252db34f70ec2a9eca91009b282e406571`.
