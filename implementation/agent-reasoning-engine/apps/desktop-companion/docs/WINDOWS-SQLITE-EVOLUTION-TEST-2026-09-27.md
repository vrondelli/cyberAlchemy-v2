# Native Windows SQLite Evolution and staged Companion probe

Status: bounded development evidence, 2026-09-27. The TUI is discontinued.
This check covers the desktop Companion. It is not installed-app, power-loss,
live-worker, or exact Codex-task control acceptance.

## Source and package

- The Evolution kernel now selects the immutable SQLite WAL/FULL ledger on
  Windows and the file ledger on Linux. The native Windows kernel tests passed
  21/21, including writing, read-only observation/CLI, replay, mixed-root and
  corruption rejection, and injected crash recovery. The focused Linux kernel
  and store tests passed 24/26 with two Windows-only skips.
- The Windows build initially failed because the Visual Studio developer shell
  omitted SDK `LIB` and `INCLUDE` entries despite an installed SDK. The builder
  now discovers a complete installed SDK and supplies those paths only to the
  build process. The corrected build completed with native Node 26.8.1 and
  pinned Rust 1.98.1 MSVC.
- Unsigned NSIS output:
  `C:\Users\vlad_\AppData\Local\Temp\ARE_Companion_0.1.0_x64-setup-sqlite-ledger-20260927.exe`
  (29,399,912 bytes; SHA-256
  `7b58964a7dfc301b34cb0ff79b96acb5ca0db2e2499efb68c34bf31c71c9b277`).
  Retained test stage: `C:\Users\vlad_\AppData\Local\Temp\acw-o4gHCf`.
  Development closure: 782 files, digest
  `f565da4fbea71e8cdd22d0410492805ba05c0c2c2b5f1f32268aa1c438a51cd5`;
  core product closure digest
  `ce919ada8ff22a523e182a3bbe04b61b2488fda950d1e8eddf5ada55ddacb4a1`.
  The setup executable was neither run nor installed.

## Checks and failure observation

The staged resource feature probe passed eleven checks, including a real
native SQLite write, read-only observer, reopen, and exact replay. A separate
disposable Windows fixture created one verified cycle and one commit under the
Windows temporary directory. The first isolated WebView2 UI probe opened a
nonblank dashboard but failed because the independent ARE product diagnostic
timed out. An immediate second isolated probe passed 34 checks: floating orb,
all seven destinations, product diagnostic, the verified native-created
Evolution cycle and event progression, six independent evidence postures,
appearance persistence, keyboard navigation, and source links. This proves a
staged UI read path, not reliable first cold-start behavior.

The full Linux Evolution suite remains non-green: 193 tests, 183 pass, 8 fail,
2 skip. All eight failures are H-EN benchmark-source drift in unrelated
user-owned work; no benchmark source or historical digest was changed here.
Physical power-loss, installed-package lifecycle, exact host-task activation,
and live Evolution execution remain unverified.

## Diagnostic-timeout UI follow-up

The dashboard now retries a product diagnostic exactly once when the native
bridge reports `ARE diagnostic timed out`. It stays in `Reading` without a
current health claim during the retry. A second timeout becomes `Unavailable`;
other errors do not retry. The dashboard source suite passed 30/30, including
deterministic timeout-then-success, two-timeout, and non-timeout cases. The
isolated Chromium navigation journey passed 56 checks with no page errors.

A fresh unsigned development installer was built at
`C:\Users\vlad_\AppData\Local\Temp\ARE_Companion_0.1.0_x64-setup-diagnostic-retry-20260927.exe`
(29,396,245 bytes; SHA-256
`28836fcb0e8d532b5bc3dd1461593928860fabd325615cb02cbdbdfe3e03e100`).
Its retained test stage is `C:\Users\vlad_\AppData\Local\Temp\acw-Qo6XyE`.
The staged resource feature probe passed eleven checks; isolated WebView2
probes passed 34 default and 34 native-created-ledger checks. These runs did
not force a timeout inside the packaged WebView2 host. A subsequent isolated
native WebView2 probe used the retained development build and a temporary
test-only ARE entry override to make the first `doctor` call exceed the native
15-second limit. It passed 36 checks: the dashboard remained in `Reading ARE…`
without claiming current health, then exactly one retry returned a real ARE
diagnostic and populated the dashboard. The override existed only in the
disposable test profile; no production fault-injection switch was added. This
proves bounded UI recovery from that diagnostic timeout, not the cause of the
original cold-start delay. The installer was not run or installed.

## Open Questions

- Why did the first cold WebView2 diagnostic exceed its 15-second bound while
  the isolated rerun passed, and what cold-start budget should the product use?
- What native power-loss and installed-package checks are required before this
  SQLite-backed path becomes a release claim?
- Which configured Evolution root and access policy should the installed
  Companion use outside an explicit development fixture?
