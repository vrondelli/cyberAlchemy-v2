# P1b — gateway-owned candidate conversation-binding journal

Status: **bounded candidate implementation**, 2026-10-04. Authority effect:
none. This is durable binding-record construction, not live Codex desktop
control, Host identity verification, or first-turn admission.

## Construction

The existing fsynced, exclusive-writer gateway session store now accepts
`conversation-binding-event` records for an active consumer only after that
consumer has durably claimed the exact native thread. Each nested event is
validated against the P1a binding state machine, the gateway adapter ID and
the owned `backend-thread:` reference. Checkpoints retain the entire binding
chain; replay rejects omitted, altered, out-of-order or unowned records. The
gateway store remains the single persistence writer for both native thread
claims and candidate binding events. A crash between `thread-bound` and the
first binding event leaves an owned but *unbound* thread, which must not be
dispatched under a future binding-required profile.

The [gateway-backed binding factory](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/conversation-binding-contract.mjs)
requires a file-backed gateway store and an active consumer. It loads the
stored chain, commits a validated event through the gateway journal before
advancing in-memory state, and checks the current stored head immediately
before turn authorization. Stale contract instances fail closed. An append or
fsync error may leave an indeterminate on-disk tail, so that instance refuses
all further authorization and mutation until the store is reopened and
reconciled. The gateway's general inspection index exposes only the binding
event count and head digest; the full records remain in the private store's
internal session view.

This path deliberately uses the existing gateway writer rather than an
independent binding file/lock. It does **not** assert that the current gateway
connection token or `consumer_id` is a Host-authenticated principal, nor that
the native Codex desktop has relinquished its own writer.

## Verification

The [focused tests](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/conversation-binding-gateway-store.test.mjs)
cover bind/activate/drain across compaction and process reopen, stale-head
authorization denial, unowned native-thread rejection, closed-store append
failure, inspection redaction, and inner-event tampering even after outer
gateway hashes are recomputed. The P1a and gateway-session-store suites also
pass: 45/45 combined focused tests, 0 failures. The full wrapper suite
passes 793, skips 24 existing platform/fixture cases, and fails 0 (817
total).

## Remaining before P1/P3

- Provide a real Host-owned verifier for principal, client instance, workspace,
  native creation receipt and writer. The injected verifier in tests is not
  proof of an installed desktop or DSH Web identity source.
- Gate every selected first-turn and later model-entry path on a fresh stored
  active binding plus exact objective/context receipt. The current gateway
  does not call this factory, so live dispatch is unchanged.
- Prove exclusivity against *all* native Host writers, not only consumers of
  this gateway journal. The native desktop New Chat witness (C0) and DSH
  lower-Agent ingress proof (D0b) remain separate.
- Define renewal, crash-time uncertain binding append handling, release and
  existing-task handover on Host receipts. A socket close or prompt ACK is not
  release proof.

## Open Questions

- At which exact thread-creation acceptance point should the gateway create
  the verified binding, and how will it avoid acknowledging a first turn if
  binding persistence is indeterminate?
- Which Host API or attestation supplies the missing principal and workspace
  assertion for each selected client surface?
