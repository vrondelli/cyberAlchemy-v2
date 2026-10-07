# Threads UX brief

Status: candidate design. Question: **What is ARE doing in this task?** First
scope: ARE-managed threads only; do not imply host-wide Codex/ChatGPT coverage.
For an external host task, “ARE-managed” means the exact task has a verified
activation under the
[session-control contract](../../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md).
Internally observed or canary threads without that binding must have a distinct
source label and must not appear as activated chat sessions.

## User journey

1. Open Threads from Overview or its stable navigation position.
2. Find a task by recognizable title and last observed time. A row says
   “working,” “waiting,” or “completed” only when an exact source supports it;
   otherwise it says “last seen.”
3. Select one thread. See the current observed boundary, pending decision if
   any, and latest explicit Reasoning State Frontier.
4. Follow a decision or evidence link to understand a transition, then return
   to the same thread and scroll position.

## Minimum effective screen

- List row: task identity, observed phase, last observed time, and one signal
  requiring attention. Do not show raw IDs until detail is opened.
- Detail: “where it is,” “what changed,” and “what evidence supports this.”
- A clear source/scope label: “ARE-managed threads observed by this runtime.”
- No transcript wall, hidden chain-of-thought claim, send box, or approval
  control. The [reasoning-state runtime](../../../../packages/reasoning-state-runtime/README.md)
records explicit inspectable products, not hidden model reasoning.

An initial authenticated, privacy-filtered projection now reads only backend
threads owned by the selected gateway process. It shows hashed thread,
reasoning-epoch, checkpoint, and completion-frontier identifiers, phase, and
bounded completion status. Where the wrapper has a verified C1 plan-context
record for that backend thread, the read projection adds its digest and only
obligation/completion/open-decision counts and, when available, the ordinal
and status of the active plan slice. The latter is derived from a verified
plan-context record, not a live model thought stream. It excludes raw slice
IDs, obligation summaries, plan text, decision
questions, source paths, and raw backend identity. It has no title, host-task
activation identity, or cross-process persistence. The UI labels this narrower scope explicitly and
must not join records by title alone. The full ARE-managed task journey above
remains a design target, not a current product claim.
The restricted DSH Web Host has a separate, smaller Threads reading: active
Host-owned Agent references, in-memory native turn open/closed state at the
observation time, and the latest retained model-entry or terminal event. It
does **not** provide an ARE Reasoning State Frontier, plan slice, goal, decision,
or an exact browser-task binding for each Agent. Those fields must be joined
from verified Host ownership and ARE receipts before this view can satisfy
the per-active-thread Reasoning State journey; native turn liveness cannot be
used as a stand-in.
The page states its narrower boundary before gateway recovery details:
gateway backend Reasoning State does not establish the hosted client's
restart/Rejoin eligibility. An observed row is neither permission to Send nor
evidence that this desktop chat has handed control to ARE. The hosted client
owns its separate Rejoin check; this read-only panel does not perform it.
This source is bounded to 32 rows per read. It orders `Recovery unverified`,
active turns, and pending dispatches ahead of terminal history, then reports
both the total ongoing count and how many ongoing rows are on other pages.
The Companion can inspect previous/next pages using a content-free snapshot
digest. If the gateway facts change between reads, paging fails closed and the
user must start fresh. Paging covers gateway backend threads only; an exact
ARE-managed host-task list remains open.
The visible page range is a polite status message and changes only when the
range changes, so routine same-page refreshes do not repeat its announcement.
If Next or Previous becomes disabled at a page boundary, keyboard focus moves
to the enabled reciprocal control. A changed-source rejection moves focus to
Start fresh; it never turns that action into a retry of a gateway mutation.
This follows the [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
for reporting an action result without forcing a focus change for the message
itself. DOM semantics and keyboard fixtures do not replace an actual
screen-reader inspection.
Each observed thread card initially shows its backend-thread suffix, phase,
observation time, and attention signals. A thread-specific “Inspect state and
evidence” button reveals the explicit completion frontier, verified plan
progress, and a second native disclosure for host-protocol receipts, the last
MCP relay check, and opaque evidence digests. Only one card's state detail is
open at a time. Selection survives a fresh or last-seen read of the same
gateway epoch but does not cross an epoch change; keyboard focus on the button
survives a same-thread redraw. Recovery state, confirmed dispatch recovery,
and unresolved hosted-effect warnings remain visible outside both disclosures.
This is progressive presentation of the same bounded gateway projection, not
a new host-task identity or reasoning feed. The current backend-thread suffix
is not the recognizable host-task title envisioned in the journey above.
The gateway can now project an aggregate count of backend threads whose steer
continuity is degraded after an uncertain or mismatched host outcome. Show it
even when no Reasoning State row is recoverable. If an older wrapper cannot
report the count, say “not reported,” not zero. This count never identifies a
host task or supplies a recovery control.
The gateway's durable session index separately reports the count of unresolved
backend mutation requests, including sessions with no running backend or
Reasoning State row. Show this as Attention and keep the count content-free. A
missing field from an older gateway means “not reported,” never zero. Neither
this count nor a read-only inspection resolves whether the host applied the
mutation; do not offer a retry button without an exact reconciliation proof.
Within that unresolved count, a separate content-free count now identifies
`turn/start` requests with a matching durable `turn-start-accepted` host
receipt, including stopped sessions without a Reasoning State row. Host
acceptance is stronger than an entirely unknown dispatch, but it does not
prove gateway delivery, ARE completion, or safe retry. Missing support reads
as “not reported,” not zero; a count larger than unresolved mutations is
incompatible evidence.
Within that aggregate, a separate durable count now identifies unresolved
`thread/start` and `thread/fork` dispatches. The Companion shows this count
even with no recoverable backend-thread row. It does not identify a created
thread, prove whether creation happened, or make a retry safe. A gateway that
omits the newer field is labelled “not reported,” never zero.
The same durable index now reports a separate count of confirmed gateway
dispatch recoveries. The Companion shows the total even when its source
session has no current Reasoning State row, and shows a per-thread count only
for an exact hashed backend-thread match. Confirmation means the gateway
persisted an exact host-marker and ARE semantic-state recovery receipt. The
hosted-client path settles its private pending intent before confirmation, but
the gateway count alone does not prove that another client did so. It is not a reconstructed host
response, a new completion frontier, or proof of desktop-task activation. An
older gateway that omits the field reads as “not reported,” not zero. This
read-only status never offers a retry or repair action.
For an existing Reasoning State row, retained host receipt counts may also
distinguish an accepted turn start from a later exact host-history
verification. These are not lifetime totals, and a verified terminal host
turn does not mean the wrapper recovered it or that a mutation can be retried.
The read path also counts a distinct accepted manual-compaction turn when its
dispatch and host acknowledgement are durably bound. This count is separate
from completed compaction items; acceptance alone never labels a compaction
complete or supplies an ARE semantic frontier. An older gateway may omit the
accepted-turn count, in which case the UI leaves it unreported.
The Threads renderer now labels a verified terminal frontier by its actual
completion status: completed, failed, interrupted, cancelled, or unknown. An
unsupported phase makes the read incompatible instead of falling through to
“Turn completed”; a missing terminal status is shown as unavailable, not
successful completion.
After a gateway restart, a bound semantic turn without a verified ARE
completion frontier now appears as `Recovery unverified`, not `Turn active`.
The host may separately report that turn terminal; the Companion preserves
the earlier frontier as historical evidence and does not infer a new one.
When a content-free host-history receipt matches that exact recovered turn,
the row shows its host status (`inProgress`, `completed`, `failed`, or
`interrupted`) beside the still-unverified ARE semantic state. A receipt for
another turn on the same thread must never supply this label. New turns remain
paused while that state is unverified; a host-terminal label alone is not a
completion frontier or retry approval. For an exact, durably accepted gateway
request whose host history says `completed`, `interrupted`, or `failed`, the wrapper can now
checkpoint a separate terminal-recovery record. The row then says `Recovered
host terminal`: no ARE semantic completion, Evolution signal, automatic
successor, or retry is inferred. A new user request may be evaluated separately
under the normal gates. For `completed`, the UI explicitly says the host
completed but ARE did not observe the completion notification. Any displayed
completion frontier belongs to an earlier turn. `inProgress` and unknown
gateway-dispatch outcomes remain outside this recovery path. This completed
case has source-level tests, an installed-Codex-backed native Windows one-shot
notification-loss canary, and a two-phase staged WebView2 UI pass. The
unsigned installer was not installed.
Unknown dispatch without a Reasoning State row remains visible through the
aggregate Attention count; unresolved thread creation additionally has its
own content-free Attention count.
The Companion now refreshes this source every ten seconds only while Threads
or Evidence/Diagnostics is visible. A source observation older than ten
seconds becomes a last-seen view even if a read is still pending. On source
loss, prior rows remain inspectable but their phase labels become historical;
neither an old “turn active” row nor an old zero-record response is presented
as current. This is freshness handling for gateway backend threads, not a
host-task activity feed or proof of this desktop chat's activation.
Current rows now link to the [Decisions](DECISIONS.md) panel using exact
gateway-consumer and hashed backend-thread references plus the runtime epoch.
Stale rows have no current-decision link. Each link has a thread-specific
accessible name. The return control restores focus to the originating link
when a current row becomes available, even after one failed refresh; a changed gateway epoch cannot
be treated as the same observed process. This is bounded UI correlation, not
host-task identity or durable history.

## State contract

| State | User-facing meaning |
| --- | --- |
| Observed | Show the exact latest verified state and its time. |
| No records | “No gateway backend threads were observed in this process”; this does not imply that no host tasks exist. |
| Stale | Keep the last observation visible but label its age; do not call the thread active. |
| Recovery unverified | A recovered ARE turn binding lacks a settled Reasoning State completion. Show an exact matched host-history status separately when available; do not call ARE active or completed, and keep new turns paused. |
| Recovered host terminal | Exact accepted-turn history reported `completed`, `interrupted`, or `failed`, and ARE checkpointed a terminal-recovery record without a completion frontier for that turn. A host-completed turn is explicitly unassessed by ARE; no retry or successor occurred. A distinct user request still faces normal gates. |
| Not configured | Explain that thread observation is not connected. |
| Unavailable | Explain whether the source, access, or projection failed without exposing private data. |
| Continuity attention | A gateway-reported steer outcome is uncertain; new turns are blocked pending reconciliation. This is separate from ordinary thread phase. |
| Dispatch attention | A durable gateway request has no verified backend outcome; mutations remain blocked, while read-only diagnosis may continue. This is not a failed request or a safe-retry signal. |
| Host-accepted unresolved turn | A matching durable host acceptance exists for an unresolved `turn/start`; show only an aggregate count, not a fabricated thread row or completion frontier. No retry is offered. |
| Confirmed dispatch recovery | An exact gateway receipt was durably confirmed after host-marker and ARE-state checks. Show it separately from unresolved dispatches and host observation; do not infer semantic completion or task activation. |

## Experience checks

- A user can locate an observed thread and identify its latest verified
  boundary without reading a digest or log.
- A thread that stops reporting changes from “working” to “last seen/stale”
  under the defined freshness rule.
- Keyboard navigation reaches list, detail, linked decision, and back path in
  a predictable order.
- A screen-reader user can distinguish each backend-thread detail button by its
  suffix and expanded state; an actual assistive-technology pass remains open.

## Open Questions

- Which host/runtime owns the complete ARE-managed thread list and activity
  definition? What privacy filter is required for titles and frontiers?
- Should a thread with no recoverable frontier show only its most recent
  verified event, or an explicit “frontier unavailable” state?
