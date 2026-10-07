# Companion current-source UI validation — 2026-10-02

Status: bounded development evidence. Authority effect: none. This is not an
installed Windows package, release, or desktop-task-control result.

## UI checks

- The dashboard source unit suite passed 54/54 tests.
- The isolated Chromium seven-page journey passed, including responsive
  navigation, keyboard focus, independent source failures, the collapsed
  Overview source index, and the bounded Evolution definition filter.
- The native WebView2 test now checks that the Overview source index starts
  collapsed, expands without claiming its four sources were read, and that a
  single verified Evolution definition does not display an unnecessary filter.
  Both assertions passed against the exact staged current UI bytes. The orb
  opened a nonblank dashboard, and all seven destinations passed the baseline
  native journey. A second native run with an isolated verified ledger passed
  the Evolution cycle, filter, progression, and first-viewport checks.
- A third native WebView2 run with a disposable development gateway fixture
  showed one active backend thread's explicit Reasoning State in the first
  viewport, a linked decision with return focus, and source-scoped gateway
  loss. It labelled desktop-task control unverified; this was not this chat's
  Reasoning State or an activated host task.
- Staged `app.js`, `dashboard.html`, and `app.css` match the current source
  byte-for-byte. The staged Windows feature probe passed bundled ARE health,
  route/context, Reasoning State, thread/decision imports, and Evolution
  SQLite write/read/reopen. It reports Core closure digest
  `6728c966ed0f5419931ca4b3e693336d929ddafb84c81b542121b04a0cb4c43d`.

## Windows build boundary

The first build stopped at the staged product-closure gate. The selected Core
`module-port` package had an optional Alch adapter with a direct external
source import. That adapter now receives the selected compiled Alch semantic
functions from its caller. Its real-Alch integration test remains available
locally but is explicitly outside the standalone Core closure; a separate
in-closure test checks the injection boundary. Core product tests pass 13/13,
standalone distribution tests pass 2/2 without Alch or DomainSpec trees, and
the complete module-port suite passes 20/20. This restores product packaging
without suppressing the forbidden-dependency check.

A fresh Windows build with the native orb bundled passed the staged closure
gate and compiled `are-companion.exe`. NSIS then failed to open a staged
Evolution JSON path of 266 characters. The current builder now checks this
limit before compilation and asks for a shorter `--stage-parent`.
For this exact compiled stage, a temporary short Windows junction mapped the
same source tree to a 226-character path; a mechanically rewritten generated
NSIS script then packaged those same staged files successfully. The unsigned
NSIS output is
`D:\are-ui-closure-fixed-20261002-CuGlHHct\ARE_Companion_UI_closure_fixed_20261002_x64-setup.exe`
(33,818,904 bytes; SHA-256
`2f86b7c4d4c3134f0aa2cfb88b07d84d3df6c0bed6cfd4cc9552970d4c3008bf`).
`file` identifies it as a Nullsoft installer. Its staged executable and
resources remain under
`D:\are-ui-closure-fixed-20261002-CuGlHHct\acw-CoSUUB`.
The temporary junction was removed after packaging; its target stage and the
installer remain intact.

The failed first stage remains under
`D:\are-ui-current-20261002-nVVQy76J\acw-C7upqb` for diagnosis. Neither
installer was executed or installed; no Windows settings were changed. The
successful package is a development candidate, not an approved release.

## Bounded task-session handoff

- Task: restore the standalone Core closure and qualify the matching current
  Companion UI in a native Windows development stage.
- Context: the selected Core profile, closure materializer, Module Port
  boundary, Companion builder and UI probe, and the whole-UI plan supplied
  the exact write and validation scope. No runtime handoff pack or fallback
  route was used.
- Decision: keep the optional Alch adapter callable, but inject its selected
  semantic functions at the caller boundary. This preserves the direct
  integration test without bundling Alch source or excluding the adapter's
  production file from Core.
- Gate: candidate construction only; no authority, task takeover,
  installation, release, or deployment effect. Product closure and native UI
  criteria passed; installed lifecycle remains a separate follow-up.
- Validation: Core product 13/13, standalone distribution 2/2, Module Port
  20/20, dashboard 54/54, staged Windows feature probe PASS, and two native
  WebView2 source journeys plus one disposable live-gateway fixture PASS.
  Reusable-sigil experiment harness: not applicable.

## Open Questions

- Does an isolated installation and uninstall of this exact NSIS package pass
  the same feature and UI checks without altering an existing ARE install?
- Installed lifecycle, normal pointer interactions, screen-reader behavior,
  resource budget, signed release packaging, and exact host-task control
  remain separate gates.
