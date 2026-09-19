# L2 — Recommended Work Pack Decomposition

## Planning verdict

Do not make the enforcement system Operation-only. Also do not collapse
Operation and Workflow into one `MetaTypeRealizationProof`: APE defines its
smallest coherent proof unit around one active meta-type and one applicable
property set.

The recommended program is:

```text
shared candidate dependency-form/profile contract
  -> Work Pack A: Operation realization + persistence/transaction join
  -> Work Pack B: Workflow realization + checkpoint/runtime join
  -> later transport/delivery join when Revision 2 admits that slice
```

The two Work Packs may reuse schemas, observation carriers, evaluator mechanics,
and TypeScript profile vocabulary. They must have independent subject/property
denominators, hostile fixtures, runtime planes, receipts, and owner gates.

## Preconditions

| Gate | Required state | Current state |
| --- | --- | --- |
| `P0 source lock` | exact Operation, Workflow, APE, W4, and integration-source selectors/digests | research selectors recorded; no execution lock |
| `P1 Rule-gate authority` | owner decides whether Rule-before-guarded-mutation is semantic or selected-profile policy | open (`R-01`) |
| `P2 APE progression` | active Enum cycle reaches an owner-routed point where the next type may be selected, or a separate candidate route is explicitly authorized | current Work Pack remains Enum L2 |
| `P3 TypeScript profile owner` | owner accepts HOF construction and dependency-specific forms for the bounded consumer profile | user direction recorded; no profile admission |
| `P4 integration persistence slice` | Revision 2 selects profile, receives fresh review, and reaches the required planning/implementation gate | blocked before Stage 1 |
| `P5 transport slice` | TransportBinding and DeliveryGuaranteeBinding survive independent design/owner gates | explicitly deferred |

Planning can proceed around blocked gates, but execution cannot report those
edges as eligible or complete.

## Shared candidate contract packet

This packet is reusable input, not a third umbrella or a runtime abstraction.

1. `ExecutableSubjectDependencyForm` evidence schema as a discriminated union of
   role-specific observations—not a code type:
   `repository`, `unit-of-work`, `transporter`, `event-handler`,
   `workflow-store`, `scheduler`, `clock`, `client`, `codec`, `hasher`,
   `generator`, `recorder`, and `config-value`.
2. Exact subject, contract, factory, composition-root, adapter, profile, and
   provider selectors/digests.
3. `missing`, `unsupported`, `observed`, and `owner-resolved` provenance classes.
4. Mapping fields to zero or one applicable concern-specific integration
   records. Zero is valid for local capabilities that claim no integration
   guarantee.
5. Forbidden inference per role: repository does not prove transaction/cost;
   handler does not prove delivery; transporter does not prove application
   commit; workflow store does not prove replay; telemetry does not prove
   correctness.

## Work Pack A — Operation realization and persistence binding

Suggested name: `APE Operation Realization — Functional Dependencies and Local Guarantees`.

| Layer / SWU | Outcome | Gate / non-goal |
| --- | --- | --- |
| `O-L0 SOURCE` | Bind current Operation formation/relationships, accepted July candidate, blocked August research, exact APE property contracts, and user-selected profile direction. | Resolve `R-01`; no semantic reinterpretation. |
| `O-L0 PROPERTY` | Define Operation-applicable candidate properties, applicability, forbidden inference, and separate semantic/profile/advisory classes. | No universal repository, purity, complexity, or loop law. |
| `O-L1 TS-PROFILE` | Specify HOF factory, structural Repository/UnitOfWork/Transporter/EventHandler/client/capability forms, composition root, adapter direction, and dynamic `unsupported`. | No DI library, generic `Port`, decorator, or service locator. |
| `O-L1 POKER-WITNESS` | Bind representative Poker Team positives and counterexamples without changing Poker code. | Project precedent only; no repository-wide conformance claim. |
| `O-L2 STATIC` | Positive/hostile source fixtures: exact contracts, direct concrete provider import, optional atomic UnitOfWork, event-handler/transport collapse, duplicated rules, N+1 warning, loop-style non-gate. | Static evidence cannot prove runtime effects. |
| `O-L2 RUNTIME` | Exact Operation state/effect/order/call-count observations and transaction hostile cases. | Envelope-specific; no universal cost/atomicity proof. |
| `O-L2 PERSIST-JOIN` | Join Repository/UnitOfWork observations to `PersistenceBinding`, `TransactionGuaranteeBinding`, and `FailureOutcomeBinding`. | Blocked until Revision 2 gate closes. No TransportBinding smuggling. |
| `O-L3 TRUST` | Freeze denominator, exact-cause negatives, findings, replay, and bounded Operation realization receipt. | No profile admission, release, or automatic Workflow selection. |

## Work Pack B — Workflow realization and infrastructure continuation

Suggested name: `APE Workflow Realization — Functional Orchestration and Continuation Guarantees`.

| Layer / SWU | Outcome | Gate / non-goal |
| --- | --- | --- |
| `W-L0 SOURCE` | Bind candidate Workflow card/schema, W4 candidate contracts/providers, APE property schema, and exact Operation realization references. | Do not call W4 lifecycle fields current portable authority. |
| `W-L0 PROPERTY` | Define Workflow-applicable step, scope, terminal, failure, continuation, compensation, and rule-ownership candidates. | Owner admission required; keep Operation properties non-inherited. |
| `W-L0 MODE` | Decide applicability discriminator for synchronous versus durable Workflow profiles. | Blocks replay/checkpoint/timer obligations (`R-03`–`R-05`). |
| `W-L1 TS-SYNC` | Specify HOF composition of named Operation/Workflow callables and explicit trace/outcome flow. | No child repositories or provider resolution in the Workflow. |
| `W-L1 TS-DURABLE` | If selected, specify WorkflowStore/CheckpointStore, Scheduler/Timer, replay-safe time/randomness, stable execution/step identity, and version policy. | Provider-neutral profile first; Temporal remains analogy-only. |
| `W-L2 STATIC` | Hostiles for missing/reordered/duplicate steps, unresolved child subject, duplicated business Rule, provider SDK import, and Workflow-wide UnitOfWork. | Source findings distinct from runtime/lifecycle findings. |
| `W-L2 RUNTIME` | Hostiles at every step for terminal outcome, retry/unknown outcome, continuation closure, checkpoint/resume, compensation order/failure, cancellation, and final residue. | Exact fixtures only; no universal durable guarantee. |
| `W-L2 PERSIST-JOIN` | Map workflow-owned checkpoints/history to an owner-selected persistence/runtime binding and local transaction boundaries. | Blocked by `R-03`; no forced schema answer. |
| `W-L3 TRANSPORT-JOIN` | Map actual continuation Transporter/message steps to admitted TransportBinding and DeliveryGuaranteeBinding with staged evidence. | Intentionally blocked while Revision 2 defers transport/delivery. |
| `W-L3 TRUST` | Freeze denominator, findings, replay, and bounded Workflow realization receipt. | No distributed transaction, exactly-once, profile admission, or release claim. |

## Required fixture families

### Operation

- HOF Repository positive versus concrete ORM/database import;
- mandatory UnitOfWork positive versus optional/fallback atomicity bypass;
- EventHandler callback versus actual Transporter;
- outbox write in local commit versus false broker-delivery claim;
- named client/clock/codec positive versus concrete SDK/global environment read;
- Rule ownership/gating status after `R-01` resolves;
- batched access versus cardinality-dependent N+1 warning;
- explicit loop, valid reduce, two-pass global dependency, and early-exit cases
  proving no syntax-only verdict.

### Workflow

- exact ordered Operation/nested-Workflow steps;
- missing, extra, duplicate, and reordered steps;
- Workflow invoking child Operation versus duplicating its Rule/repository write;
- per-step local transaction versus Workflow-wide UnitOfWork;
- synchronous return, awaited completion, and declared background handoff;
- failure at each step, forward retry, reverse compensation, compensation
  failure, and final residue;
- checkpoint-before-handoff, crash/resume, duplicate resume, and stale version;
- EventHandler/outbox/Transporter/broker/application-commit non-collapse;
- explicit awaited loop and reverse compensation loop as positive witnesses.

## Acceptance shape

Each Work Pack closes only when:

1. exact current semantic/profile/integration sources and digests are bound;
2. every applicable property has one accounted result;
3. current semantics, candidate properties, profile conventions, advisories, and
   killed universal rules are reported separately;
4. missing and unsupported never become pass;
5. static and runtime/lifecycle evidence are separate;
6. positive and exact-cause negative fixtures cover the complete denominator;
7. every infrastructure guarantee stops at its observed boundary;
8. receipts retain `authority_effect: none` and route owner decisions rather
   than making them.

## Next governed route

The immediate next route is not implementation. It is an owner-reviewed Work
Pack candidate for Work Pack A after `R-01`, APE progression, and Revision 2
profile/gate status are checked against current bytes. Work Pack B can be
authored as a separate candidate packet, but its durable and transport waves
must remain explicitly blocked until their owners exist.
