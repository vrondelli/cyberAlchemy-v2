# Windows guarded Plan-input package — 2026-09-29

Status: bounded development evidence; authority effect: none. The floating
Companion and hosted browser client are the UI surfaces. TUI is discontinued.

## Exact candidate

- Unsigned NSIS installer: `D:\are-companion-guarded-plan-input-20260929.exe`
  (29,583,528 bytes; SHA-256
  `feef75cb779e94b8fd60beb6263edec8dd74f5d6875ab77b4e95c63fc253a1fa`).
- Retained build stage: `D:\acw-I7fqFJ`. The stage's app executable was copied
  beside its `are/` and `node/` resource trees **for isolated testing**, not
  installed. Its SHA-256 is
  `db4d3a9f98e23315dcc0e6a8f42cfc9e4edb92fe8eeb1b6f9d982bae1409e9f4`.
- Build reported closure digest
  `f9769d7ffb885f67ba5b58612809d46938fc3e63c2959b2c107f42933572ea44`,
  core closure digest
  `427222e5d0d45509d16046678cb3389e3a376d2c0a0d581dbcb11258fd33dd1d`,
  807 files, and bundled Node 26.8.1.

## Validation

- [`test-windows-features.mjs`](../scripts/test-windows-features.mjs) passed
  11 staged-resource checks on native Windows, including ARE product health,
  routing/context, Reasoning State, and Evolution SQLite reopen.
- The staged ARE/Codex guarded-input canary passed one actual Plan-mode
  `request_user_input` turn using a loopback model fixture and a pinned Codex
  binary. It observed an authenticated answer, exactly the allowed
  `request_user_input` model-facing tool, and zero external model calls.
- [`test-managed-session-windows.mjs`](../scripts/test-managed-session-windows.mjs)
  passed with `--package-root ... --guarded-plan-input`. The runtime, Node,
  and Companion executable came from adjacent staged package resources. It
  observed the floating orb, a rendered seven-panel dashboard, a connected
  gateway/backend/client, `plan-with-guarded-user-input` hosted state, and
  supervised cleanup. No model turn was run in this UI smoke; the separate
  guarded-input canary covers that path.
- [`test-windows-ui.mjs`](../scripts/test-windows-ui.mjs) passed the native
  WebView2 `--adapter-live` journey: nonblank dashboard, seven destinations,
  adapter-source distinctions, thread Reasoning State, decision linkage,
  Evolution empty state, evidence, appearance, keyboard focus, contrast,
  reduced motion, and preference relaunch.
- A separate `--evolution-verified-root` journey passed against an isolated
  one-cycle/one-commit ledger created under the retained build stage. The
  dashboard displayed the verified cycle and event progression while still
  labeling definition admission as candidate/disabled and avoiding a claim
  that a worker is running now.
- The hosted Chromium suite passed 12/12 with a process-local Playwright
  library path. The new rendered assertion verifies that the Plan-mode note
  says it applies to the hosted session and does not claim current desktop-task
  control. It also reloads a pending Plan question and submits both a listed
  choice and an explicit Other answer through the browser form to the bounded
  user-input broker, then verifies the prompts clear. The first attempt failed
  only because WSL's Chromium could not
  locate shared libraries already present in Playwright's user cache.
- Current-source Companion dashboard tests passed 47/47.
- A no-debug, default-browser-preset ten-second orb-idle sample passed its
  process-tree check: seven processes (Companion plus WebView2 children),
  131,211,264 private bytes, 311,341,056 working-set bytes, and 0.078125
  aggregate CPU seconds during the interval. One short sample is not a
  production memory/CPU budget or leak verdict.

Retained screenshots: `D:\acw-I7fqFJ\overview.png`, `adapters.png`,
`threads.png`, `evolution.png`, and `evolution-verified.png`. The Overview screenshot is intentionally
scrolled to its adapter link by the smoke script, so its heading is partly
above the captured viewport. The Evolution screenshot uses an unconfigured
fixture; it is not evidence of a live evolution cycle.

## Claim ceiling and Open Questions

The NSIS installer was built but not extracted, installed, signed, or run as
an installer. The adjacent-stage smoke proves the staged runtime closure, not
the installed Windows lifecycle, shortcut/registration behavior, upgrades,
rollback, or a fresh-machine WebView2 bootstrap. This Codex desktop task is
not established as ARE-controlled. The Companion is read-only; observed
backend threads are not automatically verified host tasks. Full native host
callback coverage and deployment admission remain separate gates in the
[integration work-pack](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/INTEGRATION-WORK-PACK.md).

Open questions: verify extracted installer bytes and an isolated installation
journey; confirm all required host callback shapes on a supported native
host; decide whether a release candidate may admit the guarded Plan-input
profile after those checks. None of these are established by this package.
