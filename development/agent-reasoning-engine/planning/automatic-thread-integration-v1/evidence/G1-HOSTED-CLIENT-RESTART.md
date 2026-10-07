# G1 hosted-client and gateway restart recovery

Status: local construction evidence, 2026-09-26. The current desktop task was
not moved, resumed, interrupted, or activated under ARE.

## Implemented boundary

The hosted client can opt into `--state-file <private-path>`. Its exact
`codex:human-chat` gateway resume secret and IDs returned by its own
`thread/start` are checkpointed in a mode-0600, digest-checked file under a
private WSL/Linux directory. Native Windows state-file recovery is disabled
until a credential-store/ACL contract exists. A writer
lock prevents a concurrent process from using the same record; a verified
terminated local writer can be reclaimed. A new host process presents that
secret to the gateway and requires a matching authenticated resume receipt
before it exposes the recorded IDs. It still refuses any other ID at
`/api/threads/resume` before App Server dispatch. Failed thread checkpointing
withholds the new thread response.

The shared gateway client now takes `continuity.acknowledged_through` from an
authenticated resumed handshake as its sequence baseline. The native restart
canary first exposed `gateway.delivery-sequence-gap:0->27`; the transport
fix and focused regression test resolved that failure. The host UI shows
whether private-file recovery or process-memory mode is in use, without
exposing the secret or state-file path.

## Verification

- Focused hosted-client recovery/HTTP tests passed 17/17, including tampered
  and drifted records, unsafe file and parent modes, changed gateway session,
  live and stale writer locks, external ID denial,
  owned ID rejoin and checkpoint failure.
- The shared transport's fresh-process watermark regression passed. The
  serial wrapper suite exited 0 after the transport and recovery changes.
- `native-user-input-canary.mjs` passed with `--recovery` against installed
  `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
  It completed one fixed-provider `request_user_input` turn, restarted the
  hosted client, authenticated to the same gateway session, rejoined its
  original thread and denied an unrelated ID.
- The stronger `--gateway-recovery` run also passed: it closed and recreated
  the gateway from a file-backed session store before the hosted client
  reconnected, and App Server resumed the same ARE-created thread. The fixed
  loopback provider saw two requests for the initial turn; no external model
  calls occurred. The current desktop task was untouched.
- Source syntax checks and `git diff --check` passed.

## Claim ceiling and operational residue

This proves bounded **completed-turn** restart and rejoin for an ARE-created
thread in an isolated WSL/Linux fixture. It does not prove interrupted-turn
recovery, browser-visible event hydration after restart, a Windows-native
secret-store ACL, installed Windows WebView behavior, or current-desktop-task
handover. The recovery record holds a gateway session secret in plaintext;
operators must keep its parent directory private and out of Git. A durable
gateway store must be configured separately. Default mode remains
process-memory and has no restart claim. G1/O1 activation remains pending.

## Open Questions

- Which desktop-host action can stop direct ingress and approvals while ARE
  becomes the sole writer, then restore that route during rollback?
- Which history snapshot and host/account identity prove the exact current
  task survived a handover rather than merely sharing a stored thread ID?
- What is the Windows-native credential-store and interrupted-turn recovery
  contract for the final Companion deployment?
