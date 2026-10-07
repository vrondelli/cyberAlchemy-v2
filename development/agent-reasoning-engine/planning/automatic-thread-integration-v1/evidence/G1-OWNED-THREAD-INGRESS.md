# G1 Codex gateway owned-thread ingress

Status: bounded construction evidence, 2026-09-26. This is not desktop-task
handover, universal App Server interception, or product activation.

The `codex-app-server/v1` gateway now requires a durable consumer-owned backend
thread reference before dispatching scoped reads, resume/fork, turn controls,
or wrapper-local ARE intent and continuation calls. An unknown thread ID is
denied before the wrapper and backend can observe it; a thread owned by a
different gateway consumer remains denied. A safe `thread/start` can create a
new reference, and the successful creation response binds it before returning
the ID. Codex `thread/started` notifications for new IDs are withheld until a
matching creation response; unmatched notifications fail closed without
forwarding their payload. Top-level `params.threadId` host events for unowned
threads likewise stop the session before client delivery.

Unscoped `thread/list` and `thread/loaded/list` are rejected in this gateway
profile. An owner-filtered list response has not been implemented or proven,
so these methods cannot enumerate the host's other threads through this path.
The hosted client uses its locally owned ID and scoped reads. Model-neutral
backend adapters retain their prior behavior and require their own boundary
review; this is not a universal adapter policy.

Focused gateway tests cover unowned reads and controls, unscoped listing,
owned read success, unrelated server events, and matching versus unrelated
creation notifications. The gateway, session-store, and Evolution startup
suites pass locally. The disposable installed-host user-input canary reported
`PASS` against `codex-cli 0.155.0-alpha.16.4`, with two fixed local provider
requests, zero external model calls, and its temporary configuration removed.
The full serial wrapper suite exited `0` on 2026-09-26. The focused gateway,
session-store, and Evolution startup run passed 79/79 after this slice.

## Claim ceiling

This protects this Codex gateway's admitted thread-ID ingress. It does not
grant ownership of a pre-existing desktop task, prove every host notification
shape is isolated, make a safe owner-filtered list available, establish
complete UI/effect coverage, or authorize a one-writer live cutover. The G1
feasibility and O1 activation gates remain open.

## Open Questions

- Which other installed-host notifications or response shapes can carry
  thread-scoped private data outside top-level `params.threadId`? A complete
  version-bound server-event schema audit is still needed.
- What owner-filtered list contract, if any, is required by the UI without
  exposing threads outside the gateway consumer's durable references?
- How will an existing desktop task be bound to an exact authorized consumer
  with a frozen watermark, exclusive writer release, and tested rollback?
