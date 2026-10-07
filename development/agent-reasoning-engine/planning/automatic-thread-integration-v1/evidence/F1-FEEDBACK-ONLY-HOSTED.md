# F1 feedback-only hosted operation

Status: bounded candidate implementation evidence, 2026-09-27. This is not a
current-desktop-task activation, a general correction interpreter, or a
release qualification.

## Contract and boundary

`cyberalchemy/learning/submitFeedback` is a wrapper-local RPC. It requires an
enabled learning profile and a synchronous feedback provider; the hosted
gateway checks the named backend thread belongs to the caller before the
wrapper handles it. The hosted HTTP client exposes `POST /api/feedback` only
for a loaded, idle thread. It uses the existing authenticated browser origin
boundary and rejects client-selected host policy fields. The operation never
forwards a `turn/start` request to the backend.

A recognized, exact cue is attributed to a completed episode in the same
thread and checkpointed as a current-interaction lesson. A repeated feedback
ID and identical text returns the stored lesson without a second mutation;
changed text under the same ID fails closed. If the browser loses its retry
marker and submits the same correction under a new ID against the same exact
episode, the wrapper returns `already-applied` rather than duplicating the
lesson. Unclassified feedback receives a
checkpointed `pending` disposition with a content digest, not a lesson. It
replays after learning-ledger reconstruction. A browser marker stores only
thread, request ID, and text digest so an uncertain HTTP response can be
retried with the same ID; the browser does not store the feedback text.

The client probes `cyberalchemy/learning/status` and disables its explicit
"Save feedback only" action when the selected profile/provider does not offer
the feature. Normal `Send` continues through the governed turn path. A
correction typed into `Send` alone is still not auto-rerouted; it fails normal
request-intent preflight without saving a lesson.

## Verification

- Direct wrapper fixtures cover applied, replayed, conflicting, pending,
  unowned-thread, and next-turn same-thread context behavior.
- A Codex-protocol gateway fixture covers the wrapper-local operation,
  same-thread application, and rejection by a different gateway consumer.
- Hosted HTTP tests cover authentication-adjacent ownership, idle-state and
  policy guards, profile unavailability, and zero model-turn dispatch.
- Browser pending-feedback tests cover content-free local storage, exact retry,
  changed text/thread rejection, and tampered storage.
- Playwright Firefox on a disposable local host fixture showed the action
  enabled on an owned idle thread, the success message, and zero console
  errors. A second browser run restored a content-free retry marker for an
  unavailable thread and showed an explicit forget action while both send
  actions stayed disabled. The fixture mocked the learning response; this is
  UI evidence, not installed-host or attribution proof.
- Full wrapper suite after the feature and status wiring: 415 passed, five
  skipped, zero failed. The final one-line hosted-client unavailable-status
  adjustment passed the hosted-client suite 33/33.
- A disposable installed-Codex gateway/client canary now passed against
  `codex-cli 0.155.0-alpha.16.4`: first governed turn completed, feedback was
  applied without a second model turn, gateway and client restarted, the owned
  thread was explicitly resumed, the identical feedback ID returned `replayed`
  with the same lesson digest, and a second governed turn completed. Two model
  turns started in total; the current desktop task was not touched. The canary
  is [hosted-feedback-canary.mjs](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/hosted-feedback-canary.mjs).
- That installed run exposed two host capability boundaries repaired in the
  hosted client: pre-first-message `thread/turns/list` reports an unmaterialized
  thread, and this installed build later reports `list_turns is not supported
  yet`. The client now treats only the verified idle pre-first-message case as
  empty history and falls back to bounded projection from
  `thread/read(includeTurns:true)` only for the exact unsupported-method error.
  It remains fail-closed on other errors and on `notLoaded` after restart until
  an explicit owned-thread resume. The full wrapper suite then passed 417,
  skipped five, failed zero.
- A 2026-09-28 focused wrapper check passed 4/4 after adding same-thread
  negative cases for a one-time correction and a task-specific request. Both
  returned checkpointed `pending` receipts, started no backend turn, and did
  not add a lesson. The hosted client now labels the three exact supported
  communication cues and distinguishes pending feedback from an applied
  lesson. `node --check client/app.js` also passed. This is source/fixture
  evidence, not a new installed-host or browser verification.
- The 2026-09-28 installed-host rerun made that canary self-contained: it
  created a private temporary `CODEX_HOME` and a fixed Responses provider
  bound only to `127.0.0.1`, then ran the same first-turn, feedback, restart,
  replay, and second-turn path. The pinned installed
  `codex-cli 0.155.0-alpha.16.4` sent exactly two requests to the private
  provider. The first request did not contain `Keep responses concise.`; the
  second did. The canary returned `model_wire_learning_verified:true`,
  `private_provider_requests:2`, `external_model_calls:0`, and
  `current_task_handover:false`. It removed its temporary config and provider
  at exit. This verifies delivery of the scoped instruction on one installed
  model wire, not that the model obeyed it semantically or that this task is
  controlled by ARE.

## Claim ceiling and remaining work

The default runtime profile keeps interaction learning disabled. The installed
canary proves one disposable feedback/restart/next-turn path and second-turn
wire delivery, not the exact current desktop task, semantic obedience, or
broad host-version coverage. Browser authentication proves possession
of the hosted token, not a separately verified human identity. The cue set is
only three literal communication corrections; task-scope, one-time, broad
reusable preference, and ambiguous-feedback application/revision adjudication
remain open. A later [explicit dismissal path](F1-PENDING-FEEDBACK-DISMISSAL.md)
can close a pending record without learning from it; it does not supply that
application/revision decision.
No general host handover, effect-enforcement claim, release, or deployment is
made here.

## Open Questions

- What exact human-origin claim and session watermark will bind feedback to an
  activated task after G1 handover?
- What reviewed instruction, episode and scope contract can apply or revise a
  `pending` feedback receipt without silently generalizing the original text?
