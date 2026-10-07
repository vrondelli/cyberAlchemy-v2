# Evolution definition clarity — 2026-10-02

Status: bounded read-only UI construction evidence. Authority effect: none.
Parent outcome: [whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md),
Evolution feature 05; the feature journey is in [the UX brief](ux/EVOLUTION.md).

## Change and source boundary

The Evolution registry view now shows a plain-language purpose for each of the
five known cycle kinds, its source-owned admission/enabled status, and its exact
registry reference. Unknown kinds remain explicitly unexplained, including
prototype-shaped keys such as `constructor`; the renderer never invents a
purpose. These descriptions are UI help text, not admission or worker state.

## Verification

- Dashboard source tests: 55/55. Chromium seven-page journey: PASS, including
  known and unknown cycle-definition presentation. Standalone Core product:
  11/11; distribution: 2/2.
- A short-path native Windows build produced an unsigned NSIS installer at
  `D:\areu-m6z2oO\ARE_Companion_Evolution_clarity_20261002_x64-setup.exe`
  (33,824,406 bytes; SHA-256
  `77177219388b5fb03283363e23c041c3d08d78435c740cc3a923c4f4bc26bace`).
  Its retained stage is `D:\areu-m6z2oO\acw-3HALTQ`. Staged `app.js`,
  `dashboard.html`, and `app.css` matched the worktree byte-for-byte.
- Staged native Windows features passed product health, route/context,
  Reasoning State, thread/decision client loads, candidate registry, and
  Evolution SQLite write/read/reopen. Core closure digest:
  `6728c966ed0f5419931ca4b3e693336d929ddafb84c81b542121b04a0cb4c43d`.
- Native WebView2 passed the seven-page registry-only journey and the new
  definition-purpose/admission assertion. A separate native journey passed
  against an isolated verified one-cycle ledger, preserving cycle-first order
  and bounded event progression. A registry-only screenshot is retained at
  `D:\areu-m6z2oO\evolution-definitions.png`.

The setup executable was not installed or released. These tests do not show
an active worker, actual user-task control, installed lifecycle, screen-reader
behavior, or resource-budget acceptance.

## Next UI issue

Visual inspection of the native registry-only screen shows only the first
definition near the bottom of the first viewport. The unavailable cycle and
commit metric cards consume space even though no runtime root is configured.
The next bounded UI slice should prioritize the useful definitions in that
state while retaining the metrics for verified ledger evidence.

## Open Questions

- Does a screen reader announce definition title, status, purpose, and source
  reference in a useful order on native Windows and Linux?
- What exact installed-app and normal desktop resource checks will qualify
  this UI beyond a staged development executable?
