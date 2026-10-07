# G1 installed-host elicitation through managed desktop route — 2026-10-01

Status: bounded D2 construction evidence, not desktop UI activation, same-task handover, product approval, or release. Authority effect: none. The discontinued TUI was not used.

## Exact test boundary

The [disposable native canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-desktop-gateway-elicitation-canary.mjs) starts a private `CODEX_HOME`, loopback-only fixed Responses provider, fixture MCP server, acknowledged gateway, managed desktop shim and separate desktop JSONL client. It sends one `initialize`, creates one new gateway-owned thread, starts one fixture turn, answers one native MCP form, observes `serverRequest/resolved` and a completed turn, then stops the processes and deletes the temporary root. It neither uses an external model nor opens the installed desktop UI or this task.

The installed WSL binary was `codex-cli 0.155.0-alpha.16.4`, SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`. Final runs exited zero for both observed command profiles, `desktop-wsl-base/v1` and `desktop-wsl-app-tools/v1`. Each reported: two local provider requests, an accepted gateway-owned thread/turn, a native `mcpServer/elicitation/request` form, a private response intent, native `serverRequest/resolved`, completed turn, zero external model calls, and complete scratch cleanup. A post-run check found no `are-native-desktop-elicitation-*` temporary roots.

## Capability finding

The first synthetic turn failed with `selection.no-match` because its prompt did not select a repository route. The second failed with the native error `turn/start.additionalContext requires experimentalApi capability`: the ARE wrapper adds governed context to `turn/start`, and App Server enforces a client opt-in. The canary now declares `initialize.params.capabilities.experimentalApi: true`, matching the already existing hosted-client declaration. This is necessary for the tested path; it must not be silently inferred from a successful `initialize` alone. [Official App Server documentation](https://learn.chatgpt.com/docs/app-server) describes this experimental opt-in and the rejection behavior.

Read-only inspection of the currently installed Windows bundle `OpenAI.Codex_26.917.9434.0_x64__2p2nqsd0c76g0`, `app/resources/app.asar`, SHA-256 `d4234b03eb532fe0f3e9a7d90caad51edb68af45f771cc786d966377e7446f5a`, found its App Server `initialize` builder setting `experimentalApi: true` at byte offset approximately 10,652,798 and its connection path calling that builder at approximately 10,993,608. These offsets are version-bound bundle evidence, not a supported API or a captured handshake from the current desktop task. A different installed package must be inspected again.

## Limits and cleanup

The passing client is an isolated desktop-protocol stand-in, not the running Codex desktop UI. Installed-host MCP form emission and resolution are now proven through the managed gateway path under the opt-in capability; desktop-owned UI ingress, exact account/task identity, full request/notification coverage, native approval and user-input journeys, D3 restart lifecycle, and D4 writer release remain open.

Four scratch roots from earlier iterations retained temporary plugin-clone directories after native shutdown. No canary gateway, shim or installed-host child was still running when those exact roots were removed; the primary desktop App Server was left untouched. The canary teardown now waits for late native plugin work, retries exact-root removal and reports `cleanup_complete`; final runs passed that check.

## Open Questions

- Will an isolated *desktop-owned* task use the same version-bound `initialize` builder and route every approval and user input through the managed WSL process?
- Can D3 preserve exactly one writer across a desktop-equivalent restart and resume after a native MCP interaction?
- What supported host mechanism can quiesce and release the current task's writer before any same-task ARE handover?
