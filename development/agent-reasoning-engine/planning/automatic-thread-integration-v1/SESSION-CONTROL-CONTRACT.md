---
title: ARE activated-session control contract
status: candidate; not activated
owner: ARE product owner and selected host integrator
scope: one explicitly bound conversation in one selected host
---

# ARE activated-session control contract

This is the product-local successor contract for integrating ARE with an existing
host conversation. The cross-backend [integration map](INTEGRATION-MAP.md) and
[machine-readable surface registry](../../../../implementation/agent-reasoning-engine/src/integration-surface-v1.json)
identify the distinct clients, controllers, backends and observation interfaces.
This contract does not redefine CyberAlchemy's canonical repository
terms, approve a product candidate, install a host adapter, or activate this
desktop task. The [parent plan](PLAN.md) and
[work-pack](INTEGRATION-WORK-PACK.md) own construction and evidence.

## Definition and authority

An **activated ARE-managed session** is an exact host conversation whose user
ingress and subsequent turn lifecycle have been handed to one authenticated ARE
gateway writer under a recorded activation. For that bound conversation, **ARE
controls the chat session**: it accepts attributable user input, selects and
updates the current task/intent/context and Reasoning State; decides whether to
dispatch, interrupt, resume or continue a host turn; steers an active turn only
when the selected backend supports it; sequences the resulting events and
decisions; and returns the response to the selected client.
This is lifecycle and orchestration control, not ownership of the user's account,
the selected host application, the provider model, or every task on the host.

The host remains the execution and presentation boundary. Native account
identity, transport availability, sandboxing, permissions, human approvals,
credential custody, and effect execution remain with their existing owners. ARE
decisions cannot grant an effect or override a stricter host/user policy. An
interaction adapter can submit and render, but cannot silently bypass ARE's
selected ingress or become a second turn writer for the activated session.

The word **activated** is reserved for a recorded, verified handover of the
exact session. An ARE CLI receipt, MCP connection, advisory hook, gateway
process, disposable app-server thread, or resumable host ID alone is not
activation and must not be labeled “ARE-managed” in the UI or reports.
The [official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
documents `thread/read` for observation without resuming and `thread/resume`
for continuing a stored thread. Those methods establish neither an exclusive
handover from the already-running desktop client nor complete new-message and
approval coverage for this exact task. Treat that gap as an unverified host
boundary, not as a reason to infer control from a matching thread ID.
A local read-only probe against `codex-cli 0.155.0-alpha.16.4` returned this
desktop task's exact ID from a separate App Server process with
`includeTurns:false`. This narrows the observation gap only; it did not resume,
write, interrupt, or hand over the task.
The same CLI's generated experimental request schema lists `thread/resume`,
`turn/start`, `turn/steer`, and `turn/interrupt`, but no explicit
task-handover/lease method. This is a version-bound API observation, not proof
that every possible host-control mechanism is absent.
The [pinned dynamic-tool release probe](evidence/G1-DYNAMIC-TOOL-REVOCATION-2026-09-30.md)
also shows that `are_effect_request` survives direct `thread/resume` after its
gateway exits. The pinned resume schema has no `dynamicTools` field, and live
empty-list and replacement-list requests did not revoke the tool. Neither
resumability nor a stopped gateway is therefore a safe direct-client release.

An additional read-only installed-host lookup found the running Windows app
under package `OpenAI.Codex_26.917.9434.0_x64__2p2nqsd0c76g0`. Its bundled
`app/resources/codex.exe` SHA-256 is
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`,
identical to the pinned native Windows host used by the disposable probes.
WindowsApps denied direct execution of that package binary from the probe;
the identification is by installed process path and file hash, not a new
version query or any interaction with this task. It narrows host identity,
but does not supply an exclusive handover or tool-revocation method.

## Activation preconditions

All conditions must be true for the exact target, not inferred from a nearby
canary or a different client:

1. Bind host/account, task/thread, workspace, history mode, backend/adapter,
   tested profile and gateway identity. Verify that the selected client can
   continue the *same* history; if it cannot, offer a separately chosen client
   outcome rather than silently substituting one.
2. Finish the active turn; record its last-completed watermark and history
   digest. Preserve native history. Do not replay pre-activation turns as new
   ARE episodes or infer past ARE learning from a transcript.
3. Prove supported bidirectional transport for new messages, turn start,
   interruption, completion and reconnect. Record the selected backend's
   *observed* capabilities for active-turn steering, history resume,
   compaction and effect requests. Unsupported operations must be visibly
   unavailable or fail closed, never silently emulated. Prove an exclusive
   writer or a host-supported handover that prevents a direct client from
   racing ARE on this task.
4. Use a tested exact candidate with durable, bounded controller
   session/checkpoint state and recovery of unknown delivery. Reconcile that
   state with the backend's separate thread/history state; a gateway receipt
   cannot prove backend-history recovery. If effectful requests are advertised,
   verify a non-bypassable effect boundary before claiming enforcement; a
   backend that advertises no effect tools must not gain them through fallback.
   Advisory hooks alone do not meet this gate.
   Pinned WSL and native Windows canaries confirm that a later `write_stdin`
   can deliver input to an already-admitted command without a second
   `PreToolUse`; the bounded [MCP relay evidence](evidence/G1-MCP-TOOL-HOOK-TRANSPORT.md)
   is therefore not a complete effect-boundary proof.
   A separate pinned-host restricted-tool-catalog probe removed native shell,
   patch, app, goal-mutation, and subagent tools from a disposable model
   catalog and rejected injected unadvertised shell, stdin and patch calls.
   A later opt-in managed launcher gate verified effective startup settings,
   and pinned WSL/Windows fixtures preserved the restricted model catalog
   after restart and `thread/resume`. This is a possible construction path
   for a **new ARE-owned session**, not a handover mechanism for this
   already-running desktop task. Steer/compaction, other unadvertised calls,
   configuration changes after startup, MCP catalog changes or a future
   broker's effect semantics, client-side
   commands, and any future ARE effect broker still need exact boundary tests.
   Approval scope is part of this proof: an approval for one assessed effect
   cannot silently authorize later effects through a session-wide grant or
   persistent policy amendment. Such responses must be rejected until a
   separately tested, explicitly scoped policy owns their later coverage.
5. Obtain the separate product and host/user activation decisions for this
   target. Record the activation identity, selected client route, profile,
   owner, rollback route and start time. Verify the first managed exchange and
   subsequent recovery before reporting active status.

If any required condition fails, activation remains pending/unsupported. The
system must not report partial hook or proxy coverage as control of the chat.

## Backend capability contract

Activation binds a capability record for the selected backend and client;
transport shape alone is insufficient. Codex capability and history support
depend on the installed host and exact task. The current DSH adapter explicitly
rejects steering and advertises no effect tools; its thread history defaults to
ephemeral and durable mode is opt-in. Generic JSONL process compatibility
asserts no turn-method conformance. The interaction client must surface these
differences before the user relies on a feature.

For every supported operation, record the host method, correlated
session/thread/turn identity, recovery rule and failure behavior. For every
unsupported operation, record `unsupported` and prevent an alternate ingress
from silently performing it. A session with an untested capability is not
eligible for that capability's promise. The registry's `activation_eligible_now:
false` values are current claim ceilings, not a runtime activation switch.

## Activated-session behavior

- Every supported new user message and, where available, steering input enters through the one
  bound ARE writer before host dispatch. ARE preserves attribution, original
  text, task identity and event order; it does not treat tool output or quoted
  material as user instruction.
- ARE owns request interpretation, context packaging, explicit Reasoning State
  frontier, scoped feedback/learning disposition, continuation choice and
  response orchestration for that session. It may ask for a user decision or
  stop; it cannot invent a permission or silently self-activate Evolution.
- Host events and approvals are correlated to exact task/turn/item identities.
  ARE's effect assessment is applied before a host approval response only at a
  supported enforcement boundary. Unknown, missing or conflicting coverage
  blocks the affected operation; a bypass path is not an automatic fallback.
- Ordered receipts and durable checkpoints distinguish accepted, completed,
  interrupted and unknown-delivery states. Reconnect and supported compaction must restore
  obligations without redispatching a possibly accepted turn or duplicating an
  effect. The client sees a clear paused/degraded state when recovery is unsafe.
- The selected client may still render and collect input. That does not make it
  the reasoning or turn-control owner. Direct host operations outside the bound
  session remain outside ARE's claimed scope.

## Deactivation and rollback

Drain or explicitly interrupt the active turn, reconcile unknown delivery,
checkpoint the ledger and release the ARE writer before restoring a direct
client route. Keep the original history and retained ARE evidence attributed to
their true sources. Record the deactivation watermark and reason. Never retry a
possibly delivered request through a bypass route. A new activation requires a
new exact binding and verification.
For a thread that advertised an ARE-owned dynamic effect tool, release also
requires a host-confirmed removal or rebinding of that tool before direct-client
turn ingress. The pinned host cannot presently demonstrate that step; its
managed-session stop is a safe stop, not complete deactivation. Do not offer
direct resume as rollback for such a thread while the stale tool persists.

## Contract consumers and drift boundary

The [integration plan](PLAN.md), [layering](IMPLEMENTATION-LAYERING.md),
[work-pack](INTEGRATION-WORK-PACK.md), [integration map](INTEGRATION-MAP.md), product
[entry point](../../../../implementation/agent-reasoning-engine/README.md),
[conversation runtime](../../../../implementation/agent-reasoning-engine/packages/conversation-runtime/README.md),
[architecture](../../../../implementation/agent-reasoning-engine/docs/ARCHITECTURE.md),
[Companion UI plan](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WHOLE-UI-IMPLEMENTATION-PLAN.md),
[Companion UX index](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/ux/README.md),
[Threads UX brief](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/ux/THREADS.md),
and repository [CLI adapter](../../../../agent-routing/capabilities/are-cli/README.md)
must preserve this distinction. The older
[Codex wrapper interface](../../codex-integration/interfaces/codex-app-server-wrapper.contract.json)
is historical, digest-bound candidate evidence with `adoption_status:
not-adopted`; it is not silently rewritten or promoted by this successor.
Frozen candidate manuals and past receipts remain historical evidence, not
claims that this session-control contract has been implemented or activated.

## Open Questions

- Does the installed desktop client expose a supported exclusive handover for
  this exact task, including active-turn steering, or only a separate client?
- Which selected host boundary can enforce effect decisions rather than merely
  observe them, and how is bypass prevented for one task without global changes?
- What private durable state root, retention, recovery operator and visible
  activation indicator will the final host owner approve?
- Will the internal conversation facade own gateway conversations, or remain a
  separate mode with an explicit identity mapping?
