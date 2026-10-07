# ARE DSH gateway backend adapter

This package adapts the pinned DeepSeek Harness headless runtime to the JSONL
app-server lifecycle already consumed by the ARE gateway. It is a bounded first
slice: one DSH process per turn, bounded active turns, bounded replayed
conversation history with durable per-thread restart recovery, no steering, and no effect tools. `turn/interrupt` waits
for the child process tree to settle. ARE `additionalContext` is preserved in a
tagged prompt section rather than being silently discarded.

The dependency is pinned to `@deepseek-ai/dsh@0.1.5-rc.2`. The adapter always
accepts only provider configuration plugin IDs in an optional overlay, then
applies its bundled read-only patch last, so the overlay cannot add a custom
plugin or re-enable stock effect tools. The real-runtime canary uses a loopback-only scripted
OpenAI-compatible provider, advertises zero tools, needs no credential, and
does not make an external model call.

## Install and test

```sh
cd implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter
npm ci --ignore-scripts --no-audit --no-fund
npm run patch:dsh
npm test
npm run canary
```

`patch:dsh` applies a candidate private patch to the exact pinned, nested
`@deepseek-ai/dsh-session@0.1.5-rc.3` installation. It verifies the lockfile,
package versions, and original source digests before any write, and is
idempotent for the expected patched files. `verify:dsh-patch` runs before tests
and canary; a fresh `npm ci` must be followed by `patch:dsh`. Source drift
fails closed. The repo-owned applicator is the durable source; generated
`node_modules` edits are disposable. Installing the patch alone does not
enable ARE Web admission; the disposable Host-owned Web fixture loads it
explicitly and binds the Session guard before Agent publication.

The candidate `src/web-prompt-permit.mjs` now connects that checkpoint to real
ARE `route` and `context` preparation for direct, text-only requests. The
disposable Host-owned Web profile now binds one local Host, a native Agent
generation, the closed loaded graph, the gateway writer, and the no-tool
preset before admitting Web prompts. It is not installed into the user's
ordinary DSH Web process or the shipped headless adapter. Unknown/ambiguous
ARE requests and image/file content fail closed in this slice. The test-only
`config/presets/are-read-only` root also demonstrates why disabling Host tool
rows alone is insufficient: the stock Web `standard` preset still contributes
model-facing tools. Do not use this prototype preset as a full-Web parity
claim.

The qualified AgentLoop now adds the selected ARE context as a transient,
bounded system message to the model request after its native request is built.
The context is bound to the admitted text and request receipt, and the local
provider test confirms receipt without adding the context to native Session
history or the browser's redacted history. The opt-in `dsh-web-host` command
now sends route/context preparation and durable gateway-journal operations to
one separate ARE process. A proxy thread provides the synchronous facade
required by the pinned native Session append guard; it does not own the file
writer. Loss of the ARE process closes both admission paths without an
in-process fallback. The DSH Host still owns the native Session writer. This
is a DSH Web-specific gateway sidecar, not yet the shared Codex gateway server
or full control of arbitrary DSH Web sessions. A live Host test kills the
sidecar after native Session creation: shutdown reports an unsafe release,
does not checkpoint a release index, and a fresh Host refuses automatic
adoption of that unreleased Session.
The Host-to-sidecar preparation channel rejects inputs over 512 KiB and more
than 16 pending preparations before IPC dispatch. Those rejections leave the
single journal writer healthy; valid requests can proceed when capacity frees.
Immediately before provider-stream invocation, the Host rechecks the exact
prompt or queue-edit intent in that journal and appends a content-free
`dsh-model-entry-intent` observation bound to the native turn, selected
context, and model-facing message digest. It records an attempted dispatch,
not proof that a remote provider received or consumed the request.

The canary should print one JSON object with `"ok":true`, the pinned DSH
version, and `"tools_advertised":0`.

## Adapter use

```js
import {createDshGatewayBackendAdapter} from "./index.mjs";

const adapter = createDshGatewayBackendAdapter({
  dsh_home: "/absolute/private/dsh/home",
  patch_path: "/absolute/provider/profile.patch.yml",
});
```

The returned object implements `are.gateway-backend-adapter/v1` and is
selectable through `are gateway --backend-agent dsh`. `patch_path` is an optional
provider/configuration overlay; the bundled read-only patch is always applied
after it. Configuration may also set `dsh_entry` when the pinned package is
installed outside this package.
The adapter declares `thread_ownership: gateway-created`. The ARE gateway
requires a thread to be bound to its consumer before DSH resume or turn start;
it does not treat knowledge of a durable backend thread ID as ownership. If
gateway ownership records are lost, the backend history remains on disk but
cannot be silently adopted by a new gateway session. A real gateway CLI plus
ARE-wrapper fixture now passes one local turn with ARE-added context; this is
not an installed-client or live-service result.
DSH now declares a closed client-method set separate from the Codex host
catalog. An owned `thread/close` reaches DSH and reclaims its thread, whereas
undeclared `thread/read` fails before dispatch and compaction remains
unsupported. The adapter also declares the six server notification methods
emitted by its shim; each requires a bounded thread ID already owned by the
gateway consumer. Responses must correlate to a forwarded request and any
returned thread ID must match its requested thread. Unknown server methods,
unowned events, and unsolicited responses terminate that gateway session.
This is the shim's event contract, not attestation of an arbitrary DSH process.
The separate DSH Web prompt tracker accepts only its exact `are/redacted`
projection marker as an ignorable unknown journal type; a plugin-supplied
unknown event is rejected even if it claims to be ignorable.

The adapter starts from a minimal inherited environment. Provider credentials
must be passed explicitly through adapter configuration. Configure
`workspace_root`, a private `dsh_home`, `turn_timeout_ms`, `max_threads`, and
`max_active_turns` for
hosted service use. Requests outside the workspace root, excess threads,
oversized prompts, and unsupported non-text inputs fail closed.

The gateway CLI accepts `--dsh-env-allowlist NAME,NAME`; only those named host
variables are forwarded to the DSH adapter. Do not place credential values in
command-line arguments.

## Boundaries and open questions

An opt-in local prototype of the restricted Host-owned DSH Web profile is
available through `node implementation/agent-reasoning-engine/bin/are.mjs
dsh-web-host --home /absolute/private/dsh-home --workspace
/absolute/selected/workspace`. The home must already exist, be owned by the
caller and mode 0700 on Linux. The command verifies the pinned source/graph
manifest, starts Web on a loopback-selected port, prints DSH's tokenized local
URL plus a content-free `are.dsh-web-host-ready/v1` receipt. On SIGINT/SIGTERM,
ARE first closes new Web mutation admission, waits up to 30 seconds for
in-flight admissions to settle, then drains each live owned Agent, verifies durable native history and request
outcomes, releases its writer, and reports the released native IDs in
`are.dsh-web-host-stopped/v1`. An unreconciled release exits nonzero; do not
blindly resume it. Clean shutdown atomically checkpoints the released IDs
against the private gateway journal head, selected workspace and pinned
manifest. A fresh invocation automatically resumes only that verified set;
repeated `--resume-session session-...` arguments provide an explicit recovery
path if no valid index can be used. The owner still checks each native release
cursor before handover. The authenticated Web list then exposes the same native
Session. This was live-tested with a disposable private Home.
The 2026-10-06 Host and canary manifests pin the journal worker after a
pre-notification response race fix. A worker response signalled just before the
Host begins its synchronous wait is now accepted instead of faulting the Host.
Both complete graph manifests verify against the installed pinned DSH tree.
The manifest ID change deliberately prevents an older release index from being
silently resumed under the changed Host source; reconcile and explicitly resume
an older private Home only after checking its native release cursor. The focused
race test and resumed-Host observer test passed. An interrupted serial package
run reached 77 passed, zero test failures and 19 cancellation reports; it is
not a full-suite pass.
The subsequent `-prep1` Host manifest revision adds a content-free
`dsh-are-preparation-observed` event to the same exclusive gateway journal,
after an exact prompt or queue-edit intent and before native insertion. It binds
the backend thread and request digest to the ARE route/context receipts, but
stores no prompt text, plan, goal, or hidden reasoning. Wrong-request and
duplicate observations reject; compaction/reopen preserves the receipt. Both
revised manifests passed full source-pin and 523-package verification, the
separate read-only manifest passed after its source-pin refresh, the gateway
store suite passed 41/41, the Host-owner suite passed 31/31, and an authenticated
Web create/mutation conformance fixture passed. The Companion now projects the
latest retained route/context preparation per active DSH Agent, separately
from native turn state. The projection is content-free and is not a plan,
goal, Reasoning State Frontier, or proof of model context use. The extracted
Windows Companion and disposable DSH Host UI smoke passed 2/2 on 2026-10-06;
the test verified Windows observation plus Adapters and Threads display.
Four focused release/recovery checks subsequently passed against the resealed
profile: the release index rejects mismatched workspace/manifest/journal heads
and unsafe files, an unowned native append blocks resume, and a clean durable
release supports an exact second handover after abrupt exit. These fixtures do
not qualify arbitrary crashed or live Homes for automatic adoption.
The command never changes the default DSH installation or claims
control of a stock Codex task. The selected Home and workspace are explicit;
do not reuse a live DSH Home with unrelated Sessions. This remains a
single-local-Host, read-only, candidate profile. A local DSH client plugin now
adds a compact ARE prompt-outcome indicator to the Session header. It consumes
only the bounded `arePromptOutcomes` projection from the Session list/history
and control baseline; it provides no browser write path and hides itself before
the first prompt. The authenticated Web boot graph, native Session list,
outcome indicator, redacted user/assistant history, and a browser-submitted
second turn were verified in a disposable Firefox visual check with a local
mock provider. The second prompt appeared once and its reply appeared live,
without a reload. The projection retains only bounded user-RPC correlation,
turn/step coordinates, sanitized turn-end reasons, and an empty assistant
stream array needed by the pinned browser client; it does not export raw
reasoning chunks or failure details. A bounded default `modelSelection`
projection shows the one Host-selected model in the Session composer instead
of a perpetual loading label; alternate model selection remains unsupported.
The control stream publishes bounded prompt-outcome replacements after a
journaled acknowledgement and terminal observation, so an open Session header
can advance without a list refresh; native projection values and prompt text
are never forwarded. The check used
user-local Playwright shared libraries and did not modify the system
installation. The qualified overlay also excludes the two stock client-only
dynamic Cordis modules because this profile disables their Host counterpart;
the Firefox check produced no dynamic-runner inventory or inspect-sync calls
and no console errors. This profile is not a general DSH Web rollout.

- This integration does not promote or modify immutable ARE Product Candidate
  020. It is successor-candidate working-tree material.
- DSH reasoning remains private. The operator receives a correlation ID, byte
  count, and digest, never diagnostic text; clients receive bounded adapter
  status, latency, and output-byte telemetry.
- The adapter persists bounded thread/history records with mode `0600` and
  supports `thread/resume` after restart. It does not claim native DSH session
  reuse or steering. Recovery requires the corresponding gateway ownership
  record; orphaned history needs a separately verified migration path.
- Website adoption, tenant isolation, durable provider usage accounting,
  OS/container isolation, and live deployment remain later gates.
- The private Session append guard installs before Agent publication. The
  Host-owned profile admits only its bound text-prompt, model-dispatch, cancel,
  pending-queue-edit, pending-queue-removal, and scoped queued-prompt-steering
  mutation paths. Prompt ACK loss,
  cancel ACK loss, release,
  compaction, and a fresh-Host native resume have disposable live tests.
  Queue edits re-prepare the replacement text with ARE and preserve the exact
  native item identity. Edits, removals, and steering require a pre-append gateway
  intent and durable native event observation. Steering moves one pending item
  into the active native turn; all consumed prompts receive terminal observations. The
  authenticated Web path and fresh-Host resume are covered by a disposable live
  test. Direct `prompt(mode: "steer")` is also admitted only while a bound turn
  is active and the native next-step inbox is empty; a live test consumes it in
  the same turn after queued steering. Cancellation after steering is consumed anchors the native
  turn to its first admitted request; a live Web test verifies both interrupted
  terminal observations and durable release. Uncertain mutations fail closed;
  no blind replay is attempted.
- A lost prompt acknowledgement remains uncertain while the prompt is merely
  queued. If that exact guarded prompt is consumed and its native turn/end is
  durable, the terminal observation reconciles the request without redispatch;
  the live ACK-loss test then releases and resumes it under a fresh Host.
  Authenticated `session/list` and `session/follow` expose the latest 16 owned
  prompt outcomes through the read-only `arePromptOutcomes` projection: an
  opaque request-key digest, `uncertain`/`accepted`/`recovered` disposition,
  and optional terminal status. They do not expose prompt text or raw request
  IDs. A live fresh-Host resume test verifies that the authenticated Web read
  returns the same recovered outcome after handover. The qualified Host
  overlay loads a local browser plugin that renders the bounded outcome as a
  Session-header status; it does not patch DSH's prebuilt frontend in place.
- Headless-adapter steering, approvals/effects, arbitrary browser
  identity, and rollout to a user's normal DSH installation remain unsupported.
  The local Host profile does not control stock Codex desktop tasks. Same-process
  untrusted plugins are not isolated by the JavaScript append hook.

The read-only Companion can observe this restricted Host when it is launched
with `--observation-socket /absolute/private/dsh-home/are-observation.sock`
and a private, random `ARE_ADAPTER_OBSERVATION_TOKEN` of at least 32 bytes in
the Host environment. Set the Companion's `ARE_COMPANION_OBSERVATION_SOCKET`
to that same socket and give it the same token. The socket is mode 0600 and
is removed on clean shutdown. After an abrupt exit, the next Host may remove
only an owner-private stale socket after its journal writer lock is acquired;
an active listener is never replaced. Its projection
checks the ARE sidecar journal and reports Host liveness, but does not claim a
connected browser, an exact ready Session path, or desktop-task control. The
DSH-specific `dsh_web_activity` projection reports the number of active
Host-owned Agents plus retained native model-entry and terminal observations.
It also lists at most 16 active Agents by opaque backend-thread reference,
their latest retained model-entry or terminal event, their in-memory native
turn state at observation (`not-started`, `open-observed`, `closed-observed`, or
`unknown`), and the number omitted. An open native turn is not a current
model-running signal. The journal can remove older events, and the view
contains no prompt or reasoning content.
The disposable no-tool turn test holds its local mock provider response and
observes `open-observed` before native `turn/end`, then `closed-observed` after
completion; it does not assert a remote provider or arbitrary DSH Web profile.
These are bounded counts from this Host and journal, not browser-client identity,
thread reasoning content, or proof that a desktop task uses the Host. The
Companion's selected detail still reads one source, but its additional
read-only inventory can show this DSH Host beside a separately configured
Codex gateway observer. Configure a distinct per-source token as documented
in the Companion README; an inventory row does not claim shared session or
desktop-task control.
For an explicitly selected Windows development Companion reading a DSH Host
in WSL, use `--development-observation-tcp-port 0` instead of
`--observation-socket`. The Host binds only `127.0.0.1` and prints its
`tcp://127.0.0.1:<port>` `observation_endpoint` in the ready receipt; the same
private observation token is still required. Set the Companion's
`ARE_COMPANION_OBSERVATION_SOCKET` to that endpoint. This relies on WSL
localhost forwarding and is a development-only diagnostic, not a public
listener or authenticated browser/session ingress. The Unix socket remains
the default opt-in observation choice on Linux.

From WSL with native Windows `node.exe` and `wslpath` available, the opt-in
`ARE_TEST_WINDOWS_DSH_OBSERVATION=1 node --test --test-name-pattern='DSH Web Host command starts' test/web-host-cli.test.mjs`
check starts a disposable private Host, creates and cleanly releases a native
Session, resumes it under a fresh Host, and reads that Host's authenticated
loopback observation from Windows Node. It does not launch the Companion GUI,
install software, or establish a browser connection or desktop-task control.
The 2026-10-06 rerun against the resealed Host manifests passed this exact
Windows observation test (one test, zero failures); the Companion renderer
remains a separate check.
The same resealed profile also passed three focused authenticated Web tests:
fresh create with rejection of unowned mutations, one native no-tool turn with
an acknowledged prompt, and one native no-tool turn reconciled after prompt
ACK loss. These do not establish arbitrary Web feature parity, a browser
client connection, or installed Companion behavior.
Three preparation-race fixtures also passed after resealing: a settings-default
change, old-Agent substitution, and ARE preparation outage each invalidated
the pending prompt permit before native insertion. Five separate settings/graph
drift fixtures passed: settings-default, extra-tool, preset edit, loader reload,
and preset remount each revoked qualification before Web prompt insertion.
Two queue-steering fixtures also passed: three authenticated Web prompts were
consumed in one native turn and the Session resumed, and cancellation aborted
a turn after steering had been consumed. These are local mock-provider checks,
not arbitrary DSH Web-client or effect-tool parity.
The resealed profile also passed focused clean-handover and queue-removal
fixtures: a fresh Host resumed the old native Session after clean writer
release, and an authenticated Web edit/removal journey dispatched the edited
prompt without restoring the removed pending item on resume.
The qualified two-Agent graph fixture and Host-owner contract suite passed
32/32 after the worker/manifest change. The owner checks include first-claim
failure, unpublished binding, overlapping resume, changed native history,
uncertain writer quarantine, prompt/cancel intent failures, and public-only
history/control projections. This is local contract evidence, not a full
browser or installed-package qualification.

For an explicitly approved GUI smoke test of an already extracted Windows
Companion executable, add
`ARE_TEST_WINDOWS_DSH_UI_EXE=/mnt/c/path/to/are-companion.exe` to the same
command. The test starts the extracted Companion against the disposable
resumed Host, checks the Adapters and Threads DSH read-only views, then closes
the Companion and Host. This does not install the package or prove that the
browser is connected. The executable must contain the current DSH UI source;
later source edits require a matching rebuild before this packaged check can
qualify them.

On Linux, an extracted `.deb` can run the analogous native WebKitGTK check by
setting `ARE_TEST_LINUX_DSH_UI_ROOT` to its `opt/are-companion` directory and
providing an isolated X11 display plus equal, test-only
`WEBKIT_INSPECTOR_HTTP_SERVER` and `ARE_LINUX_UI_INSPECTOR_SERVER` loopback
addresses. The opt-in test opens only that extracted Companion, checks one
resumed Host-owned Agent, its observation time and current-Host-run turn
label, and closes the processes. It does not install the package, connect a
DSH browser client, or observe hidden reasoning.

## Explicit Host parent-plan selection

The restricted Linux Host accepts optional `--plan-selection /absolute/selection.json`.
Omitting it does not discover a plan, infer requirements from the workspace, or
select the Companion's seven-panel plan. A retained plan cannot subsequently be
omitted on gateway restart. This is private Host startup configuration, never a
field of a browser prompt, resume request, or observer connection.

The selection is a closed `are.dsh-host-plan-selection/v1` JSON object with
exactly these fields:

```json
{
  "schema_version": "are.dsh-host-plan-selection/v1",
  "parent_plan_ref": "plans/parent.md",
  "parent_plan_digest": "<sha256 of the exact parent file bytes>",
  "active_slice_id": "adapters",
  "source_refs": [
    {"source_ref": "plans/parent.md", "source_digest": "<same sha256>"}
  ],
  "feature_obligations": [
    {"obligation_id": "adapters", "summary": "Show connected and running adapters", "status": "active"},
    {"obligation_id": "evolution", "summary": "Show the Evolution engine", "status": "open"}
  ],
  "unresolved_decisions": [
    {"decision_id": "resource-budget", "question": "What is the accepted memory budget?"}
  ]
}
```

The example is a shape illustration, **not** the full ARE plan or a runnable
selection: replace its placeholders and include every obligation of the selected
parent. Compute source digests from exact bytes, e.g. `sha256sum plans/parent.md`
from the selected workspace. A digest verifies byte identity, not the semantic
completeness of the human-authored obligation list. No Markdown parser pretends
to derive the plan. Use `node bin/are-dsh-web-host.mjs --home /absolute/private/home
--workspace /absolute/workspace --plan-selection /absolute/selection.json` on one
line. Existing observation options remain independent.

Source references are workspace-relative regular files with no traversal or
symlink resolution. Limits are 16 sources, 1 MiB per source, 4 MiB total source
bytes, and 16 KiB selection JSON. The shared plan-context validator bounds 32
obligations and decisions, requires an existing non-completed active slice, and
rejects duplicate IDs or unknown fields. Every obligation seeds requirement
continuity; declared statuses and questions remain context, not verified progress.

The Host and private ARE process verify the selection; preparation rechecks its
exact startup digest and source bytes. Reasoning State durably retains the
thread-bound plan before interpretation, independently of whether that prompt
is admitted. A successful native-preflight checkpoint then binds the retained
plan event/digest, selection digest, objective and requirements. Model context
keeps the full bounded plan projection, including inactive obligations and open
decisions, via `are.dsh-objective-binding/v2`; unselected bindings remain v1.
The public observer remains content-free and does not expose plan text.
Successful selected preparations now retain the validated plan-context digest
and content-free declared plan counts in checkpoint observation/summary v3.
Counts include completed/open/active/deferred obligations, open decisions and
the active slice ordinal/status; preparation validation independently derives
them from the exact verified model-context plan before admission. The native
bridge and Threads source label these as checkpointed declarations, not
independently verified product completion. No plan text, obligation ID, path or
private reasoning is exposed. Legacy v2 summaries show a selected-plan reference
without counts; v1 selection remains not reported. These are the latest retained
successful preparation's counts, not necessarily the current plan head. Latest
plan-head and interpreted-but-unadmitted counts are now separate closed projections.
The owning-runtime plan-head read requires an active binding and matching retained
checkpoint; it never creates a prompt or advances the plan. Missing, unreadable
or changed source files report `unverified-at-read`, leaving the retained counts
as checkpoint-time declarations rather than current source or completion proof.

When multiple selected preparations enter one native model call, planned
`are.dsh-web-model-context-batch/v2` shares the complete plan and selected source
items once. Requirement entries use readable one-element `[obligation_id]`
references to the full plan summaries; other requirements remain literal text.
Each request retains its own ordered replacement tree relative to a common
template and the digest of its exact original model-context string. The
composer independently reconstructs every original byte string before dispatch.
This is readable structural sharing, not compressed data requiring a tool,
truncation, one merged objective or a completion verdict. Unknown shapes,
missing sources, invalid references and changed digests refuse. The 32,768-byte
model-context limit and 16-request batch ceiling remain unchanged; a genuinely
oversized union still fails. Unselected batches remain v1 and single selected
preparations that fit remain v2. Oversized selected preparations use readable
single-context v3: full shared plan, requirement-ID references, shared source
values and an exact expanded-context digest. A batch containing such a row uses
v3 with backward-only shared-value references, ordered object/field-delta
projections, literal text fragments and escaped reserved syntax. Every original
wire string is reconstructed and digest-checked before dispatch; mixed v2/v3
rows retain their original schemas. Wire bounds remain 32 KiB; internal
integrity expansion is separately bounded at 64 KiB. Malformed/cyclic references
and genuinely oversized unions refuse. This is local reconstruction evidence,
not proof of model comprehension. See `src/web-model-context-batch.mjs` and the full-plan
owned preparation/native queue-steering tests. Actual local-provider tests
cover three distinct objectives and a new continuing turn after Host restart;
they do not qualify external-model semantic quality or a fresh OS package.

### Open questions

- Checked advancement is available through the explicit v2 startup selection
  described below. Replacing obligation IDs or requirement summaries remains
  explicit v3 accounted migration work below; v2 advancement deliberately rejects it.
- The content-free interpretation projection below covers a retained checkpoint
  with no matching admission retained. Full plan-progress semantics and a fresh
  packaged Companion qualification remain open.
- Bounded semantic fallback and trusted feedback/Evolution attribution remain
  separate integration work. Source tests do not qualify fresh OS packages.

### Interpretation retained before admission

The private gateway now writes `dsh-objective-interpretation-observed` only
after the shared objective lifecycle has sealed and fsync-checkpointed a resolved
interpretation. The closed record binds the exact Host generation/thread and
contains digests and optional bounded declared plan counts, including the manual
checkpoint, interpreted state and selected-plan reference. It precedes subsequent source/preflight and
Host admission checks; unresolved interpretation and plan selection alone do not
produce it. Journal write failure stops preparation rather than fabricating a
successful observation. Journal replay/compaction checks the binding separately
from dispatch requests; this record creates no dispatch intent or native turn.

The observer matches the latest interpreted scope/state/resolution to a retained
admission preparation on the same thread. When no match is retained, it exposes
closed `are.dsh-objective-interpretation-summary/v2` for a selected plan with
counts, or legacy/reference-only v1, as `are_interpretation`,
separate from any older `are_preparation`. Threads source labels this as
`no admission retained for this interpretation at observation` and explicitly
not a rejection verdict or model execution. It may be observed while preparation
is in flight or after a refusal. A later matching admission removes this separate
summary. This is a Host-reported checkpoint reference, not independent replay
of the private objective ledger, completion, hidden reasoning or chat control.
Older producers that omit the field remain readable; omission is not proof
that no interpretation occurred. Selected counts are derived from the verified
plan at the interpretation checkpoint, not a new source read or independently
verified completion; source drift after that checkpoint cannot promote them to
current-source state. The native bridge and Threads retain that distinction.
The 16-row and 16-KiB response ceilings remain;
dual-evidence rows are omitted as whole rows with an explicit omitted count
when their list reaches the existing response budget.

### Accounted replacement of a retained plan

Private startup selection `are.dsh-host-plan-selection/v3` keeps the same base
fields as v1 and adds `plan_transition.kind: "replace"`. Each predecessor has
exactly `thread_ref`, `plan_context_digest`, `continuity_digest`, and `accounting`.
Each compact accounting row has exactly `objective_id`, `snapshot_digest`,
`retained_indices`, `removed_indices`, `added_obligation_ids`, and
`added_requirements`. Indices bind to the exact previous snapshot; added IDs bind
to the verified successor's summaries; manual additions remain literal. Every
retained objective and every old requirement must be accounted for. A browser
or observer cannot provide this operation. The selection file remains bounded
at 16 KiB, with up to 32 distinct thread predecessors and 17 accounting rows per
thread. Receipt/continuity budgets remain 32 KiB. Full-text legacy migration v1
remains readable; v3 startup requires compact accounting.

Before interpreting the next real request, the private lifecycle verifies the
actual thread frontier and jointly checkpoints the new plan and migration.
Only then are resulting requirements published. An exact retry after restart
does not repeat or rewind migration. Failure stops preparation and later writes;
an uncheckpointed crash tail refuses without truncation. Seven-panel and full
30-obligation private-worker tests preserve three objectives and a manual
requirement. A separate native full-30-obligation replacement test now proves
one active objective through lost ACK, fresh-Host resume, an exact successor
local-mock model request and matching observer checkpoint. Native v3 Research
queue/steer batching and fresh-Host continuation now have independent exact-byte
provider evidence with all 30 obligations. A separate native replacement variant
also verifies one migration across all three retained objectives, all 30 successor
requirements and fresh-Host continuation without redispatch. Plan-progress reads,
broader resource stress and the remaining parent scope remain open; the earlier
unreplaced Research-resume fixture has only 12 bytes of
headroom under the unchanged 32-KiB ceiling. See the
[implementation record](../../apps/desktop-companion/docs/DSH-OBJECTIVE-CONTINUITY-IMPLEMENTATION-ANALYSIS-2026-10-06.md#compact-accounting-and-private-dsh-replacement-2026-10-07)
for evidence and full-plan open questions.

### Checked advancement of a retained plan

Use the same private `--plan-selection` option with a closed
`are.dsh-host-plan-selection/v2` file. It has every v1 selection field plus:

```json
"plan_transition": {
  "kind": "advance",
  "predecessors": [
    {"thread_ref": "backend-thread:<64 lowercase hex digits>",
     "plan_context_digest": "<exact retained plan-context digest>"}
  ]
}
```

The placeholders are not runnable identities. Select exact private retained
thread heads; hashes are correlation, not authentication. Up to 32 unique
thread/predecessor rows fit within the unchanged 16-KiB selection limit. The
Host's existing authenticated journal binding must still match the request.
Neither a browser request nor an observer can choose or advance the plan.

Advancement requires an existing selected plan and its exact current predecessor.
The parent reference and ordered obligation IDs/summaries must stay unchanged;
no requirement is silently dropped, renamed or reseeded. Verified source bytes,
the active slice, declared obligation statuses and unresolved questions may
change. These declarations do not prove completion or decision resolution.
The successor is thread-bound, sealed and fsync-checkpointed before prompt
interpretation, using the existing shared plan-context predecessor chain.
An already applied transition can reopen idempotently only with the same
template and recorded predecessor. Stale/foreign/missing predecessors refuse
before interpretation; an advancing profile cannot initialize a new thread.
Keep the same descriptor for recovery, or explicitly select an equivalent v1
template when initializing new threads. Prepare selection changes after draining
the old Host, never by editing its already digest-bound startup file in place.
Mixed-plan model batches remain refused rather than merging plan revisions.

The private seven-panel and full 30-obligation tests preserve an added requirement
through advancement/reopen and reject stale replay. A native lost-ACK/released
Session test resumes in a fresh Host, advances the active slice, preserves all
seven requirements and reaches the local provider exactly once for the new
continuation. No current chat or live Host profile was advanced by these tests.
