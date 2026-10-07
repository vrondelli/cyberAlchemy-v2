# Windows Overview source-summary development check

Status: bounded development evidence, 2026-09-27. TUI is discontinued and is
not part of this Companion UI check. No installer was installed or signed; no
existing host task was handed to ARE.

## Changed surface

The Overview now puts three independently labelled readings ahead of optional
product-profile detail: local product diagnostic, selected adapter path, and
their independent observation freshness. A single contextual link leads to
product Evidence or Adapters. Profile counts and identity remain available in
a collapsed detail, not above the answer. The Companion remains read-only
except for its own local appearance preferences.

## Checks

- `node --check ui/app.js` passed.
- `node --test ui/dashboard.test.mjs test/integration-surface.test.mjs`
  passed 33/33 (28 Companion UI and 5 integration-surface assertions).
- A fresh native Windows x64 Node 26.8.1 build produced an unsigned NSIS
  development installer at
  `C:\Users\vlad_\AppData\Local\Temp\are-ui-ioocMn\ARE_Companion_overview-setup.exe`.
  The staged executable was
  `C:\Users\vlad_\AppData\Local\Temp\acw-780BfQ\src-tauri\target\release\are-companion.exe`.
  Its reported standalone closure digest was
  `a25d13f9ae602ea170617148ad84ccce85a34fbeb2254bc620fe82c6eb96d358`.
- The extracted executable passed `scripts/test-windows-ui.mjs` twice in an
  isolated test profile, once with a screenshot and once after tightening its
  collapsed-product-detail assertion. WebView2 rendered a nonblank Overview,
  product diagnostic PASS, separately unconfigured adapter, one contextual
  adapter link, all seven panels, independent Evidence postures, keyboard
  navigation, diagnostic refresh, and saved local appearance preferences.
  The screenshot is
  `C:\Users\vlad_\AppData\Local\Temp\are-ui-ioocMn\overview.png`.
- The Linux Playwright CLI could not launch its default Chrome channel, and a
  cached Chromium binary could not load `libnspr4.so`. This is an environment
  limitation, not a browser-pass claim.

## Claim boundary

This verifies the revised screen in one extracted Windows development build
with the default unconfigured live sources. It does not test an installed app,
an active adapter or thread in this build, normal Linux desktop rendering,
five-second human comprehension, current-task control, or release readiness.

## Open Questions

- Does the single next link remain the most useful action across live adapter,
  stale-source, and unavailable-source native states?
- Can an installed package and a physical Linux desktop reproduce the same
  layout, focus, and independent-source behavior?

## Source-aware headline follow-up, 2026-09-27

The current source adds one Overview sentence that names the product
diagnostic and gateway path independently, with each current observation time.
It distinguishes a ready same-session path, an observed gateway fault,
unconfigured observation and stale/unavailable reads. A failed product read
now says `Product diagnostic unavailable`; it does not label the whole engine
unavailable. The sentence does not assert control of the current desktop task.

- The dashboard suite passed 34/34 and the isolated native Windows Chromium
  seven-page fixture journey passed, including a product failure while the
  adapter remained observed.
- A fresh native Windows build passed its staged ARE product diagnostic and
  produced the unsigned
  [`ARE_Companion_0.1.0_x64-setup-overview-summary-20260927.exe`](../dist/ARE_Companion_0.1.0_x64-setup-overview-summary-20260927.exe),
  29,383,205 bytes, SHA-256
  `d8f1090dd58463057b01b8f481a08db25d60678abbc545f7f5b5537f9d6587f1`.
  Its development closure had 750 files and digest
  `77dd6037efebc294e8e689385bf35388cf64605efc043aa69645ca8796a9b405`;
  its selected Core closure digest was
  `094c2881cff71eb51998afcde2e98c5777d5e4be209593c1f652b5263f77095b`.
- The staged package's native feature probe passed 11/11. Its WebView2
  orb-to-dashboard journeys passed both the unconfigured seven-page path
  and a connected-gateway fixture. The staged UI rendered `Product diagnostic
  passed ...; gateway observation not configured` in the default case and
  `Product diagnostic passed ...; gateway path observed ...` for the fixture,
  with the same-session path still `not-observed`. The test-only build stage
  was moved to Trash after validation; the installer was retained.

This is a development-build and fixture result. The installer was not run,
signed, or released; no real current desktop task was handed to ARE. A
five-second human comprehension check, installed-app lifecycle, and physical
Linux screen-reader/pointer behavior remain open.
