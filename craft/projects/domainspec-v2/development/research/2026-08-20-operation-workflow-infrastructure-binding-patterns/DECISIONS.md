# Bridge Decisions

These decisions govern this research package only.

| ID | Decision | Status | Reason and boundary |
| --- | --- | --- | --- |
| `BD-01` | Reuse APE as the umbrella and its applicable-subject property mechanism. | `borrow-carefully` | Current APE design already separates portable properties, profiles, observations, evaluators, and owner decisions. Do not create a fourth umbrella. |
| `BD-02` | Give Operation and Workflow independent property sets and evidence denominators. | `promotion-candidate` | They have different semantic responsibilities and runtime proof burdens. Promotion requires APE/semantic owner action. |
| `BD-03` | Use HOF factories and structural dependency contracts in the TypeScript Poker Team profile. | `borrow-carefully` | Demonstrated locally and requires no library. It remains language/project-profile policy. |
| `BD-04` | Use dependency-specific forms rather than a universal `Port`. | `block` universal Port; `promotion-candidate` profile taxonomy | Specific forms retain responsibility and map to different guarantees/evidence. Names remain profile-owned. |
| `BD-05` | Keep DomainSpec Interface where it represents a real logical boundary, but do not force Repository to masquerade as Interface. | `promotion-candidate` | Resolves the older repository-port wording without deleting Interface semantics. Exact PersistenceBinding fields remain open. |
| `BD-06` | Map Repository to PersistenceBinding and UnitOfWork to TransactionGuaranteeBinding only when those guarantees are claimed. | `borrow-carefully` | Code contract and metadata binding stay separate; Revision 2 is not admitted. |
| `BD-07` | Distinguish EventHandler, outbox persistence, Transporter, broker acceptance, and application commit. | `promotion-candidate` | CloudEvents/AsyncAPI and local integration research support the non-collapse; transport schemas remain deferred. |
| `BD-08` | Treat Workflow as orchestration, not a distributed transaction. | `borrow-carefully` | Local transactions belong to Operations; compensation and retry are explicit Workflow/integration obligations. |
| `BD-09` | Split synchronous and durable Workflow implementation profiles. | `future-work` | Durable replay, checkpoints, timers, and versioning are not necessary for every Workflow and have no accepted binding owner yet. |
| `BD-10` | Treat Temporal Activities as provider-profile evidence, not DomainSpec vocabulary. | `analogy-only` | One runtime's determinism mechanism cannot define portable Workflow meaning. |
| `BD-11` | Retain W4 failure, continuation, compensation, and exact trace concepts as candidates. | `borrow-carefully` | W4 supplies finite exact fixtures but explicitly has authority effect none. |
| `BD-12` | Reject universal reduce/one-pass/complexity rules. | `block` | Syntax and source-shape metrics do not prove observable behavior, cost, responsibility, or readability. |
| `BD-13` | Keep telemetry/configuration outside portable business correctness. | `borrow-carefully` | Telemetry is observation; immutable config is composition/profile material. |
| `BD-14` | Do not modify the active Enum Work Pack or the blocked system-integration seed from this research. | `block` mutation/promotion | This tower can recommend later work only. |

## Distilled borrow/block model

### Borrow

- applicable-subject properties and profile resolution from APE;
- concern-specific integration bindings from Revision 2;
- HOF construction, Repository, UnitOfWork, and EventHandler forms from Poker
  Team as TypeScript precedent;
- W4's exact workflow trace, outcome, failure, continuation, and compensation
  evidence shapes;
- event/message/protocol separation from CloudEvents and
  operation/channel/message/binding separation from AsyncAPI;
- local-transaction plus explicit compensation distinction from saga guidance;
- deterministic replay as one durable-runtime profile concern.

### Block

- universal code-level `Port`;
- DI containers, decorators, or service locators as required architecture;
- concrete provider imports inside Operations/Workflows;
- treating Workflow as a transaction or compensation as rollback;
- treating an Event callback or outbox insert as message delivery;
- making every dependency a system-integration record;
- syntax-only loop/reduce or metric-only SRP/SoC enforcement;
- treating candidate evidence as semantic admission.

### Future work

- owner decision on portable Operation/Workflow candidates;
- Workflow runtime/checkpoint/timer binding design;
- TransportBinding and DeliveryGuaranteeBinding execution slice;
- exact profile schemas, analyzers, fixtures, false-positive measurements, and
  suppression governance.
