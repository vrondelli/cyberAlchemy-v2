# ARE Companion connected Windows gateway recovery check

Status: bounded development evidence, 2026-09-28. The TUI is discontinued and
outside this scope. The installed package was not run, and this Codex desktop
task was not handed over to ARE.

## Exact test surface

- Companion: the current-source staged executable at
  `D:\are-companion-build-NqJb8b\acw-2B4Pn5\src-tauri\target\release\are-companion.exe`
  (SHA-256 `c2140a5503b5027a019e2e5205ed9e4b9ca42c3a8adcf5b1934b62fa729bf06b`).
  Its unsigned installer is recorded in
  [the package evidence](WINDOWS-APPEARANCE-RACE-PACKAGE-2026-09-28.md).
- Host: a disposable copy of the installed Windows
  `codex-cli 0.155.0-alpha.16.4` binary, SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.
  The canary used a private temporary Codex home and fixed loopback Responses
  fixture, with zero external model calls.
- Source: [native host canary](../../../packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs),
  [WebView2 runner](../scripts/test-windows-live-gateway.mjs), and
  [UI assertions](../scripts/test-windows-ui.mjs).

## Results and correction

- `--inflight-turn-observation` passed: the active backend thread appeared in
  Reasoning State without a completed frontier.
- `--same-window-gateway-recovery` passed: the same dashboard window replaced
  stale gateway epochs after restart and retained the bounded observation.
- The initial hosted-pending test timed out. The canary intentionally discarded
  the native turn-start response but incorrectly waited for the second turn's
  completion notification. The gateway correctly withholds that notification
  until durable acceptance, so the test was waiting for a prohibited event.
- The canary now reads exact completed host history before restart, checks that
  no unaccepted completion leaked to its client, and then checks marker-based
  recovery. Its private fixture disables plugin startup sync; this removes
  unrelated plugin catalog work without changing the user's Codex settings.
- Direct `--unknown-acceptance-marker-probe` and hosted
  `--hosted-pending-marker-probe` both passed: one exact host-history marker,
  one durable confirmed recovery, no provider redispatch, and a
  `recovery-terminal` Reasoning State phase with the earlier frontier retained.
- `test-windows-live-gateway.mjs --hosted-pending-recovery` passed against the
  staged WebView2 Companion. The restored Threads page displayed one confirmed
  dispatch recovery and clearly labelled the host-completed turn unassessed:
  no semantic completion, Evolution signal, new frontier, or successor was
  inferred from history alone.
- `--auto-compaction-lost-response-recovery` also passed. `node --check` passed
  for both edited scripts; focused gateway and host-turn reconciliation tests
  passed 109/109.

These are script and assertion corrections against the already-staged binary;
the installer was not rebuilt or installed in this check. All connected
canaries were disposable and did not touch this desktop task.

## Claim ceiling

This proves the staged Companion can render the current gateway's bounded
connected observations and recover an exact hosted pending intent in the
tested isolated Windows session. It does not prove an installed-package
lifecycle, power-loss durability, arbitrary unknown-turn recovery, universal
effect interception, or exclusive ARE control of this chat. The TUI remains
discontinued.

## Open Questions

- What installed-package lifecycle and native access-control checks are needed
  before enabling this observation path outside a disposable canary?
- How will the actual desktop task establish one exclusive ARE writer with
  complete history, approval, recovery, and rollback boundaries?
