# Decisions progressive disclosure — current development candidate

Status: candidate implementation and bounded test evidence, 2026-10-02.
Authority effect: none. Parent: [whole UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## Result and evidence

The Decisions card now leads with evaluation type, outcome, observed time and
backend-thread scope. It explicitly says that this read source does not observe
authorization or execution. Bounded reason codes and opaque evidence identifiers
sit behind a native keyboard-accessible disclosure rather than occupying the
first view. This does not invent a user question or an effect outcome.

- `node --test ui/dashboard.test.mjs`: 58/58 passed.
- The isolated Chromium seven-panel journey passed, including collapsed-first
  Decisions detail, on-demand reason reveal, no 340 px document overflow, and
  no uncaught browser errors.
- `node --check` passed for the native WebView2 test script and dashboard source.
- The staged Windows bundled-feature probe passed all 13 checks at ARE
  `0.10.0-rc.1`.
- The fresh staged Windows WebView2 `--adapter-live` journey passed. Its exact
  test-owned process showed a non-blank dashboard, observed one gateway-backed
  decision, kept the technical reason hidden at first, opened it with Enter,
  and still passed Threads, adapter-loss, Evolution, Evidence, Appearance,
  keyboard-navigation and relaunch checks.

## Exact uninstalled Windows candidate

Unsigned NSIS installer: `D:\ARE_Companion_Decisions_detail_20261002_x64-setup.exe`,
33,827,854 bytes, SHA-256
`73d6864232142b8319f6edbb3fea24b2aa27437fef1f044c966c21ec0d806657`.
The retained stage is `D:\acw\acw-sJFIZz`; its `ui/app.js` and `ui/app.css`
matched source at build time. The staged executable is 9,562,624 bytes,
SHA-256 `d94bd313c3bbb8a3cea0667b4692980af2895cdab0f94557417ed0a051c2f8a6`.
The Windows builder reported 839 development-closure files and digest
`2522f602f1e9fa2f90eece4b5f7d691f4fccd9e9a14cf7ab7683600321c4b114`;
its selected Core closure digest was
`47043fe74edfd8ee4be3e729e2db01578484a3c38295c1db4e7af7e563611185`.

The matching uninstalled Ubuntu 26.04 x64 candidate is
[`are-companion_0.1.0_amd64-decisions-detail-20261002.deb`](../dist/are-companion_0.1.0_amd64-decisions-detail-20261002.deb),
45,850,224 bytes, SHA-256
`fcc5ea544aaa6a394cff03848153f8af4849b1b8e5cae00896f52cbdb3fa067b`.
It was built offline in the existing network-disabled builder image. Extraction
without installation showed a byte-identical native executable (SHA-256
`4eaeb6b3cfa938507958e60a747f6c137043062c8755b9134e70512defe60ba6`)
and bundled Node 26.8.1 / ARE `doctor --json` PASS at `0.10.0-rc.1`. The
extracted dashboard-only process survived a bounded eight-second WSLg/X11
container smoke. EGL acceleration warnings remained; no Decisions interaction
or pixel check was performed in WebKitGTK. The extracted scratch directory was
removed after validation; the `.deb` remains.

## Claim ceiling and open questions

The installer was not executed or installed. The UI journey used a synthetic
local gateway, not this Codex desktop task or a production adapter. It does not
prove an installed-package lifecycle, real host-task control, assistive-technology
traversal, normal physical-pointer use, or authorization/effect observation.
Linux has a matching package and process/display startup evidence, but not a
rendered Decisions interaction check for this revision. The Computer Use helper
remains unavailable in this WSL-backed task (`sandboxCwd is not a local file
URI`); the native journey used the test-owned executable and WebView2 CDP
without selecting the harness's PowerShell window-management paths.

The later [Linux native Decisions follow-up](LINUX-DECISIONS-DETAIL-2026-10-03.md)
closes the rendered-interaction gap for an extracted, uninstalled UI-refresh
package at 340 × 740. It uses one isolated gateway fixture and a test-only
programmatic disclosure click. Physical keyboard, screen-reader, normal desktop,
installed-package, and exact host-task checks remain open.

Open questions: which plain-language reason text can the source own without
guessing from opaque codes, and whether an independently observed authorization
or effect read should later appear as a separate source rather than be inferred
from an evaluation record.
