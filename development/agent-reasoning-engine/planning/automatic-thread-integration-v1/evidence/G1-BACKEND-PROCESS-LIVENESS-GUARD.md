# G1 Codex backend-process liveness guard

Status: bounded candidate construction evidence, 2026-09-27. TUI is a
discontinued interface and was not used. No current desktop task or external
model was activated by this check.

For a file-backed, acknowledged Codex direct-stdio gateway session, the
`session-started` record now stores the spawned backend's host name and PID.
The identity survives session-store compaction and reopen. After a gateway
restart, the authenticated resume path checks that identity before spawning
a replacement backend. A live prior PID, a foreign host, an unknown process
state, or a legacy record without an identity is rejected. PID reuse may
conservatively block recovery; a PID and host name do not prove process
ancestry or authorize killing that process.

A controlled test kept an actual Node backend process alive while a new
gateway opened the retained session. The new gateway returned
`gateway.prior-backend-process-live` and spawned no replacement. A second,
legacy acknowledged record without process identity returned
`gateway.backend-process-identity-missing`. After the test terminated and
reaped its exact old child, the authenticated resume succeeded and durably
recorded the new backend PID. The focused session-store suite passed 29/29;
after the native Windows canary extension, the full wrapper suite passed
444 tests with 9 platform skips and no failures (453 total).

The production Codex direct-stdio launcher selects `acknowledged-only`:
acknowledged sessions receive the guard. Its existing unacknowledged stdio
compatibility client remains non-resumable and unguarded, so it is not an
activation-eligible or safe crash-recovery path. The generic gateway also
exposes strict `required` mode, which refuses an unacknowledged client.
DSH and non-process transports receive no fabricated local-PID guarantee.

The installed-host hard-crash canary now selects strict `required` mode in
both its original and restarted gateway processes. Before crashing, it
asserts that the exact installed backend PID and local host name were
persisted. The restarted process asserts that same prior identity before
connecting. Against installed `codex-cli 0.155.0-alpha.16.4` on WSL/Linux,
three isolated runs passed: active-turn recovery after verified orphan
termination, completed lost-response recovery with automatic compaction,
and survivor observation. The active-turn run completed one distinct next
turn; the lost-response run recovered one exact marker without redispatch.
The survivor observation again found the old backend had exited before
reconnect, so `surviving_backend_guard_not_exercised` remains true for that
native run. All reports declared zero external model calls and no access to
the current desktop task, and removed their private scratch state.

The canary now also runs on native Windows. Its disposable process inspector
checks the exact executable path and process creation time before any old-PID
termination, so a reused PID cannot authorize cleanup. An isolated native
Windows identity test passed, as did the controlled live-backend gateway guard
test. Using a hash-verified disposable copy (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
of installed `codex-cli 0.155.0-alpha.16.4`, native Windows active-turn and
completed lost-response hard-crash recovery both passed. The active-turn run
verified one `interrupted` host-history receipt, preserved the prior frontier,
and completed one distinct new turn. The lost-response run recovered one
exact marker without redispatch. Pre-crash decision-observation digests were
preserved exactly across restart; zero *new* process-local decisions were
promoted as recovered history. The old backend exited before the survivor
observation, so the native installed-host live guard was **not exercised**.
Both canary reports stated zero external model calls, no current desktop-task
access, and removal of private runtime scratch.

## Claim ceiling

The live-process rejection is a controlled local process test on Linux and
native Windows, not a native installed-Codex surviving-backend result,
power-loss proof, OS-wide process-identity attestation, or exclusive desktop-task
handover. Both installed-host survivor probes observed backend exit before
reconciliation and did not exercise the live guard. The current desktop task
remains outside ARE control.

## 2026-09-30 process-birth hardening

The guarded gateway now persists a process-birth reference alongside the
backend host name and PID on Linux and Windows. On restart, a live PID with a
different verified birth reference is treated as PID reuse, allowing the
authenticated session to proceed; a matching birth blocks replacement, and
an uninspectable birth fails closed. Older PID-only records remain
conservative. Linux derives the reference from the boot ID and `/proc` start
ticks; Windows uses the process creation time reported by CIM. This is a
local restart discriminator, not a claim of process ancestry or a license to
terminate an unrelated process.

The focused Linux process-birth and session-store tests passed; the native
Windows process-birth test passed. After this change and the separate
[gateway-marker binding repair](G1-GATEWAY-MARKER-BINDING-RECOVERY.md), the
full Linux wrapper suite passed 671 tests with 19 platform skips and no
failures. Disposable installed-host active-turn and completed lost-response
gateway `SIGKILL` canaries both passed against `codex-cli
0.155.0-alpha.16.4`; neither used an external model or touched this desktop
task. The installed backend exited before either resumed gateway, so these
runs did not exercise live-survivor rejection or PID-reuse recovery.
The extracted 2026-09-30 Windows Companion payload later passed both native
installed-host hard-crash modes with the birth reference included. Its old
backend had exited before reconciliation in both runs, so this still does
not establish the live-survivor or PID-reuse transition on Windows.

## Open Questions

- Can an installed-Codex backend survive a gateway crash long enough on any
  supported OS to exercise the live guard under a real pending host request?
- Should the unacknowledged stdio compatibility client be retired or moved to
  a separately verified durable continuity contract before any activation?
- Can a controlled process-reuse fixture exercise the new guarded resume path
  on each supported OS without relying only on injected classification?
