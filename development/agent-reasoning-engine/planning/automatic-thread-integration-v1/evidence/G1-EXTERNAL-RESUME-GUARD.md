# G1 hosted-client external-resume guard

Status: local construction evidence, 2026-09-26. No desktop-task activation.

## Finding and change

The hosted client's authenticated `/api/threads/resume` previously forwarded
any supplied stored thread ID to App Server. A gateway-local claim and native
process writer lock are not a desktop-client handover: a known ID could reach
`thread/resume` after the direct process released its lock without proof that
the desktop UI redirected new input or approvals. The endpoint now requires
the ID to be in the running client's set of threads returned by its own
`thread/start`, and rejects any other ID with
`windows-client.external-thread-handover-unverified` before RPC dispatch.
The screen calls this a same-host rejoin and states that existing desktop tasks
cannot be taken over there.

## Verification

- The focused Windows client-host suite passed 10/10. A fake-RPC fixture
  asserted that an external ID returns HTTP 409 and invokes no
  `thread/resume`, while an ID from this host's `thread/start` can rejoin.
- The serial wrapper suite passed 313/314, with one existing platform skip and
  zero failures.
- A separate installed `codex-cli 0.155.0-alpha.16.4` native user-input
  canary still passed through the gateway and hosted HTTP client, with zero
  external model calls and no touch to the current desktop task.
- `git diff --check` passed for tracked changes. Many relevant implementation
  and evidence files are currently untracked in the shared checkout; no commit
  or publication was performed.

## Claim ceiling

This is a negative boundary, not a handover implementation. At the time of
this guard, in-memory thread ownership was lost on hosted-client restart.
The later opt-in [hosted-client recovery evidence](G1-HOSTED-CLIENT-RESTART.md)
adds a private, gateway-session-bound path for ARE-created threads; the
default remains process-memory. This guard does
not establish the desktop client's relinquishment, account binding, frozen
history watermark, UI ingress/approval redirection, or rollback. The current
desktop task remains outside ARE control.

## Open Questions

- Which installed desktop action can atomically relinquish and restore the
  task writer and redirect new user input and approvals?
- What durable ownership proof should authorize a hosted-client restart to
  resume an ARE-created thread without admitting arbitrary desktop IDs?
