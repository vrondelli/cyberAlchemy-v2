# G1 exact desktop-task handover candidate

Status: non-executable candidate, updated 2026-09-27. Owner: ARE product owner and
Codex desktop host integrator. This is a construction/verification sequence,
not approval to pause, resume, or transfer the current task. The
[session-control contract](SESSION-CONTROL-CONTRACT.md) remains unactivated.

The [parent plan](PLAN.md) now names the current task
`01a0d8c7-9192-7d62-aafb-8eb07c1d558c`. Its former target
`01a072f5-d339-77e1-931a-5244b57f3982` remains in frozen prototype and
source-register evidence only. On 2026-09-27, the active goal and Codex task
APIs agreed on the current ID; a separate App Server process from the observed
desktop binary returned the same thread and session IDs and an active goal
without resuming the task. The read-only
[target-binding guard](../../../implementation/agent-reasoning-engine/scripts/check-g1-target-binding.mjs)
must reject any later plan/session ID mismatch. This corrects the candidate's
target attribution; it does not transfer the desktop writer or strengthen the
older G1 evidence into current-task handover proof.
The guard requires the expected installed-host version, then performs only
`account/read` with `refreshToken:false`, `thread/read` without turns,
`thread/goal/get`, and bounded `thread/turns/list` on a separate App Server
process. It reads the account before and after the task/history checks,
retaining only a domain-separated digest of the workspace-routing account ID;
absent or changed routing fails closed. Its current-task run passed; a forced former-ID run blocked with
`g1.target-task-drift` before host access. The task ID still originates from
the caller environment, so the separate Codex task/goal API correlation above
remains required. The account read belongs to the separate process, not the
desktop client's connection; the guard alone cannot authenticate desktop
account identity or ingress.

## Observed foundations

- The active task's App Server process and the separate read probe used the
  same installed `codex-cli 0.155.0-alpha.16.4` binary. A transcript-free
  read matched the task and goal, and a paginated stored-history census
  reached its final cursor; see [G1 evidence](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md).
- A disposable task now passes bidirectional App Server
  writer-lock/release rehearsals. The host rejected a second writer while one
  process held the task. After that process closed, the other resumed and
  completed a local fixed-provider turn. A final read returned exactly three
  completed turns. The current reverse leg requires recovery of the original
  durable gateway session and its resume token. Inventing a fresh session,
  even under the same consumer label, stops at `gateway.thread-unowned`
  before host dispatch. This is process-level proof, not desktop handover.
- The gateway/wrapper approval path can gate one native approval-requested
  command; an unapproved command can still execute despite advisory hook
  `block`. See [H0C evidence](evidence/H0C-NATIVE-APPROVAL-BOUNDARY.md).
- The shared RPC client now fails closed for unsupported server-initiated
  requests and declines MCP elicitation by default outside the optional hosted
  client. Local fixture coverage passed; current desktop-task delivery and
  Windows WebView handling remain unverified. See
  [C2 host-request evidence](evidence/C2-HOST-SERVER-REQUEST-BOUNDARY.md).
- The exact running binary's generated schema exposed 11 server-request
  methods. Three approval methods have a local handler, standard MCP form
  elicitation and user input have hosted-client paths with disposable native
  canaries, current-time read has a local handler, and five methods remain
  explicitly unsupported; response-shape drift was corrected.
  See [installed-host coverage](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md).
- A disposable installed-host turn now delivered one `request_user_input`
  prompt through the actual ARE gateway to the hosted client's authenticated
  HTTP state and answer API; the answer reached the fixed loopback provider
  and the turn completed. A second run rendered the form in Chromium and
  completed it by keyboard. Neither run moved the desktop task or tested the
  Windows WebView. See [native user-input evidence](evidence/G1-NATIVE-USER-INPUT-CANARY.md).
- A separate disposable installed-host MCP canary passed one standard form
  through the actual gateway, authenticated hosted answer API, MCP tool and
  fixed loopback provider. This is not current-task delivery or all
  elicitation-mode coverage; see [host-request coverage](evidence/G1-INSTALLED-HOST-REQUEST-COVERAGE.md).
- The exact installed method catalog verified 164 client requests and 11
  server requests, with no named handover or lease method. The documented
  `thread/unsubscribe` action removes a connection's event subscription; a
  disposable native probe confirmed it did not release the active writer.
  A second App Server process was rejected until the first process closed.
  See [writer-probe evidence](evidence/G1-EXACT-TASK-HOST-READ-PROBE.md).
- The 2026-10-04 [official App Server recheck](https://learn.chatgpt.com/docs/app-server)
  still documents `thread/read` as non-resuming observation, `thread/resume`
  as continuation, and `thread/unsubscribe` as subscription removal with an
  inactivity grace period. It does not document a same-task desktop writer
  transfer or redirect of subsequent desktop input and approvals. The
  [remote handoff guide](https://learn.chatgpt.com/docs/remote-connections)
  describes moving a chat and Git state between run locations, and explicitly
  excludes handoff of the requesting chat; it is not an ARE controller lease.
  These are limits of the inspected public contracts, not proof that no
  future or private host integration exists. The current task remains
  untransferred, while an isolated cooperating gateway process fixture now
  passes 301 post-restart read requests beyond the old local ledger limits.
- The hosted client's resume endpoint now refuses IDs not started by that
  running client host before calling `thread/resume`. This closes an accidental
  arbitrary-ID resume path; it does not provide restart recovery or the
  desktop-client handover mechanism needed for G1; see
  [external-resume guard evidence](evidence/G1-EXTERNAL-RESUME-GUARD.md).
- An opt-in private hosted-client recovery record now retains its gateway
  resume secret and client-created IDs. The installed-binary canary resumed
  the same gateway session after a client-only restart and rejoined its own
  task, while an unrelated ID stayed denied. Gateway-process restart and
  desktop-client handover are not established by that test; see
  [client recovery evidence](evidence/G1-HOSTED-CLIENT-RESTART.md).
- A bounded read-only stored-history projection now repopulates the hosted
  browser after an owned-thread restart. The installed-binary canary and
  Chromium snapshot showed the prior user and assistant messages without
  replaying them as new ARE turns; see
  [restored-history UI evidence](evidence/G1-RESTORED-HISTORY-UI.md).
- The hosted-client API now refuses an interrupt for an external or
  non-current turn, rejects browser-selected approval/sandbox overrides, and
  reapplies server-owned policy at resume and turn start. A disposable native
  read-only canary passed. The hosted path was subsequently pinned to read-only,
  while universal host-effect interception remains unproved. See
  [ownership and policy evidence](evidence/G1-HOSTED-CLIENT-OWNERSHIP-POLICY.md)
  and [parameter evidence](evidence/G1-HOST-PARAMETER-CONTRACT.md).
- The current shared wrapper and hosted-client broker now decline session-wide
  and policy-amending approval responses. A disposable installed-host canary
  observed the broad response rejected with no tool-success marker. The older
  proxy is a separate compatibility path and universal effect interception is
  still unproved; see [approval-scope evidence](evidence/G1-APPROVAL-SCOPE-BOUNDARY.md).
- Read-only inspection of the hashed installed desktop bundle found a
  version-bound `CODEX_CLI_PATH`/WSL command-selection seam. A repository-local,
  opt-in invocation shim passed pinned-backend `--version` and an isolated
  App Server `initialize` through the ARE stdio wrapper. It was not installed
  in the desktop app, does not own the managed gateway, and does not release or
  redirect this task's writer; see [desktop launch evidence](evidence/G1-DESKTOP-LAUNCH-OVERRIDE-2026-10-01.md).
- A disposable installed-host read-only turn blocked one unapproved repository
  write, while another turn performed one exact approved write to an isolated
  marker and the separate approval-decline mode still passed. No client
  default was changed by that historical probe; a later change pinned the
  hosted client to read-only. Wider negative coverage is still required. See
  [read-only host evidence](evidence/G1-READ-ONLY-HOST-PROBE.md).

These foundations support a *possible* process-level handover. They do not
establish a supported desktop-client handover, exact account continuity,
uninterrupted UI ingress, universal effect interception, or safe active-turn
transfer.

The 2026-09-27 read-only recheck of the currently running desktop App Server
binary still verified the pinned `codex-cli 0.155.0-alpha.16.4` generated
catalog (164 client requests and 11 server requests). The current
[official App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes `thread/resume` for a stored thread and `thread/unsubscribe` for
removing the calling connection's event subscription. After the last
unsubscribe, the documented no-subscriber unload grace period is 30 minutes;
it is not an immediate writer-release or desktop-to-ARE ingress handover.
The [official desktop handoff](https://learn.chatgpt.com/docs/remote-connections#hand-off-a-chat-between-hosts)
changes the chat's run location and Git state, not its session controller,
and cannot be invoked on the calling chat. This source comparison does not
prove that an undocumented desktop-only handover action is impossible. It
does rule out treating the documented unsubscribe or location handoff as the
missing G1 proof. No live-task method was invoked by this recheck.

On 2026-09-30, the same live App Server PID 1954 still resolved to
`codex-cli 0.155.0-alpha.16.4` and binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The transcript-free `check-g1-target-binding.mjs` probe matched the active
task and goal and observed 360 stored turns in two unchanged passes. It
explicitly returned `quiescence_established:false`,
`writer_release_established:false`, and `desktop_account_bound:false`.
The version-bound schema verifier still matched 164 client requests and 11
server requests; the catalog has no named handover/lease operation. Current
official [App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes separate-client resume, while [desktop remote handoff](https://learn.chatgpt.com/docs/remote-connections#hand-off-a-chat-between-hosts)
describes changing a chat's run location and cannot hand off the calling
chat. This is a read-only feasibility recheck, not evidence of a supported
desktop session-controller transfer or proof that no private API exists.

On 2026-09-29, the installed WSL binary still reported
`codex-cli 0.155.0-alpha.16.4`, and the repository's read-only native schema
verifier matched the pinned catalog: 164 client requests, 82 server
notifications, and 11 server requests. Its catalog still has no named
desktop-writer lease or handover method. The current
[official App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes separate-client start, resume, read, turn, and subscription methods;
the [remote-connections documentation](https://learn.chatgpt.com/docs/remote-connections)
describes host/location handoff, while the
[developer commands documentation](https://learn.chatgpt.com/docs/developer-commands)
describes experimental remote control as distinct from building a local App
Server protocol client. The conclusion is limited: none of these documented
paths or this pinned catalog establishes exclusive writer handover and
complete desktop ingress for this already-running task. This is an inference
from the observed interfaces, not proof that no host-private path exists.
No live-task mutation or takeover was attempted.

## Dependency DAG

```text
Installed-client handover API and exact task/account binding
  -> quiesced task + frozen stored-history watermark
  -> desktop writer relinquished, with new input held or explicitly rejected
  -> ARE gateway exclusive resume + verified C1 Reasoning State restoration
  -> one bounded first turn through ARE, with ingress/approval/terminal receipts
  -> desktop UI routing and independent observation verified
  -> rollback rehearsal: drain, reconcile, release, restore prior writer
  -> G1 review; only then a separate O1 owner decision for live activation
```

The process-level writer lock is necessary but insufficient. The current
gateway's one-consumer claim protects only its own path; the installed desktop
must cooperate in relinquishing and redirecting the task. No step may
interpret `thread/read`, a routing receipt, or an ARE Companion screen as
activation.

## Required proof before any live cutover

| Gate | Required observation | Current posture |
| --- | --- | --- |
| Host identity | Exact running desktop process, binary digest, account and task/session binding | Binary/task observed; separate-process workspace-routing account digest stable across two reads; desktop account match unproved |
| Quiescence | Completed active turn, no pending approval/steer/tool, frozen history cursor or equivalent watermark | Stored-history snapshot only; no quiescence |
| Writer transition | Supported desktop action releases its writer and stops direct new-message/approval dispatch; gateway then resumes the same task | Process close releases writer on a disposable task; `thread/unsubscribe` does not; desktop action unknown. Reverse resume passes only through the recovered original gateway session; a fresh session is denied as unowned. |
| Capability record | Selected backend/client explicitly marks start, resume, steer, interrupt, compaction, approvals, elicitation, user input, dynamic tools and effect interception as supported, unsupported or unknown from observed tests | Exact binary generated 11 request types; isolated native user-input and standard MCP form paths passed, but complete UI/effect coverage and current-task delivery remain unproved. |
| ARE first turn | One admitted message enters only through gateway; C1 plan context and Reasoning State checkpoint precede dispatch; exact host completion and effect/approval receipts return | Not tested for this task |
| Rollback | Drain or interrupt safely, reconcile uncertain delivery, close ARE writer, restore desktop writer and input path without duplicate turn | Bidirectional completed-task fixture only |
| UX truth | Companion distinguishes observed, unconfigured, degraded and activated; no green managed-task claim before handover receipt | Read-only candidate UI; exact task not activated |

Unknown outcome at any mutation boundary stops redispatch. A host-accepted
turn with unknown gateway outcome is diagnostic evidence, not permission to
retry. Active-turn transfer is out of scope until separately proven. If the
installed desktop cannot expose a supported single-writer handover and UI
event-routing contract, the fallback is a separately chosen ARE-controlled
client, not a silent takeover of this chat.

## Open Questions

- Which installed desktop API or product action can release and restore the
  current task's writer without discarding user input or pending approvals?
- What exact account identity and frozen history watermark can be compared
  before and after transition without retaining the transcript?
- Which host boundary makes ARE effect decisions mandatory for tools that do
  not emit approval requests?
