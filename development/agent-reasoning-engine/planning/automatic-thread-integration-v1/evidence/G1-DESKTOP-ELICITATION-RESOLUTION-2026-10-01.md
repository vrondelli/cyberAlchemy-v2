# G1 desktop elicitation and resolution — 2026-10-01

Status: bounded D2 candidate construction evidence. Authority effect: none. The discontinued TUI was not used. No installed desktop configuration, current task, model turn, or live approval was changed.

## Boundary and implementation

The pinned installed-host schema includes `item/tool/requestUserInput`, `mcpServer/elicitation/request`, and the `serverRequest/resolved` notification. The latter contains a thread ID and original server request ID. The [gateway](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs) now requires that resolution to match a previously observed request on the same owned thread, records a content-free digest in the [session journal](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-session-store.mjs), and rejects a later answer to an unanswered resolved request. An unbound or undurable resolution, or reuse of a server request ID, fails closed. The [private desktop ledger](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/desktop-gateway-state.mjs) requires the matching delivered request before it accepts a native resolution and refuses a late answer.

## Verification

- [Session-store fixture](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs): wrong-thread and duplicate resolutions are rejected; a resolved-unanswered state and digest survive file compaction and reopen.
- [Gateway fixtures](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs): a turn-bound user-input request and native resolution cross the acknowledged gateway; a late answer is rejected before backend dispatch, and duplicate host request IDs fail closed.
- [Desktop ledger fixture](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/desktop-gateway-state.test.mjs): wrong-thread or duplicate resolutions and a late user-input answer are rejected without advancing the private ACK watermark.
- [Separate-process fixture](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/desktop-gateway-process.test.mjs): the managed shim, private desktop client, acknowledged gateway, and ARE wrapper carry one accepted turn, a user-input request, an MCP form elicitation, their answers, and ordered native resolutions. Both response intents were persisted before the fake backend received them; the durable gateway records both as resolved-forwarded.

The five focused tests passed locally. The process fixture uses a fake backend and synthetic prompt values, not an installed App Server or desktop UI. Existing installed-host user-input and MCP canaries belong to the hosted-client path, not this separate desktop route. No claim of complete host method coverage, UI delivery, task handover, or ARE control of this conversation follows.

## Open Questions

- Does an isolated installed desktop instance deliver and render both request types through the managed command path with the pinned binary and actual UI ingress?
- What host-supported same-task writer-release and account binding would permit D4 without a duplicate controller?
- Should a native resolution arriving after an uncertain forwarded answer trigger host reconciliation before further input, beyond the present fail-closed restart posture?
