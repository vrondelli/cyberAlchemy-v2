# Control-center browser validation

Date: 2026-09-05. Route: CA2-ROUTE-VALIDATE. Verdict: FAIL (narrow viewport).
Evidence ceiling: browser layout and explicitly synthetic transport continuity;
not native Tauri, live reasoning, product approval, or performance evidence.

## Candidate and method

Fresh Vite production build of workspace/runtime to
`/tmp/cav2-control-center-validation-20260905`; served only at 127.0.0.1:4199.
Firefox driven using Playwright CLI. Production dist and desktop left unchanged.
Selected source SHA-256 values:

- WorkspaceApp.tsx: `558a4dc807ae6efd527b1b5be1930051ea2b0ef73a4fa1fa9f0c014319835a34`
- control-center/control-center.css: `5a23623de48869b78689321d35a09b00abccd13cf65b075416ee6de836f701b4`
- control-center/layout.ts: `1ea1a3981c35dd6e9345f0bdeab122f790ee1a9002e55c874278b3e9ca68c69c`

These identify selected integration sources, not a complete frozen-product bundle.

## Observations

- PASS: at 1440×1000, chat input bounds x=97, y=863, width=915.4,
  height=73. Desktop screenshot inspected: artifact above chat, decision area
  alongside conversation. Real browser mode correctly reports ARE_CHAT_WEB_MODE.
- PASS: Expand produced dock y=350, height=650; Compact remained usable.
- PASS: exactly one chat input after navigation.
- FAIL: at 390×844, input y=857.63, height=73: below viewport. Screenshot
  confirms bottom navigation covers part of the dock and composer is not visible.
  Document width=390, scrollWidth=390: no horizontal overflow in this observation.
- PASS, FIXTURE ONLY: unsent draft survived Ontology → Essays → Foundation,
  Expand → Compact, and mode Off → On. Input DOM identity remained identical.
  The browser-only fixture observed exactly one chat_connect and one chat_replay.
  No chat_send occurred. Unimplemented principal_evidence call was refused by
  the fixture; no native call or external effect was made.
- Browser console: zero errors, Firefox warning about unsupported longtask
  PerformanceObserver entries. This run provides no long-task budget evidence.

Screenshots: `integration-desktop.png`, `integration-mobile.png`.

## Construction frontier

Next runnable construction: repair scoped mobile dock layout to reserve fixed
navigation space and keep composer accessible while transcript/decisions scroll.
Then repeat desktop and narrow checks, including keyboard access to pending
decisions with a non-effectful fixture. No budgets may change.

Native Tauri integration, live receipt continuity, actual decision interaction,
reading-position retention, Rust/full frontend tests, WDIO smoke, host-qualified
cold sessions and identity-bound differential campaign remain not evaluated.
The failed browser check is not a reason to label any dependent check PASS.

Operational support: agent-owned temporary browser/server used for this review;
no desktop restart, production restoration, publication, or merge performed.
