# Evolution coordination in the Companion

The read-only Evolution view now includes a counts-only coordination summary from a verified durable ledger: admitted phases and planned, ready, leased, completed, and blocked work items. A candidate-only or unverified source provides no coordination projection. The dashboard explicitly labels a lease as a recorded claim, not proof of a live worker. It exposes no work or worker identifiers through this new summary and adds no operational control.

The projection is produced by `packages/evolution-runtime/src/durable-kernel-v1.mjs`, checked by the Tauri bridge in `apps/desktop-companion/src-tauri/src/main.rs`, and rendered by `apps/desktop-companion/ui/app.js` and `dashboard.html`. The Windows UI harness asserts both registry-only and verified-empty coordination states. This work does not target the discontinued TUI.

## Validation

- Evolution observer and dashboard unit suites: 70 passed, 2 Windows-only skipped on Linux; separate coordination protocol suite: 6 passed.
- Tauri `cargo check --offline` passed. `cargo fmt --check` is not a clean repository baseline: it reports extensive pre-existing formatting differences across the untracked `main.rs`; no bulk formatting was applied.
- An unsigned Windows NSIS installer was built from current source with the native orb: `D:\ARE_Companion_0.1.0_x64-evolution-coordination-20260930.exe`, SHA-256 `84ec05d0971b28e64eb6bb383eb6b964c379b9c7a468ade6b43a13f31851a9ce`. The builder reported distribution closure `6be2919ebf0983c571064e9eb011ebc4cfb74f93aa61b315629e0a4087630369` and core closure `d111d1e3fc572df3c39bd4112f2ef2dcf1d315930f6dcc1f305cca3fcb6418a7`.
- NSIS integrity passed for 823 files. It was extracted to `D:\are-nsis-evolution-coordination-h2I1Wxq4` without installation; the extracted observer source matched this checkout. The bundled Windows ARE feature probe passed all 13 checks.
- The extracted dashboard passed its seven-panel registry-only journey and its verified-ledger journey. The latter asserted the new coordination row, verified cycle event progression, orb appearance, navigation, and evidence links. A visual capture is at `D:\are-evolution-coordination-20260930.png`.
- A separate native Windows fixture built a synthetic coordination ledger with one admitted phase, one planned item, and one leased item. The same extracted dashboard passed the seven-panel journey with `--evolution-coordination-fixture`: it rendered `Planned 1 · Ready 0 · Leased 1 · Completed 0 · Blocked 0`, showed `phase-admitted` and `work-leased` as verified event types, and did not expose the private task or worker IDs. The fixture is produced by `scripts/create-evolution-coordination-fixture.mjs`; the visual capture is at `D:\are-coordination-nonzero-20260930.png`. The UI test ran from checkout source against the previously extracted package, so this result does not imply the new test script is shipped in the installer.

These are isolated development-package results, not installation, production deployment, a live Evolution worker, or current-chat control by ARE.

## Disposition wording follow-up

The nonzero coordination screenshot exposed a copy mismatch: its only cycle had the correct `undetermined` derived disposition, but the static footer described a derived `active` disposition. The source dashboard now says that any derived disposition summarizes recorded events and does not establish current execution. `dashboard.test.mjs` checks the generic claim, and the native Windows UI harness checks it alongside both verified-ledger fixtures. The source dashboard suite passed 48/48 after this change. The earlier installer and screenshot above predate the wording change.

The corrected-copy build produced the unsigned NSIS candidate `D:\ARE_Companion_0.1.0_x64-disposition-20260930.exe`, SHA-256 `b464c49fd90cf2e387111662b61576cea0bbf52395da03ee6dfc9b2b967ef02a`. The builder reported distribution closure `c3f2c7430968f1d3d6f191afeb417cb7e15ed845fcdab0eaedf9536bbc77d952` and core closure `5e618d022ed1f71136d77c68cf6834ae4a619a2a1e1c215c13952a81157af9b9`. NSIS integrity passed for 823 entries; the installer was extracted without installation to `D:\are-nsis-disposition-iaST2G`. Its bundled ARE/Node feature probe passed 13/13 checks, and its native WebView2 UI journey passed 40/40 checks against the isolated nonzero coordination fixture. The saved screenshot `D:\are-coordination-disposition-20260930.png` visibly shows the cycle as `undetermined`, the counts `Planned 1 · Ready 0 · Leased 1 · Completed 0 · Blocked 0`, and the corrected claim that a derived disposition does not establish current execution. No TUI or terminal-UI path was present in the extracted payload. This is an extracted, uninstalled development-package result, not installed-app validation, a live worker, release approval, or current-chat control by ARE.

## Open Questions

- Native Windows nonzero-count display is covered for an isolated synthetic ledger. It does not prove a real worker is alive, a phase is admitted for production, or that the tested fixture is part of the release package.
- Windows hosted command effects remain fail-closed because the pinned host has no verified bounded-output execution path. This UI projection does not change that integration boundary.
- Physical Wayland drag and placement of the Linux native orb remain unverified; the Windows package result does not establish Linux parity.
