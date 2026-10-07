# Windows source-diagnostics development probe

Status: bounded development evidence, 2026-09-26. This is not installer,
release, exact-current-task, or security acceptance.

The unsigned NSIS output is
`../dist/ARE_Companion_0.1.0_x64-setup-source-diagnostics-20260926.exe`
(29,306,275 bytes; SHA-256
`ccff4e958e30707c8a231fc8408f149ff1dc43be47112821f6060485e85d7796`).
It was built with native Windows Node 26.8.1 and the pinned Windows Rust/Tauri
toolchain. Its staged source contained 740 development-closure files (digest
`6f44fde4b22d98a74385eae5533c1dac494f59a736975b14349554638e1e69a5`);
the staged product-health core closure digest was
`0c51075d4e29eeb1acfe92d65211db9c21a49824d750e89191ecac3fa5b204c3`.
The build retained its disposable Windows stage at
`C:\Users\vlad_\AppData\Local\Temp\acw-nb7wjz` for review. No installer was run.

The staged resource feature probe passed eight checks: bundled Node and
product-health, route/context decisions, Reasoning State runtime/plan-context,
and backend thread/decision observation-client loading. The native WebView2
UI probe launched the staged `are-companion.exe` in an isolated test profile:

- Default: 29 checks passed, including orb click, nonblank dashboard, all seven
  panels, six independent diagnostic postures and explanations, appearance
  persistence, keyboard focus, contrast, motion, and relaunch.
- One live local gateway fixture: 33 checks passed, including Windows pipe
  observation, backend-thread Reasoning State, thread-specific decisions,
  gateway loss, and independent product-health posture. This is a test gateway,
  not proof that the current desktop task is ARE-managed.
- Separate gateway improvement-candidate fixture: 29 checks passed with one
  verified candidate while the Evolution ledger remained unconfigured.
- Verified one-cycle Evolution ledger plus that candidate fixture: 29 checks
  passed. The ledger was created on the WSL filesystem and read via a Windows
  UNC path; the two sources stayed separate in the Windows UI.

The source dashboard suite passed 22/22. The isolated Chromium navigation
journey passed 32 checks. These tests do not verify installer execution,
installation, upgrade/rollback/uninstall, native endpoint ACLs, exact host
task identity, or a production resource budget.

## Portability finding

Creating the same disposable Evolution ledger directly under the Windows
temporary directory failed at `fsyncDirectory` in
`packages/evolution-runtime/src/durable-kernel-v1.mjs` with `EPERM` from
`fsyncSync` on the directory after the writer lock was created. Windows
read-only observation of an already verified WSL ledger passed; native Windows
durable writes are **not** verified. The failed fixture root is retained inside
the disposable build stage for diagnosis. Do not bypass directory sync and
continue to claim the same crash-durability guarantee without an explicit
platform durability contract and recovery test.

The platform options are narrower than simply ignoring `EPERM`:
[Microsoft's directory-handle list](https://learn.microsoft.com/en-us/windows/win32/fileio/obtaining-a-handle-to-a-directory)
does not list `FlushFileBuffers` as a supported directory-handle operation;
[volume-wide flushing](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)
requires administrative privileges; and
[`MOVEFILE_WRITE_THROUGH`](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexa)
only explicitly guarantees a flush for a move implemented as copy-and-delete.
A native writer could use an independently specified Windows storage protocol
with write-through file and metadata operations, but that protocol and its
crash-recovery evidence do not yet exist. Until then, native Windows ledger
writes must fail before creating a writer lock, while read-only observation
remains available.
The kernel now enforces that fail-closed preflight for native Windows Node;
this prevents new partial writer roots, but it does not implement a Windows
durable writer or repair the previously failed disposable fixture.
The native Windows preflight test passed 1/1 and verified that neither root
nor lock was created. The Linux durable-kernel suite passed 18/18 applicable
tests (one Windows-only check skipped). Native Windows `observe.mjs` still
reported one verified cycle and commit from the WSL-created fixture.

## Guarded-source rebuild

The follow-up unsigned development package is
`../dist/ARE_Companion_0.1.0_x64-setup-windows-writer-guard-20260926.exe`
(29,350,544 bytes; SHA-256
`627bb1781c85c6e09a1746a2ef4a084d1bc0411a84179c63f99908a47e486dfc`).
It retained the disposable stage at
`C:\Users\vlad_\AppData\Local\Temp\acw-pWJs4A` and staged 772 development
closure files (digest
`49b846851ed3115b00ee0dfd5e480e8b62bb08d9fc0ee09c8b6a1b422b48cb01`);
the core closure digest was
`efaad6894f06a72cf71ff9125772f5f70e9e70e4eba2e160b2db14eed1056bff`.
The staged Windows package feature probe passed ten checks, including the
native-writer no-root guard and preserved read-only observer. Its staged
WebView2 executable passed the live-gateway fixture (33 checks) and the
verified-ledger plus separate candidate-inbox fixture (29 checks). The setup
executable was not run.

The broader Linux Evolution suite was also attempted: 177 passed, 8 failed,
and 1 Windows-only test skipped. All eight failures are in the H-EN benchmark
import group and report source drift for
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md`.
That source and its historical digest binding were not changed for this
writer guard; the broad suite is not green and must not be counted as such.

## Decision-diagnostic UI follow-up (2026-09-27)

The Decisions page and Evidence row now share the filtered observation posture.
If the selected thread and decisions came from different gateway epochs, both
say `Source changed` instead of letting Evidence claim `Observed`. A bounded
filter miss says `No matching records` and explains that older process-local
records may be omitted. The isolated, network-disabled Chromium journey passed
34 checks, including both regressions. The Codex gateway package suite passed
379 tests with one skip; these checks do not establish control of this desktop
task.

The current-source unsigned development installer is
`../dist/ARE_Companion_0.1.0_x64-setup-decision-diagnostics-20260927.exe`
(29,350,420 bytes; SHA-256
`74ffa1d5ba76ba411762a5f72f6ee6d45c0a8f63dba0ba9eb5b0ca6f9bea6c7d`).
The Windows build retained `C:\Users\vlad_\AppData\Local\Temp\acw-fvebRA`.
Its 772-file development closure digest was
`49b846851ed3115b00ee0dfd5e480e8b62bb08d9fc0ee09c8b6a1b422b48cb01`;
the core closure digest was
`efaad6894f06a72cf71ff9125772f5f70e9e70e4eba2e160b2db14eed1056bff`.
The staged feature probe passed 10 checks. The staged native WebView2 executable
passed 29 default UI checks, including a nonblank dashboard and all seven
panels. The separate live-gateway fixture passed 33 checks, including Windows
pipe observation, backend-thread Reasoning State, thread-specific decisions,
and clearing live postures after gateway loss. The new setup executable was not
run or installed; the native UI probe did not exercise the new filtered-decision
source-change fixture, which is covered by the isolated browser journey only.

## Evolution event-progression UI follow-up (2026-09-27)

The Evolution source observation now exposes only the verified event count and
up to eight recent event **types** per cycle. The dashboard expands a cycle to
show that bounded chronology, with an omitted-earlier count when truncated. It
does not expose event payloads, imply an active worker, or enable an effect.
The focused durable-kernel suite passed 19 applicable tests with one
Windows-only skip. The isolated Chromium journey passed 36 checks, including
ten-event truncation and rejection of an internally inconsistent observation.
The Rust bridge passed `cargo check --offline`.

The resulting unsigned development installer is
`../dist/ARE_Companion_0.1.0_x64-setup-evolution-progression-20260927.exe`
(29,351,340 bytes; SHA-256
`e7f5a170d392df708d4f1f3cb10aa788e5fd05fa446f94ac51f321075839afaa`).
The Windows build retained `C:\Users\vlad_\AppData\Local\Temp\acw-CGIHwc`.
Its 772-file development closure digest was
`3aa7b881e41d0a6a6f6bca1d68221ca199c7c0985c264f76cc97f6326814d872`;
the core closure digest was
`a219b15e2c68e140e4b35b9c65abb27c96b6e190c1a1daaa6641ec4f6c350277`.
The staged Windows feature probe passed all ten checks. The staged native
WebView2 executable passed 29 default checks and 30 checks against a
WSL-created, one-event verified Evolution ledger, including opening the cycle
details and seeing `Event 1 · diagnosis-recorded`. The executable ran in an
isolated test profile; the setup executable was not run or installed.

The broader Evolution suite remains non-green because eight H-EN benchmark
tests detect drift in the unrelated user-owned
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md`.
No benchmark source or historical digest was altered to force a pass.

## Joined Decisions/Adapters epoch guard (2026-09-27)

The dashboard source now checks the decision snapshot's gateway epoch against
the current selected Adapter reading and downgrades an already displayed
Decision when a later Adapter read changes epoch. A missing decision epoch is
incompatible. The Evidence row follows the downgraded posture, so neither
read order leaves an old `Observed` claim. The 22 dashboard unit tests passed;
the isolated Chromium journey passed 40 checks, including the two read orders
and missing-epoch case. This source edit happened **after** the Evolution
event-progression Windows build above: no newly packaged or installed Windows
artifact contains this guard yet.

## Open Questions

- What Windows-specific write/sync primitive and crash-recovery evidence can
  support the durable Evolution kernel's existing commit guarantee?
- Which exact host-task activation, access-control, and installer lifecycle
  checks must precede enabling the development observation endpoint by default?
