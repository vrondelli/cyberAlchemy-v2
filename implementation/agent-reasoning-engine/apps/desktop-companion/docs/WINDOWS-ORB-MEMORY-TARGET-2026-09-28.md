# Windows orb memory-target follow-up — 2026-09-28

## Boundary

This is a bounded Companion UI construction result, not ARE session activation,
a release, or a low-resource acceptance verdict. TUI is discontinued and was not
changed. The Windows installer was built unsigned but not installed. Tests used
an isolated WebView2 profile and unconfigured live observation sources unless
specified otherwise.

## Implementation

The floating orb requests WebView2's supported `Low` memory-usage target while
idle, on pointer leave, and on window blur; pointer entry/down requests
`Normal` so interaction can resume. The Windows Tauri command accepts only
`low` or `normal`, uses `ICoreWebView2_19::SetMemoryUsageTargetLevel`, and
returns a bounded error for an unsupported runtime or failed dispatch. Calls
are serialized in the orb so a slow earlier request cannot overtake a later
one. On Linux the command is a no-op, leaving the existing WebKit path intact.
This is a resource hint, not a process-memory cap or eviction guarantee. The
API is documented by [Microsoft](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2_19).

The native harness gained an exact low → normal → low command check and rejects
an invalid target. Separate **test-only** browser-flag presets diagnosed
WebView2 cost: on one machine and ten-second isolated orb-only samples, the
earlier build measured 168,808,448 private bytes without a flag,
175,472,640 with a renderer-limit flag, 107,036,672 with GPU disabled, and
108,883,968 with both flags. These are single short samples with different
launches, not comparable production benchmarks. No browser flag was enabled
in the product. [Microsoft cautions](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/webview-features-flags)
against shipping apps that depend on additional browser flags.

## Exact Windows development result

The retained stage is
`C:\Users\vlad_\AppData\Local\Temp\acw-S0mvaK\src-tauri`.
Its post-NSIS `target\release\are-companion.exe` SHA-256 is
`56f0108873f26763e67f8a303916fc391b9c74e95bb727393e342567bafcd081`.
The copied unsigned NSIS package is
`D:\are-companion-low-memory-20260928.exe`, SHA-256
`e9a0f3f0e8de37ba87ccf56bf151e7c1c54e1c82594c65f0025938814515bb63`.
The package was built, not installed or signed; the native UI checks launch
the staged executable, not an installed application.

- Native packaged-feature probe passed 11 checks: bundled Node and product
  doctor, route/context, bounded Reasoning State fixture, observation-client
  module loads, and native SQLite Evolution write/observe/reopen/replay.
- The final post-NSIS executable passed the 35-check native WebView2 journey:
  orb and nonblank dashboard, all seven read-only pages, source postures,
  appearance persistence, source links, keyboard behavior, and reopen.
- Its resource/reopen probe passed 13 checks, including the low/normal/low
  acknowledgements and invalid-target rejection. It sampled seven orb-tree
  processes and 150,294,528 private bytes; eight dashboard-tree processes and
  240,844,800 bytes; and seven post-close processes and 156,696,576 bytes.
  Orb CPU in its ten-second interval was zero at this counter resolution.
- A separate no-debug orb-only sample of the pre-NSIS staged executable
  measured seven processes, 138,723,328 private bytes and 0.046875 CPU
  seconds over ten seconds. The final post-NSIS executable was tested for
  behavior, but this no-debug resource mode was not rerun after NSIS.
- A separate three-cycle run of the final post-NSIS executable passed the same
  13 resource/reopen checks. It began at 151,715,840 orb private bytes. The
  dashboard-open samples were 239,124,480, 233,119,744, and 231,124,992
  bytes; post-close samples were 157,040,640, 154,017,792, and 154,599,424
  bytes. Thus the post-close states were 5,324,800, 2,301,952, and
  2,883,584 bytes above that run's initial orb sample, with no monotonic
  increase across these three short cycles. Each reopen was nonblank.
- The source dashboard/orb unit suite passed 36/36. Linux Rust `cargo check
  --offline` and native Windows `cargo check`/release build passed.

The new orb-only measurements are below the prior one-run 168,808,448-byte
sample, but they vary between launches; they do not establish a repeatable
reduction. The dashboard still adds a WebView2 child, and no numerical budget
has been chosen. A longer idle/open/close experiment and an installed-package
resource check remain required before claiming the Companion is low-resource.
No test here gives ARE control of this desktop task or overcomes the host's
missing exact thread-history APIs.

## Open Questions

- What owner-approved private-memory and CPU ceilings apply to orb-only,
  dashboard-open, and post-close states on each supported Windows version?
- Does the memory target improve repeated and long-duration runs after normal
  pointer use, source refresh, and dashboard close/reopen?
- How does an installed package behave with a configured, populated gateway?
