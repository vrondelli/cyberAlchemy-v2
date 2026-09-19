---
title: RWO-Controlled DomainSpec L0 Construction Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner plus work-orchestration owner
scope: capability-composition
authority_effect: none
---

# RWO-Controlled DomainSpec L0 Construction

This plan composes one RWO root scheduler, the C19 continuous-construction evaluator, and the DomainSpec backend L0 work graph. The two logical graphs are compiled into one physical RWO DAG; C19 remains a no-effect gate and never becomes a second scheduler.

## Context

- Target: controlled completion of the DomainSpec L0 Rule vertical.
- Current state: the L0 work DAG is structurally valid but not C19-stage compatible; RWO is selected and locally tested, while the generic system ontology and local runtime binding remain candidate surfaces.
- Operator: the owner of one explicitly authorized bounded DomainSpec construction attempt.
- Primary constraint: one root scheduling authority, exact D65 predecessor continuity, and no execution without an exact gate and work-node authority envelope.
- Immutable DomainSpec predecessor: `domainspec-meta-types-current-implemented@10` at `bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda`.

Source references:

- `projects/domainspec-v2/development/backend-cli-completion/layers/L0-semantic-pattern-proof/execution-dag.json`
- `cyberAlchemy-v2/work-orchestration/product-capability.json`
- `cyberAlchemy-v2/work-orchestration-implementation/bindings.json`
- `cyberAlchemy-v2/work-orchestration-implementation/schemas/rwo-dag-definition.schema.json`
- `cyberAlchemy-v2/work-orchestration-implementation/runtime/src/dag.rs`
- `cyberAlchemy-v2/work-orchestration-implementation/runtime/src/host.rs`
- `cyberAlchemy-v2/ontology/governance/continuous-construction/programs/continuous-construction.program.json`
- `cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/continuous-construction-task-loop/interface-contract.json`

## Governing Architecture

```text
one RWO root scheduler and one AcceptedHistoryPort stream
  -> C19 stage gate
  -> one or more bounded DomainSpec work nodes
  -> exact stage-evidence checkpoint
  -> next C19 stage gate
  -> ...
  -> immutable terminal packet
```

- RWO owns graph validation, structural release, retry bounds, deadline, cursor transition, and accepted structural history.
- C19 owns only the no-effect D65 continuation evaluation.
- DomainSpec owns Rule meaning, compiled-graph obligations, generation, and verification.
- The native host owns actual repository mutation and the mandatory exact-binding helper dispatch.
- No graph edge transfers domain, communication, credential, publication, or external-effect authority.

## D65 Composition Chain

| Stage | Selected input or required successor |
|---|---|
| Canonical definitions | CAV2-C19 candidate rule, CAV2-D65, CAV2-D67, DS-D1 Rule, and applicable DS-D8 selectors. |
| Product Capability | Primary scheduler outcome: adopted `CA2-CAP-EXECUTE-BOUNDED-COMPOSITE-WORK`; collaborating outcomes: adopted offline task-loop composition and adopted `domainspec.meta-type-semantic-enforcement`. A preflight must prove that this is composition, not an unowned new product outcome. |
| Capability-local business ontology | Exact selected records from `cav2.work-orchestration.business`, the accepted offline task-loop ontology, and `domainspec.meta-type-semantic-enforcement-ontology@1`. |
| DomainSpec v2 authored source | A new project-local controlled-construction workflow that references the exact L0 work manifest and gate/work/checkpoint contracts. |
| Compiled graph and system ontology | Deterministic flattened RWO graph with C19 gates and L0 work nodes; no nested scheduler. |
| Exact implementation binding | DAG compiler, C19 gate adapter, repository-work adapter, accepted-history host binding, and generic contained CLI. Exactly one bounded native helper authors and self-validates the candidate. |
| Conformance evidence | Schema/graph mutants, gate-bypass mutants, source/digest sensitivity, replay, failure propagation, no-effect dry run, one read-only node, and later an explicitly authorized mutation run. |

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Risk reduced | Main cost | Promotion |
|---|---|---|---|---|---|---|
| L0 | After this layer, we know whether C19 and the L0 work graph can be compiled into one deterministic no-effect RWO graph. | Compiler, fixtures, simulated gates/work, replay | Inspect one composite cursor and receipt | Dual-scheduler and stage-identity risk | Contracts, compiler, fixtures, hostile tests | Continue only if every work node is gate-dominated and replay is identical. |
| L1 | After this layer, we know whether the composition can safely execute one real read-only L0 node. | `L0-B00-01` through the contained host | Obtain the real requirement manifest and structural receipt | Executor/path/toolchain integration risk | Repository adapter and read-only containment | Continue only if declared reads and outputs are exact and no repository bytes change. |
| L2 | After this layer, we know whether the controller can finish the bounded L0 Rule construction without bypassing D65 or native-helper gates. | Reordered full L0 graph, exact binding handoff, validation joins | One controlled L0 completion receipt | Mutation, helper, evidence, and promotion-inflation risk | Full adapters, owner gate, implementation, review | Continue only if all L0 nodes close and `@10` remains unchanged. |
| L3 | After this layer, we know whether controlled construction survives process loss and can support later backend layers. | Durable accepted history and restart/resume | Resume exact pending work without duplicate mutation | Crash and ambiguous-history risk | Durable store, reconciliation, leases, recovery tests | Adopt only through separate system-ontology, binding, and runtime decisions. |

## L0 — Offline Composite Proof

Included:

- Freeze exact source/digest identities for the three capabilities and their selected ontology records.
- Define one canonical stage vocabulary matching the C19 program.
- Split the current L0 node metadata into `governance_stage`, `d65_dependencies`, and work-node fields.
- Compile stage gates, work nodes, and stage checkpoints into the RWO schema.
- Simulate C19 `CONTINUE`, `STOP`, mismatched stage, stale digest, missing gate, and changed work manifest.
- Replay the accepted event sequence to an identical cursor.

Deferred:

- Repository mutation, native helper dispatch, live Codex integration, durable history, credentials, publication, deployment, or external effects.

Exit evidence:

- Every work node is dominated by exactly one applicable C19 gate and contributes to one stage checkpoint.
- The output is acyclic, bounded, deterministic, and contains one root scheduler.
- A gate failure makes dependent work impossible or `not_evaluable` with a causal reason.
- No simulated result can authorize successor execution or an external effect.

## L1 — One Real Read-Only Node

Included:

- Execute `L0-B00-01` only.
- Use an exact toolchain and repository root.
- Permit declared reads and one contained run-output location.
- Record input, output, command, and selected-source digests.

Deferred: all mutation nodes and all later L0 work.

Promotion: continue only if the node result matches direct execution, replay is identical, and the repository worktree is byte-identical before and after.

## L2 — Full Controlled L0 Construction

Included:

- Reorder work beneath the exact C19 stage sequence.
- Stop at the exact implementation-binding owner gate.
- Use one native helper for candidate binding authorship and self-validation; parent joins and closes it.
- Resume only within the unchanged authorization envelope.
- Run hostile, native-equivalence, CLI replay, independent review, and final evidence join.

Deferred: L1 backend completion, durable orchestration, production, publication, and deployment.

Promotion: L0 completion requires every required node to pass, every dependent node to be represented, independent review to have no blocker finding, and baseline `@10` to retain its protected digest.

## L3 — Durable Resume and Reuse

Included:

- Select one durable AcceptedHistoryPort implementation.
- Prove atomic cursor/event/command persistence, idempotent recovery, conflict detection, and restart from fresh processes.
- Parameterize the controlled construction graph for later DomainSpec backend layers without widening authority.

Deferred: multi-host scheduling, live model endpoints, production deployment, and external-effect automation until separately authorized.

## Non-Regression Guardrails

- Exactly one RWO scheduler owns structural release for one stream.
- C19 remains a no-effect evaluator; `CONTINUE` is necessary but never sufficient authority by itself.
- RWO does not decide DomainSpec semantic truth or accept its own history.
- The native host never executes a node outside its exact read/write/effect envelope.
- Later stages cannot cure skipped, stale, ambiguous, or failed predecessors.
- Baseline `@10` remains immutable.
- Candidate plans, graphs, tests, and receipts do not grant admission, acceptance, release, deployment, or external effects.

## Recommended Next Layer

Execute only orchestration L0: create the composition contracts, successor stage map, compiler, and no-effect fixtures. Do not connect repository mutation until the flattened graph proves gate domination, exact-stage agreement, deterministic replay, and causal failure propagation.
