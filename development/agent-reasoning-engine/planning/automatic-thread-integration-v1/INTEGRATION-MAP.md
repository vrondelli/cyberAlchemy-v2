# ARE integration surface and consolidation map

Status: candidate architecture inventory, 2026-09-26. Owner: ARE product and
host-integration owners. The machine-readable
[surface registry](../../../../implementation/agent-reasoning-engine/src/integration-surface-v1.json)
records each current entrypoint and its claim ceiling. Neither artifact
activates a host session or deletes a working entrypoint. The TUI is a
discontinued interface by owner direction; its two registry entries remain
source provenance under `retired-provenance`, not runnable product UI work.
The machine overlap graph now isolates those entries in
`retired-client-provenance`; current turn ingress, conversation identity and
cross-project controller groups exclude them.
The live repository gateway profile and opt-in learning canary no longer admit
the TUI-only `codex:coding-proposal` consumer. Historical TUI source and
evidence remain unchanged.
The [2026-09-26 entrypoint delta](INTEGRATION-TOPOLOGY-DELTA-2026-09-26.md)
identified additional Define and historical TUI modes. The active Define mode
remains in executable-client discovery; the discontinued TUI modes are checked
only as retained provenance. This is not a whole-repository or installed-host
completeness proof.

## Layers and ownership

```text
selected interaction client (input and rendering)
  -> one exclusive ARE session controller (identity, turns, decisions, recovery)
  -> one declared host backend adapter (protocol and capabilities)
  -> host/model/effect execution under existing host and user authority

parallel, not alternate writers:
  CLI / MCP / hooks = decision and observation interfaces
  Companion = read-only observation
  coding-agent transports = model-turn/provider adapters
  module port / retrieval = internal semantic and context adapters
  Evolution bridges = improvement/worker handoffs

separate product modes and privilege boundaries:
  customer direct wrapper = direct Codex stdio, not acknowledged gateway recovery
  website chat = no-tool, process-memory conversation controller
  website edge -> inference broker -> provider gateway = ingress, quota, credential egress
  discontinued TUI = retained source provenance; Luna and exchange = bounded pilots
```

The controller may own an external chat only after the
[activated-session contract](SESSION-CONTROL-CONTRACT.md) is met for that exact
identity. A backend adapter translates protocol and reports supported
capabilities; it is not a second conversation controller. The conversation
runtime currently owns an internal facade but has no proven production binding
to the gateway's consumer and backend-thread identities.

## Entrypoint dispositions

`target-canonical` means the intended architecture for a future admitted
integration, **not** an active or approved default. `compatibility-only` keeps
an alternate path available without equivalent recovery/control claims.
`experimental` needs further conformance evidence. `separate-boundary` has a
different responsibility and must not be consolidated as a chat writer.
`retired-provenance` records a discontinued path excluded from current product construction;
it does not delete source, revoke historical evidence, or authorize cleanup.

| Surface | Layer and disposition | Evidence and claim limit |
| --- | --- | --- |
| Acknowledged persistent gateway | Session controller; target-canonical | [Gateway](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs) and [client transport](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-client.mjs) have local identity/replay tests, but not this desktop task's handover. |
| Managed-session launcher and cross-OS WSL parent | Transport edge; experimental | The [managed launcher](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-managed-session.mjs) composes a new gateway/client session; its [development-only WSL parent](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-cross-os-wsl-supervisor.mjs) supervises that launcher and exposes loopback observation. Neither is an independent chat controller or hands over this desktop task. |
| Direct Codex stdio wrapper | Session controller; compatibility-only | [Entrypoint](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs) uses the same wrapper without acknowledged gateway recovery. |
| Desktop CLI launch shim | Transport edge; experimental | The opt-in [shim](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-desktop-shim.mjs) admits the installed WSL desktop's two observed command forms. Explicit `direct-candidate` mode starts the direct wrapper; `managed-gateway` starts a separate acknowledged [desktop JSONL client](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/desktop-gateway-client.mjs) with private intent/delivery state and no direct fallback. The managed gateway, shim and client now bind a pinned backend digest and host launch profile; `initialize` passed across the real gateway with the installed binary for both profiles and no model turn. Isolated desktop launches still did not invoke the shim. This is not current-task handover or complete bidirectional desktop protocol; [launch evidence](evidence/G1-DESKTOP-LAUNCH-OVERRIDE-2026-10-01.md) remains candidate-only. The discontinued TUI is not a fallback. |
| Older Codex governance proxy and Workspace desktop bridge | Separate session controller and client; compatibility-only | The older [proxy](../../codex-integration/runtime/proxy.mjs) independently mediates preflight, approvals and continuation. Its [desktop bridge](../../codex-integration/client/desktop-bridge.mjs) starts an ephemeral thread through that proxy when the [Workspace desktop host](../../../../essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs) is configured with `ARE_CODEX_BRIDGE`. The [Workspace manifest](../../../../workspace/runtime/IMPLEMENTATION-MANIFEST.candidate.json) binds its exact source closure. These are not the persistent gateway's acknowledged session path and do not hand over this Codex desktop task. Historical digest-bound bindings remain unchanged. |
| Transparent gateway stdio client | Interaction client; compatibility-only | [Proxy](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-client.mjs) uses the legacy byte stream, not acknowledged delivery. |
| Native-hook gateway session client | Interaction client; experimental | [Client](../../../../implementation/agent-reasoning-engine/src/gateway-session-client.mjs) wraps the acknowledged transport for an isolated native-hook canary. The [callback bridge](../../../../implementation/agent-reasoning-engine/src/hook-callback-bridge.mjs) carries advisory hook observations, not installed host enforcement. |
| Windows browser client | Interaction client; experimental | [Host](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/windows-client-host.mjs) can send turns through the gateway; its latest accepted-turn receipt survives a lost browser acknowledgement and isolated restart, but truly unknown backend delivery and same-desktop handover remain open. |
| Customer direct wrapper | Session controller; compatibility-only | [Customer launcher](../../../../keld-project/scripts/customer-app-server.mjs) runs the same direct stdio wrapper with a customer profile and writer lock. It is not an acknowledged gateway client and must not inherit that recovery claim. |
| Public ARE website chat | Session controller; experimental | [Chat](../../../../keld-project/are-documentation/server/chat.mjs) imports ARE Conversation Runtime, intent, router and context modules, but [HTTP sessions](../../../../keld-project/are-documentation/server/http.mjs) and [Reasoning State](../../../../keld-project/are-documentation/server/reasoning-state.mjs) are website-local and process-memory. No execution tools or persistent gateway are attached. The hardened router's verified no-match verdict is now retained while a real no-tool conversational reply proceeds; ambiguity and source failures remain closed. The focused chat and closure-policy suite passed 18/18 on 2026-09-26; no live provider/browser proof follows from that result. |
| Website edge, inference broker and provider gateway | Transport edge, model broker and credential egress; separate-boundary | The [edge](../../../../keld-project/are-documentation/server/edge-server.mjs) restricts public HTTP routes, the [broker](../../../../keld-project/are-documentation/server/broker-server.mjs) owns model-call quota, and the [provider gateway](../../../../keld-project/are-documentation/server/provider-gateway-server.mjs) owns dedicated credentials and egress. These are three privilege boundaries, not competing chat controllers. |
| CyberAlchemy TUI | Interaction client; retired-provenance | The discontinued [client](../../../../implementation/cyberalchemy-tui/src/conversation-client.mjs) creates an in-process Conversation Runtime. Its source and evidence are retained, but it is no longer a product UI target or a path to desktop-task handover. |
| Define CLI | Interaction client; experimental | [Define CLI](../../../../implementation/define-cli/src/app-server-agent.mjs) defaults to the acknowledged gateway but has an explicit direct-wrapper mode and a stale implementation binding. A [local actual-wrapper fixture](../../../../implementation/define-cli/test/gateway-integration.test.mjs) and an [installed-host fixed-provider canary](../../../../implementation/define-cli/scripts/native-gateway-canary.mjs) prove one read-only Define turn each, including bounded output schema, adapter pin and stable mutation keys; the full Define `npm test` passes after standalone generated-evidence refresh. This does not prove live desktop-task handover or complete host-effect interception. |
| TUI coding proposal | Interaction client; retired-provenance | The discontinued [coding-proposal client](../../../../implementation/cyberalchemy-tui/src/codex-coding-agent.mjs) and its [bounded evidence](evidence/G1-TUI-CODING-PROPOSAL-GATEWAY.md) remain provenance. Its uncertain pending turn is not released, and this mode is no longer a product UI target. |
| Luna pilot and exchange fixture | Integration evidence and agent executor; experimental | The [Luna pilot](../../../../workspace/plans/luna-vps/runtime/pilot-host.mjs) composes the existing gateway, hook callback and a bounded local provider proxy. The [exchange fixture](../../../../cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/are-host.ts) runs a scripted disposable coding-agent turn. Neither is a new product chat controller. |
| Codex, DSH and generic JSONL backends | Host adapters; distinct | [Adapter contract](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend-adapter.mjs) validates process shape. The [DSH shim](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/server.mjs) advertises no steering or effects and defaults to ephemeral history. Generic process shape proves no protocol conformance. |
| Orchestrator ARE executor | Agent execution adapter; experimental | [Rust adapter](../../../../orchestrator/capabilities/orchestration/src/are_adapter.rs) turns scheduled commands into Agent Turn drafts through an injected transport. Its [boundary contract](../../../../orchestrator/docs/ARE-GATEWAY.md) says a live ARE socket transport still needs implementation and admission. This is not user-chat ingress. |
| CLI, MCP and hooks | Decision interfaces; separate/advisory | [CLI](../../../../implementation/agent-reasoning-engine/src/decision-cli.mjs), [MCP](../../../../implementation/agent-reasoning-engine/packages/are-mcp-server/src/server.mjs) and [hook events](../../../../implementation/agent-reasoning-engine/src/hook-event-session.mjs) reuse decisions but do not become an exclusive chat writer or effect authority. MCP also exposes separately gated, potentially state-changing Evolution commands; it is not solely a read interface. The callback bridge is a canary path. |
| Checkpointed compaction context hook | Context injection; experimental | [Hook](../../../../implementation/agent-reasoning-engine/src/compact-context-hook.mjs) projected one verified C1 record through an isolated native selected-PATH-CLI `SessionStart` compact event before the next model request. It is not installed or verified for this desktop task, automatic mid-turn compaction remains unproven, and it cannot confer turn-control authority. |
| Conversation runtime | Internal facade; experimental external binding | [Runtime](../../../../implementation/agent-reasoning-engine/packages/conversation-runtime/src/runtime.mjs) has separate conversation IDs and in-memory events; no production gateway composition was found. |
| Coding-agent transports | Model-turn layer; separate-boundary | [Transport facade](../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/model-transport.mjs) normalizes Codex, OpenAI-compatible and native provider calls. The bounded HTTP recycling transport serves a different accounting contract. Its current v2 candidate freezer and product suite cover the runtime only, with no active TUI source/test dependency; earlier TUI-bound v1 receipts remain historical. None owns host chat ingress or proves Companion UI conformance. |
| Module Port and retrieval | Internal capability/context layers; separate or experimental | [Module Port](../../../../implementation/agent-reasoning-engine/packages/module-port/README.md) injects explicit semantic/source/availability adapters; [retrieval](../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/kite-retrieval-v1/adapter.mjs) supplies bounded coding-agent context. Neither is a host gateway. |
| Companion and Evolution bridges | Observation and handoff; separate-boundary | [Companion](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/src-tauri/src/main.rs) invokes doctor and, only with an explicit development observation endpoint on POSIX or Windows, fixed adapter, thread and decision-status reads. A native Windows canary passed against a real Codex backend from an extracted unsigned package; these are gateway-process projections, not this task's activation. [Evolution handoff](../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/conversation-handoff-adapter.mjs) and VPS bridge do not dispatch user chat turns. |
| Product-declared integrations | Integration evidence, not live transports | [Product profile](../../../../implementation/agent-reasoning-engine/product.json) declares an optional Codex desktop bridge and required ARE product package; declaration alone proves neither installation nor a conversation controller. |

## Confirmed overlap and consolidation boundary

1. **Turn ingress overlaps.** The older Workspace desktop bridge/proxy, newer
   direct stdio wrapper, transparent gateway proxy, acknowledged gateway client,
   native-hook canary client and browser client expose related turns with
   different guarantees. Keep them explicit; do not call a legacy path
   ARE-controlled merely because it passes through a wrapper. A future exact
   activation selects one writer and records the ingress path.
2. **Identity is distributed.** Gateway consumer/session, backend thread/history,
   and conversation-runtime conversation are separate records. DSH durable
   history, when enabled, does not replace gateway delivery/ack state. A
   DSH fixture now proves both recover after restart for one consumer and an
   explicitly resumed thread; it does not establish this desktop task's host
   binding. The connect receipt distinguishes gateway delivery recovery from
   backend history, which remains `not-verified-by-connect` until a separate
   thread resume succeeds. The gateway's hashed backend-thread claim now
   prevents a second consumer of the same gateway from dispatching a mutation
   for that ID, and claims newly created and forked IDs before delivery. Its
   file journal survives compaction/reopen. Its file writer lock and the
   Reasoning State writer lock now reclaim only a verified terminated local
   v2 owner after restart; ambiguous records fail closed. This is not a lease against the
   desktop app or other App Server processes. Matching accepted steer responses
   and completed compaction items now receive bounded, content-free durable
   receipts before client delivery and are projected into the companion's
   Threads view. This is protocol-event evidence, not a C1 successor-plan
   update or proof of host task mapping, exclusive ownership, or cascade effects.
   A durable consumer session now also retains its selected backend adapter ID
   across compaction and restart; a Codex-only client rejects another adapter
   at handshake, and legacy unbound sessions fail closed on recovery. This
   binds an adapter contract identifier, not exact executable bytes, account,
   host task or conversation-runtime identity; see the
   [backend-adapter identity evidence](evidence/G1-BACKEND-ADAPTER-IDENTITY.md).
3. **Decision ingress is plural, not duplicate policy.** CLI, MCP and hooks
   reach the same decision implementation, but hooks are advisory and MCP is a
   tool interface. Consolidate vocabulary and status reporting, not their
   different enforcement semantics.
   Effect approval is also plural: the current shared wrapper and hosted
   client now reject session-wide and policy-amending acceptances before they
   can suppress later per-effect requests, while the older digest-bound proxy
   still recognizes those forms. The legacy path is not eligible to inherit
   this newer approval claim; see the [bounded approval evidence](evidence/G1-APPROVAL-SCOPE-BOUNDARY.md).
   The gateway and direct-stdio shared wrapper now use one classification to
   reject a bounded set of alternate App Server execution/model-entry methods
   before backend dispatch; see the [host-method evidence](evidence/G1-ALTERNATE-HOST-METHOD-GUARD.md).
   The gateway separately adds a [versioned 164-method catalog](evidence/G1-VERSIONED-HOST-METHOD-CATALOG.md)
   that rejects every other observed or unknown client method before any
   wrapper. A separate [Codex lifecycle parameter contract](evidence/G1-HOST-PARAMETER-CONTRACT.md)
   now constrains thread start/resume/fork and turn start, including nested and
   generated successor paths; remaining admitted methods and ownership still
   need review.
   The hosted browser now pins read-only sandbox plus on-request approvals
   across new, resumed, and subsequent turns, and rejects writable mode even
   from its constructor. This remains a selected-host guard, not proof of
   universal App Server effect interception.
   The older proxy and direct-stdio compatibility path do not inherit the
   gateway-wide catalog, and none of these guards proves universal effect
   enforcement. A disposable installed-host gateway/client canary now rejects
   writable `thread/start` and `turn/start` requests with
   `host.sandbox-policy-unsafe` before the safe turn's provider request, then
   completes the read-only flow; see the [parameter evidence](evidence/G1-HOST-PARAMETER-CONTRACT.md).
4. **Backend-neutrality is incomplete.** The gateway selects DSH but still
   constructs a Codex-named wrapper. The adapter contract now reports declared
   method postures in connect receipts and rejects known-unsupported DSH
   operations before dispatch. Generic transports and exact Codex-host support
   remain `unknown`; the receipt does not prove runtime conformance. The
   gateway CLI exposes DSH's opt-in durable mode with an existing private
   `dsh_home`, but gateway recovery and backend-history recovery are still
   separately evidenced. Codex and DSH now declare gateway-created thread
   ownership; a fresh gateway index cannot adopt an older DSH thread merely
   from its ID. A local turn through the actual DSH-selected gateway CLI and
   ARE wrapper completed with ARE context; generic JSON-line adapters still
   have unverified ownership. See the
   [adapter ownership evidence](evidence/G1-ADAPTER-THREAD-OWNERSHIP.md).
   DSH now supplies a closed client-method posture rather than inheriting
   Codex's pinned catalog: its owned `thread/close` is usable, undeclared
   reads are denied and compaction remains explicitly unsupported. The
   [DSH method evidence](evidence/G1-DSH-METHOD-CONTRACT.md) covers ingress.
   DSH now also declares a closed server-notification posture: unknown and
   unowned events, unsolicited responses, and mismatched response thread IDs
   fail before client delivery; see [DSH event evidence](evidence/G1-DSH-SERVER-EVENT-CONTRACT.md).
   This is not generic JSONL protocol conformance or a claim about an
   independently supplied DSH executable.
   A neutral controller boundary and exact host binding
   precede any promise that all backends provide the same chat experience.
5. **Provider HTTP code overlaps at a lower layer.** General OpenAI-compatible
   calls and bounded HTTP recycling both speak chat-completions, but the latter
   enforces a one-request/token-accounting contract. Reuse should be limited to
   proven common primitives, not a wholesale replacement of either adapter.
6. **Cross-project ARE naming is not shared control.** The Workspace desktop
   bridge starts its own Codex process/thread through the older proxy, whereas
   the Orchestrator ARE executor still lacks an admitted live socket transport.
   Neither can be counted as a client of the target gateway. The product's
   optional `codex-desktop-bridge` declaration still points at the older
   candidate package. A replacement needs a separately bound migration and
   rollback path; this map does not rewrite its historical exact-byte closure.
7. **The website is an additional controller mode.** Its own session IDs,
   process-memory Reasoning State and route history are not the gateway's
   consumer/backend-thread ledger. The site imports core modules but does not
   share durable delivery, controller ownership or activation status. Reconcile
   its state contract before representing the website as the same ARE-managed
   session mode. Its no-route conversational reply now preserves the real
   router block, records a conversation-only event and completion checkpoint,
   and cannot execute tools. Model-inferred objective remains nonselecting;
   ambiguity and source failures still stop the reply. This fixes the four
   focused test failures after router hardening, not gateway/session identity.
8. **The website provider chain is deliberately layered.** Its public edge,
   quota broker and secret-bearing provider gateway protect different
   resources. The general coding-agent transport may share only proven
   protocol primitives with the provider gateway; collapsing these processes
   would change credential custody, egress and budget enforcement.

No deletion or runtime merge follows automatically from these findings.
The TUI's `retired-provenance` classification does not authorize deleting its
source or evidence. Any later cleanup still requires an exact retention and
rollback decision. Historic digest-bound interfaces and frozen releases remain
unchanged.

## Verification matrix

| Boundary | Current bounded check | Remaining proof before activation |
| --- | --- | --- |
| Entrypoint classification | `node --test test/integration-surface.test.mjs` from product root checks IDs, ownership, product declarations, claim ceilings, existence of every declared local/cross-project source, and a scoped executable-client API-use scan. | Discovery completeness beyond the selected source scopes and API calls, exact installed-client route and exclusive-writer handover. |
| Gateway identity/recovery | `node --test packages/codex-app-server-wrapper/test/gateway.test.mjs packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs` checks consumer isolation, resume token, replay, backend-adapter binding and unknown outcomes. A combined local gateway/wrapper restart fixture restores one bound turn without redispatch; a separate wrapper fixture evaluates opt-in semantic completion after restart. | Same-task history watermark, exact adapter implementation identity, selected host restart and rollback; complete interaction-learning and runtime-journal history recovery. |
| DSH capabilities/history | `node --test packages/dsh-gateway-backend-adapter/test/server.test.mjs packages/codex-app-server-wrapper/test/gateway.test.mjs` checks capability receipts, pre-dispatch rejection of unsupported steering, interrupt, ephemeral default, opt-in durable resume, and a combined gateway/backend restart for one fixture binding. It also rejects DSH resume/turn dispatch against an unowned thread after gateway-index loss, rejects unowned or unknown server events and unsolicited/mismatched responses, and runs one local DSH turn plus owned close through the real gateway CLI and ARE wrapper. | Orphan-history migration, arbitrary external DSH protocol conformance, installed-client task history and exact host handover remain unverified. |
| Adapter observation | The source suite checks a pure allowlisted projection and negative claims; native Windows named-pipe tests reject wrong tokens, and the extracted-package canary shows Connected/Running/Ready after real Codex initialization without a model turn. The Companion now correlates fresh adapter and backend-thread readings only for a shared gateway runtime epoch, downgrading mismatches to last seen. Its 17-test unit suite and 22-check synthetic Chromium journey passed; see [UI epoch-join evidence](evidence/UI-ADAPTER-THREAD-EPOCH-JOIN.md). | Exact host/task identity, native pipe ACL and unauthorized-reader review, installed-package behavior and freshness under restart before an operational claim. |
| Internal conversation facade | `node --test packages/conversation-runtime/test/*.test.mjs` checks its own ordering and gates. | Production gateway-to-conversation identity binding, or an owner decision to keep it a separate product mode. |
| Other providers and interfaces | MCP, hook, coding-agent and Companion suites retain their own boundaries. | No claim of host-chat control from a tool, model transport or status UI. |
| Public website chat | The combined chat, closure, edge, broker and provider-gateway suite passed 27/27 on 2026-09-26, including no-route conversation and ambiguous-gate closure. Website build passed after regenerating the documentation projection. The mocked browser regression passed 17/17 in a cached, network-isolated Playwright container, including visible no-route labels, same-tab refresh, and rejection of opener-cloned storage; the host browser still lacks `libnspr4.so`. The earlier four backend failures are historical baseline, not current status. | Separately exercise a live provider turn and wider browser/tab variants before claiming the whole website chain; process-memory server sessions remain separate from gateway ownership. |

Passing these local checks validates the listed primitives only. It does not
establish live registration, provider correctness, end-to-end admission,
security review, product approval, release or deployment.

## Open Questions

- Should the internal conversation facade become the gateway's logical owner,
  or remain a separate ARE-native conversation mode?
- Which specific compatibility path has users and must be migrated before it
  can be retired?
- Which backend capability and recovery proofs are mandatory for each selected
  client experience, especially unsupported DSH steering and effect tools?
- How should the website's process-memory state relate to core Reasoning State
  without claiming gateway durability? Its verified no-match conversational
  policy is now implemented, but has no live browser/provider proof yet.
