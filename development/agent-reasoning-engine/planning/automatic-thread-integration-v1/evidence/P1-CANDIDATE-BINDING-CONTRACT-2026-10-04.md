# P1a — candidate conversation binding contract

Status: **bounded candidate implementation**, 2026-10-04. Authority effect:
none. This is not a verified Host identity source, live gateway admission
switch, or activated ARE conversation.

## Implemented

The [candidate contract](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/conversation-binding-contract.mjs)
requires two injected Host-owned verifiers: one for the exact principal,
client, workspace, native thread and writer assertion, and another for a
reconciled release proof. It rejects a caller-supplied `consumer_id` or other
unverified label as a Host assertion. Binding IDs and ARE conversation IDs are
minted inside the contract; the native thread is reserved across binding
release so existing-thread adoption cannot occur by creating another record.

A closed, digest-chained event model covers `bound`, `active`, `draining`,
`released`, and `quarantined`. A verified competing writer is rejected and
quarantines the existing active binding before another turn. Unowned resume,
identity/workspace mismatch, stale generation, expired lease, inactive state,
and release without a matching reconciled Host proof fail closed. The
event-replay check rejects sequence, predecessor, and content tampering.
Replay copies validated input records into its own immutable state, so a
caller cannot mutate the supplied event array after recovery to rewrite the
in-memory binding.

This is deliberately a **candidate model**, not a security boundary. A
[P1b gateway-owned candidate journal](P1B-GATEWAY-BINDING-JOURNAL-2026-10-04.md)
now persists these events under the existing gateway writer, but the Host
verifier implementations and live dispatch binding do not yet exist. A digest
chain alone is not authentication; a caller with write access could forge a
new chain. The existing gateway connection token and DSH
Web cookie cannot be silently treated as the missing Host assertions. No
gateway dispatch path calls this module, so current client behavior remains
unchanged.

## Verification

The [focused tests](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/conversation-binding-contract.test.mjs)
cover missing verifiers, invalid assertions, native-thread conflict, clean
release, conflict quarantine, wrong workspace, generation/expiry, uncertain
release, replay and tampering. The focused `node --test` run passed 5/5.
That focused suite also checks post-replay input aliasing.
The full Codex wrapper `npm test` run passed 790, skipped 24 existing
platform/fixture cases, and failed 0 (814 total).

## Remaining before P1 and P3 are complete

- Pin a Host-owned, authenticated assertion source for Codex desktop C0 and
  DSH Web D0; do not trust the gateway consumer label or browser `sessionId`.
- Connect the P1b candidate journal and the gateway's existing thread claim
  to the live first-dispatch boundary after a real Host verifier exists.
- Prove a native Session/thread writer exclusion that covers alternate Host
  entry points; the candidate registry alone excludes only its own writers.
- Define safe renewal, crash reconciliation, release, and existing-thread
  adoption on exact Host receipts. Neither socket close nor prompt ACK is a
  release proof.

## Open Questions

- What stable principal assertion, if any, does the installed Codex desktop
  expose at New Chat ingress?
- How can DSH Web's authenticated cookie verdict be conveyed to a replacement
  session controller without accepting a browser-provided identity field?
- Which durable gateway store event should carry the binding so its ordering
  with `thread/start` acceptance is atomic and recoverable?
