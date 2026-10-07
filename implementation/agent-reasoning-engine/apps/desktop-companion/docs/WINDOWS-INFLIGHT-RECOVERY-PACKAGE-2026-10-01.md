# Windows in-flight recovery guard package — 2026-10-01

Status: unsigned, installer-extracted development candidate; not installed or
released. Authority effect: none. TUI is discontinued and outside this path.

## Exact package

- Installer: `D:\are-win-focus-YDTVzk\ARE_Companion_inflight_guard_20261001_x64-setup.exe`;
  SHA-256 `73e419f242720b9f7b233f9258429ac5fdfd2e7143c9d61a2074f97244bbac99`.
  Retained build stage: `D:\are-win-focus-YDTVzk\acw-9UqguE`.
- The builder reported 813 ARE closure files, distribution digest
  `e9899439a36fc0826e0f6ffc6ffa42c5735aa7ff5cc1a2075dad70ce1783ba71`,
  Core digest `1f228ab3c6644a12e6c56affa79aafaefb3793c367c8d4e89b850ddb7dd8113c`,
  bundled Node 26.8.1, and a bundled candidate native orb.
- Independent 7-Zip archive integrity passed. Extraction, not installation,
  produced `D:\are-win-focus-YDTVzk\extract-inflight-pqcxrE`. Its
  `are-companion.exe` SHA-256 is
  `3a2a1bb07595e5339f3d7ac7b77429885a1289371cb9e7d9bd47e9a636df193c`.
  The extracted `windows-client-host.mjs` matches checkout source SHA-256
  `768d898a1788275467d0bf9b6a71a68fe9dceb7bda1a762087c4afe5198716fa`.
  No TUI path component appeared in the extracted ARE tree.

## Change and validation

- A recovered hosted thread ID and a persisted accepted-turn receipt are not
  proof of a completed Reasoning State frontier. Before native `thread/resume`,
  the hosted client now requires an exact owned-gateway first-turn-ready proof
  for a zero-turn thread, or a terminal-verified proof matching the latest
  accepted turn. An absent, unsettled, or mismatched proof returns HTTP 409
  `windows-client.reasoning-recovery-unverified`.
- Hosted-client source tests passed 81/81 on Linux and 80 passed with one skip
  on native Windows. Gateway source tests passed 149/149. Dashboard source tests
  passed 50/50. The Windows test-script syntax and `git diff --check` passed.
- The exact extracted installer, adjacent Node/ARE resources, and pinned
  disposable `codex-cli 0.155.0-alpha.16.4` passed the isolated guarded Plan
  canary with one unanswered question. After killing only the manager-owned
  gateway, the supervisor stopped its owned processes. A fresh manager using
  the **same private state** retained the thread, refused unsafe resume,
  exposed no fabricated completed Companion frontier, and made zero replay
  model requests. One fixed-loopback provider request and zero external model
  calls occurred. The native orb and seven-panel dashboard rendered on both
  launches.
- The completed-turn regression also passed on these exact bytes. After the
  gateway crash and same-state relaunch, explicit rejoin returned the same
  hosted thread, one completed response, and the same Companion frontier;
  there were zero replay requests beyond the original two fixed-loopback
  provider requests. A separate guarded no-turn package smoke passed native
  orb, dashboard, guard, Windows sandbox probe, and supervised stop with zero
  model calls. A final process query found zero package-owned Node or
  Companion processes.

## Claim boundary

This proves a bounded fail-closed recovery boundary and a completed-turn rejoin
for fixed-loopback package canaries. It does **not** reconstruct or finish an
unanswered Plan turn, attest arbitrary providers or hosted effects, activate
ARE for this Codex desktop task, install the package, or approve release.
The native Windows sandbox preflight passed; the hosted command sandbox was
not backend-attested. The Companion remains a read-only observer of these
backend threads.

## Open Questions

- Define a user-visible recovery choice and exact host-history reconciliation
  for an interrupted turn; refusing resume is safe but not a completed turn.
- Verify current desktop-task writer handover and live ingress/approval control
  before claiming that this chat is ARE-controlled.
- The [source-matched Linux package](LINUX-INFLIGHT-RECOVERY-PACKAGE-2026-10-01.md)
  passes extracted WSLg/X11 UI checks, but still needs a joined Linux
  interrupted-turn recovery fixture. Normal installed-product, provider/tool
  breadth, accessibility, and sustained resource-budget validation remain open.
