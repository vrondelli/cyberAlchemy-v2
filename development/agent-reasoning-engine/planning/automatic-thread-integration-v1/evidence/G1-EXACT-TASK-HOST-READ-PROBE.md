# G1 exact-task host read probe

Status: bounded read-only feasibility evidence, 2026-09-26. No activation,
resume, turn mutation, approval response, or task handover occurred. The
[session-control contract](../SESSION-CONTROL-CONTRACT.md) remains unactivated.

## Bound observation

- The active Codex App Server process for this task was observed at PID 1954
  with `/proc/1954/exe` resolving to
  `/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex`. Its binary
  SHA-256 was `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  The process working directory resolved under the installed Windows Codex
  package resources. This is an ephemeral process observation, not a durable
  desktop-host attestation.
- That exact binary reported `codex-cli 0.155.0-alpha.16.4`. A separate,
  disposable `app-server` process from it accepted `initialize` and the
  read-only `thread/read` request for this task with `includeTurns:false`.
  The returned task ID matched the caller's current task ID, and the returned
  host session ID matched that task. The probe retained no transcript.
- `thread/goal/get` returned the current objective with `active` status.
  `thread/turns/list` with `limit:1` and `itemsView:"notLoaded"` returned a
  stored turn reference with `interrupted` status; only a local digest of the
  reference was emitted. A later transcript-free paginated census used
  `itemsView:"notLoaded"` and reached the final cursor in one page: 62 stored
  turns (58 completed, three interrupted, one failed), no duplicate turn
  references, and a digest of ordered turn IDs/statuses
  `6a5aa17b2452b06ef9f3ae9256ceb73feec432a96f85878f0cb1ff4cdaec896e`.
  This is a read-only snapshot, not an activation watermark: the active turn
  and any later desktop writes may change the history after the census.
- `account/read` succeeded and reported a ChatGPT account type. The probe did
  not retain account identifiers or authenticate that this separate App
  Server process has exclusive account/task ownership. The thread's source
  kind was reported as `vscode`; that field does not prove the foreground
  desktop client's ownership or ingress path.
- The probe sent no `thread/resume`, `turn/start`, `turn/steer`,
  `turn/interrupt`, approval response, or configuration update. All observed
  authority effects were `none`.

The selected host's [documented App Server API](https://learn.chatgpt.com/docs/app-server)
includes task read/resume and turn operations. The documented methods do not
themselves establish an exclusive desktop-client lease, complete new-message
and approval interception, or a non-bypassable effect boundary. The gateway's
own single-consumer claim is not, by itself, evidence about a direct desktop
client that is not connected through that gateway.

## Disposable cross-process writer probe

The [repeatable native probe](../../../../../implementation/agent-reasoning-engine/scripts/test-native-gateway-bypass.mjs)
used the same version-bound binary, an isolated `CODEX_HOME`, a fixed loopback
Responses provider, and a non-ephemeral *test* task. The actual ARE gateway
and semantic wrapper started the task, recorded its hashed backend
thread claim, and completed one turn. While that gateway backend remained
active, a second direct App Server process attempted `thread/resume` for the
same task. The host rejected it with `already has an active writer`.

After the gateway client and backend closed, a new direct App Server process
resumed the same test task and completed a second turn. The local provider saw
exactly two requests in that direction. The optional `--reverse` run then
attempted the opposite transfer: a new ARE gateway was rejected while the
direct writer held the task; after the direct process closed, another ARE
gateway resumed it and completed a third turn. Exactly three fixed local
provider requests were observed in that run. A final `thread/turns/list`
with `itemsView:"notLoaded"` returned exactly the three expected turn IDs,
all completed, with no duplicate and no older cursor. The
temporary host configuration was removed. Both directions passed on
`codex-cli 0.155.0-alpha.16.4` with no external model call and no access to
this chat. They show a cross-process host writer lock, release, and
completed-task continuation for a disposable equivalent. They do **not** show that the installed
desktop client can relinquish this live task without losing UI ingress,
approvals, event coverage, or a recoverable watermark; nor does it prove that
an active turn can be moved safely.

The first reverse attempt used a prompt with no admissible repository route;
ARE preflight blocked it before dispatch. Repeating with the same bounded
UNDERSTAND prompt used by the first gateway turn passed. The preflight block
was not a writer-lock or resume failure.

## 2026-09-27 installed-host follow-up

The active desktop App Server process was still PID 1954 and resolved to the
same installed binary path. The exact version-bound method catalog verified
164 client-request methods and 11 server-request methods. No method name in
that catalog identifies a writer lease or desktop-to-ARE handover. This does
not rule out an undocumented product action outside the App Server protocol.
The [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
says `thread/unsubscribe` removes this connection's event subscription; an
unsubscribed thread may remain loaded until a no-subscriber inactivity grace
period expires. It is not documented as an immediate writer release.

The refreshed `test-native-gateway-bypass.mjs` default probe passed after
aligning its thread/turn calls with the current read-only/on-request gateway
parameter contract. Its opt-in `--unsubscribe-probe` also passed on the exact
installed binary and isolated configuration: the direct client returned
`unsubscribed`, a second direct App Server process was rejected with `already
has an active writer`, and a new direct process resumed the same disposable
thread only after the first direct process closed. Two fixed loopback-provider
calls completed; no external model call or active-task mutation occurred.
This rules out `thread/unsubscribe` as the immediate exclusive writer
transition required for G1.

Re-running the historical `--reverse` leg initially did **not** pass. A fresh
reverse gateway session received `gateway.thread-unowned` before host dispatch,
even with the original consumer label. That was a real ownership guard, not
a writer-lock result. The script now uses a disposable file-backed gateway
session store and retains the original client's resume token across two
gateway-process restarts. With that authenticated durable continuation,
`--reverse` passed on the same pinned binary: ARE was rejected while the
direct process held the writer, then resumed the same task after it closed,
completed a third local-fixture turn, and reconciled exactly three completed
turn IDs without duplicates. Three fixed loopback-provider calls occurred,
no external model was called, and the temporary configuration was removed.
This revives the process-level reverse proof but does not grant a fresh ARE
consumer ownership or demonstrate a desktop-client transfer.

## 2026-09-28 current-host recheck

The currently running desktop App Server remained PID 1954 with installed
`codex-cli 0.155.0-alpha.16.4`, executable SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
`check-g1-target-binding.mjs 1954`, with the expected version and current task
ID supplied, returned `PASS_READ_ONLY`: the plan, host thread and host session
IDs matched `01a0d8c7-9192-7d62-aafb-8eb07c1d558c`, and the stored goal was
active. The separate read process reported `notLoaded`, not ownership of the
desktop writer. `verify-host-method-catalog.mjs /proc/1954/exe` again passed
the pinned 164 client-request, 82 server-notification and 11 server-request
methods. Neither check resumed the task, accepted input, changed configuration,
or retained a transcript. The matching binary and catalog are current
identity/protocol evidence only; they do not establish a supported exclusive
desktop handover. [Official OpenAI documentation](https://learn.chatgpt.com/docs/app-server)
continues to define `thread/resume` as reopening stored history and
`thread/unsubscribe` as removing this connection's event subscription, not as
an exclusive desktop-to-ARE transfer.

## G1 result and next proof boundary

### 2026-09-28 content-free stored-history frontier

At this earlier bounded stage, the exact-task read-only preflight called `thread/turns/list` twice with
`limit:1` and `itemsView:"notLoaded"`. It validates the bounded response and
emits only a digest and status for the latest stored turn; item content and the
raw turn ID are not retained. Pure tests cover stable, changed, empty and
malformed pages (3/3 total G1 preflight tests passed). Against the same PID
1954 and pinned binary, both reads agreed on one latest stored turn with
`interrupted` status. The task and session IDs and active goal still matched.
The report explicitly sets `quiescence_established:false` and
`writer_release_established:false`. A separate read process sees stored
history, not the desktop's in-memory turn or pending approvals; two matching
reads do not freeze history, establish a handover watermark, or authorize
`thread/resume` or `turn/start` on this task.

Exact task identity, a bounded stored-history census and read visibility
through the active host binary are observed, and a disposable task
demonstrated the host's active-writer lock and post-close resume. G1 is **not
passed**: exact account binding, a frozen live-task watermark,
desktop-client relinquishment, complete
ingress/completion coverage, advertised steering behavior, non-bypassable
effect enforcement, and a desktop rollback remain unverified. `thread/read`
is diagnosis, not consent or permission to resume this live task. No
first-turn proof or live cutover candidate can be claimed from these probes.

### 2026-09-28 separate-process account-routing anchor

The installed `GetAccountResponse` schema exposes `workspaceRouting.chatgptAccountId`
for `account/read`. The exact-task preflight now reads it twice with
`refreshToken:false`, before and after the task/history checks. It fails
closed if the ChatGPT routing ID is unavailable, malformed, or changes. It
retains only a domain-separated SHA-256 digest; email, raw account ID and
tokens are not emitted. Pure preflight tests passed 4/4. The current PID
1954, `codex-cli 0.155.0-alpha.16.4` run passed with the exact task and goal
still matching, a stable account-routing digest, and an unchanged latest
stored turn with `interrupted` status. Its report explicitly kept
`desktop_account_bound:false`, `quiescence_established:false`, and
`writer_release_established:false`.

This is an anchor for a future before/after account comparison, not a match
against the desktop client's account. A separate App Server process may read
its own auth configuration; no desktop account attestation or writer release
was observed. The [official App Server account documentation](https://learn.chatgpt.com/docs/app-server)
defines `account/read` as fetching current account information, not as a
desktop-client handover or identity attestation. G1 remains open.

### 2026-09-28 bounded two-pass stored-history census

The exact-task preflight now pages `thread/turns/list` with
`itemsView:"notLoaded"` and a 50-turn page limit, to at most 32 pages and
1,024 turns per pass. It rejects duplicate turn IDs, malformed statuses and
cursors, cursor loops, and over-budget history. Two complete passes are
compared by a domain-separated digest over the ordered turn ID/status pairs.
Only the digest and status counts leave the preflight; no turn ID or item text
is emitted or retained in the report. The latest-turn frontier is still
reported separately. Seven pure tests passed, including order drift and
budget failures.

The read-only probe against the still-running PID 1954 and pinned
`codex-cli 0.155.0-alpha.16.4` passed. Both passes agreed on 229 stored turns:
225 completed, three interrupted, one failed, none in progress. The ordered
digest was `a84590d79df965994cd3c24065397ceacf83235dde6efb603e765c19c35c61d6`.
The exact task/session and active goal matched; the separate-process account
routing digest remained stable. The latest stored turn was interrupted. These
are snapshot observations, not a frozen live history, desktop-account match,
quiescence, writer release, or authority to resume this task. The report
explicitly keeps those claims false. The installed method catalog still
matches 164 client requests, 82 server notifications, and 11 server requests.

The current [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes `thread/read`, `thread/resume`, and `thread/unsubscribe`, but does not
document an exclusive desktop-to-custom-client handover. This is an inference
about documented controls, not proof that an undocumented host mechanism does
not exist. [Remote handoff documentation](https://learn.chatgpt.com/docs/remote-connections)
describes moving a chat and Git state between hosts, not transferring its
session-controller ownership to ARE. G1 remains open.

The next safe host experiment must use a disposable equivalent with the
installed client and the selected backend. It must observe whether the
desktop can relinquish its writer, route new messages and approvals through
ARE, and restore the prior path after rollback. Unsupported operations must
be explicit in the capability record. If the installed desktop provides no
supported exclusive handover, offer a separate ARE-controlled client as a
distinct product choice rather than silently moving this task.

### 2026-09-28 caller-label agreement recheck

The read-only target guard now requires both host-supplied `CODEX_THREAD_ID`
and `CODEX_SESSION_ID` to be valid and equal to the plan target before it
contacts App Server. A deliberately mismatched session label returned
`g1.caller-task-label-mismatch` with `active_task_mutated:false`; the seven
focused tests passed. The normal invocation against the still-running PID
1954 and pinned binary returned `PASS_READ_ONLY` with both labels agreeing,
the exact task/session and active goal matching, and a stable separate-process
account-routing digest. Two content-free history passes agreed on 249 stored
turns (245 completed, three interrupted, one failed) with digest
`a7bc3871de9c3038d3f4ffd1fc478ae07e50b9864ce3a13e4651a06f0bc2754f`.
The version-bound installed-host catalog still verified 164 client request,
82 server notification, and 11 server request methods; it exposes no named
desktop-to-ARE writer handover or lease method. That absence is a catalog
observation, not proof that no other host-supported product mechanism exists.

The Codex app's own task listing independently showed the same task ID as
`active` in this project, while the separate App Server read returned
`notLoaded` for its process-local thread state. This corroborates target
selection but neither the two environment labels nor the app listing attest
account identity, freeze the live turn, or release the desktop writer. The
guard continues to emit `activation_established:false`,
`desktop_account_bound:false`, `quiescence_established:false`, and
`writer_release_established:false`. G1 is still open.

### 2026-09-30 current-task read-only recheck

The active App Server process remained PID 1954, still running the pinned
`codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
`check-g1-target-binding.mjs 1954` returned `PASS_READ_ONLY` with the caller
task/session labels, plan target, host thread/session and active goal agreeing.
A separate App Server process still reported the task as `notLoaded`; its
account-routing digest was stable across reads but was not matched against a
desktop-owned account attestation. Two content-free stored-history passes
agreed on 354 turns: 350 completed, three interrupted, one failed, none in
progress (ordered digest
`d75d47d68125a73d05fedc1514299810977a1cf0f1e3afbeeef8be893cc63f22`).
The latest stored turn remained `interrupted`. No transcript items were read
or retained, and this task was not resumed or mutated. The report again sets
`activation_established:false`, `desktop_account_bound:false`,
`quiescence_established:false`, and `writer_release_established:false`.

The current [official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes read, resume and turn methods, and distinguishes `thread/read` from
`thread/resume`; it does not document an exclusive desktop-to-ARE ownership
transfer. That is a documentation-bound inference, not proof that no host
mechanism exists. A fresh method-catalog verification was **not** part of this
recheck. G1 and current-task activation remain open; the discontinued TUI is
not a substitute client or handover path.

### 2026-10-01 read-only installed-host and contract recheck

The installed Windows desktop package is still `OpenAI.Codex`
`26.917.9434.0`. The selected live WSL App Server remains PID 1954,
`codex-cli 0.155.0-alpha.16.4`, with executable SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The read-only `check-g1-target-binding.mjs 1954` probe returned
`PASS_READ_ONLY`: caller thread/session labels, plan target, stored host
thread/session, and active goal agreed. The separate App Server process saw
the task as `notLoaded`. Two content-free stored-history passes agreed on 395
turns (391 completed, three interrupted, one failed, none in progress), with
ordered digest
`30e615de9da92e0e1ca6d22cb71e6e676db2a982c552cd59acea92e9da5d4f86`.
The latest stored turn was interrupted. The probe explicitly retained
`activation_established:false`, `desktop_account_bound:false`,
`quiescence_established:false`, and `writer_release_established:false`; it did
not resume, steer, or mutate this task.

A fresh experimental schema generated by the same pinned WSL binary and the
repository's `verify-host-method-catalog.mjs` check still verified 164 client
requests, 82 server notifications, and 11 server requests. The generated
thread-method list contains read, resume, unsubscribe, and turn methods but no
named desktop-writer lease or controller-transfer method. Its
`ThreadStartParams` includes `dynamicTools`, while `ThreadResumeParams` does
not; this is a version-bound schema observation, not a universal API claim.
The freshly fetched [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes `thread/resume` as continuing stored history and `thread/unsubscribe`
as removing one connection's event subscription. The
[remote handoff documentation](https://learn.chatgpt.com/docs/remote-connections)
describes moving a chat and Git state between hosts, not transferring
session-controller ownership to ARE. The absence of a documented exclusive
writer release is an inference from those sources and this installed version;
it does not prove no undocumented host mechanism exists. G1 and current-task
activation remain open. The TUI remains discontinued and outside this path.

### 2026-10-01 later exact-task and alternate-ingress recheck

The still-running PID 1954 resolved to the same pinned WSL executable and
`codex-cli 0.155.0-alpha.16.4` version. A new
`check-g1-target-binding.mjs 1954` run returned `PASS_READ_ONLY` for this
task's matching caller, plan, host thread/session, and active goal IDs. Two
content-free stored-history passes agreed on 439 turns (435 completed, three
interrupted, one failed, none in progress), with ordered digest
`e93875d05c75a6ec787318750d20004484ff65166bd9e98d0fef948e90db704f`.
The latest stored turn was interrupted. The separate App Server process saw
`notLoaded` and stable account routing across its own reads, but neither
desktop-account binding nor live quiescence was established. No task mutation,
activation, or transcript retention occurred.

`verify-host-method-catalog.mjs /proc/1954/exe` again passed the exact 164
client-request, 82 server-notification, and 11 server-request method catalog.
The [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
states that `thread/shellCommand` runs outside the thread sandbox and can
inject output into an active turn. The version-bound ARE gateway catalog and
its focused test reject that method, as recorded in the
[alternate-method guard evidence](G1-ALTERNATE-HOST-METHOD-GUARD.md). This is
gateway-local coverage only: a desktop client not connected through ARE may
still invoke its own host methods. The same documentation describes
`thread/unsubscribe` as dropping one connection's event subscription, with a
grace period before unloading; it is not an exclusive writer transfer. No
documented or generated method in this pinned surface establishes desktop
writer relinquishment to ARE. That last statement is a bounded inference,
not proof that every private host mechanism is absent. G1 remains open.

### 2026-10-03 exact-task read-only recheck

The still-running PID 1954 resolved to the pinned WSL executable at
`codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
`check-g1-target-binding.mjs 1954` returned `PASS_READ_ONLY` for the matching
task/session and active goal. Two content-free stored-history passes agreed on
498 turns. The separate App Server process reported `notLoaded`, and the
probe returned `activation_established: false`. No transcript was retained,
task mutation was attempted, or writer transfer demonstrated. This recheck
does not establish control of the currently displayed chat; G1 remains open.

## Open Questions

- Is an exclusive, supported handover API available to the installed desktop
  client for this exact task, including active-turn steering and approvals?
- Which installed-host event boundary can prevent execution of a blocked tool
  when the native `PreToolUse` callback is advisory?
- What task/account/history watermark can be verified without replaying or
  duplicating an active turn?
