# Windows native-orb development package — 2026-10-01

Status: unsigned, extracted, uninstalled development evidence. Authority effect:
none. The discontinued TUI is not a product, fallback, or validation target.

## Exact candidate and checks

- Installer: `D:\are-win-focus-YDTVzk\ARE_Companion_native_queued_20261001_x64-setup.exe`;
  SHA-256 `c878ea36a8218e71c6320b0177af8a657cb8e63f90732595977c7216d50a135f`.
  The builder reported distribution closure
  `a8666a7cec09497291408f2dc9165149186f48346cade293bf26d4d56575c0f9`
  and Core closure
  `0792dd33892cfbda4733287ad0c0f05e3a73c065d2162675c992c9b1fe8e0897`.
- A 7-Zip NSIS integrity test returned `Everything is Ok` for 824 entries.
  Extraction to `D:\are-win-focus-YDTVzk\native-payload-Pxa4nx` returned the
  same integrity result. No `cyberalchemy-tui`, `terminal-ui`, or TUI resource
  path occurred in the extracted payload.
- The **extracted** Node/ARE feature probe passed 13 checks, including product
  health, direct routing/context, bounded plan context, backend thread and
  decision observation clients, and Evolution SQLite reopen/replay. The active
  thread projection remains development-gateway backend threads only.
- The extracted executable passed the native WebView2 connected-gateway UI
  journey: all seven panels, 40-thread pagination and fresh-snapshot recovery,
  per-thread reasoning-state observation, thread-specific decision navigation,
  source-specific diagnostics, Evolution candidate posture, keyboard focus,
  appearance persistence, and gateway-loss downgrade. The test fixture is not
  this desktop task or proof of a live ARE-controlled session.
- The extracted Slint orb passed bundled launch/focus/reopen, duplicate-window
  prevention, and owned-dashboard exit after normal close and abrupt orb loss.
  A ten-second idle sample measured 3,264,512 private bytes and zero additional
  CPU seconds in one run; that sample is not a sustained resource-budget verdict.
- A further extracted-orb run passed initial skin synchronization, a live
  cobalt-to-ember change, corner placement, placement restoration after dashboard
  reopen, and reset to center. A standalone test of the same extracted orb
  confirmed pointer and Enter activation and physical drag from `(260,260)` to
  `(332,308)`; it saved `D:\are-win-focus-YDTVzk\native-orb-current-cobalt.png`.

The source tests passed 49 dashboard checks and 107 rendered Chromium checks
before this build. The queued thread-page action is covered by those source
tests; the native journey covers pagination and fresh-snapshot recovery, not a
forced delayed-click queue race.

## Exact native-orb resource cycles

The new `experiments/native-orb/test-windows-native-resources.ps1` sampled the
extracted native orb and only its owned descendants. It used isolated
preferences and WebView2 data, disabled test-only remote debugging, tracked
observed child PIDs with creation times across dashboard close, and checked
for survivors after orb shutdown. A one-cycle preflight and a separate
three-cycle run both passed. Each state was sampled over ten seconds after a
short settle period; no live gateway or Evolution root was configured.
After replacing synchronous window-close messages with bounded asynchronous
posts, the current probe passed another one-cycle run with no survivors.

| Three-cycle state | Processes | Summed private bytes | Summed working set |
| --- | ---: | ---: | ---: |
| Orb idle | 1 | 3,239,936 | 20,107,264 |
| Dashboard open, cycle 1 | 8 | 197,668,864 | 419,905,536 |
| Dashboard closed, cycle 1 | 1 | 3,252,224 | 20,332,544 |
| Dashboard open, cycle 2 | 8 | 206,987,264 | 419,500,032 |
| Dashboard closed, cycle 2 | 1 | 3,080,192 | 20,258,816 |
| Dashboard open, cycle 3 | 8 | 202,084,352 | 411,639,808 |
| Dashboard closed, cycle 3 | 1 | 3,080,192 | 20,271,104 |

Each open tree comprised the native orb, one dashboard, and six WebView2
processes. No tracked descendant survived final orb close. The idle CPU delta
was zero in each ten-second sample on this machine; short, quantized samples
do not establish long-run zero CPU. Summed working set can count shared pages
and is not unique RAM use. This is a low-resource-orb feasibility reading,
not an owner-set numerical budget pass, installed-app measurement, leak proof,
or cross-OS performance verdict.

## Current-task claim ceiling

The separate read-only `scripts/check-g1-target-binding.mjs` probe matched the
exact caller task, session label, plan target, installed host binary, and active
goal. Two bounded, transcript-free stored-history passes agreed on 397 turns,
but did not establish desktop account binding, live quiescence, writer release,
or activation. The [activated-session control contract](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md)
therefore remains pending. The [official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes stored-thread read and resume, but neither operation by itself proves
an exclusive handover from this running desktop client. No task was resumed,
mutated, or intercepted by this check.

## Open Questions

- Can the installed desktop host provide a supported, exclusive writer handover
  and complete message, approval, and event coverage for this exact task?
- What numerical orb/dashboard resource budget and longer-run sampling protocol
  will the product owner accept across Windows and Linux?
- When will installed-app lifecycle, rollback, and normal-desktop behavior be
  tested separately from this extracted development candidate?
