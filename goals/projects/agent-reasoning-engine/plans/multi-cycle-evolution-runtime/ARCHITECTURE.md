# ARE multi-cycle evolution runtime implementation architecture

Status: candidate implementation architecture; PL-06R-A selected; P3 implemented under PL-06-A  
Project: `CA2-PROJECT-AGENT-REASONING-ENGINE`  
Goal: `CA2-GOAL-AGENT-REASONING-ENGINE-MULTI-CYCLE-EVOLUTION-RUNTIME`  
Authority effect: none

## Purpose

This document records the implementation boundary selected by `PL-06R-A` and
realized under `PL-06-A`. The existing Recursive Work Orchestrator (RWO) package is reference
and conformance evidence. It is not a runtime dependency, a second executor, or
an accepted-history owner for the ARE multi-cycle evolution runtime.

## Selected architecture

```text
Cycle definition + phase policy
              |
              v
Research Work Plan ---- exact task declarations and evidence criteria
              |
              v
Research DAG ---------- informational dependency projection
              |
              v
P3 coordinator -------- derives ready work, selects callers, manages leases,
              |         recovery, accounting, settlement and handoff offers
              v
P2 durable kernel ----- sole command/event/receipt authority and state owner
              |
              +--------> rebuildable projections and disposable SQLite index
              |
              v
Worker adapter -------- executes only an admitted immutable assignment
              |
              v
Structured outcome ---- proposed back to P3; never mutates state directly
```

The P3 coordinator is implemented natively inside the Node
`@cyberalchemy/evolution-runtime` package. Every durable transition crosses the
P2 command boundary and is committed by the P2 kernel. An agent or adapter may
propose work or an outcome, but cannot accept its own event, assign projection
state, settle a lease, or authorize an effect.

## RWO use boundary

P3 may reuse these RWO ideas as design and test evidence:

- one root execution authority per work stream;
- deterministic structural reduction and replay;
- command intents derived from accepted state rather than worker claims;
- compare-bound acceptance and divergent-duplicate rejection;
- atomic treatment of an accepted event, next structural state, and derived
  command intents;
- separation among structural coordination, domain validation, execution, and
  effect authorization.

P3 must not import or operate these RWO components as authorities:

- `FileAcceptedHistory` or `InMemoryAcceptedHistory`;
- the Rust `DagEngine` as a parallel scheduler;
- RWO cursor state as a competing projection;
- `StructuredAgentShell` as an automatically enabled dispatcher; or
- the RWO ETL, micro-swarm, provisioning, or transport fixtures.

The direct package dependency is rejected for P3 because it would require a
Node-to-Rust adapter, translate the Research Work Plan into a second DAG model,
and introduce another accepted-history abstraction. It would still not supply
P3 leases, phase admission, accounting, typed handoffs, or evidence-bound
settlement.

## Ownership table

| Concern | Owner | Constraint |
| --- | --- | --- |
| Task meaning and completion criteria | Research Work Plan plus cycle-specific validator | Immutable for an admitted phase |
| Dependency explanation | Research DAG | Informational; never scheduling or effect authority |
| Ready-work derivation | P3 coordinator | Derived from current P2 projection and exact plan version |
| Selection among ready tasks | Calling agent | Proposal with rationale only |
| Lease, expiry and fencing | P3 coordinator through P2 commands | Durable; recovery precedes redispatch |
| Events, receipts and revision | P2 durable kernel | Sole authoritative journal |
| Accounting and settlement | P3 coordinator through P2 commands | Exactly one durable settlement per admitted work item |
| Artifact bytes | P2 content-addressed object store | Bound by digest and referenced from events/receipts |
| Effect permission | Exact phase admission and effect envelope | External dispatch remains disabled by default |
| Worker execution | Typed adapter or agent | Returns a structured outcome; owns no state |
| Cross-cycle transfer | Typed handoff offer and receiving receipt | No mutable state, credential, budget, or authority transfer |

## P3 integration seam

The coordinator consumes an immutable input tuple:

```text
cycle-definition identity
+ phase-admission identity
+ Research Work Plan identity
+ current P2 projection revision
+ current lease/accounting projection
```

It returns proposed protocol commands only. The P2 kernel validates expected
revision, definition identity, idempotency, secrets, and event/receipt shape
before committing. On restart, P3 reconstructs coordination state from P2
events and receipts, expires eligible leases deterministically, reconciles any
settled work, and only then derives redispatch candidates.

No P3 module writes authoritative status files. Any ready-work cache or SQLite
view is disposable and must rebuild from the verified P2 chain.

## Conformance use of RWO

RWO is useful as a source of hostile cases and invariant names, not as proof
that P3 conforms. P3 tests should independently cover:

- identical replay versus divergent duplicate submission;
- stale expected revision and competing lease acquisition;
- crash between worker completion and durable settlement;
- lease expiry followed by recovery-before-redispatch;
- dependency release only after accepted evidence-bound completion;
- prohibition of a second accepted-history owner; and
- deterministic reconstruction of ready work from the same plan and event
  history.

Any copied or adapted fixture must cite its source path and be rewritten against
the ARE protocol. Passing RWO tests does not prove the ARE coordinator works.

## Current boundary

`PL-06R-A` selected this architecture and `PL-06-A` authorized its bounded P3
implementation. P3 is now implemented and tested through the P2 durable chain.
Neither decision admits a cycle definition, reconstructs benchmark data, enables
a worker, calls a provider, runs a benchmark, or authorizes an external effect.

## Open Questions

- `PL-07` remains open: authorize P4 H-EN reconstruction only, review P3 first,
  or pause.
- A future phase may evaluate a stateless RWO-compatible adapter after P3, but
  it cannot own history or become a prerequisite for the H-EN vertical without
  a new decision.
