# Final Learning Pack

## Direct answer

The architecture is not only for Operations. APE should evaluate each
executable subject against its own applicable property set:

- Operation properties protect one state-changing domain action and its local
  effect/transaction boundaries.
- Workflow properties protect multi-step coordination, outcome/failure routing,
  continuation, and—when applicable—checkpoint/replay/compensation behavior.

Both use the same evidence architecture. They do not use the same obligations.

The mapping to infrastructure is concern-specific:

```text
Operation/Workflow obligation
  -> role-specific TypeScript contract supplied by HOF
  -> exact APE ImplementationBinding
  -> optional concern-specific infrastructure record
  -> adapter/provider observation
  -> bounded finding/receipt
```

No DI library or generic code-level Port is needed.

## Operator rules of thumb

1. Inject effects and substitutable runtime capabilities, not every pure helper.
2. Name contracts by responsibility, not by the fact that they are abstractions.
3. Keep provider selection at the composition root.
4. Let Operations own business state changes and their local transactions.
5. Let Workflows own step order, continuation, and recovery—not child business
   rules or child repositories.
6. Stop each guarantee at its evidence boundary.
7. Treat loop form and complexity metrics as evidence prompts, never semantic
   shortcuts.

## Worked TypeScript profile

The following is illustrative profile syntax, not admitted DomainSpec syntax.

### Operation and local atomicity

```ts
type Clock = () => Date;

type ReviewCandidateUnitOfWork = Readonly<{
  run<T>(work: (tx: Readonly<{
    applications: CandidateApplicationRepository;
    handoffs: ApprovedCandidateHandoffRepository;
  }>) => Promise<T>): Promise<T>;
}>;

type ReviewCandidateDependencies = Readonly<{
  transaction: ReviewCandidateUnitOfWork;
  clock: Clock;
}>;

const makeReviewCandidate =
  ({ transaction, clock }: ReviewCandidateDependencies) =>
  async (input: ReviewCandidateInput): Promise<ReviewCandidateResult> =>
    transaction.run(async ({ applications, handoffs }) => {
      const current = await applications.findById(input.id);
      const decision = decideReviewTransition(current, input, clock());
      const updated = await applications.save(decision);

      if (updated.status === "APPROVED") {
        await handoffs.add(toApprovedCandidateHandoff(updated));
      }

      return updated;
    });
```

This code form can map to:

- `PersistenceBinding`: application and handoff records to selected repository
  adapters/resources;
- `TransactionGuaranteeBinding`: both writes share one selected local commit;
- `FailureOutcomeBinding`: commit conflict/rollback outcomes.

It does not prove that the handoff has been sent to a broker.

### Separate transport dispatcher

```ts
type ApprovedCandidateTransporter = Readonly<{
  send(message: ApprovedCandidateMessage): Promise<TransportReceipt>;
}>;

const makeDispatchApprovedCandidates =
  (outbox: ApprovedCandidateHandoffRepository,
   transporter: ApprovedCandidateTransporter) =>
  async (): Promise<void> => {
    const pending = await outbox.findPending();

    for (const handoff of pending) {
      const receipt = await transporter.send(toMessage(handoff));
      await outbox.markAccepted(handoff.id, receipt.providerId);
    }
  };
```

This is where a future `TransportBinding` begins. Provider acceptance still
does not prove consumer processing or application commit; those belong to a
future DeliveryGuaranteeBinding and staged runtime evidence.

### Workflow composition

```ts
type OnboardPlayerDependencies = Readonly<{
  reviewCandidate: ReviewCandidate;
  createPlayer: CreatePlayer;
  checkpoints: OnboardingCheckpointStore;
  scheduler: OnboardingScheduler;
}>;

const makeOnboardPlayer =
  (deps: OnboardPlayerDependencies) =>
  async (input: OnboardPlayerInput): Promise<OnboardingResult> => {
    const reviewed = await deps.reviewCandidate(input.review);
    await deps.checkpoints.save(input.workflowId, "reviewed");

    if (!reviewed.approved) return { outcome: "rejected" };

    const player = await deps.createPlayer(toCreatePlayer(reviewed));
    await deps.checkpoints.complete(input.workflowId, player.id);
    return { outcome: "completed", playerId: player.id };
  };
```

The Workflow receives already-constructed Operations. It does not receive their
repositories or reimplement their Rules. A durable profile must additionally
decide replay-safe time, stable invocation identity, crash/resume behavior,
version compatibility, scheduling, and duplicate continuation. Those are not
present Workflow semantics merely because this function exists.

## Binding map at a glance

| Code form | Metadata/integration mapping | Claim stops at |
| --- | --- | --- |
| Repository | APE ImplementationBinding + candidate PersistenceBinding | selected adapter read/write observation |
| UnitOfWork | candidate TransactionGuaranteeBinding + FailureOutcomeBinding | exact local commit/rollback participants |
| EventHandler | APE binding/Operation observation | in-process invocation |
| Outbox/HandoffRepository | persistence + local transaction bindings | committed outgoing intent |
| Transporter | deferred TransportBinding | attempted send/provider acceptance as separately observed |
| Delivery guarantee | deferred DeliveryGuaranteeBinding | exact ack/order/redelivery/application-commit stages |
| Clock/client/codec/hasher/generator | APE ImplementationBinding by default | selected provider fixture/observation |
| named child Operation/Workflow | Workflow step/`orchestrates` binding | exact invocation and typed outcome |
| WorkflowStore/CheckpointStore | unresolved persistence/runtime mapping | exact checkpoint/history observation |
| Scheduler/Timer | unresolved workflow-runtime mapping | exact schedule/wake/cancel observation |

## What the research borrows

- APE's subject-applicable property and observation architecture;
- Revision 2's separation of portable integration records from provider
  mechanics and evidence;
- Poker Team's functional construction, Repository, UnitOfWork, and
  EventHandler precedents;
- W4's candidate step/trace/outcome/failure/continuation/compensation shapes;
- primary-source event/message/protocol and workflow/local-transaction
  distinctions.

## What it refuses

- one dependency abstraction to rule them all;
- a DI container as architecture;
- provider SDKs in Operations or Workflows;
- Workflow-wide distributed transactions;
- treating compensation as rollback;
- treating an outbox insert or callback as delivery;
- injecting all pure functions;
- using `reduce`, loop counts, or complexity scores as correctness/SRP proof;
- converting candidate fixtures or receipts into semantic authority.

## Honest cutoff

This package closes the architecture research question and produces a bounded
planning recommendation. It does not close the authority, profile, binding
schema, analyzer, runtime, or empirical evidence work listed in
`residue/open-residue.md`.
