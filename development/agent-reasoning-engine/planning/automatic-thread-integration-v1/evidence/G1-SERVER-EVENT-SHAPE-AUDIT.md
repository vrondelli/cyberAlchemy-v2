# G1 installed-host server-event shape audit

Status: read-only protocol audit, 2026-09-26. No host configuration, live
desktop task, or gateway runtime was changed by this audit.

The selected installed `codex-cli 0.155.0-alpha.16.4` binary generated its
experimental App Server JSON schemas into a disposable directory. Its
`ServerNotification.json` has 82 method variants: 58 require top-level
`params.threadId`, three make it optional, `thread/started` nests the ID under
`params.thread.id`, and 20 have no thread ID in their declared payload.
`ServerRequest.json` has 11 method variants: seven require `threadId`, while
token refresh, attestation, and two legacy approval requests have none.
The temporary schema directory was removed after inspection.

At audit time, the Codex gateway rejected a server method when a nonempty top-level
`params.threadId` is not owned, and separately binds `thread/started` after a
matching creation response. This is effective for the declared scoped shape,
but a required ID that is missing or malformed bypasses that guard. Unscoped
messages such as `command/exec/outputDelta`, `process/outputDelta`,
`process/exited`, `mcpServer/event/stream/notification`, `fs/changed`, and the
legacy approval requests may contain private or effect-bearing data without
an ownership key. A generic pass-through wrapper and generic gateway client
must not treat absence of `threadId` as proof of global safe visibility.
Responses also needed correlation to the exact forwarded request and its owned
thread; the gateway then tracked special stable requests and host-history
reads but does not have a universal ownership ledger for every read response.

The subsequent [server method guard](G1-SERVER-METHOD-GUARD.md) implements a
versioned catalog check, scoped event admission, suppression of unscoped
notifications, denial of unscoped requests, and in-process forwarded-response
correlation. The findings above describe the pre-fix gap, not current gateway
behavior. The guard's evidence and remaining limitations are recorded there.

## Next construction boundary

1. Bind the exact installed server notification/request method and parameter
   shapes to a versioned catalog and fail closed on unknown versions/methods.
2. Require a valid owned thread ID for every declared thread-scoped server
   method, including optional-ID variants when they carry thread data. Admit
   only explicitly justified global messages; suppress or reject unscoped
   output and legacy approvals until a correlation contract exists.
3. Track every forwarded host request ID with method, consumer, and owned
   thread reference; reject unsolicited or mismatched responses before the
   wrapper or browser sees their payload. Prove restart/unknown-delivery rules.
4. Exercise negative fixtures for missing IDs, unscoped output, legacy
   approvals, unsolicited responses, and cross-consumer data, then rerun the
   installed-host canary. This construction does not itself activate G1/O1.

## Open Questions

- Which global notifications are actually required by the hosted client, and
  which can be omitted without losing necessary diagnostics?
- Do the installed-host legacy approval methods carry an exact conversation
  binding that can be safely mapped to an owned gateway thread, or should the
  read-only profile always deny them?
- How should a pending host response be recovered after gateway restart
  without interpreting an unknown outcome as an accepted response?
