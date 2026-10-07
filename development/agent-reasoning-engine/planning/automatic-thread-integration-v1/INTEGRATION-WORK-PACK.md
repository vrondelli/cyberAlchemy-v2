# ARE existing desktop-task integration work-pack

Status: candidate, updated 2026-09-28. Owner: ARE product owner with Codex host
integrator. Route: `CA2-ROUTE-IMPLEMENT` for exact owner-directed construction;
no product approval, host activation, task handover, release, or deployment is
implied. This implements the [parent plan](PLAN.md) through the
[layer boundaries](IMPLEMENTATION-LAYERING.md). The current chat is not an
ARE-managed conversation merely because the ARE MCP server is connected.
The [session-control contract](SESSION-CONTROL-CONTRACT.md) supplies the
post-activation ownership, exclusivity, coverage and rollback criteria for G1/O1.
The [integration map](INTEGRATION-MAP.md) classifies all current entrypoints;
G1 must bind the selected client and backend capabilities rather than treating
Codex, DSH, direct stdio and transparent gateway paths as equivalent.
The TUI is discontinued. Its source and earlier test receipts are historical
provenance only; it is not a target client, UI milestone, fallback, or substitute
for Codex desktop and Companion ingress.
The [2026-09-28 topology delta](INTEGRATION-TOPOLOGY-DELTA-2026-09-26.md)
also records the canonical gateway CLI, coding-agent live demo, local
interaction-review CLI, configured coding-agent runner, and scripted demo as
distinct active executable paths. The live demo remains a direct-wrapper
experimental client, not an acknowledged gateway or current-task controller.
Scoped source discovery and eight-bin ownership checks pass, but do not prove
whole-repository completeness.
The [G1 handover candidate](G1-HANDOVER-CANDIDATE.md) records the observed
process-level transfer proof and the still-unmet desktop-client gates. Its
2026-09-27 read-only installed-host and official-docs recheck found no
documented desktop writer-release or ingress transfer: `thread/unsubscribe`
removes an event subscription, and desktop handoff changes run location, not
session-controller ownership. This task remains outside ARE control.

## Product frontier and DAG

Current integration frontier: G1 desktop-client handover feasibility, while C2
unknown-delivery recovery and F1 feedback attribution remain partial product
construction. H0A and H0B passed their bounded probes; H0C proved an
actual-wrapper native turn but not full effect enforcement. C1 and F2 have
local candidate proofs. None of these starts or transfers this desktop task
through ARE. The [2026-09-28 read-only host recheck](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md#2026-09-28-current-host-recheck)
still matches the exact task and pinned method catalog, but establishes no
desktop writer release or ingress transfer. O1 activation remains blocked;
host-independent C2/F1 construction remains runnable.

```text
H0A host probe -> H0B version-bound native events -> H0C disposable gateway turn
                                              -> C1 typed scope frontier
                                              -> C2 restart/steer/compact recovery
                                              -> F1 feedback attribution
                                              -> F2 Evolution signal intake
H0C, C2, F2 -> G1 same-task feasibility + cutover/rollback candidate
G1 + tested product + separate owner decision -> O1 live task handover
```

| SWU | Layer | Scope and implementation detail | Write scope | Verification / done evidence |
| --- | --- | --- | --- | --- |
| H0A | L0 | Inspect current `hooks` and legacy `codex_hooks` feature rows by exact token, distinguish absent/disabled/enabled, never claim native delivery or installation from a feature row. Report exact binary version. | `implementation/agent-reasoning-engine/bin/are-hook.mjs`, `implementation/agent-reasoning-engine/test/prompt-hook.test.mjs` | Fixture tests for both keys, disabled/missing host, live read-only probe. |
| H0B | L0 | Bind native canary to the selected host's exact version and binary digest; exercise prompt, tool, Stop, terminal notification and reconnect through isolated configuration. No real provider or global hook installation. | Native canary script/tests and its own evidence only, after current bytes are re-read | Version-bound canary receipt, event trace, zero external calls, no active configuration change. |
| H0C | L0 | Run one disposable thread through the actual gateway and wrapper, not a pass-through wrapper; bind route/context, tool assessment, completion and a verified Reasoning State frontier to one host identity. | Gateway canary and tests, bounded fixture runtime | Exact one-turn trace; unknown-effect gate preserved; no duplicate tool or turn; teardown. |
| C1 | L1 | Define a closed, bounded `plan-context` explicit Reasoning State event: parent plan identity/content digest, feature obligations, active slice, unresolved decisions and source refs. Reject missing source, oversize, forged identity and stale predecessor. | Reasoning State schema/runtime/tests and selected wrapper binding | Seal/checkpoint/recover exact plan context; no hidden chain-of-thought or retroactive history. |
| C2 | L1 | Bind host task/turn identity and restore C1 after restart, accepted steer and completed compaction; reconcile unknown delivery before retry; reject second writer. | Host bridge, gateway client, tests | Two-turn, steering, compaction, restart and collision tests. |
| F1 | L2 | Attribute user correction to an exact completed episode; separate task-scope correction, one-time request and reusable preference. Unsupported or ambiguous attribution remains pending until explicit review. | Interaction adapter/provider, owned gateway and hosted-client review surface, tests | Cross-thread negative fixtures, next-turn application receipt, and content-free pending/review recovery. |
| F2 | L2 | Supply a bounded Evolution signal provider/sink to the gateway under opt-in configuration. Store candidate observation with provenance; never admit a cycle or self-edit. | Gateway composition, signal adapter/tests | One verified improvement signal, failed-sink and disabled-path receipts, no activation. |
| G1 | L3 | Verify whether this exact desktop task can be resumed under one ARE gateway writer with complete ingress/completion coverage and an observed backend capability record. Test steering and effect enforcement when advertised; mark unsupported operations explicitly. Prepare watermark, first-turn proof and rollback on a disposable equivalent first. | Host-feasibility evidence and handover candidate | Exact task/account/history binding, one-writer and advertised-capability boundary tests; no live cutover. |
| O1 | L3 operational | Separately decide and execute current-task handover only after G1, exact candidate tests and owner approval. Activate the session-control contract only for the bound task. | Host configuration and private state, separately selected | Recorded activation, live exchange, restart and rollback evidence; otherwise blocked. |

## Current execution evidence

| SWU | State | Evidence and claim ceiling |
| --- | --- | --- |
| H0A | Passed locally | `node --test implementation/agent-reasoning-engine/test/prompt-hook.test.mjs` passed 12/12. `are hook inspect-host` observed `codex-cli 0.155.0-alpha.16.3`, canonical `hooks stable true`, and correctly reported `native-canary-required`, `installed: null`, `native_delivery_verified: false`. This probes the PATH CLI, not necessarily the desktop app executable. |
| H0B | Passed for selected PATH CLI | Isolated `are hook native-gateway-test` passed with expected version `codex-cli 0.155.0-alpha.16.3` and binary SHA-256 `a969c7c42b842c759d157d2500bbf33a562ff95f22dcb7112aa4d8f9e68833d3`: native prompt, tool, Stop and terminal events delivered; disconnected completion recovered; stable turn replay did not redispatch. It used a fixed loopback provider, temporary configuration, zero external model calls, and a pass-through gateway wrapper. This is not a desktop-task or actual ARE-wrapper proof. |
| H0B boundary | Open | ARE classified the fixture's unrelated `printf` tool as `block` (`continuation.zero-admissible`), but the native host still executed it because the hook is advisory. Do not advertise this path as enforcement or a non-bypassable effect gate; H0C preserved the same observation. |
| H0C | Passed for bounded actual-wrapper and approval-requested paths; full host enforcement open | The `--gateway-wrapper` canary ran the actual ARE app-server wrapper with a version-bound native host and loopback fixture. It delivered prompt/tool/Stop/terminal events, verified hook context on the provider wire, recovered a disconnected completion, replayed without redispatch, and observed a Reasoning State frontier. The added `--gateway-wrapper-approval` canary produced one host approval request and wrapper effect directive, returned a client decline, observed no tool success marker, and verified temporary-config removal and child teardown. The original mode still proves an unapproved harmless tool can execute despite advisory hook `block`. Neither mode installs hooks, moves this desktop task, proves multi-turn continuity, or establishes non-bypassable enforcement for every tool; see [H0C approval evidence](evidence/H0C-NATIVE-APPROVAL-BOUNDARY.md). |
| C1 | Passed as a local opt-in primitive; not host-activated | `are.reasoning-plan-context/v1` is closed and 16 KiB-bounded, carries the parent digest, complete supplied obligations, active slice, unresolved decisions, source digests, backend-thread identity and predecessor. The runtime rejects missing/unverified sources, oversize, forged thread identity, and stale updates; append/checkpoint/file recovery reconstruct exact bytes. The wrapper's optional trusted provider binds it into pre-dispatch Reasoning State and reusable backend context. Focused Reasoning State and wrapper suites passed 92/92; the later privacy-filtered Threads projection adds verified digest and progress counts with a native packaged Windows fixture, without plan text or source paths. No provider is configured for this desktop task; C2 host binding, restart/steer/compaction proof, and exclusive handover remain open. |
| C2 | Partial local recovery, steering and gateway ownership proof; not host-bound | A file-backed wrapper fixture records C1 before dispatch, rejects a concurrent Reasoning State writer, recovers after close/restart, and appends a successor plan on the same backend-thread ID. Steering now preflights and checkpoints admission before host dispatch, then commits a successor C1 plan only after an exact accepted `turn/steer` response; rejection preserves the predecessor. Concurrent steering or a new turn while steer outcome is pending is blocked, and a mismatched host acknowledgement degrades that thread rather than silently continuing. A real-wrapper-through-gateway fixture proves the accepted-response path and the Threads projection shows successor progress without private plan text. The gateway durably binds hashed backend-thread references to one consumer before thread/turn mutations, binds `thread/start` and `thread/fork` result IDs before client delivery, rejects a second gateway consumer, and preserves claims through session-store compaction/reopen and gateway restart. It records content-free receipts before delivery for matching accepted steering and completed `contextCompaction`; rejected/mismatched steer and failed compaction do not become success evidence. Both the file session-store and per-consumer Reasoning State v2 writer locks reclaim only a verified terminated local writer after restart under an exclusive recovery marker; live, legacy, foreign-host, ambiguous and interrupted-recovery locks fail closed. The current Linux wrapper suite passed 288 tests with one platform skip; installed Windows Node previously passed the gateway 39/39 and thread-observation 6/6 suites from this WSL checkout. The companion Rust bridge previously passed offline `cargo check`. An isolated native compaction canary proves opt-in C1 restoration on the next model request and fail-closed suppression for missing bound state on the selected PATH CLI; see [compaction evidence](evidence/C2-NATIVE-COMPACTION-CANARY.md). A bounded acceptance receipt distinguishes host-accepted `turn/start` from other unknown outcomes; read-only host history can verify the accepted turn's terminal or active state without making retry safe; see [turn-start evidence](evidence/C2-TURN-START-ACCEPTANCE.md) and [history evidence](evidence/C2-HOST-HISTORY-VERIFICATION.md). Automatic successors now enter the same durable gateway-intent path and recovered unknown outcomes block their redispatch; see [generated-successor evidence](evidence/C2-GENERATED-SUCCESSOR-INTENT.md). The same selected native binary now passes automatic-compaction positive and invalid-ledger modes in separate isolated runs: a completed compaction emits the bound hook, restores the exact C1 context on the next provider request, and suppresses model dispatch when state is unavailable. This does not prove exact desktop-task ownership or automatic delivery on the current desktop task, safe gateway/backend unknown-delivery resolution, cross-process desktop-client exclusivity, or safe descendant-cascading archive/delete. |
| F1 | Partial feedback-only hosted path and disposable installed-host restart/wire proof; general ingress open | Opt-in outcomes exclude interrupted, failed, and historical posture-unverified episodes; see [completion-posture evidence](evidence/F1-COMPLETION-POSTURE-ATTRIBUTION.md). A completed turn without a bounded agent answer also cannot source the literal “last answer” cue; see [answer-presence evidence](evidence/F1-ANSWER-PRESENCE-ATTRIBUTION.md). The hosted human-chat gateway attributes three explicit communication cues and applies scoped lessons on a next turn; see [cue evidence](evidence/F1-HOSTED-FEEDBACK-CUES.md). A separate wrapper-local, owned-thread feedback operation checkpoints applied or pending dispositions without a model turn; the authenticated hosted HTTP client and browser expose an explicit opt-in action and content-free retry marker. A pending receipt can be explicitly dismissed with an exact-text, content-free, durable review record through the owned gateway and hosted browser; see [dismissal evidence](evidence/F1-PENDING-FEEDBACK-DISMISSAL.md). Content-free pending IDs can now be rediscovered after a browser marker is lost, with a disposable Windows-Chrome browser pass; see [discovery evidence](evidence/F1-PENDING-FEEDBACK-DISCOVERY.md). A pending receipt can also be explicitly applied through the owned gateway and hosted client to one selected completed answer with current-interaction retention; a disposable installed-Codex canary verified restart replay and next-turn private model-wire delivery, and a rendered Windows-Chrome browser fixture verified the exact-text review form; see [application evidence](evidence/F1-PENDING-FEEDBACK-APPLICATION.md). Explicit revision of an applied current-interaction lesson now binds exact predecessor ID/digest, selected answered episode, and owned-thread review; the installed canary verifies the latest third-turn context, an explicit supersession directive, and restart replay. Latest-episode selection now follows completion-event order instead of object-key order. Historical superseded developer context remains on the host model wire, so model precedence is not proven; see [revision evidence](evidence/F1-PENDING-FEEDBACK-REVISION.md). Default learning remains disabled. Trusted human-origin binding, broad task/one-time/reusable classification, historical-context precedence, and exclusive current-chat control remain open. |
| F2 | Passed as a local opt-in candidate intake; not activated | The gateway CLI now binds a Codex-only blocked-semantic signal provider/factory to a separate checkpointed, single-writer Evolution candidate inbox when both profile and private log path opt in. A loopback gateway turn writes one verified content-free Improvement Signal; disabled, failed-sink, duplicate/restart, lock and byte-limit paths have fixtures. The sink has no cycle or self-edit API. Wrapper and Evolution package suites passed; see [F2 intake evidence](evidence/F2-GATEWAY-EVOLUTION-SIGNAL-INTAKE.md). A separate Companion panel observes candidate signals without cycle admission; its rebuilt extracted Windows WebView fixture passed [UI evidence](evidence/UI-EVOLUTION-CANDIDATE-SIGNALS.md). This does not prove installed host binding, other signal kinds, operator retention or Evolution cycle admission. |
| G1 probes | Exact task readable; bidirectional disposable host writer lock/release passed with durable ARE session recovery; desktop handover unproven | The active task's App Server process resolved to the same `codex-cli 0.155.0-alpha.16.4` binary used by a separate read-only process. `thread/read` matched this task and host session, `thread/goal/get` matched its active goal, and a transcript-free paginated `thread/turns/list` census reached the final cursor with 62 stored turns at that instant. A separate gateway-owned disposable task completed one local-fixture turn, rejected a second direct App Server writer, then resumed under that direct process after gateway close and completed another turn. Reverse recovery now retains the original authenticated, file-backed gateway session across process restarts: ARE is rejected while the direct writer remains active, then resumes after that writer closes and completes a third turn with no duplicate history. A fresh gateway session is denied as `gateway.thread-unowned`, and `thread/unsubscribe` does not release an active writer. Account binding, a frozen live watermark, desktop-client relinquishment, complete UI ingress/approval coverage, effect enforcement, and live rollback remain unverified; see [G1 probe evidence](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md). |
| G1 alternate ingress | Bounded shared gateway, wrapper, hosted-policy, lifecycle-parameter, owned-thread ingress and server-request guards; cross-path coverage open | The gateway and direct shared wrapper reject identified alternate App Server execution/model-entry methods before backend dispatch, including with a pass-through gateway wrapper. The exact installed-host catalog fails closed for other observed and unknown gateway client methods; see [catalog evidence](evidence/G1-VERSIONED-HOST-METHOD-CATALOG.md). A Codex-specific closed lifecycle parameter contract requires read-only/on-request settings on direct, nested continuation and generated-successor paths; admitted steer/interrupt parameters are now closed to their bounded host shapes, and the hosted client sends the installed host's `on-request` wire spelling; see [parameter evidence](evidence/G1-HOST-PARAMETER-CONTRACT.md). The Codex gateway now rejects unowned scoped thread access and unscoped host thread lists, binds created IDs before release, and withholds new-thread notifications until a matching response; see [owned-thread ingress evidence](evidence/G1-OWNED-THREAD-INGRESS.md). The gateway denies `item/tool/call` before client delivery; the direct shared wrapper now classifies all 11 generated server requests and denies five unsupported plus unknown future requests without relying on the attached client. Focused suites passed 86/86; see [request coverage](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md). Complete server-event shape coverage, universal effect interception, older-proxy conformance, desktop ownership and activation remain unproven; see [method-guard evidence](evidence/G1-ALTERNATE-HOST-METHOD-GUARD.md). |

The [2026-10-01 desktop launch follow-up](evidence/G1-DESKTOP-LAUNCH-OVERRIDE-2026-10-01.md) identifies an installed, version-bound WSL CLI command seam and an opt-in ARE shim. The shim fails early for a missing profile or source root and requires an explicit mode: `direct-candidate` is a development path, while `managed-gateway` starts a distinct acknowledged client with no direct fallback. Its earlier corrected installed-backend `initialize` canary passed in direct mode. A fake-backend `initialize` fixture passed across a real gateway, verified runtime bundle, real ARE wrapper and separate managed client process. The subsequent model-free managed canary passed with the pinned installed WSL Codex binary after repairing the gateway's remapped-upstream-ID initialize version check; a negative regression rejects a response spoofing the desktop ID. Both paths checkpoint private resume/intent/delivery state before ACK. The candidate repository profile and compiled runtime bundle admit `codex:desktop-wsl`; this changes no running desktop configuration. A scoped server-initiated input request and matching reply passed an authenticated-socket fixture with durable response intent; an unsupported server request received no ACK, and full D2 remains open. Fresh isolated desktop launches still did not invoke the shim or establish WSL project/task ingress. Official Windows guidance uses the in-app project picker and does not document the attempted `--open-project` argument, so those launches cannot close G1. The [desktop-gateway construction contract](G1-DESKTOP-GATEWAY-ADAPTER-CONSTRUCTION.md) separates durable ingress, full bidirectional protocol, owned-thread lifecycle, exact existing-task transfer, and rendered UI proof. The full wrapper suite now passes 758 tests (734 passed, 24 skipped, 0 failed). No desktop UI ingress, same-task ownership or activation has been proven. The TUI remains discontinued and cannot substitute for desktop ingress.

The [2026-10-01 C2 managed objective-continuity preflight](evidence/C2-MANAGED-OBJECTIVE-CONTINUITY-PREFLIGHT-2026-10-01.md)
adds an opt-in startup requirement that rejects a disabled or unreported
effective objective-resolution profile before hosted-client readiness. Native
startup and focused objective-recovery tests pass. This is profile binding,
not a completed C2 two-turn/restart proof or G1 desktop-task handover.

The [2026-10-01 managed objective restart proof](evidence/C2-MANAGED-OBJECTIVE-RESTART-2026-10-01.md)
now covers one objective-only C2 sub-slice through the supervised gateway and
hosted client: two local-provider turns on one backend thread, accepted-key
replay without redispatch, and the same active objective after clean restart.
At that point, requirement tracking lacked a trusted first-turn seed in the
managed gateway, and that result did not close C2, G1, or Companion UI coverage.

The subsequent [hosted explicit requirement-seed proof](evidence/C2-HOSTED-REQUIREMENT-SEED-2026-10-01.md)
closes that specific API handoff for opted-in managed hosted turns: an explicit
bounded list is signed with the turn parameters, checked by the gateway,
sealed into the first requirement snapshot, and retained after restart and
continuation. Missing seeds and tracking-disabled profiles fail closed. The
hosted browser now offers explicit, optional requirement entry, with source
tests and endpoint tests passing but no rendered-browser pass on this Linux
host. Its authenticated state now shows the manager-verified requirement
tracking posture before first Send; a standalone client remains unverified.
Same-key replay with a changed requirement list is rejected from a
durable content-free receipt. C2's active steering, broader compaction
recovery, unknown delivery, and G1 ownership conditions remain separate.

The later [managed compaction/restart proof](evidence/C2-MANAGED-OBJECTIVE-COMPACTION-RESTART-2026-10-01.md)
joins the existing hosted compaction endpoint to the two-turn native fixture:
the gateway durably observes an accepted and completed compaction before a
clean restart, then the same objective and explicit requirement list survive
the next user turn. A subsequent combined WSL/Linux run also joined explicit
requirements, active-turn steering, compaction and clean restart on that one
owned thread. Current-source Windows Node then passed the same guarded joined
mode against a staged binary hash-matching the installed host; both lost-RPC
and lost-HTTP steer responses survived abrupt disposable managed-stack loss,
exact-key acknowledgement, post-restart compaction and a second same-objective
turn. Each Windows mode made four local fixture-model calls and zero external
calls. These close only the selected managed-client joins, not genuinely
unknown backend acceptance, power loss, installed-package lifecycle, G1
desktop ownership or O1 activation.

The [F1 hosted-input attestation](evidence/F1-HOSTED-INPUT-ATTESTATION.md)
now distinguishes exact authenticated hosted-client submissions from generic
gateway traffic before learning. The managed launcher supplies a separate
per-run key; backend processes do not inherit gateway credentials. Linux
managed-client and container-rendered UI checks passed, as did native Windows
source suites. A fresh unsigned Windows package was built; its retained stage
passed bundled features, the seven-panel WebView2 journey, and the joined
managed-session UI smoke with model-turn ingress visibly paused. A separate
native Windows hosted-input canary passed pending-feedback dismissal through
the same authenticated gateway path with zero model turns. This is
process-local ingress evidence, not physical-human identity, general feedback
classification, an installed Windows package, or control of this desktop task.
The later [Companion key-state projection](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-HOSTED-INPUT-PROVENANCE-2026-09-28.md)
is read-only configuration evidence alongside the continuing Windows turn
pause, not a promotion of either integration gate.

The later [extracted-installer provenance check](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-EXTRACTED-INSTALLER-PROVENANCE-2026-09-28.md)
verifies the actual unsigned NSIS payload without installing it. Bundled Node
and ARE passed the native feature probe; the extracted executable passed the
seven-panel WebView2 journey and a three-cycle resource probe. An explicit
package-only managed-session smoke launched the gateway, hosted client, and
Companion from adjacent installer resources, twice showing the same gateway
connected with hosted input configured and model turns paused. This closes
the earlier checkout-source dependency in that disposable Windows smoke, not
the Windows hook-input failure, installed-package lifecycle, universal effect
boundary, or G1/O1 current-task handover. TUI remains out of scope.

A 2026-09-28 C2/Threads source follow-up now projects the durable count of
unresolved `turn/start` requests with a matching host-acceptance receipt across
stored gateway sessions. The Companion bridge and Threads screen preserve
this count without prompt text, raw IDs, a fabricated thread row, or any
completion/retry claim; older gateways report it as unavailable. Focused
gateway/observation tests passed 116/116, the wrapper suite 519 passed with
14 platform skips, dashboard source tests 38/38, offline Companion `cargo
check`, and ARE product tests 102/102. A subsequent
[native Windows development check](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-ACCEPTED-UNRESOLVED-TEST-2026-09-28.md)
built a fresh unsigned candidate and passed both the accepted-but-unresolved
and entirely unknown fixtures in staged WebView2, including after moving the
retained stage to D:. The installer was not run. This does not reconcile a
genuinely unknown host outcome or transfer this desktop task to ARE.

The F1 [explicit narrow-scope guard](evidence/F1-EXPLICIT-SCOPE-CONFLICT.md)
now keeps literal one-time and task-only feedback pending with a specific
scope-conflict reason and refuses review into a later-answer lesson. The
normal user turn still dispatches without learning that phrase. The focused
and full wrapper suites pass; the cached Chromium hosted-browser suite then
passed 9/9 with rendered scope-conflict guidance. This does not implement
one-time execution, general scope classification, or historical host-context
removal.

The C2 [fresh owned first-turn proof](evidence/C2-FRESH-FIRST-TURN-RUNTIME.md)
permits one hosted first send when the pinned installed host cannot enumerate
an empty thread. It requires a same-process, durably accepted creation with
no turn intent, an idle host summary, and no client reattachment. Focused and
full wrapper tests plus a disposable installed-host/loopback-model canary pass.
The later pre-first-message history guard applies that same exact gateway proof
to the host's specific “history not materialized” fallback and rejects it after
a locally known turn; focused and full wrapper tests pass. The installed-host
canary confirms the ordinary unsupported-history first-turn path, while the
specific stale-error case remains fixture-only evidence.
An additional pinned-host two-process probe rejected both resume and direct
turn start from a second App Server process before the gateway's first turn;
this is observed behavior, not a stable host exclusivity contract.
The accepted lost-creation-response recovery path remains blocked because it
still lacks an exact empty-history signal.

The later G1 [two-pass stored-history census](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md#2026-09-28-bounded-two-pass-stored-history-census)
supersedes the older 62-turn snapshot in the row above. Its exact-task,
content-free read found 229 stored turns and an unchanged ordered digest
between passes. It still does not freeze history, release the desktop writer,
bind the desktop account, or activate this chat.

The Codex gateway now rejects `turn/started` and `turn/completed` events with
missing or malformed turn IDs or phase-inconsistent statuses before ARE
completion/continuation processing. Focused, full-wrapper, and disposable
installed-host checks pass; this is a bounded lifecycle shape guard, not full
server-event conformance or desktop handover. See
[G1 lifecycle evidence](evidence/G1-CODEX-TURN-LIFECYCLE-GUARD.md).
The later completion-causality check also requires a durable accepted or
host-history-marked ARE turn with the same thread and turn ID before Codex
`turn/completed` can reach the wrapper. The gateway suite passed 84/84, the
full wrapper suite passed 458 with 11 skipped, and a disposable installed-host
two-turn canary passed. The subsequent pinned-host guard now binds all 19
cataloged Codex `turn/*` and `item/*` server notifications to the same durable
accepted or host-history-marked thread/turn before wrapper delivery; early,
missing-ID and mismatched events fail closed. Focused suites passed 98/98, the
full wrapper suite passed 464 with 11 skipped, and the disposable installed-host
two-turn canary passed again. A future host that emits valid events before its
acceptance response needs a separately tested bounded compatibility path.
Exact desktop handover and universal effect coverage remain open.

A later schema-wide G1 guard now covers all 26 pinned server notifications
with required `turnId`, plus the three nullable-turn notifications when they
carry an ID, rather than only `turn/*` and `item/*`. It binds them to an
accepted or host-history-observed turn on the owned thread and uses the
bounded pre-acceptance queue for early events. The focused suites passed
126/126, the full wrapper suite passed 529 with 14 skipped, and the current
disposable installed-host user-input canary passed with zero external model
calls. The older prompt-hook fixture failed at its `thread/start` parameter
policy and is not counted as positive evidence. This is not complete field
validation of 82 server notifications or current-task handover; see
[schema-wide turn-binding evidence](evidence/G1-CODEX-TURN-LIFECYCLE-GUARD.md#2026-09-28-schema-wide-turn-bearing-notification-binding).

The G1 host-request ingress now also binds the installed-host turn-attributed
approval, user-input and MCP elicitation requests to an owned, durably accepted
active turn before ARE/client delivery. Wrong, early, malformed and terminal
turns fail closed; an unattributed standalone MCP form is denied upstream.
The pinned request catalog and verifier cover five required and one optional
`turnId` methods. Focused suites passed 137/137; a corrected file-backed
restart fixture passed 32/32; the full wrapper suite passed 540 with 14
skipped. Disposable installed-host user-input and MCP canaries passed with
zero external model calls. The native approval decline and session-grant
canaries also passed after their fixture adopted exact hook trust and current
read-only/on-request gateway parameters, without a trust bypass; the latter
rejected a session-wide grant. The default actual-wrapper native canary now
passes under the same closed host parameters, including disconnected-turn
recovery and stable replay; its unapproved fixture tool still executes despite
an advisory hook block. Other approval shapes, universal effect
coverage and current-task handover remain unproven. See
[G1 host-request turn-binding evidence](evidence/G1-HOST-REQUEST-TURN-BINDING.md).
The same ingress now rejects malformed safety-critical required fields on
accepted approvals, user-input requests and MCP forms before wrapper/client
delivery, without closing native MCP fields omitted from the generated schema.
Focused tests passed 140/140, the full wrapper suite passed 546 with 14 skips,
and pinned installed-host approval, user-input and MCP canaries passed with
zero external model calls. Full request-schema conformance and the G1 handover
remain open; see the required-field follow-up in that evidence.

The G1 [managed-session startup candidate](evidence/G1-MANAGED-SESSION-STARTUP.md)
now supervises a gateway, hosted browser client and optional read-only
Companion from one explicit private state root. A pinned installed-host canary
completed one newly created ARE-owned thread through that launcher with exact
isolated hook trust, prompt context on the private model wire, blocked tool,
Stop and completion observations, and clean callback teardown. An earlier
hookless fixture was preflight-blocked for an unisolated reason. This is a
development startup path, not transfer or control of the current desktop
task, installed UI readiness, or universal effect enforcement.
The subsequent clean-environment check repaired the gateway's dependence on
an inherited Codex Desktop originator override: the live App Server version
must now match either the Desktop prefix or the authenticated client's exact
declared name. A pinned installed-host managed-turn canary passed with that
override removed. The current-source Linux Companion also rendered against
the same supervised gateway and hosted client in a no-model container; see
[managed UI evidence](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/MANAGED-SESSION-LINUX-UI-2026-09-28.md).
The next joined installed-host fixture completed one newly owned turn and
showed its verified completion frontier and linked Decisions row in the
current-source Companion, with exact isolated hook trust and a loopback
provider. This confirms the browser-client/gateway/Reasoning State/read-only
UI composition for that disposable path, not same-task desktop control.
The native [Windows managed-session candidate](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-MANAGED-SESSION-CANDIDATE-2026-09-28.md)
now adds an unsigned uninstalled installer, staged WebView2 and connected
gateway checks, and a joined managed-launcher/WebView2 startup smoke. The
exact supervised Companion shows its own gateway running, backend ready and
client connected on Adapters. A further native run completed one owned turn
and showed its verified frontier and linked Decisions in that same Companion;
the hosted client explicitly declined the fixture tool approval, and private
hook connection cleanup was repaired. The installed Windows host listed the
trusted hooks and emitted lifecycle notifications, but delivered no complete
callback input to ARE, so Windows hook delivery, installed
package lifecycle, and private-state ACLs remain open.

The C2 [explicit durable-append acknowledgement evidence](evidence/C2-DURABLE-ACK-BOUNDARY.md)
closes a gateway fail-open result-shape gap: absent or indeterminate store
append results no longer count as persisted receipts. The focused cases,
gateway suite, full wrapper package suite, and disposable installed-host
completed/active hard-crash canaries pass. This strengthens recovery
bookkeeping but does not release an unknown host outcome or activate this
desktop task.

The C2 [accepted-but-unknown recovery overlap](evidence/C2-ACCEPTED-UNKNOWN-RECOVERY.md)
now permits the existing marker-and-semantic-confirmation path even when a
`turn-start-accepted` receipt survived but its dispatch outcome did not. The
accepted and marked turn IDs must match; disagreement faults the session. A
bare acceptance or history read without the marker and semantic receipt still
cannot release the unknown write block. Native Windows gateway fixtures now
pass, and two disposable installed-host marker-only lost-response canaries
passed gateway/backend restart, semantic recovery and no redispatch. The
accepted-plus-marker overlap itself remains local-fixture evidence, not a
current desktop-task handover.

The C2 [hosted thread-creation retry checkpoint](evidence/C2-HOSTED-THREAD-CREATION-RETRY.md)
now holds one content-free browser request key across uncertain HTTP delivery and
reload, while the HTTP host requires that key before dispatch. A gateway-unknown
creation now receives a typed 409 and retains the marker; a different key is
blocked before backend dispatch. Local marker, host and gateway fixtures pass,
and the six hosted-browser fixtures pass in WSL with temporary extracted
Chromium libraries. This does not reconcile a gateway-unknown creation or
advance G1/O1 desktop-task handover.

The C2 [accepted thread-creation recovery](evidence/C2-THREAD-CREATION-ACCEPTANCE-RECOVERY.md)
adds a narrower reconciliation path: an exact host acceptance and owned thread
ID are durably bound before response delivery. After an uncertain gateway
outcome, an empty `thread/read` from the same owned thread must be checkpointed;
the hosted client records that ID privately before confirming a recovered
dispatch. Same-key retry can then return the recovered thread without a second
`thread/start`. The no-host-response/no-correlation case still quarantines, and
this local proof is not installed-host or current desktop-task handover proof.
An isolated probe against installed Codex `0.155.0-alpha.16.4` found that
`thread/read` with `includeTurns:true` and `thread/turns/list` both reject
history enumeration. `includeTurns:false` returns `turns: []` even after turns,
so it cannot replace the required empty-history proof. C2 accepted-creation
recovery is therefore blocked for this installed host until another exact
history signal or a proven exclusive-writer/no-turn causal contract exists;
the gateway continues to fail closed.
The [correctly parameterized paginated-read retest](evidence/C2-THREAD-CREATION-ACCEPTANCE-RECOVERY.md#exact-paginated-read-retest--2026-09-28)
confirms that the newly empty owned thread still returns `-32601`, while the
same method returns a page after a completed disposable turn. The empty-case
error remains diagnostic, not proof of zero turns.
The gateway now quarantines other client and generated mutations while a
Codex thread creation is unsettled, including wrapper-local control during an
unknown outcome. This closes its own dispatch race but does not establish
exclusive access to the stored host thread, so it does not lift the C2 block.

The C2 [owned-thread runtime fallback](evidence/C2-OWNED-RUNTIME-FALLBACK.md)
adds a separate, fail-closed next-turn proof for the narrower case where a
completed owned turn has both a durable native completion and a matching ARE
Reasoning State frontier but detailed host-history APIs are unsupported. The
hosted client still requires a current `thread/read(includeTurns:false)` idle
status and never represents this as transcript or empty-thread history. Local
gateway/hosted/wrapper tests pass. The installed-Codex feedback canary used
host history for its first turn and, after a simulated double-unsupported
history response on restart, used the owned-runtime proof for its second turn
while the real gateway, wrapper and host executed it. This tests the fallback
path, not a naturally observed host error. C2 accepted
thread-creation recovery and exact desktop-task handover remain blocked.

The F2 [signal sink acknowledgement evidence](evidence/F2-SIGNAL-SINK-ACK-BOUNDARY.md)
now requires an explicit `ok:true` result before a candidate is labelled
emitted. Focused gateway-inbox and wrapper tests pass. All 29
Evolution-runtime test files except the separately source-drifted H-EN
benchmark file pass. This is honest candidate intake, not
cycle admission or current-chat control.

The exact-task G1 read-only preflight now reports a content-free latest stored
turn frontier across two bounded `thread/turns/list` reads. Its current-host
run found matching `interrupted` stored-turn status, but deliberately reports
neither live quiescence nor desktop writer release. The probe and negative
fixtures are in [G1 host-read evidence](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md#2026-09-28-content-free-stored-history-frontier).

The Codex gateway also rejects initialization-time notification opt-outs, so
the selected client cannot suppress lifecycle observations such as
`turn/completed` while retaining a ready-looking gateway connection. A
disposable installed-host negative probe and subsequent ordinary turn passed;
see [initialization parameter evidence](evidence/G1-HOST-PARAMETER-CONTRACT.md#initialization-notification-coverage-2026-09-27).
This does not transfer the current desktop task or prove every host effect.

The legacy stdio proxy now shares the validated gateway transport: a mismatched
consumer/lane receipt is rejected before backend bytes reach that client. It
deliberately remains unacknowledged, without durable resume-secret recovery or
activation eligibility. This does not close older-proxy end-to-end conformance,
desktop ownership, or the universal effect boundary. The focused legacy and
programmatic transport checks passed 3/3; the full wrapper suite passed 437,
skipped 9, and failed 0. The integration-surface inventory suite passed 6/6.

The [Define consumer isolation check](evidence/G1-DEFINE-CONSUMER-ISOLATION.md)
separates Define CLI from the hosted Windows client's `codex:human-chat`
gateway session. A local real-wrapper fixture verified concurrent attachment
and cross-consumer thread-read denial; full Define and wrapper suites and a
disposable installed-Codex canary passed. The fixed Define identity still
admits only one attached Define process and does not bind the current desktop
task or complete G1 handover.

Historical evidence only: the TUI is a discontinued interface and is no
longer an active product UI target. Its coding-proposal client used its own
acknowledged gateway consumer and checkpointed its resume token before host
mutation in a private,
single-writer POSIX state file. A two-process installed-host fixed-provider
canary resumed the same gateway session without fixture mutation;
see [TUI gateway evidence](evidence/G1-TUI-CODING-PROPOSAL-GATEWAY.md). This
removed one direct-wrapper default and proved bounded completed-turn client
restart for that historical path. At discontinuation, the TUI checkpointed a
content-free intent before each model turn; an unresolved intent blocked new
proposals and appeared as an uncertain/blocked UI state after restart. This
prevented silent redispatch but did not recover a lost proposal or release the
pending intent. A later read-only observer
attributed an intent to exactly one owned turn when full host history was
available; the installed host exposes that history only for an explicitly
durable proposal thread, not the ephemeral default. A disposable worker-kill
canary recovered the pending intent and observed the matching interrupted
turn without redispatch. At discontinuation, that historical path still had
unresolved terminal and candidate-recovery gaps; no further TUI implementation
or validation is planned. It did not close current desktop-task handover or
the universal effect boundary.

The [installed-host server-event shape audit](evidence/G1-SERVER-EVENT-SHAPE-AUDIT.md)
identifies the next G1 construction frontier: missing/optional thread IDs,
unscoped output and legacy approval messages, and uncorrelated host responses
must be fail-closed or bound before claiming complete ingress isolation. This
audit is not an activation or a substitute for those runtime tests.
The later [server method guard evidence](evidence/G1-SERVER-METHOD-GUARD.md)
records the Codex gateway implementation and its focused, restart, full-suite,
catalog-verification, and disposable installed-host checks. It does not prove
same-task handover or a universal effect boundary.
The [startup schema binding evidence](evidence/G1-STARTUP-SCHEMA-BINDING.md)
adds configured-command and prefix verification of all four pinned host
schemas before the gateway listens; it does not establish running-daemon
schema identity or close the executable-replacement race.

For C2, the Codex gateway now records a completed `contextCompaction` item
only when its thread and turn match a durable `turn-start-accepted` receipt or
a recovered `turn-marker-observed` receipt. Missing and different turn IDs stop
the gateway before a completion receipt or client delivery. The generic JSONL
adapter keeps its separate capability-neutral behavior. The gateway suite
passed 80/80 on that original boundary. The current gateway instead withholds
at most its configured message bound of early Codex turn/item notifications
for one exact pending `turn/start` on an owned thread. It releases them in
order only after a durable acceptance receipt matches their turn ID; a
mismatch stops the session. A focused fixture now covers early start,
compaction, and completion without pre-acceptance wrapper delivery. This does
not retroactively validate older receipts, prove this desktop task is under
ARE control, or close G1 handover; see the
[lifecycle evidence](evidence/G1-CODEX-TURN-LIFECYCLE-GUARD.md#bounded-pre-acceptance-replay-follow-up).

The C2 shared RPC client now explicitly declines MCP elicitation and rejects
unsupported host server requests instead of leaving them unanswered. Its
approval handler also fails closed on exceptions. Focused local RPC, gateway,
and gateway-session-client suites passed 68/68; see
[host server-request evidence](evidence/C2-HOST-SERVER-REQUEST-BOUNDARY.md).
This is client behavior under a fake transport, not installed desktop ingress,
complete request coverage, or a non-bypassable effect boundary.
The same RPC reader no longer awaits a custom approval handler inline, so a
handler can request host state on that connection without deadlocking its own
reply. Server-request concurrency and waiting time are bounded, including
unresolved timed-out handlers; late answers are discarded. Focused RPC tests
passed 17/17, the surrounding RPC/gateway/session-client suites passed 73/73,
and the full serial wrapper suite exited successfully; see the same evidence note.
Native host/UI ingress remains open.
An [opt-in native hook-denial candidate](evidence/G1-NATIVE-HOOK-DENIAL.md)
now maps an exact ARE `block` on a bound `PreToolUse` event to Codex's
supported deny response. A disposable installed-host canary blocked one local
shell call while the default advisory canary still allowed it. A later
real-wrapper gateway canary passed with exact-hash trust for three disposable
hooks and denied the same shell call without relaxing lifecycle policy or
using a broad trust bypass. This does not cover hosted/skipped tool paths,
hook failure, or handover of this desktop task; no active hooks were changed.
The [same evidence](evidence/G1-NATIVE-HOOK-DENIAL.md) now includes an
opt-in reusable callback runner and an installed-host injected-failure canary.
When ARE returned an unavailable effect assessment for an invoked supported
`PreToolUse`, the runner exited with the documented blocking status and the
host did not execute the shell call. This closes that narrow hook-failure
case, not skipped-hook paths or selected-host hook registration.
The ARE-owned hosted client now has an opt-in callback bridge on its existing
gateway RPC connection, avoiding a second turn writer. A private exclusive
endpoint file is removed only when still owned by that process; gateway loss
withdraws assessment and the strict supported-tool runner blocks the invoked
callback. A process-level fake-gateway CLI fixture and focused hook-control
tests pass. A later pinned installed-host canary passed through that same
controller module, the real wrapper and gateway, and exact-hash trusted
disposable hooks; one local shell call was denied without a second RPC writer.
This is production-client construction, not installed Codex hook registration
or exact desktop-task handover. Native-host delivery launched by the full
hosted-client CLI, Windows endpoint ACL review, stale-file recovery, and
skipped tool-path coverage remain explicit next frontiers.
The later [strict-gate follow-up](evidence/G1-NATIVE-HOOK-DENIAL.md#strict-gate-and-advertised-goal-tool-follow-up--2026-09-28)
withholds unresolved ARE effect gates as well as blocks on the opted-in
supported-hook path. A disposable installed-host `create_goal` proposal was
hook-observed and blocked under a no-write route; an implementation-route
attempt stopped earlier at hosted preflight, so native gate-callback delivery
is not claimed. The current read-only host tool set did not advertise
`apply_patch`, and skipped-hook and desktop-task effect coverage remain open.
The [hosted tool-transport coverage note](evidence/G1-NATIVE-HOOK-DENIAL.md#hosted-tool-transport-coverage-limit--2026-09-28)
records a further exact boundary: the native read-only catalog advertised
`write_stdin`, while Codex's documented hook contract does not invoke
`PreToolUse` again for input to an admitted unified-exec session. No
valid-session probe or alternate enforcement boundary has proven that path.
Keep complete host-effect control unclaimed and the Companion's adapter
`effect_requests` posture unknown/unsupported until verified. Continue G1
through the ARE-owned hosted client and Companion; the TUI remains historical.
A later native Windows managed-session probe found a completed turn with no
callback input and no approval server request, so the earlier approval-decline
path is not universal. Normal Windows hosted-client turn ingress is now paused
with `windows-client.hook-boundary-unverified`; an isolated test-only flag
retains diagnostics. The shared gateway's effect evaluation now uses the
accepted turn's selected route and rejects missing route bindings. These
changes reduce one fallback and prevent new normal Windows turns, but do not
close the host hook/tool boundary or activate this desktop task. See the
[Windows candidate record](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-MANAGED-SESSION-CANDIDATE-2026-09-28.md).
The current-source staged Windows Companion now renders that pause separately
from the connected backend path in the same disposable managed session whose
hosted client reports turn execution disabled. This is UI truthfulness evidence,
not a new host-effect boundary or installed-app proof.
The managed gateway now binds the same pause at its dispatch boundary: direct
model-entry requests, wrapper-produced turns, and generated successors are
withheld before backend dispatch. Focused gateway/manager tests passed 136/136
on Linux and the three new gateway cases passed under native Windows Node;
the staged Windows managed-session UI canary passed with a matching gateway
block declaration and zero model calls. This narrows managed-session bypass
surface, while host hook delivery, general effect interception, and current
desktop-task handover remain open.
The later [native Windows model-wire guard canaries](evidence/G1-WINDOWS-MODEL-WIRE-GUARD-2026-09-29.md)
passed an empty-catalog text turn, unadvertised tool denial, clean restart,
and fail-closed guard-loss/restart against the exact installed Codex binary.
They used fixed loopback responses and the existing test-only Windows bypass;
normal Windows managed-turn ingress remains paused. A production guarded
text-only mode still needs its own cross-component contract and tests.
A fresh unsigned Windows installer now includes that gateway guard in its
staged ARE closure; bundled `doctor` and the new staged WebView2 canary passed.
The installer remains uninstalled and is not an O1 activation or release.
The [gateway ingress observation](evidence/G1-GATEWAY-INGRESS-OBSERVATION.md)
now projects that pause through the authenticated adapter read, and the
Companion distinguishes it from a launcher-only declaration. Source tests and
Rust `cargo check` pass. A newer unsigned Windows package and staged native
WebView2 managed-session check now pass; see the linked evidence for the exact
artifact and claim ceiling. TUI remains out of scope.
The [native callback-outage mode](evidence/G1-NATIVE-HOOK-DENIAL.md#native-callback-outage-denial--2026-09-28)
now proves the pinned installed host blocks one supported `exec_command` when
the strict callback loses its private connection after prompt binding. Normal
shell and `create_goal` denial modes still pass. This closes that specific
missing-connection failure path, not skipped hooks or complete effects.
The later [Windows ancestry/input recheck](evidence/G1-NATIVE-HOOK-DENIAL.md#native-windows-callback-ancestry-and-input-recheck--2026-09-28)
again reproduced hook lifecycle `completed` without callback stdin. One
callback had a `cmd.exe` parent, but the complete host shell chain remains
unproven. Direct Node callbacks, removing synchronous ancestry instrumentation,
and launching the canary as a detached native Windows process all reproduced
zero input chunks. The pinned host's generated thread/turn protocol exposed no
built-in-tool disable or universal pre-execution callback. These results narrow
the host-integration path but do not establish a replacement boundary; the
managed Windows pause remains necessary.
The later [restricted-host unadvertised-tool probe](evidence/G1-UNADVERTISED-TOOL-BOUNDARY-2026-09-29.md)
uses fixed loopback responses on the pinned WSL and native Windows hosts. Both
rejected an injected `exec_command` as `unsupported call` when their restricted
model catalog omitted it. This closes only that exact function-call bypass
probe: `request_user_input` and `view_image` were still advertised, other tool
paths remain unproven, and normal Windows managed ingress stays paused.
The [advertised `view_image` follow-up](evidence/G1-UNADVERTISED-TOOL-BOUNDARY-2026-09-29.md#advertised-view_image-follow-up)
found that the pinned WSL and Windows binaries retained `view_image` despite
`[tools] view_image = false`; a Windows `-c tools.view_image=false` override
also failed. On native Windows, one call read only a disposable
test icon and returned an `input_image` to the fixed loopback model fixture,
including with that setting disabled. This is an exact unbrokered local-read
counterexample; it strengthens the reason to keep Windows managed ingress
paused while an ARE-owned boundary is designed and tested.
The [MCP image-read follow-up](evidence/G1-UNADVERTISED-TOOL-BOUNDARY-2026-09-29.md#mcp-pretooluse-image-read-boundary)
now proves on the pinned WSL and native Windows binaries that an available
`PreToolUse` MCP hook denies one `view_image` read before an image reaches the
fixed model fixture. With the hook tool missing, both hosts fail open and
return the image to that fixture. This preserves the managed Windows pause:
hook delivery is useful but not a complete effect boundary.
The [loopback model-wire guard candidate](evidence/G1-MODEL-WIRE-GUARD-CANDIDATE.md)
now buffers a complete Responses stream and denies an injected
`view_image` call before it reaches either pinned WSL or native Windows host;
benign fixed responses still complete through the same guard. This is a
disposable local construction proof, not real-provider compatibility. The
opt-in managed launcher now starts the guard, verifies the effective
per-process provider URL against its dedicated restricted host profile, and
passes that exact override to the gateway backend. It now also binds an
environment-backed, per-session guard client token: both pinned hosts sent the
header, the guard denied an unauthenticated caller before forwarding, and the
token was not forwarded upstream. A separate exact OpenAI HTTPS bearer path
passed a mock-fetch test without a live key or provider call. A one-turn managed canary
passed on both pinned WSL and native Windows: each upstream fixture saw an
empty tool catalog, with zero external calls and no current-task touch.
The guarded hosted-effect candidate also passed both fixture-approved and
fixture-declined turns on each host. The upstream catalog contained only
`are_effect_request`; the declined command did not run, while the accepted
command's result returned through the broker to the model. Focused tests
passed 13/13; the full wrapper package suite passed 638 with 16 platform
skips and no failures. Default mode still strips every tool, and opt-in hosted mode
admits only that exact ARE-owned name. At that stage, neither mode justified
lifting the default managed Windows pause. Next, prove authenticated upstream
behavior and the required hosted interaction set, then exercise multi-turn recovery, compaction,
guard failure and restart. The TUI remains discontinued, not an alternate
integration or UI route.
The later [opt-in Windows guarded text-only candidate](../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-GUARDED-TEXT-CANDIDATE-2026-09-29.md)
narrows this frontier without changing the default pause. It requires the
verified restricted profile and model-wire guard, excludes hosted effects,
and passed disposable native turn, restart, parent-loss, and WebView2 checks
without the test-only Windows pause bypass. It does not prove authenticated
provider compatibility, complete host effects, exact desktop-task handover,
or installed release readiness; G1 and O1 remain open.
The [MCP tool hook transport candidate](evidence/G1-MCP-TOOL-HOOK-TRANSPORT.md)
passed isolated pinned Linux and native Windows host canaries: structured
`PreToolUse` event arguments reached the fixture MCP tool and its deny blocked
the exact shell call. The unavailable-tool comparison also passed: the same
harmless command executed when the hook tool was missing. This may bypass the
command-hook stdin defect for invoked callbacks, but the documented
missing-server/tool/error path is fail-open. It cannot by itself lift the
managed Windows pause or establish complete effect control. The TUI is
discontinued and is not a fallback for this path.
The separate opt-in MCP relay now returns the hosted controller's tool
assessment in the tested text-content shape. Source tests, a bundled-closure
smoke check, and disposable pinned Linux/Windows turns with a fake owner
behind the actual private callback bridge pass for bound deny and controller
unavailability. A later [joined managed-session canary](evidence/G1-MCP-TOOL-HOOK-TRANSPORT.md#joined-installed-host-managed-session--2026-09-28)
passes on both installed Linux and native Windows CLIs through the real ARE
gateway, hosted client, and strict controller: prompt context reached the model
wire; one supported tool was blocked by a bound ARE effect decision; Stop and
native completion were observed. Missing-server fail-closed coverage and
current-task handover remain open; no active hook registration or normal
managed Windows ingress change was made.
The exact running desktop binary's generated server-request protocol now has
an [11-method local disposition matrix](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md).
Schema-required decline fields were aligned, and the Windows broker removes
an approval prompt when its RPC request times out. The hosted client now has
a bounded `item/tool/requestUserInput` prompt/answer path, including stale
prompt cleanup and answer privacy. A later local thread-scoped
`currentTime/read` response leaves five methods without a functional ARE
handler; generated-schema coverage and fixture tests do not
establish native delivery or this task's activation.
The current focused RPC/Windows-host fixtures passed 28/28, the full serial
wrapper suite exited successfully, and the disposable Windows-client startup
canary passed after its stale readiness-schema expectation was repaired. The
canary started zero model turns and did not exercise this desktop task.
The [native user-input canary](evidence/G1-NATIVE-USER-INPUT-CANARY.md) then
passed an isolated installed-binary turn through actual ARE gateway ownership,
the hosted Windows client's authenticated prompt and answer API, and terminal
App Server resolution. A second run passed the rendered Chromium form and
keyboard submission after fixing active-thread restoration and question labels.
This proves one request path, not the Windows WebView, all host requests, or
handover of the current desktop task.
A later bounded [MCP form construction](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md)
adds a typed, authenticated standard-form prompt and answer path to the hosted
client. Unsupported elicitation modes and schemas still decline; the shared
client still declines by default. Focused RPC/host tests and native Windows
Chromium rendering tests pass. A subsequent
[disposable installed-host MCP canary](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md)
passed one standard-form request and typed answer through the actual gateway,
hosted HTTP API and fixed loopback provider. This does not establish every
elicitation mode, Windows WebView behavior, current-task delivery or same-task
handover.
The [hosted-client restart evidence](evidence/G1-HOSTED-CLIENT-RESTART.md)
adds an opt-in private gateway resume-secret/client-created-thread record and
fixes the authenticated delivery-sequence baseline after reconnect. Focused
tests and an installed-binary canary passed client-only restart and a stronger
file-backed gateway-process restart after a completed disposable turn. This
does not establish interrupted-turn recovery, Windows-native secret custody,
desktop UI ingress redirection, or handover of this task.
The later [native observation restart evidence](evidence/G1-NATIVE-GATEWAY-OBSERVATION-RESTART.md)
uses the declared file-per-consumer Reasoning State in that disposable canary.
Its adapter, thread and decision reads join one gateway epoch before restart;
after gateway restart the completed Reasoning State row survives, the epoch
rotates, and the process-local decision trace is empty. This proves a bounded
gateway-to-observer path, not durable decision history or desktop-task control.
The [native Companion live observation evidence](evidence/G1-NATIVE-COMPANION-LIVE-OBSERVATION.md)
now joins a disposable installed-Codex-backed Windows gateway to the current
staged WebView2 Companion: one completed thread/frontier and two decisions
rendered, including the thread-to-decision link. A subsequent native packaged
run also showed an installed-Codex-backed in-flight turn as active without a
false completion frontier, and the Adapters page showed its retained
accepted-turn-start receipt separately from declared capabilities. These are
gateway-owned disposable-session observations, not exact desktop-task control
or general host-capability proof. The later
[native Windows restart evidence](evidence/G1-NATIVE-WINDOWS-RECOVERY-COMPANION.md)
adds a DPAPI-sealed current-user client record and a two-phase WebView2 check:
the owned completed thread/frontier remained visible after gateway/client
restart, while process-local decisions correctly reset. This is not an
interrupted-turn or exact-task handover proof.
The later [native interrupted-turn evidence](evidence/G1-NATIVE-INTERRUPTED-TURN-RECOVERY.md)
uses an installed-Codex-backed disposable Windows thread paused at a host
user-input request, terminates that backend, and restarts the gateway and
hosted client. Host history reports the accepted turn interrupted; the same
key replays its receipt without another provider call. A recovered ARE
semantic binding is now shown as `recovery-unverified`, not `turn-active`,
through the gateway and staged WebView2 Companion. This keeps an earlier
verified frontier historical and does not settle the interrupted ARE turn,
resolve genuinely unknown delivery, or hand over the current desktop task.
A later bounded C2/G1 follow-up in the same evidence file checkpoints one
exact, accepted `interrupted`/`failed` host turn as terminal recovery without
manufacturing a `turn/completed` event, completion frontier, automatic
successor or retry. The disposable installed-Codex canary first rejected a
new turn before history verification, then accepted a distinct user turn
after exact host-terminal reconciliation. A fresh unsigned Companion build
passed the staged resource check and two-phase WebView2 `Recovered host
terminal` journey. Completed-host-turn notification loss, genuinely unknown
gateway dispatch, installed-app lifecycle and current-task handover remain
open; this is not an activation or release claim. The later
[completed-host recovery source evidence](evidence/G1-COMPLETED-HOST-RECOVERY.md)
extends the checkpoint to an exact host-`completed` turn with the explicit
posture "ARE completion unassessed". It releases the recovered guard for a
distinct user request without inventing semantic completion, Evolution,
continuation, or a successor. An installed-Codex-backed native Windows
one-shot notification-loss canary now passes after fixing the observation
client's completed-status validator. A second current-source unsigned
development package passed its staged feature check and two-phase native
WebView2 completed-host-unassessed journey. Neither installer was installed.
The later [host client-ID correlation evidence](evidence/G1-HOST-CLIENT-ID-CORRELATION.md)
found a version-bound `clientUserMessageId` → historical `userMessage.clientId`
echo on a disposable installed-Codex turn, including after a clean backend and
gateway restart. The Codex gateway now owns a random marker for ordinary stable
turn starts, persists it before forwarding, and retains it after compaction;
the native canary verified this path against the installed host. Exact unknown
dispatch correlation now has a content-free `turn-marker-observed` receipt for
one exact match in returned owned-thread history, with missing/duplicate/conflict
cases tested. The wrapper now binds a uniquely matching persisted prepared
semantic state to that turn, checkpoints a terminal unassessed recovery, or
recognizes an exact completion already checkpointed before restart. The
installed-host lost-response canary passed the already-completed branch after
the first rerun exposed and fixed its missing-state handling. A second native
rerun exposed a Threads projection rejection of the new marker receipt; the
read-only gateway projection and Companion bridge/UI now count and label it
separately from accepted-response host-history verification. The pinned
native canary, 395/400 wrapper tests with five skips, 35 focused UI/observation
tests, and offline Companion Rust check passed. This does not
establish exhaustive history, recover the lost gateway response, settle the
gateway's unknown request, or reconcile the hosted client's pending intent. A
later gateway/store/client slice now persists contradictory-history faults and
shows a read-only hosted-client stop page for a validated startup refusal or
live transport failure; see [fault evidence](evidence/G1-HOST-CLIENT-ID-CORRELATION.md#durable-contradictory-history-stop).
A local gateway-to-executable fixture now proves that a gateway-written fault
survives restart and opens the read-only stop page without another backend
writer. Native installed-host contradiction delivery, packaged WebView proof,
and exact desktop-task activation remain unverified.
A further write-ahead history-audit guard now prevents restart from reopening
an owned session after a simulated fault-write failure, including when two
reads were concurrently in flight. The hosted executable shows an authenticated
read-only quarantine page. This is local fake-host and Windows Edge browser
evidence; physical disk/power-loss behavior, packaged WebView delivery, and an
owner-approved quarantine-release procedure remain separate work.
An installed-Codex native fault canary now withholds one `turn/start` response
after host acceptance, lets the disposable turn complete, restarts both
processes, and records one marker observation from host history. It rejects
same-key retry and a new turn without redispatch. An earlier acceptance-write
failure killed the backend before a marked turn appeared in history; this
negative result remains explicitly outside positive correlation claims.
This marker is not host idempotency; the fail-closed unknown-mutation guard remains.
The [restored-history UI evidence](evidence/G1-RESTORED-HISTORY-UI.md) adds a
bounded read-only user/assistant history projection for client-owned threads.
An installed-binary gateway/client restart and Chromium snapshot showed the
recovered conversation instead of a blank panel. This does not reprocess old
turns as ARE episodes or establish desktop-task handover.
The [active-turn reconciliation evidence](evidence/G1-ACTIVE-TURN-RECONCILIATION.md)
adds a fail-closed runtime-status guard to the owned-thread send path. An
installed-binary canary observed an active turn, rejected a duplicate start,
then saw idle status after completion and gateway/client restart. The browser
no longer labels an unverified restored turn Ready and disables Send during
disconnection. Its first rendered-browser attempt was blocked by missing WSL
shared libraries; unknown turn delivery and live
desktop-task handover remain open.
The later [hosted completion-state evidence](evidence/G1-HOSTED-COMPLETION-STATE.md)
records a Windows Chrome run of all seven hosted browser regressions and a
separate Companion navigation browser run, both passing against disposable
fixtures. This closes the skipped-browser functional check for that change,
not native packaged-WebView2 review or current-chat handover.
The [browser-send replay evidence](evidence/G1-BROWSER-SEND-REPLAY.md) adds a
content-free browser checkpoint of a pending turn and exact-key replay after a
lost acknowledgement. An installed-binary canary replayed a completed hosted
turn after gateway/client restart without a second model request. A rendered
Chromium run then restored a simulated pending send, rejected changed text,
and cleared it by replaying the exact message/key; the required browser
libraries were staged privately for that run and removed afterward. At that
stage, a genuinely unknown gateway/backend outcome and cross-origin browser
storage after a port change remained unresolved.
The [host pending-intent evidence](evidence/G1-HOST-PENDING-INTENT.md) now
checkpoints a content-free send intent in the private hosted-client state and
adopts it on a new browser origin after a client-port restart. Focused tests,
the full wrapper suite, and an installed-binary gateway-restart canary passed.
The earlier canary simulated the post-dispatch crash window. Arbitrary crash
timing and genuinely unknown backend outcomes remain unproven.
The [accepted-turn receipt evidence](evidence/G1-HOST-ACCEPTED-TURN-RECEIPT.md)
now closes the result-known/server-cleared but browser-acknowledgement-lost
window for a bounded set of hosted turns: private atomic receipts survive restart,
match or clear a browser marker, replay the same key without dispatch, and
require explicit confirmation for a new identical message. Focused tests,
the full wrapper suite, an installed-binary gateway-restart canary, and a
rendered browser confirmation/marker-reload check passed. The 2026-09-28
follow-up retains 256 receipts and moves the pending marker to per-tab storage;
Linux focused/full and native-Windows focused suites passed. This does not
cover a truly unknown backend outcome or establish cross-device identity.
None of these hosted-client slices activates the current desktop task.

The [hosted-client ownership and policy evidence](evidence/G1-HOSTED-CLIENT-OWNERSHIP-POLICY.md)
closes an arbitrary-thread interrupt path and removes browser authority to
choose approval or sandbox settings. The server-owned settings are reapplied
at resume and turn start. Focused tests and a disposable installed-host
read-only canary pass. The hosted client was later pinned to read-only; generic
host-effect interception remains unproven. This improves G1 construction but is not
desktop-client handover or O1 activation.

The [approval-scope evidence](evidence/G1-APPROVAL-SCOPE-BOUNDARY.md) closes a
separate persistent-grant path: the current hosted broker and shared wrapper
reject session-wide and policy-amending approvals, and a disposable installed
host canary observed a decline with no tool-success marker. The older
digest-bound proxy still has different acceptance semantics and remains a
compatibility path. Its effect semantics and G1 handover remain open.

A separate [read-only host probe](evidence/G1-READ-ONLY-HOST-PROBE.md) observed
one unapproved repository write blocked by the installed host under a
disposable read-only thread. A second fixed turn made one approved write to
its isolated marker after an exact one-use request. That was before the later
hosted-client read-only pin; these two commands do not prove universal effect
interception. A subsequent installed-host [negative parameter probe](evidence/G1-HOST-PARAMETER-CONTRACT.md)
rejected writable `thread/start` and `turn/start` shapes before a safe turn.

The gateway's read-only adapter observation now explicitly carries
`host_task_control.status: unverified`. The Companion bridge and renderer
accept only that bounded posture, including when the backend is connected and
ready; they cannot promote aggregate gateway readiness into control of this
desktop task. The local observation suite passed 5/5 and offline Companion
`cargo check` passed. This is a negative-claim guard, not a host handover or
proof that a future positive activation record exists.

The known Codex and DSH adapters now declare gateway-created thread
ownership. An isolated DSH regression showed that a fresh gateway store could
previously resume another consumer's durable DSH thread using only its backend
ID; the gateway now rejects both resume and turn start before dispatch while
same-store owner recovery still passes. The real DSH-selected gateway CLI and
ARE wrapper also completed one local fixture turn carrying ARE-added context.
The DSH suite passed 16/16 and the serial wrapper suite passed. This is
bounded [adapter ownership evidence](evidence/G1-ADAPTER-THREAD-OWNERSHIP.md),
not a generic adapter guarantee or current desktop-task handover.

The selected DSH adapter now owns a closed client-method posture instead of
inheriting Codex's pinned host catalog. Its previously blocked `thread/close`
completed through the real CLI and wrapper, after which DSH refused resume;
undeclared `thread/read` remained blocked and unsupported compaction failed
before dispatch. The bounded [DSH method evidence](evidence/G1-DSH-METHOD-CONTRACT.md)
covers client ingress, not generic adapter conformance.

The DSH shim now supplies a closed server-notification posture, separate from
Codex's pinned server catalog. The gateway checks each event's owned thread
and correlates responses with pending requests before delivery. Negative
fixtures cover unowned, missing-thread and unknown events, unsolicited
responses, and a response returning a different thread ID; an owned event and
the real DSH CLI lifecycle still pass. See the bounded
[DSH server-event evidence](evidence/G1-DSH-SERVER-EVENT-CONTRACT.md). This
does not prove arbitrary process conformance or current desktop-task control.

The C2 steering fixture proves ARE's admission and successor-plan checkpoint,
not injection of the assessed context into the already-running host model turn.
The hosted Codex client's [callback crash-restart fixture](evidence/C2-HOSTED-HOOK-CALLBACK-RESTART.md)
now reclaims an exact versioned private connection file only after its local
owner process is confirmed gone. Live, legacy, foreign-host, and malformed
files remain untouched. Linux and native Windows hosted-client hard-kill/restart
fixtures, native Windows controller fixtures, the ARE product suite, and the
normal installed-Codex hosted-hook canary pass. The Windows CLI fixture uses
a disposable fake gateway: Windows signal termination still leaves a private
file for guarded next-start recovery. This closes one callback-file
availability gap; it does not reconcile gateway/backend writes, prove an
installed-Codex Windows restart, or transfer the desktop task.
An admission lacking a checkpointed accepted or rejected outcome restores as
degraded after wrapper restart; an exact mismatched host acknowledgement also
restores degraded, while a durably rejected steer permits a later new turn.
This blocks unsafe redispatch but does not reconcile a possibly accepted host
steer against backend history.
At the gateway, an unknown crash-time backend mutation now blocks any new
thread/turn mutation under a different stable request key in that consumer
session. The original key remains blocked by its exact unknown-outcome error,
while read-only `thread/read` remains available for diagnosis. This closes a
request-key bypass, not the missing backend reconciliation protocol.
A [separate process-kill fixture](evidence/G1-FORWARDED-TURN-SIGKILL.md)
now verifies the same fail-closed behavior after `SIGKILL` of a live gateway
that had forwarded a durable, unresolved turn. Linux and native Windows
session-store suites pass 27/27. Its backend is controlled, so installed-Codex
host-history reconciliation after a hard crash was still open at that boundary.
The later [installed-host hard-crash canary](evidence/G1-NATIVE-HARD-CRASH-RECOVERY.md)
now kills the gateway after the installed Codex backend completes a
lost-response turn and emits automatic compaction. A fresh process resumes
the same private session, blocks same/new-key retries, reads exactly one host
marker, confirms semantic recovery, and projects one recovered dispatch
without provider redispatch. Three WSL/Linux runs passed. Active-turn hard-crash
recovery, other checkpoint boundaries, power loss, native Windows, and current
desktop-task handover remain unverified.
The [active-turn installed-host hard-crash canary](evidence/G1-NATIVE-ACTIVE-TURN-HARD-CRASH.md)
then killed the gateway while an accepted Codex turn waited for user input,
terminated only its verified orphan backend, and reopened the same private
session in a fresh process. Exact `interrupted` host history moved ARE from
`recovery-unverified` to `recovery-terminal` without a false completion
frontier; an owned resume and one distinct new user turn then completed with
one new fixed-provider request. Three full WSL/Linux runs passed. A surviving
backend turn, missing history, power loss, native Windows termination and
current desktop-task handover are still unverified.
A later [orphan-lifetime probe](evidence/G1-NATIVE-SURVIVING-BACKEND.md)
left the installed backend running after gateway `SIGKILL` and checked its
exact PID, executable and private working directory around recovery. In two
WSL/Linux runs it had exited before the fresh gateway's history read, which
then reported `interrupted` and projected `recovery-terminal`. This does not
exercise a genuinely live-backend reattachment or guard; cross-platform
orphan ownership and fail-closed recovery remain open.
A [controlled backend-process guard](evidence/G1-BACKEND-PROCESS-LIVENESS-GUARD.md)
now records the Codex direct-stdio child PID and host in acknowledged
file-backed sessions. An authenticated restart refuses a genuinely live old
process before spawning, and also refuses a legacy identity-less record. The
test killed and reaped the exact controlled child before a successful resume;
it does not turn the earlier installed-host natural-exit probe into a
live-survivor proof. The unacknowledged stdio compatibility client remains
unguarded and outside activation eligibility. TUI remains discontinued.
The [installed-host guarded-canary extension](evidence/G1-BACKEND-PROCESS-LIVENESS-GUARD.md)
now binds the same PID/host identity through both sides of a disposable
gateway `SIGKILL`. Active-turn and completed lost-response recovery passed
under strict guard mode on the selected WSL/Linux installed CLI. The survivor
variant again observed natural backend exit before reconnect and therefore
did not prove a live installed-backend rejection. The canary was then extended
with exact executable and process-birth checks for scoped native Windows
cleanup. Native Windows active-turn and completed lost-response hard-crash
recovery passed against a hash-verified disposable copy of the installed CLI.
The active-turn run preserved exact pre-crash decision-observation digests and
completed one distinct next turn; the lost-response run recovered the exact
host marker without redispatch. Its old backend exited before the survivor
observation, so live installed-backend rejection remains untested. Power-loss
and exact desktop-task handover remain open.
The [2026-09-30 process-birth guard follow-up](evidence/G1-BACKEND-PROCESS-LIVENESS-GUARD.md#2026-09-30-process-birth-hardening)
adds a Linux/Windows birth reference to guarded backend identity, reducing a
verified PID-reuse false block while keeping unknown birth fail-closed.
The [gateway-marker binding repair](evidence/G1-GATEWAY-MARKER-BINDING-RECOVERY.md)
fixes the original-request versus marker-augmented wrapper checkpoint mismatch
found by a completed lost-response hard-crash run. The repaired completed and
active installed-host Linux crash canaries pass, as does the 671-pass Linux
wrapper suite. These remain disposable construction proofs, not current-task
handover or activation evidence.
The exact extracted 2026-09-30 Windows Companion payload also passed both
native Windows hard-crash canary modes against the hash-verified disposable
installed host. The old backend exited before reconciliation; live-survivor
guard and PID-reuse transitions remain unproved on that host.
If a wrapper-local or host-returned dispatch outcome cannot be persisted, the
gateway now sends only a failure diagnostic, closes that session and leaves the
request outcome unknown on recovery. Focused injected-store tests cover both
response paths. This prevents a false successful client acknowledgement, but
does not prove whether a host-side mutation occurred or make retry safe.
For a successful Codex `turn/start` response, the gateway now first records a
content-free, exact-request host acceptance receipt. A failed append withholds
that response from the wrapper. The receipt survives store compaction/reopen,
but an accepted turn whose gateway outcome is still unknown remains blocked;
the receipt is diagnostic evidence, not backend-history reconciliation. A
read-only `thread/read` with turns can now add an exact, content-free host
history verification for that accepted request. Even a terminal host turn
does not release the unknown gateway outcome or restore wrapper state. See
[C2 turn-start acceptance evidence](evidence/C2-TURN-START-ACCEPTANCE.md) and
[C2 history verification evidence](evidence/C2-HOST-HISTORY-VERIFICATION.md).
The acknowledged gateway now also journals a wrapper-generated automatic
successor `turn/start` before host dispatch and binds its response to the
durable request. A recovered unknown mutation blocks this server-generated
path as well as client writes; see
[C2 generated-successor evidence](evidence/C2-GENERATED-SUCCESSOR-INTENT.md).
The wrapper now separately checkpoints full explicit semantic turn state before
dispatch and its exact host-turn binding before response delivery. A verified
file-backed restart can evaluate a bound turn's completion using a
provenance-marked reconstruction of the process-local journal binding. Rejected
starts are cleared durably; failed binding checkpoints stop the gateway
session. A combined local gateway/backend restart fixture now resumes an
acknowledged consumer and completes its recovered bound turn without
redispatch. This is bounded local recovery, not desktop-task handover or complete
runtime-journal replay; see [C2 semantic turn recovery evidence](evidence/C2-SEMANTIC-TURN-RECOVERY.md).
The gateway's read-only Threads projection now counts these unresolved durable
mutation requests even when their backend sessions are no longer running. The
Companion shows that count as Attention, without a request key, payload or
thread identifier; a missing count remains unknown rather than zero.
Acknowledged-continuity sessions also reject thread/turn mutations with no
stable request key; keyless read-only inspection remains available. Legacy
transparent stdio transport has a different, non-acknowledged continuity
claim and is not upgraded by this rule.
The wrapper deliberately leaves its dispatched-context view unchanged after
steering, because App Server accepted the original `turn/steer` input rather than
an ARE context envelope. A completed compaction preserves the verified C1
record for later continuation; reinjecting it into the active model context
requires a separately verified host capability. The fixture proves the
successor plan is present in a newly dispatched turn after compaction and
wrapper restart, not in the already-running turn.
The hosted client now exposes an exact-active-turn steering endpoint guarded
by accepted-turn ownership, stable-key hosted-input attestation, model-entry
pause, and fresh restricted catalog checks. This is a local construction
slice with a disposable installed WSL/Linux CLI in-flight steering canary and
exact durable host acknowledgement. A keyed read-only outcome query now
distinguishes settled acceptance, unknown delivery and host acceptance without
ARE reconciliation across managed restart; it never authorizes an automatic
resend. The later guarded native Windows canary reproduced the successful
in-flight steer, clean manager restart, same objective, and duplicate-dispatch
rejection against the isolated current closure. The browser and host now retain
a content-free uncertain-steer checkpoint, which the read-only Companion
Threads view can project when supplied by an owned hosted client. The fresh
unsigned Windows build passed a staged WebView2 journey with that cue fully
visible on the active Reasoning State card after a first-viewport layout fix.
The next bounded C2 slice retained the host-owned checkpoint until exact
terminal acknowledgement, including when a successful gateway steer loses its
hosted HTTP response. Native Windows guarded canaries passed both ordinary and
lost-HTTP-response clean-restart paths without duplicate dispatch, and the
refreshed unsigned Companion stage passed 13 bundled-feature checks plus the
WebView2 checkpoint journey. Joined local gateway/RPC and file-backed hosted
fixtures now cover an accepted steer whose gateway response is lost before the
client observes it: exact-key status can reconcile a terminal outcome, while
unknown delivery blocks replay. A native Windows canary additionally passed
abrupt hosted-client loss after accepted steer and lost HTTP response but before
acknowledgement. A second native canary withheld the accepted steer response
from the hosted RPC consumer, killed that client before it observed the
response, and recovered the same key and objective after restart without
redispatch. A later disposable native Windows canary killed the whole managed
process tree after accepted steer, separately for lost HTTP and withheld RPC
responses. Both recovered the exact key and objective without redispatch.
An initial lost-HTTP combined run exposed a gap: compaction could enter after
the steer handler returned but before its durable key was acknowledged. The
hosted API now blocks compaction on that key, even if the host turn is idle.
Both lost-response variants deny compaction before recovery, then complete it
after restart and terminal exact-key acknowledgement with explicit requirement
continuity intact. A later C2/F1 ingress audit found the browser's pending-
steer hold was not mirrored by authenticated new-thread and feedback-write
endpoints. The hosted API now rejects new-thread creation and all three
feedback writes while the durable steer key is pending; read-only outcome,
acknowledgement, Rejoin preflight, exact interruption, and approvals remain
available. Source fixtures and both native Windows abrupt-stack canaries pass
the expanded fence before exact acknowledgement. The hosted-client and full
wrapper suites pass. This was a
source-level canary staged on Windows, not an installer rebuild or a machine
power-loss test. The unsigned NSIS candidate was then extracted without installation:
its four resource trees matched staging byte-for-byte, its extracted executable
passed 13 native bundled-feature checks and the WebView2 journey, and the
pending hosted-steer cue disappeared in the same open window when the owned
observation became stale and stayed absent after exact acknowledgement. The
extracted executable differs from
the staged executable by three bytes, so validation used the extracted copy.
Whole-machine power loss, genuinely unknown backend acceptance, installed
NSIS lifecycle, and current desktop-task
control remain open. TUI is discontinued and outside this path. See
[C2 hosted steering evidence](evidence/C2-HOSTED-ACTIVE-TURN-STEERING-2026-10-01.md).

An opt-in `SessionStart` `source: "compact"` hook candidate now reads one
explicitly bound, verified file-backed Reasoning State ledger and projects its
latest checkpointed C1 record into host additional context. It returns no
context for another host session or non-compact start and stops a bound
continuation if the state cannot be verified. Local fixture and CLI tests cover
the exact-session binding, missing/uncheckpointed/tampered state, and candidate
configuration. A version-bound, isolated canary of the selected PATH CLI now
observes one native `SessionStart source:compact` callback after a completed
`contextCompaction` item and before the next turn's provider request. The
verified C1 context reached that loopback request byte-for-byte; a missing
bound ledger returned `continue:false` and prevented that request. The hook
fires at the next model request, not at compaction-item completion. This is
now also verified for automatic compaction with the same selected native CLI
binary in separate isolated runs: positive and invalid-ledger modes pass
without an explicit compact RPC.
It does not establish this exact task's desktop host session; the hook is
neither installed there nor evidence of full C2 or chat handover. See
[C2 canary evidence](evidence/C2-NATIVE-COMPACTION-CANARY.md).

## Execution contract for H0A


- Input: `codex --version` and `codex features list` stdout from an exact
  executable; do not parse configuration files or assume the PATH executable
  is the desktop app's bundled binary.
- Rule order: verify both subprocesses; parse whole feature rows; prefer the
  canonical `hooks` key; accept `codex_hooks` only as legacy; if neither is
  present, return `feature-unknown`, not native readiness. A disabled row is
  `feature-disabled`; an enabled row still requires a native canary.
- Failure modes: unavailable executable, failed feature command, malformed or
  missing row, conflicting canonical/legacy rows. Never infer that a hook is
  installed or that callbacks were delivered.
- Acceptance: fixture test covers each branch; the real local CLI probe names
  the current row and still reports native delivery unverified.

## Operational support and deferred residue

The current product frontier includes a native Windows hosted-command stop:
the pinned disposable `command/exec` canary observed a successful file write
under a requested `readOnly` policy. The Windows managed launcher, gateway,
hosted client and final command preparation now fail closed for hosted effects;
ordinary/guarded text and Plan UI construction can continue. The exact
counterexample, source gates, and verification needed before reopening that
path are recorded in
[G1 hosted dynamic-effect evidence](evidence/G1-HOSTED-DYNAMIC-EFFECT-TRANSPORT.md#native-windows-sandbox-counterexample-and-fail-closed-gate--2026-09-29).
This blocks Windows hosted-effect execution claims, not host-independent
Reasoning State, observation, or UI work. The desktop writer-handover and O1
activation gates remain separately open.
The [2026-09-30 pinned output-cap recheck](evidence/G1-WINDOWS-SANDBOX-MANAGED-PREFLIGHT.md#pinned-output-cap-recheck--2026-09-30)
confirmed that this native Windows host rejects both custom capped output and
streaming under its unelevated sandbox, despite advertising the cap in its
generated schema. The same-version WSL host enforced an 8 KiB cap. The Windows
gate stays closed; WSL-backed execution would require a separate bounded
adapter and approval/identity/recovery proof, not a transport substitution.

| Task | Owner | Affected stage | Causal posture |
| --- | --- | --- | --- |
| Select the actual desktop-host executable and permissible event API | Host integrator | H0B/G1 | Exact prerequisite for same-task claim; PATH CLI alone is insufficient. |
| Choose private state/credential root and retention | Runtime operator | C2/O1 | Required for restart/cutover, not H0A. |
| Approve installed hook trust and exclusive-writer cutover | Host/user | O1 | Blocks activation only; construction remains runnable. |
| Final privacy, permissions, installer and operational hardening | Product/host owners | O1 and release | Must precede installed use; not a reason to stall fixture construction. |

## Open Questions

- Does the installed desktop expose a supported single-writer handover for this
  task, or must an ARE-controlled client be offered as a separate user choice?
- Which event surface provides a complete, non-bypassable turn/tool/compaction
  boundary for the selected host version?
- Which exact owner approves product candidate, persistent trust and live
  cutover as distinct decisions?
