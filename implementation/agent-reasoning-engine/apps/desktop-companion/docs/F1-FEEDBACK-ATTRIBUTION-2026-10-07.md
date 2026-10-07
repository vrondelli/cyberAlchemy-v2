# F1 feedback attribution: current implementation and remaining integration

Status: local construction evidence, 2026-10-07; F1 remains incomplete.
Parent: [integration DAG](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/REVISED-CODEX-DSH-INTEGRATION-DAG-2026-10-04.md),
F1, and [whole seven-panel UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## Current implementation

[Interaction learning](../../../packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs)
already checkpoints dispatched episodes, answer presence, attributed lessons,
pending feedback, explicit review and dismissal. The existing private learning
ledger is the owner; there is no reason to add a second feedback database.
Pending feedback records contain a digest and a candidate episode, not correction
text or confirmed attribution. Explicit review checks the exact pending text,
same thread, completed answered episode and revision predecessor. Current lessons
and pending items are bounded reads, not Evolution cycle admission.

[Hosted feedback cues](../../../packages/codex-app-server-wrapper/src/hosted-feedback-cues.mjs)
are opt-in and limited to three anchored communication preferences on the
`codex:human-chat` interaction lane. They refuse quoted/general text and unanswered
episodes. This is not a general semantic correction interpreter.

## Implemented attribution fix

The general learning lifecycle and
[interaction-host boundary](../../../packages/codex-app-server-wrapper/src/interaction-host.mjs)
previously admitted response corrections using an outcome alone, even when that
completed episode contained no answer. Both now require the same-thread episode,
explicit completed posture, recorded answer presence and bound native turn.
The pending-review and hosted-cue paths already had those constraints.

Forty-nine focused lifecycle/host/cue/joined-review tests passed with no failures,
cancellations or skips. Null, empty and whitespace-only answers cannot acquire a
response correction through preparation or feedback-only submission, before or
after replay. Rejection preserves the ledger and creates no lesson. Host tests
also refuse unknown/noncompleted posture, missing turn binding and another thread.
Changed-mind reflection remains ineligible as improvement evidence; its fixture
now uses an actual answered episode instead of an unanswered one.

The existing joined human-chat gateway correction case also passed: answered
same-thread corrections reach the next model-facing context, ambiguous feedback
stays pending, exact review replays, and another consumer cannot read or mutate
the owned thread's feedback. Three focused attribution regressions passed after
adding direct cross-thread preparation/submission negatives; those rejections
preserve the ledger and create no lesson. This remains a disposable gateway/local
provider fixture, not a live desktop or DSH feedback proof.

The two affected source pins were refreshed in all three DSH graph manifests as
snapshot 68. Package pins and graph membership are unchanged. All seven installed-
graph tests passed in 219.966 seconds with no failures, cancellations or skips,
including complete installed-package/source verification, restricted native Host
checks and the separate fresh-Host no-Entry negative. A read-only pin/material-
digest check found no drift in any of the three manifests. This qualifies the
bounded structural witness, not F1's missing DSH correction path or full UI.

## Remaining F1 construction path

1. The owner summary now travels through the authenticated Codex thread read path,
   client validator, native bridge and Threads evidence disclosure (snapshot 70
   below). Retain the same consumer/thread/runtime-epoch and source-snapshot
   bindings; never expose instruction-bearing `lessons/list` responses directly
   to Companion or recover current counters from an older checkpoint.
2. Complete the separate Evolution attribution/display path and qualify the owned
   client experience. Keep ambiguous pending feedback distinct from retained
   lessons, dispatched/evaluated applications and candidate Evolution signals.
   A short reference is provenance, not evidence of improved behavior. Threads
   evidence counts do not complete Evolution integration or full F1 qualification.
3. Bind DSH feedback to its native session, prompt and answered terminal event
   through the existing private gateway owner. The pinned protocol recognizes
   `feedback/record` and message-put/delete journal event names, but recognition
   alone provides neither a trusted human correction nor an ARE feedback ingress.
   No DSH correction path is implemented or qualified by this slice.
4. Verify same-thread and cross-thread negatives, quoted/reference text, ambiguous
   feedback remaining pending, exact review/revision, restart, duplicate/lost ACK,
   unavailable source and independent Evolution state. Qualify Codex and DSH
   separately through the real owned client before claiming F1 complete.

These are dependencies of the existing F1 requirement, not replacement scope.
There was no GUI launch, live learning activation, external model/provider call,
live Evolution cycle, installation, deployment or current-chat handover in this
slice. Tests use disposable local providers and deterministic cycle fixtures.

## Owner-side feedback summary: source snapshot 69

The learning lifecycle now owns a closed content-free observation, exposed through
the wrapper's local `observeLearningFeedback({thread_id})` hook. This is not a new
public RPC or Companion feature yet. The existing thread-observation transport,
client validator, native bridge and UI must still carry it under the same
consumer/thread/runtime-epoch binding. DSH has no qualified feedback owner hook.

The summary hashes the participant/product/thread binding and contains no raw
identity, instruction, episode ID, answer or correction text. Counts distinguish
pending review, retained lessons, disabled lessons, dispatched applications and
evaluated applications. Dispatch and outcome rows for one application count once;
evaluation does not imply improvement. Policy `off` preserves retained evidence
instead of claiming erasure or active reuse.

The latest owner event must match a retained checkpoint by head-event and subject
digest. Missing/faulted checkpoints withdraw the state/checkpoint references and
all counts; an older successful read is not a current fallback. Disabled learning
returns null counters, whereas a configured empty owner returns explicit zero
counts without invented checkpoint evidence. Durability distinguishes process-
memory fixtures from append-only-file-fsync storage. Reads append nothing, call
no input/response provider and never trigger Evolution.

Fifty-three final lifecycle/host/cue/joined-review checks passed in 36.826 seconds with no failures,
cancellations or skips. The actual file-backed wrapper test verifies identical
summary recovery after restart and unchanged file bytes around both reads, in
addition to same-thread/cross-thread count separation, disabled/off postures and
checkpoint-failure withdrawal and latest-uncheckpointed-owner refusal. The four
focused summary/restart checks also passed in 4.342 seconds without failures,
cancellations or skips.
The wrapper and lifecycle source pins were refreshed in all three snapshot-69
DSH manifests; package pins and graph membership are unchanged. All seven graph
checks passed in 227.990 seconds without failures, cancellations or skips,
including the complete installed-package/source verification and both native
Host cases. Independent read-only pin/material-digest verification found no drift
in any manifest. This remains structural evidence, not the missing F1 UI path.

At snapshot 69, public transport/UI and DSH feedback integration remained next. No live
learning configuration, package, external provider, deployment or desktop chat
control changed. This owner-side slice does not complete the parent plan.

## Authenticated read path and Threads display: source snapshot 70

The wrapper now obtains each summary from the private learning owner for that
exact backend thread. The existing authenticated thread observation includes it
under the consumer/thread/runtime-epoch binding and snapshot digest. The client
checks the closed summary, content digest, posture and bounded counter relations;
the native bridge checks the same structural constraints before returning the
read-only projection to Companion. Native/UI structural checks do not independently
recompute the owner digest; the authenticated Node client performs that check.
No feedback-write RPC, separate storage or provider call was added.

Threads shows feedback inside its existing evidence disclosure, preserving the
first-view plan/recovery controls. Pending review, retained lessons, disabled
lessons and dispatched/evaluated applications remain distinct. Policy `off` can
retain evidence. Stale rows withdraw current counters; checkpoint-unavailable
and disabled postures use null counts. Legacy and DSH sources without an owner
summary say `not reported`, not `disabled`. This is not a first-view feedback
control, improvement claim or automatic Evolution cycle admission.

The final UI/thread-observation suite passed 86 checks in 1.670 seconds, including
rendered-node fresh/stale/unavailable/unsupported feedback journeys, closed/digest
validation, private thread association and a full 32-row page below the unchanged
64 KiB response bound. All 15 native Rust checks passed; compilation took 8.55
seconds. All 53 lifecycle/host/cue/joined-review checks passed in 32.651 seconds.
The authenticated joined human-chat gateway correction case passed in 3.347
seconds and verified content-free same-thread counters through the real local
observation endpoint. These are disposable source/native test fixtures, not a
new Windows GUI, package, live-provider or current-chat control qualification.

Three changed source pins were refreshed in all three DSH manifests to snapshot
70. Package pins and graph membership are unchanged. Independent source-pin and
material-digest checks found no drift in any manifest. All seven full graph checks
passed in 212.429 seconds, including the complete installed package tree,
restricted native Host cases and separate no-Entry refusal. Structural consistency
is not proof of a running DSH feedback integration.

## Next DSH attribution boundary

The pinned installed `dsh-command-feedback` package already supplies
`sessionFeedback.record`, documented in its
[`types/index.d.ts`](../../../packages/dsh-gateway-backend-adapter/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-command-feedback/lib/types/index.d.ts)
and [`types/types.d.ts`](../../../packages/dsh-gateway-backend-adapter/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-command-feedback/lib/types/types.d.ts).
Its request contains a session ID and optional remark/category, not an answered
turn or episode reference. The acknowledgement means appended but unflushed;
feedback is session-level, log-only and outside model context. Therefore this
existing producer is a possible ingress to investigate, not a qualified ARE
lesson source or durable correction receipt. Do not infer response attribution
from a category, arbitrary journal row, tool output or a session-level remark.
The adapter must bind an explicit human action to its owned native session and
answered terminal event, retaining ambiguity as pending review and independently
qualifying restart/duplicate/lost-ACK behavior before DSH F1 completion.

## Open Questions

What content-free feedback provenance is approved for the Companion first view?
Which native DSH user-action boundary can supply explicit correction attribution
without interpreting arbitrary journal/tool text as a human directive? General
semantic correction interpretation remains unqualified. Fresh GUI/package and
whole-parent OS/lifecycle/resource/security-last requirements remain open.
