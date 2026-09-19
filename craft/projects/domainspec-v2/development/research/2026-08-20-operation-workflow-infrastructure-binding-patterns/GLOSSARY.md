# Local Glossary and Definition Cards

All entries are local to this research unless `current-source` is stated. None
is promoted by this tower.

| Term | Source kind | Local meaning / DomainSpec reading | Promotion status | Misuse warning |
| --- | --- | --- | --- | --- |
| Operation | `current-source` | One state-changing action. It may acquire/read data while producing its state change. | existing source; exact authority remains external | Do not equate it with a transaction, endpoint, class, or database-free function. |
| Workflow | `current-source` | Multiple ordered Operations, possibly nested Workflows, within declared feature scope. Candidate W4 adds outcomes, failure, continuation, and compensation. | current candidate source plus candidate W4 | Do not infer durable execution, atomicity, compensation success, or distributed consistency from the label. |
| Implementation property | `current-source` | A typed APE property with applicable subjects, observation stage, owner route, and forbidden inference. | candidate APE concept | Do not encode project style as portable meaning. |
| Dependency contract | `operator-reading` | A consumer-facing structural type or callable named for one capability needed by an Operation or Workflow. | local-only profile proposal | It is not a universal `Port`, provider, or metadata binding. |
| Dependency inversion | `operator-reading` | Executable subjects depend on their owned/selected contracts; concrete providers depend inward on those contracts and are supplied at composition. | local-only profile proposal | HOF syntax alone does not prove import direction or contract ownership. |
| Higher-order-function injection | `operator-reading` | A factory receives dependencies and returns the executable Operation or Workflow function. | TypeScript profile candidate | Do not make it portable across languages or confuse it with semantic authority. |
| Repository | `operator-reading` with `current-source` precedent | Persistence/query contract for a domain/application concern; ORM/database mechanics live in an adapter. | TypeScript profile candidate | Not a DS-D1 meta-type, generic gateway, transaction guarantee, or proof against N+1. |
| UnitOfWork | `operator-reading` with `current-source` precedent | Executes one declared local change set through transaction-scoped repositories. | TypeScript profile candidate | It does not make an entire Workflow or remote call atomic. |
| Transporter | `operator-reading` | Contract for sending through an actual external transport/broker boundary. | deferred TypeScript/integration profile candidate | Do not use for an in-process callback or a database-only outbox write. |
| EventHandler | `operator-reading` with `current-source` precedent | In-process callable notified of a domain Event. | TypeScript profile candidate | Invocation is not broker acceptance, delivery, consumer commit, or exactly-once behavior. |
| WorkflowStore / CheckpointStore | `operator-reading` | Persistence contract for durable Workflow identity, progress, history, or checkpoints. | open candidate | Do not assume it is required for synchronous in-process Workflows or already covered by the current PersistenceBinding shape. |
| Scheduler / Timer | `operator-reading` | Contract/runtime capability for delayed continuation or wake-up. | open candidate | Wall-clock injection may violate replay requirements in a durable runtime. |
| Clock | `operator-reading` | Callable source of business time where ordinary deterministic injection is sufficient. | TypeScript profile candidate | A durable replay runtime may require its own recorded/replay-safe time API. |
| System-specific client | `operator-reading` | Cohesive outbound request/response contract named for the remote system. | TypeScript profile candidate | Do not collapse every client into `ApiPort` or import the concrete SDK in the Operation. |
| Codec / Hasher / Generator | `operator-reading` | Specific local effect or transformation capability supplied at composition when substitution or evidence matters. | TypeScript profile candidate | These do not automatically need a portable system-integration record. |
| Composition root | `operator-reading` | Outer application location that constructs adapters and supplies them to Operation/Workflow factories. | profile candidate | It must not become a service locator accessed from executable subjects. |
| APE ImplementationBinding | `current-source` | Exact canonical/application concept to source, symbol, profile, provider, and evidence binding. | candidate APE metadata concept | It is not a code dependency interface or generic runtime registry. |
| PersistenceBinding | `current-source` candidate | Neutral connection from logical persistence roles to a selected physical realization and evidence boundary. | Revision 2 candidate; not admitted | It is not a Repository implementation and does not itself prove persistence. |
| TransactionGuaranteeBinding | `current-source` candidate | Declared local atomicity/commit obligation with a typed failure outcome reference. | Revision 2 candidate; not admitted | It is not a Workflow-wide transaction or evidence of runtime behavior. |
| FailureOutcomeBinding | `current-source` candidate | Typed classification of retryable/non-retryable/unknown integration outcomes. | Revision 2 candidate; not admitted | It does not choose retry mechanics or make every failure safe to retry. |
| TransportBinding | `current-source` deferred candidate | Bridge from logical Interface/Event roles to versioned protocol contract and provider profile. | deferred by Revision 2 | It is not a Transporter function, Event, message channel, or delivery guarantee. |
| DeliveryGuaranteeBinding | `current-source` deferred candidate | Scoped acceptance, acknowledgement, ordering, redelivery, deduplication, and application-commit obligations. | deferred by Revision 2 | Never infer exactly-once business effects from broker wording alone. |
| Observation | `current-source` | Provenance-bound static or runtime fact supplied to an evaluator. | candidate APE evidence concept | Observation is not expected truth, admission, or promotion. |

## Worked definition: executable subject dependency

An executable subject dependency is well described only when all four questions
have separate answers:

1. **Why is it needed?** The Operation or Workflow property/step requires a
   named capability.
2. **What code shape exposes it?** A specific contract such as Repository,
   UnitOfWork, Transporter, Clock, or named callable Operation.
3. **What physical realization supplies it?** A composition-root adapter or
   runtime provider.
4. **What guarantee is claimed?** If persistence, transaction, transport,
   delivery, or durable execution is claimed, a concern-specific binding and
   runtime evidence must scope that claim.

Answering only question 2 is dependency injection, not infrastructure proof.
