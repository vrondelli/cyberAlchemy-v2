# Codex app-server wrapper candidate

## Windows-facing local client prototype

The package includes a loopback-only browser client for the admitted local
ARE gateway. It does not fork or replace Codex. The client host connects to the
gateway's acknowledged Unix-socket transport, performs the exact app-server
`initialize`/`initialized` handshake, and exposes authenticated local HTTP and
SSE to a Windows browser through WSL localhost forwarding.

The client supports new threads and rejoin of threads it started (same-process
by default, across restarts with opt-in recovery), streamed app-server events,
turn start and interrupt, command and file-change approval decisions, and a
fail-closed permission-expansion boundary. It also renders owned-thread user
input and supported standard MCP forms through authenticated, bounded prompt
endpoints; unsupported elicitation modes decline. It confines selected working
directories to the configured repository root. Its bearer token is ephemeral,
placed in the launch URL fragment, and never written to repository evidence.
The hosted client now pins new, resumed, and subsequent turns to the host's
read-only sandbox with on-request approval. A browser cannot weaken this
policy, and the host constructor refuses `workspaceWrite` until a writable
effect policy is separately admitted. An individual write can still proceed
through an exact one-use host approval; this is not a guarantee that every
possible App Server effect is intercepted.
An arbitrary stored thread ID cannot be resumed through this HTTP client:
`/api/threads/resume` returns `windows-client.external-thread-handover-unverified`
before calling App Server unless the ID belongs to this client host. By default
that set is process-memory only. For opt-in same-client restart recovery, pass
`--state-file <private-path>` to the Windows client and configure a durable
gateway session store separately. The state file contains the gateway session
resume secret and client-created thread IDs; keep its parent directory private,
do not commit or share it, and retain the same state file when restarting.
The WSL/Linux client requires a private parent directory and writes the file
mode 0600. Native Windows recovery uses a user-scoped DPAPI envelope under
`LOCALAPPDATA`; that protection is a prototype boundary, not a deployment
claim. The client verifies digest and consumer
binding, and fails closed on a changed gateway session or unsafe file mode. A new host
process can then resume only those recorded client-created IDs. This is not
takeover of an existing desktop task; that requires a separately verified
desktop-client handover and UI ingress contract.
For a loaded owned thread, the browser now calls the authenticated read-only
`GET /api/threads/:id/rejoin-check` on load. This endpoint shares the exact
recovery, host-binding, and terminal-frontier checks with the subsequent
`POST /api/threads/resume`; the POST checks again because a prior read is not
authorization to resume. A refused check is shown before the user presses
Rejoin and disables browser Send. When the check passes for a recovered thread,
the browser still requires an explicit Rejoin before work. Neither check nor
UI state activates an existing Codex desktop task. The preflight only covers
the rejoin path. A recovered thread with a persisted accepted turn cannot
start a new turn or compaction through the hosted API until that verified
Rejoin succeeds; same-key accepted-receipt replay stays available without
redispatch. Other mutation routes retain their own recovery contracts.
New hosted-client thread creation checkpoints a content-free browser retry
record before HTTP dispatch: a request key, workspace digest, and timestamp.
If its response is lost or the page reloads, the browser offers an explicit
same-key retry for the exact workspace. It neither automatically retries nor
starts a new thread with another key while the record is pending. The host
requires a bounded request key before forwarding; the gateway's durable
stable-request binding determines whether the retry replays a completed
result or stops on an unknown outcome. A user may explicitly forget the retry,
but that does not delete any thread already created by the host. This is a
hosted-client recovery guard, not proof of desktop-task takeover or safe
resolution of every gateway crash window.
For a lost `turn/start` response, new hosted-client sends retain a content-free
v2 pending intent with the exact parameter digest. On restart the client asks
the gateway to inspect owned host history. Only a unique gateway marker plus
exact ARE semantic reconciliation can produce a recovery receipt; the client
durably records that receipt before confirming it to the gateway. Until
confirmation succeeds, new sends remain blocked. The browser's “Check
recovery” action retries this observation without resending the message or
requiring its text. Legacy v1 pending intents remain fail-closed or follow
their pre-existing same-key path; they are not promoted to marker recovery.
This is bounded clean-restart behavior, not host idempotency, crash/power-loss
proof, or desktop-task handover.
On load or rejoin, the browser requests at most 20 recent stored turns for an
owned thread. The host projects only bounded user and assistant text from
App Server's summary history, omitting reasoning and tool items. It renders
history as observation; it never redispatches those turns as new ARE work.

Start the admitted gateway first using the operational command documented
below, then run:

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-windows-client.mjs \
  --socket /tmp/are-codex-gateway.sock \
  --repository-root /home/vlad_/projects \
  --cwd /home/vlad_/projects/cyberAlchemy-v2
```

For one supervised, development-only startup of the same gateway and hosted
client, use `node implementation/agent-reasoning-engine/bin/are.mjs
managed-session` with absolute `--repository-root`, `--codex-command`,
`--config`, and `--state-dir` arguments. The state directory must already
exist outside the repository and be private (mode 0700 and owned by the caller
on POSIX). `--cwd` selects a directory inside the repository root; `--port 0`
selects a free loopback HTTP port. The launcher verifies gateway readiness
before starting the client, reports its bearer-token launch URL once, stops
the other process if either controller process exits, and leaves durable
session/client state intact for a later explicit restart. It starts no model
turn on its own. Optional `--hook-bridge` creates the hosted callback endpoint
but does not install or trust host hooks. Optional `--companion-command` starts
the read-only Companion with this gateway's private observation socket and
token. When the selected Companion has a bundled native-orb sidecar, the
manager supervises that long-lived orb directly and waits for its fixed
post-show readiness signal; the short-lived dashboard launcher is not the
supervised child. The signal proves native-orb startup, not dashboard rendering
or host-chat control. On Windows, private
directory ACL and packaged lifecycle review remain open before installed use.
With `--companion-command`, `--companion-evolution-root /absolute/existing/root`
binds Companion's read-only Evolution view to one canonical directory. The
launcher strips inherited Companion Evolution root and signal-log settings;
without this option, Companion shows the candidate registry only. Its ready
record reports `companion_evolution_root_configured`, which means a source was
selected, not that its ledger was verified or a cycle was activated. The
Companion observer supplies the separate evidence-status check.
For an Evolution-enabled gateway profile, add
`--evolution-signal-log /absolute/private/state-dir/signals.jsonl` to the
managed launcher. Its parent directory must already exist inside the selected
private `--state-dir`; an existing log must be a regular file, not a symlink.
The launcher passes this path to the gateway and requires a ready intake in
the gateway startup receipt before opening the hosted client. Conversely, a
disabled profile must not be launched with this flag. The managed ready record
reports `evolution_signal_intake_status`; `ready` means a candidate-signal
inbox is available, not that an improvement was emitted, activated, or rendered
in Companion. When `--companion-command` is selected, the launcher also binds
that exact private signal log to Companion's read-only candidate-signal view;
its ready record reports `companion_evolution_signal_log_configured`. Companion's
`--companion-evolution-root` remains an independent read-only cycle source.
The [managed Evolution root binding evidence](../../apps/desktop-companion/docs/MANAGED-EVOLUTION-ROOT-BINDING-2026-10-04.md)
records the source-level Linux UI smokes and their package/host limits.
This command creates only ARE-owned client sessions; it cannot adopt this
desktop app's currently open task.
For an opt-in development launch that requires the gateway's selected effective
profile to have objective resolution configured, add
`--require-objective-continuity`. The manager checks the gateway's startup
receipt before opening the hosted client and fails with
`managed-session.objective-continuity-not-configured` if the feature is disabled
or not reported. Its ready record separately reports
`objective_continuity_status` (`configured`, `disabled`, or `not-reported`) and
`objective_requirement_tracking` (`true`, `false`, or `null` when not reported).
These are profile-configuration observations, not proof that any particular
user turn was resolved or that the current desktop task was handed over.
The hosted HTTP `POST /api/turns` path can explicitly supply a bounded
`requirements` array, including a deliberate empty array. The hosted client
binds it into the signed `turn/start` request, and the wrapper seeds the first
tracked objective only after gateway attestation. A missing seed still blocks
a new tracked objective before dispatch; sending a seed while tracking is
disabled also blocks rather than silently ignoring it. The disposable
`scripts/managed-objective-restart-canary.mjs <absolute-codex-binary>
--requirement-tracking` proves explicit requirements persist through a managed
restart and continuation using a private local provider. The ready boolean
still reports configuration, not success for every turn, current-task control,
or Companion UI coverage. The hosted browser has an optional requirement entry
with explicit confirmation; it retains no requirement text in browser storage.
For an uncertain send, the person must re-enter the same list before retrying.
The client rejects a same-key replay if a seeded request's complete binding
digest differs, even when the message text is unchanged.
The hosted `POST /api/turns/steer` path admits only an exact accepted, active
turn with a stable request key and signed hosted input. A same-key retry while
that turn remains active replays one accepted correction without a second host
dispatch. The read-only `POST /api/turns/steer/status` path accepts only the
owned thread ID, expected turn ID and request key; it reports a content-free
gateway disposition even after the turn ends or the managed process restarts.
`settled-accepted` requires a keyed durable host acceptance and complete ARE
response; `host-accepted-unreconciled`, `outcome-unknown`, `unverified` and
`unrecorded` do not authorize a resend or assert that no correction reached
the host. The discontinued TUI is not an integration target.
On Windows the default managed gateway and hosted client still pause model
entry. An explicit candidate `--guarded-text-turns` mode is available on Linux
and Windows with `--require-restricted-host-profile --codex-home <state-dir>/codex-home`,
`--model-wire-upstream <Responses URL>`, and `--model-wire-provider-id <id>`.
The earlier `--windows-guarded-text-turns` spelling remains a Windows-only
compatibility alias; supplying both spellings is rejected.
It rejects `--allow-hosted-effects` and the test-only unverified-hook bypass.
The launcher starts a local authenticated model-wire guard with an empty
allowed-tool set by default, verifies the selected host's effective provider binding and
restricted profile, then binds the no-pause declaration across the gateway and
hosted client. The client rejects a guarded declaration without the managed
parent IPC and restricted catalog. Guard loss stops the supervised session;
normal Windows launches without the explicit switch remain paused. The ready record
calls this `guarded-text-only-candidate`, not complete effect enforcement.
An additional explicit `--guarded-user-input --guarded-plan-model <model>`
option requires guarded text mode. The earlier `--windows-guarded-user-input`
spelling remains a Windows-only compatibility alias. It changes only that managed
session's hosted turns to Codex Plan mode and forwards only the built-in
`request_user_input` tool through the guard. The Plan model is a required,
fixed launch input; it is not inferred from the provider id or selected by a
browser turn. The hosted client already owns the authenticated pending-question
and answer exchange. This option does not admit shell, image, MCP, or effect
tools, does not change default guarded-text or paused Windows launches, and
does not take control of the current desktop task. Its pinned-host proof uses
a disposable fixed-loopback model fixture, not an external provider.
The native Linux fixed-loopback canary passes the one-turn authenticated
question-and-answer path with no external model calls. The extracted updated
Linux Companion package passes the same canary and managed UI smoke; see
[`LINUX-GUARDED-PLAN-PACKAGE-2026-09-29.md`](../../apps/desktop-companion/docs/LINUX-GUARDED-PLAN-PACKAGE-2026-09-29.md).
Neither fixture proves a normal installation, a real provider, universal host
method/effect handling, or current desktop-task handover.
The thread observation separates unresolved hosted-effect gateway dispatches
from other mutation requests. Aggregate and matching backend-thread counts
come from exact durable request
method/status facts, not the hosted-effect journal. The Companion must not
turn it into a claim that the host command ran or may safely be retried.
Optional `--require-restricted-host-profile --codex-home <absolute-path>`
requires the Codex home to be the existing `codex-home` child of the private
state directory, with a private regular `config.toml` (mode 0600 on POSIX).
Before launching the gateway, the launcher starts the selected App Server with
that exact home, performs no model turn, and requires `config/read` to report
`shell_tool`, `unified_exec`, `apps`, `multi_agent`, `goals`, `plugins`, and
`remote_plugin` as `false`, plus `webSearch`/`web_search` as `disabled`.
The effective MCP server set must be empty unless `--require-mcp-hook-relay`
is also selected. In that case it must contain only the required local
`are_hosted_hook_relay` with the expected Node command, exact relay script and
connection-file arguments, and `enabled_tools = ["are_hook_observe"]`.
This mode also requires a dedicated Codex home (apart from isolated test mode)
and an exact private `hooks.json` source profile: prompt and Stop events plus
one synchronous MCP `PreToolUse` handler with no matcher, so every supported
local tool path is selected. A missing, narrowed, extra, or malformed hook
source fails managed startup. Immediately before an owned hosted turn, the
client also requires native `hooks/list` to report exactly these three hooks
from that source as enabled and trusted. A missing, untrusted, disabled, or
unavailable native hook list blocks the turn before recording intent. This
pre-turn check does not establish atomic hook coverage through the turn or
eliminate tool paths that opt out of hooks. The launcher also
binds the dedicated home's exact `config.toml` and optional `hooks.json` bytes before and after the
effective-config read. The gateway rejects a changed file before a new backend
session or model-entry request, and discards any prior MCP catalog snapshot on
drift. Restoring the original bytes requires a fresh per-thread catalog check.
This file check does not atomically bind every Codex configuration layer or
prove that a model-visible tool remains unchanged after dispatch.
The verified home is passed to the gateway,
hosted client, and optional Companion. The ready record says
`restricted_host_profile_status: "verified-startup"` only for this opt-in
mode. It also says `restricted_mcp_catalog_preflight_required: true`: before
each new hosted turn, the client and gateway independently require a fresh
`mcpServerStatus/list` response for the owned thread. The gateway consumes
that response once. With no relay, the list must be empty; with the relay,
it must contain only connected `are_hosted_hook_relay` exposing exactly
`are_hook_observe`. Missing, extra, malformed, or paginated results deny the
turn. This is a pre-turn snapshot, not continuous configuration integrity or
proof of the relay executable's identity. Generated successor turns currently
stop if they have no fresh preflight; they are not silently exempted. This is
not proof that every model tool,
host method, lifecycle path, or live desktop task is mediated. Windows state
directory ACL verification and continuing configuration integrity remain open.
The isolated `scripts/restricted-lifecycle-canary.mjs` checks this exact
candidate on a pinned host with a loopback model fixture: `lifecycle` compares
model-tool catalogs across App Server restart and thread resume,
`managed-startup` checks the launcher's ready binding, and
`managed-hosted-startup` checks the opt-in hosted-effect binding, while
`managed-relay-startup` checks the exact relay exception.
`managed-invalid-profile` and `managed-unapproved-mcp` require refusal before
ready. Managed startup canaries assert the restricted catalog requirement is
bound in the launcher ready record. `managed-turn`, `managed-hosted-turn`, and `managed-relay-turn`
also create an isolated ARE-owned hosted thread and verify that one turn passes
both catalog checks to a loopback model fixture with no native effect tools or
unexpected MCP tools advertised. `managed-drift-turn` changes `config.toml`
after managed startup and verifies HTTP 409, no pending turn, and no model
dispatch. `managed-hosted-effect-turn` additionally drives a real one-use
browser approval and sandboxed command through the managed launcher using a
local fixed provider; it requires a browser click at the printed loopback URL.
`managed-hosted-restart-turn` verifies a clean managed-stack restart from the
same private state, pre-resume turn refusal, exact hosted-thread rebind, and a
second local-provider turn with the ARE effect tool still advertised. It does
not request or execute an effect, and does not prove crash recovery. The
launcher uses private parent-child IPC for orderly gateway and hosted-client
shutdown; the canary checks that their private writer locks are absent before
restarting. This passes on WSL and native Windows with the pinned local host.
`managed-hosted-crash-restart-turn` instead terminates the disposable hosted
client abruptly after an idle completed turn. Both hosts now pass validated
client and effect-journal lock recovery, pre-resume refusal, exact resume, and
a distinct second local-provider turn. This does not test an effect in flight.
`managed-hosted-inflight-crash-turn` accepts a one-use approval inside a
disposable loopback fixture, observes a fsynced effect intent and the matching
gateway dispatch intent, then kills the exact hosted-client process before an
outcome is recorded. WSL and native Windows runs restart with that intent
unsettled, recover the interrupted turn, and then refuse thread resume at the
hosted-effect rebind guard without replay. This proves neither that
the host command began running nor that a human clicked the approval UI; the
fixture approval is programmatic. It does not reconcile the unknown outcome.
On Windows, the effectful turn modes use the explicit test-only hook-boundary
probe; default managed Windows ingress remains paused. The separate guarded
text-only candidate never advertises the hosted effect tool.
Apart from the effect-specific canary, they prove dispatch to the fixture,
not terminal completion or effect coverage. These modes do not
test steer, compaction, arbitrary MCP effects, or this desktop task.

An offline candidate effect-broker core now lives in
`src/hosted-effect-broker.mjs` with an append-only, private, fsynced journal in
`src/hosted-effect-journal.mjs`. It binds the exact proposed effect to the
existing ARE consequence assessment, requires a matching one-use approval,
persists an intent before calling a supplied executor, and refuses replay or
new effects while any outcome is unknown. The default remains off. An explicit
`--allow-hosted-effects` managed launch requires a restricted host profile and
an explicit `--cwd`; it binds a separate canonical command sandbox root to
that selected checkout/cwd;
the gateway and hosted-client CLIs require the same explicit
`--hosted-effect-root`. Both child readiness records bind its digest. Only an
exact command proposal is advertised; file changes have no executor. The
opt-in path uses the hosted browser's one-use approval, the private journal,
and a transformed gateway-owned `command/exec` call. Direct client
`command/exec` remains denied. Disposable installed-host and managed-browser
canaries prove a bounded command join on WSL, not every host effect or this
desktop task's control. With hosted effects opted in, a newly created thread
must use that selected root. The private v5 recovery record now checkpoints
its exact root, tool definition digest, host agent and cwd beside the owned
thread ID. After a clean restart, a persisted hosted thread may resume only
when those bindings, a settled healthy effect journal, and the host's
pre-resume read and post-resume cwd agree; new turns stay blocked until then.
Older v1-v4 records migrate without inventing bindings, so their hosted
threads remain refused. The pinned host resume probe confirms the tool is
advertised again to the model, but App Server does not expose its exact
dynamic-tool definition in `thread/read` or `thread/resume`; this is bounded
rebinding evidence, not a general host attestation. The clean WSL and native
Windows managed restart and idle hosted-client crash/restart canaries pass;
in-flight effect crash recovery remains open.
The [pinned release probe](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-DYNAMIC-TOOL-REVOCATION-2026-09-30.md)
shows a separate direct App Server resume still advertises the persisted
`are_effect_request` tool after its ARE gateway exits. On this host version,
`thread/resume` has no declared `dynamicTools` field and neither an explicit
empty list nor a replacement list revoked the tool. Stopping an ARE-owned
effect session does not authorize direct-client resume or establish a safe
deactivation path; a host-supported release boundary remains open.
A validated dead journal writer can now be reclaimed under an exclusive
recovery marker after abrupt process termination. The complete journal is
replayed; an unsettled effect remains unknown and blocks hosted-thread
rebinding and new effects. Legacy, altered, live, or interrupted locks remain
refused. This is not whole-managed-stack crash recovery, effect-outcome
reconciliation, or a Windows directory-entry power-loss proof.
A separate process-kill fixture verifies that an intent durably written before
an executor returns remains `outcome-unknown` after journal recovery: neither
that effect nor a new one is assessed, approved, or executed on retry.
The pinned-host `scripts/native-dynamic-effect-canary.mjs` additionally proves
that an experimental `dynamicTools` function call reaches the client as
`item/tool/call` with host-supplied thread, turn, and call identities on WSL
and native Windows; a denied result returned to the loopback model fixture.
This established the candidate transport; the separate opt-in command path
above now joins it through the gateway and hosted approval UI. The shared RPC
client has an opt-in, exact-name
`dynamic_tool_handler` that validates host thread/turn/call identities and
bounds the returned text; without that handler it continues to deny
`item/tool/call`. It avoids a second model-visible MCP relay for effects.
With `--hook-bridge`, optional `--require-mcp-hook-relay` makes the hosted
client read the exact owned thread's MCP tool catalog before each new turn.
The same managed launch makes the Codex gateway require a fresh, one-use
backend catalog response for that thread before `turn/start`, so another
gateway client cannot bypass the hosted-client check. It refuses the turn
before recording an intent when the required
`are_hosted_hook_relay` / `are_hook_observe` tool is absent, disconnected,
unreadable, or paginated. The hosted UI shows the last check as a dated
snapshot and does not leave a pending-send retry for this definitive refusal.
Companion Adapters reports whether this gateway preflight is configured, not
the live per-thread relay result.
This is a development-only supported-path check, not continuous relay health
or complete effect interception. The normal Windows model-turn pause still
applies; only a disposable test-only probe can bypass that pause.
The native positive and missing-tool canaries use `--mcp-hook` and
`--mcp-hook-missing-tool` respectively, with isolated host configuration and
a fixed provider. The `--managed-session-ui-mcp` variant also checks the
supervised native Windows orb and joined seven-panel dashboard. The
`restricted-lifecycle-canary.mjs managed-hook-drift-turn` variant changes
the hook source after startup and requires pre-model rejection. The
`managed-relay-turn` variant also discovers, trusts, and verifies the three
isolated native hooks before exercising the hosted pre-turn trust gate.
The installed-host end-to-end canary uses an isolated Codex home, loopback
model fixture, exact discovered hook hashes, and the opt-in callback bridge:
`node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/hosted-hook-denial-canary.mjs /absolute/path/to/codex --managed-session`.
It does not install or trust hooks in the user's active Codex configuration.
One earlier fixture without this trusted-hook setup reached a blocked ARE
preflight; its exact cause was not isolated and is not a successful-turn proof.

Open the exact `launch_url` printed on stderr by the manual client command or
in the managed launcher's ready JSON on stdout. The HTTP listener
defaults to `127.0.0.1:4317`. A non-loopback bind is rejected unless TLS key
and certificate material and an exact browser Origin allowlist are configured.
Iframe embedding remains off by default and requires an explicit CSP
`frame-ancestors` list. Run
`npm run canary:windows-client` from this package for a real installed-Codex
initialization check that starts no thread or model turn.

This remains a controlled candidate host. Codex app-server and its WebSocket
transport are currently experimental upstream, and this package makes no
production-support, publication, remote-exposure, or external-deployment claim.

Open questions: durable host-token custody, tenant authentication, signed
Windows packaging, richer request-user-input rendering, provider quotas, and
deployment isolation remain product and operational boundaries.

## Objective resolution before routing

Opt in with `"objective_resolution": {"enabled": true, "provider_timeout_ms": 1000}`
in an explicitly selected repository profile. The default remains disabled.

```text
request + consumer/task objective state
  → resolve continue / refine / replace / interrupt / new
  → append transition + checkpoint existing reasoning ledger
  → route resolved objective → fresh Context Envelope
  → context-bound intent compilation → verified Codex dispatch
```

The original user input is preserved. Routing uses the resolved objective text
with original input and resolution digests as evidence; explicit effect, target,
and constraint hints still pass through existing checks. Codex receives an
`are.codex-objective-fragment/v1` with the active objective, transition, provenance
digest, and completion posture. Resolution does not establish task completion.

Objective state is isolated by profile, consumer, and Codex thread. The existing
append-only ledger retains immutable transitions and restores their verified
predecessor chain on restart. Diagnostics retain identifiers and digests, not
objective text. A failed ledger checkpoint prevents forwarding and requires a
restart before further interpretation writes. A recovered compact cache summary
is diagnostic evidence, not a full reusable projection: the next dispatch starts
with a cache miss and freshly verified context.

Requests use `clientUserMessageId` when present, otherwise the JSON-RPC ID within
the scoped thread. Reusing a recorded identity returns an explicit result without
redispatch; changed text under that identity blocks. Supply a new ID for a new
request. A transition records interpreted intent even if subsequent preflight
fails: it does not assert that dispatch occurred. Crash delivery reconciliation
is not replaced by automatic retries.

The deterministic path recognizes bounded English cues. An optional native
`objective_provider` receives the request and immutable objective state with one
deadline-bounded call. Configure `objective_resolution.meaning_selection` with
`definition_ids`, `node_ids`, `edge_ids`, and optional `max_bytes` (at most 32768)
to supply a bounded meaning subset. Exact selected edges also require their
endpoint nodes. Missing, duplicate, malformed, or oversized selected records
block without calling the provider or truncating text. These are interpretation
inputs, not a substitute for the full route-owned Context Basis.

Only a provider fallback loads this subset; deterministic cues avoid that work.
The normal verified live-source loader supplies one snapshot shared with the
subsequent preflight. No old envelope is asserted current, and no repository-wide
discovery is performed. A selection receipt binds text projection, source digests,
authority posture, selectors, and byte count into the existing transition event.
Unrelated records do not change the selected-context digest. Definitions and
ontology text remain context, never automatically admitted observations or facts.
Unresolved interpretations stop before routing.
Automatic successors also pass through objective preflight, so a proposal without
enough transition evidence stops instead of bypassing it. Existing continuation
and effect checks remain mandatory.

Construction frontier: wrapper integration and local regression tests. Runnable
next work: evaluate a real interpretation provider against the language challenges.
Operational residue: source-binding/projection reconciliation belongs to the ARE
model owners; Craft's thesis bindings belong to Craft's owners. Neither changes
this prototype's runtime behavior. No default activation, publication, or adoption
is performed here.

Open questions: how should broader conversational evidence resolve an ambiguous
transition, and which explicit completion evidence should retire an objective?
The historical interaction-learning plan remains unchanged.

Run `node scripts/objective-language-benchmark.mjs` for the authored 20-case
challenge set. It currently measures the deterministic path only and reports
unresolved known intents separately from unexpected resolutions. Scripted provider
tests establish wiring and provenance, not language-model accuracy or market value.

This package implements the selected `ARE-CODEX-OPEN-002` boundary against the
version-bound Codex app-server JSON-RPC protocol. It is a client-owned stdio
proxy around `codex app-server`.

## Reusable reasoning state

Every forwarded `turn/start` passes through an explicit reasoning-state
boundary. The wrapper appends the request interpretation and selected Context
Envelope as immutable reasoning events, seals their exact event digests into a
Reasoning State epoch, materializes the complete canonical JSON-RPC request and
request-series header, reconstructs and verifies those bytes, and checkpoints
the epoch before forwarding.
An optional trusted `plan_context_provider` may add the closed Reasoning State
plan-context record to that pre-dispatch epoch and reusable backend context.
It must supply source digests and the exact backend-thread predecessor; forged,
stale, missing-source, or over-budget context blocks forwarding. The provider
is not configured by default, and this local binding does not activate or
identify the running desktop chat. Host task identity, restart/steer/compaction
continuity, and exclusive ingress remain separate integration work.

Accepted effects and automatic continuations have independent required
checkpoints. A sink append, verification, or flush failure blocks that boundary.
The repository profile defaults to explicit process-memory operation. Supplying
`--reasoning-state-log <path>` to `are-codex-app-server` uses the append-only
file sink and `fsync` barriers. Before accepting a client message, the wrapper
verifies the complete existing log, selects its final valid checkpoint,
rebuilds disposable indexes, and resumes the event chain. Empty paths create a
new explicitly identified ledger. Torn, malformed, tampered, mixed-ledger, or
uncheckpointed logs fail startup; existing bytes are never rewritten or
silently truncated. Recovery metadata is recorded without copying event
contents into the diagnostic journal.

At `turn/completed`, the wrapper seals the exact semantic result, continuation
result, completion identity, and relevant context identities into a Reasoning
State Frontier before any automatic successor is forwarded. A recovered
frontier replays the prior client-visible decision with zero semantic provider,
evaluator, continuation-provider, effect, or successor calls. Reusing the same
turn identity with different completion bytes blocks. Automatic continuation is
therefore at-most-once across recovery: a crash after the completion checkpoint
but before forwarding is not silently retried, and delivery reconciliation
remains explicit residue.

The ledger contains explicit system reasoning products, not hidden model
chain-of-thought. Its epochs, dispatch records, and checkpoints have
`authority_effect: none` and do not authorize effects or continuations.
The wrapper package also exports the bounded branch, replay-fixture,
append-only reduction, risk-scaled checkpoint, counterevidence, portable-epoch,
and provenance-comparison operations from the Reasoning State runtime. These
operations are opt-in: the wrapper does not autonomously branch, reduce,
compact, export, or import a consumer's state.
Before every model request, the wrapper also projects a stable request header
and reusable explicit reasoning state ahead of a volatile turn suffix in
`additionalContext`. It measures exact and common prefix bytes, estimated
reusable tokens, projection cost, and invalidation reasons. Explicit normalized
provider usage can be attached through `recordCacheTelemetry`, producing an
exact projection-bound hit/miss observation and measured token/time savings.
Before reuse is eligible, the wrapper verifies the exact Context Refresh
Assessment and binds the canonical current selected-dependency digest into the
reusable state. Tampered refresh evidence, stale selected dependencies, or a
tampered prior projection block dispatch. Selected drift creates a successor;
only an exact current plan prefix receives `reuse-current`. The resulting
`are.context-bound-reuse-receipt/v1` is stored with the dispatch. Configured
provider usage is then bound to that exact projection and receipt, checkpointed,
and recovered after restart. When no provider usage exists, posture stays
`unobserved` instead of inferring a cache hit.

It also provides a persistent local gateway. The gateway listens on a
permission-restricted Unix socket, creates one isolated ARE wrapper and
upstream app-server connection per declared consumer, and preserves that
consumer's Context Views, turn state, and runtime journal across transport
reconnects. The repository profile additionally gives each consumer a distinct
append-only, checkpointed Reasoning State log. Startup obtains an atomic
single-writer lock, verifies and recovers that log before accepting the client,
and releases the lock only after clean wrapper shutdown. A second live attachment for the same consumer, lane
substitution, unknown consumers, oversized messages, and detached-buffer
overflow fail closed. Detach and detached-idle deadlines, retained protocol
bytes, and append-only Reasoning State log bytes are profile-bounded. Expiration
first requires the wrapper to prove no in-flight turn, approval, internal, or
stable request and to append/fsync a manual checkpoint. Unsafe eviction retries
without closing. A successfully expired resume secret authenticates an explicit
`gateway.session-expired` tombstone; the gateway never silently recreates that
session, and it never truncates a ledger to satisfy a size limit.

Programmatic gateway transports opt into `acknowledged-v1` continuity. The
first connection receives a 256-bit resume secret; a later attachment must
present that secret, while diagnostic state exposes only its digest. Downstream
messages are wrapped in monotonically sequenced delivery envelopes and removed
from the replay frontier only after an acknowledgement. Client requests may
carry an exact idempotency key: the gateway rewrites the first dispatch to an
internal correlation identity, adopts an identical unfinished request after a
client crash, and never forwards that request upstream twice. Reusing the key
with different method or parameter bytes fails closed. Responses to
server-initiated approval/tool requests are also digest-bound and forwarded at
most once. Legacy transparent stdio clients retain the unacknowledged v1 byte
stream and therefore do not receive these stronger continuity guarantees.

The connect receipt includes `backend_capabilities` for the selected adapter.
Gateway client-method admission is fail-closed against the
`codex-cli 0.155.0-alpha.16.4` experimental request catalog: only the
reviewed thread/turn lifecycle and observation methods plus the named
wrapper-local ARE operations reach dispatch. The other observed App Server
requests and any unknown future method receive a bounded unsupported error
before a substitute wrapper or backend sees them. Client responses to pending
host requests and the `initialized` notification retain their own protocol
paths. The direct stdio wrapper is a separate compatibility path and does not
inherit this complete gateway catalog claim. Recheck a selected native binary
with `node scripts/verify-host-method-catalog.mjs /absolute/path/to/codex`;
gateway startup now regenerates and verifies all four pinned schema hashes
through the configured Codex command and command prefix before listening.
This binds the same host method catalog to the actual startup command, not
just to the reported version. The Codex backend also checks a closed read-only/on-request
parameter contract for thread start/resume/fork and turn start, including
nested plan successors and wrapper-generated turns. A generic gateway client
cannot choose a weaker lifecycle policy through those methods. Other admitted
methods still need parameter and ownership review; this is not universal host
effect interception. See the [bounded parameter evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-HOST-PARAMETER-CONTRACT.md).
`unknown` is not support: generic JSONL transport and Codex host capabilities
remain unverified until an exact host binding proves them. The DSH adapter
declares turn start/interruption and thread resume, but rejects steering,
compaction, and effect requests; the gateway fails known-unsupported client
methods before dispatch. Its history is ephemeral unless
`--dsh-persistence-mode durable` is explicitly selected with an existing
`--dsh-home`. Gateway replay and DSH thread-history recovery are separate
claims; the capability receipt describes configuration, not a successful
recovery of any specific thread.
The connect receipt's `session_recovery` makes that distinction explicit:
`gateway_delivery` may be new, reattached, or recovered after restart, while
`backend_history` stays `not-verified-by-connect`. A separate successful
`thread/resume` is required before claiming backend history recovery.
Codex and DSH adapters declare `thread_ownership: gateway-created`: scoped
operations require a backend thread already bound to the same gateway consumer.
The gateway claims new IDs from thread-creation responses before client
delivery. If the gateway's ownership index is lost while DSH history survives,
the orphaned backend thread is not adopted from its ID alone. Generic JSONL
adapters declare `unverified` ownership and do not inherit this claim. A
local fixture passed one DSH turn through the actual gateway CLI and ARE
wrapper; see the [bounded ownership evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-ADAPTER-THREAD-OWNERSHIP.md).
The DSH adapter also supplies a closed client-method posture, so its owned
`thread/close` can reclaim a backend thread without adding that method to the
pinned Codex catalog. Undeclared DSH methods are rejected before dispatch;
known-unsupported operations still report the capability rejection. Generic
JSONL adapters retain the legacy catalog fallback and remain unverified. See
the [DSH method evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-DSH-METHOD-CONTRACT.md).
DSH also declares its own closed server-notification posture. The gateway
checks its event thread ownership and correlates backend responses to pending
requests, including thread-ID agreement, before delivery. Codex retains its
pinned server catalog; generic JSONL adapters without a server posture remain
unverified. See the [DSH event evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-DSH-SERVER-EVENT-CONTRACT.md).

`gateway.observeAdapters()` is an in-process, allowlisted read projection of
selected adapter, gateway running state, client-link presence, and backend
initialization. Reading it neither connects a client nor spawns a backend;
without a session it reports the selected backend as `not-observed`, not
running. An opt-in **development-only** local observation endpoint serves this
projection separately from the normal gateway socket. It requires an explicit
path or loopback TCP port and `ARE_ADAPTER_OBSERVATION_TOKEN` (at least 32 bytes).
`--development-observation-tcp-port <port>` is available only with
`--development-live`, is mutually exclusive with the observation socket, and
binds `127.0.0.1` only; clients use `tcp://127.0.0.1:<port>`. It does not expose
the gateway session-control listener over TCP. This is a local development
bridge, not a supported remote transport or installed cross-OS launcher; other
local processes can reach loopback, so use a fresh private token and stop the
listener after testing. POSIX socket observation binds mode 0600;
The Linux managed-session launcher can own this development observer with the
same port flag, no `--companion-command`, and a caller-provided
`ARE_ADAPTER_OBSERVATION_TOKEN`. It supervises the gateway and hosted client,
checks the observed gateway epoch before ready, and returns only the endpoint
and mode in its ready record. A separate Windows process must receive the
token privately; the launcher does not install or supervise that process.
Windows uses a local named pipe with an application token while native pipe ACL
hardening remains unverified. The separate main Windows gateway pipe requires
`ARE_GATEWAY_CONNECTION_TOKEN` (at least 32 bytes) before creating a session.
The observation endpoint accepts one nonce-bound read per connection. `are adapter-status --json
--socket <path>` is its bounded aggregate client; `are thread-status --json
--socket <path>` reads a separate gateway-backend-thread projection through the
same authenticated endpoint; `are decision-status --json --socket <path>`
reads a bounded backend-decision trace for current consumers. None of these reads creates a consumer session or
spawns a backend. The endpoint is off by default. The thread projection carries
hashed consumer/thread references, phase, reasoning epoch/checkpoint/frontier
digests, and bounded completion status, but no raw identity, thread content,
resume token, or filesystem path. It does not prove activation of a host task,
including the current desktop chat.
The decision trace retains only the most recent 128 evaluations per current
wrapper session and projects at most 32 across the gateway. A file-backed
consumer checkpoints content-free decision observations in its Reasoning State
ledger and restores the latest 128 on wrapper restart; process-memory mode
does not. It includes
evaluation type, outcome, allowlisted reason codes, hashed backend-thread
reference, observation time, and evidence event/decision digests. A disconnected
consumer is not returned by the current gateway read, even if its file survives.
This is not complete host decision history and does not attest to effect
approval or execution. Retention/deletion policy beyond the existing log byte
cap and bounded read window remains open.

On native Windows, `--codex-command` and repeated `--codex-prefix-arg` values
let the gateway invoke a specifically selected backend (including a WSL Codex
binary). The same invocation is used for version preflight and session spawn;
version drift still fails closed. The candidate `0.155.0-alpha.16.4` binding
records an exact 436-file generated-schema match with the previous binary,
not general behavioral compatibility. A native Windows canary runs a real
`initialize` through both pipes without starting a model turn:

```powershell
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/windows-named-pipe-canary.mjs `
  --wsl-distribution Ubuntu-26.04 `
  --wsl-codex /absolute/linux/path/to/codex `
  --wsl-codex-home /absolute/linux/path/to/.codex `
  --gateway-entry "C:\path\to\extracted\are\cyberAlchemy-v2\implementation\agent-reasoning-engine\packages\codex-app-server-wrapper\bin\are-codex-gateway.mjs" `
  --companion-exe "C:\path\to\extracted\are-companion.exe"
```

Omit `--gateway-entry` to test the workspace source instead of the extracted
package. The explicit Linux Codex home must be on a filesystem where its state runtime
works; the Windows-mounted home failed SQLite initialization in the local
canary. The canary uses temporary gateway session/reasoning files and removes
them after the run; Codex may still update its selected existing Linux home
during initialization. It does not activate this Codex desktop task, prove
same-user pipe isolation, or enable the endpoint for production.

The currently bound `0.155.0-alpha.16.4` server accepts JSON-RPC 2.0 client messages but
omits the `jsonrpc` member on its own responses and notifications. The wrapper
admits both exact framings while rejecting any explicit non-2.0 version.
Because the wrapper projects the envelope through `turn/start.additionalContext`,
the connected client must declare `capabilities.experimentalApi: true` in its
`initialize` request. Codex rejects the field when that capability was not
negotiated.
The managed gateway admits only the reviewed initialization capability keys.
It rejects notification opt-out, unknown capability fields, malformed values,
and `requestAttestation: true` before backend dispatch. The latter remains
unsupported because this gateway cannot supply the desktop Host's opaque
attestation response; an upstream token would not by itself prove ARE thread
ownership. This may prevent a stock desktop handshake until that host-request
path is explicitly implemented and tested.

For every `turn/start`, it reloads and structurally verifies the configured live
context sources, constructs an ARE Context Basis, assesses selected-dependency
freshness, and projects an immutable inline Context Envelope before forwarding
the request. Live-source refresh always reads and hashes every selected source;
it does not treat size, modification time, inode, or a cache hit as freshness
evidence. The repository profile selects Node's native SHA-256 implementation
for this byte-identical operation, while the portable JavaScript SHA-256 remains
available as a controlled compatibility baseline. A client may supply an exact
`are.request-context-hint/v1` so the
human utterance and explicit capability objective remain distinct; malformed
hints block. Deterministic request-term selection adds matching canonical
definitions, ontology nodes and bounded related edges to a minimal baseline.
The repository profile also binds root `AGENTS.md` as an exact
`repository-instruction` item and projects the read-only ontology registry as a
compact `ontology-catalog` item only for matching requests. Direct requests
therefore receive the bounded meanings of selected definitions, instructions,
catalog records, and selector-locked ontology records through the
protocol-supported `params.additionalContext` field, not only their digests.
The projected fragment also carries an `are.codex-context-use-contract/v1`.
It marks request-matched definitions and ontology catalogs as direct answer
sources, keeps dependency nodes, edges, and instructions available as
supporting context, and tells the consumer to report the exact item identities
it materially used. This ordering is a context-use hint with
`authority_effect: none`; it does not promote relevance, cache reuse, or a
model citation into freshness, correctness, admission, or authority evidence.
The default inline budget is 32 KiB. Optional diagnostics are excluded first
and recorded; mandatory overflow blocks without truncation or model-generated
summarization. Gates and blocks are not forwarded.

Plan-bound consumers reuse an envelope identity only after a real currentness
comparison produces a reuse receipt. Interaction-bound consumers always
receive successor view, context-epoch, and reasoning-epoch identities. When the
full Context Basis, request selection, and selected dependencies are still
exactly current, an interaction successor may reuse the prior immutable
content-addressed envelope projection instead of rebuilding it. The successor
fragment and diagnostic event expose an exact reuse receipt, predecessor
envelope digest, reused byte count, and `identity_retained: false`. The profile
switch `context_projection.reuse_compatible_interaction_projection` can disable
this optimization for a controlled comparison. Selected dependency drift
always bypasses reuse and constructs a successor projection; unrelated source
drift remains diagnostic. Cache or projection reuse never establishes
freshness, provenance, correctness, or authority. Diagnostic state records
envelope identity and refresh events without copying full context contents.

During a turn, command, file-change, and permission approval callbacks are
evaluated before the client response can reach Codex. A direct engine decision
still requires the independent client approval. A gate is forwarded to the
client as the exact human decision boundary. A block is denied locally.

After `turn/completed`, the wrapper joins observed lifecycle evidence with both
continuation lanes. Interaction-bound proposals always gate. Exactly one safe,
reversible plan-bound proposal may start one successor turn, but only after
that successor passes its own preflight.

Plan-bound proposals may carry an `objective_binding` that classifies them as
`advances-active-objective`, `changes-active-objective`, or
`deferred-residue`. Classification alone cannot select a continuation.
`advances-active-objective` requires an exact `are.causal-marker/v1` binding
an unresolved obligation to the proposed action and declaring whether its
causal dependency is `ready` or `blocked`. Product-direction and residue
candidates require `are.opportunity-marker/v1`; an opportunity can never
bypass a blocked causal obligation. A legacy `rank` may be retained for
diagnostics but has no selection effect.

The wrapper materializes `are.objective-frontier-materialization/v1` before
consequence assessment. One ready causal candidate is evaluated as the
continuation. Multiple ready causal candidates require a real choice. A
blocked causal candidate blocks the frontier, while product-direction changes
and other opportunities remain inspectable without becoming false co-equal
next steps. Marker relevance, causality, and readiness still grant no effect
authority.

For short continuation references such as `What is next?` or `Do it`, the
selected frontier is projected into the next `turn/start` as an exact request
context hint and an inspectable `cyberalchemy.are.objective-frontier`
fragment. This lets route selection inherit the selected objective rather than
re-run lexical routing against an anaphoric phrase. Longer or explicit new
requests are never rebound by this mechanism, and the projection grants no
effect authority.

Semantic evaluation at `turn/completed` is generic and explicitly opt-in. The
repository profile defaults to `{enabled: false}`, which produces no semantic
notification, provider call, evaluator call, or semantic ledger event. An
enabled profile must exact-bind a verified semantic-input profile. The wrapper
then binds the preflight request, route decision, and Context Envelope to the
actual Codex turn identity and asks an explicit input provider for observation,
owner, temporal, challenge, and journal inputs. It never derives those facts
from Codex output or Context Items.

Matching domains invoke the context-bound semantic lifecycle once and emit a
compact `cyberalchemy/semantic` notification containing only disposition,
materialization identity, outcome, and Reasoning Receipt digest. Non-matching
domains are `not-applicable` without calling the input provider or evaluator.
Duplicate completion notifications verify and replay the immutable recorded
result instead of repeating semantic calls.

A plan-bound proposal may explicitly declare `semantic_dependency` with
`required: true` and optional exact `binding_id` or `conclusion_domain`
selectors. For those proposals only, the wrapper recomputes the Reasoning
Receipt digest and verifies its exact turn, Context Envelope, materialization,
domain, and terminal-outcome binding before consequence assessment. Invalid,
unauthorized, defeated, insufficient, or invalidated outcomes make that
proposal ineligible. `EscalateOwner` requires a human gate.
`RecommendedUnderSnapshot` is advisory only: it can never make a structurally
invalid, consequential, protected, unknown, or irreversible proposal direct.
`OutOfDomain`, disabled evaluation, and non-matching domains preserve the
ordinary continuation result. Independent proposals are never constrained by
another proposal's semantic dependency.

Blocked semantic input remains visible and cannot suppress the original Codex
completion or authorize an effect. It constrains continuation only when a plan
proposal explicitly declares the semantic dependency. Constraint records and
ledger events contain identities, digests, outcomes, and reason codes, never
the Reasoning Receipt or context contents.

The wrapper owns a bounded in-memory runtime journal. Events are canonical,
immutable, hash chained, and idempotency-keyed. Before semantic materialization
it cuts the exact current thread and turn; the semantic input runtime verifies
that cut and binds its digest into the Reasoning Receipt metadata. Duplicate
completion uses deterministic external-call-free replay and cannot call the
provider or evaluator or start a second successor. Configured retention evicts
only closed turns and records an eviction receipt; active-turn events are never
evicted to satisfy a bound. This is not durable or cross-session storage.
For a file-backed wrapper restart, the private checkpointed Reasoning State log
recovers explicit pending/bound semantic turn state. A recovered active binding
is projected into the new process-local runtime journal with recovery
provenance so semantic completion can verify its context cut. This does not
replay the old journal's entire history or prove host-task handover.

Run with a repository-bound profile:

```sh
node bin/are-codex-app-server.mjs \
  --config profiles/repository-v1.json \
  --repository-root /absolute/configuration/root/containing/cyberAlchemy-v2 \
  --continuity-activation /absolute/path/to/activation-manifest.json
```

For an admitted controlled-local version, `--continuity-activation` verifies
the serving pointer, activation package, provider package, and exact runtime
state before deriving the enabled profile. If a profile is explicitly enabled
without an activation manifest, add
`--continuity-state /absolute/path/to/continuity-binding-snapshot.json`. The
entrypoint exact-loads and validates this closed, digest-bound snapshot before
starting. Disabled profiles need no continuity state. Missing or invalid state
fails startup; an unresolved consumer/thread selector fails the turn boundary.

Run the persistent gateway against an already-running, exact-version managed
app-server daemon:

```sh
node bin/are-codex-gateway.mjs \
  --config profiles/repository-v1.json \
  --repository-root /absolute/configuration/root/containing/cyberAlchemy-v2 \
  --listen /tmp/are-codex-gateway.sock \
  --backend daemon-proxy \
  --continuity-activation /absolute/path/to/activation-manifest.json
```

`--continuity-activation` and `--continuity-state` are mutually exclusive. One
loaded provider is shared by the gateway's wrapper instances and retains
structural binding receipts; it does not retain conversation content.

Evolution signal intake is separately opt-in. A gateway profile with
`evolution_signals.enabled: true` also requires
`--evolution-signal-log /absolute/private/path/to/signals.jsonl`; the flag is
rejected when that profile setting is off. The log is a single-writer,
checkpointed candidate inbox. Currently it records one content-free
Improvement Signal only for a blocked semantic turn completion. It never
starts an Evolution cycle, edits code, or activates control of a desktop task.
Use a private, bounded path with an explicit operator retention policy; do not
place the log in source control. DSH is not supported by this Codex-specific
signal provider. The default product profile leaves the intake disabled.

The gateway does not install or start the managed daemon. It checks both the
local CLI binding and the running daemon version before listening. For an
isolated app-server process it can instead use `--backend websocket` with an
explicit loopback `--upstream-url`.

An app-server protocol client launches the lane-specific stdio adapter:

```sh
node bin/are-codex-client-proxy.mjs \
  --socket /tmp/are-codex-gateway.sock \
  --consumer codex:human-chat \
  --lane interaction-bound
```

This compatibility stdio proxy validates the gateway receipt through the
shared transport but retains unacknowledged session semantics. It does not
persist a resume secret, recover a detached session after process restart, or
hand over an existing desktop task. Use an acknowledged client with explicit
recovery state for those separately verified workflows.

`codex:plan` is separately configured as `plan-bound` with a stable request and
window identity. Exact reconnect resumes the same gateway session. The gateway
retains the first successful app-server `initialize` request binding and result,
includes their non-authorizing state in the reconnect receipt, and replays that
result locally for an identical programmatic client initialization. It never
forwards the duplicate upstream. A changed client identity, capability set, or
other initialization parameter fails closed with an exact binding mismatch.
Reconnect during a pending initialization binds the new correlation identity
to the single upstream response. Process restart creates a new transport
runtime epoch while the verified per-consumer Reasoning State log and
completed-turn frontiers recover. The diagnostic runtime journal remains
process-local. A stale crash lock is fail-closed and requires separate operator
reconciliation.

Programmatic consumers use `connectGatewayRpcTransport` with
`createAppServerRpcClient`. The shared client owns JSON-line parsing, request
correlation, bounded notification waits, streamed agent-text collection, and
default approval refusal. Server-initiated requests are handled outside the
ordered input reader so a custom approval handler may await another request
on the same connection. There are at most 64 concurrent server requests and
each times out after 120 seconds by default; late handler results cannot
become a second response. A timed-out handler receives an abort signal and
continues to consume capacity until it settles. Unsupported requests fail
closed. The shared decline contract includes the selected App Server schema's
required permission scope and MCP elicitation metadata; a hosted approval
prompt is removed when its RPC request aborts. The optional hosted Windows
client also answers `item/tool/requestUserInput` through an authenticated,
bounded prompt UI. It never places submitted answers in state, SSE events or
HTTP acknowledgements; abort and `serverRequest/resolved` remove stale prompts.
The hosted broker honors a valid App Server `autoResolutionMs` deadline by
returning an empty answer map when no answer arrives, while its own longer
timeout remains fail-closed.
The hosted client also has an opt-in `mcpServer/elicitation/request` handler for
standard `mode: "form"` schemas with supported string, choice, multi-choice,
number, integer and boolean fields. It validates typed answers against the
projected schema, requires an explicit accept, and removes the prompt on
decline, cancel, timeout, abort or matching `serverRequest/resolved`. Unsupported
modes and constraints decline without rendering. Other clients retain default
decline; submitted answers are absent from state, SSE events and HTTP
acknowledgements. Native installed-host MCP request delivery remains untested.
Other clients without these optional handlers fail closed on either request. These are client
liveness guarantees, not proof of a live desktop approval UI. `request`,
`startThread`, and `runTurn` accept an
`idempotency_key`; callers that reconstruct a client after a crash reuse that
key and pass the prior handshake's `continuity.resume_token` to
`connectGatewayRpcTransport`. The transport unwraps each sequenced delivery and
acknowledges it only after writing the exact JSON-RPC message to its local output
boundary. This proves exactly-once upstream dispatch and acknowledged-once
transport delivery, not durable processing inside an arbitrary application.
With a configured file-backed gateway session store, a gateway restart restores
completed stable requests and every sequenced but unacknowledged delivery before
accepting an authenticated resumption. Acknowledgements are durable before the
corresponding bytes are dropped. An in-flight request with no recorded outcome
remains blocked as `gateway.dispatch-outcome-unknown` and is never silently
redispatched. Without a file-backed store, process loss still returns
`gateway.resume-session-missing`. `spawnAppServerRpcTransport` provides an explicit
strict direct-process transport for diagnostics and tests; it does not bypass
the wrapper's version gate.

For ordinary stable Codex `turn/start` requests without a caller-supplied
`clientUserMessageId`, the gateway generates a random content-free host marker,
persists it in the dispatch intent before forwarding, and retains it across
session-store compaction. A clean-restart native canary found that marker in
exactly one completed host turn. The marker is not a host idempotency key:
unknown outcomes still block mutations, and history-based recovery is not yet
implemented.
For an unknown stable turn with no accepted-response receipt, an owned full-turn
read can now journal a content-free `turn-marker-observed` receipt when exactly
one returned user item matches the durable marker. Missing or ambiguous matches
record nothing; a conflicting later match stops the backend. This observation
does not prove exhaustive host history, recreate the lost start response, or
release the unknown-outcome write block.

The gateway records a hashed backend-thread claim before forwarding a thread
mutation. A second consumer of that gateway cannot mutate the same thread;
successful `thread/start` and `thread/fork` results must bind the returned thread
ID before delivery. Claims survive file-store restart and compaction. Read-only
thread methods remain accessible for observation. This is gateway-local
single-writer protection, not an exclusive lease against the Codex desktop app,
other App Server processes, or descendant-cascading archive/delete operations.
It does not activate ARE control of an existing desktop task.

The file session store writes a digest-bound local writer-lock record. On
restart, it can reclaim that lock only after confirming the recorded local
process is absent, obtaining an exclusive recovery marker, and rechecking the
same record. A live, unreadable, modified, foreign-host, or interrupted-recovery
lock fails closed. `inspectFileGatewaySessionStoreWriterLock({path})` reports
its local diagnostic disposition without removing anything. PID reuse can
conservatively prevent recovery; this mechanism is not a cross-host lease or
an authorization to delete an ambiguous lock.

The Codex direct-stdio launcher also enables a backend-process liveness
guard for acknowledged, file-backed sessions. It records the child host/PID
in the durable session and, after authenticated restart, refuses to spawn a
replacement while that PID is live. A missing identity, foreign host, or
indeterminate liveness fails closed. PID reuse can conservatively block
recovery; this is not process attestation or an exclusive lease against a
separate desktop App Server. The generic gateway's `required` mode also
rejects unacknowledged clients. The launcher uses `acknowledged-only` to
preserve the older unacknowledged stdio proxy, which remains non-resumable,
unguarded, and ineligible for session activation. DSH, daemon proxy and
WebSocket transports do not inherit a local process-liveness claim.

For a gateway-owned backend thread, a matching accepted `turn/steer` response
and a completed `contextCompaction` item are journaled as bounded, content-free
host-protocol receipts before client delivery. The read-only Threads projection
shows per-thread counts and the latest receipt digest, not steering text or a
claim that a new Reasoning State plan context was captured. Failed or mismatched
host events do not become success receipts. The file-backed store preserves
these receipts across reopen; they do not establish desktop-host exclusivity.

Session expiration is appended to the file-backed session index when configured;
the in-memory tombstone remains time-bounded. Process-memory mode intentionally
loses resumability across gateway restart.

Run the controlled version-bound semantic continuation matrix with:

```sh
npm run canary:semantic
```

It exercises recommendation, insufficient evidence, owner escalation,
tampering, disabled evaluation, and interaction precedence against a real
`codex app-server` while requesting no tools, network access, or effects. The
matrix reuses one app-server and one ephemeral thread so startup/index loading
is measured once while each scenario retains its own turn, semantic posture,
continuation decision, and receipt evidence. Each RPC request and completion
wait is bounded, redacted progress is emitted on stderr, and an infrastructure
timeout stops the remaining matrix. Override the defaults with
`ARE_CANARY_REQUEST_TIMEOUT_MS` and `ARE_CANARY_EVENT_TIMEOUT_MS` when the
local state index has known startup latency.

Run the isolated persistent transport canary with `npm run canary:gateway`.
It exercises two exact plan-bound turns across a disconnect/reconnect and two
interaction-bound turns through a real long-lived loopback WebSocket
app-server. It then interrupts a real turn after agent output begins, restarts
the file-backed gateway, authenticates both recovered sessions, verifies exact
replay of the unacknowledged delivery, locally replays a completed stable
request without upstream redispatch, and verifies recovery of the per-consumer
checkpointed log, completion frontiers, exclusive writer, and an
exact-prefix-reusing post-restart model dispatch.
The official daemon-proxy command surface is covered separately;
the canary intentionally does not mutate the user-global managed daemon.

For an opt-in managed WSL desktop client that refuses restart with
`desktop-gateway.unreconciled-client-state`, run the read-only private-state
diagnostic as `node bin/are-desktop-gateway-inspect.mjs <absolute-private-state-dir> <backend-sha256> <desktop-wsl-base/v1|desktop-wsl-app-tools/v1>`.
It validates the exact state and backend binding, then reports content-free
pending-intent and retained-delivery counts. A v7 state also reports the last
compacted delivery sequence, retained creation-claim count, and current-epoch
client-ID count; absent and legacy v6 states report those fields as unknown.
These counts disclose neither the creation response nor request IDs. A
checkpoint sequence is not a desktop consumption receipt. Inspection neither clears the state nor
proves that the desktop consumed a prior response, that the gateway can
reconnect, or that an existing desktop task belongs to ARE. See the
[bounded inspection evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-DESKTOP-STATE-INSPECTION-2026-10-02.md).

A cooperating desktop JSONL client may opt in with
`ARE_DESKTOP_CONSUMPTION_RECEIPTS=1`. After parsing each complete native output
message, it sends a client-only `cyberalchemy/desktopDeliveryConsumed` JSON-RPC
notification with `params.throughSequence` (the next ordered delivery number)
and `params.messageDigest` (`digestValue` of that exact message). The gateway
never sees this notification. The private v7 desktop ledger fsyncs each exact,
in-order receipt and permits restart only when every retained delivery has a
receipt, no request intent is pending, no server-initiated request is unresolved,
and the gateway reconnect receipt matches its prior sequence and backend
binding. A clean new client connection increments `client_epoch`, so a restarted
desktop can repeat `initialize` and reuse JSON-RPC IDs without reusing stable
gateway request keys. The gateway binds a completed-initialization replay to
that connection's exact request key. Unknown, repeated or changed receipts stop
the client; a missing receipt prevents the next restart.
The stock Codex desktop does not send this ARE extension; its default remains
fail-closed on retained deliveries. A cooperating client's receipt is not
authenticated desktop identity, proof of on-screen rendering, current-task
writer handover, or crash/power-loss recovery. Existing v6 state is validated
and atomically migrated under the private writer lock; earlier v4/v5 records
remain unsupported, and migration never treats an unknown delivery as consumed.
Only fully settled, desktop-consumed entries may be checkpointed. The checkpoint
retains the cumulative ACK, request-ID uniqueness for the current connection,
and verifiable creation-response claims for owned-thread checks. A clean new
connection resets its ID set; 2048 IDs per connection remains a deliberate
resource limit. The separate-process fixture
proves one new owned thread, two turns and an exact clean restart; it uses a
fake backend, not the installed graphical desktop app.

For a disposable desktop-launch probe, `ARE_DESKTOP_SHIM_TRACE_PATH` may point
to a pre-created, owner-only (0600) regular file. The shim appends only its
invocation class, received/spawned stage, timestamp, own PID, parent PID, and
actual child PID after launch. It records no arguments, prompt, workspace, or
credentials. These process IDs help correlate an observed app-owned launch;
the trace alone does not establish desktop New Chat ingress or ARE control.
In managed-gateway mode, the shim child also appends a separate content-free
record when it forwards an admitted `initialize` or `thread/start` request to
its gateway transport. This record carries only the method, child PID, parent
PID, stage, and timestamp, so its PID can be matched to the shim's `child_pid`.
It does not include request IDs or parameters and does not prove the gateway
accepted the request, rendered a reply, or that the stock desktop sent it.
An absent, non-private, or symlinked trace target fails closed when recording.

`scripts/native-desktop-gateway-restart-canary.mjs` additionally exercises the
installed pinned Codex WSL binary against an isolated `CODEX_HOME` and a local
fixed Responses provider. For `desktop-wsl-base/v1` and
`desktop-wsl-app-tools/v1`, it verifies two completed host-history turns on one
owned thread across a clean client restart, recycled request IDs, ordered
delivery receipts, and complete scratch cleanup. This tests the installed
App Server binary through a cooperating test client; it does not prove that
the installed graphical Codex desktop uses the shim, sends receipts, or routes
new or existing tasks through ARE.
Gateway and shim independently hash the pinned binary by stream. Each retries
only an `ENOMEM` read at most twice, from byte zero; digest mismatch and other
errors remain fail-closed. Focused state tests passed a 100-request session
beyond the old 64-intent bound, checked ID reuse and owned-thread continuity
after checkpoint/restart, and verified v6 migration with an unconsumed delivery.
The cooperating shim/gateway process fixture also passed 301 successive
`model/list` requests on the second connection after an owned-thread restart,
crossing the old intent ceiling and checking the persisted checkpoint. The full
wrapper suite and both pinned installed-binary two-turn/restart canaries passed
after the ledger change. Unsettled requests still retain their exact
records and can hit resource limits; checkpoints are not a substitute for
desktop consumption, crash reconciliation, or host writer transfer.

The repository default adopts no production semantic-domain catalog. The
wrapper is a candidate implementation. It does not modify Codex desktop
configuration, grant effect authority, treat a recommendation as permission,
adopt a capability, establish conformance, publish, deploy, or start any
successor that is gated or blocked.
