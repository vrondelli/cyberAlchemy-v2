# Companion UI continuation — 2026-10-03

Status: bounded development evidence. Authority effect: none. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md). This is not an
installed app, approved release, or activated desktop task.

## Exact Windows candidate

The current source through the Evolution gateway-candidate first-view teaser
was built with native Windows Node 26.8.1, pinned Rust 1.98.1, and the
candidate native orb into a short-path, retained stage at
`D:\acw\acw-86PvOc`. The unsigned NSIS package is
`D:\acw\ARE_Companion_ui_continue_20261003_x64-setup.exe` (SHA-256
`70dc9b0b4c31aeb118e770f31ca7254edadc3cddc07b0e1827a7e0fcbb592c61`).
The installer was not executed. At build time, staged `dashboard.html`,
`app.js`, and `app.css` matched source byte-for-byte. The staged feature probe
passed its 13 bundled ARE checks, including product health, route/context,
Reasoning State load, and Evolution SQLite write/read/reopen; Core closure
digest: `5efea037622bc98b7db19054c8419eefc7882fdc06814a45eebbe381ec8c`.

The isolated native WebView2 test passed the default seven-panel journey and
two actual 340 × 740 client-window Evolution journeys. The OS-reported minimum
tracking width was 336 px. The registry-only view exposed candidate definitions
without inventing a cycle; the separate verified-ledger fixture prioritized its
one recorded cycle; the separate candidate-inbox fixture showed one recorded
candidate. Both first-view teaser postures agreed with their independent source,
and the Details control focused the candidate section. Neither fixture started
an Evolution worker or changed the candidate log. Native captures:
`D:\acw\ARE_ui_continue_registry_20261003.png` and
`D:\acw\ARE_ui_continue_verified_20261003.png`.

## Later source-only polish

Visual inspection of those native captures found that “Refresh view” wrapped
into two cramped lines at 340 px. A later `app.css` change gives the compact
top-bar action enough width and keeps this control on one line. The 63 source UI
tests and the full isolated Chromium seven-panel journey pass; the latter now
asserts one visible Refresh line at both 320 and 340 px. The Windows WebView2
test also contains the corresponding assertion for the next matching build.

This CSS change is **not** in the first unsigned package above: current source CSS
SHA-256 is `aee4d19ec949f6d92cb3c4cfea386a2e25b4575eb376150c6acf9177d25ce7c1`,
while the staged package CSS is
`4e85dec6ad49129c9c3befd424fbe23ae37f0acb17e8270fae3501a0f4db628d`.
Do not call that first package a current-source qualification after this edit.

## Matching Windows rebuild and native check

A distinct unsigned package including the compact Refresh CSS was then built
at `D:\acw\ARE_Companion_ui_refresh_20261003_x64-setup.exe` (SHA-256
`091d40a84cffb958f96f816c62ecbc6bb5a9ee9c493cbd378811e62c65934c23`).
Its retained development stage is `D:\acw\acw-xgKUfX`. Staged
`dashboard.html`, `app.js`, and `app.css` match current source byte-for-byte.
The standard WebView orb and dashboard are bundled; the optional Slint native
orb experiment was not bundled in this second candidate. The installer was
not run.

The staged 13-check ARE feature probe passed with Core closure digest
`ce67c8d378c14bf2a6a8ef38052b647fbc06d2a88bbf33cd4b06b823466499e9`.
Both isolated native WebView2 journeys passed all seven panels at an actual
340 × 740 client size, including the OS minimum tracking-width guard, the
one-line Refresh assertion, the registry-only first useful definition, the
verified first cycle, and the separate candidate-inbox count and focus jump.
The native captures
`D:\acw\ARE_ui_refresh_registry_20261003.png` and
`D:\acw\ARE_ui_refresh_verified_20261003.png` were visually inspected and
show the corrected control. They prove this staged build's layout, not manual
pointer interaction or installed-app behavior.

A third isolated native WebView2 journey on that same staged executable used
the harness's disposable local gateway fixture. It passed the active
backend-thread Reasoning State first-viewport check, collapsed-first detail,
the exact thread-to-decision link and return focus, a bounded evaluation card,
and source-scoped gateway-loss withdrawal. The inspected captures are
`D:\acw\ARE_ui_refresh_thread_20261003.png` and
`D:\acw\ARE_ui_refresh_decision_20261003.png`. The thread is an artificial
backend record, not this Codex task or proof of stock-app task activation;
the decision is an evaluation, not an observed authorized effect.

## Open Questions

- Installed lifecycle, normal physical pointer use, screen-reader traversal,
  long-duration resource budget, and control of this desktop task remain
  separate, unproven gates.
