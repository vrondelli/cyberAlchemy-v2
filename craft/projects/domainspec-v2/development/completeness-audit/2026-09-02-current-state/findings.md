# DomainSpec v2 Current-State Completeness Findings

## Result

DomainSpec v2 already has a meaningful compiler and static software-factory vertical. It is not merely a plan, and transactional outbox is only one missing runtime family. The current implementation is nevertheless not end-to-end complete.

The defensible claim ceiling is:

> An owner-admitted project-local `@10` backend formation, generation, and static-conformance baseline with bounded formal and cross-language fixture evidence. It is not yet a universally certified compiler refinement, a provider-backed runtime, a live operational system, or a production release.

## Current denominator

| Surface | Current denominator | State |
|---|---:|---|
| Active backend meta-types | 13 | admitted project-local baseline |
| Frozen language realizations | 39 (13 × TypeScript/Python/Rust) | present and byte-bound, with semantic depth varying by type |
| Active relationship signatures | 31 | compiler-recognized |
| Backend/general signatures | 17 | current backend denominator |
| UI and UI/backend signatures | 14 | active signatures over non-active endpoint types |
| DS-D8 obligation IDs | 45 | catalog/projection coverage; not exhaustive independent witness coverage |
| Current formalization fixture | 10 nodes, 8 edges, 23 applicable witnesses | sampled proof corpus |

Older 4/3, 13/16, baseline `@2`, baseline `@3`, and Node 24 descriptions are not safe current-state denominators without explicit historical qualification.

## Capability matrix

| Requirement family | What exists now | Classification | What remains |
|---|---|---|---|
| Source authority | Axioms, Constitution, Authority Model, source spine, definitions registry | PARTIAL / DRIFTED | Ratify project/feature/node JSON as the current authored source or name its bounded role; reconcile the old minted compiler and current CLI. |
| Backend meta-type formation | Strict project/node parsing and type-specific validation for 13 types | BUILT | Keep source/definition/baseline digests synchronized. |
| Deep meta-type semantics | Stronger paths for Entity, Value Object, Enum, Operation, Workflow, Interface, Event, State Machine | BUILT AT STATIC CEILING | Add provider/runtime evidence where the type claims runtime behavior. |
| Thin meta-type semantics | Query, Calculation, Rule, Policy, Mapping use generic templates | BUILT_PARTIAL | Define and implement authored semantic IR and hostile equivalence tests per type. |
| UI meta-types | Schemas, profile, fixtures, generated tests | CANDIDATE / PARTIAL | Resolve Adapter/State Indicator, admit endpoint types/profile, add frozen rows, CLI generation, and conformance. |
| Authoring CLI | `add operation` | BUILT FOR OPERATION ONLY | Decide whether each other type needs `add`, import, or another governed authoring surface. |
| Compiled graph | Deterministic in-memory normalized graph and source manifest | BUILT_PARTIAL | Emit or bind a durable graph certificate if required; remove parallel schema-owner ambiguity. |
| Relationships | All 31 signatures receive endpoint/scope/duplicate validation; selected relations have deeper checks | STRUCTURALLY BUILT, BEHAVIORALLY PARTIAL | Resolve 14 signatures over non-active UI endpoints; add executed behavioral evidence where promised. |
| DS-D8 obligation projection | 45 IDs mapped to predicates/witness rendering | BUILT_PARTIAL | Generate exhaustive per-signature applicability denominator and positive/hostile witnesses, not only coarse-family coverage. |
| `formalize` CLI | Consumes compiled graph and emits generated Lean plus hashes | BUILT_PARTIAL / CURRENTNESS DRIFT | Add an explicit certificate contract if universally required; execute hostile/source-sensitive suite and Lean in pinned clean CI. |
| TS→Lean refinement | Generated model uses the TS graph and proves internal Boolean facts | NOT PROVED | Define a canonical checked interchange, decode independently in Lean, and prove/execute graph equality including omission mutants. |
| Frozen realization selection | Exact 117 source/provider/binding references | BUILT | Bridge selected provider semantics to generator semantics. |
| Cross-language generation | 13×3 templates and native/static checks | BUILT AT TEMPLATE CEILING | Strengthen thin semantics and run runtime parity where required. |
| Static conformance | Generated target is re-observed and receipt emitted | BUILT, SELF-CONSISTENCY CEILING | Observe an independently implemented non-generated target; eliminate same-generator oracle risk. |
| EVF/BTE | Structural derive/emit accounting and substantial fixtures | PARTIAL | Close behavioral satisfiability, cycle/closure, source-to-independent-consumer receipts, and stale bindings. |
| System-integration contracts D45–D49 | Provider-neutral profile, schemas, compiler, three-language generated contracts | BUILT AT FORMATION CEILING | Select concrete providers and observe runtime guarantees. |
| Transactional outbox | Operation returns state plus outbox intent; atomicity contract exists | CONTRACT ONLY | Real transaction, outbox table/store, relay/publisher, crash seams, unknown-commit reconciliation, dedupe. |
| Durable workflow recovery D36–D44 | Canonical semantics, constraints, in-process evaluators/fixtures | PARTIAL / RUNTIME ABSENT | Durable repository, CAS/fencing, leases, retry schedule, quarantine, terminal recording, restart/replay. |
| Operational resilience | Offline contracts, validators, synthetic campaigns | TEST_ONLY FOR PRODUCTION | Live telemetry/workload/fault/canary/deployment/rollback adapters and admitted environment/profile. |
| Formal release provider | Candidate TLA/TLC work pack | DECLARED_ONLY | Select/execute provider with pinned toolchain, corpus, reproduction, and tamper evidence. |
| Production release | Accepted scope and FPR roadmap | NOT READY / UNAUTHORIZED | Refresh roadmap, execute clean candidate and Body War pilot, security/state/rollback/support gates, immutable release record, separate authorization. |

## Load-bearing defects

### 1. There is no single current requirements manifest

Requirements are distributed across canonical definitions, accepted decisions, implementation baselines, work packs, research findings, Craft, roadmaps, tests, and generated receipts. Several disagree. A completeness claim cannot be computed reliably until one current manifest identifies every requirement, its authority class, denominator, implementation binding, evidence predicate, and supersession state.

### 2. Baseline validation and live bytes disagree

The selected current-implementation validator passed 131 checks, while full baseline v10 validation reported `main.ts` drift and an independent inventory found 25/847 drifting files. Formalization exact-byte validation also blocked on four bindings. This means manifest-pointer validation is insufficient as a whole-baseline currentness claim.

### 3. Five backend generators are semantic placeholders

Query, Calculation, Rule, Policy, and Mapping compile and generate, but their generic implementations are not a faithful executable projection of authored meaning. They should not be counted as semantically complete merely because all three languages compile or match templates.

### 4. DS-D8 breadth is not exhaustive proof

Mapping all 45 obligation IDs is necessary but not sufficient. The fixture instantiates only eight relationship verbs. The missing closure is a generated matrix over all 31 active signatures with exact applicability plus at least one positive and one exact-cause hostile witness per applicable obligation.

### 5. Formalization proves the generated model, not compiler refinement

The TS compiler and TS Lean projector can share an omission bug. Without an independently decoded canonical input and correspondence theorem/test, Lean success establishes internal properties of the projection, not that the production compiled graph was preserved.

### 6. Static conformance has a same-generator oracle

The CLI selects frozen realization rows, but generates output with a separate template registry and observes it by regenerating expected output with that same registry. This establishes deterministic self-consistency and provenance, not equivalence to the frozen provider implementation.

### 7. Runtime requirements are contracts without providers

D36–D49 are valuable semantic and integration contracts. They do not yet supply concrete durable workflow storage, transactional state/outbox, publisher/relay, retry/lease/quarantine mechanisms, or live observations. Outbox is one row in this broader provider-runtime gap.

## Dependency-ordered build remainder

1. **Freeze the authoritative requirement graph.** Reconcile source authority, `@10`, 13/17/31/45 denominators, Node version, UI endpoint status, superseded compilers, Craft, roadmap, and accepted decisions.
2. **Restore a clean reproducible baseline.** Resolve 25/847 drift, formalization exact-byte drift, workspace-dependent test discovery, and pinned toolchain execution.
3. **Deepen the five thin backend semantics.** Introduce authored semantic IR for Query, Calculation, Rule, Policy, and Mapping; generate faithful implementations and hostile tests in all three languages.
4. **Close DS-D8 exhaustively.** Generate all-signature applicability and positive/hostile witness coverage, including UI rows only after their endpoint types are admitted.
5. **Prove compiler/projection correspondence.** Define the canonical checked graph interchange, independent Lean decoding, graph equality/refinement, omission mutants, and clean Lean CI.
6. **Make certificates explicit.** Decide which successful commands must emit certificates; define schemas and enforce non-suppressible emission rather than treating hashes as certificates implicitly.
7. **Eliminate duplicate semantic ownership.** Bind frozen provider implementations to generator output, or make the generator the explicit selected realization with equivalent authority/evidence.
8. **Adopt one independent conformance target.** Register one provider and observe a non-generated implementation with semantic mutants.
9. **Implement the complete provider-runtime vertical.** Selected database and broker; atomic state/outbox; relay/publisher; unknown commit; idempotency; leases/fencing; retries; quarantine; restart recovery; independent fault tests.
10. **Add live operational adapters.** Telemetry, workload, fault, canary, deployment, rollback, freshness, and environment admission.
11. **Finish the release path.** Refresh FPR truth, run the formal provider if retained, execute the clean Body War pilot, close security/state/support/rollback gates, record an immutable candidate, and obtain separate release authorization.

## Verdict

| Target | Verdict |
|---|---|
| DomainSpec v2 static compiler/generator baseline | KEEP, with bounded claim |
| “All requirements are implemented” claim | FIX — contradicted |
| “Formalize proves the TS compiler refines Lean” claim | FIX — not established |
| “All DS-D8 families are universally certified” claim | FIX — fixture-bounded |
| “Transactional outbox runtime is complete” claim | FIX — contract only |
| “Runtime/operational/production ready” claim | FIX — provider and release evidence absent |

Final approval: parent accepts this change-request and build-remainder list as the resolved output of the read-only audit. Acceptance applies to the audit result only; it grants no implementation, requirement promotion, conformance acceptance, publication, release, or deployment authority.

