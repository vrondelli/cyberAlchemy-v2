# CyberAlchemy Orchestrator Definitions

Status: candidate Definition Pack projection  
Owner: CyberAlchemy Orchestrator definitions owner  
Authority effect: none

This file is the candidate normative vocabulary source for every context under
`cyberAlchemy-v2/orchestrator/`. It does not change the canonical CyberAlchemy
`CAV2-D*` source, promote itself, authorize implementation, or admit a runtime.

## Canonical CyberAlchemy dependencies

These meanings are reused by exact reference and are not redefined here.

| ID | Term | Use in the Orchestrator |
| --- | --- | --- |
| CAV2-D18 | Residue | Preserve meaningful unresolved work. |
| CAV2-D19 | Ontology | Type shared Orchestrator relationships. |
| CAV2-D26 | Append-Only Event Ledger | Ground append-only history behavior. |
| CAV2-D33 | Definition | Govern term meaning. |
| CAV2-D34 | Authority | Keep effect and decision rights explicit. |
| CAV2-D35 | Provenance | Bind definitions, inputs, and results to sources. |
| CAV2-D36 | Traceability | Connect intent, execution, evidence, and continuation. |
| CAV2-D37 | Gate | Represent governed decision boundaries. |
| CAV2-D38 | Claim-Proof Bound | Limit claims to evidence. |
| CAV2-D39 | Intent | Preserve user purpose before final form. |
| CAV2-D40 | Challenge Contract | Provide correction and refresh routes. |
| CAV2-D51 | Canonical Artifact | Keep candidate definitions separate from canon. |
| CAV2-D52 | Artifact Durability | Distinguish perennial contracts from run-local output. |
| CAV2-D56 | Schema | Define machine-checkable form. |
| CAV2-D58 | Constitution | Scope shared rulebooks. |
| CAV2-D59 | Goal | State desired future results and evidence. |
| CAV2-D60 | Project | Give the Orchestrator work a durable coordination identity. |
| CAV2-D61 | Research | Support research strategies without conflating findings. |
| CAV2-D62 | Experiment | Support bounded empirical runs. |
| CAV2-D63 | Product Thesis | Explain why the product exists and what constrains it. |
| CAV2-D65 | DomainSpec-Governed Construction Invariant | Keep Define, design, implementation, testing, and approval distinct. |
| CAV2-D66 | Context | Bind work to its applicable frame. |
| CAV2-D67 | Product Capability | Separate useful outcomes from implementations. |

## Orchestrator candidate definitions

## ORCH-D1: CyberAlchemy Orchestrator

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D1

**Definition.** The CyberAlchemy Orchestrator is a general agent-orchestration product that lets a participant author, review, admit, execute, observe, recover, and reuse bounded multi-agent and tool strategies through one control plane while preserving the distinct owners of meaning, effects, evidence, acceptance, and promotion.

**Formal interpretation.** `Orchestrator = authoring + admission + durable_execution + observation + recovery; authority_effect(Orchestrator) = none by identity`

**Plain language.** The product turns a reviewed strategy into a visible, recoverable run.

**Orchestrator context.** A user may create a two-lane dialectic, research swarm, software workflow, or other bounded strategy through the same contracts.

**Boundary.** The Orchestrator does not decide domain truth, grant effect authority, or make every worker result accepted.

**Sources.** predecessor-definitions, migration-plan.

## ORCH-D2: Local Orchestrator Edition

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D2

**Definition.** The Local Orchestrator Edition is the first supported deployment envelope: one trusted host, one logical accepted-history writer per run stream, file-backed durable records, and explicitly configured local or Gateway-backed adapters.

**Formal interpretation.** `LocalEdition = single_host + single_writer_per_stream + durable_files + configured_adapters`

**Plain language.** The first edition runs within one controlled host boundary.

**Orchestrator context.** A local operator can run and recover strategies while using optional remote model execution through an explicit Gateway adapter.

**Boundary.** Local does not imply production readiness, remote authentication, distributed consensus, or exactly-once external effects.

**Sources.** predecessor-definitions, merged-architecture.

## ORCH-D3: Run Bundle

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D3

**Definition.** A Run Bundle is an immutable content-addressed envelope binding one admitted strategy instance, compiled Work Graph, semantic work identity, run identity, limits, adapter requirements, inputs, authority references, engine version, and source digests.

**Formal interpretation.** `RunBundle = hash(strategy_instance, graph, work_identity, run_id, limits, adapters, inputs, authority_refs, engine_version, sources)`

**Plain language.** It freezes everything required to know what was admitted for one run.

**Orchestrator context.** The controller registers a run from the exact bytes of one bundle.

**Boundary.** A Run Bundle is not mutable runtime state, an attempt, a receipt, or evidence that execution occurred.

**Sources.** predecessor-definitions, merged-architecture.

## ORCH-D4: Semantic Work Identity

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D4

**Definition.** Semantic Work Identity is the stable identity of one immutable Work meaning and version, independent of its runs and attempts.

**Formal interpretation.** `SemanticWorkIdentity = hash(canonical_work_meaning, version)`

**Plain language.** It names the job as meant, regardless of how many times it runs.

**Orchestrator context.** A saved research strategy retains one meaning identity across distinct runs until meaning-changing bytes change.

**Boundary.** A retry does not create a new Semantic Work Identity; changed meaning does.

**Sources.** predecessor-definitions, bounded-work-definitions, merged-architecture.

## ORCH-D5: Orchestrator Run

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D5

**Definition.** An Orchestrator Run is one registered lifecycle of one exact Run Bundle under one stable run identity and admission reference.

**Formal interpretation.** `Run = (run_id, run_bundle_digest, admission_ref, lifecycle)`

**Plain language.** It is one managed journey of an admitted bundle.

**Orchestrator context.** The Control Center follows one run from admission through structural completion and lifecycle closeout.

**Boundary.** A run inherits neither acceptance nor external-effect authority from another run.

**Sources.** predecessor-definitions, merged-architecture.

## ORCH-D6: Execution Attempt

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D6

**Definition.** An Execution Attempt is one separately identified try to execute or reconcile one addressed Command Intent within a run.

**Formal interpretation.** `Attempt = (attempt_id, run_id, command_id, lease, fence, outcome?)`

**Plain language.** Every retry gets its own truthful identity and history.

**Orchestrator context.** A failed agent turn may lead to a new attempt with a new lease and fence.

**Boundary.** Retry, rerun, replay, resume, and reconciliation are distinct operations.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D7: Accepted Structural History

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D7

**Definition.** Accepted Structural History is the ordered append-only sequence of accepted structural events and their atomically bound cursors and complete command batches for one run stream.

**Formal interpretation.** `History[n+1] = History[n] append (event, next_cursor, command_batch)`

**Plain language.** It is the sole durable input from which structural progress is replayed.

**Orchestrator context.** The controller commits an accepted agent event and every resulting command together.

**Boundary.** It is not automatically domain truth, effect success, product acceptance, or a second lifecycle ledger.

**Sources.** predecessor-definitions, merged-architecture.

## ORCH-D8: Command Receipt

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D8

**Definition.** A Command Receipt is an immutable typed report binding the exact run, attempt, command, worker fence, executor, authority reference, inputs, outputs, proposed events, effect disposition, and observation times.

**Formal interpretation.** `Receipt = hash(run, attempt, command, fence, executor, inputs, outputs, proposed_events, effect, times)`

**Plain language.** It records exactly what a worker reports about one command attempt.

**Orchestrator context.** An agent adapter returns a receipt that the controller can validate before accepting any event.

**Boundary.** A valid receipt does not accept its event, judge its meaning, approve its result, or prove an external effect beyond its evidence.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D9: Reconciliation Decision

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D9

**Definition.** A Reconciliation Decision is an owner-issued digest-bound resolution of an interrupted attempt or unknown effect that states the known effect disposition and whether a distinct next attempt may proceed.

**Formal interpretation.** `ReconciliationDecision = owner_decision(command_digest, evidence_digest, effect_disposition, next_attempt_policy)`

**Plain language.** An owner resolves uncertainty the runtime cannot safely guess about.

**Orchestrator context.** After a worker disconnects during an external action, the effect owner decides whether a retry is safe.

**Boundary.** Lease expiry, timeout, scheduler preference, or process exit cannot create this decision.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D10: Lifecycle Ledger

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D10

**Definition.** A Lifecycle Ledger records execution, structural closeout, result acceptance, promotion, release, and deployment as separate ordered facts with independent prerequisites and owners.

**Formal interpretation.** `LifecycleLedger = ordered_facts(execution, closeout, acceptance, promotion, release, deployment)`

**Plain language.** It prevents one successful stage from pretending later decisions happened.

**Orchestrator context.** A completed research run can remain unaccepted and undeployed.

**Boundary.** A generic PASS value cannot represent every lifecycle stage.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D11: Current-State Projection

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D11

**Definition.** A Current-State Projection is a rebuildable non-authoritative read model combining run identity, structural state, pending commands, attempts, leases, receipts, blockers, costs, and lifecycle facts with provenance.

**Formal interpretation.** `Projection = project(AcceptedHistory, Receipts, Coordination, LifecycleLedger)`

**Plain language.** It is the operator view reconstructed from preserved records.

**Orchestrator context.** The run page shows current progress and links every statement to its source record.

**Boundary.** The projection cannot schedule, accept history, repair state, grant authority, or rewrite its sources.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D12: Orchestration Lab

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D12

**Definition.** The Orchestration Lab is the explicitly non-operational area containing examples, research strategies, fixtures, witness results, and diagnostic visualizations used to learn about Orchestrator behavior.

**Formal interpretation.** `LabArtifacts subset CandidateEvidence; authority_effect = none`

**Plain language.** It is the workshop for trying and explaining strategies.

**Orchestrator context.** Robot Talks and Robot World fixtures can demonstrate generic contracts without becoming product modes.

**Boundary.** A Lab PASS is not product acceptance, release, deployment, provider quality, or production readiness.

**Sources.** predecessor-definitions, migration-plan.

## ORCH-D13: Effect Disposition

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner
Predecessor: cya-orquestrator product/orchestrator ORCH-D13

**Definition.** Effect Disposition is an evidence-supported statement that an addressed command’s external effect is not_applied, applied, or unknown.

**Formal interpretation.** `EffectDisposition in {not_applied, applied, unknown}; unknown => retry_blocked`

**Plain language.** It says what is actually known about a consequence outside the Orchestrator.

**Orchestrator context.** Recovery keeps a command blocked while its external write remains unknown.

**Boundary.** Effect disposition is not inferred solely from exit status, timeout, missing receipt, or cancellation request.

**Sources.** predecessor-definitions, merged-architecture, runtime-types.

## ORCH-D14: Strategy

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Strategy is a declarative, versioned coordination design that specifies an intended outcome, lanes, Work composition, policies, limits, evidence expectations, and result reduction without admitting or executing a run.

**Formal interpretation.** `Strategy = (outcome, lanes, work, policies, limits, evidence, reduction)`

**Plain language.** It describes how participants should work together for a class of problems.

**Orchestrator context.** A dialectic strategy defines two opposing lanes and a synthesis step.

**Boundary.** A Strategy is not a running DAG, worker assignment, authority grant, or accepted conclusion.

**Sources.** native-dispatch-schema, dispatch-template-plan, migration-plan.

## ORCH-D15: Strategy Template

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Strategy Template is a reusable parameterized Strategy definition with declared input fields, defaults, constraints, compatibility requirements, and version identity.

**Formal interpretation.** `StrategyTemplate(parameters) -> StrategyInstance | validation_error`

**Plain language.** It is a reusable recipe for creating a concrete strategy.

**Orchestrator context.** The user saves a two-lane dialectic template and later supplies a new question.

**Boundary.** A template is not a concrete dispatch, run, mutable form state, or proof that the strategy is effective.

**Sources.** native-dispatch-schema, dispatch-template-plan, migration-plan.

## ORCH-D16: Template Version

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Template Version is the immutable identity and compatibility contract of one exact Strategy Template state.

**Formal interpretation.** `TemplateVersion = hash(template_semantics, parameter_schema, compatibility)`

**Plain language.** It pins the exact reusable recipe used to create a proposal.

**Orchestrator context.** Existing runs continue to name version 1 after version 2 changes its lanes.

**Boundary.** A display-name edit may be metadata; a meaning-changing edit requires a new version.

**Sources.** native-dispatch-schema, dispatch-template-plan.

## ORCH-D17: Template Instantiation

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** Template Instantiation is the deterministic binding of validated parameter values and selected compatible adapters to one Template Version, producing a Strategy instance or validation failure.

**Formal interpretation.** `instantiate(template_version, parameters, adapter_refs) -> strategy_instance`

**Plain language.** It fills a reusable recipe with concrete values before review.

**Orchestrator context.** A user supplies the idea, budget, and agent profiles for a dialectic template.

**Boundary.** Instantiation does not admit, dispatch, execute, or grant authority.

**Sources.** native-dispatch-schema, dispatch-template-plan.

## ORCH-D18: Dispatch Proposal

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Dispatch Proposal is a reviewable concrete orchestration proposal that binds a Strategy instance, compiled preview, lane and agent requirements, limits, adapters, inputs, evidence expectations, and requested authority references.

**Formal interpretation.** `DispatchProposal = review(strategy_instance, graph_preview, requirements, limits, adapters, inputs, authority_refs)`

**Plain language.** It is the exact plan shown before a run is admitted.

**Orchestrator context.** Control Center shows the two lanes, four agents, synthesis step, budget, and boundaries for approval.

**Boundary.** A proposal is not admission, execution, an effect authorization, or a worker command.

**Sources.** native-dispatch-schema, dispatch-template-plan, migration-plan.

## ORCH-D19: Run Admission

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** Run Admission is the owner-controlled decision that one exact Dispatch Proposal may be materialized as a Run Bundle and registered as an Orchestrator Run within stated limits.

**Formal interpretation.** `admit(proposal_digest, owner, conditions) -> RunBundle | reject`

**Plain language.** It turns a reviewed proposal into a registered run contract.

**Orchestrator context.** The operator admits the exact strategy bytes and budget shown in Control Center.

**Boundary.** Admission does not authorize undeclared external effects, accept future results, or promote artifacts.

**Sources.** native-dispatch-schema, dispatch-template-plan, merged-architecture.

## ORCH-D20: Lane

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Lane is a named logical coordination channel within a Strategy that groups Work by role, concern, stance, ordering, or reduction relationship.

**Formal interpretation.** `Lane = (lane_id, role_or_concern, work_refs, join_or_reduction)`

**Plain language.** It explains why a group of tasks exists and how it relates to other groups.

**Orchestrator context.** Constructive and adversarial agents occupy separate tension lanes before synthesis.

**Boundary.** A Lane is not a worker process, queue partition, permission boundary, or physical location.

**Sources.** native-dispatch-schema, dispatch-template-plan.

## ORCH-D21: Agent Assignment

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Agent Assignment is the versioned binding of one agent identity and declared capabilities to one addressed Command Intent, lane, and Execution Attempt.

**Formal interpretation.** `Assignment = (agent_ref, capability_refs, command_id, lane_id?, attempt_id)`

**Plain language.** It says which agent is asked to do which exact work this time.

**Orchestrator context.** A research agent is assigned to the constructive lane for attempt 2.

**Boundary.** Assignment does not prove capability quality, transfer domain authority, or authorize effects beyond the command envelope.

**Sources.** native-dispatch-schema, dispatch-template-plan, merged-architecture, runtime-types.

## ORCH-D22: Work Definition

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Work Definition is an immutable versioned description of one typed unit of Work, its input and output contracts, body, limits, authority requirements, and completion events.

**Formal interpretation.** `WorkDefinition = (identity, input, output, body, limits, authority_requirements, completion_events)`

**Plain language.** It is the stable structural meaning of one task or composite.

**Orchestrator context.** The same synthesis Work Definition can appear in many Strategy instances.

**Boundary.** It is not a mutable run, attempt, permission grant, worker, or implementation process.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D23: Composite Work

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** Composite Work is a Work Definition whose body contains a bounded composition of other Work Definitions while preserving the same external input, output, event, and identity contract as leaf Work.

**Formal interpretation.** `CompositeWork is WorkDefinition where body = bounded_composition(WorkDefinition*)`

**Plain language.** A workflow can be reused wherever a single task can be used.

**Orchestrator context.** A research lane can contain search, critique, and report Work yet expose one result contract.

**Boundary.** Composite Work does not create unbounded recursion, child authority, or a second root history owner.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D24: Work Graph

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Work Graph is a validated versioned structural composition of Work Nodes and Work Connections with explicit mappings, release policies, roots, terminals, and bounds.

**Formal interpretation.** `WorkGraph = DAG(nodes, connections, mappings, release_policies, roots, terminals, bounds)`

**Plain language.** It is the executable structural form compiled from a Strategy and Work definitions.

**Orchestrator context.** The graph fans four agents out, joins their reports, then releases synthesis.

**Boundary.** It is not runtime state, domain truth, communication permission, or an independently authored replacement for its source.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D25: Work Node

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Work Node is one addressed occurrence of a Work Definition within a Work Graph with graph-local identity, bindings, dependencies, and release configuration.

**Formal interpretation.** `WorkNode = (node_id, work_definition_ref, bindings, dependencies, release_policy)`

**Plain language.** It is one placement of reusable Work inside a graph.

**Orchestrator context.** Two lanes may use the same analyst Work Definition through distinct nodes.

**Boundary.** A node is not the reusable Work Definition, worker, attempt, or result.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D26: Work Connection

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Work Connection is a typed directed relation that maps one declared Structural Event or output reference from a source node to a target node input or release condition.

**Formal interpretation.** `Connection = (source_node, event_or_output, target_node, mapping, condition)`

**Plain language.** It is the labeled wire that carries structural progress between nodes.

**Orchestrator context.** A completed critique event contributes one input to a quorum synthesis join.

**Boundary.** A connection does not transfer domain authority, prove payload truth, or execute the target.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D27: Release Policy

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Release Policy is the declared deterministic rule—such as all, any, or quorum—that decides when a Work Node becomes structurally eligible from accepted predecessor outcomes.

**Formal interpretation.** `eligible(node) = policy(accepted_predecessor_outcomes); policy in {all, any, quorum(k), explicit_gate}`

**Plain language.** It states how much accepted predecessor progress is enough to release a node.

**Orchestrator context.** Synthesis requires all four lane reports, while a fallback may accept any successful provider.

**Boundary.** Release eligibility is not scheduling priority, domain approval, result acceptance, or effect authority.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D28: Event Proposal

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Event Proposal is a worker-reported typed candidate fact linked to one command, attempt, fence, outputs, and evidence for validation by the Orchestrator Runtime.

**Formal interpretation.** `EventProposal = (event_type, payload_ref, command_id, attempt_id, fence, evidence_refs)`

**Plain language.** It is what a worker asks the controller to consider as having happened.

**Orchestrator context.** An agent receipt proposes ReportProduced with the report digest.

**Boundary.** A proposed event has not entered Accepted Structural History and cannot advance RWO.

**Sources.** merged-architecture, runtime-types.

## ORCH-D29: Accepted Structural Event

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Accepted Structural Event is an Event Proposal that passed the runtime’s identity, schema, attempt, fence, authority-reference, and duplicate/conflict checks and was atomically appended with its Structural Transition.

**Formal interpretation.** `AcceptedEvent = validate(EventProposal, run, attempt, fence, schema, authority_refs)`

**Plain language.** It is the structural fact RWO is allowed to use.

**Orchestrator context.** The controller accepts ReportProduced and commits the resulting cursor and synthesis command.

**Boundary.** Acceptance for structural routing is not domain truth, result approval, or proof of an external effect.

**Sources.** merged-architecture, runtime-types.

## ORCH-D30: Structural Transition

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Structural Transition is the pure deterministic result of applying one Accepted Structural Event to one Work Graph and Orchestration Cursor, yielding the next cursor and complete zero-or-more Command Intent batch.

**Formal interpretation.** `transition(graph, cursor, accepted_event) -> (next_cursor, command_intents[]) | structural_error`

**Plain language.** It is RWO’s answer to “what becomes structurally ready next?”

**Orchestrator context.** The fourth accepted lane report closes a quorum and releases one synthesis command.

**Boundary.** A transition does not persist itself, execute commands, judge outputs, or grant authority.

**Sources.** merged-architecture, runtime-types.

## ORCH-D31: Orchestration Cursor

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Orchestration Cursor is the rebuildable versioned structural projection of satisfied connections, node outcomes, released nodes, issued command identities, and terminal state for one run.

**Formal interpretation.** `Cursor = fold(WorkGraph, AcceptedStructuralHistory)`

**Plain language.** It is the compact structural position that replay can reconstruct.

**Orchestrator context.** Recovery rebuilds the cursor from accepted history and compares it with stored state.

**Boundary.** The cursor is not authoritative domain state, a scheduler queue, approval, or lifecycle acceptance.

**Sources.** bounded-work-definitions, merged-architecture, runtime-types.

## ORCH-D32: Command Intent

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Command Intent is an immutable addressed request produced by a Structural Transition that names the Work Node, inputs, limits, required capabilities, authority references, and expected receipt/event contract.

**Formal interpretation.** `CommandIntent = (command_id, node_id, input_refs, limits, capability_requirements, authority_refs, receipt_contract)`

**Plain language.** It describes an action the runtime may schedule.

**Orchestrator context.** RWO emits one command asking a compatible agent to synthesize four reports.

**Boundary.** A Command Intent is not execution, assignment, a lease, a successful effect, or permission beyond its referenced envelope.

**Sources.** merged-architecture, runtime-types.

## ORCH-D33: RWO Core

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** RWO Core is the internal independently tested package that owns Work composition, graph validation, Structural Event reduction, cursor semantics, release policies, command generation, and engine-version replay compatibility.

**Formal interpretation.** `RWOCore = compile(WorkDefinition*, Strategy) + transition(WorkGraph, Cursor, AcceptedEvent)`

**Plain language.** It is the pure structural kernel reused by the Orchestrator Runtime.

**Orchestrator context.** The runtime calls RWO Core after validating an event and before atomically storing the transition.

**Boundary.** RWO Core does not own storage, scheduling, workers, providers, frontend, ARE, domain meaning, lifecycle acceptance, or external effects.

**Sources.** merged-architecture, migration-plan.

## ORCH-D34: Orchestrator Runtime

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** The Orchestrator Runtime is the durable control-plane implementation that owns run registration, accepted-history transactions, attempts, leases, scheduling, receipts, recovery, lifecycle records, APIs, and adapter coordination while calling RWO Core for structural decisions.

**Formal interpretation.** `Runtime = controller + history_port + scheduler + coordination + recovery + lifecycle + API + adapters`

**Plain language.** It makes admitted strategies run durably and visibly.

**Orchestrator context.** The runtime validates an agent receipt, asks RWO Core for the transition, stores it, and schedules resulting commands.

**Boundary.** The runtime does not redefine RWO semantics, domain truth, product definitions, or owner authority.

**Sources.** merged-architecture, runtime-types.

## ORCH-D35: Accepted-History Port

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** The Accepted-History Port is the sole runtime interface authorized to atomically accept an expected cursor, one Accepted Structural Event, the next cursor, and the complete Command Intent batch for one stream.

**Formal interpretation.** `accept(expected_cursor, event, next_cursor, commands) -> Accepted | Duplicate | Conflict`

**Plain language.** It is the one door through which structural history advances.

**Orchestrator context.** The file-backed implementation rejects a stale cursor instead of splitting event and command state.

**Boundary.** An implementation of the port is not a second reducer, domain ledger, or lifecycle decision store.

**Sources.** merged-architecture, runtime-types.

## ORCH-D36: Worker

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Worker is an addressed runtime participant that accepts a Command Intent through a declared adapter and returns a typed Command Receipt.

**Formal interpretation.** `Worker: CommandIntent -> CommandReceipt`

**Plain language.** It is anything the scheduler can ask to perform one bounded command.

**Orchestrator context.** A local process, tool adapter, model-backed agent, or human-task adapter may act as a Worker.

**Boundary.** Worker identity does not imply intelligence, authority, capability quality, or successful execution.

**Sources.** merged-architecture, runtime-types.

## ORCH-D37: Agent

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Agent is a Worker whose command execution includes a bounded reasoning or policy process over supplied context and declared capabilities.

**Formal interpretation.** `Agent subset Worker; execute = reason_or_apply_policy(context, command, limits)`

**Plain language.** It is a reasoning-capable worker operating inside the same checked boundary as other workers.

**Orchestrator context.** An ARE Gateway-backed agent produces a structured report and proposed event for one command.

**Boundary.** An Agent cannot mutate the DAG, accept its own event, grant authority, or declare its result true by producing it.

**Sources.** merged-architecture, runtime-types.

## ORCH-D38: Agent Capability

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Agent Capability is a versioned declaration of an operation an Agent can attempt, together with input, output, limit, evidence, and compatibility contracts.

**Formal interpretation.** `AgentCapability = (capability_id, version, input_contract, output_contract, limits, evidence_contract, compatibility)`

**Plain language.** It tells the scheduler what kind of work an agent claims it can receive.

**Orchestrator context.** A research capability declares web-retrieval outputs and budget obligations.

**Boundary.** A capability declaration is not permission, availability, quality evidence, assignment, or authority.

**Sources.** merged-architecture, runtime-types, native-dispatch-schema, dispatch-template-plan.

## ORCH-D39: Agent Turn

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Agent Turn is one bounded request-response interaction with an Agent within one Execution Attempt, carrying exact command, context, tool, budget, and result references.

**Formal interpretation.** `AgentTurn = (turn_id, attempt_id, request_digest, context_refs, tool_policy, budget, response_digest)`

**Plain language.** It is one traceable reasoning interaction inside an attempt.

**Orchestrator context.** The Gateway receives a prompt and returns one structured report for the assigned lane.

**Boundary.** A turn is not the entire attempt, agent identity, accepted event, conversation authority, or persistent memory by default.

**Sources.** merged-architecture, runtime-types.

## ORCH-D40: Capability Adapter

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Capability Adapter is a versioned boundary that translates one Command Intent into a selected worker or provider protocol and translates its output into a Command Receipt without changing structural meaning.

**Formal interpretation.** `Adapter(command_intent) -> protocol_request; protocol_response -> receipt`

**Plain language.** It connects the runtime to a concrete executor while preserving contracts.

**Orchestrator context.** A Gateway adapter maps an agent command to the remote API and returns a typed receipt.

**Boundary.** An adapter does not select domain meaning, broaden authority, manufacture evidence, or alter the Work Graph.

**Sources.** merged-architecture, runtime-types.

## ORCH-D41: Worker Lease

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Worker Lease is a time-bounded exclusive claim that allows one Worker to perform one Execution Attempt for an addressed Command Intent.

**Formal interpretation.** `Lease = (command_id, attempt_id, worker_id, issued_at, expires_at)`

**Plain language.** It prevents multiple workers from treating the same command as their active attempt.

**Orchestrator context.** The scheduler leases a synthesis command to one agent until its deadline.

**Boundary.** A lease is not external-effect authority, proof of liveness, result acceptance, or permission after expiry.

**Sources.** merged-architecture, runtime-types.

## ORCH-D42: Worker Fence

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Worker Fence is a monotonic attempt token bound to a Worker Lease that lets the runtime reject stale or superseded receipts.

**Formal interpretation.** `valid(receipt) iff receipt.fence = current_fence(command_id)`

**Plain language.** It makes an old worker unable to finish a newer attempt accidentally.

**Orchestrator context.** A late receipt from attempt 1 is rejected after attempt 2 receives a higher fence.

**Boundary.** A fence does not cancel an external effect already applied or prove what happened outside the runtime.

**Sources.** merged-architecture, runtime-types.

## ORCH-D43: Recovery Assessment

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Recovery Assessment is the deterministic classification of persisted run, history, transaction, lease, receipt, and effect evidence after interruption into resumable, completed, conflicted, or owner-reconciliation-required state.

**Formal interpretation.** `assess(persisted_evidence) -> resumable | completed | conflict | reconciliation_required`

**Plain language.** It determines what the runtime can safely know after restart.

**Orchestrator context.** Startup replay finds an issued command with unknown effect and blocks it for owner resolution.

**Boundary.** An assessment does not repair state, choose an owner decision, or infer unknown external effects.

**Sources.** merged-architecture, runtime-types.

## ORCH-D44: Recovery Action

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Recovery Action is an explicit digest-bound next operation selected from a Recovery Assessment, such as resume scheduling, accept a recorded event, quarantine a result, or request reconciliation.

**Formal interpretation.** `RecoveryAction = select(assessment_digest, allowed_actions, owner_decision?)`

**Plain language.** It is the reviewable next step after recovery analysis.

**Orchestrator context.** The operator accepts a recorded event after verifying its receipt and evidence.

**Boundary.** A Recovery Action cannot exceed its assessment, erase history, reuse an attempt identity, or invent effect certainty.

**Sources.** merged-architecture, runtime-types.

## ORCH-D45: Control Center

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** The Control Center is the operator-facing application for authoring strategies, reviewing dispatch proposals, starting and observing runs, inspecting provenance, handling recovery, and reusing templates through the Orchestrator APIs.

**Formal interpretation.** `ControlCenter = command_views(API) + read_views(CurrentStateProjection)`

**Plain language.** It is the human control surface for the Orchestrator.

**Orchestrator context.** A user creates a strategy in chat, reviews its lanes, starts it, and opens the resulting run page.

**Boundary.** The Control Center is not an authority source, transition engine, accepted-history writer, or substitute for underlying records.

**Sources.** migration-plan, native-dispatch-schema, dispatch-template-plan.

## ORCH-D46: Run Template

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Run Template is a saved user-facing preset that selects one Strategy Template version plus default parameters, adapters, limits, presentation metadata, and admission prompts for repeat dispatch.

**Formal interpretation.** `RunTemplate = (strategy_template_version, defaults, adapter_defaults, limits, presentation, admission_prompts)`

**Plain language.** It is the button-ready configuration used to create a familiar dispatch proposal.

**Orchestrator context.** The “two-lane dialectic” button preselects four agents, two tension pairs, synthesis, and budget defaults.

**Boundary.** A Run Template is not a Strategy Template version, admitted Run Bundle, running job, or authority grant.

**Sources.** native-dispatch-schema, dispatch-template-plan, migration-plan.

## ORCH-D47: Domain Gate

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Domain Gate is a domain-owned decision boundary represented structurally as Work that emits one declared route outcome while retaining the decision’s meaning, evidence, and authority outside RWO.

**Formal interpretation.** `DomainGate(evidence, owner_policy) -> declared_route_event`

**Plain language.** It lets domain decisions control flow without giving the graph ownership of the decision.

**Orchestrator context.** A research quality owner emits accepted, revise, or reject for a synthesis artifact.

**Boundary.** A route label is not the semantic verdict, authority grant, or downstream effect permission.

**Sources.** bounded-work-definitions, merged-architecture.

## ORCH-D48: Outcome Reference

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** An Outcome Reference is an immutable content-addressed pointer to a worker or strategy output and its media type, schema, provenance, and storage location.

**Formal interpretation.** `OutcomeRef = (digest, media_type, schema_ref, provenance_ref, locator)`

**Plain language.** It lets commands and results refer to outputs without placing bulk content in structural events.

**Orchestrator context.** A report event carries the digest and location of the Markdown report.

**Boundary.** A reference is not the output content, proof of correctness, acceptance, or publication.

**Sources.** merged-architecture, runtime-types.

## ORCH-D49: Strategy Result

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Strategy Result is the orchestrator-owned closeout view that binds terminal structural state to selected Outcome References, provenance, unresolved residue, and lifecycle status for one run.

**Formal interpretation.** `StrategyResult = (run_id, terminal_state, outcome_refs, provenance, residue, lifecycle_refs)`

**Plain language.** It presents what the strategy produced and what remains unresolved.

**Orchestrator context.** A dialectic result links both tension reports, synthesis, audit findings, and open questions.

**Boundary.** A Strategy Result does not make its claims true, accepted, promoted, published, or externally effective.

**Sources.** native-dispatch-schema, dispatch-template-plan, merged-architecture, runtime-types.

## ORCH-D50: Capacity Reservation

Status: candidate  
Disposition: propose  
Owner: CyberAlchemy Orchestrator definitions owner

**Definition.** A Capacity Reservation is a bounded temporary claim against declared scheduler capacity for one pending or active assignment.

**Formal interpretation.** `CapacityReservation = (resource_class, quantity, command_id, attempt_id, expires_at)`

**Plain language.** It prevents dispatch from exceeding configured concurrent work limits.

**Orchestrator context.** Starting an agent attempt reserves one model-worker slot until completion or lease expiry.

**Boundary.** Capacity reservation is not a worker lease, provider quota guarantee, cost approval, or effect authority.

**Sources.** merged-architecture, runtime-types.

## Promotion rule

These `ORCH-D*` entries remain candidates until the Orchestrator definitions owner accepts exact bytes through the configured definition-governance route. Validation checks structure and synchronization only.

## Open Questions

- Should a future remote or distributed edition receive a separate definition from Local Orchestrator Edition?
- Which agent identity contract will distinguish model, persona, provider account, and runtime worker identity?
- Which persisted engine versions must remain replayable after the legacy repositories are retired?
- Should human-task adapters be included in the first supported Worker contract?
- Which owner may publish a Strategy Template for reuse beyond one private repository?
