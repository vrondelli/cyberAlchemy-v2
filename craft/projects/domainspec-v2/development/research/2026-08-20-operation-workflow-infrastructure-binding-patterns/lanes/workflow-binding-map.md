# Operation, Workflow, and infrastructure-binding map

Checked: 2026-08-20

Status: bounded local research lane; paper-only

Authority effect: none

## 1. Research question and reading labels

How should DomainSpec-v2 implementation properties and obligations apply
separately to `Operation` and `Workflow`, and how should those subjects map to
dependency-specific infrastructure bindings without a dependency-injection
library or a generic `Port` abstraction?

Every proposal or recommendation in this lane carries one of these labels:

- **`current-source`** — stated directly by a current local source; the source's
  own candidate or claim ceiling still applies.
- **`local-inference`** — a bounded synthesis from the listed local evidence;
  it creates no semantic or profile authority.
- **`operator-reading`** — an explicit operator design direction for the target
  TypeScript profile: higher-order-function injection, no DI library, no
  generic `Port`, and dependency-specific forms.
- **`open-residue`** — undecided, unadmitted, deferred, unsupported, or not yet
  evidenced.

`Port` is used below only when quoting or disposing older source wording. No
generic `Port` abstraction is recommended.

## 2. Source ledger

All selectors are repository-relative and bind the exact local evidence read
for this lane.

| ID | Exact local selector | Use and source status |
| --- | --- | --- |
| APE-SPEC | `projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:16-22,33-59,85-116,118-170,202-207` | `current-source`: typed properties, applicable subjects, profile separation, evidence/authority boundary, realization cycle, claim ceiling. |
| APE-WP | `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md:15-20,28-38,40-59,87-118` | `current-source`: the active Work Pack is an Enum cycle; it does not authorize an Operation/Workflow cycle. |
| APE-BUNDLE | `projects/domainspec-v2/development/architecture-pattern-enforcement/architecture-bundle.md:12-32,51-58,92-116,134-157,191-220,222-256` | `current-source`: obligation/evaluator architecture, separate runtime plane, dependency direction, known Workflow evidence-collapse risk. |
| OP-FINDINGS | `projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/findings.md:3-15,62-118,142-225,227-270,293-317,321-348,396-456,609-626` | `current-source`: PO-01/PO-02 authority, internal-layer candidate, profile rules, killed loop folklore, adoption and blind spots. |
| WF-CARD | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.md:1-34` | `current-source`: candidate Workflow card, scope criterion, Operation boundary, and shape-only moat. |
| WF-SCHEMA | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml:1-26` | `current-source`: candidate code pattern, admitted scope values, distinguisher, and `orchestrates` participation. |
| W4-README | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/README.md:1-8` | `current-source`: candidate ordered-step, failure, continuation, and compensation interpretation; explicitly candidate. |
| W4-CONTRACTS | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/contracts/w4-contracts.ts:5-23,43-61,80-125` | `current-source`: candidate descriptor, observation, finding, and claim-ceiling shapes. |
| W4-TS | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-workflow.ts:1-50` | `current-source`: candidate TypeScript ordered execution and reverse compensation witness; not profile or semantic authority. |
| SIC-R2-SEED | `projects/domainspec-v2/development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/REFINE-SEED-PROPOSAL.md:3-33,35-68,70-83` | `current-source`: later system-integration candidate, first-slice record names, deferred transport/delivery, proposed/absent package, and claim ceiling. |
| SIC-R2-RESULT | `projects/domainspec-v2/development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md:3-39` | `current-source`: role split, Stage-1 block, absent package, deferred integrations, and non-claims. |
| SIC-RESEARCH-P | `projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/research.md:425-526,537-565,581-583` | `current-source`: earlier persistence proposal, local transaction/outbox boundary, and older naming to dispose. |
| SIC-RESEARCH-T | `projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/research.md:636-705,709-807,821-856,883-891` | `current-source`: earlier transport/delivery proposal, Workflow non-atomicity, staged delivery boundaries, and open authority questions. |
| POKER-REPO | `validation/poker-team/backend/src/domain/player/player.repository.ts:1-8` | `current-source`: role-specific repository structural type. |
| POKER-UOW | `validation/poker-team/backend/src/domain/shared/financial-write-unit-of-work.ts:1-11` | `current-source`: role-specific UnitOfWork with transaction-scoped repositories. |
| POKER-HANDLER | `validation/poker-team/backend/src/domain/player-management/player-management.events.ts:1-41` | `current-source`: domain event union and in-process callable `EventHandler`. |
| POKER-HANDOFF | `validation/poker-team/backend/src/domain/onboarding/player-intake-handoff.contract.ts:1-14` | `current-source`: `Gateway.publish...` naming whose implementation must determine its infrastructure class. |
| POKER-CREATE | `validation/poker-team/backend/src/use-cases/player/create-player.ts:1-16,60-62,141-183,227-239` | `current-source`: higher-order-function construction, injected repository/callback, direct time and telemetry evidence. |
| POKER-REVIEW | `validation/poker-team/backend/src/use-cases/onboarding/review-candidate-application.ts:1-28,30-56,60-167,176-225` | `current-source`: higher-order-function construction, separated review policy, repository and handoff use, and Operation/Workflow telemetry co-location. |
| POKER-HANDOFF-DB | `validation/poker-team/backend/src/infrastructure/repositories/drizzle-onboarding-player-intake-handoff.repository.ts:1-29` | `current-source`: the supposed publish gateway is implemented as a Drizzle table insert, not as observed broker transport. |

**External-source ledger — `current-source`:** no external source was newly
opened or relied on for this lane. The local integration research contains
primary-source citations, but this lane does not refresh or extend their claims.

## 3. Evidence-bound answer

- **`current-source`:** APE can model different property sets because every
  required property carries applicable subjects, an observation stage, an owner
  route, and a forbidden inference. Portable properties and language/project
  conventions are distinct (`APE-SPEC`).
- **`current-source`:** Only PO-01 and PO-02 are established by the Operation
  research as current portable DomainSpec semantics: an Operation is
  state-changing while a Query is read-only and an Operation may read; where a
  Rule enforces an Operation, its verdict precedes guarded mutation
  (`OP-FINDINGS`).
- **`current-source`:** The current Workflow card is itself candidate and its
  machine criterion checks `scope`; its Operation boundary says a Workflow
  coordinates multiple ordered Operations, while the moat explicitly does not
  check actual reachability (`WF-CARD`, `WF-SCHEMA`).
- **`current-source`:** Ordered step identity, nested Workflow steps, terminal
  outcomes, failure behavior, continuation closure, and compensation exist as
  candidate W4 conformance contracts with `authority_effect: none`; they are not
  current portable Workflow authority (`W4-README`, `W4-CONTRACTS`).
- **`local-inference`:** Operation and Workflow therefore require separate APE
  realization-property sets joined by shared dependency-role and evidence
  machinery. Collapsing them into one "behavior" profile would erase the
  single-action versus multi-step-orchestration boundary.
- **`operator-reading`:** In the target TypeScript profile, dependency inversion
  should be realized by explicit higher-order-function parameters and
  dependency-specific structural types. A DI framework, decorators, service
  locator, and generic `Port` type are out of profile.
- **`local-inference`:** A code dependency form, a portable integration binding,
  a provider adapter, and evidence are separate objects. For example,
  `PlayerRepository` is a TypeScript application contract;
  `PersistenceBinding` would map logical references to a storage realization;
  a Drizzle repository is the adapter; commit/rollback observations are the
  evidence. None substitutes for another.

## 4. Current semantics, proposed properties, and TypeScript conventions

| Concern | Current portable or current-source meaning | Proposed portable implementation property or obligation | TypeScript profile convention |
| --- | --- | --- | --- |
| Operation identity | **`current-source`:** PO-01: state-changing behavior; it may read. | **`local-inference`:** bind one exact Operation subject, its state-change responsibility, declared reads/effects, and applicable Rule gates. Detailed effect declarations remain unadmitted. | **`operator-reading`:** construct one Operation callable with a higher-order factory and named dependency object or parameters. |
| Query boundary | **`current-source`:** PO-01: Query is read-only. | **`local-inference`:** any Query dependency used by an Operation retains a no-state-change obligation; static clean evidence cannot prove runtime absence of writes. | **`operator-reading`:** inject a Query callable or role-specific repository read surface; do not import a concrete ORM/SDK. |
| Rule gate | **`current-source`:** PO-02: an enforcing Rule's boolean verdict precedes guarded mutation. | **`local-inference`:** bind the exact Rule, verdict checkpoint, guarded state change, and false-branch no-guarded-mutation witness. Rule purity beyond this remains residue. | **`operator-reading`:** pass plain values to a domain Rule/policy function; do not give a Rule repositories, transporters, clocks, or SDK clients by default. |
| Workflow identity | **`current-source`:** candidate criterion: declared scope is intra-feature or cross-feature; candidate distinguisher: ordered coordination of multiple Operations. | **`local-inference`:** bind exact ordered steps and distinguish Operation steps from nested Workflow steps. Do not infer runtime order from declaration alone. | **`operator-reading`:** construct the Workflow from injected Operation/Workflow callables; do not reconstruct their lower-level dependencies. |
| Workflow completion | **`current-source`:** W4 proposes terminal outcomes and synchronous, awaited, or background-handoff continuation boundaries. | **`local-inference`:** conditionally require a terminal outcome, failure contract, continuation closure, and runtime observation for the selected Workflow profile. | **`operator-reading`:** use explicit result/failure types and await or handoff visibly; a returned promise alone does not prove durable continuation. |
| Workflow failure/compensation | **`current-source`:** W4 proposes per-step `stop`, `continue`, or `compensate` and exact compensation identities. | **`local-inference`:** bind failure behavior and compensation reachability/order only when declared; compensation is another Operation or Workflow, not transaction rollback by synonym. | **`operator-reading`:** inject compensating callables; retain explicit completed-step/checkpoint state rather than hiding it in a container. |
| Responsibility and separation | **`current-source`:** Operation is not Workflow; Workflow coordinates ordered Operations. No current source turns generic SRP/SoC slogans into a metric. | **`local-inference`:** Operation owns one declared domain action; Workflow owns cross-step coordination; adapters own provider mechanics; the composition root owns construction. Duplicate business-rule decisions require exact semantic comparison, not filename counting. | **`operator-reading`:** keep decision/policy functions separate from repositories/SDK adapters; a Workflow may own workflow-level policy but must not copy a Rule already owned by an Operation. |
| Complexity/traversal | **`current-source`:** loop count, nesting, cyclomatic complexity, and iterator shape are proxies; universal reduce/one-pass rules are killed. | **`local-inference`:** apply declared cost, call-budget, consumption, order, error, cancellation, and lifecycle obligations to the subject that owns them; syntax alone never satisfies them. | **`operator-reading`:** allow `for...of`, multiple passes, `reduce`, short-circuit helpers, or explicit state when the declared behavior is preserved and evidenced. |
| Integration | **`current-source`:** Operation/Workflow meaning does not prove persistence, transactionality, delivery, or distributed consistency. Revision 2 proposes sibling portable bindings. | **`local-inference`:** attach applicable binding references and guarantee obligations without adding provider products or code-form names to portable records. | **`operator-reading`:** use dependency-specific forms: `Repository`, `UnitOfWork`, `Transporter`, `EventHandler`, store, scheduler, clock, client, codec, hasher, generator, recorder, and immutable config. |

## 5. Operation versus Workflow obligation matrix

The IDs below are paper-local handles for a future Work Pack, not admitted
ontology or diagnostic IDs.

| Candidate obligation | Operation applicability | Workflow applicability | Evidence boundary | Label |
| --- | --- | --- | --- | --- |
| OWB-SUBJ-01 exact subject binding | Bind one Operation source/callable/profile/digest. | Bind one Workflow descriptor/source/callable/profile/digest. | Missing, ambiguous, stale, or dynamic mapping is `unsupported`, never pass. | `local-inference` |
| OWB-NC-01 subject non-collapse | Must retain state-changing action identity and must not be classified as a Query. | Must retain multi-step coordination identity and must not be classified as one Operation merely because it is implemented by one function. | Exact descriptor and behavioral witnesses; static function count is insufficient. | `local-inference` |
| OWB-OP-01 read/change boundary | Required from PO-01: may read; produces its state change. | Not inherited as a Workflow-wide mutation requirement; its steps may be Operations or nested Workflows. | Runtime effect/state observations remain separate from static imports. | `current-source` for Operation; `local-inference` for non-inheritance |
| OWB-OP-02 Rule gate | Required when an enforcing Rule exists: verdict before guarded mutation. | A Workflow must preserve each invoked Operation's gate; it must not repeat or bypass that Rule. A distinct workflow-level gate needs its own exact owner. | False-verdict, write-before-verdict, and bypass/duplication witnesses. | `current-source` for Operation; `local-inference` for Workflow |
| OWB-WF-01 scope | Not applicable. | Candidate current criterion requires `intra-feature` or `cross-feature`. | Formation evidence only; it does not prove reachability. | `current-source` |
| OWB-WF-02 ordered step binding | Not applicable inside one Operation. | Bind every ordered step to an Operation or nested Workflow and detect missing, extra, duplicate, or reordered steps. | W4-style descriptor plus trace; still candidate. | `local-inference` from `current-source` W4 |
| OWB-WF-03 terminal/continuation closure | Operation has its own result/error and lifecycle, not a Workflow continuation claim. | Conditionally bind terminal outcome, continuation boundary, and closed continuation. | Runtime/lifecycle witness; static structure is insufficient. | `local-inference` |
| OWB-WF-04 failure/compensation | Operation reports its typed outcome; local rollback is a transaction guarantee, not compensation. | Conditionally bind stop/continue/compensate, completed-step prefix, compensation identity/order, and final residue. | Exact hostile failure at every step; compensation success and failure are separate observations. | `local-inference` |
| OWB-DEP-01 role-specific dependency | Bind only dependencies applicable to the Operation's declared work. | Bind child callables plus only Workflow-owned continuation dependencies. | Source mapping plus runtime/provider evidence where behavior is claimed. | `operator-reading` |
| OWB-TX-01 atomicity scope | A local Operation change set may bind one UnitOfWork and `TransactionGuaranteeBinding`. | Never infer one transaction over the Workflow. Each step/checkpoint names its own local boundary; cross-boundary recovery uses resume/compensation. | Commit/rollback evidence per exact resource/profile. | `local-inference` |
| OWB-EVT-01 event versus delivery | Domain Event production does not imply broker publication. | A handoff step does not imply delivery or downstream application commit. | Separate outbox commit, transporter call, broker acceptance, receive, inbox, and application-commit evidence. | `current-source` distinction; `local-inference` application |
| OWB-COST-01 declared cost/lifecycle | Apply only when the Operation declares a measure/dimension/budget. | Apply to step count, fan-out, retries, checkpoint writes, compensation, scheduling, and total continuation lifecycle when declared. | Symbolic and measured evidence remain distinct; syntax-only verdict forbidden. | `local-inference` |
| OWB-RULE-OWN-01 no duplicated business rule | Operation owns its admitted local decision/rule. | Workflow coordinates the Operation and may own only an explicitly distinct cross-step policy. | Semantic/fixture comparison; duplicate-looking syntax is not enough. | `local-inference` |

## 6. Dependency form to infrastructure-binding map

### 6.1 Mapping rules

- **`operator-reading`:** Higher-order functions are the injection mechanism.
  Dependency inversion is established by contract ownership and import
  direction, not by the presence of a container or by naming a type `Port`.
- **`local-inference`:** Role-specific TypeScript contracts are implementation
  forms. Portable integration bindings map semantic/application references to
  target/profile realizations. Adapters implement the forms. Observers and
  evaluators establish only bounded evidence.
- **`current-source`:** Revision 2 currently proposes only
  `PersistenceBinding`, `TransactionGuaranteeBinding`, and
  `FailureOutcomeBinding` for its first slice; `TransportBinding` and
  `DeliveryGuaranteeBinding` are deferred, and the proposed package is absent.
- **`open-residue`:** There is no current admitted portable binding record for
  scheduler/timer, clock, cryptography, ID generation, telemetry, or general
  configuration. They must not be forced into persistence or transport records
  merely to close the table.

### 6.2 Exact map

| Subject need | TypeScript dependency form | Owner and placement | Portable/profile binding and evidence | Classification |
| --- | --- | --- | --- | --- |
| Operation reads or persists domain state | `PlayerRepository`, `<Aggregate>Repository`, or a narrower role-specific repository | Application/domain contract; infrastructure adapter owns ORM/driver calls. | `PersistenceBinding` maps logical refs to adapter/resource/profile; observations cover exact reads/writes. Repository is not a DS-D1 meta-type. | `operator-reading` form; `local-inference` map |
| Operation needs one atomic local change set | `<Capability>UnitOfWork` whose callback receives transaction-scoped repositories | Application contract; infrastructure adapter owns transaction/session mechanics. | `TransactionGuaranteeBinding` declares atomicity/commit and refers to `FailureOutcomeBinding`; commit/rollback evidence is provider/profile-specific. | `operator-reading` form; `current-source` candidate binding |
| Operation records a durable handoff/outbox intent | `<Handoff>Repository` or `OutboxRepository` inside the UnitOfWork context | Persistence adapter; it is not a Transporter merely because a method says `publish`. | `PersistenceBinding` plus the local `TransactionGuaranteeBinding`. Evidence ceiling stops at committed intent. | `local-inference` |
| Operation actually sends to a queue/broker | `Transporter<Message>` or a domain-specific `<Channel>Transporter` | Application contract; messaging adapter owns broker SDK, serialization invocation, and provider configuration. | Deferred `TransportBinding`; deferred `DeliveryGuaranteeBinding` for acceptance/ack/redelivery/order boundaries; runtime evidence required. | `operator-reading` form; `open-residue` binding |
| Operation emits an in-process notification | `<Domain>EventHandler` callable | Application/domain callback; supplied by composition root or an outer Operation wrapper. | No transport or delivery binding follows. Exact invocation evidence may be an Operation observation only. | `operator-reading`; `current-source` Poker form |
| Operation calls an external API | `<System>Client` with operation-specific methods | Application contract; HTTP/vendor SDK adapter in infrastructure. | Deferred request-response branch of `TransportBinding` plus applicable `FailureOutcomeBinding`; timeout/retry observations remain exact-profile evidence. | `operator-reading` form; `open-residue` binding |
| Operation reads time or schedules a deadline | `Clock = () => Date` for observation; `Scheduler`/`Timer` for future invocation | Application contract; platform adapter in infrastructure. Keep observation and scheduling distinct. | No admitted scheduling/clock binding exists. Use an exact implementation/profile binding only after an owner defines it. | `operator-reading` form; `open-residue` binding |
| Operation hashes, verifies, encodes, decodes, signs, or mints identity | `PasswordHasher`, `TokenCodec`, `<Payload>Codec`, `<Id>Generator`, `<Nonce>Generator` | Consumer-owned contract; crypto/codec/random provider adapter in infrastructure. | Provider/profile, algorithm/version, key/secret references, and evidence need a separately owned binding; none is admitted here. | `operator-reading` form; `open-residue` binding |
| Operation records telemetry | `MetricsRecorder`/`OperationRecorder`, or an outer instrumentation higher-order wrapper | Application-facing observation contract or composition wrapper; telemetry SDK stays in infrastructure. | Observability/profile evidence can show recorded facts but never business correctness, delivery, or transactionality. | `operator-reading` form; `local-inference` evidence ceiling |
| Operation consumes configuration | immutable typed values such as `CreatePlayerConfig`; opaque secret references, not a generic mutable config service | Construct and validate at composition root; pass only the values the consumer needs. | Profile-local `config_ref`/`secret_ref` where defined; no secret material in DomainSpec records. | `operator-reading` form; `open-residue` binding |
| Workflow invokes domain work | exact Operation and nested Workflow callable types | Workflow/application contract; the composition root supplies already-constructed callables. | Bind each step to its exact subject/source/profile; each step retains its own applicable integration bindings. | `operator-reading` form; `local-inference` map |
| Workflow persists resumable progress | `WorkflowStore` or `CheckpointStore`, not a generic repository masquerading as all orchestration infrastructure | Workflow/application contract; persistence adapter owns storage. | `PersistenceBinding` for checkpoint storage and a local `TransactionGuaranteeBinding` for each atomic checkpoint boundary. | `operator-reading` form; `local-inference` map |
| Workflow schedules or resumes work | `Scheduler`/`Timer` with explicit schedule/cancel identity | Workflow/application contract; scheduler adapter owns SDK/runtime. | Scheduling binding and guarantee vocabulary are absent; do not relabel this as transport without an owner decision. | `operator-reading` form; `open-residue` binding |
| Workflow hands off background continuation | `Transporter<ContinuationMessage>` only if there is actual transport; otherwise an injected Workflow callable | Workflow/application contract; transport adapter owns broker SDK. | Deferred transport/delivery bindings plus failure outcome; checkpoint-before-handoff and resume evidence are separate. | `operator-reading` form; `open-residue` binding |
| Workflow compensates | exact compensating Operation/Workflow callable | Workflow owns ordering/reachability; compensating subject owns its business rules and dependencies. | Workflow failure/compensation observation plus every compensating subject's own bindings; never one synthetic global transaction. | `local-inference` |

## 7. Composition-root and adapter placement rules

1. **`operator-reading`:** A role-specific contract is owned closest to its
   consumer. An Operation may own/import a `Repository`, `UnitOfWork`,
   `Transporter`, client, clock, codec, hasher, generator, recorder, or config
   shape; a Workflow owns child callable, checkpoint, scheduler, and
   continuation shapes.
2. **`operator-reading`:** Concrete ORM, database driver, queue/broker SDK,
   HTTP SDK, scheduler SDK, crypto library, telemetry SDK, environment access,
   and provider configuration belong in infrastructure adapters or the
   composition root, not inside Operation, Workflow, or Rule modules.
3. **`operator-reading`:** The composition root is the sole normal meeting
   point of concrete adapters and Operation/Workflow factories. It constructs
   adapters, validates immutable configuration, supplies secrets through opaque
   provider mechanisms, and closes higher-order factories.
4. **`operator-reading`:** Workflows receive constructed Operation/Workflow
   callables. They do not receive the child Operation's repository merely to
   reproduce the child Operation's business decision or mutation.
5. **`local-inference`:** A Workflow may directly receive a
   `WorkflowStore`/`CheckpointStore`, `Scheduler`/`Timer`, `Clock`, or
   continuation `Transporter` only for orchestration state it owns. Direct
   business-aggregate persistence still routes through the responsible
   Operation.
6. **`operator-reading`:** A UnitOfWork supplies transaction-scoped
   repositories to its callback, as the Poker `FinancialWriteUnitOfWork`
   demonstrates. Do not inject both an unscoped repository and an unrelated
   transaction handle and assume they participate in the same commit.
7. **`local-inference`:** Import rules, directory layout, interface/type syntax,
   factory shape, direct-leaf exports, and severity are TypeScript/project
   profile policy. They are not portable Operation or Workflow meaning.
8. **`local-inference`:** Dynamic factories, callbacks, decorators, aliases,
   and generated SDKs that cannot be resolved produce `unsupported` evidence;
   they do not earn a conformance pass.

Illustrative profile form only:

```ts
type ApprovePlayerDeps = Readonly<{
  players: PlayerRepository;
  unitOfWork: PlayerUnitOfWork;
  clock: Clock;
  onEvent?: PlayerManagementEventHandler;
}>;

const approvePlayer =
  (deps: ApprovePlayerDeps) =>
  async (input: ApprovePlayerInput): Promise<ApprovePlayerResult> => {
    // Operation-owned rules and one declared state-changing action.
  };

type OnboardPlayerDeps = Readonly<{
  approvePlayer: ReturnType<typeof approvePlayer>;
  createPlayer: CreatePlayer;
  checkpoints: OnboardingCheckpointStore;
  scheduler: OnboardingScheduler;
  clock: Clock;
}>;

const onboardPlayer =
  (deps: OnboardPlayerDeps) =>
  async (input: OnboardPlayerInput): Promise<OnboardingResult> => {
    // Workflow-owned step order, continuation, and compensation only.
  };
```

**`operator-reading`:** This example demonstrates explicit higher-order
construction; it is not admitted DomainSpec syntax and does not require classes,
decorators, or a generic `Port` base type.

## 8. Transaction, outbox, transport, delivery, and Workflow atomicity

The boundaries must remain observable and separately named:

```text
Operation business decision
  -> local UnitOfWork begins
  -> business state + outbox/handoff intent written
  -> local commit
  -> dispatcher reads committed intent
  -> Transporter sends
  -> provider/broker accepts
  -> consumer receives
  -> consumer inbox + Operation state commit
  -> downstream application outcome
```

- **`current-source`:** The earlier integration research explicitly limits an
  outbox row to locally committed intent and assigns delivery to the distributed
  integration lane. It also separates broker acceptance from application
  success (`SIC-RESEARCH-P`, `SIC-RESEARCH-T`).
- **`local-inference`:** `Repository`/`OutboxRepository` plus UnitOfWork cover
  the producer's local atomicity. `Transporter` begins at actual external send.
  `EventHandler` covers only an in-process invocation. A method named `publish`
  proves none of these categories by itself.
- **`local-inference`:** `TransactionGuaranteeBinding` closes at the exact
  tested local commit boundary. `DeliveryGuaranteeBinding` must separately name
  publish acceptance, consumer acknowledgement, redelivery/order scope, and
  application commit. Neither implies end-to-end exactly-once behavior.
- **`local-inference`:** A Workflow is not one distributed transaction. Each
  Operation step and Workflow checkpoint has an explicit local atomicity
  boundary. Later failure is handled through retry/resume, idempotency,
  reconciliation, or declared compensation, each with its own evidence.
- **`open-residue`:** Revision 2 defers `TransportBinding` and
  `DeliveryGuaranteeBinding`, and no selected profile or runtime fixture exists.
  Only the persistence/transaction/failure first slice is presently shaped as a
  candidate, and even that route is blocked before Stage 1.

## 9. Adversarial counterexamples

| Counterexample | Why it must fail or remain unsupported | Expected disposition | Label |
| --- | --- | --- | --- |
| `type Port<T> = ...` used for repositories, brokers, clocks, clients, and stores | Erases dependency category, owner, lifecycle, and applicable binding/guarantee. | Reject in the selected TypeScript profile; require the role-specific form. | `operator-reading` |
| DI container, decorator injection, or service locator resolves dependencies invisibly | Hides the exact construction edge and permits runtime ambiguity; the operator explicitly excludes it. | Reject in the selected TypeScript profile; use explicit HOF construction. | `operator-reading` |
| Operation or Workflow imports Drizzle, Prisma, Kafka, RabbitMQ, AWS SDK, HTTP SDK, scheduler SDK, or telemetry SDK directly | Bypasses the consumer-owned form, adapter boundary, and exact provider binding. | Profile finding when statically resolvable; otherwise `unsupported`. Not a portable semantic error without admission. | `operator-reading` plus `local-inference` ceiling |
| Workflow queries/mutates business repositories to repeat an Operation's Rule and write | Collapses coordination into duplicated business action and permits rule drift/bypass. | Exact hostile fixture must show the Workflow invokes the Operation and preserves its verdict; allow only Workflow-owned checkpoint persistence. | `local-inference` |
| One Workflow-wide UnitOfWork spans remote calls, timers, or background handoffs | Treats distributed continuation as one local atomic resource and makes failure/unknown outcome invisible. | Reject unless an exact provider profile proves every participant is inside one tested atomic boundary; default to step-local transactions. | `local-inference` |
| `PlayerIntakeHandoffGateway.publish...` is classified as broker delivery | Its representative adapter performs a Drizzle insert only. Naming does not prove send, broker acceptance, receive, or application commit. | Classify as persistence-backed handoff/repository evidence; at most outbox intent when explicitly declared. | `current-source` plus `local-inference` |
| An `EventHandler` callback is called, so an Event is "delivered" | In-process invocation has no broker, ack, redelivery, ordering, or downstream commit evidence. | Record callback invocation only; require a Transporter and deferred delivery bindings for transport claims. | `local-inference` |
| Workflow copies an Operation's eligibility predicate "for safety" | Creates two owners for one business decision and can diverge while traces remain ordered. | Reject the duplication; invoke the Operation or a single shared Rule owner. A distinct cross-step policy needs its own subject and evidence. | `local-inference` |
| Linter requires `reduce` or one pass and rejects explicit loops/two passes | Operation research kills the universal rule; syntax does not prove work, allocation, short-circuit, errors, cleanup, cancellation, or clarity. | No portable gate or semantic autofix; optional profile advisory only. | `current-source` |
| Nested loop automatically fails complexity | Domains may be disjoint or bounded; a single visible loop can hide quadratic calls or N+1. | Require named input measures/resource dimensions and measured or derived evidence; otherwise warning/unsupported. | `current-source` |
| Telemetry emission proves Workflow correctness or delivery | Telemetry shows observation, not correctness, commit, or downstream success. | Preserve observation provenance and exact claim ceiling. | `local-inference` |
| Static import graph is clean, so runtime effects conform | Dynamic dispatch, callbacks, lazy ORM behavior, generated clients, reflection, and aliases may evade it. | Return `unsupported` for unresolved required observations and add exact runtime witnesses. | `current-source` |

## 10. Conflicts and exact disposition

| Conflict | Evidence | Disposition | Label |
| --- | --- | --- | --- |
| Older Operation and integration research says "port" or "repository port". | `OP-FINDINGS:151,166,206-207`; `SIC-RESEARCH-P:431-445,458`; `SIC-RESEARCH-T:656-657`. | Preserve any separately owned logical DomainSpec `Interface` meaning, but supersede the code-level generic-Port recommendation for this TypeScript profile with `Repository`, `UnitOfWork`, `Transporter`, `EventHandler`, store, scheduler, clock, client, codec, hasher, generator, recorder, and config forms. Do not mutate the older evidence. | `operator-reading` |
| Earlier research proposes `TransactionPolicy`; Revision 2 names `TransactionGuaranteeBinding`. | `SIC-RESEARCH-P:442,461,481,515-523`; `SIC-R2-SEED:25-31`. | Use the later Revision-2 name in future planning; retain `TransactionPolicy` as historical candidate wording, not a second parallel record. Exact schema/semantic equivalence remains unproven. | `local-inference` plus `open-residue` |
| Earlier research proposes `FailurePolicy`, `DeliveryPolicy`, and `MessageChannel`; Revision 2 names `FailureOutcomeBinding`, defers `TransportBinding`, and retains but defers `DeliveryGuaranteeBinding`. | `SIC-RESEARCH-T:693-705,709-791`; `SIC-R2-SEED:25-33`; `SIC-R2-RESULT:27-30`. | Use Revision-2 first-slice names. Treat old transport shapes as input evidence only until independent non-collapse, owner, and profile decisions close. | `local-inference` plus `open-residue` |
| Workflow W4 contracts are richer than the candidate Workflow card's shape-only criterion. | `WF-CARD:17-34`; `W4-README:3-8`; `W4-CONTRACTS:43-59,80-117`. | Model W4 fields as proposed implementation properties/obligations with candidate-local evidence. Do not report order/failure/compensation/continuation as admitted portable Workflow semantics. | `current-source` ceiling |
| Poker calls a Drizzle table insert through `PlayerIntakeHandoffGateway.publishApprovedCandidate`. | `POKER-HANDOFF:12-14`; `POKER-HANDOFF-DB:1-29`. | Treat the observed form as persistence-backed handoff/repository behavior. Rename/refactor only in a separately authorized implementation task; this lane changes no Poker bytes. | `local-inference` |
| Poker Operation/Workflow use cases import concrete telemetry instruments. | `POKER-CREATE:9-16`; `POKER-REVIEW:10-28`. | Use as an adversarial/profile finding for the proposed recorder/outer-wrapper boundary, not as proof that Poker currently conforms. | `operator-reading` plus `local-inference` |
| APE has a candidate Work Pack, but its current subject is Enum. | `APE-WP:28-59,87-118`. | Do not append Operation/Workflow work to the active Enum execution edge. Author a separate bounded realization Work Pack after owner decisions and normal gates. | `current-source` plus `local-inference` |

## 11. Open residue

1. **`open-residue`:** The Workflow card and W4 family are candidate surfaces;
   no source in scope admits order, failure, compensation, continuation, retry,
   checkpoint, or scheduling as current portable Workflow semantics.
2. **`open-residue`:** Detailed Operation effect declarations, pure-Rule
   declarations, and semantic call budgets remain deferred by the Operation
   research.
3. **`open-residue`:** Revision 2's package root is proposed/absent, its profile
   is unselected, its reviewer sheet is not authorized, and Refine is 0/10.
4. **`open-residue`:** `TransportBinding` and
   `DeliveryGuaranteeBinding` are deferred. Scheduler/timer, clock,
   crypto/codec/generator, telemetry, config, and secret binding ownership is
   absent from the current first slice.
5. **`open-residue`:** Decide whether `WorkflowStore` and `CheckpointStore` are
   two distinct profile forms or one narrowed contract, and define the exact
   persistence/transaction references for resumable state.
6. **`open-residue`:** Decide Workflow retry, idempotency, timeout, cancellation,
   concurrency/fan-out, compensation-failure, and unknown-outcome semantics
   before any portable obligation is admitted.
7. **`open-residue`:** Bind exact composition-root, adapter, HOF factory, and
   unsupported-dynamic-call observation contracts for the selected TypeScript
   profile. No analyzer or runtime observer was run here.
8. **`open-residue`:** Determine how portable integration records attach to
   Operation/Workflow subjects without overloading the existing UI `Binding`
   concept or creating a second implementation-binding registry.
9. **`open-residue`:** The representative Poker evidence is not a complete
   architecture inventory and establishes no repository-wide conformance or
   non-conformance rate.

## 12. Recommended bounded Work Pack decomposition

**`local-inference`:** Create one new candidate APE realization Work Pack for
Operation/Workflow dependency and infrastructure-binding properties; do not
change or execute the active Enum Work Pack. Keep Operation and Workflow as
separate subjects that share only contracts, adapters, evaluators, and evidence
machinery.

| Wave / SWU | Bounded outcome | Gate and non-goal | Label |
| --- | --- | --- | --- |
| W0 / OWB-SOURCE-001 | Bind current Operation PO-01/PO-02, candidate Workflow criterion, W4 candidate, APE property schema, and Revision-2 record names by selector/digest. | Stop on authority conflict; no semantic promotion. | `local-inference` |
| W0 / OWB-PROPERTY-001 | Define candidate `OperationRealization` and `WorkflowRealization` properties, applicability, non-collapse rules, forbidden inferences, and missing/unsupported outcomes. | Workflow lifecycle properties remain candidate until owner admission. | `local-inference` |
| W1 / OWB-TS-PROFILE-001 | Specify HOF construction, role-specific dependency forms, composition root, adapters, import direction, and dynamic unsupported behavior. | No generic Port, DI library, framework selection, or repository-wide default. | `operator-reading` |
| W1 / OWB-OP-EVIDENCE-001 | Build positive/hostile Operation witnesses for repository acquisition, Rule gate, UnitOfWork, event handler versus Transporter, direct SDK import, and cost/traversal claims. | PO-01/PO-02 only are current semantic failures; other findings retain profile/candidate status. | `local-inference` |
| W2 / OWB-WF-EVIDENCE-001 | Build positive/hostile Workflow witnesses for exact step order, nested workflows, duplicated rules, terminal/failure/continuation closure, checkpoint/resume, scheduling, and compensation residue. | Separate formation, static, runtime, and lifecycle evidence; no Workflow-wide atomicity claim. | `local-inference` |
| W2 / OWB-PERSIST-JOIN-001 | Join Operation/Workflow obligations to the Revision-2 persistence, transaction-guarantee, and failure-outcome first slice. | Blocked until Revision 2's owner/profile/reviewer gates close; no implementation by this Work Pack authoring step. | `open-residue` |
| W3 / OWB-TRANSPORT-JOIN-001 | Join actual Transporter use and background Workflow handoff to separately admitted transport/delivery records and staged runtime evidence. | Intentionally blocked while transport/delivery remain deferred. | `open-residue` |
| W3 / OWB-TRUST-001 | Freeze observations, exact-cause negatives, findings, replay, and bounded completion receipt; recompute remaining evidence burden. | No profile admission, semantic authority, release, deployment, or production claim. | `local-inference` |

**`local-inference`:** Recommended execution order is W0 source/authority lock,
W0 subject-property separation, W1 TypeScript profile, independent Operation and
Workflow evidence, persistence join, then a separately gated transport/delivery
join. No successor should become eligible from prose status alone.

## 13. Local-only claim ceiling

This lane is a local-source architecture synthesis. It creates one research
document and no canonical definition, ontology property, profile, Work Pack,
binding schema, adapter, analyzer, fixture, observer, test, receipt authority,
or runtime integration. It does not select a DI mechanism beyond recording the
operator's desired future TypeScript profile, and it does not establish that
Poker Team conforms to that profile.

No external source was newly checked. No analyzer, typechecker, unit test,
integration test, database, ORM, transaction, queue, broker, scheduler, runtime
Workflow, retry, compensation, delivery, or performance experiment was run.
All proposed properties, binding maps, placement rules, counterexamples, and
Work Pack steps retain `authority_effect: none`. They do not admit semantics or
profiles, implement the proposed/absent system-integration package, prove
atomicity or delivery, promote authority, publish, release, deploy, or establish
production readiness.
