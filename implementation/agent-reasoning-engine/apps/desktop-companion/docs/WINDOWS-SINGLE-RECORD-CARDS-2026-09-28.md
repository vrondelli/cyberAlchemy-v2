# Windows single-record Threads and Decisions layout — 2026-09-28

Status: bounded Companion UI construction evidence. The Windows installer is
unsigned, extracted for testing, and not installed. TUI is discontinued and
was not changed or packaged.

## Observed problem and change

In the connected-gateway fixture, one active backend thread and one decision
each occupied a half-width grid column. The thread's Reasoning State plan
summary and host-protocol receipts wrapped into a cramped card while the
right half of the page was empty. The same shared card grid now lets an only
child span the available columns, capped at 760 pixels; multiple cards retain
the existing two-column layout. The change is CSS-only and does not alter
the gateway projection, authority claims, or hidden model reasoning.

## Exact candidate and checks

- Unsigned NSIS candidate:
  `D:\are-companion-attested-jAYjg8\ARE_Companion_single_card_20260928.exe`
- SHA-256:
  `2023035a289fe274d1d1505e5593339210dac246e3fcde61a451db10abfa7496`
- Retained stage: `C:\Users\vlad_\AppData\Local\Temp\acw-k0m2R2`
- Extracted payload:
  `D:\are-companion-attested-jAYjg8\installer-extracted-single-card`
- NSIS extraction reported `Everything is Ok` for 778 files. The package's
  bundled Node and ARE passed all 11 native feature checks, including product
  health, route/context, Reasoning State, and Evolution SQLite replay.
- Source dashboard tests passed 41/41. The exact staged and extracted
  executables both passed the connected WebView2 journey with new assertions
  that one thread and one decision occupy a readable 680–760-pixel card.
  The 40-thread paging/source-change fixture passed on the staged executable,
  preserving multi-record behavior.
- Visual screenshots from the retained stage are at
  `D:\are-companion-attested-jAYjg8\are-ui-review-GOvNsOyK\threads-single-new.png`
  and `D:\are-companion-attested-jAYjg8\are-ui-review-GOvNsOyK\decisions-single-new.png`.
- The extracted payload passed the package-only managed-session smoke: bundled
  ARE launcher, hosted client, Node, and Companion started together; seven
  panels rendered; gateway/backend/client were connected; hosted-input proof
  was configured; model turns remained paused; zero model calls occurred; and
  child cleanup was supervised.

The source Chromium navigation harness could not start in this checkout
because `playwright-core` is absent. This is a separate test-environment gap,
not a failed native WebView2 assertion.

## Claim ceiling and open questions

The change improves single-record readability in the tested Windows
prototype. It does not prove an installed NSIS lifecycle, Linux compositor
behavior, an owner-approved resource budget, Windows hook-input delivery,
universal host-effect coverage, or control of this desktop task. The
Companion remains read-only; model entry in the managed Windows path remains
paused until the host boundary is verified.
