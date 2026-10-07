# Windows Companion resource baseline — 2026-09-27

## Scope and method

The current-source unsigned, extracted Windows development executable was run
without installing it. `scripts/test-windows-ui.mjs --resource-sample` launched
one isolated WebView2 profile and preferences file, waited five seconds after
each UI state became ready, then sampled its process tree over ten seconds.
The tree is rooted at that launch's `are-companion.exe` PID and includes only
its descendants; other Codex or WebView2 processes on the machine are excluded.
Windows `Get-CimInstance Win32_Process` supplied parent relationships and
`Get-Process` supplied private bytes, working set, and cumulative CPU time.
The test rendered the real orb, opened the nonblank seven-page dashboard by
clicking the orb, closed only this launch's dashboard via its native `WM_CLOSE`
path, observed the orb remain, reopened a nonblank dashboard, and removed its
isolated profile on exit.

| State | Processes | Summed private bytes | Summed working set | CPU seconds / 10 seconds |
| --- | ---: | ---: | ---: | ---: |
| Orb only | 7 (Companion + 6 WebView2) | 164,495,360 (156.9 MiB) | 375,681,024 (358.3 MiB) | 0.0625 |
| Dashboard open | 8 (Companion + 7 WebView2) | 255,279,104 (243.5 MiB) | 499,642,368 (476.5 MiB) | 0.109375 |
| Dashboard closed, orb retained | 7 (Companion + 6 WebView2) | 186,126,336 (177.5 MiB) | 419,966,976 (400.5 MiB) | 0.046875 |

The dashboard-open snapshot used 90,783,744 more private bytes (86.6 MiB)
than orb-only. Closing it released 69,152,768 bytes (65.9 MiB), but the
post-close snapshot remained 21,630,976 bytes (20.6 MiB) above the initial
orb-only state. In an earlier close run the corresponding residual was 12.6
MiB, so retention varies even across these short tests. These are one-machine
prototype observations, not a numerical resource-budget pass or a general
Windows performance guarantee. Working-set totals may include shared pages
and should not be read as unique RAM use.

## Repeated open/close check

The same retained extracted Windows development build was tested again with
native Windows Node 26.8.1 and the extended isolated probe
`test-windows-ui.mjs --resource-cycles 3`. Each cycle sampled the exact launch's
process tree for ten seconds with the dashboard open, closed only that launch's
dashboard, sampled ten seconds with the orb retained, and reopened a nonblank
seven-page dashboard. The orb-only baseline was 172,519,424 private bytes,
seven processes, and 0.078125 process CPU-seconds over ten seconds.

| Cycle | Dashboard-open private bytes | Post-close private bytes | Post-close above initial orb | Post-close CPU seconds / 10 s |
| --- | ---: | ---: | ---: | ---: |
| 1 | 254,054,400 | 185,896,960 | 13,377,536 | 0.015625 |
| 2 | 251,695,104 | 182,247,424 | 9,728,000 | 0.03125 |
| 3 | 244,592,640 | 183,685,120 | 11,165,696 | 0.109375 |

The probe returned `ok: true` with all ten checks. Post-close private memory
remained above the initial orb baseline, but did not increase monotonically in
these three cycles. This is not evidence of long-duration stability or a
numerical low-resource pass. CPU values are short, quantized samples and the
third post-close interval is not by itself a trend. The test uses an isolated
WebView2 profile, unconfigured live sources, and a retained staged executable;
it does not measure an installed app or an active ARE gateway. The new flag
rejects counts outside 1–8 before launch; `--resource-sample` retains the
single-cycle behavior.

## Current-build eight-cycle follow-up

The newer unsigned `ARE_Companion_0.1.0_x64-setup-thread-phase-current-20260927.exe`
was extracted but not installed. Its first resource attempt stopped before
closing the dashboard: the helper found a same-titled window owned by another
process and correctly refused to close it. The helper now enumerates top-level
windows and selects only the unique exact title owned by its launched process.
One-cycle, eight-cycle, and separate three-cycle native reruns then passed all
ten resource/reopen checks without closing another window. This is a test
isolation repair, not a product-runtime change.

The eight-cycle run began at 171,520,000 summed private bytes for the orb and
its descendants (seven processes). Each open state had eight processes and
each closed state returned to seven. All eight reopened dashboards were
nonblank and retained seven navigation destinations.

| Cycle | Dashboard-open private bytes | Post-close private bytes | Post-close above initial orb |
| --- | ---: | ---: | ---: |
| 1 | 245,366,784 | 189,960,192 | 18,440,192 |
| 2 | 243,458,048 | 211,988,480 | 40,468,480 |
| 3 | 245,104,640 | 211,529,728 | 40,009,728 |
| 4 | 247,615,488 | 179,945,472 | 8,425,472 |
| 5 | 226,635,776 | 193,187,840 | 21,667,840 |
| 6 | 248,688,640 | 216,121,344 | 44,601,344 |
| 7 | 248,676,352 | 216,244,224 | 44,724,224 |
| 8 | 251,793,408 | 217,640,960 | 46,120,960 |

Post-close memory was variable rather than monotonic, but finished 46,120,960
bytes (about 44 MiB) above that run's initial orb sample. A separate
three-cycle process breakdown had a roughly 6 MiB Companion root process;
the remaining private bytes were in six WebView2 descendants. This identifies
the process family carrying most of the retained cost, not a proven leak or a
stable idle plateau. No numerical resource budget has been selected, and the
probe excludes a configured gateway, Evolution source, installed lifecycle,
and longer-duration idle behavior.

## Orb-only sample without remote debugging

The native harness now has a separate `--orb-idle-no-debug` mode. It launches
the extracted executable with an isolated preferences/WebView2 profile but
without `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`, waits for its exact launched
process tree to contain WebView2, samples that tree over ten seconds, and
terminates only its own launched process. The existing debugger-driven
seven-page journey still passed after this opt-in mode was added.

One current-build run returned `ok: true`: seven processes (Companion plus six
WebView2), 167,714,816 summed private bytes (about 160 MiB), 388,583,424
summed working-set bytes, and 0.0625 process CPU-seconds over ten seconds.
The Companion root accounted for 5,734,400 private bytes; WebView2 descendants
accounted for the rest. The exact launched PIDs had exited after cleanup.
This is a single-machine, single-interval prototype measurement, not a
production idle budget pass or a proof that WebView2 always costs this much.
It does show that remote debugging alone does not explain the material orb
footprint observed in the earlier debugger-driven samples. The mode observes
process readiness, not orb pixels; visual rendering remains covered by the
separate WebView2 UI journey.

## Connected adapter fixture follow-up

The current staged development executable was run with an isolated local
adapter fixture using `test-windows-ui.mjs --resource-cycles 2 --resource-with-adapter-fixture --timeout-ms 45000`. The probe waits for the
product diagnostic and adapter observation, clicks Refresh, verifies the
adapter enters Reading and returns to Observed, then allows five seconds to
settle before each ten-second process-tree sample. Each cycle closes only this
launch's dashboard and reopens a nonblank seven-page dashboard. The final
two-cycle native run returned `ok: true` with all eleven checks. A one-cycle
run with the same corrected probe also passed.

| State | Companion-tree processes | Private bytes | CPU seconds / 10 seconds |
| --- | ---: | ---: | ---: |
| Orb with fixture configured | 7 | 163,827,712 | 0.0625 |
| Cycle 1, dashboard open after refresh | 8 | 237,273,088 | 0.046875 |
| Cycle 1, dashboard closed | 7 | 205,930,496 | 0.03125 |
| Cycle 2, dashboard open after refresh | 8 | 252,948,480 | 0.078125 |
| Cycle 2, dashboard closed | 7 | 183,586,816 | 0.109375 |

The closed states were 42,102,784 and 19,759,104 bytes above this run's orb
baseline, respectively; they did not rise monotonically. This sample counts
only the Companion process and its WebView2 descendants, not the separately
launched fixture gateway or its runtime. It measures the settled view after a
refresh, not the instantaneous refresh CPU peak. It is a local fixture, not
the installed Codex gateway, an installed package, or a long-duration
low-resource acceptance result. No numerical budget has been selected.

## Joined installed-Codex development sample

The later `test-windows-live-gateway.mjs --connected-resource-sample` kept an
isolated gateway/canary and pinned desktop `codex-cli 0.155.0-alpha.16.4`
(SHA-256 `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`)
alive while the staged Companion refreshed its product/adapter observation,
rendered one backend thread and nonempty Decisions, closed the dashboard, and
reopened it twice. Each Companion phase marker started a separate ten-second
sample of the exact canary-child tree alongside the Companion's own exact
launch tree. Both native runs passed eleven UI checks, with zero external
model calls and no access to the current desktop task. The unsigned package
was not installed.

| Run/phase | Companion private bytes | Canary + Codex private bytes | Canary-tree CPU seconds / 10 s |
| --- | ---: | ---: | ---: |
| A, open 1 | 264,228,864 | 70,684,672 | 10.71875 |
| A, closed 1 | 180,015,104 | 70,750,208 | 0.09375 |
| A, open 2 | 253,599,744 | 70,885,376 | 0.015625 |
| A, closed 2 | 199,376,896 | 70,213,632 | 0 |
| B, orb | 163,454,976 | 78,000,128 | 10.4375 |
| B, open 1 | 268,251,136 | 99,205,120 | 6.9375 |
| B, closed 1 | 187,531,264 | 64,606,208 | 6.75 |
| B, open 2 | 263,892,992 | 64,094,208 | 0.046875 |
| B, closed 2 | 196,259,840 | 63,217,664 | 0.078125 |

The B orb sample briefly included two Codex-spawned `git.exe` children; later
canary samples had only `node.exe` and `codex.exe`. Run A did not retain its
Companion orb value in the compact result. Markers align sample starts, not
every counter read to the same instant. The early canary CPU intervals may
include background host work after the disposable turn, so the later low CPU
intervals do not prove a stable idle plateau. Summed private bytes are
process-tree accounting, not total machine RAM. Two short runs neither prove
nor refute a leak, meet an unset resource budget, cover a long idle period, or
validate an installed application. The first fixture-only follow-up above
still excludes its gateway; this section supplies the separate real-Codex
development observation.

## Orb asset split follow-up

The floating `orb.html` now loads `orb.js` (1,539 bytes) and `orb.css` (2,028
bytes) instead of the dashboard's `app.js` (68,811 bytes after the split) and
`app.css` (21,903 bytes). The orb retains its preference skin, skin-change
event, pointer drag, and click-to-open behavior. The dashboard continues to
load its own assets. This reduces bytes parsed for an idle orb, not the
WebView2 process model.

The exact unsigned package is
`dist/ARE_Companion_0.1.0_x64-setup-orb-split-20260927.exe` (SHA-256
`762f14c211b6a6f437373bcb51dbf6dfe0e8b1a6e8ad81f16bd42f695ea30e1c`).
The extracted package passed the 11-check native bundled-feature probe and
the ordinary native WebView2 orb/dashboard journey, including skin update,
placement, relaunch persistence, and all seven read-only destinations. It was
not installed, signed, or released. The two packages were sampled sequentially
on the same Windows machine with the same `--orb-idle-no-debug` mode, isolated
profiles, seven processes, and ten-second intervals:

| Package | First private bytes | Second private bytes | First CPU seconds | Second CPU seconds |
| --- | ---: | ---: | ---: | ---: |
| Previous Overview package | 176,717,824 | 175,251,456 | 0.109375 | 0.125 |
| Orb-split package | 152,666,112 | 175,685,632 | 0.03125 | 0.1875 |

The private-memory ranges overlap and the CPU values are short, quantized
samples. No memory or CPU reduction is established. WebView2 descendants
still dominate idle private bytes. An owner-set budget and longer, repeated
measurements remain open. TUI is discontinued and not part of this comparison.

### Discarded dashboard-profile experiment

A later unsigned, extracted-only build temporarily set a separate Tauri
`data_directory` for the Windows dashboard. Its native connected-gateway
journey passed and reopened the dashboard, with post-close Companion private
bytes 23,236,608 and 21,794,816 above its orb baseline in two short cycles.
Those numbers are **not** evidence that the profile split reduced memory: the
test harness set `WEBVIEW2_USER_DATA_FOLDER`, which [WebView2's environment
contract](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/webview2-idl?view=webview2-1.0.3595.46)
uses to override the per-window user-data-folder argument for both webviews.
The process tree
also remained one browser root. The source change was reverted, and its
disposable build and extraction were removed. The orb-split package above
was the latest retained Windows test artifact at the time of that experiment;
the later [supported memory-target follow-up](WINDOWS-ORB-MEMORY-TARGET-2026-09-28.md)
built a distinct unsigned package. No distinct-profile or
low-resource acceptance claim follows from this experiment.

## Verification and limits

- The native test returned `ok: true` with orb/dashboard rendering, three
  process-tree samples, and a nonblank dashboard reopen. The ordinary native
  Windows UI regression passed all 34 checks. `node --check` passed, and the
  new untracked files had no `git diff --no-index --check` whitespace warnings.
- The first immediate-after-ready run, before the five-second settle interval
  was added, measured 174,350,336 orb private bytes and 257,646,592
  dashboard private bytes. Its orb CPU value included more startup work and
  is not the warmed idle baseline.
- The first connected probe attempt found Refresh disabled while the product
  diagnostic was still reading. The corrected test waits for diagnostic
  completion and verifies the refresh's Reading to Observed transition before
  measuring; this was a test synchronization issue, not a product failure.
- A JavaScript close through the global Tauri window API did not close the
  native dashboard in this build; the final probe instead uses the normal
  Windows close message after verifying the window belongs to its own launch.
- The original single ten-second interval and the later three-cycle sample do
  not establish long-term stabilization or exclude slower accumulation.
- No resource threshold, supported Windows version matrix, or physical
  long-duration idle/refresh test has been approved. The earlier baseline has
  no connected adapter; the fixture follow-up uses a local adapter, and the
  joined installed-Codex development sample is short. None includes an
  external model call or Evolution source.
- This does not activate ARE control of the current Codex task or validate an
  installed or signed package. TUI is discontinued and outside this UI scope.

## Open Questions

- What private-memory and CPU budgets should govern orb-only, dashboard-open,
  and dashboard-closed states on supported hardware?
- Does the post-close residual stabilize, grow, or shrink across repeated
  open/close cycles and longer idle periods?
- How do a real local gateway, populated threads, and Evolution observation
  change resource use over a longer idle and refresh interval? The new short
  installed-Codex sample is a starting measurement, not that answer.
