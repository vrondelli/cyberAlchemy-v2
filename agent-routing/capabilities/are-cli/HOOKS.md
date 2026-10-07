# ARE prompt hook adapter

Status: tested local adapter candidate. Native delivery passed an isolated
loopback canary on pinned Codex 0.153.0-alpha.5; see [NATIVE-HOST-TEST.md](NATIVE-HOST-TEST.md).
Authority effect: none. Construction route: CA2-ROUTE-IMPLEMENT.

`are hook prompt` maps a Codex `UserPromptSubmit` event to the same `route` and
`context` functions as `are decide`. It emits advisory evidence in the documented
`hookSpecificOutput.additionalContext` output. Commands receive JSON on stdin;
Codex provides session and turn identifiers. The transcript format is unstable,
so this adapter never reads it. See the
[official hook contract](https://learn.chatgpt.com/docs/hooks).

## Run and inspect

From the checkout root:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs hook inspect-host
node implementation/agent-reasoning-engine/bin/are.mjs hook config
node --test implementation/agent-reasoning-engine/test/prompt-hook.test.mjs
```

## Opt-in C1 compaction restoration candidate

`are hook compact <binding.json>` handles only a Codex `SessionStart` event with
`source: "compact"`. A separately prepared, private binding file must have exactly
these fields: `schema_version: "are.compact-context-binding/v1"`, `session_id`,
`thread_ref`, `cwd`, `ledger_path`, and `ledger_id`. The paths are absolute. The
host session ID and backend thread ref are deliberately separate; their mapping
must be established by the selected host integrator, not inferred from the hook
event. `are hook compact-config <binding.json>` prints a candidate
`SessionStart` registration with matcher `^compact$`; it installs nothing.

For the one matching session and cwd, the hook verifies the bounded Reasoning
State file log and its recoverable checkpoint, then projects the latest C1 plan
context only if that event belongs to a checkpointed epoch. It never reads the
host transcript, routes another user request, executes a turn, or changes the
ledger. Other sessions and non-compact starts receive `{}`. A bound session with
missing or unverified state receives `continue: false` and a content-free stop
reason. This fail-closed behavior passed an isolated native-host canary, but
still requires selected-desktop-host validation before operational use. The
context is task-state evidence, not permission or fresh
user intent. Full plan summaries are model-visible, so the private ledger and
hook registration require the selected host's trust and privacy review.

The [official Codex hook contract](https://learn.chatgpt.com/docs/hooks)
documents delivery of `SessionStart` additional context before the immediate
post-compaction model request, including mid-turn automatic compaction. An
isolated canary on the selected PATH CLI verified native delivery before the
next turn's provider request and suppression of that request on invalid bound
state. It did not exercise automatic mid-turn compaction, native delivery on
this desktop task, or exclusive control of it. Run the two canary modes with
`node implementation/agent-reasoning-engine/scripts/test-native-compact-context-hook.mjs /exact/path/to/codex`
and the same command followed by `--invalid-ledger`. Both use a temporary
host configuration and fixed loopback provider; neither installs the hook.

`hook native-test /exact/path/to/codex` runs the isolated pinned-host canary.
`config` prints the exact candidate registration JSON using the current Node and
adapter paths, shell-quoted for POSIX hosts. It writes nothing and enables no
feature. `inspect-host [codex-command]` reads version and feature information;
it never declares native delivery verified, even when the feature is enabled.

Pass a real or synthetic event to `hook prompt`:

```json
{
  "hook_event_name": "UserPromptSubmit",
  "session_id": "example-session",
  "turn_id": "example-turn",
  "cwd": "/absolute/path/to/cyberAlchemy-v2",
  "prompt": "Explain the repository routing architecture"
}
```

The checkout path must resolve inside this adapter's checkout. Existing
subdirectories work; relative paths and symlink escapes do not. The adapter
requires nonblank session, turn, cwd and prompt fields. Optional fields are
`transcript_path`, `model` and `permission_mode`, each string or null. Unknown
fields fail explicitly so a changed host payload needs a reviewed contract.
Input is at most 1 MiB and the prompt at most 65,536 characters.

## Meaning and behavior

The prototype's hook event is host-supplied observation, not authenticated
identity. Session correlation hashes session ID and checkout; request correlation
hashes turn ID, exact prompt and canonical cwd. Steering with changed text gets
a distinct receipt even inside the same turn. Exact retries replay the same
deterministic computation. No session store or exactly-once delivery is claimed.

No objective is inferred inside this adapter. A self-contained prompt may
resolve directly; conversation-dependent input such as “next” remains unresolved.
The output tells the agent to retain the active objective, label inferences and
consult the ordinary CLI with conversation context. It never substitutes a new
objective or erases prior authorization.

Successful direct routing also runs real context preflight. Output contains
the route contract, receipt, source-related digests and reason codes. Raw prompt,
raw host IDs, model metadata, transcript and envelope text are not copied into
developer context. The original prompt remains with the host. This adapter
does not dispatch effects, approve tools, read transcripts, learn preferences,
or write state. The earlier
[learning-hook prototype](../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/hook-adapter-v1/README.md)
owns its separate persistence experiments; none are implicitly activated here.

Malformed or out-of-scope input returns `{}`, exit 1 and a bounded diagnostic on
stderr. Engine/source failures produce advisory diagnostics with no route
authority. Unresolved routing is advisory as well: no host block or permission
output is manufactured. Agents still follow the registry and its failure rules.

The separate gateway hook-event client now has a **default-off**
`enforce_supported_tool_blocks` option. When an exact prompt/turn binding exists
and ARE returns an `ok: true` `block` for `PreToolUse`, that option emits the
documented `permissionDecision: "deny"` shape. A `gate` remains advisory and
never becomes an automatic approval. The [installed-host disposable canary](../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-NATIVE-HOOK-DENIAL.md)
verified denial of one supported local shell call, first through direct
App Server and then through the actual ARE wrapper and persistent gateway.
The gateway canary trusted only three exact generated hook hashes in a
disposable configuration; no active hook configuration was changed. This is
not a complete effect boundary: hosted tools, specialized
paths that skip hooks and desktop-task ingress remain outside that proof.

The reusable `bin/are-hook-callback.mjs` runner takes a private, absolute
connection-file path and an optional `--fail-closed-tools` flag. The flag is
default-off. For an invoked `PreToolUse` callback, an unavailable assessment,
lost bridge, or invalid bridge response then exits with Codex's documented
blocking code `2` and a content-free stderr reason. Other events retain the
advisory failure behavior; the runner never emits a tool grant. A disposable
gateway/native-host canary on `codex-cli 0.155.0-alpha.16.4` verified this
failure path blocked one local shell call without changing active host
configuration. See [bounded evidence](../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-NATIVE-HOOK-DENIAL.md).
The strict runner also exits with code `2` for malformed input or an unknown
event name, before it can safely distinguish a tool callback from an advisory
event. Valid `UserPromptSubmit` and `Stop` failures remain advisory. The
focused callback suite passed this regression; the new branch has not yet
been rechecked through a native host invocation.
This protects only callbacks that the host actually invokes; hook omission,
hosted tools, and a complete non-bypassable effect boundary remain unproven.

The ARE-owned hosted client now accepts an opt-in
`--hook-connection-file <new-private-path>` option. It runs the callback bridge
and bound hook session on **the same gateway RPC connection** as the hosted
chat, observes its native `turn/completed` notifications, and withdraws the
bridge on gateway failure. A hook event is assessed only when its host session
ID is in that hosted client's known thread set; other thread callbacks are
rejected. In strict tool mode the runner also requires a coherent ARE decision
kind and `PreToolUse` projection; an incomplete successful `block` cannot
silently lose its denial. On POSIX, the file must be new inside a directory
owned by the current user with no group/other permissions; on Windows it must
be new inside a subdirectory of `LOCALAPPDATA`. The file is created exclusively
and removed on clean shutdown only if it is still the same file with the same
bytes. It contains a process-lifetime loopback bearer credential, so the
operator must keep its parent private. An existing or stale file is never
overwritten. This option does not install or trust a Codex hook, alter a host
configuration, or transfer an existing desktop chat. An isolated CLI fixture
verifies the opt-in bridge, blocked unbound tool callback, single RPC
initialization, and endpoint cleanup; installed-host delivery through this
particular CLI path now passes a separate, isolated
[native-host canary](../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-NATIVE-HOSTED-CLI-HOOK-CANARY-2026-10-03.md).
It verifies one CLI-created thread, prompt context on the loopback provider
wire, one supported local shell denial, and callback-file removal. A prior
installed-host canary passed through the controller module directly. Neither
canary launched the hosted client's browser UI, proved stock desktop New Chat
ingress, covered every host effect path, or activated this Codex desktop task.

## Construction and operational frontier

The local product is the prompt adapter, executable, candidate configuration
renderer, host inspector and subprocess tests. Their source hashes are bound
into the router projection and ARE source closure. The CLI ontology scaffold
records hook input and advisory projection as candidate navigation concepts.

An earlier PATH-host inspection reported `codex-cli 0.114.0` and
`codex_hooks under development false`; that observation is historical, not a
current host compatibility claim. The candidate is not
installed in `.codex/` or global configuration. Unit tests invoke the rendered
shell command with simulated events. The separate pinned native canary proves
dispatch and wire delivery to a local fixture using a scoped trust override;
it does not prove persisted trust approval or production model behavior.

Remaining host tests cover persisted trust, timeout/failure behavior and in-flight
steering on the selected operational host. Hook enablement and registration are
separate operational steps. The [event adapter](EVENT-BINDING.md) now binds
PreToolUse and native completion to their originating request without parsing a
transcript. Gateway/VPS continuity follows. MCP is last.

## Open Questions

- Which operational host will use the tested binary and reviewed hook trust?
- Which host event binding will connect tool proposals to the active request?
- What completion evidence will a later continuation adapter verify?

The broader sequence and operational owners remain in [PLAN.md](PLAN.md).
