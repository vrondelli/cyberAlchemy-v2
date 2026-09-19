# R06 — TypeScript supported-input closure

Date: 2026-09-09. Product-construction candidate. Authority effect: none.
Status: R06 complete as a bounded candidate; R07 is dependency-ready. No public
CLI, full PCR or release completion claim.

## Denominator and selected contracts

The denominator is the existing **13 backend metatypes in TypeScript**, not the
historical 39 registered realization cells. Every row below names its selected
source, generator, native form, semantic bounds and current executable tests.
The common exact field selection is `domainspec.project-field-selection/v2-candidate`;
the common numeric realization is `domainspec.typescript-exact-uint64/v1` where
the row uses typed UInt64. The parser/source reference audit explicitly selects
`configuration-calculation-v2-sources.json` (v8). Historical source selections
are not rewritten. Names below are internal opt-in APIs, not installed commands.

| Metatype | Selected source and realization | Accepted inputs, dependencies and output | Native controls |
| --- | --- | --- | --- |
| Entity | typed-record/v1; configured-factories/v12 with Rule/v8 | Scalar String/Bool/exact UInt64; named Entity, VO, Enum; optional/list/set/sum nesting and reference bindings. Explicit selected base validators and local additive extensions. Validated factory produces owned immutable identity snapshots on create/reconstruct/transition. Identity equality does not ignore validation of other state. | configured-factories: full-width/composite identities, nested ownership, reference types/no lookup, every construction route, Rule fact views, native consumer negatives and compiling mutants. |
| Value Object | typed-record/v1; same factory/v12 | Same recursive field algebra; exact authored invariant-reference coverage and explicit validator bindings. Owned immutable snapshot with whole-value equality; no identity or database-record substitution. | Same suite: VO invariants, nested Entity/VO/sum values, repeated list versus set equality, incompatible providers and validator bypass mutations. |
| Enum | typed-sum/v1; configured-enums/v2 and new configured-algebraic-enums/v1 | Plain variants use the existing owned const-object definition and explicit owned-case adapter. Payload-bearing named sums use the existing owned sum protocol with scalar/named/wrapper/inline-sum payloads. Enum-only roots require no factory or Rule; real record payload dependencies require their actual factory/v12 bindings. | configured-enums, configured-factories and configured-algebraic-enums: plain/string versus owned case distinctions, tag/payload identity, standalone nested sums, exact bigint payloads, native narrowing, malformed cases, same-byte factory dependency reuse, independent observer and compiling mutations. |
| Rule | typed-rule/v1 or /v2; configured-rules/v8 | Boolean native arrows over explicit normalized typed facts. all/any/not/eq, String or UInt64 lt, contains/set_equal, exists/exactly_one/unique with checked identical-path keys, to_set and declared rule_ref. Property paths and payload-free named variants; explicit transitive Rule arguments. V2 numeric literals are canonical decimal strings. | configured-rules and configured-rule-values: all operators, scopes, numeric boundaries, structured equality, list occurrences/set membership, version combinations, native AST/type controls and semantic mutants. |
| Calculation | typed-calculation/v1 with configured-calculations/v1, or explicit source/v2 with generator/v2 | Pure checked UInt64 arithmetic: literal/input/add/subtract/multiply/divide; explicit floor/ceil/reject. V1 safe JSON-number literals and required calculates consumer stay unchanged. V2 exact decimal literals and zero-or-more consumers; zero input constants permitted. Primitive bigint result. | configured-calculations and configured-calculations-v2: every operator/failure, authored full-width constants and nested expressions, standalone/real-consumer graphs, old rejection, complete input validation, direct Calculation-to-Mapping value passing, independent closed grammar and compiling mutants. |
| Query | typed-query/v1; configured-queries/v1 | Explicit complete Entity data rows and typed parameters; filter all/any/not/eq/lt/lte/gt/gte, exact compatible operands, declared projection/order/limit. Structured equality; required scalar ordering only. Stable row occurrences retained. Returns owned immutable read-model projections, not constructed Entities. | configured-queries: repeated equal-ID rows, tie ordering, structured exact values, all input/row validation, malformed operands, native observer and filter/order/projection/effect mutants. |
| Mapping | typed-mapping/v1 or /v2 through configured-mappings/v1; source/v3 through configured-public-boundaries/v1 | Explicit typed inputs and already-computed values; checked ontology property paths, scalar literals, payload-free variants and to_set. V1 absent-property fallback stays distinct from v2/v3 explicit lazy nullish fallback. Total or partial projection; v3 includes Interface-qualified contracts and exact member-use bindings. No implicit Calculation or factory call. | configured-mappings and configured-public-boundaries: full nested values, defaults/null/empty, explicit computed totals, partial/empty public contracts, real native imports, type negatives and same-type substitution/effect mutants. |
| Policy | typed-policy/v2; configured-policies/v1 with Rule/v8 | Explicit typed facts; ordered cases referencing already declared Rules with exact arguments and existing Operation/Calculation targets. First matching Rule selects an identifier; repeated references remain occurrences. No inline predicate or target execution. | configured-policies: legacy predicate migration, Rule dependency closure, structural input-insensitivity rejection, priority, same-type arguments, source changes and native compiling mutants. |
| Event | existing Event FieldSpec; configured-events/v1 with event-values/v1 | Required/optional string, boolean, signed Int64 integer, finite binary64 decimal, nonempty timestamp/uuid/reference text carriers. Separate type/version/occurrence/time/payload metadata. Supplied time or one explicitly supplied clock call according to authored policy. Immutable Event value, no publication. | configured-events: every carrier and occurrence carrier, optional absence, metadata collisions, signed extrema, reference target identity, exact time calls, native declarations, hostile data and clock/payload mutations. |
| Operation | existing Operation node plus checked operation-action bindings; configured-operations/v1 | Explicit typed inputs, keyed reads, declared enforcing Rules, typed writes/delete, separate Event slots and result expressions. Factory/v12, Rule/v8 and Event/v1 dependencies; awaited explicit atomic state/outbox port. Committed/noncommitted/indeterminate outcomes stay distinct. | configured-operations: real generated dependencies, composite/nested values, no partial writes on guards/invariants/Event failure, source-empty/delete actions, suspended capture, uncertain commits, consumer types and compiling mutants. |
| Workflow | workflow-occurrences/v1 plus checked input/materialization and explicit selected recovery policy; configured-workflow/v1 | Ordered forward Operation occurrences with distinct step identities, typed arguments and available earlier captures. Awaits each Operation. Selected dependency-constrained or unconstrained recovery retains exact committed prefix and materialized compensation arguments without dispatch. | configured-workflows: real distinct/repeated Operations, every failure prefix, uncertainty, capture errors, final-result failures, awaited order, strict native types, R01 classifier differential controls and compiling mutants. |
| State Machine | typed-state-machine/v1; configured-state-machines/v1 with Rule/v8 | Closed state/trigger unions, unique source/trigger transitions, optional declared Rule guard, ordered named output-intent slots. Scalar/structured explicit facts. Pure reducer returns transitioned state/intents or unchanged rejected state; no Event occurrence, persistence or priority inference. | configured-state-machines: trigger edges versus outputs, guardless/self-loop behavior, no-transition/guard rejection, structured facts, readonly transition-specific types, invalid symbols, old rejection and compiling mutations. |
| Interface | typed-interface/v1; configured-public-boundaries/v1 and unchanged named Interface renderer | Qualified reusable public contracts, checked request/result member types, nested public contracts and permitted domain values, empty/optional/list/set/sum shapes; explicit version policy. Structural native contract and normalizers, not a transport implementation. | configured-public-boundaries plus public-mapping source tests: cross-Interface same-name separation, exposed member closure, no leaked Entity public contract, nested/empty data, genuine native consumer imports, swapped descriptor/type mutations. |

All test filenames in this table are under `impl/cli/test/generation` except
`public-mapping`, under `impl/cli/test/input`. Source implementations have the
corresponding names under `impl/cli/src/generation`; semantic decoders and checked
adapters live under `typed-backend`, `typed-operation` and `input`.

## Bounds that are meanings, not waived promises

- The typed algebra preserves scalar/named/optional/list/set/sum distinctions.
  Its current decoder bounds type/expression nesting; selected graphs must have
  finite owned embedding. References may carry cyclic target identity without
  recursively embedding those targets. No automatic lookup or existence proof.
- A list preserves order and repeated occurrences. A set requires semantic
  uniqueness and normalizes ordering. Only explicit `to_set` performs conversion.
  Entity equality uses identity, VO equality uses every field, sum equality keeps
  tags and payloads. Equal plain Enum wire strings are not nominally distinct;
  the existing owned-case protocol supplies owned identity where required.
- Optional data fields, required formal arguments with optional types, absent
  Event fields and missing Mapping inputs are not interchangeable. Existing
  row-specific absence semantics are preserved and tested.
- Rules/Mappings use only the declared value-expression grammar. They do not
  gain arbitrary calls, implicit optional unwrap, sum-pattern extraction or
  payload construction expressions. Payload values themselves compose through
  explicit input parameters and existing constructors. Factory validator paths
  traverse required owned fields and may end at a supported matching structured
  type; they do not invent a path across optional/list/set/sum boundaries.
- Query ordered operands are required scalar values; no invented total order
  on optional records or sums. Source/v1 literals retain their authored encoding;
  full-width numeric values are supplied through checked parameters and rows.
  V2 Calculation and Rule literal improvements do not silently amend Query/v1.
- Current Event authoring remains FieldSpec-based. Nested typed-algebra Event
  payload authoring was not added to this plan. Reference fields are carriers,
  not embedded records. Timestamp/uuid carriers do not prove format or uniqueness;
  decimal means finite binary64, not arbitrary exact decimal arithmetic.
- Explicit Operation transaction ports are dependencies, not installed durable
  providers. Workflow uncertainty cannot manufacture committed/noncommitted facts.
  Compensation arguments and intents are prepared; no compensation is dispatched.
  State Machine output slots are intents, not delivered Event occurrences.
- Closed inert-data checks do not claim arbitrary Proxy/realm sandboxing.
  All selected malformed/unknown versions, roots, bindings and source drift fail
  before output writes. Native types supplement rather than replace runtime checks.

These are the existing checked contracts and decisions, not new exclusions
invented to make an implementation count reach thirteen. Legacy lanes remain
explicitly separate. Public diagnostics/migration and the unified artifact plan
must present these selections without pretending older/default APIs support them.

## Residual closure and dependency accounting

1. **Calculation full-width source and standalone admission:** the previously
   required product choice was explicitly approved. Definition, ontology scaffold,
   source decoder, native generator and negative legacy paths are implemented in
   [CALCULATION-V2.md](CALCULATION-V2.md). V1 files remain unchanged.
2. **Standalone payload-bearing Enum:** audit found the plain Enum planner rejects
   payloads while the factory planner requires nonempty factories and Rules. New
   `configured-algebraic-enums` accepts Enum-root closures, reusing exact existing
   sum/component renderers and, only when needed, real record factory plans.
   No source admission or domain semantics changes; no fabricated consumer.
3. **Factory/Rule version combinations:** latest factory/v12 explicitly selects
   Rule/v8, using exact fields. V11 remains Rule/v6 or /v7; old output and rejection
   tests are retained. Structured arguments become explicit plain fact views only
   after normalization and ownership validation. No new version mismatch found.
4. **Query/Mapping structured inputs:** current exact field model, checked value
   expressions and native normalizers already cover the selected algebra. Public
   Mapping/v3 joins Interface identity through R04/R05 without flattening it.
5. **Event/Operation/Workflow/Interface joins:** executable suites validate actual
   imported modules, typed payload capture, occurrence identity, argument/result
   ownership and existing recovery semantics. Public Mapping imports real Interface
   contracts. No additional input-contract change was needed for those rows.

Native artifact deduplication/import closure across independently selected roots
is still **R07**, not proved by this table. Public CLI/API integration and safe
output are **R08/R09**. Python/Rust **R10/R11**, native 39 cells **R12**, one commerce
corpus **R13**, broader relationships/non-collapse **R14**, compatibility **R15**,
package/docs/exact final review **R16–R18** remain. No downstream task is marked
complete by local generator evidence.

## Evidence and task session

The first affected nine-suite group passed **201/201**, no failures/skips,
307811.277935 ms. It includes factories, Rules, Enum, Calculation/v1 and initial
Calculation/v2, public boundaries, Workflow, public Mapping source and configuration.
Seven remaining generator suites passed **63/63**, no failures/skips,
153318.727345 ms: Query, Mapping, Policy, Event, Operation, State Machine and
structured Rule values. Final Calculation additions, standalone sums and new
configuration negative controls passed **27/27**, no failures/skips,
18446.748144 ms. After one final leaf-only Enum compatibility test was added,
the complete standalone Enum suite passed **6/6**, no failures/skips,
8866.576844 ms. These separate evidence epochs are not counted as one fresh
full-suite run.

Source typecheck passed with frozen catalog/relationships/integration checks.
The normal `test:parallel` command now registers the previously omitted
configured Calculation, Query and structured Rule suites, plus both new suites.
All 57 registered parallel-suite paths exist and are unique; no dependency or
lockfile changed. The whole default command, including unrelated proof/provider
lanes, was not run and is not claimed as passing.
Twenty-three selected protected source files retain their preceding hashes;
the parser is the deliberate versioned change. The v1 Calculation renderer,
backend decoder and canonical relationship authority remain unchanged. Exact
scoped whitespace checks passed.
All native tests use the existing pinned TypeScript 7.0.2 / Node 26.8.1 container,
offline and without installing providers. The independent observers inspect native
syntax plus exact support bounds; executable witnesses remain separate evidence.
Historical catalog registration is not native coverage or product approval.

Task Session is executing dependency-ready R06, with Context Builder selecting
the current source contracts, renderer bounds, preceding reports and actual test
cases. Runtime is local native; no handoff/delegation; strict handoff coverage and
sigil experiment harness are not applicable. Fallback search was limited to
identified input gaps. Decision Gate records the one explicit Calculation choice;
the Enum root gap is completion of existing semantics, not a new source policy.
The additional scoped effect result is
`e377b86629f80d6b8e7c9d37178cd30e644b89724650de6bc78d00db3fc48f9e`.

Initial sum observer test used a mutant that did not compile because it changed
a bigint payload to Boolean. The native compiler correctly rejected it. The
test now uses a same-type zero-normalization mutant, so independent observation
is tested beyond ordinary type rejection. No production implementation was changed
to accommodate that test fixture.

Operational support: no new current blocker. Release, publication, profile
admission, default cutover and AlchLang reconciliation remain deferred with their
respective owners. Tests do not grant those effects.

R06 completion continuation result:
`80e3d8e9d673f21d85dd4e3ddb9f7a0f188a3a3f5c0833002e9f286c50bb47b5`.
R07 is the next selected bounded implementation under the existing owner request;
its fresh route receipt is
`4adfb5f093ccfdfc12c254db04cf069e319e7fe2bc9bc1c981516cb3bd3caa13`.
These records preserve continuation context, not completion of R07 or the CLI goal.

## Exact implementation and source identities

Paths are relative to the DomainSpec v2 project. Candidate identities are
provenance, not approval or authority.

| File | SHA-256 |
| --- | --- |
| `development/reconciliation-v1/profile-compiler-reconciliation/calculation-v2-contract.json` | `7a666e31e0ce1b19282203cdefb3db7eba78b2a9909792d62a49acc12bfdc383` |
| `development/reconciliation-v1/ontology/calculation-v2-candidate.json` | `75f941d210741e8b6e0f867262d7ae1a84d62e31e0e2e33f7b1b3e53adba31b1` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs` | `a0a3ab33f59f9ab00ccd726c88ca1fa81362588800f4219d03fe7295dd7869c0` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs` | `af520e8e9fa8649da9be87c94d56a69999ba2e7dda6f0ac8b160047486fd9616` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration-calculation-v2-sources.json` | `0f6ecd3f707f218b26482245564337ea9c6c32c222bb7911609180890907a184` |
| `impl/cli/src/typed-backend/calculation-exact.ts` | `53dd4df38310409ce71d02ede548d0a345642ff8e6a20c8431d4257489c4f6c1` |
| `impl/cli/src/input/project-model.ts` | `192ca4fdfd9a91ac86b25cce5dbd6e3ec5bf122de243f831bf6df213901e6218` |
| `impl/cli/src/generation/configured-calculations-v2.ts` | `5f1b78b84ddfffd7bc5c98c3c667181846881ad54ec74e82d639373bd2c1e0be` |
| `impl/cli/src/runtime/in-memory.ts` | `da828954f3c7b529634ad412709e312406be624373a390dafcf36cec5b6c85ed` |
| `impl/cli/src/formalization/projection.ts` | `d61abf9ac65354a02448430be7167128b8e98ff59328f90027f71c6742624998` |
| `impl/cli/src/generation/plan-instantiation.ts` | `e89a2b59c6b49d75ae13cf28ebfbf3ec81c8fae052fec1b53c091b5bbc5ba2c2` |
| `impl/cli/test/generation/configured-calculations-v2.test.ts` | `c1c210e09190015ba28b59c683c20823c10d2edd497d7fd3de1d0f02733e4cd7` |
| `impl/cli/test/generation/configured-enums.test.ts` | `727760285e75bfe1aef4be48c80bea92e633fa987a85c327dfbeb1c82fc60e9b` |
| `impl/cli/test/generation/configured-rules.test.ts` | `c66aacc54f6a767d36fc8294ec4a6c46400629f36acf4366dec5a1b390a751eb` |
| `impl/cli/test/generation/configured-factories.test.ts` | `21c5172ce27c8da20639bcd037d541ef66d82dea52198f2ab9ed8613e5931075` |
| `impl/cli/tools/observe-configured-calculations-v2.mjs` | `ed4df634f02ec5584803691913388a1b5eb4e1d8846b47c90dda6c880a281ec7` |
| `development/reconciliation-v1/profile-compiler-reconciliation/standalone-sum-contract.json` | `58968ae73145d4663ff8a4cf78e1d2836131ba7ae0d51fb2e53ddf748d22e1cb` |
| `development/reconciliation-v1/ontology/standalone-sum-candidate.json` | `2d183927b7ca40818ac120cc3f843f59d283841bb2209854b904f27b57ddd70d` |
| `impl/cli/src/generation/configured-algebraic-enums.ts` | `477494f89e78b4ac96d8ee042943ab7727d277d877c7047371ade50b5698b955` |
| `impl/cli/test/generation/configured-algebraic-enums.test.ts` | `6b37310de97184d002666b72b2d5bbfe9d4f2e409282cc3e468f3a60280f3df8` |
| `impl/cli/package.json` | `a8d3d55cb532d3e408f14affcae07ce2f6ee1164caaaee674c4eecda1d5b88b0` |
