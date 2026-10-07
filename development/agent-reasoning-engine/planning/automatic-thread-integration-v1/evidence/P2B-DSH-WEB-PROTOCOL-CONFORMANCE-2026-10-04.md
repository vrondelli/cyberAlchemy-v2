# P2b — pinned DSH Web SessionController protocol conformance

Status: bounded candidate implementation evidence, 2026-10-04. Authority
effect: none. This is not a DSH Web forwarding adapter, native journal
recovery, or a browser consumption receipt.

## Closed method surface

The [Web protocol contract](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/web-protocol-contract.mjs)
checks the installed `@deepseek-ai/dsh-api-session-controller/typert`
descriptor rather than treating the headless ARE DSH JSONL adapter as Web.
For pinned nested DSH `0.1.5-rc.3`, it requires exactly 16 controller methods:

| Class | Methods | Consequence |
| --- | --- | --- |
| Session mutation | `create`, `selectModel`, `rename`, `fork`, `prompt`, `updateQueue`, `cancel` | Candidate D1 mediation surface; `prompt` admits work but does not complete it. |
| Host effect | `openWorkspacePath` | Separate E0 effect boundary; D0 denial probe confirms the replacement sees it before the native opener. |
| Read/stream | `attachment`, `canOpenWorkspacePath`, `control`, `follow`, `list`, `modelCatalog`, `page`, `search` | Native Host history/control remain authoritative; no ARE text-replay substitution. |

The generated descriptor's method or parameter drift fails the contract test.
This covers SessionController only: workspace, settings, subagent, plugin and
other Host services require a separate bypass/effect inventory.

## Prompt lifecycle distinction

The candidate tracker binds one `sessionId`, prompt `requestId`, and starting
journal cursor. It requires a same-session follow snapshot before consuming
contiguous event frames. A successful `session/prompt` RPC is
`accepted-not-completed`; a queue item or assistant-stream frame is not
terminal. A matching `user/message` with `source.rpcId` identifies the turn,
and only that turn's `turn/end` gives a terminal **event observation**. Unknown
non-ignorable events, gaps, wrong-session baselines, duplicate prompt events
and invalid turn ordering quarantine the tracker. An explicitly ignorable
unknown event may pass without terminal classification.

The pinned DSH session type says the loop does not await storage flush at turn
boundaries. Therefore even a live `turn/end` is not yet a durable recovery
proof. D2 must reconcile through native page/follow and its checkpoint policy
before claiming persistence or redispatch safety. The tracker is not wired to
the Web Host and grants no request/effect authority.

## Verification

The [focused tests](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-protocol-contract.test.mjs)
pass 4/4 against the installed generated descriptor. The combined protocol
and disposable Web-controller probe tests pass 5/5. The D0 probe also denies
`openWorkspacePath` before native dispatch. No model call, installed profile
change, or live-client activation was made.
The full DSH adapter `npm test` run passed 22/22, failed 0.

## Open Questions

- Which non-SessionController Host services can start a turn, mutate native
  session state, or perform effects outside the replacement service?
- How do native DSH storage checkpoint and generation rules prove a `turn/end`
  survives crash/restart for the exact `requestId`?
- Which browser/client receipt, if any, proves a terminal event was rendered
  rather than merely written to a Web transport?
