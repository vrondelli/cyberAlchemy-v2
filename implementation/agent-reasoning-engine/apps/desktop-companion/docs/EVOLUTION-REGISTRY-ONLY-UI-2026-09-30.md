# Evolution registry-only Companion view — 2026-09-30

Status: bounded, read-only development evidence. No installer was installed,
no Evolution cycle was admitted or activated, and this desktop task was not
handed to ARE. TUI is discontinued and is outside this interface.

## Change and source boundary

The source-owned `observe.mjs --json --registry-only` mode reads the bundled
candidate-definition registry without selecting, probing, or creating an
Evolution runtime root. Its distinct `candidate-registry-only` projection has
`root_status: not-configured`, no cycles or commits, no ledger digest, and
`authority_effect: none`. A malformed registry remains `registry-invalid`,
not a verified empty ledger. The existing explicit-root observer remains the
only source of verified cycle and commit evidence.

Companion's bounded Tauri bridge now invokes this mode when
`ARE_COMPANION_EVOLUTION_ROOT` is unset or empty. Evolution then shows the
five disabled, unadmitted candidate definitions with cycle and commit counts
as unavailable (`—`), rather than hiding the entire engine behind a generic
empty state. A configured root still uses the existing verified-ledger path.

The implementation is in
`packages/evolution-runtime/src/durable-kernel-v1.mjs`,
`packages/evolution-runtime/bin/observe.mjs`,
`apps/desktop-companion/src-tauri/src/main.rs`, and
`apps/desktop-companion/ui/app.js`. The browser and native Windows tests
exercise the cross-field boundary, not just the status label.

## Verification

- Focused Evolution runtime tests: 21 passed, 2 Windows-only skips on Linux,
  0 failures. Browser dashboard tests: 47 passed. Offline Rust `cargo check`
  and product `doctor --json` passed; doctor reported `0.10.0-rc.1`.
- Native Windows feature probe against the finished staged package passed all
  12 checks, including the registry-only observer, exact bundled Node,
  product health, routing/context decisions, Reasoning State and bounded plan
  context, thread/decision imports, and Evolution SQLite replay. Its thread
  claim remains limited to development-gateway backend threads.
- The staged Windows WebView2 journey passed 36 functional checks without a
  runtime root (37 when screenshot saving was included):
  the orb opened a nonblank seven-panel dashboard, Evolution showed all five
  candidate definitions, and cycle/commit counts remained unavailable. An
  explicit absent-root run passed 35 checks and confirmed no root creation.
- A separate staged WebView2 journey passed 37 functional checks (38 with
  screenshot saving) with a native-created
  one-cycle, one-commit fixture. The expanded row showed its one verified
  `diagnosis-recorded` event type without rendering the event payload. A
  derived `active` disposition was explicitly labelled ledger history, not
  current worker liveness.
- Visual review of both native screenshots found the registry status and
  definitions legible in the first viewport; the verified event progression
  and its claim-limit text were legible after scrolling. Screenshots are at
  `D:\are-ui-review-OWL3r0\evolution-registry-only.png` and
  `D:\are-ui-review-OWL3r0\evolution-verified.png`.
- A joined regression canary on the same new staged executable passed with the
  pinned `codex-cli 0.155.0-alpha.16.4` copy (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`):
  one gateway backend thread, two gateway decisions, Reasoning State frontier,
  per-thread decision navigation, and the new registry-only Evolution posture
  rendered together. It used a fixed loopback Responses fixture, made zero
  external model calls, and did not touch this desktop task. The first canary
  invocation supplied an abbreviated version string and exited before the
  observation; the corrected exact-version invocation passed.
- The permission-denial UI runner initially expected only a file-backed
  `ledgers/commits` fixture, while the current native Windows kernel creates a
  SQLite ledger. The runner now selects exactly one supported ledger form from
  its disposable copied fixture. On this same staged executable, the native
  SQLite deny → dated historical view → access restored journey passed 40
  checks. The original fixture was unchanged; the runner restored the copied
  file's ACL during cleanup.

The new unsigned NSIS installer is
`D:\are-companion-evolution-registry-20260930.exe` (SHA-256
`d6c5e02997b21cb9927f51c7342f8e01c1b41f3d39fd4f9355d0fd353579f1cc`).
Its retained, uninstalled stage is `D:\acw-ggmlQ0`: 807 package files,
closure digest `aba0a7efaeec3ba6f91942716e25061315dd6056a9639356de7ccf1159275824`,
Core closure digest `6673ca5dbb67c33351d60c74bd1c082a776f97fb5955db1af9a3e45c004c11dd`.
Packaging is not installation or release acceptance.

## Claim ceiling

The view exposes bundled candidate definitions and, only from an explicit
verified ledger, bounded historical cycle evidence. It does not establish a
running Evolution worker, objective-level outcomes, admission authority,
live host-task control, or installed-package behavior. The gateway improvement
candidate inbox remains an independent, unconfigured source in these tests.
The Linux host cannot link a native Tauri test binary with its current missing
WebKitGTK/GTK system libraries; offline Rust check and native Windows WebView2
tests were used for this slice. Repository-wide Rust formatting is already
drifted, so no whole-file formatter rewrite was applied.

## Open Questions

- Which explicit Evolution runtime root, if any, should an installed desktop
  Companion observe, and who owns its privacy and retention boundary?
- What source-bound, privacy-reviewed objective and outcome projection can
  support the next Evolution drill-down without confusing recorded activity
  with a currently running worker?
- Does the installed package pass the same lifecycle, permission-denial,
  accessibility, and normal-desktop resource checks?
