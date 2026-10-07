# Evolution latest-event first view — native Linux evidence

Status: unsigned, uninstalled development candidate. Authority effect: none.
This evidence does not establish control of the current Codex desktop task.

The collapsed verified-cycle summary in [the UI source](../ui/app.js) now names
the latest verified event type. The [native WebKitGTK inspector](../scripts/inspect-linux-ui.mjs)
checks that each collapsed cycle's label matches the last type in its bounded
verified timeline; the registry-only state must contain no cycle summary.

The current-source [Linux package](../dist/are-companion_0.1.0_amd64-latest-event-20261004.deb)
was built offline in the existing Ubuntu 26.04 builder image. SHA-256:
`2c18b01ac62926aa141508e09b588fd18d75a556ad63fa8bb0703626c75c0ea5`.
The builder reported Node 26.8.1, 846 bundled files, and closure digest
`01d78d2d9c17bc8467b26223e0eb53470c6d095905b92ddb0b317b2a035c6a44`.
The extracted dashboard executable was byte-identical to the compiled source
executable. Its bundled `are doctor --json` returned `PASS` for
`0.10.0-rc.1` with an exact Node-version match. No TUI path appeared in the
extracted ARE tree.

The extracted executable, not an installed package, passed three network-disabled
WebKitGTK/X11 journeys in a disposable home at an actual 340 × 740 window:
one verified cycle, registry-only, and two verified cycles with definition
filtering. All three passed product-diagnostic and seven-panel preflight,
linked navigation, first-useful-content visibility, and no horizontal document
overflow. Both verified journeys passed the new collapsed latest-event
assertion; registry-only showed no cycle. The source dashboard suite passed
67/67. Visual review of the [verified screenshot](../../../../../output/playwright/are-evolution-latest-event-verified-webkit-340-20261004.png)
and [registry-only screenshot](../../../../../output/playwright/are-evolution-latest-event-registry-webkit-340-20261004.png)
found the first-view statuses and bounded evidence legible at 340 px.

This is a narrow renderer/package check. It does not test a normal installed
Linux desktop, Windows parity for this exact source, physical pointer use,
assistive-technology speech, long-duration resource use, live Evolution worker
state, or current-task writer/ingress handover.

## Open Questions

- Does the next exact-source Windows package show the same latest-event summary
  in an extracted WebView2 journey?
- Which installed-product and assistive-technology checks are required before
  this first view can be accepted beyond the development candidate?
