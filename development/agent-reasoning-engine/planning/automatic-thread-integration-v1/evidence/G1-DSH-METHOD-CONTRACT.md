# G1 selected-backend client method contract

Status: bounded candidate implementation, 2026-09-26. This does not activate
ARE control of the current desktop task or approve a backend-neutral product.

The gateway can now consult a selected backend adapter's closed
`client_method_posture` before the wrapper or backend receives a client method.
Invalid or throwing postures fail closed. The Codex adapter continues using
the pinned Codex host-method catalog. The DSH adapter declares its smaller
host method set and the existing ARE wrapper-local requests. It admits DSH's
`thread/close` under the same gateway thread-ownership and stable-request-key
checks as other mutations. Unsupported DSH `thread/compact` reaches the
capability rejection, while an undeclared `thread/read` is rejected before
backend dispatch. Generic JSON-line adapters still use the legacy catalog
fallback with unverified semantics; this is not general protocol conformance.

The real gateway CLI plus ARE wrapper fixture first reproduced `thread/close`
failing as a Codex-ungoverned method. It now starts a durable DSH thread,
completes a fixture turn carrying ARE-added context, closes the thread, and
observes that resume fails because DSH reclaimed it. The same fixture checks
undeclared read and unsupported compaction. The DSH suite passed 16/16 and
the full serial wrapper suite exited successfully after the change.

## Claim ceiling

This is client-method admission for the selected DSH adapter, not a complete
DSH server-event shape contract, authenticated backend attestation, generic
JSONL adapter guarantee, exact host-task handover, or non-bypassable effect
enforcement. A closed thread's historical gateway ownership reference is
retained; the backend's reclaimed thread ID is not reusable through that
record. The bounded gateway index limit still applies.

## Open Questions

- Should generic JSON-line adapters require an explicit closed method policy
  before they can be used outside test fixtures?
- What DSH-specific server-event and response-shape checks are required to
  prevent a backend from injecting or misbinding another thread's events?
- How should durable thread-close tombstones and ownership-retention limits
  work without making an old thread ID claimable by another consumer?
