---
title: Single-Chat Product, Usability Benchmark, and Engine Feedback Implementation Layering
status: planning-candidate
updatedAt: 2026-09-04
owners:
  product_meaning: CyberAlchemy coding-agent product owner
  reasoning_runtime: Agent Reasoning Engine runtime owner
  interaction_adapter: CyberAlchemy TUI owner
scope: cross-component product workflow
authority_effect: none
---

# Single-Chat Product, Usability Benchmark, and Engine Feedback Implementation Layering

This document plans one user-facing chat backed by the Agent Reasoning Engine
(ARE), a thin terminal adapter, a layered usability benchmark, and an exact
failure handoff into the existing recommend-only engine evolution loop.

It is a planning candidate. It does not authorize implementation, change the
current product candidate, approve a product, activate an engine variant, or
grant publication, release, deployment, credential, or external-effect
authority.

## Product Intent

The primary user interacts through one continuous chat. The user does not
navigate among Define, Research, Ontology, Plan, Implement, or Validate as
separate product workspaces. ARE interprets and routes each message internally,
preserves conversational meaning, and returns structured conversation events.
The TUI renders those events without recreating product meaning or reasoning
state.

```text
Human
  -> one TUI chat
  -> ARE conversation service
  -> intent + route + context + reasoning + consequence evaluation
  -> structured conversation events
  -> same TUI chat
```

Capability visibility is observability, not navigation. The user is never
"inside" a capability and cannot select a route from the primary interface.
ARE reports which capabilities are handling the current turn and how work moves
between them; the TUI renders that report without interpreting it.

```text
Human -remains_in-> PrimaryChat
PrimaryChat -submits_to-> AREConversation
AREConversation -routes_to-> Capability
Capability -emits-> CapabilityActivity
CapabilityActivity -rendered_by-> ActivityStrip
HumanDecisionGate -rendered_as-> InlineDecisionCard
```

## Target Primary Interface

| Current element | Target disposition | Replacement behavior |
| --- | --- | --- |
| `CapabilityBar` | Remove as a selector. | Non-interactive `CapabilityActivityStrip` showing current capability and turn-local handoffs from ARE events. |
| `SessionsPanel` | Remove from the primary interface. | One continuous conversation. Any later history/recovery view is secondary and must not create workspace semantics. |
| `Chat` | Retain and expand. | Full-width transcript, inline events/cards, composer, current-turn progress, and optional trace expansion. |
| `AttentionPanel` | Remove from the primary interface. | Questions, blockers, proposals, and exact-bound decisions appear inline at their causal transcript position. |
| `QueueFooter` | Remove as an aggregate control-center summary. | Compact current-turn progress derived from ARE status and capability events. |

The compact default projection is `Define ✓ → Research ✓ → Plan ● →
Implement ○`. It has no click, focus, route, or activation behavior. An expanded
turn trace may expose route reason, start/completion state, and handoff identity,
but never hidden reasoning text or credentials.

## Current State and Construction Frontier

- D65 definition, ontology, product, business, DomainSpec, and compiled-system
  prototypes now exist under this planning directory as non-authoritative
  scaffolds.
- The candidate `packages/conversation-runtime/` now owns conversation identity,
  request-intent binding, ordered events, exact decision gates, internal routing,
  usability observations, failure ownership, and improvement handoff contracts.
- The candidate TUI `conversation-client.mjs` projects the public ARE protocol
  into one transcript and does not import routing, intent, Define, or coding
  implementation internals.
- The deterministic benchmark covers internal route transition, one transcript,
  inline ambiguity, and authority safety. Human comprehension remains
  `NOT_EVALUATED`.
- The live `CyberAlchemyApp` still constructs separate Define and Implement
  controllers and renders `CapabilityBar`, `SessionsPanel`, `AttentionPanel`,
  `ControlCenterPanels`, and `QueueFooter`. The new client is used by tests and
  the benchmark, not by the live launch path.
- The current product-construction frontier is therefore **live single-surface
  integration with ARE-authored capability activity**.
- The TUI and conversation package remain untracked in the current worktree.
  Exact baseline reconciliation is a prerequisite for overlapping mutation and
  for freezing an acceptance-bound candidate, but it does not invalidate the
  already runnable deterministic proof.

## D65 Construction Scaffold Status

The following non-authoritative preconstruction prototypes now exist. They are
candidate scaffolds to preserve and revise through the next construction
epoch, not adopted product meaning or authority evidence:

1. **Definition prototype** — one-chat product intent, Conversation, Turn,
   Conversation Event, Human Decision Gate, Usability Observation, Failure
   Classification, and Engine Improvement Handoff.
2. **Agent-facing ontology scaffold** — the nodes above and their typed
   relations, including `ConversationEvent -rendered_by-> InteractionAdapter`
   and `EngineOwnedFailure -hands_off_to-> EvolutionRuntime`.
3. **Product prototype** — the user journey through one chat, including
   questions, progress, diagnostics, proposals, decisions, blockers, recovery,
   and continuation.
4. **Business prototype** — product-owner, ARE-runtime-owner, TUI-owner,
   benchmark-evidence-owner, and product-approval-owner responsibilities.
5. **DomainSpec prototype** — message/event schemas, state transitions,
   invariants, failure dispositions, and owner boundaries.
6. **Compiled-system prototype** — a graph showing the message path, event path,
   decision path, evidence path, and improvement path.
7. **Implementation prototype** — the layered slices below.

The capability-activity meaning added by this revision must be synchronized
across these prototypes before an acceptance-bound candidate is frozen. All
artifacts remain scaffolds until one exact candidate is frozen, tested, and
separately reviewed for product approval.

## Responsibility Boundary

| Concern | Owner | Boundary |
| --- | --- | --- |
| Product intent and user outcome | Product owner | Defines what one-chat success means; does not implement runtime behavior. |
| Request interpretation, correction, internal route, context, reasoning state | ARE | Never delegated to presentation code. |
| Turn continuation, block, gate, and terminal semantics | ARE | Emitted as structured events with exact identities and reasons. |
| Proposal identity and approval-digest validation | ARE | TUI displays and returns a decision; it never determines eligibility. |
| Transcript, composer, keyboard, resize, accessibility, visual hierarchy | TUI | Presentation only; no capability routing or semantic inference. |
| Capability identity, lifecycle, route reason, and handoff order | ARE | Emits public capability-activity events bound to conversation and turn identities. |
| Capability activity strip and expanded trace | TUI | Renders ARE events; never offers capability selection or fabricates lifecycle state. |
| Conversation protocol conformance | Joint contract | ARE produces; TUI consumes; fixtures are shared and versioned. |
| Semantic benchmark expectations | ARE benchmark owner | Context, correction, route, grounding, continuation, and safety. |
| Human usability interpretation | Product evidence owner | Task success and comprehension; never converted directly into engine truth. |
| Failure ownership classification | Benchmark evidence boundary | Routes evidence to ARE, TUI, shared protocol, or `not_evaluable`. |
| Engine hypothesis and experiment | ARE evolution runtime | Recommend-only by default; no automatic code mutation or activation. |

## Layering Method

- Each layer answers one decision question.
- Each layer is the smallest end-to-end slice that can answer that question.
- A later layer preserves every earlier authority, continuity, and presentation
  guarantee.
- Deterministic fixtures precede live model calls and human-study claims.
- A failing benchmark creates evidence and possibly a hypothesis; it never
  creates implementation or activation authority.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Outcome | Primary risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 — protocol foundation | After this layer, we know whether one ARE-owned conversation can drive one thin transcript without local capability selection. | Existing deterministic conversation runtime, routed facade, TUI client, benchmark, and owner-bound handoff proof. | A protocol-backed chat projection works end to end. | Architectural ownership and interface feasibility. | **Candidate evidence exists.** Preserve it while integrating the live surface. |
| L1 — visible one-chat shell | After this layer, we know whether the live TUI can become one primary chat while showing capability activity without turning it into navigation. | ARE capability lifecycle events, activity projection, full-width transcript, inline status, and removal of primary control-center selectors. | The user sees what capability is working while remaining in one chat. | Mode confusion, hidden work, and presentation-owned routing. | Continue only if every displayed capability state originates in ARE and no UI action selects a route. |
| L2 — live capability composition | After this layer, we know whether real Define, Research, Plan, Implement, and Validate handlers can cooperate across turns with inline questions and exact decisions. | Live route-owner adapters behind ARE, route-clarification gate/resume, proposal decisions, and same-composer continuation. | Real agent work crosses capabilities without restarting or switching workspaces. | Handler fragmentation, context loss, duplicated authority logic, and dead-end questions. | Continue only if route changes, clarification, blocking, and decisions preserve exact conversation/turn lineage. |
| L3 — reliability and feedback | After this layer, we know whether the one-chat product survives streaming, cancellation, disconnect/reconnect, and correctly hands failures to their owners. | Message streaming, abort propagation, replay/resume, deterministic/PTTY suites, collect-all benchmark, and verified engineer/evolution handoff. | The chat remains understandable and recoverable under realistic failures. | Ghost work, duplicate events, stale decisions, lost output, and misrouted repairs. | Continue only with deterministic replay, zero authority violations, and no cross-owner failure relabeling. |
| L4 — exact product candidate | After this layer, we know whether the integrated single-chat product is usable, safe, repeatable, and current enough to freeze for a separate product decision. | Current suites, opt-in live conversations, bounded human study, exact candidate manifest, and current receipt. | Evidence-backed single-chat candidate ready for product review. | Product-value uncertainty and stale-evidence claims. | Freeze only on current evidence; product approval remains a separate owner decision. |

## Layer Definitions

### L0 — Protocol Foundation

Current included candidate:

- ARE-owned commands for opening, submitting, deciding, inspecting, and
  cancelling a conversation.
- Ordered digest-bound events for transcript, phase, intent, questions,
  diagnostics, proposals, decisions, blocks, completion, and cancellation.
- Request-intent binding and internal route selection behind the public
  conversation facade.
- One thin TUI projection client and a deterministic usability corpus.
- Evidence-bound failure ownership and a non-authorizing ARE improvement
  handoff.

Current exit evidence:

- Conversation-runtime tests cover one-turn, multi-turn, exact decisions,
  concurrency, internal routes, ambiguity, failure ownership, and benchmark
  collection.
- TUI tests prove one event stream produces one transcript and that the client
  imports only the public conversation package.
- The deterministic benchmark passes its four machine-evaluable checks and
  retains human comprehension as `NOT_EVALUATED`.

Still deferred from L0:

- The live renderer, complete route handlers, streaming, abort propagation,
  reconnect, and human evidence.

### L1 — Visible One-Chat Shell and Capability Activity

Included:

- Add `capability.started`, `capability.handed-off`,
  `capability.completed`, and `capability.blocked` to the public event contract.
  Each event binds `conversation_id`, `turn_id`, `capability_id`, route-decision
  digest, predecessor activity when applicable, public label, and
  `authority_effect: none`.
- Track the active and completed capability activities in the ARE conversation
  snapshot. The snapshot is the only TUI source for current capability state.
- Extend the TUI client with `capabilityTrace` and `currentCapability`
  projections; unknown events remain non-authorizing diagnostics.
- Replace the primary `CapabilityBar` with a non-interactive
  `CapabilityActivityStrip`.
- Remove `SessionsPanel`, `AttentionPanel`, `ControlCenterPanels`, and
  `QueueFooter` from the normal primary render path.
- Make the transcript/composer full-width. Render current progress above the
  composer and optional turn trace inline.
- Remove `/define` and `/implement` as route-switch commands. Retain `/help`,
  `/context`, `/diagnostics`, and `/quit` only as presentation commands.
- Preserve the old control-center components temporarily only behind an
  explicit developer-only fixture/demo entry, not the normal launch path.

Explicitly deferred:

- Real provider handler composition, streaming tokens, disconnect recovery,
  background multi-agent visualization, and product approval.

Exit evidence:

- Renderer tests show one full-width chat at wide and narrow terminal sizes.
- Tests prove activity-strip items cannot be focused, selected, or used to
  change the route.
- A fixture trace renders `Define ✓ → Research ✓ → Plan ● → Implement ○`
  entirely from ARE events.
- Source-boundary tests reject TUI route selection, route maps, and capability
  lifecycle inference.
- Existing input, paste, decision-card, and exit behavior remains green.

Promotion decision:

- Continue when the normal launch path uses the conversation client and no
  primary control-center navigation remains.
- Pivot if capability activity cannot be shown without leaking internal
  reasoning or introducing a second source of truth.
- Stop if the TUI must select a capability for the proof to work.

### L2 — Live Capability Composition and Inline Consequences

Included:

- Add ARE-owned route adapters for Define, Research, Plan, Implement, and
  Validate, composed behind `createRoutedConversationRuntime`.
- Convert route ambiguity into an exact pending clarification gate bound to the
  route-decision digest. A valid answer resumes the same causal request; it is
  not treated as an unrelated new message.
- Normalize capability output into transcript, diagnostic, proposal, decision,
  block, and completion events without exposing controller-specific state to
  the TUI.
- Keep proposal eligibility, digest validation, application boundaries, and
  continuation decisions in ARE.
- Render questions, diagnostics, proposals, approvals, rejections, blockers,
  and recovery at their causal location in the transcript.
- Return to the same composer after each non-terminal result.

Explicitly deferred:

- Automatic approval, automatic retry, broad orchestration dashboards,
  deployment operations, and implicit successor execution.

Exit evidence:

- Deterministic Define -> Research -> Plan -> Implement traces retain one
  conversation identity and exact turn lineage.
- Route clarification rejects stale, duplicate, unknown, and changed-digest
  answers.
- Each route handler has success, block, exception, and cancellation fixtures.
- Chat text alone cannot approve or apply a proposal.
- TUI tests prove it does not import or instantiate the legacy capability
  controllers.

### L3 — Streaming, Recovery, and Failure Handoff

Included:

- Add `message.started`, ordered `message.delta`, and terminal message events
  with replay-safe sequence identities.
- Propagate an abort signal from `conversation.cancel` through the active route
  handler and provider transport; ignore or quarantine late results.
- Add reconnect inspection and deterministic event replay from a last-seen
  sequence without duplicating transcript or decisions.
- Extend the usability corpus with activity visibility, inline decisions,
  resize/scroll, cancellation, reconnect, and stale-event scenarios.
- Automatically classify failed checks from their corpus-bound owner.
- Produce engineer handoffs for TUI/protocol owners and verified ARE evolution
  handoffs only for ARE-owned failures. `NOT_EVALUATED` remains visible residue
  and produces no hypothesis.

Explicitly deferred:

- Automatic repair, automatic technique adoption, serving-version activation,
  publication, release, deployment, and telemetry upload.

Exit evidence:

- Streaming order, disconnect, replay, duplicate-event, late-result, and true
  cancellation tests.
- PTY tests cover input, paste, scroll, resize, activity visibility, progress,
  inline decisions, block, recovery, and accessible labels.
- Adversarial tests prove TUI and protocol failures cannot enter ARE evolution.
- One exact ARE-owned failed scenario replays into one non-adopted Research
  Hypothesis with previously passing and authority checks protected.

### L4 — Usability Evidence and Frozen Candidate

Included:

- Complete deterministic semantic, protocol, renderer, PTY, cancellation, and
  replay suites.
- Opt-in paired live multi-turn runs using the same scenario identities.
- A bounded formative human study measuring whether users understand the
  current capability, completed handoffs, required next action, decision
  consequence, and recovery without believing the strip is navigation.
- Freeze exact source, dependency, configuration, fixture, and evidence digests.
- Produce one current product-test receipt with explicit claim limits.

Explicitly deferred:

- Broad-market usability claims, analytics collection, product approval,
  activation, publication, release, deployment, and automatic updates.

Exit evidence:

- All deterministic protected checks pass with zero authority violations and
  accidental effects.
- Live evidence is authorized and observed or remains `NOT_EVALUATED`.
- Human evidence is reported separately from deterministic conformance.
- One candidate manifest binds all changed acceptance-bound bytes and its
  current product-test receipt.

## Proposed Implementation Waves and File Scope

Exact paths are candidates and must be reconfirmed against the current dirty
tree before mutation.

| Wave | Layer | Product-construction effect | Candidate file scope |
| --- | --- | --- | --- |
| W0 | pre-L0 | Reconcile and retain the existing definitions, ontology scaffold, product prototypes, and implementation candidate as the source baseline. | Existing `planning/single-chat-usability/`, new `packages/conversation-runtime/`, and TUI candidate bytes; no adoption or authority effect. |
| W1 | L1 | Add ARE capability-activity events and snapshot state. | `conversation-runtime/src/contracts.mjs`, `runtime.mjs`, `routed.mjs`, exports, and focused tests. |
| W2 | L1 | Project capability activity and replace the live primary layout with one chat. | `cyberalchemy-tui/src/conversation-client.mjs`, `app.mjs`, `model.mjs`, `index.mjs`, CLI help, and renderer tests. |
| W3 | L2 | Compose real capability handlers behind ARE and bind route clarification to exact resume state. | New ARE composition/adapter modules plus conversation runtime tests; TUI consumes only public protocol. |
| W4 | L2 | Move all questions, diagnostics, proposals, decisions, blockers, and continuation into transcript renderers. | TUI inline renderer modules and tests; bounded retirement of normal-path control-center code. |
| W5 | L3 | Add streaming, true cancellation, reconnect/replay, and automatic owner-specific failure handoffs. | Conversation contracts/runtime, transport adapters, corpus, benchmark runner, handoff modules, PTY and adversarial tests. |
| W6 | L4 | Run current deterministic, PTY, authorized live, and human evidence; freeze one candidate. | Test/evidence outputs and an exact candidate manifest after source reconciliation. |

## Verification Backbone

1. Schema and canonical-digest tests for commands, events, observations, and
   handoffs.
2. Conversation-runtime unit tests with no provider calls.
3. Capability activity lifecycle, ordering, handoff, block, and route-digest
   tests.
4. Multi-turn deterministic route/context/correction and clarification-resume
   tests.
5. TUI projection and renderer tests driven only by protocol fixtures.
6. Boundary tests rejecting TUI route maps, controller selection, or imports
   of ARE implementation internals.
7. Consequence tests for exact gates, stale decisions, cancellation, late
   results, reconnect, and replay.
8. Failure-classification and exact owner-specific handoff tests.
9. Full ARE and TUI regression suites, then PTY tests.
10. Opt-in live model comparisons after deterministic PASS.
11. Human-study evidence reported under a distinct claim class.

## Non-Regression Guardrails

- The user has one primary chat surface; internal route transitions do not
  require UI mode selection.
- Capability visibility is non-interactive and derives only from ARE events.
- The activity strip never exposes chain-of-thought, secrets, credentials, or
  an authority implication.
- ARE owns intent, route, context, reasoning, continuation, and consequence
  semantics.
- The TUI never validates approval eligibility or applies a proposal directly.
- Chat text alone never grants effect authority.
- Every consequential decision binds an exact current subject digest.
- Unknown, stale, ambiguous, or incomplete states fail closed.
- Benchmark PASS does not prove product approval.
- Benchmark FAIL does not authorize a repair.
- Only verified ARE-owned failures enter the ARE evolution loop.
- Engine evolution remains recommend-only by default.
- Existing dirty bytes and active-owner changes are preserved.

## Product-Construction Lane

### Runnable now

- Reconcile the current untracked TUI and conversation package as the exact W0
  source baseline without treating that reconciliation as adoption.
- Define and implement the public capability-activity event records and tests.
- Extend the TUI client projection from the new events.
- Build the non-interactive activity strip and one-chat renderer under fixture
  injection before connecting live capability handlers.
- Add renderer/source-boundary tests that prove capability display cannot
  select a route.

### Causal blockers

- Overlapping mutation of current TUI bytes requires exact preimage
  reconciliation because the entire TUI is untracked and may include another
  owner's active candidate.
- Live Define/Research/Plan/Implement/Validate composition depends on selecting
  exact route-owner adapters and proving they can suspend/resume through the
  conversation contract; fixture-backed L1 work remains independent and
  runnable.
- Gateway reconnect evidence depends on a working gateway transport and socket;
  it does not block L1 or deterministic L2 construction.
- Registration as admitted Goals execution state is blocked by current Goals
  validation state. This does not block local definition and prototype work.

## Operational-Support Lane

| Task | Owner | Affected stage | Blocking basis | State |
| --- | --- | --- | --- | --- |
| Preserve Node 26.8.1 runtime | Local operator | L0-L4 validation | Exact test prerequisite | Available on current host; portability unproven. |
| Start and maintain the ARE gateway socket | Local operator | L2-L4 integration and live runs | Required only for gateway-bound evidence | Deferred; does not block deterministic L1-L3 work. |
| Authorize model calls and select model | Product evidence owner | L4 live evidence | Cost/external-call boundary | Deferred and opt-in. |
| Recruit participants and handle study data | Product research owner | L4 human evidence | Privacy and research-operation boundary | Deferred; does not block deterministic construction. |
| Reconcile untracked/dirty target bytes and active writers | Current byte owners | W0 and first overlapping implementation wave | Exact source/ownership prerequisite | Required before W1-W5 mutations that overlap. |
| Product approval review | CyberAlchemy coding-agent product owner | After W6 | Separate D65 owner decision over immutable digest | Not requested. |
| Commit, publish, release, or deploy | Publication/deployment owners | After separate approvals | External-effect boundary | Deferred and unauthorized. |

## Open Owner Decisions

1. Is the current untracked TUI candidate the baseline for W1-W5, or is another
   owner still writing it? This must be resolved by exact-byte reconciliation,
   not inferred from the plan.
2. Should the legacy control-center remain as an explicit developer-only demo
   or be deleted after the one-chat renderer is proven? Recommendation: retain
   it temporarily behind a non-default demo entry, then decide from maintenance
   cost after L2.
3. Which public capability label and detail fields may appear in the activity
   trace? Recommendation: stable capability ID, human label, lifecycle state,
   route-decision digest, and timestamps only; no hidden reasoning text.
4. Does a route clarification answer use the general decision-gate schema or a
   specialized typed gate? Recommendation: use the general exact-bound gate
   with `kind: route-clarification` and a typed resume payload.
5. Who jointly approves changes to the shared protocol? Recommendation: ARE
   runtime owner for semantic production and TUI owner for consumability, with
   product owner resolving user-meaning disputes.

## Recommended Next Layer

Begin with **L1 / W1**: add ARE-authored capability activity records and their
deterministic lifecycle tests. Then implement **W2** so the normal TUI launch
path renders one full-width chat, a non-interactive activity strip, inline
status, and the composer while removing control-center navigation from that
path.

This boundary has the highest value-to-cost ratio: it proves the corrected
product model visibly without first paying for live provider composition,
streaming, reconnect, or a human study. The most important deferred scope is
live route-owner composition; it begins only after the visible shell proves it
does not recreate routing semantics in the TUI.

## Claim Ceiling

This updated plan identifies a candidate construction sequence and
responsibility boundary. The existing deterministic implementation is candidate
evidence only. This plan does not register a Goal, authorize further
implementation, accept the untracked TUI or conversation package, establish
live protocol conformance, prove usability, approve a product, activate an
engine improvement, or authorize publication, release, deployment,
credentials, or external effects.
