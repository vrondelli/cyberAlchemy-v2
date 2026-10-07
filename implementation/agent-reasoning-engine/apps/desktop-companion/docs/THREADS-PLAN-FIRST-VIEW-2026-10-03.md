# Threads plan checkpoint in the first view — 2026-10-03

Status: bounded development evidence. Authority effect: none. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

The Threads card now shows a verified, content-free plan checkpoint without
requiring the user to open technical evidence. It reports completed/total
obligations, the current slice ordinal and status when present, and the open
decision count. Gateway phase and observation time remain adjacent. The
completion frontier and protocol identifiers still start collapsed. When no
plan checkpoint exists, the first view does not invent progress; when a row is
last-seen, its plan line says so. This is a Reasoning State projection, not
hidden model reasoning or proof that this desktop task is ARE-managed.

The source UI suite passes 63/63 tests, including verified, absent, and
last-seen plan states. The isolated rendered Edge journey passes its
seven-panel checks, keyboard disclosure, and 340 px layout; it asserts that
the plan line is visible while frontier and evidence are closed.

A distinct unsigned Windows development installer was built at
`D:\acw\ARE_Companion_plan_firstview_20261003_x64-setup.exe` (SHA-256
`397523f026a9fca9593fb9041276a15d26fba4c048a77de4144ce31725386b71`).
Its retained stage is `D:\acw\acw-QkhrNM`; staged `app.js` and `app.css`
matched source at that build time byte-for-byte. The 13-check bundled ARE feature probe
passed with Core closure digest
`e33ac836b8a317583ee6099313555d32ced36d30463b813babb6a632ad1293c0`.
The staged native WebView2 seven-panel journey passed with the isolated
gateway-backed active-thread fixture. It asserted visible first-view plan
progress while frontier and technical evidence were collapsed, then opened
the detail by keyboard. The captured Threads view at
`D:\acw\ARE_plan_firstview_thread_20261003.png` was visually inspected and
shows the intended hierarchy. A copy of the updated, source-hash-matched
test harness was placed in the retained stage after packaging for this test;
the installer itself was not modified or installed. A temporary WSL-to-Windows
file-share timeout delayed the tests; running the test harness from the local
D: stage resolved that path issue.

## Narrow-window correction and Linux parity

The first native Linux screenshot showed the plan line below the first
340 × 740 viewport even though it existed in the card. The opening gateway/
Rejoin explanation is now concise, with its complete boundary in a disclosure
below the card; the thread-specific Evidence link also follows the card. The
narrow Threads heading and spacing were tightened without removing the
gateway-continuity summary. The source UI suite still passes 63/63, and the
rendered Edge journey now asserts the plan line's bottom edge is inside the
340 px viewport without horizontal overflow.

The distinct unsigned [Linux package](../dist/are-companion_0.1.0_amd64-plan-firstview-narrow-20261003.deb)
was built offline in the existing Ubuntu 26.04 builder (SHA-256
`f17212677095936ce71a9f1ae07476e9f5241591c42765b9bb059ffa436a7d53`,
840-file development closure digest
`5f44288eae199a334a0afb819bba20f6ec8a19efcf9ad4280c1283fcc63c8a8e`).
Its extracted, network-disabled WebKitGTK/X11 dashboard passed the isolated
gateway fixture at an actual 340 × 740 client size: one active backend-thread
row, visible checkpointed plan inside the first viewport, collapsed frontier
and evidence, and no horizontal overflow. The separate Decisions disclosure
fixture still passed. No model call or installation occurred. The native
[Threads capture](/home/vlad_/.cache/are-plan-linux-narrow-W5Sl8SMn/linux-thread-plan-narrow-20261003.png)
was visually inspected. This screenshot shows the plan line before the lower
edge of the viewport; it does not prove manual pointer or screen-reader use.

A distinct unsigned Windows rebuild from this later narrow-layout source is at
`D:\acw\ARE_Companion_plan_firstview_narrow_20261003_x64-setup.exe` (SHA-256
`a146643d883204829996b778567c9d9fe2fc3a43180aeb195ddd17efcfaea58c`).
Its retained stage is `D:\acw\acw-bg2dRN`; the 840-file development closure
digest is `755eae4a2c06079bd902480ba87b80769916f524f76d474f6123c5de6f0308ae`
and Core digest is
`7a35428f9b6d2525583b1bc4d520873d2ce20f013febbd9c3c30b7dbb82a5a08`.
Staged HTML, CSS, and JavaScript matched the narrow-layout source at package
build time. The
13-check bundled ARE feature probe and the staged native WebView2 seven-panel
journey passed. The native window was resized to an actual 340 × 740 client
area (device pixel ratio 1; OS minimum tracking width 336); the checkpointed
plan remained inside the first viewport, frontier and evidence stayed closed,
and the document did not overflow horizontally. The journey also passed the
thread-to-decision link and return, keyboard disclosure, and source-loss state.
The [native Threads capture](/mnt/d/acw/ARE_plan_firstview_narrow_thread_20261003.png)
was visually inspected. The source-matched UI test harness was copied to the
retained stage after packaging; the installer itself was not modified or
installed. The earlier Windows package above predates this correction and is
not its qualification.

## Post-package heading follow-up

The source now gives each backend-thread card a named level-two heading,
keeping the same visual typography and card height. This lets heading
navigation identify individual rows without expanding protocol evidence.
The source UI suite passes 63/63, including the heading and card-name contract.
The rendered Edge seven-panel journey passes against this later source,
including the named card/heading assertion and the 340 × 740 first-viewport
plan check. The Linux Chromium launch could not start because that WSL host
lacks `libnspr4.so`; the Windows Edge run exercised the same source fixture.

A distinct unsigned [Linux heading package](../dist/are-companion_0.1.0_amd64-thread-heading-20261003.deb)
was built offline from this source (SHA-256
`9911779fd209af466b0a2e81357825045320ba8e4c647cb109a0fe0aa33f32d3`,
840-file development closure digest
`9037d72f01e5017297defb44ce44c43cf2a443433d5cf311c7c75a9fdd943333`).
Its extracted, network-disabled WebKitGTK/X11 fixture passed an actual
340 × 740 journey with a named backend-thread card, visible checkpointed plan
inside the first viewport, collapsed frontier/evidence, no horizontal
overflow, and the separate Decisions detail check. The
[native Threads capture](/home/vlad_/.cache/are-thread-heading-linux-cdqhU4/thread-heading-native.png)
was visually inspected. It was not installed, and there were no external model
calls. The Windows packages above predate this semantic change and therefore
do not qualify it; no screen-reader traversal claim is made.

A distinct unsigned Windows build from the heading-updated source is at
`D:\acw\ARE_Companion_thread_heading_20261003_x64-setup.exe` (SHA-256
`06a21718814afaef0940bc4a3a88b2763c7bd1c6f3c9a2b908ef28d103427c5d`).
Its retained stage is `D:\acw\acw-qICVNy` (840-file development closure
digest `f6919d6634f721c92d8e61dc54fb857a058dc7513c01106f42db9cd2c2ad4b6e`).
Staged HTML, CSS and JavaScript hashes match the current source. The bundled
ARE feature probe passed 13/13. The staged native WebView2 seven-panel journey
passed with a gateway-backed active-thread fixture, including the named
level-two heading/card, keyboard-open detail, thread-to-decision return,
gateway-loss behavior, and an actual 340 × 740 client size with the plan
checkpoint inside the first viewport and no horizontal overflow. The
[Windows Threads capture](/mnt/d/acw/ARE_thread_heading_native_20261003.png)
was visually inspected. The source-matched test harness was copied into the
retained stage after packaging; the installer was not modified or installed.
An initial WSL-to-Windows process-launch timeout was resolved by selecting a
live per-command interop socket; no WSL restart or system setting changed.

## Extracted Windows installer payload

The exact unsigned installer above was listed as an NSIS-3 Unicode archive
and extracted without running it: 850 archive files, 123,038,006 uncompressed
bytes, `Everything is Ok`. Its payload is retained at
`D:\acw\are-thread-heading-extracted-20261003`. The extracted `are/` tree
matches the build-stage tree except for `test-windows-features.mjs` (copied into
the stage after packaging) and the updated `test-windows-ui.mjs` harness (also
copied after packaging). Bundled `node.exe` is byte-identical in both trees
(SHA-256 `5cba0ea928508c65ddadefc0681d6f3beea4428f04397631140ee8e5`).
The extracted executable differs from the pre-bundle stage in exactly three
bytes, changing Tauri's bundle marker from `UNK` to `NSS`; its SHA-256 is
`495c8586cd5f55b0dcc476c4c9b4a99703205de4fbfa8db39ac3d9d3c8631b4a`.

The extracted payload passed the 13-check bundled ARE feature probe with Core
closure digest `53e8c3e49a6277e14c4c112efd59b055a3d1b40a8ce2818fc373e4c5bf88531d`,
matching the builder's Core digest. Its executable passed the same native
WebView2 seven-panel, gateway-backed Threads journey, including the named
heading, keyboard detail, decision return, gateway loss, and actual 340 × 740
first-viewport plan check. The
[extracted-payload capture](/mnt/d/acw/ARE_thread_heading_extracted_native_20261003.png)
was visually inspected. The test script ran from the retained stage, but the
ARE runtime and Companion executable came from the installer payload. This is
package-content and extracted-runtime evidence, not an installed NSIS
lifecycle test or control of the current desktop task.

## Open Questions

- Linux programmatic WebKit checks passed; physical keyboard and assistive-
  technology traversal remain unverified.
- Physical Windows assistive-technology traversal remains unverified despite
  the native WebView2 DOM/keyboard check.
- Which exact host-task identity can be joined to a backend-thread row before
  calling this task ARE-managed? The current UI does not make that claim.
- Screen-reader traversal and installed-package lifecycle remain unverified.
