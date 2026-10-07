# G1 installed-host user input through managed desktop route — 2026-10-02

Status: bounded D2 construction evidence. Authority effect: none. No installed desktop UI, current task, external model, live account state, or discontinued TUI was involved.

## Test boundary

The [isolated native canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-desktop-gateway-elicitation-canary.mjs) now accepts a `user-input` mode alongside its existing MCP-form mode. It uses a private `CODEX_HOME`, a loopback-only fixed Responses provider, the installed pinned WSL App Server, the managed desktop shim and separate JSONL client, an authenticated acknowledged gateway, and the ARE wrapper. The provider emits one fixed `request_user_input` function call on a new gateway-owned thread/turn. The desktop-protocol client replies with the fixed option; the provider's second request must contain the corresponding function output before it returns a terminal message.

Both observed launch profiles passed with `codex-cli 0.155.0-alpha.16.4` at SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`:

| Profile | Native request | Bound answer and resolution | Turn | Provider calls | Cleanup |
| --- | --- | --- | --- | --- | --- |
| `desktop-wsl-base/v1` | `item/tool/requestUserInput` with matching thread and turn, one blocking question | Private response intent and matching `serverRequest/resolved` | completed | 2 local, 0 external | complete |
| `desktop-wsl-app-tools/v1` | same | same | completed | 2 local, 0 external | complete |

The MCP-form mode was rerun after the shared-canary edit and still passed. A post-run check found no `are-native-desktop-elicitation-*` temporary roots or surviving canary gateway/shim processes. The prior [MCP-form evidence](G1-DESKTOP-NATIVE-ELICITATION-2026-10-01.md) explains why the isolated client declares `experimentalApi` for ARE's generated turn context.

## Claim ceiling

This proves the installed App Server's user-input request, answer, native resolution, and turn completion can cross the managed desktop gateway path when driven by a separate desktop-protocol client. It does **not** prove that the installed Codex desktop UI launches this shim, renders the prompt, routes the user's answer through it, or releases control of an existing task. Native approval methods, complete host method/event coverage, D3 restart behavior, D4 same-task writer release, and the Companion UI remain separate work.

## Open Questions

- Will a disposable desktop-owned task show and answer this request through its actual UI while using the managed WSL command path?
- Can a desktop-equivalent restart reconcile an unanswered or outcome-unknown native user-input request without a duplicate turn or stale prompt?
- Which native approval methods and event variants remain unproved through this path?
