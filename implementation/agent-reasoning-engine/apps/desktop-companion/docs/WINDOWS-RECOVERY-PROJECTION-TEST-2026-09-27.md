# ARE Companion staged Windows recovery-projection check

Status: bounded development evidence, 2026-09-27. The TUI is discontinued and
not part of this test. No installer was run, no app was installed, and this
Codex desktop task was not handed over to ARE.

## Current-source package and test

- Native Windows Node 26.8.1, pinned Rust 1.98.1 MSVC, and Tauri built an
  unsigned NSIS installer from the current checkout. The builder's product
  health/closure check passed before compilation.
- Output: `dist/ARE_Companion_0.1.0_x64-setup-recovery-projection-20260927.exe`,
  29,376,777 bytes, SHA-256
  `f7b2ac1f56e5317214e08cb46dbd8a37ac181df264255145b9524fb3b1ada794`.
  The isolated staging directory was retained for inspection and testing.
- `test-windows-features.mjs` passed against the staged resources: exact Node,
  product health, route/context decisions, Reasoning State plan context,
  gateway observer imports, and fail-closed native Windows Evolution writer.
- `test-windows-ui.mjs --adapter-live --confirmed-recovery` passed against the
  staged executable in an isolated WebView2 profile. Its local gateway fixture
  checkpointed a content-free turn intent, exact client marker observation,
  and a durable recovered-dispatch record for the same backend thread. The
  Threads page rendered one confirmed recovery in both aggregate and thread
  detail, explicitly distinguished it from a completion frontier and
  desktop-task activation, and continued to label this chat's control
  unverified. The orb, nonblank seven-page dashboard, navigation, source-loss
  behavior, preferences, keyboard flow, and relaunch checks also passed.
- `test-windows-live-gateway.mjs --hosted-pending-recovery` then passed a
  two-phase WebView2 journey against the same staged executable and the pinned
  installed `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
  A disposable read-only host turn used three fixed loopback provider
  requests, zero external model calls, and never touched this desktop task.
  The runner suppressed one hosted turn-start response, restarted the gateway
  and backend, recovered the durable hosted pending intent from the exact
  host-history marker, and observed one confirmed dispatch recovery in the
  private gateway projection and the staged Threads page. No unknown dispatch
  remained; the restarted process had zero Decisions. The first run revealed
  a stale test assertion that expected a decision row in this new phase. The
  assertion was corrected and the entire two-phase runner passed on rerun.
- The existing two-phase `--gateway-recovery` WebView2 path also passed after
  the runner change. The direct `--unknown-acceptance-marker-probe` passed on
  the same pinned Codex binary. The full wrapper suite passed 402/407 with
  five skips; the focused Threads/Companion suite passed 36/36.

## Task-session boundary

The bounded context pack selected the whole-UI plan, Threads contract,
host-marker evidence, native canary, WebView runner, and WebView test. The
selected option reused the existing authenticated canary observation pipe and
staged executable; no new host integration or activation path was introduced.
The repository route remained candidate `CA2-ROUTE-IMPLEMENT` under the D65
construction ceiling. This completes only the real-host staged recovery UI
proof, not the parent integration or seven-feature UI plan.

## Claim ceiling

This proves current-source native WebView2 rendering of confirmed gateway
dispatch recovery both with a controlled local fixture and with one pinned
installed-Codex disposable host/gateway run. It does not prove installed-package
operation, signed distribution, power-loss durability, recovery of an arbitrary
unknown turn, exact desktop-task handover, or universal effect interception.
The native Windows Evolution durable writer remains unavailable; its read-only
observer is separate.

## Open Questions

- What installed-package lifecycle, native access-control, and broader
  real-host failure cases are required before enabling this observation path?
- Can the exact desktop task hand over one exclusive ARE writer with complete
  history, approval, recovery, and rollback coverage?
