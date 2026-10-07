# P3b: opt-in Codex gateway model-entry receipt join

Status: candidate construction evidence, 2026-10-04. Authority effect: none.
No packaged profile or live desktop session enables this option.

## Exact candidate boundary

`require_model_entry_receipt: true` is available only beside the existing
durable Codex conversation-binding gate and its Host callbacks. Session
creation requires a genuine, previously unused in-process ARE wrapper instance. For each direct
or wrapper-generated `turn/start`, the gateway matches one closed P3a receipt
to the exact wrapper-forwarded message, checks its source and thread, and
persists `model-entry-verified` against the existing dispatch intent before
writing to the backend. Direct turns also join the receipt's original request
binding to the durable gateway request. Generated turns bind the forwarded
parameters to their generated dispatch intent. The file-backed store validates
the proof during replay and compaction; an unproven recovered turn intent
cannot rejoin an opt-in session. Missing, malformed, duplicate, or undurable
proof stops dispatch. The opt-in gate denies other model-entry methods until
they have their own receipt contract. The generated objective context key is
allowed only under this gate; unknown generated keys remain rejected.

Source selectors: `src/model-entry-receipt.mjs`, `src/wrapper.mjs`,
`src/gateway.mjs`, `src/gateway-session-store.mjs`, and
`src/host-method-policy.mjs` in
`implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/`.

## Validation and claim ceiling

Focused tests in `test/gateway.test.mjs`, `test/gateway-session-store.test.mjs`,
and `test/host-method-policy.test.mjs` cover direct and generated dispatch,
missing receipts, caller-supplied pseudo-receipts, a fake wrapper factory,
journal failure, unproven recovery, single-session wrapper ownership, event ordering, compaction, and the exact
generated-context allowlist. After the final code state, the full wrapper
suite passed: 832 total, 808 passed, 24 skipped, 0 failed. Syntax checks for
the four touched source modules and `git diff --check` also passed.

This is not cryptographic Host authentication. The test Host callbacks are
synthetic, the receipt is local integrity evidence, and neither this code nor
passing tests prove that the installed stock Codex desktop launches the shim
or yields exclusive New Chat control. P1's real Host assertion and C0/C1
desktop witness remain open. P2's full event/capability matrix, steer and
compaction receipt contracts, DSH Web Agent-admission proof, release, and
deployment remain separate. No existing chat was taken over.

## Open Questions

- What real Host API or process witness can supply the creation assertion and
  exclusive-writer proof for a stock desktop New Chat?
- Should `turn/steer` gain a distinct context/receipt transition or remain
  unsupported in the first read-only owned-chat profile?
- What exact recovery witness joins a post-crash in-flight host turn to the
  persisted P3 receipt without blind redispatch?
