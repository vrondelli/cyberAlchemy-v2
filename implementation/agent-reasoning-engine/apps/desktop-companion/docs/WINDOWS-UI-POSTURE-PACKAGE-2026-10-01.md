# Windows source-bound adapter cue package — 2026-10-01

Status: unsigned, installer-extracted development candidate; not installed or released.
Authority effect: none. The TUI is discontinued and is not a UI or fallback.

## Exact package

- Installer: `D:\are-win-focus-YDTVzk\ARE_Companion_ui_posture_20261001_x64-setup.exe`;
  SHA-256 `a9ae2ea7661b2861a4d40c37914830e64ad28d5bc189d24fe35c42d92e4b6ea4`.
  Retained build stage: `D:\are-win-focus-YDTVzk\acw-96PsXb`.
- The builder used bundled Node 26.8.1, reported 813 ARE closure files,
  distribution digest `8c87cb2ba7ec26ec48af47d63a79a39a84f248a0984f87dbee5473c53ed2ad66`,
  and Core digest `d85d59518a60908a592187c15c75911c79f6fbe7fdc1bb70bb63b4e1f2f69ebf`.
  It bundled the native floating orb as a candidate.
- The staged UI file hashes match current source: `dashboard.html`
  `cb25b044976362a7af632baf4a73e849380df04eacc94c5c264e83970649cb3d`,
  `app.css` `a7926568dab6909dce17213f78fee329772281504ffded834c75d89ac53e1b41`,
  and `app.js` `a83b9fbbf1cc738219f93273506380bb70bcdfaead2e4ed1b3302085460389ba`.
- Independent 7-Zip 26.00 archive test and extraction both returned `Everything is Ok`
  for 824 files. Extracted directory:
  `D:\are-win-focus-YDTVzk\extract-ui-shrphs`. Its dashboard executable
  SHA-256 is `366e64cc5cd0d21890367e255cbd8a7795aea7178d938deec326b769ff7dfe5a`.

## Validation

- Source dashboard unit tests: 50/50 pass. A source browser journey on Windows
  Edge passed its navigation, accessibility, observation, Evolution, and
  adapter-cue checks without uncaught page errors. Its cue changes from
  same-session ready to neutral observed, stopped, or unavailable as evidence
  changes.
- The **installer-extracted** WebView2 dashboard-only smoke rendered all seven
  panels and a passed product diagnostic. The full native smoke was nonblank
  and passed the source-bound sidebar check with no adapter configured; its
  screenshot is `D:\are-win-focus-YDTVzk\ui-new-overview.png`.
- The extracted live-gateway fixture journey passed 40-thread pagination,
  per-thread Reasoning State, decision navigation, gateway-loss downgrade,
  Appearance persistence, keyboard focus, high contrast, and reduced motion.
  The sidebar remained neutral for a path merely observed, despite connected
  aggregate links. Screenshots are `ui-new-adapters.png` and
  `ui-new-threads.png` in the same test directory.
- The exact extracted package, adjacent Node and ARE resources, and a pinned
  disposable `codex-cli 0.155.0-alpha.16.4` passed an isolated guarded Plan
  fixture turn: the authenticated hosted input answer reached the model, and
  the read-only Companion saw the same backend thread and verified completion
  frontier. There were two fixed-loopback provider requests and zero external
  model calls. A separate no-turn managed smoke asserted the sidebar's ready
  same-session path, parent-heartbeat guard, Windows sandbox probe, and
  supervised stop; it made zero model calls. Both returned
  `current_desktop_task_control: false` and `installed: false`. A process query
  afterward found zero executable processes from this extracted package.
- A follow-on exact-package canary completed one guarded Plan-input turn,
  hard-stopped only its manager-owned gateway, observed fail-closed supervised
  teardown, and launched a fresh manager against the **same private state**.
  The new hosted client retained the exact thread ID, explicitly rejoined it,
  returned one completed response in history, and the new Companion observed
  the same thread reference and completion-frontier digest. The loopback
  provider saw only the original two requests: zero replay model requests.
  The second managed launch also stopped its owned processes; a process query
  again found zero package-owned survivors. The paused no-turn baseline passed
  after the canary harness refactor. Initial exploratory attempts timed out:
  the first omitted the required explicit thread rejoin, and the next read
  `messages` from the API envelope instead of its `value`. Correcting those
  test-only errors required no runtime change.

## Claim boundary

The green sidebar dot now means only an observed, ready **same-session adapter
path**. It does not mean this Codex task is ARE-controlled, that model ingress
is safe for arbitrary providers or tools, or that the product is deployed.
Product diagnostic, gateway path, Reasoning State, Decisions, and Evolution
remain separate read-only evidence sources. The installer was extracted for
testing, not installed.

## Open Questions

- The completed-turn crash/relaunch path above is proved for one fixed-loopback
  Plan fixture. An **in-flight** turn at gateway death still needs a joined
  fail-closed recovery test that distinguishes unknown outcome from completion
  without replaying model or hosted effects.
- Linux must receive a corresponding package-level check for this source UI
  change. Normal installed-product lifecycle, provider compatibility, and
  sustained resource/accessibility acceptance remain unverified.
