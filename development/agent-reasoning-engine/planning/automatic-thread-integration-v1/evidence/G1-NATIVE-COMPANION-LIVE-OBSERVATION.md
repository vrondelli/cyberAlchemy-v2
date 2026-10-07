# G1 native Companion reads a live Codex-backed gateway

Status: bounded construction evidence, 2026-09-27. Authority effect: none.
The TUI is discontinued and was not used. The current Codex desktop task was
not read, interrupted, resumed, or handed over.
The Windows recovery blocker recorded below was later resolved for a
disposable test; see [native Windows recovery and Companion restart evidence](G1-NATIVE-WINDOWS-RECOVERY-COMPANION.md).

## Exact orb-split package connected follow-up, 2026-09-27

The latest unsigned Windows development installer,
`dist/ARE_Companion_0.1.0_x64-setup-orb-split-20260927.exe`, SHA-256
`762f14c211b6a6f437373bcb51dbf6dfe0e8b1a6e8ad81f16bd42f695ea30e1c`,
was archive-extracted, not installed. Its staged executable, bundled Node,
and development ARE closure ran the native Windows
[live-gateway runner](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-live-gateway.mjs)
in an isolated WebView2 profile. The host binary was a disposable copy of the
Windows-installed Codex `codex-cli 0.155.0-alpha.16.4`, SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`;
it was not the active WSL desktop-task process.

Four runs returned `are.companion-native-live-gateway-test/v1` with
`status: PASS`: default connected observation, `--same-window-gateway-recovery`,
`--inflight-turn-observation`, and `--connected-resource-sample`. Each observed one disposable gateway thread
and two completed-phase gateway decisions, made zero external model calls, and
reported `current_desktop_task_touched: false` and `authority_effect: none`.
The connected UI showed the live Windows pipe, installed-Codex thread
Reasoning State, linked decisions, independent evidence-source postures, and
the floating orb and seven-panel dashboard. The restart run invalidated stale
epochs within the same WebView2 window and restored one thread and four
decision observations. The in-flight run showed a held `turn-active` thread
and retained turn-start receipt without a premature completed frontier, then
showed the completed frontier after the canary answered its prompt.

The resource run sampled the Companion/WebView2 process tree separately from
the gateway/Codex process tree. Companion private bytes were 156,393,472 with
only the orb, 270,200,832 with the first connected dashboard open, and
230,961,152 after closing it; the second open/close cycle measured
267,534,336 and 204,120,064 bytes. The gateway/Codex tree settled around
67–70 million private bytes during the two dashboard cycles. These are
single-machine, ten-second-interval observations, not a low-resource budget
pass or long-duration leak test; the dashboard-close residue remains visible.

This proves a connected, recoverable read-only Companion prototype for an
isolated installed-Codex-backed gateway. It does not prove installer
install/upgrade/uninstall lifecycle, production pipe access control, resource
budget, exclusive writer handover, or Reasoning State coverage for the current
desktop chat. TUI remains discontinued and outside UI parity scope.

### Open Questions

- Which authenticated host mechanism, if any, can transfer exclusive ingress
  for the exact current desktop task without a duplicate writer?
- What native installer lifecycle and production access-control evidence is
  required before connected observation is enabled outside development mode?

## In-flight Reasoning State extension, 2026-09-27

The [native canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs)
now holds a disposable installed-Codex-backed turn while its hosted user-input
request is pending. Before answering, it verifies the gateway projects exactly
one `turn-active` thread, no completed frontier, and at least one decision in
the same runtime epoch. The [Windows runner](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-live-gateway.mjs)
then opens the extracted packaged Companion against that authenticated local
pipe. The [UI probe](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-ui.mjs)
passed `installed-codex-inflight-thread-observed-without-frontier`, the
thread-to-decision link, and decision rendering. After the canary answered the
prompt, the same run passed the completed-turn frontier and decision checks.

Exact test result: `are.companion-native-live-gateway-test/v1`, `status: PASS`,
one gateway thread, two completed-phase gateway decisions, zero external model
calls, and `current_desktop_task_touched: false`. The source binary was the
installed `codex-cli 0.155.0-alpha.16.4`, SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.
The staged UI was extracted from unsigned
`dist/ARE_Companion_0.1.0_x64-setup-decision-recovery-20260927.exe`, SHA-256
`0928a44c28f7b880dc5fa1cce686c23b3808887e4c292c01aa9ea34103a8b024`.
No installer was run. This proves active-state rendering for one disposable
backend thread, not reasoning visibility for every desktop task, exclusive
writer handover, or activation of the current chat.

## Retained host-protocol receipt projection, 2026-09-27

The Adapters page now separates adapter-declared operations from retained
gateway-owned host-protocol receipts. The bounded aggregate exposes counts for
accepted turn starts, verified turn histories, accepted steers and completed
compaction items. A zero is only absence of a retained receipt; an older
observation source is `unknown`. Counts are not exact-host capability support,
current-desktop-task ownership, or a claim about every historical operation.
The observation does not expose consumer IDs, backend thread IDs, prompts,
paths, or tokens.

The wrapper's focused adapter-observation suite passed 9/9. Its full suite
passed 444/453 with 9 skips and no failures. The Companion Rust bridge passed
offline `cargo check`. A first parallel Windows build encountered a transient
source-copy race with a wrapper test fixture; a serial rerun built the unsigned
`dist/ARE_Companion_0.1.0_x64-setup-retained-host-receipts-20260927.exe`,
SHA-256 `3f3c74129966f6c5f5fe2d716512dcebcabe4f0d05c74b40a24540c25d05811f`,
with 748 staged ARE files and closure digest
`b020b767a6ba705ebbe8928b9ae12c0718f99d58b52ff2046c2838ded415791c`.
Its extracted WebView2 executable passed the in-flight native canary against
the same installed Codex binary: `installed-codex-retained-turn-start-receipt-observed`,
active thread without frontier, thread-to-decision link, and completed-phase
frontier all passed. The test used a fixed loopback provider, made zero
external model calls, and did not touch the current desktop task. No installer
was run. The failed build stage, disposable extracted package, and copied CLI
were removed after validation; the unsigned installer was retained.

## Exact test

The native Windows [live-gateway runner](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/scripts/test-windows-live-gateway.mjs)
held the disposable [Codex canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs)
after a completed turn. It used a private Windows named-pipe observation
socket, a random token, a separate temporary Codex home, and a fixed loopback
Responses provider. It made zero external model calls. The Codex CLI was an
isolated copy of the installed desktop app's exact `codex-cli
0.155.0-alpha.16.4` binary, SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.

The current Companion was built with native Windows Node `26.8.1` and pinned
Rust `1.98.1` MSVC. The unsigned installer is
`dist/ARE_Companion_0.1.0_x64-setup-live-gateway-20260927.exe`, SHA-256
`6a2dcd093201eade2eed68275712b01e6d8fb4cc91380a57affdd63f05ed8c6f`.
The same build's staged executable, not the installer, ran in an isolated
WebView2 profile. Its development ARE closure digest was
`e5247953394103919750b5519f050fe6fd2e80752e71f47c5da89234ee2957be`.

The combined run returned `are.companion-native-live-gateway-test/v1` with
`status: PASS`. The gateway exposed one completed Codex-backed Reasoning
State row with a verified completion frontier and two process-local decisions.
The Companion rendered the floating orb, nonblank dashboard and all seven
destinations. Adapters showed the live Windows pipe; Threads showed that
completed frontier; its thread-specific link opened matching Decisions and
restored focus on return. Decisions rendered the evaluations. Product health,
Evolution unconfigured states, six independent Evidence rows, appearance
preferences, keyboard navigation, contrast and reduced-motion checks also
passed. Temporary test stages and the copied CLI were removed after the run.

## Separate Windows restart result

The native Windows canary passed without client recovery. Its
`--gateway-recovery` mode stopped at
`windows-client.recovery-native-windows-secret-store-unavailable` before
dispatch. This is a real fail-closed portability gap, not a failed gateway
observation or a permission to store the resume token in plain text. The
earlier Linux/WSL file-backed gateway-restart proof remains separate; it
does not establish Windows client recovery.

## Claim ceiling

This proves a real installed-Codex-binary gateway observation crossing the
native Windows Companion bridge and WebView2 renderer in a disposable local
session. It does not prove an installed application, Windows client or gateway
restart recovery, durable decision history, interrupted-turn reconciliation,
exclusive control of this desktop chat, security hardening, signing, release,
or deployment. Gateway decision records remain process-local; a zero count
after restart must not be presented as absence of past decisions.

## Open Questions

- What native Windows same-user secret store and durable-write protocol should
  protect client resume tokens and accepted-turn receipts across restart?
- How will the exact desktop host relinquish, attest and recover sole-writer
  control of this chat, including approval and user-input ingress?
- Which installed-package, Linux renderer, accessibility and resource-budget
  tests must pass before product approval or read-path enablement?
