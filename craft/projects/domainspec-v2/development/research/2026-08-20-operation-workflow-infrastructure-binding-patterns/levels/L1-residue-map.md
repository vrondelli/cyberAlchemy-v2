# L1 — Property, Obligation, and Binding Residue Map

## Status vocabulary

| Label | Meaning |
| --- | --- |
| `current-source` | Present in a cited current local artifact, retaining that artifact's lifecycle and authority limits |
| `candidate-property` | Plausibly subject-portable but requires semantic/property owner review before admission |
| `typescript-profile` | Proposed project/language convention; never portable by syntax alone |
| `evidence-obligation` | Required observation to support a bounded claim; evidence does not create authority |
| `advisory` | Review guidance or experiment prompt, not a pass/fail semantic rule |
| `block` | Rejected as a universal rule or as a collapsing architecture |
| `open-residue` | Requires an owner decision, schema work, or empirical evidence |

## Operation property map

| Concern | Proposed obligation | Status | Enforcement/evidence boundary |
| --- | --- | --- | --- |
| Semantic identity | The subject binds an exact Operation identity declaring `state_change=yes`. | `current-source` | Formation and exact ImplementationBinding; body inspection does not create Operation identity. |
| Query boundary | A Query remains read-only; an Operation may query while producing its state change. | `current-source` for declared discriminator/edges; runtime behavior separate | Static declaration plus exact effect observation. Do not impose a universal database-free Operation rule. |
| Rule relationship | A Rule enforcing an Operation is bound in the canonical relationship direction. | `current-source` relationship; ordering is `open-residue` | Direct binding can be statically observed. Rule-before-guarded-mutation needs owner clarification and runtime/order fixtures; the August research calling it portable is not accepted. |
| Single responsibility | One Operation factory coordinates one named domain outcome/state-changing action. | `typescript-profile` | Review declared outcome, mutation targets, and effect trace. File length, dependency count, and cyclomatic complexity do not prove responsibility. |
| Separation of concerns | Acquisition, decision, guarded mutation, and effect publication are distinguishable in value/effect flow. | `typescript-profile` | Call/effect ordering and import graph; no required file or helper count. |
| Dependency inversion | Operation imports domain values/rules and dependency-specific contracts, not concrete ORM/database/broker/client/crypto/config/telemetry providers. | `typescript-profile` | Resolved import/call graph with `unsupported` for dynamic cases; composition-root observation. |
| Injection mechanism | A factory/HOF receives the dependencies and returns the Operation callable. | `typescript-profile` | Exact source/callable binding. No container, decorators, or service locator. |
| Persistence | Database or ORM access is exposed through a concern-specific `*Repository`. | `typescript-profile` | Contract/adapter/source binding plus `PersistenceBinding` when persistence realization is claimed. Repository shape alone proves no transaction or query budget. |
| Atomic local change | When atomicity is declared, a non-optional `*UnitOfWork` owns the exact local change set. | `typescript-profile` plus integration candidate | Requires `TransactionGuaranteeBinding`, typed failure outcome, and commit/rollback observations for the selected adapter. |
| In-process event | An in-process `*EventHandler` is a callable notification seam. | `typescript-profile` | Invocation trace only. No transport/delivery claim. |
| Durable publication | An Operation persists an outbox intent inside its local UnitOfWork; a separate dispatcher uses a `*Transporter`. | `candidate-property`/integration design | Local commit, outbox state, publication, broker acceptance, and application commit remain separately observed. |
| External API | A bounded `<System>Client` owns request/response behavior; concrete SDK details stay in an adapter. | `typescript-profile` | `TransportBinding` request-response mode plus failure outcome/runtime observations when the external guarantee is claimed. |
| Time, identity, security | `Clock`, `*Generator`, `*Hasher`, and `*Codec` use their cohesive callable/object forms. | `typescript-profile` | APE ImplementationBinding may be enough; create no system-integration record unless an external guarantee needs one. |
| Telemetry | Instrument outside the Operation or inject a narrow recorder/observer. | `typescript-profile` | Telemetry is evidence only. Poker Team's direct concrete telemetry imports are counterexamples. |
| Traversal/cost | Cardinality-dependent external calls require a declared budget before becoming a correctness gate. | `advisory`/`open-residue` | N+1 and query-in-loop remain profile warnings plus runtime counters without an admitted budget. |
| Loop form | Preserve result, ordering, error, effect, consumption, termination, cleanup, and declared cost across transformations. | `evidence-obligation` | Never require `reduce` or one pass universally. |

## Workflow property map

| Concern | Proposed obligation | Status | Enforcement/evidence boundary |
| --- | --- | --- | --- |
| Semantic identity | A Workflow declares `scope` as `intra-feature` or `cross-feature` and coordinates multiple ordered Operations. | `current-source` with candidate lifecycle | Current machine criterion checks scope shape; it does not prove operation reachability or execution. |
| Step bindings | Every declared step resolves to an exact Operation or nested Workflow and the ordered step set matches the declaration. | `candidate-property` from W4 | Static graph plus runtime trace; W4 remains candidate-local. |
| Single responsibility | One Workflow owns one named orchestration outcome, not the business rules of its steps. | `typescript-profile` | Review step/outcome graph and duplicate-rule evidence; complexity metrics are only proxies. |
| Separation of concerns | Workflow selects the next declared step and routes typed outcomes; Operations own state-changing domain decisions. | `typescript-profile` | Import/call graph plus hostile fixture where the Workflow duplicates a Rule or mutates an entity directly. |
| Dependency inversion | Workflow receives named Operation/Workflow callables and workflow-specific runtime capabilities; it does not resolve providers. | `typescript-profile` | HOF factory and composition-root binding. No service locator or generic `Port`. |
| Failure routing | Each step has an explicit stop, continue, retry, compensate, or typed terminal route. | `candidate-property` | W4 currently covers stop/continue/compensate; retry and unknown outcome require integration/runtime bindings. |
| Compensation | A compensation references a named Operation/Workflow, executes in declared reverse/graph order, and produces its own typed outcome. | `candidate-property` | Runtime trace and residue checks. Compensation is not rollback and may itself fail. |
| Continuation | Synchronous return, awaited completion, or background handoff closes through a declared boundary. | `candidate-property` from W4 | Runtime observation; static return shape is insufficient. |
| Transaction boundary | Each state-changing Operation owns its local transaction obligation; the Workflow never inherits one transaction over all steps. | `candidate-property`/integration design | Per-step transaction receipts and explicit cross-step residue; no distributed atomicity inference. |
| Durable progress | A durable Workflow uses a `WorkflowStore`/`CheckpointStore` or runtime-owned history with execution identity and resumable progress. | `open-residue` | Current Revision 2 PersistenceBinding does not yet explicitly own Workflow execution state. |
| Scheduling/time | Delayed continuation uses a `Scheduler`/runtime Timer; replayable Workflows use replay-safe runtime time rather than wall-clock branching. | `typescript-profile` split by workflow mode | Synchronous profile may use injected `Clock`; durable profile requires history/replay evidence. |
| Messaging | External message steps use a `Transporter`; a runtime task queue and a domain Event transport are not automatically the same binding. | `typescript-profile` plus deferred integration design | `TransportBinding` and delivery observations when external messaging is claimed. |
| Retry/idempotency | Retry consumes a typed failure outcome and preserves stable workflow/step/command identity. | `candidate-property` | FailureOutcomeBinding, persistence/transport uniqueness evidence, attempt trace, and final outcome. |
| Version/replay | A durable runtime profile declares compatible workflow-version and deterministic replay behavior. | `typescript-profile`/`open-residue` | Temporal is one provider precedent only; do not promote its command model as universal Workflow meaning. |
| Loop form | Explicit sequential loops are valid for awaited steps, early failure, and reverse compensation. | `typescript-profile` | W4's provider is a direct counterexample to universal `reduce`; assert trace/outcome, not syntax. |

## Dependency form to infrastructure-binding map

| Subject need | Code contract supplied to subject | APE observation/property | Concern-specific infrastructure record | Runtime/provider evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Operation reads or writes stored domain state | `<Concern>Repository` | exact contract import, HOF parameter, adapter/composition binding; no concrete ORM import | `PersistenceBinding` | selected repository adapter calls, logical/physical mapping, result/effect trace | persistence record is Revision 2 candidate |
| Operation commits one atomic local change set | `<Concern>UnitOfWork` with transaction-scoped repositories | non-optional dependency when atomicity is declared; participants resolved | `TransactionGuaranteeBinding` + `FailureOutcomeBinding` | commit/rollback, partial-commit hostile, conflicts, exact participant trace | Revision 2 candidate |
| Operation records durable outgoing intent | `OutboxRepository` or specific repository method inside UnitOfWork | outbox write occurs inside declared transaction | `PersistenceBinding` + `TransactionGuaranteeBinding` | business rows and outbox row share local transaction; unpublished state observable | transport still absent at this stage |
| Dispatcher sends external message | `<ChannelOrConcern>Transporter` | exact adapter binding outside domain Operation; Event/envelope mapping resolved | deferred `TransportBinding` + `DeliveryGuaranteeBinding` | publish attempt, provider acceptance, retry/redelivery, application commit | deferred by Revision 2 |
| Operation notifies same-process collaborator | `<Concern>EventHandler` callable | handler invocation bound and observed | none by default | call order/error trace only | TypeScript profile candidate |
| Operation invokes remote request/response system | `<System>Client` | client contract and concrete adapter separated | deferred `TransportBinding` + `FailureOutcomeBinding` | request identity, timeout/unknown outcome, retry eligibility, response mapping | transport deferred |
| Operation reads time or creates IDs/secrets/tokens | `Clock`, `*Generator`, `*Hasher`, `*Codec` | exact implementation binding and deterministic fixture where needed | none by default | direct fake/provider fixture; security/runtime evidence remains provider-scoped | TypeScript profile candidate |
| Operation records metrics | outer instrumentation or `<Concern>MetricsRecorder` | observer/instrument binding | evidence/observability profile, not business integration guarantee | correlation and emitted measurements | never proof of correctness |
| Workflow invokes a step | named Operation or nested Workflow callable | `orchestrates`/step binding and trace | none directly; each Operation retains its own integration bindings | ordered invocation, typed result, terminal route | candidate Workflow realization |
| Workflow stores durable progress | `WorkflowStore`/`CheckpointStore` | execution identity, checkpoint/history binding | likely `PersistenceBinding` extension or a distinct workflow-runtime concern | crash/restart, replay, duplicate resume, version compatibility | `open-residue` |
| Workflow delays/resumes | `Scheduler`/runtime Timer | schedule/cancel/wake binding and continuation observation | no accepted record; possible workflow-runtime binding | durable timer/history and restart observations | `open-residue` |
| Workflow sends/receives external messages | specific `Transporter` or named message-step Operation | transport dependency bound without SDK import | deferred `TransportBinding` + `DeliveryGuaranteeBinding` | publish/receive/ack/application-commit boundaries | deferred |
| Workflow compensates | named compensation Operation/Workflow callable | compensation graph/order/outcome | underlying Operation bindings only; no magical compensation adapter | forward failure, compensation attempts, final residue | candidate Workflow property |
| Workflow retries | runtime retry/scheduler capability consuming typed outcome | retry policy and stable invocation identity | `FailureOutcomeBinding`; possibly delivery/persistence bindings | attempt timeline, deduplication, unknown-outcome probe, terminal result | partly absent/deferred |

## Placement rules for the proposed TypeScript profile

```text
domain/application contract
  Repository | UnitOfWork | Transporter | EventHandler | named client/capability
         ^
         | imported by
Operation or Workflow factory -- receives contract values through HOF parameters
         ^
         | supplied by
composition root -- constructs concrete adapters and immutable configuration
         |
infrastructure adapter -- imports ORM/DB/broker/SDK/runtime provider
         |
APE ImplementationBinding + concern-specific infrastructure record + observations
```

- Pure domain rules and value functions may be imported directly; injecting
  every pure function would add indirection without inversion value.
- Dependency contracts are consumer-facing and concern-specific. Suffixes are
  TypeScript-profile naming, not portable DomainSpec truth.
- Concrete providers, environment reads, and adapter configuration belong at
  composition. An immutable primitive configuration value may be supplied
  directly; executable subjects must not reach a global config/service locator.
- Infrastructure bindings describe selected realization and guarantees. They
  do not appear as code dependencies passed into business functions.
- An evaluator reads bindings and observations; an Operation or Workflow does
  not call its evaluator.

## Adversarial counterexamples

| Counterexample | Required disposition |
| --- | --- |
| `Port<T>` or `DependencyPort` wraps every dependency. | `block`: erases responsibility, guarantee, and evidence distinctions. |
| Decorator/container registration is required to construct Operations. | `block` for this TypeScript profile: HOF composition is sufficient. |
| Operation imports Drizzle, database singleton, queue SDK, token library, environment reader, or concrete telemetry instruments. | profile finding or unsupported if resolution is dynamic. |
| Workflow directly updates business repositories instead of invoking the owning Operation. | profile finding unless the WorkflowStore/CheckpointStore is explicitly workflow-owned. |
| Workflow reimplements an eligibility/transition Rule already owned by an Operation. | profile finding plus divergent-rule hostile fixture. |
| Atomicity is declared while UnitOfWork is optional or a fallback bypasses it. | integration/profile failure for the selected contract. |
| Database commit and broker publish are called one atomic transaction without a proven shared boundary. | `block`: use outbox plus separate delivery evidence. |
| A database-backed method named `publish` is treated as broker delivery. | `block`: classify as outbox/handoff persistence until a Transporter/provider trace exists. |
| EventHandler invocation is treated as external delivery. | `block`: in-process call only. |
| Repository abstraction is treated as proof against N+1. | `block`: observe cardinality-dependent calls separately. |
| `reduce` is mandated for workflow steps or compensation. | `block`: awaited order, failure, and reverse compensation often need explicit loops. |
| Workflow branches on wall time/randomness while a replayable runtime profile is selected. | durable-profile failure; ordinary synchronous profile may use injected capabilities. |
| Compensation is described as rollback or guaranteed restoration. | `block`: it is a new state-changing action with its own failure outcome. |
| Metrics/traces are treated as proof of delivery or business correctness. | `block`: observation is not correctness. |

## Conflicts and dispositions

| Existing wording/evidence | Conflict | Disposition |
| --- | --- | --- |
| Older integration research says a repository port merges into a DomainSpec `Interface`. | User-selected profile rejects a generic `Port`, and not every repository is a DomainSpec boundary Interface. | `block` the code-level port terminology. Preserve DomainSpec `Interface` only for an actual logical interface/exposes relation. Let a specific Repository contract map through PersistenceBinding; whether `interface_ref` remains required is `open-residue`. |
| Poker Team `PlayerIntakeHandoffGateway.publishApprovedCandidate` is backed by a Drizzle insert. | Name suggests transport; implementation proves persistence only. | Treat current code as handoff/outbox repository precedent. Reserve `Transporter` for an actual queue/broker adapter. No code rename is authorized here. |
| W4 TypeScript uses generic `WorkflowStep.run` callbacks. | Generic callback could be mistaken for the final dependency taxonomy. | Keep as an exact-fixture execution form only. Production profile binds each step to a named Operation/Workflow identity. |
| Temporal moves external effects to Activities. | Temptation to make `Activity` universal DomainSpec vocabulary. | `analogy-only`: a durable provider may realize steps as activities; DomainSpec remains Operation/Workflow plus profile/runtime bindings. |
| Saga guidance uses local transactions and compensations. | Temptation to make every Workflow a saga. | `borrow-carefully`: only Workflows declaring cross-boundary failure/compensation use those obligations. |
| Operation-internal findings label PO-02 as current portable. | Terminal audit rejected acceptance; July source labels direct leaf/use ordering as proposed profile work. | Do not promote from this tower. Route exact Rule-gate semantic status to the authority owner before a Work Pack treats it as portable. |

## Residue summary

The architecture can be planned now, but six decisions remain load-bearing:

1. exact authority/status of Rule-before-guarded-mutation;
2. whether persistence bindings may reference Operation/Query/Entity roles
   directly or must also reference DomainSpec Interface;
3. whether Workflow execution history/checkpoints extend PersistenceBinding or
   require a distinct Workflow runtime binding;
4. synchronous versus durable Workflow profile split and applicability rules;
5. transport/delivery schema completion after the persistence-first slice;
6. exact TypeScript profile owner and severity/suppression policy.
