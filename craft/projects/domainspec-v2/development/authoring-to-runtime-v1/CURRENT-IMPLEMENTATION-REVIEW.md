---
title: AlchLang to DomainSpec Authoring-to-Runtime Current Implementation Review
status: planning-evidence
updatedAt: 2026-09-17
owner: AlchLang and DomainSpec product construction
authority_effect: none
---

# Current implementation review

## Current remaining-work review — revision 3, 2026-09-17

The bounded L0 operation works; the complete application authoring path does
not yet exist. This review supersedes the scheduling and unresolved-finding
labels in the historical sections below. No implementation code was changed.

| Current finding | Inspected source | Owning work |
| --- | --- | --- |
| Typed source, exact formal/domain joins and a native TypeScript operation exist. | Alch `application-source.ts`, `application-domain-lowering.ts`, `application-executable.ts`; current executable test passes. | Preserve B00–L0X; do not rebuild the backend. |
| Event is parsed but lowering rejects; Mapping and Query are absent from the target declaration union. The documented persistence example references FindOrder. | Alch `application-source.ts`, `application-domain-lowering.ts`; guide persistence example. | I00 now includes the bounded Query; I02 depends on I00. |
| Target integration/runtime-profile authoring is not part of the closed declaration model. | Alch target normalizer; DomainSpec integration types and graph builder. | I01–I06, using existing contracts rather than new meta-types. |
| Executable API requires explicit companion metadata, interpretation and action-selection objects. It is exported but not used by the target CLI. | Alch `application-executable.ts`, `index.ts`, `cli.ts`. | I07 must supply a complete authoring flow, not merely expose more backend JSON. |
| Runtime Rule projection is deliberately ground-only: no functions, quantifiers, non-unary predicates or record equality. Parser breadth is greater than runtime breadth. | Alch `application-rule-projection.ts`. | C03/E02 must account for executable versus verification support; unsupported meaning must never be narrowed silently. |
| Full target roles, sum payloads, consumers and modules are not closed. Seven syntax obligations explicitly remain deferred. | Alch declaration/type unions and syntax-contract tests. | C01–C06. |
| Evidence profiles, installed consumers and exact product handoff are not proved by the operation test. | DAG obligations and scoped L0 evidence. | E01–L4X remain pending; O01 only joins P02. |

### Fresh verification in this review

- Executable, source and syntax-contract selection: **8/8 pass, zero skips**.
  This reruns native generated TypeScript outcomes, guard-bypass mutation,
  exact-byte rejection and fresh-process repeatability through the existing test.
- Alch typecheck: **pass**.
- DAG validation is rerun after the planning edits; see `PLAN-REVIEW.md`.
- Previous 46/46 Alch and 4/4 DomainSpec results remain dated L0 evidence;
  neither entire selection was rerun for this review.
- No whole-application, three-language integration, installed consumer or
  external provider readiness is claimed.

### Construction frontier

8 of 37 nodes have bounded completion evidence; 29 remain, including one
operational-support node. Counts are not an effort estimate. I00/I01/I05 are
runnable now. The shortest next user-visible milestone is L1, a source-authored
TypeScript application with persistence, messaging, APIs and explicit providers.

No product decision is changed here. A missing canonical binding or required
interpretation is a specific design/implementation gap; never invent an edge,
default provider, validator or business rule to make a sample pass.

## Historical delta review — earlier 2026-09-17

Subsequent implementation update: S04 trace/metadata gaps and S05 compatibility
have been closed with 38/38 focused tests and passing typecheck. The findings
below record the pre-fix review; current completion is in `EXECUTION-STATUS.md`.
Subsequent S06/L0X closure is now recorded in `L0-COMPLETION.md`: 46/46 Alch
tests, 4/4 DomainSpec binding tests, native operation evidence and repeatability.
L1 and later layers remain outstanding; the original findings below are dated
review evidence, not the current execution ledger.

This section supersedes the older statuses below for `application-v1`.
The September 16 baseline is retained as historical evidence, not a claim
that all its checks were rerun today.

**Outcome:** semantic parsing and the domain/formal source join exist. The new
target path is not yet an executable whole-application compiler. Reuse the
existing DomainSpec backend and finish the authoring-to-runtime bridge.

Implementation references below are relative to
`/home/vrondelli/projects/cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation`.

| Priority | Finding and source evidence | Remaining obligation |
| --- | --- | --- |
| High | `src/application-domain-lowering.ts` emits a Rule predicate marker and separate operation shapes marked non-executable. The graph join test does not generate or execute the operation. | S06: explicit predicate interpretation and operation realization through current typed executable contracts; never execute the marker as truth. |
| High | That lowerer hashes `project_files`, but lacks an inventory hashing all returned `files`, including condition bindings and operation shapes. | S04: total artifact trace and mutation checks for every companion. |
| High | `src/application-source.ts` parses enum variant `meaning`; the lowerer emits only name, payload and ontology variant. | S04: preserve authored variant meaning in an owned output/trace or explicitly reject it; raw source hashes alone are insufficient. |
| High | Target Mapping declarations are unsupported and Event lowering explicitly rejects, but L1 needs both before C02 full breadth. | I00: bounded Event, Mapping, request/response and operation-effect prerequisites; I03/I04 now depend on it. |
| High | `src/cli.ts` has a separate `bound-application-v1` branch but no call to `lowerApplicationDomain`. The new API is exported and tested, not connected to a user build flow. | I07: wire target parsing, bounded companion loading, lowering, graph joins, build and verify through public CLI/API. |
| Medium | Target types support String/Bool/UInt64, declared data, identity references and optional/list/set, not sum payload authoring or every domain role. | C02: full target-profile coverage. Legacy thirteen-type tests do not prove target completeness. |
| Medium | Explicit target parsing rejects inline legacy logic; the full compatibility matrix and diagnostics remain absent. | S05: retain historical CLI behavior and prohibit silent target fallback or default migration. |
| Medium | Tests cover identity, schema, sorts and mutations, not generated Rule outcomes or provider-backed execution. | S06: semantic execution evidence; E05: cross-layer evidence join. |

### Verified now

- Alch: six selected suites **29/29 pass, no skips**; typecheck passes.
  Includes real DomainSpec compilation of the Entity/Rule/Operation fixture
  and its exact cross-partition claim join.
- DomainSpec: condition-binding suite **4/4 pass, no skips**.
- FormalClaim schema checks use synthetic accepted fixtures; they do not
  establish real business approval.
- Native application execution, whole-application/provider suites, installed
  flows, three-language parity and container qualification were not rerun.

### Current frontier

S04 trace/preservation closure → S05 compatibility → S06 executable realization.
No new product decision is required to start. O01 remains operational support,
owned by the implementation agent, affecting P02 only; reproduce its historical
failure before repairing it. Publication, deployment and remote effects remain
outside this plan.

The ledger records B00–S03 complete within their declared scope, S04 partial,
and later exit evidence pending. Node counts are not effort percentages.

## Historical baseline — 2026-09-16

This review compares the live AlchLang and DomainSpec implementations with the
user-facing target described in
[`AUTHORING-TO-RUNTIME.md`](../../AUTHORING-TO-RUNTIME.md). It identifies the
remaining product construction without treating historical receipts, passing
tests, or this review as product approval or implementation authority.

## Executive finding

The lower half of the product already exists as a substantial candidate:
DomainSpec compiles all thirteen backend meta-types, composes a typed
application/integration graph, accepts explicit provider selections, and emits
TypeScript, Python, and Rust applications. AlchLang also has a real parser,
DomainSpec lowering, modules, multi-entry Node services, and several executable
profiles.

The missing product is the **one coherent authoring path** promised by the new
guide. FormalClaim-bound rules, graph-native integration declarations, generic
runtime/provider profiles, and verification profiles are not one implemented
language/compiler path. They currently exist as target documentation, separate
JSON contracts, compatibility syntax, or profile-specific prototypes.

Therefore the next frontier is not another backend generator. It is semantic
reconciliation and deterministic lowering from one `.alch` application into
the already-working DomainSpec application, integration, provider, runtime, and
formalization contracts.

## Evidence checked

- [`AUTHORING-TO-RUNTIME.md`](../../AUTHORING-TO-RUNTIME.md)
- [`impl/cli/WHOLE-APPLICATION.md`](../../impl/cli/WHOLE-APPLICATION.md)
- [`whole-application-compilation/v1`](../whole-application-compilation/v1/)
- [`reconciliation-v1/profile-compiler-reconciliation/STATUS.md`](../reconciliation-v1/profile-compiler-reconciliation/STATUS.md)
- [`formalization/docs/FORMALCLAIM-AND-PROFILES.md`](../../formalization/docs/FORMALCLAIM-AND-PROFILES.md)
- AlchLang `general-compiler-v1/implementation` parser, model, lowering, CLI,
  documentation, and focused tests in the sibling `cyberAlchemy-v2` checkout.

## Current capability matrix

| Surface | Current implementation evidence | State | Remaining construction |
| --- | --- | --- | --- |
| AlchLang core | Parser, normalized model, compiler, writer, CLI, modules, profiles, local runtimes | Implemented candidate | Consolidate profile forks behind one product grammar and lowering path. |
| Domain meta-types | Entity, Value Object, Enum, Operation, Query, Calculation, Rule, Policy, Workflow, Interface, Event, Mapping, State Machine | Implemented candidate | Preserve all thirteen; do not create another backend model. |
| AlchLang to DomainSpec lowering | Deterministic lowering and trace evidence for selected profiles | Implemented but bounded | Extend the existing lowering rather than add a second parser/compiler. |
| Formal conditions | Base parser and evaluator use bounded inline `sfol-v1` formulas | Compatibility only | Implement FormalClaim identity/signature/proposition and Rule references. |
| FormalClaim | v4 candidate definitions and schemas; current TDE intake remains v2 | Contract candidate | Implement the exact v4-to-v2 compatibility projection and authoring bridge. |
| Rule–FormalClaim edge | Not in the active relationship authority | Absent | Add a typed cross-partition binding without turning FormalClaim into a backend meta-type. |
| Integration model | Validated persistence, messaging, external API, observation, and application-graph JSON | Implemented candidate | Add concise AlchLang authoring that lowers exactly to these contracts. |
| Canonical integration edges | `reads-payload-from`, `produces-message-contract`, `invokes`, `accepts-request`, `publishes-event` | Implemented candidate | Preserve and expose them through AlchLang arrows; add no convenient synonyms. |
| Provider selection | Explicit, language-specific JSON provider selections | Implemented candidate | Add generic runtime-profile authoring that emits the current selections. |
| Provider generation | PostgreSQL, NATS, inbound/outbound HTTP for TypeScript, Python, Rust | Implemented candidate | Preserve explicit selection and keep provider code outside domain meaning. |
| Whole-application CLI | Build, verify, provider application, exact currentness, atomic publication | Implemented candidate | Consume AlchLang-lowered inputs as one public workflow. |
| Runtime proof | Bounded TypeScript reference runtime; installed startup scenarios for all three languages | Partial candidate | Join current runtime observations to the new source/trace chain without broadening claims. |
| Multi-entry authoring | `service-v1` assembles existing functions into a Node HTTP dispatcher | Implemented bounded profile | Generalize entry-point composition for the coherent application path and retain explicit selection. |
| Verification profile | Formal profile registry and provider contracts exist | Not implemented as AlchLang surface | Add authoring, lowering, projection selection, and typed evidence joins. |
| EVF join | Candidate contracts and ownership boundaries exist | Contract candidate | Implement exact evidence binding and typed non-pass outcomes. |
| Package candidate | R18 and the earlier whole-application L4 handoff produced exact historical candidates | Historical; stale | Freeze a successor only after the new authoring path is complete. |
| D65 binding | No DomainSpec/AlchLang authoring-to-runtime ConstructionBinding is registered | Absent | Prepare one exact candidate binding after product tests; approval remains owner-owned. |

## Validation results from this review

| Check | Result | Interpretation |
| --- | --- | --- |
| DomainSpec strict typecheck and materializer checks | PASS | Current source is internally type-correct and generated authorities are current. |
| DomainSpec focused whole-application suite on pinned host tools | PASS, 52/52 | The live application/integration/provider path works under the declared host toolchain. |
| Same suite through the container wrapper | FAIL, 49/52 | The wrapper cannot resolve its mounted TypeScript binary and Cargo result. This is a harness/tool-resolution defect, not evidence of a product semantic failure. |
| AlchLang strict typecheck | PASS | Current implementation compiles. |
| AlchLang focused parser/backend/lowering/reconciliation/module suite | PASS, 26/26 | The reusable front end, thirteen-type lowering, DomainSpec bridge, and module path are viable predecessors. |
| Whole-application DAG structural validator | PASS, 53 nodes | The historical plan remains a valid DAG. |
| Whole-application exact candidate validator | FAIL currentness | Bound source inventory expected 498 files but current regeneration has 486, with multiple changed contracts, sources, and examples. Historical L4 cannot represent the live candidate. |

## Product-construction frontier

The current frontier is **authoring contract reconciliation**:

1. freeze the target FormalClaim, Rule, integration-arrow, runtime-profile, and
   verification-profile meanings;
2. extend the existing AlchLang normalized model and parser;
3. lower those declarations into the existing DomainSpec and formalization
   contracts; and
4. prove one `.alch` source can produce the existing coherent application plan.

This work is runnable now. It is not blocked by package publication, release,
deployment, the stale historical candidate, or the container wrapper defect.

## Product construction versus operational support

| Lane | Work | Affected stage | Blocking posture |
| --- | --- | --- | --- |
| Product construction | FormalClaim-bound target model and lowering | L0 | Current frontier; runnable. |
| Product construction | Integration and runtime-profile authoring | L1 | Depends on L0 semantic identity. |
| Product construction | Full breadth, multi-entry, three-language parity | L2 | Depends on the L1 vertical. |
| Product construction | Verification profile, EVF join, runtime observations | L3 | Depends on stable authored identities. |
| Product construction | Installed successor candidate and D65 binding candidate | L4 | Depends on current product tests. |
| Operational support | Repair container tool-path visibility | L4 installed qualification | Does not block L0–L3 product work; exact prerequisite for container-qualified L4 only. |
| Operational support | Optimize package size and test duration | none | Deferred; no current construction stage depends on it. |
| Operational support | Commit, publish, release, deploy | none | Separately authorized effects after product approval; outside this plan. |

## Non-collapse requirements

- FormalClaim is not Rule, proof, provider projection, or runtime result.
- Rule owns the application role; it does not own a second proposition.
- Policy selects a declared target and does not execute it.
- Event is not Message; domain emission is not transport publication.
- Operation is not Workflow; one atomic capability is not orchestration.
- Integration requirement is not provider selection.
- Provider acceptance is not delivery, application commit, consumer completion,
  or business completion.
- Runtime evidence is not product approval, admission, release, deployment, or
  production readiness.

## Claim ceiling

This review reports current local evidence and gaps. It does not accept a
language design, authorize implementation, refresh historical evidence, approve
a product, admit an ontology/profile, or authorize publication or operation.
