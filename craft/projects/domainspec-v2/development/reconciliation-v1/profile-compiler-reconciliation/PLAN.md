---
title: DomainSpec profile and compiler reconciliation
status: candidate-plan-not-executed
updatedAt: 2026-09-08
owner: DomainSpec product owner
scope: 13 backend metatypes across TypeScript, Python and Rust
authority_effect: none
---

# Profile and compiler reconciliation plan

Package: `DSV2-PROFILE-COMPILER-RECONCILIATION-001` (PCR).
This is an additive specialization of the [whole-product plan](../PLAN.md),
not a replacement roadmap or an admitted execution plan. The user requested
planning only. No implementation, baseline promotion, release or publication
is authorized by this document. AlchLang reconciliation remains deferred.

## 1. Outcome

For every supported DomainSpec node, one explicit, versioned compilation
selection must govern its semantic contract, language representation, generated
source location, filename, symbols, imports, support dependencies and verification.
The same selected meaning must survive native compilation and execution.

The denominator is 13 backend metatypes x 3 languages = 39 realization cells.
It is not 39 arbitrary programs: each cell must declare its supported input
contract and independently test that contract. Unsupported inputs reject; a
previously promised input cannot be removed from scope to make the matrix pass.

Completion means working generated code and checked composition, not merely
profile JSON, catalog registration, folders, copied reference implementations,
matching generator output, or provenance comments.

## 2. Evidence and reuse boundary

| Existing surface | What is established | Reconciliation treatment |
| --- | --- | --- |
| [Current implementation state](../../../definitions/meta-types/current-implementation.md) and [baseline @10](../../meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json) | 39 baseline-admitted realization rows. The preceding read-only check found all 117 source/provider/binding files present and hash-matching. | Preserve @10. Rehash selected inputs at execution entry; matching these 117 files is not validation of every baseline member or generated target. |
| [Entity candidate](../../remaining-meta-types/candidates/entity.json) and the other 12 candidate records | WP-RMT-001 covers Entity, Value Object, Enum, Query, Calculation and Policy; WP-RMT-002 covers Operation, Rule, Interface, Mapping, Event, State Machine and Workflow. | Reuse all 13 meanings and three-language implementation references. Preserve later reconciliation evidence; never replay a superseded work-pack route. |
| [Architecture profiles](../../implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json) and its Python/Rust siblings | Shared base constraints; language representation overlays; Rule/Operation location constraints; filename/callable/import policies. Profile documents still contain candidate and historical provider-status fields. | Distinguish profile-document status from exact implementation admission. Resolve source/version conflicts explicitly, not by picking the newest label or changing old hashes. |
| [Factory](../../../impl/architecture-conformance/factory/README.md) and [reproducibility report](../../meta-type-factory-reproducibility/PROTOTYPE-VALIDATION-REPORT.md) | Generic locked proof execution, replay and bounded same-host reproducibility. The report alone is not current replay evidence; referenced runs are absent in this checkout. | Reuse proof infrastructure and provider contracts where inputs exist. A proof provider is not automatically a code-generation provider. Record missing predecessors; create fresh evidence rather than fabricate old receipts. |
| [CLI selection](../../../impl/cli/src/generation/plan-instantiation.ts) and [renderer](../../../impl/cli/src/generation/generators.ts) | Catalog selection is separate from rendering; typed Entity/Value Object output uses classes. | Fix generation-contract conformance, not just the spelling of `class`. |
| [Entity closed-subset checker](../../../impl/architecture-conformance/realizations/entity/typescript/identity-lifecycle-v1/closed-subset.ts) | Exact Settlement fixture checker rejects class/new and checks fixture-specific exports and tokens. | Preserve this checker. Add parameterized, independently tested generated-target observation; do not run a fixture-name checker unchanged against arbitrary user models. |
| [DSR-007 report](../evidence/l0/REPORT.md) | Bounded Entity/Query behavior passed; profile form and architecture placement were not established. | Preserve the historical PASS and its bytes. Add a successor vertical with the missing obligations; do not relabel the old result as profile-conformant. |
| [Shared compilation](../../compilation-reconciliation/PLAN.md) | Existing checked graph-snapshot path and provenance separation. | Extend this path; do not add a second parser/compiler or reread mutable source for generation. |
| [Accepted application layout](../../output-layout/acceptance-v1/README.md) and [layout implementation](../../../impl/cli/src/generation/output-layout.ts) | An exact application-layout/v1 candidate was accepted; source layout, build products and application envelope already have consumers. | Preserve version-1 behavior. Reconcile architectural source roles with this envelope through an explicit versioned contract and compatibility tests. |

Original RMT plan/receipt paths are incompletely retained. Their absence limits
historical verification but does not prove implementation absence. Recovery is
bounded to exact selected references; it must not delay a fresh, independent
prototype when those historical receipts are not required inputs.

## 3. Configuration model to reconcile

Keep these responsibilities distinct while exposing one resolved compilation plan:

1. **Domain authority:** metatype identity, semantic rules, fields, relationships.
2. **Architecture profile:** allowed representation, callable/export shape,
   validation and extension rules, dependency direction and source roles.
3. **Language realization selection:** exact admitted/candidate protocol,
   implementation reference, observer and code-generation implementation.
4. **Output layout:** logical module root, architectural folders, safe names,
   native module wiring, application envelope and build-product locations.
5. **Resolved build record:** exact versions/digests, per-node selections,
   output/import plan and evidence requirements.

Reuse existing schemas and registries where their meaning fits. Do not invent a
second metatype registry or turn historical proof implementations into mutable
templates. The compiler may parameterize reusable implementation mechanisms, but
their behavior must be proved for authored inputs instead of asserted by reuse.

The profile-resolution contract must specify deterministic inheritance, supported
override fields, conflict rejection, missing selection behavior and dependency
closure. An override cannot disable a semantic obligation. Unknown versions,
duplicate axes, cyclic inheritance, stale bindings and conflicting selections
reject before writing. Existing `realizationProfile` numeric behavior and
`outputLayout` settings must not be silently reinterpreted as this broader model.

## 4. Per-metatype reconciliation matrix

Representations below summarize existing language profiles. Proposed logical
locations complete the missing mapping; they are not accepted path decisions.
Paths are relative to a selected module's source root; native spelling and
packaging remain language-specific. Exact Rule/Operation root semantics must be
settled before treating this table as a machine configuration.

| Metatype | TypeScript form | Python form | Rust form | Proposed logical location |
| --- | --- | --- | --- | --- |
| Entity | Validated factory, immutable identity snapshot | Factory/dataclass | Factory/struct | domain/entities |
| Value Object | Validated factory, value equality | Frozen dataclass | Value struct | domain/value-objects |
| Enum | Owned constant-object protocol | Enum class | Native enum | domain/enums |
| Rule | Boolean arrow function | Boolean function | Boolean function | domain/rules |
| Calculation | Pure calculation arrow function | Function | Function | domain/calculations |
| Policy | Selector arrow function | Selector function | Selector function | domain/policies |
| Query | Read-only arrow function | Read-only function | Read-only function | application/queries |
| Operation | Bound action function | Bound function | Bound function | application/operations |
| Workflow | Bound step orchestrator | Bound step orchestrator | Bound step orchestrator | application/workflows |
| State Machine | Discriminated union/reducer | Enum/transition function | Enum/transition match | domain/state-machines |
| Mapping | Mapping function | Mapping function | Mapping function | application/mappings |
| Event | Readonly record | Frozen record | Struct | domain/events |
| Interface | Structural contract | Protocol | Trait | application/interfaces |

Location does not redefine meaning. An Entity is not a database table; an
Interface is not a universal infrastructure abstraction; a Policy selection does
not execute its target. Stateful/durable providers remain separately bound.

## 5. Product-construction sequence

All PCR units below are planned, not selected or executed. Five decision layers
and their value/cost boundaries are in [implementation-layering.md](implementation-layering.md).
Preparation can overlap, but no layer closes without its prerequisite evidence.

| Unit | Layer | Depends on | Deliverable and acceptance boundary |
| --- | --- | --- | --- |
| PCR-01 | L0 | Existing DSR-001/003/006 evidence | Fresh selected-source matrix: 39 cells; exact profile/protocol/provider/observer/generator paths; missing, stale, admitted and candidate states separate; dirty preimages preserved. |
| PCR-02 | L0 | PCR-01 | Minimal candidate resolution contract for TypeScript Entity + Rule + Query; source-root/output/import decisions for that slice; no unsupported generalization. |
| PCR-03 | L0 | PCR-02 | Expected-red tests expose generated class, bypassed factory validation, wrong source placement, wrong import target and tampered profile. Independent observer rejects them. |
| PCR-04 | L0 | PCR-03 | Direct DomainSpec model -> checked graph -> selected profile -> generated Entity factory, declared Rule and read-only Query -> native compile -> execution. All L0 positives/negatives and deterministic replay pass. |
| PCR-05 | L1 | PCR-04; applicable DSR-009/011 semantics | Closed candidate configuration matrix for all 13 types: required forms, input bounds, source roles, filename/symbol policies, imports, support modules, diagnostics and overrides. Unresolved cases remain explicit blockers. |
| PCR-06 | L1 | PCR-05 | TypeScript generation conforms for all 13 types; data/factory, pure-function and orchestration groups each join their own native and hostile checks. No class-based replacement for the selected factory protocol. |
| PCR-07 | L1 | PCR-05, PCR-06 | One shared artifact/import planner serves instantiate, project build, compiled-snapshot build and supported application build. Stable safe paths, exact leaf imports and collision detection; each entry point produces equivalent semantic selections. |
| PCR-08 | L2 | PCR-07 | Python realization adapters and native package imports implement all 13 selected contracts; factory/dataclass/Enum/Protocol conventions remain native. |
| PCR-09 | L2 | PCR-07 | Rust adapters and crate/module wiring implement all 13 selected contracts; ownership, visibility, Eq/Hash and native enums remain native. |
| PCR-10 | L2 | PCR-08, PCR-09 | All 39 generated cells independently observed, compiled and executed against shared semantic cases plus language-specific controls. No missing cells or hidden skips. |
| PCR-11 | L3 | PCR-10; applicable DSR-009..017 closures | Compound multi-feature commerce model with every metatype, nested fields, declared references and lawful relationship composition; each mapped output/import has exact graph identity. |
| PCR-12 | L3 | PCR-11; DSR-029/030 test obligations | Non-collapse, orthogonality, property/mutation and cross-language outcome corpus; all 17 backend signature rows have applicable positive/negative or explicit existing exclusion evidence. No new DS-D8 verbs inferred. |
| PCR-13 | L4 | PCR-12 | Compatibility contract and opt-in versioned profile/layout selection: preserve old default/archive behavior until separately selected cutover; explain migration diagnostics and source-to-output mapping. |
| PCR-14 | L4 | PCR-13; selected DSR-032 toolchain | Reproducible local package candidate, clean installed execution of the promised corpus, generated user docs, final profile matrix and independent review. Exact product candidate presented for review; no release or admission. |

Each implementation turn must narrow the listed touchpoints to an exact file
allowlist and selected tests before mutation. Dependencies in the parent roadmap
still apply; this subplan does not bypass missing BMC meaning or award whole DSR
completion for a smaller prototype.

### First product slice

Start with a direct-JSON Entity/Rule/Query model, not an Alch example. Use one
explicit declared Rule in the Entity construction pipeline and two lifecycle
snapshots with equal identity but different nonidentity fields. Query frozen
snapshots without mutating them. Exercise valid construction, failed validation
with no returned Entity, inaccessible/bypassing construction, same/different
identity, and valid/no-match queries. Generate twice in separate temporary roots.

The output must use the selected factory protocol, intended source roles and
actual imports. Observe the resulting code independently, compile it with the
selected native toolchain, then execute the emitted artifact. Return profile,
source, generator, output and observation digests without interpreting them as
semantic proof by themselves.

## 6. Existing roadmap crosswalk

| Parent work | Contribution of this plan | What remains separate |
| --- | --- | --- |
| DSR-007 | PCR-04 adds missing profile conformance to a successor vertical. | Historical pass unchanged; Alch comparison deferred. |
| DSR-009/011 | PCR-02/05 make exact field and composition requirements visible. | New field/reference or relationship meaning requires its existing contract work. |
| DSR-018/019 | PCR-05..10 close generation representations and target observation. | No blanket metatype closure before all parent semantic dependencies hold. |
| DSR-012/020/026 | PCR-07/11 integrate snapshot, composition and application generation. | Application runtime behavior outside this selected compiler profile is not certified. |
| DSR-029/030/031 | PCR-10/12 account for 39 cells and semantic distinctions. | Cross-frontend equivalence remains deferred, not passed. |
| DSR-034/035/036/037 | PCR-13/14 provide docs, compatibility and a bounded installable candidate. | Whole-product freeze, admission and publication retain their wider denominators. |

The parent WORK-ITEMS.json remains unchanged by this planning addition. Its
current next unit is still DSR-009. Recommended scheduling amendment for later
selection: PCR-01..04 first, with the necessary bounded DSR-009 work, then expand
without discarding remaining parent dependencies or prior completion evidence.

## 7. Verification contract

No product tests were run to author this plan. Every check below is future work.

| Group | Required positive evidence | Required counterexamples |
| --- | --- | --- |
| Configuration | Exactly 39 resolved unique axes with explicit obligations and versions. | Missing/duplicate type, wrong language, unknown schema, cycle, stale binding, unsupported override, inconsistent profile status. |
| Representation | Independent AST/native observation plus semantic execution for every cell. | Class or public-constructor bypass in selected TS Entity protocol; mutable VO; unbound validator; Rule not Boolean; unexpected enum value; missing transition. |
| Paths and symbols | Versioned roots, native naming, exports, support dependencies and correct native imports. | Traversal, symlink escape, absolute paths, normalized/Unicode/case-fold collisions, duplicate names across features, wrong relative imports, unsafe identifier, unexpected overwrite. |
| Snapshot and provenance | Generation consumes the checked graph; exact configuration and source-currentness checks. | Source changed after snapshot, forged graph, changed profile/provider during build, digest-only impersonation. |
| Non-collapse | Entity identity vs VO value equality; Rule vs Policy; Query vs Operation; step occurrence vs Operation identity; transition trigger vs emitted Event. | Mutations that substitute one meaning for another must be rejected or change the required outcome. |
| Orthogonality | Changing layout changes paths/imports but not domain outcome; language changes native form but not selected semantics; changing nonidentity state preserves Entity identity. | Inadvertent IO from layout change, identity from filename, semantic changes caused by ordering unrelated declarations, hidden Calculation read or Mapping-owned calculation. |
| Composition | Explicit computed-value inputs to Mapping; Policy selects declared targets; Workflow binds child operations; lawful typed graph relationships. | Invented helper Operation, fabricated graph arrow, forbidden direct effect, duplicate step mistaken for duplicate concept, undeclared dependency. |
| Types and parity | Selected scalar/optional/list/set/sum/reference behavior including nesting and explicit numeric bounds. | Null/absence confusion, set ordering treated as list semantics, reference treated as embedding/foreign key, cross-language overflow or error divergence. |
| Reproducibility | Two isolated runs with equal semantic/source outputs where promised; process/tool evidence separate. | Hidden workspace dependency, ambient cwd/path in semantic digest, same renderer acting as its only oracle. |
| Package and compatibility | Exact installed archive runs outside the workspace; public docs match tested commands. | Missing exported files, source/dist drift, old-version behavior silently changed, absent test discovery, skipped native target counted as pass. |

Parameterize observers by bound declarations, not literal Settlement names.
Keep reference-fixture controls intact and prove generalized observers with
independently authored mutants. Count every promised input, language, entry point
and relationship obligation; schema checks and string regeneration are not enough.
Preserve language-specific observations instead of comparing native hash bytes or
assuming equal runtimes. Missing tools produce not-evaluable, never PASS.

## 8. Source/write boundaries and two-lane scheduling

**Product frontier:** known disagreement between selected metatype representation
and generated code, plus incomplete profile/output-layout integration.
**Runnable next after implementation selection:** PCR-01 and the minimum contract
work for PCR-02. Do not wait for unrelated release or historical bookkeeping.

Likely implementation touchpoints: existing CLI catalog/resolution contracts,
generation planning/rendering/output layout, target observers, package/native
module wiring, and focused tests under `impl/cli`; new candidate configuration
and evidence under this reconciliation package. These are estimates, not write
authorization. Existing dirty application/custody/streaming changes belong to
their owners and must not be overwritten or rolled back.

| Operational support | Owner | Stage affected | Blocking rule |
| --- | --- | --- | --- |
| Exact source/dirty preimage capture | Implementing agent | Entry to each affected construction unit | Blocks only when overlapping bytes cannot be preserved or identified. |
| Missing historical RMT/factory receipts | Evidence owner | Selected historical verification | Blocks only an obligation that truly consumes that receipt; never reconstruct historical acceptance. |
| Toolchain availability | Toolchain owner | Native tests, PCR-04/08/09/14 | Use existing pinned launchers and shared toolchains; unavailable lane remains explicit. |
| Concurrent changes in shared compiler files | Existing change owner and implementing agent | Affected generator/integration unit | Reconcile selected preimages before that write; independent contract work can continue. |
| Product review | DomainSpec product owner | After PCR-14 exact tests | No product approval inferred from technical PASS. |
| Canonical admission, default cutover, publication | Respective owners | Separate future effects | Not a prerequisite for bounded candidate construction; never implicitly performed. |

The D65 sequence is preserved: reuse meaning -> candidate profile/business and
system-model scaffolds -> direct DomainSpec fixtures -> compiled graph -> generated
implementation -> exact tested product -> product review -> only later separate
authority decisions. Prototype selection is not ontology/profile admission.

## 9. Open questions and proposed decisions

This is an internal planning document. User-facing docs generated at PCR-14 must
state settled supported behavior and limitations, not expose this decision queue.

| ID | Decision needed | Proposed direction | Needed by |
| --- | --- | --- | --- |
| PCR-D01 | Which exact documents govern profile constraints when historical statuses disagree? | Build a selector-level crosswalk to admitted baseline and owner decisions; retain candidate-only constraints explicitly. | PCR-02 |
| PCR-D02 | How do logical source roles fit accepted application-layout/v1? | Version the new layout contract; preserve v1 behavior; bind logical module roots and physical paths explicitly. Do not adopt the earlier illustrative tree as a decision. | PCR-02 for L0; PCR-05 for full matrix |
| PCR-D03 | How are multiple features, duplicate node names and imports represented? | Separate graph identity from native names; deterministic collision-safe per-module mapping with independently checked imports. | PCR-05/07 |
| PCR-D04 | How is profile selection exposed and overridden? | Explicit versioned build selection, bounded overrides, deterministic inheritance and no silent fallback. Reuse existing CLI contracts where compatible. | PCR-02/05 |
| PCR-D05 | Where are Policy, Mapping, Interface and Workflow source roles located? | Use section 4 as a candidate; resolve against actual dependency direction and selected application layout. | PCR-05 |
| PCR-D06 | How much reference code can become reusable generation machinery? | Classify each mechanism as reusable runtime, parameterizable renderer, fixture-only proof or missing generalization; prove each adaptation. | PCR-03/06/08/09 |
| PCR-D07 | When should existing consumers switch? | Opt-in first; preserve old archived behavior; propose cutover only after exact tested candidate review. AlchLang remains a later consumer task. | PCR-13 |

Scope explicitly deferred: UI metatypes, new SFOL language versions, broad EVF
expansion, live database/broker integrations, production durable-recovery delivery,
Alch syntax/editor/compiler changes, remote publication and repository migration.
Do not use those deferrals to weaken existing semantic guarantees in the selected
39-cell compiler scope.

## 10. Plan-authoring checks

Created only this file and its layering companion. Reviewed links, task IDs,
dependency order, all-13 coverage, claim ceilings and preservation of the three
selected parent planning/evidence files. No product tests or implementation
changes are claimed. The routing registry permits candidate planning but does
not currently permit registering this as an admitted Goals execution state.
