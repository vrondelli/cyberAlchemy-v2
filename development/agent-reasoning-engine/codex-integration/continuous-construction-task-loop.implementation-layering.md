---
title: Continuous Construction Codex Task Loop Implementation Layering
status: draft-planning-candidate
updatedAt: 2026-09-02
owner: CyberAlchemy v2 product owner
scope: capability integration
authority_effect: none
---

# Continuous Construction Codex Task Loop Implementation Layering

This document plans a bounded integration between the accepted exact-byte ARE
Codex wrapper baseline and the candidate C19 continuous-construction evaluator.
It does not authorize implementation, alter either existing binding, install a
Codex entrypoint, admit an ontology, or activate governance enforcement.

Layer 0 is the smallest no-effect end-to-end proof. Every later layer must
preserve the authority, identity, ordering, and fail-closed guarantees proved
earlier.

## Context

- Target: one Codex task loop controlled jointly by ARE continuation governance
  and C19 D65 construction governance.
- Current state: two separately working systems with no exact cross-binding.
- Primary operator: the owner of one bounded CyberAlchemy construction attempt.
- Primary constraint: automatic continuation must never turn candidate evidence,
  agent prose, or a passing validator into authority.
- Selected composition Product Capability ID:
  `CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP`, selected by the human
  product owner in the 2026-09-02 planning task. This fixes the candidate
  identity and new-composition posture only; it is not Product Capability
  adoption or implementation authorization.
- Accepted baseline: `ARE-CODEX-IMPLEMENTATION-BINDING-002`, exact SHA-256
  `e0efea7a88a2c369ede8cce08f9337039b94a6ae44419ca53959e80d7e55cbaf`.
- Accepted-baseline limit: binding 002 is accepted but not installed; changed
  runtime bytes require a new successor binding and new assessment.
- C19 baseline: `CA2-D65-GOVERNANCE-CONTINUOUS-CONSTRUCTION-001` is a candidate
  exact implementation binding. C19, its Product Capability, business ontology,
  DomainSpec profile/system ontology, implementation, and conformance are not
  adopted, admitted, accepted, or activated.
- Goals limit: this planning candidate must not be registered as admitted
  execution state while the Goals package reports blocked ConstructionBinding
  eligibility.
- Source references:
  - `assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json`
  - `decisions/implementation-binding-002-acceptance.v1.json`
  - `interfaces/codex-app-server-wrapper.contract.json`
  - `runtime/engine.mjs`
  - `runtime/proxy.mjs`
  - `runtime/turn-evidence-ledger.mjs`
  - `../../../ontology/governance/continuous-construction/README.md`
  - `../../../ontology/governance/continuous-construction/programs/continuous-construction.program.json`
  - `../../../ontology/governance/continuous-construction/construction-binding.json`

## Architecture Decision

Preserve three distinct responsibilities:

```text
ARE Codex wrapper
  owns Codex protocol interception, turn/effect evidence, proposal lanes,
  human interaction surfaces, and successor forwarding
                  |
                  v
continuous-construction adapter
  owns exact cross-binding, attempt materialization, decision composition,
  stage/successor matching, and combined receipts
                  |
                  v
C19 evaluator
  owns D65 predecessor, authorization, owner-gate, packet, observation,
  and terminal-confirmation evaluation
```

The adapter is a composition boundary, not a replacement router and not a new
source of authority. The recommended implementation form is a Node adapter that
invokes one exact digest-bound C19 Rust executable as a child process and
validates its closed JSON result. This keeps the accepted ARE and C19 runtimes
separate and makes the cross-binding independently testable.

## D65 Predecessor Gate

Before implementation-bearing Layer 0 bytes are claimed evaluable, prepare the
following candidate predecessor tranche in order:

1. select the exact owning CyberAlchemy Project record;
2. use the human-selected new composition Product Capability ID
   `CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP`;
3. author the immutable Product Capability candidate without changing either
   input capability's meaning;
4. author a capability-local business ontology for turn evidence, construction
   attempts, composed decisions, successor bindings, and terminal decisions;
5. author the DomainSpec v2 source and deterministically compile its graph and
   system ontology; and
6. freeze the exact Layer 0 implementation envelope before producing a
   successor implementation binding.

The human product owner selected the new composition Product Capability ID
`CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP`. The owning Project remains
unselected. The new capability composes, but does not absorb,
`CA2-CAP-GOVERN-CODEX-REQUESTS` and
`CA2-CAP-EVALUATE-CONTINUOUS-CONSTRUCTION`.

## Resolved Planning Decisions

1. Capability shape: new composition Product Capability, not a material
   revision of either input capability.
2. Capability ID: `CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP`.
3. Decision provenance: explicit human product-owner selection in the
   2026-09-02 planning task.
4. Authority ceiling: identity selection only; adoption, admission,
   implementation, installation, activation, publication, deployment, and
   external effects remain ungranted.

## Decision Composition Contract

A successor Codex turn is permitted only when all three conditions are true:

```text
C19 decision == CONTINUE
AND ARE continuation decision == direct
AND selected successor == first eligible pending D65 stage
```

The composed result uses the more restrictive outcome:

| C19 result | ARE result | Composed task-loop result | Successor behavior |
| --- | --- | --- | --- |
| `CONTINUE` | `direct` with exact next stage | `direct` | Start at most one successor turn. |
| `CONTINUE` | `gate`, `block`, or `complete` | ARE result | Start no successor. |
| `STOP` | any | `block` | Start no successor; preserve causal residue. |
| `READY_FOR_HUMAN_TEST` | any | `human-test-ready` | Start no successor; present the frozen packet. |
| `REQUEST_TERMINAL_CONFIRMATION` | any | `terminal-gate` | Start no successor; request one exact terminal decision. |

`READY_FOR_HUMAN_TEST` and `REQUEST_TERMINAL_CONFIRMATION` must not use the
existing `are/continuation/resolve` behavior because that behavior selects a
successor and may start another turn. Terminal confirmation requires a distinct
non-continuing operation and receipt.

## Layering Method

- Minimum proof: one synthetic completed turn updates one attempt and produces
  one composed no-effect decision.
- Decision-first: every layer answers one question that changes what can be
  responsibly attempted next.
- Progressive hardening: layers add repeatability, human boundaries, then live
  canary/packaging.
- Non-regression: prior authority and fail-closed guarantees remain invariant.
- Evidence-gated promotion: later layers begin only after the current layer's
  exact exit evidence is independently reviewable.

## Layer Boundary Heuristic

```text
Layer value = decision unlocked + operator-visible outcome + risk reduced
Layer cost = implementation time + verification time + coordination burden
```

A layer ends when the next unit of work has lower value-per-cost for its current
decision than starting the next decision layer.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether C19 can safely veto or permit one ARE successor without changing either engine's meaning. | Offline turn-completion fixture -> attempt snapshot -> C19 process -> composed decision. | Inspect one deterministic combined decision and receipt. | Wrong integration seam or unsafe decision mapping. | Continue only if every non-`CONTINUE` C19 result prevents forwarding and exact-next-stage matching is enforced. |
| L1 | After this layer, we know whether the loop is repeatable and restart-safe across all D65 stages. | Append-only attempt epochs, idempotent replay, stage mapping, and recovery tests. | Resume one bounded construction without losing or rewriting evidence. | State corruption, duplicate forwarding, stale evidence, concurrent writers. | Continue only after deterministic replay and crash recovery pass. |
| L2 | After this layer, we know whether human test and terminal confirmation remain distinct from routine continuation and effects. | Frozen packet presentation, separate observation ingestion, terminal-only decision operation, effect isolation. | One human test and one exact final decision, with no routine prompts. | Packet mutation, retroactive approval, accidental successor start, effect escalation. | Continue only after hostile terminal and approval tests fail closed. |
| L3 | After this layer, we know whether a version-bound live canary and successor exact binding are credible. | Controlled live app-server canary, exact closure, binding 003 candidate, independent collect-all assessment. | Run one no-effect end-to-end construction canary through the wrapper. | Protocol drift, packaging drift, unsupported activation claim. | Consider installation only through a separate owner decision bound to immutable evidence. |

## Capability Progression

| Scope area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Attempt state | One immutable fixture snapshot | Append-only per-attempt epochs and restart recovery | Packet/observation/terminal epochs | Canary-retained evidence package |
| C19 invocation | Exact local Rust process and closed result validation | Timeout, process failure, stale binary, and replay handling | Terminal-result validation | Digest-bound packaged executable |
| ARE composition | Offline direct/veto composition | Live-proxy-compatible composition with duplicate suppression | Human-test and terminal directives | Controlled live protocol canary |
| Successor control | Exact first pending stage only | Whole D65 order and owner-gate conditions | No successor at human boundaries | One version-bound live successor chain |
| Receipts | One combined decision receipt | Append-only ordered chain | Human packet/observation/decision binding | Exact runtime closure and conformance package |

## Layer 0 - Minimum Working Unit Proof

### Decision question

After this layer, we know whether one completed Codex turn can be converted into
an exact C19 attempt evaluation that safely constrains one ARE continuation.

### Minimum working unit

1. Feed one synthetic `turn/completed` event and its finalized ARE evidence
   manifest into the adapter.
2. Materialize one immutable attempt snapshot in a temporary test directory.
3. Bind the snapshot to one repository-local authorization and exact stage
   artifact refs/digests.
4. Invoke the exact C19 Rust executable without `cargo run` in the decision path.
5. Validate the evaluator output schema and calculate its digest.
6. Compose it with a supplied ARE continuation decision.
7. Return one closed combined directive and receipt without touching
   `proxy.mjs` forwarding behavior.

### Proposed Layer 0 files

Create:

- `interfaces/continuous-construction-task-loop.contract.json`
- `runtime/continuous-construction-adapter.mjs`
- `runtime/composed-continuation-decision.mjs`
- `test/continuous-construction-adapter.test.mjs`
- `test/fixtures/continuous-construction/` containing no-effect exact-byte
  authorization, artifact, attempt, C19 result, and ARE continuation fixtures

Revise only after the D65 predecessor tranche is frozen:

- `schemas/codex-request-governance.schema.json` for the closed cross-binding,
  combined decision, and receipt shapes;
- `package.json` for an explicit offline adapter test command; and
- `README.md` to label the adapter offline, candidate, and non-enforcing.

Do not revise in L0:

- `runtime/proxy.mjs`;
- `runtime/engine.mjs`;
- accepted `implementation-binding.v2.json` or its acceptance record;
- C19 program, runtime, construction binding, or evidence;
- routing, installation, publication, or deployment state.

### Layer 0 exit evidence

- positive matrix for all C19/ARE decision combinations;
- hostile tests for malformed C19 JSON, timeout, nonzero exit, changed binary
  digest, wrong program ID/version, wrong attempt identity, wrong next stage,
  skipped predecessor, and multiple successor proposals;
- two-run byte-identical combined receipt;
- proof that no test starts an upstream Codex turn or approves an effect;
- independent review that the adapter does not reinterpret either engine's
  decision or manufacture owner authority.

### Layer 0 promotion decision

- Continue when every successor is suppressed unless the three-part AND gate
  passes and the receipt is deterministic.
- Pivot when process invocation is nondeterministic or the exact next D65 stage
  cannot be derived without new authority.
- Stop when the adapter must mutate accepted binding 002 or change C19 semantics
  to make the proof work.

## Layer 1 - Repeatable And Restart-Safe Loop

### Decision question

After this layer, we know whether one construction can safely span multiple
Codex turns and resume after interruption without rewriting history.

### Included scope

- introduce `runtime/construction-attempt-ledger.mjs` with append-only attempt
  epochs and exact predecessor digests;
- map observed turn artifacts to one declared D65 stage without accepting agent
  prose as validation;
- extend `turn-evidence-ledger.mjs` with construction identities only through a
  new successor contract;
- integrate the composed decision immediately after evidence finalization and
  before current ARE successor forwarding in `proxy.mjs`;
- preserve existing ARE preflight and effect approval paths unchanged;
- suppress duplicate successor starts across repeated `turn/completed`, process
  restart, or response replay;
- emit ordered events for attempt materialization, C19 evaluation, composition,
  and successor forwarding.

### Explicitly deferred

- human-test observation entry;
- terminal confirmation;
- default installation;
- multiple concurrent construction attempts per thread;
- remote artifact stores, credentials, signatures, or external effects.

### Exit evidence

- all nine D65 stage transitions exercised in order;
- restart at every boundary with the same deterministic next decision;
- stale epoch, changed artifact bytes, missing owner gate, repeated completion,
  and concurrent-writer fixtures fail closed;
- existing accepted-baseline ARE regression scenarios remain behaviorally
  unchanged when construction control is absent;
- no successor begins before the combined decision receipt is durable.

## Layer 2 - Human Test And Terminal Confirmation

### Decision question

After this layer, we know whether the loop can stop once for a real human test
and request confirmation only at the exact terminal boundary.

### Included scope

- present `READY_FOR_HUMAN_TEST` as a frozen packet, never as a continuation
  proposal;
- add a distinct `are/construction/record-observation` operation that accepts an
  immutable observation bound to the exact packet ref and digest;
- add `are/construction/resolve-terminal` for one owner decision bound to the
  C19 evaluation, packet, observation, and decision candidate digest;
- terminal acceptance completes the construction loop; it does not implicitly
  start another Codex turn or authorize an external effect;
- rejection or defer preserves the attempt and starts no successor;
- keep command, file-change, and permission approval callbacks independently
  governed by the existing ARE effect boundary.

### Exit evidence

- ready packet cannot be mutated, replaced, or observed twice;
- observation for another packet is rejected;
- terminal decision digest mismatch is rejected;
- routine confirmation before terminal state is impossible;
- terminal acceptance starts no turn and approves no effect;
- interactive-client tests render the packet, observation status, exact digest,
  owner route, and claim ceiling.

## Layer 3 - Controlled Live Canary And Successor Binding

### Decision question

After this layer, we know whether the composed loop works against one observed
Codex app-server version and can be frozen for independent assessment.

### Included scope

- one controlled no-effect live canary using disposable repository-local
  fixtures and one reversible successor turn;
- protocol drift and upstream binary digest checks before the canary;
- combined ordered event stream and exact evidence manifest;
- deterministic runtime closure including the adapter, exact C19 executable,
  program, schemas, contracts, tests, and receipts;
- new `implementation-binding.v3.json`, leaving binding 002 immutable;
- new collect-all conformance assessment with dependent checks marked
  `not_evaluable` when predecessors remain blocked;
- separate owner gate for binding 003 acceptance;
- separate later decision for installation or route activation.

### Explicitly deferred

- default Codex installation;
- general repository enforcement;
- publication, release, or deployment;
- multiple projects or profiles;
- effectful construction canaries;
- automatic capability, ontology, DomainSpec, implementation, or conformance
  acceptance.

### Exit evidence

- live ordering proves `turn/completed` -> evidence finalization -> immutable
  attempt -> C19 decision -> composed decision -> optional successor start;
- exactly one successor starts only for the permitted matrix row;
- all stop, human-test, terminal, drift, timeout, and malformed-result paths
  start no successor;
- two-run deterministic runtime closure;
- independent assessment binds the exact candidate bytes and states its claim
  ceiling.

## Implementation Wave Backbone

| Wave | Target | Goal | Key artifacts | Verification |
| --- | --- | --- | --- | --- |
| W0 | D65 predecessor gate | Select ownership and freeze meaning before implementation claims. | Project selection, Product Capability candidate, business ontology, DomainSpec source, graph/system ontology receipts. | Owner review, deterministic DomainSpec build, explicit admission status. |
| W1 | L0 | Prove offline cross-engine composition. | Adapter, composition function, closed contract/schema, fixture matrix. | Unit/hostile tests, deterministic receipt, independent review. |
| W2 | L1 | Prove repeatable multi-turn control and recovery. | Attempt ledger, proxy seam, ordered events, recovery fixtures. | Whole D65 transition, replay, restart, regression tests. |
| W3 | L2 | Prove human-test and terminal boundaries. | Packet presentation, observation operation, terminal operation, interactive tests. | Hostile binding tests and no-successor/no-effect proofs. |
| W4 | L3 | Freeze and assess a live candidate. | Canary, closure, binding 003, assessment 003. | Live ordering, exact closure, independent collect-all assessment. |

## Combined Receipt Contract

Every composed decision receipt must bind at least:

- thread ID, completed turn ID, and request-context digest;
- ARE evidence-manifest and continuation-decision digests;
- construction ID, attempt ID, attempt epoch, predecessor epoch digest, and
  immutable attempt digest;
- C19 program ID/version/digest, executable digest, evaluation digest, and
  decision;
- expected first pending D65 stage and selected successor proposal digest;
- composed directive and digest;
- human-test packet, observation, and terminal decision digests when present;
- explicit `authority_effect`, `effect_authorized`, and `enforcement_effect`;
- ordering witnesses proving the composed decision preceded any successor
  `turn/start`.

## Non-Regression Guardrails

- Binding 002 and its acceptance record remain byte-identical historical
  authority; integration changes are represented only by a successor binding.
- C19 remains the sole owner of its four construction decisions; the adapter
  may validate and compose them but not reinterpret them.
- ARE remains the sole owner of Codex protocol interception, proposal lanes,
  effect approvals, and upstream forwarding.
- A successor requires C19 `CONTINUE`, ARE `direct`, and exact-next-stage match.
- Candidate bytes, agent prose, validator PASS, or a digest alone never
  authenticate an owner or grant authority.
- Missing, stale, ambiguous, malformed, timed-out, or contradictory inputs stop
  the loop before successor forwarding.
- `READY_FOR_HUMAN_TEST` and `REQUEST_TERMINAL_CONFIRMATION` always start no
  successor.
- Terminal confirmation never authorizes publication, deployment, credentials,
  destructive action, or another external effect.
- Existing ARE effect approvals remain independent and at least as restrictive.
- No routine confirmation is introduced before the terminal human gate; real
  owner, safety, authority, and effect blockers still stop immediately.

## Open Owner Decisions

1. Which exact CyberAlchemy Project owns the composition capability?
2. What repository-local artifact proves a D65 stage is `validated` rather than
   merely completed by a Codex turn?
3. Which exact executable artifact and toolchain identity will binding 003 bind?
4. Where do append-only attempt epochs live during L1: task-local evidence,
   package-local run evidence, or a separately governed runtime-state root?
5. Who owns terminal confirmation, and what decision values besides accept,
   reject, and defer are permitted?
6. Which no-effect construction subject is authorized for the L3 live canary?

## Recommended Next Layer

Start L0 only after selecting the exact owning Project and completing the D65
predecessor tranche for the selected Product Capability. The smallest useful
proof is the offline adapter and decision-matrix test; do not touch live
`proxy.mjs`, the interactive client, or installation state until that proof is
independently reviewable.

The most important deferred scope is live automatic successor forwarding. It
has lower value-per-cost than proving the cross-engine decision contract first
and carries substantially higher risk if the attempt identity or stage mapping
is wrong.
