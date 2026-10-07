# Windows hosted-input provenance in Adapters

Status: bounded current-source development evidence, 2026-09-28. The TUI is
discontinued. This change does not activate the current desktop task, unpause
Windows model entry, establish human identity, approve effects, or release an
installer.

## Product behavior

The gateway's authenticated adapter observation now exposes only whether a
hosted-input attestation key is configured in that gateway process. The
Companion Adapters screen shows `configured`, `not-configured`, or `unknown`
for an older observation source. It never receives or displays the key. This
status is separate from connection/readiness, actual request verification,
model-entry ingress, and exact desktop-task control. A configured key does not
prove that any particular request was attested or came from a physical person.

The Windows command-hook transport remains unsuitable for strict tool
enforcement on the selected installed host: an isolated canary found all
three callback stdin handles to be character/TTY handles with zero input
chunks; see [native hook evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-NATIVE-HOOK-DENIAL.md).
The managed gateway continues to pause model-entry methods.

## Verification

- Focused adapter observation and dashboard source suites: 51/51 passed.
  The gateway-to-client test covered configured and unconfigured key states;
  malformed and legacy states do not become configured. Native Windows
  dashboard source tests passed 41/41.
- The complete wrapper package suite passed serially: 565 passed, 14 platform
  skips, zero failures. A concurrent run had two timeout failures; both passed
  when rerun individually, and the serial run covered the full package.
- Companion Rust `cargo check --offline` passed with the repository toolchain.
- A fresh unsigned Windows NSIS build at
  `D:\are-companion-attested-jAYjg8\ARE_Companion_provenance_ui_20260928.exe`
  has SHA-256 `2f160ac2fa013d0da1f3be13ead50a395a04866bb23aa96615856db4e53bebdd`.
  Its retained stage is `D:\are-companion-attested-jAYjg8\acw-IrrEdm`.
  The staged runtime passed the 11-check bundled feature probe; its native
  WebView2 default journey passed with orb, nonblank dashboard, seven panels,
  keyboard and appearance flows.
- The native managed-session WebView2 smoke used a hash-verified disposable
  copy of the installed Codex executable. It showed gateway `running`, backend
  `ready`, hosted client `connected`, proof key `configured`, model ingress
  `paused`, and desktop-task control `unverified`. It made zero private or
  external model calls, supervised shutdown, and did not install the package.

## Open Questions

- Verify the installer by extraction and installed-package startup before any
  release claim. The staged binary is not an installed-package test.
- A key-presence observation cannot prove a specific browser submission or
  physical user identity. The hosted client and gateway verify individual
  request MACs separately.
- Complete host effect interception and exact current-task handover remain
  separate integration gates; this UI status cannot satisfy either one.
