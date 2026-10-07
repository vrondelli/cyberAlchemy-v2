# G1 native Windows client recovery and Companion restart view

Status: bounded construction evidence, 2026-09-27. Authority effect: none.
The TUI is discontinued and was not used. This exact desktop task was not
read, interrupted, resumed, or handed over to ARE.

## Recovery implementation

The Windows hosted-client recovery record is now sealed before disk write
with Windows DPAPI `CurrentUser`. The protected payload contains the resume
token, owned backend-thread IDs, pending intent and accepted-turn receipt.
The clear record is passed to Windows PowerShell over stdin, not as a command
argument or environment variable; the file stores only a versioned sealed
envelope. Reads require a local path below `LOCALAPPDATA`, a regular file,
bounded bytes, successful unprotection, the existing record digest, matching
consumer and matching gateway resume receipt. Plaintext and altered envelopes
fail closed. The existing exclusive writer lock and file flush remain; the
Windows directory flush is not claimed.

This is current-user protection, not isolation from every other process
running as that same user. The PowerShell subprocess cost and ACL/retention
review remain product work. The prior POSIX private-file path remains
unchanged. Microsoft documents [DPAPI CurrentUser](https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection)
and its [same-user scope](https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.dpapidataprotector.scope?view=netframework-4.8.1).

## Exact validation

- Native Windows recovery tests: 3 passed, including sealed token and accepted
  receipt across reopen, second-writer rejection, plaintext/tamper rejection,
  local-parent rejection and validated dead-lock recovery. Eight POSIX-only
  tests were correctly skipped.
- Linux/WSL recovery and hosted-client suite: 33 passed, 2 Windows-only tests
  skipped. This checks that the existing POSIX behavior was preserved.
- The installed desktop app's `codex-cli 0.155.0-alpha.16.4` binary was copied
  into an isolated temporary test directory (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
  The [native canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs)
  passed `--gateway-recovery`: gateway process restarted; client session
  resumed; its owned thread and history were rejoined; the accepted-turn
  receipt was restored; the same request key replayed without a duplicate
  provider dispatch; an unrelated desktop thread was denied. The fixed
  loopback provider made zero external model calls.
- The current Windows Companion was built with Node `26.8.1` and pinned Rust
  `1.98.1` MSVC. Its unsigned, uninstalled installer is
  `dist/ARE_Companion_0.1.0_x64-setup-recovery-20260927.exe`, SHA-256
  `ac4395ccd8695201f076bb2c89436971a98055d30a5f3e9192a8be304372a1b2`.
  The development closure digest is
  `419dccdef2a100b7e8c7d01573f06463c504214e545e85114ea1da1dfecb9555`.
- The [two-phase native WebView2 runner](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-live-gateway.mjs)
  passed against the staged executable. Before restart, Adapters showed the
  real gateway, Threads showed one completed Reasoning State row and verified
  frontier, and Decisions showed two linked process-local evaluations. After
  gateway and hosted-client restart, the dashboard again showed the orb,
  seven destinations, same thread/frontier and independent source postures;
  Decisions correctly showed no records in the new process. The gateway
  runtime epoch rotated. Both phases passed keyboard/focus, appearance,
  legibility, contrast and reduced-motion checks.
- The same staged package passed its bundled Windows feature check (exact
  Node, product health, route/context, Reasoning State, observer imports and
  fail-closed Evolution writer) and the default unconfigured seven-panel
  WebView2 path. Temporary build staging and the copied CLI were removed;
  only the unsigned installer artifact was retained.

## Claim ceiling

This is a disposable native Windows restart and staged Companion-read proof.
It does not establish power-loss durability of the directory rename, an
installed application, an interrupted-turn recovery, durable decision
history, complete host effect interception, exclusive control of this chat,
signing, release, or deployment. A zero post-restart decision count means
only that the new process has no current-process records. The gateway and
client recovery paths remain construction candidates pending broader
security, portability and resource qualification.

## Open Questions

- Can the hosted client recover a turn interrupted before its outcome, with
  exact host-history reconciliation and no unsafe redispatch?
- Should a native helper replace per-write PowerShell invocation while
  preserving current-user protection and bounded startup cost?
- What Windows ACL, retention and power-loss test profile is required before
  packaged read-path enablement and product approval?
- What exact desktop-host writer relinquishment and rollback proof is needed
  before this chat can be called ARE-managed?
