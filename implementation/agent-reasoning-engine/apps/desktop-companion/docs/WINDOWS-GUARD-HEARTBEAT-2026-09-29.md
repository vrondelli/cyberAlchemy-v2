# Managed model-wire guard heartbeat — Windows candidate, 2026-09-29

Status: bounded development evidence; authority effect: none. The TUI is
discontinued and was not built or tested. The current Codex desktop task was
not handed over to ARE.

## Change and boundary

The managed parent now sends a one-field, private IPC heartbeat to its gateway
while its model-wire guard listener is open. The gateway records the receive
time and exposes only a bounded status through the existing authenticated,
read-only adapter observation socket. A heartbeat older than three seconds is
`not-observed`; an unmanaged gateway is `not-declared`. The Companion Adapters
view distinguishes these states from a fresh `parent-heartbeat-observed` and
marks a guarded launch `unverified` when the heartbeat is missing. The gateway
ready record is bound to the parent's expected-guard setting.

This is parent/listener liveness evidence, not a provider probe or proof that
all host tool and effect paths are intercepted. Neither the heartbeat nor the
gateway observation identifies or controls this desktop task. Normal Windows
managed turns remain paused; guarded text-only turns are still opt-in.

## Verification

- Focused Node/UI tests: 74/74 passed, covering heartbeat freshness, no-guard,
  legacy observation, Companion downgrade, guard listener closure, and the
  existing adapter and guard boundaries.
- Full Codex wrapper suite: 677 tests, 661 passed, 16 skipped, 0 failed.
- Native Windows build: pinned Node 26.8.1 and Rust 1.98.1 MSVC compiled the
  Tauri application and produced an unsigned NSIS bundle. The Linux Cargo
  check was unavailable because this WSL environment lacks `pkg-config` and
  GTK/WebKit development libraries; the native Windows compilation passed.
- Staged Windows feature probe: 11/11 checks passed, including ARE product
  health, route/context, bounded Reasoning State and Evolution SQLite replay.
- Exact staged WebView2 managed-session smokes: both guarded and default-paused
  modes passed. Each rendered the floating orb and seven-panel dashboard,
  observed a connected client and initialized backend at the same gateway,
  reported desktop-task control `unverified`, and supervised the Companion's
  exit. Guarded mode showed `parent-heartbeat-observed` and text-only turn
  execution enabled; default mode showed `not-declared` and turn execution
  paused. Both made zero model calls and did not install the package.

## Exact NSIS payload follow-up

The same installer was opened as an NSIS-3 Unicode archive with a disposable
7-Zip binary unpacked under `/tmp`; 7-Zip was not installed system-wide. Its
815-file, 122,267,917-byte payload extracted to
`D:\are-companion-payload.JZmE2c` with `Everything is Ok`. The extracted
`are/` resource tree compares byte-for-byte with the retained build stage, and
both copies of bundled `node.exe` have SHA-256
`5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.
The extracted executable SHA-256 is
`0680aecb33fa49dabac4a2a852c97d4a9afd4cd9c2fae86e3efea785048f6170`;
it differs from the pre-bundle stage executable at only the three-byte Tauri
bundle-type marker. Neither the extracted resource tree nor the product path
contains the discontinued `cyberalchemy-tui` implementation.

The **extracted** Node and ARE passed all 11 bundled-feature checks. The
extracted executable passed the 36-check WebView2 journey, including a
nonblank orb/dashboard, seven destinations, keyboard focus, appearance
relaunch, and distinct not-configured evidence states. Package-only managed
smokes using the extracted executable, Node, launcher, gateway, and hosted
client passed in both modes: guarded showed `parent-heartbeat-observed` and
text-only turn execution enabled; default showed `not-declared` with turn
execution paused. Both rendered the same gateway path, made zero model calls,
kept current-task control `unverified`, and supervised process cleanup.

A separate debugger-disabled ten-second orb-idle sample observed seven
processes, 142,733,312 summed private bytes, 311,869,440 summed working-set
bytes, and zero CPU seconds over the sample interval. This short run is not a
numerical resource-budget pass or a leak verdict.

Extraction validates package contents and extracted-runtime behavior, **not**
NSIS installation, Windows registration, shortcut/uninstaller lifecycle,
upgrades, installed ACLs, WebView2 bootstrap, or rollback. The installer was
not run or installed.

## Exact candidate

- Unsigned, uninstalled installer: `D:\are-companion-guard-heartbeat-20260929.exe`
  (29,568,806 bytes; SHA-256
  `5b49f1e40d33fa11d8aa61d9fc6c6250113e7daffe258e8237c11d875b9166e7`).
- Retained stage: `D:\acw-vcSL3r`; staged executable SHA-256
  `1e4a8adaf92debee285d73b937200ec8e8b6ec92039d4e1fe478b5b2a3b0ea31`.
- Development distribution: 807 files; closure digest
  `83ee3dde78eee54dacd2065e885507ae38ba18e3aefaa729e283fe7752bf603f`;
  Core closure digest
  `f05be250bed9d8c082a4bcf996586640ab06053db2e42fa13670ef2f1050b91a`.
  The staged managed launcher and gateway files matched checkout SHA-256 at
  test time.

## Open Questions

- Can a real authenticated provider turn be exercised through this exact guard
  without expanding its tool catalog or claiming untested response variants?
- What supported host protocol can provide exact-task identity, quiescence,
  exclusive writer handover and rollback for the already-running desktop task?
- What installed-package and numerical resource evidence is needed before
  product approval or release consideration?
