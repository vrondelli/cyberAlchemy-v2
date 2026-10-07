# C2 host turn-start acceptance receipt

Status: bounded implementation and local validation, 2026-09-26. This is not
same-task activation, unknown-delivery resolution, or authority to retry an
uncertain request. The [work-pack](../INTEGRATION-WORK-PACK.md) owns C2 scope.

## Boundary implemented

For the Codex App Server backend, the gateway now binds a successful
`turn/start` response to the claimed backend thread, stable request key and
returned turn ID. Before forwarding the response into the ARE wrapper, it
appends a bounded `turn-start-accepted` host observation to the gateway
session store. The receipt contains only hashes of the thread, turn, request
key, request binding and host response. The store rejects a receipt for an
unowned thread or a mismatched durable request and preserves the receipt
through checkpoint compaction and reopen. A failed receipt append stops the
gateway without delivering the host response to the wrapper. The generic
backend adapter remains outside this Codex-specific response contract.
At the 256-observation cap, the store may prune the oldest acceptance receipt
only when its matching request has a durable completed gateway outcome.
Unresolved accepted turns remain retained; if no resolved receipt is available
to prune, the next observation fails closed instead of silently evicting it.
The per-thread accepted-turn count is therefore a count of retained receipts,
not a lifetime counter.

This creates a durable distinction between “dispatch outcome unknown and no
host acceptance observed” and “host acceptance observed, but gateway outcome
still unknown.” Neither state is auto-retried. A host acceptance receipt alone
does not prove turn completion, wrapper checkpoint completion, or that no
other client wrote to the same host thread. The existing stable-key and
unknown-outcome guards remain in force after restart.

## Validation

- `node --test test/gateway.test.mjs test/gateway-session-store.test.mjs test/thread-observation.test.mjs`: 66/66 passed, including the retention-cap case.
- `npm test` in `packages/codex-app-server-wrapper`: 281 passed, one platform skip, zero failures.
- The isolated native `test-native-prompt-hook.mjs ... --gateway-wrapper` canary exited zero against `codex-cli 0.155.0-alpha.16.4`, with one native turn dispatch and replay without redispatch. Its loopback provider made no external model calls.
- ARE `doctor --json` and `git diff --check`: passed.

On this machine, a live WSL `codex` process resolved to the same executable
path and SHA-256 as the prior native compaction canary
(`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
That process observation narrows binary compatibility uncertainty only; it
does not identify this task's owning process or establish exclusive handover.

Implementation source SHA-256 at validation: `gateway.mjs`
`8b7fec0afc53b02f5c9d44496fedbf1bf639f66c1992ce4ef0afcf27d5495a20`,
`gateway-session-store.mjs`
`7c22e271975599b5d3c116ad594826346b58f5c4f8cbd08e46b206c5786d69b0`,
and `thread-observation.mjs`
`e075b5cab652a0cad113a67f1a488a694c7c62670d526b9981243016be6ab6f4`.

## Open Questions

- Which supported host query or acknowledgement can reconcile a possibly
  accepted `turn/start` after gateway restart without treating a matching
  thread ID or a single history entry as proof of exclusive ownership?
- How is the owning desktop client quiesced or handed over so a direct writer
  cannot race an ARE writer on this exact task?
- How should the UI show an accepted but unresolved host turn when the wrapper
  has no verified Reasoning State row for it?
