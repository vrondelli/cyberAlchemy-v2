# L0 — Corpus and Claim Ledger

Checked: 2026-08-20.

## Local source ledger

| ID | Exact selector | Source status | Load-bearing use |
| --- | --- | --- | --- |
| `L-APE-SPEC` | `projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:16-19,44-59,85-116,118-170` | candidate; semantic authority none | applicable-subject properties, profile separation, evidence/authority boundary, realization cycle |
| `L-APE-WP` | `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md:15-20,28-47,87-116` | candidate-plan-ready; active Enum work | proves the current Work Pack is Enum-only and cannot authorize this research's Operation/Workflow slice |
| `L-APE-BUNDLE` | `projects/domainspec-v2/development/architecture-pattern-enforcement/architecture-bundle.md:14-32,90-116,134-157,191-218,222-256` | candidate design; semantic authority none | obligation planner, implementation binding, runtime-plane split, no fourth umbrella |
| `L-OP-CARD` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.md:1-42` | candidate companion; prose non-normative | current Operation `state_change=yes` criterion, Query distinguisher, and relationship participation |
| `L-OP-SCHEMA` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml:1-34` | current schema source | machine criterion and generated relationship projection boundary |
| `L-JULY-FINDINGS` | `projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md:1-25,232-258,514-532,625-630` | accepted research; implementation-open | exact Rule/Operation binding and call-before-transition are proposed profile realization, not executed/admitted behavior |
| `L-JULY-AUDIT` | `projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/reviews/audit-final.md:1-14` | terminal `ACCEPT`, research-only ceiling | acceptance selector for July research bytes |
| `L-OP-FINDINGS` | `projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/findings.md:3-15,62-103,142-225,268-350,609-626` | research result; not auditor-accepted | Operation distinctions, profile/advisory/folklore split, effect-shell candidate, algorithm warnings |
| `L-OP-AUDIT` | `projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/reviews/audit-final.json:1-53` and `DISPATCH-CLOSEOUT.json:31-55,89-90` | terminal `BLOCK`; accepted false | prevents the preceding findings from being represented as accepted research |
| `L-WF-CARD` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.md:1-34` | candidate companion; prose non-normative | current source says Workflow coordinates multiple ordered Operations and declares intra/cross-feature scope |
| `L-WF-SCHEMA` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml:1-26` | current schema source | machine criterion is declared scope; distinguisher and `orchestrates` edge are recorded |
| `L-W4-README` | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/README.md:1-8` | candidate implementation-conformance family | separates Workflow from StateMachine and names ordered steps, outcomes, failure, continuation, compensation |
| `L-W4-CONTRACT` | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/contracts/w4-contracts.ts:15-23,43-61,80-125` | candidate-local exact-fixture contract | paper-executable Workflow descriptor, observation, and diagnostic vocabulary |
| `L-W4-TS` | `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-workflow.ts:1-50` | candidate TypeScript provider | explicit loops preserve await, trace, early failure, and reverse compensation order |
| `L-SIC-SEED` | `projects/domainspec-v2/development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/REFINE-SEED-PROPOSAL.md:5-33,35-64,66-83` | prepared candidate; package proposed/absent | separate portable integration records from provider mechanics; persistence-first slice |
| `L-SIC-RESULT` | `projects/domainspec-v2/development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/RESULT.md:3-39` | blocked before Stage 1 | confirms role split, absent package, deferred transport/delivery, and missing profile decision |
| `L-SIC-RESEARCH-P` | `projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/research.md:425-510` | local research | persistence taxonomy, Operation/Workflow non-collapse, older repository-port wording |
| `L-SIC-RESEARCH-T` | `projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/research.md:636-705,709-807,821-885` | local research | transport, message, delivery, failure, outbox/inbox, workflow/compensation boundaries |
| `L-POKER-REPO` | `validation/poker-team/backend/src/domain/player/player.repository.ts:1-8` | observed project source | structural `PlayerRepository` contract |
| `L-POKER-UOW` | `validation/poker-team/backend/src/domain/shared/financial-write-unit-of-work.ts:1-11` | observed project source | callback-scoped repository context for one transaction |
| `L-POKER-EVENT` | `validation/poker-team/backend/src/domain/player-management/player-management.events.ts:33-41` | observed project source | in-process callable `EventHandler`, not transport proof |
| `L-POKER-HANDOFF` | `validation/poker-team/backend/src/domain/onboarding/player-intake-handoff.contract.ts:1-14` and `validation/poker-team/backend/src/infrastructure/repositories/drizzle-onboarding-player-intake-handoff.repository.ts:1-29` | observed project source | a publish-named gateway whose implementation is a database insert; outbox/handoff repository evidence, not queue delivery |
| `L-POKER-OP` | `validation/poker-team/backend/src/use-cases/player/create-player.ts:1-16,60-62,141-183` | observed project source | HOF injection plus repository and event callback; also direct concrete telemetry counterexample |
| `L-POKER-REVIEW` | `validation/poker-team/backend/src/use-cases/onboarding/review-candidate-application.ts:1-50,60-89,141-167` | observed project source | repository/rule/handoff sequence; direct clock and telemetry remain counterexamples |

## Primary external source ledger

| ID | Direct source | Checked | Narrow use |
| --- | --- | --- | --- |
| `E-TEMPORAL` | [Temporal Workflow Definition](https://docs.temporal.io/workflow-definition) | 2026-08-20 | a durable replay profile may require deterministic command sequences and move database/API effects outside the replay path; this is provider-profile evidence, not DomainSpec meaning |
| `E-AWS-SAGA` | [AWS Prescriptive Guidance: Saga patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-patterns.html) | 2026-08-20 | distributed workflows comprise local transactions plus forward recovery or compensation; this does not make compensation rollback or universal Workflow semantics |
| `E-CLOUDEVENTS` | [CloudEvents specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md) | 2026-08-20 | an Event data record, message, event format, and protocol binding are distinct layers |
| `E-ASYNCAPI` | [AsyncAPI 3.0 specification](https://www.asyncapi.com/docs/reference/specification/v3.0.0) | 2026-08-20 | operations, channels, messages, servers, and protocol bindings remain separate description objects |

## Claim ledger

| Claim | Class | Evidence | Boundary |
| --- | --- | --- | --- |
| APE properties carry valid/applicable subjects and remain distinct from profile-local conventions. | `current-source` | `L-APE-SPEC` | candidate APE design; no profile admission |
| The active APE Work Pack proves Enum, not Operation or Workflow. | `current-source` | `L-APE-WP` | status may change later; this tower binds the checked bytes/date |
| Current Operation source declares `state_change=yes`, distinguishes Query as read-only, and allows `queries`/`enforces`/`orchestrates` relationship participation. | `current-source` | `L-OP-CARD`, `L-OP-SCHEMA` | shape criterion only; body behavior and ordering are not inferred |
| Direct Rule-leaf dependency and call-before-transition are accepted research proposals, not admitted/executed Operation semantics. | `current-source` | `L-JULY-FINDINGS`, `L-JULY-AUDIT` | accepted status applies to the research artifact and its ceiling, not to profile admission |
| Current Workflow source distinguishes Workflow as multiple ordered Operations with declared feature scope. | `current-source` | `L-WF-CARD`, `L-WF-SCHEMA` | card lifecycle is candidate; shape does not prove reachability or execution |
| Failure policy, compensation, terminal outcomes, and continuation closure are represented in W4. | `current-source` | `L-W4-README`, `L-W4-CONTRACT` | candidate implementation-conformance evidence, not canonical Workflow semantics |
| Persistence, transaction, and failure-outcome records are the prepared first system-integration slice. | `current-source` | `L-SIC-SEED`, `L-SIC-RESULT` | route blocked before Stage 1; package absent |
| Transport and delivery are separate from domain Event production and are deferred in Revision 2. | `current-source` | `L-SIC-SEED`, `L-SIC-RESULT`, `L-SIC-RESEARCH-T` | older research is candidate design, not admission |
| Poker Team demonstrates HOF injection, structural repositories, a UnitOfWork, and event callbacks without a container. | `current-source` | `L-POKER-REPO`, `L-POKER-UOW`, `L-POKER-EVENT`, `L-POKER-OP` | one project precedent, with known counterexamples |
| The Poker Team handoff gateway does not demonstrate a queue Transporter. | `local-inference` | `L-POKER-HANDOFF` | inferred from the exact implementation being a Drizzle insert |
| Operation and Workflow should use different APE property sets while sharing evaluation machinery. | `operator-reading` | `L-APE-SPEC`, `L-WF-CARD`, `L-W4-CONTRACT` | requires a later profile/property owner decision |
| HOF construction is sufficient for the proposed TypeScript injection mechanism. | `operator-reading` | `L-POKER-OP`, user direction | sufficient does not mean mandatory for every language/profile |
| Repository, UnitOfWork, Transporter, EventHandler, WorkflowStore, and Scheduler should remain distinct contracts. | `operator-reading` | local source set plus `E-CLOUDEVENTS`/`E-ASYNCAPI` | naming and exact shapes are profile-owned; WorkflowStore/Scheduler are still residue |
| A durable Workflow profile needs replay, checkpoint, and deterministic-effect boundaries. | `operator-reading` | `L-W4-CONTRACT`, `E-TEMPORAL` | do not universalize one workflow runtime's mechanism |
| A Workflow must not be treated as one distributed transaction. | `local-inference` | `L-SIC-RESEARCH-P`, `E-AWS-SAGA` | exact local transaction and compensation policy remain subject-specific |
| Loop or reduce spelling is not an architectural correctness property. | `local-inference` | `L-W4-TS`, `L-OP-FINDINGS`, `L-OP-AUDIT` | preceding Operation research is blocked; the bounded counterexample remains informative, not accepted authority |
