# UX6 — Browser and performance acceptance

Status: complete within the T7D local-candidate boundary; broader release
qualification is retained for T7E. Candidate evidence, 2026-09-09. Authority
effect: none.
Owner instruction: “next” continuing the UX DAG under the
[router D65 construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Browser matrix

| Engine | 1440 CSS px | 320 CSS px | Scope |
| --- | --- | --- | --- |
| Chromium 153.0.8010.12 | Pass | Pass | Installed local Workspace |
| Firefox 146.0.1 | Pass | Pass | Installed local Workspace |
| WebKit 26.0 build 2248 | Pass | Pass | Current candidate through locked user-local compatibility overlay |
| Orca 50.2 with Chromium 153 | Representative journey | Representative journey | Actual AT-SPI speech output and keyboard focus |

Each passing journey covers Dashboard entry, default Overview, all seven tabs,
exact verified result, keyboard Home/focus, reload, search/reset, keyboard ontology
list, required-field focus and a mocked review failure with retained draft.
The harness intercepts POSTs; only one mocked review per journey was requested.
Installed task journal bytes are unchanged. The browser matrix's semantic
snapshots remain DOM evidence. The separate Orca campaign records actual speech
output. [Machine evidence](UX6-EVIDENCE.json) and [T7D evidence](T7D-EVIDENCE.json).

This host is Ubuntu 26.04. The installed Playwright package supplies Ubuntu 24.04
compatibility builds for Firefox/WebKit. Firefox's pinned archive was downloaded
from the Playwright CDN and recovered after its Node unpacker stalled. Python
extraction preserved permissions and archive symlinks. Firefox then ran the real
journeys successfully. This is not a claim of an officially supported OS pairing.

WebKit's compatibility libraries are checksum-locked in
[`tools/toolchain/webkit-lock.json`](../../../tools/toolchain/webkit-lock.json).
[`bootstrap-webkit.py`](../../../tools/toolchain/bootstrap-webkit.py) verifies and
extracts them into a content-addressed user directory without package scripts or
system installation. [`run-webkit`](../../../tools/toolchain/run-webkit) composes
that overlay with the existing desktop and Playwright WPE libraries. The current
source build passed the complete journey at both widths in WebKit as well as
Chromium and Firefox. This qualifies the recorded Ubuntu compatibility fixture;
it is not a Safari or cross-platform claim.

An axe-core 4.13.0 scan of Runs, all seven run tabs, New run, Operations, Lab and
Ontologies found zero violations across 12 states. It retains manual contrast
review for three single-character counters and 66 SVG ontology edge labels where
the scanner could not determine the effective background. Two invalid roleless
ARIA labels were repaired in the owning sibling frontend before the final scan.

The real Orca journey spoke Workspace landmarks and navigation, the completed run
and its default Overview tab. Keyboard End selected Lifecycle and Home returned to
Overview with selected focus retained. The [observation record](UX6-SCREEN-READER.md)
keeps the remaining worksheet rows explicit for T7E release qualification.

## Measured local performance

Three fresh browser contexts per route, 1440×1000, loopback, without CPU/network
throttling. The measurement records heading availability and observes resource
timings for one second afterwards. Totals below exclude the main document and
include only completed resource entries. They are measured transfers, not merely
file sizes.

| Route | Median heading ready | Median resource transfer |
| --- | ---: | ---: |
| Dashboard | 508 ms | 0.70 MB |
| Runs | 545 ms | 1.13 MB |
| Overview | 624 ms | 1.13 MB |
| Lab | 543 ms | 4.35 MB |
| Research ontology | 677 ms | 1.13 MB |

The 3.22 MB portrait image downloads when Lab opens; it was not requested by Runs,
Overview, Dashboard or Research ontology in these samples. The shared orchestrator
script remains a significant resource, but image output size alone did not imply
that every run page downloaded the portrait. There is no justified blanket
performance-pass claim, nor a need to introduce another frontend or poller.

Raw resource timing, LCP/CLS observations and long-task samples are in
[performance.json](ux6-evidence/performance.json). Short local observations do not
establish field Core Web Vitals, mobile-network performance or a production SLO.
Heading-ready timing is not the existing
workspace.cold-navigation-to-paint instrumentation. The exact
[Workspace budget campaign](../../runtime/performance-budgets.candidate.json),
Tauri IPC, other feature journeys and the standard snapshot-drift build remain T7.

## Reproduce

[test-browser-matrix.mjs](test-browser-matrix.mjs) takes origin and output directory;
TEST_BROWSERS selects chromium,firefox,webkit. The local browser dependency directory
must be on LD_LIBRARY_PATH; this host also requires
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 for the compatibility builds.
Set `WORKSPACE_WEBKIT_EXECUTABLE` to `tools/toolchain/run-webkit` for WebKit. The
script fails for an unavailable engine and retains its diagnostic.

[test-performance.mjs](test-performance.mjs) takes origin and output directory.
It uses a fresh context for each sample and blocks task submission. Both harnesses
use the existing local Playwright installation and installed Workspace candidate.

The production frontend and native configuration are unchanged by this task.
No native launch, paid model call, budget reset or VPS action was performed.

## Open Questions

- Decide whether Safari or another supported-host WebKit run is required beyond
  the recorded Ubuntu compatibility fixture.
- Complete and review the remaining spoken-output rows in the
  [assistive-technology worksheet](UX6-SCREEN-READER.md) if required for release.
- Establish slow-network/CPU and field performance evidence before treating local
  medians as user-experience guarantees.
- Complete the exact existing T7 budget and Tauri campaigns.

UX6 and T7D are complete within their stated local candidate boundary. T7E owns
the decision to retain or require the broader release checks. MCP remains last.
