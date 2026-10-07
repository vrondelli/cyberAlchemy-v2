# ARE / Codex / DSH integration research

Status: research candidate, 2026-10-04. Authority effect: none. This is a
source-backed input to a separate revised DAG, not an implementation approval,
host activation, or statement that a stock Codex or DSH Web chat is ARE-owned.
The TUI is discontinued and is not a target client or fallback.

## Question and evidence method

Target topology: **harness client -> ARE gateway -> harness backend -> model**.
For a selected conversation, the client must have one admitted turn ingress and
one writer, with attributed context, effects, completion, delivery, and
recovery. A plugin event, MCP tool, displayed status, or read-only observation
alone does not establish that topology. I compared current public primary
documentation and open-source implementation descriptions with the local
[session-control contract](SESSION-CONTROL-CONTRACT.md),
[Codex New Chat feasibility plan](G1-CODEX-NEW-CHAT-FEASIBILITY-PLAN.md),
[work-pack evidence](INTEGRATION-WORK-PACK.md), and adapter code. Upstream
`master`/`dev` descriptions may drift; pinned local behavior governs tests.

## External techniques worth borrowing

| Source | Reusable technique | Boundary for ARE |
| --- | --- | --- |
| [Codex App Server](https://learn.chatgpt.com/docs/app-server) | Typed, version-generated protocol; thread/turn lifecycle; bidirectional server requests and notifications; explicit client implementation. | Supports a custom ARE-controlled Codex client. It does **not** document redirecting the stock desktop New Chat composer to ARE. Experimental `--code-mode-host` is an outbound Code Mode host selection shared by an app-server process, not client ingress or a stock-app writer transfer. |
| [Codex plugin packaging](https://developers.openai.com/plugins/build/plugins) and [extensions](https://developers.openai.com/plugins/build/extensions) | Distribution, local hooks/MCP, side panels and composer mentions for status or bounded interaction. | UI/plugin affordances are not a replacement for the app's session-controller transport; do not call this automatic control. |
| [DSH Web Client](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md) and [connection](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/connection/README.md) | Separate physical carrier, API gateway, session controller and rendering; reconnect generation, authenticated session, cursor/baseline repair. | A generic reverse proxy around `/api` risks changing DSH authentication and origin behavior. An event mirror cannot intercept Web prompt ingress. |
| [DSH session-controller](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/README.md) | Host service owns create/resume/prompt/queue/cancel/history and prompt `requestId` deduplication; durable event cursor and writer lock. | This is the decisive Web seam. Prove a supported composition/wrapper that mediates every relevant mutation before claiming ARE control. |
| [DSH extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md) and [plugin setup](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/) | Cordis profile overlay, scoped plugin lifecycle, agent/tool/turn hooks and Web presentation nodes. | Hooks help context/effect instrumentation, but `agent/request` or `tools/pre-execute` alone cannot prove sole human-message ingress. |
| [Official DSH ACP server](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/acp/acp/README.md) | Existing automation controller with persistent session operations, prompt/cancel and permission handling. | Its documented surface omits some Web/interactive capabilities; an ACP client is a distinct surface, not the stock DSH Web composer. |
| [Third-party DSH ACP bridge](https://github.com/openma-ai/deepseek-harness-acp) | Transport-independent Host plugin, native DSH session log -> streamed ACP text/reasoning/tool/permission/plan updates, session load and cross-process writer lock. | Useful design reference or separately tested candidate. The README identifies bundled DSH `0.1.5-rc.1`; ARE pins `0.1.5-rc.2`. Check exact compatibility, security, and Apache-2.0 obligations before dependency/adoption. It does not automatically reroute DSH Web input. |
| [ACP session lifecycle](https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/session-setup.mdx) and [Rust SDK quickstart](https://github.com/agentclientprotocol/rust-sdk/blob/main/md/protocol-v2-quickstart.md) | Capability negotiation and explicit session new/resume/prompt/cancel/close; distinguish prompt acceptance from terminal idle/completion. | ACP is a possible adapter boundary; do not flatten its lifecycle into Codex JSONL semantics or count an ACK as a completed turn. |
| [OpenCode SDK](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/sdk.mdx) and [server events](https://github.com/anomalyco/opencode/blob/dev/packages/server/src/handlers/event.ts) | Generated typed API with central event stream and bounded/reconnect-aware client behavior. | Architectural comparator only; moving `dev` APIs and a different permission/session model make direct copying unsuitable. |

DSH is a developer preview, so interface/version drift is a live design risk;
the [upstream repository](https://github.com/deepseek-ai/deepseek-harness)
must be pinned for any executable work. The third-party ACP bridge is not an
installed or endorsed ARE dependency. Its existence is evidence of a plausible
composition shape, not proof that its implementation meets ARE ownership,
privacy, effect or recovery rules.

## Local implementation analysis

| Existing ARE surface | What is reusable now | Missing join / limit |
| --- | --- | --- |
| [Codex gateway](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs) and [backend adapter](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend-adapter.mjs) | Closed method catalog, consumer/thread ownership, durable request/delivery journal, fail-closed unknown outcomes, version-bound backend identity, actual wrapper path. | No proven installed desktop New Chat invocation, native UI response-consumption receipt, or complete stock-app path coverage. A gateway pipe write is not proof of rendered/consumed delivery. |
| [Desktop shim](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-desktop-shim.mjs) and [managed session](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-managed-session.mjs) | Opt-in version-bound WSL launch candidate and separate managed client with no direct fallback. | Direct shim canaries are not desktop-owned ingress. The [G1 launch evidence](evidence/G1-DESKTOP-LAUNCH-OVERRIDE-2026-10-01.md) records no verified real app-owned shim call. |
| [DSH adapter](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/README.md), [server](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/server.mjs), [runner](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/dsh-runner.mjs) | Bounded text turns, workspace limits, durable adapter-thread history, interruption, zero advertised effects, closed shim events. | It spawns `dsh --profile headless` per turn with conversation-history text replay. Its `dsh-thread-*` history is **not** a native DSH Web session/journal. It does not control DSH Web, ACP, steering, or native DSH session persistence. |
| [Session-control contract](SESSION-CONTROL-CONTRACT.md) and [G1 feasibility](G1-CODEX-NEW-CHAT-FEASIBILITY-PLAN.md) | Exact activation and single-writer claim ceiling, plus a disposable desktop proof ladder. | The stock Codex desktop path remains an unproved feasibility branch, not a prerequisite for a separately owned ARE custom client. |
| [Objective gap evidence](evidence/G1-CLI-ACTIVE-OBJECTIVE-ROUTING-GAP-2026-10-01.md) and [managed continuity evidence](evidence/C2-MANAGED-OBJECTIVE-COMPACTION-RESTART-2026-10-01.md) | Managed, owned-thread objective/requirements continuity has selected restart/compaction/steer proofs. | Repository CLI session IDs are caller labels, not authenticated host conversation identities; the active-objective binding must be established before first host dispatch for each new surface. |
| [Effect release evidence](evidence/G1-DYNAMIC-TOOL-REVOCATION-2026-09-30.md) | Local effect broker, model-wire guard and fail-closed managed path have bounded probes. | Persisted Codex dynamic tools have no verified revocation-on-resume path. Effect-enabled threads cannot be released to an ordinary direct client on the current evidence. Windows effect sandbox is a separate no-go gate; read-only text does not need to wait on it. |

These local statements are source inspection and existing bounded evidence,
not a new end-to-end installed-app test. In particular, the DSH adapter's
history persistence is *adapter-owned replay*; calling it native DSH session
reuse would conceal the main integration gap.

## Options and conclusion

1. **DSH Web as client, ARE as exclusive mediator (preferred research path for
   the requested Web outcome):** instrument or wrap the session-controller
   mutation boundary in a disposable DSH composition, preserving its Web
   connection/auth and journal semantics. Prove prompt, queue, cancel,
   approval, history and reconnect all cross ARE or fail closed. If the plugin
   system cannot replace/mediate the controller without a second writer, stop
   this branch; do not claim hooks or a reverse proxy solved it.
2. **ARE-owned DSH client over a native Host/ACP adapter:** likely a faster
   controlled vertical slice and useful for protocol validation, but it is a
   *different client* from stock DSH Web. Choose one authoritative native DSH
   session journal and writer lock, with exact version and dependency review.
3. **Retain current headless DSH adapter:** valuable for isolated read-only
   text turns and adapter conformance; it cannot serve as proof of Web
   integration or full DSH feature parity.
4. **Codex:** pursue the separate installed desktop G0/G1 feasibility proof.
   If the stock client will not invoke an ARE-controlled backend, a custom
   ARE/Codex App Server client remains feasible but must be named honestly as
   such. Plugin extensions are useful for status, not a substitute ingress.

The implementation decision is therefore *not* “use ACP everywhere.” It is
to define one ARE conversation contract, test each harness-specific ingress
and event mapping against it, and admit only the surfaces whose writer,
identity, delivery and recovery claims are proven.

## Open Questions

- Can the pinned DSH Web composition replace or wrap `ctx.sessionController`
  before all client prompt/queue/cancel mutations, without creating a second
  writer or weakening the Web auth boundary?
- Will the native DSH session lock and event cursor hold across the selected
  ARE process topology and pinned DSH version? Which component owns retention?
- What exact installed Codex desktop observation constitutes app-owned New Chat
  launch, first turn and UI-consumed delivery?
- Which host/client identity and session creation receipt binds the first
  objective before model dispatch, and how is it recovered after a crash?
- Which effects are truly enforceable and safely releasable on each OS and
  backend, rather than only visible to an advisory hook?
