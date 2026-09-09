# Workspace task review and launch

Status: implemented; browser launch through the VPS passed, 2026-09-07.
Authority effect: none. Owner: the user directing this Workspace/VPS continuation.

## Current product boundary

Workspace's Luna activity panel now includes **Launch a Luna task**. The user
connects to a private local bridge, enters an instruction and supplied text,
reviews the exact task and budget, then explicitly launches it. Accepted work
runs through the existing RWO → ARE → Codex → Luna path. The panel shows its
status, text result and native execution receipt.

The D65 chain is existing task/RWO/ARE definitions → explicit reviewed objective
and immutable task binding → authenticated bridge/UI → real browser and native
fixture tests → one bounded VPS acceptance. This is owner-directed construction
and operation, not governance admission. No new route or ontology selector was
introduced. Operational support is owned by the local/VPS operator: SSH access,
the pinned runtime, private state and process lifecycle. Multi-worker scheduling,
packaged desktop validation, broader task kinds and MCP remain separate work.

## Use the active controls

The [local controls preview](http://127.0.0.1:18085) renders the actual Workspace
component. Its bridge is `http://127.0.0.1:18084`. Copy the token from:

```text
/home/vrondelli/.local/state/are-workspace/task-bridge-02/access-token
```

Enter the bridge address and token, then connect. The token stays in memory in
the UI and is cleared on disconnect. It is not embedded in the preview, URL,
logs or browser storage. One unused user launch is available in this bridge's
initial budget; the acceptance test used its own isolated state.

Task type is **explain or summarize supplied text**. Enter a title, instruction
and input text. **Review task** sends no model request. Editing the fields
invalidates that review. **Launch task · 1 model call** accepts the displayed
budget: one provider request, at most 512 output tokens, no tools. Review expires
after five minutes. Disconnecting the UI does not cancel an accepted task.

The preview is a component preview, not a full Workspace or packaged Tauri build.
The same component is imported by `LunaWorkers.tsx`. HTTP loopback origins,
including the configured Tauri development URL, are supported; packaged native
origins have not been enabled or tested.

## Routing and task integrity

Workspace submits `objective_kind: "understand"` as part of the task digest.
Both the App Server wrapper and native hook decisions receive this reviewed
objective. Routing uses the user's instruction; supplied text remains bound
input data, even if it mentions implementation or deployment. The complete native
prompt and task digest remain evidence of the exact input. Native startup checks
that the instruction selects `CA2-ROUTE-UNDERSTAND`; other objectives are rejected.

The original live attempt exposed `selection.no-match` because no objective was
declared. It made **zero provider calls** and remains preserved in uncertain
state at `/srv/are-luna-pilot/tasks/16760a7586845ef8`. It was never retried.
The [blocked-attempt receipt](../evidence/workspace-launch-blocked-attempt.json)
owns that history.

The new candidate at `/srv/are-luna-pilot/candidates/6b12d9c903080a07` derives
from the original manifest with exactly one changed file:
`src/gateway-session-client.mjs`. Its host-owned `hook_decide` callback carries
the typed request into the real ARE CLI; it does not synthesize decisions or
replace the registry. The version marker makes older clients fail before task
startup. The host rejects a mismatched native prompt. Existing services retain
the original candidate. The [candidate manifest](../evidence/workspace-objective-candidate.json)
and [installation receipt](../evidence/workspace-objective-install.json) bind this delta.

## Bridge behavior

The bridge accepts authenticated GET `/api/v1/tasks`, POST `/api/v1/tasks/review`
and POST `/api/v1/tasks/launch`. It binds only IPv4 loopback and checks Host,
Origin, bearer token, JSON shape, task digest and explicit budget acceptance.
Browser redirects and ambient credentials are disabled. Task input limits use
the existing [text-task contract](TASKS.md); UTF-8 request decoding is strict.

Launch intent is atomically saved and fsynced before staging or SSH execution.
One task can run at a time. Duplicate launch requests return the existing task;
they never invoke the executor twice. Completed results survive restart. A
corrupted journal, changed source binding, stale process lock, interrupted
dispatch or uncertain result blocks further execution. There is no automatic
retry or automatic state reset. A valid completion requires the task identity,
ARE completion binding, bounded output and the remote runner's offline replay.

The default lifetime budget is one task; an operator may explicitly configure
1–10 tasks before starting a fresh bridge. This does not permit concurrency.
Private state, stage files and receipts contain supplied input/output and must
stay with the operator. The local preview serves only its three static assets.

## Processes and reproduction

[workspace-controls-activation.json](../evidence/workspace-controls-activation.json)
records the current bridge/preview PIDs and token path. Both are ordinary local
processes with no automatic restart. Send SIGTERM to those exact PIDs to stop
them. The bridge waits for accepted work to settle. Preserve its state; do not
delete locks or change the journal to force a retry. An earlier empty bridge
state was retained when activating the final source binding.

The pinned local kernel is recorded in [workspace-bridge.candidate.json](workspace-bridge.candidate.json).
Start a configured bridge in the foreground with:

```sh
node workspace-task-bridge.mjs workspace-bridge.candidate.json
```

The preview builder uses isolated dependencies: React/React DOM 19.2.8,
TypeScript 7.0.2, esbuild 0.25.12 and Playwright 1.58.2. Test browser libraries
were extracted into a temporary directory from Ubuntu 24.04 packages; no host
system packages were installed. The operational bridge needs Node and SSH,
not those browser libraries.

```sh
node test-workspace-task-bridge.mjs /absolute/rwo-are-pilot-kernel
node test-workspace-launch-browser.mjs /absolute/test-dependencies /absolute/rwo-are-pilot-kernel /tmp/controls.png
# The optional final argument "live" consumes one new explicitly selected VPS task.
```

## Evidence and remaining work

- [Bridge behavior](../evidence/workspace-launch-bridge-test.json): auth, origin,
  review/budget binding, persistence, duplicate launches and uncertain outcomes.
- [Browser behavior](../evidence/workspace-launch-browser-test.json): real HTTP
  CORS/auth, review invalidation, launch, escaped result text and mobile layout.
- [Native objective binding](../evidence/workspace-launch-native-objective-test.json):
  actual RWO/native ARE, declared objective in both decision paths, supplied-text
  isolation, verified completion and offline replay.
- [Live browser launch](../evidence/workspace-launch-live-browser.json): one model
  call and successful offline replay at `/srv/are-luna-pilot/tasks/613746ee94827ef5`.
- Gateway/hook regression tests: 22 passed. The integrated Luna components pass
  strict TypeScript checking. Full Workspace packaging was not run.

## Open Questions

- Packaged desktop origins and the full Workspace/Tauri build need separate validation.
- The registry can reject instructions that select another objective; broader
  text-task types need explicit route contracts rather than lexical fallbacks.
- A multi-worker queue, task cancellation and operator-led reconciliation remain separate.
- Token rotation currently follows bridge restart; longer-lived operator sessions
  and budget administration need a bounded operational design.
- MCP remains last. Existing arbitrary Codex sessions are not adopted by this launcher.
