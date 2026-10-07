# G1 Codex desktop New Chat feasibility and candidate plan

Status: candidate research and draft plan, 2026-10-02. Authority effect: none.
Owner: ARE product owner with the Codex desktop host integrator. This is not an
installed-app configuration, activation decision, executable work-pack, or
claim that a Codex-app chat is ARE-controlled. TUI is discontinued and excluded.

## Exact outcome and verdict

The intended outcome is: when the user creates a **new local chat with the
Codex desktop app's New Chat action** for a selected WSL project, that chat's
first and subsequent supported turns cross one ARE gateway writer, while the
Codex app remains the visible input, approval, and rendering client. A separate
ARE browser or Companion chat does not satisfy this outcome. Existing-chat
transfer remains the separate [G1 handover problem](G1-HANDOVER-CANDIDATE.md).

**Feasibility verdict: technically plausible for this pinned Windows/WSL
installation, not yet demonstrated in the installed desktop UI, and not a
documented stable Codex-app extension.** The [official App Server
documentation](https://learn.chatgpt.com/docs/app-server) supports a client
starting a thread, sending turns, and receiving events. It does not document
redirecting the stock desktop New Chat action through a third-party session
controller. The [official Hooks documentation](https://learn.chatgpt.com/docs/hooks)
allows context and blocking at named lifecycle events, not transport/writer
ownership. The [Windows app documentation](https://learn.chatgpt.com/docs/windows/windows-app)
requires selecting the WSL agent and restarting the app; a terminal-shell
setting does not select the agent. These are boundaries of the documented
interfaces, not proof that an internal or future supported route cannot exist.

The installed Windows app is `26.917.9434.0`; its read-only `app.asar` digest is
`d4234b03eb532fe0f3e9a7d90caad51edb68af45f771cc786d966377e7446f5a`.
The live WSL backend still reports `codex-cli 0.155.0-alpha.16.4`; the local
method-catalog verifier observed 164 client requests, 82 server notifications,
11 server requests, and one client notification. Read-only bundle inspection
found a version-bound WSL `CODEX_CLI_PATH` command-name selector. Direct
invocations through our opt-in [shim](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-desktop-shim.mjs)
and managed gateway pass `initialize` and isolated protocol canaries. However,
the prior isolated Windows launches did **not** observe a shim invocation and
did not establish an authenticated WSL project/New Chat journey; see the
[launch research](evidence/G1-DESKTOP-LAUNCH-OVERRIDE-2026-10-01.md). The
absence of a trace in those runs is inconclusive, not proof of impossibility.
The [official desktop deep-link reference](https://learn.chatgpt.com/docs/reference/commands#deep-links)
now gives a supported workspace-targeted `codex://threads/new?path=` entry point.
It opens a local chat but does not submit a prefilled prompt. An
[isolated deep-link probe](evidence/G1-DEEPLINK-INGRESS-PROBE-2026-10-02.md)
created a separate app process without a shim trace or submitted turn; its
authentication and visible workspace selection remain unproved. The link
improves the G0 ingress recipe, not the feasibility verdict.

The current [Hooks contract](https://learn.chatgpt.com/docs/hooks) gives
`UserPromptSubmit` a prompt-blocking/context result and gives supported local
tool paths `PreToolUse` coverage, but explicitly leaves some tool paths outside
that coverage. Thus hooks could provide an **advisory or partial guard**, not
an exclusive session writer or complete effect boundary. The
[plugin contract](https://learn.chatgpt.com/docs/plugins) adds skills and MCP
tools to a chat; it does not define replacement of the desktop composer or App
Server transport. [Remote Control](https://learn.chatgpt.com/docs/remote-connections)
can start and continue host chats through paired supported clients, but its
documented setup is an app-managed device connection, not a general third-party
controller API. `codex remote-control` is likewise documented for managed
remote clients, not as the local custom-client App Server interface; see
[Developer commands](https://learn.chatgpt.com/docs/developer-commands).
These are limits of the consulted public contracts, not universal claims that
an internal or future host extension cannot exist.

The 2026-10-03 official-documentation recheck leaves this verdict unchanged.
[Codex App Server](https://learn.chatgpt.com/docs/app-server) still describes
`thread/start` and `thread/resume` for a client integrating Codex into its own
product, not redirection of the stock app's New Chat writer. Its documented
experimental `dynamicTools` persist in thread metadata and are restored on
resume when no replacement is supplied; that is not a rollback guarantee.
[Plugin Extensions](https://developers.openai.com/plugins/build/extensions)
now describes desktop composer mentions, but their declared purpose is finding
and selecting plugin content, not intercepting New Chat or transferring
transport ownership. [Hooks](https://learn.chatgpt.com/docs/hooks) document
`UserPromptSubmit` context/blocking and lifecycle events, not an exclusive
session-controller interface. This is an inference from the cited public
contracts and says nothing about undocumented or future host support.

| Candidate route | Does it meet the stock-app New Chat outcome? | Evidence boundary |
| --- | --- | --- |
| ARE as a separate App Server client | No; it can own a new Codex thread but not the stock app's New Chat action. | Documented `thread/start` supports a custom client, not desktop composer interception. |
| Hooks, skills, or a plugin | No full-control proof; useful for context and bounded blocking. | Their documented lifecycle actions do not transfer the desktop's transport or writer. |
| Version-bound WSL launch shim | Potentially, if the actual app process selects it before New Chat and every relevant request crosses the gateway. | Bundle seam and direct canaries exist; graphical app invocation is unobserved. Not a public stability contract. |
| Future supported desktop integration | Yes if it supplies an explicit backend/session-controller hook with exclusive routing and receipts. | No such contract was found in the consulted current official documentation or pinned method catalog; recheck on host updates. |

If a supported host integration is offered later, prefer it over the
version-bound launch shim. The minimum required host contract is: route a
selected *new* desktop chat to one external controller before `thread/start`;
bind authenticated app/account, workspace and thread identity; send all user
messages, interruptions and server-initiated input/approval responses through
that controller; prevent a competing direct writer; provide durable delivery
and history reconciliation; and fail closed or reverse the binding explicitly.
Without those guarantees, an ARE tool inside the chat is still not ARE control
of the chat.

## Reuse and remaining gap

The [desktop gateway construction](G1-DESKTOP-GATEWAY-ADAPTER-CONSTRUCTION.md)
already supplies the opt-in launch shim, pinned backend/profile checks, an
acknowledged desktop JSONL client, private request/delivery journal, gateway
thread ownership, and isolated native user-input/MCP canaries. Reuse those
pieces; do not introduce a second ARE controller or switch to the retired TUI.
Its current D3 restart correctly fails closed on retained delivery because
writing a reply to the desktop pipe is not proof that the app consumed it.
The complete installed desktop method/event path, native approval UI,
graphical New Chat ingress, rendered replies, and recoverable client receipt
remain unproved. The [session-control contract](SESSION-CONTROL-CONTRACT.md)
remains the claim ceiling.

For a **new** thread created through the mediated path, D4's release of an
existing writer is not a prerequisite. D0-D3 and a new desktop proof gate
`D5N` form the construction path. D4 stays necessary for taking over this
already-running task or another existing desktop-owned chat. This distinction
does not make D3 or D5N complete.

```text
Host/version freeze + isolated authenticated WSL project
  -> G0: observe the real desktop invoking the opt-in shim
  -> G1: observe desktop initialize and exact New Chat thread/start through ARE
  -> G2: bind the new thread before desktop delivery; rule out a second writer
  -> G3: first bounded turn, native UI reply and approval/input coverage
  -> G4: clean restart, unknown-delivery reconciliation, safe stop/rollback
  -> G5: D5N product review and separate activation decision

Existing-chat D4 handover branches after G4; it is not silently folded into G5.
```

## Gate-by-gate work plan

| Gate | Minimum work and exact evidence | Stop condition |
| --- | --- | --- |
| G0 — real app launch | In a disposable, authenticated Windows app profile with the WSL agent selected, open the exact WSL workspace through the documented `codex://threads/new?path=` link or the app project picker. Verify the selection in the app, then submit one benign turn if opening the composer alone does not launch a backend. Use per-process-only settings, a private content-free launch trace, the pinned shim and backend, and a separate state root. Correlate the app-owned process with the actual shim invocation and backend profile. Keep the primary app, task, auth home, and global PATH untouched. | If a genuine submitted WSL New Chat never invokes the selector, do not infer stock-app integration from direct shim tests or an empty-composer deep link. Recheck documented host support and stop this version-bound path for product decision. |
| G1 — desktop protocol ingress | Capture only method names, request IDs, bounded digests, timestamps, and process identity for `initialize`, `thread/start`, and first relevant UI event. Compare with the pinned method catalog. Do not retain prompt, account token, approval body, or transcript. | Unknown launch form, incompatible initialize, or ungoverned alternate `thread/start` blocks. |
| G2 — exclusive new-thread claim | The gateway checkpoints the new `thread/start` result and backend-thread digest before exposing it to the app. Verify the app shows the same thread identity, and a second direct writer cannot start a turn on it. Existing threads on the same App Server must remain explicitly outside this activation, not automatically adopted or silently rerouted. | Missing identity/account binding, unowned resume, or direct-writer race blocks. |
| G3 — real first turn | On that disposable desktop-created thread, prove one admitted prompt crosses ARE context/Reasoning State and the gateway, then one terminal host reply renders in the same app. Exercise one native user-input/approval path and a negative unsupported/effect-bypass path before claiming those capabilities. | A gateway ACK, local fixture, or Companion-only view cannot stand in for graphical UI delivery and enforcement. |
| G4 — recovery and rollback | Crash and restart only the test-owned components at request-accepted and reply-written boundaries. Reconcile the desktop's visible/stored history with gateway intent and backend history without duplicating a turn. Prove safe stop; never fall through to direct Codex if a mediated thread has uncertain delivery or persistent ARE tools. | Unknown desktop consumption, stale dynamic tools, or duplicate host turn keeps the thread quarantined. |
| G5 — candidate admission | Repeat against the same pinned app/backend pair with empty, active, interrupted, approval, restart, and unavailable-gateway states. Show Companion status as candidate/verified/degraded, not activated, until separate product and host/user decisions. Revalidate on every app/backend update. | No release, default-on switch, or universal cross-OS claim from a single Windows/WSL pass. |

## Smallest working units for the next construction pass

| ID | Parent gate | Scope | Acceptance evidence | Verification |
| --- | --- | --- | --- | --- |
| N0 | G0 | Document a disposable authenticated profile, WSL agent, workspace-targeted deep link or project picker, per-process environment, exact PIDs, and teardown; no primary-app mutation. | Reproducible setup and exact version/digest record with authenticated/project state established. | Read-only process/package/hash check and manual UI witness. |
| N1 | G0 | Trace whether a real desktop New Chat, including a benign first submission when needed, makes the app invoke the shim; preserve only content-free launch metadata. | Trace plus correlated test-owned App Server process, or a recorded negative result with sign-in, project and submission state known. | Exact-PID process census and private trace review. |
| N2 | G1-G2 | Bind observed desktop `initialize`/`thread/start` to the gateway's creation claim; reject incompatible methods and alternate writer. | One app-created thread ID with matched private/gateway/backend receipts and no direct second writer. | Focused wrapper tests, real gateway fixture, desktop UI canary. |
| N3 | G3 | One first turn and one native interaction round trip through the actual app. | UI-rendered reply and question/approval outcome with exact task/turn/item binding. | Pinned native canary plus desktop visual witness. |
| N4 | G4 | Reconcile restart and unknown output delivery, then prove fail-closed stop. | No duplicate turns; recoverable or visibly quarantined state; no unsafe direct fallback. | Crash-window matrix and backend-history comparison. |

N0-N1 are the current frontier. N2-N4 are **blocked for execution** until a real
app-owned G0 trace exists. Implementation write scopes and executable commands
must be bound in a later D65/task-session work-pack after the feasibility gate;
this document does not authorize implementation. The decision-first layers are
in [G1 new-chat implementation layering](G1-NEW-CHAT-IMPLEMENTATION-LAYERING.md).

G0 requires **a visible-workspace witness** and, if merely opening New Chat
does not launch the backend, a benign graphical submission. These require a
person operating a separately authenticated disposable app instance, or a future
host-provided UI-test/control facility expressly supporting this app. The
documented deep link can prepare the New Chat composer but cannot send it.
Backend-only scripts, app-server fixtures and process traces cannot replace
that witness. No primary profile credentials or mutable session data should be
copied to make the disposable profile appear authenticated. If such an instance
cannot be established safely, record G0 as untested and ask the host integrator
for a supported desktop test surface; do not silently weaken the proof target.

## Product and operational lanes

- Product frontier: an isolated G0 launch proof using the documented
  workspace-targeted deep link and existing candidate shim. It is ready for a
  host-integrator/manual UI witness, not runnable autonomously from the
  backend test harness. A content-free launch trace is sufficient only if the
  app starts its backend before the first submission; otherwise a benign
  app-submitted turn is required.
- Causal blockers: isolated app authentication and visible WSL workspace
  selection are unproved; opening a deep link without submitting a prompt
  produced no shim trace. Actual submitted New Chat ingress and desktop receipt
  remain unobserved.
- Operational support: private state-root/retention owner, future version
  compatibility, installed-app packaging, and security/privacy review are
  separate gates. Minimal isolation and secret exclusion apply already at G0.
- Deferred residue: existing-task D4 handover, native Windows and Linux app
  parity, release/deployment, and TUI. None is a fallback for G0 failure.

## Open Questions

- Can the installed app expose a documented backend-command or session-control
  integration point, or is this WSL selector the only reachable path?
- Does the app create a thread when New Chat is opened, or only after the first
  submitted message? G0/G1 must observe rather than assume this order.
- Which app-visible history/read event can reconcile a response written to a
  pipe before a crash without replaying an accepted turn?
- Can all desktop client methods, server requests, native approvals, and
  app-owned commands be mediated without an unguarded alternate execution path?
