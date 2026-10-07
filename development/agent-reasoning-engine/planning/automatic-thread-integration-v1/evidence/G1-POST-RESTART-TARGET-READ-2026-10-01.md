# G1 post-restart exact-task read

Status: read-only observation, not activation. Date: 2026-10-01. Target:
`01a0d8c7-9192-7d62-aafb-8eb07c1d558c`.

## Observation

The existing `check-g1-target-binding.mjs` guard was run against the live WSL
desktop App Server process (PID 1954), with expected version
`codex-cli 0.155.0-alpha.16.4`. It returned `PASS_READ_ONLY`; the process
binary SHA-256 was
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The caller task/session labels, planning target, separate-process `thread/read`
thread/session IDs and active goal agreed. The guard retained no transcript and
issued no resume, turn, approval or writer-transition request.

Two bounded stored-history passes agreed at 417 turns: 413 completed, one
failed, three interrupted and none reported in progress. The latest stored turn
was interrupted. This is a stored-history observation, not a live quiescence
barrier. The separate process's account-routing digest was stable between its
two reads, but its account was not authenticated as the desktop client's
account. `writer_release_established`, `quiescence_established`, and
`activation_established` all remain false.

The [official Codex App Server example](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server)
uses `thread/resume` when an app restarts its own App Server and continues its
saved thread. It does not document an exclusive writer transfer from an
already-running Codex desktop client or rerouting that client's future user
messages and approvals. This is a documentation boundary, not proof that an
undocumented host-private mechanism cannot exist. The currently exposed Codex
app task-management handoff moves another task between checkouts/hosts; it
cannot move the calling task and is not a session-controller transfer.

## Same-day read-only follow-up

A later run of the same guard against PID 1954 and the same pinned binary again
returned `PASS_READ_ONLY` for the exact task and active goal. Its two bounded
stored-history passes agreed at 426 turns: 422 completed, one failed, three
interrupted, and none reported in progress. The latest stored turn remained
interrupted. The account-routing digest was stable in that separate process,
but there was still no desktop-account binding, live quiescence barrier, writer
release, or activation receipt. No transcript was retained and no resume,
turn, approval, or writer-transition RPC was issued.

The installed binary's experimental App Server method catalog was regenerated
and matched the pinned `host-client-method-catalog.v1.json` exactly: 164 client
requests, one client notification, 82 server notifications, and 11 server
requests. The catalog includes `thread/resume`, `thread/unsubscribe`, and
`remoteControl/*` methods, but does not expose an exact-task
exclusive-writer handover or desktop ingress/approval reroute. Catalog absence
is limited to this installed version and public schema; it does not prove no
host-private mechanism exists. The discontinued TUI was not used.

## Claim ceiling and next gate

This exact task is identifiable and readable from a separate process. It is
not ARE-controlled. No `thread/resume`, direct write, desktop writer shutdown,
new-task substitution, or live activation is justified by this check. The G1
handover gate still requires a supported desktop action that freezes ingress,
relinquishes its writer, redirects subsequent input and approvals, and permits
safe reversal for this exact task. The TUI is discontinued and is not a client
candidate for that gate.

## Open Questions

- Does this installed desktop expose a supported exact-task controller handover
  to a third-party client, including ingress and approval routing?
- If it does, what observable lease/writer-release and rollback receipts bind
  the transition to this task and account without retaining the transcript?
