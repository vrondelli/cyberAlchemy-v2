# Evolution phase-row layout — native candidate evidence

Status: development evidence, 2026-10-03. No setup was installed, no live
Evolution root was read, and this Codex task was not handed to ARE.

The first unsigned Windows package, `D:\acw\ARE_Companion_phaseview_guard_20261003_x64-setup.exe`
(SHA-256 `7682278cdc54633a641289ade17a319cc943f35c185080cc11c3d4073a108bb8`),
was built from the phase-view source and retained at `D:\acw\acw-omq4LD`.
Its native feature probe passed product health, routing/context, bounded plan
recording, thread/decision client loading, and Windows SQLite Evolution
write/observe/reopen checks. A separate WebView2 journey used a disposable
Windows-created one-phase/two-commit ledger. It passed the phase detail and
privacy assertions, actual 1120 × 760 to 340 × 740 resize, navigation,
keyboard, and no-horizontal-overflow checks. Visual inspection of the
[captured phase row](/mnt/d/acw/ARE_Evolution_phase_row_20261003.png) found
that the two-column row broke short labels into fragments despite fitting the
viewport. That package is **not** the final narrow-layout candidate.

The source [stylesheet](../ui/app.css) now stacks Evolution row labels over
their detail at widths up to 740 px. The native [Windows probe](../scripts/test-windows-ui.mjs)
and [Linux probe](../scripts/inspect-linux-ui.mjs) assert that the three
coordination labels each occupy one line. The updated unsigned
[Linux package](../dist/are-companion_0.1.0_amd64-phaseview-narrow-20261003.deb)
has SHA-256 `c74e06c7dea29bfc5365c06fa7bf986e39fee264671e374a107027b764baf25e`.
Its extracted executable passed the isolated WebKitGTK/X11 actual 340 × 740
verified-phase journey, including all three whole labels, the bounded work
states and two events, private-ID omission, and no horizontal overflow. The
same package passed the registry-only narrow regression. The source dashboard
suite passed 64/64. The test used no network and an isolated home; its PPM
capture is retained at
`/home/vlad_/.cache/are-phase-row-package-uF9j1KrM/phase-row-final.ppm`.
The [losslessly converted PNG](/home/vlad_/.cache/are-phase-row-package-uF9j1KrM/phase-row-final.png)
was visually inspected: all three labels are intact and the details wrap
beneath them without crowding the adjacent card.

WSL interop first rejected the repaired-source rebuild with
`UtilAcceptVsock:273: accept4 failed 110` before it created a new stage.
After interop recovered, the final unsigned Windows setup was built at
`D:\acw\ARE_Companion_phaseview_narrow_20261003_x64-setup.exe`
(SHA-256 `794b5f4044d604d6eaa42b6a64e44e647f99270c00c2eec32873998d385f0f10`),
with retained stage `D:\acw\acw-aAKcgj`. The staged stylesheet hash matched
the current source before compilation. Its native feature probe passed. The
repaired-source WebView2 journey passed the 1120 × 760 to 340 × 740 actual
window resize, one-line coordination labels, phase counts and privacy checks,
no overflow, and the surrounding seven-panel/navigation/keyboard journey.
The [final Windows screenshot](/mnt/d/acw/ARE_Evolution_phase_row_fixed_20261003.png)
was visually inspected and shows the stacked row without fragmented labels.
A separate registry-only native narrow journey passed. The exact NSIS archive
then passed an independent 7-Zip 26.00 integrity test (851 files) and was
extracted without installation to
`/home/vlad_/.cache/are-phase-row-nsis-2PmhuMHK/payload`, with an identical
test copy at `D:\acw\phase-row-installer-extracted-20261003`. Its ARE tree
matched the retained stage byte-for-byte; bundled Node and launcher hashes
also matched. The extracted executable has the expected three-byte Tauri
bundle marker change (`UNK` to `NSS`) and no other byte difference from the
staged executable. Its own feature probe passed, and the **extracted**
WebView2 executable passed both the verified-phase and registry-only actual
340 × 740 journeys. The [extracted-payload screenshot](/mnt/d/acw/ARE_Evolution_phase_row_extracted_20261003.png)
was visually inspected. This establishes unsigned installer-payload and
native-renderer parity for this layout slice, **not** installed lifecycle or
release readiness. Physical pointer, screen-reader,
install/restart/uninstall, and worker liveness remain unverified.

## Open Questions

- Does an actually installed Windows payload preserve the same journey across
  install, restart, update, and uninstall?
- What source-owned signal, if any, would justify a current worker-liveness
  claim beyond this durable-ledger history?
