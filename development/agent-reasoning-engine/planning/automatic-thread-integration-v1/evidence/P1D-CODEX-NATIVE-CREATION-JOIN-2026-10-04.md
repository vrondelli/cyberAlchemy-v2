# P1d — native Codex thread creation to conversation binding

Status: **bounded candidate implementation**, 2026-10-04. Authority effect:
none. This is a local gateway construction slice, not a verified stock
desktop Host integration or a P3 objective/context receipt.

## Construction and ordering

In the opt-in `conversation_binding_gate` profile, the gateway now requires
acknowledged continuity and an explicit binding TTL. A native `thread/start`
response is not forwarded immediately. The gateway first durably claims the
native thread and records the exact gateway dispatch/response acceptance. It
then asks a trusted Host callback for context keyed to that acceptance, checks
that the verified Host assertion names the same Codex adapter, native thread,
and acceptance digest, and appends `bound` and `activated` events through the
same file-backed gateway writer. Only then may the pending `thread/started`
notification and successful creation response reach the client. The existing
P1c gate checks that active binding again before direct or generated model
entry.

If Host context is absent, changes during verification, or supplies a wrong
creation receipt, the gateway returns a bounded error and stops before any
successful creation delivery or model turn. The native thread may already
exist; its accepted creation remains in the journal as unresolved, with no
active binding, rather than being mislabeled as a rejected native effect.
Restart/reconciliation must handle that orphan before claiming recovery.
`thread/fork` is rejected in this profile because a child-specific creation
proof is not yet defined. Non-acknowledged connections are refused before a
backend starts.

No real Host identity provider exists in the current desktop or DSH adapter.
The callback interface does not authenticate itself; a gateway client cannot
configure it, and no packaged profile enables it. These tests use fixture
assertions and cannot prove account/workspace/client identity or absence of a
second native writer.

## Validation

The [focused gateway tests](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs)
cover exact acceptance binding before first turn, mismatch denial without
false success, acknowledged-continuity admission, and fork denial. The focused
binding group passed 6/6, zero failures. The complete wrapper package suite
passed 799, skipped 24, and failed 0 (823 total).

## Remaining dependencies

- P1: implement and verify a genuine Host-owned assertion source for
  principal, client instance, workspace, writer, and native creation, plus an
  exclusive-writer witness outside the gateway journal.
- P3: persist and verify the exact objective/route/context/requirements
  receipt before first dispatch; this binding currently proves identity
  structure and native creation only.
- C0/C1: observe one real desktop New Chat using this gateway, same native
  thread and visible response. A fake App Server fixture is insufficient.
- Recovery: reconcile accepted-but-unbound creations after crash or assertion
  failure, define renewal/expiry and verified release, and prove visibility
  ordering under actual Host delivery.
- DSH: its lower Agent-admission and Web bypass work remains independent.

## Open Questions

- Which supported Host surface can provide the assertion and prove the
  desktop has no direct alternate writer?
- What native-host evidence safely reconciles an accepted-but-unbound thread
  without adopting it from a caller-supplied label?
