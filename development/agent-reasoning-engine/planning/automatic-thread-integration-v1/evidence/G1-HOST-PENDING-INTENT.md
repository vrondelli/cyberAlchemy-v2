# G1 hosted pending-turn intent across client-port restart

Status: bounded local implementation evidence, 2026-09-26. This does not
activate or take over the current Codex desktop task.

The hosted client now checkpoints one pending `turn/start` intent in its
private, single-writer recovery record before gateway dispatch. The record
contains an owned thread ID, stable request key, SHA-256 message digest, and
timestamp, but no message text. A verified v1 recovery record migrates to v2
only after the same gateway session rebinds. On restart, authenticated
`/api/state` exposes the pending intent; a browser on a new localhost port
can adopt it into its origin-local checkpoint and require exact-message
re-entry. A different key, digest, or thread is rejected, and creating a new
host thread is blocked while recovery is pending. The checkpoint clears only
after a known gateway `turn/start` result.

## Verification

- Focused browser/host/recovery-state tests passed 29/29. The full wrapper
  suite passed 333 tests, with one platform skip. Tests cover private-state
  restart, v1 migration, browser adoption on a new origin, content-free
  storage, exact-key replay, changed-message rejection, and checkpoint
  clearing.
- The installed `codex-cli 0.155.0-alpha.16.4` native canary passed with a
  fixed loopback Responses fixture and zero external model calls. Its binary
  SHA-256 was
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  The canary *simulated* the crash window by restoring an intent for an
  already accepted disposable turn, restarted the file-backed gateway and
  client on a new port, observed that intent in `/api/state`, replayed the
  same key, recovered the same turn ID, cleared the intent, and counted no
  additional provider request. It did not touch the current desktop task.

## Limits and open questions

- This proves the content-free handoff and known-result gateway replay path,
  not a process killed at an arbitrary instruction or resolution of a truly
  unknown gateway/backend outcome. The browser never automatically resends.
- A known gateway result clears the server checkpoint before HTTP delivery;
  if the browser then loses that response *and* its origin-local storage,
  history shows the delivered turn but cannot automatically identify the
  lost browser intent. A reviewed last-result receipt or explicit history
  confirmation flow is still needed for that window.
- One pending intent per hosted client is supported. Multi-tab coordination,
  cross-device authentication, and native-Windows secret storage are not
  established. The current desktop task still lacks verified exclusive
  writer handover, account binding, and full host ingress/effect control.
