# G1 installed App Server request coverage

Status: generated-protocol, local-client and disposable native-delivery evidence,
updated 2026-09-27. Authority
effect: none. This does not activate or hand over the desktop task.

## Exact source and boundary

The running desktop App Server (PID 1954 at observation time) resolved to
`/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex`, reporting
`codex-cli 0.155.0-alpha.16.4` and executable SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
Its read-only `app-server generate-ts --experimental` operation emitted a
`ServerRequest.ts` with SHA-256
`1c5837adbfbdd005f387478ba87840808d1353b47b82dcf63739a78bb1c8d3be`.
Generation used an isolated temporary directory. These are the methods in that
version's generated protocol, not proof each was delivered during this task.
The [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
states that generated schemas match the CLI version used to produce them.

| Generated server request | ARE programmatic client disposition |
| --- | --- |
| `item/commandExecution/requestApproval` | Local approval handler, default decline; Windows host may present a pending approval. |
| `item/fileChange/requestApproval` | Same. |
| `item/permissions/requestApproval` | No permission grant; response includes empty permissions and required turn scope. Windows host refuses permission expansion. |
| `mcpServer/elicitation/request` | Shared client declines by default. The hosted Windows client has a bounded, authenticated standard `form` prompt/answer path; unsupported modes and schemas decline with null content and required null `_meta`. One disposable installed-host MCP form canary passed; current desktop-task delivery remains unverified. |
| `item/tool/requestUserInput` | Hosted Windows client has an authenticated prompt/answer path; one installed-host, disposable-task canary passed through gateway and HTTP answer API. Other consumers do not install a handler by default. |
| `item/tool/call` | Gateway and direct shared wrapper now return JSON-RPC unsupported before any client delivery; no dynamic tool executor or ARE effect assessment exists for this method. |
| `account/chatgptAuthTokens/refresh` | Gateway and direct shared wrapper return JSON-RPC unsupported before client delivery; no host credential refresh. |
| `attestation/generate` | Gateway and direct shared wrapper return JSON-RPC unsupported before client delivery; no request attestation. |
| `currentTime/read` | Local thread-scoped handler returns whole Unix seconds in the generated `{currentTimeAt}` shape; no native delivery proof. |
| `applyPatchApproval` | Gateway and direct shared wrapper return JSON-RPC unsupported before client delivery. |
| `execCommandApproval` | Gateway and direct shared wrapper return JSON-RPC unsupported before client delivery. |

The generated response types require `scope` in
`PermissionsRequestApprovalResponse` and `_meta` in
`McpServerElicitationRequestResponse`. The shared
[`server-request-contract.mjs`](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/server-request-contract.mjs)
now supplies those fields to the RPC client and Windows approval broker.
An RPC timeout aborts a pending Windows approval, removes its UI prompt, and
rejects a later accept. Local focused tests cover response shapes, abort and
joined RPC-to-broker behavior. No live desktop request was answered by ARE.

The hosted client now accepts `item/tool/requestUserInput` through an optional
RPC handler and a bounded Windows-client broker. It renders selectable or
free-text questions (password input for `isSecret`), validates one answer for
each exact question ID, and returns the generated `{answers: {id:
{answers: [text]}}}` shape. Answers are sent only in the host response; state,
SSE events and HTTP acknowledgements contain no answer text. RPC abort,
broker expiry, and matching `serverRequest/resolved` retire stale prompts.
Valid `autoResolutionMs` deadlines return an empty answer map instead of a
handler error when no answer arrives.
The [native user-input canary](G1-NATIVE-USER-INPUT-CANARY.md) now verifies
one installed-host delivery through the actual gateway, hosted HTTP answer
path, and rendered Chromium keyboard interaction. It does not answer requests
from the current desktop client or verify Windows WebView behavior. See the
[official App Server request lifecycle](https://learn.chatgpt.com/docs/app-server).

The hosted client also has an opt-in standard MCP `mode: "form"` broker. It
projects only bounded, supported field descriptors into authenticated state,
renders the request in the owned-thread browser UI, and returns typed content
only after an explicit accept. Decline, cancel, timeout, abort and matching
`serverRequest/resolved` retire the prompt. Unsupported `url`, `openai/form`
and `openai/userVerification` modes and unmodelled schema constraints decline
without asking the user; other RPC clients retain the default decline. Schema
defaults, submitted content, state, HTTP acknowledgements and SSE events are
kept separate so submitted answers do not echo into those read models. Local
RPC/HTTP fixtures and a native Windows Chromium rendering test verify this
slice. A later disposable installed-host canary verified one native standard
form delivery through the actual gateway and hosted HTTP answer path. No MCP
elicitation was observed from this desktop task.

## Validation

- The G1 unassessed-tool-call boundary now denies `item/tool/call` in the
  version-bound Codex gateway before a pass-through wrapper can expose it,
  and in the direct shared wrapper before client delivery. Focused host-policy,
  gateway and wrapper suites passed 155/155; the separate stdio-proxy and
  host-policy run passed 9/9, including direct wire-level denial. The gateway fixture used an owned
  thread and verified the denial went upstream while a later owned completion
  still reached the client without the tool-call payload. This is local
  fail-closed coverage for one generated request, not universal interception
  or proof of native delivery on the desktop task.
- The full `codex-app-server-wrapper/test/*.test.mjs` suite subsequently
  passed 443 tests: 434 passed, 9 skipped, 0 failed.
- A later direct-wrapper conformance pass classifies all 11 generated server
  requests: three assessed approval methods, three explicit client
  interaction/read methods, and five unsupported methods denied upstream
  before client delivery. Unknown future requests also fail closed. The
  focused host-policy, wrapper and stdio-proxy suites passed 86/86. This
  changes the current direct shared wrapper, not the historical digest-bound
  governance proxy or an already-running desktop client.
- The full wrapper suite passed after this change: 444 tests, 435 passed,
  9 skipped, 0 failed. The integration-surface registry retains direct mode
  as compatibility-only and activation-ineligible.

- `node --test` for the RPC-client and Windows-client-host fixtures passed
  24/24, including a joined RPC-timeout-to-broker cancellation test.
- The full serial `codex-app-server-wrapper/test/*.test.mjs` suite exited 0
  after this change.
- The disposable `windows-client-canary.mjs` initially timed out because its
  startup matcher still expected `are.codex-gateway-ready/v1`. The current
  gateway emits the model-neutral `are.gateway-ready/v1` receipt. After the
  matcher was corrected, the canary passed with the selected native Codex
  version, loopback HTTP 200 from Linux and Windows, and zero model turns.
  Its continuity activation is for the isolated candidate gateway profile,
  not the current desktop task.
- The new focused RPC and Windows-host suites passed 28/28. The full serial
  wrapper suite and disposable Windows-client canary passed after this edit;
  the canary started zero model turns.
- The installed-host user-input canary passed with one fixed loopback-provider
  turn, one host prompt, one authenticated HTTP answer, and terminal resolution;
  a second run passed through a rendered Chromium form using keyboard input.
  See [native delivery evidence](G1-NATIVE-USER-INPUT-CANARY.md).
- After the browser UX and auto-resolution fixes, focused RPC and Windows-host
  suites passed 29/29; the native non-browser canary passed again.
- A later bounded `currentTime/read` construction used the same installed
  `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
  to generate its current JSON schema in a disposable directory. The request
  requires `threadId`; the response requires integer `currentTimeAt` as whole
  Unix seconds. The shared RPC client now returns that shape only for a
  nonempty, trimmed, bounded thread ID, and returns a content-free invalid-
  parameters error otherwise. The gateway catalog already requires the
  thread scope before forwarding and now has explicit valid/missing-ID tests.
  Focused RPC and host-policy suites passed 25/25. The full serial wrapper
  suite passed 435 tests: 427 passed, 8 platform/browser skips, 0 failed.
  This is local handler and ownership-classification evidence, not observed
  installed-host delivery of `currentTime/read`.
- The bounded standard MCP form construction passed focused RPC/Windows-host
  tests 62/62, including schema rejection, typed answers, answer privacy,
  expiry and stale-prompt cleanup. Native Windows Chromium browser tests passed
  4/4, including an owned-thread form submission. The exact installed-host
  method catalog verified 11 server-request methods for
  `codex-cli 0.155.0-alpha.16.4`. The full serial wrapper suite passed 440
  tests: 431 passed, 9 skipped, 0 failed. These are local construction checks, not
  native MCP request delivery or current-task handover.
- The isolated `scripts/native-mcp-elicitation-canary.mjs` passed against the
  exact installed `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
  A temporary Codex home configured one disposable STDIO MCP server and a
  fixed loopback Responses provider. The server's `elicitation/create` produced
  one native `mcpServer/elicitation/request` for the gateway-owned thread/turn;
  the authenticated hosted endpoint accepted a typed answer, App Server emitted
  matching `serverRequest/resolved`, the MCP tool returned the accepted marker,
  and the provider observed that marker on its second request. The turn
  completed, temporary configuration was removed, the native child was reaped,
  and external model calls were zero. Initial construction runs exposed
  fixture mistakes (an unrouteable turn prompt and a missing namespace on the
  synthetic model tool call); the final canary uses the observed namespace
  shape. This proves one disposable installed-host path, not all MCP schemas,
  Windows WebView rendering, this task's delivery, or account/desktop handover.

## Claim ceiling

Three approval methods have a local handler; one elicitation method has a
hosted standard-form handler, one disposable native delivery canary and safe
default decline elsewhere; one user-input method has a hosted-client handler only; one scoped
current-time method has a local handler; five generated methods remain
explicitly unsupported, including `item/tool/call` now denied by the Codex
gateway and direct shared wrapper rather than only by a hosted RPC client. All
five are now denied by the current direct shared wrapper independently of its
attached client. A negative
response is protocol liveness, not functional support. This host-schema
snapshot is not a verified account binding, complete UI ingress, universal
effect interception, or exclusive control of the current task. G1 remains
open and the Companion must continue to show host-task control as unverified.

## Open Questions

- Can native delivery bind hosted user-input and MCP form prompts to the exact
  desktop task? Which client will handle unsupported MCP elicitation modes
  after activation?
- Which generated requests can the selected host actually emit under its
  initialization capabilities, and which require native delivery canaries?
- What supported desktop action can relinquish and restore the current task's
  writer while preserving new input and approvals?
