# G1 adapter-declared gateway thread ownership

Status: bounded candidate implementation, 2026-09-26. No current desktop-task
handover, product approval, or deployment is claimed.

The known Codex and DSH backend adapters now declare
`thread_ownership: gateway-created`. For either adapter, a scoped client
operation on an existing backend thread must find that thread in the gateway's
durable consumer ownership index before it can reach the wrapper or backend.
New thread IDs are claimed from the backend's creation response before they
are released to the client. Generic JSON-line process adapters retain an
explicit `unverified` ownership posture; process shape alone is not an
ownership proof. Invalid posture declarations fail adapter validation.

A new regression reproduced the DSH gap before the change: after one consumer
created a durable DSH thread, a different consumer using a fresh gateway store
could resume that thread using its backend ID. The same test now rejects both
`thread/resume` and `turn/start` before backend dispatch and leaves the new
consumer without a thread claim. The existing same-store gateway/DSH restart
test still resumes and continues the owner's thread. The DSH suite passed
16/16.

A separate fixture starts the repository's real gateway CLI with `--backend-agent
dsh`, its real ARE wrapper factory, a durable DSH backend, and private temporary
stores. One thread and turn complete; the fixture output contains ARE-added
context. This proves the CLI composition for a bounded local turn, beyond the
older pass-through-wrapper test. It does not prove production DSH behavior,
effect enforcement, current desktop-task ownership, or every wrapper feature.
The full serial wrapper regression also passed after the ownership change.

## Claim ceiling

Gateway ownership is scoped to the selected gateway's durable index. If that
index is lost while backend history survives, an orphaned backend thread is
not automatically adopted, even by a caller who knows its ID. A future
explicit migration/reconciliation operation would need independent ownership
evidence. The adapter's declaration is configuration, not an authenticated
backend attestation. Generic JSON-line adapters still have unverified thread
ownership and are not eligible for the same control claim.

## Open Questions

- What exact signed or independently verifiable evidence could authorize
  recovery of an orphaned backend thread after gateway-index loss?
- Should generic JSON-line adapters be restricted to non-controlling fixtures
  until they declare and pass a concrete thread-ownership contract?
- How should DSH's backend-specific lifecycle methods, such as thread close,
  be admitted without inheriting the Codex host-method catalog by accident?
